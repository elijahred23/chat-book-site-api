// JSConsoleGenerator.jsx
import React, { useEffect, useRef, useState } from "react";
import { getGeminiResponse } from "./utils/callGemini";
import "./JSConsoleGenerator.css"; // <-- ADD THIS

export default function JSConsoleGenerator() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const outputRef = useRef(null);

  function buildStrictPrompt(userTopic) {
    return `
Return ONLY one JavaScript code block. No explanation, no extra text.

\`\`\`javascript
// JavaScript code that, when run
\`\`\`

Rules:
Content topic: "${userTopic}"
    `.trim();
  }

  function extractSingleCodeBlock(text) {
    const match = text.match(/```javascript\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : null;
  }

  async function handleGenerate() {
    try {
      setLoading(true);
      setError("");
      setLogs([]);
      const raw = await getGeminiResponse(buildStrictPrompt(prompt.trim()));
      const extracted = extractSingleCodeBlock(raw);
      if (!extracted) throw new Error("No valid code block returned.");
      setCode(extracted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function runCode() {
    const captured = [];
    const safeConsole = { log: (...args) => captured.push(args.join(" ")) };
    try {
      new Function("console", `"use strict";\n${code}`)(safeConsole);
      setLogs(captured);
    } catch (err) {
      setError("Runtime error: " + err.message);
    }
  }

  return (
    <div className="jsgen-wrapper">
      <h2>🧪 JavaScript Console-Only Code Generator</h2>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe what the console output should be about..."
        className="jsgen-textarea"
      />

      <div className="jsgen-button-row">
        <button onClick={handleGenerate} disabled={loading}>Generate</button>
        <button onClick={() => setPrompt("")}>Clear</button>
      </div>

      {error && <div className="jsgen-error">{error}</div>}

      <div className="jsgen-panels">
        <div className="jsgen-panel">
          <div className="jsgen-panel-header">Generated Code</div>
          <pre className="code-block">
            <code>{code || "// Generate to see console.log lines here"}</code>
          </pre>
          <button onClick={runCode} className="jsgen-run">Run</button>
        </div>

        <div className="jsgen-panel">
          <div className="jsgen-panel-header">Program Output</div>
          <div className="jsgen-output" ref={outputRef}>
            {logs.length ? logs.map((l, i) => <div key={i}>{l}</div>) : <div className="jsgen-muted">No output yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
