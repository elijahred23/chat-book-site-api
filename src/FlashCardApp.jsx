import React, { useState, useEffect, useRef } from "react";
import { getGeminiResponse } from "./utils/callGemini.js";
import FlashCardTable from "./FlashCardTable.jsx";

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
  background: "#f5f5f5",
  buttonBg: "#f3f4f6",
  buttonBgActive: "#e5e7eb",
  correctBg: "#d1fae5",
  incorrectBg: "#fee2e2",
  matchedBg: "#e5e7eb",
  selectedBg: "#e0f2fe",
};

function StudyMode({
  cards,
  studyIndex,
  showAnswer,
  onPrev,
  onNext,
  onToggleAnswer,
  COLORS,
  isMobile,
}) {
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
          onClick={onPrev}
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
          onClick={onToggleAnswer}
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
          onClick={onNext}
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
}

function QuizMode({
  cards,
  quizIndex,
  quizComplete,
  quizScore,
  selectedOption,
  onSelectOption,
  onRestart,
  COLORS,
  isMobile,
}) {
  if (cards.length === 0) return <p>No cards available for quiz.</p>;
  if (quizComplete) {
    return (
      <div style={{ textAlign: "center" }}>
        <h3>Quiz Complete!</h3>
        <p>
          You scored {quizScore} out of {cards.length}.
        </p>
        <button
          onClick={onRestart}
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
              onClick={() => onSelectOption(option)}
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
}

function MatchMode({
  cards,
  matchTerms,
  matchDefs,
  matchedPairs,
  selectedTerm,
  selectedDef,
  onSelectTerm,
  onSelectDef,
  onReset,
  COLORS,
  isMobile,
}) {
  if (cards.length === 0) return <p>No cards available for matching.</p>;
  const allMatched = matchedPairs.length === cards.length;
  return (
    <div>
      {allMatched ? (
        <div style={{ textAlign: "center" }}>
          <h3>All matches complete!</h3>
          <button
            onClick={onReset}
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
              const matched = matchedPairs.includes(idx);
              const selected = selectedTerm === idx;
              return (
                <div
                  key={"term-" + idx}
                  onClick={() => {
                    if (matched) return;
                    onSelectTerm(idx);
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
              const matched = matchedPairs.includes(idx);
              const selected = selectedDef === idx;
              return (
                <div
                  key={"def-" + idx}
                  onClick={() => {
                    if (matched) return;
                    onSelectDef(idx);
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
}

function RecallMode({
  cards,
  recallIndex,
  recallInput,
  recallScore,
  recallComplete,
  showRecallFeedback,
  onInputChange,
  onSubmit,
  onRestart,
  COLORS,
  isMobile,
}) {
  if (cards.length === 0) return <p>No cards available for recall.</p>;
  if (recallComplete) {
    return (
      <div style={{ textAlign: "center" }}>
        <h3>Recall Complete!</h3>
        <p>
          You answered {recallScore} out of {cards.length} correctly.
        </p>
        <button
          onClick={onRestart}
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
          onChange={(e) => onInputChange(e.target.value)}
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
          onClick={onSubmit}
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
}

function MemoryMode({
  cards,
  memoryItems,
  memorySelected,
  memoryMatched,
  onSelect,
  onReset,
  COLORS,
  isMobile,
}) {
  if (cards.length === 0) {
    return <p>No cards available for memory game.</p>;
  }
  const allMatched = memoryMatched.length === cards.length;
  if (allMatched) {
    return (
      <div style={{ textAlign: "center" }}>
        <h3>All pairs found!</h3>
        <button
          onClick={onReset}
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
            onClick={() => !disabled && onSelect(idx)}
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
}

function SurvivalMode({
  cards,
  survivalOrder,
  survivalIndex,
  survivalLives,
  survivalScore,
  survivalSelected,
  survivalComplete,
  onSelectOption,
  onRestart,
  COLORS,
  isMobile,
}) {
  if (cards.length === 0) {
    return <p>No cards available for survival mode.</p>;
  }
  if (survivalComplete || survivalIndex >= survivalOrder.length || survivalLives <= 0) {
    return (
      <div style={{ textAlign: "center" }}>
        <h3>Game Over</h3>
        <p>
          You answered {survivalScore} out of {survivalOrder.length} correctly.
        </p>
        <button
          onClick={onRestart}
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
  if (!survivalOrder.length) {
    return <p>No cards available for survival mode.</p>;
  }
  const cardIdx = survivalOrder[survivalIndex];
  if (typeof cardIdx !== "number" || !cards[cardIdx]) {
    return <p>No cards available for survival mode.</p>;
  }
  const options = generateQuizOptions(cards, cardIdx);
  return (
    <div>
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
      <p style={{ marginBottom: "0.5rem" }}>{cards[cardIdx].question}</p>
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
              onClick={() => onSelectOption(option)}
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
}

function CurrentModeView({
  mode,
  cards,
  COLORS,
  isMobile,
  studyIndex,
  showAnswer,
  onPrevStudy,
  onNextStudy,
  onToggleAnswer,
  quizIndex,
  quizComplete,
  quizScore,
  selectedOption,
  onSelectQuizOption,
  onRestartQuiz,
  matchTerms,
  matchDefs,
  matchedPairs,
  selectedTerm,
  selectedDef,
  onSelectTerm,
  onSelectDef,
  onResetMatch,
  recallIndex,
  recallInput,
  recallScore,
  recallComplete,
  showRecallFeedback,
  onChangeRecallInput,
  onSubmitRecall,
  onRestartRecall,
  memoryItems,
  memorySelected,
  memoryMatched,
  onSelectMemory,
  onResetMemory,
  survivalOrder,
  survivalIndex,
  survivalLives,
  survivalScore,
  survivalSelected,
  survivalComplete,
  onSelectSurvivalOption,
  onRestartSurvival,
}) {
  switch (mode) {
    case "study":
      return (
        <StudyMode
          cards={cards}
          studyIndex={studyIndex}
          showAnswer={showAnswer}
          onPrev={onPrevStudy}
          onNext={onNextStudy}
          onToggleAnswer={onToggleAnswer}
          COLORS={COLORS}
          isMobile={isMobile}
        />
      );
    case "quiz":
      return (
        <QuizMode
          cards={cards}
          quizIndex={quizIndex}
          quizComplete={quizComplete}
          quizScore={quizScore}
          selectedOption={selectedOption}
          onSelectOption={onSelectQuizOption}
          onRestart={onRestartQuiz}
          COLORS={COLORS}
          isMobile={isMobile}
        />
      );
    case "match":
      return (
        <MatchMode
          cards={cards}
          matchTerms={matchTerms}
          matchDefs={matchDefs}
          matchedPairs={matchedPairs}
          selectedTerm={selectedTerm}
          selectedDef={selectedDef}
          onSelectTerm={onSelectTerm}
          onSelectDef={onSelectDef}
          onReset={onResetMatch}
          COLORS={COLORS}
          isMobile={isMobile}
        />
      );
    case "recall":
      return (
        <RecallMode
          cards={cards}
          recallIndex={recallIndex}
          recallInput={recallInput}
          recallScore={recallScore}
          recallComplete={recallComplete}
          showRecallFeedback={showRecallFeedback}
          onInputChange={onChangeRecallInput}
          onSubmit={onSubmitRecall}
          onRestart={onRestartRecall}
          COLORS={COLORS}
          isMobile={isMobile}
        />
      );
    case "memory":
      return (
        <MemoryMode
          cards={cards}
          memoryItems={memoryItems}
          memorySelected={memorySelected}
          memoryMatched={memoryMatched}
          onSelect={onSelectMemory}
          onReset={onResetMemory}
          COLORS={COLORS}
          isMobile={isMobile}
        />
      );
    case "survival":
      return (
        <SurvivalMode
          cards={cards}
          survivalOrder={survivalOrder}
          survivalIndex={survivalIndex}
          survivalLives={survivalLives}
          survivalScore={survivalScore}
          survivalSelected={survivalSelected}
          survivalComplete={survivalComplete}
          onSelectOption={onSelectSurvivalOption}
          onRestart={onRestartSurvival}
          COLORS={COLORS}
          isMobile={isMobile}
        />
      );
    case "table":
      return <FlashCardTable cards={cards} COLORS={COLORS} />;
    default:
      return <div>Select a mode to begin.</div>;
  }
}

export default function FlashCardApp() {
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

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("table");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
      await navigator.clipboard.writeText(jsonString);
      setError(null);
    } catch (err) {
      setError("Failed to copy to clipboard: " + err.message);
    }
  };

  const handlePasteJson = async () => {
    try {
      const text = await navigator.clipboard.readText();
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
    if (mode === "quiz") {
      setQuizIndex(0);
      setSelectedOption(null);
      setQuizScore(0);
      setQuizComplete(false);
    }
  }, [cards, mode]);

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
    if (mode !== "match") return;
    resetMatch();
  }, [cards, mode]);

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

  const restartRecall = () => {
    setRecallIndex(0);
    setRecallInput("");
    setRecallScore(0);
    setRecallComplete(false);
    setShowRecallFeedback(false);
  };

  useEffect(() => {
    if (mode === "recall") {
      restartRecall();
    }
  }, [cards, mode]);

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

  const [memoryItems, setMemoryItems] = useState([]);
  const [memorySelected, setMemorySelected] = useState([]);
  const [memoryMatched, setMemoryMatched] = useState([]);

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
  };

  useEffect(() => {
    if (mode === "memory") {
      resetMemoryGame();
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

  const [survivalOrder, setSurvivalOrder] = useState([]);
  const [survivalIndex, setSurvivalIndex] = useState(0);
  const [survivalLives, setSurvivalLives] = useState(3);
  const [survivalScore, setSurvivalScore] = useState(0);
  const [survivalSelected, setSurvivalSelected] = useState(null);
  const [survivalComplete, setSurvivalComplete] = useState(false);

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
    if (mode === "survival") {
      resetSurvival();
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

  const renderNavigation = () => {
    const navContainerStyle = {
      marginBottom: "1rem",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "0.5rem",
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

  const renderControls = () => {
    const containerStyle = {
      marginBottom: "1rem",
      color: COLORS.text,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
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
          <button
            onClick={() => setPrompt("")}
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
            Clear Prompt
          </button>
          <button
            onClick={() => {
              navigator.clipboard.readText().then((text) => setPrompt(text));
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
            Paste Topic
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
        onChangeRecallInput={setRecallInput}
        onSubmitRecall={handleRecallSubmit}
        onRestartRecall={restartRecall}
        memoryItems={memoryItems}
        memorySelected={memorySelected}
        memoryMatched={memoryMatched}
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
      />
    </div>
  );
}
