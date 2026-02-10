import React from 'react';
import { Search, X } from 'lucide-react';
import './EmailList.css';

export default function SearchBar({ searchQuery, setSearchQuery, onSearch, onClear }) {

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch();
    };

    return (
        <form className="email-search-bar" onSubmit={handleSubmit}>
            <Search size={16} className="search-icon" />
            <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
            />
            {searchQuery && (
                <button
                    type="button"
                    className="search-clear-btn"
                    onClick={onClear}
                    aria-label="Clear search"
                >
                    <X size={14} />
                </button>
            )}
        </form>
    );
}
