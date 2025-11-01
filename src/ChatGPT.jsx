import React, { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from './utils/callGemini';
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { actions, useAppDispatch, useAppState } from './context/AppContext';

/**
 * A refactored version of the chat component that introduces a custom hook
 * for persisting state to localStorage and simplifies the UI state handling.
 *
 * Key improvements:
 *  - Consolidates view controls into a single `viewMode` state to avoid
 *    juggling multiple booleans (`showChat` and `fullScreen`).
 *  - Extracts the localStorage persistence logic into a reusable hook
 *    `useLocalStorageState` for cleaner code and easier reuse.
 *  - Uses top level constants for suggestions to avoid recreating arrays
 *    on every render.
 *  - Maintains responsive styling and control toggles, while making the
 *    component easier to reason about.
 */

// Suggestion presets defined outside the component to avoid recreation on
// every render. Each suggestion maps a button label to a prompt template.
const SUGGESTIONS = [
  { label: 'Summary', value: 'Summarize this transcript' },
  { label: 'Elaborate', value: 'Elaborate on this' },
  { label: 'Explain Simply', value: 'Explain this content in simple terms' },
  { label: 'Code Examples', value: 'Show code examples for this topic' },
  { label: 'Questions', value: 'Generate a few comprehension questions about this content' },
  { label: 'Translate', value: 'Translate this into Spanish' },
  { label: 'Define Terms', value: 'List and define key terms from this content' },
  { label: 'Outline', value: 'Create an outline of the main points' },
];

/**
 * Persist a piece of state to localStorage. When the component mounts,
 * the hook will attempt to load any previously saved value from
 * localStorage. Any updates to the state are automatically written back.
 *
 * @param {string} key The localStorage key.
 * @param {*} defaultValue The initial value if nothing is stored.
 */
function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      // Only use the stored value if it is not undefined/null, otherwise
      // fall back to the provided default.
      return stored !== null && stored !== undefined ? stored : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore storage write errors */
    }
  }, [key, state]);
  return [state, setState];
}

export default function RefactoredGptPromptComponent() {
  // Persist the chat messages to localStorage. Because we use a custom hook,
  // localStorage reads/writes are encapsulated and the code below remains
  // focused on application logic.
  const [messages, setMessages] = useLocalStorageState('messages', []);

  // Manage the view state of the conversation. Three modes are supported:
  //  - 'normal': show everything (chat, suggestions, controls, input)
  //  - 'collapsed': hide the chat log but keep controls and input visible
  //  - 'full': show only the chat log and hide controls/input
  const [viewMode, setViewMode] = useState('normal');

  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const dispatch = useAppDispatch();
  const { chatPrompt, selectedText } = useAppState();

  // Helper flags derived from viewMode to simplify conditional rendering.
  const isCollapsed = viewMode === 'collapsed';
  const isFull = viewMode === 'full';

  /**
   * Scroll the chat log to the bottom whenever messages change. We use
   * optional chaining in case the ref isn't attached yet.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  /**
   * Send the current prompt to Gemini and append the response to the chat log.
   */
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

  /**
   * Clear the chat log and the current prompt. The messages state will be
   * persisted by the `useLocalStorageState` hook.
   */
  const clear = () => {
    setMessages([]);
    dispatch(actions.setChatPrompt(''));
  };

  // Scroll chat to the bottom whenever new messages arrive.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist the current prompt to localStorage so it can be restored on reload.
  useEffect(() => {
    try {
      if (chatPrompt.trim() !== '') {
        localStorage.setItem('prompt', JSON.stringify(chatPrompt));
      }
    } catch {
      /* ignore storage errors */
    }
  }, [chatPrompt]);

  // Restore the prompt from localStorage on mount.
  useEffect(() => {
    try {
      const savedPrompt = JSON.parse(localStorage.getItem('prompt') || '""');
      if (savedPrompt) dispatch(actions.setChatPrompt(savedPrompt));
    } catch {
      /* ignore parse errors */
    }
  }, []);

  // If the user selects text elsewhere in the app, prefill it into the prompt.
  useEffect(() => {
    if (selectedText && selectedText !== chatPrompt) {
      dispatch(actions.setChatPrompt(selectedText));
    }
  }, [selectedText]);

  // View toggles. Changing to 'full' or 'collapsed' will adjust the UI
  // accordingly. Toggling collapse while in full screen returns to normal.
  const toggleCollapse = () => {
    setViewMode((mode) => {
      if (mode === 'collapsed') return 'normal';
      // If we're in full screen, collapse doesn't make sense; return to normal
      if (mode === 'full') return 'normal';
      return 'collapsed';
    });
  };

  const toggleFullScreen = () => {
    setViewMode((mode) => (mode === 'full' ? 'normal' : 'full'));
  };

  /**
   * Handler for the prompt input change. Delegates to the AppContext action.
   * @param {*} e
   */
  const handleInputChange = (e) => dispatch(actions.setChatPrompt(e.target.value));

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
      {/* Control buttons for collapsing and full screen. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <button
          onClick={toggleCollapse}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.9rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#f0f0f0',
            cursor: 'pointer',
          }}
        >
          {isCollapsed ? 'Show Conversation' : 'Hide Conversation'}
        </button>
        <button
          onClick={toggleFullScreen}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.9rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#f0f0f0',
            cursor: 'pointer',
          }}
        >
          {isFull ? 'Exit Full Screen' : 'Full Screen'}
        </button>
      </div>

      {/* Chat log; hidden when collapsed. */}
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
                <ReactMarkdown className="markdown-body">
                  {message.text}
                </ReactMarkdown>
                <div style={{ marginTop: '0.25rem', textAlign: 'right' }}>
                  <CopyButton text={message.text} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestion buttons; only visible when not in full screen. */}
      {!isFull && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            justifyContent: 'center',
          }}
        >
          {SUGGESTIONS.map((suggestion, index) => (
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

      {/* Action controls; hidden in full screen mode. */}
      {!isFull && (
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

      {/* Prompt input and loading indicator; hidden in full screen. */}
      {!isFull && (
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