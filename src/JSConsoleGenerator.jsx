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
import "prismjs/components/prism-markup"; // HTML alias
import "prismjs/components/prism-lua";

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

  let COMPILER_SOURCES = {  
  onecompiler: {
    javascript: "https://onecompiler.com/javascript",
    python: "https://onecompiler.com/python",
    go: "https://onecompiler.com/go",
    rust: "https://onecompiler.com/rust",
    ruby: "https://onecompiler.com/ruby",
    swift: "https://onecompiler.com/swift",
    kotlin: "https://onecompiler.com/kotlin",
    typescript: "https://onecompiler.com/typescript",
    r: "https://onecompiler.com/r",
    bash: "https://onecompiler.com/bash",
    sql: "https://onecompiler.com/mysql",
    html: "https://onecompiler.com/html",
    lua: "https://onecompiler.com/lua",
  },

  onlinegdb: {
    javascript: "https://www.onlinegdb.com/online_javascript_interpreter",
    python: "https://www.onlinegdb.com/online_python_compiler",
    go: "https://www.onlinegdb.com/online_go_compiler",
    rust: "https://www.onlinegdb.com/online_rust_compiler",
    ruby: "https://www.onlinegdb.com/online_ruby_interpreter",
    swift: "https://www.onlinegdb.com/online_swift_compiler",
    kotlin: "https://www.onlinegdb.com/online_kotlin_compiler",
    r: "https://www.onlinegdb.com/online_r_interpreter",
    bash: "https://www.onlinegdb.com/online_bash_shell",
    sql: "https://www.onlinegdb.com/online_sql_interpreter",
    lua: "https://www.onlinegdb.com/online_lua_interpreter",

    // OnlineGDB-only languages:
    java: "https://www.onlinegdb.com/online_java_compiler",
    c: "https://www.onlinegdb.com/online_c_compiler",
    cpp: "https://www.onlinegdb.com/online_c++_compiler",
    csharp: "https://www.onlinegdb.com/online_csharp_compiler",
    php: "https://www.onlinegdb.com/online_php_interpreter",
  },

  replit: {
    javascript: "https://replit.com/languages/javascript",
    python: "https://replit.com/languages/python3",
    go: "https://replit.com/languages/go",
    rust: "https://replit.com/languages/rust",
    ruby: "https://replit.com/languages/ruby",
    swift: "https://replit.com/languages/swift",
    kotlin: "https://replit.com/languages/kotlin",
    typescript: "https://replit.com/languages/nodejs",
    bash: "https://replit.com/languages/bash",
    php: "https://replit.com/languages/php",
    java: "https://replit.com/languages/java10",
    c: "https://replit.com/languages/c",
    cpp: "https://replit.com/languages/cpp",
    csharp: "https://replit.com/languages/csharp",
  },

  stackblitz: {
    javascript: "https://stackblitz.com/edit/javascript",
    typescript: "https://stackblitz.com/edit/typescript",
    html: "https://stackblitz.com/edit/web-platform",
  },

  jsfiddle: {
    javascript: "https://jsfiddle.net/",
    html: "https://jsfiddle.net/",
  },

  codesandbox: {
    javascript: "https://codesandbox.io/s/new",
    typescript: "https://codesandbox.io/s/ts",
    react: "https://codesandbox.io/s/react",
  },

  glotio: {
    javascript: "https://glot.io/new/javascript",
    python: "https://glot.io/new/python",
    go: "https://glot.io/new/go",
    rust: "https://glot.io/new/rust",
    ruby: "https://glot.io/new/ruby",
    swift: "https://glot.io/new/swift",
    kotlin: "https://glot.io/new/kotlin",
    bash: "https://glot.io/new/bash",
    lua: "https://glot.io/new/lua",
    r: "https://glot.io/new/r",
  },

  godbolt: {
    c: "https://godbolt.org/#g:!((g:compilers,compilers:!((compiler:clang,source:'')))),",
    cpp: "https://godbolt.org/#g:!((g:compilers,compilers:!((compiler:gcc,source:'')))),",
    rust: "https://godbolt.org/z/ePev4M",
  }
};



  function getAvailableCompilers(lang) {
    const options = [];
    if (COMPILER_SOURCES.onecompiler[lang]) {
      options.push({ label: "OneCompiler", url: COMPILER_SOURCES.onecompiler[lang] });
    }
    if (COMPILER_SOURCES.onlinegdb[lang]) {
      options.push({ label: "OnlineGDB", url: COMPILER_SOURCES.onlinegdb[lang] });
    }
    return options;
  }

  async function openCompiler(url) {
    try {
      await navigator.clipboard.writeText(code);
      window.open(url, "_blank");
    } catch {
      alert("Clipboard copy blocked by browser.");
    }
  }

  const availableCompilers = getAvailableCompilers(language);


  return (
  <div className="jsgen-wrapper">
    <h2>🧪 Multi-Language Code Generator</h2>

    {/* Language Selector */}
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

    {/* Prompt Input */}
    <textarea
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="Describe the program goal..."
      className="jsgen-textarea"
    />

    {/* Generate / Clear Buttons */}
    <div className="jsgen-button-row">
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating…" : "Generate"}
      </button>
      <button onClick={() => setPrompt("")}>Clear</button>
    </div>

    {error && <div className="jsgen-error">{error}</div>}

    {/* MAIN PANELS */}
    <div
      className="jsgen-panels"
      style={{
        marginTop: "1rem",
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap"
      }}
    >
      {/* CODE PANEL */}
      <div
        className="jsgen-panel"
        style={{
          flex: "1 1 100%",
          display: "flex",
          flexDirection: "column",
          border: "1px solid #ddd",
          borderRadius: "6px",
          overflow: "hidden",
          background: "#ffffff",
          color: "#222"
        }}
      >
        <ActionButtons limitButtons promptText={code} />

        <div
          className="jsgen-panel-header"
          style={{
            padding: "0.6rem 0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f5f5f5",
            borderBottom: "1px solid #ddd",
            fontWeight: 500
          }}
        >
          <span style={{ color: "#333" }}>
            Generated Code ({language})
          </span>

          {language === "javascript" && (
            <button
              onClick={runCode}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                background: "#e7fbe7",
                color: "#2c6c2c",
                cursor: "pointer"
              }}
            >
              Run
            </button>
          )}

          {availableCompilers.length > 0 && (
            <div
              className="compiler-buttons"
              style={{
                display: "flex",
                gap: "0.5rem",
                marginLeft: "1rem"
              }}
            >
              {availableCompilers.map((cmp, index) => (
                <button
                  key={index}
                  onClick={() => openCompiler(cmp.url)}
                  style={{
                    padding: "0.45rem 0.75rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    background: "#eaf3ff",
                    color: "#1a4fa3",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Copy & Open {cmp.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CODE EDITOR */}
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={(c) =>
            Prism.highlight(
              c,
              Prism.languages[prismLanguage] ?? Prism.languages.javascript,
              prismLanguage
            )
          }
          padding={12}
          className="code-editor"
          spellCheck={false}
          style={{
            background: "#fafafa",
            borderTop: "1px solid #eee"
          }}
        />
      </div>

      {/* PROGRAM OUTPUT (JS only) */}
      {language === "javascript" && (
        <div
          className="jsgen-panel"
          style={{
            flex: "1 1 100%",
            border: "1px solid #ddd",
            borderRadius: "6px",
            overflow: "hidden",
            background: "#ffffff",
            color: "#222"
          }}
        >
          <div
            className="jsgen-panel-header"
            style={{
              padding: "0.6rem 0.75rem",
              background: "#f5f5f5",
              borderBottom: "1px solid #ddd",
              fontWeight: 500
            }}
          >
            Program Output
          </div>

          <div
            className="jsgen-output"
            ref={outputRef}
            style={{ padding: "0.75rem" }}
          >
            {logs.length > 0
              ? logs.map((l, i) => <div key={i}>{l}</div>)
              : <div className="jsgen-muted">No output yet</div>}
          </div>
        </div>
      )}
    </div>
  </div>
);

}
