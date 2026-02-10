import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { useMailStore } from '../../store';
import './ComposeForm.css';

export default function ComposeForm({ onClose, onSend }) {
    const { composeDraft, setComposeDraft, isLoading } = useMailStore();
    const [showCcBcc, setShowCcBcc] = useState(false);
    const toInputRef = useRef(null);
    const subjectInputRef = useRef(null);
    const bodyTextareaRef = useRef(null);

    // Auto-focus first empty field
    useEffect(() => {
        if (!composeDraft.to?.length) {
            toInputRef.current?.focus();
        } else if (!composeDraft.subject) {
            subjectInputRef.current?.focus();
        } else {
            bodyTextareaRef.current?.focus();
        }
    }, []);

    // Animate field filling (for AI)
    useEffect(() => {
        if (composeDraft.to?.length) {
            toInputRef.current?.classList.add('ai-filled');
            setTimeout(() => toInputRef.current?.classList.remove('ai-filled'), 500);
        }
    }, [composeDraft.to]);

    useEffect(() => {
        if (composeDraft.subject) {
            subjectInputRef.current?.classList.add('ai-filled');
            setTimeout(() => subjectInputRef.current?.classList.remove('ai-filled'), 500);
        }
    }, [composeDraft.subject]);

    useEffect(() => {
        if (composeDraft.body) {
            bodyTextareaRef.current?.classList.add('ai-filled');
            setTimeout(() => bodyTextareaRef.current?.classList.remove('ai-filled'), 500);
        }
    }, [composeDraft.body]);

    const handleToChange = (e) => {
        const value = e.target.value;
        // Split by comma or space and filter empty
        const emails = value.split(/[,\s]+/).filter(Boolean);
        setComposeDraft({ to: emails });
    };

    const handleCcChange = (e) => {
        const value = e.target.value;
        const emails = value.split(/[,\s]+/).filter(Boolean);
        setComposeDraft({ cc: emails });
    };

    const handleBccChange = (e) => {
        const value = e.target.value;
        const emails = value.split(/[,\s]+/).filter(Boolean);
        setComposeDraft({ bcc: emails });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!composeDraft.to?.length || !composeDraft.subject) return;
        onSend();
    };

    return (
        <div className="compose-form">
            <div className="compose-header">
                <h2>New Message</h2>
                <div className="header-actions">
                    <button
                        type="button"
                        className="cc-bcc-toggle"
                        onClick={() => setShowCcBcc(!showCcBcc)}
                    >
                        {showCcBcc ? 'Hide CC/BCC' : 'CC/BCC'}
                    </button>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="compose-field">
                    <input
                        ref={toInputRef}
                        type="text"
                        placeholder="Recipients"
                        value={composeDraft.to?.join(', ') || ''}
                        onChange={handleToChange}
                    />
                </div>

                {showCcBcc && (
                    <>
                        <div className="compose-field">
                            <input
                                type="text"
                                placeholder="CC"
                                value={composeDraft.cc?.join(', ') || ''}
                                onChange={handleCcChange}
                            />
                        </div>
                        <div className="compose-field">
                            <input
                                type="text"
                                placeholder="BCC"
                                value={composeDraft.bcc?.join(', ') || ''}
                                onChange={handleBccChange}
                            />
                        </div>
                    </>
                )}

                <div className="compose-field">
                    <input
                        ref={subjectInputRef}
                        type="text"
                        placeholder="Subject"
                        value={composeDraft.subject || ''}
                        onChange={(e) => setComposeDraft({ subject: e.target.value })}
                    />
                </div>

                <div className="compose-body">
                    <textarea
                        ref={bodyTextareaRef}
                        placeholder="Write your message..."
                        value={composeDraft.body || ''}
                        onChange={(e) => setComposeDraft({ body: e.target.value })}
                    />
                </div>

                <div className="compose-footer">
                    <div className="compose-actions-left">
                        <button type="button" className="attach-button">
                            <Paperclip size={18} />
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="send-button"
                        disabled={isLoading || !composeDraft.to?.length || !composeDraft.subject}
                    >
                        <Send size={18} />
                        <span>{isLoading ? 'Sending...' : 'Send'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
