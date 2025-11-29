import React, { useEffect, useRef, useState } from "react";
import { ClipLoader } from "react-spinners";
import ReactMarkdown from "react-markdown";
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from "./ui/PasteButton";
import CopyButton from "./ui/CopyButton";
import { actions, useAppDispatch, useAppState } from "./context/AppContext";
import { SUGGESTION_GROUPS } from "./utils/suggestions";
import ActionButtons from "./ui/ActionButtons";

function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      return stored ?? defaultValue;
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

export default function GptPromptComponent({
  isCollapsed = false,
  isFullScreen = false,
  onClose = () => {},
  onToggleCollapse = () => {},
  onToggleFullScreen = () => {},
}) {
  const [messages, setMessages] = useLocalStorageState("messages", []);
  const [loading, setLoading] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [selectedGroup, setSelectedGroup] = useLocalStorageState("suggestionGroup", "code");
  const messagesEndRef = useRef(null);
  const dispatch = useAppDispatch();
  const { chatPrompt, selectedText } = useAppState();

  const currentSuggestions = SUGGESTION_GROUPS[selectedGroup] ?? [];
  const visibleSuggestions = showAllSuggestions ? currentSuggestions : currentSuggestions.slice(0, 6);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleSubmit = async () => {
    if (!chatPrompt.trim()) return;
    try {
      setLoading(true);
      const response = await getGeminiResponse(chatPrompt);
      const userMsg = { text: chatPrompt, sender: "user" };
      const botMsg = { text: response, sender: "bot" };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      dispatch(actions.setChatPrompt(""));
    } catch {
      alert("Error fetching response.");
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  useEffect(() => {
    if (selectedText && selectedText !== chatPrompt) {
      dispatch(actions.setChatPrompt(selectedText));
    }
  }, [selectedText]);

  useEffect(scrollToBottom, [messages]);

  const handleInputChange = (e) => dispatch(actions.setChatPrompt(e.target.value));

  const groupOptions = Object.keys(SUGGESTION_GROUPS).map((key) => ({
    value: key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const styles = `
    .gpt-shell {
      max-width: 980px;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      position: relative;
    }
    .gpt-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 10px 24px rgba(15,23,42,0.08);
    }
    .chat-window {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      overflow-y: auto;
      max-height: 60vh;
    }
    .bubble {
      display: inline-block;
      padding: 0.65rem 0.85rem;
      border-radius: 14px;
      max-width: 92vw;
      word-break: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .user {
      background: #dbeafe;
      color: #0f172a;
    }
    .bot {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn {
      padding: 0.6rem 0.85rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #fff;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      color: #0f172a;
    }
    .btn-primary {
      background: linear-gradient(135deg, #2563eb, #60a5fa);
      color: #fff;
      border: none;
      box-shadow: 0 10px 24px rgba(37,99,235,0.25);
    }
    .btn-ghost {
      background: #f8fafc;
    }
    .suggestion {
      padding: 0.5rem 0.75rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      font-size: 0.92rem;
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .prompt-input {
      width: 100%;
      padding: 0.8rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      font-size: 1rem;
      min-height: 120px;
      resize: vertical;
    }
    .floating-controls {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 100001;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      background: rgba(15,23,42,0.9);
      padding: 0.6rem 0.8rem;
      border-radius: 14px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.25);
      backdrop-filter: blur(12px);
    }
    @media (max-width: 540px) {
      .floating-controls {
        left: 8px;
        right: 8px;
        top: auto;
        bottom: 8px;
        transform: none;
        width: auto;
        justify-content: flex-start;
      }
      .chat-window {
        max-height: 50vh;
      }
    }
  `;

  return (
    <div>
      <style>{styles}</style>
      <div className="floating-controls">
        <button className="btn btn-primary" onClick={onToggleFullScreen}>
          {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        <button className="btn" onClick={onToggleCollapse}>
          {isCollapsed ? "Show Messages" : "Hide Messages"}
        </button>
        <button className="btn" onClick={onClose} style={{ color: "#fbbf24" }}>
          Close Chat
        </button>
      </div>

      <div
        className={`gpt-shell ${isFullScreen ? "fullscreen" : ""}`}
        style={{
          position: isFullScreen ? "fixed" : "relative",
          top: isFullScreen ? 0 : "auto",
          left: isFullScreen ? 0 : "auto",
          width: isFullScreen ? "100vw" : "100%",
          height: isFullScreen ? "100vh" : "100%",
          background: isFullScreen ? "#0b1220" : "transparent",
          zIndex: isFullScreen ? 100000 : "auto",
          overflow: "hidden",
          padding: isFullScreen ? "70px 12px 12px 12px" : "0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: isFullScreen ? "calc(100vh - 90px)" : "auto" }}>
          {!isCollapsed && (
            <div className="gpt-card" style={{ flex: isFullScreen ? "1 1 50%" : "0 0 auto" }}>
              <div className="chat-window" ref={messagesEndRef} style={{ height: isFullScreen ? "100%" : "auto" }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ textAlign: m.sender === "user" ? "right" : "left", marginBottom: "0.75rem" }}>
                    <div className={`bubble ${m.sender === "user" ? "user" : "bot"}`}>
                      <strong>{m.sender === "user" ? "You: " : "Bot: "}</strong>
                      <ReactMarkdown className="markdown-body">{m.text}</ReactMarkdown>
                      <div style={{ textAlign: "right", marginTop: "0.35rem" }}>
                        <ActionButtons promptText={m.text} />
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "#64748b" }}>
                    Start a conversation or pick a suggestion below.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="gpt-card" style={{ flex: isFullScreen ? "0 0 auto" : "unset" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.5rem" }}>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="btn"
                style={{ flex: "1 1 200px" }}
              >
                {groupOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button className="btn btn-ghost" onClick={() => setShowAllSuggestions((p) => !p)}>
                {showAllSuggestions ? "Collapse Suggestions" : "Show More Suggestions"}
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                justifyContent: "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              {visibleSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion"
                  onClick={() => dispatch(actions.setChatPrompt(`${s.value}${chatPrompt ? `: ${chatPrompt}` : ""}`))}
                >
                  {s.label}
                </button>
              ))}
              <button
                className="suggestion"
                onClick={() => setShowAllSuggestions((p) => !p)}
              >
                {showAllSuggestions ? "Show Less ▲" : "Show All ▼"}
              </button>
            </div>

            <textarea
              rows={4}
              value={chatPrompt}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Type your prompt and press Enter..."
              className="prompt-input"
              style={{ marginBottom: "0.75rem" }}
            />

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <PasteButton setPasteText={(text) => dispatch(actions.setChatPrompt(text))} className="btn btn-ghost" />
                <button className="btn btn-ghost" onClick={clearMessages}>Clear Chat</button>
                <button className="btn btn-ghost" onClick={() => dispatch(actions.setChatPrompt(""))}>Clear Prompt</button>
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Thinking..." : "Send"}
              </button>
            </div>

            {loading && (
              <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ClipLoader color="#2563eb" size={20} />
                <span>Generating response...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
