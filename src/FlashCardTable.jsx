/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  FaAlignLeft,
  FaBookOpen,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaFeatherAlt,
  FaSearch,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import ActionButtons from "./ui/ActionButtons.jsx";
import { useAppState } from "./context/AppContext";
import { getGeminiResponse } from "./utils/callGemini.js";

const TRANSFORM_PRESETS = {
  expand3: "Rewrite this answer as roughly three concise sentences that cover the essentials.",
  expand5: "Expand this answer into roughly five concise sentences with key details and nuance.",
  expand10: "Expand this answer into roughly ten concise sentences with clear structure and detail.",
  expand15: "Expand this answer into roughly fifteen concise sentences, covering context, examples, and nuance.",
};

const TARGET_SENTENCES = { expand3: 3, expand5: 5, expand10: 10, expand15: 15 };

const EXPANSION_OPTIONS = [
  { key: "expand3", label: "3", title: "Rewrite as 3 sentences", icon: FaFeatherAlt },
  { key: "expand5", label: "5", title: "Rewrite as 5 sentences", icon: FaFeatherAlt },
  { key: "expand10", label: "10", title: "Rewrite as 10 sentences", icon: FaAlignLeft },
  { key: "expand15", label: "15", title: "Rewrite as 15 sentences", icon: FaBookOpen },
];

function ToolbarPortal({ children }) {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
}

function sentenceCount(text = "") {
  return (text.match(/[^.!?]+[.!?]+/g) || []).length || (text.trim() ? 1 : 0);
}

export default function FlashCardTable({ cards, setCards, COLORS }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [rowLoading, setRowLoading] = useState({});
  const [bulkLoading, setBulkLoading] = useState(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [bulkMode, setBulkMode] = useState("async");
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [query, setQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState({ question: "", answer: "" });
  const appState = useAppState();

  const anyDrawerOpen =
    Boolean(appState.drawerStack?.length) ||
    [
      "isChatOpen",
      "isTeleprompterOpen",
      "isTTSOpen",
      "isPlantUMLOpen",
      "isPodcastTTSOpen",
      "isJSGeneratorOpen",
      "isChatBookOpen",
      "isArchitectureOpen",
      "isYouTubeOpen",
      "isHtmlBuilderOpen",
      "isTypingOpen",
    ].some((key) => appState[key]);

  const visibleCards = useMemo(() => {
    const search = query.trim().toLowerCase();
    return cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) =>
        !search || `${card.question} ${card.answer}`.toLowerCase().includes(search)
      );
  }, [cards, query]);

  const selectedSet = useMemo(() => new Set(selectedCards), [selectedCards]);
  const selectedVisibleCount = visibleCards.filter(({ index }) => selectedSet.has(index)).length;
  const allVisibleSelected = visibleCards.length > 0 && selectedVisibleCount === visibleCards.length;
  const hasSelection = selectedCards.length > 0;
  const combinedPrompt = selectedCards
    .filter((index) => cards[index])
    .map((index) => `${cards[index].question} - ${cards[index].answer}`)
    .join("\n");

  const toggleCardSelection = (index) => {
    setSelectedCards((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
  };

  const toggleSelectVisible = () => {
    const visibleIndexes = visibleCards.map(({ index }) => index);
    setSelectedCards((current) => {
      if (allVisibleSelected) return current.filter((index) => !visibleIndexes.includes(index));
      return [...new Set([...current, ...visibleIndexes])];
    });
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setDraft({ question: cards[index].question, answer: cards[index].answer });
  };

  const saveEditing = () => {
    const question = draft.question.trim();
    const answer = draft.answer.trim();
    if (!question || !answer || editingIndex === null) return;
    setCards((current) =>
      current.map((card, index) =>
        index === editingIndex ? { ...card, question, answer } : card
      )
    );
    setEditingIndex(null);
  };

  const deleteSelected = () => {
    if (!selectedCards.length) return;
    const noun = selectedCards.length === 1 ? "card" : "cards";
    if (!window.confirm(`Delete ${selectedCards.length} selected ${noun}?`)) return;
    setCards((current) => current.filter((_, index) => !selectedSet.has(index)));
    setSelectedCards([]);
    setEditingIndex(null);
  };

  const transformOnce = async (card, instruction) => {
    const prompt = `${instruction}\n\nQuestion: ${card.question}\nCurrent answer: ${card.answer}\nReturn only the revised answer text.`;
    const response = await getGeminiResponse(prompt);
    return (response || "").trim();
  };

  const runTransform = async (index, presetKey) => {
    if (!cards[index] || !TRANSFORM_PRESETS[presetKey]) return;
    setRowLoading((current) => ({ ...current, [index]: presetKey }));
    try {
      const answer = await transformOnce(cards[index], TRANSFORM_PRESETS[presetKey]);
      if (answer) {
        setCards((current) =>
          current.map((card, cardIndex) =>
            cardIndex === index ? { ...card, answer } : card
          )
        );
      }
    } catch (error) {
      console.error("Transform failed", error);
    } finally {
      setRowLoading((current) => ({ ...current, [index]: false }));
    }
  };

  const applyAll = async (presetKey) => {
    const instruction = TRANSFORM_PRESETS[presetKey];
    if (!instruction || !cards.length) return;
    const target = TARGET_SENTENCES[presetKey];
    const eligible = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => sentenceCount(card.answer) < target);
    if (!eligible.length) return;

    setBulkLoading(presetKey);
    setBulkProgress({ done: 0, total: eligible.length });
    try {
      let successes = [];
      if (bulkMode === "sequential") {
        for (const { card, index } of eligible) {
          try {
            const answer = await transformOnce(card, instruction);
            if (answer) successes.push({ index, answer });
          } catch (error) {
            console.error("Bulk sequential transform failed", error);
          } finally {
            setBulkProgress((current) => ({ ...current, done: current.done + 1 }));
          }
        }
      } else {
        const results = await Promise.allSettled(
          eligible.map(({ card, index }) =>
            transformOnce(card, instruction)
              .then((answer) => ({ index, answer }))
              .finally(() =>
                setBulkProgress((current) => ({ ...current, done: current.done + 1 }))
              )
          )
        );
        successes = results
          .filter((result) => result.status === "fulfilled" && result.value.answer)
          .map((result) => result.value);
      }
      if (successes.length) {
        const updates = new Map(successes.map(({ index, answer }) => [index, answer]));
        setCards((current) =>
          current.map((card, index) =>
            updates.has(index) ? { ...card, answer: updates.get(index) } : card
          )
        );
      }
    } finally {
      setBulkLoading(null);
      setBulkProgress({ done: 0, total: 0 });
    }
  };

  const renderExpansionButtons = (index, answer, isBulk = false) => (
    <div className={`flash-manage-expand ${isBulk ? "is-bulk" : ""}`}>
      {EXPANSION_OPTIONS.map(({ key, label, title, icon: Icon }) => {
        const loading = isBulk ? bulkLoading === key : rowLoading[index] === key;
        const disabled = isBulk
          ? Boolean(bulkLoading)
          : Boolean(rowLoading[index]) || sentenceCount(answer) === TARGET_SENTENCES[key];
        return (
          <button
            className={`flash-expand-button is-${TARGET_SENTENCES[key]}`}
            key={key}
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              if (isBulk) applyAll(key);
              else runTransform(index, key);
            }}
            title={isBulk ? `${title} for every shorter answer` : title}
            aria-label={isBulk ? `${title} for all cards` : title}
          >
            {loading ? <ClipLoader size={12} color="currentColor" /> : <Icon aria-hidden="true" />}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <section
      className="flash-manage"
      style={{
        "--manage-text": COLORS?.text || "#172033",
        "--manage-border": COLORS?.border || "#dfe3eb",
        paddingBottom: !anyDrawerOpen && toolbarVisible ? "7.5rem" : "1.5rem",
      }}
    >
      <header className="flash-manage-header">
        <div>
          <span className="flash-manage-eyebrow">Deck manager</span>
          <h2>Review and refine</h2>
          <p>Edit cards, improve answers with AI, or select cards to use elsewhere.</p>
        </div>
        <span className="flash-manage-count">{cards.length} {cards.length === 1 ? "card" : "cards"}</span>
      </header>

      {cards.length > 0 && (
        <div className="flash-manage-tools">
          <label className="flash-manage-search">
            <FaSearch aria-hidden="true" />
            <span className="ui-sr-only">Search cards</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions and answers"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <FaTimes />
              </button>
            )}
          </label>
          <button className="flash-manage-select" type="button" onClick={toggleSelectVisible}>
            {allVisibleSelected ? "Clear visible" : "Select visible"}
          </button>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="flash-manage-empty">
          <FaBookOpen aria-hidden="true" />
          <h3>No cards in this deck</h3>
          <p>Add or generate cards to start managing them here.</p>
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="flash-manage-empty is-compact">
          <FaSearch aria-hidden="true" />
          <h3>No matching cards</h3>
          <button type="button" onClick={() => setQuery("")}>Clear search</button>
        </div>
      ) : (
        <div className="flash-manage-list">
          <div className="flash-manage-list-head" aria-hidden="true">
            <span>Question</span><span>Answer</span><span>Actions</span>
          </div>
          {visibleCards.map(({ card, index }) => {
            const selected = selectedSet.has(index);
            const editing = editingIndex === index;
            return (
              <article className={`flash-manage-card ${selected ? "is-selected" : ""}`} key={index}>
                <label className="flash-card-selector" title={selected ? "Deselect card" : "Select card"}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCardSelection(index)}
                    aria-label={`${selected ? "Deselect" : "Select"} card ${index + 1}`}
                  />
                  <span>{index + 1}</span>
                </label>

                {editing ? (
                  <div className="flash-manage-edit-fields">
                    <label>
                      <span>Question</span>
                      <textarea
                        value={draft.question}
                        onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
                        rows={3}
                      />
                    </label>
                    <label>
                      <span>Answer</span>
                      <textarea
                        value={draft.answer}
                        onChange={(event) => setDraft((current) => ({ ...current, answer: event.target.value }))}
                        rows={5}
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="flash-manage-copy">
                      <span className="flash-mobile-label">Question</span>
                      <p>{card.question}</p>
                    </div>
                    <div className="flash-manage-copy is-answer">
                      <span className="flash-mobile-label">Answer</span>
                      <p>{card.answer}</p>
                      <span className="flash-sentence-count">{sentenceCount(card.answer)} {sentenceCount(card.answer) === 1 ? "sentence" : "sentences"}</span>
                    </div>
                  </>
                )}

                <div className="flash-manage-card-actions">
                  {editing ? (
                    <>
                      <button
                        className="flash-card-action is-save"
                        type="button"
                        onClick={saveEditing}
                        disabled={!draft.question.trim() || !draft.answer.trim()}
                      ><FaCheck /> Save</button>
                      <button className="flash-card-action" type="button" onClick={() => setEditingIndex(null)}>
                        <FaTimes /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flash-card-action" type="button" onClick={() => startEditing(index)}>
                        <FaEdit /> Edit
                      </button>
                      {renderExpansionButtons(index, card.answer)}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {cards.length > 0 && (
        <aside className="flash-manage-ai-panel">
          <div className="flash-manage-ai-copy">
            <strong>Improve every answer</strong>
            <span>Only answers shorter than the target are updated.</span>
          </div>
          <label className="flash-manage-mode">
            <input
              type="checkbox"
              checked={bulkMode === "async"}
              onChange={(event) => setBulkMode(event.target.checked ? "async" : "sequential")}
            />
            <span>Faster parallel mode</span>
          </label>
          {renderExpansionButtons(null, "", true)}
          {bulkLoading && bulkProgress.total > 0 && (
            <div className="flash-manage-progress" role="status">
              <span>{bulkProgress.done} of {bulkProgress.total}</span>
              <div><i style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} /></div>
            </div>
          )}
        </aside>
      )}

      {!anyDrawerOpen && (
        <ToolbarPortal>
          <button
            className="flash-selection-toggle"
            type="button"
            onClick={() => setToolbarVisible((visible) => !visible)}
            aria-label={toolbarVisible ? "Hide selection toolbar" : "Show selection toolbar"}
          >
            {toolbarVisible ? <FaChevronDown /> : <FaChevronUp />}
          </button>
          <div className={`flash-selection-bar ${toolbarVisible ? "is-visible" : ""}`}>
            <div className="flash-selection-summary">
              <strong>{selectedCards.length}</strong>
              <span>{selectedCards.length === 1 ? "card selected" : "cards selected"}</span>
            </div>
            <div className={`flash-selection-actions ${hasSelection ? "" : "is-disabled"}`}>
              <ActionButtons limitButtons promptText={hasSelection ? combinedPrompt : ""} />
            </div>
            <button
              className="flash-selection-delete"
              type="button"
              disabled={!hasSelection}
              onClick={deleteSelected}
            ><FaTrashAlt /> <span>Delete</span></button>
          </div>
        </ToolbarPortal>
      )}
    </section>
  );
}
