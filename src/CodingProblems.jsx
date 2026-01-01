import React, { useEffect, useMemo, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";
import ActionButtons from "./ui/ActionButtons.jsx";
import { useFlyout } from "./context/FlyoutContext";
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

function validateNumberResult({ result, expect }) {
  if (typeof result !== "number" || Number.isNaN(result)) return { ok: false, reason: "Expected a number" };
  if (result !== expect) return { ok: false, reason: `Expected ${expect} but got ${result}` };
  return { ok: true };
}

function validateRangeResult({ result, expect }) {
  if (!Array.isArray(result) || result.length !== 2) {
    return { ok: false, reason: "Expected an array of two indices" };
  }
  const [a, b] = result;
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    return { ok: false, reason: "Indices must be integers" };
  }
  if (!Array.isArray(expect) || expect.length !== 2) {
    return { ok: false, reason: "Test expects an array of two indices" };
  }
  if (a !== expect[0] || b !== expect[1]) {
    return { ok: false, reason: `Expected [${expect[0]}, ${expect[1]}] but got [${a}, ${b}]` };
  }
  return { ok: true };
}

function validateLevelOrderResult({ result, expect }) {
  if (!Array.isArray(result)) return { ok: false, reason: "Expected an array of levels" };
  if (!Array.isArray(expect)) return { ok: false, reason: "Test expects an array of levels" };
  if (result.length !== expect.length) {
    return { ok: false, reason: `Expected ${expect.length} levels but got ${result.length}` };
  }
  for (let i = 0; i < expect.length; i++) {
    const level = result[i];
    const expectedLevel = expect[i];
    if (!Array.isArray(level) || !Array.isArray(expectedLevel)) {
      return { ok: false, reason: `Expected level ${i} to be an array` };
    }
    if (level.length !== expectedLevel.length) {
      return { ok: false, reason: `Level ${i} expected length ${expectedLevel.length} but got ${level.length}` };
    }
    for (let j = 0; j < expectedLevel.length; j++) {
      if (level[j] !== expectedLevel[j]) {
        return { ok: false, reason: `Level ${i} mismatch at index ${j}: expected ${expectedLevel[j]} but got ${level[j]}` };
      }
    }
  }
  return { ok: true };
}

function validateArrayResult({ result, expect }) {
  if (!Array.isArray(result)) return { ok: false, reason: "Expected an array" };
  if (!Array.isArray(expect)) return { ok: false, reason: "Test expects an array" };
  if (result.length !== expect.length) {
    return { ok: false, reason: `Expected length ${expect.length} but got ${result.length}` };
  }
  for (let i = 0; i < expect.length; i++) {
    if (result[i] !== expect[i]) {
      return { ok: false, reason: `Mismatch at index ${i}: expected ${expect[i]} but got ${result[i]}` };
    }
  }
  return { ok: true };
}

function validateMatrixResult({ result, expect }) {
  if (!Array.isArray(result)) return { ok: false, reason: "Expected a matrix (array of arrays)" };
  if (!Array.isArray(expect)) return { ok: false, reason: "Test expects a matrix (array of arrays)" };
  if (result.length !== expect.length) {
    return { ok: false, reason: `Expected ${expect.length} rows but got ${result.length}` };
  }
  for (let r = 0; r < expect.length; r++) {
    const row = result[r];
    const expectedRow = expect[r];
    if (!Array.isArray(row) || !Array.isArray(expectedRow)) {
      return { ok: false, reason: `Row ${r} is not an array` };
    }
    if (row.length !== expectedRow.length) {
      return { ok: false, reason: `Row ${r} expected length ${expectedRow.length} but got ${row.length}` };
    }
    for (let c = 0; c < expectedRow.length; c++) {
      if (row[c] !== expectedRow[c]) {
        return { ok: false, reason: `Mismatch at row ${r}, col ${c}: expected ${expectedRow[c]} but got ${row[c]}` };
      }
    }
  }
  return { ok: true };
}

function minParenthesesRemovals(s) {
  let open = 0;
  let remove = 0;
  for (const ch of s) {
    if (ch === "(") open++;
    else if (ch === ")") {
      if (open > 0) open--;
      else remove++;
    }
  }
  return remove + open;
}

function isValidParenthesesString(s) {
  let open = 0;
  for (const ch of s) {
    if (ch === "(") open++;
    else if (ch === ")") {
      if (open === 0) return false;
      open--;
    }
  }
  return open === 0;
}

function isSubsequence(full, candidate) {
  let i = 0;
  let j = 0;
  while (i < full.length && j < candidate.length) {
    if (full[i] === candidate[j]) j++;
    i++;
  }
  return j === candidate.length;
}

function validateMinRemoveResult({ s, result, minRemoved }) {
  if (typeof result !== "string") return { ok: false, reason: "Expected a string" };
  if (!isValidParenthesesString(result)) return { ok: false, reason: "Result has invalid parentheses" };
  if (!isSubsequence(s, result)) return { ok: false, reason: "Result is not a subsequence of input" };
  const lettersIn = s.replace(/[()]/g, "");
  const lettersOut = result.replace(/[()]/g, "");
  if (lettersIn !== lettersOut) return { ok: false, reason: "Result must keep all non-bracket characters" };
  const minRemove = minParenthesesRemovals(s);
  if (Number.isInteger(minRemoved) && minRemoved !== minRemove) {
    return { ok: false, reason: `Test expects ${minRemoved} removals but input requires ${minRemove}` };
  }
  const parensIn = (s.match(/[()]/g) || []).length;
  const parensOut = (result.match(/[()]/g) || []).length;
  const removed = parensIn - parensOut;
  if (removed !== minRemove) {
    return { ok: false, reason: `Expected ${minRemove} bracket removals but got ${removed}` };
  }
  return { ok: true };
}

function normalizeQueueOutput(value) {
  return value === undefined ? null : value;
}

function runQueueOps(QueueClass, ops = [], args = []) {
  let instance = null;
  const outputs = [];

  ops.forEach((op, index) => {
    const input = Array.isArray(args[index]) ? args[index] : [];
    if (index === 0) {
      instance = new QueueClass(...input);
      outputs.push(null);
      return;
    }

    if (!instance || typeof instance[op] !== "function") {
      throw new Error(`Missing method "${op}" on queue instance`);
    }
    const result = instance[op](...input);
    outputs.push(normalizeQueueOutput(result));
  });

  return outputs;
}

function runTrieOps(TrieClass, ops = [], args = []) {
  let instance = null;
  const outputs = [];

  ops.forEach((op, index) => {
    const input = Array.isArray(args[index]) ? args[index] : [];
    if (index === 0) {
      instance = new TrieClass(...input);
      outputs.push(null);
      return;
    }

    if (!instance || typeof instance[op] !== "function") {
      throw new Error(`Missing method "${op}" on trie instance`);
    }
    const result = instance[op](...input);
    outputs.push(normalizeQueueOutput(result));
  });

  return outputs;
}

function cloneBoard(board) {
  if (!Array.isArray(board)) return [];
  return board.map((row) => (Array.isArray(row) ? [...row] : []));
}

function validateQueueOpsResult({ result, expect }) {
  if (!Array.isArray(result)) return { ok: false, reason: "Expected an array of outputs" };
  if (!Array.isArray(expect)) return { ok: false, reason: "Expected test to provide an output array" };
  if (result.length !== expect.length) {
    return { ok: false, reason: `Expected ${expect.length} outputs but got ${result.length}` };
  }
  for (let i = 0; i < expect.length; i++) {
    if (result[i] !== expect[i]) {
      return { ok: false, reason: `Output mismatch at index ${i}: expected ${expect[i]} but got ${result[i]}` };
    }
  }
  return { ok: true };
}

function validateTrieOpsResult({ result, expect }) {
  if (!Array.isArray(result)) return { ok: false, reason: "Expected an array of outputs" };
  if (!Array.isArray(expect)) return { ok: false, reason: "Expected test to provide an output array" };
  if (result.length !== expect.length) {
    return { ok: false, reason: `Expected ${expect.length} outputs but got ${result.length}` };
  }
  for (let i = 0; i < expect.length; i++) {
    if (result[i] !== expect[i]) {
      return { ok: false, reason: `Output mismatch at index ${i}: expected ${stableStringify(expect[i])} but got ${stableStringify(result[i])}` };
    }
  }
  return { ok: true };
}

function boardsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const rowA = a[i];
    const rowB = b[i];
    if (!Array.isArray(rowA) || !Array.isArray(rowB) || rowA.length !== rowB.length) return false;
    for (let j = 0; j < rowA.length; j++) {
      if (String(rowA[j]) !== String(rowB[j])) return false;
    }
  }
  return true;
}

function boardHasDots(board) {
  return board.some((row) => row.some((cell) => cell === "." || cell === null || cell === undefined));
}

function isSudokuValid(board) {
  if (!Array.isArray(board) || board.length !== 9) return false;
  const rows = Array.from({ length: 9 }, () => new Set());
  const cols = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());

  for (let r = 0; r < 9; r++) {
    const row = board[r];
    if (!Array.isArray(row) || row.length !== 9) return false;
    for (let c = 0; c < 9; c++) {
      const val = String(row[c]);
      if (!/[1-9]/.test(val)) return false;
      const boxId = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      if (rows[r].has(val) || cols[c].has(val) || boxes[boxId].has(val)) return false;
      rows[r].add(val);
      cols[c].add(val);
      boxes[boxId].add(val);
    }
  }
  return true;
}

function validateSudokuResult({ original, resultBoard, expect, solvable = true }) {
  if (!Array.isArray(resultBoard)) return { ok: false, reason: "Expected board to be a 2D array" };

  if (!solvable) {
    const unchanged = boardsEqual(original, resultBoard);
    return { ok: unchanged, reason: unchanged ? null : "Unsolvable board should remain unchanged" };
  }

  if (expect && !boardsEqual(resultBoard, expect)) {
    return { ok: false, reason: "Solved board does not match expected solution" };
  }

  if (boardHasDots(resultBoard)) return { ok: false, reason: "Board still has empty cells" };
  if (!isSudokuValid(resultBoard)) return { ok: false, reason: "Board violates Sudoku rules" };
  return { ok: true };
}

function runMonarchyOps(MonarchyClass, ops = [], args = []) {
  let instance = null;
  const outputs = [];

  ops.forEach((op, index) => {
    const input = Array.isArray(args[index]) ? args[index] : [];
    if (index === 0) {
      instance = new MonarchyClass(...input);
      outputs.push(null);
      return;
    }

    if (!instance || typeof instance[op] !== "function") {
      throw new Error(`Missing method "${op}" on monarchy instance`);
    }
    const result = instance[op](...input);
    outputs.push(normalizeQueueOutput(result));
  });

  return outputs;
}

function valuesEqual(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  return a === b;
}

function validateMonarchyOpsResult({ result, expect }) {
  if (!Array.isArray(result)) return { ok: false, reason: "Expected an array of outputs" };
  if (!Array.isArray(expect)) return { ok: false, reason: "Expected test to provide an output array" };
  if (result.length !== expect.length) {
    return { ok: false, reason: `Expected ${expect.length} outputs but got ${result.length}` };
  }

  for (let i = 0; i < expect.length; i++) {
    if (valuesEqual(result[i], expect[i])) continue;
    return { ok: false, reason: `Output mismatch at index ${i}: expected ${stableStringify(expect[i])} but got ${stableStringify(result[i])}` };
  }
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

function makeBinaryTree(values = []) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const nodes = values.map((v) => (v === null ? null : { value: v, val: v, left: null, right: null }));
  let childIndex = 1;
  for (let i = 0; i < nodes.length && childIndex < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;
    node.left = nodes[childIndex] ?? null;
    childIndex += 1;
    if (childIndex < nodes.length) {
      node.right = nodes[childIndex] ?? null;
      childIndex += 1;
    }
  }
  return nodes[0];
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

function shuffleLines(lines) {
  const copy = [...lines];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function CodeScramble({ code = "", scrambleKey }) {
  const originalLines = useMemo(
    () => code.split("\n").filter((line) => line.trim() !== ""),
    [code]
  );
  const [playing, setPlaying] = useState(false);
  const [lines, setLines] = useState([]);
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();

  const startGame = () => {
    const scrambled = shuffleLines(originalLines);
    // If shuffle returns same order, shuffle again
    if (scrambled.join("\n") === originalLines.join("\n")) {
      setLines(shuffleLines(originalLines));
    } else {
      setLines(scrambled);
    }
    setPlaying(true);
    setFeedback("");
  };

  const moveLine = (index, delta) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= lines.length) return;
    const updated = [...lines];
    [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
    setLines(updated);
  };

  const checkAnswer = () => {
    const success = lines.join("\n") === originalLines.join("\n");
    setFeedback(success ? "✅ Nailed it!" : "❌ Keep shuffling!");
    showMessage?.({
      type: success ? "success" : "error",
      message: success ? "Correct order! Nice job." : "Not yet—reorder the lines and try again.",
      duration: 2000,
    });
  };

  const resetGame = () => {
    setPlaying(false);
    setLines([]);
    setFeedback("");
  };

  if (!originalLines.length) return null;

  return (
    <div className="cp-card" style={{ padding: "10px", background: "#f8fafc", border: "1px dashed #e2e8f0" }} key={scrambleKey}>
      {!playing ? (
        <button className="cp-btn" onClick={startGame} style={{ width: "100%", justifyContent: "center" }}>
          Play Code Unscramble
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="cp-btn" onClick={checkAnswer}>Check</button>
            <button className="cp-btn secondary" onClick={startGame}>Reshuffle</button>
            <button className="cp-btn secondary" onClick={resetGame}>Close Game</button>
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>Tap arrows to reorder lines. Goal: match the original code.</div>
          <div style={{ display: "grid", gap: 6 }}>
            {lines.map((line, idx) => (
              <div key={`${scrambleKey}-${idx}`} style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
                  <button
                    className="cp-btn secondary"
                    style={{ padding: "2px", width: 28, height: 24, lineHeight: 1 }}
                    onClick={() => moveLine(idx, -1)}
                    aria-label="Move line up"
                  >
                    ▲
                  </button>
                  <button
                    className="cp-btn secondary"
                    style={{ padding: "2px", width: 28, height: 24, lineHeight: 1 }}
                    onClick={() => moveLine(idx, 1)}
                    aria-label="Move line down"
                  >
                    ▼
                  </button>
                </div>
                <pre style={{ margin: 0, flex: 1, background: "#0f172a", color: "#e2e8f0", padding: "6px 8px", borderRadius: 8, overflowX: "auto" }}>
                  <code style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{line || "\u00A0"}</code>
                </pre>
              </div>
            ))}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}

function CodeLineGuess({ code = "", gameKey }) {
  const lines = useMemo(() => code.split("\n").filter((l) => l.trim() !== ""), [code]);
  const [playing, setPlaying] = useState(false);
  const [missingIndex, setMissingIndex] = useState(null);
  const [options, setOptions] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();

  if (lines.length < 3) return null;

  const startRound = () => {
    const idx = Math.floor(Math.random() * lines.length);
    const answer = lines[idx];
    const distractorsPool = lines.filter((_, i) => i !== idx);
    const distractors = shuffleLines(distractorsPool).slice(0, Math.min(2, distractorsPool.length));
    const opts = shuffleLines([answer, ...distractors]);
    setMissingIndex(idx);
    setOptions(opts);
    setChosen(null);
    setFeedback("");
    setPlaying(true);
  };

  const checkChoice = (opt) => {
    if (!playing || missingIndex === null) return;
    setChosen(opt);
    const correct = opt === lines[missingIndex];
    setFeedback(correct ? "✅ Correct line!" : "❌ Try another line.");
    showMessage?.({
      type: correct ? "success" : "error",
      message: correct ? "Nice! You picked the right line." : "Not quite—pick another or reshuffle.",
      duration: 2000,
    });
  };

  const renderWithBlank = () =>
    lines.map((line, idx) =>
      idx === missingIndex ? "/* ??? */" : line
    ).join("\n");

  return (
    <div className="cp-card" style={{ padding: "10px", background: "#eef2ff", border: "1px dashed #cbd5f5" }} key={gameKey}>
      {!playing ? (
        <button className="cp-btn" onClick={startRound} style={{ width: "100%", justifyContent: "center" }}>
          Play Missing Line
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="cp-btn" onClick={startRound}>New Round</button>
            <button className="cp-btn secondary" onClick={() => setPlaying(false)}>Close Game</button>
          </div>
          <div className="cp-codeblock" style={{ margin: 0, background: "#0b122a", color: "#e2e8f0" }}>
            <pre style={{ margin: 0 }}>
              <code style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{renderWithBlank()}</code>
            </pre>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {options.map((opt, idx) => {
              const isChosen = chosen === opt;
              const isCorrect = opt === lines[missingIndex];
              const bg = !isChosen ? "#fff" : isCorrect ? "#dcfce7" : "#fee2e2";
              const border = !isChosen ? "#e2e8f0" : isCorrect ? "#22c55e" : "#ef4444";
              return (
                <button
                  key={`${gameKey}-opt-${idx}`}
                  onClick={() => checkChoice(opt)}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: bg,
                    border: `1px solid ${border}`,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 12,
                    color: "#0f172a",
                    cursor: "pointer",
                    minHeight: 40,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}

function CodeWordFill({ code = "", gameKey }) {
  const lines = useMemo(() => code.split("\n").filter((l) => l.trim() !== ""), [code]);
  const [playing, setPlaying] = useState(false);
  const [lineIndex, setLineIndex] = useState(null);
  const [wordOptions, setWordOptions] = useState([]);
  const [targetWord, setTargetWord] = useState("");
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();

  const pickLineWithWord = () => {
    const candidates = lines
      .map((line, idx) => {
        const tokens = line.trim().split(/\s+/).filter(Boolean);
        return { line, idx, tokens };
      })
      .filter((entry) => entry.tokens.length > 1);
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const start = () => {
    const entry = pickLineWithWord();
    if (!entry) return;
    const { line, idx, tokens } = entry;
    const target = tokens[Math.floor(Math.random() * tokens.length)];
    const otherWords = lines
      .join(" ")
      .split(/\s+/)
      .filter((w) => w && w !== target);
    const distractors = shuffleLines(otherWords).filter((w, i, arr) => arr.indexOf(w) === i).slice(0, 2);
    const opts = shuffleLines([target, ...distractors]);
    setLineIndex(idx);
    setTargetWord(target);
    setWordOptions(opts);
    setFeedback("");
    setPlaying(true);
  };

  const check = (choice) => {
    const correct = choice === targetWord;
    setFeedback(correct ? "✅ Right word!" : "❌ Not that one.");
    showMessage?.({
      type: correct ? "success" : "error",
      message: correct ? "Nice pick!" : "Try another option.",
      duration: 2000,
    });
  };

  if (lines.length < 2) return null;

  const renderLine = () => {
    if (lineIndex === null) return "";
    const parts = lines[lineIndex].split(/\s+/);
    return parts
      .map((word) => (word === targetWord ? "____" : word))
      .join(" ");
  };

  return (
    <div className="cp-card" style={{ padding: "10px", background: "#ecfeff", border: "1px dashed #bae6fd" }} key={gameKey}>
      {!playing ? (
        <button className="cp-btn" onClick={start} style={{ width: "100%", justifyContent: "center" }}>
          Play Word Fill
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="cp-btn" onClick={start}>New Word</button>
            <button className="cp-btn secondary" onClick={() => setPlaying(false)}>Close Game</button>
          </div>
          <div className="cp-codeblock" style={{ margin: 0, background: "#0f172a", color: "#e2e8f0" }}>
            <pre style={{ margin: 0 }}>
              <code style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{renderLine()}</code>
            </pre>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {wordOptions.map((opt, idx) => (
              <button
                key={`${gameKey}-word-${idx}`}
                onClick={() => check(opt)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 12,
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}

function TextOrderGame({ text = "", gameKey }) {
  const sentences = useMemo(() => text.split("\n").map((l) => l.trim()).filter(Boolean), [text]);
  const [playing, setPlaying] = useState(false);
  const [items, setItems] = useState([]);
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();

  if (sentences.length < 2) return null;

  const start = () => {
    const scrambled = shuffleLines(sentences);
    setItems(scrambled.join("\n") === sentences.join("\n") ? shuffleLines(sentences) : scrambled);
    setFeedback("");
    setPlaying(true);
  };

  const move = (idx, delta) => {
    const next = idx + delta;
    if (next < 0 || next >= items.length) return;
    const updated = [...items];
    [updated[idx], updated[next]] = [updated[next], updated[idx]];
    setItems(updated);
  };

  const check = () => {
    const ok = items.join("\n") === sentences.join("\n");
    setFeedback(ok ? "✅ Great order!" : "❌ Needs tweaking.");
    showMessage?.({
      type: ok ? "success" : "error",
      message: ok ? "Perfect ordering!" : "Reorder the lines and try again.",
      duration: 2000,
    });
  };

  return (
    <div className="cp-card" style={{ padding: 10, background: "#fff7ed", border: "1px dashed #fed7aa" }} key={gameKey}>
      {!playing ? (
        <button className="cp-btn" onClick={start} style={{ width: "100%", justifyContent: "center" }}>
          Play Story Order
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="cp-btn" onClick={check}>Check</button>
            <button className="cp-btn secondary" onClick={start}>Reshuffle</button>
            <button className="cp-btn secondary" onClick={() => { setPlaying(false); setFeedback(""); }}>Close Game</button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {items.map((line, idx) => (
              <div key={`${gameKey}-text-${idx}`} style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
                  <button className="cp-btn secondary" style={{ padding: "2px", width: 26, height: 22, lineHeight: 1 }} onClick={() => move(idx, -1)} aria-label="Move up">▲</button>
                  <button className="cp-btn secondary" style={{ padding: "2px", width: 26, height: 22, lineHeight: 1 }} onClick={() => move(idx, 1)} aria-label="Move down">▼</button>
                </div>
                <div style={{ background: "#fff", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 10px", flex: 1, fontSize: 13 }}>
                  {line}
                </div>
              </div>
            ))}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}

function TextBlankGame({ text = "", gameKey }) {
  const lines = useMemo(() => text.split("\n").map((l) => l.trim()).filter(Boolean), [text]);
  const [playing, setPlaying] = useState(false);
  const [targetWord, setTargetWord] = useState("");
  const [line, setLine] = useState("");
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();

  if (lines.length < 1) return null;

  const start = () => {
    const pick = lines[Math.floor(Math.random() * lines.length)];
    const words = pick.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      setPlaying(false);
      return;
    }
    const target = words[Math.floor(Math.random() * words.length)];
    const pool = lines.join(" ").split(/\s+/).filter(Boolean).filter((w) => w !== target);
    const distractors = shuffleLines(pool).filter((w, i, arr) => arr.indexOf(w) === i).slice(0, 2);
    const opts = shuffleLines([target, ...distractors]);
    setLine(pick);
    setTargetWord(target);
    setOptions(opts);
    setFeedback("");
    setPlaying(true);
  };

  const check = (choice) => {
    const ok = choice === targetWord;
    setFeedback(ok ? "✅ Nice!" : "❌ Nope.");
    showMessage?.({
      type: ok ? "success" : "error",
      message: ok ? "Correct word!" : "Pick another option.",
      duration: 2000,
    });
  };

  const renderLine = () => line.split(/\s+/).map((w) => (w === targetWord ? "____" : w)).join(" ");

  return (
    <div className="cp-card" style={{ padding: 10, background: "#fefce8", border: "1px dashed #fde68a" }} key={gameKey}>
      {!playing ? (
        <button className="cp-btn" onClick={start} style={{ width: "100%", justifyContent: "center" }}>
          Play Word Blank
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="cp-btn" onClick={start}>New Blank</button>
            <button className="cp-btn secondary" onClick={() => setPlaying(false)}>Close Game</button>
          </div>
          <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 13 }}>{renderLine()}</div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {options.map((opt, idx) => (
              <button
                key={`${gameKey}-textblank-${idx}`}
                onClick={() => check(opt)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}

export default function CodingProblems() {
  const hasProblems = PROBLEMS.length > 0;
  const [activeId, setActiveId] = useState(() => {
    if (!hasProblems) return "";
    try {
      const saved = localStorage.getItem("coding_problem_active");
      if (saved && PROBLEMS.some((p) => p.id === saved)) return saved;
    } catch {
      // ignore localStorage failures
    }
    return PROBLEMS[0]?.id ?? "";
  });
  const active = useMemo(() => {
    if (!hasProblems) return null;
    return PROBLEMS.find((p) => p.id === activeId) || PROBLEMS[0];
  }, [activeId, hasProblems]);

  useEffect(() => {
    if (!activeId) return;
    try {
      localStorage.setItem("coding_problem_active", activeId);
    } catch {
      // ignore localStorage errors
    }
  }, [activeId]);

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
          } else if (active.runner === "validParentheses") {
            result = solve(t.s);
          } else if (active.runner === "minRemoveBrackets") {
            result = solve(t.s);
          } else if (active.runner === "queueWithStacks") {
            result = runQueueOps(solve, t.ops, t.args);
          } else if (active.runner === "trieOps") {
            result = runTrieOps(solve, t.ops, t.args);
          } else if (active.runner === "solveSudoku") {
            const board = cloneBoard(t.board);
            const ret = solve(board);
            result = { board, ret };
          } else if (active.runner === "monarchyInterface") {
            result = runMonarchyOps(solve, t.ops, t.args);
          } else if (active.runner === "kthLargestElement") {
            result = solve([...t.nums], t.k);
          } else if (active.runner === "binarySearch") {
            result = solve(t.nums, t.target);
          } else if (active.runner === "searchRange") {
            result = solve(t.nums, t.target);
          } else if (active.runner === "maxDepthBinaryTree") {
            const root = makeBinaryTree(t.tree);
            result = solve(root);
          } else if (active.runner === "levelOrderTraversal") {
            const root = makeBinaryTree(t.tree);
            result = solve(root);
          } else if (active.runner === "rightSideView") {
            const root = makeBinaryTree(t.tree);
            result = solve(root);
          } else if (active.runner === "countCompleteTreeNodes") {
            const root = makeBinaryTree(t.tree);
            result = solve(root);
          } else if (active.runner === "validateBST") {
            const root = makeBinaryTree(t.tree);
            result = solve(root);
          } else if (active.runner === "priorityQueueOps") {
            result = runQueueOps(solve, t.ops, t.args);
          } else if (active.runner === "matrixDfsTraversal") {
            result = solve(t.matrix);
          } else if (active.runner === "matrixBfsTraversal") {
            result = solve(t.matrix);
          } else if (active.runner === "countIslands") {
            result = solve(t.matrix);
          } else if (active.runner === "rottingOranges") {
            result = solve(t.matrix);
          } else if (active.runner === "wallsAndGates") {
            result = solve(t.matrix);
          } else if (active.runner === "graphBfsTraversal") {
            result = solve(t.graph, t.start);
          } else if (active.runner === "graphDfsTraversal") {
            result = solve(t.graph, t.start);
          } else if (active.runner === "informAllEmployees") {
            result = solve(t.n, t.headID, t.managers, t.informTime);
          } else if (active.runner === "networkDelayTime") {
            result = solve(t.times, t.n, t.k);
          } else if (active.runner === "minCostClimbingStairs") {
            result = solve(t.cost);
          } else if (active.runner === "knightProbability") {
            result = solve(t.n, t.k, t.row, t.col);
          } else if (active.runner === "courseSchedule") {
            result = solve(t.n, t.prerequisites);
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

        if (active.runner === "validParentheses") {
          const validation = validateBooleanResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "minRemoveBrackets") {
          const validation = validateMinRemoveResult({ s: t.s, result, minRemoved: t.minRemoved });
          return { name: t.name, ok: validation.ok, got: result, want: "valid minimal removal", error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "queueWithStacks") {
          const validation = validateQueueOpsResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "trieOps") {
          const validation = validateTrieOpsResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "solveSudoku") {
          const boardResult = result?.board ?? null;
          const validation = validateSudokuResult({
            original: t.board,
            resultBoard: boardResult,
            expect: t.expectBoard,
            solvable: t.solvable !== false,
          });
          return { name: t.name, ok: validation.ok, got: boardResult, want: t.expectBoard ?? "solved board", error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "monarchyInterface") {
          const validation = validateMonarchyOpsResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "kthLargestElement") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "binarySearch") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "searchRange") {
          const validation = validateRangeResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "maxDepthBinaryTree") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "levelOrderTraversal") {
          const validation = validateLevelOrderResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "rightSideView") {
          const validation = validateArrayResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "countCompleteTreeNodes") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "validateBST") {
          const validation = validateBooleanResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "priorityQueueOps") {
          const validation = validateQueueOpsResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "matrixDfsTraversal") {
          const validation = validateArrayResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "matrixBfsTraversal") {
          const validation = validateArrayResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "countIslands") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "rottingOranges") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "wallsAndGates") {
          const validation = validateMatrixResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "graphBfsTraversal") {
          const validation = validateArrayResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "graphDfsTraversal") {
          const validation = validateArrayResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "informAllEmployees") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "networkDelayTime") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "minCostClimbingStairs") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "knightProbability") {
          const validation = validateNumberResult({ result, expect: t.expect });
          return { name: t.name, ok: validation.ok, got: result, want: t.expect, error: validation.ok ? null : validation.reason };
        }

        if (active.runner === "courseSchedule") {
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
                        <div className="cp-row" style={{ alignItems: "flex-start", gap: 8 }}>
                          <div style={{ fontWeight: 900, marginBottom: 6, marginTop: 2 }}>{w.title}</div>
                          {w.codeLanguage && <ActionButtons promptText={w.body} />}
                        </div>
                        {w.codeLanguage ? (
                          <>
                            <pre className="cp-codeblock">
                              <code className={`language-${w.codeLanguage}`}>{w.body}</code>
                            </pre>
                            <CodeScramble code={w.body} scrambleKey={`${active.id}:${w.title}`} />
                            <CodeLineGuess code={w.body} gameKey={`${active.id}:${w.title}:guess`} />
                            <CodeWordFill code={w.body} gameKey={`${active.id}:${w.title}:fill`} />
                          </>
                        ) : (
                          <>
                            <div style={{ whiteSpace: "pre-wrap" }}>{w.body}</div>
                            <TextOrderGame text={w.body} gameKey={`${active.id}:${w.title}:textorder`} />
                            <TextBlankGame text={w.body} gameKey={`${active.id}:${w.title}:textblank`} />
                          </>
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
                        ) : active.runner === "validParentheses" ? (
                          <div className="cp-muted">
                            s: {stableStringify(t.s)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "minRemoveBrackets" ? (
                          <div className="cp-muted">
                            s: {stableStringify(t.s)} | minRemoved: {stableStringify(t.minRemoved)}
                          </div>
                        ) : active.runner === "queueWithStacks" ? (
                          <div className="cp-muted">
                            ops: {stableStringify(t.ops)} | args: {stableStringify(t.args)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "trieOps" ? (
                          <div className="cp-muted">
                            ops: {stableStringify(t.ops)} | args: {stableStringify(t.args)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "solveSudoku" ? (
                          <div className="cp-muted">
                            board: {stableStringify(t.board)} | expected: {t.solvable === false ? "unsolved" : "solved"}{" "}
                            {t.expectBoard ? `| expectBoard: ${stableStringify(t.expectBoard)}` : ""}
                          </div>
                        ) : active.runner === "monarchyInterface" ? (
                          <div className="cp-muted">
                            ops: {stableStringify(t.ops)} | args: {stableStringify(t.args)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "kthLargestElement" ? (
                          <div className="cp-muted">
                            nums: {stableStringify(t.nums)} | k: {stableStringify(t.k)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "binarySearch" ? (
                          <div className="cp-muted">
                            nums: {stableStringify(t.nums)} | target: {stableStringify(t.target)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "searchRange" ? (
                          <div className="cp-muted">
                            nums: {stableStringify(t.nums)} | target: {stableStringify(t.target)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "maxDepthBinaryTree" ? (
                          <div className="cp-muted">
                            tree: {stableStringify(t.tree)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "levelOrderTraversal" ? (
                          <div className="cp-muted">
                            tree: {stableStringify(t.tree)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "rightSideView" ? (
                          <div className="cp-muted">
                            tree: {stableStringify(t.tree)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "countCompleteTreeNodes" ? (
                          <div className="cp-muted">
                            tree: {stableStringify(t.tree)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "validateBST" ? (
                          <div className="cp-muted">
                            tree: {stableStringify(t.tree)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "priorityQueueOps" ? (
                          <div className="cp-muted">
                            ops: {stableStringify(t.ops)} | args: {stableStringify(t.args)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "matrixDfsTraversal" ? (
                          <div className="cp-muted">
                            matrix: {stableStringify(t.matrix)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "matrixBfsTraversal" ? (
                          <div className="cp-muted">
                            matrix: {stableStringify(t.matrix)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "countIslands" ? (
                          <div className="cp-muted">
                            matrix: {stableStringify(t.matrix)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "rottingOranges" ? (
                          <div className="cp-muted">
                            matrix: {stableStringify(t.matrix)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "wallsAndGates" ? (
                          <div className="cp-muted">
                            matrix: {stableStringify(t.matrix)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "graphBfsTraversal" ? (
                          <div className="cp-muted">
                            graph: {stableStringify(t.graph)} | start: {stableStringify(t.start)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "graphDfsTraversal" ? (
                          <div className="cp-muted">
                            graph: {stableStringify(t.graph)} | start: {stableStringify(t.start)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "informAllEmployees" ? (
                          <div className="cp-muted">
                            n: {stableStringify(t.n)} | headID: {stableStringify(t.headID)} | managers: {stableStringify(t.managers)} | informTime: {stableStringify(t.informTime)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "networkDelayTime" ? (
                          <div className="cp-muted">
                            times: {stableStringify(t.times)} | n: {stableStringify(t.n)} | k: {stableStringify(t.k)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "minCostClimbingStairs" ? (
                          <div className="cp-muted">
                            cost: {stableStringify(t.cost)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "knightProbability" ? (
                          <div className="cp-muted">
                            n: {stableStringify(t.n)} | k: {stableStringify(t.k)} | row: {stableStringify(t.row)} | col: {stableStringify(t.col)} | expected: {stableStringify(t.expect)}
                          </div>
                        ) : active.runner === "courseSchedule" ? (
                          <div className="cp-muted">
                            n: {stableStringify(t.n)} | prerequisites: {stableStringify(t.prerequisites)} | expected: {stableStringify(t.expect)}
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
