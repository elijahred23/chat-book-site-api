import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaFastBackward, FaFastForward, FaPause, FaPlay, FaRedoAlt, FaStepBackward, FaStepForward, FaStop } from "react-icons/fa";
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
    showImages: true,
    wordDelay: 0,
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
  const [showImages, setShowImages] = useState(initial.showImages);
  const [wordDelay, setWordDelay] = useState(initial.wordDelay);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pass, setPass] = useState(1);
  const [status, setStatus] = useState("Ready");
  const [photo, setPhoto] = useState(null);
  const [photoStatus, setPhotoStatus] = useState("idle");
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const indexRef = useRef(0);
  const passRef = useRef(1);
  const playbackGenerationRef = useRef(0);
  const photoRequestRef = useRef(null);

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
  const delaySeconds = Math.max(0, Number(wordDelay) || 0);

  const stop = useCallback((message = "Stopped") => {
    playbackGenerationRef.current += 1;
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
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dataset, mode, intervalSize: size, intervalRepeats: repeats, loopForever, search, facet, chunkSize: safeChunkSize, chunkIndex: safeChunkIndex, showImages, wordDelay: delaySeconds }));
    } catch {}
  }, [dataset, mode, size, repeats, loopForever, search, facet, safeChunkSize, safeChunkIndex, showImages, delaySeconds]);

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

  const settlePhotoRequest = useCallback((request, rendered) => {
    if (!request || request.settled) return;
    request.settled = true;
    if (request.renderTimer) window.clearTimeout(request.renderTimer);
    request.resolve(rendered);
  }, []);

  const requestPhoto = useCallback((query) => {
    if (!showImages || !query?.trim()) return Promise.resolve(true);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const existing = photoRequestRef.current;
    if (existing?.query === normalizedQuery) return existing.promise;

    if (existing) {
      existing.controller.abort();
      settlePhotoRequest(existing, false);
    }

    const controller = new AbortController();
    const request = { query: normalizedQuery, controller, settled: false };
    request.promise = new Promise((resolve) => { request.resolve = resolve; });
    photoRequestRef.current = request;
    setPhoto(null);
    setPhotoStatus("loading");

    fetch(`/api/vocabulary-image?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Image request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (photoRequestRef.current !== request) return;
        if (!data.image) {
          setPhotoStatus("empty");
          settlePhotoRequest(request, false);
          return;
        }
        setPhoto(data.image);
        setPhotoStatus("rendering");
        request.renderTimer = window.setTimeout(() => {
          if (photoRequestRef.current === request && !request.settled) setPhotoStatus("error");
          settlePhotoRequest(request, false);
        }, 10000);
      })
      .catch((error) => {
        if (photoRequestRef.current !== request) return;
        if (error.name !== "AbortError") setPhotoStatus("error");
        settlePhotoRequest(request, false);
      });
    return request.promise;
  }, [settlePhotoRequest, showImages]);

  const readItem = useCallback(async (item, generation) => {
    await requestPhoto(item.en);
    const isActive = () => playingRef.current && !pausedRef.current && playbackGenerationRef.current === generation;
    if (!isActive()) return;
    if (mode === "english-bengali") {
      await speak(item.en, "en-US", enVoice);
      if (isActive()) await speak(item.bn, "bn-IN", bnVoice);
      return;
    }
    await speak(item.bn, "bn-IN", bnVoice);
    if (mode === "bengali-english" && isActive()) await speak(item.en, "en-US", enVoice);
  }, [mode, speak, bnVoice, enVoice, requestPhoto]);

  const waitBeforeNextWord = useCallback((generation) => new Promise((resolve) => {
    if (!delaySeconds) return resolve(playingRef.current && !pausedRef.current && playbackGenerationRef.current === generation);
    window.setTimeout(() => {
      resolve(playingRef.current && !pausedRef.current && playbackGenerationRef.current === generation);
    }, delaySeconds * 1000);
  }), [delaySeconds]);

  const play = useCallback(async (resumeIndex, generation) => {
    let batchStart = Math.floor(resumeIndex / size) * size;
    let currentPass = passRef.current;
    while (playingRef.current && playbackGenerationRef.current === generation) {
      const batchEnd = Math.min(batchStart + size, items.length);
      for (let index = Math.max(resumeIndex, batchStart); index < batchEnd; index += 1) {
        if (!playingRef.current || pausedRef.current) return;
        indexRef.current = index;
        setCurrentIndex(index);
        setPass(currentPass);
        setStatus(`Chunk ${safeChunkIndex + 1}/${chunkCount} · Item ${index + 1}/${items.length} · Set ${Math.floor(batchStart / size) + 1}/${Math.ceil(items.length / size)} · Pass ${currentPass}/${repeats}`);
        await readItem(items[index], generation);
        const finishesPlayback = !loopForever && batchEnd >= items.length && currentPass >= repeats && index === batchEnd - 1;
        if (!finishesPlayback && !await waitBeforeNextWord(generation)) return;
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
  }, [items, loopForever, readItem, repeats, size, stop, safeChunkIndex, chunkCount, waitBeforeNextWord]);

  const start = () => {
    if (!items.length) return;
    window.speechSynthesis.cancel();
    playingRef.current = true;
    pausedRef.current = false;
    playbackGenerationRef.current += 1;
    const generation = playbackGenerationRef.current;
    setPlaying(true);
    setPaused(false);
    play(indexRef.current, generation);
  };
  const togglePause = () => {
    if (!playing) return;
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      playbackGenerationRef.current += 1;
      play(indexRef.current, playbackGenerationRef.current);
    } else {
      playbackGenerationRef.current += 1;
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

  const goToWord = (nextIndex) => {
    if (!items.length) return;
    const boundedIndex = Math.min(Math.max(nextIndex, 0), items.length - 1);
    stop(`Ready at item ${chunkStart + boundedIndex + 1}`);
    indexRef.current = boundedIndex;
    passRef.current = 1;
    setCurrentIndex(boundedIndex);
    setPass(1);
  };

  const goToInterval = (direction) => {
    const intervalStart = Math.floor(currentIndex / size) * size;
    goToWord(intervalStart + direction * size);
  };

  const goToChunk = (direction) => {
    stop("Ready");
    setChunkIndex((value) => Math.min(chunkCount - 1, Math.max(0, Number(value) + direction)));
  };

  const item = items[currentIndex];
  const chunkLabel = matchingItems.length ? `${chunkStart + 1}–${Math.min(chunkStart + safeChunkSize, matchingItems.length)}` : "0";

  useEffect(() => {
    const query = item?.en?.trim();
    if (!query || !showImages) {
      const existing = photoRequestRef.current;
      if (existing) {
        existing.controller.abort();
        settlePhotoRequest(existing, false);
        photoRequestRef.current = null;
      }
      setPhoto(null);
      setPhotoStatus("idle");
      return;
    }
    requestPhoto(query);
  }, [item?.en, requestPhoto, settlePhotoRequest, showImages]);

  useEffect(() => () => {
    const existing = photoRequestRef.current;
    if (existing) {
      existing.controller.abort();
      settlePhotoRequest(existing, false);
    }
  }, [settlePhotoRequest]);

  return (
    <section className="bn-word-loop" style={ui.card}>
      <div><strong style={ui.eyebrow}>Focused practice</strong><h1 style={ui.heading}>Bengali Word Loop</h1>
        <p style={ui.muted}>Filter a large lesson, switch between study chunks, and loop only the active chunk.</p></div>

      <section style={ui.filterPanel} aria-label="Word filters">
        <div style={ui.grid}>
          <Field label="Items"><select style={ui.input} value={dataset} onChange={(event) => { setDataset(event.target.value); setChunkIndex(0); }}><option value="vocab">Vocabulary words</option><option value="phrases">Lesson phrases</option></select></Field>
          <Field label="Words per study chunk"><select style={ui.input} value={safeChunkSize} onChange={(event) => { setChunkSize(Number(event.target.value)); setChunkIndex(0); }}><option value="10">10</option><option value="20">20</option><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="150">150</option><option value="200">200</option><option value="250">250</option><option value="300">300</option></select></Field>
        </div>
        <div style={ui.chunkRow}>
          <Field label={`Study chunk (${matchingItems.length} matching)`}><select style={ui.input} value={safeChunkIndex} onChange={(event) => setChunkIndex(Number(event.target.value))}>{Array.from({ length: chunkCount }, (_, index) => { const start = index * safeChunkSize + 1; const end = Math.min((index + 1) * safeChunkSize, matchingItems.length); return <option key={index} value={index}>Chunk {index + 1}: {matchingItems.length ? `${start}–${end}` : "empty"}</option>; })}</select></Field>
        </div>
        <div style={ui.summary}>Showing {items.length} items from positions {chunkLabel} of {matchingItems.length} filtered results, from {sourceItems.length} total.</div>
      </section>

      <div style={ui.grid}>
        <Field label="Reading mode"><select style={ui.input} value={mode} onChange={(event) => setMode(event.target.value)}><option value="bengali">Bengali only</option><option value="bengali-english">Bengali, then English</option><option value="english-bengali">English, then Bengali</option></select></Field>
        <Field label="Words per interval"><input style={ui.input} type="number" min="1" value={intervalSize} onChange={(event) => setIntervalSize(event.target.value)} /></Field>
        <Field label="Repeat each interval"><input style={ui.input} type="number" min="1" value={intervalRepeats} onChange={(event) => setIntervalRepeats(event.target.value)} /></Field>
        <Field label="Delay before next word (seconds)"><input style={ui.input} type="number" min="0" step="0.5" value={wordDelay} onChange={(event) => setWordDelay(event.target.value)} /></Field>
      </div>
      {items.length > 0 && <Field label="Skip to word in active chunk"><select style={ui.input} value={currentIndex} onChange={jumpToWord}>{items.map((word, index) => <option key={`${word.bn}-${word.en}-${index}`} value={index}>{chunkStart + index + 1}. {word.bn} · {word.en}</option>)}</select></Field>}
      <div style={ui.grid}>
        <VoiceSelect compact label="Bengali voice" value={bnVoice} voices={bnVoices} onChange={(value) => { setBnVoice(value); if (value) preview(value, "স্বাগতম", "bn-IN"); }} />
        <VoiceSelect compact label="English voice" value={enVoice} voices={enVoices} onChange={(value) => { setEnVoice(value); if (value) preview(value, "Welcome to Bengali practice", "en-US"); }} />
      </div>
      <div className="bn-word-loop__toggles" style={ui.toggles}>
        <label className="bn-word-loop__toggle" style={ui.check}><input type="checkbox" checked={loopForever} onChange={(event) => setLoopForever(event.target.checked)} /><span>Loop the active study chunk forever</span></label>
        <label className="bn-word-loop__toggle" style={ui.check}><input type="checkbox" checked={showImages} onChange={(event) => setShowImages(event.target.checked)} /><span>Show stock photos for vocabulary words</span></label>
      </div>
      {!lesson ? <div style={ui.notice}>Generate or upload a lesson in the Tutor tab first.</div> : !items.length ? <div style={ui.notice}>No items match the active filters.</div> : <>
        <div style={ui.flash}><small>Chunk {safeChunkIndex + 1}/{chunkCount} · {currentIndex + 1}/{items.length} · Overall filtered position {chunkStart + currentIndex + 1}/{matchingItems.length} · Pass {pass}/{repeats}</small><strong lang="bn" style={ui.bn}>{item?.bn}</strong><span style={ui.en}>{item?.en}</span>{item?.pronunciation && <span style={ui.muted}>{item.pronunciation}</span>}
          {showImages && <div style={ui.photoFrame} aria-live="polite">
            {photoStatus === "loading" && <span style={ui.muted}>Finding a photo…</span>}
            {photoStatus === "empty" && <span style={ui.muted}>No photo found for this item.</span>}
            {photoStatus === "error" && <span style={ui.muted}>Photo unavailable.</span>}
            {(photoStatus === "rendering" || photoStatus === "ready") && photo && <><img style={ui.photo} src={photo.imageUrl} alt={photo.title || item.en} referrerPolicy="no-referrer" onLoad={() => { setPhotoStatus("ready"); settlePhotoRequest(photoRequestRef.current, true); }} onError={() => { setPhotoStatus("error"); settlePhotoRequest(photoRequestRef.current, false); }} />
              <small style={ui.credit}>{photo.creator && <>Photo by {photo.creator} · </>}<a href={photo.sourceUrl || photo.fullImageUrl} target="_blank" rel="noreferrer">View source</a>{photo.license && <> · {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license.toUpperCase()}</a> : photo.license.toUpperCase()}</>}</small></>}
          </div>}
        </div>
        <div className="bn-word-loop__actions" style={ui.actions} role="group" aria-label="Word loop controls">
          <span className="bn-word-loop__control-group" style={ui.controlGroup}>
            <IconButton label="Previous chunk" disabled={safeChunkIndex === 0} onClick={() => goToChunk(-1)}><FaAngleDoubleLeft /></IconButton>
            <IconButton label="Next chunk" disabled={safeChunkIndex >= chunkCount - 1} onClick={() => goToChunk(1)}><FaAngleDoubleRight /></IconButton>
          </span>
          <span className="bn-word-loop__control-group" style={ui.controlGroup}>
            <IconButton label="Previous interval" disabled={currentIndex < size} onClick={() => goToInterval(-1)}><FaFastBackward /></IconButton>
            <IconButton label="Next interval" disabled={Math.floor(currentIndex / size) * size + size >= items.length} onClick={() => goToInterval(1)}><FaFastForward /></IconButton>
          </span>
          <span className="bn-word-loop__control-group" style={ui.controlGroup}>
            <IconButton label="Previous word" disabled={currentIndex === 0} onClick={() => goToWord(currentIndex - 1)}><FaStepBackward /></IconButton>
            <IconButton label="Next word" disabled={currentIndex >= items.length - 1} onClick={() => goToWord(currentIndex + 1)}><FaStepForward /></IconButton>
          </span>
          <span className="bn-word-loop__control-group" style={ui.controlGroup}>
            <IconButton primary label={paused ? "Resume" : playing ? "Playing" : "Start"} disabled={playing && !paused} onClick={start}><FaPlay /></IconButton>
            <IconButton label={paused ? "Resume" : "Pause"} disabled={!playing} onClick={togglePause}>{paused ? <FaPlay /> : <FaPause />}</IconButton>
            <IconButton label="Stop" disabled={!playing && !paused} onClick={() => stop()}><FaStop /></IconButton>
            <IconButton label="Restart chunk" onClick={restart}><FaRedoAlt /></IconButton>
          </span>
        </div>
        <strong style={ui.muted}>{status}</strong></>}
    </section>
  );
}

function VoiceSelect({ label, value, voices, onChange, compact }) {
  return <section style={compact ? ui.voiceCompact : ui.voice}><Field label={label}><select style={ui.input} value={value} onChange={(event) => onChange(event.target.value)}><option value="">System default</option>{voices.map((voice) => <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} ({voice.lang})</option>)}</select></Field></section>;
}
function Field({ label, children }) { return <label style={ui.field}><strong>{label}</strong>{children}</label>; }
// This file's existing local components intentionally use lightweight destructured props.
// eslint-disable-next-line react/prop-types
function IconButton({ label, children, disabled, onClick, primary }) { return <button type="button" style={primary ? ui.iconPrimary : ui.iconButton} disabled={disabled} onClick={onClick} aria-label={label} title={label}>{children}</button>; }

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
  chunkRow: { display: "grid", gridTemplateColumns: "minmax(210px,1fr)", alignItems: "end", gap: ".6rem" },
  field: { display: "grid", gap: ".4rem", color: "#0f172a" },
  input: { width: "100%", minHeight: 44, padding: ".65rem .75rem", border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", fontWeight: 700 },
  check: { display: "flex", gap: ".55rem", alignItems: "center", color: "#0f172a", fontWeight: 800 },
  toggles: { display: "grid", gap: ".55rem" },
  summary: { color: "#475569", fontSize: ".9rem", fontWeight: 700 },
  flash: { minHeight: 180, padding: "1.25rem", display: "grid", placeItems: "center", alignContent: "center", gap: ".45rem", border: "1px solid #bfdbfe", borderRadius: 16, background: "linear-gradient(145deg,#eff6ff,#f0fdf4)", textAlign: "center" },
  photoFrame: { width: "min(100%, 560px)", minHeight: 80, marginTop: ".5rem", display: "grid", placeItems: "center", gap: ".35rem" },
  photo: { width: "100%", maxHeight: 320, display: "block", objectFit: "cover", borderRadius: 14, background: "#e2e8f0" },
  credit: { color: "#475569" },
  bn: { color: "#0f172a", fontSize: "clamp(2rem,7vw,4rem)", lineHeight: 1.2 },
  en: { color: "#1e3a8a", fontSize: "1.2rem", fontWeight: 850 },
  actions: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".45rem" },
  controlGroup: { display: "inline-flex", gap: ".25rem", padding: ".25rem", border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc" },
  iconButton: { width: 34, height: 34, padding: 0, display: "inline-grid", placeItems: "center", border: "1px solid #94a3b8", borderRadius: 8, background: "#fff", color: "#0f172a", fontSize: ".85rem" },
  iconPrimary: { width: 34, height: 34, padding: 0, display: "inline-grid", placeItems: "center", border: 0, borderRadius: 8, background: "#0f172a", color: "#fff", fontSize: ".85rem" },
  primary: { minHeight: 44, padding: ".65rem 1rem", border: 0, borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 850 },
  button: { minHeight: 44, padding: ".65rem 1rem", border: "1px solid #94a3b8", borderRadius: 10, background: "#f8fafc", color: "#0f172a", fontWeight: 800 },
  notice: { padding: "1rem", borderRadius: 12, background: "#fff7ed", color: "#9a3412", fontWeight: 750 },
  eyebrow: { color: "#2563eb", fontSize: ".78rem", textTransform: "uppercase" },
  heading: { margin: ".25rem 0", color: "#0f172a" },
  muted: { color: "#64748b" },
};
