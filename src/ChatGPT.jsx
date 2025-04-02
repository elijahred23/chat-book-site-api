import React, { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from './utils/callGemini';

const getValuesLocalStorage = () => {
    const localMessages = localStorage.getItem('messages');
    const localPrompt = localStorage.getItem('prompt');
    return {
        prompt: localPrompt ? JSON.parse(localPrompt) : '',
        messages: localMessages ? JSON.parse(localMessages) : [],
    }
}

function GptPromptComponent() {
    const localStorageValues = getValuesLocalStorage();
    const [messages, setMessages] = useState(localStorageValues.messages);
    const [prompt, setPrompt] = useState(localStorageValues.prompt);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const promptSuggestions = [
        "Summarize this text",
        "Explain like I'm 5",
        "Give pros and cons",
        "Translate this",
        "List 5 key points",
        "Turn this into a poem",
        "Make a quiz",
        "Give a metaphor",
        "Add historical context",
        "Create a fun fact"
    ];

    const handleInputChange = (event) => setPrompt(event.target.value);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollTo({
            top: messagesEndRef.current.scrollHeight,
            behavior: 'smooth'
        });
    };

    const handleSubmit = async () => {
        if (!prompt) return;
        try {
            setLoading(true);
            const geminiResponse = await getGeminiResponse(prompt);
            const newMessage = { text: prompt, sender: 'user' };
            const botMessage = { text: geminiResponse, sender: 'bot' };
            setMessages(prev => [...prev, newMessage, botMessage]);
            setPrompt('');
        } catch (error) {
            console.error('Error fetching data:', error);
            window.alert('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const print = () => window.print();
    const clear = () => {
        setMessages([]);
        setPrompt('');
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        return () => {
            localStorage.setItem('messages', JSON.stringify(messages));
            localStorage.setItem('prompt', JSON.stringify(prompt));
        };
    }, [messages, prompt]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '1rem' }}>💬 Gemini Chat</h2>
    
            {/* Scrollable message area */}
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
                            <span style={{ fontWeight: 'bold' }}>{message.sender === 'user' ? 'You: ' : 'Bot: '}</span>
                            <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>
    
            {/* Fixed bottom input and controls */}
            <div style={{ position: 'sticky', bottom: 0, backgroundColor: '#fff', padding: '10px 0', zIndex: 10 }}>
                <textarea
                    rows={3}
                    value={prompt}
                    onChange={handleInputChange}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    style={{ width: '100%', marginBottom: '10px' }}
                    placeholder="Type your prompt and hit Enter..."
                />
    
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {promptSuggestions.map((s, i) => (
                        <button key={i} onClick={() => setPrompt(s)}>{s}</button>
                    ))}
                </div>
    
                {loading && <p><ClipLoader color="blue" size={20} /> Bot is thinking...</p>}
    
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={print}>Print</button>
                    <button onClick={clear}>Clear</button>
                    {!loading && <button onClick={handleSubmit}>Send</button>}
                </div>
            </div>
        </div>
    );
}

export default GptPromptComponent;