import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BengaliTutor from "./BengaliTutor.jsx";

const VOICE_STORAGE_KEY = "bengali_tutor_voice";
const ENGLISH_VOICE_STORAGE_KEY = "bengali_tutor_english_voice";
const LESSON_CACHE_KEY = "bengali_lesson_cache";

const getStoredValue = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const makeVoiceKey = (voice) => `${voice.name}__${voice.lang}`;

const findVoice = (voices, key) => voices.find((voice) => makeVoiceKey(voice) === key);

const loadSavedLesson = () => {
  try {
    const saved = localStorage.getItem(LESSON_CACHE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export default function BengaliTutorWithVoice() {
  const [activeTab, setActiveTab] = useState("tutor");
  const [voices, setVoices] = useState([]);
  const [selectedVoiceKey, setSelectedVoiceKey] = useState(() => getStoredValue(VOICE_STORAGE_KEY));
  const [selectedEnglishVoiceKey, setSelectedEnglishVoiceKey] = useState(() => getStoredValue(ENGLISH_VOICE_STORAGE_KEY));
  const selectedVoiceRef = useRef(selectedVoiceKey);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return undefined;

    const synth = window.speechSynthesis;
    const loadVoices = () => setVoices(synth.getVoices());

    loadVoices();
    synth.addEventListener?.("voiceschanged", loadVoices);

    return () => synth.removeEventListener?.("voiceschanged", loadVoices);
  }, []);

  const bengaliVoices = useMemo(
    () => voices.filter((voice) => voice.lang?.toLowerCase().startsWith("bn")),
    [voices]
  );

  const englishVoices = useMemo(
    () => voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en")),
    [voices]
  );

  useEffect(() => {
    if (!selectedVoiceKey || bengaliVoices.some((voice) => makeVoiceKey(voice) === selectedVoiceKey)) return;
    selectedVoiceRef.current = "";
    setSelectedVoiceKey("");
  }, [bengaliVoices, selectedVoiceKey]);

  useEffect(() => {
    if (!selectedEnglishVoiceKey || englishVoices.some((voice) => makeVoiceKey(voice) === selectedEnglishVoiceKey)) return;
    setSelectedEnglishVoiceKey("");
  }, [englishVoices, selectedEnglishVoiceKey]);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoiceKey;
    try {
      if (selectedVoiceKey) localStorage.setItem(VOICE_STORAGE_KEY, selectedVoiceKey);
      else localStorage.removeItem(VOICE_STORAGE_KEY);
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [selectedVoiceKey]);

  useEffect(() => {
    try {
      if (selectedEnglishVoiceKey) localStorage.setItem(ENGLISH_VOICE_STORAGE_KEY, selectedEnglishVoiceKey);
      else localStorage.removeItem(ENGLISH_VOICE_STORAGE_KEY);
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [selectedEnglishVoiceKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return undefined;

    const synth = window.speechSynthesis;
    const originalSpeak = synth.speak.bind(synth);

    const speakWithSelectedVoice = (utterance) => {
      const isBengali = utterance?.lang?.toLowerCase().startsWith("bn");
      if (isBengali && selectedVoiceRef.current) {
        const selectedVoice = findVoice(synth.getVoices(), selectedVoiceRef.current);
        if (selectedVoice) applyVoice(utterance, selectedVoice);
      }
      originalSpeak(utterance);
    };

    try {
      synth.speak = speakWithSelectedVoice;
    } catch {
      return undefined;
    }

    return () => {
      try {
        synth.speak = originalSpeak;
      } catch {
        // The browser may expose speechSynthesis.speak as read-only.
      }
    };
  }, []);

  const previewVoice = (voiceKey, sample, fallbackLang) => {
    if (!voiceKey || typeof window === "undefined" || !window.speechSynthesis) return;
    const voice = findVoice(window.speechSynthesis.getVoices(), voiceKey);
    if (!voice) return;

    const preview = new SpeechSynthesisUtterance(sample);
    preview.lang = voice.lang || fallbackLang;
    applyVoice(preview, voice);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(preview);
  };

  const handleBengaliVoiceChange = (event) => {
    const voiceKey = event.target.value;
    selectedVoiceRef.current = voiceKey;
    setSelectedVoiceKey(voiceKey);
    previewVoice(voiceKey, "স্বাগতম", "bn-IN");
  };

  const handleEnglishVoiceChange = (event) => {
    const voiceKey = event.target.value;
    setSelectedEnglishVoiceKey(voiceKey);
    previewVoice(voiceKey, "Welcome to Bengali practice", "en-US");
  };

  return (
    <main style={styles.page}>
      <nav style={styles.tabs} aria-label="Bengali tutor sections">
        <button
          type="button"
          style={activeTab === "tutor" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("tutor")}
        >
          Tutor
        </button>
        <button
          type="button"
          style={activeTab === "loop" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("loop")}
        >
          Word Loop
        </button>
      </nav>

      {activeTab === "tutor" ? (
        <>
          <VoiceSelect
            id="bengali-voice-select"
            label="Bengali voice"
            value={selectedVoiceKey}
            voices={bengaliVoices}
            onChange={handleBengaliVoiceChange}
            helpText="This browser/device voice is used for Bengali pronunciation throughout the tutor."
          />
          <BengaliTutor />
        </>
      ) : (
        <WordLoop
          bengaliVoices={bengaliVoices}
          englishVoices={englishVoices}
          selectedBengaliVoiceKey={selectedVoiceKey}
          selectedEnglishVoiceKey={selectedEnglishVoiceKey}
          onBengaliVoiceChange={handleBengaliVoiceChange}
          onEnglishVoiceChange={handleEnglishVoiceChange}
        />
      )}
    </main>
  );
}

function WordLoop({
  bengaliVoices,
  englishVoices,
  selectedBengaliVoiceKey,
  selectedEnglishVoiceKey,
  onBengaliVoiceChange,
  onEnglishVoiceChange,
}) {
  const [lesson, setLesson] = useState(loadSavedLesson);
  const [dataset, setDataset] = useState("vocab");
  const [playbackMode, setPlaybackMode] = useState("bengali");
  const [loopForever, setLoopForever] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState("Ready");
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const indexRef = useRef(0);

  const items = useMemo(() => {
    const source = dataset === "phrases" ? lesson?.phrases : lesson?.vocab;
    return (source || []).filter((item) => item?.bn && item?.en);
  }, [dataset, lesson]);

  const stop = useCallback(() => {
    playingRef.current = false;
    pausedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setStatus("Stopped");
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    setLesson(loadSavedLesson());
    return stop;
  }, [stop]);

  useEffect(() => {
    stop();
    indexRef.current = 0;
    setCurrentIndex(0);
    setStatus("Ready");
  }, [dataset, playbackMode, stop]);

  const speakText = useCallback((text, lang, voiceKey) => new Promise((resolve) => {
    if (!playingRef.current || !text || typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = findVoice(window.speechSynthesis.getVoices(), voiceKey);
    if (voice) applyVoice(utterance, voice);
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  }), []);

  const playFromIndex = useCallback(async (startIndex) => {
    if (!items.length) return;

    let index = startIndex;
    while (playingRef.current) {
      if (pausedRef.current) return;

      const item = items[index];
      indexRef.current = index;
      setCurrentIndex(index);
      setStatus(`Reading ${index + 1} of ${items.length}`);

      await speakText(item.bn, "bn-IN", selectedBengaliVoiceKey);
      if (!playingRef.current || pausedRef.current) return;

      if (playbackMode === "bengali-english") {
        await speakText(item.en, "en-US", selectedEnglishVoiceKey);
        if (!playingRef.current || pausedRef.current) return;
      }

      index += 1;
      if (index >= items.length) {
        if (!loopForever) {
          playingRef.current = false;
          setIsPlaying(false);
          setStatus("Completed");
          return;
        }
        index = 0;
        setStatus("Starting the next loop");
      }
    }
  }, [items, loopForever, playbackMode, selectedBengaliVoiceKey, selectedEnglishVoiceKey, speakText]);

  const start = () => {
    if (!items.length || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    playingRef.current = true;
    pausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    setStatus("Starting...");
    playFromIndex(indexRef.current);
  };

  const togglePause = () => {
    if (!isPlaying || typeof window === "undefined" || !window.speechSynthesis) return;

    if (isPaused) {
      pausedRef.current = false;
      setIsPaused(false);
      setStatus("Resuming...");
      playFromIndex(indexRef.current);
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      setStatus("Paused");
      window.speechSynthesis.cancel();
    }
  };

  const restart = () => {
    stop();
    indexRef.current = 0;
    setCurrentIndex(0);
    setStatus("Ready from the beginning");
  };

  const currentItem = items[currentIndex];

  return (
    <section style={styles.loopCard}>
      <div>
        <span style={styles.eyebrow}>Hands-free practice</span>
        <h1 style={styles.heading}>Bengali Word Loop</h1>
        <p style={styles.description}>
          Read every saved lesson item one by one. Choose Bengali only or Bengali followed by its English meaning.
        </p>
      </div>

      <div style={styles.controlGrid}>
        <label style={styles.field}>
          <strong>Items</strong>
          <select style={styles.select} value={dataset} onChange={(event) => setDataset(event.target.value)}>
            <option value="vocab">Vocabulary words</option>
            <option value="phrases">Lesson phrases</option>
          </select>
        </label>

        <label style={styles.field}>
          <strong>Reading mode</strong>
          <select style={styles.select} value={playbackMode} onChange={(event) => setPlaybackMode(event.target.value)}>
            <option value="bengali">Bengali only</option>
            <option value="bengali-english">Bengali, then English</option>
          </select>
        </label>
      </div>

      <div style={styles.voiceGrid}>
        <VoiceSelect
          id="loop-bengali-voice-select"
          label="Bengali voice"
          value={selectedBengaliVoiceKey}
          voices={bengaliVoices}
          onChange={onBengaliVoiceChange}
          compact
        />
        <VoiceSelect
          id="loop-english-voice-select"
          label="English voice"
          value={selectedEnglishVoiceKey}
          voices={englishVoices}
          onChange={onEnglishVoiceChange}
          compact
        />
      </div>

      <label style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={loopForever}
          onChange={(event) => setLoopForever(event.target.checked)}
        />
        Loop forever
      </label>

      {!lesson ? (
        <div style={styles.notice}>Generate or upload a lesson in the Tutor tab first.</div>
      ) : !items.length ? (
        <div style={styles.notice}>This lesson does not contain any {dataset === "vocab" ? "vocabulary words" : "phrases"}.</div>
      ) : (
        <>
          <div style={styles.nowReading} aria-live="polite">
            <span style={styles.counter}>{currentIndex + 1} / {items.length}</span>
            <strong lang="bn" style={styles.bengaliText}>{currentItem?.bn}</strong>
            {playbackMode === "bengali-english" && <span style={styles.englishText}>{currentItem?.en}</span>}
            {currentItem?.pronunciation && <small style={styles.pronunciation}>{currentItem.pronunciation}</small>}
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.primaryButton} onClick={start} disabled={isPlaying && !isPaused}>
              {isPaused ? "Resume" : isPlaying ? "Playing" : "Start"}
            </button>
            <button type="button" style={styles.secondaryButton} onClick={togglePause} disabled={!isPlaying}>
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button type="button" style={styles.secondaryButton} onClick={stop} disabled={!isPlaying && !isPaused}>
              Stop
            </button>
            <button type="button" style={styles.secondaryButton} onClick={restart}>
              Restart
            </button>
          </div>
          <div style={styles.status} role="status">{status}</div>
        </>
      )}
    </section>
  );
}

function VoiceSelect({ id, label, value, voices, onChange, helpText, compact = false }) {
  return (
    <section style={compact ? styles.compactVoicePanel : styles.voicePanel} aria-label={`${label} settings`}>
      <label style={styles.field} htmlFor={id}>
        <strong>{label}</strong>
        <select id={id} value={value} onChange={onChange} style={styles.select}>
          <option value="">System default</option>
          {voices.map((voice) => (
            <option key={makeVoiceKey(voice)} value={makeVoiceKey(voice)}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </label>
      {helpText && <span style={styles.helpText}>{helpText}</span>}
    </section>
  );
}

const applyVoice = (utterance, voice) => {
  utterance.voice = voice;
  utterance.lang = voice.lang || utterance.lang;
};

const styles = {
  page: { minHeight: "100%" },
  tabs: {
    width: "min(100% - 2rem, 1100px)",
    margin: "1rem auto 0",
    padding: "0.35rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.35rem",
    border: "1px solid #dbe3ef",
    borderRadius: "14px",
    background: "#eef2f7",
  },
  tab: {
    minHeight: "44px",
    border: 0,
    borderRadius: "10px",
    background: "transparent",
    color: "#475569",
    cursor: "pointer",
    fontWeight: 800,
  },
  activeTab: {
    minHeight: "44px",
    border: "1px solid #dbe3ef",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  },
  voicePanel: {
    width: "min(100% - 2rem, 1100px)",
    margin: "0.75rem auto 0",
    padding: "0.9rem 1rem",
    display: "grid",
    gap: "0.45rem",
    border: "1px solid #dbe3ef",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
  },
  compactVoicePanel: {
    padding: "0.85rem",
    display: "grid",
    gap: "0.4rem",
    border: "1px solid #dbe3ef",
    borderRadius: "12px",
    background: "#f8fafc",
  },
  loopCard: {
    width: "min(100% - 2rem, 1100px)",
    margin: "0.75rem auto 1.5rem",
    padding: "1rem",
    display: "grid",
    gap: "1rem",
    border: "1px solid #dbe3ef",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.09)",
  },
  eyebrow: { color: "#2563eb", fontSize: "0.78rem", fontWeight: 900, textTransform: "uppercase" },
  heading: { margin: "0.25rem 0", color: "#0f172a" },
  description: { margin: 0, color: "#64748b", lineHeight: 1.5 },
  controlGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" },
  voiceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" },
  field: { display: "grid", gap: "0.4rem", color: "#0f172a" },
  select: {
    width: "100%",
    minHeight: "44px",
    padding: "0.65rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
  },
  helpText: { color: "#64748b", fontSize: "0.88rem" },
  checkboxRow: { display: "flex", alignItems: "center", gap: "0.55rem", color: "#0f172a", fontWeight: 800 },
  notice: { padding: "1rem", borderRadius: "12px", background: "#fff7ed", color: "#9a3412", fontWeight: 750 },
  nowReading: {
    minHeight: "180px",
    padding: "1.25rem",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: "0.45rem",
    border: "1px solid #bfdbfe",
    borderRadius: "16px",
    background: "linear-gradient(145deg, #eff6ff, #f0fdf4)",
    textAlign: "center",
  },
  counter: { color: "#64748b", fontSize: "0.82rem", fontWeight: 900 },
  bengaliText: { color: "#0f172a", fontSize: "clamp(2rem, 7vw, 4rem)", lineHeight: 1.2 },
  englishText: { color: "#1e3a8a", fontSize: "1.2rem", fontWeight: 850 },
  pronunciation: { color: "#64748b", fontSize: "1rem", fontWeight: 700 },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.6rem" },
  primaryButton: {
    minHeight: "44px",
    padding: "0.65rem 1rem",
    border: 0,
    borderRadius: "10px",
    background: "#0f172a",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 850,
  },
  secondaryButton: {
    minHeight: "44px",
    padding: "0.65rem 1rem",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: 800,
  },
  status: { color: "#475569", fontWeight: 750 },
};
