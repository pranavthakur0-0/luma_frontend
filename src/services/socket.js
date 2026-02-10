/**
 * SSE (Server-Sent Events) Client
 * Connects to backend for real-time email notifications
 * Lighter and simpler than WebSocket
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let eventSource = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function connectSSE(token, handlers = {}) {
    if (eventSource) {
        console.log('SSE already connected');
        return eventSource;
    }

    // Connect to SSE endpoint with token
    const url = `${API_URL}/events?token=${encodeURIComponent(token)}`;
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
        console.log('📺 SSE connected');
        reconnectAttempts = 0;
        handlers.onConnect?.();
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        reconnectAttempts++;

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('Max reconnect attempts reached, closing SSE');
            disconnectSSE();
            handlers.onMaxReconnect?.();
        }
    };

    // Handle connected event
    eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE connected as:', data.email);
    });

    // Handle new email event
    eventSource.addEventListener('email:new', (event) => {
        const data = JSON.parse(event.data);
        console.log('📬 New email(s):', data);
        handlers.onNewEmail?.(data);
    });

    // Handle sync required event
    eventSource.addEventListener('email:sync_required', () => {
        console.log('🔄 Full sync required');
        handlers.onSyncRequired?.();
    });

    return eventSource;
}

export function disconnectSSE() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
        console.log('📴 SSE disconnected');
    }
}

export function isConnected() {
    return eventSource?.readyState === EventSource.OPEN;
}
