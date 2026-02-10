import React, { useState, useEffect } from 'react';

/**
 * Typewriter Effect Component
 * Simulates streaming text by revealing characters one by one.
 */
export default function Typewriter({ text, speed = 15, onComplete }) {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Reset if text changes (new message)
        if (text !== displayedText && currentIndex === 0) {
            setDisplayedText('');
        } else if (text !== displayedText && currentIndex >= text.length) {
            // If full text changed after completion (rare), just show it
            setDisplayedText(text);
        }
    }, [text]);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else {
            if (onComplete) onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    return <span>{displayedText}</span>;
}
