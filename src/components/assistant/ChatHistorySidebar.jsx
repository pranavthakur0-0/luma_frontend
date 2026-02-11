import React, { useEffect } from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { useAssistantStore } from '../../store';
import './ChatHistorySidebar.css';

export default function ChatHistorySidebar({ isOpen, onClose }) {
    const {
        conversations,
        currentConversationId,
        loadConversations,
        loadConversation,
        startNewConversation,
        deleteConversation
    } = useAssistantStore();

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen, loadConversations]);

    const handleNewChat = () => {
        startNewConversation();
        onClose();
    };

    const handleSelectChat = (id) => {
        loadConversation(id);
        onClose();
    };

    const handleDeleteChat = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            deleteConversation(id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-history-sidebar">
            <div className="history-header">
                <h3>History</h3>
                <button className="close-history-btn" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            <div className="conversations-list">
                {conversations.length === 0 ? (
                    <div className="empty-history">
                        <p>No past conversations</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <div
                            key={conv._id}
                            className={`conversation-item ${currentConversationId === conv._id ? 'active' : ''}`}
                            onClick={() => handleSelectChat(conv._id)}
                        >
                            <MessageSquare size={16} className="conv-icon" />
                            <div className="conv-info">
                                <span className="conv-title" title={conv.title}>
                                    {conv.title || 'Untitled Conversation'}
                                </span>
                                <span className="conv-date">
                                    {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                className="delete-conv-btn"
                                onClick={(e) => handleDeleteChat(e, conv._id)}
                                title="Delete conversation"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
