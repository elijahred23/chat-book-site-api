import React, { useState, useRef, useEffect } from "react";
import { useAppState } from "./context/AppContext";

const TeleprompterAdvanced = () => {
  // Core state
  const [script, setScript] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [fontSize, setFontSize] = useState(1.2); // em
  const [speed, setSpeed] = useState(60); // pixels per second
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
    // Calculate duration based on content height and scroll speed
    const scriptHeight = el.scrollHeight / 2;
    const duration = scriptHeight / speed;
    el.style.animationDuration = `${duration}s`;
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
    // Compute duration based on content height and current speed
    const scriptHeight = el.scrollHeight / 2;
    const duration = scriptHeight / speed;
    el.style.animationDuration = `${duration}s`;
    // Resume scrolling
    el.style.animationPlayState = "running";
    setIsPaused(false);
  };

  // Pause or resume scrolling
  const togglePause = () => {
    const el = contentRef.current;
    if (!el || !el.textContent) return;
    setIsPaused((prev) => {
      const newPaused = !prev;
      el.style.animationPlayState = newPaused ? "paused" : "running";
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

  // Choose the appropriate animation name based on scroll direction
  const animationName = scrollDirection === "down" ? "scrollDown" : "scrollUp";

  return (
    <div
      style={{
        margin: 0,
        background: bgColor,
        color: textColor,
        fontFamily,
        overflow: "hidden",
        height: "100vh",
      }}
    >
      {/* Control panel */}
      {showControls && (
        <div
          ref={controlsRef}
          style={{
            position: "fixed",
            top: 0,
            width: "100%",
            background: "rgba(0, 0, 0, 0.9)",
            padding: 10,
            boxSizing: "border-box",
            zIndex: 10,
          }}
        >
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your code or notes here..."
            style={{
              width: "100%",
              height: 100,
              fontSize: "1em",
              padding: 8,
              border: "none",
              borderRadius: 5,
              resize: "none",
              fontFamily,
              background: "#222",
              color: textColor,
            }}
          />
          {/* First row: core actions */}
          <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={startTeleprompter}>Start</button>
            <button onClick={pasteFromClipboard}>Paste</button>
            <button onClick={clearScript}>Clear</button>
            <button onClick={togglePause}>{isPaused ? "Resume" : "Pause"}</button>
            <label style={{ cursor: "pointer" }}>
              Upload File
              <input
                type="file"
                accept=".txt"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </label>
          </div>
          {/* Second row: scroll speed */}
          <div style={{ marginTop: 10 }}>
            <label>Scroll Speed (pixels/sec)</label>
            <input
              type="range"
              min="20"
              max="200"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
              style={{ width: "100%" }}
            />
          </div>
          {/* Third row: font size */}
          <div style={{ marginTop: 10, display: "flex", gap: 5 }}>
            <label style={{ flexBasis: "100%" }}>Font Size</label>
            <button onClick={decreaseFont}>A-</button>
            <button onClick={increaseFont}>A+</button>
          </div>
          {/* Advanced controls: colours and fonts */}
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <label style={{ flexBasis: "100%" }}>Text Colour</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{ width: 40, height: 40, border: "none", padding: 0 }}
            />
            <label style={{ flexBasis: "100%" }}>Background Colour</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              style={{ width: 40, height: 40, border: "none", padding: 0 }}
            />
            <label style={{ flexBasis: "100%" }}>Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              style={{ padding: 5, borderRadius: 5, border: "none" }}
            >
              <option value="monospace">Monospace</option>
              <option value="sans-serif">Sans‑Serif</option>
              <option value="serif">Serif</option>
              <option value="cursive">Cursive</option>
            </select>
            <label style={{ flexBasis: "100%" }}>Scroll Direction</label>
            <select
              value={scrollDirection}
              onChange={(e) => setScrollDirection(e.target.value)}
              style={{ padding: 5, borderRadius: 5, border: "none" }}
            >
              <option value="up">Up</option>
              <option value="down">Down</option>
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <input
                type="checkbox"
                checked={mirror}
                onChange={(e) => setMirror(e.target.checked)}
                id="mirrorToggle"
              />
              <label htmlFor="mirrorToggle">Mirror Text</label>
            </div>
            <button onClick={toggleFullscreen}>Toggle Fullscreen</button>
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
          height: showControls ? undefined : "100vh",
          width: "100vw",
          overflow: "hidden",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          paddingLeft: 10,
          paddingRight: 10,
          boxSizing: "border-box",
        }}
      >
        <div
          ref={contentRef}
          style={{
            fontSize: `${fontSize}em`,
            lineHeight: "1.5em",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            maxWidth: "100%",
            animationName: animationName,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState: isPaused ? "paused" : "running",
            transform: mirror ? "scaleX(-1)" : "none",
          }}
        />
      </div>

      {/* Keyframes for scrolling animations */}
      <style>
        {`
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
        `}
      </style>
    </div>
  );
};

export default TeleprompterAdvanced;