import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "./context/AppContext.jsx";
import "./AsmrPromptDrawer.css";

const SPEED_PRESETS = [
  { label: "Slow", cps: 18 },
  { label: "Calm", cps: 34 },
  { label: "Flow", cps: 54 },
  { label: "Fast", cps: 78 },
];

function withMarkdownHint(text = "") {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "No prompt text yet. Use an Action Button to open this drawer with content.";
  return trimmed;
}

export default function AsmrPromptDrawer() {
  const { asmrPromptText } = useAppState();
  const source = useMemo(() => withMarkdownHint(asmrPromptText), [asmrPromptText]);

  const [typedLength, setTypedLength] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cps, setCps] = useState(34);
  const [loopAfterFinish, setLoopAfterFinish] = useState(false);
  const viewportRef = useRef(null);

  useEffect(() => {
    setTypedLength(0);
    setIsPlaying(true);
  }, [source]);

  useEffect(() => {
    if (!isPlaying) return;
    if (typedLength >= source.length) return;

    const intervalMs = Math.max(12, Math.floor(1000 / cps));
    const id = setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= source.length) return source.length;

        let next = prev;
        // Skip leading spaces at the current boundary.
        while (next < source.length && source[next] === " ") next++;
        // Advance one non-space character.
        if (next < source.length) next++;
        // Skip spaces after the newly typed character.
        while (next < source.length && source[next] === " ") next++;
        return Math.min(next, source.length);
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [isPlaying, typedLength, source, cps]);

  useEffect(() => {
    if (!loopAfterFinish) return;
    if (!isPlaying) return;
    if (typedLength < source.length) return;

    const id = setTimeout(() => {
      setTypedLength(0);
      setIsPlaying(true);
    }, 5000);

    return () => clearTimeout(id);
  }, [loopAfterFinish, isPlaying, typedLength, source.length]);

  useEffect(() => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [typedLength]);

  const displayed = source.slice(0, typedLength);
  const done = typedLength >= source.length;

  return (
    <div className="asmr-shell">
      <div className="asmr-head">
        <div>
          <h3 style={{ margin: 0 }}>ASMR Prompt Display</h3>
          <div className="asmr-sub">Relaxed typeout mode for showcasing prompt/code content.</div>
        </div>
        <div className="asmr-controls">
          {SPEED_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={`asmr-chip ${cps === preset.cps ? "active" : ""}`}
              onClick={() => setCps(preset.cps)}
            >
              {preset.label}
            </button>
          ))}
          <button
            className="asmr-chip"
            onClick={() => setIsPlaying((p) => !p)}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            className="asmr-chip"
            onClick={() => {
              setTypedLength(0);
              setIsPlaying(true);
            }}
          >
            Restart
          </button>
        </div>
      </div>

      <div className="asmr-options">
        <label className="asmr-option-inline">
          <input
            type="checkbox"
            checked={loopAfterFinish}
            onChange={(e) => setLoopAfterFinish(e.target.checked)}
          />
          Loop 5s After Finish
        </label>

        <label className="asmr-option-inline">
          Speed:
          <input
            type="range"
            min={8}
            max={120}
            step={1}
            value={cps}
            onChange={(e) => setCps(Number(e.target.value))}
          />
          <input
            type="number"
            min={8}
            max={120}
            step={1}
            value={cps}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              if (Number.isNaN(parsed)) return;
              setCps(Math.max(8, Math.min(120, parsed)));
            }}
          />
          cps
        </label>
      </div>

      <div className="asmr-progress-wrap" aria-label="Typing progress">
        <div className="asmr-progress" style={{ width: `${(typedLength / Math.max(1, source.length)) * 100}%` }} />
      </div>

      <div className="asmr-viewport" ref={viewportRef}>
        <pre className="asmr-pre">
          <code>
            {displayed}
            {!done && <span className="asmr-caret" aria-hidden="true">▌</span>}
          </code>
        </pre>
      </div>
    </div>
  );
}
