import React, { useEffect, useRef, useState } from "react";
import { getGeminiResponse } from "./utils/callGemini";
import "./JSConsoleGenerator.css";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";

// Load core + clike
import "prismjs/components/prism-core";
import "prismjs/components/prism-clike";

// Base languages
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";

// Additional languages
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-r";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markup"; // HTML
import "prismjs/components/prism-lua";

import "prismjs/themes/prism.css";

import "prismjs/themes/prism.css";
import { useAppState } from "./context/AppContext";
import ActionButtons from "./ui/ActionButtons";

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
Return ONLY one code block:
\`\`\`${language}
// A short ${language} program that prints output
\`\`\`

Topic: "${userTopic}"
`.trim();
  }

  const prismLanguage = language === "html" ? "markup" : language;


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

      if (!extracted) throw new Error(`No valid ${language} code returned.`);

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

      const compilers = {
        javascript: "https://onecompiler.com/javascript",
        python: "https://onecompiler.com/python",
        java: "https://www.onlinegdb.com/online_java_compiler",
        c: "https://www.onlinegdb.com/online_c_compiler",
        cpp: "https://www.onlinegdb.com/online_c++_compiler",
        csharp: "https://www.onlinegdb.com/online_csharp_compiler",
        go: "https://onecompiler.com/go",
        rust: "https://onecompiler.com/rust",
        php: "https://www.onlinegdb.com/online_php_interpreter",
        ruby: "https://onecompiler.com/ruby",
        swift: "https://onecompiler.com/swift",
        kotlin: "https://onecompiler.com/kotlin",
        typescript: "https://onecompiler.com/typescript",
        r: "https://onecompiler.com/r",
        bash: "https://onecompiler.com/bash",
        sql: "https://onecompiler.com/mysql",
        html: "https://onecompiler.com/html",
        lua: "https://onecompiler.com/lua",
      };

      window.open(compilers[language], "_blank");
    } catch {
      alert("Clipboard copy blocked by browser.");
    }
  }

  // Fix Prism highlight for HTML (alias markup)
  const prismLang = language === "html" ? "markup" : language;

  return (
    <div className="jsgen-wrapper">
      <h2>🧪 Multi-Language Code Generator</h2>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="jsgen-language-select"
      >
        {[
          "javascript", "python", "java", "c", "cpp", "csharp", "go",
          "rust", "php", "ruby", "swift", "kotlin", "typescript",
          "r", "bash", "sql", "html", "lua"
        ].map((lang) => (
          <option key={lang} value={lang}>{lang.toUpperCase()}</option>
        ))}
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
            <ActionButtons limitButtons promptText={code} />
            <button onClick={openCompilerForLanguage} className="jsgen-run">
              Open Compiler & Paste
            </button>
          </div>

          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(c) =>
              Prism.highlight(c, Prism.languages[prismLanguage] ?? Prism.languages.javascript, prismLanguage)
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
              {logs.length ? logs.map((l, i) => <div key={i}>{l}</div>)
                : <div className="jsgen-muted">No output yet</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

