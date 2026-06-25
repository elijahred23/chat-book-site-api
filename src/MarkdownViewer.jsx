import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAppState } from "./context/AppContext";
import { useFlyout } from "./context/FlyoutContext";

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

export default function MarkdownViewer() {
  const { markdownViewerText } = useAppState();
  const { showMessage } = useFlyout();
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [filename, setFilename] = useState("markdown-viewer.md");
  const [view, setView] = useState("split");

  useEffect(() => {
    if (markdownViewerText !== undefined && markdownViewerText !== markdown) {
      setMarkdown(markdownViewerText);
    }
  }, [markdownViewerText]);

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

  const showEditor = view === "split" || view === "edit";
  const showPreview = view === "split" || view === "preview";

  return (
    <div className="markdown-viewer-page">
      <style>{`
        .markdown-viewer-page {
          display: grid;
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px;
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
        }
        .mv-grid.single {
          grid-template-columns: minmax(0, 1fr);
        }
        .mv-panel {
          display: flex;
          min-width: 0;
          min-height: 420px;
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
            <div className="mv-preview markdown-body">
              {markdown.trim() ? <ReactMarkdown>{markdown}</ReactMarkdown> : <div className="mv-empty">No markdown to preview.</div>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
