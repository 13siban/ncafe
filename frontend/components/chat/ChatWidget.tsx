'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, ShoppingCart, Eye, Check } from 'lucide-react';
import styles from './ChatWidget.module.css';
import { useChatStore } from '@/store/useChatStore';
import { useCartStore, CartOption } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { OptionGroup } from '@/types/menuOption';

const FAQ_QUESTIONS = [
    '오늘의 추천 메뉴',
    '인기 메뉴',
    '내 주문 상태',
    '주문 대기 현황',
];

interface MenuCardData {
    slug: string;
    name: string;
    price: number;
}

// 옵션 선택 패널 데이터
interface OptionPanelData {
    menuId: number;
    menuName: string;
    menuEngName: string;
    imageSrc: string;
    basePrice: number;
    quantity: number;
    optionGroups: OptionGroup[];
}

const ChatWidget = () => {
    const {
        messages,
        isOpen,
        isLoading,
        toggleChat,
        closeChat,
        sendMessage,
        pendingAction,
        clearPendingAction,
        clearMessages,
    } = useChatStore();

    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const checkAuth = useAuthStore((state) => state.checkAuth);
    const items = useCartStore((state) => state.items);

    const [input, setInput] = useState('');
    const [menuCards, setMenuCards] = useState<MenuCardData[]>([]);
    const [optionPanel, setOptionPanel] = useState<OptionPanelData | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 새 메시지가 추가되면 스크롤을 맨 아래로
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, menuCards, optionPanel]);

    // 채팅창이 열리면 세션 확인 + 입력창에 포커스
    useEffect(() => {
        if (isOpen) {
            checkAuth();
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, checkAuth]);

    const addItem = useCartStore((state) => state.addItem);

    // 옵션 패널 열기: slug로 메뉴+옵션 정보를 fetch해서 패널 표시
    const openOptionPanel = async (slug: string, quantity: number = 1) => {
        try {
            const res = await fetch(`/api/menus/slug/${slug}`);
            if (!res.ok) return;
            const text = await res.text();
            if (!text) return;
            const menu = JSON.parse(text);

            const optRes = await fetch(`/api/menus/${menu.id}/options`);
            let optionGroups: OptionGroup[] = [];
            if (optRes.ok) {
                const optData = await optRes.json();
                optionGroups = optData.optionGroups || [];
            }

            // 필수 옵션은 첫 번째 항목 자동 선택
            const defaults: Record<number, number[]> = {};
            optionGroups.forEach((g) => {
                if (g.isRequired && g.items?.length > 0) {
                    defaults[g.id] = [g.items[0].id];
                }
            });
            setSelectedOptions(defaults);

            setOptionPanel({
                menuId: menu.id,
                menuName: menu.korName,
                menuEngName: menu.engName,
                imageSrc: menu.images && menu.images.length > 0 ? menu.images[0].srcUrl : '',
                basePrice: menu.price,
                quantity,
                optionGroups,
            });
        } catch (e) {
            console.error('Failed to load menu options', e);
        }
    };

    // 옵션 변경 핸들러
    const handleOptionChange = (group: OptionGroup, itemId: number, checked: boolean) => {
        setSelectedOptions((prev) => {
            const copy = { ...prev };
            if (group.type === 'radio') {
                copy[group.id] = [itemId];
            } else {
                const current = copy[group.id] || [];
                copy[group.id] = checked
                    ? [...current, itemId]
                    : current.filter((id) => id !== itemId);
            }
            return copy;
        });
    };

    // 옵션 패널에서 "담기" 클릭
    const handleAddFromPanel = () => {
        if (!optionPanel) return;

        const cartOptions: CartOption[] = [];
        let optionTotalPrice = 0;

        optionPanel.optionGroups.forEach((group) => {
            const selectedIds = selectedOptions[group.id] || [];
            group.items?.forEach((item) => {
                if (selectedIds.includes(item.id)) {
                    cartOptions.push({
                        optionGroupId: group.id,
                        optionGroupName: group.name,
                        optionItemId: item.id,
                        optionItemName: item.name,
                        priceDelta: item.priceDelta || 0,
                    });
                    optionTotalPrice += item.priceDelta || 0;
                }
            });
        });

        const cartId = `${optionPanel.menuId}-${cartOptions.map(o => `${o.optionGroupId}:${o.optionItemId}`).sort().join('-')}`;
        addItem({
            cartId,
            menuId: optionPanel.menuId,
            menuName: optionPanel.menuName,
            menuEngName: optionPanel.menuEngName,
            imageSrc: optionPanel.imageSrc,
            basePrice: optionPanel.basePrice,
            quantity: optionPanel.quantity,
            selectedOptions: cartOptions,
            optionTotalPrice,
            subtotal: (optionPanel.basePrice + optionTotalPrice) * optionPanel.quantity,
        });

        setOptionPanel(null);
        setSelectedOptions({});
    };

    // 옵션총가격 계산
    const getOptionTotalPrice = () => {
        if (!optionPanel) return 0;
        let total = 0;
        optionPanel.optionGroups.forEach((group) => {
            const ids = selectedOptions[group.id] || [];
            group.items?.forEach((item) => {
                if (ids.includes(item.id)) total += item.priceDelta || 0;
            });
        });
        return total;
    };

    // 에이전트 요청에 따른 액션 처리
    useEffect(() => {
        if (!pendingAction) return;

        if (pendingAction.type === 'navigate') {
            router.push(pendingAction.path);
            clearPendingAction();
        } else if (pendingAction.type === 'add_to_cart') {
            // 바로 담기 대신 옵션 패널 열기
            openOptionPanel(pendingAction.slug, pendingAction.quantity).finally(clearPendingAction);
        } else if (pendingAction.type === 'show_menu_cards') {
            setMenuCards(pendingAction.menus);
            clearPendingAction();
        } else if (pendingAction.type === 'reorder') {
            const reorder = async () => {
                for (const item of pendingAction.items) {
                    try {
                        const res = await fetch(`/api/menus/${item.menuId}`);
                        if (res.ok) {
                            const menu = await res.json();
                            const slug = (menu.engName || '').toLowerCase().replace(/\s+/g, '-');
                            if (slug) await openOptionPanel(slug, item.quantity);
                        }
                    } catch (e) {
                        console.error('Reorder item failed', e);
                    }
                }
            };
            reorder().finally(clearPendingAction);
        }
    }, [pendingAction, router, clearPendingAction, addItem]);

    // userId와 cartSummary를 포함하여 메시지 전송
    const getUserId = () => user?.id || null;
    const getCartSummary = () => {
        if (items.length === 0) return null;
        return items.map(i => `${i.menuName} ×${i.quantity}`).join(', ');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        setInput('');
        setMenuCards([]);
        await sendMessage(trimmed, getUserId(), getCartSummary());
    };

    const handleFAQClick = async (question: string) => {
        if (isLoading) return;
        setMenuCards([]);
        await sendMessage(question, getUserId(), getCartSummary());
    };

    const handleMenuCardClick = (slug: string) => {
        router.push(`/menus/${slug}`);
    };

    const handleMenuCardAddToCart = async (slug: string) => {
        await openOptionPanel(slug);
    };

    return (
        <>
            {/* 채팅 버블 버튼 */}
            <button
                className={`${styles.chatBubble} ${isOpen ? styles.chatBubbleOpen : ''}`}
                onClick={toggleChat}
                aria-label={isOpen ? "채팅 닫기" : "채팅 열기"}
                id="chat-bubble-button"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>

            {/* 채팅 창 */}
            {isOpen && (
                <div className={styles.chatWindow} id="chat-window">
                    <div className={styles.chatWindowInner}>
                    {/* 헤더 */}
                    <div className={styles.chatHeader}>
                        <div className={styles.chatHeaderInfo}>
                            <div className={styles.chatHeaderAvatar}>✨</div>
                            <div className={styles.chatHeaderText}>
                                <h3>mymyy AI 어시스턴트</h3>
                                <p>무엇이든 물어보세요!</p>
                            </div>
                        </div>
                        <div className={styles.chatHeaderActions}>
                            <button
                                className={styles.newChatButton}
                                onClick={() => { clearMessages(); setMenuCards([]); setOptionPanel(null); }}
                                title="새 대화"
                            >
                                새 대화
                            </button>
                            <button
                                className={styles.closeButton}
                                onClick={closeChat}
                                aria-label="채팅 닫기"
                                id="chat-close-button"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* 메시지 영역 */}
                    {messages.length === 0 ? (
                        <div className={styles.welcomeMessage}>
                            <div className={styles.welcomeIcon}>✨</div>
                            <h4>안녕하세요!</h4>
                            <p>
                                mymyy AI 어시스턴트입니다.<br />
                                메뉴, 가격, 영업시간 등<br />
                                궁금한 것을 물어보세요!
                            </p>
                        </div>
                    ) : (
                        <div className={styles.chatMessages}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`${styles.message} ${msg.role === 'user'
                                        ? styles.messageUser
                                        : styles.messageAssistant
                                        }`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className={styles.assistantAvatar}>✨</div>
                                    )}
                                    <div className={styles.messageBubble}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {/* 메뉴 카드 UI */}
                            {menuCards.length > 0 && (
                                <div className={styles.menuCardsContainer}>
                                    {menuCards.map((menu, idx) => (
                                        <div key={idx} className={styles.menuCard}>
                                            <div className={styles.menuCardInfo}>
                                                <span className={styles.menuCardName}>{menu.name}</span>
                                                <span className={styles.menuCardPrice}>
                                                    {new Intl.NumberFormat('ko-KR').format(menu.price)}원
                                                </span>
                                            </div>
                                            <div className={styles.menuCardActions}>
                                                <button
                                                    className={styles.menuCardBtn}
                                                    onClick={() => handleMenuCardClick(menu.slug)}
                                                    title="바로보기"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    className={`${styles.menuCardBtn} ${styles.menuCardBtnPrimary}`}
                                                    onClick={() => handleMenuCardAddToCart(menu.slug)}
                                                    title="담기"
                                                >
                                                    <ShoppingCart size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 옵션 선택 패널 */}
                            {optionPanel && (
                                <div className={styles.optionPanel}>
                                    <div className={styles.optionPanelHeader}>
                                        <span className={styles.optionPanelTitle}>{optionPanel.menuName}</span>
                                        <button
                                            className={styles.optionPanelClose}
                                            onClick={() => { setOptionPanel(null); setSelectedOptions({}); }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {optionPanel.optionGroups.length > 0 ? (
                                        <div className={styles.optionGroups}>
                                            {optionPanel.optionGroups.map((group) => (
                                                <div key={group.id} className={styles.optionGroup}>
                                                    <div className={styles.optionGroupLabel}>
                                                        {group.name}
                                                        {group.isRequired && <span className={styles.optionRequired}>필수</span>}
                                                    </div>
                                                    <div className={styles.optionItems}>
                                                        {group.items?.map((item) => {
                                                            const isSelected = (selectedOptions[group.id] || []).includes(item.id);
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
                                                                    onClick={() => handleOptionChange(group, item.id, !isSelected)}
                                                                >
                                                                    <span>{item.name}</span>
                                                                    {item.priceDelta > 0 && (
                                                                        <span className={styles.optionDelta}>
                                                                            +{new Intl.NumberFormat('ko-KR').format(item.priceDelta)}
                                                                        </span>
                                                                    )}
                                                                    {isSelected && <Check size={12} className={styles.optionCheck} />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.optionNoOption}>선택 가능한 옵션이 없습니다.</p>
                                    )}

                                    <button className={styles.optionAddBtn} onClick={handleAddFromPanel}>
                                        <ShoppingCart size={14} />
                                        {new Intl.NumberFormat('ko-KR').format(
                                            (optionPanel.basePrice + getOptionTotalPrice()) * optionPanel.quantity
                                        )}원 담기
                                    </button>
                                </div>
                            )}

                            {/* 로딩 인디케이터 */}
                            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                                <div className={styles.typingIndicator}>
                                    <div className={styles.typingDot} />
                                    <div className={styles.typingDot} />
                                    <div className={styles.typingDot} />
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* FAQ 추천 질문 */}
                    <div className={styles.faqContainer}>
                        {FAQ_QUESTIONS.map((q, idx) => (
                            <button
                                key={idx}
                                className={styles.faqItem}
                                onClick={() => handleFAQClick(q)}
                                disabled={isLoading}
                                type="button"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* 입력 영역 */}
                    <form className={styles.chatInput} onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="메시지를 입력하세요..."
                            disabled={isLoading}
                            id="chat-message-input"
                        />
                        <button
                            type="submit"
                            className={styles.sendButton}
                            disabled={isLoading || !input.trim()}
                            aria-label="메시지 전송"
                            id="chat-send-button"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
