import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "./context/AppContext";

const LoopingTTS = () => {
  const synth = window.speechSynthesis;
  const { ttsText } = useAppState();

  // Text area state; start with a helpful placeholder if nothing is set
  const [text, setText] = useState(
    "Paste or type your text here, then press Start. It will speak on loop until you stop."
  );
  // Loop counter – counts how many times the text has repeated
  const [loopCount, setLoopCount] = useState(0);
  // Speech synthesis settings
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  // UI status
  const [status, setStatus] = useState("Idle");
  const [loop, setLoop] = useState(true);
  const [samOnly, setSamOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentSentence, setCurrentSentence] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");
  const [progress, setProgress] = useState(0);
  const [endTime, setEndTime] = useState("");

  // Refs to track voices and playback state without triggering renders
  const voicesRef = useRef([]);
  const voiceRef = useRef(null);
  const chunksRef = useRef([]);
  const idxRef = useRef(0);
  const playingRef = useRef(false);

  /**
   * Load available voices and select a default. When `samOnly` is true
   * we attempt to select the "Samantha" voice specifically. Otherwise
   * fall back to the first American English voice or the first voice
   * available.
   */
  const loadVoices = () => {
    voicesRef.current = synth.getVoices();
    const samantha = voicesRef.current.find((v) => /samantha/i.test(v.name));
    voiceRef.current = samOnly
      ? samantha || null
      : samantha ||
        voicesRef.current.find((v) => /en[-_]US/i.test(v.lang)) ||
        voicesRef.current[0];
  };

  // Run once and whenever `samOnly` changes to refresh the voice list
  useEffect(() => {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }, [samOnly]);

  /**
   * Compute a rough time estimate for how long the current text will
   * take to speak at the current rate. This is used to display
   * approximations of duration and the expected end time.
   */
  const computeTimeEstimate = () => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    // We assume ~200 words per minute at rate=1; adjust wpm linearly
    const wpm = 200 * rate;
    const totalMinutes = words.length / (wpm || 1);
    const mins = Math.floor(totalMinutes);
    const secs = Math.round((totalMinutes - mins) * 60);
    return { mins, secs, str: (mins > 0 ? mins + "m " : "") + secs + "s" };
  };

  // Update the displayed time estimate whenever the text or rate changes
  useEffect(() => {
    if (text.trim()) {
      const { str } = computeTimeEstimate();
      setTimeEstimate("Approximate duration: " + str);
    } else {
      setTimeEstimate("");
    }
  }, [text, rate]);

  // Load saved text from local storage or use provided ttsText from context
  useEffect(() => {
    if (ttsText) {
      setText(ttsText);
      setLoopCount(0);
    } else {
      const saved = localStorage.getItem("ttsText");
      if (saved && !text.trim()) {
        setText(saved);
        setLoopCount(0);
      }
    }
  }, [ttsText]);

  /**
   * Break the provided text into chunks based on sentence boundaries.
   * This ensures the speech synthesiser reads natural pauses at
   * punctuation marks. If no delimiters are found, the entire text is
   * returned as a single element.
   */
  const splitText = (txt) => {
    return txt.match(/[^.!?]+[.!?]*/g) || [txt];
  };

  /**
   * Update progress and calculate an estimated end time. Progress is
   * measured as a percentage of chunks spoken. The end time is
   * calculated based on the remaining fraction of the estimated
   * duration.
   */
  const updateProgress = () => {
    const total = chunksRef.current.length;
    if (!total) {
      setProgress(0);
      return;
    }
    setProgress((idxRef.current / total) * 100);
    // Estimate remaining time
    const { mins, secs } = computeTimeEstimate();
    const totalSeconds = mins * 60 + secs;
    const remainingFraction = 1 - idxRef.current / total;
    const remainingSeconds = totalSeconds * remainingFraction;
    const end = new Date(Date.now() + remainingSeconds * 1000);
    setEndTime(
      "Estimated end: " +
        end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  /**
   * Speak the next chunk of text. If the end of the chunks array is
   * reached and looping is enabled, reset to the beginning and
   * increment the loop counter. Otherwise mark the synthesis as
   * complete.
   */
  const speakNext = () => {
    if (!playingRef.current) return;
    if (idxRef.current >= chunksRef.current.length) {
      if (loop) {
        // Increment loop counter when starting over
        setLoopCount((prev) => prev + 1);
        idxRef.current = 0;
        speakNext();
      } else {
        setStatus("Finished");
        playingRef.current = false;
        setCurrentSentence("");
        setProgress(100);
        setEndTime("Completed");
      }
      return;
    }
    const utter = new SpeechSynthesisUtterance(
      chunksRef.current[idxRef.current++]
    );
    if (voiceRef.current) utter.voice = voiceRef.current;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;
    setCurrentSentence(utter.text.trim());
    utter.onend = () => {
      updateProgress();
      speakNext();
    };
    synth.speak(utter);
    setStatus("Speaking…");
    updateProgress();
  };

  /**
   * Start speaking. Resets progress, loop counter and loads the
   * necessary chunks. Cancels any ongoing speech before starting.
   */
  const handleStart = () => {
    synth.cancel();
    chunksRef.current = splitText(text.trim());
    idxRef.current = 0;
    playingRef.current = true;
    setCurrentSentence("");
    setProgress(0);
    setLoopCount(0);
    updateProgress();
    speakNext();
  };

  /** Pause or resume playback depending on current state. */
  const handlePause = () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setStatus("Paused");
    } else if (synth.paused) {
      synth.resume();
      setStatus("Resumed");
    }
  };

  /** Stop speaking entirely and reset status. */
  const handleStop = () => {
    synth.cancel();
    playingRef.current = false;
    setStatus("Stopped");
    setCurrentSentence("");
    setProgress(0);
    setEndTime("");
  };

  /** Go back one sentence if possible. */
  const handlePrev = () => {
    if (!chunksRef.current.length) return;
    idxRef.current = Math.max(0, idxRef.current - 2);
    playingRef.current = true;
    synth.cancel();
    speakNext();
  };

  /** Immediately jump to the next sentence. */
  const handleNext = () => {
    if (!chunksRef.current.length) return;
    playingRef.current = true;
    synth.cancel();
    speakNext();
  };

  /** Read a .txt file and append its contents to the text box. */
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setText(evt.target.result);
      setLoopCount(0);
    };
    reader.readAsText(file);
  };

  /** Paste clipboard contents into the text box. If access is denied
   * prompt the user to paste manually.
   */
  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText((prev) => (prev ? prev + "\n" : "") + clip);
      setLoopCount(0);
    } catch {
      alert("Clipboard access denied. Use Ctrl+V manually.");
    }
  };

  /** Clear the text box and reset all statuses. */
  const handleClear = () => {
    setText("");
    setStatus("Cleared");
    setCurrentSentence("");
    setProgress(0);
    setEndTime("");
    setLoopCount(0);
  };

  // CSS styles for the component. These are scoped to this component
  // thanks to JSX syntax. The layout is responsive so that controls
  // stack vertically on narrow screens, and spacing adapts for
  // comfortable mobile usage.
  const styles = `
    .tts-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-family: Arial, sans-serif;
    }
    .tts-container.dark {
      background-color: #1a1a1a;
      color: #eaeaea;
    }
    textarea {
      width: 100%;
      min-height: 6rem;
      padding: 0.5rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      color: #000; /* always dark black text */
      background-color: var(--textarea-bg, #fff);
      resize: vertical;
    }
    .dark textarea {
      --textarea-bg: #2d2d2d;
    }
    .controls,
    .sliders,
    .options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .controls button,
    .controls label,
    .sliders label {
      flex: 1 1 auto;
      min-width: 80px;
    }
    .sliders input[type="range"] {
      width: 100%;
    }
    .progress-bar-container {
      width: 100%;
      background: #e0e0e0;
      border-radius: 8px;
      height: 12px;
      overflow: hidden;
      margin: 0.25rem 0;
    }
    .progress-bar {
      height: 100%;
      background: #4a7afe;
      transition: width 0.3s ease;
    }
    .status {
      text-align: center;
      font-weight: bold;
    }
    .loop-count {
      text-align: center;
      font-size: 0.85rem;
    }
    @media (max-width: 480px) {
      .controls button,
      .controls label,
      .sliders label {
        flex-basis: 100%;
      }
    }
  `;

  return (
    <div className={`tts-container ${darkMode ? "dark" : ""}`}>
      <style>{styles}</style>
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>
        Looping Text‑to‑Speech (Samantha)
      </h1>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setLoopCount(0);
        }}
        placeholder="Paste or type your text here..."
      />
      <div className="controls">
        <label className="secondary">
          📁 Upload .txt
          <input
            type="file"
            accept=".txt"
            hidden
            onChange={handleUpload}
          />
        </label>
        <button className="secondary" onClick={handlePaste}>
          📋 Paste
        </button>
        <button className="danger" onClick={handleClear}>
          🧹 Clear
        </button>
      </div>
      <div className="sliders">
        <label>
          Rate
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.05"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Pitch
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Volume
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <div className="controls">
        <button className="primary" onClick={handleStart}>
          ▶ Start
        </button>
        <button className="secondary" onClick={handlePause}>
          ⏸ Pause/Resume
        </button>
        <button className="secondary" onClick={handleStop}>
          ⏹ Stop
        </button>
        <button className="secondary" onClick={handlePrev}>
          ⏮ Previous
        </button>
        <button className="secondary" onClick={handleNext}>
          ⏭ Next
        </button>
      </div>
      <div className="status">{status}</div>
      <div style={{ textAlign: "center", fontWeight: "bold" }}>
        {currentSentence}
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div style={{ textAlign: "center", fontSize: "0.85rem" }}>
        {timeEstimate}
      </div>
      <div style={{ textAlign: "center", fontSize: "0.85rem" }}>
        {endTime}
      </div>
      <div className="loop-count">Loops completed: {loopCount}</div>
      <div className="options">
        <label>
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />
          Loop playback
        </label>
        <label>
          <input
            type="checkbox"
            checked={samOnly}
            onChange={(e) => setSamOnly(e.target.checked)}
          />
          Use Samantha only
        </label>
        <label>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
          />
          Dark mode
        </label>
      </div>
    </div>
  );
};

export default LoopingTTS;