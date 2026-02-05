import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ClipLoader } from "react-spinners";
import { getGeminiResponse } from "./utils/callGemini";
import ActionButtons from "./ui/ActionButtons.jsx";

const DEFAULT_PROMPT = "Everyday greetings at a coffee shop";
const LESSON_CACHE_KEY = "bengali_lesson_cache";
const INPUT_CACHE_KEY = "bengali_lesson_inputs";

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
  const [error, setError] = useState("");
  const [vocabMp3Loading, setVocabMp3Loading] = useState(false);
  const [phraseMp3Loading, setPhraseMp3Loading] = useState(false);
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
  const [masteryScore, setMasteryScore] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  const [activeGameTab, setActiveGameTab] = useState("match");
  const { voices, ready: voicesReady } = useVoices();
  const audioCacheRef = React.useRef(new Map()); // cache Bengali audio URLs by text+lang
  const batchCacheRef = React.useRef(new Map()); // cache combined MP3 blobs for batch vocab
  const loopStateRef = React.useRef({ key: null, mode: null, abort: false, audio: null });
  const [, forceRender] = useState(0); // quick rerender for loop status

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
    const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${lesson.title || "bengali-lesson"}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadWords = () => {
    if (!lesson?.vocab?.length) return;
    const lines = lesson.vocab.map((w) => `${w.bn} (${w.pronunciation || ""}) - ${w.en}`).join("\\n");
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
    }
    .bn-btn.secondary {
      background: #f8fafc;
      color: #0f172a;
      border-color: #e2e8f0;
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
    .bn-game-option {
      border: 1px solid #cbd5f5;
      background: #eef2ff;
      color: #1e293b;
      padding: 0.6rem 0.75rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      text-align: left;
    }
    .bn-game-option.correct {
      background: #dcfce7;
      border-color: #16a34a;
      color: #14532d;
    }
    .bn-game-option.wrong {
      background: #fee2e2;
      border-color: #ef4444;
      color: #7f1d1d;
    }
    .bn-true-btn {
      background: #dcfce7;
      border-color: #16a34a;
      color: #14532d;
    }
    .bn-false-btn {
      background: #fee2e2;
      border-color: #ef4444;
      color: #7f1d1d;
    }
    .bn-tabs {
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
    .bn-tab {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #0f172a;
      border-radius: 999px;
      padding: 0.45rem 0.7rem;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
    }
    .bn-tab.active {
      background: #0f172a;
      color: #fff;
      border-color: #0f172a;
    }
    @media (min-width: 640px) {
      .bn-row {
        grid-template-columns: 1fr auto;
        align-items: center;
      }
    }
  `;

  const combinedLessonPrompt = useMemo(() => {
    if (!lesson) return "";
    const phrases = lesson.phrases?.map((p) => `${p.bn} (${p.pronunciation || ""}) - ${p.en}`) || [];
    return `${lesson.title || "Bengali Lesson"}: ${phrases.join(" | ")}`;
  }, [lesson]);

  const hasAnyGameContent = useMemo(
    () => ((lesson?.vocab?.length || 0) + (lesson?.phrases?.length || 0)) > 0,
    [lesson]
  );

  useEffect(() => {
    try {
      localStorage.setItem("bn_show_phrase_actions", JSON.stringify(showPhraseActions));
    } catch {}
  }, [showPhraseActions]);

  const downloadCombinedVocabMp3 = async (lang = "bn-IN") => {
    if (!lesson?.vocab?.length) return;
    try {
      setVocabMp3Loading(true);
      const items = lesson.vocab.flatMap((v) => {
        if (lang.startsWith("bn")) {
          return [{ text: v.bn, lang }];
        }
        // Combined download: Bengali first, then English (bn -> en)
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
        link.download = `${lesson.title || "bengali-vocab"}-${lang}.mp3`;
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
      link.download = `${lesson.title || "bengali-vocab"}-${lang}.mp3`;
      link.click();
    } catch (err) {
      setError(err?.message || "Failed to download vocab audio");
    } finally {
      setVocabMp3Loading(false);
    }
  };

  const downloadPhrasesMp3 = async (mode = "bn-only") => {
    // mode: "bn-only" or "bn-en"
    if (!lesson?.phrases?.length) return;
    try {
      setPhraseMp3Loading(true);
      const items =
        mode === "bn-en"
          ? lesson.phrases.flatMap((p) => [
              { text: p.bn, lang: "bn-IN" },
              { text: p.en, lang: "en-US" },
            ])
          : lesson.phrases.map((p) => ({ text: p.bn, lang: "bn-IN" }));
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

  const buildGameQuestion = (items) => {
    if (!items?.length || items.length < 2) return null;
    const correct = items[Math.floor(Math.random() * items.length)];
    const distractors = items.filter((v) => v.en !== correct.en);
    const shuffled = [...distractors].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, Math.min(3, shuffled.length));
    const options = [...picks.map((v) => v.en), correct.en].sort(() => Math.random() - 0.5);
    return { bn: correct.bn, pronunciation: correct.pronunciation, en: correct.en, options };
  };

  const buildTrueFalseQuestion = (items) => {
    if (!items?.length || items.length < 2) return null;
    const correct = items[Math.floor(Math.random() * items.length)];
    const shouldBeCorrect = Math.random() > 0.45;
    if (shouldBeCorrect) {
      return { bn: correct.bn, en: correct.en, isCorrect: true };
    }
    const wrongPool = items.filter((v) => v.en !== correct.en);
    const wrong = wrongPool[Math.floor(Math.random() * wrongPool.length)];
    return { bn: correct.bn, en: wrong.en, isCorrect: false };
  };

  const buildAudioHuntQuestion = (items) => {
    if (!items?.length || items.length < 2) return null;
    const correct = items[Math.floor(Math.random() * items.length)];
    const distractors = items.filter((v) => v.en !== correct.en);
    const shuffled = [...distractors].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, Math.min(3, shuffled.length));
    const options = [...picks.map((v) => v.en), correct.en].sort(() => Math.random() - 0.5);
    return { bn: correct.bn, en: correct.en, options };
  };

  const buildMasteryQueue = (items) => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled;
  };

  const buildMasteryOptions = (items, current) => {
    if (!current) return [];
    const distractors = items.filter((v) => v.en !== current.en);
    const picks = [...distractors].sort(() => Math.random() - 0.5).slice(0, Math.min(3, distractors.length));
    return [...picks.map((v) => v.en), current.en].sort(() => Math.random() - 0.5);
  };

  const startNewGameRound = () => {
    const clean = getGameItems();
    if (!clean.length) return;
    const question = buildGameQuestion(clean);
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

  const startMasteryRound = (nextQueue, nextIndex) => {
    const queue = nextQueue || masteryQueue;
    if (!queue?.length) return;
    let idx = typeof nextIndex === "number" ? nextIndex : masteryIndex;
    if (idx >= queue.length) idx = 0;
    setMasteryIndex(idx);
    setMasteryOptions(buildMasteryOptions(queue, queue[idx]));
    setMasteryResult(null);
    setMasteryChoice(null);
  };

  const handleGamePick = (option) => {
    if (!gameQuestion || gameResult) return;
    const isCorrect = option === gameQuestion.en;
    setGameChoice(option);
    setGameResult(isCorrect ? "correct" : "wrong");
    setGameScore((prev) => {
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });
  };

  const handleTrueFalsePick = (pickedTrue) => {
    if (!tfQuestion || tfResult) return;
    const isCorrect = pickedTrue === tfQuestion.isCorrect;
    setTfResult(isCorrect ? "correct" : "wrong");
    setTfScore((prev) => {
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });
  };

  const handleAudioPick = (option) => {
    if (!audioQuestion || audioResult) return;
    const isCorrect = option === audioQuestion.en;
    setAudioChoice(option);
    setAudioResult(isCorrect ? "correct" : "wrong");
    setAudioScore((prev) => {
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });
  };

  const handleMasteryPick = (option) => {
    const current = masteryQueue[masteryIndex];
    if (!current || masteryResult) return;
    const isCorrect = option === current.en;
    setMasteryChoice(option);
    setMasteryResult(isCorrect ? "correct" : "wrong");
    setMasteryScore((prev) => {
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });
    if (isCorrect) {
      setMasteryCorrectCount((prev) => prev + 1);
    } else {
      setMasteryCorrectCount(0);
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
    startMasteryRound(masteryQueue, nextIndex);
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
    setMasteryOptions(buildMasteryOptions(queue, queue[0]));
  };

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
    setGameScore({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
    setTfQuestion(null);
    setTfResult(null);
    setTfScore({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
    setAudioQuestion(null);
    setAudioResult(null);
    setAudioChoice(null);
    setAudioScore({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
    setMasteryQueue([]);
    setMasteryIndex(0);
    setMasteryCorrectCount(0);
    setMasteryTarget(3);
    setMasteryResult(null);
    setMasteryChoice(null);
    setMasteryOptions([]);
    setMasteryScore({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  };

  const getGameItems = useCallback(() => {
    const source = gameDataset === "phrases" ? lesson?.phrases : lesson?.vocab;
    if (!source?.length) return [];
    return source.filter((v) => v?.bn && v?.en);
  }, [lesson, gameDataset]);

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
    startMasteryRound(queue, 0);
    startNewGameRound();
    startTrueFalseRound();
    startAudioHuntRound();
  }, [lesson, gameDataset, gameItems]);

  useEffect(() => {
    if (!gameItems.length || gameItems.length < 2) return;
    setMasteryCorrectCount(0);
    setMasteryResult(null);
    setMasteryChoice(null);
    startMasteryRound(masteryQueue, masteryIndex);
  }, [masteryTarget, lesson, gameItems, masteryQueue, masteryIndex]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <style>{shellStyles}</style>
      <div className="bn-shell">
        <div className="bn-card">
          <h2 style={{ margin: 0 }}>বাংলা Tutor</h2>
          <p style={{ margin: "4px 0", color: "#475569" }}>Generate concise Bengali lessons with pronunciations and practice.</p>
          <div className="bn-grid">
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
              {error && <div style={{ color: "#dc2626", fontWeight: 600 }}>{error}</div>}
            </div>
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
                </div>
              </div>
              <div className="bn-row">
                <div>
                  <div className="bn-pill">Download vocab MP3</div>
                  <small style={{ color: "#475569" }}>Combined Bengali / English audio</small>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="bn-btn secondary" onClick={() => downloadCombinedVocabMp3("bn-IN")} disabled={!lesson?.vocab?.length || vocabMp3Loading}>
                    {vocabMp3Loading ? "Building..." : "Bengali MP3"}
                  </button>
                  <button className="bn-btn secondary" onClick={() => downloadCombinedVocabMp3("en-US")} disabled={!lesson?.vocab?.length || vocabMp3Loading}>
                    {vocabMp3Loading ? "Building..." : "Bengali → English MP3"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bn-card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipLoader size={22} color="#2563eb" />
            <span>Building your Bengali lesson…</span>
          </div>
        )}

        {lesson && !loading && (
          <div className="bn-card" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>{lesson.title}</h3>
              <span className="bn-pill">{lesson.level}</span>
              <span className="bn-pill">{lesson.focus}</span>
            </div>
            <p style={{ margin: 0, color: "#475569" }}>{lesson.summary}</p>
            <ActionButtons promptText={combinedLessonPrompt} />

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
                Show action buttons on phrases
              </label>
              <span style={{ fontSize: "0.9rem", color: "#475569" }}>(off by default for a cleaner view)</span>
            </div>

            {contentTab === "phrases" && lesson.phrases?.length ? (
              <div className="bn-section" style={{ display: "grid", gap: 10 }}>
                <h4 style={{ margin: 0 }}>Key Phrases</h4>
                {lesson.phrases.map((p, idx) => (
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
                        lesson.phrases.flatMap((p) => [
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
                {lesson.vocab.map((v, idx) => (
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
                        lesson.vocab.flatMap((v, i) => [
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
                        lesson.vocab.flatMap((v, i) => [
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
              <div className="bn-section" style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <h4 style={{ margin: 0 }}>{gameDataset === "phrases" ? "Phrase Games" : "Vocabulary Games"}</h4>
                  <div className="bn-pill">
                      {activeGameTab === "match" && `Score ${gameScore.correct}/${gameScore.total} • Streak ${gameScore.streak} (Best ${gameScore.bestStreak})`}
                      {activeGameTab === "truefalse" && `Score ${tfScore.correct}/${tfScore.total} • Streak ${tfScore.streak} (Best ${tfScore.bestStreak})`}
                      {activeGameTab === "audio" && `Score ${audioScore.correct}/${audioScore.total} • Streak ${audioScore.streak} (Best ${audioScore.bestStreak})`}
                      {activeGameTab === "mastery" && `Score ${masteryScore.correct}/${masteryScore.total} • Streak ${masteryScore.streak} (Best ${masteryScore.bestStreak})`}
                    </div>
                  </div>
                  <div className="bn-tabs">
                    <button className={`bn-tab ${gameDataset === "vocab" ? "active" : ""}`} onClick={() => setGameDataset("vocab")} disabled={!lesson.vocab?.length}>
                      Vocab set
                    </button>
                    <button className={`bn-tab ${gameDataset === "phrases" ? "active" : ""}`} onClick={() => setGameDataset("phrases")} disabled={!lesson.phrases?.length}>
                      Phrases set
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
                {activeGameTab === "match" && (
                  <>
                    {gameQuestion ? (
                      <div className="bn-section" style={{ background: "#fff", display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0f172a" }}>{gameQuestion.bn}</div>
                        {gameQuestion.pronunciation && (
                          <div style={{ color: "#475569" }}>{gameQuestion.pronunciation}</div>
                        )}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="bn-btn secondary" onClick={() => speak(gameQuestion.bn, "bn", { forceApi: true })}>🔈 Hear Bengali</button>
                          <button className="bn-btn secondary" onClick={startNewGameRound}>New card</button>
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {gameQuestion.options.map((option) => {
                            const isCorrect = option === gameQuestion.en;
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
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {gameResult && (
                          <div style={{ fontWeight: 700, color: gameResult === "correct" ? "#15803d" : "#b91c1c" }}>
                            {gameResult === "correct" ? "Nice! You got it." : `Close! The answer is "${gameQuestion.en}".`}
                          </div>
                        )}
                        {gameResult && (
                          <button className="bn-btn" onClick={startNewGameRound}>Next word</button>
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
                      <div className="bn-section" style={{ background: "#fff", display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>Listen and pick the English meaning</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="bn-btn" onClick={() => speak(audioQuestion.bn, "bn", { forceApi: true })}>▶️ Play Bengali</button>
                          <button className="bn-btn secondary" onClick={startAudioHuntRound}>New clip</button>
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {audioQuestion.options.map((option) => {
                            const isCorrect = option === audioQuestion.en;
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
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {audioResult && (
                          <div style={{ fontWeight: 700, color: audioResult === "correct" ? "#15803d" : "#b91c1c" }}>
                            {audioResult === "correct" ? "Correct!" : `Not quite — it was "${audioQuestion.en}".`}
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
                      <div className="bn-section" style={{ background: "#fff", display: "grid", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>Mastery Ladder</div>
                          <div className="bn-pill">
                            Target {masteryTarget} • Progress {masteryCorrectCount}/{masteryTarget}
                          </div>
                        </div>
                        <div style={{ color: "#475569" }}>Answer correctly {masteryTarget} times before moving to the next word.</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className={`bn-btn secondary ${masteryTarget === 3 ? "active" : ""}`} onClick={() => setMasteryTarget(3)}>
                            Target 3
                          </button>
                          <button className={`bn-btn secondary ${masteryTarget === 5 ? "active" : ""}`} onClick={() => setMasteryTarget(5)}>
                            Target 5
                          </button>
                          <button className="bn-btn secondary" onClick={reshuffleMastery}>Shuffle list</button>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0f172a" }}>
                          {masteryQueue[masteryIndex]?.bn}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="bn-btn"
                            onClick={() => speak(masteryQueue[masteryIndex]?.bn, "bn", { forceApi: true })}
                          >
                            ▶️ Play Bengali
                          </button>
                          <button className="bn-btn secondary" onClick={startMasteryRound}>New options</button>
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {masteryOptions.map((option) => {
                            const isCorrect = option === masteryQueue[masteryIndex]?.en;
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
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {masteryResult && (
                          <div style={{ fontWeight: 700, color: masteryResult === "correct" ? "#15803d" : "#b91c1c" }}>
                            {masteryResult === "correct"
                              ? "Correct! Keep it going."
                              : `Missed it — try again. The answer is "${masteryQueue[masteryIndex]?.en}".`}
                          </div>
                        )}
                        {masteryResult && (
                          <button className="bn-btn" onClick={advanceMastery}>
                            {masteryCorrectCount >= masteryTarget ? "Next word" : "Try again"}
                          </button>
                        )}
                        <div className="bn-pill">Score {masteryScore.correct}/{masteryScore.total} • Streak {masteryScore.streak} (Best {masteryScore.bestStreak})</div>
                      </div>
                    ) : (
                      <div style={{ color: "#475569" }}>Add at least two vocabulary words to start the game.</div>
                    )}
                  </>
                )}
                {activeGameTab === "truefalse" && (
                  <>
                    {tfQuestion ? (
                      <div className="bn-section" style={{ background: "#fff", display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>{tfQuestion.bn}</div>
                        <div style={{ color: "#475569" }}>Does this mean: <strong style={{ color: "#0f172a" }}>{tfQuestion.en}</strong>?</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="bn-btn secondary" onClick={() => speak(tfQuestion.bn, "bn", { forceApi: true })}>🔈 Hear Bengali</button>
                          <button className="bn-btn secondary" onClick={startTrueFalseRound}>New check</button>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="bn-btn secondary bn-true-btn" onClick={() => handleTrueFalsePick(true)} disabled={!!tfResult}>✅ True</button>
                          <button className="bn-btn secondary bn-false-btn" onClick={() => handleTrueFalsePick(false)} disabled={!!tfResult}>❌ False</button>
                        </div>
                        {tfResult && (
                          <div style={{ fontWeight: 700, color: tfResult === "correct" ? "#15803d" : "#b91c1c" }}>
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
