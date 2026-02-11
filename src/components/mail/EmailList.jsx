import React, { useState, useEffect } from 'react';
import { Inbox, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMailStore } from '../../store/mailStore';
import EmailItem from './EmailItem';
import SearchBar from './SearchBar';
import EmailListSkeleton from './EmailListSkeleton';
import './EmailList.css';

const EMAILS_PER_PAGE = 50;

export default function EmailList({
    emails,
    title = 'Inbox',
    isLoading,
    onEmailClick,
    onRefresh,
    selectedEmailId,
    emptyMessage = 'No emails to display',
    onDelete,
}) {
    const {
        totalEmails,
        totalSentEmails,
        fetchEmailCount,
        currentPage,
        goToNextPage,
        goToPrevPage,
        nextPageToken,
        searchEmails,
        // Global search state (persisted across navigation)
        currentSearchQuery,
        isSearchActive,
        searchResultsCount,
        currentListTotal, // Total matches for current view
        clearSearch,
        markAsRead, // Destructure new action
    } = useMailStore();

    // Local input state (for typing, before submit)
    const [inputValue, setInputValue] = useState(currentSearchQuery || '');

    // Sync input with global state when navigating back
    useEffect(() => {
        setInputValue(currentSearchQuery || '');
    }, [currentSearchQuery]);

    // Determine display count: prefer the specific list total (which handles filters)
    // Fallback to total/search counts only if currentListTotal is missing
    const displayCount = currentListTotal;

    // Fetch total count only on mount or title change (uses cache)
    useEffect(() => {
        const label = title === 'Sent' ? 'SENT' : 'INBOX';
        fetchEmailCount(label, false);
    }, [title, fetchEmailCount]);

    const handleRefresh = async () => {
        // Context-aware refresh logic
        if (isSearchActive && currentSearchQuery) {
            // Refresh search results
            await searchEmails(currentSearchQuery);
        } else {
            // Refresh inbox/sent
            const label = title === 'Sent' ? 'SENT' : 'INBOX';
            handleClearSearch(); // Ensure search is cleared if not active
            await fetchEmailCount(label, true);
            onRefresh();
        }
    };

    const handleSearch = async () => {
        if (!inputValue.trim()) {
            handleClearSearch();
            onRefresh();
            return;
        }
        await searchEmails(inputValue.trim());
    };

    const handleClearSearch = () => {
        setInputValue('');
        if (clearSearch) {
            clearSearch();
        }
    };

    const handleMarkAsRead = (emailId) => {
        markAsRead(emailId);
    };

    const totalPages = Math.ceil(displayCount / EMAILS_PER_PAGE);
    const startIndex = (currentPage - 1) * EMAILS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * EMAILS_PER_PAGE, displayCount);

    return (
        <div className="email-list">
            {/* Header */}
            <div className="email-list-header">
                <h1 className="email-list-title">{title}</h1>

                <SearchBar
                    searchQuery={inputValue}
                    setSearchQuery={setInputValue}
                    onSearch={handleSearch}
                    onClear={() => {
                        handleClearSearch();
                        onRefresh();
                    }}
                />

                {/* Actions removed from here */}
            </div>

            {/* Email Count & Pagination Info */}
            <div className="email-list-info">
                <span className="email-range">
                    {isLoading ? 'Loading...' : (
                        displayCount > 0
                            ? `${startIndex}-${Math.min(endIndex, emails.length)} of ${displayCount.toLocaleString()}${isSearchActive ? ' results' : ''}`
                            : 'No emails'
                    )}
                </span>

                <div className="pagination">
                    <button
                        className="icon-btn"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        aria-label="Refresh"
                        style={{ marginRight: '8px' }}
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1 || isLoading}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={goToNextPage}
                        disabled={!nextPageToken || isLoading || displayCount === 0}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Email List Content */}
            <div className="email-list-content">
                {isLoading ? (
                    <EmailListSkeleton />
                ) : emails.length === 0 ? (
                    <div className="email-list-empty">
                        <Inbox size={40} strokeWidth={1} />
                        <p>{isSearchActive ? 'No emails match your search' : emptyMessage}</p>
                    </div>
                ) : (
                    <div className="email-items">
                        {emails.map((email) => (
                            <EmailItem
                                key={email.id}
                                email={email}
                                isSelected={email.id === selectedEmailId}
                                onClick={() => onEmailClick(email)}
                                onDelete={onDelete}
                                onMarkRequest={handleMarkAsRead}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
