'use client';

import React, { useRef, useEffect } from 'react';
import { MessageCircle, Send, X, ShoppingCart, Eye, Check } from 'lucide-react';
import styles from './ChatWidget.module.css';
import { useChatLogic } from './useChatLogic';

const FAQ_QUESTIONS = [
    '오늘의 추천 메뉴',
    '인기 메뉴',
    '내 주문 상태',
    '주문 대기 현황',
];

const ChatWidget = () => {
    const {
        messages, isOpen, isLoading, input, menuCards, optionPanel, selectedOptions,
        toggleChat, closeChat, setInput,
        handleSubmit, handleFAQClick, handleMenuCardClick, handleMenuCardAddToCart,
        handleOptionChange, handleAddFromPanel, handleAddFavoriteFromPanel,
        getOptionTotalPrice, closeOptionPanel, resetChat, checkAuth,
    } = useChatLogic();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, menuCards, optionPanel]);

    useEffect(() => {
        if (isOpen) {
            checkAuth();
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, checkAuth]);

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
                                onClick={resetChat}
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
                                            onClick={closeOptionPanel}
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

                                    {optionPanel.purpose === 'cart' ? (
                                        <button className={styles.optionAddBtn} onClick={handleAddFromPanel}>
                                            <ShoppingCart size={14} />
                                            {new Intl.NumberFormat('ko-KR').format(
                                                (optionPanel.basePrice + getOptionTotalPrice()) * optionPanel.quantity
                                            )}원 장바구니 담기
                                        </button>
                                    ) : (
                                        <button className={styles.optionAddBtn} onClick={handleAddFavoriteFromPanel} style={{ backgroundColor: '#2dd4bf' }}>
                                            즐겨찾기 추가
                                        </button>
                                    )}
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
