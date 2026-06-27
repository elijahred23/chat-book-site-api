import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaClock,
  FaCopy,
  FaDesktop,
  FaExternalLinkAlt,
  FaGlobe,
  FaHistory,
  FaMobileAlt,
  FaRedoAlt,
  FaSearch,
  FaTabletAlt,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";
import { useFlyout } from "./context/FlyoutContext";
import { useAppDispatch, useAppState, actions } from "./context/AppContext";
import "./IframeDrawer.css";

const HISTORY_KEY = "iframe_history";
const MAX_HISTORY = 12;

const VIEWPORTS = {
  responsive: { label: "Fit", icon: FaDesktop },
  tablet: { label: "Tablet", icon: FaTabletAlt },
  mobile: { label: "Mobile", icon: FaMobileAlt },
};

function normalizeUrl(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  const explicitScheme = trimmed.match(/^([a-z][a-z\d+.-]*):\/\//i);
  if (explicitScheme && !/^https?:\/\//i.test(trimmed)) return "";
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

function getUrlMeta(value) {
  try {
    const parsed = new URL(value);
    return {
      hostname: parsed.hostname.replace(/^www\./, ""),
      initial: parsed.hostname.replace(/^www\./, "").charAt(0).toUpperCase(),
    };
  } catch {
    return { hostname: value, initial: "W" };
  }
}

export default function IframeDrawer() {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(-1);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [tab, setTab] = useState("viewer");
  const [viewport, setViewport] = useState("responsive");
  const [frameKey, setFrameKey] = useState(0);
  const [frameLoading, setFrameLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);
  const { showMessage } = useFlyout();
  const { iframeSearchText } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(saved)) setHistory(saved.filter(normalizeUrl).slice(0, MAX_HISTORY));
    } catch {
      setHistory([]);
    }
    return () => window.clearTimeout(copyTimerRef.current);
  }, []);

  const saveHistory = useCallback((nextUrl) => {
    setHistory((previous) => {
      const next = [nextUrl, ...previous.filter((url) => url !== nextUrl)].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // The in-memory history still works when storage is unavailable.
      }
      return next;
    });
  }, []);

  const navigate = useCallback((rawUrl, { addToSession = true } = {}) => {
    const nextUrl = normalizeUrl(rawUrl);
    if (!nextUrl) {
      setInputError("Enter a valid http or https web address.");
      return false;
    }

    setInputError("");
    setInput(nextUrl);
    setCurrentUrl(nextUrl);
    setFrameLoading(true);
    setFrameKey((key) => key + 1);
    saveHistory(nextUrl);

    if (addToSession) {
      setSessionHistory((previous) => {
        const next = [...previous.slice(0, sessionIndex + 1), nextUrl];
        setSessionIndex(next.length - 1);
        return next;
      });
    }
    return true;
  }, [saveHistory, sessionIndex]);

  const submitAddress = (event) => {
    event?.preventDefault();
    if (navigate(input)) {
      setActiveResultIndex(-1);
      setTab("viewer");
    }
  };

  const handleSearch = useCallback(async (searchValue) => {
    const trimmed = (searchValue ?? query).trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSearching(true);
    setSearchError("");
    setResults([]);
    setActiveResultIndex(-1);

    try {
      const response = await fetch(`/api/websearch?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error(`Search failed (${response.status})`);
      const data = await response.json();
      const list = Array.isArray(data?.results)
        ? data.results.filter((result) => normalizeUrl(result?.url)).slice(0, 20)
        : [];
      setResults(list);
      if (!list.length) setSearchError("No web results found. Try a different phrase.");
    } catch (error) {
      const message = error?.message || "Search failed. Please try again.";
      setSearchError(message);
      showMessage?.({ type: "error", message, duration: 2500 });
    } finally {
      setSearching(false);
    }
  }, [query, showMessage]);

  useEffect(() => {
    if (!iframeSearchText) return;
    setTab("search");
    setQuery(iframeSearchText);
    handleSearch(iframeSearchText);
    dispatch(actions.setIframeSearchText(""));
  }, [dispatch, handleSearch, iframeSearchText]);

  const navigateToResult = useCallback((index) => {
    const result = results[index];
    if (!result || !navigate(result.url)) return;
    setActiveResultIndex(index);
    setTab("viewer");
  }, [navigate, results]);

  const goBack = () => {
    if (activeResultIndex >= 0) {
      navigateToResult(activeResultIndex - 1);
      return;
    }
    if (sessionIndex <= 0) return;
    const nextIndex = sessionIndex - 1;
    setSessionIndex(nextIndex);
    navigate(sessionHistory[nextIndex], { addToSession: false });
  };

  const goForward = () => {
    if (activeResultIndex >= 0) {
      navigateToResult(activeResultIndex + 1);
      return;
    }
    if (sessionIndex >= sessionHistory.length - 1) return;
    const nextIndex = sessionIndex + 1;
    setSessionIndex(nextIndex);
    navigate(sessionHistory[nextIndex], { addToSession: false });
  };

  const copyUrl = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this URL:", currentUrl);
    }
  };

  const removeFromHistory = (urlToRemove) => {
    setHistory((previous) => {
      const next = previous.filter((url) => url !== urlToRemove);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // The in-memory history still works when storage is unavailable.
      }
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // The in-memory history is already cleared.
    }
  };

  const hasUrl = Boolean(currentUrl);
  const currentMeta = useMemo(() => getUrlMeta(currentUrl), [currentUrl]);
  const isViewingSearchResult = activeResultIndex >= 0 && activeResultIndex < results.length;
  const canGoBack = isViewingSearchResult ? activeResultIndex > 0 : sessionIndex > 0;
  const canGoForward = isViewingSearchResult
    ? activeResultIndex < results.length - 1
    : sessionIndex < sessionHistory.length - 1;

  return (
    <section className="iframe-viewer">
      <nav className="iframe-viewer__tabs" aria-label="Iframe viewer sections">
        {[
          { key: "viewer", label: "Viewer", icon: FaGlobe },
          { key: "search", label: "Web search", icon: FaSearch },
          { key: "history", label: "Recent", icon: FaHistory, count: history.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            className={tab === key ? "is-active" : ""}
            type="button"
            key={key}
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {count > 0 && <span className="iframe-viewer__tab-count">{count}</span>}
          </button>
        ))}
      </nav>

      {tab === "viewer" && (
        <div className="iframe-viewer__viewer">
          <form className="iframe-viewer__address" onSubmit={submitAddress}>
            <div className={`iframe-viewer__address-field ${inputError ? "has-error" : ""}`}>
              <FaGlobe aria-hidden="true" />
              <label className="ui-sr-only" htmlFor="iframe-address">Web address</label>
              <input
                id="iframe-address"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="Paste a web address"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (inputError) setInputError("");
                }}
              />
              {input && (
                <button type="button" onClick={() => setInput("")} aria-label="Clear address">
                  <FaTimes aria-hidden="true" />
                </button>
              )}
            </div>
            <button className="iframe-viewer__go" type="submit" disabled={!input.trim()}>Go</button>
          </form>
          {inputError && <p className="iframe-viewer__error" role="alert">{inputError}</p>}

          {hasUrl ? (
            <>
              <div className="iframe-viewer__toolbar">
                <div className="iframe-viewer__nav-actions">
                  <button type="button" onClick={goBack} disabled={!canGoBack} aria-label={isViewingSearchResult ? "Previous search result" : "Previous page"} title={isViewingSearchResult ? "Previous search result" : "Previous page"}><FaArrowLeft /></button>
                  {isViewingSearchResult && (
                    <span className="iframe-viewer__result-position" aria-live="polite">
                      {activeResultIndex + 1} / {results.length}
                    </span>
                  )}
                  <button type="button" onClick={goForward} disabled={!canGoForward} aria-label={isViewingSearchResult ? "Next search result" : "Next page"} title={isViewingSearchResult ? "Next search result" : "Next page"}><FaArrowRight /></button>
                  <button type="button" onClick={() => { setFrameLoading(true); setFrameKey((key) => key + 1); }} aria-label="Reload page" title="Reload page"><FaRedoAlt /></button>
                </div>

                <div className="iframe-viewer__viewport-switcher" aria-label="Preview size">
                  {Object.entries(VIEWPORTS).map(([key, item]) => {
                    const Icon = item.icon;
                    return (
                      <button
                        type="button"
                        key={key}
                        className={viewport === key ? "is-active" : ""}
                        onClick={() => setViewport(key)}
                        aria-label={`${item.label} preview`}
                        title={`${item.label} preview`}
                      >
                        <Icon aria-hidden="true" /><span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="iframe-viewer__page-actions">
                  <button type="button" onClick={copyUrl} aria-label="Copy address" title="Copy address">
                    {copied ? <FaCheck className="is-success" /> : <FaCopy />}
                  </button>
                  <a href={currentUrl} target="_blank" rel="noreferrer" aria-label="Open in new tab" title="Open in new tab"><FaExternalLinkAlt /></a>
                </div>
              </div>

              <div className={`iframe-viewer__stage iframe-viewer__stage--${viewport}`}>
                <div className="iframe-viewer__frame-shell">
                  {frameLoading && (
                    <div className="iframe-viewer__loading" role="status">
                      <span className="iframe-viewer__spinner" />
                      <span>Loading {currentMeta.hostname}…</span>
                    </div>
                  )}
                  <iframe
                    key={frameKey}
                    src={currentUrl}
                    title={`Viewing ${currentMeta.hostname}`}
                    onLoad={() => setFrameLoading(false)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </div>

              <div className="iframe-viewer__embed-note">
                <span aria-hidden="true">i</span>
                <p><strong>Nothing showing?</strong> Some websites block embedded viewing. <a href={currentUrl} target="_blank" rel="noreferrer">Open this page in a new tab</a> instead.</p>
              </div>
            </>
          ) : (
            <div className="iframe-viewer__empty">
              <span className="iframe-viewer__empty-icon"><FaGlobe aria-hidden="true" /></span>
              <h3>Browse without leaving your workspace</h3>
              <p>Enter a website above, choose a recent page, or search the web.</p>
              <button type="button" onClick={() => setTab("search")}><FaSearch /> Search the web</button>
            </div>
          )}
        </div>
      )}

      {tab === "search" && (
        <div className="iframe-viewer__panel">
          <div className="iframe-viewer__panel-heading">
            <span className="iframe-viewer__panel-icon"><FaSearch /></span>
            <div><h3>Search the web</h3><p>Find a page, then open it directly in the viewer.</p></div>
          </div>
          <form className="iframe-viewer__search" onSubmit={(event) => { event.preventDefault(); handleSearch(query); }}>
            <FaSearch aria-hidden="true" />
            <label className="ui-sr-only" htmlFor="iframe-search">Search the web</label>
            <input id="iframe-search" placeholder="What do you want to find?" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button type="submit" disabled={searching || !query.trim()}>{searching ? "Searching…" : "Search"}</button>
          </form>
          {searchError && <p className="iframe-viewer__error" role="alert">{searchError}</p>}
          {searching && (
            <div className="iframe-viewer__searching" role="status"><span className="iframe-viewer__spinner" />Searching the web…</div>
          )}
          {!searching && results.length > 0 && (
            <div className="iframe-viewer__results">
              <div className="iframe-viewer__result-summary"><span>Results for “{query}”</span><span>{results.length} pages</span></div>
              {results.map((result, index) => {
                const meta = getUrlMeta(result.url);
                return (
                  <article className="iframe-viewer__result" key={`${result.url}-${index}`}>
                    <span className="iframe-viewer__site-icon">{meta.initial}</span>
                    <button type="button" onClick={() => navigateToResult(index)}>
                      <span className="iframe-viewer__result-host">{meta.hostname}</span>
                      <strong>{result.title || meta.hostname}</strong>
                      {result.snippet && <span className="iframe-viewer__result-snippet">{result.snippet}</span>}
                    </button>
                    <a href={normalizeUrl(result.url)} target="_blank" rel="noreferrer" aria-label={`Open ${result.title || meta.hostname} in a new tab`}><FaExternalLinkAlt /></a>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="iframe-viewer__panel">
          <div className="iframe-viewer__history-heading">
            <div className="iframe-viewer__panel-heading">
              <span className="iframe-viewer__panel-icon"><FaClock /></span>
              <div><h3>Recently viewed</h3><p>Your last {MAX_HISTORY} pages are stored on this device.</p></div>
            </div>
            {history.length > 0 && <button className="iframe-viewer__clear" type="button" onClick={clearHistory}><FaTrashAlt /> Clear all</button>}
          </div>

          {history.length > 0 ? (
            <div className="iframe-viewer__history-list">
              {history.map((url) => {
                const meta = getUrlMeta(url);
                return (
                  <article className="iframe-viewer__history-item" key={url}>
                    <span className="iframe-viewer__site-icon">{meta.initial}</span>
                    <button type="button" onClick={() => { setActiveResultIndex(-1); navigate(url); setTab("viewer"); }}>
                      <strong>{meta.hostname}</strong><span>{url}</span>
                    </button>
                    <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${meta.hostname} in a new tab`}><FaExternalLinkAlt /></a>
                    <button type="button" onClick={() => removeFromHistory(url)} aria-label={`Remove ${meta.hostname} from history`}><FaTimes /></button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="iframe-viewer__empty iframe-viewer__empty--compact">
              <span className="iframe-viewer__empty-icon"><FaHistory /></span>
              <h3>No recent pages yet</h3><p>Pages you view will appear here for quick access.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
