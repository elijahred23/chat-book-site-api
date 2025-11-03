import React, { useState } from "react";
import ReactDOM from "react-dom";
import ActionButtons from "./ui/ActionButtons.jsx";

function ToolbarPortal({ children }) {
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
}

const FlashCardTable = ({ cards, COLORS }) => {
  const [selectedCards, setSelectedCards] = useState([]);

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
                <ActionButtons promptText={hasSelection ? combinedPrompt : ""} />
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
          <thead>
            <tr>
              <th></th>
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
                </td>
                <td
                  style={{
                    borderBottom: `1px solid ${COLORS?.border || "#444"}`,
                    padding: "0.5rem",
                    verticalAlign: "top",
                    wordWrap: "break-word",
                  }}
                >
                  {card.answer}
                  <ActionButtons promptText={`${card.question} - ${card.answer}`} />
                </td>
                <td style={{ padding: "0.5rem", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedCards.includes(idx)}
                    onChange={() => toggleCardSelection(idx)}
                    style={{ transform: "scale(1.2)" }}
                  />
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
