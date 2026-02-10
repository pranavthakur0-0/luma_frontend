/**
 * EmailItem - Minimal Vercel-inspired design
 */
import React from 'react';
import { Trash2, MailOpen } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/dateUtils';
import './EmailItem.css';

export default function EmailItem({ email, isSelected, onClick, onDelete, onMarkRequest }) {
    const senderName = email.from_address?.name || email.from_address?.email || 'Unknown';
    const senderInitial = senderName.charAt(0).toUpperCase();

    return (
        <div
            className={`email-item ${isSelected ? 'selected' : ''} ${!email.is_read ? 'unread' : ''}`}
            onClick={onClick}
        >
            <div className="email-item-avatar">
                {senderInitial}
            </div>

            <div className="email-item-content">
                <div className="email-item-row">
                    <span className={`email-item-sender ${!email.is_read ? 'unread' : ''}`}>
                        {senderName}
                    </span>
                    <span className={`email-item-date ${!email.is_read ? 'unread' : ''}`}>
                        {formatDistanceToNow(email.date)}
                    </span>
                </div>

                <div className="email-item-row">
                    <span className={`email-item-subject ${!email.is_read ? 'unread' : ''}`}>
                        {email.subject || '(No Subject)'}
                    </span>
                </div>

                <p className="email-item-preview">{email.snippet}</p>
            </div>

            <div className="email-item-actions">
                {!email.is_read && (
                    <button
                        className="email-item-action mark-read"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkRequest?.(email.id);
                        }}
                        aria-label="Mark as read"
                        title="Mark as read"
                    >
                        <MailOpen size={16} />
                    </button>
                )}
                <button
                    className="email-item-action delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(email.id);
                    }}
                    aria-label="Delete"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
