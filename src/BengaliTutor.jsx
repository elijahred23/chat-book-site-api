import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ClipLoader } from "react-spinners";
import { getGeminiResponse } from "./utils/callGemini";
import ActionButtons from "./ui/ActionButtons.jsx";

const DEFAULT_PROMPT = "Everyday greetings at a coffee shop";
const LESSON_CACHE_KEY = "bengali_lesson_cache";
const INPUT_CACHE_KEY = "bengali_lesson_inputs";
const CORRECT_TIME = 0;
const INCORRECT_TIME = 500;

const buildPrompt = (topic, level, focus) => `
You are a Bengali language tutor. Create a concise lesson as JSON (no extra text) with this shape:
{
  "title": "...",
  "summary": "...",
  "level": "beginner|intermediate|advanced",
  "topic": "...",
  "focus": "${focus}",
  "phrases": [
    {
      "bn": "Bengali phrase",
      "pronunciation": "Latin-script pronunciation",
      "en": "English meaning",
      "context": "When to use it"
    }
  ],
  "vocab": [
    { "bn": "word", "pronunciation": "...", "en": "meaning" }
  ],
  "practice": [
    { "type": "translation", "prompt": "English prompt", "answer": "Bengali answer" },
    { "type": "fill_blank", "prompt": "Sentence with ____", "answer": "Correct Bengali" }
  ],
  "notes": ["short tip", "short tip"]
}
Rules: Keep Bengali accurate, add pronunciations, keep JSON valid and parseable. Topic: ${topic}. Level: ${level}.`;

const parseJson = (text) => {
  if (!text) throw new Error("Empty response");
  const codeMatch = text.match(/```json\\s*([\\s\\S]*?)```/i);
  const raw = codeMatch?.[1] ?? text;
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
  const snippet = raw.slice(firstBrace, lastBrace + 1);
  return JSON.parse(snippet);
};

const useVoices = () => {
  const [voices, setVoices] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => {
      const list = synth.getVoices?.() || [];
      setVoices(list);
      setReady(list.length > 0);
    };
    load();
    const id1 = setTimeout(load, 300);
    const id2 = setTimeout(load, 900);
    synth.onvoiceschanged = load;
    return () => {
      clearTimeout(id1);
      clearTimeout(id2);
      synth.onvoiceschanged = null;
    };
  }, []);
  return { voices, ready };
};

export default function BengaliTutor() {
  const [topic, setTopic] = useState(() => {
    try {
      const saved = localStorage.getItem(INPUT_CACHE_KEY);
      return saved ? JSON.parse(saved).topic || DEFAULT_PROMPT : DEFAULT_PROMPT;
    } catch {
      return DEFAULT_PROMPT;
    }
  });
  const [level, setLevel] = useState(() => {
    try {
      const saved = localStorage.getItem(INPUT_CACHE_KEY);
      return saved ? JSON.parse(saved).level || "beginner" : "beginner";
    } catch {
      return "beginner";
    }
  });
  const [focus, setFocus] = useState(() => {
    try {
      const saved = localStorage.getItem(INPUT_CACHE_KEY);
      return saved ? JSON.parse(saved).focus || "conversation" : "conversation";
    } catch {
      return "conversation";
    }
  });
  const [lesson, setLesson] = useState(() => {
    try {
      const saved = localStorage.getItem(LESSON_CACHE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [setupTab, setSetupTab] = useState("generate");
  const [selectedGroups, setSelectedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("bn_selected_groups");
      return saved ? JSON.parse(saved) : { vocab: [], phrases: [] };
    } catch {
      return { vocab: [], phrases: [] };
    }
  });
  const [matchOptionsCount, setMatchOptionsCount] = useState(4);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [error, setError] = useState("");
  const [vocabMp3Loading, setVocabMp3Loading] = useState(false);
  const [phraseMp3Loading, setPhraseMp3Loading] = useState(false);
  const [gameDirection, setGameDirection] = useState(() => {
    try {
      return localStorage.getItem("bn_game_direction") || "bn-en";
    } catch {
      return "bn-en";
    }
  });
  const [showPhraseActions, setShowPhraseActions] = useState(() => {
    try {
      const saved = localStorage.getItem("bn_show_phrase_actions");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [gameQuestion, setGameQuestion] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [gameChoice, setGameChoice] = useState(null);
  const [gameScore, setGameScore] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  const [tfQuestion, setTfQuestion] = useState(null);
  const [tfResult, setTfResult] = useState(null);
  const [tfScore, setTfScore] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  const [audioQuestion, setAudioQuestion] = useState(null);
  const [audioResult, setAudioResult] = useState(null);
  const [audioChoice, setAudioChoice] = useState(null);
  const [audioScore, setAudioScore] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  const [contentTab, setContentTab] = useState("phrases"); // switch between phrases, vocab, games
  const [gameDataset, setGameDataset] = useState("vocab"); // vocab | phrases
  const [masteryQueue, setMasteryQueue] = useState([]);
  const [masteryIndex, setMasteryIndex] = useState(0);
  const [masteryCorrectCount, setMasteryCorrectCount] = useState(0);
  const [masteryTarget, setMasteryTarget] = useState(3);
  const [masteryResult, setMasteryResult] = useState(null);
  const [masteryChoice, setMasteryChoice] = useState(null);
  const [masteryOptions, setMasteryOptions] = useState([]);
  const [masteryScore, setMasteryScore] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0, finishedStreakSum: 0, finishedStreakCount: 0 });
  const [activeGameTab, setActiveGameTab] = useState("match");
  const { voices, ready: voicesReady } = useVoices();
  const audioCacheRef = React.useRef(new Map()); // cache Bengali audio URLs by text+lang
  const batchCacheRef = React.useRef(new Map()); // cache combined MP3 blobs for batch vocab
  const loopStateRef = React.useRef({ key: null, mode: null, abort: false, audio: null });
  const [, forceRender] = useState(0); // quick rerender for loop status

  useEffect(() => {
    if (!lesson) return;
    const currentRef = lesson.title || lesson.topic || "";
    const storedRef = localStorage.getItem("bn_selected_groups_ref");
    if (storedRef !== currentRef) {
      const vCount = Math.ceil((lesson.vocab?.length || 0) / 10);
      const pCount = Math.ceil((lesson.phrases?.length || 0) / 10);
      const defaultState = {
        vocab: Array.from({ length: vCount }, (_, i) => i),
        phrases: Array.from({ length: pCount }, (_, i) => i),
      };
      setSelectedGroups(defaultState);
      localStorage.setItem("bn_selected_groups_ref", currentRef);
    }
  }, [lesson]);

  useEffect(() => {
    localStorage.setItem("bn_game_direction", gameDirection);
  }, [gameDirection]);

  useEffect(() => {
    localStorage.setItem("bn_selected_groups", JSON.stringify(selectedGroups));
  }, [selectedGroups]);

  const filteredPhrases = useMemo(() => {
    if (!lesson?.phrases) return [];
    if (!selectedGroups.phrases) return lesson.phrases;
    return lesson.phrases.filter((_, idx) => selectedGroups.phrases.includes(Math.floor(idx / 10)));
  }, [lesson, selectedGroups.phrases]);

  const filteredVocab = useMemo(() => {
    if (!lesson?.vocab) return [];
    if (!selectedGroups.vocab) return lesson.vocab;
    return lesson.vocab.filter((_, idx) => selectedGroups.vocab.includes(Math.floor(idx / 10)));
  }, [lesson, selectedGroups.vocab]);

  const toggleGroupSelection = (type, idx) => {
    setSelectedGroups(prev => ({
      ...prev,
      [type]: prev[type].includes(idx) ? prev[type].filter(i => i !== idx) : [...prev[type], idx]
    }));
  };

  const selectAllGroups = (type) => {
    const total = (type === "phrases" ? lesson.phrases : lesson.vocab)?.length || 0;
    const count = Math.ceil(total / 10);
    setSelectedGroups(prev => ({
      ...prev,
      [type]: Array.from({ length: count }, (_, i) => i)
    }));
  };

  const clearAllGroups = (type) => {
    setSelectedGroups(prev => ({
      ...prev,
      [type]: []
    }));
  };

  const playAudioUrl = (url) =>
    new Promise((resolve, reject) => {
      const audio = new Audio(url);
      loopStateRef.current.audio = audio;
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });

  const synthesizeAndPlay = async (text, lang) => {
    const cacheKey = `${lang}::${text}`;
    let url = audioCacheRef.current.get(cacheKey);
    if (!url) {
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (!resp.ok) throw new Error("TTS failed");
      const blob = await resp.blob();
      url = URL.createObjectURL(blob);
      // Cache Bengali heavily; cache English to smooth looping as well
      audioCacheRef.current.set(cacheKey, url);
    }
    try {
      await playAudioUrl(url);
    } finally {
      // keep cached URL for reuse; do not revoke
    }
  };

  const speak = async (text, langPref = "bn", opts = {}) => {
    const forceApi = !!opts.forceApi;
    if (!text) return;

    // If explicitly forcing API, honor the requested language directly.
    if (forceApi) {
      try {
        await synthesizeAndPlay(text, langPref || "bn-IN");
      } catch {}
      return;
    }

    if (langPref.startsWith("bn")) {
      // Bengali: use backend TTS only
      const langCandidates = ["bn-IN", "bn-BD", "bn"];
      for (const langCode of langCandidates) {
        try {
          await synthesizeAndPlay(text, langCode);
          return;
        } catch {}
      }
      return;
    }

    // English: prefer Sarah or any English voice locally unless forcing API
    const trySpeechSynth = () => {
      if (typeof window === "undefined" || !window.speechSynthesis) return false;
      const synth = window.speechSynthesis;
      const list = synth.getVoices?.() || voices;
      const sarah = list.find((v) => v.name?.toLowerCase().includes("sarah"));
      const enVoice = sarah || list.find((v) => v.lang?.toLowerCase().startsWith("en"));
      const utter = new SpeechSynthesisUtterance(text);
      if (enVoice) utter.voice = enVoice;
      utter.lang = enVoice?.lang || "en-US";
      synth.cancel();
      synth.resume?.();
      loopStateRef.current.audio = null;
      synth.speak(utter);
      return true;
    };

    const synthWorked = forceApi ? false : trySpeechSynth();
    if (synthWorked) return;

    // Backend TTS for English (forced or fallback)
    try {
      await synthesizeAndPlay(text, "en-US");
    } catch {}
  };

  const stopLoops = () => {
    loopStateRef.current.abort = true;
    loopStateRef.current.mode = null;
    loopStateRef.current.key = null;
    loopStateRef.current.audio?.pause?.();
    loopStateRef.current.audio = null;
    forceRender((x) => x + 1);
  };

  const loopSequence = async (key, mode, segments) => {
    stopLoops();
    loopStateRef.current.abort = false;
    loopStateRef.current.mode = mode;
    loopStateRef.current.key = key;
    forceRender((x) => x + 1);
    try {
      while (!loopStateRef.current.abort) {
        for (const seg of segments) {
          if (loopStateRef.current.abort) break;
          try {
            await speak(seg.text, seg.lang, { forceApi: seg.forceApi });
          } catch (err) {
            console.warn("Loop speak failed", err);
          }
          if (loopStateRef.current.abort) break;
          // small gap between clips to avoid overlap
          await new Promise((res) => setTimeout(res, 120));
        }
      }
    } finally {
      stopLoops();
    }
  };

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError("");
      const promptText = buildPrompt(topic || DEFAULT_PROMPT, level, focus);
      const resp = await getGeminiResponse(promptText);
      const parsed = parseJson(resp);
      setLesson(parsed);
      setSetupTab("lesson");
      localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(parsed));
      localStorage.setItem(
        INPUT_CACHE_KEY,
        JSON.stringify({ topic: topic || DEFAULT_PROMPT, level, focus })
      );
    } catch (err) {
      setError(err?.message || "Failed to build lesson");
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!lesson) return;
    const filteredData = {
      ...lesson,
      phrases: filteredPhrases,
      vocab: filteredVocab,
    };
    const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${lesson.title || "bengali-lesson"}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadWords = () => {
    if (!filteredVocab.length) return;
    const lines = filteredVocab.map((w) => `${w.bn} (${w.pronunciation || ""}) - ${w.en}`).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${lesson.title || "bengali-words"}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const shellStyles = `
    .bn-shell {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 0.75rem;
      font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    }
    .bn-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 10px 24px rgba(15,23,42,0.08);
    }
    .bn-grid {
      display: grid;
      gap: 0.75rem;
    }
    @media (min-width: 820px) {
      .bn-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .bn-pill {
      padding: 0.4rem 0.7rem;
      border-radius: 999px;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      font-size: 0.9rem;
    }
    .bn-section {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem;
      background: #f8fafc;
    }
    .bn-btn {
      padding: 0.65rem 0.85rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #0f172a;
      color: #fff;
      cursor: pointer;
      font-weight: 700;
      box-shadow: 0 10px 24px rgba(0,0,0,0.08);
      transition: none;
    }
    .bn-btn:hover {
      background: #0f172a;
    }
    .bn-btn.secondary {
      background: #f8fafc;
      color: #0f172a;
      border-color: #e2e8f0;
    }
    .bn-btn.secondary:hover {
      background: #f8fafc;
    }
    .bn-btn.active {
      background: #0f172a;
      color: #fff;
    }
    .bn-icon-btn {
      width: 36px;
      height: 36px;
      padding: 0.35rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      line-height: 1;
    }
    .bn-stop-btn {
      background: #ef4444;
      border-color: #ef4444;
      color: #fff;
      box-shadow: 0 10px 24px rgba(239,68,68,0.18);
    }
    .bn-stop-btn:hover {
      filter: brightness(0.95);
    }
    .bn-row {
      display: grid;
      gap: 6px;
    }
    .bn-game-shell {
      display: grid;
      gap: 14px;
      padding: 1rem;
      border: 1px solid #dbe3ef;
      border-radius: 16px;
      background:
        radial-gradient(circle at top left, rgba(14,165,233,0.10), transparent 32%),
        linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      box-shadow: 0 18px 40px rgba(15,23,42,0.08);
    }
    .bn-game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .bn-game-title {
      display: grid;
      gap: 2px;
    }
    .bn-game-title h4 {
      margin: 0;
      color: #0f172a;
      font-size: 1.05rem;
      letter-spacing: 0;
    }
    .bn-game-title span {
      color: #64748b;
      font-size: 0.86rem;
      font-weight: 700;
    }
    .bn-game-controls {
      display: grid;
      gap: 8px;
    }
    .bn-game-scoreboard {
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .bn-stat {
      min-width: 0;
      padding: 0.65rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: rgba(255,255,255,0.86);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
    }
    .bn-stat-label {
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .bn-stat-value {
      margin-top: 2px;
      color: #0f172a;
      font-size: 1rem;
      font-weight: 900;
    }
    .bn-game-card {
      display: grid;
      gap: 12px;
      padding: 1rem;
      border: 1px solid #dbe3ef;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 14px 34px rgba(15,23,42,0.08);
    }
    .bn-game-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .bn-game-prompt {
      color: #0f172a;
      font-size: 1.25rem;
      font-weight: 900;
      line-height: 1.25;
    }
    .bn-game-subtext {
      color: #64748b;
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1.35;
    }
    .bn-game-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .bn-game-options {
      display: grid;
      gap: 8px;
    }
    .bn-game-option {
      width: 100%;
      border: 1px solid #dbe3ef;
      background: #ffffff;
      color: #1e293b;
      padding: 0.75rem 0.85rem;
      border-radius: 12px;
      font-weight: 800;
      text-align: left;
      cursor: pointer;
      box-shadow: 0 8px 18px rgba(15,23,42,0.05);
      transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
    }
    .bn-game-option:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(15,23,42,0.08);
    }
    .bn-game-option:disabled {
      cursor: default;
      transform: none;
    }
    .bn-game-option.correct {
      background: #dcfce7;
      border-color: #16a34a;
      color: #14532d;
      box-shadow: 0 10px 24px rgba(22,163,74,0.14);
    }
    .bn-game-option.correct:hover {
      background: #dcfce7 !important;
    }
    .bn-game-option.wrong {
      background: #fee2e2;
      border-color: #ef4444;
      color: #7f1d1d;
      box-shadow: 0 10px 24px rgba(239,68,68,0.14);
    }
    .bn-game-option.wrong:hover {
      background: #fee2e2 !important;
    }
    .bn-option-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.45rem;
      height: 1.45rem;
      margin-right: 0.65rem;
      border-radius: 999px;
      background: #f1f5f9;
      color: #475569;
      font-size: 0.76rem;
      font-weight: 900;
    }
    .bn-game-feedback {
      padding: 0.75rem 0.85rem;
      border-radius: 12px;
      font-weight: 800;
    }
    .bn-game-feedback.correct {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .bn-game-feedback.wrong {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .bn-true-btn {
      background: #dcfce7;
      border-color: #16a34a;
      color: #14532d;
    }
    .bn-true-btn:hover {
      background: #dcfce7;
    }
    .bn-false-btn {
      background: #fee2e2;
      border-color: #ef4444;
      color: #7f1d1d;
    }
    .bn-false-btn:hover {
      background: #fee2e2;
    }
    .bn-tabs {
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
    .bn-tabs-soft {
      padding: 4px;
      border: 1px solid #dbe3ef;
      border-radius: 14px;
      background: #eef6ff;
    }
    .bn-tab {
      border: 1px solid #e2e8f0;
      background: rgba(255,255,255,0.78);
      color: #0f172a;
      border-radius: 999px;
      padding: 0.45rem 0.7rem;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      box-shadow: 0 1px 0 rgba(255,255,255,0.9);
    }
    .bn-tab.active {
      background: #111827;
      color: #fff;
      border-color: #111827;
      box-shadow: 0 8px 20px rgba(17,24,39,0.16);
    }
    .bn-tab:disabled {
      cursor: not-allowed;
      opacity: 0.48;
    }
    .bn-select {
      padding: 0.45rem 0.65rem;
      border-radius: 10px;
      border: 1px solid #dbe3ef;
      background: #ffffff;
      color: #0f172a;
      font-weight: 800;
      font-size: 0.9rem;
    }
    @media (min-width: 760px) {
      .bn-game-scoreboard {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    @media (min-width: 640px) {
      .bn-row {
        grid-template-columns: 1fr auto;
        align-items: center;
      }
    }
    /* Disable tooltips and hover scaling for action buttons on this page */
    .action-buttons .icon-btn:hover {
      transform: none !important;
      filter: none !important;
    }
    [data-tooltip]:hover::before, [data-tooltip]:hover::after {
      display: none !important;
    }
  `;

  const combinedLessonPrompt = useMemo(() => {
    if (!lesson) return "";
    const isVocab = contentTab === "vocab" || (contentTab === "games" && gameDataset === "vocab");
    const source = isVocab ? filteredVocab : filteredPhrases;
    const items = source.map((p) => `${p.bn} (${p.pronunciation || ""}) - ${p.en}`);
    return `(${isVocab ? "Vocab" : "Phrases"}): ${items.join(" | ")}`;
  }, [lesson, filteredPhrases, filteredVocab, contentTab, gameDataset]);

  const hasAnyGameContent = useMemo(
    () => ((lesson?.vocab?.length || 0) + (lesson?.phrases?.length || 0)) > 0,
    [lesson]
  );

  useEffect(() => {
    try {
      localStorage.setItem("bn_show_phrase_actions", JSON.stringify(showPhraseActions));
    } catch {}
  }, [showPhraseActions]);

  const downloadCombinedVocabMp3 = async (mode = "bn-only") => {
    if (!filteredVocab.length) return;
    try {
      setVocabMp3Loading(true);
      const items = filteredVocab.flatMap((v) => {
        if (mode === "bn-only") {
          return [{ text: v.bn, lang: "bn-IN" }];
        }
        if (mode === "en-bn") {
          return [{ text: v.en, lang: "en-US" }, { text: v.bn, lang: "bn-IN" }];
        }
        // Default: bn-en (Bengali first, then English)
        return [
          { text: v.bn, lang: "bn-IN" },
          { text: v.en, lang: "en-US" },
        ];
      });
      const cacheKey = JSON.stringify(items);
      const cachedUrl = batchCacheRef.current.get(cacheKey);
      if (cachedUrl) {
        const link = document.createElement("a");
        link.href = cachedUrl;
        link.download = `${lesson.title || "bengali-vocab"}-${mode}.mp3`;
        link.click();
        return;
      }
      const resp = await fetch("/api/tts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!resp.ok) throw new Error("Failed to generate MP3");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      batchCacheRef.current.set(cacheKey, url);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${lesson.title || "bengali-vocab"}-${mode}.mp3`;
      link.click();
    } catch (err) {
      setError(err?.message || "Failed to download vocab audio");
    } finally {
      setVocabMp3Loading(false);
    }
  };

  const downloadPhrasesMp3 = async (mode = "bn-only") => {
    // mode: "bn-only", "bn-en", or "en-bn"
    if (!filteredPhrases.length) return;
    try {
      setPhraseMp3Loading(true);
      const items =
        mode === "bn-en"
          ? filteredPhrases.flatMap((p) => [
              { text: p.bn, lang: "bn-IN" },
              { text: p.en, lang: "en-US" },
            ])
          : mode === "en-bn"
          ? filteredPhrases.flatMap((p) => [
              { text: p.en, lang: "en-US" },
              { text: p.bn, lang: "bn-IN" },
            ])
          : filteredPhrases.map((p) => ({ text: p.bn, lang: "bn-IN" }));
      const cacheKey = JSON.stringify({ type: "phrases", mode, items });
      const cachedUrl = batchCacheRef.current.get(cacheKey);
      if (cachedUrl) {
        const link = document.createElement("a");
        link.href = cachedUrl;
        link.download = `${lesson.title || "bengali-phrases"}-${mode}.mp3`;
        link.click();
        return;
      }
      const resp = await fetch("/api/tts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!resp.ok) throw new Error("Failed to generate MP3");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      batchCacheRef.current.set(cacheKey, url);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${lesson.title || "bengali-phrases"}-${mode}.mp3`;
      link.click();
    } catch (err) {
      setError(err?.message || "Failed to download phrase audio");
    } finally {
      setPhraseMp3Loading(false);
    }
  };

  const buildGameQuestion = (items, dir) => {
    if (!items?.length || items.length < 2) return null;
    const correct = items[Math.floor(Math.random() * items.length)];
    const distractors = items.filter((v) => v.en !== correct.en);
    const shuffled = [...distractors].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, Math.min(matchOptionsCount - 1, shuffled.length));
    
    const isEnBn = dir === "en-bn";
    const options = isEnBn
      ? [...picks.map((v) => `${v.bn} (${v.pronunciation || ""})`), `${correct.bn} (${correct.pronunciation || ""})`]
      : [...picks.map((v) => v.en), correct.en];

    return { 
      bn: correct.bn, 
      pronunciation: correct.pronunciation, 
      en: correct.en, 
      options: options.sort(() => Math.random() - 0.5), 
      correctAnswer: isEnBn ? `${correct.bn} (${correct.pronunciation || ""})` : correct.en,
      displayQuestion: isEnBn ? correct.en : correct.bn
    };
  };

  const buildTrueFalseQuestion = (items, dir) => {
    if (!items?.length || items.length < 2) return null;
    const correct = items[Math.floor(Math.random() * items.length)];
    const shouldBeCorrect = Math.random() > 0.45;
    const isEnBn = dir === "en-bn";

    if (shouldBeCorrect) {
      return { 
        bn: correct.bn, 
        en: correct.en, 
        isCorrect: true, 
        pronunciation: correct.pronunciation || "",
        displayQuestion: isEnBn ? correct.en : `${correct.bn} (${correct.pronunciation || ""})`,
        displayAnswer: isEnBn ? `${correct.bn} (${correct.pronunciation})` : correct.en
      };
    }
    const wrongPool = items.filter((v) => v.en !== correct.en);
    const wrong = wrongPool[Math.floor(Math.random() * wrongPool.length)];
    return { 
      bn: correct.bn, 
      en: wrong.en, 
      isCorrect: false, 
      pronunciation: correct.pronunciation || "",
      displayQuestion: isEnBn ? correct.en : `${correct.bn} (${correct.pronunciation || ""})`,
      displayAnswer: isEnBn ? `${wrong.bn} (${wrong.pronunciation})` : wrong.en
    };
  };

  const buildAudioHuntQuestion = (items, dir) => {
    if (!items?.length || items.length < 2) return null;
    const correct = items[Math.floor(Math.random() * items.length)];
    const distractors = items.filter((v) => v.en !== correct.en);
    const shuffled = [...distractors].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, Math.min(3, shuffled.length));
    
    const isEnBn = dir === "en-bn";
    const options = isEnBn
      ? [...picks.map((v) => `${v.bn} (${v.pronunciation || ""})`), `${correct.bn} (${correct.pronunciation || ""})`]
      : [...picks.map((v) => v.en), correct.en];

    return { 
      bn: correct.bn, 
      en: correct.en, 
      options: options.sort(() => Math.random() - 0.5),
      correctAnswer: isEnBn ? `${correct.bn} (${correct.pronunciation || ""})` : correct.en,
      audioText: isEnBn ? correct.en : correct.bn,
      audioLang: isEnBn ? "en" : "bn"
    };
  };

  const buildMasteryQueue = (items) => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled;
  };

  const buildMasteryOptions = (items, current, dir) => {
    if (!current) return [];
    const distractors = items.filter((v) => v.en !== current.en);
    const picks = [...distractors].sort(() => Math.random() - 0.5).slice(0, Math.min(3, distractors.length));
    const isEnBn = dir === "en-bn";
    const options = isEnBn
      ? [...picks.map((v) => `${v.bn} (${v.pronunciation || ""})`), `${current.bn} (${current.pronunciation || ""})`]
      : [...picks.map((v) => v.en), current.en];
    return options.sort(() => Math.random() - 0.5);
  };

  const startNewGameRound = (dir = gameDirection) => {
    const clean = getGameItems();
    if (!clean.length) return;
    const question = buildGameQuestion(clean, dir);
    setGameQuestion(question);
    setGameResult(null);
    setGameChoice(null);
  };

  const startTrueFalseRound = () => {
    const clean = getGameItems();
    if (!clean.length) return;
    const question = buildTrueFalseQuestion(clean);
    setTfQuestion(question);
    setTfResult(null);
  };

  const startAudioHuntRound = () => {
    const clean = getGameItems();
    if (!clean.length) return;
    const question = buildAudioHuntQuestion(clean);
    setAudioQuestion(question);
    setAudioResult(null);
    setAudioChoice(null);
  };

  const startMasteryRound = (nextQueue, nextIndex, dir = gameDirection) => {
    const queue = nextQueue || masteryQueue;
    if (!queue?.length) return;
    let idx = typeof nextIndex === "number" ? nextIndex : masteryIndex;
    if (idx >= queue.length) idx = 0;
    setMasteryIndex(idx);
    setMasteryOptions(buildMasteryOptions(queue, queue[idx], dir));
    setMasteryResult(null);
    setMasteryChoice(null);
  };

  const handleGamePick = (option) => {
    if (!gameQuestion || gameResult) return;
    document.activeElement?.blur();
    const isCorrect = option === gameQuestion.correctAnswer;
    setGameChoice(option);
    setGameResult(isCorrect ? "correct" : "wrong");
    setGameScore((prev) => {
      let { finishedStreakSum, finishedStreakCount } = prev;
      // If the current streak was just broken, add it to the historical average stats
      if (!isCorrect && prev.streak > 0) {
        finishedStreakSum += prev.streak;
        finishedStreakCount += 1;
      }
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        finishedStreakSum,
        finishedStreakCount,
      };
    });
    setTimeout(() => {
      startNewGameRound();
    }, isCorrect ? CORRECT_TIME: INCORRECT_TIME);
  };

  const handleTrueFalsePick = (pickedTrue) => {
    if (!tfQuestion || tfResult) return;
    document.activeElement?.blur();
    const isCorrect = pickedTrue === tfQuestion.isCorrect;
    setTfResult(isCorrect ? "correct" : "wrong");
    setTfScore((prev) => {
      let { finishedStreakSum, finishedStreakCount } = prev;
      if (!isCorrect && prev.streak > 0) {
        finishedStreakSum += prev.streak;
        finishedStreakCount += 1;
      }
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        finishedStreakSum,
        finishedStreakCount,
      };
    });
    setTimeout(() => {
      startTrueFalseRound();
    }, isCorrect ? CORRECT_TIME : INCORRECT_TIME);
  };

  const handleAudioPick = (option) => {
    if (!audioQuestion || audioResult) return;
    document.activeElement?.blur();
    const isCorrect = option === audioQuestion.correctAnswer;
    setAudioChoice(option);
    setAudioResult(isCorrect ? "correct" : "wrong");
    setAudioScore((prev) => {
      let { finishedStreakSum, finishedStreakCount } = prev;
      if (!isCorrect && prev.streak > 0) {
        finishedStreakSum += prev.streak;
        finishedStreakCount += 1;
      }
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        finishedStreakSum,
        finishedStreakCount,
      };
    });
    setTimeout(() => {
      startAudioHuntRound();
    }, isCorrect ? CORRECT_TIME : INCORRECT_TIME);
  };

  const handleMasteryPick = (option) => {
    const current = masteryQueue[masteryIndex];
    if (!current || masteryResult) return;
    document.activeElement?.blur();
    const targetAnswer = gameDirection === "en-bn" ? `${current.bn} (${current.pronunciation || ""})` : current.en;
    const isCorrect = option === targetAnswer;
    setMasteryChoice(option);
    setMasteryResult(isCorrect ? "correct" : "wrong");
    setMasteryScore((prev) => {
      let { finishedStreakSum, finishedStreakCount } = prev;
      if (!isCorrect && prev.streak > 0) {
        finishedStreakSum += prev.streak;
        finishedStreakCount += 1;
      }
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        finishedStreakSum,
        finishedStreakCount,
      };
    });
    
    const nextCount = isCorrect ? masteryCorrectCount + 1 : 0;
    if (isCorrect) {
      setMasteryCorrectCount(nextCount);
    } else {
      setMasteryCorrectCount(0);
    }

    // Auto-advance for intermediate steps, but stay on final step so user can see feedback
    if (isCorrect && nextCount < masteryTarget) {
      setTimeout(() => {
        advanceMastery(nextCount);
      }, CORRECT_TIME);
    } else if (nextCount >= masteryTarget) {
      setTimeout(() => {
        reshuffleMastery();
      }, CORRECT_TIME);
    } else if (!isCorrect) {
      setTimeout(() => {
        advanceMastery(nextCount);
      }, INCORRECT_TIME);
    }
  };

  const advanceMastery = () => {
    const current = masteryQueue[masteryIndex];
    if (!current) return;
    let nextIndex = masteryIndex;
    if (masteryCorrectCount >= masteryTarget) {
      nextIndex = masteryIndex + 1;
      if (nextIndex >= masteryQueue.length) nextIndex = 0;
      setMasteryCorrectCount(0);
    }
    startMasteryRound(masteryQueue, nextIndex, gameDirection);
  };

  const reshuffleMastery = () => {
    const clean = getGameItems();
    if (!clean.length) return;
    const queue = buildMasteryQueue(clean);
    setMasteryQueue(queue);
    setMasteryIndex(0);
    setMasteryCorrectCount(0);
    setMasteryResult(null);
    setMasteryChoice(null);
    setMasteryOptions(buildMasteryOptions(queue, queue[0], gameDirection));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (contentTab !== "games") return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const key = e.key;
      if (key === "Enter") {
        if (activeGameTab === "match" && gameResult) startNewGameRound();
        else if (activeGameTab === "audio" && audioResult) startAudioHuntRound();
        else if (activeGameTab === "mastery" && masteryResult) advanceMastery();
        else if (activeGameTab === "truefalse" && tfResult) startTrueFalseRound();
        return;
      }

      if (key.toLowerCase() === "r") {
        if (activeGameTab === "match" && gameQuestion) {
          speak(gameQuestion.bn, "bn", { forceApi: true });
        } else if (activeGameTab === "audio" && audioQuestion) {
          speak(audioQuestion.audioText, audioQuestion.audioLang, { forceApi: true });
        } else if (activeGameTab === "mastery" && masteryQueue.length) {
          speak(masteryQueue[masteryIndex]?.bn, "bn", { forceApi: true });
        } else if (activeGameTab === "truefalse" && tfQuestion) {
          speak(tfQuestion.bn, "bn", { forceApi: true });
        }
        return;
      }

      let index = -1;
      if (key >= "1" && key <= "9") {
        index = parseInt(key) - 1;
      } else if (key === "0") {
        index = 9;
      }

      if (index === -1) return;

      if (activeGameTab === "match" && gameQuestion && !gameResult) {
        if (gameQuestion.options[index]) handleGamePick(gameQuestion.options[index]);
      } else if (activeGameTab === "audio" && audioQuestion && !audioResult) {
        if (audioQuestion.options[index]) handleAudioPick(audioQuestion.options[index]);
      } else if (activeGameTab === "mastery" && masteryQueue.length && !masteryResult) {
        if (masteryOptions[index]) handleMasteryPick(masteryOptions[index]);
      } else if (activeGameTab === "truefalse" && tfQuestion && !tfResult) {
        if (index === 0) handleTrueFalsePick(true);
        else if (index === 1) handleTrueFalsePick(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [contentTab, activeGameTab, gameQuestion, gameResult, audioQuestion, audioResult, masteryQueue, masteryIndex, masteryResult, masteryOptions, tfQuestion, tfResult, handleGamePick, handleAudioPick, handleMasteryPick, handleTrueFalsePick, startNewGameRound, startAudioHuntRound, advanceMastery, startTrueFalseRound, speak]);

  useEffect(() => {
    const hasPhrases = lesson?.phrases?.length;
    const hasVocab = lesson?.vocab?.length;
    setContentTab(hasPhrases ? "phrases" : hasVocab ? "vocab" : "phrases");
    setGameDataset(hasVocab ? "vocab" : hasPhrases ? "phrases" : "vocab");
  }, [lesson]);

  const resetGames = () => {
    setGameQuestion(null);
    setGameResult(null);
    setGameChoice(null);
    setGameScore({ correct: 0, total: 0, streak: 0, bestStreak: 0, finishedStreakSum: 0, finishedStreakCount: 0 });
    setTfQuestion(null);
    setTfResult(null);
    setTfScore({ correct: 0, total: 0, streak: 0, bestStreak: 0, finishedStreakSum: 0, finishedStreakCount: 0 });
    setAudioQuestion(null);
    setAudioResult(null);
    setAudioChoice(null);
    setAudioScore({ correct: 0, total: 0, streak: 0, bestStreak: 0, finishedStreakSum: 0, finishedStreakCount: 0 });
    setMasteryQueue([]);
    setMasteryIndex(0);
    setMasteryCorrectCount(0);
    setMasteryTarget(3);
    setMasteryResult(null);
    setMasteryChoice(null);
    setMasteryOptions([]);
    setMasteryScore({ correct: 0, total: 0, streak: 0, bestStreak: 0, finishedStreakSum: 0, finishedStreakCount: 0 });
  };

  const getGameItems = useCallback(() => {
    const source = gameDataset === "phrases" ? filteredPhrases : filteredVocab;
    if (!source?.length) return [];
    return source.filter((v) => v?.bn && v?.en);
  }, [filteredPhrases, filteredVocab, gameDataset]);

  const gameItems = useMemo(() => getGameItems(), [getGameItems]);

  useEffect(() => {
    if (!gameItems.length || gameItems.length < 2) {
      resetGames();
      return;
    }
    resetGames();
    const queue = buildMasteryQueue(gameItems);
    setMasteryQueue(queue);
    setMasteryIndex(0);
    setMasteryCorrectCount(0);
    setMasteryResult(null);
    setMasteryChoice(null);
    startMasteryRound(queue, 0, gameDirection);
    startNewGameRound(gameDirection);
    startTrueFalseRound();
    startAudioHuntRound();
  }, [lesson, gameDataset, gameItems, gameDirection]);

  useEffect(() => {
    if (activeGameTab === "match" && gameItems.length >= 2) {
      startNewGameRound(gameDirection);
    }
  }, [matchOptionsCount]);

  useEffect(() => {
    if (!gameItems.length || gameItems.length < 2) return;
    setMasteryCorrectCount(0);
    setMasteryResult(null);
    setMasteryChoice(null);
    startMasteryRound(masteryQueue, masteryIndex, gameDirection);
  }, [masteryTarget, lesson, gameItems, masteryQueue, masteryIndex, gameDirection]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <style>{shellStyles}</style>
      <div className="bn-shell">
        <div className="bn-card">
          <h2 style={{ margin: 0 }}>বাংলা Tutor</h2>
          <p style={{ margin: "4px 0", color: "#475569" }}>Generate concise Bengali lessons with pronunciations and practice.</p>
          <div style={{ display: "grid", gap: 10 }}>
            <div className="bn-tabs bn-tabs-soft">
              <button className={`bn-tab ${setupTab === "lesson" ? "active" : ""}`} onClick={() => setSetupTab("lesson")} disabled={!lesson}>
                Lesson
              </button>
              <button className={`bn-tab ${setupTab === "generate" ? "active" : ""}`} onClick={() => setSetupTab("generate")}>
                Generate Lesson
              </button>
              <button className={`bn-tab ${setupTab === "downloads" ? "active" : ""}`} onClick={() => setSetupTab("downloads")}>
                Downloads
              </button>
            </div>
            {setupTab === "generate" ? (
            <div className="bn-section" style={{ display: "grid", gap: 8 }}>
              <label style={{ fontWeight: 700, color: "#0f172a" }}>Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Ordering food at a cafe"
                style={{ padding: "0.7rem", borderRadius: 10, border: "1px solid #e2e8f0" }}
              />
              <label style={{ fontWeight: 700, color: "#0f172a" }}>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ padding: "0.7rem", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <label style={{ fontWeight: 700, color: "#0f172a" }}>Focus</label>
              <select value={focus} onChange={(e) => setFocus(e.target.value)} style={{ padding: "0.7rem", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <option value="conversation">Conversation</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="grammar">Grammar</option>
              </select>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="bn-btn" onClick={fetchLesson} disabled={loading}>{loading ? "Generating..." : "Generate Lesson"}</button>
                <button className="bn-btn secondary" onClick={() => { setTopic(DEFAULT_PROMPT); setLesson(null); setError(""); }}>Reset</button>
                <label className="bn-btn secondary" style={{ cursor: "pointer" }}>
                  Upload Lesson JSON
                  <input
                    type="file"
                    accept=".json,application/json"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const parsed = JSON.parse(text);
                        setLesson(parsed);
                        setSetupTab("lesson");
                        localStorage.setItem(LESSON_CACHE_KEY, text);
                      } catch (err) {
                        setError("Invalid lesson JSON");
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            ) : null}
            {setupTab === "downloads" ? (
            <div className="bn-section" style={{ display: "grid", gap: 8 }}>
              <div className="bn-row">
                <div>
                  <div className="bn-pill">Download lesson JSON</div>
                  <small style={{ color: "#475569" }}>Save and reuse</small>
                </div>
                <button className="bn-btn secondary" onClick={downloadJson} disabled={!lesson}>Download</button>
              </div>
              <div className="bn-row">
                <div>
                  <div className="bn-pill">Download words</div>
                  <small style={{ color: "#475569" }}>Phrase list with pronunciations</small>
                </div>
                <button className="bn-btn secondary" onClick={downloadWords} disabled={!lesson?.vocab?.length}>Download</button>
              </div>
              <div className="bn-row">
                <div>
                  <div className="bn-pill">Download phrases MP3</div>
                  <small style={{ color: "#475569" }}>Spoken Bengali phrases</small>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    className="bn-btn secondary"
                    onClick={() => downloadPhrasesMp3("bn-only")}
                    disabled={!lesson?.phrases?.length || phraseMp3Loading}
                  >
                    {phraseMp3Loading ? "Building..." : "Bengali MP3"}
                  </button>
                  <button
                    className="bn-btn secondary"
                    onClick={() => downloadPhrasesMp3("bn-en")}
                    disabled={!lesson?.phrases?.length || phraseMp3Loading}
                  >
                    {phraseMp3Loading ? "Building..." : "Bengali → English MP3"}
                  </button>
                  <button
                    className="bn-btn secondary"
                    onClick={() => downloadPhrasesMp3("en-bn")}
                    disabled={!lesson?.phrases?.length || phraseMp3Loading}
                  >
                    {phraseMp3Loading ? "Building..." : "English → Bengali MP3"}
                  </button>
                </div>
              </div>
              <div className="bn-row">
                <div>
                  <div className="bn-pill">Download vocab MP3</div>
                  <small style={{ color: "#475569" }}>Combined Bengali / English audio</small>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="bn-btn secondary" onClick={() => downloadCombinedVocabMp3("bn-only")} disabled={!lesson?.vocab?.length || vocabMp3Loading}>
                    {vocabMp3Loading ? "Building..." : "Bengali MP3"}
                  </button>
                  <button className="bn-btn secondary" onClick={() => downloadCombinedVocabMp3("bn-en")} disabled={!lesson?.vocab?.length || vocabMp3Loading}>
                    {vocabMp3Loading ? "Building..." : "Bengali → English MP3"}
                  </button>
                  <button className="bn-btn secondary" onClick={() => downloadCombinedVocabMp3("en-bn")} disabled={!lesson?.vocab?.length || vocabMp3Loading}>
                    {vocabMp3Loading ? "Building..." : "English → Bengali MP3"}
                  </button>
                </div>
              </div>
            </div>
            ) : null}
            {error && <div style={{ color: "#dc2626", fontWeight: 600 }}>{error}</div>}
          </div>
        </div>

        {loading && (
          <div className="bn-card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipLoader size={22} color="#2563eb" />
            <span>Building your Bengali lesson…</span>
          </div>
        )}

        {lesson && !loading && setupTab === "lesson" && (
          <div className="bn-card" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>{lesson.title}</h3>
              <span className="bn-pill">{lesson.level}</span>
              <span className="bn-pill">{lesson.focus}</span>
            </div>
            <p style={{ margin: 0, color: "#475569" }}>{lesson.summary}</p>
            <ActionButtons promptText={combinedLessonPrompt} />

            {/* Collapsible Group Filters */}
            <div className="bn-section" style={{ display: "grid", gap: 10, background: "#f1f5f9" }}>
              <div 
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h4 style={{ margin: 0 }}>Content Filters</h4>
                  <span className="bn-pill" style={{ background: "#fff", fontSize: "0.75rem", fontWeight: 800 }}>
                    {(() => {
                      const type = contentTab === "games" ? gameDataset : contentTab;
                      const items = type === "phrases" ? filteredPhrases : filteredVocab;
                      const total = (type === "phrases" ? lesson.phrases : lesson.vocab)?.length || 0;
                      return `Showing ${items.length} / ${total}`;
                    })()}
                  </span>
                </div>
                <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "#64748b" }}>
                  {filtersExpanded ? "▴" : "▾"}
                </span>
              </div>

              {filtersExpanded && (
                <div style={{ display: "grid", gap: 12, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(() => {
                      const type = contentTab === "games" ? gameDataset : contentTab;
                      return (
                        <>
                          <button className="bn-btn secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => selectAllGroups(type)}>Select All</button>
                          <button className="bn-btn secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => clearAllGroups(type)}>Clear All</button>
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(85px, 1fr))", 
                    gap: 6 
                  }}>
                    {(() => {
                      const type = contentTab === "games" ? gameDataset : contentTab;
                      const total = (type === "phrases" ? lesson.phrases : lesson.vocab)?.length || 0;
                      const count = Math.ceil(total / 10);
                      return Array.from({ length: count }).map((_, i) => {
                        const isSelected = selectedGroups[type]?.includes(i);
                        return (
                          <button 
                            key={i} 
                            className={`bn-btn ${isSelected ? "" : "secondary"}`}
                            style={{ padding: "8px 4px", fontSize: "0.8rem", textAlign: "center", border: isSelected ? "none" : "1px solid #cbd5e1" }}
                            onClick={() => toggleGroupSelection(type, i)}
                          >
                            {i * 10 + 1}-{Math.min((i + 1) * 10, total)}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="bn-tabs">
              <button
                className={`bn-tab ${contentTab === "phrases" ? "active" : ""}`}
                onClick={() => setContentTab("phrases")}
                disabled={!lesson.phrases?.length}
              >
                Key Phrases
              </button>
              <button
                className={`bn-tab ${contentTab === "vocab" ? "active" : ""}`}
                onClick={() => setContentTab("vocab")}
                disabled={!lesson.vocab?.length}
              >
                Vocabulary
              </button>
              <button
                className={`bn-tab ${contentTab === "games" ? "active" : ""}`}
                onClick={() => setContentTab("games")}
                disabled={!((lesson.vocab?.length || 0) + (lesson.phrases?.length || 0))}
              >
                Games
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "10px 12px", borderRadius: 12, background: "#eef2ff", border: "1px solid #e2e8f0" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#0f172a" }}>
                <input
                  type="checkbox"
                  checked={showPhraseActions}
                  onChange={(e) => setShowPhraseActions(e.target.checked)}
                />
                Action Buttons
              </label>
            </div>

            {contentTab === "phrases" && lesson.phrases?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 10 }}>
                <h4 style={{ margin: 0 }}>Key Phrases</h4>
                {filteredPhrases.map((p, idx) => (
                  <div key={idx} className="bn-section" style={{ background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{p.bn}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className="bn-btn secondary" onClick={() => speak(p.bn, "bn")}>🔈 Bengali</button>
                        <button className="bn-btn secondary" onClick={() => speak(p.en, "en")}>🔈 English</button>
                        <button
                          className="bn-btn secondary"
                        onClick={() =>
                          loopSequence(
                            `phrase-${idx}`,
                            "phrase",
                            [
                              { text: p.bn, lang: "bn", forceApi: true },
                              { text: p.en, lang: "en", forceApi: true },
                            ]
                          )
                        }
                        style={{ background: loopStateRef.current.key === `phrase-${idx}` ? "#2563eb" : undefined, color: loopStateRef.current.key === `phrase-${idx}` ? "#fff" : undefined }}
                      >
                          🔁 Loop bn→en
                        </button>
                        {loopStateRef.current.key === `phrase-${idx}` && (
                          <button
                            className="bn-btn bn-icon-btn bn-stop-btn"
                            onClick={stopLoops}
                            aria-label="Stop phrase loop"
                            title="Stop loop"
                          >
                            ⏹
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ color: "#0f172a" }}>{p.pronunciation}</div>
                    <div style={{ color: "#475569" }}>{p.en}</div>
                    {p.context && <div style={{ color: "#475569" }}>Context: {p.context}</div>}
                    {showPhraseActions && (
                      <div style={{ marginTop: 6 }}>
                        <ActionButtons limitButtons promptText={`${lesson.title}: ${p.bn} (${p.pronunciation}) - ${p.en}`} />
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    className="bn-btn"
                    onClick={() =>
                      loopSequence(
                        "all-phrases",
                        "all",
                        filteredPhrases.flatMap((p) => [
                          { text: p.bn, lang: "bn", forceApi: true },
                          { text: p.en, lang: "en", forceApi: true },
                        ])
                      )
                    }
                    style={{ background: loopStateRef.current.key === "all-phrases" ? "#2563eb" : "#0f172a" }}
                  >
                    🔁 Loop all phrases (bn→en)
                  </button>
                  {loopStateRef.current.key === "all-phrases" && (
                    <button
                      className="bn-btn bn-icon-btn bn-stop-btn"
                      onClick={stopLoops}
                      aria-label="Stop loop"
                      title="Stop loop"
                    >
                      ⏹
                    </button>
                  )}
                  <button className="bn-btn secondary" onClick={stopLoops}>Stop Loop</button>
                </div>
              </div>
            ) : null}

            {contentTab === "phrases" && !lesson.phrases?.length ? (
              <div className="bn-section" style={{ color: "#475569" }}>No phrases yet — generate a lesson to view phrases.</div>
            ) : null}

            {contentTab === "vocab" && lesson.vocab?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 6 }}>
                <h4 style={{ margin: 0 }}>Vocabulary</h4>
                {filteredVocab.map((v, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.bn}</div>
                      <div style={{ color: "#475569" }}>{v.pronunciation}</div>
                      <div style={{ color: "#0f172a" }}>{v.en}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="bn-btn secondary" onClick={() => speak(v.bn, "bn", { forceApi: true })}>🔈 bn</button>
                      <button className="bn-btn secondary" onClick={() => speak(v.en, "en", { forceApi: true })}>🔈 en</button>
                      <button
                        className="bn-btn secondary"
                        onClick={() =>
                          loopSequence(`vocab-${idx}`, "vocab", [
                            { text: v.bn, lang: "bn", forceApi: true },
                            { text: v.en, lang: "en", forceApi: true },
                          ])
                        }
                        style={{ background: loopStateRef.current.key === `vocab-${idx}` ? "#2563eb" : undefined, color: loopStateRef.current.key === `vocab-${idx}` ? "#fff" : undefined }}
                      >
                        🔁 bn→en
                      </button>
                      {loopStateRef.current.key === `vocab-${idx}` && (
                        <button
                          className="bn-btn bn-icon-btn bn-stop-btn"
                          onClick={stopLoops}
                          aria-label="Stop vocab loop"
                          title="Stop loop"
                        >
                          ⏹
                        </button>
                      )}
                      <button
                        className="bn-btn secondary"
                        onClick={() =>
                          loopSequence(`vocab-enbn-${idx}`, "vocab", [
                            { text: v.en, lang: "en", forceApi: true },
                            { text: v.bn, lang: "bn", forceApi: true },
                          ])
                        }
                        style={{ background: loopStateRef.current.key === `vocab-enbn-${idx}` ? "#2563eb" : undefined, color: loopStateRef.current.key === `vocab-enbn-${idx}` ? "#fff" : undefined }}
                      >
                        🔁 en→bn
                      </button>
                      {loopStateRef.current.key === `vocab-enbn-${idx}` && (
                        <button
                          className="bn-btn bn-icon-btn bn-stop-btn"
                          onClick={stopLoops}
                          aria-label="Stop vocab loop"
                          title="Stop loop"
                        >
                          ⏹
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                  <button
                    className="bn-btn"
                    onClick={() =>
                      loopSequence(
                        "all-vocab",
                        "all",
                        filteredVocab.flatMap((v, i) => [
                          { text: v.bn, lang: "bn", forceApi: true },
                          { text: v.en, lang: "en", forceApi: true },
                        ])
                      )
                    }
                    style={{ background: loopStateRef.current.key === "all-vocab" ? "#2563eb" : "#0f172a" }}
                  >
                    🔁 Loop all vocab (bn→en)
                  </button>
                  {loopStateRef.current.key === "all-vocab" && (
                    <button
                      className="bn-btn bn-icon-btn bn-stop-btn"
                      onClick={stopLoops}
                      aria-label="Stop loop"
                      title="Stop loop"
                    >
                      ⏹
                    </button>
                  )}
                  <button
                    className="bn-btn"
                    onClick={() =>
                      loopSequence(
                        "all-vocab-enbn",
                        "all",
                        filteredVocab.flatMap((v, i) => [
                          { text: v.en, lang: "en", forceApi: true },
                          { text: v.bn, lang: "bn", forceApi: true },
                        ])
                      )
                    }
                    style={{ background: loopStateRef.current.key === "all-vocab-enbn" ? "#2563eb" : "#0f172a" }}
                  >
                    🔁 Loop all vocab (en→bn)
                  </button>
                  {loopStateRef.current.key === "all-vocab-enbn" && (
                    <button
                      className="bn-btn bn-icon-btn bn-stop-btn"
                      onClick={stopLoops}
                      aria-label="Stop loop"
                      title="Stop loop"
                    >
                      ⏹
                    </button>
                  )}
                  <button className="bn-btn secondary" onClick={stopLoops}>Stop Loop</button>
                </div>
              </div>
            ) : null}

            {contentTab === "vocab" && !lesson.vocab?.length ? (
              <div className="bn-section" style={{ color: "#475569" }}>No vocabulary yet — generate a lesson to view words.</div>
            ) : null}

            {contentTab === "games" && hasAnyGameContent ? (
              <div className="bn-game-shell">
                <div className="bn-game-header">
                  <div className="bn-game-title">
                    <h4>{gameDataset === "phrases" ? "Phrase Games" : "Vocabulary Games"}</h4>
                    <span>{gameDirection === "bn-en" ? "Bengali to English" : "English to Bengali"}</span>
                  </div>
                </div>
                <div className="bn-game-controls">
                  <div className="bn-tabs">
                    <button className={`bn-tab ${gameDataset === "vocab" ? "active" : ""}`} onClick={() => setGameDataset("vocab")} disabled={!lesson.vocab?.length}>
                      Vocab set
                    </button>
                    <button className={`bn-tab ${gameDataset === "phrases" ? "active" : ""}`} onClick={() => setGameDataset("phrases")} disabled={!lesson.phrases?.length}>
                      Phrases set
                    </button>
                  </div>
                  <div className="bn-tabs bn-tabs-soft">
                    <button className={`bn-tab ${gameDirection === "bn-en" ? "active" : ""}`} onClick={() => setGameDirection("bn-en")}>
                      Bengali → English
                    </button>
                    <button className={`bn-tab ${gameDirection === "en-bn" ? "active" : ""}`} onClick={() => setGameDirection("en-bn")}>
                      English → Bengali
                    </button>
                  </div>
                  <div className="bn-tabs">
                    <button className={`bn-tab ${activeGameTab === "match" ? "active" : ""}`} onClick={() => setActiveGameTab("match")}>
                      Match It
                    </button>
                    <button className={`bn-tab ${activeGameTab === "audio" ? "active" : ""}`} onClick={() => setActiveGameTab("audio")}>
                      Audio Hunt
                    </button>
                    <button className={`bn-tab ${activeGameTab === "mastery" ? "active" : ""}`} onClick={() => setActiveGameTab("mastery")}>
                      Mastery Ladder
                    </button>
                    <button className={`bn-tab ${activeGameTab === "truefalse" ? "active" : ""}`} onClick={() => setActiveGameTab("truefalse")}>
                      Quick Check
                    </button>
                  </div>
                </div>
                {(() => {
                  const s = activeGameTab === "match" ? gameScore : activeGameTab === "truefalse" ? tfScore : activeGameTab === "audio" ? audioScore : masteryScore;
                  const total = s.total || 0;
                  const correct = s.correct || 0;
                  const missed = Math.max(total - correct, 0);
                  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
                  return (
                    <div className="bn-game-scoreboard">
                      <div className="bn-stat">
                        <div className="bn-stat-label">Score</div>
                        <div className="bn-stat-value">{correct}/{total}</div>
                      </div>
                      <div className="bn-stat">
                        <div className="bn-stat-label">Accuracy</div>
                        <div className="bn-stat-value">{percent}%</div>
                      </div>
                      <div className="bn-stat">
                        <div className="bn-stat-label">Missed</div>
                        <div className="bn-stat-value">{missed}</div>
                      </div>
                      <div className="bn-stat">
                        <div className="bn-stat-label">Streak</div>
                        <div className="bn-stat-value">{s.streak} / {s.bestStreak}</div>
                      </div>
                    </div>
                  );
                })()}
                {activeGameTab === "match" && (
                  <>
                    {gameQuestion ? (
                      <div className="bn-game-card">
                        <div className="bn-game-card-top">
                          <div>
                            <div className="bn-game-prompt">{gameQuestion.displayQuestion}</div>
                            {gameDirection === "bn-en" && gameQuestion.pronunciation && (
                              <div className="bn-game-subtext">{gameQuestion.pronunciation}</div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Options:</label>
                            <select
                              value={matchOptionsCount}
                              onChange={(e) => setMatchOptionsCount(Number(e.target.value))}
                              className="bn-select"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="bn-game-actions">
                          <button className="bn-btn secondary" onClick={() => speak(gameQuestion.bn, "bn", { forceApi: true })}>🔈 Hear Target Bengali</button>
                          <button className="bn-btn secondary" onClick={startNewGameRound}>New card</button>
                        </div>
                        <div className="bn-game-options">
                          {gameQuestion.options.map((option, idx) => {
                            const isCorrect = option === gameQuestion.correctAnswer;
                            const stateClass = gameResult
                              ? isCorrect
                                ? "correct"
                                : option === gameChoice
                                  ? "wrong"
                                  : ""
                              : "";
                            return (
                              <button
                                key={option}
                                className={`bn-game-option ${stateClass}`}
                                onClick={() => handleGamePick(option)}
                                disabled={!!gameResult}
                              >
                                <span className="bn-option-index">{idx === 9 ? 0 : idx + 1}</span>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {gameResult && (
                          <div className={`bn-game-feedback ${gameResult}`}>
                            {gameResult === "correct" ? "Nice! You got it." : `Close! The answer is "${gameQuestion.correctAnswer}".`}
                          </div>
                        )}
                        {gameResult && (
                          <button className="bn-btn" onClick={() => startNewGameRound()}>Next word</button>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: "#475569" }}>Add at least two vocabulary words to start the game.</div>
                    )}
                  </>
                )}
                {activeGameTab === "audio" && (
                  <>
                    {audioQuestion ? (
                      <div className="bn-game-card">
                        <div>
                          <div className="bn-game-prompt">Listen and pick the English meaning</div>
                          <div className="bn-game-subtext">Play the clip, then choose the matching answer.</div>
                        </div>
                        <div className="bn-game-actions">
                          <button className="bn-btn" onClick={() => speak(audioQuestion.audioText, audioQuestion.audioLang, { forceApi: true })}>▶️ Play Audio</button>
                          <button className="bn-btn secondary" onClick={startAudioHuntRound}>New clip</button>
                        </div>
                        <div className="bn-game-options">
                          {audioQuestion.options.map((option, idx) => {
                            const isCorrect = option === audioQuestion.correctAnswer;
                            const stateClass = audioResult
                              ? isCorrect
                                ? "correct"
                                : option === audioChoice
                                  ? "wrong"
                                  : ""
                              : "";
                            return (
                              <button
                                key={option}
                                className={`bn-game-option ${stateClass}`}
                                onClick={() => handleAudioPick(option)}
                                disabled={!!audioResult}
                              >
                                <span className="bn-option-index">{idx === 9 ? 0 : idx + 1}</span>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {audioResult && (
                          <div className={`bn-game-feedback ${audioResult}`}>
                            {audioResult === "correct" ? "Correct!" : `Not quite — it was "${audioQuestion.correctAnswer}".`}
                          </div>
                        )}
                        {audioResult && (
                          <button className="bn-btn" onClick={startAudioHuntRound}>Next clip</button>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: "#475569" }}>Add at least two vocabulary words to start the game.</div>
                    )}
                  </>
                )}
                {activeGameTab === "mastery" && (
                  <>
                    {masteryQueue.length ? (
                      <div className="bn-game-card">
                        <div className="bn-game-card-top">
                          <div>
                            <div className="bn-game-prompt">Mastery Ladder</div>
                            <div className="bn-game-subtext">Answer correctly {masteryTarget} times before moving to the next word.</div>
                          </div>
                          <div className="bn-pill">
                            Target {masteryTarget} • Progress {masteryCorrectCount}/{masteryTarget}
                          </div>
                        </div>
                        <div className="bn-game-actions">
                          <button className={`bn-btn secondary ${masteryTarget === 3 ? "active" : ""}`} onClick={() => setMasteryTarget(3)}>
                            Target 3
                          </button>
                          <button className={`bn-btn secondary ${masteryTarget === 5 ? "active" : ""}`} onClick={() => setMasteryTarget(5)}>
                            Target 5
                          </button>
                          <button className="bn-btn secondary" onClick={reshuffleMastery}>Shuffle list</button>
                        </div>
                        <div className="bn-game-prompt">
                          {gameDirection === "en-bn" ? masteryQueue[masteryIndex]?.en : `${masteryQueue[masteryIndex]?.bn} (${masteryQueue[masteryIndex]?.pronunciation || ""})`}
                        </div>

                        <div className="bn-game-actions">
                          <button
                            className="bn-btn"
                            onClick={() => speak(masteryQueue[masteryIndex]?.bn, "bn", { forceApi: true })}
                          >
                            ▶️ Play Spoken Bengali
                          </button>
                          <button className="bn-btn secondary" onClick={startMasteryRound}>New options</button>
                        </div>
                        <div className="bn-game-options">
                          {masteryOptions.map((option, idx) => {
                            const targetAnswer = gameDirection === "en-bn" ? `${masteryQueue[masteryIndex]?.bn} (${masteryQueue[masteryIndex]?.pronunciation || ""})` : masteryQueue[masteryIndex]?.en;
                            const isCorrect = option === targetAnswer;
                            const stateClass = masteryResult
                              ? isCorrect
                                ? "correct"
                                : option === masteryChoice
                                  ? "wrong"
                                  : ""
                              : "";
                            return (
                              <button
                                key={option}
                                className={`bn-game-option ${stateClass}`}
                                onClick={() => handleMasteryPick(option)}
                                disabled={!!masteryResult}
                              >
                                <span className="bn-option-index">{idx === 9 ? 0 : idx + 1}</span>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {masteryResult && (
                          <div className={`bn-game-feedback ${masteryResult}`}>
                            {masteryResult === "correct"
                              ? "Correct! Keep it going."
                              : `Missed it — try again. The answer is "${gameDirection === "en-bn" ? `${masteryQueue[masteryIndex]?.bn} (${masteryQueue[masteryIndex]?.pronunciation || ""})` : masteryQueue[masteryIndex]?.en}".`}
                          </div>
                        )}
                        {masteryResult && (
                          <button className="bn-btn" onClick={advanceMastery}>
                            {masteryCorrectCount >= masteryTarget ? "Next word" : "Try again"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: "#475569" }}>Add at least two vocabulary words to start the game.</div>
                    )}
                  </>
                )}
                {activeGameTab === "truefalse" && (
                  <>
                    {tfQuestion ? (
                      <div className="bn-game-card">
                        <div>
                          <div className="bn-game-prompt">{tfQuestion.displayQuestion}</div>
                          <div className="bn-game-subtext">Does this mean: <strong style={{ color: "#0f172a" }}>{tfQuestion.displayAnswer}</strong>?</div>
                        </div>
                        <div className="bn-game-actions">
                          <button className="bn-btn secondary" onClick={() => speak(tfQuestion.bn, "bn", { forceApi: true })}>🔈 Hear Bengali</button>
                          <button className="bn-btn secondary" onClick={startTrueFalseRound}>New check</button>
                        </div>
                        <div className="bn-game-actions">
                          <button className="bn-btn secondary bn-true-btn" onClick={() => handleTrueFalsePick(true)} disabled={!!tfResult}><span className="bn-option-index">1</span> ✅ True</button>
                          <button className="bn-btn secondary bn-false-btn" onClick={() => handleTrueFalsePick(false)} disabled={!!tfResult}><span className="bn-option-index">2</span> ❌ False</button>
                        </div>
                        {tfResult && (
                          <div className={`bn-game-feedback ${tfResult}`}>
                            {tfResult === "correct"
                              ? "Correct!"
                              : tfQuestion.isCorrect
                                ? "Not quite — it is correct."
                                : "Nope — that translation is wrong."}
                          </div>
                        )}
                        {tfResult && (
                          <button className="bn-btn" onClick={startTrueFalseRound}>Next check</button>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: "#475569" }}>Add at least two vocabulary words to start the game.</div>
                    )}
                  </>
                )}
              </div>
            ) : null}

            {contentTab === "games" && (!gameItems.length || gameItems.length < 2) ? (
              <div className="bn-section" style={{ color: "#475569" }}>Add at least two items in vocabulary or phrases to play games.</div>
            ) : null}

            {lesson.practice?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 8 }}>
                <h4 style={{ margin: 0 }}>Practice</h4>
                {lesson.practice.map((q, idx) => (
                  <div key={idx} className="bn-section" style={{ background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{q.type?.toUpperCase()}</div>
                    <div style={{ color: "#0f172a" }}>{q.prompt}</div>
                    <div style={{ color: "#475569" }}>Answer: {q.answer}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {lesson.notes?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 4 }}>
                <h4 style={{ margin: 0 }}>Notes</h4>
                {lesson.notes.map((n, idx) => (
                  <div key={idx} style={{ color: "#475569" }}>• {n}</div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
