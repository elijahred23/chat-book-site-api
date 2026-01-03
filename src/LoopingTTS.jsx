import React, { useState, useEffect, useRef } from "react";
import { useAppState, useAppDispatch, actions } from "./context/AppContext";

const LoopingTTSImproved = () => {
  const synth = window.speechSynthesis;
  const { ttsText, ttsAutoPlay } = useAppState();
  const dispatch = useAppDispatch();
  const sampleText =
    "Learning happens best in small, repeatable loops. Speak this aloud, pause to reflect, then iterate until it sticks.";

  // Text area state; start with a helpful placeholder if nothing is set
  const [text, setText] = useState(
    "Paste or type your text here, then press Start. It will speak on loop until you stop."
  );
  // Loop counter – counts how many times the entire text has repeated
  const [loopCount, setLoopCount] = useState(0);
  const [activeTab, setActiveTab] = useState("input"); // input | controls
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
  const [currentSentenceProgress, setCurrentSentenceProgress] = useState(0);
  const [endTime, setEndTime] = useState("");
  const [lastAction, setLastAction] = useState("Idle");
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Auto-start when TTS text is pushed or autoplay flag toggled (desktop/mobile unified)
  useEffect(() => {
    const candidate = (ttsText && ttsText.trim()) || text.trim() || sampleText;
    if (ttsAutoPlay && candidate) {
      setLoopCount(0);
      setActiveTab("controls");
      handleStart(candidate);
      dispatch(actions.setTtsAutoplay(false));
      dispatch(actions.setIsTTSOpen(true));
    } else if (ttsText && ttsText.trim()) {
      setLoopCount(0);
      setActiveTab("controls");
      handleStart(ttsText);
      dispatch(actions.setIsTTSOpen(true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsText, ttsAutoPlay]);

  // If TTS is already playing when opening the drawer, show controls tab
  useEffect(() => {
    if (isPlaying) {
      setActiveTab("controls");
    }
  }, [isPlaying]);

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
      setCurrentSentenceProgress(0);
      return;
    }
    if (cycleComplete) {
      // When a cycle completes we set progress to 100%
      setProgress(100);
      setCurrentSentenceProgress(100);
    } else {
      // Compute how many utterances have been spoken in the current cycle
      const spokenUtterances = idxRef.current * repeats + sentenceRepeatRef.current;
      setProgress((spokenUtterances / totalUtterances) * 100);
      // Progress within the current sentence repeat
      setCurrentSentenceProgress(((sentenceRepeatRef.current + 1) / repeats) * 100);
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
        setIsPlaying(false);
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
   * Pick a best-guess voice for stable playback.
   */
  const pickVoice = () => {
    const voices = synth.getVoices();
    if (!voices.length) return null;
    const samantha = voices.find((v) => /samantha/i.test(v.name));
    return samantha || voices.find((v) => /en[-_]US/i.test(v.lang)) || voices[0];
  };

  /**
   * Simplified single-utterance playback. If loop is enabled, repeat on end.
   */
  const speakSimple = (phrase) => {
    if (!phrase) return;
    const utter = new SpeechSynthesisUtterance(phrase);
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;
    utter.onend = () => {
      setStatus("Idle");
      setIsPlaying(false);
      if (loop && playingRef.current) {
        speakSimple(phrase);
      }
    };
    utter.onerror = () => {
      setStatus("Error");
      setIsPlaying(false);
    };
    setStatus("Speaking…");
    setIsPlaying(true);
    playingRef.current = true;
    synth.speak(utter);
  };

  /**
   * Start speaking. Cancels any ongoing speech before starting.
   */
  const handleStart = (customText) => {
    synth.cancel();
    playingRef.current = false;
    const source = ((customText ?? text) || sampleText).trim();
    if (!source) return;
    if (customText !== undefined) {
      setText(source);
    }
    setLoopCount(0);
    setProgress(0);
    setCurrentSentence(source.slice(0, 60));
    speakSimple(source);
    setLastAction("Started");
  };

  /** Pause or resume playback depending on current state. */
  const handlePause = () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setStatus("Paused");
      setLastAction("Paused");
      setIsPlaying(false);
    } else if (synth.paused) {
      synth.resume();
      setStatus("Resumed");
      setLastAction("Resumed");
      setIsPlaying(true);
    }
  };

  /** Stop speaking entirely and reset status. */
  const handleStop = () => {
    synth.cancel();
    playingRef.current = false;
    setIsPlaying(false);
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
    // Simplified: restart playback
    handleStart();
  };

  /** Immediately jump to the next sentence. */
  const handleNext = () => {
    handleStart();
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
    .controls label {
      flex: 1 1 140px;
      min-width: 120px;
    }
    .sliders {
      gap: 0.35rem;
    }
    .sliders label {
      flex: 1 1 100px;
      min-width: 90px;
      display: flex;
      flex-direction: column;
      font-size: 0.85rem;
      padding: 0.25rem 0.3rem;
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: 10px;
      background: #f8fafc;
    }
    .dark .sliders label {
      background: #111827;
    }
    .sliders input[type="range"],
    .options input[type="number"] {
      width: 100%;
      accent-color: #2563eb;
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
      flex: 1 1 140px;
      min-width: 140px;
    }
    .repeat-input-container {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.25rem 0.35rem;
    }
    .dark .repeat-input-container {
      background: #111827;
      border-color: #1f2937;
    }
    .repeat-btn {
      border: none;
      background: #e2e8f0;
      border-radius: 10px;
      width: 32px;
      height: 32px;
      font-size: 1rem;
      cursor: pointer;
    }
    .dark .repeat-btn {
      background: #1f2937;
      color: #e2e8f0;
    }
    .repeat-input {
      width: 60px;
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
    .tab-row {
      display: inline-flex;
      gap: 0.5rem;
      margin: 0.5rem 0 0.75rem 0;
      flex-wrap: wrap;
    }
    .tab-btn {
      padding: 0.55rem 0.9rem;
      border-radius: 12px;
      border: 1px solid var(--card-border, #e2e8f0);
      background: #f8fafc;
      color: inherit;
      cursor: pointer;
      font-weight: 600;
    }
    .tab-btn.active {
      background: linear-gradient(135deg, #2563eb, #60a5fa);
      color: #fff;
      border: none;
      box-shadow: 0 10px 18px rgba(37,99,235,0.2);
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
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <span className="pill">Words: {wordCount}</span>
          <span className="pill">Sentences: {sentenceCount}</span>
          <span className="pill">Loops: {loopCount}</span>
          <span className="pill">Last: {lastAction}</span>
        </div>
        <div className="tab-row">
          <button
            className={`tab-btn ${activeTab === "input" ? "active" : ""}`}
            onClick={() => setActiveTab("input")}
          >
            Input
          </button>
          <button
            className={`tab-btn ${activeTab === "controls" ? "active" : ""}`}
            onClick={() => setActiveTab("controls")}
          >
            Controls & Playback
          </button>
        </div>

        {activeTab === "input" && (
          <>
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
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <button
                className="button primary"
                onClick={() => handleStart()}
                disabled={!text.trim()}
                title="Start speaking this text"
              >
                ▶ Start from this text
              </button>
            </div>
          </>
        )}
      </div>

      {activeTab === "controls" && (
      <div className="tts-card">
        <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.65rem", background: "rgba(226,232,240,0.5)", borderRadius: "10px", color: darkMode ? "#e2e8f0" : "#0f172a" }}>
          <div style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: "0.15rem" }}>Now speaking</div>
          <div style={{ fontWeight: 700, lineHeight: 1.3 }}>
            {currentSentence || "Waiting to start..."}
          </div>
          {timeEstimate && (
            <div style={{ fontSize: "0.85rem", color: darkMode ? "#cbd5e1" : "#475569", marginTop: "0.15rem" }}>
              {timeEstimate}
            </div>
          )}
          {sentenceRepeats > 1 && (
            <div className="progress-bar-container" style={{ marginTop: "0.3rem", height: 8 }}>
              <div
                className="progress-bar"
                style={{ width: `${currentSentenceProgress}%`, background: "linear-gradient(90deg, #a855f7, #6366f1)" }}
              ></div>
            </div>
          )}
          <div className="progress-bar-container" style={{ marginTop: "0.35rem" }}>
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
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
          <button className="button primary" onClick={() => handleStart()}>
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
        <div style={{ textAlign: "center", fontSize: "0.9rem", color: darkMode ? "#cbd5e1" : "#475569" }}>
          {endTime}
        </div>
        <div className="options" style={{ marginTop: "0.35rem" }}>
          <p>
            Loop playback
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
            />
          </p>
        </div>
      </div>
      )}

    </div>
  );
};

export default LoopingTTSImproved;
