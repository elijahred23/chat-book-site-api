import React, { useState, useEffect, useRef } from "react";

// Import the back‑end helpers. These functions are assumed to be defined
// elsewhere in your project (for example in a geminiApi.js file). They
// provide access to Gemini via HTTP endpoints. Adjust the import path
// to match where you've placed these functions in your codebase.
import { getGeminiResponse } from "./utils/callGemini.js";
import ActionButtons from "./ui/ActionButtons.jsx";
import FlashCardTable from "./FlashCardTable.jsx";

/**
 * Attempt to extract a JSON object or array from an arbitrary string.
 * Gemini responses can include explanatory text before or after the JSON
 * payload, or wrap it in a fenced code block. This helper tries several
 * strategies to find and parse the JSON fragment reliably.
 *
 * @param {string} text The raw response from the Gemini endpoint.
 * @returns {any|null} The parsed JSON object/array, or null if no JSON was found.
 */
function extractJsonFromResponse(text) {
  if (!text || typeof text !== "string") return null;
  // 1. Try parsing the entire response directly.
  try {
    return JSON.parse(text);
  } catch (err) {
    /* fallthrough */
  }
  // 2. Look for a fenced code block explicitly labelled as JSON. This is a
  // common pattern with LLMs when returning structured data.
  const fencedMatch = text.match(/```\s*json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    const candidate = fencedMatch[1].trim();
    try {
      return JSON.parse(candidate);
    } catch (err) {
      /* continue */
    }
  }
  // 3. Look for a generic fenced code block without the json specifier.
  const genericMatch = text.match(/```([\s\S]*?)```/);
  if (genericMatch && genericMatch[1]) {
    const candidate = genericMatch[1].trim();
    try {
      return JSON.parse(candidate);
    } catch (err) {
      /* continue */
    }
  }
  // 4. As a last resort, attempt to slice out text between the first '{'
  // and the last '}'. This helps capture naked JSON objects/arrays.
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (err) {
      /* continue */
    }
  }
  // No JSON could be extracted.
  return null;
}

/**
 * Utility to shuffle an array in place and return a new array. This is
 * used for randomising the order of flash cards and quiz options.
 *
 * @param {Array<any>} array The array to shuffle.
 * @returns {Array<any>} A new array with the elements shuffled.
 */
function shuffleArray(array) {
  const arr = Array.from(array);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a set of multiple choice options for a given flashcard. The
 * correct answer will always be included, supplemented with up to three
 * distractors drawn at random from the remaining cards. When there are
 * fewer than four cards in total, the number of options will be the
 * minimum of the number of cards and four.
 *
 * @param {Array<{question: string, answer: string}>} cards The full list of cards.
 * @param {number} index The index of the card to generate options for.
 * @returns {Array<string>} An array of answer strings in random order.
 */
function generateQuizOptions(cards, index) {
  const correct = cards[index]?.answer;
  if (!correct) return [];
  const otherAnswers = cards
    .filter((_, i) => i !== index)
    .map((c) => c.answer);
  // Select up to three random distractors without repetition.
  const distractors = shuffleArray(otherAnswers).slice(0, 3);
  const options = shuffleArray([correct, ...distractors]);
  return options;
}

// Define a simple color palette to keep the UI accessible. The palette
// opts for dark text on light backgrounds to improve readability. You
// can adjust these values to fit your design system or brand colours.
const COLORS = {
  // Dark text colour for primary content. Using a cool grey for good
  // contrast on light backgrounds.
  text: "#1f2937",
  // Primary accent colour for active borders and highlights.
  primary: "#2563eb",
  // Neutral border colour for cards and buttons.
  border: "#d1d5db",
  // Default background for cards and containers.
  background: "#f5f5f5",
  // Background for buttons in their default state.
  buttonBg: "#f3f4f6",
  // Background for buttons when selected (e.g. in navigation).
  buttonBgActive: "#e5e7eb",
  // Correct answer highlight for quiz options.
  correctBg: "#d1fae5",
  // Incorrect answer highlight for quiz options.
  incorrectBg: "#fee2e2",
  // Background for matched items in match mode.
  matchedBg: "#e5e7eb",
  // Background for a selected item in match mode.
  selectedBg: "#e0f2fe",
};

/**
 * The main React component implementing a flash card study system. Users
 * can upload a JSON file containing cards, generate cards via the
 * Gemini API, review cards in several modes (study, quiz, matching and
 * recall), and export their deck back to a file. Each mode is designed
 * to exercise different recall mechanisms to aid memorisation.
 */
export default function FlashCardApp() {
  // Global card state. Each card is expected to be an object with
  // `question` and `answer` fields. Some LLM responses may use
  // alternative keys (e.g. `word`/`definition`), so we normalise
  // them after parsing.
    const [cards, setCards] = useState(() => {
    try {
      const stored = localStorage.getItem("cards");
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Whenever cards update, persist them to localStorage
  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);
  // The prompt to send to Gemini when generating cards.
  const [prompt, setPrompt] = useState("");
  // The currently selected feature/mode. One of: "study", "quiz",
  // "match", "recall", "memory", "survival", "table".
  const [mode, setMode] = useState("table");
  // Error handling for API calls and parsing.
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Track whether the viewport is narrow enough to be considered mobile. This helps
  // adjust layouts responsively without relying on external CSS files. The threshold
  // of 640px matches common breakpoints for small devices. The state is updated
  // whenever the window resizes.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 640);
      }
    };
    // Initialize on mount
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Gemini API integration                                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * Submit the user's prompt to Gemini and attempt to extract a JSON array
   * of cards from the response. If successful, the new cards will be
   * appended to the existing deck. Any parsing errors will be surfaced
   * to the user via the `error` state.
   */
  const handleGenerateFromPrompt = async () => {
    if (!prompt) return;
    try {
      setLoading(true);
      /**
       * IMPORTANT: The instruction explicitly requests that the model return
       * only raw JSON matching the shape used by this app. Using
       * `question` and `answer` keys ensures that the resulting objects
       * integrate seamlessly with the rest of the UI without further
       * transformation. By wrapping the values in quotes and omitting
       * explanatory text, we reduce the likelihood of unwanted data.
       */
      const instruction = `\nGenerate vocabulary flash cards for the topic: "${prompt}".\nReturn ONLY valid JSON in the following format:\n[\n  { "question": "Term1", "answer": "Definition of term 1" },\n  { "question": "Term2", "answer": "Definition of term 2" }\n]\nDo not include any extra text, explanations, or formatting outside of the JSON.\nEnsure the JSON is valid and represents vocabulary terms with their definitions.\n`;
      const rawResponse = await getGeminiResponse(instruction);
      const generated = extractJsonFromResponse(rawResponse);
      if (!generated) {
        throw new Error(
          "Gemini response did not contain a valid JSON vocabulary list."
        );
      }
      // Determine the array of cards from the returned object. Some LLMs
      // might nest the array under another property such as `cards` or
      // `vocabulary`.
      const list = Array.isArray(generated)
        ? generated
        : generated.cards || generated.flashcards || generated.vocabulary || [];
      if (!Array.isArray(list)) {
        throw new Error(
          "Extracted JSON does not appear to be an array of flashcards."
        );
      }
      // Normalise each card to ensure consistent keys. If keys are
      // missing, default to an empty string. This prevents runtime errors
      // elsewhere in the component.
      const normalised = list.map((card) => ({
        question:
          (card.question || card.word || card.term || card.prompt || "").toString(),
        answer:
          (card.answer || card.definition || card.meaning || card.response || "").toString(),
      }));
      setCards((prev) => [...prev, ...normalised]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* File upload, download, copy and paste                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * Read a local JSON file and update the card set. Expects the file
   * contents to be either a JSON array of card objects or an object
   * containing such an array under a `cards` property. Any cards will
   * replace the existing set. The imported objects are normalised to
   * the `{question, answer}` shape.
   *
   * @param {Event} event File input change event.
   */
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const json = JSON.parse(text);
        const rawCards = Array.isArray(json)
          ? json
          : Array.isArray(json.cards)
          ? json.cards
          : null;
        if (rawCards) {
          // normalise structure on import
          const imported = rawCards.map((card) => ({
            question:
              (card.question || card.word || card.term || "").toString(),
            answer:
              (card.answer || card.definition || card.meaning || "").toString(),
          }));
          setCards(imported);
          setError(null);
        } else {
          setError(
            "Uploaded file does not contain a valid array of flash cards."
          );
        }
      } catch (err) {
        setError("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  /**
   * Download the current deck of cards as a JSON file. The file
   * name defaults to `flashcards.json` and contains a pretty‑printed
   * representation of the cards array.
   */
  const handleDownload = () => {
    try {
      const data = JSON.stringify(cards, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "flashcards.json";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to prepare download: " + err.message);
    }
  };

  /**
   * Copy the current deck of cards to the user's clipboard as pretty printed JSON.
   */
  const handleCopyJson = async () => {
    try {
      const jsonString = JSON.stringify(cards, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setError(null);
    } catch (err) {
      setError("Failed to copy to clipboard: " + err.message);
    }
  };

  /**
   * Paste JSON content from the user's clipboard and load it as the current deck.
   * Attempts to parse clipboard text as JSON and normalises the resulting
   * array of flashcards. If parsing fails, an error is shown.
   */
  const handlePasteJson = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const json = JSON.parse(text);
      const rawCards = Array.isArray(json)
        ? json
        : Array.isArray(json.cards)
        ? json.cards
        : null;
      if (rawCards) {
        const imported = rawCards.map((card) => ({
          question: (card.question || card.word || card.term || "").toString(),
          answer: (card.answer || card.definition || card.meaning || "").toString(),
        }));
        setCards(imported);
        setError(null);
      } else {
        setError(
          "Clipboard does not contain a valid array of flash cards."
        );
      }
    } catch (err) {
      setError("Failed to paste JSON: " + err.message);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Text to speech (TTS) functionality                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * A ref used to control whether a looped TTS session should continue.
   * When set to `false`, any ongoing read loop will terminate after the
   * current utterance finishes.
   */
  const ttsLoopRef = useRef(false);

  /**
   * Speak a given string using the Web Speech API. Adjusts pitch and rate
   * slightly for a more natural cadence. This helper returns a
   * SpeechSynthesisUtterance instance so that callers can attach their own
   * event handlers (e.g. for chaining multiple utterances).
   *
   * @param {string} text The text to be spoken aloud.
   */
  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    // Adjust these values to tune the voice characteristics.
    utterance.rate = 1;
    utterance.pitch = 1;
    // You could also choose a specific voice here if multiple are installed.
    return utterance;
  };

  /**
   * Read aloud the current card's question and answer. Determines the
   * appropriate card based on the active mode. Cancels any ongoing speech
   * before speaking the new content.
   */
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
    // Stop any existing utterances before starting a new one.
    window.speechSynthesis.cancel();
    const utterance = speakText(`${card.question}. ${card.answer}.`);
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Loop through all cards in the deck and read each question and answer
   * sequentially. Once the end is reached, the loop starts over. Users
   * can stop the loop at any time via the stopTts function. If called
   * while a loop is already running, it restarts from the beginning.
   */
  const readAllCards = () => {
    if (cards.length === 0) return;
    // Cancel any current speech and signal that the loop should run.
    window.speechSynthesis.cancel();
    ttsLoopRef.current = true;
    let i = 0;
    const speakNext = () => {
      if (!ttsLoopRef.current) return;
      // Wrap around when reaching the end of the deck.
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

  /**
   * Stop any ongoing text-to-speech activity. Cancels the current
   * utterance and prevents looped playback from continuing.
   */
  const stopTts = () => {
    ttsLoopRef.current = false;
    window.speechSynthesis.cancel();
  };

  /* ---------------------------------------------------------------------- */
  /* Study mode (flip cards)                                                */
  /* ---------------------------------------------------------------------- */
  // Index of the card currently shown in study mode.
  const [studyIndex, setStudyIndex] = useState(0);
  // Whether the answer side of the card is currently visible.
  const [showAnswer, setShowAnswer] = useState(false);

  /**
   * Reset study state whenever the card list changes. This ensures the
   * study session always starts with the first card and hides the answer.
   */
  useEffect(() => {
    setStudyIndex(0);
    setShowAnswer(false);
  }, [cards]);

  /**
   * Move to the next card in study mode. Wraps around to the beginning
   * when reaching the end of the deck.
   */
  const nextStudyCard = () => {
    if (cards.length === 0) return;
    setStudyIndex((idx) => (idx + 1) % cards.length);
    setShowAnswer(false);
  };

  /**
   * Move to the previous card in study mode. Wraps around to the end
   * when reaching the beginning of the deck.
   */
  const prevStudyCard = () => {
    if (cards.length === 0) return;
    setStudyIndex((idx) => (idx - 1 + cards.length) % cards.length);
    setShowAnswer(false);
  };

  /* ---------------------------------------------------------------------- */
  /* Quiz mode (multiple choice)                                           */
  /* ---------------------------------------------------------------------- */
  // Index of the current question in quiz mode.
  const [quizIndex, setQuizIndex] = useState(0);
  // The user's current answer selection in quiz mode.
  const [selectedOption, setSelectedOption] = useState(null);
  // The user's cumulative score in quiz mode.
  const [quizScore, setQuizScore] = useState(0);
  // Whether the user has completed the current quiz session.
  const [quizComplete, setQuizComplete] = useState(false);

  /**
   * Reset quiz state whenever the card list changes or when the mode
   * switches to quiz. This ensures the quiz starts fresh each time.
   */
  useEffect(() => {
    if (mode === "quiz") {
      setQuizIndex(0);
      setSelectedOption(null);
      setQuizScore(0);
      setQuizComplete(false);
    }
  }, [cards, mode]);

  /**
   * Handle selecting an answer during the quiz. Immediately evaluates
   * correctness, updates score, and schedules the next question (or
   * finishes the quiz if the end is reached).
   *
   * @param {string} option The answer option chosen by the user.
   */
  const handleSelectQuizOption = (option) => {
    if (quizComplete) return;
    setSelectedOption(option);
    const correctAnswer = cards[quizIndex]?.answer;
    if (option === correctAnswer) {
      setQuizScore((score) => score + 1);
    }
    // Brief pause before advancing to next question.
    setTimeout(() => {
      if (quizIndex + 1 < cards.length) {
        setQuizIndex((idx) => idx + 1);
        setSelectedOption(null);
      } else {
        setQuizComplete(true);
      }
    }, 500);
  };

  /* ---------------------------------------------------------------------- */
  /* Matching mode (pair terms with definitions)                            */
  /* ---------------------------------------------------------------------- */
  // Data structure for matching: arrays of term objects and definition objects.
  const [matchTerms, setMatchTerms] = useState([]);
  const [matchDefs, setMatchDefs] = useState([]);
  // Track which indices have been successfully matched.
  const [matchedPairs, setMatchedPairs] = useState([]);
  // Currently selected term and definition indices.
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);

  /**
   * Whenever cards change or mode switches to matching, prepare a new
   * shuffled set of terms and definitions. This ensures a fresh layout
   * for each matching session.
   */
  useEffect(() => {
    if (mode !== "match") return;
    const terms = cards.map((card, idx) => ({ idx, text: card.question }));
    const defs = cards.map((card, idx) => ({ idx, text: card.answer }));
    setMatchTerms(shuffleArray(terms));
    setMatchDefs(shuffleArray(defs));
    setMatchedPairs([]);
    setSelectedTerm(null);
    setSelectedDef(null);
  }, [cards, mode]);

  /**
   * When both a term and a definition are selected, evaluate whether
   * they correspond to the same card index. If correct, record the
   * match; otherwise clear selections. Selections are cleared in both
   * cases to allow the user to continue matching.
   */
  useEffect(() => {
    if (selectedTerm !== null && selectedDef !== null) {
      if (selectedTerm === selectedDef) {
        setMatchedPairs((prev) => [...prev, selectedTerm]);
      }
      // Reset selections regardless of match result.
      setSelectedTerm(null);
      setSelectedDef(null);
    }
  }, [selectedTerm, selectedDef]);

  /**
   * Determine whether a given index has already been matched. Used to
   * disable or visually differentiate matched items in the UI.
   *
   * @param {number} idx The original card index to check.
   * @returns {boolean} True if the index has already been matched.
   */
  const isMatched = (idx) => matchedPairs.includes(idx);

  /* ---------------------------------------------------------------------- */
  /* Recall mode (type the answer)                                          */
  /* ---------------------------------------------------------------------- */
  // Index of the current card in recall mode.
  const [recallIndex, setRecallIndex] = useState(0);
  // The user's typed answer for the current recall question.
  const [recallInput, setRecallInput] = useState("");
  // The number of correct answers given in the recall session.
  const [recallScore, setRecallScore] = useState(0);
  // Whether the user has completed the recall session.
  const [recallComplete, setRecallComplete] = useState(false);
  // Whether feedback (correct/incorrect) should be shown for the current
  // recall prompt. This is toggled briefly after submitting an answer.
  const [showRecallFeedback, setShowRecallFeedback] = useState(false);

  /**
   * Reset recall state whenever cards change or when entering recall mode.
   */
  useEffect(() => {
    if (mode === "recall") {
      setRecallIndex(0);
      setRecallInput("");
      setRecallScore(0);
      setRecallComplete(false);
      setShowRecallFeedback(false);
    }
  }, [cards, mode]);

  /**
   * Submit the user's answer in recall mode and provide immediate
   * feedback. Advances to the next card after a short delay. When the
   * end of the deck is reached, marks the recall session as complete.
   */
  const handleRecallSubmit = () => {
    if (recallComplete) return;
    const correct = cards[recallIndex]?.answer?.trim().toLowerCase() || "";
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
      } else {
        setRecallComplete(true);
      }
    }, 700);
  };

  /* ---------------------------------------------------------------------- */
  /* Memory Flip mode (concentration)                                       */
  /* ---------------------------------------------------------------------- */
  // In memory mode each card yields two tiles: one for the question and
  // one for the answer. The user flips two tiles at a time and tries
  // to find matching pairs. A pair is matched when the question and
  // answer belonging to the same card are revealed together. When all
  // pairs are matched, the game is complete.
  const [memoryItems, setMemoryItems] = useState([]);
  const [memorySelected, setMemorySelected] = useState([]);
  const [memoryMatched, setMemoryMatched] = useState([]);

  useEffect(() => {
    if (mode === "memory") {
      const items = [];
      cards.forEach((card, idx) => {
        items.push({ id: idx, type: "question", text: card.question });
        items.push({ id: idx, type: "answer", text: card.answer });
      });
      setMemoryItems(shuffleArray(items));
      setMemorySelected([]);
      setMemoryMatched([]);
    }
  }, [cards, mode]);

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
      setMemorySelected([firstIndex, index]);
      setTimeout(() => {
        if (isMatch) {
          setMemoryMatched((prev) => [...prev, first.id]);
        }
        setMemorySelected([]);
      }, 600);
    }
  };

  const renderMemoryMode = () => {
    if (cards.length === 0) {
      return <p>No cards available for memory game.</p>;
    }
    const allMatched = memoryMatched.length === cards.length;
    if (allMatched) {
      return (
        <div style={{ textAlign: "center" }}>
          <h3>All pairs found!</h3>
          <button
            onClick={() => {
              const items = [];
              cards.forEach((card, idx) => {
                items.push({ id: idx, type: "question", text: card.question });
                items.push({ id: idx, type: "answer", text: card.answer });
              });
              setMemoryItems(shuffleArray(items));
              setMemoryMatched([]);
              setMemorySelected([]);
            }}
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
            Play Again
          </button>
        </div>
      );
    }
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(auto-fill, minmax(100px, 1fr))"
            : "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "0.5rem",
        }}
      >
        {memoryItems.map((item, idx) => {
          const matched = memoryMatched.includes(item.id);
          const selected = memorySelected.includes(idx);
          const disabled = matched || memorySelected.length === 2;
          return (
            <div
              key={idx}
              onClick={() => !disabled && handleMemorySelect(idx)}
              style={{
                padding: "1rem",
                minHeight: "80px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: matched
                  ? COLORS.matchedBg
                  : selected
                  ? COLORS.selectedBg
                  : COLORS.buttonBg,
                color: COLORS.text,
                cursor: disabled ? "default" : "pointer",
                userSelect: "none",
                wordWrap: "break-word",
              }}
            >
              {matched || selected ? (
                <span>{item.text}</span>
              ) : (
                <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>?</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ---------------------------------------------------------------------- */
  /* Survival mode (multiple choice with limited lives)                      */
  /* ---------------------------------------------------------------------- */
  const [survivalOrder, setSurvivalOrder] = useState([]);
  const [survivalIndex, setSurvivalIndex] = useState(0);
  const [survivalLives, setSurvivalLives] = useState(3);
  const [survivalScore, setSurvivalScore] = useState(0);
  const [survivalSelected, setSurvivalSelected] = useState(null);
  const [survivalComplete, setSurvivalComplete] = useState(false);

  useEffect(() => {
    if (mode === "survival") {
      const order = shuffleArray(cards.map((_, i) => i));
      setSurvivalOrder(order);
      setSurvivalIndex(0);
      setSurvivalLives(3);
      setSurvivalScore(0);
      setSurvivalSelected(null);
      setSurvivalComplete(false);
    }
  }, [cards, mode]);

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

  const renderSurvivalMode = () => {
    // If there are no cards at all, there's nothing to play
    if (cards.length === 0) {
      return <p>No cards available for survival mode.</p>;
    }

    // If the game has been completed (e.g. player ran out of lives or finished all questions), show summary
    // We check this early before referencing survivalOrder to avoid reading undefined indices
    if (survivalComplete || survivalIndex >= survivalOrder.length || survivalLives <= 0) {
      return (
        <div style={{ textAlign: "center" }}>
          <h3>Game Over</h3>
          <p>
            You answered {survivalScore} out of {survivalOrder.length} correctly.
          </p>
          <button
            onClick={() => {
              // Start a new game by shuffling the order and resetting state
              const order = shuffleArray(cards.map((_, i) => i));
              setSurvivalOrder(order);
              setSurvivalIndex(0);
              setSurvivalLives(3);
              setSurvivalScore(0);
              setSurvivalSelected(null);
              setSurvivalComplete(false);
            }}
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
            Play Again
          </button>
        </div>
      );
    }

    // Guard against empty order or invalid card indices
    if (!survivalOrder.length) {
      return <p>No cards available for survival mode.</p>;
    }

    const cardIdx = survivalOrder[survivalIndex];
    // If for some reason cardIdx is undefined or the card does not exist, display a fallback
    if (typeof cardIdx !== "number" || !cards[cardIdx]) {
      return <p>No cards available for survival mode.</p>;
    }

    const options = generateQuizOptions(cards, cardIdx);
    return (
      <div>
        {/* Header with lives, progress and score */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <span>Lives: {"❤️".repeat(survivalLives)}</span>
          <span>
            Question {survivalIndex + 1} of {survivalOrder.length}
          </span>
          <span>Score: {survivalScore}</span>
        </div>
        {/* Current question */}
        <p style={{ marginBottom: "0.5rem" }}>{cards[cardIdx].question}</p>
        {/* Answer options */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {options.map((option) => {
            const isSelected = survivalSelected === option;
            const isCorrect = option === cards[cardIdx].answer;
            const backgroundColor = isSelected
              ? isCorrect
                ? COLORS.correctBg
                : COLORS.incorrectBg
              : COLORS.buttonBg;
            const borderColor = isSelected ? COLORS.primary : COLORS.border;
            return (
              <button
                key={option}
                onClick={() => handleSelectSurvivalOption(option)}
                disabled={survivalSelected !== null}
                style={{
                  padding: "0.5rem",
                  backgroundColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  cursor: survivalSelected ? "default" : "pointer",
                  textAlign: "left",
                  color: COLORS.text,
                  width: isMobile ? "100%" : "auto",
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------------------------- */
  /* Render helpers                                                         */
  /* ---------------------------------------------------------------------- */

  /**
   * Render the navigation bar that allows switching between modes.
   */
  const renderNavigation = () => {
    // Use a column layout for small screens so buttons don't cram into a single row
    const navContainerStyle = {
      marginBottom: "1rem",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "0.5rem",
      // allow wrapping when in row layout to prevent overflow on narrow screens
      flexWrap: isMobile ? "nowrap" : "wrap",
    };
    return (
      <div style={navContainerStyle}>
        {[
          { key: "study", label: "Study" },
          { key: "quiz", label: "Quiz" },
          { key: "match", label: "Matching" },
          { key: "recall", label: "Recall" },
          { key: "memory", label: "Memory Flip" },
          { key: "survival", label: "Survival" },
          { key: "table", label: "Table" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: isMobile ? "0.5rem" : "0.5rem 1rem",
              border:
                key === mode
                  ? `2px solid ${COLORS.primary}`
                  : `1px solid ${COLORS.border}`,
              backgroundColor:
                key === mode ? COLORS.buttonBgActive : COLORS.buttonBg,
              borderRadius: "4px",
              cursor: "pointer",
              color: COLORS.text,
              width: isMobile ? "100%" : "auto",
              textAlign: "center",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    );
  };

  /**
   * Render the controls for uploading, generating and downloading cards,
   * plus copying and pasting JSON via the clipboard.
   */
  const renderControls = () => {
    // Responsive container for all control elements
    const containerStyle = {
      marginBottom: "1rem",
      color: COLORS.text,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    };
    // Style for the first row of actions (file upload and JSON buttons)
    const fileActionsStyle = {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      gap: "0.5rem",
      flexWrap: isMobile ? "nowrap" : "wrap",
    };
    // Style for the second row containing the topic input and generate button
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
          <button onClick={()=> setCards([])} style={{
              padding: "0.5rem 1rem",
              backgroundColor: COLORS.buttonBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              color: COLORS.text,
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
            }}>
            Clear Cards
          </button>
        </div>
        <div style={topicRowStyle}>
          <label style={{ display: "flex", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
            Topic:
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  e.preventDefault();
                  handleGenerateFromPrompt();
                }
              }}
              placeholder="Enter topic for vocabulary flash cards"
              style={{
                marginLeft: isMobile ? "0" : "0.5rem",
                flex: isMobile ? "none" : 1,
                width: isMobile ? "100%" : "60%",
                padding: "0.5rem",
                backgroundColor: COLORS.buttonBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "4px",
                color: COLORS.text,
              }}
            />
          </label>
          <button
            onClick={handleGenerateFromPrompt}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: COLORS.buttonBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              color: COLORS.text,
              cursor: loading ? "default" : "pointer",
              width: isMobile ? "100%" : "auto",
            }}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
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

  /**
   * Render the controls for text-to-speech. Provides buttons to read the
   * current card, to loop through all cards, and to stop any ongoing
   * narration. These controls operate across modes and depend on the
   * contents of the current deck.
   */
  const renderTtsControls = () => (
    <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <button
        onClick={readCurrentCard}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: COLORS.buttonBg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "4px",
          color: COLORS.text,
          cursor: cards.length === 0 ? "default" : "pointer",
        }}
        disabled={cards.length === 0}
      >
        Read Current Card
      </button>
      <button
        onClick={readAllCards}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: COLORS.buttonBg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "4px",
          color: COLORS.text,
          cursor: cards.length === 0 ? "default" : "pointer",
        }}
        disabled={cards.length === 0}
      >
        Loop All Cards
      </button>
      <button
        onClick={stopTts}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: COLORS.buttonBg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "4px",
          color: COLORS.text,
          cursor: "pointer",
        }}
      >
        Stop TTS
      </button>
    </div>
  );

  /**
   * Render the study mode UI. Allows flipping the current card and
   * navigating forwards/backwards through the deck.
   */
  const renderStudyMode = () => {
    if (cards.length === 0) return <p>No cards loaded.</p>;
    const card = cards[studyIndex];
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            border: `1px solid ${COLORS.border}`,
            padding: "1rem",
            borderRadius: "8px",
            minHeight: "120px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: COLORS.background,
            color: COLORS.text,
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>
            Card {studyIndex + 1} of {cards.length}
          </h3>
          <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>
            {showAnswer ? card.answer : card.question}
          </p>
        </div>
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          <button
            onClick={prevStudyCard}
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
            Previous
          </button>
          <button
            onClick={() => setShowAnswer((v) => !v)}
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
            {showAnswer ? "Show Question" : "Show Answer"}
          </button>
          <button
            onClick={nextStudyCard}
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
            Next
          </button>
        </div>
      </div>
    );
  };

  /**
   * Render the quiz mode UI. Presents one question at a time with
   * multiple choice answers, automatically advancing and tracking the
   * user's score.
   */
  const renderQuizMode = () => {
    if (cards.length === 0) return <p>No cards available for quiz.</p>;
    if (quizComplete) {
      return (
        <div style={{ textAlign: "center" }}>
          <h3>Quiz Complete!</h3>
          <p>
            You scored {quizScore} out of {cards.length}.
          </p>
          <button
            onClick={() => {
              setQuizIndex(0);
              setQuizScore(0);
              setQuizComplete(false);
              setSelectedOption(null);
            }}
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
            Restart Quiz
          </button>
        </div>
      );
    }
    const options = generateQuizOptions(cards, quizIndex);
    return (
      <div>
        <h3>
          Question {quizIndex + 1} of {cards.length}
        </h3>
        <p style={{ marginBottom: "0.5rem" }}>{cards[quizIndex].question}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === cards[quizIndex].answer;
            const backgroundColor = isSelected
              ? isCorrect
                ? COLORS.correctBg
                : COLORS.incorrectBg
              : COLORS.buttonBg;
            const borderColor = isSelected ? COLORS.primary : COLORS.border;
            return (
              <button
                key={option}
                onClick={() => handleSelectQuizOption(option)}
                disabled={!!selectedOption}
                style={{
                  padding: "0.5rem",
                  backgroundColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "4px",
                  cursor: selectedOption ? "default" : "pointer",
                  textAlign: "left",
                  color: COLORS.text,
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
        <p style={{ marginTop: "1rem" }}>Score: {quizScore}</p>
      </div>
    );
  };

  /**
   * Render the matching mode UI. Displays two columns of terms and
   * definitions. Users click one term and one definition to form a
   * pair; matched items are removed or greyed out. Completion is
   * announced when all pairs are matched.
   */
  const renderMatchMode = () => {
    if (cards.length === 0) return <p>No cards available for matching.</p>;
    const allMatched = matchedPairs.length === cards.length;
    return (
      <div>
        {allMatched ? (
          <div style={{ textAlign: "center" }}>
            <h3>All matches complete!</h3>
            <button
              onClick={() => {
                // Reset matching state to play again
                const terms = cards.map((card, idx) => ({ idx, text: card.question }));
                const defs = cards.map((card, idx) => ({ idx, text: card.answer }));
                setMatchTerms(shuffleArray(terms));
                setMatchDefs(shuffleArray(defs));
                setMatchedPairs([]);
                setSelectedTerm(null);
                setSelectedDef(null);
              }}
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
              Play Again
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "1rem" : "2rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <h4 style={{ color: COLORS.text }}>Terms</h4>
              {matchTerms.map(({ idx, text }) => {
                const matched = isMatched(idx);
                const selected = selectedTerm === idx;
                return (
                  <div
                    key={"term-" + idx}
                    onClick={() => {
                      if (matched) return;
                      setSelectedTerm(idx);
                    }}
                    style={{
                      padding: "0.5rem",
                      marginBottom: "0.25rem",
                      border: matched
                        ? `1px solid ${COLORS.border}`
                        : selected
                        ? `2px solid ${COLORS.primary}`
                        : `1px solid ${COLORS.border}`,
                      backgroundColor: matched
                        ? COLORS.matchedBg
                        : selected
                        ? COLORS.selectedBg
                        : COLORS.buttonBg,
                      borderRadius: "4px",
                      cursor: matched ? "default" : "pointer",
                      color: COLORS.text,
                      display: "inline-block",
                      width: "auto",
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {text}
                  </div>
                );
              })}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: COLORS.text }}>Definitions</h4>
              {matchDefs.map(({ idx, text }) => {
                const matched = isMatched(idx);
                const selected = selectedDef === idx;
                return (
                  <div
                    key={"def-" + idx}
                    onClick={() => {
                      if (matched) return;
                      setSelectedDef(idx);
                    }}
                    style={{
                      padding: "0.5rem",
                      marginBottom: "0.25rem",
                      border: matched
                        ? `1px solid ${COLORS.border}`
                        : selected
                        ? `2px solid ${COLORS.primary}`
                        : `1px solid ${COLORS.border}`,
                      backgroundColor: matched
                        ? COLORS.matchedBg
                        : selected
                        ? COLORS.selectedBg
                        : COLORS.buttonBg,
                      borderRadius: "4px",
                      cursor: matched ? "default" : "pointer",
                      color: COLORS.text,
                      display: "inline-block",
                      width: "auto",
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {text}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render the recall mode UI. Prompts the user with questions and
   * accepts free‑form answers, providing immediate feedback and a
   * running score. When completed, displays final performance.
   */
  const renderRecallMode = () => {
    if (cards.length === 0) return <p>No cards available for recall.</p>;
    if (recallComplete) {
      return (
        <div style={{ textAlign: "center" }}>
          <h3>Recall Complete!</h3>
          <p>
            You answered {recallScore} out of {cards.length} correctly.
          </p>
          <button
            onClick={() => {
              setRecallIndex(0);
              setRecallScore(0);
              setRecallInput("");
              setRecallComplete(false);
            }}
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
            Restart Recall
          </button>
        </div>
      );
    }
    const card = cards[recallIndex];
    const correct = card.answer?.trim().toLowerCase() || "";
    const user = recallInput.trim().toLowerCase();
    const isCorrect = user && user === correct;
    return (
      <div>
        <h3>
          Question {recallIndex + 1} of {cards.length}
        </h3>
        <p style={{ marginBottom: "0.5rem" }}>{card.question}</p>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "0.5rem",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          <input
            type="text"
            value={recallInput}
            onChange={(e) => setRecallInput(e.target.value)}
            placeholder="Type your answer"
            style={{
              flex: isMobile ? "none" : 1,
              width: isMobile ? "100%" : "auto",
              padding: "0.5rem",
              backgroundColor: COLORS.buttonBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              color: COLORS.text,
            }}
          />
          <button
            onClick={handleRecallSubmit}
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
            Submit
          </button>
        </div>
        <p style={{ marginTop: "0.5rem" }}>Score: {recallScore}</p>
        {showRecallFeedback && (
          <p style={{ color: isCorrect ? "#16a34a" : "#dc2626" }}>
            {isCorrect ? "Correct!" : `Incorrect. The answer was: ${card.answer}`}
          </p>
        )}
      </div>
    );
  };

  /**
   * Choose which feature to display based on the current mode.
   */
  const renderCurrentMode = () => {
    switch (mode) {
      case "study":
        return renderStudyMode();
      case "quiz":
        return renderQuizMode();
      case "match":
        return renderMatchMode();
      case "recall":
        return renderRecallMode();
      case "memory":
        return renderMemoryMode();
      case "survival":
        return renderSurvivalMode();
      case "table":
        return <FlashCardTable cards={cards} COLORS={COLORS}/>;
      default:
        return <div>Select a mode to begin.</div>;
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "1rem",
        color: COLORS.text,
        backgroundColor: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
      }}
    >
      <h2 style={{ marginBottom: "1rem", color: COLORS.text }}>
        Flash Card Study Tool
      </h2>
      {renderControls()}
      {renderNavigation()}
      {renderTtsControls()}
      {renderCurrentMode()}
    </div>
  );
}