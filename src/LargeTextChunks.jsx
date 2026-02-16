import React, { useMemo, useState, useEffect } from "react";
import ActionButtons from "./ui/ActionButtons";
import { useAppState } from "./context/AppContext";

const splitIntoWordChunks = (text, opts) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const mode = opts.mode;
  let chunks = [];
  if (mode === "size") {
    const maxWords = Math.max(50, Number(opts.size) || 5000);
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(" "));
    }
  } else {
    const count = Math.max(1, Number(opts.count) || 1);
    const perChunk = Math.ceil(words.length / count);
    for (let i = 0; i < words.length; i += perChunk) {
      chunks.push(words.slice(i, i + perChunk).join(" "));
    }
  }
  return chunks;
};

export default function LargeTextChunks() {
  const { copyText } = useAppState();
  const [text, setText] = useState("");
  const [mode, setMode] = useState("size"); // size | count
  const [size, setSize] = useState(5000);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (copyText) setText(copyText);
  }, [copyText]);

  const chunks = useMemo(() => splitIntoWordChunks(text, { mode, size, count }), [text, mode, size, count]);

  const handleUpload = async (file) => {
    if (!file) return;
    const content = await file.text();
    setText(content);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <style>{`
        .lt-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; box-shadow: 0 12px 28px rgba(15,23,42,0.08); display: grid; gap: 12px; }
        .lt-grid { display: grid; gap: 10px; }
        .btn { padding: 0.65rem 0.9rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #0f172a; color: #fff; font-weight: 700; cursor: pointer; }
        .btn.secondary { background: #f8fafc; color: #0f172a; }
        .input { width: 100%; padding: 0.75rem; border-radius: 12px; border: 1px solid #e2e8f0; font-family: "Inter", system-ui; }
        .mono { font-family: 'SFMono-Regular', Menlo, Consolas, monospace; white-space: pre-wrap; }
        .pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #eef2ff; border: 1px solid #c7d2fe; color: #1e293b; font-weight: 700; }
      `}</style>

      <div className="lt-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Text Chunker</h2>
            <div style={{ color: "#475569" }}>Paste or upload large text, auto-split into 5,000-word chunks, and run ActionButtons on each.</div>
          </div>
          <ActionButtons promptText={text} limitButtons />
        </div>

        <div className="lt-grid">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label className="btn secondary" style={{ cursor: "pointer" }}>
              Upload .txt
              <input
                type="file"
                accept=".txt,text/plain"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await handleUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button className="btn secondary" type="button" onClick={() => setText("")}>Clear</button>
            <span className="pill">Words: {text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0}</span>
            <span className="pill">Chunks: {chunks.length}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontWeight: 700 }}>Mode:</label>
              <select
                className="input"
                style={{ maxWidth: 180 }}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="size">By size (words)</option>
                <option value="count">By number of chunks</option>
              </select>
              {mode === "size" ? (
                <>
                  <label style={{ fontWeight: 700 }}>Words/chunk</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: 120 }}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value) || 0)}
                    min={50}
                  />
                </>
              ) : (
                <>
                  <label style={{ fontWeight: 700 }}>Chunk count</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: 120 }}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value) || 1)}
                    min={1}
                  />
                </>
              )}
            </div>
          </div>

          <textarea
            className="input mono"
            style={{ minHeight: 200 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your large text here"
          />

          {chunks.length > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {chunks.map((chunk, idx) => (
                <div key={idx} className="lt-card" style={{ borderColor: "#e2e8f0", boxShadow: "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div className="pill">Chunk {idx + 1} • {chunk.split(/\s+/).filter(Boolean).length} words</div>
                    <ActionButtons promptText={chunk} limitButtons />
                  </div>
                  <div className="mono" style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, background: "#f8fafc" }}>
                    {chunk}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
