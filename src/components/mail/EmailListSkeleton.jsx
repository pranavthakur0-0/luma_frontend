import React from 'react';
import './EmailList.css';

export default function EmailListSkeleton() {
    return (
        <div className="email-list-skeleton">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="email-item-skeleton">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-content">
                        <div className="skeleton-line short"></div>
                        <div className="skeleton-line long"></div>
                    </div>
                    <div className="skeleton-date"></div>
                </div>
            ))}
        </div>
    );
}
