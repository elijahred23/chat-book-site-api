import React, { useEffect, useMemo, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";
import ActionButtons from "./ui/ActionButtons.jsx";
import "./CodingProblems.css";

const problemModules = import.meta.glob("./code_problems/*.json", { eager: true });
const PROBLEMS = Object.values(problemModules)
  .map((m) => m.default ?? m)
  .filter(Boolean)
  .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

function stableStringify(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return JSON.stringify(value, null, 2);
  return JSON.stringify(value, Object.keys(value).sort(), 2);
}

function validateTwoSumResult({ nums, target, result }) {
  if (result === null) return { ok: false, reason: "Returned null" };
  if (!Array.isArray(result) || result.length !== 2) {
    return { ok: false, reason: "Expected an array [i, j]" };
  }
  const [i, j] = result;
  if (!Number.isInteger(i) || !Number.isInteger(j)) return { ok: false, reason: "Indices must be integers" };
  if (i === j) return { ok: false, reason: "Indices must be distinct" };
  if (i < 0 || j < 0 || i >= nums.length || j >= nums.length) return { ok: false, reason: "Index out of bounds" };
  if (nums[i] + nums[j] !== target) return { ok: false, reason: `nums[i] + nums[j] != target (${nums[i]} + ${nums[j]} != ${target})` };
  return { ok: true };
}

function validateMaxAreaResult({ height, result, expect }) {
  if (typeof result !== "number" || Number.isNaN(result)) return { ok: false, reason: "Expected a number" };
  if (result !== expect) return { ok: false, reason: `Expected ${expect} but got ${result}` };
  if (result < 0) return { ok: false, reason: "Area cannot be negative" };
  if (height.length < 2 && result !== 0) return { ok: false, reason: "Expected 0 when fewer than 2 lines" };
  return { ok: true };
}

function compileSolution(code, functionName) {
  const wrapped = `"use strict";\n${code}\n;return (typeof ${functionName} === "function" ? ${functionName} : null);`;
  // eslint-disable-next-line no-new-func
  const fn = new Function(wrapped)();
  if (typeof fn !== "function") throw new Error(`Define a function named "${functionName}(...)".`);
  return fn;
}

export default function CodingProblems() {
  const [activeId, setActiveId] = useState(PROBLEMS[0]?.id);
  const active = useMemo(() => PROBLEMS.find((p) => p.id === activeId) || PROBLEMS[0], [activeId]);
  if (!active) {
    return (
      <div style={{ padding: 20 }}>
        No problems found. Add JSON files to `src/code_problems/`.
      </div>
    );
  }

  const storageKey = `coding_problem_solution:${active.id}`;
  const [code, setCode] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ?? active.starterCode;
    } catch {
      return active.starterCode;
    }
  });
  const [tab, setTab] = useState("solve"); // solve | info
  const [runOutput, setRunOutput] = useState([]);
  const [runError, setRunError] = useState("");
  const [running, setRunning] = useState(false);
  const [notesContainerEl, setNotesContainerEl] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setCode(saved ?? active.starterCode);
    } catch {
      setCode(active.starterCode);
    }
    setRunOutput([]);
    setRunError("");
  }, [active.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, code);
    } catch {}
  }, [storageKey, code]);

  useEffect(() => {
    // If the user edits code after running tests, clear results until re-run.
    if (runOutput.length || runError) {
      setRunOutput([]);
      setRunError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (!notesContainerEl) return;
    if (tab !== "info") return;
    try {
      Prism.highlightAllUnder(notesContainerEl);
    } catch {}
  }, [notesContainerEl, tab, active.id]);

  const runAllTests = async () => {
    setRunning(true);
    setRunError("");
    setRunOutput([]);
    try {
      const solve = compileSolution(code, active.functionName);
      const results = active.tests.map((t) => {
        let result;
        try {
          if (active.runner === "twoSum") {
            result = solve([...t.nums], t.target);
          } else if (active.runner === "containerMostWater") {
            result = solve([...t.height]);
          } else {
            throw new Error("No runner configured for this problem yet.");
          }
        } catch (err) {
          return { name: t.name, ok: false, error: `Runtime error: ${err.message}` };
        }

        if (active.runner === "twoSum") {
          if (t.expect === null) {
            const ok = result === null;
            return { name: t.name, ok, got: result, want: null, error: ok ? null : "Expected null" };
          }
          const validation = validateTwoSumResult({ nums: t.nums, target: t.target, result });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "containerMostWater") {
          const validation = validateMaxAreaResult({ height: t.height, result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        return { name: t.name, ok: false, got: result, want: t.expect, error: "Unknown problem validator" };
      });
      setRunOutput(results);
    } catch (err) {
      setRunError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const combinedConstraints = useMemo(() => active.constraintQuestions.join("\n"), [active]);
  const combinedWalkthrough = useMemo(() => active.walkthrough.map((w) => `${w.title}\n${w.body}`).join("\n\n"), [active]);

  return (
    <div className="cp-page">
      <div className="cp-shell">
        <div className="cp-header">
          <div className="cp-row">
            <div>
              <h2 style={{ margin: 0 }}>Coding Problems</h2>
              <div className="cp-muted" style={{ marginTop: 4 }}>
                Practice a structured interview approach: constraints → tests → logic → code → walkthrough → complexity.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label className="cp-muted" style={{ fontWeight: 800 }}>Problem</label>
              <select
                className="cp-select"
                value={active.id}
                onChange={(e) => setActiveId(e.target.value)}
              >
                {PROBLEMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.difficulty}
                  </option>
                ))}
              </select>
            </div>
            <div className="cp-tabs">
              <button className={`cp-tab ${tab === "solve" ? "active" : ""}`} onClick={() => setTab("solve")}>
                Solve
              </button>
              <button className={`cp-tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>
                Notes
              </button>
            </div>
          </div>
        </div>

        <div className="cp-grid">
          <div className="cp-card">
            <div className="cp-row">
              <div>
                <h3 style={{ margin: 0 }}>{active.title}</h3>
                <div className="cp-muted" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                  {active.prompt}
                </div>
              </div>
              <ActionButtons promptText={`${active.title}\n\n${active.prompt}`} />
            </div>

            {tab === "solve" ? (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div className="cp-row">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button className="cp-btn" onClick={runAllTests} disabled={running}>
                      {running ? "Running..." : "Run Tests"}
                    </button>
                    <button className="cp-btn secondary" onClick={() => setCode(active.starterCode)}>
                      Reset Code
                    </button>
                  </div>
                  <span className="cp-muted">Saved automatically to localStorage</span>
                </div>

                <div className="cp-editor">
                  <Editor
                    value={code}
                    onValueChange={setCode}
                    highlight={(input) => Prism.highlight(input, Prism.languages.javascript, "javascript")}
                    padding={14}
                    textareaId="coding-editor"
                    className="prism-code"
                    style={{
                      minHeight: 320,
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      fontSize: 13,
                      background: "#ffffff",
                      color: "#0f172a",
                    }}
                  />
                </div>

                {(runError || runOutput.length > 0) && (
                  <div className="cp-output">
                    {runError && <div style={{ color: "#fecaca" }}>Error: {runError}</div>}
                    {runOutput.map((r, idx) => (
                      <div key={idx} style={{ marginTop: idx ? 10 : 0 }}>
                        <div style={{ fontWeight: 900 }}>
                          {r.ok ? "✅" : "❌"} {r.name}
                        </div>
                        {r.error && <div style={{ color: "#fecaca" }}>{r.error}</div>}
                        {"got" in r && (
                          <div style={{ opacity: 0.95 }}>
                            got: {stableStringify(r.got)} | expected: {stableStringify(r.want)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div ref={setNotesContainerEl} style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <div className="cp-card" style={{ padding: 0, boxShadow: "none", border: "none", background: "transparent" }}>
                  <div className="cp-row">
                    <h4 style={{ margin: 0 }}>Constraint Verification (ask first)</h4>
                    <ActionButtons promptText={combinedConstraints} />
                  </div>
                  <div className="cp-kv" style={{ marginTop: 8 }}>
                    {active.constraintQuestions.map((q) => (
                      <div key={q} className="cp-q">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cp-card" style={{ padding: 0, boxShadow: "none", border: "none", background: "transparent" }}>
                  <div className="cp-row">
                    <h4 style={{ margin: 0 }}>Walkthrough + Complexity</h4>
                    <ActionButtons promptText={combinedWalkthrough} />
                  </div>
                  <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                    {active.walkthrough.map((w) => (
                      <div key={w.title} className="cp-q" style={{ background: "#f8fafc" }}>
                        <div style={{ fontWeight: 900, marginBottom: 6 }}>{w.title}</div>
                        {w.codeLanguage ? (
                          <pre className="cp-codeblock">
                            <code className={`language-${w.codeLanguage}`}>{w.body}</code>
                          </pre>
                        ) : (
                          <div style={{ whiteSpace: "pre-wrap" }}>{w.body}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cp-card" style={{ padding: 0, boxShadow: "none", border: "none", background: "transparent" }}>
                  <div className="cp-row">
                    <h4 style={{ margin: 0 }}>Test Cases</h4>
                    <ActionButtons promptText={stableStringify(active.tests)} />
                  </div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {active.tests.map((t) => (
                      <div key={t.name} className="cp-q" style={{ background: "#fff" }}>
                        <div style={{ fontWeight: 900 }}>{t.name}</div>
                        {active.runner === "twoSum" ? (
                          <div className="cp-muted">
                            nums: {stableStringify(t.nums)} | target: {t.target}
                          </div>
                        ) : (
                          <div className="cp-muted">
                            height: {stableStringify(t.height)} | expected area: {t.expect}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
