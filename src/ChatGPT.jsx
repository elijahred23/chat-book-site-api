import React, { useEffect, useRef, useState } from "react";
import { ClipLoader } from "react-spinners";
import ReactMarkdown from "react-markdown";
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from "./ui/PasteButton";
import CopyButton from "./ui/CopyButton";
import { actions, useAppDispatch, useAppState } from "./context/AppContext";

const SUGGESTIONS = [
  // 🔍 Code Understanding
  { label: "Explain Code", value: "Explain what this code does step by step" },
  { label: "Summarize Code", value: "Summarize what this script or module is responsible for" },
  { label: "Explain Algorithm", value: "Explain the algorithm or logic in simple terms" },
  { label: "Explain Output", value: "Explain what the output of this code will be and why" },
  { label: "Visualize Flow", value: "Describe how to visualize this logic in a flowchart or UML diagram" },
  { label: "Trace Execution", value: "Simulate how this code executes line by line" },

  // 🧠 Debugging and Troubleshooting
  { label: "Fix Bugs", value: "Find and fix potential bugs or logic errors in this code" },
  { label: "Explain Error", value: "Explain what this error message means and how to fix it" },
  { label: "Debug Strategy", value: "Suggest a debugging strategy or tools to identify this issue" },
  { label: "Edge Cases", value: "List possible edge cases this code should handle" },
  { label: "Validate Input", value: "Show how to validate user input and prevent bad data" },

  // ⚙️ Optimization
  { label: "Optimize", value: "Suggest ways to optimize this code for performance or readability" },
  { label: "Reduce Complexity", value: "Simplify this logic to reduce time or space complexity" },
  { label: "Memory Optimization", value: "Suggest optimizations to reduce memory usage" },
  { label: "Performance Test", value: "Show how to benchmark or measure performance for this code" },

  // 🧩 Refactoring and Architecture
  { label: "Refactor", value: "Refactor this code to follow clean code principles or design patterns" },
  { label: "Apply Design Pattern", value: "Identify and apply a suitable design pattern to this code" },
  { label: "Clean Code", value: "Rewrite this to follow clean code and SOLID principles" },
  { label: "Modularize", value: "Break this code into smaller, reusable modules" },
  { label: "Improve Naming", value: "Suggest better variable and function names" },
  { label: "Add Logging", value: "Show how to add useful logging for debugging" },
  { label: "Add Error Handling", value: "Add try/catch or error handling where appropriate" },
  { label: "Decouple Logic", value: "Separate business logic from UI or I/O code" },

  // 🧪 Testing
  { label: "Generate Tests", value: "Write unit tests or integration tests for this code" },
  { label: "Test Scenarios", value: "List test cases to verify this function" },
  { label: "Mock Data", value: "Show how to mock dependencies for this test" },
  { label: "Boundary Tests", value: "Suggest tests for boundary and edge conditions" },
  { label: "Coverage Improvement", value: "Suggest areas where test coverage could be improved" },

  // 🧱 Documentation and Review
  { label: "Add Comments", value: "Add meaningful comments and documentation to this code" },
  { label: "Document Function", value: "Write docstrings or JSDoc for each function" },
  { label: "Code Review", value: "Perform a code review and suggest improvements" },
  { label: "Best Practices", value: "Suggest coding best practices for this language or framework" },
  { label: "Readability", value: "Improve readability and formatting of this code" },
  { label: "Version Control", value: "Explain how to commit this change with a proper Git message" },

  // 🧮 Algorithms and Data Structures
  { label: "Algorithm Analysis", value: "Analyze time and space complexity" },
  { label: "Data Structure Choice", value: "Recommend a better data structure for this problem" },
  { label: "Alternative Algorithm", value: "Suggest a more efficient algorithm for this task" },
  { label: "Explain Big O", value: "Explain this algorithm’s Big O complexity" },
  { label: "Recursive to Iterative", value: "Convert this recursive function to an iterative one" },
  { label: "Dynamic Programming", value: "Show how to use dynamic programming to solve this problem" },

  // 🧰 DevOps and Environment
  { label: "Dockerize", value: "Show how to containerize this application using Docker" },
  { label: "Kubernetes Setup", value: "Suggest a basic Kubernetes deployment for this app" },
  { label: "CI/CD", value: "Explain how to add CI/CD automation for this project" },
  { label: "Environment Variables", value: "Show how to properly handle sensitive environment variables" },

  // 💾 Database and API
  { label: "Optimize Query", value: "Optimize this SQL or ORM query for better performance" },
  { label: "Secure API", value: "Review this API for potential security issues" },
  { label: "Add Pagination", value: "Add pagination or filtering logic to this API" },
  { label: "Error Responses", value: "Define consistent error responses for this API" },
  { label: "Validate Schema", value: "Validate request/response schema using JSON Schema or similar" },

  // 🧠 Conceptual and Educational
  { label: "Compare Methods", value: "Compare this approach with another programming method" },
  { label: "Explain Concept", value: "Explain the key programming concept used here" },
  { label: "Simplify Code", value: "Simplify the logic while keeping functionality intact" },
  { label: "Real-World Example", value: "Provide a real-world analogy for this code" },
  { label: "Next Steps", value: "Suggest logical improvements or next development steps" },
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
            <button onClick={() => setShowAllSuggestions((p) => !p)} style={{ padding: "0.5rem 0.75rem", borderRadius: "4px", border: "1px solid #ccc", background: "#e0e0e0", fontSize: "0.85rem", cursor: "pointer" }}>
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
              <button onClick={()=>dispatch(actions.setChatPrompt(""))}>Clear Prompt</button>
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
