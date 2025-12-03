import React, { useState, useRef, useEffect } from "react";
import { useAppState } from "./context/AppContext";

const TeleprompterAdvanced = () => {
  // Core state
  const [script, setScript] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [fontSize, setFontSize] = useState(3); // em
  const [speed, setSpeed] = useState(20); // pixels per second
  const [showControls, setShowControls] = useState(true);
  const { teleprompterText } = useAppState();

  useEffect(() => {
    if (teleprompterText) {
      setScript(teleprompterText);
    }
  }, [teleprompterText]);

  // Advanced state
  const [textColor, setTextColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#111111");
  const [fontFamily, setFontFamily] = useState("monospace");
  const [mirror, setMirror] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const [lineHeight, setLineHeight] = useState(1.5);
  const [durationSec, setDurationSec] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const speedHoldRef = useRef(1);
  const dirHoldRef = useRef(null);
  const heightRef = useRef(0);
  const offsetRef = useRef(0);
  const lastTsRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const baseDirRef = useRef(1);

  // Refs for DOM elements
  const contentRef = useRef(null);
  const teleprompterRef = useRef(null);
  const controlsRef = useRef(null);

  // Adjust the animation duration whenever script, speed or font size
  // changes. Duplicate the script to create a seamless loop.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (!script.trim()) {
      el.textContent = "";
      return;
    }
    // Duplicate the text for a continuous scrolling loop
    const text = script.trim();
    el.textContent = `${text}\n\n${text}`;
    const scriptHeight = el.scrollHeight / 2;
    heightRef.current = scriptHeight;
    offsetRef.current = 0;
    lastTsRef.current = null;
    setDurationSec(scriptHeight / speed);
    setRemainingSec(scriptHeight / speed);
    setProgress(0);
  }, [script, speed, fontSize]);

  // Adjust the teleprompter height when controls are shown/hidden or
  // when the window resizes. This replicates the behaviour of the
  // original HTML version where the reading area automatically shrinks
  // to accommodate the control panel.
  useEffect(() => {
    const adjustTeleprompter = () => {
      const teleEl = teleprompterRef.current;
      const ctrlEl = controlsRef.current;
      if (!teleEl || !ctrlEl) return;
      if (showControls) {
        const ctrlHeight = ctrlEl.offsetHeight;
        teleEl.style.top = `${ctrlHeight}px`;
        teleEl.style.height = `calc(100vh - ${ctrlHeight}px)`;
      } else {
        teleEl.style.top = "0";
        teleEl.style.height = "100vh";
      }
    };
    adjustTeleprompter();
    window.addEventListener("resize", adjustTeleprompter);
    return () => {
      window.removeEventListener("resize", adjustTeleprompter);
    };
  }, [showControls]);

  // Start the teleprompter: ensure duplicated text and start the animation
  const startTeleprompter = () => {
    const el = contentRef.current;
    if (!el) return;
    const text = script.trim() || "Paste your code above and press Start.";
    el.textContent = `${text}\n\n${text}`;
    const scriptHeight = el.scrollHeight / 2;
    heightRef.current = scriptHeight;
    offsetRef.current = 0;
    lastTsRef.current = null;
    setIsPaused(false);
    setDurationSec(scriptHeight / speed);
    setRemainingSec(scriptHeight / speed);
    setProgress(0);
    setIsRunning(true);
    runningRef.current = true;
    setShowControls(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = (ts) => {
      if (!runningRef.current) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const baseDir = baseDirRef.current;
      const dir = dirHoldRef.current ?? baseDir;
      const mult = speedHoldRef.current || 1;
      const distance = speed * mult * dt;
      let nextOffset = offsetRef.current + dir * distance;
      const h = heightRef.current || 1;
      // Wrap seamlessly
      if (nextOffset > h) nextOffset = nextOffset % h;
      if (nextOffset < 0) nextOffset = h + (nextOffset % h);
      offsetRef.current = nextOffset;
      const translateY = -nextOffset;
      el.style.transform = `${mirror ? "scaleX(-1) " : ""}translateY(${translateY}px)`;
      // Progress and remaining time
      const frac = h ? nextOffset / h : 0;
      setProgress(frac * 100);
      const currentSpeed = speed * mult;
      if (currentSpeed > 0) {
        const remaining = dir > 0 ? h - nextOffset : nextOffset;
        setRemainingSec(remaining / currentSpeed);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // Pause or resume scrolling
  const togglePause = () => {
    const el = contentRef.current;
    if (!el || !el.textContent) return;
    setIsPaused((prev) => {
      const newPaused = !prev;
      runningRef.current = !newPaused;
      setIsRunning(!newPaused);
      return newPaused;
    });
  };

  // Read a text file uploaded via the hidden input
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setScript(ev.target.result || "");
    reader.onerror = (err) => alert("Failed to read file: " + err);
    reader.readAsText(file);
  };

  // Paste text from the clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setScript(text);
    } catch (err) {
      alert("Failed to read from clipboard: " + err);
    }
  };

  // Clear the script and content
  const clearScript = () => {
    setScript("");
    if (contentRef.current) {
      contentRef.current.textContent = "";
    }
  };

  // Adjust font size
  const increaseFont = () => setFontSize((f) => f + 0.1);
  const decreaseFont = () => setFontSize((f) => (f > 0.6 ? f - 0.1 : f));

  // Fullscreen toggle: request or exit fullscreen on the document
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        alert("Fullscreen mode is not supported by this browser.");
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSpeedHoldStart = () => {
    speedHoldRef.current = 2;
  };
  const handleSpeedHoldEnd = () => {
    speedHoldRef.current = 1;
  };

  const handleReverseHoldStart = () => {
    dirHoldRef.current = -1 * (baseDirRef.current || 1);
  };
  const handleReverseHoldEnd = () => {
    dirHoldRef.current = null;
  };

  useEffect(() => {
    baseDirRef.current = scrollDirection === "up" ? 1 : -1;
  }, [scrollDirection]);

  // Choose the appropriate animation name based on scroll direction
  const animationName = scrollDirection === "down" ? "scrollDown" : "scrollUp";

  const restartFromTop = () => {
    const el = contentRef.current;
    if (!el) return;
    // Reset animation to start position
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = `${animationName} ${el.style.animationDuration} linear infinite`;
    el.style.animationPlayState = "running";
    setIsPaused(false);
    setIsRunning(true);
    setRemainingSec(durationSec);
    setProgress(0);
  };

  useEffect(() => {
    if (!isRunning || durationSec <= 0) return;
    const interval = setInterval(() => {
      setRemainingSec((prev) => {
        const next = prev - 0.1;
        if (next <= 0) {
          setProgress(100);
          return durationSec;
        }
        setProgress(Math.max(0, Math.min(100, ((durationSec - next) / durationSec) * 100)));
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, durationSec]);

  return (
    <div
      style={{
        margin: 0,
        background: `radial-gradient(circle at 20% 20%, #0f172a 0, #0b1220 35%, ${bgColor} 70%)`,
        color: textColor,
        fontFamily,
        overflow: "hidden",
        minHeight: "100vh",
      }}
    >
      <style>{`
        .tp-shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .tp-card {
          background: rgba(15,23,42,0.8);
          border: 1px solid #1e293b;
          border-radius: 14px;
          padding: 0.75rem;
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        }
        .tp-controls {
          display: grid;
          gap: 0.6rem;
        }
        @media (min-width: 640px) {
          .tp-controls {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .tp-btn {
          padding: 0.6rem 0.85rem;
          border-radius: 10px;
          border: 1px solid #1e293b;
          background: #111827;
          color: #e2e8f0;
          cursor: pointer;
          font-weight: 600;
        }
        .tp-btn.primary {
          background: linear-gradient(135deg, #2563eb, #60a5fa);
          border: none;
          color: #fff;
        }
        .tp-input {
          width: 100%;
          padding: 0.6rem;
          border-radius: 10px;
          border: 1px solid #1e293b;
          background: #0b1628;
          color: #e2e8f0;
        }
        .tp-stat {
          display: inline-flex;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          background: #1e293b;
          color: #e2e8f0;
          font-size: 0.9rem;
          margin-right: 0.35rem;
        }
      `}</style>
      <div className="tp-shell">
        {/* Control panel */}
        {showControls && (
          <div ref={controlsRef} className="tp-card">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span className="tp-stat">Words: {wordCount}</span>
              <span className="tp-stat">Font: {fontSize.toFixed(1)}em</span>
              <span className="tp-stat">Speed: {speed}px/s</span>
              <span className="tp-stat">Cycle: {durationSec ? `${Math.round(durationSec)}s` : "–"}</span>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste your script here..."
            style={{
              width: "100%",
              height: 120,
              fontSize: "1em",
              padding: 10,
              border: "1px solid #1e293b",
              borderRadius: 10,
              resize: "vertical",
              fontFamily,
              background: "#0b1628",
              color: textColor,
              boxSizing: "border-box",
            }}
          />
            <div className="tp-controls">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="tp-btn primary" onClick={startTeleprompter}>Start</button>
                <button className="tp-btn" onClick={restartFromTop}>Restart</button>
                <button className="tp-btn" onClick={pasteFromClipboard}>Paste</button>
              <button className="tp-btn" onClick={clearScript}>Clear</button>
              <button className="tp-btn" onClick={togglePause}>{isPaused ? "Resume" : "Pause"}</button>
              <label className="tp-btn" style={{ cursor: "pointer" }}>
                Upload .txt
                <input
                  type="file"
                  accept=".txt"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Scroll Speed</label>
              <input
                type="range"
                min="10"
                max="200"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ flexBasis: "100%" }}>Font Size</label>
              <button className="tp-btn" onClick={decreaseFont}>A-</button>
              <button className="tp-btn" onClick={increaseFont}>A+</button>
              <label style={{ flexBasis: "100%" }}>Font</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="tp-input"
              >
                <option value="monospace">Monospace</option>
                <option value="sans-serif">Sans‑Serif</option>
                <option value="serif">Serif</option>
                <option value="cursive">Cursive</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label>Text Colour</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  style={{ width: 44, height: 44, border: "none", padding: 0 }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label>Background</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: 44, height: 44, border: "none", padding: 0 }}
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label>Direction</label>
                <select
                  value={scrollDirection}
                  onChange={(e) => setScrollDirection(e.target.value)}
                  className="tp-input"
                  style={{ marginTop: 6 }}
                >
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                </select>
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label>Line Height</label>
                <input
                  type="range"
                  min="1.1"
                  max="2"
                  step="0.05"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  style={{ width: "100%", marginTop: 6 }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={mirror}
                  onChange={(e) => setMirror(e.target.checked)}
                />
                Mirror Text
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button for control panel */}
      <button
        onClick={() => setShowControls((s) => !s)}
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          zIndex: 11,
          padding: "10px 15px",
          background: "rgba(0,0,0,0.8)",
          border: "none",
          borderRadius: 5,
          color: textColor,
        }}
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </button>

      {/* Teleprompter reading area */}
      <div
        ref={teleprompterRef}
        style={{
          position: "relative",
          top: showControls ? undefined : "0",
          height: showControls ? undefined : "70vh",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          paddingLeft: 12,
          paddingRight: 12,
          boxSizing: "border-box",
        }}
      >
        <div
          ref={contentRef}
          style={{
            fontSize: `${fontSize}em`,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            maxWidth: "100%",
            animationName: animationName,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState: isPaused ? "paused" : "running",
            transform: mirror ? "scaleX(-1)" : "none",
            lineHeight: `${lineHeight}em`,
          }}
        />
      </div>

      {/* Progress indicator */}
      <div
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: showControls ? 60 : 12,
          zIndex: 9,
        }}
      >
        <div style={{ height: 10, borderRadius: 999, background: "#1e293b", border: "1px solid #0ea5e9", overflow: "hidden" }}>
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #22c55e, #60a5fa)",
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#e2e8f0", fontSize: "0.9rem", marginTop: 4 }}>
          <span>{Math.max(0, Math.round(remainingSec))}s left</span>
          <span>Cycle {durationSec ? `${Math.round(durationSec)}s` : "–"}</span>
        </div>
      </div>

      {/* Floating hold buttons for speed/reverse */}
      <div
        style={{
          position: "fixed",
          left: 12,
          bottom: showControls ? -999 : 90,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 20,
          pointerEvents: "auto",
        }}
      >
        <button
          onPointerDown={() => { speedHoldRef.current = 2; }}
          onPointerUp={() => { speedHoldRef.current = 1; }}
          onPointerLeave={() => { speedHoldRef.current = 1; }}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
            color: "#0b1220",
            fontWeight: 800,
            boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
          }}
          title="Hold to double speed"
          aria-label="Hold to double speed"
        >
          <span style={{ userSelect: "none" }}>2×</span>
        </button>
        <button
          onPointerDown={() => { speedHoldRef.current = 4; }}
          onPointerUp={() => { speedHoldRef.current = 1; }}
          onPointerLeave={() => { speedHoldRef.current = 1; }}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #a855f7, #6366f1)",
            color: "#0b1220",
            fontWeight: 800,
            boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
          }}
          title="Hold to 4x speed"
          aria-label="Hold to 4x speed"
        >
          <span style={{ userSelect: "none" }}>4×</span>
        </button>
        <button
          onPointerDown={() => { dirHoldRef.current = -2 * (baseDirRef.current || 1); }}
          onPointerUp={() => { dirHoldRef.current = null; }}
          onPointerLeave={() => { dirHoldRef.current = null; }}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #f97316)",
            color: "#0b1220",
            fontWeight: 800,
            boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
          }}
          title="Hold to reverse at 2x"
          aria-label="Hold to reverse at 2x"
        >
          <span style={{ userSelect: "none" }}>↺2×</span>
        </button>
        <button
          onPointerDown={() => { dirHoldRef.current = -4 * (baseDirRef.current || 1); }}
          onPointerUp={() => { dirHoldRef.current = null; }}
          onPointerLeave={() => { dirHoldRef.current = null; }}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f472b6, #db2777)",
            color: "#0b1220",
            fontWeight: 800,
            boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
          }}
          title="Hold to reverse at 4x"
          aria-label="Hold to reverse at 4x"
        >
          <span style={{ userSelect: "none" }}>↺4×</span>
        </button>
      </div>

      {/* Keyframes for scrolling animations */}
      <style>{`
        @keyframes scrollUp {
          from { transform: translateY(0%); }
          to   { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0%); }
        }
        button {
          padding: 8px;
          border: none;
          border-radius: 5px;
          font-size: 1em;
          background: #333;
          color: ${textColor};
          cursor: pointer;
        }
        button:hover {
          background: #444;
        }
      `}</style>
      </div> {/* end tp-shell */}
    </div>
  );
};

export default TeleprompterAdvanced;
