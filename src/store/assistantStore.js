import { create } from 'zustand';
import { assistantApi } from '../services/api';
import { useMailStore } from './mailStore';

export const useAssistantStore = create((set, get) => ({
    // Chat state
    messages: [],
    conversations: [],
    currentConversationId: null,
    isProcessing: false,
    isPanelOpen: true,
    panelWidth: 380, // Default width

    // Pending confirmation
    pendingAction: null,

    // Actions
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

    // Conversation Management
    loadConversations: async () => {
        try {
            const res = await assistantApi.getConversations();
            set({ conversations: res.data });
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    },

    loadConversation: async (id) => {
        try {
            set({ isProcessing: true });
            const res = await assistantApi.getConversation(id);
            set({
                messages: res.data.messages,
                currentConversationId: id,
                isProcessing: false
            });
        } catch (error) {
            console.error('Failed to load conversation:', error);
            set({ isProcessing: false });
        }
    },

    startNewConversation: () => {
        set({
            messages: [],
            currentConversationId: null
        });
    },

    deleteConversation: async (id) => {
        try {
            await assistantApi.deleteConversation(id);
            set((state) => ({
                conversations: state.conversations.filter(c => c._id !== id),
                messages: state.currentConversationId === id ? [] : state.messages,
                currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
            }));
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    },

    setPanelWidth: (width) => set({ panelWidth: width }),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, { ...message, id: message.id || Date.now() + Math.random() }]
    })),

    clearMessages: () => set({ messages: [] }),

    setPendingAction: (action) => set({ pendingAction: action }),

    clearPendingAction: () => set({ pendingAction: null }),

    // Update a message by ID (for streaming)
    updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(m =>
            m.id === id ? { ...m, ...updates } : m
        )
    })),

    // Process user message with streaming AI response
    sendMessage: async (message) => {
        const mailStore = useMailStore.getState();

        // Add user message with explicit unique ID
        const userMessageId = Date.now();
        get().addMessage({ role: 'user', content: message, id: userMessageId });
        set({ isProcessing: true });

        // Create placeholder for AI response with distinct ID
        const aiMessageId = userMessageId + 1;
        get().addMessage({ role: 'assistant', content: '', id: aiMessageId });

        try {
            // Build context for AI
            let visibleEmails = [];
            if (mailStore.isSearchActive) {
                visibleEmails = mailStore.searchResults;
            } else if (mailStore.currentView === 'sent') {
                visibleEmails = mailStore.sent;
            } else {
                visibleEmails = mailStore.inbox;
            }

            const context = {
                current_view: mailStore.currentView,
                is_searching: mailStore.isSearchActive,
                search_query: mailStore.currentSearchQuery,
                stats: {
                    inbox_count: mailStore.totalEmails,
                    sent_count: mailStore.totalSentEmails,
                },
                visible_emails: visibleEmails.slice(0, 5).map(e => ({
                    id: e.id,
                    from: e.from_address?.email || e.from_address?.name,
                    subject: e.subject,
                    snippet: e.snippet,
                    date: e.date,
                    is_unread: !e.is_read
                })),
                open_email: mailStore.currentEmail ? {
                    id: mailStore.currentEmail.id,
                    from: mailStore.currentEmail.from_address?.email,
                    to: mailStore.currentEmail.to_address,
                    subject: mailStore.currentEmail.subject,
                    body: mailStore.currentEmail.body_text || mailStore.currentEmail.snippet,
                    date: mailStore.currentEmail.date
                } : null,
                compose_draft: mailStore.composeDraft,
                inbox_filter: mailStore.filters,
            };

            const history = get().messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content,
            }));

            // Call streaming API
            const response = await assistantApi.chatStream(message, context, history, get().currentConversationId);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let accumulatedContent = '';
            let toolCalls = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.slice(6)); // Remove 'data: '

                        if (data.type === 'text') {
                            accumulatedContent += data.content;
                            get().updateMessage(aiMessageId, { content: accumulatedContent });
                        } else if (data.type === 'tool_calls') {
                            toolCalls = data.tool_calls;
                        } else if (data.type === 'meta') {
                            // Update conversation ID if newly created
                            if (data.conversationId && data.conversationId !== get().currentConversationId) {
                                set({ currentConversationId: data.conversationId });
                                get().loadConversations(); // Refresh list to show new title/convo
                            }
                        } else if (data.type === 'error') {
                            get().updateMessage(aiMessageId, {
                                content: `Error: ${data.error}`,
                                type: 'error'
                            });
                        }
                    } catch (e) {
                        console.error('Failed to parse SSE chunk:', e);
                    }
                }
            }

            // Execute tool calls after streaming completes
            if (toolCalls.length > 0) {
                // If AI didn't say anything (just tool calls), remove the empty placeholder
                if (!accumulatedContent || !accumulatedContent.trim()) {
                    get().deleteMessage(aiMessageId);
                }

                for (const toolCall of toolCalls) {
                    await get().executeToolCall(toolCall);
                }
            } else if (!accumulatedContent || !accumulatedContent.trim()) {
                // If no content and no tool calls, remove the empty placeholder
                get().deleteMessage(aiMessageId);
            }

        } catch (error) {
            get().updateMessage(aiMessageId, {
                content: `Sorry, I encountered an error: ${error.message}`,
                type: 'error'
            });
        } finally {
            set({ isProcessing: false });
        }
    },

    deleteMessage: (id) => set((state) => ({
        messages: state.messages.filter(m => m.id !== id)
    })),

    // Execute a single tool call (this is where AI controls the UI)
    executeToolCall: async (toolCall) => {
        const mailStore = useMailStore.getState();
        const { name, arguments: args } = toolCall;

        console.log('Executing tool:', name, args);

        switch (name) {
            case 'compose_email':
                // Navigate to compose and fill form
                mailStore.setCurrentView('compose');

                // Animate filling (small delay for visual effect)
                await sleep(300);
                mailStore.setComposeDraft({
                    to: args.to || [],
                    cc: args.cc || [],
                    bcc: args.bcc || [],
                    subject: args.subject || '',
                    body: args.body || '',
                });

                get().setPendingAction({ type: 'send_email' });

                get().addMessage({
                    role: 'assistant',
                    content: `I've filled in the compose form. Please review it. If everything looks good, click on Send Email, or Cancel to stop.`,
                    type: 'confirmation'
                });
                break;

            case 'send_email':
                // Ask for confirmation before sending
                get().setPendingAction({ type: 'send_email' });
                get().addMessage({
                    role: 'assistant',
                    content: 'I\'ve filled in the compose form. Please review it. If everything looks good, click on Send, or Cancel to stop.',
                    type: 'confirmation'
                });
                break;

            case 'search_emails':
                let query = args.query || '';
                if (args.from_address) query += ` from:${args.from_address}`;
                if (args.subject_contains) query += ` subject:${args.subject_contains}`;

                await mailStore.searchEmails(query.trim());
                mailStore.setCurrentView('inbox');

                get().addMessage({
                    role: 'assistant',
                    content: `Found ${mailStore.inbox.length} emails matching your search.`,
                    type: 'info'
                });
                break;

            case 'filter_emails':
                const filters = {};
                if (args.days_ago !== undefined) {
                    const date = new Date();
                    date.setDate(date.getDate() - args.days_ago);
                    date.setHours(0, 0, 0, 0); // Start of that day
                    filters.afterDate = date.toISOString();
                }
                if (args.is_unread !== undefined) filters.isUnread = args.is_unread;
                if (args.from_address) filters.fromAddress = args.from_address;

                mailStore.setFilters(filters);
                await mailStore.fetchInbox(filters);
                mailStore.setCurrentView('inbox');

                get().addMessage({
                    role: 'assistant',
                    content: `Filtered inbox: showing ${useMailStore.getState().inbox.length} emails.`,
                    type: 'filter'
                });
                break;

            case 'open_email':
                let openSuccess = false;

                if (args.email_id) {
                    try {
                        await mailStore.fetchEmail(args.email_id);
                        mailStore.setCurrentView('email');
                        openSuccess = true;
                    } catch (e) {
                        console.error("Failed to open email by ID", e);
                    }
                } else {
                    // Find email by description, list_position, or default to latest
                    const emails = mailStore.inbox;
                    let found = null;

                    // Case 1: List Position (LLM inferred index)
                    if (args.list_position !== undefined && args.list_position !== null) {
                        const index = args.list_position - 1; // Convert 1-based to 0-based
                        if (index >= 0 && index < emails.length) {
                            found = emails[index];
                        }
                    }
                    // Case 2: Description search (fallback or explicit text search)
                    else if (args.description) {
                        const desc = args.description.toLowerCase();

                        if (desc.includes('latest') || desc.includes('last')) {
                            found = emails[0];
                        } else {
                            found = emails.find(e =>
                                e.from_address?.email?.toLowerCase().includes(desc) ||
                                e.from_address?.name?.toLowerCase().includes(desc) ||
                                e.subject?.toLowerCase().includes(desc)
                            );
                        }
                    } else {
                        // Case 3: No args, default to first email
                        found = emails[0];
                    }

                    if (found) {
                        await mailStore.fetchEmail(found.id);
                        mailStore.setCurrentView('email');
                        openSuccess = true;
                    }
                }

                if (openSuccess) {
                    get().addMessage({
                        role: 'assistant',
                        content: 'Opening the email for you.',
                        type: 'info'
                    });
                } else {
                    get().addMessage({
                        role: 'assistant',
                        content: "I couldn't find that email. Could you be more specific?",
                        type: 'error'
                    });
                }
                break;

            case 'navigate':
                mailStore.setCurrentView(args.view);
                // Add explicit delay if user feels it's too fast or wants to see "Thinking"
                if (args.view === 'inbox') await mailStore.fetchInbox();
                if (args.view === 'sent') await mailStore.fetchSent();

                get().addMessage({
                    role: 'assistant',
                    content: `Navigated to ${args.view}.`,
                    type: 'success'
                });
                break;


            case 'reply_to_email':
                const currentEmail = mailStore.currentEmail;
                if (currentEmail || args.email_id) {
                    const emailToReply = currentEmail || await mailStore.fetchEmail(args.email_id);

                    mailStore.setCurrentView('compose');
                    await sleep(300);
                    mailStore.setComposeDraft({
                        to: [emailToReply.from_address?.email],
                        subject: `Re: ${emailToReply.subject}`,
                        body: args.body || `\n\n---\nOn ${emailToReply.date}, ${emailToReply.from_address?.email} wrote:\n${emailToReply.body_text || emailToReply.snippet}`,
                        replyToId: emailToReply.id,
                    });
                }

                get().setPendingAction({ type: 'send_email' });

                get().addMessage({
                    role: 'assistant',
                    content: 'Reply draft ready. Please review it. If everything looks good, click on Send Email, or Cancel to stop.',
                    type: 'confirmation'
                });
                break;

            case 'delete_email':
                if (args.email_id) {
                    await mailStore.deleteEmail(args.email_id);
                    get().addMessage({
                        role: 'assistant',
                        content: 'Deleted the email.',
                        type: 'action'
                    });
                }
                break;

            case 'mark_as_read':
                if (args.email_id) {
                    if (args.is_read) {
                        mailStore.markAsRead(args.email_id);
                    } else {
                        mailStore.markAsUnread(args.email_id);
                    }
                    get().addMessage({
                        role: 'assistant',
                        content: `Marked email as ${args.is_read ? 'read' : 'unread'}.`,
                        type: 'action'
                    });
                }
                break;

            case 'refresh_inbox':
                await mailStore.fetchInbox();
                get().addMessage({
                    role: 'assistant',
                    content: 'Inbox refreshed.',
                    type: 'action'
                });
                break;

            default:
                console.warn('Unknown tool:', name);
        }
    },

    // Confirm pending action
    confirmAction: async () => {
        const { pendingAction } = get();
        if (pendingAction?.type === 'send_email') {
            const mailStore = useMailStore.getState();
            await mailStore.sendEmail();
            get().clearPendingAction();
            get().addMessage({
                role: 'assistant',
                content: 'Email sent successfully!',
                type: 'success'
            });
        }
    },

    // Cancel pending action
    cancelAction: () => {
        get().clearPendingAction();
        get().addMessage({
            role: 'assistant',
            content: 'Action cancelled.',
            type: 'info'
        });
    },
}));

// Helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
