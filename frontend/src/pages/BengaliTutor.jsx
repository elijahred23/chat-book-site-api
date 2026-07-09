import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ClipLoader } from "react-spinners";
import { getGeminiResponse } from "../services/callGemini";
import ActionButtons from "../ui/ActionButtons.jsx";
import "./BengaliTutor.css";

const DEFAULT_PROMPT = "Everyday greetings at a coffee shop";
const LESSON_CACHE_KEY = "bengali_lesson_cache";
const INPUT_CACHE_KEY = "bengali_lesson_inputs";
const CORRECT_TIME = 250;
const INCORRECT_TIME = 700;

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
const promptLabel = (item, direction) => (direction === "en-bn" ? item.en : item.bn);
const optionLabel = (item, direction) => direction === "en-bn" ? `${item.bn} (${item.pronunciation || ""})` : item.en;
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const statusForWord = (stats, key) => {
  const record = stats[key];
  if (!record) return "new";
  return record.last === "wrong" ? "wrong" : "correct";
};

const statusClassForItem = (stats, item) => `match-${statusForWord(stats, wordKey(item))}`;

const pickWeightedItem = (items, stats) => {
  const weighted = items.flatMap((item) => {
    const record = stats[wordKey(item)];
    const weight = !record ? 5 : record.last === "wrong" ? 8 : record.correct > 0 ? 1 : 6;
    return Array.from({ length: weight }, () => item);
  });

  return weighted[Math.floor(Math.random() * weighted.length)] || items[0];
};

const initialScore = { correct: 0, total: 0, streak: 0, bestStreak: 0 };

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
  const [gameQuestion, setGameQuestion] = useState(null);
  const [gameChoice, setGameChoice] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [matchStats, setMatchStats] = useState({});
  const [gameScore, setGameScore] = useState(initialScore);
  const matchStatsRef = React.useRef({});

  useEffect(() => {
    try {
      localStorage.setItem("bn_game_direction", gameDirection);
    } catch {}
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
  }, [buildGameQuestion, gameDirection, gameItems]);

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

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError("");
      const promptText = buildPrompt(topic || DEFAULT_PROMPT, level, focus);
      const resp = await getGeminiResponse(promptText);
      const parsed = parseJson(resp);
      setLesson(parsed);
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

  const speak = (text, lang = "bn") => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang.startsWith("bn") ? "bn-IN" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
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

  const statsSummary = useMemo(() => {
    return gameItems.map(wordKey).reduce((acc, key) => {
      acc[statusForWord(matchStats, key)] += 1;
      return acc;
    }, { correct: 0, wrong: 0, new: 0 });
  }, [gameItems, matchStats]);

  const accuracy = gameScore.total ? Math.round((gameScore.correct / gameScore.total) * 100) : 0;

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
    .bn-game-shell { display: grid; gap: 14px; padding: 1rem; border: 1px solid #dbe3ef; border-radius: 16px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); box-shadow: 0 18px 40px rgba(15,23,42,0.08); }
    .bn-game-scoreboard { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (min-width: 760px) { .bn-game-scoreboard { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .bn-stat { min-width: 0; padding: 0.65rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 12px; background: rgba(255,255,255,0.86); }
    .bn-stat-label { color: #64748b; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
    .bn-stat-value { margin-top: 2px; color: #0f172a; font-size: 1rem; font-weight: 900; }
    .bn-game-card { display: grid; gap: 12px; padding: 1rem; border: 1px solid #dbe3ef; border-radius: 16px; background: #fff; box-shadow: 0 14px 34px rgba(15,23,42,0.08); }
    .bn-game-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .bn-game-prompt { color: #0f172a; font-size: 1.25rem; font-weight: 900; line-height: 1.25; }
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
    .bn-match-word-bank { display: flex; flex-wrap: wrap; gap: 8px; }
    .bn-match-word-chip { border: 1px solid #e2e8f0; border-radius: 999px; padding: 0.35rem 0.65rem; font-weight: 900; color: #0f172a; }
    .bn-script { display: inline-block; font-size: 1.12rem; font-weight: 800; color: #0f172a; border-radius: 10px; padding: 0.08rem 0.35rem; }
    .bn-pronunciation { color: #475569; font-weight: 700; }
    .bn-translation { color: #0f172a; }
    .bn-script.match-correct, .bn-match-word-chip.match-correct { background: #dcfce7; color: #14532d; border-color: #16a34a; }
    .bn-script.match-wrong, .bn-match-word-chip.match-wrong { background: #fee2e2; color: #7f1d1d; border-color: #ef4444; }
    .bn-script.match-new, .bn-match-word-chip.match-new { background: #fef9c3; color: #713f12; border-color: #eab308; }
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
                    <div className={`bn-script ${statusClassForItem(matchStats, phrase)}`} lang="bn">{phrase.bn}</div>
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
                    <div className={`bn-script ${statusClassForItem(matchStats, word)}`} lang="bn">{word.bn}</div>
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

                <div className="bn-game-scoreboard">
                  <div className="bn-stat"><div className="bn-stat-label">Score</div><div className="bn-stat-value">{gameScore.correct}/{gameScore.total}</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Accuracy</div><div className="bn-stat-value">{accuracy}%</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Words</div><div className="bn-stat-value">{statsSummary.correct}/{gameItems.length}</div></div>
                  <div className="bn-stat"><div className="bn-stat-label">Streak</div><div className="bn-stat-value">{gameScore.streak} / {gameScore.bestStreak}</div></div>
                </div>

                <div className="bn-section" style={{ background: "#fff", display: "grid", gap: 8 }}>
                  <strong>{gameDataset === "phrases" ? "Phrase set" : "Word set"}</strong>
                  <div className="bn-match-word-bank">
                    {gameItems.map((item) => (
                      <span key={wordKey(item)} className={`bn-match-word-chip ${statusClassForItem(matchStats, item)}`} lang="bn">
                        {item.bn}
                      </span>
                    ))}
                  </div>
                </div>

                {gameQuestion ? (
                  <div className="bn-game-card">
                    <div className="bn-game-card-top">
                      <div>
                        <div className="bn-game-prompt">{gameQuestion.displayQuestion}</div>
                        {gameDirection === "bn-en" && gameQuestion.pronunciation && <div className="bn-game-subtext">{gameQuestion.pronunciation}</div>}
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
                )}
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
