import React, { useEffect, useRef, useState } from "react";
import { getGeminiResponse } from "./utils/callGemini";
import "./JSConsoleGenerator.css";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/themes/prism.css";

import { useAppState } from "./context/AppContext";

export default function JSConsoleGenerator() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const { jsGeneratorPrompt } = useAppState();
  const outputRef = useRef(null);

  useEffect(() => {
    setPrompt(jsGeneratorPrompt);
  }, [jsGeneratorPrompt]);

  function buildStrictPrompt(userTopic) {
    return `
Return ONLY one code block.

\`\`\`${language}
// A short ${language} program that prints output.
\`\`\`

Topic: "${userTopic}"
`.trim();
  }

  function extractSingleCodeBlock(text) {
    const match = text.match(new RegExp("```" + language + "\\s*([\\s\\S]*?)```", "i"));
    return match ? match[1].trim() : null;
  }

  async function handleGenerate() {
    try {
      setLoading(true);
      setError("");
      setLogs([]);
      const raw = await getGeminiResponse(buildStrictPrompt(prompt.trim()));
      const extracted = extractSingleCodeBlock(raw);
      if (!extracted) throw new Error(`No valid ${language} code block returned.`);
      setCode(extracted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function runCode() {
    if (language !== "javascript") return;
    const captured = [];
    const safeConsole = { log: (...args) => captured.push(args.join(" ")) };
    try {
      new Function("console", `"use strict";\n${code}`)(safeConsole);
      setLogs(captured);
    } catch (err) {
      setError("Runtime error: " + err.message);
    }
  }

  async function openCompilerForLanguage() {
    try {
      await navigator.clipboard.writeText(code);
      let url = "";

      switch (language) {
        case "javascript":
          url = "https://onecompiler.com/javascript";
          break;
        case "python":
          url = "https://www.onlinegdb.com/online_python_interpreter";
          break;
        case "java":
          url = "https://www.onlinegdb.com/online_java_compiler";
          break;
        case "c":
          url = "https://www.onlinegdb.com/online_c_compiler";
          break;
        default:
          return;
      }

      window.open(url, "_blank");
    } catch {
      alert("Clipboard copy blocked by browser.");
    }
  }

  return (
    <div className="jsgen-wrapper">
      <h2>🧪 Multi-Language Code Generator</h2>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="jsgen-language-select"
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="c">C</option>
      </select>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the program goal..."
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
        <div className="jsgen-panel">
          <div className="jsgen-panel-header">
            <span>Generated Code ({language})</span>
            {language === "javascript" && (
              <button onClick={runCode} className="jsgen-run">Run</button>
            )}
            <button onClick={openCompilerForLanguage} className="jsgen-run">
              Open Compiler & Paste
            </button>
          </div>

          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(c) =>
              Prism.highlight(c, Prism.languages[language] || Prism.languages.javascript, language)
            }
            padding={12}
            className="code-editor"
            spellCheck={false}
          />
        </div>

        {language === "javascript" && (
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
        )}
      </div>
    </div>
  );
}
