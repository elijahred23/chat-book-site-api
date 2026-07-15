import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ClipLoader } from "react-spinners";
import { getGeminiResponse } from "../services/callGemini";
import ActionButtons from "../ui/ActionButtons.jsx";
import adjectivesLesson from "../bengali_lessons/adjectives.json";
import adverbsLesson from "../bengali_lessons/adverbs.json";
import conjunctionsLesson from "../bengali_lessons/conjunctions.json";
import nounsLesson from "../bengali_lessons/nouns.json";
import numbersLesson from "../bengali_lessons/numbers.json";
import prepositionsLesson from "../bengali_lessons/prepositions.json";
import pronounsLesson from "../bengali_lessons/pronouns.json";
import verbsLesson from "../bengali_lessons/verbs.json";
import "./BengaliTutor.css";

const DEFAULT_PROMPT = "Everyday greetings at a coffee shop";
const LESSON_CACHE_KEY = "bengali_lesson_cache";
const INPUT_CACHE_KEY = "bengali_lesson_inputs";
const CORRECT_TIME = 250;
const INCORRECT_TIME = 700;

const SAVED_LESSONS = [
  adjectivesLesson,
  adverbsLesson,
  conjunctionsLesson,
  nounsLesson,
  numbersLesson,
  prepositionsLesson,
  pronounsLesson,
  verbsLesson,
].sort((a, b) => a.topic.localeCompare(b.topic));

const buildPrompt = (topic, level, focus) => `
You are a Bengali language tutor. Create a concise lesson as JSON (no extra text) with this shape:
{
  "title": "...",
  "summary": "...",
  "level": "beginner|intermediate|advanced",
  "topic": "...",
  "focus": "${focus}",
  "phrases": [
    { "bn": "Bengali phrase", "pronunciation": "Latin-script pronunciation", "en": "English meaning", "context": "When to use it" }
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
  const codeMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = codeMatch?.[1] ?? text;
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
  return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
};

const wordKey = (item) => JSON.stringify([item?.bn || "", item?.en || ""]);
const bengaliLabel = (item) => item.pronunciation ? `${item.bn} (${item.pronunciation})` : item.bn;
const promptLabel = (item, direction) => (direction === "en-bn" ? item.en : bengaliLabel(item));
const optionLabel = (item, direction) => direction === "en-bn" ? bengaliLabel(item) : item.en;
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const normalizeAnswer = (value) => value.trim().toLocaleLowerCase().replace(/[.,!?।'’"-]/g, "").replace(/\s+/g, " ");

const statusForWord = (stats, key) => {
  const record = stats[key];
  if (!record) return "new";
  return record.last === "wrong" ? "wrong" : "correct";
};

const statusClassForKey = (stats, key) => `match-${statusForWord(stats, key)}`;

const pickWeightedItem = (items, stats) => {
  const weighted = items.flatMap((item) => {
    const record = stats[wordKey(item)];
    const weight = !record ? 5 : record.last === "wrong" ? 8 : record.correct > 0 ? 1 : 6;
    return Array.from({ length: weight }, () => item);
  });

  return weighted[Math.floor(Math.random() * weighted.length)] || items[0];
};

const initialScore = { correct: 0, total: 0, streak: 0, bestStreak: 0 };

const speak = (text, lang = "bn") => {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang.startsWith("bn") ? "bn-IN" : "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
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
  const [savedLessonId, setSavedLessonId] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LESSON_CACHE_KEY) || "null")?.id || "";
    } catch {
      return "";
    }
  });
  const [contentTab, setContentTab] = useState("phrases");
  const [gameDataset, setGameDataset] = useState("vocab");
  const [gameDirection, setGameDirection] = useState(() => {
    try {
      return localStorage.getItem("bn_game_direction") || "bn-en";
    } catch {
      return "bn-en";
    }
  });
  const [matchOptionsCount, setMatchOptionsCount] = useState(4);
  const [gameMode, setGameMode] = useState("match");
  const [gameQuestion, setGameQuestion] = useState(null);
  const [gameChoice, setGameChoice] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [matchStats, setMatchStats] = useState({});
  const [gameScore, setGameScore] = useState(initialScore);
  const [recallAnswer, setRecallAnswer] = useState("");
  const [recallResult, setRecallResult] = useState(null);
  const [memoryCards, setMemoryCards] = useState([]);
  const [memoryOpen, setMemoryOpen] = useState([]);
  const [memoryMatched, setMemoryMatched] = useState([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryLocked, setMemoryLocked] = useState(false);
  const [arcadeRunning, setArcadeRunning] = useState(false);
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeCombo, setArcadeCombo] = useState(0);
  const [arcadeTime, setArcadeTime] = useState(30);
  const [arcadeLives, setArcadeLives] = useState(3);
  const [arcadeMessage, setArcadeMessage] = useState("");
  const [bingoBoard, setBingoBoard] = useState([]);
  const [bingoTarget, setBingoTarget] = useState(null);
  const [bingoMatched, setBingoMatched] = useState([]);
  const [bingoMistakes, setBingoMistakes] = useState(0);
  const [pronunciationQuestion, setPronunciationQuestion] = useState(null);
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [pronunciationChoice, setPronunciationChoice] = useState(null);
  const matchStatsRef = React.useRef({});
  const memoryTimerRef = React.useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem("bn_game_direction", gameDirection);
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [gameDirection]);

  const filteredVocab = useMemo(() => lesson?.vocab?.filter((v) => v?.bn && v?.en) || [], [lesson]);
  const filteredPhrases = useMemo(() => lesson?.phrases?.filter((p) => p?.bn && p?.en) || [], [lesson]);
  const gameItems = useMemo(() => gameDataset === "phrases" ? filteredPhrases : filteredVocab, [filteredPhrases, filteredVocab, gameDataset]);

  const combinedLessonPrompt = useMemo(() => {
    if (!lesson) return "";
    const isVocab = contentTab === "vocab" || (contentTab === "games" && gameDataset === "vocab");
    const source = isVocab ? filteredVocab : filteredPhrases;
    const items = source.map((p) => `${p.bn} (${p.pronunciation || ""}) - ${p.en}`);
    return `(${isVocab ? "Vocab" : "Phrases"}): ${items.join(" | ")}`;
  }, [lesson, filteredPhrases, filteredVocab, contentTab, gameDataset]);

  const buildGameQuestion = useCallback((items, direction = gameDirection, stats = matchStatsRef.current) => {
    if (!items?.length || items.length < 2) return null;
    const correct = pickWeightedItem(items, stats);
    const distractors = shuffle(items.filter((item) => wordKey(item) !== wordKey(correct))).slice(
      0,
      Math.min(matchOptionsCount - 1, items.length - 1)
    );
    const options = shuffle([...distractors, correct]).map((item) => ({ key: wordKey(item), label: optionLabel(item, direction) }));

    return {
      key: wordKey(correct),
      bn: correct.bn,
      bengaliDisplay: bengaliLabel(correct),
      en: correct.en,
      pronunciation: correct.pronunciation || "",
      displayQuestion: promptLabel(correct, direction),
      correctAnswer: optionLabel(correct, direction),
      options,
    };
  }, [gameDirection, matchOptionsCount]);

  const startNewGameRound = useCallback((direction = gameDirection, stats = matchStatsRef.current) => {
    const question = buildGameQuestion(gameItems, direction, stats);
    if (!question) return;
    setGameQuestion(question);
    setGameChoice(null);
    setGameResult(null);
    setRecallAnswer("");
    setRecallResult(null);
  }, [buildGameQuestion, gameDirection, gameItems]);

  const startMemoryRound = useCallback(() => {
    if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
    const pairs = shuffle(gameItems).slice(0, Math.min(6, gameItems.length));
    const cards = pairs.flatMap((item) => {
      const key = wordKey(item);
      return [
        { id: `${key}-prompt`, pairKey: key, label: promptLabel(item, gameDirection), language: gameDirection === "bn-en" ? "bn" : "en" },
        { id: `${key}-answer`, pairKey: key, label: optionLabel(item, gameDirection), language: gameDirection === "bn-en" ? "en" : "bn" },
      ];
    });
    setMemoryCards(shuffle(cards));
    setMemoryOpen([]);
    setMemoryMatched([]);
    setMemoryMoves(0);
    setMemoryLocked(false);
  }, [gameDirection, gameItems]);

  const startBingoRound = useCallback(() => {
    const board = shuffle(gameItems).slice(0, Math.min(9, gameItems.length));
    setBingoBoard(board);
    setBingoMatched([]);
    setBingoMistakes(0);
    setBingoTarget(board[0] || null);
  }, [gameItems]);

  const startPronunciationRound = useCallback(() => {
    const playableItems = gameItems.filter((item) => item.pronunciation);
    if (playableItems.length < 2) {
      setPronunciationQuestion(null);
      return;
    }
    const correct = playableItems[Math.floor(Math.random() * playableItems.length)];
    const distractors = shuffle(playableItems.filter((item) => wordKey(item) !== wordKey(correct))).slice(0, Math.min(3, playableItems.length - 1));
    setPronunciationQuestion({
      key: wordKey(correct),
      bn: correct.bn,
      bengaliDisplay: bengaliLabel(correct),
      en: correct.en,
      pronunciation: correct.pronunciation,
      options: shuffle([correct, ...distractors]).map((item) => item.en),
    });
    setPronunciationResult(null);
    setPronunciationChoice(null);
  }, [gameItems]);

  useEffect(() => {
    const nextStats = {};
    matchStatsRef.current = nextStats;
    setMatchStats(nextStats);
    setGameScore(initialScore);
    setGameQuestion(null);
    setGameChoice(null);
    setGameResult(null);

    if (gameItems.length >= 2) {
      const id = setTimeout(() => startNewGameRound(gameDirection, nextStats), 0);
      return () => clearTimeout(id);
    }
  }, [gameDataset, lesson, gameDirection, gameItems.length, startNewGameRound]);

  useEffect(() => {
    if (gameItems.length >= 2) startNewGameRound(gameDirection);
  }, [matchOptionsCount, gameDirection, gameItems.length, startNewGameRound]);

  useEffect(() => {
    if (gameItems.length >= 2) startMemoryRound();
    return () => {
      if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
    };
  }, [gameDataset, gameDirection, gameItems.length, lesson, startMemoryRound]);

  useEffect(() => {
    if (gameItems.length >= 2) {
      startBingoRound();
      startPronunciationRound();
    }
  }, [gameDataset, gameItems.length, lesson, startBingoRound, startPronunciationRound]);

  useEffect(() => {
    if (gameMode !== "sprint" || !arcadeRunning) return undefined;
    const timer = setInterval(() => {
      setArcadeTime((time) => {
        if (time <= 1) {
          setArcadeRunning(false);
          return 0;
        }
        return time - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [arcadeRunning, gameMode]);

  useEffect(() => {
    if (gameMode === "sound" && arcadeRunning && gameQuestion) {
      const timer = setTimeout(() => speak(gameQuestion.bn, "bn"), 120);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [arcadeRunning, gameMode, gameQuestion]);

  useEffect(() => {
    if (gameMode === "bingo" && bingoTarget) {
      const timer = setTimeout(() => speak(bingoTarget.bn, "bn"), 180);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [bingoTarget, gameMode]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError("");
      const promptText = buildPrompt(topic || DEFAULT_PROMPT, level, focus);
      const resp = await getGeminiResponse(promptText);
      const parsed = parseJson(resp);
      setLesson(parsed);
      setSavedLessonId("");
      setContentTab("phrases");
      setGameDataset(parsed.vocab?.length ? "vocab" : "phrases");
      localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(parsed));
      localStorage.setItem(INPUT_CACHE_KEY, JSON.stringify({ topic: topic || DEFAULT_PROMPT, level, focus }));
    } catch (err) {
      setError(err?.message || "Failed to build lesson");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedLesson = (lessonId) => {
    setSavedLessonId(lessonId);
    if (!lessonId) return;

    const selectedLesson = SAVED_LESSONS.find((item) => item.id === lessonId);
    if (!selectedLesson) return;

    setLesson(selectedLesson);
    setTopic(selectedLesson.topic);
    setLevel(selectedLesson.level);
    setFocus(selectedLesson.focus);
    setContentTab(selectedLesson.phrases?.length ? "phrases" : "vocab");
    setGameDataset(selectedLesson.vocab?.length ? "vocab" : "phrases");
    setError("");
    localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(selectedLesson));
    localStorage.setItem(INPUT_CACHE_KEY, JSON.stringify({
      topic: selectedLesson.topic,
      level: selectedLesson.level,
      focus: selectedLesson.focus,
    }));
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

  const handleGamePick = (option) => {
    if (!gameQuestion || gameResult) return;
    const isCorrect = option.label === gameQuestion.correctAnswer;
    setGameChoice(option.label);
    setGameResult(isCorrect ? "correct" : "wrong");

    const current = matchStatsRef.current[gameQuestion.key] || { correct: 0, wrong: 0, last: null };
    const nextStats = {
      ...matchStatsRef.current,
      [gameQuestion.key]: {
        correct: current.correct + (isCorrect ? 1 : 0),
        wrong: current.wrong + (isCorrect ? 0 : 1),
        last: isCorrect ? "correct" : "wrong",
      },
    };
    matchStatsRef.current = nextStats;
    setMatchStats(nextStats);

    setGameScore((prev) => {
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });
    setTimeout(() => startNewGameRound(gameDirection, nextStats), isCorrect ? CORRECT_TIME : INCORRECT_TIME);
  };

  const handleRecallSubmit = (event) => {
    event.preventDefault();
    if (!gameQuestion || recallResult || !recallAnswer.trim()) return;
    const expected = gameDirection === "en-bn" ? gameQuestion.bn : gameQuestion.en;
    const isCorrect = normalizeAnswer(recallAnswer) === normalizeAnswer(expected);
    setRecallResult(isCorrect ? "correct" : "wrong");
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

  const handleMemoryCard = (card) => {
    if (memoryLocked || memoryOpen.includes(card.id) || memoryMatched.includes(card.pairKey)) return;
    speak(card.label.replace(/\s*\([^)]*\)\s*$/, ""), card.language);
    const nextOpen = [...memoryOpen, card.id];
    setMemoryOpen(nextOpen);
    if (nextOpen.length < 2) return;

    setMemoryMoves((moves) => moves + 1);
    setMemoryLocked(true);
    const firstCard = memoryCards.find((item) => item.id === nextOpen[0]);
    if (firstCard?.pairKey === card.pairKey) {
      setMemoryMatched((matched) => [...matched, card.pairKey]);
      setMemoryOpen([]);
      setMemoryLocked(false);
      return;
    }

    memoryTimerRef.current = setTimeout(() => {
      setMemoryOpen([]);
      setMemoryLocked(false);
    }, 700);
  };

  const startArcadeGame = (mode) => {
    setArcadeScore(0);
    setArcadeCombo(0);
    setArcadeTime(30);
    setArcadeLives(3);
    setArcadeMessage("");
    setArcadeRunning(true);
    startNewGameRound(mode === "sound" ? "bn-en" : gameDirection);
    if (mode === "sound") setArcadeMessage("Listen closely!");
  };

  const handleArcadePick = (option) => {
    if (!arcadeRunning || !gameQuestion) return;
    const isCorrect = option.label === gameQuestion.correctAnswer;
    if (isCorrect) {
      const nextCombo = arcadeCombo + 1;
      setArcadeCombo(nextCombo);
      setArcadeScore((score) => score + 100 + Math.min(nextCombo - 1, 5) * 25);
      setArcadeMessage(nextCombo >= 3 ? `🔥 ${nextCombo}x combo!` : "✨ Nice hit!");
    } else {
      setArcadeCombo(0);
      setArcadeMessage(`💥 It was ${gameQuestion.correctAnswer}`);
      if (gameMode === "sound") {
        setArcadeLives((lives) => {
          const nextLives = lives - 1;
          if (nextLives <= 0) setArcadeRunning(false);
          return Math.max(0, nextLives);
        });
      } else {
        setArcadeScore((score) => Math.max(0, score - 25));
      }
    }
    startNewGameRound(gameMode === "sound" ? "bn-en" : gameDirection);
  };

  const handleBingoPick = (item) => {
    if (!bingoTarget || bingoMatched.includes(wordKey(item))) return;
    if (wordKey(item) !== wordKey(bingoTarget)) {
      setBingoMistakes((mistakes) => mistakes + 1);
      return;
    }
    const nextMatched = [...bingoMatched, wordKey(item)];
    setBingoMatched(nextMatched);
    const remaining = bingoBoard.filter((card) => !nextMatched.includes(wordKey(card)));
    const nextTarget = remaining[Math.floor(Math.random() * remaining.length)] || null;
    setBingoTarget(nextTarget);
    if (nextTarget) setTimeout(() => speak(nextTarget.bn, "bn"), 180);
  };

  const handlePronunciationPick = (option) => {
    if (!pronunciationQuestion || pronunciationResult) return;
    const isCorrect = option === pronunciationQuestion.en;
    setPronunciationChoice(option);
    setPronunciationResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setArcadeScore((score) => score + 100);
      setArcadeCombo((combo) => combo + 1);
      setTimeout(startPronunciationRound, 700);
    } else {
      setArcadeCombo(0);
    }
  };

  const statsSummary = useMemo(() => {
    return gameItems.map(wordKey).reduce((acc, key) => {
      acc[statusForWord(matchStats, key)] += 1;
      return acc;
    }, { correct: 0, wrong: 0, new: 0 });
  }, [gameItems, matchStats]);

  const accuracy = gameScore.total ? Math.round((gameScore.correct / gameScore.total) * 100) : 0;
  const memoryComplete = memoryCards.length > 0 && memoryMatched.length === memoryCards.length / 2;

  const shellStyles = `
    .bn-shell { max-width: 1100px; margin: 0 auto; padding: 1rem; display: grid; gap: 0.75rem; font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif; }
    .bn-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; box-shadow: 0 10px 24px rgba(15,23,42,0.08); }
    .bn-grid { display: grid; gap: 0.75rem; }
    @media (min-width: 820px) { .bn-grid { grid-template-columns: 1fr 1fr; } }
    .bn-section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; background: #f8fafc; }
    .bn-pill { padding: 0.4rem 0.7rem; border-radius: 999px; background: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0; font-size: 0.9rem; }
    .bn-btn { padding: 0.65rem 0.85rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #0f172a; color: #fff; cursor: pointer; font-weight: 700; }
    .bn-btn.secondary { background: #f8fafc; color: #0f172a; }
    .bn-tabs { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
    .bn-tab { border: 1px solid #e2e8f0; background: rgba(255,255,255,0.78); color: #0f172a; border-radius: 999px; padding: 0.45rem 0.7rem; font-weight: 700; cursor: pointer; text-align: center; }
    .bn-tab.active { background: #111827; color: #fff; border-color: #111827; }
    .bn-tab:disabled { cursor: not-allowed; opacity: 0.48; }
    .bn-select, .bn-input { padding: 0.7rem; border-radius: 10px; border: 1px solid #dbe3ef; background: #fff; color: #0f172a; font-weight: 700; }
    .bn-row { display: grid; gap: 6px; }
    .bn-game-picker { width: min(100%, 360px); }
    .bn-game-picker .bn-select { min-height: 48px; font-size: 1rem; cursor: pointer; }
    .bn-game-shell { display: grid; gap: 14px; padding: 1rem; border: 1px solid #dbe3ef; border-radius: 16px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); box-shadow: 0 18px 40px rgba(15,23,42,0.08); }
    .bn-game-scoreboard { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (min-width: 760px) { .bn-game-scoreboard { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .bn-stat { min-width: 0; padding: 0.65rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 12px; background: rgba(255,255,255,0.86); }
    .bn-stat-label { color: #64748b; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
    .bn-stat-value { margin-top: 2px; color: #0f172a; font-size: 1rem; font-weight: 900; }
    .bn-game-card { display: grid; gap: 12px; padding: 1rem; border: 1px solid #dbe3ef; border-radius: 16px; background: #fff; box-shadow: 0 14px 34px rgba(15,23,42,0.08); }
    .bn-game-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .bn-game-prompt { display: inline-block; color: #0f172a; font-size: 1.25rem; font-weight: 900; line-height: 1.25; border-radius: 10px; padding: 0.12rem 0.45rem; }
    .bn-game-prompt.match-correct { background: #dcfce7; color: #14532d; border: 1px solid #16a34a; }
    .bn-game-prompt.match-wrong { background: #fee2e2; color: #7f1d1d; border: 1px solid #ef4444; }
    .bn-game-prompt.match-new { background: #fef9c3; color: #713f12; border: 1px solid #eab308; }
    .bn-game-subtext { color: #64748b; font-size: 0.95rem; font-weight: 700; line-height: 1.35; }
    .bn-game-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .bn-game-options { display: grid; gap: 8px; }
    .bn-game-option { width: 100%; border: 1px solid #dbe3ef; background: #fff; color: #1e293b; padding: 0.75rem 0.85rem; border-radius: 12px; font-weight: 800; text-align: left; cursor: pointer; box-shadow: 0 8px 18px rgba(15,23,42,0.05); }
    .bn-game-option.correct { background: #dcfce7; border-color: #16a34a; color: #14532d; }
    .bn-game-option.wrong { background: #fee2e2; border-color: #ef4444; color: #7f1d1d; }
    .bn-option-index { display: inline-flex; align-items: center; justify-content: center; width: 1.45rem; height: 1.45rem; margin-right: 0.65rem; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 0.76rem; font-weight: 900; }
    .bn-game-feedback { padding: 0.75rem 0.85rem; border-radius: 12px; font-weight: 800; }
    .bn-game-feedback.correct { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .bn-game-feedback.wrong { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .bn-recall-form { display: grid; gap: 10px; }
    .bn-recall-form .bn-input { width: 100%; min-height: 48px; font-size: 1rem; }
    .bn-memory-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .bn-memory-card { min-height: 84px; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 12px; background: #176b4d; color: transparent; cursor: pointer; font-weight: 850; line-height: 1.25; box-shadow: 0 7px 16px rgba(15,23,42,0.09); }
    .bn-memory-card::after { content: "?"; color: #fff; font-size: 1.35rem; }
    .bn-memory-card.open, .bn-memory-card.matched { background: #fff; color: #17211b; }
    .bn-memory-card.open::after, .bn-memory-card.matched::after { content: ""; }
    .bn-memory-card.matched { border-color: #16a34a; background: #dcfce7; color: #14532d; cursor: default; }
    .bn-arcade-card { overflow: hidden; border: 2px solid #7c3aed; background: radial-gradient(circle at top right, rgba(250,204,21,.22), transparent 35%), linear-gradient(145deg, #faf5ff, #eff6ff); }
    .bn-arcade-card.sound { border-color: #0891b2; background: radial-gradient(circle at top right, rgba(34,211,238,.22), transparent 38%), linear-gradient(145deg, #ecfeff, #f0fdf4); }
    .bn-arcade-hud { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .bn-arcade-hud span { padding: 0.65rem; border-radius: 12px; background: #fff; color: #312e81; box-shadow: 0 5px 14px rgba(49,46,129,.1); font-size: 1.05rem; font-weight: 900; text-align: center; }
    .bn-arcade-start { display: grid; justify-items: center; gap: 12px; padding: 1.5rem 0.5rem; text-align: center; }
    .bn-sound-target { display: flex; align-items: center; gap: 10px; color: #164e63; font-size: clamp(1.4rem, 4vw, 2rem); font-weight: 950; }
    .bn-bingo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .bn-bingo-card { min-height: 92px; padding: 0.65rem; border: 2px solid #f59e0b; border-radius: 16px; background: linear-gradient(145deg, #fffbeb, #fff7ed); color: #78350f; cursor: pointer; font-weight: 850; box-shadow: 0 7px 16px rgba(180,83,9,.11); }
    .bn-bingo-card.matched { border-color: #16a34a; background: #dcfce7; color: #14532d; cursor: default; }
    .bn-bingo-card small { display: block; margin-top: 5px; font-weight: 700; opacity: .72; }
    .bn-pop-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 12px; padding-bottom: 10px; }
    .bn-pop-option { position: relative; min-height: 110px; padding: 1rem; border: 0; border-radius: 50% 50% 46% 46%; background: radial-gradient(circle at 35% 25%, #fff, #bae6fd 18%, #0ea5e9 75%); color: #082f49; cursor: pointer; font-size: 1rem; font-weight: 950; box-shadow: 0 12px 22px rgba(14,165,233,.22); transform-origin: center bottom; animation: bn-balloon-float 2.2s ease-in-out infinite alternate; }
    .bn-pop-option:nth-child(2n) { background: radial-gradient(circle at 35% 25%, #fff, #ddd6fe 18%, #8b5cf6 75%); color: #2e1065; }
    .bn-pop-option:nth-child(3n) { animation-delay: -1.1s; }
    .bn-pop-option::after { content: ""; position: absolute; bottom: -8px; left: calc(50% - 7px); width: 0; height: 0; border-right: 7px solid transparent; border-bottom: 0; border-left: 7px solid transparent; border-top: 11px solid #0ea5e9; }
    .bn-pop-option:nth-child(2n)::after { border-top-color: #8b5cf6; }
    .bn-pop-option.correct { outline: 4px solid #22c55e; }
    .bn-pop-option.wrong { outline: 4px solid #ef4444; }
    .bn-pop-option.popping { pointer-events: none; animation: bn-balloon-pop 380ms cubic-bezier(.2,.8,.3,1) forwards; }
    .bn-pop-burst { position: absolute; inset: 50% auto auto 50%; z-index: 3; pointer-events: none; font-size: 2rem; animation: bn-pop-burst 650ms ease-out forwards; }
    .bn-pop-stage { position: relative; }
    @keyframes bn-balloon-float { from { transform: translateY(3px) rotate(-1deg); } to { transform: translateY(-5px) rotate(1deg); } }
    @keyframes bn-balloon-pop { 0% { opacity: 1; transform: scale(1); } 42% { opacity: 1; transform: scale(1.22,.82); } 70% { opacity: .9; transform: scale(1.5); filter: saturate(1.8); } 100% { opacity: 0; transform: scale(1.9); filter: blur(5px); } }
    @keyframes bn-pop-burst { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.2) rotate(-12deg); } 35% { opacity: 1; transform: translate(-50%,-50%) scale(1.35) rotate(6deg); } 100% { opacity: 0; transform: translate(-50%,-90%) scale(1.8) rotate(12deg); } }
    @media (max-width: 520px) { .bn-memory-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 520px) { .bn-bingo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (prefers-reduced-motion: reduce) { .bn-pop-option { animation: none; } .bn-pop-option.popping { opacity: 0; } .bn-pop-burst { animation: none; } }
    .bn-script { display: inline-block; font-size: 1.12rem; font-weight: 800; color: #0f172a; border-radius: 10px; padding: 0.08rem 0.35rem; }
    .bn-pronunciation { color: #475569; font-weight: 700; }
    .bn-translation { color: #0f172a; }
  `;

  return (
    <main className="bn-page">
      <style>{shellStyles}</style>
      <div className="bn-shell">
        <header className="bn-card" style={{ display: "grid", gap: 12 }}>
          <div>
            <span className="bn-pill">Learn naturally</span>
            <h1><span lang="bn">বাংলা</span> Tutor</h1>
            <p>Build practical lessons, hear pronunciation, and strengthen recall through focused games.</p>
          </div>
          {lesson && <ActionButtons promptText={combinedLessonPrompt} />}
          <div className="bn-grid">
            <label className="bn-row">
              <strong>Saved lesson category</strong>
              <select className="bn-select" value={savedLessonId} onChange={(e) => loadSavedLesson(e.target.value)}>
                <option value="">Choose a saved lesson</option>
                {SAVED_LESSONS.map((savedLesson) => (
                  <option key={savedLesson.id} value={savedLesson.id}>{savedLesson.topic}</option>
                ))}
              </select>
            </label>
            <label className="bn-row">
              <strong>Topic</strong>
              <input className="bn-input" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </label>
            <label className="bn-row">
              <strong>Level</strong>
              <select className="bn-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="bn-row">
              <strong>Focus</strong>
              <select className="bn-select" value={focus} onChange={(e) => setFocus(e.target.value)}>
                <option value="conversation">Conversation</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="grammar">Grammar</option>
              </select>
            </label>
          </div>
          <div className="bn-game-actions">
            <button className="bn-btn" onClick={fetchLesson} disabled={loading}>{loading ? "Generating..." : "Generate Lesson"}</button>
            <button className="bn-btn secondary" onClick={downloadJson} disabled={!lesson}>Download JSON</button>
            <label className="bn-btn secondary">
              Upload JSON
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
                    setSavedLessonId("");
                    setContentTab("phrases");
                    setGameDataset(parsed.vocab?.length ? "vocab" : "phrases");
                    localStorage.setItem(LESSON_CACHE_KEY, text);
                    setError("");
                  } catch {
                    setError("Invalid lesson JSON");
                  } finally {
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
          {error && <div style={{ color: "#dc2626", fontWeight: 700 }}>{error}</div>}
        </header>

        {loading && (
          <div className="bn-card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipLoader size={22} color="#2563eb" />
            <span>Building your Bengali lesson...</span>
          </div>
        )}

        {lesson && !loading && (
          <article className="bn-card" style={{ display: "grid", gap: 12 }}>
            <div>
              <h2>{lesson.title}</h2>
              <p>{lesson.summary}</p>
              <div className="bn-game-actions">
                <span className="bn-pill">{lesson.level}</span>
                <span className="bn-pill">{lesson.focus}</span>
                <span className="bn-pill">{filteredVocab.length + filteredPhrases.length} items</span>
              </div>
            </div>

            <div className="bn-tabs">
              <button className={`bn-tab ${contentTab === "phrases" ? "active" : ""}`} onClick={() => setContentTab("phrases")} disabled={!filteredPhrases.length}>Key Phrases</button>
              <button className={`bn-tab ${contentTab === "vocab" ? "active" : ""}`} onClick={() => setContentTab("vocab")} disabled={!filteredVocab.length}>Vocabulary</button>
              <button className={`bn-tab ${contentTab === "games" ? "active" : ""}`} onClick={() => setContentTab("games")} disabled={filteredVocab.length + filteredPhrases.length < 2}>Games</button>
            </div>

            {contentTab === "phrases" && (
              <section className="bn-section" style={{ display: "grid", gap: 10 }}>
                <h3>Key phrases</h3>
                {filteredPhrases.map((phrase, idx) => (
                  <article key={`${phrase.bn}-${idx}`} className="bn-section" style={{ background: "#fff" }}>
                    <div className="bn-script" lang="bn">{phrase.bn}</div>
                    <div className="bn-pronunciation">{phrase.pronunciation}</div>
                    <div className="bn-translation">{phrase.en}</div>
                    {phrase.context && <div style={{ color: "#475569" }}>{phrase.context}</div>}
                    <div className="bn-game-actions" style={{ marginTop: 8 }}>
                      <button className="bn-btn secondary" onClick={() => speak(phrase.bn, "bn")}>Hear Bengali</button>
                      <button className="bn-btn secondary" onClick={() => speak(phrase.en, "en")}>Hear English</button>
                    </div>
                  </article>
                ))}
              </section>
            )}

            {contentTab === "vocab" && (
              <section className="bn-section" style={{ display: "grid", gap: 10 }}>
                <h3>Vocabulary</h3>
                {filteredVocab.map((word, idx) => (
                  <article key={`${word.bn}-${idx}`} className="bn-section" style={{ background: "#fff" }}>
                    <div className="bn-script" lang="bn">{word.bn}</div>
                    <div className="bn-pronunciation">{word.pronunciation}</div>
                    <div className="bn-translation">{word.en}</div>
                    <div className="bn-game-actions" style={{ marginTop: 8 }}>
                      <button className="bn-btn secondary" onClick={() => speak(word.bn, "bn")}>Hear Bengali</button>
                      <button className="bn-btn secondary" onClick={() => speak(word.en, "en")}>Hear English</button>
                    </div>
                  </article>
                ))}
              </section>
            )}

            {contentTab === "games" && (
              <div className="bn-game-shell">
                <div className="bn-tabs">
                  <button className={`bn-tab ${gameDataset === "vocab" ? "active" : ""}`} onClick={() => setGameDataset("vocab")} disabled={!filteredVocab.length}>Vocab set</button>
                  <button className={`bn-tab ${gameDataset === "phrases" ? "active" : ""}`} onClick={() => setGameDataset("phrases")} disabled={!filteredPhrases.length}>Phrases set</button>
                </div>
                <div className="bn-tabs">
                  <button className={`bn-tab ${gameDirection === "bn-en" ? "active" : ""}`} onClick={() => setGameDirection("bn-en")}>Bengali to English</button>
                  <button className={`bn-tab ${gameDirection === "en-bn" ? "active" : ""}`} onClick={() => setGameDirection("en-bn")}>English to Bengali</button>
                </div>

                <label className="bn-row bn-game-picker">
                  <strong>Choose a game</strong>
                  <select
                    className="bn-select"
                    value={gameMode}
                    onChange={(event) => {
                      setGameMode(event.target.value);
                      setArcadeRunning(false);
                    }}
                  >
                    <option value="match">🎯 Match It</option>
                    <option value="sprint">⚡ 30s Sprint</option>
                    <option value="sound">🎧 Sound Quest</option>
                    <option value="bingo">🎵 Bengali Bingo</option>
                    <option value="pronunciation">🎈 Word Pop</option>
                    <option value="memory">🧠 Memory Flip</option>
                    <option value="recall">✍️ Type Recall</option>
                  </select>
                </label>

                {(gameMode === "match" || gameMode === "recall") && <div className="bn-game-scoreboard">
                  <div className="bn-stat"><div className="bn-stat-label">Score</div><div className="bn-stat-value">{gameScore.correct}/{gameScore.total}</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Accuracy</div><div className="bn-stat-value">{accuracy}%</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Learned</div><div className="bn-stat-value">{statsSummary.correct}/{gameItems.length}</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Streak</div><div className="bn-stat-value">{gameScore.streak} / {gameScore.bestStreak}</div></div>
                </div>}

                {gameMode === "match" && (gameQuestion ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className={`bn-game-prompt ${statusClassForKey(matchStats, gameQuestion.key)}`}>{gameQuestion.displayQuestion}</div>
                      </div>
                      <label className="bn-row" style={{ width: 130 }}>
                        <strong>Options</strong>
                        <select className="bn-select" value={matchOptionsCount} onChange={(e) => setMatchOptionsCount(Number(e.target.value))}>
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="bn-game-actions">
                      <button className="bn-btn secondary" onClick={() => speak(gameQuestion.bn, "bn")}>Hear target Bengali</button>
                      <button className="bn-btn secondary" onClick={() => startNewGameRound()}>New card</button>
                    </div>
                    <div className="bn-game-options">
                      {gameQuestion.options.map((option, idx) => {
                        const isCorrect = option.label === gameQuestion.correctAnswer;
                        const stateClass = gameResult ? isCorrect ? "correct" : option.label === gameChoice ? "wrong" : "" : "";
                        return (
                          <button key={`${option.key}-${option.label}`} className={`bn-game-option ${stateClass}`} onClick={() => handleGamePick(option)} disabled={!!gameResult}>
                            <span className="bn-option-index">{idx === 9 ? 0 : idx + 1}</span>
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    {gameResult && (
                      <div className={`bn-game-feedback ${gameResult}`}>
                        {gameResult === "correct" ? "Correct" : `Answer: ${gameQuestion.correctAnswer}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "#475569" }}>Add at least two items to start Match It.</div>
                ))}

                {gameMode === "recall" && (gameQuestion ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-subtext">Type the {gameDirection === "en-bn" ? "Bengali" : "English"} translation from memory</div>
                        <div className={`bn-game-prompt ${statusClassForKey(matchStats, gameQuestion.key)}`}>{gameQuestion.displayQuestion}</div>
                      </div>
                      <button className="bn-btn secondary" onClick={() => speak(gameQuestion.bn, "bn")}>🔊 Hear Bengali</button>
                    </div>
                    <form className="bn-recall-form" onSubmit={handleRecallSubmit}>
                      <label className="bn-row">
                        <strong>Your answer</strong>
                        <input
                          className="bn-input"
                          value={recallAnswer}
                          onChange={(event) => setRecallAnswer(event.target.value)}
                          placeholder={gameDirection === "en-bn" ? "বাংলায় লিখুন" : "Type in English"}
                          autoComplete="off"
                          disabled={!!recallResult}
                        />
                      </label>
                      <div className="bn-game-actions">
                        <button className="bn-btn" type="submit" disabled={!recallAnswer.trim() || !!recallResult}>Check answer</button>
                        {recallResult && <button className="bn-btn secondary" type="button" onClick={() => startNewGameRound()}>Next word</button>}
                      </div>
                    </form>
                    {recallResult && (
                      <div className={`bn-game-feedback ${recallResult}`}>
                        {recallResult === "correct" ? "✨ Nailed it! Active recall makes memories stick." : `Keep going — the answer is ${gameDirection === "en-bn" ? gameQuestion.bengaliDisplay : gameQuestion.en}.`}
                      </div>
                    )}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add at least two items to start Type Recall.</div>)}

                {(gameMode === "sprint" || gameMode === "sound") && (gameQuestion ? (
                  <div className={`bn-game-card bn-arcade-card ${gameMode}`}>
                    <div className="bn-arcade-hud">
                      <span>🏆 {arcadeScore}</span>
                      {gameMode === "sprint" ? <span>⏱️ {arcadeTime}s</span> : <span aria-label={`${arcadeLives} lives`}>{"❤️".repeat(arcadeLives)}{"🖤".repeat(3 - arcadeLives)}</span>}
                      <span>🔥 {arcadeCombo}x</span>
                    </div>
                    {!arcadeRunning ? (
                      <div className="bn-arcade-start">
                        <div className="bn-game-prompt">{gameMode === "sprint" ? "Score as many points as you can in 30 seconds!" : arcadeLives === 0 ? "Quest over! Ready for another run?" : "Listen and find the right meaning. Three lives!"}</div>
                        <div className="bn-game-subtext">Correct streaks unlock combo bonus points.</div>
                        <button className="bn-btn" onClick={() => startArcadeGame(gameMode)}>{arcadeScore ? "Play again" : "Start game"}</button>
                      </div>
                    ) : (
                      <>
                        <div className="bn-game-card-top">
                          <div>
                            {gameMode === "sprint" ? (
                              <div className="bn-game-prompt">{gameQuestion.displayQuestion}</div>
                            ) : (
                              <div>
                                <div className="bn-sound-target">🎧 <span>What did you hear?</span></div>
                                <div className="bn-game-subtext" lang="bn">{gameQuestion.bengaliDisplay}</div>
                              </div>
                            )}
                            <div className="bn-game-subtext">{arcadeMessage || "Go!"}</div>
                          </div>
                          {gameMode === "sound" && <button className="bn-btn secondary" onClick={() => speak(gameQuestion.bn, "bn")}>🔊 Replay sound</button>}
                        </div>
                        <div className="bn-game-options">
                          {gameQuestion.options.map((option, idx) => (
                            <button key={`${option.key}-${option.label}`} className="bn-game-option" onClick={() => handleArcadePick(option)}>
                              <span className="bn-option-index">{idx === 9 ? 0 : idx + 1}</span>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add at least two items to enter the arcade.</div>)}

                {gameMode === "bingo" && (bingoBoard.length ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-prompt">🎵 Bengali Bingo</div>
                        <div className="bn-game-subtext">Listen, then tap the matching meaning. Clear the whole board!</div>
                      </div>
                      <div className="bn-game-actions">
                        <span className="bn-pill">✅ {bingoMatched.length}/{bingoBoard.length}</span>
                        <span className="bn-pill">💥 {bingoMistakes}</span>
                        <button className="bn-btn secondary" onClick={() => bingoTarget && speak(bingoTarget.bn, "bn")}>🔊 Replay</button>
                        <button className="bn-btn secondary" onClick={startBingoRound}>New board</button>
                      </div>
                    </div>
                    {bingoTarget && <div className="bn-game-feedback correct" lang="bn">Find: {bengaliLabel(bingoTarget)}</div>}
                    <div className="bn-bingo-grid">
                      {bingoBoard.map((item) => {
                        const matched = bingoMatched.includes(wordKey(item));
                        return (
                          <button key={wordKey(item)} className={`bn-bingo-card ${matched ? "matched" : ""}`} onClick={() => handleBingoPick(item)} disabled={matched}>
                            {matched ? "✓ " : ""}{item.en}
                            {matched && <small>{bengaliLabel(item)}</small>}
                          </button>
                        );
                      })}
                    </div>
                    {!bingoTarget && <div className="bn-game-feedback correct">🎉 BINGO! Board cleared with {bingoMistakes} mistake{bingoMistakes === 1 ? "" : "s"}.</div>}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add at least two items to play Bengali Bingo.</div>)}

                {gameMode === "pronunciation" && (pronunciationQuestion ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-subtext">Pop the balloon with the matching meaning</div>
                        <div className="bn-game-prompt" lang="bn">{pronunciationQuestion.bengaliDisplay}</div>
                      </div>
                      <div className="bn-game-actions">
                        <span className="bn-pill">🏆 {arcadeScore}</span>
                        <span className="bn-pill">🔥 {arcadeCombo}x</span>
                        <button className="bn-btn secondary" onClick={() => speak(pronunciationQuestion.bn, "bn")}>🔊 Hear it</button>
                      </div>
                    </div>
                    <div className="bn-pop-stage">
                      {pronunciationResult === "correct" && <div className="bn-pop-burst" aria-hidden="true">💥✨🎉</div>}
                      <div className="bn-pop-options">
                        {pronunciationQuestion.options.map((option) => {
                          const stateClass = pronunciationResult ? option === pronunciationQuestion.en ? "correct" : option === pronunciationChoice ? "wrong" : "" : "";
                          const isPopping = pronunciationResult && option === pronunciationChoice;
                          return <button key={option} className={`bn-pop-option ${stateClass} ${isPopping ? "popping" : ""}`} onClick={() => handlePronunciationPick(option)} disabled={!!pronunciationResult}>{option}</button>;
                        })}
                      </div>
                    </div>
                    {pronunciationResult === "wrong" && (
                      <div className="bn-game-feedback wrong">
                        The answer is {pronunciationQuestion.en}.
                        <button className="bn-btn secondary" onClick={startPronunciationRound} style={{ marginLeft: 10 }}>Next balloon</button>
                      </div>
                    )}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add pronunciations for at least two items to play Word Pop.</div>)}

                {gameMode === "memory" && (memoryCards.length ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-prompt">Find every matching pair</div>
                        <div className="bn-game-subtext">Flip a Bengali card and its translation. Cards speak when revealed.</div>
                      </div>
                      <div className="bn-game-actions">
                        <span className="bn-pill">{memoryMatched.length}/{memoryCards.length / 2} pairs</span>
                        <span className="bn-pill">{memoryMoves} moves</span>
                        <button className="bn-btn secondary" onClick={startMemoryRound}>Shuffle</button>
                      </div>
                    </div>
                    <div className="bn-memory-grid">
                      {memoryCards.map((card) => {
                        const isOpen = memoryOpen.includes(card.id);
                        const isMatched = memoryMatched.includes(card.pairKey);
                        return (
                          <button
                            key={card.id}
                            className={`bn-memory-card ${isOpen ? "open" : ""} ${isMatched ? "matched" : ""}`}
                            onClick={() => handleMemoryCard(card)}
                            disabled={memoryLocked || isMatched}
                            aria-label={isOpen || isMatched ? card.label : "Hidden memory card"}
                          >
                            {isOpen || isMatched ? card.label : "Hidden"}
                          </button>
                        );
                      })}
                    </div>
                    {memoryComplete && <div className="bn-game-feedback correct">🎉 Board cleared in {memoryMoves} moves! Shuffle and try to beat your score.</div>}
                  </div>
                ) : <div style={{ color: "#475569" }}>Add at least two items to start Memory Flip.</div>)}
              </div>
            )}

            {lesson.practice?.length ? (
              <section className="bn-section" style={{ display: "grid", gap: 8 }}>
                <h3>Practice</h3>
                {lesson.practice.map((item, idx) => (
                  <div key={idx} className="bn-section" style={{ background: "#fff" }}>
                    <strong>{item.type}</strong>
                    <div>{item.prompt}</div>
                    <div style={{ color: "#475569" }}>Answer: {item.answer}</div>
                  </div>
                ))}
              </section>
            ) : null}

            {lesson.notes?.length ? (
              <section className="bn-section">
                <h3>Notes</h3>
                {lesson.notes.map((note, idx) => <div key={idx} style={{ color: "#475569" }}>• {note}</div>)}
              </section>
            ) : null}
          </article>
        )}
      </div>
    </main>
  );
}
