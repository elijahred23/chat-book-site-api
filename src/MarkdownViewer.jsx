import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { FaBackward, FaForward, FaPause, FaPlay, FaPlus, FaMinus, FaStepBackward, FaStepForward, FaUndoAlt, FaRedoAlt } from "react-icons/fa";
import { useAppState } from "./context/AppContext";
import { useFlyout } from "./context/FlyoutContext";
import ActionButtons from "./ui/ActionButtons";

const SAMPLE_MARKDOWN = `# Markdown Viewer

Paste markdown here, upload a .md file, or send markdown from an Action Button.

- Lists render as lists
- **Bold** and _italic_ text stay formatted
- Code blocks remain intact

\`\`\`js
console.log("Markdown stays raw when opened from ActionButtons");
\`\`\`
`;

const getWordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const SCROLL_SPEED_STORAGE_KEY = "markdown-viewer-scroll-speed";
const LOOP_STORAGE_KEY = "markdown-viewer-scroll-loop";
const RESTART_DELAY_STORAGE_KEY = "markdown-viewer-restart-delay";

const readStoredScrollSpeed = () => {
  if (typeof window === "undefined") return 30;

  try {
    const rawValue = window.localStorage.getItem(SCROLL_SPEED_STORAGE_KEY);
    if (rawValue === null || rawValue.trim() === "") return 30;
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) return 30;
    return Math.max(5, Math.min(200, parsedValue));
  } catch {
    return 30;
  }
};

const readStoredLoopEnabled = () => {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(LOOP_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const readStoredRestartDelay = () => {
  if (typeof window === "undefined") return 3;

  try {
    const rawValue = window.localStorage.getItem(RESTART_DELAY_STORAGE_KEY);
    if (rawValue === null || rawValue.trim() === "") return 3;
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) return 3;
    return Math.max(0, Math.min(60, parsedValue));
  } catch {
    return 3;
  }
};

export default function MarkdownViewer() {
  const { markdownViewerText } = useAppState();
  const { showMessage } = useFlyout();
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [filename, setFilename] = useState("markdown-viewer.md");
  const [view, setView] = useState("split");
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isLooping, setIsLooping] = useState(() => readStoredLoopEnabled());
  const [scrollSpeed, setScrollSpeed] = useState(() => readStoredScrollSpeed());
  const [restartDelay, setRestartDelay] = useState(() => readStoredRestartDelay());
  const [scrollDirection, setScrollDirection] = useState(1);
  const printContentRef = useRef(null);
  const previewRef = useRef(null);
  const scrollSpeedRef = useRef(scrollSpeed);
  const restartDelayRef = useRef(restartDelay);
  const scrollDirectionRef = useRef(scrollDirection);
  const holdMultiplierRef = useRef(1);
  const loopTimeoutRef = useRef(null);
  const showEditor = view === "split" || view === "edit";
  const showPreview = view === "split" || view === "preview";
  const preventSelection = (event) => event.preventDefault();

  const clearLoopTimeout = () => {
    if (!loopTimeoutRef.current) return;
    clearTimeout(loopTimeoutRef.current);
    loopTimeoutRef.current = null;
  };

  useEffect(() => {
    if (markdownViewerText !== undefined) {
      setMarkdown(markdownViewerText);
      setView("preview");
    }
  }, [markdownViewerText]);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
    try {
      window.localStorage.setItem(SCROLL_SPEED_STORAGE_KEY, String(scrollSpeed));
    } catch {
      // Ignore storage failures and keep the in-memory value.
    }
  }, [scrollSpeed]);

  useEffect(() => {
    scrollDirectionRef.current = scrollDirection;
  }, [scrollDirection]);

  useEffect(() => {
    restartDelayRef.current = restartDelay;
    try {
      window.localStorage.setItem(RESTART_DELAY_STORAGE_KEY, String(restartDelay));
    } catch {
      // Ignore storage failures and keep the in-memory value.
    }
  }, [restartDelay]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOOP_STORAGE_KEY, String(isLooping));
    } catch {
      // Ignore storage failures and keep the in-memory value.
    }
  }, [isLooping]);

  useEffect(() => () => {
    clearLoopTimeout();
  }, []);

  useEffect(() => {
    if (!isAutoScrolling || !showPreview) return undefined;

    let animationFrame;
    let previousTime = null;
    let preciseScrollTop = previewRef.current?.scrollTop ?? 0;

    const scroll = (timestamp) => {
      const preview = previewRef.current;

      if (previousTime === null) previousTime = timestamp;
      const elapsedSeconds = Math.min((timestamp - previousTime) / 1000, 0.1);
      previousTime = timestamp;

      if (preview) {
        const maxScrollTop = Math.max(0, preview.scrollHeight - preview.clientHeight);
        if (Math.abs(preview.scrollTop - preciseScrollTop) > 1) {
          preciseScrollTop = preview.scrollTop;
        }
        const distance =
          scrollDirectionRef.current *
          scrollSpeedRef.current *
          holdMultiplierRef.current *
          elapsedSeconds;
        const nextScrollTop = Math.max(0, Math.min(maxScrollTop, preciseScrollTop + distance));

        preciseScrollTop = nextScrollTop;
        preview.scrollTop = nextScrollTop;

        const reachedEnd =
          (scrollDirectionRef.current > 0 && nextScrollTop >= maxScrollTop) ||
          (scrollDirectionRef.current < 0 && nextScrollTop <= 0);

        if (reachedEnd) {
          holdMultiplierRef.current = 1;
          if (isLooping && preview) {
            setIsAutoScrolling(false);
            loopTimeoutRef.current = setTimeout(() => {
              const nextPreview = previewRef.current;
              if (!nextPreview) return;
              nextPreview.scrollTop = 0;
              setIsAutoScrolling(true);
            }, restartDelayRef.current * 1000);
            return;
          }

          setIsAutoScrolling(false);
          return;
        }
      }

      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [isAutoScrolling, isLooping, showPreview]);

  useEffect(() => {
    if (isLooping) return undefined;
    clearLoopTimeout();
  }, [isLooping]);

  const stats = useMemo(
    () => ({
      chars: markdown.length,
      words: markdown.trim() ? getWordCount(markdown) : 0,
      lines: markdown ? markdown.split(/\r\n|\r|\n/).length : 0,
    }),
    [markdown]
  );

  const handleUpload = async (file) => {
    if (!file) return;
    const content = await file.text();
    setMarkdown(content);
    setFilename(file.name?.endsWith(".md") ? file.name : "uploaded.md");
    showMessage?.({ type: "success", message: "Markdown uploaded." });
  };

  const downloadMarkdown = async () => {
    try {
      const safeName = filename.trim().endsWith(".md") ? filename.trim() : `${filename.trim() || "markdown"}.md`;
      const blob = new Blob([markdown || ""], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showMessage?.({ type: "success", message: `Downloaded ${safeName}` });
    } catch (err) {
      console.error("Markdown download failed", err);
      showMessage?.({ type: "error", message: "Download failed." });
    }
  };

  const printMarkdown = () => {
    const printContent = printContentRef.current?.innerHTML || "";
    const printFrame = document.createElement("iframe");

    printFrame.title = "Print Markdown";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!frameDoc) {
      printFrame.remove();
      showMessage?.({ type: "error", message: "Print failed." });
      return;
    }

    frameDoc.open();
    frameDoc.write(`<!doctype html>
      <html>
        <head>
          <title>Markdown Print</title>
          <style>
            body {
              margin: 32px;
              color: #000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              line-height: 1.5;
            }
            pre {
              background: #f6f8fa;
              border-radius: 6px;
              padding: 1rem;
              white-space: pre-wrap;
              overflow-wrap: break-word;
              break-inside: avoid;
            }
            code {
              font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
              white-space: pre-wrap;
              overflow-wrap: break-word;
            }
            img, table, blockquote {
              max-width: 100%;
            }
            h1, h2, h3, h4, h5, h6 {
              break-after: avoid;
            }
            @page {
              margin: 0.6in;
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>`);
    frameDoc.close();

    const cleanup = () => {
      setTimeout(() => printFrame.remove(), 100);
    };

    printFrame.contentWindow?.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      cleanup();
    }, 100);
  };

  const changeScrollSpeed = (change) => {
    setScrollSpeed((current) => Math.max(5, Math.min(200, current + change)));
  };

  const activateDirection = (direction) => {
    clearLoopTimeout();
    scrollDirectionRef.current = direction;
    setScrollDirection(direction);
    setIsAutoScrolling(true);
  };

  const startDirectionHold = (event, direction) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    holdMultiplierRef.current = 4;
    activateDirection(direction);
  };

  const endDirectionHold = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    holdMultiplierRef.current = 1;
  };

  const jumpToSection = (direction) => {
    const preview = previewRef.current;
    if (!preview) return;

    clearLoopTimeout();
    setIsAutoScrolling(false);
    holdMultiplierRef.current = 1;

    const headings = Array.from(preview.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    const currentScrollTop = preview.scrollTop;
    const viewportHeight = preview.clientHeight;
    const previewTop = preview.getBoundingClientRect().top;
    const getHeadingTop = (heading) => heading.getBoundingClientRect().top - previewTop + preview.scrollTop;
    const targetOffset = currentScrollTop + (direction > 0 ? viewportHeight * 0.1 : -1);

    let targetHeading = null;

    if (direction > 0) {
      targetHeading = headings.find((heading) => getHeadingTop(heading) > targetOffset);
    } else {
      const reversed = [...headings].reverse();
      targetHeading = reversed.find((heading) => getHeadingTop(heading) < currentScrollTop - viewportHeight * 0.1);
    }

    if (targetHeading) {
      preview.scrollTo({ top: getHeadingTop(targetHeading), behavior: "smooth" });
      return;
    }

    preview.scrollTo({
      top: Math.max(0, currentScrollTop + direction * Math.max(180, viewportHeight * 0.8)),
      behavior: "smooth",
    });
  };

  const resetScroll = () => {
    clearLoopTimeout();
    if (previewRef.current) previewRef.current.scrollTop = 0;
    holdMultiplierRef.current = 1;
    setIsAutoScrolling(false);
  };

  return (
    <div className="markdown-viewer-page">
      <style>{`
        .markdown-viewer-page {
          display: grid;
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px;
          min-height: 100vh;
          color: #0f172a;
        }
        .mv-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }
        .mv-title {
          margin: 0;
          font-size: 1.15rem;
          line-height: 1.2;
        }
        .mv-subtitle {
          margin-top: 3px;
          color: #475569;
          font-size: 0.9rem;
        }
        .mv-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mv-btn,
        .mv-file-label {
          appearance: none;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          cursor: pointer;
          font-weight: 800;
          padding: 9px 12px;
          line-height: 1;
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .mv-btn.primary {
          background: #0f766e;
          border-color: #0f766e;
          color: #ffffff;
        }
        .mv-segment {
          display: inline-flex;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
        }
        .mv-segment button {
          border: 0;
          background: transparent;
          color: #334155;
          padding: 9px 11px;
          font-weight: 800;
          cursor: pointer;
          min-height: 38px;
        }
        .mv-segment button.active {
          background: #0f172a;
          color: #ffffff;
        }
        .mv-filename {
          width: min(260px, 100%);
          min-height: 38px;
          margin: 0;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          font: inherit;
          font-weight: 700;
        }
        .mv-stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mv-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }
        .mv-actions-label {
          color: #475569;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .mv-pill {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          border-radius: 999px;
          background: #ecfeff;
          border: 1px solid #a5f3fc;
          color: #164e63;
          padding: 5px 10px;
          font-size: 0.85rem;
          font-weight: 800;
        }
        .mv-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 12px;
          min-height: 68vh;
          align-items: stretch;
        }
        .mv-grid.single {
          grid-template-columns: minmax(0, 1fr);
        }
        .mv-panel {
          display: flex;
          min-width: 0;
          min-height: 0;
          max-height: min(72vh, 760px);
          flex-direction: column;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
        }
        .mv-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 11px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #334155;
          font-size: 0.85rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
        }
        .mv-scroll-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .mv-scroll-buttons {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .mv-scroll-btn {
          appearance: none;
          min-width: 36px;
          min-height: 34px;
          padding: 7px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          background: #ffffff;
          color: #0f172a;
          cursor: pointer;
          font: inherit;
          font-weight: 800;
          line-height: 1;
          touch-action: none;
          user-select: none;
        }
        .mv-scroll-btn svg {
          width: 14px;
          height: 14px;
          pointer-events: none;
        }
        .mv-icon-btn {
          min-width: 34px;
          padding: 7px;
        }
        .mv-scroll-btn.active,
        .mv-scroll-btn.primary {
          border-color: #0f766e;
          background: #0f766e;
          color: #ffffff;
        }
        .mv-scroll-btn:focus-visible {
          outline: 3px solid rgba(20, 184, 166, 0.3);
          outline-offset: 1px;
        }
        .mv-speed-label {
          color: #475569;
          font-size: 0.8rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .mv-delay-control {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .mv-delay-input {
          width: 62px;
          min-height: 34px;
          margin: 0;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          padding: 5px 7px;
          color: #0f172a;
          background: #ffffff;
          font: inherit;
          font-weight: 800;
        }
        .mv-editor {
          flex: 1;
          width: 100%;
          min-height: 420px;
          resize: vertical;
          border: 0;
          border-radius: 0;
          margin: 0;
          padding: 14px;
          font: 0.95rem/1.55 "SFMono-Regular", Menlo, Consolas, monospace;
          color: #0f172a;
          background: #ffffff;
          outline: none;
        }
        .mv-preview {
          flex: 1;
          min-height: 0;
          overflow: auto;
          padding: 16px;
          background: #ffffff;
        }
        .mv-preview.markdown-body pre {
          white-space: pre;
        }
        .mv-empty {
          color: #64748b;
          font-weight: 700;
        }
        .mv-print-content {
          display: none;
        }
        @media (max-width: 760px) {
          .markdown-viewer-page {
            padding: 8px;
          }
          .mv-grid {
            grid-template-columns: minmax(0, 1fr);
            min-height: auto;
          }
          .mv-toolbar {
            align-items: stretch;
          }
          .mv-controls,
          .mv-segment {
            width: 100%;
          }
          .mv-segment button,
          .mv-btn,
          .mv-file-label {
            flex: 1;
          }
          .mv-filename {
            width: 100%;
          }
        }
      `}</style>

      <section className="mv-toolbar">
        <div>
          <h2 className="mv-title">Markdown Viewer</h2>
          <div className="mv-subtitle">Paste, upload, preview, and download markdown.</div>
        </div>
        <div className="mv-controls">
          <div className="mv-segment" aria-label="Viewer mode">
            {["split", "edit", "preview"].map((mode) => (
              <button
                key={mode}
                type="button"
                className={view === mode ? "active" : ""}
                onClick={() => setView(mode)}
              >
                {mode === "split" ? "Split" : mode === "edit" ? "Edit" : "Preview"}
              </button>
            ))}
          </div>
          <label className="mv-file-label">
            Upload .md
            <input
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          <button className="mv-btn" type="button" onClick={() => setMarkdown("")}>
            Clear
          </button>
          <button className="mv-btn" type="button" onClick={printMarkdown}>
            Print Markdown
          </button>
          <input
            className="mv-filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            aria-label="Download filename"
          />
          <button className="mv-btn primary" type="button" onClick={downloadMarkdown}>
            Download .md
          </button>
        </div>
        <div className="mv-stats" aria-label="Markdown stats">
          <span className="mv-pill">{stats.words} words</span>
          <span className="mv-pill">{stats.lines} lines</span>
          <span className="mv-pill">{stats.chars} chars</span>
        </div>
      </section>

      {markdown.trim() && (
        <section className="mv-actions" aria-label="Markdown actions">
          <span className="mv-actions-label">Use this markdown</span>
          <ActionButtons promptText={markdown} limitButtons />
        </section>
      )}

      <section className={`mv-grid ${view === "split" ? "" : "single"}`}>
        {showEditor && (
          <div className="mv-panel">
            <div className="mv-panel-header">Markdown</div>
            <textarea
              className="mv-editor"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="# Paste markdown here"
              spellCheck={false}
            />
          </div>
        )}

        {showPreview && (
          <div className="mv-panel">
            <div className="mv-panel-header">Preview</div>
            <div className="mv-scroll-controls" aria-label="Automatic scroll controls">
              <div className="mv-scroll-buttons">
                <button
                  className={`mv-scroll-btn mv-icon-btn ${scrollDirection < 0 ? "active" : ""}`}
                  type="button"
                  onMouseDown={preventSelection}
                  onPointerDown={(event) => startDirectionHold(event, -1)}
                  onPointerUp={endDirectionHold}
                  onPointerCancel={endDirectionHold}
                  onClick={() => activateDirection(-1)}
                  title="Scroll backward; hold for 4x speed"
                  aria-label="Scroll backward; hold for four times speed"
                >
                  <FaBackward />
                </button>
                <button
                  className="mv-scroll-btn mv-icon-btn primary"
                  type="button"
                  onMouseDown={preventSelection}
                  onClick={() => setIsAutoScrolling((running) => !running)}
                  aria-label={isAutoScrolling ? "Pause automatic scrolling" : "Start automatic scrolling"}
                >
                  {isAutoScrolling ? <FaPause /> : <FaPlay />}
                </button>
                <button
                  className={`mv-scroll-btn mv-icon-btn ${isLooping ? "active" : ""}`}
                  type="button"
                  onMouseDown={preventSelection}
                  onClick={() => setIsLooping((running) => !running)}
                  title="Toggle looping"
                  aria-label={isLooping ? "Disable looping" : "Enable looping"}
                >
                  <FaRedoAlt />
                </button>
                <button
                  className={`mv-scroll-btn mv-icon-btn ${scrollDirection > 0 ? "active" : ""}`}
                  type="button"
                  onMouseDown={preventSelection}
                  onPointerDown={(event) => startDirectionHold(event, 1)}
                  onPointerUp={endDirectionHold}
                  onPointerCancel={endDirectionHold}
                  onClick={() => activateDirection(1)}
                  title="Scroll forward; hold for 4x speed"
                  aria-label="Scroll forward; hold for four times speed"
                >
                  <FaForward />
                </button>
                <button
                  className="mv-scroll-btn mv-icon-btn"
                  type="button"
                  onMouseDown={preventSelection}
                  onClick={resetScroll}
                  title="Return to top"
                  aria-label="Return to top"
                >
                  <FaUndoAlt />
                </button>
                <button
                  className="mv-scroll-btn mv-icon-btn"
                  type="button"
                  onMouseDown={preventSelection}
                  onClick={() => jumpToSection(-1)}
                  title="Previous section"
                  aria-label="Previous section"
                >
                  <FaStepBackward />
                </button>
                <button
                  className="mv-scroll-btn mv-icon-btn"
                  type="button"
                  onMouseDown={preventSelection}
                  onClick={() => jumpToSection(1)}
                  title="Next section"
                  aria-label="Next section"
                >
                  <FaStepForward />
                </button>
              </div>
              <div className="mv-scroll-buttons">
                <button
                  className="mv-scroll-btn mv-icon-btn"
                  type="button"
                  onMouseDown={preventSelection}
                  onClick={() => changeScrollSpeed(-5)}
                  aria-label="Decrease scroll speed"
                  title="Decrease scroll speed"
                >
                  <FaMinus />
                </button>
                <button
                  className="mv-scroll-btn mv-icon-btn"
                  type="button"
                  onMouseDown={preventSelection}
                  onClick={() => changeScrollSpeed(5)}
                  aria-label="Increase scroll speed"
                  title="Increase scroll speed"
                >
                  <FaPlus />
                </button>
                <span className="mv-speed-label">{scrollSpeed} px/s</span>
                <label className="mv-delay-control">
                  Restart after
                  <input
                    className="mv-delay-input"
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    value={restartDelay}
                    onChange={(event) => {
                      const nextDelay = Number(event.target.value);
                      if (Number.isFinite(nextDelay)) {
                        setRestartDelay(Math.max(0, Math.min(60, nextDelay)));
                      }
                    }}
                    aria-label="Loop restart delay in seconds"
                  />
                  sec
                </label>
              </div>
            </div>
            <div className="mv-preview markdown-body" ref={previewRef}>
              {markdown.trim() ? <ReactMarkdown>{markdown}</ReactMarkdown> : <div className="mv-empty">No markdown to preview.</div>}
            </div>
          </div>
        )}
      </section>

      <section className="mv-print-content markdown-body" aria-hidden="true" ref={printContentRef}>
        {markdown.trim() ? <ReactMarkdown>{markdown}</ReactMarkdown> : <div>No markdown to print.</div>}
      </section>
    </div>
  );
}
