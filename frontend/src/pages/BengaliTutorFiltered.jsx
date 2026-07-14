import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BengaliTutor from "./BengaliTutor.jsx";

const LESSON_KEY = "bengali_lesson_cache";
const SETTINGS_KEY = "bengali_word_loop_settings";
const BN_VOICE_KEY = "bengali_tutor_voice";
const EN_VOICE_KEY = "bengali_tutor_english_voice";

const voiceKey = (voice) => `${voice.name}__${voice.lang}`;
const storedString = (key) => {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
};
const storedLesson = () => {
  try { return JSON.parse(localStorage.getItem(LESSON_KEY) || "null"); } catch { return null; }
};
const storedSettings = () => {
  const defaults = {
    dataset: "vocab",
    mode: "bengali",
    intervalSize: 10,
    intervalRepeats: 2,
    loopForever: true,
    search: "",
    facet: "all",
    chunkSize: 25,
    chunkIndex: 0,
  };
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch { return defaults; }
};

const itemFacets = (item) => {
  const values = [item.category, item.group, item.topic, item.level];
  if (Array.isArray(item.tags)) values.push(...item.tags);
  else if (item.tags) values.push(...String(item.tags).split(","));
  return values.map((value) => String(value || "").trim()).filter(Boolean);
};

export default function BengaliTutorFiltered() {
  const [tab, setTab] = useState("tutor");
  const [voices, setVoices] = useState([]);
  const [bnVoice, setBnVoice] = useState(() => storedString(BN_VOICE_KEY));
  const [enVoice, setEnVoice] = useState(() => storedString(EN_VOICE_KEY));

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
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((item) => voiceKey(item) === key);
    utterance.lang = voice?.lang || lang;
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
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
  const initial = useMemo(storedSettings, []);
  const [lesson] = useState(storedLesson);
  const [dataset, setDataset] = useState(initial.dataset);
  const [mode, setMode] = useState(initial.mode);
  const [intervalSize, setIntervalSize] = useState(initial.intervalSize);
  const [intervalRepeats, setIntervalRepeats] = useState(initial.intervalRepeats);
  const [loopForever, setLoopForever] = useState(initial.loopForever);
  const [search, setSearch] = useState(initial.search);
  const [facet, setFacet] = useState(initial.facet);
  const [chunkSize, setChunkSize] = useState(initial.chunkSize);
  const [chunkIndex, setChunkIndex] = useState(initial.chunkIndex);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pass, setPass] = useState(1);
  const [status, setStatus] = useState("Ready");
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const indexRef = useRef(0);
  const passRef = useRef(1);

  const sourceItems = useMemo(() => {
    const source = dataset === "phrases" ? lesson?.phrases : lesson?.vocab;
    return (source || []).filter((item) => item?.bn && item?.en);
  }, [dataset, lesson]);

  const facets = useMemo(() => [...new Set(sourceItems.flatMap(itemFacets))].sort((a, b) => a.localeCompare(b)), [sourceItems]);
  const matchingItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return sourceItems.filter((item) => {
      if (facet !== "all" && !itemFacets(item).some((value) => value.toLocaleLowerCase() === facet.toLocaleLowerCase())) return false;
      if (!query) return true;
      const haystack = [item.bn, item.en, item.pronunciation, item.context, ...itemFacets(item)].join(" ").toLocaleLowerCase();
      return haystack.includes(query);
    });
  }, [sourceItems, search, facet]);

  const safeChunkSize = Math.max(1, Number(chunkSize) || 25);
  const chunkCount = Math.max(1, Math.ceil(matchingItems.length / safeChunkSize));
  const safeChunkIndex = Math.min(Math.max(Number(chunkIndex) || 0, 0), chunkCount - 1);
  const chunkStart = safeChunkIndex * safeChunkSize;
  const items = matchingItems.slice(chunkStart, chunkStart + safeChunkSize);
  const size = Math.max(1, Number(intervalSize) || 1);
  const repeats = Math.max(1, Number(intervalRepeats) || 1);

  const stop = useCallback((message = "Stopped") => {
    playingRef.current = false;
    pausedRef.current = false;
    setPlaying(false);
    setPaused(false);
    setStatus(message);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (safeChunkIndex !== Number(chunkIndex)) setChunkIndex(safeChunkIndex);
  }, [chunkIndex, safeChunkIndex]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dataset, mode, intervalSize: size, intervalRepeats: repeats, loopForever, search, facet, chunkSize: safeChunkSize, chunkIndex: safeChunkIndex }));
    } catch {}
  }, [dataset, mode, size, repeats, loopForever, search, facet, safeChunkSize, safeChunkIndex]);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => {
    stop("Ready");
    indexRef.current = 0;
    passRef.current = 1;
    setCurrentIndex(0);
    setPass(1);
  }, [dataset, mode, intervalSize, intervalRepeats, search, facet, safeChunkSize, safeChunkIndex, stop]);

  const jumpToWord = (event) => {
    const nextIndex = Math.min(Math.max(Number(event.target.value) || 0, 0), Math.max(items.length - 1, 0));
    stop(`Ready at item ${chunkStart + nextIndex + 1}`);
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
        setStatus(`Chunk ${safeChunkIndex + 1}/${chunkCount} · Item ${index + 1}/${items.length} · Set ${Math.floor(batchStart / size) + 1}/${Math.ceil(items.length / size)} · Pass ${currentPass}/${repeats}`);
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
        if (!loopForever) return stop("Completed active chunk");
        batchStart = 0;
        setStatus("Starting the active chunk again");
      }
      resumeIndex = batchStart;
    }
  }, [items, loopForever, readItem, repeats, size, stop, safeChunkIndex, chunkCount]);

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
    stop("Ready from the beginning of this chunk");
    indexRef.current = 0;
    passRef.current = 1;
    setCurrentIndex(0);
    setPass(1);
  };

  const item = items[currentIndex];
  const chunkLabel = matchingItems.length ? `${chunkStart + 1}–${Math.min(chunkStart + safeChunkSize, matchingItems.length)}` : "0";

  return (
    <section style={ui.card}>
      <div><strong style={ui.eyebrow}>Focused practice</strong><h1 style={ui.heading}>Bengali Word Loop</h1>
        <p style={ui.muted}>Filter a large lesson, switch between study chunks, and loop only the active chunk.</p></div>

      <section style={ui.filterPanel} aria-label="Word filters">
        <div style={ui.grid}>
          <Field label="Items"><select style={ui.input} value={dataset} onChange={(event) => { setDataset(event.target.value); setChunkIndex(0); }}><option value="vocab">Vocabulary words</option><option value="phrases">Lesson phrases</option></select></Field>
          <Field label="Search"><input style={ui.input} type="search" value={search} placeholder="Bengali, English, pronunciation..." onChange={(event) => { setSearch(event.target.value); setChunkIndex(0); }} /></Field>
          <Field label="Category / tag"><select style={ui.input} value={facet} onChange={(event) => { setFacet(event.target.value); setChunkIndex(0); }}><option value="all">All categories</option>{facets.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
          <Field label="Words per study chunk"><select style={ui.input} value={safeChunkSize} onChange={(event) => { setChunkSize(Number(event.target.value)); setChunkIndex(0); }}><option value="10">10</option><option value="20">20</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></Field>
        </div>
        <div style={ui.chunkRow}>
          <button type="button" style={ui.button} disabled={safeChunkIndex === 0} onClick={() => setChunkIndex((value) => Math.max(0, Number(value) - 1))}>Previous chunk</button>
          <Field label={`Study chunk (${matchingItems.length} matching)`}><select style={ui.input} value={safeChunkIndex} onChange={(event) => setChunkIndex(Number(event.target.value))}>{Array.from({ length: chunkCount }, (_, index) => { const start = index * safeChunkSize + 1; const end = Math.min((index + 1) * safeChunkSize, matchingItems.length); return <option key={index} value={index}>Chunk {index + 1}: {matchingItems.length ? `${start}–${end}` : "empty"}</option>; })}</select></Field>
          <button type="button" style={ui.button} disabled={safeChunkIndex >= chunkCount - 1} onClick={() => setChunkIndex((value) => Math.min(chunkCount - 1, Number(value) + 1))}>Next chunk</button>
        </div>
        <div style={ui.summary}>Showing {items.length} items from positions {chunkLabel} of {matchingItems.length} filtered results, from {sourceItems.length} total.</div>
      </section>

      <div style={ui.grid}>
        <Field label="Reading mode"><select style={ui.input} value={mode} onChange={(event) => setMode(event.target.value)}><option value="bengali">Bengali only</option><option value="bengali-english">Bengali, then English</option><option value="english-bengali">English, then Bengali</option></select></Field>
        <Field label="Words per interval"><input style={ui.input} type="number" min="1" value={intervalSize} onChange={(event) => setIntervalSize(event.target.value)} /></Field>
        <Field label="Repeat each interval"><input style={ui.input} type="number" min="1" value={intervalRepeats} onChange={(event) => setIntervalRepeats(event.target.value)} /></Field>
      </div>
      {items.length > 0 && <Field label="Skip to word in active chunk"><select style={ui.input} value={currentIndex} onChange={jumpToWord}>{items.map((word, index) => <option key={`${word.bn}-${word.en}-${index}`} value={index}>{chunkStart + index + 1}. {word.bn} · {word.en}</option>)}</select></Field>}
      <div style={ui.grid}>
        <VoiceSelect compact label="Bengali voice" value={bnVoice} voices={bnVoices} onChange={(value) => { setBnVoice(value); if (value) preview(value, "স্বাগতম", "bn-IN"); }} />
        <VoiceSelect compact label="English voice" value={enVoice} voices={enVoices} onChange={(value) => { setEnVoice(value); if (value) preview(value, "Welcome to Bengali practice", "en-US"); }} />
      </div>
      <label style={ui.check}><input type="checkbox" checked={loopForever} onChange={(event) => setLoopForever(event.target.checked)} /> Loop the active study chunk forever</label>
      {!lesson ? <div style={ui.notice}>Generate or upload a lesson in the Tutor tab first.</div> : !items.length ? <div style={ui.notice}>No items match the active filters.</div> : <>
        <div style={ui.flash}><small>Chunk {safeChunkIndex + 1}/{chunkCount} · {currentIndex + 1}/{items.length} · Overall filtered position {chunkStart + currentIndex + 1}/{matchingItems.length} · Pass {pass}/{repeats}</small><strong lang="bn" style={ui.bn}>{item?.bn}</strong><span style={ui.en}>{item?.en}</span>{item?.pronunciation && <span style={ui.muted}>{item.pronunciation}</span>}</div>
        <div style={ui.actions}><button type="button" style={ui.primary} onClick={start} disabled={playing && !paused}>{paused ? "Resume" : playing ? "Playing" : "Start"}</button><button type="button" style={ui.button} onClick={togglePause} disabled={!playing}>{paused ? "Resume" : "Pause"}</button><button type="button" style={ui.button} onClick={() => stop()} disabled={!playing && !paused}>Stop</button><button type="button" style={ui.button} onClick={restart}>Restart chunk</button></div>
        <strong style={ui.muted}>{status}</strong></>}
    </section>
  );
}

function VoiceSelect({ label, value, voices, onChange, compact }) {
  return <section style={compact ? ui.voiceCompact : ui.voice}><Field label={label}><select style={ui.input} value={value} onChange={(event) => onChange(event.target.value)}><option value="">System default</option>{voices.map((voice) => <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} ({voice.lang})</option>)}</select></Field></section>;
}
function Field({ label, children }) { return <label style={ui.field}><strong>{label}</strong>{children}</label>; }

const ui = {
  page: { minHeight: "100%", color: "#0f172a" },
  tabs: { width: "min(100% - 2rem, 1100px)", margin: "1rem auto 0", padding: ".35rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".35rem", background: "#e2e8f0", borderRadius: 14 },
  tab: { minHeight: 44, border: 0, borderRadius: 10, background: "transparent", color: "#334155", fontWeight: 800 },
  active: { minHeight: 44, border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 900 },
  voice: { width: "min(100% - 2rem, 1100px)", margin: ".75rem auto 0", padding: "1rem", border: "1px solid #dbe3ef", borderRadius: 14, background: "#fff" },
  voiceCompact: { padding: ".85rem", border: "1px solid #dbe3ef", borderRadius: 12, background: "#f8fafc" },
  card: { width: "min(100% - 2rem, 1100px)", margin: ".75rem auto 1.5rem", padding: "1rem", display: "grid", gap: "1rem", border: "1px solid #dbe3ef", borderRadius: 16, background: "#fff" },
  filterPanel: { display: "grid", gap: ".8rem", padding: "1rem", border: "1px solid #bfdbfe", borderRadius: 14, background: "#f8fbff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: ".75rem" },
  chunkRow: { display: "grid", gridTemplateColumns: "auto minmax(210px,1fr) auto", alignItems: "end", gap: ".6rem" },
  field: { display: "grid", gap: ".4rem", color: "#0f172a" },
  input: { width: "100%", minHeight: 44, padding: ".65rem .75rem", border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 700 },
  check: { display: "flex", gap: ".55rem", alignItems: "center", color: "#0f172a", fontWeight: 800 },
  summary: { color: "#475569", fontSize: ".9rem", fontWeight: 700 },
  flash: { minHeight: 180, padding: "1.25rem", display: "grid", placeItems: "center", alignContent: "center", gap: ".45rem", border: "1px solid #bfdbfe", borderRadius: 16, background: "linear-gradient(145deg,#eff6ff,#f0fdf4)", textAlign: "center" },
  bn: { color: "#0f172a", fontSize: "clamp(2rem,7vw,4rem)", lineHeight: 1.2 },
  en: { color: "#1e3a8a", fontSize: "1.2rem", fontWeight: 850 },
  actions: { display: "flex", flexWrap: "wrap", gap: ".6rem" },
  primary: { minHeight: 44, padding: ".65rem 1rem", border: 0, borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 850 },
  button: { minHeight: 44, padding: ".65rem 1rem", border: "1px solid #94a3b8", borderRadius: 10, background: "#f8fafc", color: "#0f172a", fontWeight: 800 },
  notice: { padding: "1rem", borderRadius: 12, background: "#fff7ed", color: "#9a3412", fontWeight: 750 },
  eyebrow: { color: "#2563eb", fontSize: ".78rem", textTransform: "uppercase" },
  heading: { margin: ".25rem 0", color: "#0f172a" },
  muted: { color: "#64748b" },
};
