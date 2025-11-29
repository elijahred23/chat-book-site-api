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

  const buildStrictPrompt = (userTopic) =>
    `Return ONLY one ${language} code block (no fences) that solves:\n"${userTopic}"\nMake it runnable and concise.`;

  const prismLanguage = language === "html" ? "markup" : language;

  const extractSingleCodeBlock = (text) => {
    const fenced = text.match(/```[\w+-]*\s*([\s\S]*?)```/);
    if (fenced && fenced[1]) return fenced[1].trim();
    return text.trim();
  };

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
    try {
      // eslint-disable-next-line no-eval
      const result = eval(code);
      setLogs((prev) => [...prev, result !== undefined ? String(result) : ""]);
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
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const helper = document.createElement("textarea");
        helper.value = code;
        helper.setAttribute("readonly", "");
        helper.style.position = "absolute";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
      window.open(url, "_blank");
    } catch {
      alert("Clipboard copy blocked by browser.");
    }
  }

  const availableCompilers = getAvailableCompilers(language);


  return (
  return (
    <div className="jsgen-shell">
      <div className="jsgen-card">
        <div className="jsgen-header">
          <h2>🧪 Multi-Language Code Generator</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="jsgen-select"
          >
            {[
              "javascript", "python", "java", "c", "cpp", "csharp", "go",
              "rust", "php", "ruby", "swift", "kotlin", "typescript",
              "r", "bash", "sql", "html", "lua"
            ].map((lang) => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="jsgen-grid">
          <div className="jsgen-panel">
            <label className="jsgen-label">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the program goal..."
              className="jsgen-textarea"
            />
            <div className="jsgen-button-row">
              <button className="jsgen-btn primary" onClick={handleGenerate} disabled={loading}>
                {loading ? "Generating…" : "Generate"}
              </button>
              <button className="jsgen-btn" onClick={() => setPrompt("")}>Clear</button>
            </div>
            {error && <div className="jsgen-error">{error}</div>}
          </div>

          <div className="jsgen-panel code-panel">
            <div className="jsgen-panel-header">
              <span>Generated Code ({language})</span>
              <div className="jsgen-panel-actions">
                {language === "javascript" && (
                  <button className="jsgen-btn" onClick={runCode}>Run</button>
                )}
                {availableCompilers.map((cmp, idx) => (
                  <button key={idx} className="jsgen-btn" onClick={() => openCompiler(cmp.url)}>
                    Copy & Open {cmp.label}
                  </button>
                ))}
              </div>
            </div>
            <ActionButtons limitButtons promptText={code} />
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
            />
          </div>
        </div>

        {language === "javascript" && (
          <div className="jsgen-panel">
            <div className="jsgen-panel-header">Program Output</div>
            <div className="jsgen-output" ref={outputRef}>
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
