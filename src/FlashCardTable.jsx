import React, { useState } from "react";
import ReactDOM from "react-dom";
import ActionButtons from "./ui/ActionButtons.jsx";
import { getGeminiResponse } from "./utils/callGemini.js";
import { FaFeatherAlt, FaAlignLeft, FaBookOpen } from "react-icons/fa";
import { ClipLoader } from "react-spinners";

function ToolbarPortal({ children }) {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
}

const FlashCardTable = ({ cards, setCards, COLORS }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [rowLoading, setRowLoading] = useState({});
  const [bulkLoading, setBulkLoading] = useState(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  const toggleCardSelection = (idx) => {
    setSelectedCards((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCards.length === cards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(cards.map((_, idx) => idx));
    }
  };

  const combinedPrompt = selectedCards
    .map((idx) => `${cards[idx].question} - ${cards[idx].answer}`)
    .join("\n");

  const allSelected = cards.length > 0 && selectedCards.length === cards.length;
  const hasSelection = selectedCards.length > 0;

  const iconBtnStyle = (isLoading, bg, fg) => ({
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid " + (COLORS?.border || "#ccc"),
    background: isLoading ? "#e5e7eb" : bg,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: isLoading ? "not-allowed" : "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
    color: fg,
  });


  const transformOnce = async (card, instruction) => {
    const prompt = `${instruction}\n\nQuestion: ${card.question}\nCurrent answer: ${card.answer}\nReturn only the revised answer text.`;
    const response = await getGeminiResponse(prompt);
    return (response || "").trim();
  };

  const runTransform = async (idx, instruction) => {
    if (!cards[idx]) return;
    setRowLoading((prev) => ({ ...prev, [idx]: true }));
    try {
      const updatedAnswer = await transformOnce(cards[idx], instruction);
      if (!updatedAnswer) return;
      setCards((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, answer: updatedAnswer } : c))
      );
    } catch (err) {
      console.error("Transform failed", err);
    } finally {
      setRowLoading((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const transformPresets = {
    expand3: "Rewrite this answer as roughly three concise sentences that cover the essentials.",
    expand5: "Expand this answer into roughly five concise sentences with key details and nuance.",
    expand10: "Expand this answer into roughly ten concise sentences with clear structure and detail.",
    expand15: "Expand this answer into roughly fifteen concise sentences, covering context, examples, and nuance.",
  };

  const targetSentences = {
    expand3: 3,
    expand5: 5,
    expand10: 10,
    expand15: 15,
  };

  const sentenceCount = (text = "") => {
    return (text.match(/[^.!?]+[.!?]+/g) || []).length || (text.trim() ? 1 : 0);
  };

  const applyAll = async (presetKey) => {
    const instruction = transformPresets[presetKey];
    if (!instruction || !cards.length) return;
    const eligible = cards
      .map((card, idx) => ({ card, idx }))
      .filter(({ card }) => {
        const target = targetSentences[presetKey] || 0;
        const currentCount = sentenceCount(card?.answer);
        return !(target && currentCount >= target);
      });

    if (!eligible.length) return;

    setBulkLoading(presetKey);
    setBulkProgress({ done: 0, total: eligible.length });

    try {
      const results = await Promise.allSettled(
        eligible.map(({ card, idx }) =>
          transformOnce(card, instruction)
            .then((res) => ({ idx, res }))
            .finally(() =>
              setBulkProgress((p) => ({ ...p, done: p.done + 1 }))
            )
        )
      );

      const successes = results
        .filter((r) => r.status === "fulfilled" && r.value?.res)
        .map((r) => r.value);

      if (successes.length) {
        setCards((prev) => {
          const updated = [...prev];
          successes.forEach(({ idx, res }) => {
            if (updated[idx]) {
              updated[idx] = { ...updated[idx], answer: res.trim() };
            }
          });
          return updated;
        });
      }
    } finally {
      setBulkLoading(null);
      setBulkProgress({ done: 0, total: 0 });
    }
  };

  return (
    <div
      style={{
        position: "relative",
        overflowX: "auto",
        paddingTop: "72px", // space so table doesn't hide under toolbar
      }}
    >
      {/* Fixed, viewport-level toolbar via portal (works on mobile) */}
      <ToolbarPortal>
        <div
          // outer wrapper gives full-width bar on phones, compact panel on larger screens
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            paddingTop: "calc(env(safe-area-inset-top, 0px))",
            zIndex: 1000, // ensure top of everything
            pointerEvents: "none", // allow clicks only on inner card
          }}
        >
          <div
            // inner card is aligned to the right on desktops; full-width on mobile
            style={{
              margin: "8px",
              marginTop: "calc(8px + env(safe-area-inset-top, 0px))",
              backgroundColor: COLORS?.background || "#1e1e1e",
              border: `1px solid ${COLORS?.border || "#333"}`,
              borderRadius: "12px",
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
              padding: "8px 10px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "space-between",
              pointerEvents: "auto",
              // Responsive: full-width on small screens, compact on wider
              width: "min(680px, 96vw)",
              marginLeft: "auto",
            }}
          >
            {/* Left cluster: Select All + count */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: "1 1 auto",
                minWidth: 0,
              }}
            >
              <button
                onClick={toggleSelectAll}
                style={{
                  backgroundColor: allSelected ? "#b33a3a" : "#0078d7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                }}
              >
                {allSelected ? "Clear All" : "Select All"}
              </button>

              <span
                style={{
                  color: COLORS?.text || "#fff",
                  fontSize: "0.9rem",
                  opacity: 0.9,
                  whiteSpace: "nowrap",
                }}
              >
                {selectedCards.length} selected
              </span>
            </div>

            {/* Right cluster: your ActionButtons (wraps on small screens) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                flex: "0 1 auto",
                minWidth: 0,
              }}
            >
              {/* Disable ActionButtons when nothing is selected to avoid empty prompts */}
              <div style={{ opacity: hasSelection ? 1 : 0.55 }}>
                <ActionButtons limitButtons promptText={hasSelection ? combinedPrompt : ""} />
              </div>
            </div>
          </div>
        </div>
      </ToolbarPortal>

      {/* Flashcard table */}
      {cards.length === 0 ? (
        <p>No cards available to display.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: COLORS?.text || "#eaeaea",
            fontSize: "0.95rem",
          }}
        >
          <caption style={{ textAlign: "left", marginBottom: "0.5rem", color: COLORS?.text || "#fff" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", fontSize: "0.9rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: "#e0f2fe", display: "inline-block" }}></span>
                3 sentences
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: "#c7d2fe", display: "inline-block" }}></span>
                5 sentences
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: "#fef3c7", display: "inline-block" }}></span>
                10 sentences
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: "#e2e8f0", display: "inline-block" }}></span>
                15 sentences
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "0.4rem" }}>
              <button
                disabled={!!bulkLoading}
                onClick={() => applyAll("expand3")}
                style={iconBtnStyle(!!bulkLoading, "#e0f2fe", "#0b172a")}
                title="Apply 3 sentences to all"
              >
                {bulkLoading === "expand3" ? <ClipLoader size={14} color="#0b1220" /> : <FaFeatherAlt size={14} color="#0b172a" />}
              </button>
              <button
                disabled={!!bulkLoading}
                onClick={() => applyAll("expand5")}
                style={iconBtnStyle(!!bulkLoading, "#c7d2fe", "#312e81")}
                title="Apply 5 sentences to all"
              >
                {bulkLoading === "expand5" ? <ClipLoader size={14} color="#0b1220" /> : <FaFeatherAlt size={14} color="#312e81" />}
              </button>
              <button
                disabled={!!bulkLoading}
                onClick={() => applyAll("expand10")}
                style={iconBtnStyle(!!bulkLoading, "#fef3c7", "#92400e")}
                title="Apply 10 sentences to all"
              >
                {bulkLoading === "expand10" ? <ClipLoader size={14} color="#0b1220" /> : <FaAlignLeft size={14} color="#92400e" />}
              </button>
              <button
                disabled={!!bulkLoading}
                onClick={() => applyAll("expand15")}
                style={iconBtnStyle(!!bulkLoading, "#e2e8f0", "#0f172a")}
                title="Apply 15 sentences to all"
              >
                {bulkLoading === "expand15" ? <ClipLoader size={14} color="#0b1220" /> : <FaBookOpen size={14} color="#0f172a" />}
              </button>
              {bulkLoading && bulkProgress.total > 0 && (
                <div style={{ minWidth: 160, marginLeft: "6px" }}>
                  <div style={{ fontSize: "0.8rem", color: COLORS?.text || "#fff", marginBottom: "4px" }}>
                    {bulkProgress.done}/{bulkProgress.total} processed
                  </div>
                  <div style={{ width: "100%", height: 8, background: "#e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${(bulkProgress.done / bulkProgress.total) * 100}%`,
                        height: "100%",
                        background: "#0ea5e9",
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </caption>
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: `2px solid ${COLORS?.border || "#444"}`,
                  textAlign: "left",
                  padding: "0.5rem",
                }}
              >
                Question
              </th>
              <th
                style={{
                  borderBottom: `2px solid ${COLORS?.border || "#444"}`,
                  textAlign: "left",
                  padding: "0.5rem",
                }}
              >
                Answer
              </th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, idx) => (
              <tr
                key={idx}
                style={{
                  backgroundColor: selectedCards.includes(idx)
                    ? "rgba(100,149,237,0.15)"
                    : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => toggleCardSelection(idx)}
              >
                <td
                  style={{
                    borderBottom: `1px solid ${COLORS?.border || "#444"}`,
                    padding: "0.5rem",
                    verticalAlign: "top",
                    wordWrap: "break-word",
                  }}
                >
                  {card.question}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginTop: "0.4rem" }}>
                    <button
                      title="3 sentences"
                      aria-label="3 sentences"
                      disabled={!!rowLoading[idx]}
                      onClick={(e) => {
                        e.stopPropagation();
                        runTransform(idx, transformPresets.expand3);
                      }}
                      style={iconBtnStyle(rowLoading[idx], "#e0f2fe", "#0b172a")}
                    >
                      {rowLoading[idx] ? <ClipLoader size={14} color="#0b1220" /> : <FaFeatherAlt size={14} color="#0b172a" /> }
                    </button>
                    <button
                      title="5 sentences"
                      aria-label="5 sentences"
                      disabled={!!rowLoading[idx]}
                      onClick={(e) => {
                        e.stopPropagation();
                        runTransform(idx, transformPresets.expand5);
                      }}
                      style={iconBtnStyle(rowLoading[idx], "#c7d2fe", "#312e81")}
                    >
                      {rowLoading[idx] ? <ClipLoader size={14} color="#0b1220" /> : <FaFeatherAlt size={14} color="#312e81" /> }
                    </button>
                    <button
                      title="10 sentences"
                      aria-label="10 sentences"
                      disabled={!!rowLoading[idx]}
                      onClick={(e) => {
                        e.stopPropagation();
                        runTransform(idx, transformPresets.expand10);
                      }}
                      style={iconBtnStyle(rowLoading[idx], "#fef3c7", "#92400e")}
                    >
                      {rowLoading[idx] ? <ClipLoader size={14} color="#0b1220" /> : <FaAlignLeft size={14} color="#92400e" /> }
                    </button>
                    <button
                      title="15 sentences"
                      aria-label="15 sentences"
                      disabled={!!rowLoading[idx]}
                      onClick={(e) => {
                        e.stopPropagation();
                        runTransform(idx, transformPresets.expand15);
                      }}
                      style={iconBtnStyle(rowLoading[idx], "#e2e8f0", "#0f172a")}
                    >
                      {rowLoading[idx] ? <ClipLoader size={14} color="#0b1220" /> : <FaBookOpen size={14} color="#0f172a" /> }
                    </button>
                  </div>
                </td>
                <td
                  style={{
                    borderBottom: `1px solid ${COLORS?.border || "#444"}`,
                    padding: "0.5rem",
                    verticalAlign: "top",
                    wordWrap: "break-word",
                  }}
                >
                  <div style={{ marginBottom: "0.4rem" }}>{card.answer}</div>
                  <ActionButtons limitButtons promptText={`${card.question} - ${card.answer}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FlashCardTable;
