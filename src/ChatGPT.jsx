import React, { useState } from 'react';

function GptPromptComponent() {
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState('');

    const handleInputChange = (event) => {
        setPrompt(event.target.value);
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch(`http://localhost:3000/gpt/prompt?prompt=${prompt}`);
            const data = await response.json();
            const newMessage = { text: prompt, sender: 'user' };
            const botMessage = { text: data.gptResponse?.message?.content, sender: 'bot' };
            setMessages([...messages, newMessage, botMessage]);
            setPrompt('');
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <div>
            <h1>Chat Interface</h1>
            <div style={{ maxHeight: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                {messages.map((message, index) => (
                    <div key={index} style={{ marginBottom: '10px', textAlign: message.sender === 'user' ? 'right' : 'left' }}>
                        <span style={{ fontWeight: 'bold' }}>{message.sender === 'user' ? 'You: ' : 'Bot: '}</span>
                        {message.text}
                    </div>
                ))}
            </div>
            <input type="text" value={prompt} onChange={handleInputChange} style={{ marginRight: '10px' }} />
            <button onClick={handleSubmit}>Send</button>
        </div>
    );
}

export default GptPromptComponent;
