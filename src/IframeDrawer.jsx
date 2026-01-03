import React, { useEffect, useMemo, useState } from "react";
import { useFlyout } from "./context/FlyoutContext";
import { useAppDispatch, useAppState, actions } from "./context/AppContext";
import { GiConsoleController } from "react-icons/gi";

const HISTORY_KEY = "iframe_history";
const MAX_HISTORY = 10;

export default function IframeDrawer() {
  const [input, setInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [tab, setTab] = useState("viewer"); // viewer | duck | urls
  const { showMessage } = useFlyout();
  const { iframeSearchText } = useAppState();
  const dispatch = useAppDispatch();
  const copyForIncognito = async (url) => {
    const text = url || "";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert("URL copied. Open Chrome Incognito and paste it manually.");
        return;
      }
    } catch {
      // fall through to prompt
    }
    window.prompt("Copy this URL for Incognito:", text);
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(saved)) {
        setHistory(saved.slice(0, MAX_HISTORY));
        if (saved[0]) {
          setCurrentUrl(saved[0]);
          setInput(saved[0]);
        }
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const saveHistory = (nextUrl) => {
    const trimmed = (nextUrl || "").trim();
    if (!trimmed) return;
    const nextHistory = [trimmed, ...history.filter((u) => u !== trimmed)].slice(0, MAX_HISTORY);
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const removeFromHistory = (urlToRemove) => {
    const nextHistory = history.filter((u) => u !== urlToRemove);
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const handleLoad = () => {
    const trimmed = (input || "").trim();
    if (!trimmed) return;
    setCurrentUrl(trimmed);
    saveHistory(trimmed);
  };

  const handleSearch = async () => {
    const trimmed = (query || "").trim();
    if (!trimmed) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    try {
      const resp = await fetch(`/api/websearch?q=${encodeURIComponent(trimmed)}`);
      if (!resp.ok) throw new Error(`Search failed (${resp.status})`);
      const data = await resp.json();
      const list = Array.isArray(data?.results) ? data.results.slice(0, 20) : [];
      setResults(list);
      const chosen = data?.preferredUrl || list[0]?.url || null;
      if (chosen) {
        setCurrentUrl(chosen);
        setInput(chosen);
        saveHistory(chosen);
        setTab("viewer");
        showMessage?.({ type: "success", message: `Loaded ${chosen}`, duration: 2000 });
      } else {
        showMessage?.({ type: "error", message: "No reachable results found.", duration: 2000 });
      }
    } catch (err) {
      setSearchError(err?.message || "Search failed.");
      showMessage?.({ type: "error", message: err?.message || "Search failed.", duration: 2000 });
    } finally {
      setSearching(false);
    }
  };

  const hasUrl = useMemo(() => Boolean((currentUrl || "").trim()), [currentUrl]);

  // Triggered when other parts of the app set iframeSearchText (e.g., ActionButtons)
  useEffect(() => {
    console.log({ iframeSearchText });
    if (!iframeSearchText) return;
    setTab("duck");
    setQuery(iframeSearchText);
    setTimeout(() => {
      handleSearch();
    }, 0);
    // clear it so subsequent clicks re-seed correctly
    dispatch(actions.setIframeSearchText(""));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeSearchText]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className={`btn ${tab === "viewer" ? "primary-btn" : "secondary-btn"}`} onClick={() => setTab("viewer")}>
          Viewer
        </button>
        <button className={`btn ${tab === "urls" ? "primary-btn" : "secondary-btn"}`} onClick={() => setTab("urls")}>
          URLs
        </button>
        <button className={`btn ${tab === "duck" ? "primary-btn" : "secondary-btn"}`} onClick={() => setTab("duck")}>
          DuckDuckGo
        </button>
      </div>

      {tab === "duck" && (
        <>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 800, color: "#0f172a" }}>Search (DuckDuckGo)</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ flex: "1 1 260px" }}
                placeholder="Search the web..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button className="btn primary-btn" onClick={handleSearch} disabled={searching || !query.trim()}>
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
            {searchError && <div style={{ color: "#dc2626", fontSize: 13 }}>{searchError}</div>}
          </div>
          {results.length > 0 && (
            <div style={{ display: "grid", gap: 6 }}>
              <div className="cp-muted" style={{ fontSize: 13 }}>Click a result to open it in the viewer tab.</div>
              {results.map((r, idx) => (
                <button
                  key={`${r.url}-${idx}`}
                  className="btn secondary-btn"
                  style={{
                    justifyContent: "flex-start",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  onClick={() => {
                    setCurrentUrl(r.url);
                    setInput(r.url);
                    saveHistory(r.url);
                    setTab("viewer");
                  }}
                >
                  {idx + 1}. {r.title}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "viewer" && (
        <>
          {hasUrl ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div className="cp-muted" style={{ fontSize: 12 }}>
                Note: many sites block embedding via Content-Security-Policy. If the iframe is blank, use “Open in new tab”.
              </div>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", minHeight: 360 }}>
                <iframe
                  src={currentUrl}
                  title="Iframe Viewer"
                  style={{ width: "100%", height: "420px", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                />
              </div>
              <div>
                <a className="btn secondary-btn" href={currentUrl} target="_blank" rel="noreferrer">
                  Open in new tab
                </a>
              </div>
            </div>
          ) : (
            <div className="cp-muted">Enter a URL to load it here.</div>
          )}
        </>
      )}

      {tab === "urls" && (
        <>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 800, color: "#0f172a" }}>Iframe URL</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ flex: "1 1 260px" }}
                placeholder="https://example.com"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="btn primary-btn" onClick={() => { handleLoad(); setTab("viewer"); }} disabled={!input.trim()}>
                Open in Viewer
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800, color: "#0f172a" }}>Recent URLs (last {MAX_HISTORY})</div>
              <div style={{ display: "grid", gap: 6 }}>
                {history.map((u, idx) => (
                  <div
                    key={u}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "space-between",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "6px 8px",
                      background: "#fff",
                    }}
                  >
                    <button
                      className="btn secondary-btn"
                      style={{
                        justifyContent: "flex-start",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: 12,
                        flex: 1,
                        minWidth: 0,
                      }}
                      title={u}
                      onClick={() => {
                        setCurrentUrl(u);
                        setInput(u);
                        setTab("viewer");
                      }}
                    >
                      {idx + 1}. {u.length > 36 ? `${u.slice(0, 36)}…` : u}
                    </button>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <a
                        className="btn secondary-btn"
                        style={{ minWidth: 38 }}
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in new tab"
                      >
                        ↗
                      </a>
                      <button
                        className="btn"
                        style={{ minWidth: 38 }}
                        onClick={() => removeFromHistory(u)}
                        aria-label={`Remove ${u}`}
                        title="Remove from history"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
