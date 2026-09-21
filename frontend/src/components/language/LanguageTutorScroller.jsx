import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaBackward, FaCompressAlt, FaExpandAlt, FaForward, FaMinus, FaPause, FaPlay, FaPlus, FaRedoAlt, FaStepBackward, FaStepForward, FaUndoAlt } from "react-icons/fa";
import "./LanguageTutorScroller.css";

const storedNumber = (key, fallback, min, max) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null || storedValue.trim() === "") return fallback;
    const value = Number(storedValue);
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  } catch { return fallback; }
};
const storedBoolean = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value === null ? fallback : value === "true"; } catch { return fallback; }
};

export default function LanguageTutorScroller({ children, items, itemType, idPrefix, storagePrefix, scriptKey, className = "" }) {
  const [running, setRunning] = useState(false);
  const [direction, setDirection] = useState(1);
  const [looping, setLooping] = useState(() => storedBoolean(`${storagePrefix}-loop`, false));
  const [speed, setSpeed] = useState(() => storedNumber(`${storagePrefix}-speed`, 30, 5, 200));
  const [restartDelay, setRestartDelay] = useState(() => storedNumber(`${storagePrefix}-delay`, 3, 0, 60));
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jumpTarget, setJumpTarget] = useState("");
  const contentRef = useRef(null);
  const frameRef = useRef(null);
  const restartRef = useRef(null);
  const precisePositionRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}-loop`, String(looping));
      localStorage.setItem(`${storagePrefix}-speed`, String(speed));
      localStorage.setItem(`${storagePrefix}-delay`, String(restartDelay));
    } catch { /* Local storage may be unavailable. */ }
  }, [looping, restartDelay, speed, storagePrefix]);

  useEffect(() => {
    setRunning(false); setProgress(0); setJumpTarget("");
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [itemType, items]);

  useEffect(() => {
    if (!expanded) return undefined;
    document.body.classList.add("language-tutor-window-open");
    const close = (event) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); document.body.classList.remove("language-tutor-window-open"); };
  }, [expanded]);

  useEffect(() => {
    if (!running) return undefined;
    let previousTime = null;
    precisePositionRef.current = contentRef.current?.scrollTop || 0;
    const scroll = (timestamp) => {
      const container = contentRef.current;
      if (!container) return;
      if (previousTime === null) previousTime = timestamp;
      const elapsed = Math.min((timestamp - previousTime) / 1000, .1);
      previousTime = timestamp;
      if (Math.abs(container.scrollTop - precisePositionRef.current) > 1) precisePositionRef.current = container.scrollTop;
      const max = Math.max(0, container.scrollHeight - container.clientHeight);
      precisePositionRef.current = Math.max(0, Math.min(max, precisePositionRef.current + direction * speed * elapsed));
      container.scrollTop = precisePositionRef.current;
      setProgress(max ? (precisePositionRef.current / max) * 100 : 100);
      const reachedEnd = direction > 0 ? precisePositionRef.current >= max : precisePositionRef.current <= 0;
      if (reachedEnd) {
        setRunning(false);
        if (looping && direction > 0) restartRef.current = window.setTimeout(() => { if (contentRef.current) contentRef.current.scrollTop = 0; setProgress(0); setRunning(true); }, restartDelay * 1000);
        return;
      }
      frameRef.current = requestAnimationFrame(scroll);
    };
    frameRef.current = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frameRef.current);
  }, [direction, looping, restartDelay, running, speed]);

  useEffect(() => () => { cancelAnimationFrame(frameRef.current); clearTimeout(restartRef.current); }, []);

  const seek = (percentage) => {
    const container = contentRef.current;
    if (!container) return;
    const next = Math.max(0, Math.min(100, percentage));
    container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight) * (next / 100);
    precisePositionRef.current = container.scrollTop;
    setProgress(next);
  };
  const nudge = (amount) => {
    if (!contentRef.current) return;
    contentRef.current.scrollTop += amount * Math.min(240, contentRef.current.clientHeight * .35);
    precisePositionRef.current = contentRef.current.scrollTop;
  };

  return (
    <div className={`language-tutor-scroller ${expanded ? "language-tutor-scroller--expanded" : ""} ${className}`.trim()}>
      <div className="language-tutor-scroller__controls" aria-label="Automatic lesson scroll controls">
        <div className="language-tutor-scroller__buttons">
          <button type="button" className={direction < 0 ? "active" : ""} onClick={() => { setDirection(-1); setRunning(true); }} aria-label="Auto-scroll up"><FaBackward /></button>
          <button type="button" className="primary" onClick={() => setRunning((value) => !value)} aria-label={running ? "Pause automatic scrolling" : "Start automatic scrolling"}>{running ? <FaPause /> : <FaPlay />}</button>
          <button type="button" className={looping ? "active" : ""} onClick={() => setLooping((value) => !value)} aria-label="Toggle looping"><FaRedoAlt /></button>
          <button type="button" className={direction > 0 ? "active" : ""} onClick={() => { setDirection(1); setRunning(true); }} aria-label="Auto-scroll down"><FaForward /></button>
          <button type="button" onClick={() => { setRunning(false); seek(0); }} aria-label="Return to top"><FaUndoAlt /></button>
          <button type="button" onClick={() => nudge(-1)} aria-label="Scroll up a little"><FaStepBackward /></button>
          <button type="button" onClick={() => nudge(1)} aria-label="Scroll down a little"><FaStepForward /></button>
        </div>
        <div className="language-tutor-scroller__settings">
          <button type="button" onClick={() => setSpeed((value) => Math.max(5, value - 5))} aria-label="Decrease scroll speed"><FaMinus /></button>
          <button type="button" onClick={() => setSpeed((value) => Math.min(200, value + 5))} aria-label="Increase scroll speed"><FaPlus /></button>
          <span>{speed} px/s</span>
          <label><span>Restart</span><input type="number" min="0" max="60" step=".5" value={restartDelay} onChange={(event) => setRestartDelay(Math.max(0, Math.min(60, Number(event.target.value) || 0)))} /><span>sec</span></label>
          <button type="button" className="wide" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Exit full window view" : "Open lesson in full window view"}>{expanded ? <FaCompressAlt /> : <FaExpandAlt />}<span>{expanded ? "Exit" : "Full window"}</span></button>
        </div>
        <label className="language-tutor-scroller__jump"><select value={jumpTarget} onChange={(event) => { const id = event.target.value; setJumpTarget(id); setRunning(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} aria-label={`Jump to ${itemType === "phrases" ? "phrase" : "word"}`}><option value="">Choose in English…</option>{items.map((item, index) => <option value={`${idPrefix}-${itemType}-${index}`} key={`${item[scriptKey]}-${index}`}>{item.en}</option>)}</select></label>
      </div>
      <div className="language-tutor-scroller__progress" role="slider" tabIndex="0" aria-label="Lesson scroll position" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)} onPointerDown={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); seek(((event.clientX - bounds.left) / bounds.width) * 100); }} onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); seek(progress + (event.key === "ArrowRight" ? 5 : -5)); } }}><span style={{ width: `${progress}%` }} /></div>
      <div className="language-tutor-scroller__content" ref={contentRef} onScroll={(event) => { const target = event.currentTarget; const max = Math.max(0, target.scrollHeight - target.clientHeight); setProgress(max ? (target.scrollTop / max) * 100 : 100); }}>{children}</div>
    </div>
  );
}

LanguageTutorScroller.propTypes = {
  children: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({ en: PropTypes.string.isRequired })).isRequired,
  itemType: PropTypes.oneOf(["phrases", "vocab"]).isRequired,
  idPrefix: PropTypes.string.isRequired,
  storagePrefix: PropTypes.string.isRequired,
  scriptKey: PropTypes.string.isRequired,
  className: PropTypes.string,
};
