import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Loader2, Mic, MicOff, CheckCircle, AlertCircle, Filter, Info } from 'lucide-react';
import { useAssistantStore } from '../../store';
import './AssistantPanel.css';

export default function AssistantPanel() {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);
    const originalInputRef = useRef('');

    const {
        messages,
        isProcessing,
        isPanelOpen,
        togglePanel,
        sendMessage,
        pendingAction,
        confirmAction,
        cancelAction,
        panelWidth,
        setPanelWidth
    } = useAssistantStore();

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');

                const prefix = originalInputRef.current;
                const spacer = prefix && !prefix.endsWith(' ') ? ' ' : '';
                setInput(prefix + spacer + transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on panel open
    useEffect(() => {
        if (isPanelOpen) {
            inputRef.current?.focus();
        }
    }, [isPanelOpen]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            originalInputRef.current = input;
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        // Stop listening if active
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        sendMessage(input.trim());
        setInput('');
    };

    // Resize Handler
    const handleMouseDown = (e) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ew-resize';
    };

    const handleMouseMove = (e) => {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 300 && newWidth <= 1200) {
            setPanelWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
    };

    if (!isPanelOpen) {
        return (
            <button className="assistant-toggle" onClick={togglePanel}>
                <Sparkles size={24} />
            </button>
        );
    }

    return (
        <div className="assistant-panel-container" style={{ width: panelWidth }}>
            <div className="resize-handle" onMouseDown={handleMouseDown} />
            <div className="assistant-panel" style={{ width: '100%' }}>
                <div className="assistant-header">
                    <div className="assistant-title">
                        <Bot size={20} />
                        <span>AI Assistant</span>
                    </div>
                    <button className="close-btn" onClick={togglePanel}>
                        <X size={18} />
                    </button>
                </div>

                <div className="assistant-messages">
                    {messages.length === 0 && (
                        <div className="assistant-welcome">
                            <div className="welcome-icon">
                                <Sparkles size={32} />
                            </div>
                            <h3>Hi! I'm your mail assistant</h3>
                            <p>I can help you compose emails, search your inbox, and navigate your mail. Try saying:</p>
                            <ul className="suggestions">
                                <li>"Send an email to john@example.com about the meeting"</li>
                                <li>"Show me emails from the last 7 days"</li>
                                <li>"Open the latest email"</li>
                                <li>"Reply to this email"</li>
                            </ul>
                        </div>
                    )}


                    {messages.map((message, index) => {
                        const isLast = index === messages.length - 1;
                        const isAssistant = message.role === 'assistant';

                        // Skip rendering empty assistant messages (placeholder for stream)
                        if (isAssistant && !message.content && !message.type) return null;

                        return (
                            <div
                                key={message.id}
                                className={`message ${message.role} ${message.type || ''}`}
                            >
                                <div className="message-avatar">
                                    {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className="message-content">
                                    {message.type === 'success' && <CheckCircle size={16} className="icon success" />}
                                    {message.type === 'error' && <AlertCircle size={16} className="icon error" />}
                                    {message.type === 'filter' && <Filter size={16} className="icon info" />}
                                    {message.type === 'info' && <Info size={16} className="icon info" />}

                                    {message.content}

                                    {message.type === 'confirmation' && pendingAction && (
                                        <div className="confirmation-actions">
                                            <button className="confirm-btn" onClick={confirmAction}>
                                                Send Email
                                            </button>
                                            <button className="cancel-btn" onClick={cancelAction}>
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isProcessing && (
                        <div className="message assistant processing">
                            <div className="message-avatar">
                                <Bot size={16} />
                            </div>
                            <div className="message-content">
                                <Loader2 size={16} className="spinning" />
                                <span>Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Siri-like Voice Animation */}
                {isListening && (
                    <div className="voice-visualizer">
                        <div className="siri-wave">
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                        </div>
                        <span className="listening-text">Listening...</span>
                    </div>
                )}

                <form className="assistant-input" onSubmit={handleSubmit}>
                    <div className="textarea-wrapper">
                        <textarea
                            ref={inputRef}
                            placeholder={isListening ? "Speak now..." : "Ask me anything about your email..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            disabled={isProcessing}
                            rows={3}
                        />
                        <div className="input-actions">
                            {speechSupported && (
                                <button
                                    type="button"
                                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                                    onClick={toggleListening}
                                    disabled={isProcessing}
                                >
                                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                            )}
                            <button type="submit" disabled={!input.trim() || isProcessing} className="send-btn">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
