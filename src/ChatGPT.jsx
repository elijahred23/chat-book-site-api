import React, { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from './utils/callGemini';
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { actions, useAppDispatch, useAppState } from './context/AppContext';

/**
 * A drop‑in replacement for the original chat component with a number of
 * improvements:
 *  - Loads messages and prompts from localStorage on mount.
 *  - Persists messages and the current draft prompt back to localStorage when
 *    they change.
 *  - Provides a richer set of one‑click prompt suggestions.
 *  - Includes a toggle to hide/show the chat log so users can focus on the
 *    current prompt when working on smaller screens.
 *  - Uses responsive styles so the layout collapses gracefully on mobile
 *    devices while still filling available space on larger displays.
 */
export default function GptPromptComponent() {
  // Global card state. Each card is expected to be an object with
  // `question` and `answer` fields. Some LLM responses may use
  // alternative keys (e.g. `word`/`definition`), so we normalise
  // them after parsing.
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = JSON.parse(localStorage.getItem('messages') || '[]');
      return Array.isArray(savedMessages) ? savedMessages : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(true);
  // Track whether the conversation view should take up the full height of the
  // component. When enabled, controls and the prompt area are hidden so the
  // user can focus on reading the chat history. Toggling fullScreen on
  // automatically reveals the conversation if it was previously hidden.
  const [fullScreen, setFullScreen] = useState(false);
  const messagesEndRef = useRef(null);
  const dispatch = useAppDispatch();
  const { chatPrompt, selectedText } = useAppState();

  // A more comprehensive list of prompt suggestions. These short labels map
  // to complete prompt templates that can be applied with a single click.
  const promptSuggestions = [
    { label: 'Summary', value: 'Summarize this transcript' },
    { label: 'Elaborate', value: 'Elaborate on this' },
    { label: 'Explain Simply', value: 'Explain this content in simple terms' },
    { label: 'Code Examples', value: 'Show code examples for this topic' },
    { label: 'Questions', value: 'Generate a few comprehension questions about this content' },
    { label: 'Translate', value: 'Translate this into Spanish' },
    { label: 'Define Terms', value: 'List and define key terms from this content' },
    { label: 'Outline', value: 'Create an outline of the main points' },
  ];

  const handleInputChange = (e) => dispatch(actions.setChatPrompt(e.target.value));

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

  // When messages update, persist them to localStorage and scroll to bottom.
  useEffect(() => {
    if (messages.length) {
      localStorage.setItem('messages', JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  // Persist the draft prompt to localStorage so we can restore it on refresh.
  useEffect(() => {
    if (chatPrompt.trim() !== '') {
      localStorage.setItem('prompt', JSON.stringify(chatPrompt));
    }
  }, [chatPrompt]);

  // Restore the prompt and messages from storage on initial mount.
  useEffect(() => {
    try {
      const savedPrompt = JSON.parse(localStorage.getItem('prompt') || '""');
      if (savedPrompt) dispatch(actions.setChatPrompt(savedPrompt));
    } catch {
      /* ignore parse errors */
    }
  }, []);

  // When the user has selected text in another part of the app, prefill it
  // into the prompt area so they can act on it quickly.
  useEffect(() => {
    if (selectedText && selectedText !== chatPrompt) {
      dispatch(actions.setChatPrompt(selectedText));
    }
  }, [selectedText]);

  return (
    <div
      style={{
        maxWidth: '100%',
        margin: '0 auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Toggle controls for showing/hiding the conversation and for entering
         full‑screen mode. Both buttons are placed in a single row so they
         align neatly on all screen sizes. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <button
          onClick={() => setShowChat((prev) => !prev)}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.9rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#f0f0f0',
            cursor: 'pointer',
          }}
        >
          {showChat ? 'Hide Conversation' : 'Show Conversation'}
        </button>
        <button
          onClick={() => {
            // When enabling full screen, ensure the chat is visible so
            // the user actually sees the conversation.
            setFullScreen((prev) => {
              const next = !prev;
              if (next) setShowChat(true);
              return next;
            });
          }}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.9rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#f0f0f0',
            cursor: 'pointer',
          }}
        >
          {fullScreen ? 'Exit Full Screen' : 'Full Screen'}
        </button>
      </div>

      {/* Chat log container – hidden when showChat is false. */}
      {showChat && (
        <div
          ref={messagesEndRef}
          style={{
            border: '1px solid #ccc',
            padding: '0.75rem',
            flexGrow: 1,
            overflowY: 'auto',
            backgroundColor: '#f9f9f9',
            // When in full screen, remove the bottom margin so the chat
            // container fills the available height.
            marginBottom: fullScreen ? '0' : '0.75rem',
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
                <ReactMarkdown className="markdown-body">
                  {message.text}
                </ReactMarkdown>
                {/* Copy button on each message. */}
                <div style={{ marginTop: '0.25rem', textAlign: 'right' }}>
                  <CopyButton text={message.text} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prompt suggestion buttons. Use a wrap layout so they stack nicely on
         narrow screens. */}
      {/* Hide suggestion buttons when in full screen so the conversation
         occupies the full height. */}
      {!fullScreen && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            justifyContent: 'center',
          }}
        >
          {promptSuggestions.map((suggestion, index) => (
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
      )}

      {/* Action buttons row. Separating the action area from the input so they
         float above the keyboard on mobile makes for a better experience. */}
      {/* Hide action buttons in full screen mode to maximise conversation space. */}
      {!fullScreen && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              flex: 1,
            }}
          >
            <PasteButton
              setPasteText={(text) => dispatch(actions.setChatPrompt(text))}
            />
            <button onClick={clear}>Clear</button>
            {selectedText && selectedText !== chatPrompt && (
              <button
                onClick={() => dispatch(actions.setChatPrompt(selectedText))}
              >
                Add Selected
              </button>
            )}
          </div>
          <div style={{ flexShrink: 0 }}>
            {!loading && (
              <button
                onClick={handleSubmit}
                style={{ padding: '0.5rem 1rem' }}
              >
                Send
              </button>
            )}
          </div>
        </div>
      )}

      {/* Text area for entering the prompt. On mobile this takes the full
         width and uses a comfortable line height. */}
      {/* Hide the input area and loading indicator when in full screen. */}
      {!fullScreen && (
        <>
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <ClipLoader color="blue" size={20} />
              <p>Bot is thinking...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}