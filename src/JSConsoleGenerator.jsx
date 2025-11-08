// JSConsoleGenerator.jsx
import React, { useEffect, useRef, useState } from "react";
import { getGeminiResponse } from "./utils/callGemini";
import "./JSConsoleGenerator.css";

import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css"; // you can swap this theme later


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
// JavaScript code that, when run, prints output via console.log
\`\`\`

Rules:
- Must NOT require DOM
- Must ONLY use console.log
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

      if (!extracted) throw new Error("No valid JavaScript code block returned.");

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
        placeholder="Describe what the code should print..."
        className="jsgen-textarea"
      />

      <div className="jsgen-button-row">
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating…" : "Generate"}
        </button>
        <button onClick={() => setPrompt("")}>Clear</button>
      </div>

      {error && <div className="jsgen-error">{error}</div>}

      <div className="jsgen-panels">
        {/* CODE PANEL */}
        <div className="jsgen-panel">
          <div className="jsgen-panel-header">
            <span>Generated Code</span>
            <button onClick={runCode} className="jsgen-run">Run</button>
          </div>

          <Editor
            value={code}
            onValueChange={newCode => setCode(newCode)}
            highlight={c => Prism.highlight(c, Prism.languages.javascript, "javascript")}
            padding={12}
            className="code-editor"
            textareaId="codeEditor"
            spellCheck={false}
          />
        </div>

        {/* OUTPUT PANEL */}
        <div className="jsgen-panel">
          <div className="jsgen-panel-header">Program Output</div>

          <div className="jsgen-output" ref={outputRef}>
            {logs.length ? (
              logs.map((l, i) => <div key={i}>{l}</div>)
            ) : (
              <div className="jsgen-muted">No output yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
