import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BengaliTutor from "./BengaliTutor.jsx";

const LESSON_KEY = "bengali_lesson_cache";
const BN_VOICE_KEY = "bengali_tutor_voice";
const EN_VOICE_KEY = "bengali_tutor_english_voice";
const SETTINGS_KEY = "bengali_word_loop_settings";
const voiceKey = (voice) => `${voice.name}__${voice.lang}`;

const getStored = (key) => {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
};
const getLesson = () => {
  try { return JSON.parse(localStorage.getItem(LESSON_KEY) || "null"); } catch { return null; }
};
const getSettings = () => {
  try {
    return { dataset: "vocab", mode: "bengali", intervalSize: 10, intervalRepeats: 2, loopForever: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { dataset: "vocab", mode: "bengali", intervalSize: 10, intervalRepeats: 2, loopForever: true };
  }
};

export default function BengaliTutorWordJump() {
  const [tab, setTab] = useState("tutor");
  const [voices, setVoices] = useState([]);
  const [bnVoice, setBnVoice] = useState(() => getStored(BN_VOICE_KEY));
  const [enVoice, setEnVoice] = useState(() => getStored(EN_VOICE_KEY));

  useEffect(() => {
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth?.getVoices?.() || []);
    load();
    synth?.addEventListener?.("voiceschanged", load);
    return () => synth?.removeEventListener?.("voiceschanged", load);
  }, []);

  useEffect(() => {
    try {
      bnVoice ? localStorage.setItem(BN_VOICE_KEY, bnVoice) : localStorage.removeItem(BN_VOICE_KEY);
      enVoice ? localStorage.setItem(EN_VOICE_KEY, enVoice) : localStorage.removeItem(EN_VOICE_KEY);
    } catch {}
  }, [bnVoice, enVoice]);

  const bnVoices = useMemo(() => voices.filter((voice) => /^bn/i.test(voice.lang)), [voices]);
  const enVoices = useMemo(() => voices.filter((voice) => /^en/i.test(voice.lang)), [voices]);

  const preview = (key, text, lang) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((item) => voiceKey(item) === key);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    synth.cancel();
    synth.speak(utterance);
  };

  return (
    <main style={ui.page}>
      <nav style={ui.tabs} aria-label="Bengali tutor sections">
        <button type="button" style={tab === "tutor" ? ui.active : ui.tab} onClick={() => setTab("tutor")}>Tutor</button>
        <button type="button" style={tab === "loop" ? ui.active : ui.tab} onClick={() => setTab("loop")}>Word Loop</button>
      </nav>
      {tab === "tutor" ? (
        <>
          <VoiceSelect label="Bengali voice" value={bnVoice} voices={bnVoices} onChange={(value) => { setBnVoice(value); if (value) preview(value, "স্বাগতম", "bn-IN"); }} />
          <BengaliTutor />
        </>
      ) : (
        <WordLoop voices={voices} bnVoices={bnVoices} enVoices={enVoices} bnVoice={bnVoice} enVoice={enVoice}
          setBnVoice={setBnVoice} setEnVoice={setEnVoice} preview={preview} />
      )}
    </main>
  );
}

function WordLoop({ voices, bnVoices, enVoices, bnVoice, enVoice, setBnVoice, setEnVoice, preview }) {
  const initial = useMemo(getSettings, []);
  const [lesson] = useState(getLesson);
  const [dataset, setDataset] = useState(initial.dataset);
  const [mode, setMode] = useState(initial.mode);
  const [intervalSize, setIntervalSize] = useState(initial.intervalSize);
  const [intervalRepeats, setIntervalRepeats] = useState(initial.intervalRepeats);
  const [loopForever, setLoopForever] = useState(initial.loopForever);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pass, setPass] = useState(1);
  const [status, setStatus] = useState("Ready");
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const indexRef = useRef(0);
  const passRef = useRef(1);

  const items = useMemo(() => {
    const source = dataset === "phrases" ? lesson?.phrases : lesson?.vocab;
    return (source || []).filter((item) => item?.bn && item?.en);
  }, [dataset, lesson]);
  const size = Math.max(1, Number(intervalSize) || 1);
  const repeats = Math.max(1, Number(intervalRepeats) || 1);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dataset, mode, intervalSize: size, intervalRepeats: repeats, loopForever })); } catch {}
  }, [dataset, mode, size, repeats, loopForever]);

  const stop = useCallback((message = "Stopped") => {
    playingRef.current = false;
    pausedRef.current = false;
    setPlaying(false);
    setPaused(false);
    setStatus(message);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => {
    stop("Ready");
    indexRef.current = 0;
    passRef.current = 1;
    setCurrentIndex(0);
    setPass(1);
  }, [dataset, mode, intervalSize, intervalRepeats, stop]);

  const jumpToWord = (event) => {
    const nextIndex = Math.min(Math.max(Number(event.target.value) || 0, 0), Math.max(items.length - 1, 0));
    stop(`Ready at word ${nextIndex + 1}`);
    indexRef.current = nextIndex;
    passRef.current = 1;
    setCurrentIndex(nextIndex);
    setPass(1);
  };

  const speak = useCallback((text, lang, key) => new Promise((resolve) => {
    if (!playingRef.current || !text) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((item) => voiceKey(item) === key);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  }), [voices]);

  const readItem = useCallback(async (item) => {
    if (mode === "english-bengali") {
      await speak(item.en, "en-US", enVoice);
      if (playingRef.current && !pausedRef.current) await speak(item.bn, "bn-IN", bnVoice);
      return;
    }
    await speak(item.bn, "bn-IN", bnVoice);
    if (mode === "bengali-english" && playingRef.current && !pausedRef.current) await speak(item.en, "en-US", enVoice);
  }, [mode, speak, bnVoice, enVoice]);

  const play = useCallback(async (resumeIndex) => {
    let batchStart = Math.floor(resumeIndex / size) * size;
    let currentPass = passRef.current;
    while (playingRef.current) {
      const batchEnd = Math.min(batchStart + size, items.length);
      for (let index = Math.max(resumeIndex, batchStart); index < batchEnd; index += 1) {
        if (!playingRef.current || pausedRef.current) return;
        indexRef.current = index;
        setCurrentIndex(index);
        setPass(currentPass);
        setStatus(`Word ${index + 1}/${items.length} · Set ${Math.floor(batchStart / size) + 1}/${Math.ceil(items.length / size)} · Pass ${currentPass}/${repeats}`);
        await readItem(items[index]);
      }
      if (!playingRef.current || pausedRef.current) return;
      if (currentPass < repeats) {
        currentPass += 1;
        passRef.current = currentPass;
        resumeIndex = batchStart;
        continue;
      }
      batchStart = batchEnd;
      currentPass = 1;
      passRef.current = 1;
      if (batchStart >= items.length) {
        if (!loopForever) return stop("Completed");
        batchStart = 0;
        setStatus("Starting the next full loop");
      }
      resumeIndex = batchStart;
    }
  }, [items, loopForever, readItem, repeats, size, stop]);

  const start = () => {
    if (!items.length) return;
    window.speechSynthesis.cancel();
    playingRef.current = true;
    pausedRef.current = false;
    setPlaying(true);
    setPaused(false);
    play(indexRef.current);
  };
  const togglePause = () => {
    if (!playing) return;
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      play(indexRef.current);
    } else {
      pausedRef.current = true;
      setPaused(true);
      setStatus("Paused");
      window.speechSynthesis.cancel();
    }
  };
  const restart = () => {
    stop("Ready from the beginning");
    indexRef.current = 0;
    passRef.current = 1;
    setCurrentIndex(0);
    setPass(1);
  };

  const item = items[currentIndex];
  return (
    <section style={ui.card}>
      <div><strong style={ui.eyebrow}>Hands-free practice</strong><h1 style={{ margin: ".25rem 0", color: "#0f172a" }}>Bengali Word Loop</h1>
        <p style={ui.muted}>Jump to any word, then continue interval practice from that exact item.</p></div>
      <div style={ui.grid}>
        <Field label="Items"><select style={ui.input} value={dataset} onChange={(event) => setDataset(event.target.value)}><option value="vocab">Vocabulary words</option><option value="phrases">Lesson phrases</option></select></Field>
        <Field label="Reading mode"><select style={ui.input} value={mode} onChange={(event) => setMode(event.target.value)}><option value="bengali">Bengali only</option><option value="bengali-english">Bengali, then English</option><option value="english-bengali">English, then Bengali</option></select></Field>
        <Field label="Words per interval"><input style={ui.input} type="number" min="1" value={intervalSize} onChange={(event) => setIntervalSize(event.target.value)} /></Field>
        <Field label="Repeat each interval"><input style={ui.input} type="number" min="1" value={intervalRepeats} onChange={(event) => setIntervalRepeats(event.target.value)} /></Field>
      </div>
      {items.length > 0 && <Field label="Skip to word"><select style={ui.input} value={currentIndex} onChange={jumpToWord}>{items.map((word, index) => <option key={`${word.bn}-${word.en}-${index}`} value={index}>{index + 1}. {word.bn} · {word.en}</option>)}</select></Field>}
      <div style={ui.grid}>
        <VoiceSelect compact label="Bengali voice" value={bnVoice} voices={bnVoices} onChange={(value) => { setBnVoice(value); if (value) preview(value, "স্বাগতম", "bn-IN"); }} />
        <VoiceSelect compact label="English voice" value={enVoice} voices={enVoices} onChange={(value) => { setEnVoice(value); if (value) preview(value, "Welcome to Bengali practice", "en-US"); }} />
      </div>
      <label style={ui.check}><input type="checkbox" checked={loopForever} onChange={(event) => setLoopForever(event.target.checked)} /> Loop forever after all intervals finish</label>
      {!lesson ? <div style={ui.notice}>Generate or upload a lesson in the Tutor tab first.</div> : !items.length ? <div style={ui.notice}>No items are available in this lesson.</div> : <>
        <div style={ui.flash}><small>{currentIndex + 1}/{items.length} · Set {Math.floor(currentIndex / size) + 1}/{Math.ceil(items.length / size)} · Pass {pass}/{repeats}</small><strong lang="bn" style={ui.bn}>{item?.bn}</strong><span style={ui.en}>{item?.en}</span>{item?.pronunciation && <span style={ui.muted}>{item.pronunciation}</span>}</div>
        <div style={ui.actions}><button type="button" style={ui.primary} onClick={start} disabled={playing && !paused}>{paused ? "Resume" : playing ? "Playing" : "Start"}</button><button type="button" style={ui.button} onClick={togglePause} disabled={!playing}>{paused ? "Resume" : "Pause"}</button><button type="button" style={ui.button} onClick={() => stop()} disabled={!playing && !paused}>Stop</button><button type="button" style={ui.button} onClick={restart}>Restart</button></div>
        <strong style={ui.muted}>{status}</strong></>}
    </section>
  );
}

function VoiceSelect({ label, value, voices, onChange, compact }) {
  return <section style={compact ? ui.voiceCompact : ui.voice}><Field label={label}><select style={ui.input} value={value} onChange={(event) => onChange(event.target.value)}><option value="">System default</option>{voices.map((voice) => <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} ({voice.lang})</option>)}</select></Field></section>;
}
function Field({ label, children }) { return <label style={ui.field}><strong>{label}</strong>{children}</label>; }

const ui = {
  page: { minHeight: "100%", color: "#0f172a" }, tabs: { width: "min(100% - 2rem, 1100px)", margin: "1rem auto 0", padding: ".35rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".35rem", background: "#eef2f7", borderRadius: 14 },
  tab: { minHeight: 44, border: 0, borderRadius: 10, background: "transparent", color: "#334155", fontWeight: 800 }, active: { minHeight: 44, border: "1px solid #dbe3ef", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 900 },
  voice: { width: "min(100% - 2rem, 1100px)", margin: ".75rem auto 0", padding: "1rem", border: "1px solid #dbe3ef", borderRadius: 14, background: "#fff" }, voiceCompact: { padding: ".85rem", border: "1px solid #dbe3ef", borderRadius: 12, background: "#f8fafc" },
  card: { width: "min(100% - 2rem, 1100px)", margin: ".75rem auto 1.5rem", padding: "1rem", display: "grid", gap: "1rem", border: "1px solid #dbe3ef", borderRadius: 16, background: "#fff", color: "#0f172a" }, grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: ".75rem" },
  field: { display: "grid", gap: ".4rem", color: "#0f172a" }, input: { width: "100%", minHeight: 44, padding: ".65rem .75rem", border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 700 }, check: { display: "flex", gap: ".55rem", alignItems: "center", color: "#0f172a", fontWeight: 800 },
  flash: { minHeight: 180, padding: "1.25rem", display: "grid", placeItems: "center", alignContent: "center", gap: ".45rem", border: "1px solid #bfdbfe", borderRadius: 16, background: "linear-gradient(145deg,#eff6ff,#f0fdf4)", color: "#0f172a", textAlign: "center" }, bn: { color: "#0f172a", fontSize: "clamp(2rem,7vw,4rem)", lineHeight: 1.2 }, en: { color: "#1e3a8a", fontSize: "1.2rem", fontWeight: 850 },
  actions: { display: "flex", flexWrap: "wrap", gap: ".6rem" }, primary: { minHeight: 44, padding: ".65rem 1rem", border: 0, borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 850 }, button: { minHeight: 44, padding: ".65rem 1rem", border: "1px solid #94a3b8", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 800 },
  notice: { padding: "1rem", borderRadius: 12, background: "#fff7ed", color: "#9a3412", fontWeight: 750 }, eyebrow: { color: "#2563eb", fontSize: ".78rem", textTransform: "uppercase" }, muted: { color: "#64748b" },
};
