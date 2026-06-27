/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ClipLoader } from "react-spinners";
import Prism from "./utils/prism";
import { getGeminiResponse } from "./utils/callGemini";
import { SUGGESTION_GROUPS } from "./utils/suggestions";
import ActionButtons from "./ui/ActionButtons";
import CopyButton from "./ui/CopyButton";
import PasteButton from "./ui/PasteButton";
import useLocalStorageState from "./hooks/useLocalStorageState";
import "./AIChat.css";

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
  { value: "code_blocks_only_no_comments", label: "Code blocks only (no comments)", instruction: "Respond using only code blocks where applicable. No explanations, comments within the code what so ever, or other text." },
  { value: "code_blocks_only_files_and_console_commands", label: "Code blocks only (files + console commands)", instruction: "Respond using only code blocks. Only comments should be when giving codeblocks a file name. (//Program.cs). Show command line commands if applicable. No explanations or other text." },
];

const LANGUAGE_ALIASES = {
  cs: "csharp",
  html: "markup",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
};

function HighlightedCode({ children, className = "" }) {
  const languageMatch = /language-([\w-]+)/.exec(className);
  if (!languageMatch) return <code className={className}>{children}</code>;

  const requestedLanguage = languageMatch[1].toLowerCase();
  const language = LANGUAGE_ALIASES[requestedLanguage] ?? requestedLanguage;
  const grammar = Prism.languages[language];
  if (!grammar) return <code className={className}>{children}</code>;

  const code = String(children).replace(/\n$/, "");
  const highlightedCode = Prism.highlight(code, grammar, language);

  return (
    <code
      className={`language-${language}`}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
}

export default function AIChat({
  promptText,
  setPromptText,
  storageKeys,
  isCollapsed = false,
  hidePrompt = false,
  isOpen = false,
  theme = "blue",
  mode = "primary",
}) {
  const [messages, setMessages] = useLocalStorageState(storageKeys.messages, []);
  const [selectedGroup, setSelectedGroup] = useLocalStorageState(storageKeys.suggestionGroup, "code");
  const [responseFormat, setResponseFormat] = useLocalStorageState(storageKeys.responseFormat, "none");
  const [persistentContext, setPersistentContext] = useLocalStorageState(storageKeys.persistentContext, "");
  const [loading, setLoading] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [activeTab, setActiveTab] = useState("prompt");
  const messagesEndRef = useRef(null);
  const isDual = mode === "dual";

  const currentSuggestions = SUGGESTION_GROUPS[selectedGroup] ?? [];
  const visibleSuggestions = showAllSuggestions ? currentSuggestions : currentSuggestions.slice(0, 6);
  const groupOptions = Object.keys(SUGGESTION_GROUPS).map((key) => ({
    value: key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const clearMessages = () => setMessages([]);

  const handleSubmit = async () => {
    const suggestionText = selectedSuggestion?.value ? `\n\n${selectedSuggestion.value}` : "";
    const promptWithSuggestion = `${promptText || ""}${suggestionText}`.trim();
    const contextText = (persistentContext || "").trim();
    const basePrompt = contextText ? `${contextText}\n\n${promptWithSuggestion}`.trim() : promptWithSuggestion;
    if (!basePrompt) return;

    try {
      setLoading(true);
      const formatInstruction = RESPONSE_FORMATS.find(({ value }) => value === responseFormat)?.instruction || "";
      const prompt = formatInstruction ? `${basePrompt}\n\nFormatting:\n${formatInstruction}` : basePrompt;
      const response = await getGeminiResponse(prompt);
      setMessages((previous) => [
        ...previous,
        { text: basePrompt, sender: "user" },
        { text: response, sender: "bot" },
      ]);
      setPromptText("");
      setSelectedSuggestion(null);
      setActiveTab("chat");
    } catch {
      alert("Error fetching response.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    const id = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(id);
  }, [activeTab]);

  useEffect(() => {
    if (isOpen || (!isDual && !isCollapsed)) setActiveTab("prompt");
  }, [isCollapsed, isDual, isOpen]);

  return (
    <div className={`gpt-shell ai-chat ai-chat--${theme}`}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <button className={`btn ${activeTab === "prompt" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("prompt")}>Prompt</button>
        <button className={`btn ${activeTab === "chat" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("chat")}>Chat</button>
        {isDual && <button className="btn btn-ghost" onClick={clearMessages}>Clear</button>}
      </div>

      {!isCollapsed && activeTab === "chat" && (
        <div className="gpt-card">
          <div className="chat-window" ref={messagesEndRef} style={{ maxHeight: hidePrompt ? "80vh" : "75vh" }}>
            {messages.map((message, index) => (
              <div key={index} style={{ textAlign: message.sender === "user" ? "right" : "left", marginBottom: "0.75rem" }}>
                <div className={`bubble ${message.sender === "user" ? "user" : "bot"}`}>
                  <strong>{message.sender === "user" ? "You: " : "Bot: "}</strong>
                  <ReactMarkdown
                    className="markdown-body"
                    components={{ code: HighlightedCode }}
                  >
                    {message.text}
                  </ReactMarkdown>
                  <div style={{ textAlign: "right", marginTop: "0.35rem" }}>
                    <ActionButtons promptText={message.text} />
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#64748b" }}>
                {isDual ? "Start a conversation." : "Start a conversation or pick a suggestion below."}
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
              onChange={(event) => {
                setSelectedGroup(event.target.value);
                setSelectedSuggestion(null);
              }}
              className={isDual ? "select-btn" : "btn"}
              style={{ flex: "1 1 200px" }}
            >
              {groupOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select
              value={responseFormat}
              onChange={(event) => setResponseFormat(event.target.value)}
              className={isDual ? "select-btn" : "btn"}
              style={{ flex: isDual ? "1 1 220px" : "1 1 240px" }}
            >
              {RESPONSE_FORMATS.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
            </select>
            <button className="btn btn-ghost" onClick={() => setShowAllSuggestions((shown) => !shown)}>
              {showAllSuggestions ? "Collapse Suggestions" : "Show More Suggestions"}
            </button>
            {isDual && <button className="btn btn-ghost" onClick={() => setPromptText("")}>Clear prompt</button>}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {visibleSuggestions.map((suggestion) => {
              const isSelected = selectedSuggestion?.value === suggestion.value;
              return (
                <button
                  key={suggestion.value}
                  className={`suggestion ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedSuggestion((previous) => previous?.value === suggestion.value ? null : suggestion)}
                >
                  {suggestion.label} {isSelected ? "✓" : ""}
                </button>
              );
            })}
            <button className="suggestion" onClick={() => setShowAllSuggestions((shown) => !shown)}>
              {showAllSuggestions ? "Show Less ▲" : "Show All ▼"}
            </button>
          </div>

          <textarea
            rows={3}
            value={persistentContext}
            onChange={(event) => setPersistentContext(event.target.value)}
            placeholder="Persistent context (prepended to every prompt and saved locally)..."
            className="prompt-input"
            style={{ marginBottom: "0.75rem" }}
          />
          <textarea
            rows={4}
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type your prompt and press Enter..."
            className="prompt-input"
            style={{ marginBottom: "0.75rem" }}
          />

          {isDual ? (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <ClipLoader size={12} color="white" /> : "Send"}
              </button>
              <PasteButton setPasteText={setPromptText} />
              <CopyButton text={promptText} className="btn" />
              <ActionButtons promptText={promptText} limitButtons />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <PasteButton setPasteText={setPromptText} className="btn btn-ghost" />
                  <button className="btn btn-ghost" onClick={clearMessages}>Clear Chat</button>
                  <button className="btn btn-ghost" onClick={() => setPromptText("")}>Clear Prompt</button>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
