import { create } from 'zustand';
import { mailApi } from '../services/api';

export const useMailStore = create((set, get) => ({
    // Email lists
    inbox: [],
    sent: [],
    searchResults: [],

    // Search state (persisted across navigation)
    currentSearchQuery: '',
    isSearchActive: false,
    searchResultsCount: 0,

    // Current state
    currentEmail: null,
    currentThread: null, // Holds the list of messages in a thread
    currentView: 'inbox', // 'inbox' | 'sent' | 'compose' | 'email'
    lastListView: 'inbox', // Tracks the last list view for back navigation

    // Compose state (AI can control this)
    composeDraft: {
        to: [],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        replyToId: null,
    },

    // Filters (AI can control this)
    filters: {
        fromAddress: null,
        afterDate: null,
        beforeDate: null,
        isUnread: null,
        query: null,
    },

    // Loading states
    isLoading: false,
    error: null,

    // Actions
    setCurrentView: (view) => set((state) => {
        const newState = { currentView: view };
        if (view === 'inbox' || view === 'sent') {
            newState.lastListView = view;
        }
        return newState;
    }),

    setCurrentEmail: (email) => set({ currentEmail: email }),

    // Compose actions (used by AI)
    setComposeDraft: (draft) => set((state) => ({
        composeDraft: { ...state.composeDraft, ...draft }
    })),

    clearComposeDraft: () => set({
        composeDraft: { to: [], cc: [], bcc: [], subject: '', body: '', replyToId: null }
    }),

    // Filter actions (used by AI)
    setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
    })),

    clearFilters: () => set({
        filters: { fromAddress: null, afterDate: null, beforeDate: null, isUnread: null, query: null }
    }),

    // Silently prepend new emails from SSE (no loading state)
    prependEmails: (newEmails) => set((state) => {
        const existingIds = new Set(state.inbox.map(e => e.id));
        const uniqueNew = newEmails.filter(e => !existingIds.has(e.id));
        if (uniqueNew.length === 0) return state;
        return {
            inbox: [...uniqueNew, ...state.inbox],
            totalEmails: state.totalEmails + uniqueNew.length,
        };
    }),

    // Pagination
    nextPageToken: null,
    pageTokens: [], // Stack of page tokens for back navigation
    currentPage: 1,
    totalEmails: 0,
    totalSentEmails: 0,

    // API actions
    fetchEmailCount: async (label = 'INBOX', force = false) => {
        const { totalEmails, totalSentEmails } = get();
        const currentCount = label === 'SENT' ? totalSentEmails : totalEmails;
        if (currentCount > 0 && !force) return;

        try {
            const response = await mailApi.getCount(label);
            if (label === 'SENT') {
                set({ totalSentEmails: response.data.count });
            } else {
                set({ totalEmails: response.data.count });
            }
        } catch (error) {
            console.error('Failed to fetch email count:', error);
        }
    },

    fetchInbox: async (filters = {}, pageToken = null) => {
        set({ isLoading: true, error: null });
        try {
            const params = { max_results: 50 };
            if (pageToken) params.page_token = pageToken;

            if (filters.fromAddress) params.from_address = filters.fromAddress;
            if (filters.afterDate) params.after_date = filters.afterDate;
            if (filters.beforeDate) params.before_date = filters.beforeDate;
            if (filters.isUnread !== null) params.is_unread = filters.isUnread;
            if (filters.query) params.query = filters.query;

            const response = await mailApi.getInbox(params);

            // Always REPLACE, never append
            set({
                inbox: response.data.emails,
                nextPageToken: response.data.nextPageToken,
                isLoading: false
            });
            return response.data.emails;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Navigate to next page
    goToNextPage: async () => {
        const { nextPageToken, filters, pageTokens } = get();
        if (!nextPageToken) return;

        // Save current token for back navigation
        const newTokens = [...pageTokens, nextPageToken];
        set({ pageTokens: newTokens, currentPage: get().currentPage + 1 });

        await get().fetchInbox(filters, nextPageToken);
    },

    // Navigate to previous page
    goToPrevPage: async () => {
        const { pageTokens, filters, currentPage } = get();
        if (currentPage <= 1) return;

        const newPage = currentPage - 1;
        const newTokens = pageTokens.slice(0, -1);

        // Use the previous token, or null for page 1
        const prevToken = newPage > 1 ? newTokens[newPage - 2] : null;

        set({ pageTokens: newTokens, currentPage: newPage });
        await get().fetchInbox(filters, prevToken);
    },

    loadMore: async () => {
        await get().goToNextPage();
    },

    deleteEmail: async (id) => {
        // Optimistic update: remove from UI immediately
        set((state) => ({
            inbox: state.inbox.filter(e => e.id !== id),
            sent: state.sent.filter(e => e.id !== id),
            currentEmail: state.currentEmail?.id === id ? null : state.currentEmail,
        }));

        try {
            await mailApi.delete(id);
        } catch (error) {
            // Revert or show error if failed (simplified for now)
            console.error("Failed to delete email", error);
            set({ error: "Failed to delete email" });
        }
    },

    searchEmails: async (query) => {
        set({ isLoading: true, error: null, isSearchActive: true, currentSearchQuery: query });
        try {
            const response = await mailApi.searchEmails(query);
            set({
                searchResults: response.data.emails,
                inbox: response.data.emails,
                searchResultsCount: response.data.emails.length,
                isLoading: false
            });
            return response.data.emails;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    clearSearch: () => set({
        currentSearchQuery: '',
        isSearchActive: false,
        searchResultsCount: 0,
    }),

    fetchSent: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await mailApi.getSent({ max_results: 50 });
            set({ sent: response.data.emails, isLoading: false });
            return response.data.emails;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    fetchEmail: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await mailApi.getEmail(id);
            set({
                currentEmail: response.data,
                currentThread: null, // Clear thread to avoid stale data
                isLoading: false
            });
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    fetchThread: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await mailApi.getThread(id);
            // Sort by date (oldest first usually for threads, or newest?)
            // Gmail web usually shows oldest first if it's a conversation view, or newest?
            // Let's just store as returned (backend should sort or returned in order)
            // But let's assume we want them sorted by date.
            // Messages typically come in order from Gmail API?
            // Actually Gmail returns them in chronological order.
            const messages = response.data;
            set({
                currentThread: messages,
                currentEmail: messages[messages.length - 1], // Set latest email as current too? Maybe not needed but good for reference
                isLoading: false
            });
            return messages;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    sendEmail: async () => {
        const { composeDraft } = get();
        set({ isLoading: true, error: null });
        try {
            const response = await mailApi.sendEmail({
                to: composeDraft.to,
                cc: composeDraft.cc,
                bcc: composeDraft.bcc,
                subject: composeDraft.subject,
                body: composeDraft.body,
                reply_to_id: composeDraft.replyToId,
            });
            // Clear draft after successful send
            set({
                composeDraft: { to: [], cc: [], bcc: [], subject: '', body: '', replyToId: null },
                isLoading: false
            });
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    markAsRead: async (id) => {
        // Optimistic update
        set((state) => ({
            inbox: state.inbox.map(e => e.id === id ? { ...e, is_read: true } : e),
            sent: state.sent.map(e => e.id === id ? { ...e, is_read: true } : e),
            searchResults: state.searchResults.map(e => e.id === id ? { ...e, is_read: true } : e),
            currentEmail: state.currentEmail?.id === id ? { ...state.currentEmail, is_read: true } : state.currentEmail
        }));

        try {
            await mailApi.markAsRead(id);
        } catch (error) {
            console.error('Failed to mark as read:', error);
            // Revert on error (optional)
            set((state) => ({
                inbox: state.inbox.map(e => e.id === id ? { ...e, is_read: false } : e),
                sent: state.sent.map(e => e.id === id ? { ...e, is_read: false } : e),
                searchResults: state.searchResults.map(e => e.id === id ? { ...e, is_read: false } : e),
                currentEmail: state.currentEmail?.id === id ? { ...state.currentEmail, is_read: false } : state.currentEmail
            }));
        }
    },

    markAsUnread: async (id) => {
        // Optimistic update
        set((state) => ({
            inbox: state.inbox.map(e => e.id === id ? { ...e, is_read: false } : e),
            sent: state.sent.map(e => e.id === id ? { ...e, is_read: false } : e),
            searchResults: state.searchResults.map(e => e.id === id ? { ...e, is_read: false } : e),
            currentEmail: state.currentEmail?.id === id ? { ...state.currentEmail, is_read: false } : state.currentEmail
        }));

        try {
            await mailApi.markAsUnread(id);
        } catch (error) {
            console.error('Failed to mark as unread:', error);
            // Revert on error (optional)
            set((state) => ({
                inbox: state.inbox.map(e => e.id === id ? { ...e, is_read: true } : e),
                sent: state.sent.map(e => e.id === id ? { ...e, is_read: true } : e),
                searchResults: state.searchResults.map(e => e.id === id ? { ...e, is_read: true } : e),
                currentEmail: state.currentEmail?.id === id ? { ...state.currentEmail, is_read: true } : state.currentEmail
            }));
        }
    },
}));

