'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import styles from './ChatWidget.module.css';
import { useChatStore } from '@/store/useChatStore';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';

const FAQ_QUESTIONS = [
    '영업시간',
    '오늘의 추천 메뉴',
    '주문 방법',
];

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
    } = useChatStore();

    const router = useRouter();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 새 메시지가 추가되면 스크롤을 맨 아래로
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // 채팅창이 열리면 입력창에 포커스
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const addItem = useCartStore((state) => state.addItem);

    // 에이전트 요청에 따른 페이지 이동 및 장바구니 담기 처리
    useEffect(() => {
        if (!pendingAction) return;

        if (pendingAction.type === 'navigate') {
            router.push(pendingAction.path);
            clearPendingAction();
        } else if (pendingAction.type === 'add_to_cart') {
            const addCartAndClear = async () => {
                try {
                    const res = await fetch(`/api/menus/slug/${pendingAction.slug}`);
                    if (res.ok) {
                        const text = await res.text();
                        if (!text) {
                            console.warn(`메뉴 데이터를 찾을 수 없습니다: ${pendingAction.slug}`);
                            return;
                        }
                        const menu = JSON.parse(text);
                        
                        // 기본 옵션 조회를 위해 옵션 API 호출
                        const optRes = await fetch(`/api/menus/${menu.id}/options`);
                        let cartOptions: any[] = [];
                        let optionTotalPrice = 0;
                        if (optRes.ok) {
                            const optData = await optRes.json();
                            optData.optionGroups?.forEach((group: any) => {
                                if (group.isRequired && group.items?.length > 0) {
                                    // 기본적으로 첫번째 항목 선택
                                    const item = group.items[0];
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
                        }

                        const cartId = `${menu.id}-${cartOptions.map(o => `${o.optionGroupId}:${o.optionItemId}`).sort().join('-')}`;
                        addItem({
                            cartId,
                            menuId: menu.id,
                            menuName: menu.korName,
                            menuEngName: menu.engName,
                            imageSrc: menu.images && menu.images.length > 0 ? menu.images[0].srcUrl : '',
                            basePrice: menu.price,
                            quantity: pendingAction.quantity,
                            selectedOptions: cartOptions,
                            optionTotalPrice,
                            subtotal: (menu.price + optionTotalPrice) * pendingAction.quantity
                        });
                    }
                } catch (e) {
                    console.error('Failed to add to cart automatically', e);
                } finally {
                    clearPendingAction();
                }
            };
            addCartAndClear();
        }
    }, [pendingAction, router, clearPendingAction, addItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        setInput('');
        await sendMessage(trimmed);
    };

    const handleFAQClick = async (question: string) => {
        if (isLoading) return;
        await sendMessage(question);
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
                        <button
                            className={styles.closeButton}
                            onClick={closeChat}
                            aria-label="채팅 닫기"
                            id="chat-close-button"
                        >
                            <X size={16} />
                        </button>
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

                            {/* 로딩 인디케이터 (메시지 목록의 마지막이 어시스턴트가 아닐 때만 표시) */}
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
