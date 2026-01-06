import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

const defaultScript = `async function run(state, api, utils) {
  let toggle = false;
  while (true) {
    if (toggle && state.cash > state.price) api.buy(1);
    if (!toggle && state.position > 0) api.sell(1);
    toggle = !toggle;
    await api.sleep(900);
  }
}`;

function formatMoney(v) {
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const [price, setPrice] = useState(100);
  const [history, setHistory] = useState(() => Array.from({ length: 120 }, () => 100));
  const [tick, setTick] = useState(0);
  const [portfolio, setPortfolio] = useState({ cash: 10000, position: 0, avgCost: 0 });
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

  const unrealized = useMemo(() => {
    const pnl = (price - portfolio.avgCost) * portfolio.position;
    return isFinite(pnl) ? pnl : 0;
  }, [price, portfolio]);

  const totalEquity = useMemo(() => portfolio.cash + portfolio.position * price, [portfolio, price]);

  const appendLog = (text) => {
    setLog((prev) => {
      const entry = { text, ts: Date.now() };
      const next = [entry, ...prev];
      return next.slice(0, 60);
    });
  };

  const trade = (type, qty) => {
    const q = Math.max(0, Math.floor(qty));
    if (!q) return;
    setPortfolio((prev) => {
      const nowPrice = stateRef.current?.price ?? price;
      if (type === "buy") {
        const cost = nowPrice * q;
        if (cost > prev.cash) {
          appendLog(`Not enough cash to buy ${q}`);
          return prev;
        }
        const newPosition = prev.position + q;
        const newAvg =
          newPosition === 0 ? 0 : (prev.avgCost * prev.position + cost) / newPosition;
        appendLog(`Bought ${q} @ ${formatMoney(nowPrice)}`);
        return { cash: prev.cash - cost, position: newPosition, avgCost: newAvg };
      }
      if (type === "sell") {
        const sellQty = Math.min(q, prev.position);
        if (sellQty <= 0) {
          appendLog("Nothing to sell");
          return prev;
        }
        const revenue = nowPrice * sellQty;
        const remaining = prev.position - sellQty;
        const newAvg = remaining === 0 ? 0 : prev.avgCost;
        appendLog(`Sold ${sellQty} @ ${formatMoney(nowPrice)}`);
        return { cash: prev.cash + revenue, position: remaining, avgCost: newAvg };
      }
      return prev;
    });
  };

  const buy = (qty) => trade("buy", qty);
  const sell = (qty) => trade("sell", qty);

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
      buy: (qty) => {
        if (programTokenRef.current !== token) return;
        buy(qty);
      },
      sell: (qty) => {
        if (programTokenRef.current !== token) return;
        sell(qty);
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

  useEffect(() => {
    setCurrentLine(null);
  }, [userCode]);


  useEffect(() => {
    stateRef.current = { price, history, tick, ...portfolio };
  }, [price, history, tick, portfolio]);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setTick((t) => {
        const nextTick = t + 1;
        setPrice((prev) => {
          const wave = Math.sin(nextTick / 14) * 0.6;
          const noise = (Math.random() - 0.5) * 2.1;
          const drift = 0.15;
          const next = clampPrice(prev * (1 + (wave + noise + drift) / 100));
          setHistory((h) => [...h.slice(-119), next]);
          return next;
        });
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

    const series = history.slice(-120);
    const min = Math.min(...series, price) * 0.98;
    const max = Math.max(...series, price) * 1.02;
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
    ctx.fillText(`Price: ${formatMoney(price)}`, 14, 20);
    ctx.fillText(`Tick: ${tick}`, 14, 36);
  }, [history, price, tick]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem", color: "#0f172a" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0b1220", color: "#e2e8f0", padding: "8px 10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)" }}>
            <span
              key={tickPulse}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                background: "#22c55e",
                animation: "tickPulse 0.9s ease",
                boxShadow: "0 0 0 rgba(34,197,94,0.4)",
              }}
            />
            <small style={{ opacity: 0.85, fontWeight: 700 }}>Execution pulses: {programSteps}</small>
          </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Synthetic Market</div>
              <div style={{ fontSize: "1.6rem", color: "#e2e8f0", fontWeight: 800 }}>
                {formatMoney(price)}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
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
                  setPrice(100);
                  setHistory(Array.from({ length: 120 }, () => 100));
                  setPortfolio({ cash: 10000, position: 0, avgCost: 0 });
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

          <div style={{ marginTop: "1rem" }} ref={canvasWrapRef}>
            <canvas ref={canvasRef} />
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
              <p style={statValue}>{formatMoney(portfolio.cash)}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabel}>Position</p>
              <p style={statValue}>{portfolio.position} shares</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabel}>Avg Cost</p>
              <p style={statValue}>{portfolio.position ? formatMoney(portfolio.avgCost) : "—"}</p>
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
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Automation Sandbox</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button style={pillBtnStyle} onClick={startProgram}>
                Start Program
              </button>
              <button style={pillBtnStyle} onClick={stopProgram}>
                Stop Program
              </button>
              <button style={pillBtnStyle} onClick={compileAutomation}>
                Compile
              </button>
              <button
                style={pillBtnStyle}
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
                onClick={() => {
                  setUserCode(defaultScript);
                  compileAutomation();
                }}
              >
                Reset Code
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
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
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
              }}
            />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <h3 style={{ marginBottom: "0.35rem" }}>Recent Events</h3>
            <div
              style={{
                maxHeight: "180px",
                overflow: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "0.5rem",
                background: "#f8fafc",
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
            <span style={{ color: "#cbd5e1", fontWeight: 700, fontSize: "0.95rem" }}>Built for small screens</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={docCard}>
              <div style={docPill}>API</div>
              <h4 style={docTitle}>Automation API</h4>
              <ul style={docList}>
                <li><code>async function run(state, api, utils)</code> (click <strong>Start Program</strong>)</li>
                <li>You control the loop (e.g., <code>while(true)</code> + <code>await api.sleep(ms)</code>)</li>
                <li><code>state</code>: price, cash, position, avgCost, tick, history[]</li>
                <li><code>api.buy(qty)</code>, <code>api.sell(qty)</code>, <code>api.log(msg)</code></li>
                <li><code>utils.trend</code> (delta), <code>utils.volatility</code> (0–1)</li>
              </ul>
            </div>
            <div style={docCard}>
              <div style={docPill}>Starter</div>
              <h4 style={docTitle}>How to write your bot</h4>
              <ul style={docList}>
                <li>Define <code>async function run(state, api, utils)</code>.</li>
                <li>Use a loop you control (e.g., <code>while(true)</code>).</li>
                <li>Call <code>await api.sleep(ms)</code> to pace ticks.</li>
                <li>Use <code>api.buy(qty)</code> / <code>api.sell(qty)</code> for trades.</li>
                <li>Log decisions with <code>api.log("message")</code>.</li>
              </ul>
            </div>
            <div style={docCard}>
              <div style={docPill}>Play</div>
              <h4 style={docTitle}>Gameplay</h4>
              <ul style={docList}>
                <li>Canvas shows synthetic price with grid + area fill</li>
                <li>Controls: Pause/Resume, Reset (trading is code-driven)</li>
                <li>Stats: cash, position, avg cost, unrealized P&L, equity</li>
              </ul>
            </div>
            <div style={docCard}>
              <div style={docPill}>Tips</div>
              <h4 style={docTitle}>Best Practices</h4>
              <ul style={docList}>
                <li>Keep bots light; code executes each step</li>
                <li>Use <code>api.log</code> for decisions</li>
                <li>Reset to clear portfolio and logs</li>
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
        .code-editor-textarea { outline: none; }
        .tab-toggle { width: 100%; }
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
};
