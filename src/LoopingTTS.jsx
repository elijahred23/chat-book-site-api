import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "./context/AppContext";

const LoopingTTSImproved = () => {
  const synth = window.speechSynthesis;
  const { ttsText } = useAppState();
  const sampleText =
    "Learning happens best in small, repeatable loops. Speak this aloud, pause to reflect, then iterate until it sticks.";

  // Text area state; start with a helpful placeholder if nothing is set
  const [text, setText] = useState(
    "Paste or type your text here, then press Start. It will speak on loop until you stop."
  );
  // Loop counter – counts how many times the entire text has repeated
  const [loopCount, setLoopCount] = useState(0);
  // Number of times to repeat each individual sentence
  const [sentenceRepeats, setSentenceRepeats] = useState(1);
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
  const [lastAction, setLastAction] = useState("Idle");

  // Refs to track voices and playback state without triggering renders
  const voicesRef = useRef([]);
  const voiceRef = useRef(null);
  const chunksRef = useRef([]);
  const idxRef = useRef(0); // index of the current sentence
  const playingRef = useRef(false);
  const sentenceRepeatRef = useRef(0); // how many times the current sentence has been repeated so far

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
   * approximations of duration and the expected end time. The
   * calculation accounts for repeating each sentence multiple times via
   * `sentenceRepeats`.
   */
  const computeTimeEstimate = () => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    // We assume ~200 words per minute at rate=1; adjust wpm linearly
    const wpm = 200 * rate;
    const baseMinutes = words.length / (wpm || 1);
    // Multiply by the number of repeats per sentence
    const totalMinutes = baseMinutes * Math.max(sentenceRepeats, 1);
    const mins = Math.floor(totalMinutes);
    const secs = Math.round((totalMinutes - mins) * 60);
    return { mins, secs, str: (mins > 0 ? mins + "m " : "") + secs + "s" };
  };

  // Update the displayed time estimate whenever the text, rate or sentenceRepeats changes
  useEffect(() => {
    if (text.trim()) {
      const { str } = computeTimeEstimate();
      setTimeEstimate("Approximate duration: " + str);
    } else {
      setTimeEstimate("");
    }
  }, [text, rate, sentenceRepeats]);

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
   * measured as a percentage of utterances spoken relative to the
   * total number of utterances in one cycle. Each sentence may be
   * repeated multiple times, so the total number of utterances is
   * `chunksRef.current.length * sentenceRepeats`. When looping
   * indefinitely, the progress resets at the end of each cycle.
   */
  const updateProgress = (cycleComplete = false) => {
    const totalSentences = chunksRef.current.length;
    const repeats = Math.max(sentenceRepeats, 1);
    const totalUtterances = totalSentences * repeats;
    if (!totalUtterances) {
      setProgress(0);
      return;
    }
    if (cycleComplete) {
      // When a cycle completes we set progress to 100%
      setProgress(100);
    } else {
      // Compute how many utterances have been spoken in the current cycle
      const spokenUtterances = idxRef.current * repeats + sentenceRepeatRef.current;
      setProgress((spokenUtterances / totalUtterances) * 100);
    }
    // Estimate remaining time (one cycle) based on remaining utterances
    const { mins, secs } = computeTimeEstimate();
    const totalSeconds = mins * 60 + secs;
    if (!totalSeconds) {
      setEndTime("");
      return;
    }
    const fractionComplete = cycleComplete
      ? 1
      : (idxRef.current * repeats + sentenceRepeatRef.current) / totalUtterances;
    const remainingSeconds = totalSeconds * (1 - fractionComplete);
    const end = new Date(Date.now() + remainingSeconds * 1000);
    setEndTime(
      "Estimated end: " +
        end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  /**
   * Speak the next utterance. Each sentence may be repeated
   * `sentenceRepeats` times before proceeding to the next sentence. If
   * the end of the chunks array is reached and looping the entire
   * passage is enabled, reset to the beginning and increment the loop
   * counter. Otherwise mark the synthesis as complete.
   */
  const speakNext = () => {
    if (!playingRef.current) return;
    const repeats = Math.max(sentenceRepeats, 1);
    // If we've gone past the last sentence in the list
    if (idxRef.current >= chunksRef.current.length) {
      if (loop) {
        // Completed a full cycle; increment loop counter and reset
        setLoopCount((prev) => prev + 1);
        idxRef.current = 0;
        sentenceRepeatRef.current = 0;
        updateProgress(true);
        // Kick off the next cycle
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
    // Determine the current sentence to speak
    const sentence = chunksRef.current[idxRef.current];
    const utter = new SpeechSynthesisUtterance(sentence);
    if (voiceRef.current) utter.voice = voiceRef.current;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;
    // Update UI with the sentence we are about to speak
    setCurrentSentence(utter.text.trim());
    utter.onend = () => {
      // After each utterance, update repeat counters
      if (sentenceRepeatRef.current < repeats - 1) {
        sentenceRepeatRef.current += 1;
      } else {
        // Move to next sentence and reset repeat counter
        sentenceRepeatRef.current = 0;
        idxRef.current += 1;
      }
      updateProgress();
      // Continue speaking if still playing
      if (playingRef.current) {
        speakNext();
      }
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
    sentenceRepeatRef.current = 0;
    playingRef.current = true;
    setCurrentSentence("");
    setProgress(0);
    setLoopCount(0);
    updateProgress();
    speakNext();
    setLastAction("Started");
  };

  /** Pause or resume playback depending on current state. */
  const handlePause = () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setStatus("Paused");
      setLastAction("Paused");
    } else if (synth.paused) {
      synth.resume();
      setStatus("Resumed");
      setLastAction("Resumed");
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
    setLastAction("Stopped");
  };

  /** Go back one sentence if possible. Note that we cannot go back
   * within repeats; this jumps back one sentence and resets
   * repeats. */
  const handlePrev = () => {
    if (!chunksRef.current.length) return;
    // Ensure we step back at least one sentence
    if (idxRef.current > 0) {
      idxRef.current = Math.max(0, idxRef.current - 1);
      sentenceRepeatRef.current = 0;
      playingRef.current = true;
      synth.cancel();
      speakNext();
      setLastAction("Prev sentence");
    }
  };

  /** Immediately jump to the next sentence. */
  const handleNext = () => {
    if (!chunksRef.current.length) return;
    playingRef.current = true;
    synth.cancel();
    // Skip remaining repeats for current sentence and move to next sentence
    sentenceRepeatRef.current = 0;
    idxRef.current = Math.min(idxRef.current + 1, chunksRef.current.length);
    speakNext();
    setLastAction("Next sentence");
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
   * prompt the user to paste manually. */
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
    idxRef.current = 0;
    sentenceRepeatRef.current = 0;
    setLastAction("Cleared");
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const sentenceCount = text.trim() ? splitText(text.trim()).length : 0;

  // CSS styles for the component. These are scoped to this component
  // thanks to JSX syntax. The layout is responsive so that controls
  // stack vertically on narrow screens, and spacing adapts for
  // comfortable mobile usage.
  const styles = `
    .tts-container {
      max-width: 760px;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    }
    .tts-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 10px 28px rgba(15,23,42,0.08);
    }
    .tts-container.dark {
      --card-bg: #0f172a;
      --card-border: #1e293b;
      background: radial-gradient(circle at 20% 20%, #0f172a, #0b1220 45%, #0b1220 100%);
      color: #e2e8f0;
    }
    .tts-heading {
      font-size: 1.4rem;
      margin: 0 0 0.25rem 0;
      color: inherit;
    }
    textarea {
      width: 100%;
      min-height: 7rem;
      padding: 0.85rem;
      font-size: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      color: #0f172a;
      background-color: var(--textarea-bg, #fff);
      resize: vertical;
    }
    .dark textarea {
      --textarea-bg: #111827;
      color: #e2e8f0;
      border-color: #1f2937;
    }
    .controls,
    .sliders,
    .options,
    .action-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .controls button,
    .controls label,
    .sliders label,
    .options label {
      flex: 1 1 140px;
      min-width: 120px;
    }
    .sliders input[type="range"],
    .options input[type="number"] {
      width: 100%;
    }
    .progress-bar-container {
      width: 100%;
      background: #e2e8f0;
      border-radius: 999px;
      height: 12px;
      overflow: hidden;
      margin: 0.25rem 0;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #4ade80);
      transition: width 0.3s ease;
    }
    .status {
      text-align: center;
      font-weight: 700;
      font-size: 1.05rem;
    }
    .pill {
      display: inline-flex;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      background: #e2e8f0;
      color: #0f172a;
      font-size: 0.85rem;
      margin-right: 0.35rem;
      margin-bottom: 0.35rem;
    }
    .dark .pill {
      background: #1f2937;
      color: #e2e8f0;
    }
    .button {
      padding: 0.65rem 0.95rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #fff;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      color: #0f172a;
    }
    .button.primary {
      background: linear-gradient(135deg, #2563eb, #60a5fa);
      color: #fff;
      border: none;
      box-shadow: 0 10px 25px rgba(37,99,235,0.2);
    }
    .button.secondary {
      background: #f8fafc;
      color: #0f172a;
    }
    .dark .button.secondary {
      background: #111827;
      color: #e2e8f0;
    }
    .button.danger {
      background: #fca5a5;
      color: #0f172a;
      border: none;
    }
    .button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .repeat-label {
      flex: 1 1 200px;
    }
    .repeat-input-container {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.35rem;
    }
    .dark .repeat-input-container {
      background: #111827;
      border-color: #1f2937;
    }
    .repeat-btn {
      border: none;
      background: #e2e8f0;
      border-radius: 10px;
      width: 36px;
      height: 36px;
      font-size: 1.1rem;
      cursor: pointer;
    }
    .dark .repeat-btn {
      background: #1f2937;
      color: #e2e8f0;
    }
    .repeat-input {
      width: 70px;
      border: none;
      text-align: center;
      background: transparent;
      color: inherit;
      font-size: 1rem;
    }
    .headline-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    @media (max-width: 540px) {
      .controls button,
      .controls label,
      .sliders label,
      .options label {
        flex-basis: 100%;
      }
      .headline-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `;

  return (
    <div className={`tts-container ${darkMode ? "dark" : ""}`}>
      <style>{styles}</style>
      <div className="tts-card" style={{ background: "var(--card-bg)" }}>
        <div className="headline-row">
          <h1 className="tts-heading">Looping Text‑to‑Speech</h1>
          <div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              Dark mode
            </label>
          </div>
        </div>
        <p style={{ margin: "0 0 0.5rem 0", color: darkMode ? "#cbd5e1" : "#475569" }}>
          Paste text, pick your voice options, and loop it with smooth controls. Great for rehearsing scripts or language practice.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <span className="pill">Words: {wordCount}</span>
          <span className="pill">Sentences: {sentenceCount}</span>
          <span className="pill">Loops: {loopCount}</span>
          <span className="pill">Last: {lastAction}</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setLoopCount(0);
          }}
          placeholder="Paste or type your text here..."
        />
        <div className="controls">
          <label className="button secondary">
            📁 Upload .txt
            <input
              type="file"
              accept=".txt"
              hidden
              onChange={handleUpload}
            />
          </label>
          <button className="button secondary" onClick={handlePaste}>
            📋 Paste
          </button>
          <button className="button secondary" onClick={() => { setText(sampleText); setLoopCount(0); }}>
            🎯 Load Sample
          </button>
          <button className="button danger" onClick={handleClear}>
            🧹 Clear
          </button>
        </div>
      </div>

      <div className="tts-card">
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
        <div className="options">
          <label className="repeat-label">
            Repeat each sentence
            <div className="repeat-input-container">
              <button
                type="button"
                className="repeat-btn"
                onClick={() => setSentenceRepeats(prev => Math.max(1, prev - 1))}
              >
                –
              </button>

              <input
                type="number"
                min="1"
                value={sentenceRepeats}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSentenceRepeats(isNaN(val) || val < 1 ? 1 : val);
                }}
                className="repeat-input"
              />

              <button
                type="button"
                className="repeat-btn"
                onClick={() => setSentenceRepeats(prev => prev + 1)}
              >
                +
              </button>
            </div>
          </label>
        </div>
        <div className="action-row">
          <button className="button primary" onClick={handleStart}>
            ▶ Start
          </button>
          <button className="button secondary" onClick={handlePause}>
            ⏸ Pause/Resume
          </button>
          <button className="button secondary" onClick={handleStop}>
            ⏹ Stop
          </button>
          <button className="button secondary" onClick={handlePrev}>
            ⏮ Previous
          </button>
          <button className="button secondary" onClick={handleNext}>
            ⏭ Next
          </button>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="status">{status}</div>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.4em", marginTop: "0.35rem" }}>
          {currentSentence}
        </div>
        <div style={{ textAlign: "center", fontSize: "0.9rem", color: darkMode ? "#cbd5e1" : "#475569" }}>
          {timeEstimate}
        </div>
        <div style={{ textAlign: "center", fontSize: "0.9rem", color: darkMode ? "#cbd5e1" : "#475569" }}>
          {endTime}
        </div>
        <div className="options" style={{ marginTop: "0.35rem" }}>
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
            Prefer Samantha
          </label>
        </div>
      </div>
    </div>
  );
};

export default LoopingTTSImproved;
