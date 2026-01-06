import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

const BASE_STOCKS = [
  { symbol: "ALPHA", name: "Alpha Labs" },
  { symbol: "BETA", name: "Beta Motors" },
  { symbol: "GAMMA", name: "Gamma Health" },
  { symbol: "DELTA", name: "Delta Energy" },
  { symbol: "EPS", name: "Epsilon Tech" },
  { symbol: "ZETA", name: "Zeta Cloud" },
  { symbol: "ETA", name: "Eta Retail" },
  { symbol: "THETA", name: "Theta Media" },
  { symbol: "IOTA", name: "Iota Finance" },
  { symbol: "KAPPA", name: "Kappa AI" },
];

const HISTORY_LENGTH = 60;

const buildInitialStockList = () =>
  BASE_STOCKS.map((s) => {
    const start = Math.round(80 + Math.random() * 120); // randomize roughly 80-200
    return {
      ...s,
      price: start,
      history: Array.from({ length: HISTORY_LENGTH }, () => start),
      portfolio: { cash: 10000, position: 0, avgCost: 0 },
      drift: (Math.random() - 0.2) * 0.25 + 0.1, // percent bias per tick
      volatility: 1.5 + Math.random() * 3.5, // stronger noise to show movement
      wavePhase: Math.random() * 50,
      waveStrength: 0.4 + Math.random() * 1.6,
      cycleSpeed: 6 + Math.random() * 10,
    };
  });

const defaultScript = `async function run(state, api, utils) {
  let toggle = 0;
  while (true) {
    const mod = toggle % 4;
    if (mod === 0) {
      api.buy(2, 0);
    } else if (mod === 1) {
      api.buy(2, 1);
    } else if (mod === 2) {
      api.sell(1, 1);
    } else {
      api.sell(1, 0);
    }

    toggle = (toggle % 100) + 1;
    await api.sleep(1000);
  }
}`;

function formatMoney(v) {
  const num = Number.isFinite(v) ? v : 0;
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clampPrice(p) {
  return Math.max(1, Number(p.toFixed(2)));
}

export default function StockMarketGame() {
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const automationRef = useRef(null);
  const stateRef = useRef(null);
  const [activeTab, setActiveTab] = useState("market");
  const programTokenRef = useRef(0);
  const firstLineRef = useRef(0);
  const docContentRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stockList, setStockList] = useState(() => buildInitialStockList());
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState([{ text: "Welcome to the market arena. Write a bot or trade manually.", ts: Date.now() }]);
  const [running, setRunning] = useState(true);
  const [userCode, setUserCode] = useState(defaultScript);
  const [automationError, setAutomationError] = useState("");
  const [currentLine, setCurrentLine] = useState(null);
  const [linePulseId, setLinePulseId] = useState(0);
  const [programSteps, setProgramSteps] = useState(0);
  const [tickPulse, setTickPulse] = useState(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("smg_user_code");
      if (saved) setUserCode(saved);
    } catch {
      // ignore
    }
  }, []);

  const highlightCode = (code) =>
    Prism.highlight(code, Prism.languages.javascript, "javascript")
      .split("\n")
      .map(
        (line, idx) =>
          `<div class="code-line${idx === currentLine ? " active-line" : ""}" ${
            idx === currentLine ? `data-pulse="${linePulseId}" style="animation: linePulse 0.65s ease"` : ""
          }>${line || "&nbsp;"}</div>`
      )
      .join("");

  const activeStock = useMemo(
    () => {
      const fallback = {
        symbol: "",
        price: 0,
        history: [],
        portfolio: { cash: 0, position: 0, avgCost: 0 },
      };
      const found = stockList[activeIndex] || fallback;
      if (!Number.isFinite(found.price)) return { ...found, price: 0 };
      return found;
    },
    [stockList, activeIndex]
  );

  const unrealized = useMemo(() => {
    const pnl = (activeStock.price - activeStock.portfolio.avgCost) * activeStock.portfolio.position;
    return isFinite(pnl) ? pnl : 0;
  }, [activeStock]);

  const totalEquity = useMemo(() => activeStock.portfolio.cash + activeStock.portfolio.position * activeStock.price, [activeStock]);

  const appendLog = (text) => {
    setLog((prev) => {
      const entry = { text, ts: Date.now() };
      const next = [entry, ...prev];
      return next.slice(0, 60);
    });
  };

  const resolveIndex = (target) => {
    if (typeof target === "number" && target >= 0 && target < stockList.length) return target;
    if (typeof target === "string") {
      const idx = stockList.findIndex((s) => s.symbol === target);
      if (idx >= 0) return idx;
    }
    return null;
  };

  const trade = (type, qty, target) => {
    const q = Math.max(0, Math.floor(qty));
    if (!q) return;
    const targetIndex = resolveIndex(target);
    if (targetIndex === null) {
      appendLog("Target stock required: pass an index (0-9) or symbol.");
      return;
    }
    setStockList((prev) => {
      const current = prev[targetIndex];
      if (!current) return prev;
      const nowPrice = current.price;
      if (type === "buy") {
        const cost = nowPrice * q;
        if (cost > current.portfolio.cash) {
          appendLog(`Not enough cash to buy ${q}`);
          return prev;
        }
        const newPosition = current.portfolio.position + q;
        const newAvg =
          newPosition === 0
            ? 0
            : (current.portfolio.avgCost * current.portfolio.position + cost) / newPosition;
        appendLog(`Bought ${q} ${current.symbol} @ ${formatMoney(nowPrice)}`);
        const updated = [...prev];
        updated[targetIndex] = {
          ...current,
          portfolio: {
            cash: current.portfolio.cash - cost,
            position: newPosition,
            avgCost: newAvg,
          },
        };
        return updated;
      }
      if (type === "sell") {
        const sellQty = Math.min(q, current.portfolio.position);
        if (sellQty <= 0) {
          appendLog("Nothing to sell");
          return prev;
        }
        const revenue = nowPrice * sellQty;
        const remaining = current.portfolio.position - sellQty;
        const newAvg = remaining === 0 ? 0 : current.portfolio.avgCost;
        appendLog(`Sold ${sellQty} ${current.symbol} @ ${formatMoney(nowPrice)}`);
        const updated = [...prev];
        updated[targetIndex] = {
          ...current,
          portfolio: {
            cash: current.portfolio.cash + revenue,
            position: remaining,
            avgCost: newAvg,
          },
        };
        return updated;
      }
      return prev;
    });
  };

  const buy = (qty, target) => trade("buy", qty, target);
  const sell = (qty, target) => trade("sell", qty, target);

  const instrumentCode = (code) => {
    const hasRun = /function\s+run\s*\(/.test(code) || /async\s+function\s+run\s*\(/.test(code);
    const baseCode = hasRun ? code : `async function run(state, api, utils) {\n${code}\n}`;
    let codePrepared = baseCode;
    if (!/async\s+function\s+run\s*\(/.test(codePrepared)) {
      codePrepared = codePrepared.replace(/function\s+run\s*\(/, "async function run(");
    }
    const lines = codePrepared.split("\n");
    let inRun = false;
    let braceDepth = 0;
    let firstTracked = null;
    const instrumented = lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!inRun && (trimmed.startsWith("function run") || trimmed.startsWith("async function run"))) {
        inRun = true;
      }
      if (inRun) {
        const open = (line.match(/{/g) || []).length;
        const close = (line.match(/}/g) || []).length;
        braceDepth += open;
        const isRunSignature = trimmed.startsWith("function run") || trimmed.startsWith("async function run");
        const shouldTrack =
          braceDepth > 0 &&
          !(trimmed === "}" || trimmed === "" || isRunSignature || trimmed.startsWith("//"));
        const instrumentedLine = shouldTrack ? `await __step(${idx}); ${line}` : line;
        if (shouldTrack && firstTracked === null) {
          firstTracked = idx;
        }
        braceDepth -= close;
        if (braceDepth <= 0 && inRun) {
          inRun = false;
        }
        return instrumentedLine;
      }
      return line;
    });
    if (!lines.some((l) => l.includes("function run"))) {
      throw new Error("Define run(state, api, utils)");
    }
    return { instrumented: instrumented.join("\n"), firstTrackedLine: firstTracked ?? 0 };
  };

  const compileAutomation = () => {
    try {
      const { instrumented, firstTrackedLine } = instrumentCode(userCode);
      firstLineRef.current = firstTrackedLine;
      const fn = new Function(
        "state",
        "api",
        "utils",
        "__line",
        "__step",
        `"use strict"; ${instrumented}; if (typeof run !== "function") { throw new Error("Define run(state, api, utils)"); } return run(state, api, utils, __line, __step);`
      );
      automationRef.current = fn;
      setAutomationError("");
      appendLog("Automation loaded.");
      return true;
    } catch (err) {
      setAutomationError(err.message);
      appendLog(`Automation error: ${err.message}`);
      automationRef.current = null;
      return false;
    }
  };

  const buildUtils = (snapshot) => {
        const recent = snapshot.history ?? [];
    return {
      trend: recent.length > 5 ? recent[recent.length - 1] - recent[recent.length - 5] : 0,
      volatility: Math.min(
        1,
        (recent.length > 10
          ? recent
              .slice(-10)
              .map((p) => Math.abs(p - snapshot.price))
              .reduce((s, d) => s + d, 0) / (10 * snapshot.price)
          : 0)
      ),
    };
  };

  const startProgram = () => {
    if (!compileAutomation()) return;
    const snapshot = stateRef.current;
    if (!snapshot) return;
    const token = programTokenRef.current + 1;
    programTokenRef.current = token;
    setCurrentLine(firstLineRef.current || 0);
    setLinePulseId((p) => p + 1);
    setProgramSteps(0);
    setTickPulse((v) => v + 1);
    setAutomationError("");

    const utils = buildUtils(snapshot);
    const liveState = {
      get price() {
        return stateRef.current?.price ?? snapshot.price;
      },
      get cash() {
        return stateRef.current?.cash ?? snapshot.cash;
      },
      get position() {
        return stateRef.current?.position ?? snapshot.position;
      },
      get avgCost() {
        return stateRef.current?.avgCost ?? snapshot.avgCost;
      },
      get tick() {
        return stateRef.current?.tick ?? snapshot.tick;
      },
      get history() {
        return stateRef.current?.history ?? snapshot.history;
      },
    };
    const api = {
      buy: (qty, target) => {
        if (programTokenRef.current !== token) return;
        buy(qty, target);
      },
      sell: (qty, target) => {
        if (programTokenRef.current !== token) return;
        sell(qty, target);
      },
      log: (msg) => {
        if (programTokenRef.current !== token) return;
        appendLog(`[bot] ${msg}`);
      },
      sleep: (ms = 1000) =>
        new Promise((resolve) => {
          const delay = Math.max(400, ms);
          setTimeout(resolve, delay);
        }),
      shouldStop: () => programTokenRef.current !== token,
    };

    try {
      const res = automationRef.current(
        liveState,
        api,
        utils,
        () => {},
        async (line) => {
          if (programTokenRef.current !== token) return;
          setCurrentLine(line);
          setLinePulseId((p) => p + 1);
          setProgramSteps((s) => s + 1);
          setTickPulse((v) => v + 1);
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (programTokenRef.current === token) {
            setCurrentLine(null);
          }
        }
      );
      if (res && typeof res.then === "function") {
        res.catch((err) => setAutomationError(err.message));
      }
    } catch (err) {
      setAutomationError(err.message);
    }
  };

  const stopProgram = () => {
    programTokenRef.current += 1;
    setCurrentLine(null);
    setTickPulse((v) => v + 1);
  };

  const copyDocs = async () => {
    const text = docContentRef.current?.innerText || "";
    if (!text.trim()) {
      appendLog("Docs are empty to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      appendLog("Docs copied to clipboard.");
    } catch (err) {
      appendLog("Could not copy docs.");
    }
  };

  useEffect(() => {
    setCurrentLine(null);
  }, [userCode]);


  useEffect(() => {
    stateRef.current = {
      price: activeStock.price,
      history: activeStock.history,
      tick,
      cash: activeStock.portfolio.cash,
      position: activeStock.portfolio.position,
      avgCost: activeStock.portfolio.avgCost,
      symbol: activeStock.symbol,
      stocks: stockList.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        cash: s.portfolio.cash,
        position: s.portfolio.position,
        avgCost: s.portfolio.avgCost,
        history: s.history,
      })),
    };
  }, [activeStock, tick, stockList]);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setTick((t) => {
        const nextTick = t + 1;
        setStockList((prev) =>
          prev.map((item, idx) => {
            const basePrice = Number.isFinite(item.price) ? item.price : 100;
            const wave = Math.sin((nextTick + item.wavePhase) / item.cycleSpeed) * item.waveStrength;
            const noise = (Math.random() - 0.5) * item.volatility;
            const drift = item.drift;
            let nextPrice = clampPrice(basePrice * (1 + (wave + noise + drift) / 100));
            if (Math.abs(nextPrice - basePrice) < 0.02) {
              nextPrice = clampPrice(basePrice * (1 + ((Math.random() - 0.5) * 0.6) / 100));
            }
            return {
              ...item,
              price: nextPrice,
              history: [...item.history.slice(-(HISTORY_LENGTH - 1)), nextPrice],
            };
          })
        );
        return nextTick;
      });
    }, 950);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap) return;
    const availableWidth = Math.max(
      280,
      Math.min(880, (wrap.clientWidth || 880) - 20)
    );
    const width = availableWidth;
    const height = Math.round(width * 0.56);
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(37, 99, 235, 0.18)");
    gradient.addColorStop(1, "rgba(16, 185, 129, 0.12)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const series = activeStock.history.slice(-120);
    const min = Math.min(...series, activeStock.price || 0) * 0.98;
    const max = Math.max(...series, activeStock.price || 0) * 1.02;
    const scaleY = (val) => height - ((val - min) / (max - min || 1)) * (height - 30) - 15;

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = ((height - 30) / 6) * i + 10;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = ((width - 70) / 10) * i + 50;
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, height - 20);
      ctx.stroke();
    }

    ctx.beginPath();
    series.forEach((p, idx) => {
      const x = 50 + (idx / Math.max(1, series.length - 1)) * (width - 70);
      const y = scaleY(p);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    series.forEach((p, idx) => {
      const x = 50 + (idx / Math.max(1, series.length - 1)) * (width - 70);
      const y = scaleY(p);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width - 20, height - 12);
    ctx.lineTo(50, height - 12);
    ctx.closePath();
    ctx.fillStyle = "rgba(96,165,250,0.12)";
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px 'Inter', system-ui, -apple-system, sans-serif";
    ctx.fillText(`Price: ${formatMoney(activeStock.price)}`, 14, 20);
    ctx.fillText(`Tick: ${tick}`, 14, 36);
  }, [activeStock, tick]);

  return (
    <div className="stock-game-root" style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem", color: "#0f172a" }}>
        <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "inline-flex", background: "#0b1220", padding: "6px", borderRadius: "12px", boxShadow: "0 16px 36px rgba(15,23,42,0.25)" }}>
          {["market", "automation", "docs"].map((tab) => (
            <button
              key={tab}
              className="tab-toggle"
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "linear-gradient(135deg, #2563eb, #22c55e)" : "transparent",
                color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px",
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 800,
                minWidth: "130px",
                boxShadow: activeTab === tab ? "0 10px 22px rgba(34,197,94,0.25)" : "none",
                width: "100%",
              }}
            >
              {tab === "market" ? "Market View" : tab === "automation" ? "Automation Code" : "Docs"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        </div>
      </div>

      {activeTab === "market" && (
        <div
          style={{
            background: "#0b1220",
            borderRadius: "16px",
            padding: "1rem",
            boxShadow: "0 24px 50px rgba(15,23,42,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Select stock</label>
              <select
                value={activeIndex}
                onChange={(e) => setActiveIndex(Number(e.target.value))}
                style={{
                  background: "#0f172a",
                  color: "#e2e8f0",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  padding: "10px",
                  minWidth: "200px",
                  fontWeight: 700,
                }}
              >
                {stockList.map((s, idx) => (
                  <option key={s.symbol} value={idx}>{s.symbol} — {s.name}</option>
                ))}
              </select>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Price: {formatMoney(activeStock.price)}</div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setRunning((r) => !r)}
                style={{
                  background: running ? "linear-gradient(135deg, #22c55e, #16a34a)" : "#1f2937",
                  color: "#f8fafc",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {running ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => {
                  setStockList(buildInitialStockList());
                  setTick(0);
                  setLog([{ text: "Reset market. Fresh start!", ts: Date.now() }]);
                  appendLog("Reset complete.");
                }}
                style={{
                  background: "#111827",
                  color: "#e2e8f0",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "0.6rem" }}>
            <span
              className="pulse-dot"
              key={tickPulse}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: "#22c55e",
                animation: "tickPulse 0.9s ease",
                boxShadow: "0 0 0 rgba(34,197,94,0.4)",
              }}
            />
            <small style={{ opacity: 0.85, fontWeight: 700, color: "#e2e8f0" }}>Execution pulses: {programSteps}</small>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Symbol</th>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Name</th>
                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Price</th>
                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {stockList.map((s, idx) => (
                    <tr key={s.symbol} style={{ background: idx === activeIndex ? "rgba(34,197,94,0.08)" : "transparent" }}>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{s.symbol}</td>
                      <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{s.name}</td>
                      <td style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: 700 }}>
                        {formatMoney(s.price)}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: 700 }}>
                        {s.portfolio.position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="stat-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            <div style={statCardStyle}>
              <p style={statLabel}>Cash</p>
              <p style={statValue}>{formatMoney(activeStock.portfolio.cash)}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabel}>Position</p>
              <p style={statValue}>{activeStock.portfolio.position} shares</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabel}>Avg Cost</p>
              <p style={statValue}>{activeStock.portfolio.position ? formatMoney(activeStock.portfolio.avgCost) : "—"}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabel}>Unrealized P&L</p>
              <p style={{ ...statValue, color: unrealized >= 0 ? "#22c55e" : "#ef4444" }}>
                {formatMoney(unrealized)}
              </p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabel}>Total Equity</p>
              <p style={statValue}>{formatMoney(totalEquity)}</p>
            </div>
          </div>

        </div>
      )}

      {activeTab === "automation" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "1rem",
            boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
            border: "1px solid #e2e8f0",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Automation Sandbox</h2>
            <div className="automation-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button style={pillBtnStyle} className="action-btn" onClick={startProgram}>
                Start Program
              </button>
              <button style={pillBtnStyle} className="action-btn" onClick={stopProgram}>
                Stop Program
              </button>
              <button style={pillBtnStyle} className="action-btn" onClick={compileAutomation}>
                Compile
              </button>
              <button
                style={pillBtnStyle}
                className="action-btn"
                onClick={() => {
                  try {
                    localStorage.setItem("smg_user_code", userCode || "");
                    appendLog("Saved code locally.");
                  } catch {
                    appendLog("Could not save code locally.");
                  }
                }}
              >
                Save Code
              </button>
              <button
                style={pillBtnStyle}
                className="action-btn"
                onClick={() => {
                  setUserCode(defaultScript);
                  compileAutomation();
                }}
              >
                Reset Code
              </button>
              <button
                style={pillBtnStyle}
                className="action-btn"
                onClick={() => {
                  setUserCode("");
                  setAutomationError("");
                  try {
                    localStorage.removeItem("smg_user_code");
                  } catch {
                    // ignore storage errors
                  }
                }}
              >
                Clear Code
              </button>
            </div>
          </div>
          <p style={{ color: "#475569", marginTop: "0.25rem" }}>
            Define <code>async function run(state, api, utils)</code>. You control the loop—use{" "}
            <code>while</code> + <code>await api.sleep(ms)</code> to tick. Helpers:{" "}
            <code>api.buy</code>, <code>api.sell</code>, <code>api.log</code>,{" "}
            <code>api.sleep</code>, and <code>utils.trend</code>/<code>utils.volatility</code>.
          </p>
          {automationError && (
            <div
              style={{
                marginBottom: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecdd3",
              }}
            >
              {automationError}
            </div>
          )}
          <div
            className="code-editor-wrap"
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflowX: "auto",
              overflowY: "hidden",
              boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
              maxWidth: "100%",
            }}
          >
            <Editor
              value={userCode}
              onValueChange={(code) => setUserCode(code)}
              highlight={highlightCode}
              padding={14}
              textareaId="automation-code-editor"
              textareaClassName="code-editor-textarea"
              spellCheck={false}
              style={{
                fontFamily:
                  "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                fontSize: "0.95rem",
                background: "#f8fafc",
                color: "#0f172a",
                minHeight: "280px",
                outline: "none",
                minWidth: "320px",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <h3 style={{ marginBottom: "0.35rem" }}>Recent Events</h3>
            <div
              className="events-box"
              style={{
                maxHeight: "200px",
                overflow: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "0.5rem",
                background: "#f8fafc",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {log.map((entry) => (
                <div
                  key={entry.ts + entry.text}
                  style={{ padding: "0.35rem 0.25rem", borderBottom: "1px solid #e2e8f0" }}
                >
                  <small style={{ color: "#64748b" }}>
                    {new Date(entry.ts).toLocaleTimeString()}
                  </small>
                  <div style={{ color: "#0f172a" }}>{entry.text}</div>
                </div>
              ))}
              {!log.length && <div style={{ color: "#64748b" }}>No events yet.</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "docs" && (
        <div
          className="doc-wrapper"
          ref={docContentRef}
          style={{
            background: "linear-gradient(135deg, #0b1220, #0f172a)",
            color: "#e2e8f0",
            borderRadius: "18px",
            padding: "1.1rem",
            boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          <div className="doc-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Stock Market Game Docs</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#cbd5e1", fontWeight: 700, fontSize: "0.95rem" }}>Built for small screens</span>
              <button
                style={{ ...pillBtnStyle, borderColor: "#22c55e", color: "#22c55e", background: "transparent" }}
                onClick={copyDocs}
              >
                Copy Docs
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={docCard}>
              <div style={docPill}>Access</div>
              <h4 style={docTitle}>How to get there</h4>
              <ul style={docList}>
                <li>Menu → <strong>Stock Market Game</strong> (<code>/market-sim</code>)</li>
              </ul>
            </div>
            <div style={docCard}>
              <div style={docPill}>Play</div>
              <h4 style={docTitle}>Playing the game</h4>
              <ul style={docList}>
                <li>Pick one of 10 stocks; each has its own price history and portfolio.</li>
                <li>Price updates about once per second with gentle drift and noise.</li>
                <li>Manual controls: Pause/Resume market, Reset (resets all stocks/portfolios).</li>
                <li>Dashboard shows cash, position, avg cost, unrealized P&L, equity for the selected stock.</li>
              </ul>
            </div>
            <div style={docCard}>
              <div style={docPill}>Bot</div>
              <h4 style={docTitle}>Writing a bot</h4>
              <ul style={docList}>
                <li>Define <code>async function run(state, api, utils)</code> and click <strong>Start Program</strong>.</li>
                <li>You control the loop (e.g., <code>while(true)</code> + <code>await api.sleep(ms)</code>).</li>
                <li><code>state</code>: <code>{`{ price, cash, position, avgCost, tick, history, stocks[] }`}</code></li>
                <li><code>api</code>: <code>buy(qty, target)</code>, <code>sell(qty, target)</code>, <code>log(message)</code>, <code>sleep(ms)</code> — target is required (index or symbol).</li>
                <li><code>utils</code>: <code>trend</code> (short-term delta), <code>volatility</code> (0–1 scale)</li>
              </ul>
            </div>
            <div style={docCard}>
              <div style={docPill}>Patterns</div>
              <h4 style={docTitle}>Data & structure tips</h4>
              <ul style={docList}>
                <li>You can use full JavaScript: objects, arrays, Maps/Sets, and classes.</li>
                <li>Maintain bot memory with module-level variables or closures inside <code>run</code>.</li>
                <li>Example: keep per-symbol positions in a <code>Map</code> or class and consult <code>state.stocks</code>.</li>
                <li><code>buy</code>/<code>sell</code> target a stock by index or symbol (required): <code>api.buy(1, 0)</code> or <code>api.buy(1, "ALPHA")</code>.</li>
                <li>Track moving averages: push to an array, slice the last N, compute your metric.</li>
                <li>Use classes to organize strategy: e.g., <code>class Trader {'{'} step(state) {'{'} ... {'}'} {'}'}</code> instantiated once.</li>
              </ul>
              <pre className="doc-code" style={docPre}>{`const memory = new Map();
class Trader {
  step(state, api) {
    const stats = memory.get(state.symbol) || { seen: 0 };
    stats.seen += 1;
    memory.set(state.symbol, stats);
    if (state.price < (state.history.at(-1) || state.price)) api.buy(1);
  }
}
const trader = new Trader();
async function run(state, api) {
  while (true) {
    trader.step(state, api);
    await api.sleep(900);
  }
}`}</pre>
            </div>
            <div style={docCard}>
              <div style={docPill}>Examples</div>
              <h4 style={docTitle}>Quick recipes</h4>
              <pre className="doc-code" style={docPre}>{`// Switch stocks by index
async function run(state, api) {
  let idx = 0;
  while (true) {
    const target = state.stocks[idx % state.stocks.length];
    if (target.price < target.history.at(-1)) api.buy(1, idx);
    idx++;
    await api.sleep(800);
  }
}`}</pre>
              <pre className="doc-code" style={docPre}>{`// Momentum on selected stock
async function run(state, api, utils) {
  while (true) {
    if (utils.trend > 0 && state.cash > state.price) api.buy(1);
    if (utils.trend < 0 && state.position > 0) api.sell(1);
    await api.sleep(900);
  }
}`}</pre>
              <pre className="doc-code" style={docPre}>{`// Hash map of caps and size adjustments
const caps = new Map();
caps.set("ALPHA", 5); caps.set("BETA", 2);
async function run(state, api) {
  const limit = caps.get(state.symbol) || 1;
  while (true) {
    if (state.position < limit && state.cash > state.price) api.buy(1, state.symbol);
    if (state.position > limit) api.sell(state.position - limit, state.symbol);
    await api.sleep(1000);
  }
}`}</pre>
              <pre className="doc-code" style={docPre}>{`// Class-based risk manager
class Risk {
  constructor(maxDraw = 0.05) { this.maxDraw = maxDraw; }
  shouldSell(state) {
    const peak = Math.max(...state.history.slice(-30));
    return state.price < peak * (1 - this.maxDraw) && state.position > 0;
  }
}
const risk = new Risk(0.03);
async function run(state, api) {
  while (true) {
    if (risk.shouldSell(state)) api.sell(state.position);
    await api.sleep(1200);
  }
}`}</pre>
            </div>
            <div style={docCard}>
              <div style={docPill}>Notes</div>
              <h4 style={docTitle}>Extra notes</h4>
              <ul style={docList}>
                <li>Bots run via <code>new Function</code> with a minimal API—keep code lightweight.</li>
                <li>Logs show bot and system events for debugging.</li>
                <li>Reset clears all portfolios, price history, and logs for quick iteration.</li>
                <li>Inspect other stocks via <code>state.stocks[index]</code> (symbol, price, cash, position, avgCost, history).</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .code-line { display: block; padding: 0 4px; }
        .code-line.active-line { background: #fce7f3; border-left: 3px solid #ec4899; }
        @keyframes linePulse { from { box-shadow: 0 0 0 0 rgba(236,72,153,0.35); } to { box-shadow: 0 0 0 16px rgba(236,72,153,0); } }
        @keyframes tickPulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); transform: scale(1); } 60% { box-shadow: 0 0 0 12px rgba(34,197,94,0); transform: scale(1.08); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); transform: scale(1); } }
        .stock-game-root { width: 100%; max-width: 1200px; margin: 0 auto; padding: 1rem; box-sizing: border-box; font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif; color: #0f172a; }
        .stock-game-root * { box-sizing: border-box; }
        .stock-game-root button,
        .stock-game-root input,
        .stock-game-root select,
        .stock-game-root textarea { font-family: inherit; font-size: inherit; }
        .code-editor-textarea { outline: none; }
        .tab-toggle { width: 100%; }
        .code-editor-wrap { max-width: 100%; }
        .events-box { max-width: 100%; }
        .automation-actions { width: 100%; }
        .automation-actions .action-btn { flex: 1 1 0; min-width: 140px; }
        .doc-code {
          background: #0b1220;
          color: #e2e8f0;
          padding: 0.75rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          overflow-x: auto;
        }
        @media (max-width: 900px) {
          .doc-grid { grid-template-columns: 1fr; gap: 0.85rem; }
        }
        @media (max-width: 640px) {
          .stat-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
          .responsive-stack {
            flex-direction: column;
            align-items: stretch;
          }
          .responsive-stack > div {
            width: 100%;
          }
          .tab-toggle {
            width: 100%;
            min-width: 0;
            text-align: center;
            padding: 10px 12px;
          }
          .doc-wrapper { padding: 0.9rem; }
          .doc-header h2 { font-size: 1.1rem; }
          .doc-grid { gap: 0.75rem; }
          .doc-card { padding: 0.65rem; }
          .automation-actions .action-btn {
            flex: 1 1 100%;
            width: 100%;
            justify-content: center;
            text-align: center;
          }
          .events-box {
            max-height: 160px;
            padding: 0.4rem;
            font-size: 0.92rem;
            word-break: break-word;
            white-space: pre-wrap;
          }
          .pulse-dot {
            width: 10px !important;
            height: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

const statCardStyle = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  border: "1px solid rgba(226,232,240,0.3)",
  borderRadius: "12px",
  padding: "0.75rem 0.85rem",
  color: "#e2e8f0",
};

const statLabel = { margin: 0, fontSize: "0.85rem", color: "#cbd5e1" };
const statValue = { margin: 0, fontSize: "1.1rem", fontWeight: 800 };

const actionBtnStyle = {
  background: "#0f172a",
  color: "#e2e8f0",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "0 8px 18px rgba(15,23,42,0.25)",
};

const pillBtnStyle = {
  background: "#0f172a",
  color: "#e2e8f0",
  border: "1px solid #e2e8f0",
  borderRadius: "999px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
};

const docCard = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "0.75rem",
  color: "#e2e8f0",
};

const docTitle = { margin: "0 0 0.35rem 0", color: "#cbd5e1" };
const docList = { margin: 0, paddingLeft: "1.1rem", color: "#cbd5e1", lineHeight: 1.6, wordWrap: "break-word" };
const docPill = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(16,185,129,0.45))",
  color: "#0b1220",
  borderRadius: "999px",
  padding: "4px 10px",
  fontWeight: 800,
  fontSize: "0.75rem",
  letterSpacing: "0.02em",
};
const docPre = {
  background: "#f8fafc",
  color: "#0f172a",
  borderRadius: "10px",
  padding: "0.75rem",
  border: "1px solid #e2e8f0",
  overflowX: "auto",
  fontSize: "0.85rem",
  boxShadow: "inset 0 1px 0 rgba(15,23,42,0.04)",
  whiteSpace: "pre-wrap",
  wordWrap: "break-word",
  fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};
