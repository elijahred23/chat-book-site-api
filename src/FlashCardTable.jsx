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
            onClick={() => (isBulk ? applyAll(key) : runTransform(index, key))}
            title={title}
          >
            {loading ? <ClipLoader size={14} /> : <Icon />}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {hasSelection && !anyDrawerOpen && (
        <ToolbarPortal>
          <div className="flash-manage-toolbar">
            <div className="flash-manage-toolbar__summary">
              <strong>{selectedCards.length}</strong> selected
            </div>
            <ActionButtons promptText={combinedPrompt} limitButtons />
            <button className="flash-manage-delete" onClick={deleteSelected} title="Delete selected cards">
              <FaTrashAlt />
              <span>Delete</span>
            </button>
            <button className="flash-manage-close" onClick={() => setSelectedCards([])} title="Clear selection">
              <FaTimes />
            </button>
          </div>
        </ToolbarPortal>
      )}

      <div className="flash-table-tools">
        <button className="flash-select-all" onClick={toggleSelectVisible}>
          {allVisibleSelected ? <FaCheck /> : null}
          <span>{allVisibleSelected ? "Clear visible" : "Select visible"}</span>
        </button>
        <label className="flash-bulk-mode">
          <span>Bulk AI</span>
          <select value={bulkMode} onChange={(event) => setBulkMode(event.target.value)}>
            <option value="async">Async</option>
            <option value="sequential">Sequential</option>
          </select>
        </label>
        <button
          className="flash-toolbar-toggle"
          onClick={() => setToolbarVisible((current) => !current)}
          title={toolbarVisible ? "Hide row actions" : "Show row actions"}
        >
          {toolbarVisible ? <FaChevronUp /> : <FaChevronDown />}
          <span>{toolbarVisible ? "Hide actions" : "Show actions"}</span>
        </button>
        {toolbarVisible && renderExpansionButtons(null, "", true)}
        <div className="flash-search">
          <FaSearch />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cards..."
          />
        </div>
      </div>

      <table className="flash-card-table">
        <thead>
          <tr>
            <th style={{ width: "44px" }}>Pick</th>
            <th>Question</th>
            <th>Answer</th>
            <th style={{ width: "240px" }}>Manage</th>
          </tr>
        </thead>
        <tbody>
          {visibleCards.map(({ card, index }) => {
            const isSelected = selectedSet.has(index);
            const isEditing = editingIndex === index;
            return (
              <tr key={index} className={isSelected ? "is-selected" : ""}>
                <td>
                  <button
                    className={`flash-row-select ${isSelected ? "is-active" : ""}`}
                    onClick={() => toggleCardSelection(index)}
                    aria-label={isSelected ? "Deselect card" : "Select card"}
                  >
                    {isSelected ? <FaCheck /> : null}
                  </button>
                </td>
                <td>
                  {isEditing ? (
                    <textarea
                      value={draft.question}
                      onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
                    />
                  ) : (
                    card.question
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <textarea
                      value={draft.answer}
                      onChange={(event) => setDraft((current) => ({ ...current, answer: event.target.value }))}
                    />
                  ) : (
                    card.answer
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <div className="flash-row-actions">
                      <button onClick={saveEditing}>Save</button>
                      <button onClick={() => setEditingIndex(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flash-row-actions">
                      {toolbarVisible && renderExpansionButtons(index, card.answer)}
                      <button className="flash-edit-button" onClick={() => startEditing(index)} title="Edit card">
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
