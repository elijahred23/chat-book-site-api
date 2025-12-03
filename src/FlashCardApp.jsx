import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { useAppState, useAppDispatch, actions } from "./context/AppContext";
import { getGeminiResponse } from "./utils/callGemini.js";
import CurrentModeView from "./modes/CurrentModeView.jsx";

const FlashCardContext = createContext(null);
export const useFlashCardContext = () => useContext(FlashCardContext);

function extractJsonFromResponse(text) {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch (err) {}
  const fencedMatch = text.match(/```\s*json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    const candidate = fencedMatch[1].trim();
    try {
      return JSON.parse(candidate);
    } catch (err) {}
  }
  const genericMatch = text.match(/```([\s\S]*?)```/);
  if (genericMatch && genericMatch[1]) {
    const candidate = genericMatch[1].trim();
    try {
      return JSON.parse(candidate);
    } catch (err) {}
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (err) {}
  }
  return null;
}

function shuffleArray(array) {
  const arr = Array.from(array);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuizOptions(cards, index) {
  const correct = cards[index]?.answer;
  if (!correct) return [];
  const otherAnswers = cards.filter((_, i) => i !== index).map((c) => c.answer);
  const distractors = shuffleArray(otherAnswers).slice(0, 3);
  const options = shuffleArray([correct, ...distractors]);
  return options;
}

const COLORS = {
  text: "#1f2937",
  primary: "#2563eb",
  border: "#d1d5db",
  background: "#f8fafc",
  buttonBg: "#f3f4f6",
  buttonBgActive: "#e5e7eb",
  correctBg: "#d1fae5",
  incorrectBg: "#fee2e2",
  matchedBg: "#e5e7eb",
  selectedBg: "#e0f2fe",
};

export default function FlashCardApp() {
  const { flashcardPrompt } = useAppState();
  const dispatch = useAppDispatch();
  const [cards, setCards] = useState(() => {
    try {
      const stored = localStorage.getItem("cards");
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);
  useEffect(() => {
    setActiveTab(cards.length > 0 ? "view" : "controls");
  }, [cards.length]);

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("table");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (cards.length > 0) return "view";
    return "controls";
  });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 640);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGenerateFromPrompt = async () => {
    if (!prompt) return;
    try {
      // Clear any existing cards before generating new ones
      setCards([]);
      setLoading(true);
      const instruction = `\nGenerate vocabulary flash cards for the topic: "${prompt}".\nReturn ONLY valid JSON in the following format:\n[\n  { "question": "Term1", "answer": "Definition of term 1" },\n  { "question": "Term2", "answer": "Definition of term 2" }\n]\nDo not include any extra text, explanations, or formatting outside of the JSON.\nEnsure the JSON is valid and represents vocabulary terms with their definitions.\n`;
      const rawResponse = await getGeminiResponse(instruction);
      const generated = extractJsonFromResponse(rawResponse);
      if (!generated) {
        throw new Error("Gemini response did not contain a valid JSON vocabulary list.");
      }
      const list = Array.isArray(generated)
        ? generated
        : generated.cards || generated.flashcards || generated.vocabulary || [];
      if (!Array.isArray(list)) {
        throw new Error("Extracted JSON does not appear to be an array of flashcards.");
      }
      const normalised = list.map((card) => ({
        question: (card.question || card.word || card.term || card.prompt || "").toString(),
        answer: (card.answer || card.definition || card.meaning || card.response || "").toString(),
      }));
      setCards((prev) => [...prev, ...normalised]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Seed the prompt from global action button selections
  useEffect(() => {
    if (flashcardPrompt) {
      setPrompt(flashcardPrompt);
      dispatch(actions.setFlashcardPrompt(""));
    }
  }, [flashcardPrompt, dispatch]);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const json = JSON.parse(text);
        const rawCards = Array.isArray(json) ? json : Array.isArray(json.cards) ? json.cards : null;
        if (rawCards) {
          const imported = rawCards.map((card) => ({
            question: (card.question || card.word || card.term || "").toString(),
            answer: (card.answer || card.definition || card.meaning || "").toString(),
          }));
          setCards(imported);
          setError(null);
        } else {
          setError("Uploaded file does not contain a valid array of flash cards.");
        }
      } catch (err) {
        setError("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = async () => {
    try {
      const data = JSON.stringify(cards, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const fileName = "flashcards.json";

      if (typeof window.showSaveFilePicker === "function") {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "JSON Files",
                accept: { "application/json": [".json"] },
              },
            ],
          });

          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
          console.warn("File picker failed, falling back to download", err);
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.rel = "noopener";
      a.target = "_blank";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to save file: " + err.message);
    }
  };

  const handleCopyJson = async () => {
    try {
      const jsonString = JSON.stringify(cards, null, 2);
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString);
      } else {
        const helper = document.createElement("textarea");
        helper.value = jsonString;
        helper.setAttribute("readonly", "");
        helper.style.position = "absolute";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
      setError(null);
    } catch (err) {
      setError("Failed to copy to clipboard: " + err.message);
    }
  };

  const handlePasteJson = async () => {
    try {
      let text = "";
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      } else {
        text = window.prompt("Paste your JSON here:") || "";
      }
      const json = JSON.parse(text);
      const rawCards = Array.isArray(json) ? json : Array.isArray(json.cards) ? json.cards : null;
      if (rawCards) {
        const imported = rawCards.map((card) => ({
          question: (card.question || card.word || card.term || "").toString(),
          answer: (card.answer || card.definition || card.meaning || "").toString(),
        }));
        setCards(imported);
        setError(null);
      } else {
        setError("Clipboard does not contain a valid array of flash cards.");
      }
    } catch (err) {
      setError("Failed to paste JSON: " + err.message);
    }
  };

  const ttsLoopRef = useRef(false);

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    return utterance;
  };

  const readCurrentCard = () => {
    if (cards.length === 0) return;
    let index = 0;
    if (mode === "study") {
      index = studyIndex;
    } else if (mode === "quiz") {
      index = quizIndex;
    } else if (mode === "recall") {
      index = recallIndex;
    } else {
      index = 0;
    }
    const card = cards[index];
    if (!card) return;
    window.speechSynthesis.cancel();
    const utterance = speakText(`${card.question}. ${card.answer}.`);
    window.speechSynthesis.speak(utterance);
  };

  const readAllCards = () => {
    if (cards.length === 0) return;
    window.speechSynthesis.cancel();
    ttsLoopRef.current = true;
    let i = 0;
    const speakNext = () => {
      if (!ttsLoopRef.current) return;
      if (i >= cards.length) {
        i = 0;
      }
      const card = cards[i];
      const utterance = speakText(`${card.question}. ${card.answer}.`);
      utterance.onend = () => {
        i++;
        if (ttsLoopRef.current) {
          speakNext();
        }
      };
      window.speechSynthesis.speak(utterance);
    };
    speakNext();
  };

  const stopTts = () => {
    ttsLoopRef.current = false;
    window.speechSynthesis.cancel();
  };

  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setStudyIndex(0);
    setShowAnswer(false);
  }, [cards]);

  const nextStudyCard = () => {
    if (cards.length === 0) return;
    setStudyIndex((idx) => (idx + 1) % cards.length);
    setShowAnswer(false);
  };

  const prevStudyCard = () => {
    if (cards.length === 0) return;
    setStudyIndex((idx) => (idx - 1 + cards.length) % cards.length);
    setShowAnswer(false);
  };

  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizComplete(false);
  }, [cards]);

  const restartQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizComplete(false);
    setSelectedOption(null);
  };

  const handleSelectQuizOption = (option) => {
    if (quizComplete) return;
    setSelectedOption(option);
    const correctAnswer = cards[quizIndex]?.answer;
    if (option === correctAnswer) {
      setQuizScore((score) => score + 1);
    }
    setTimeout(() => {
      if (quizIndex + 1 < cards.length) {
        setQuizIndex((idx) => idx + 1);
        setSelectedOption(null);
      } else {
        setQuizComplete(true);
      }
    }, 500);
  };

  const [matchTerms, setMatchTerms] = useState([]);
  const [matchDefs, setMatchDefs] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);

  const resetMatch = () => {
    const terms = cards.map((card, idx) => ({ idx, text: card.question }));
    const defs = cards.map((card, idx) => ({ idx, text: card.answer }));
    setMatchTerms(shuffleArray(terms));
    setMatchDefs(shuffleArray(defs));
    setMatchedPairs([]);
    setSelectedTerm(null);
    setSelectedDef(null);
  };

  useEffect(() => {
    resetMatch();
  }, [cards]);

  // Reset indices/selections when card count changes to avoid stale references
  useEffect(() => {
    setStudyIndex(0);
    setQuizIndex(0);
    setRecallIndex(0);
    setSurvivalIndex(0);
    setBlitzIndex(0);
    setTypingIndex(0);
    setSelectedOption(null);
    setSelectedTerm(null);
    setSelectedDef(null);
    setSurvivalSelected(null);
    setBlitzSelected(null);
    setMemorySelected([]);
  }, [cards.length]);

  useEffect(() => {
    if (selectedTerm !== null && selectedDef !== null) {
      if (selectedTerm === selectedDef) {
        setMatchedPairs((prev) => [...prev, selectedTerm]);
      }
      setSelectedTerm(null);
      setSelectedDef(null);
    }
  }, [selectedTerm, selectedDef]);

  const [recallIndex, setRecallIndex] = useState(0);
  const [recallInput, setRecallInput] = useState("");
  const [recallScore, setRecallScore] = useState(0);
  const [recallComplete, setRecallComplete] = useState(false);
  const [showRecallFeedback, setShowRecallFeedback] = useState(false);
  const [recallHintLevel, setRecallHintLevel] = useState(0);

  const restartRecall = () => {
    setRecallIndex(0);
    setRecallInput("");
    setRecallScore(0);
    setRecallComplete(false);
    setShowRecallFeedback(false);
    setRecallHintLevel(0);
  };

  useEffect(() => {
    restartRecall();
  }, [cards]);

  const handleRecallSubmit = () => {
    if (recallComplete) return;
    const correct = cards[recallIndex]?.question?.trim().toLowerCase() || "";
    const user = recallInput.trim().toLowerCase();
    if (user && user === correct) {
      setRecallScore((score) => score + 1);
    }
    setShowRecallFeedback(true);
    setTimeout(() => {
      setShowRecallFeedback(false);
      if (recallIndex + 1 < cards.length) {
        setRecallIndex((idx) => idx + 1);
        setRecallInput("");
        setRecallHintLevel(0);
      } else {
        setRecallComplete(true);
      }
    }, 700);
  };

  const handleRecallHint = () => {
    const question = cards[recallIndex]?.question || "";
    const words = question.split(/\s+/).filter(Boolean);
    if (!words.length) return;
    setRecallHintLevel((lvl) => Math.min(words.length, lvl + 1));
    setShowRecallFeedback(false);
  };

  const handleRecallSkip = () => {
    if (recallIndex + 1 < cards.length) {
      setRecallIndex((idx) => idx + 1);
      setRecallInput("");
      setRecallHintLevel(0);
      setShowRecallFeedback(false);
    } else {
      setRecallComplete(true);
    }
  };

  const [memoryItems, setMemoryItems] = useState([]);
  const [memorySelected, setMemorySelected] = useState([]);
  const [memoryMatched, setMemoryMatched] = useState([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryStreak, setMemoryStreak] = useState(0);
  const [memoryBestStreak, setMemoryBestStreak] = useState(0);

  const createMemoryItems = () => {
    const items = [];
    cards.forEach((card, idx) => {
      items.push({ id: idx, type: "question", text: card.question });
      items.push({ id: idx, type: "answer", text: card.answer });
    });
    return shuffleArray(items);
  };

  const resetMemoryGame = () => {
    setMemoryItems(createMemoryItems());
    setMemorySelected([]);
    setMemoryMatched([]);
    setMemoryMoves(0);
    setMemoryStreak(0);
    setMemoryBestStreak(0);
  };

  useEffect(() => {
    resetMemoryGame();
  }, [cards]);

  const handleMemorySelect = (index) => {
    if (
      memoryMatched.includes(memoryItems[index]?.id) ||
      memorySelected.includes(index)
    ) {
      return;
    }
    if (memorySelected.length === 2) return;
    if (memorySelected.length === 0) {
      setMemorySelected([index]);
    } else if (memorySelected.length === 1) {
      const firstIndex = memorySelected[0];
      const first = memoryItems[firstIndex];
      const second = memoryItems[index];
      const isMatch = first.id === second.id && first.type !== second.type;
      setMemoryMoves((m) => m + 1);
      if (isMatch) {
        setMemoryStreak((streak) => {
          const next = streak + 1;
          setMemoryBestStreak((best) => Math.max(best, next));
          return next;
        });
      } else {
        setMemoryStreak(0);
      }
      setMemorySelected([firstIndex, index]);
      setTimeout(() => {
        if (isMatch) {
          setMemoryMatched((prev) => [...prev, first.id]);
        }
        setMemorySelected([]);
      }, 600);
    }
  };

  const [survivalOrder, setSurvivalOrder] = useState([]);
  const [survivalIndex, setSurvivalIndex] = useState(0);
  const [survivalLives, setSurvivalLives] = useState(3);
  const [survivalScore, setSurvivalScore] = useState(0);
  const [survivalSelected, setSurvivalSelected] = useState(null);
  const [survivalComplete, setSurvivalComplete] = useState(false);
  const [blitzOrder, setBlitzOrder] = useState([]);
  const [blitzIndex, setBlitzIndex] = useState(0);
  const [blitzScore, setBlitzScore] = useState(0);
  const [blitzStreak, setBlitzStreak] = useState(0);
  const [blitzBestStreak, setBlitzBestStreak] = useState(0);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(45);
  const [blitzSelected, setBlitzSelected] = useState(null);
  const [blitzRunning, setBlitzRunning] = useState(false);
  const [blitzComplete, setBlitzComplete] = useState(false);
  const [typingOrder, setTypingOrder] = useState([]);
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingInput, setTypingInput] = useState("");
  const [typingScore, setTypingScore] = useState(0);
  const [typingTimeLeft, setTypingTimeLeft] = useState(60);
  const [typingRunning, setTypingRunning] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const [typingCombo, setTypingCombo] = useState(0);
  const [typingBestCombo, setTypingBestCombo] = useState(0);

  const resetSurvival = () => {
    const order = shuffleArray(cards.map((_, i) => i));
    setSurvivalOrder(order);
    setSurvivalIndex(0);
    setSurvivalLives(3);
    setSurvivalScore(0);
    setSurvivalSelected(null);
    setSurvivalComplete(false);
  };

  useEffect(() => {
    resetSurvival();
  }, [cards]);

  const handleSelectSurvivalOption = (option) => {
    if (survivalComplete || survivalSelected !== null) return;
    const cardIdx = survivalOrder[survivalIndex];
    const correctAnswer = cards[cardIdx]?.answer;
    const isCorrect = option === correctAnswer;
    const updatedLives = isCorrect ? survivalLives : survivalLives - 1;
    setSurvivalSelected(option);
    if (isCorrect) {
      setSurvivalScore((score) => score + 1);
    }
    setTimeout(() => {
      setSurvivalSelected(null);
      if (!isCorrect) {
        setSurvivalLives(updatedLives);
      }
      const atEnd = survivalIndex + 1 >= survivalOrder.length;
      if (updatedLives <= 0 || atEnd) {
        setSurvivalComplete(true);
      } else {
        setSurvivalIndex((idx) => idx + 1);
      }
    }, 600);
  };

  const resetBlitz = () => {
    if (!cards.length) return;
    setBlitzOrder(shuffleArray(cards.map((_, i) => i)));
    setBlitzIndex(0);
    setBlitzScore(0);
    setBlitzStreak(0);
    setBlitzBestStreak(0);
    setBlitzTimeLeft(45);
    setBlitzSelected(null);
    setBlitzComplete(false);
    setBlitzRunning(true);
  };

  useEffect(() => {
    setBlitzOrder(shuffleArray(cards.map((_, i) => i)));
    setBlitzIndex(0);
  }, [cards]);

  useEffect(() => {
    setTypingOrder(shuffleArray(cards.map((_, i) => i)));
    setTypingIndex(0);
  }, [cards]);

  useEffect(() => {
    if (mode !== "blitz") {
      setBlitzRunning(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "blitz" || !blitzRunning) return;
    const timer = setInterval(() => {
      setBlitzTimeLeft((time) => {
        if (time <= 1) {
          setBlitzRunning(false);
          setBlitzComplete(true);
          return 0;
        }
        return time - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, blitzRunning]);

  const handleSelectBlitzOption = (option) => {
    if (!blitzRunning || blitzSelected !== null || blitzComplete) return;
    const cardIdx = blitzOrder[blitzIndex];
    const correctAnswer = cards[cardIdx]?.answer;
    const isCorrect = option === correctAnswer;
    setBlitzSelected(option);
    if (isCorrect) {
      setBlitzScore((score) => score + 1);
    }
    setBlitzStreak((streak) => {
      const next = isCorrect ? streak + 1 : 0;
      if (isCorrect) {
        setBlitzBestStreak((best) => Math.max(best, next));
      }
      return next;
    });
    setTimeout(() => {
      setBlitzSelected(null);
      const atEnd = blitzIndex + 1 >= blitzOrder.length;
      if (atEnd) {
        setBlitzComplete(true);
        setBlitzRunning(false);
      } else {
        setBlitzIndex((idx) => idx + 1);
      }
    }, 400);
  };

  const resetTypingGame = () => {
    if (!cards.length) return;
    setTypingOrder(shuffleArray(cards.map((_, i) => i)));
    setTypingIndex(0);
    setTypingInput("");
    setTypingScore(0);
    setTypingTimeLeft(60);
    setTypingRunning(true);
    setTypingComplete(false);
    setTypingCombo(0);
    setTypingBestCombo(0);
  };

  useEffect(() => {
    if (mode !== "typing") {
      setTypingRunning(false);
      return;
    }
    if (!typingRunning || typingComplete) return;
    const timer = setInterval(() => {
      setTypingTimeLeft((t) => {
        if (t <= 1) {
          setTypingRunning(false);
          setTypingComplete(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, typingRunning, typingComplete]);

  const handleTypingSubmit = () => {
    if (!typingRunning || typingComplete) return;
    const cardIdx = typingOrder[typingIndex];
    const normalize = (val) => val.trim().toLowerCase().replace(/\s+/g, " ");
    const expected = normalize(cards[cardIdx]?.answer || "");
    const user = normalize(typingInput);
    const isCorrect = expected && user === expected;
    if (isCorrect) {
      setTypingScore((s) => s + 10);
      setTypingCombo((c) => {
        const next = c + 1;
        setTypingBestCombo((b) => Math.max(b, next));
        return next;
      });
    } else {
      setTypingCombo(0);
    }
    setTypingInput("");
    const atEnd = typingIndex + 1 >= typingOrder.length;
    if (atEnd) {
      setTypingComplete(true);
      setTypingRunning(false);
    } else {
      setTypingIndex((idx) => idx + 1);
    }
  };

  const renderNavigation = () => {
    const navContainerStyle = {
      marginBottom: "1rem",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "0.5rem",
      flexWrap: isMobile ? "nowrap" : "wrap",
    };
    return (
      <div style={{ ...navContainerStyle, background: "#ffffff", borderRadius: "12px", padding: "0.5rem", boxShadow: "0 10px 24px rgba(15,23,42,0.08)", border: `1px solid ${COLORS.border}` }}>
        {[
          { key: "study", label: "Study" },
          { key: "quiz", label: "Quiz" },
          { key: "match", label: "Matching" },
          { key: "recall", label: "Recall" },
      { key: "memory", label: "Memory Flip" },
      { key: "survival", label: "Survival" },
      { key: "typing", label: "Typing" },
      { key: "blitz", label: "Blitz" },
      { key: "table", label: "Table" },
    ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: isMobile ? "0.75rem" : "0.65rem 1.2rem",
              border:
                key === mode
                  ? `2px solid ${COLORS.primary}`
                  : `1px solid ${COLORS.border}`,
              background: key === mode ? "linear-gradient(135deg, #2563eb, #60a5fa)" : COLORS.buttonBg,
              color: key === mode ? "#fff" : COLORS.text,
              borderRadius: "10px",
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
              textAlign: "center",
              boxShadow: key === mode ? "0 10px 20px rgba(37,99,235,0.25)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    );
  };

  const renderControls = () => {
    const containerStyle = {
      marginBottom: "1rem",
      color: COLORS.text,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      background: "#ffffff",
      borderRadius: "12px",
      padding: "0.75rem",
      boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
      border: `1px solid ${COLORS.border}`,
    };
    const fileActionsStyle = {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      gap: "0.5rem",
      flexWrap: isMobile ? "nowrap" : "wrap",
    };
    const topicRowStyle = {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      gap: "0.5rem",
    };
    return (
      <div style={containerStyle}>
        <div style={fileActionsStyle}>
          <label style={{ display: "flex", alignItems: "center" }}>
            Upload JSON:
            <input
              type="file"
              accept="application/json"
              onChange={handleFileUpload}
              style={{ marginLeft: isMobile ? "0" : "0.5rem" }}
            />
          </label>
          <button
            onClick={handleDownload}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: COLORS.buttonBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              color: COLORS.text,
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
            }}
          >
            Download JSON
          </button>
          <button
            onClick={handleCopyJson}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: COLORS.buttonBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              color: COLORS.text,
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
            }}
          >
            Copy JSON
          </button>
          <button
            onClick={handlePasteJson}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: COLORS.buttonBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              color: COLORS.text,
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
            }}
          >
            Paste JSON
          </button>
          <button
            onClick={() => setCards([])}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: COLORS.buttonBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              color: COLORS.text,
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
            }}
          >
            Clear Cards
          </button>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, #ecf5ff 0%, #f8fbff 100%)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "14px",
            padding: "0.85rem",
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            display: "grid",
            gap: "0.65rem",
          }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              width: "100%",
              fontWeight: 700,
              color: COLORS.text,
            }}
          >
            Flashcard Topic / Context
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste or type context to generate flashcards"
              style={{
                width: "100%",
                minHeight: "160px",
                padding: "0.85rem",
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                fontSize: "1.05rem",
                background: "#ffffff",
                color: COLORS.text,
                boxShadow: "inset 0 1px 3px rgba(15,23,42,0.08)",
                lineHeight: 1.5,
              }}
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={handleGenerateFromPrompt}
              style={{
                padding: "0.65rem 1rem",
                backgroundColor: COLORS.buttonBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                color: COLORS.text,
                cursor: loading ? "default" : "pointer",
                width: isMobile ? "100%" : "auto",
                fontWeight: 700,
              }}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
            <button
              onClick={() => setPrompt("")}
              style={{
                padding: "0.65rem 1rem",
                backgroundColor: COLORS.buttonBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                color: COLORS.text,
                cursor: "pointer",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Clear Prompt
            </button>
            <button
              onClick={() => {
                navigator.clipboard.readText().then((text) => setPrompt(text));
              }}
              style={{
                padding: "0.65rem 1rem",
                backgroundColor: COLORS.buttonBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                color: COLORS.text,
                cursor: "pointer",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Paste Topic
            </button>
          </div>
        </div>
        {loading && (
          <div style={{ marginTop: "0.5rem", color: "#2563eb" }}>
            🔄 Generating flashcards...
          </div>
        )}
        {error && (
          <div style={{ color: "#dc2626", marginTop: "0.5rem" }}>{error}</div>
        )}
      </div>
    );
  };

  const contextValue = {
    cards,
    setCards,
    prompt,
    setPrompt,
    mode,
    setMode,
    error,
    loading,
    isMobile,
    COLORS,
    handleGenerateFromPrompt,
    handleFileUpload,
    handleDownload,
    handleCopyJson,
    handlePasteJson,
    readCurrentCard,
    readAllCards,
    stopTts,
    studyIndex,
    showAnswer,
    prevStudyCard,
    nextStudyCard,
    setShowAnswer,
    quizIndex,
    quizComplete,
    quizScore,
    selectedOption,
    handleSelectQuizOption,
    restartQuiz,
    matchTerms,
    matchDefs,
    matchedPairs,
    selectedTerm,
    selectedDef,
    setSelectedTerm,
    setSelectedDef,
    resetMatch,
    recallIndex,
    recallInput,
    recallScore,
    recallComplete,
    showRecallFeedback,
    recallHintLevel,
    setRecallInput,
    handleRecallSubmit,
    restartRecall,
    handleRecallHint,
    handleRecallSkip,
    memoryItems,
    memorySelected,
    memoryMatched,
    memoryMoves,
    memoryStreak,
    memoryBestStreak,
    handleMemorySelect,
    resetMemoryGame,
    survivalOrder,
    survivalIndex,
    survivalLives,
    survivalScore,
    survivalSelected,
    survivalComplete,
    handleSelectSurvivalOption,
    resetSurvival,
    generateQuizOptions,
    blitzOrder,
    blitzIndex,
    blitzScore,
    blitzStreak,
    blitzBestStreak,
    blitzTimeLeft,
    blitzSelected,
    blitzRunning,
    blitzComplete,
    resetBlitz,
    handleSelectBlitzOption,
    typingOrder,
    typingIndex,
    typingInput,
    typingScore,
    typingTimeLeft,
    typingRunning,
    typingComplete,
    typingCombo,
    typingBestCombo,
    resetTypingGame,
    handleTypingSubmit,
    setTypingInput,
  };

  return (
    <FlashCardContext.Provider value={contextValue}>
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "1rem",
        color: COLORS.text,
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "14px",
        boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, color: COLORS.text }}>
          Flash Card Study Tool
        </h2>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", margin: "0.75rem 0" }}>
        <button
          onClick={() => setActiveTab("view")}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: "10px",
            border: `1px solid ${COLORS.border}`,
            background: activeTab === "view" ? COLORS.buttonBgActive : COLORS.buttonBg,
            fontWeight: 700,
            cursor: "pointer",
            color: COLORS.text,
          }}
        >
          View / Play
        </button>
        <button
          onClick={() => setActiveTab("controls")}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: "10px",
            border: `1px solid ${COLORS.border}`,
            background: activeTab === "controls" ? COLORS.buttonBgActive : COLORS.buttonBg,
            fontWeight: 700,
            cursor: "pointer",
            color: COLORS.text,
          }}
        >
          Controls & Data
        </button>
      </div>

      {activeTab === "controls" && (
        <>
          {renderControls()}
          {renderNavigation()}
        </>
      )}

      {activeTab === "view" && (
        <CurrentModeView
          mode={mode}
          cards={cards}
          COLORS={COLORS}
          isMobile={isMobile}
          studyIndex={studyIndex}
          showAnswer={showAnswer}
          onPrevStudy={prevStudyCard}
          onNextStudy={nextStudyCard}
          onToggleAnswer={() => setShowAnswer((v) => !v)}
          quizIndex={quizIndex}
          quizComplete={quizComplete}
          quizScore={quizScore}
          selectedOption={selectedOption}
          onSelectQuizOption={handleSelectQuizOption}
          onRestartQuiz={restartQuiz}
          matchTerms={matchTerms}
          matchDefs={matchDefs}
          matchedPairs={matchedPairs}
          selectedTerm={selectedTerm}
          selectedDef={selectedDef}
          onSelectTerm={setSelectedTerm}
          onSelectDef={setSelectedDef}
          onResetMatch={resetMatch}
          recallIndex={recallIndex}
          recallInput={recallInput}
          recallScore={recallScore}
          recallComplete={recallComplete}
          showRecallFeedback={showRecallFeedback}
          recallHintLevel={recallHintLevel}
          onChangeRecallInput={setRecallInput}
          onSubmitRecall={handleRecallSubmit}
          onRestartRecall={restartRecall}
          onHint={handleRecallHint}
          onSkip={handleRecallSkip}
          memoryItems={memoryItems}
          memorySelected={memorySelected}
          memoryMatched={memoryMatched}
          memoryMoves={memoryMoves}
          memoryStreak={memoryStreak}
          memoryBestStreak={memoryBestStreak}
          onSelectMemory={handleMemorySelect}
          onResetMemory={resetMemoryGame}
          survivalOrder={survivalOrder}
          survivalIndex={survivalIndex}
          survivalLives={survivalLives}
          survivalScore={survivalScore}
          survivalSelected={survivalSelected}
          survivalComplete={survivalComplete}
          onSelectSurvivalOption={handleSelectSurvivalOption}
          onRestartSurvival={resetSurvival}
          generateQuizOptions={generateQuizOptions}
          blitzOrder={blitzOrder}
          blitzIndex={blitzIndex}
          blitzScore={blitzScore}
          blitzStreak={blitzStreak}
          blitzBestStreak={blitzBestStreak}
          blitzTimeLeft={blitzTimeLeft}
          blitzSelected={blitzSelected}
          blitzRunning={blitzRunning}
          blitzComplete={blitzComplete}
          onStartBlitz={resetBlitz}
          onSelectBlitzOption={handleSelectBlitzOption}
          typingOrder={typingOrder}
          typingIndex={typingIndex}
          typingInput={typingInput}
          typingScore={typingScore}
          typingTimeLeft={typingTimeLeft}
          typingRunning={typingRunning}
          typingComplete={typingComplete}
          typingCombo={typingCombo}
          typingBestCombo={typingBestCombo}
          onStartTyping={resetTypingGame}
          onTypingInput={setTypingInput}
          onSubmitTyping={handleTypingSubmit}
          setCards={setCards}
        />
      )}
      </div>
    </FlashCardContext.Provider>
  );
}
