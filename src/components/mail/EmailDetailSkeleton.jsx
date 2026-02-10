import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './EmailDetail.css';

export default function EmailDetailSkeleton({ onBack }) {
    return (
        <div className="email-detail">
            <div className="email-detail-header">
                <button className="back-button" onClick={onBack} disabled>
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
            </div>

            <div className="email-detail-content">
                {/* Subject Skeleton */}
                <div className="skeleton-line long" style={{ height: '32px', marginBottom: '24px' }}></div>

                {/* Meta Skeleton */}
                <div className="email-meta">
                    <div className="skeleton-avatar" style={{ width: '40px', height: '40px' }}></div>
                    <div className="email-sender-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="skeleton-line short" style={{ width: '150px' }}></div>
                        <div className="skeleton-line short" style={{ width: '100px', height: '10px' }}></div>
                    </div>
                    <div className="skeleton-date"></div>
                </div>

                {/* Body Skeleton */}
                <div className="email-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
                    <div className="skeleton-line" style={{ width: '100%' }}></div>
                    <div className="skeleton-line" style={{ width: '95%' }}></div>
                    <div className="skeleton-line" style={{ width: '90%' }}></div>
                    <div className="skeleton-line" style={{ width: '80%' }}></div>
                    <div className="skeleton-line" style={{ width: '85%' }}></div>
                </div>
            </div>
        </div>
    );
}
