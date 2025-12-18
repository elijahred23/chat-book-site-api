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
const DIFFICULTY_RANK = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};
const PROBLEMS = Object.values(problemModules)
  .map((m) => m.default ?? m)
  .filter(Boolean)
  .sort((a, b) => {
    const ra = DIFFICULTY_RANK[a.difficulty] ?? 99;
    const rb = DIFFICULTY_RANK[b.difficulty] ?? 99;
    if (ra !== rb) return ra - rb;
    return (a.title || "").localeCompare(b.title || "");
  });

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

function validateTrapResult({ height, result, expect }) {
  if (typeof result !== "number" || Number.isNaN(result)) return { ok: false, reason: "Expected a number" };
  if (result !== expect) return { ok: false, reason: `Expected ${expect} but got ${result}` };
  if (result < 0) return { ok: false, reason: "Water cannot be negative" };
  if (height.length < 3 && result !== 0) return { ok: false, reason: "Expected 0 when fewer than 3 bars" };
  return { ok: true };
}

function validateBooleanResult({ result, expect }) {
  if (typeof result !== "boolean") return { ok: false, reason: "Expected a boolean (true/false)" };
  if (result !== expect) return { ok: false, reason: `Expected ${expect} but got ${result}` };
  return { ok: true };
}

function validateLengthResult({ s, result, expect }) {
  if (typeof result !== "number" || Number.isNaN(result)) return { ok: false, reason: "Expected a number" };
  if (!Number.isInteger(result)) return { ok: false, reason: "Expected an integer length" };
  if (result < 0) return { ok: false, reason: "Length cannot be negative" };
  if (result > s.length) return { ok: false, reason: "Length cannot exceed string length" };
  if (result !== expect) return { ok: false, reason: `Expected ${expect} but got ${result}` };
  return { ok: true };
}

function makeListFromArray(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const head = { value: values[0], val: values[0], next: null };
  let current = head;
  for (let i = 1; i < values.length; i++) {
    const node = { value: values[i], val: values[i], next: null };
    current.next = node;
    current = node;
  }
  return head;
}

function makeListFromArrayWithCycle(values, pos) {
  if (!Array.isArray(values) || values.length === 0) return { head: null, nodes: [] };
  const nodes = values.map((v) => ({ value: v, val: v, next: null }));
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
  const head = nodes[0];
  if (Number.isInteger(pos) && pos >= 0 && pos < nodes.length) {
    nodes[nodes.length - 1].next = nodes[pos];
  }
  return { head, nodes };
}

function listToArray(head, maxNodes = 1000) {
  const out = [];
  let current = head;
  let steps = 0;
  while (current && steps < maxNodes) {
    out.push(current.val ?? current.value);
    current = current.next;
    steps++;
  }
  return { values: out, truncated: Boolean(current) };
}

function validateReverseListResult({ inputList, resultHead, expect }) {
  if (inputList.length === 0) {
    const ok = resultHead === null;
    return { ok, reason: ok ? null : "Expected null for empty list" };
  }

  const { values, truncated } = listToArray(resultHead, Math.max(10, expect.length + 5));
  if (truncated) return { ok: false, reason: "Output list looks cyclic or too long" };
  if (values.length !== expect.length) return { ok: false, reason: `Expected length ${expect.length} but got ${values.length}` };
  for (let i = 0; i < expect.length; i++) {
    if (values[i] !== expect[i]) return { ok: false, reason: `Mismatch at index ${i}: expected ${expect[i]} but got ${values[i]}` };
  }
  return { ok: true };
}

function makeMultiLevelDoublyList(items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const nodes = items.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const value = item.value ?? item.val;
      return {
        value,
        val: value,
        next: null,
        prev: null,
        previous: null,
        child: makeMultiLevelDoublyList(item.child ?? []),
      };
    }
    return { value: item, val: item, next: null, prev: null, previous: null, child: null };
  });

  for (let i = 0; i < nodes.length; i++) {
    const prev = i > 0 ? nodes[i - 1] : null;
    const next = i < nodes.length - 1 ? nodes[i + 1] : null;
    nodes[i].prev = prev;
    nodes[i].previous = prev;
    nodes[i].next = next;
  }

  return nodes[0];
}

function validateFlattenResult({ resultHead, expect }) {
  if (expect.length === 0) {
    const ok = resultHead === null;
    return { ok, reason: ok ? null : "Expected null for empty list" };
  }

  if (!resultHead) return { ok: false, reason: "Expected a list head, got null" };

  const out = [];
  let current = resultHead;
  let prev = null;
  let steps = 0;
  const maxNodes = Math.max(20, expect.length + 10);

  while (current && steps < maxNodes) {
    if (current.child) return { ok: false, reason: "Child pointer was not cleared (expected all child = null)" };

    const currentPrev = current.prev ?? current.previous ?? null;
    if (currentPrev !== prev) return { ok: false, reason: "Prev pointer mismatch while traversing flattened list" };

    if (prev && prev.next !== current) return { ok: false, reason: "Next pointer mismatch while traversing flattened list" };

    out.push(current.val ?? current.value);
    prev = current;
    current = current.next;
    steps++;
  }

  if (current) return { ok: false, reason: "Output list looks cyclic or too long" };
  if (out.length !== expect.length) return { ok: false, reason: `Expected length ${expect.length} but got ${out.length}` };
  for (let i = 0; i < expect.length; i++) {
    if (out[i] !== expect[i]) return { ok: false, reason: `Mismatch at index ${i}: expected ${expect[i]} but got ${out[i]}` };
  }
  return { ok: true };
}

function validateCycleStartResult({ nodes, resultNode, expectPos }) {
  const expectedNode = Number.isInteger(expectPos) && expectPos >= 0 ? nodes[expectPos] : null;

  if (expectedNode === null) {
    const ok = resultNode === null;
    return { ok, reason: ok ? null : "Expected null (no cycle)" };
  }

  if (resultNode === null) return { ok: false, reason: "Expected a node, got null" };
  if (!nodes.includes(resultNode)) return { ok: false, reason: "Returned node is not a node from the original list" };
  if (resultNode !== expectedNode) {
    const gotIndex = nodes.indexOf(resultNode);
    return { ok: false, reason: `Expected cycle start index ${expectPos} but got ${gotIndex}` };
  }
  return { ok: true };
}

function compileSolution(code, functionName) {
  const wrapped = `"use strict";\n${code}\n;return (typeof ${functionName} === "function" ? ${functionName} : null);`;
  const fn = new Function(wrapped)();
  if (typeof fn !== "function") throw new Error(`Define a function named "${functionName}(...)".`);
  return fn;
}

export default function CodingProblems() {
  const hasProblems = PROBLEMS.length > 0;
  const [activeId, setActiveId] = useState(PROBLEMS[0]?.id ?? "");
  const active = useMemo(() => {
    if (!hasProblems) return null;
    return PROBLEMS.find((p) => p.id === activeId) || PROBLEMS[0];
  }, [activeId, hasProblems]);

  const storageKey = active ? `coding_problem_solution:${active.id}` : "coding_problem_solution:none";
  const [code, setCode] = useState(() => {
    if (!active) return "";
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
    if (!active) return;
    try {
      const saved = localStorage.getItem(storageKey);
      setCode(saved ?? active.starterCode);
    } catch {
      setCode(active.starterCode);
    }
    setRunOutput([]);
    setRunError("");
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, code);
    } catch {
      // ignore localStorage errors (private mode / quota / disabled)
    }
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
    } catch {
      // ignore Prism errors
    }
  }, [notesContainerEl, tab, active?.id]);

  const runAllTests = async () => {
    setRunning(true);
    setRunError("");
    setRunOutput([]);
    try {
      if (!active) throw new Error("No active problem.");
      const solve = compileSolution(code, active.functionName);
      const results = active.tests.map((t) => {
        let result;
        try {
          if (active.runner === "twoSum") {
            result = solve([...t.nums], t.target);
          } else if (active.runner === "containerMostWater") {
            result = solve([...t.height]);
          } else if (active.runner === "trappingRainwater") {
            result = solve([...t.height]);
          } else if (active.runner === "backspaceStringCompare") {
            result = solve(t.s, t.t);
          } else if (active.runner === "longestSubstringNoRepeat") {
            result = solve(t.s);
          } else if (active.runner === "almostPalindrome") {
            result = solve(t.s);
          } else if (active.runner === "reverseLinkedList") {
            const head = makeListFromArray(t.list);
            result = solve(head);
          } else if (active.runner === "reverseBetweenMN") {
            const head = makeListFromArray(t.list);
            result = solve(head, t.m, t.n);
          } else if (active.runner === "flattenMultiLevelDoubly") {
            const head = makeMultiLevelDoublyList(t.list);
            result = solve(head);
          } else if (active.runner === "linkedListCycleStart") {
            const built = makeListFromArrayWithCycle(t.list, t.pos);
            result = solve(built.head);
            result = { resultNode: result, nodes: built.nodes };
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

        if (active.runner === "trappingRainwater") {
          const validation = validateTrapResult({ height: t.height, result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "backspaceStringCompare") {
          const validation = validateBooleanResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "longestSubstringNoRepeat") {
          const validation = validateLengthResult({ s: t.s, result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "almostPalindrome") {
          const validation = validateBooleanResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "reverseLinkedList") {
          const validation = validateReverseListResult({ inputList: t.list, resultHead: result, expect: t.expect });
          const got = result === null ? null : listToArray(result, Math.max(10, t.expect.length + 5)).values;
          return { name: t.name, ok: validation.ok, got, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "reverseBetweenMN") {
          const validation = validateReverseListResult({ inputList: t.list, resultHead: result, expect: t.expect });
          const got = result === null ? null : listToArray(result, Math.max(10, t.expect.length + 5)).values;
          return { name: t.name, ok: validation.ok, got, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "flattenMultiLevelDoubly") {
          const validation = validateFlattenResult({ resultHead: result, expect: t.expect });
          const got = result === null ? null : listToArray(result, Math.max(20, t.expect.length + 10)).values;
          return { name: t.name, ok: validation.ok, got, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "linkedListCycleStart") {
          const { resultNode, nodes } = result || {};
          const validation = validateCycleStartResult({ nodes: nodes || [], resultNode: resultNode ?? null, expectPos: t.expectPos });
          const gotIndex = nodes && resultNode ? nodes.indexOf(resultNode) : (resultNode === null ? -1 : null);
          return { name: t.name, ok: validation.ok, got: gotIndex, want: t.expectPos, error: validation.ok ? null : validation.reason };
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

  const combinedConstraints = useMemo(() => (active ? active.constraintQuestions.join("\n") : ""), [active]);
  const combinedWalkthrough = useMemo(() => (active ? active.walkthrough.map((w) => `${w.title}\n${w.body}`).join("\n\n") : ""), [active]);

  if (!active) {
    return (
      <div style={{ padding: 20 }}>
        No problems found. Add JSON files to <code>src/code_problems/</code>.
      </div>
    );
  }

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
            <ActionButtons limitButtons promptText={`${active.title}\n\n${active.prompt}`} />
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
                    <ActionButtons limitButtons promptText={combinedConstraints} />
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
                    <ActionButtons limitButtons promptText={combinedWalkthrough} />
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
                    <ActionButtons limitButtons promptText={stableStringify(active.tests)} />
                  </div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {active.tests.map((t) => (
                      <div key={t.name} className="cp-q" style={{ background: "#fff" }}>
                        <div style={{ fontWeight: 900 }}>{t.name}</div>
                        {active.runner === "twoSum" ? (
                          <div className="cp-muted">
                            nums: {stableStringify(t.nums)} | target: {t.target}
                          </div>
                        ) : active.runner === "backspaceStringCompare" ? (
                          <div className="cp-muted">
                            s: {stableStringify(t.s)} | t: {stableStringify(t.t)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "longestSubstringNoRepeat" ? (
                          <div className="cp-muted">
                            s: {stableStringify(t.s)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "almostPalindrome" ? (
                          <div className="cp-muted">
                            s: {stableStringify(t.s)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "reverseLinkedList" ? (
                          <div className="cp-muted">
                            list: {stableStringify(t.list)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "reverseBetweenMN" ? (
                          <div className="cp-muted">
                            list: {stableStringify(t.list)} | m: {t.m} | n: {t.n} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "flattenMultiLevelDoubly" ? (
                          <div className="cp-muted">
                            list: {stableStringify(t.list)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "linkedListCycleStart" ? (
                          <div className="cp-muted">
                            list: {stableStringify(t.list)} | pos: {t.pos} | expectedPos: {t.expectPos}
                          </div>
                        ) : (
                          <div className="cp-muted">
                            height: {stableStringify(t.height)} | expected: {t.expect}
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
