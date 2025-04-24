import React, { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from './utils/callGemini';
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { useAppDispatch, useAppState } from './context/AppContext';

const getValuesLocalStorage = () => {
    const prompt = JSON.parse(localStorage.getItem('prompt') || '""');
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    return { prompt, messages };
};

function GptPromptComponent({ selectedText }) {
    const { prompt: savedPrompt, messages: savedMessages } = getValuesLocalStorage();
    const [prompt, setPrompt] = useState(savedPrompt);
    const [messages, setMessages] = useState(savedMessages);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const promptSuggestions = [
        {label: "Summary", value: "Summarize this transcript"},
        {label: "Elaborate", value: "Elaborate on this"},
        {label: "Simple", value: "Explain this content simply"}
    ];
    const handleInputChange = (e) => setPrompt(e.target.value);

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
            const userMessage = { text: prompt, sender: 'user' };
            const botMessage = { text: geminiResponse, sender: 'bot' };
            setMessages(prev => [...prev, userMessage, botMessage]);
            setPrompt('');
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setMessages([]);
        setPrompt('');
    };

    const print = () => window.print();

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        return () => {
            localStorage.setItem('messages', JSON.stringify(messages));
            localStorage.setItem('prompt', JSON.stringify(prompt));
        };
    }, [messages, prompt]);

    useEffect(() => {
        if (selectedText && selectedText !== prompt) {
            setPrompt(selectedText);
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
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '12px',
                    justifyContent: 'center',
                }}
            >
                {promptSuggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => setPrompt(`${suggestion.value}: ${prompt}`)}
                        style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            borderRadius: '5px',
                            backgroundColor: '#e0e0e0',
                            border: '1px solid #ccc',
                            cursor: 'pointer',
                            flexGrow: 1,
                            flexBasis: 'calc(50% - 10px)', // 2 per row on mobile
                            maxWidth: '10%',
                        }}
                    >
                        {suggestion.label}
                    </button>
                ))}
            </div>

            {/* Action Buttons */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                }}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: 1 }}>
                    <PasteButton setPasteText={setPrompt} />
                    <button onClick={clear}>Clear</button>
                    {selectedText && selectedText !== prompt && (
                        <button onClick={() => setPrompt(selectedText)}>Add Selected</button>
                    )}
                </div>
                <div style={{ flexShrink: 0 }}>
                    {!loading && <button onClick={handleSubmit}>Send</button>}
                </div>
            </div>

            <textarea
                rows={4}
                value={prompt}
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


            {/* Loader */}
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