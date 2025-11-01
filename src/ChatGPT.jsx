import React, { useEffect, useRef, useState } from "react";
import { ClipLoader } from "react-spinners";
import ReactMarkdown from "react-markdown";
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from "./ui/PasteButton";
import CopyButton from "./ui/CopyButton";
import { actions, useAppDispatch, useAppState } from "./context/AppContext";

const SUGGESTIONS = [
  { label: "Summary", value: "Summarize this transcript" },
  { label: "Elaborate", value: "Elaborate on this" },
  { label: "Explain Simply", value: "Explain this content in simple terms" },
  { label: "Code Examples", value: "Show code examples for this topic" },
  { label: "Questions", value: "Generate a few comprehension questions about this content" },
  { label: "Translate (Spanish)", value: "Translate this into Spanish" },
  { label: "Translate (French)", value: "Translate this into French" },
  { label: "Define Terms", value: "List and define key terms from this content" },
  { label: "Outline", value: "Create an outline of the main points" },
  { label: "Key Takeaways", value: "List the top five takeaways from this text" },
  { label: "Real-World Example", value: "Provide a real-world example to illustrate this concept" },
  { label: "Simplify for Kids", value: "Explain this in a way a 10-year-old could understand" },
  { label: "Make It Formal", value: "Rewrite this text in a formal academic tone" },
  { label: "Make It Concise", value: "Condense this text while keeping all key information" },
  { label: "Expand", value: "Expand this idea with additional reasoning or evidence" },
  { label: "Step-by-Step", value: "Break this process down into clear, numbered steps" },
  { label: "Pros and Cons", value: "List the advantages and disadvantages of this approach" },
  { label: "Alternative View", value: "Provide an alternative perspective or counterargument" },
  { label: "Summary Table", value: "Summarize the key points in a Markdown table format" },
  { label: "Flashcards", value: "Generate study flashcards from this content" },
  { label: "Quiz", value: "Create a short quiz with answers based on this content" },
  { label: "Action Plan", value: "Turn this into an actionable to-do list or plan" },
  { label: "Comparison", value: "Compare this topic with a similar concept or method" },
  { label: "Paraphrase", value: "Reword this content using different phrasing but same meaning" },
  { label: "Visual Idea", value: "Describe how to visualize or diagram this concept" },
  { label: "APA Citation", value: "Format this information as an APA-style citation" },
  { label: "Next Steps", value: "Suggest logical next steps or follow-up actions" },
];

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

  const clear = () => {
    setMessages([]);
    dispatch(actions.setChatPrompt(""));
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
        height: isFullScreen ? "100vh" : "100%",
        overflow: "hidden",
        position: "relative",
        paddingTop: "60px",
      }}
    >
      {/* Fixed Controls */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          zIndex: 10000,
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          background: "rgba(255,255,255,0.9)",
          padding: "0.5rem 0.75rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        <button onClick={onToggleCollapse}>{isCollapsed ? "Show Chat" : "Hide Chat"}</button>
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
            height: isFullScreen ? "75vh" : "55vh",
            marginBottom: "0.75rem",
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
                  maxWidth: "85%",
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

      {!isCollapsed && (
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
            {visibleSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() =>
                  dispatch(actions.setChatPrompt(`${s.value}${chatPrompt ? `: ${chatPrompt}` : ""}`))
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
              <button onClick={clear}>Clear</button>
            </div>
            <button onClick={handleSubmit} disabled={loading}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>

          {loading && (
            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ClipLoader color="blue" size={20} />
              <span>Generating response...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
