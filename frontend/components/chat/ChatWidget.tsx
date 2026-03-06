'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import styles from './ChatWidget.module.css';
import { useChatStore } from '@/store/useChatStore';

const ChatWidget = () => {
    const {
        messages,
        isOpen,
        isLoading,
        toggleChat,
        closeChat,
        sendMessage,
    } = useChatStore();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        setInput('');
        await sendMessage(trimmed);
    };

    return (
        <>
            {/* 채팅 버블 버튼 */}
            {!isOpen && (
                <button
                    className={styles.chatBubble}
                    onClick={toggleChat}
                    aria-label="채팅 열기"
                    id="chat-bubble-button"
                >
                    <MessageCircle size={24} />
                </button>
            )}

            {/* 채팅 창 */}
            {isOpen && (
                <div className={styles.chatWindow} id="chat-window">
                    {/* 헤더 */}
                    <div className={styles.chatHeader}>
                        <div className={styles.chatHeaderInfo}>
                            <div className={styles.chatHeaderAvatar}>☕</div>
                            <div className={styles.chatHeaderText}>
                                <h3>NCafe AI 어시스턴트</h3>
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
                            <div className={styles.welcomeIcon}>☕</div>
                            <h4>안녕하세요!</h4>
                            <p>
                                NCafe AI 어시스턴트입니다.<br />
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
                                        <div className={styles.assistantAvatar}>☕</div>
                                    )}
                                    <div className={styles.messageBubble}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {/* 로딩 인디케이터 */}
                            {isLoading && (
                                <div className={styles.typingIndicator}>
                                    <div className={styles.typingDot} />
                                    <div className={styles.typingDot} />
                                    <div className={styles.typingDot} />
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}

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
            )}
        </>
    );
};

export default ChatWidget;
