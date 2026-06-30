import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaCompress,
  FaExpand,
  FaPause,
  FaPlay,
  FaRedoAlt,
  FaSlidersH,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { useAppState } from "./context/AppContext";
import "./Teleprompter.css";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const STORAGE_KEY = "teleprompter_settings_v2";
const DEFAULT_SETTINGS = {
  script: "",
  speed: 30,
  fontSize: 3,
  lineHeight: 1.45,
  fontFamily: "Inter, system-ui, sans-serif",
  textColor: "#f8fafc",
  bgColor: "#070b14",
  direction: "up",
  mirror: false,
};

const getStoredNumber = (key, fallback) => {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const loadSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const settings = saved && typeof saved === "object" ? saved : {};
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      script: typeof settings.script === "string" ? settings.script : "",
      speed: clamp(Number(settings.speed ?? getStoredNumber("tp_speed", DEFAULT_SETTINGS.speed)), 1, 300),
      fontSize: clamp(Number(settings.fontSize ?? getStoredNumber("tp_font_size", DEFAULT_SETTINGS.fontSize)), 0.8, 6),
      lineHeight: clamp(Number(settings.lineHeight ?? DEFAULT_SETTINGS.lineHeight), 1.1, 2),
      direction: settings.direction === "down" ? "down" : "up",
      mirror: settings.mirror === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const rounded = Math.ceil(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
};

export default function Teleprompter() {
  const { teleprompterText } = useAppState();
  const [initialSettings] = useState(loadSettings);
  const [script, setScript] = useState(initialSettings.script);
  const [speed, setSpeed] = useState(initialSettings.speed);
  const [fontSize, setFontSize] = useState(initialSettings.fontSize);
  const [lineHeight, setLineHeight] = useState(initialSettings.lineHeight);
  const [fontFamily, setFontFamily] = useState(initialSettings.fontFamily);
  const [textColor, setTextColor] = useState(initialSettings.textColor);
  const [bgColor, setBgColor] = useState(initialSettings.bgColor);
  const [direction, setDirection] = useState(initialSettings.direction);
  const [mirror, setMirror] = useState(initialSettings.mirror);
  const [showControls, setShowControls] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const appRef = useRef(null);
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationRef = useRef(null);
  const heightRef = useRef(0);
  const offsetRef = useRef(0);
  const lastFrameRef = useRef(null);
  const lastUiUpdateRef = useRef(0);
  const runningRef = useRef(false);
  const speedRef = useRef(speed);
  const directionRef = useRef(direction);
  const mirrorRef = useRef(mirror);

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const cycleDuration = heightRef.current > 0 ? heightRef.current / speed : 0;

  const paintPosition = useCallback(() => {
    if (!contentRef.current) return;
    contentRef.current.style.transform = `${mirrorRef.current ? "scaleX(-1) " : ""}translate3d(0, ${-offsetRef.current}px, 0)`;
  }, []);

  const updateReadout = useCallback(() => {
    const height = heightRef.current;
    if (!height) return;
    const rawFraction = clamp(offsetRef.current / height, 0, 1);
    const fraction = directionRef.current === "up" ? rawFraction : 1 - rawFraction;
    setProgress(fraction * 100);
    const distance = directionRef.current === "up"
      ? height - offsetRef.current
      : offsetRef.current;
    setRemaining(distance / speedRef.current);
  }, []);

  const measureContent = useCallback(() => {
    const element = contentRef.current;
    if (!element || !script.trim()) {
      heightRef.current = 0;
      setProgress(0);
      setRemaining(0);
      return;
    }
    heightRef.current = element.scrollHeight / 2;
    offsetRef.current = clamp(offsetRef.current, 0, heightRef.current);
    paintPosition();
    updateReadout();
  }, [paintPosition, script, updateReadout]);

  useEffect(() => {
    if (teleprompterText) setScript(teleprompterText);
  }, [teleprompterText]);

  useEffect(() => {
    speedRef.current = speed;
    updateReadout();
  }, [speed, updateReadout]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        script,
        speed,
        fontSize,
        lineHeight,
        fontFamily,
        textColor,
        bgColor,
        direction,
        mirror,
      }));
    }, 150);
    return () => window.clearTimeout(saveTimer);
  }, [script, speed, fontSize, lineHeight, fontFamily, textColor, bgColor, direction, mirror]);

  useEffect(() => {
    directionRef.current = direction;
    updateReadout();
  }, [direction, updateReadout]);

  useEffect(() => {
    mirrorRef.current = mirror;
    paintPosition();
  }, [mirror, paintPosition]);

  useEffect(() => {
    const frame = requestAnimationFrame(measureContent);
    return () => cancelAnimationFrame(frame);
  }, [measureContent, fontSize, lineHeight, fontFamily]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measureContent);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measureContent]);

  useEffect(() => {
    const animate = (timestamp) => {
      if (runningRef.current && heightRef.current > 0) {
        if (lastFrameRef.current === null) lastFrameRef.current = timestamp;
        const elapsed = Math.min((timestamp - lastFrameRef.current) / 1000, 0.1);
        const signedDistance = speedRef.current * elapsed * (directionRef.current === "up" ? 1 : -1);
        const height = heightRef.current;
        let next = offsetRef.current + signedDistance;
        next = ((next % height) + height) % height;
        offsetRef.current = next;
        paintPosition();

        if (timestamp - lastUiUpdateRef.current > 100) {
          lastUiUpdateRef.current = timestamp;
          updateReadout();
        }
      }
      lastFrameRef.current = timestamp;
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [paintPosition, updateReadout]);

  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(document.fullscreenElement === appRef.current);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const changeSpeed = (nextSpeed) => setSpeed(clamp(Number(nextSpeed) || 1, 1, 300));
  const changeFontSize = (nextSize) => setFontSize(Number(clamp(Number(nextSize), 0.8, 6).toFixed(1)));

  const start = () => {
    if (!script.trim()) return;
    measureContent();
    offsetRef.current = direction === "up" ? 0 : Math.max(0, heightRef.current - 0.01);
    runningRef.current = true;
    lastFrameRef.current = null;
    setIsRunning(true);
    setIsPaused(false);
    setShowControls(false);
    paintPosition();
    updateReadout();
  };

  const togglePause = () => {
    if (!isRunning && !isPaused) {
      start();
      return;
    }
    const nextPaused = !isPaused;
    runningRef.current = !nextPaused;
    lastFrameRef.current = null;
    setIsPaused(nextPaused);
    setIsRunning(!nextPaused);
  };

  const restart = () => {
    offsetRef.current = direction === "up" ? 0 : Math.max(0, heightRef.current - 0.01);
    lastFrameRef.current = null;
    paintPosition();
    updateReadout();
  };

  const pasteFromClipboard = async () => {
    try {
      setScript(await navigator.clipboard.readText());
    } catch {
      fileInputRef.current?.focus();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScript(String(reader.result || ""));
    reader.readAsText(file);
    event.target.value = "";
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await appRef.current?.requestFullscreen();
    }
  };

  const duplicatedScript = script.trim() ? `${script.trim()}\n\n${script.trim()}\n\n` : "";

  return (
    <section
      ref={appRef}
      className={`tp-app ${showControls ? "is-editing" : "is-reading"}`}
      style={{ "--tp-background": bgColor, "--tp-text": textColor, "--tp-font": fontFamily }}
    >
      {showControls && (
        <div className="tp-setup">
          <header className="tp-setup__header">
            <div>
              <span className="tp-kicker">Script setup</span>
              <h3>Ready your script</h3>
            </div>
            <div className="tp-stats" aria-label="Script statistics">
              <span>{wordCount} words</span>
              <span>{speed} px/s</span>
              <span>{formatTime(cycleDuration)} cycle</span>
            </div>
          </header>

          <label className="tp-script-field">
            <span>Script</span>
            <textarea
              value={script}
              onChange={(event) => setScript(event.target.value)}
              placeholder="Paste or type your script here…"
            />
          </label>

          <div className="tp-script-actions">
            <button type="button" className="tp-button tp-button--primary" onClick={start} disabled={!script.trim()}>
              <FaPlay aria-hidden="true" /> Start prompting
            </button>
            <button type="button" className="tp-button" onClick={pasteFromClipboard}>Paste</button>
            <button type="button" className="tp-button" onClick={() => fileInputRef.current?.click()}>
              <FaUpload aria-hidden="true" /> Upload
            </button>
            <button type="button" className="tp-button tp-button--danger" onClick={() => setScript("")} disabled={!script}>
              <FaTrash aria-hidden="true" /> Clear
            </button>
            <input ref={fileInputRef} className="tp-file-input" type="file" accept=".txt,text/plain" onChange={handleFileUpload} />
          </div>

          <div className="tp-settings">
            <div className="tp-setting tp-setting--speed">
              <div className="tp-setting__label">
                <span>Scroll speed</span>
                <strong>{speed} pixels / second</strong>
              </div>
              <div className="tp-range-row">
                <button type="button" onClick={() => changeSpeed(speed - 5)} aria-label="Decrease speed by one pixel per second">−</button>
                <input type="range" min="1" max="300" step="1" value={speed} onChange={(event) => changeSpeed(event.target.value)} aria-label="Scroll speed in pixels per second" />
                <button type="button" onClick={() => changeSpeed(speed + 5)} aria-label="Increase speed by one pixel per second">+</button>
                <div className="tp-number-input">
                  <input type="number" min="1" max="300" value={speed} onChange={(event) => changeSpeed(event.target.value)} aria-label="Exact scroll speed" />
                  <span>px/s</span>
                </div>
              </div>
            </div>

            <label className="tp-setting">
              <span>Text size <strong>{fontSize.toFixed(1)}×</strong></span>
              <input type="range" min="0.8" max="6" step="0.1" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
            </label>
            <label className="tp-setting">
              <span>Line spacing <strong>{lineHeight.toFixed(2)}</strong></span>
              <input type="range" min="1.1" max="2" step="0.05" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} />
            </label>
            <label className="tp-setting">
              <span>Typeface</span>
              <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}>
                <option value="Inter, system-ui, sans-serif">Modern sans</option>
                <option value="Georgia, serif">Serif</option>
                <option value="ui-monospace, SFMono-Regular, monospace">Monospace</option>
              </select>
            </label>
            <label className="tp-setting">
              <span>Direction</span>
              <select value={direction} onChange={(event) => setDirection(event.target.value)}>
                <option value="up">Scroll up</option>
                <option value="down">Scroll down</option>
              </select>
            </label>
            <div className="tp-color-settings">
              <label><input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} /><span>Text</span></label>
              <label><input type="color" value={bgColor} onChange={(event) => setBgColor(event.target.value)} /><span>Backdrop</span></label>
              <label className="tp-toggle"><input type="checkbox" checked={mirror} onChange={(event) => setMirror(event.target.checked)} /><span>Mirror</span></label>
            </div>
          </div>
        </div>
      )}

      <div className="tp-stage" aria-label="Teleprompter preview">
        <div className="tp-stage__focus" aria-hidden="true" />
        {!script.trim() && <div className="tp-empty">Your script preview will appear here.</div>}
        <div
          ref={contentRef}
          className="tp-content"
          style={{ fontSize: `${fontSize}em`, lineHeight }}
          aria-live="off"
        >
          {duplicatedScript}
        </div>

        <div className="tp-text-size-control" aria-label="Live text size">
          <button type="button" onClick={() => changeFontSize(fontSize - 0.1)} disabled={fontSize <= 0.8} aria-label="Decrease text size">A−</button>
          <span>{fontSize.toFixed(1)}×</span>
          <button type="button" onClick={() => changeFontSize(fontSize + 0.1)} disabled={fontSize >= 6} aria-label="Increase text size">A+</button>
        </div>

        <div className="tp-runtime" aria-label="Playback controls">
          <button type="button" className="tp-runtime__icon tp-runtime__play" onClick={togglePause} disabled={!script.trim()} aria-label={isPaused || !isRunning ? "Play" : "Pause"}>
            {isPaused || !isRunning ? <FaPlay /> : <FaPause />}
          </button>
          <button type="button" className="tp-runtime__icon" onClick={restart} disabled={!script.trim()} aria-label="Restart script"><FaRedoAlt /></button>
          <div className="tp-speed-control" aria-label="Live scroll speed">
            <button type="button" onClick={() => changeSpeed(speed - 1)} aria-label="Decrease pixels per second">−</button>
            <label>
              <input type="number" inputMode="numeric" min="1" max="300" value={speed} onChange={(event) => changeSpeed(event.target.value)} />
              <span>px/s</span>
            </label>
            <button type="button" onClick={() => changeSpeed(speed + 1)} aria-label="Increase pixels per second">+</button>
          </div>
          <button type="button" className="tp-runtime__icon" onClick={() => setShowControls((shown) => !shown)} aria-label={showControls ? "Hide settings" : "Show settings"}><FaSlidersH /></button>
          <button type="button" className="tp-runtime__icon tp-runtime__fullscreen" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}>
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>

        <div className="tp-progress" aria-label={`${Math.round(progress)} percent through the script`}>
          <div><span style={{ width: `${progress}%` }} /></div>
          <p><span>{formatTime(remaining)} remaining</span><span>{speed} px/s</span></p>
        </div>
      </div>
    </section>
  );
}
