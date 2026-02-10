export function formatDistanceToNow(date) {
    const now = new Date();
    const then = new Date(date);

    // Check if same day
    const isToday = now.toDateString() === then.toDateString();

    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === then.toDateString();

    if (isToday) {
        // Show time only for today: "5:31 AM"
        return then.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    if (isYesterday) {
        return 'Yesterday';
    }

    // For older emails, show date
    return then.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
