import React from 'react';
import { ArrowLeft, Reply, Forward, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import './EmailDetail.css';

export default function EmailDetail({ email, onBack, onReply }) {
    if (!email) return null;

    const senderName = email.from_address?.name || email.from_address?.email || 'Unknown';
    const senderEmail = email.from_address?.email || '';
    const senderInitial = senderName.charAt(0).toUpperCase();

    return (
        <div className="email-detail">
            <div className="email-detail-header">
                <button className="back-button" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>

                <div className="email-detail-actions">
                    <button className="action-button" onClick={onReply}>
                        <Reply size={18} />
                        <span>Reply</span>
                    </button>
                    <button className="action-button">
                        <Forward size={18} />
                        <span>Forward</span>
                    </button>
                    <button className="action-button danger">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="email-detail-content">
                <h1 className="email-subject">{email.subject || '(No Subject)'}</h1>

                <div className="email-meta">
                    <div className="email-sender-avatar">
                        {senderInitial}
                    </div>
                    <div className="email-sender-info">
                        <div className="email-sender-name">{senderName}</div>
                        <div className="email-sender-email">&lt;{senderEmail}&gt;</div>
                    </div>
                    <div className="email-date">
                        {formatDate(email.date)}
                    </div>
                </div>

                <div className="email-meta-details">
                    <div className="meta-row">
                        <span className="meta-label">To:</span>
                        <span className="meta-value">
                            {email.to_addresses?.map(addr => addr.name || addr.email).join(', ') || 'me'}
                        </span>
                    </div>
                    {email.cc_addresses?.length > 0 && (
                        <div className="meta-row">
                            <span className="meta-label">Cc:</span>
                            <span className="meta-value">
                                {email.cc_addresses.map(addr => addr.name || addr.email).join(', ')}
                            </span>
                        </div>
                    )}
                    {email.bcc_addresses?.length > 0 && (
                        <div className="meta-row">
                            <span className="meta-label">Bcc:</span>
                            <span className="meta-value">
                                {email.bcc_addresses.map(addr => addr.name || addr.email).join(', ')}
                            </span>
                        </div>
                    )}
                    <div className="meta-row">
                        <span className="meta-label">Date:</span>
                        <span className="meta-value">
                            {new Date(email.date).toLocaleString(undefined, {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>

                <div className="email-body">
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
        </div>
    );
}
