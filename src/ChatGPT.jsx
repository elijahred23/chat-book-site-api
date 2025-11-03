import React, { useEffect, useRef, useState } from "react";
import { ClipLoader } from "react-spinners";
import ReactMarkdown from "react-markdown";
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from "./ui/PasteButton";
import CopyButton from "./ui/CopyButton";
import { actions, useAppDispatch, useAppState } from "./context/AppContext";
import { SUGGESTIONS } from "./utils/suggestions";

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
  const messagesEndRef = useRef(null);
  const dispatch = useAppDispatch();
  const { chatPrompt, selectedText } = useAppState();

  const visibleSuggestions = showAllSuggestions ? SUGGESTIONS : SUGGESTIONS.slice(0, 6);

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
    } catch (err) {
      console.error(err);
      alert("Error fetching response.");
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    if (selectedText && selectedText !== chatPrompt) {
      dispatch(actions.setChatPrompt(selectedText));
    }
  }, [selectedText]);

  useEffect(() => scrollToBottom(), [messages]);

  const handleInputChange = (e) => dispatch(actions.setChatPrompt(e.target.value));

  return (
    <div
      className={`gpt-container ${isFullScreen ? "fullscreen" : ""}`}
      style={{
        position: isFullScreen ? "fixed" : "relative",
        top: isFullScreen ? 0 : "auto",
        left: isFullScreen ? 0 : "auto",
        width: isFullScreen ? "100vw" : "100%",
        height: isFullScreen ? "100vh" : "100%",
        background: isFullScreen ? "#fff" : "transparent",
        zIndex: isFullScreen ? 100000 : "auto",
        overflow: "hidden",
        paddingTop: "60px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Fixed Controls */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          zIndex: 100001,
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          background: "rgba(255,255,255,0.95)",
          padding: "0.5rem 0.75rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        <button onClick={onToggleCollapse}>
          {isCollapsed ? "Show Chat" : "Hide Chat"}
        </button>
        <button onClick={onToggleFullScreen}>
          {isFullScreen ? "Exit Full Screen" : "Full Screen"}
        </button>
        <button onClick={onClose} style={{ color: "#a00", fontWeight: "bold" }}>
          ✖ Close
        </button>
      </div>

      {!isCollapsed && (
        <div
          ref={messagesEndRef}
          style={{
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "0.75rem",
            background: "#f9f9f9",
            overflowY: "auto",
            flexGrow: 1,
            marginBottom: isFullScreen ? "0" : "0.75rem",
            height: isFullScreen ? "calc(100vh - 80px)" : "auto",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign: m.sender === "user" ? "right" : "left",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: m.sender === "user" ? "#DCF8C6" : "#F1F0F0",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "12px",
                  maxWidth: "95vw",
                  wordBreak: "break-word",
                }}
              >
                <strong>{m.sender === "user" ? "You: " : "Bot: "}</strong>
                <ReactMarkdown className="markdown-body">{m.text}</ReactMarkdown>
                <div style={{ textAlign: "right" }}>
                  <CopyButton text={m.text} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input, buttons, suggestions hidden when full screen */}
      {!isCollapsed && !isFullScreen && (
        <div style={{ paddingBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            {(showAllSuggestions ? SUGGESTIONS : visibleSuggestions).map((s, i) => (
              <button
                key={i}
                onClick={() =>
                  dispatch(
                    actions.setChatPrompt(`${s.value}${chatPrompt ? `: ${chatPrompt}` : ""}`)
                  )
                }
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  background: "#e0e0e0",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setShowAllSuggestions((p) => !p)}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                background: "#e0e0e0",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
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
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "0.5rem",
              fontSize: "1rem",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <PasteButton setPasteText={(text) => dispatch(actions.setChatPrompt(text))} />
              <button onClick={clearMessages}>Clear Chat Log</button>
              <button onClick={() => dispatch(actions.setChatPrompt(""))}>Clear Prompt</button>
            </div>
            <button onClick={handleSubmit} disabled={loading}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>

          {loading && (
            <div
              style={{
                marginTop: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ClipLoader color="blue" size={20} />
              <span>Generating response...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
