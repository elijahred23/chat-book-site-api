import React from "react";
import FlashCardTable from "../FlashCardTable.jsx";

function StudyMode({ cards, studyIndex, showAnswer, onPrev, onNext, onToggleAnswer, COLORS, isMobile }) {
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

function QuizMode({ cards, quizIndex, quizComplete, quizScore, selectedOption, onSelectOption, onRestart, generateQuizOptions, COLORS, isMobile }) {
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
          const backgroundColor = isSelected ? (isCorrect ? COLORS.correctBg : COLORS.incorrectBg) : COLORS.buttonBg;
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

function MatchMode({ cards, matchTerms, matchDefs, matchedPairs, selectedTerm, selectedDef, onSelectTerm, onSelectDef, onReset, COLORS, isMobile }) {
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
                    border: matched ? `1px solid ${COLORS.border}` : selected ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                    backgroundColor: matched ? COLORS.matchedBg : selected ? COLORS.selectedBg : COLORS.buttonBg,
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
                    border: matched ? `1px solid ${COLORS.border}` : selected ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                    backgroundColor: matched ? COLORS.matchedBg : selected ? COLORS.selectedBg : COLORS.buttonBg,
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
  recallHintLevel,
  onInputChange,
  onSubmit,
  onRestart,
  onHint,
  onSkip,
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
  const correct = card.question?.trim().toLowerCase() || "";
  const user = recallInput.trim().toLowerCase();
  const isCorrect = user && user === correct;
  const hint =
    recallHintLevel > 0
      ? (card.question || "")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, recallHintLevel)
          .join(" ")
      : "";
  return (
    <div>
      <h3>
        Question {recallIndex + 1} of {cards.length}
      </h3>
      <p style={{ marginBottom: "0.5rem" }}>Answer: {card.answer}</p>
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
          placeholder="Type the matching question"
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
      <button
        onClick={onHint}
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
        Hint
      </button>
      <button
        onClick={onSkip}
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
        Skip
      </button>
      </div>
      {hint && (
        <div style={{ marginTop: "0.35rem", color: COLORS.primary }}>
          Hint: {hint}
          {(card.question || "").split(/\s+/).filter(Boolean).length > recallHintLevel ? " ..." : ""}
        </div>
      )}
      <p style={{ marginTop: "0.5rem" }}>Score: {recallScore}</p>
      {showRecallFeedback && <p style={{ color: isCorrect ? "#16a34a" : "#dc2626" }}>{isCorrect ? "Correct!" : `Incorrect. The question was: ${card.question}`}</p>}
    </div>
  );
}

function MemoryMode({
  cards,
  memoryItems,
  memorySelected,
  memoryMatched,
  memoryMoves,
  memoryStreak,
  memoryBestStreak,
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
      <div style={{ marginTop: "0.5rem", color: COLORS.text, fontSize: "0.9rem" }}>
        Moves: {memoryMoves} | Best Combo: {memoryBestStreak}
      </div>
    </div>
  );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <span>Matches: {memoryMatched.length} / {cards.length}</span>
          <span>Moves: {memoryMoves}</span>
          <span>Combo: {memoryStreak}</span>
          <span>Best: {memoryBestStreak}</span>
        </div>
        <button
          onClick={onReset}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: COLORS.buttonBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px",
            color: COLORS.text,
            cursor: "pointer",
            width: isMobile ? "100%" : "auto",
          }}
        >
          Shuffle & Restart
        </button>
      </div>
      {memoryStreak > 1 && (
        <div style={{ color: COLORS.primary, fontWeight: 600 }}>Combo x{memoryStreak}! Keep it going.</div>
      )}
      {memoryItems.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.9rem", color: COLORS.text }}>
          <span style={{ fontWeight: 600 }}>Hint palette:</span>
          <span>Columns = cool tones</span>
          <span>Rows = warm tones</span>
        </div>
      )}
      {(() => {
        const colCount = isMobile ? 3 : 4;
        const colPalette = ["#eef2ff", "#e0f2fe", "#ecfeff", "#f1f5f9"];
        const rowPalette = ["#fff7ed", "#fef9c3", "#fef2f2", "#f3e8ff"];
        return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(110px, 1fr))" : "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.6rem",
        }}
      >
        {memoryItems.map((item, idx) => {
          const matched = memoryMatched.includes(item.id);
          const selected = memorySelected.includes(idx);
          const disabled = matched || memorySelected.length === 2;
          const colIdx = colCount ? idx % colCount : 0;
          const rowIdx = colCount ? Math.floor(idx / colCount) : 0;
          const colColor = colPalette[colIdx % colPalette.length];
          const rowColor = rowPalette[rowIdx % rowPalette.length];
          const baseColor = matched
            ? "linear-gradient(135deg, #d1fae5, #a7f3d0)"
            : selected
            ? COLORS.selectedBg
            : `linear-gradient(135deg, ${colColor}, ${rowColor})`;
          return (
            <div
              key={idx}
              onClick={() => !disabled && onSelect(idx)}
              style={{
                padding: "1rem",
                minHeight: "90px",
                border: `2px solid ${selected ? COLORS.primary : COLORS.border}`,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: baseColor,
                color: COLORS.text,
                cursor: disabled ? "default" : "pointer",
                userSelect: "none",
                wordWrap: "break-word",
                boxShadow: matched ? "0 4px 10px rgba(0,0,0,0.12)" : "none",
                transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                transform: selected ? "scale(1.02)" : "scale(1)",
              }}
            >
              {matched || selected ? <span>{item.text}</span> : <span style={{ fontSize: "1.7rem", fontWeight: "bold" }}>?</span>}
            </div>
          );
        })}
      </div>
        );
      })()}
    </div>
  );
}

function SurvivalMode({ cards, survivalOrder, survivalIndex, survivalLives, survivalScore, survivalSelected, survivalComplete, onSelectOption, onRestart, generateQuizOptions, COLORS, isMobile }) {
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
          const backgroundColor = isSelected ? (isCorrect ? COLORS.correctBg : COLORS.incorrectBg) : COLORS.buttonBg;
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

function BlitzMode({
  cards,
  blitzOrder,
  blitzIndex,
  blitzScore,
  blitzStreak,
  blitzBestStreak,
  blitzTimeLeft,
  blitzSelected,
  blitzRunning,
  blitzComplete,
  onStart,
  onSelectOption,
  generateQuizOptions,
  COLORS,
  isMobile,
}) {
  if (!cards.length) return <p>No cards available for blitz mode.</p>;
  if (!blitzRunning && !blitzComplete) {
    return (
      <div style={{ textAlign: "center" }}>
        <h3>Blitz Mode</h3>
        <p style={{ marginBottom: "0.5rem" }}>Answer as many as you can before time runs out. Streaks boost your best run.</p>
        <button
          onClick={onStart}
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: COLORS.buttonBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px",
            color: COLORS.text,
            cursor: "pointer",
            width: isMobile ? "100%" : "auto",
          }}
        >
          Start Blitz
        </button>
      </div>
    );
  }
  if (!blitzOrder.length || typeof blitzOrder[blitzIndex] !== "number") {
    return <p>No cards available for blitz mode.</p>;
  }
  const cardIdx = blitzOrder[blitzIndex];
  const card = cards[cardIdx];
  const options = generateQuizOptions(cards, cardIdx);
  if (blitzComplete) {
    return (
      <div style={{ textAlign: "center" }}>
        <h3>Blitz Complete</h3>
        <p>Score: {blitzScore}</p>
        <p>Best streak: {blitzBestStreak}</p>
        <button
          onClick={onStart}
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: COLORS.buttonBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px",
            color: COLORS.text,
            cursor: "pointer",
            width: isMobile ? "100%" : "auto",
          }}
        >
          Restart Blitz
        </button>
      </div>
    );
  }
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.5rem",
        }}
      >
        <span>Time: {blitzTimeLeft}s</span>
        <span>Score: {blitzScore}</span>
        <span>Streak: {blitzStreak}</span>
        <span>Best: {blitzBestStreak}</span>
      </div>
      <p style={{ marginBottom: "0.5rem" }}>{card.question}</p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {options.map((option) => {
          const isSelected = blitzSelected === option;
          const isCorrect = option === card.answer;
          const backgroundColor = isSelected ? (isCorrect ? COLORS.correctBg : COLORS.incorrectBg) : COLORS.buttonBg;
          const borderColor = isSelected ? COLORS.primary : COLORS.border;
          return (
            <button
              key={option}
              onClick={() => onSelectOption(option)}
              disabled={!!blitzSelected}
              style={{
                padding: "0.5rem",
                backgroundColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "4px",
                cursor: blitzSelected ? "default" : "pointer",
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

export default function CurrentModeView({
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
  memoryMoves,
  memoryStreak,
  memoryBestStreak,
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
  onStartBlitz,
  onSelectBlitzOption,
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
          generateQuizOptions={generateQuizOptions}
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
          memoryMoves={memoryMoves}
          memoryStreak={memoryStreak}
          memoryBestStreak={memoryBestStreak}
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
          generateQuizOptions={generateQuizOptions}
          COLORS={COLORS}
          isMobile={isMobile}
        />
      );
    case "blitz":
      return (
        <BlitzMode
          cards={cards}
          blitzOrder={blitzOrder}
          blitzIndex={blitzIndex}
          blitzScore={blitzScore}
          blitzStreak={blitzStreak}
          blitzBestStreak={blitzBestStreak}
          blitzTimeLeft={blitzTimeLeft}
          blitzSelected={blitzSelected}
          blitzRunning={blitzRunning}
          blitzComplete={blitzComplete}
          onStart={onStartBlitz}
          onSelectOption={onSelectBlitzOption}
          generateQuizOptions={generateQuizOptions}
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
