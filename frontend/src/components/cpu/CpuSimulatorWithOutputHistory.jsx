import { useEffect, useRef, useState } from "react";
import CpuSimulator from "./CpuSimulator.jsx";

const MAX_OUTPUT_HISTORY = 80;
const OUTPUT_CARD_SELECTOR = ".cpu-register";

function readOutputSnapshot() {
  const cards = Array.from(document.querySelectorAll(OUTPUT_CARD_SELECTOR));
  const outputCard = cards.find((card) => card.querySelector(".cpu-register__heading span")?.textContent?.trim() === "OUT");
  if (!outputCard || !outputCard.classList.contains("active")) return null;

  const hexValue = outputCard.querySelector("strong")?.textContent?.trim();
  const decimalText = outputCard.querySelector(".cpu-register__values span:last-child")?.textContent?.trim() ?? "";
  const decimalValue = decimalText.replace(/\s*decimal\s*$/i, "");
  const cycleText = document.querySelector(".cpu-status-strip b")?.textContent?.trim() ?? "";
  const cycle = Number.parseInt(cycleText, 10);

  if (!hexValue) return null;
  return {
    id: `${Number.isFinite(cycle) ? cycle : Date.now()}-${hexValue}-${decimalValue}`,
    cycle: Number.isFinite(cycle) ? cycle : null,
    hexValue,
    decimalValue,
  };
}

function OutputHistoryPanel() {
  const [outputs, setOutputs] = useState([]);
  const lastOutputRef = useRef("");

  useEffect(() => {
    const capture = () => {
      const snapshot = readOutputSnapshot();
      if (!snapshot || snapshot.id === lastOutputRef.current) return;
      lastOutputRef.current = snapshot.id;
      setOutputs((previous) => [...previous.slice(-(MAX_OUTPUT_HISTORY - 1)), snapshot]);
    };

    const resetWhenProgramReloads = () => {
      const statusText = document.querySelector(".cpu-status-strip")?.textContent ?? "";
      if (statusText.includes("Program not loaded") || statusText.includes("0 cycles")) {
        lastOutputRef.current = "";
        setOutputs([]);
      }
    };

    const observer = new MutationObserver(() => {
      resetWhenProgramReloads();
      capture();
    });

    observer.observe(document.body, { attributes: true, childList: true, characterData: true, subtree: true });
    capture();

    return () => observer.disconnect();
  }, []);

  return (
    <aside style={{
      position: "fixed",
      right: 18,
      bottom: 18,
      zIndex: 30,
      width: "min(360px, calc(100vw - 36px))",
      maxHeight: "44vh",
      overflow: "hidden",
      border: "1px solid #252c34",
      background: "linear-gradient(145deg, rgba(20, 26, 33, 0.97), rgba(13, 17, 22, 0.98))",
      color: "#e9edf2",
      boxShadow: "0 18px 60px rgba(0, 0, 0, 0.45)",
      fontFamily: "var(--font-sans)",
    }} aria-label="CPU output history">
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 14px",
        borderBottom: "1px solid #252c34",
      }}>
        <div>
          <span style={{ color: "#c8f04a", font: "8px SFMono-Regular, Consolas, monospace", letterSpacing: "0.16em", textTransform: "uppercase" }}>Output history</span>
          <h2 style={{ margin: "4px 0 0", fontSize: 13 }}>OUT register writes</h2>
        </div>
        <button type="button" onClick={() => { lastOutputRef.current = ""; setOutputs([]); }} style={{
          border: "1px solid #39424b",
          background: "#151b22",
          color: "#9ca6af",
          borderRadius: 2,
          padding: "7px 9px",
          fontSize: 10,
          fontWeight: 700,
        }}>Clear</button>
      </header>
      <div style={{ maxHeight: "calc(44vh - 61px)", overflow: "auto", padding: 12 }}>
        {outputs.length ? outputs.slice().reverse().map((output, index) => (
          <div key={output.id} style={{
            display: "grid",
            gridTemplateColumns: "44px minmax(0, 1fr)",
            gap: 10,
            alignItems: "center",
            padding: "8px 0",
            borderBottom: index === outputs.length - 1 ? "0" : "1px solid #20272e",
          }}>
            <span style={{ color: "#84909c", font: "8px SFMono-Regular, Consolas, monospace" }}>{output.cycle === null ? "CLOCK" : `#${output.cycle}`}</span>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", color: "#c8f04a", font: "11px SFMono-Regular, Consolas, monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{output.hexValue}</strong>
              <small style={{ color: "#84909c", fontSize: 10 }}>{output.decimalValue} decimal</small>
            </div>
          </div>
        )) : <p style={{ color: "#84909c", fontSize: 11, lineHeight: 1.5, margin: 0 }}>Run a program that calls <code>output(...)</code> or uses <code>OUT</code>, and each visible write will appear here.</p>}
      </div>
    </aside>
  );
}

export default function CpuSimulatorWithOutputHistory() {
  return (
    <>
      <CpuSimulator />
      <OutputHistoryPanel />
    </>
  );
}
