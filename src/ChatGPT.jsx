import React, { useEffect, useRef, useState } from "react";
import { FiMessageSquare, FiType } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import ReactMarkdown from "react-markdown";
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from "./ui/PasteButton";
import CopyButton from "./ui/CopyButton";
import { actions, useAppDispatch, useAppState } from "./context/AppContext";
import { SUGGESTION_GROUPS } from "./utils/suggestions";
import ActionButtons from "./ui/ActionButtons";
import { AiFillCloseCircle } from "react-icons/ai";

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

const RESPONSE_FORMATS = [
  { value: "none", label: "No formatting (default)", instruction: "" },
  { value: "no_headers_no_lists", label: "No headers, no lists (paragraphs only)", instruction: "No headers. No lists. Use paragraph form only." },
  { value: "short_paragraphs", label: "Short paragraphs only", instruction: "Use short paragraphs (2–3 sentences). No bullet points." },
  { value: "bullets_only", label: "Bulleted list only", instruction: "Respond using bullet points only. No headings, no numbered lists." },
  { value: "numbered_steps", label: "Numbered steps only", instruction: "Respond using a numbered list only. No headings, no bullets." },
  { value: "headers_and_bullets", label: "Headings + bullets", instruction: "Use short headings with bullet points under each. No long paragraphs." },
  { value: "qa_pairs", label: "Q&A pairs", instruction: "Format as Q: ... then A: ... for each point. No headings." },
  { value: "table_like", label: "Table style (pipe rows)", instruction: "Use a markdown table with headers and pipe-delimited rows. No extra text." },
  { value: "bold_terms", label: "Bold terms + brief explanations", instruction: "Start each line with a bolded term followed by a short explanation. No headings." },
  { value: "code_blocks_only", label: "Code blocks only", instruction: "Respond using only code blocks where applicable. No explanations or other text." },
  { value: "code_blocks_only_no_comments", label: "Code blocks only (no comments)", instruction: "Respond using only code blocks where applicable. No explanations, comments, or other text." },
];

export default function GptPromptComponent({
  isCollapsed = false,
  hidePrompt = false,
  isOpen = false,
  onClose = () => {},
  onToggleCollapse = () => {},
  onTogglePrompt = () => {},
}) {
  const [messages, setMessages] = useLocalStorageState("messages", []);
  const [loading, setLoading] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [selectedGroup, setSelectedGroup] = useLocalStorageState("suggestionGroup", "code");
  const [activeTab, setActiveTab] = useState("prompt"); // prompt | chat
  const [responseFormat, setResponseFormat] = useLocalStorageState("chatResponseFormat", "none");
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
      const formatInstruction = RESPONSE_FORMATS.find((fmt) => fmt.value === responseFormat)?.instruction || "";
      const prompt = formatInstruction
        ? `${chatPrompt}\n\nFormatting:\n${formatInstruction}`
        : chatPrompt;
      const response = await getGeminiResponse(prompt);
      const userMsg = { text: chatPrompt, sender: "user" };
      const botMsg = { text: response, sender: "bot" };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      dispatch(actions.setChatPrompt(""));
      setActiveTab("chat");
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

  useEffect(() => {
    if (activeTab !== "chat") return;
    const id = requestAnimationFrame(() => scrollToBottom());
    return () => cancelAnimationFrame(id);
  }, [activeTab]);

  // When the drawer opens, default back to the prompt tab
  useEffect(() => {
    if (!isCollapsed) setActiveTab("prompt");
  }, [isCollapsed]);

  useEffect(() => {
    if (isOpen) setActiveTab("prompt");
  }, [isOpen]);

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
      top: 10px;
      right: 10px;
      z-index: 100001;
      display: flex;
      gap: 6px;
      background: rgba(15,23,42,0.8);
      padding: 6px;
      border-radius: 12px;
      box-shadow: 0 12px 28px rgba(0,0,0,0.25);
      backdrop-filter: blur(10px);
    }
    .pill-btn {
      border: none;
      border-radius: 10px;
      width: 38px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #0ea5e9;
      color: #0b1220;
      cursor: pointer;
      box-shadow: 0 8px 18px rgba(14,165,233,0.35);
    }
    @media (max-width: 540px) {
      .floating-controls {
        left: 8px;
        right: 8px;
        top: 8px;
        transform: none;
      }
      .pill-btn {
        width: 34px;
        height: 34px;
      }
      .chat-window {
        max-height: 50vh;
      }
    }
  `;

  return (
    <div>
      <style>{styles}</style>
      <div className="gpt-shell">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <button
            className={`btn ${activeTab === "prompt" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("prompt")}
          >
            Prompt
          </button>
          <button
            className={`btn ${activeTab === "chat" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {!isCollapsed && activeTab === "chat" && (
            <div className="gpt-card" style={{ flex: "1 1 auto" }}>
              <div className="chat-window" ref={messagesEndRef} style={{ maxHeight: hidePrompt ? "80vh" : "75vh" }}>
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

          {!hidePrompt && activeTab === "prompt" && (
          <div className="gpt-card">
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
              <select
                value={responseFormat}
                onChange={(e) => setResponseFormat(e.target.value)}
                className="btn"
                style={{ flex: "1 1 240px" }}
              >
                {RESPONSE_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
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
          )}
        </div>
      </div>
    </div>
  );
}
