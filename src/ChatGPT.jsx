import React, { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { hostname } from "./utils/hostname";

const baseURL = hostname;

const getValuesLocalStorage = () => {
    const localMessages = localStorage.getItem('messages');
    const localPrompt = localStorage.getItem('prompt');

    return {
        prompt: localPrompt ? JSON.parse(localPrompt) : '',
        messages: localMessages ? JSON.parse(localMessages) : [] ,
    }
}

function GptPromptComponent() {
    let localStorageValues = getValuesLocalStorage(); 
    const [messages, setMessages] = useState(localStorageValues.messages);
    const [prompt, setPrompt] = useState(localStorageValues.prompt);

    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const handleInputChange = (event) => {
        setPrompt(event.target.value);
    };

    const scrollToBottom = () => {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }

    const handleSubmit = async () => {
        try {
            if (prompt === '' || prompt === null || prompt === undefined) {
                return;
            }
            setLoading(true);
            const response = await fetch(`${baseURL}/gemini/prompt?prompt=${prompt}`);
            const data = await response.json();
            const newMessage = { text: prompt, sender: 'user' };
            const botMessage = { text: data.geminiResponse, sender: 'bot' };
            setMessages([...messages, newMessage, botMessage]);
            setPrompt('');
        } catch (error) {
            console.error('Error fetching data:', error);
            window.alert('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const print = () => window.print();
    const clear = () => {
        setMessages([]);
        setPrompt('');
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
    }, [prompt])

    useEffect(() => {
        return () => {
            let jsonMessages = JSON.stringify(messages);
            localStorage.setItem('messages', jsonMessages);

            let jsonPrompt = JSON.stringify(prompt);
            localStorage.setItem('prompt', jsonPrompt);
        };
    }, [messages, prompt]); 
    useEffect(() => {
    }, []);

    return (
        <div>
            <h2>Chat GPT</h2>
            <div ref={messagesEndRef} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                {messages.map((message, index) => (
                    <div key={index} style={{ marginBottom: '10px', textAlign: message.sender === 'user' ? 'right' : 'left' }}>
                        <span style={{ fontWeight: 'bold' }}>{message.sender === 'user' ? 'You: ' : 'Bot: '}</span>
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                ))}
            </div>
            <input onKeyDown={event => {
                if (event.key === 'Enter') {
                    handleSubmit();
                }
            }} type="text" value={prompt} onChange={handleInputChange} style={{ marginRight: '10px' }} />
            <ClipLoader color="blue" loading={loading} />
            <button onClick={print}>Print</button>
            <button onClick={clear}>Clear</button>
            {!loading &&
                <button onClick={handleSubmit}>Send</button>
            }
        </div>
    );
}

export default GptPromptComponent;
