import React, { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from './utils/callGemini';
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { actions, useAppDispatch, useAppState } from './context/AppContext';

const SUGGESTIONS = [
  { label: 'Summary', value: 'Summarize this transcript' },
  { label: 'Elaborate', value: 'Elaborate on this' },
  { label: 'Explain Simply', value: 'Explain this content in simple terms' },
  { label: 'Code Examples', value: 'Show code examples for this topic' },
  { label: 'Questions', value: 'Generate a few comprehension questions about this content' },
  { label: 'Translate (Spanish)', value: 'Translate this into Spanish' },
  { label: 'Translate (French)', value: 'Translate this into French' },
  { label: 'Define Terms', value: 'List and define key terms from this content' },
  { label: 'Outline', value: 'Create an outline of the main points' },
  { label: 'Key Takeaways', value: 'List the top five takeaways from this text' },
  { label: 'Real-World Example', value: 'Provide a real-world example to illustrate this concept' },
  { label: 'Simplify for Kids', value: 'Explain this in a way a 10-year-old could understand' },
  { label: 'Make It Formal', value: 'Rewrite this text in a formal academic tone' },
  { label: 'Make It Concise', value: 'Condense this text while keeping all key information' },
  { label: 'Expand', value: 'Expand this idea with additional reasoning or evidence' },
  { label: 'Step-by-Step', value: 'Break this process down into clear, numbered steps' },
  { label: 'Pros and Cons', value: 'List the advantages and disadvantages of this approach' },
  { label: 'Alternative View', value: 'Provide an alternative perspective or counterargument' },
  { label: 'Summary Table', value: 'Summarize the key points in a Markdown table format' },
  { label: 'Flashcards', value: 'Generate study flashcards from this content' },
  { label: 'Quiz', value: 'Create a short quiz with answers based on this content' },
  { label: 'Action Plan', value: 'Turn this into an actionable to-do list or plan' },
  { label: 'Comparison', value: 'Compare this topic with a similar concept or method' },
  { label: 'Paraphrase', value: 'Reword this content using different phrasing but same meaning' },
  { label: 'Visual Idea', value: 'Describe how to visualize or diagram this concept' },
  { label: 'APA Citation', value: 'Format this information as an APA-style citation' },
  { label: 'Next Steps', value: 'Suggest logical next steps or follow-up actions' },
];

function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      return stored !== null && stored !== undefined ? stored : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

export default function RefactoredGptPromptComponent() {
  const [messages, setMessages] = useLocalStorageState('messages', []);
  const [viewMode, setViewMode] = useState('normal');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const dispatch = useAppDispatch();
  const { chatPrompt, selectedText } = useAppState();

  const isCollapsed = viewMode === 'collapsed';
  const isFull = viewMode === 'full';
  const visibleSuggestions = showAllSuggestions ? SUGGESTIONS : SUGGESTIONS.slice(0, 4);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSubmit = async () => {
    if (!chatPrompt.trim()) return;
    try {
      setLoading(true);
      const geminiResponse = await getGeminiResponse(chatPrompt);
      const userMessage = { text: chatPrompt, sender: 'user' };
      const botMessage = { text: geminiResponse, sender: 'bot' };
      setMessages((prev) => [...prev, userMessage, botMessage]);
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

  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    try {
      if (chatPrompt.trim() !== '') {
        localStorage.setItem('prompt', JSON.stringify(chatPrompt));
      }
    } catch {}
  }, [chatPrompt]);

  useEffect(() => {
    try {
      const savedPrompt = JSON.parse(localStorage.getItem('prompt') || '""');
      if (savedPrompt) dispatch(actions.setChatPrompt(savedPrompt));
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedText && selectedText !== chatPrompt) {
      dispatch(actions.setChatPrompt(selectedText));
    }
  }, [selectedText]);

  const toggleCollapse = () => {
    setViewMode((mode) => {
      if (mode === 'collapsed') return 'normal';
      if (mode === 'full') return 'normal';
      return 'collapsed';
    });
  };

  const toggleFullScreen = () => {
    setViewMode((mode) => (mode === 'full' ? 'normal' : 'full'));
  };

  const handleInputChange = (e) => dispatch(actions.setChatPrompt(e.target.value));

  return (
    <>
      {/* Floating Controls */}
      <div
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 999999,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.85)',
          padding: '0.4rem 0.6rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(5px)',
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={toggleCollapse}
          style={{
            padding: '0.4rem 0.75rem',
            fontSize: '0.9rem',
            borderRadius: '5px',
            border: '1px solid #ccc',
            background: isCollapsed ? '#e0e0e0' : '#f0f0f0',
            cursor: 'pointer',
            minWidth: '120px',
          }}
        >
          {isCollapsed ? 'Show Chat' : 'Hide Chat'}
        </button>
        <button
          onClick={toggleFullScreen}
          style={{
            padding: '0.4rem 0.75rem',
            fontSize: '0.9rem',
            borderRadius: '5px',
            border: '1px solid #ccc',
            background: isFull ? '#d9f7ff' : '#f0f0f0',
            cursor: 'pointer',
            minWidth: '120px',
          }}
        >
          {isFull ? 'Exit Full Screen' : 'Full Screen'}
        </button>
      </div>

      <div
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          boxSizing: 'border-box',
          paddingTop: '70px',
        }}
      >
        {!isCollapsed && (
          <div
            ref={messagesEndRef}
            style={{
              border: '1px solid #ccc',
              padding: '0.75rem',
              flexGrow: 1,
              overflowY: 'auto',
              backgroundColor: '#f9f9f9',
              marginBottom: isFull ? '0' : '0.75rem',
              borderRadius: '5px',
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '0.75rem',
                  textAlign: message.sender === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '12px',
                    backgroundColor:
                      message.sender === 'user' ? '#DCF8C6' : '#F1F0F0',
                    maxWidth: '85%',
                    wordBreak: 'break-word',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>
                    {message.sender === 'user' ? 'You: ' : 'Bot: '}
                  </span>
                  <ReactMarkdown className="markdown-body">{message.text}</ReactMarkdown>
                  <div style={{ marginTop: '0.25rem', textAlign: 'right' }}>
                    <CopyButton text={message.text} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isFull && (
          <>
            {/* Suggestion Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              {visibleSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() =>
                    dispatch(
                      actions.setChatPrompt(
                        `${suggestion.value}${chatPrompt ? `: ${chatPrompt}` : ''}`,
                      ),
                    )
                  }
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8rem',
                    borderRadius: '4px',
                    backgroundColor: '#e0e0e0',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    flex: '1 1 calc(50% - 0.5rem)',
                    minWidth: '130px',
                  }}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <button
                onClick={() => setShowAllSuggestions((prev) => !prev)}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {showAllSuggestions ? 'Show Less ▲' : 'Show More ▼'}
              </button>
            </div>

            {/* Action Controls */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1 }}>
                <PasteButton setPasteText={(text) => dispatch(actions.setChatPrompt(text))} />
                <button onClick={clear}>Clear</button>
                {selectedText && selectedText !== chatPrompt && (
                  <button onClick={() => dispatch(actions.setChatPrompt(selectedText))}>
                    Add Selected
                  </button>
                )}
              </div>
              <div style={{ flexShrink: 0 }}>
                {!loading && (
                  <button onClick={handleSubmit} style={{ padding: '0.5rem 1rem' }}>
                    Send
                  </button>
                )}
              </div>
            </div>

            {/* Text Area */}
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
                marginBottom: '0.5rem',
                padding: '0.75rem',
                fontSize: '1rem',
                lineHeight: '1.5',
                border: '1px solid #ccc',
                borderRadius: '8px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipLoader color="blue" size={20} />
                <p>Bot is thinking...</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
