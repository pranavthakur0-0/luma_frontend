import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Reply, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import './EmailThread.css';

export default function EmailThread({ thread, onBack, onReply, onDelete }) {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [thread]);

    if (!thread || thread.length === 0) return null;

    const subject = thread[0].subject || '(No Subject)';

    return (
        <div className="email-thread">
            <div className="email-thread-header">
                <button className="back-button" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>

                <div className="email-thread-actions">
                    <button className="action-button danger" onClick={() => onDelete(thread[0].id)}>
                        <Trash2 size={18} />
                    </button>
                    <button className="action-button">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="email-thread-content">
                <h1 className="email-subject">{subject}</h1>

                <div className="thread-messages">
                    {thread.map((email, index) => {
                        const senderName = email.from_address?.name || email.from_address?.email || 'Unknown';
                        const senderEmail = email.from_address?.email || '';
                        const senderInitial = senderName.charAt(0).toUpperCase();
                        const isLastObj = index === thread.length - 1;

                        return (
                            <div key={email.id} className={`thread-message ${isLastObj ? 'expanded' : ''}`}>
                                <div className="message-header">
                                    <div className="message-sender-avatar">
                                        {senderInitial}
                                    </div>
                                    <div className="message-info">
                                        <div className="message-sender-name">{senderName}</div>
                                        <div className="message-date">{formatDate(email.date)}</div>
                                    </div>
                                </div>

                                <div className="message-body">
                                    {email.body_html ? (
                                        <div
                                            className="email-body-html"
                                            dangerouslySetInnerHTML={{ __html: email.body_html }}
                                        />
                                    ) : (
                                        <div className="email-body-text">
                                            {email.body_text || email.snippet}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="thread-reply-bar">
                <button className="reply-button-large" onClick={onReply}>
                    <Reply size={18} />
                    <span>Reply to thread</span>
                </button>
            </div>
        </div>
    );
}
