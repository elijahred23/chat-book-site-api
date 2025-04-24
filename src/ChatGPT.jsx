import React, { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from './utils/callGemini';
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { actions, useAppDispatch, useAppState } from './context/AppContext';

function GptPromptComponent() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const dispatch = useAppDispatch();
    const { chatPrompt, selectedText } = useAppState();

    const promptSuggestions = [
        { label: "Summary", value: "Summarize this transcript" },
        { label: "Elaborate", value: "Elaborate on this" },
        { label: "Simple", value: "Explain this content simply" }
    ];

    const handleInputChange = (e) => dispatch(actions.setChatPrompt(e.target.value));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollTo({
            top: messagesEndRef.current.scrollHeight,
            behavior: 'smooth'
        });
    };

    const handleSubmit = async () => {
        if (!chatPrompt) return;
        try {
            setLoading(true);
            const geminiResponse = await getGeminiResponse(chatPrompt);
            const userMessage = { text: chatPrompt, sender: 'user' };
            const botMessage = { text: geminiResponse, sender: 'bot' };
            setMessages(prev => [...prev, userMessage, botMessage]);
            dispatch(actions.setChatPrompt(''));
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setMessages([]);
        dispatch(actions.setChatPrompt(''));
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const savedPrompt = JSON.parse(localStorage.getItem('prompt') || '""');
        const savedMessages = JSON.parse(localStorage.getItem('messages') || '[]');

        console.log("Loaded from localStorage:", { savedPrompt, savedMessages });

        if (savedPrompt) dispatch(actions.setChatPrompt(savedPrompt));
        if (savedMessages.length) setMessages(savedMessages);
    }, []);


    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('messages', JSON.stringify(messages));
        }
        if (chatPrompt.trim() !== "") {
            localStorage.setItem('prompt', JSON.stringify(chatPrompt));
        }
    }, [messages, chatPrompt]);

    useEffect(() => {
        if (selectedText && selectedText !== chatPrompt) {
            dispatch(actions.setChatPrompt(selectedText));
        }
    }, [selectedText]);


    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>
            <div
                ref={messagesEndRef}
                style={{
                    border: '1px solid #ccc',
                    padding: '10px',
                    flexGrow: 1,
                    overflowY: 'auto',
                    backgroundColor: '#f9f9f9',
                    marginBottom: '10px',
                    borderRadius: '5px'
                }}
            >
                {messages.map((message, index) => (
                    <div
                        key={index}
                        style={{
                            marginBottom: '10px',
                            textAlign: message.sender === 'user' ? 'right' : 'left'
                        }}
                    >
                        <div style={{
                            display: 'inline-block',
                            padding: '10px',
                            borderRadius: '10px',
                            backgroundColor: message.sender === 'user' ? '#DCF8C6' : '#F1F0F0',
                            maxWidth: '75%'
                        }}>
                            <span style={{ fontWeight: 'bold' }}>
                                {message.sender === 'user' ? 'You: ' : 'Bot: '}
                            </span>
                            <ReactMarkdown className="markdown-body">{message.text}</ReactMarkdown>
                            <CopyButton text={message.text} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
                {promptSuggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => dispatch(actions.setChatPrompt(`${suggestion.value}: ${chatPrompt}`))}
                        style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            borderRadius: '5px',
                            backgroundColor: '#e0e0e0',
                            border: '1px solid #ccc',
                            cursor: 'pointer',
                            flexGrow: 1,
                            flexBasis: 'calc(50% - 10px)',
                            maxWidth: '10%',
                        }}
                    >
                        {suggestion.label}
                    </button>
                ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: 1 }}>
                    <PasteButton setPasteText={(text) => dispatch(actions.setChatPrompt(text))} />
                    <button onClick={clear}>Clear</button>
                    {selectedText && selectedText !== chatPrompt && (
                        <button onClick={() => dispatch(actions.setChatPrompt(selectedText))}>Add Selected</button>
                    )}
                </div>
                <div style={{ flexShrink: 0 }}>
                    {!loading && <button onClick={handleSubmit}>Send</button>}
                </div>
            </div>

            <textarea
                rows={4}
                value={chatPrompt}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
                placeholder="Type your prompt and hit Enter..."
                style={{
                    width: '100%',
                    marginBottom: '10px',
                    padding: '12px',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                }}
            />

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ClipLoader color="blue" size={20} />
                    <p>Bot is thinking...</p>
                </div>
            )}
        </div>
    );
}

export default GptPromptComponent;
