import React, { useState, useEffect, useRef } from "react";

const LoopingTTS = () => {
  const synth = window.speechSynthesis;
  const [text, setText] = useState(
    "Paste or type your text here, then press Start. It will speak on loop until you stop."
  );
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState("Idle");
  const [loop, setLoop] = useState(true);
  const [samOnly, setSamOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentSentence, setCurrentSentence] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");
  const [progress, setProgress] = useState(0);
  const [endTime, setEndTime] = useState("");

  const voicesRef = useRef([]);
  const voiceRef = useRef(null);
  const chunksRef = useRef([]);
  const idxRef = useRef(0);
  const playingRef = useRef(false);

  // Load voices
  const loadVoices = () => {
    voicesRef.current = synth.getVoices();
    const samantha = voicesRef.current.find((v) => /samantha/i.test(v.name));
    voiceRef.current = samOnly
      ? samantha || null
      : samantha ||
        voicesRef.current.find((v) => /en[-_]US/i.test(v.lang)) ||
        voicesRef.current[0];
  };

  useEffect(() => {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }, [samOnly]);

  // Compute time estimate string
  const computeTimeEstimate = () => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wpm = 200 * rate;
    const totalMinutes = words.length / (wpm || 1);
    const mins = Math.floor(totalMinutes);
    const secs = Math.round((totalMinutes - mins) * 60);
    return { mins, secs, str: (mins > 0 ? mins + "m " : "") + secs + "s" };
  };

  useEffect(() => {
    if (text.trim()) {
      const { str } = computeTimeEstimate();
      setTimeEstimate("Approximate duration: " + str);
    } else {
      setTimeEstimate("");
    }
  }, [text, rate]);

  const splitText = (txt) => {
    return txt.match(/[^.!?]+[.!?]*/g) || [txt];
  };

  const updateProgress = () => {
    const total = chunksRef.current.length;
    if (!total) {
      setProgress(0);
      return;
    }
    setProgress(((idxRef.current) / total) * 100);

    // Calculate estimated end time
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

  const speakNext = () => {
    if (!playingRef.current) return;
    if (idxRef.current >= chunksRef.current.length) {
      if (loop) {
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

  const handleStart = () => {
    synth.cancel();
    chunksRef.current = splitText(text.trim());
    idxRef.current = 0;
    playingRef.current = true;
    setCurrentSentence("");
    setProgress(0);
    updateProgress();
    speakNext();
  };

  const handlePause = () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setStatus("Paused");
    } else if (synth.paused) {
      synth.resume();
      setStatus("Resumed");
    }
  };

  const handleStop = () => {
    synth.cancel();
    playingRef.current = false;
    setStatus("Stopped");
    setCurrentSentence("");
    setProgress(0);
    setEndTime("");
  };

  const handlePrev = () => {
    if (!chunksRef.current.length) return;
    idxRef.current = Math.max(0, idxRef.current - 2);
    playingRef.current = true;
    synth.cancel();
    speakNext();
  };

  const handleNext = () => {
    if (!chunksRef.current.length) return;
    playingRef.current = true;
    synth.cancel();
    speakNext();
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setText(evt.target.result);
    };
    reader.readAsText(file);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText((prev) => (prev ? prev + "\n" : "") + clip);
    } catch {
      alert("Clipboard access denied. Use Ctrl+V manually.");
    }
  };

  const handleClear = () => {
    setText("");
    setStatus("Cleared");
    setCurrentSentence("");
    setProgress(0);
    setEndTime("");
  };

  return (
    <div className={`container ${darkMode ? "dark" : ""}`}>
      <style>{`
        .progress-bar-container {
          width: 100%;
          background: #e0e0e0;
          border-radius: 8px;
          height: 12px;
          overflow: hidden;
          margin: 8px 0;
        }
        .progress-bar {
          height: 100%;
          background: #4a7afe;
          transition: width 0.3s ease;
        }
      `}</style>

      <h1>Looping Text-to-Speech (Samantha)</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your text here..."
      />

      <div className="buttons">
        <label className="secondary">
          📁 Upload .txt
          <input type="file" accept=".txt" hidden onChange={handleUpload} />
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
            min="0.5"
            max="2"
            step="0.1"
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

      <div className="buttons">
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
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <div style={{ textAlign: "center", fontSize: "0.85rem" }}>
        {timeEstimate}
      </div>
      <div style={{ textAlign: "center", fontSize: "0.85rem" }}>
        {endTime}
      </div>

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
