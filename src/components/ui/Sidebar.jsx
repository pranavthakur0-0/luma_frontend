/**
 * Sidebar - Vercel-inspired minimal design
 */
import React from 'react';
import { Inbox, Send, Edit, LogOut, Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

export default function Sidebar({ currentView, onNavigate, onLogout, user }) {
    const menuItems = [
        { id: 'inbox', icon: Inbox, label: 'Inbox' },
        { id: 'sent', icon: Send, label: 'Sent' },
        { id: 'compose', icon: Edit, label: 'Compose' },
    ];

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <Mail size={20} />
                    </div>
                    <span className="logo-text">Luma</span>
                </div>
                <ThemeToggle />
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                {user && (
                    <div className="user-info">
                        {user.picture ? (
                            <img src={user.picture} alt={user.name} className="user-avatar" />
                        ) : (
                            <div className="user-avatar-placeholder">
                                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="user-details">
                            <span className="user-name">{user.name || 'User'}</span>
                            <span className="user-email">{user.email}</span>
                        </div>
                    </div>
                )}
                <button className="logout-btn" onClick={onLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
