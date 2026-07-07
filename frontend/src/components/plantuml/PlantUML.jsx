import { useCallback, useEffect, useRef, useState } from "react";
import Panzoom from "@panzoom/panzoom";
import {
  FaBolt,
  FaClipboard,
  FaCode,
  FaCompressArrowsAlt,
  FaDownload,
  FaExpandArrowsAlt,
  FaFileUpload,
  FaImage,
  FaMoon,
  FaPlay,
  FaSearchMinus,
  FaSearchPlus,
  FaSun,
} from "react-icons/fa";
import { useAppState } from "../../context/AppContext.jsx";
import { generatePlantUmlDiagram, renderPlantUmlSource } from "../../services/plantuml.js";
import "./PlantUML.css";

const starterUml = `@startuml
Alice -> Bob: Hello
Bob --> Alice: Hi
@enduml`;

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function sourceFilename(title, extension) {
  const base = (title || "diagram")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "diagram";
  return `${base}.${extension}`;
}

export default function PlantUMLViewer() {
  const { plantUMLPrompt } = useAppState();
  const [uml, setUml] = useState(starterUml);
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState("svg");
  const [darkMode, setDarkMode] = useState(false);
  const [autoRender, setAutoRender] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [diagramUrl, setDiagramUrl] = useState("");
  const [diagramTitle, setDiagramTitle] = useState("PlantUML diagram");
  const [diagramType, setDiagramType] = useState("");
  const previewRef = useRef(null);
  const panzoomRef = useRef(null);
  const diagramUrlRef = useRef("");
  const renderRequestRef = useRef(0);

  useEffect(() => {
    setPrompt(plantUMLPrompt ?? "");
  }, [plantUMLPrompt]);

  useEffect(() => () => {
    if (diagramUrlRef.current) URL.revokeObjectURL(diagramUrlRef.current);
  }, []);

  const revokeCurrentDiagramUrl = useCallback(() => {
    if (diagramUrlRef.current) URL.revokeObjectURL(diagramUrlRef.current);
    diagramUrlRef.current = "";
  }, []);

  const clearPanzoom = useCallback(() => {
    panzoomRef.current?.destroy();
    panzoomRef.current = null;
  }, []);

  const renderDiagram = useCallback(async (source = uml, nextFormat = format) => {
    const trimmed = source.trim();
    if (!trimmed) {
      setError("PlantUML source is required.");
      return;
    }

    const requestId = renderRequestRef.current + 1;
    renderRequestRef.current = requestId;
    setRendering(true);
    setError("");

    try {
      const blob = await renderPlantUmlSource(trimmed, nextFormat);
      if (requestId !== renderRequestRef.current) return;
      const nextUrl = URL.createObjectURL(blob);
      revokeCurrentDiagramUrl();
      diagramUrlRef.current = nextUrl;
      setDiagramUrl(nextUrl);
    } catch (err) {
      if (requestId === renderRequestRef.current) {
        setError(err.message || "Could not render PlantUML.");
      }
    } finally {
      if (requestId === renderRequestRef.current) setRendering(false);
    }
  }, [format, revokeCurrentDiagramUrl, uml]);

  useEffect(() => {
    if (!autoRender) return undefined;
    const timer = window.setTimeout(() => {
      renderDiagram(uml, format);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [uml, format, autoRender, renderDiagram]);

  const applyPanzoom = useCallback(() => {
    clearPanzoom();
    const target = format === "svg"
      ? previewRef.current?.contentDocument?.querySelector("svg")
      : previewRef.current;
    if (target) {
      panzoomRef.current = Panzoom(target, {
        contain: "outside",
        maxScale: 8,
        minScale: 0.2,
      });
    }
  }, [clearPanzoom, format]);

  const handleGenerateFromPrompt = async () => {
    if (!prompt.trim()) {
      setError("Describe the diagram you want Gemini to create.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const diagram = await generatePlantUmlDiagram(prompt.trim());
      setUml(diagram.source);
      setDiagramTitle(diagram.title || "Generated PlantUML diagram");
      setDiagramType(diagram.diagramType || "");
      await renderDiagram(diagram.source, format);
    } catch (err) {
      setError(err.message || "Could not generate a diagram.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uml);
    } catch {
      setError("Clipboard access is unavailable.");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!/@start/i.test(text)) {
        setError("Clipboard does not contain PlantUML source.");
        return;
      }
      setUml(text);
    } catch {
      setError("Clipboard access is unavailable.");
    }
  };

  const handlePromptPaste = async () => {
    try {
      setPrompt(await navigator.clipboard.readText());
    } catch {
      setError("Clipboard access is unavailable.");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUml(await file.text());
    event.target.value = "";
  };

  const downloadSource = () => {
    downloadBlob(new Blob([uml], { type: "text/plain" }), sourceFilename(diagramTitle, "puml"));
  };

  const downloadRendered = async (downloadFormat) => {
    try {
      setError("");
      const blob = await renderPlantUmlSource(uml, downloadFormat);
      downloadBlob(blob, sourceFilename(diagramTitle, downloadFormat));
    } catch (err) {
      setError(err.message || `Could not download ${downloadFormat.toUpperCase()}.`);
    }
  };

  const openRendered = async () => {
    try {
      setError("");
      const blob = await renderPlantUmlSource(uml, "png");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.message || "Could not open rendered diagram.");
    }
  };

  return (
    <div className={`uml-workbench ${darkMode ? "is-dark" : ""}`}>
      <header className="uml-toolbar">
        <div>
          <p className="uml-eyebrow">PlantUML</p>
          <h2>Diagram Workbench</h2>
        </div>
        <div className="uml-toolbar__actions">
          <label className="uml-toggle">
            <input
              checked={autoRender}
              onChange={(event) => setAutoRender(event.target.checked)}
              type="checkbox"
            />
            Auto render
          </label>
          <button className="uml-icon-btn" onClick={() => setDarkMode((value) => !value)} title={darkMode ? "Use light mode" : "Use dark mode"} type="button">
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      <main className="uml-layout">
        <section className="uml-editor-panel" aria-labelledby="uml-prompt-label">
          <div className="uml-field">
            <label id="uml-prompt-label" htmlFor="uml-prompt">Prompt</label>
            <textarea
              id="uml-prompt"
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") handleGenerateFromPrompt();
              }}
              placeholder="Describe a class, sequence, component, state, or activity diagram..."
              rows={5}
              value={prompt}
            />
          </div>
          <div className="uml-button-row">
            <button className="uml-btn" disabled={loading} onClick={handlePromptPaste} type="button"><FaClipboard /> Paste prompt</button>
            <button className="uml-btn uml-btn--primary" disabled={loading} onClick={handleGenerateFromPrompt} type="button">
              <FaBolt /> {loading ? "Generating" : "Generate"}
            </button>
          </div>

          <div className="uml-field uml-source-field">
            <label htmlFor="uml-source">PlantUML source</label>
            <textarea
              id="uml-source"
              onChange={(event) => setUml(event.target.value)}
              spellCheck="false"
              value={uml}
            />
          </div>

          <div className="uml-controls">
            <select aria-label="Preview format" onChange={(event) => setFormat(event.target.value)} value={format}>
              <option value="svg">SVG preview</option>
              <option value="png">PNG preview</option>
            </select>
            <button className="uml-btn uml-btn--primary" disabled={rendering} onClick={() => renderDiagram()} type="button"><FaPlay /> Render</button>
            <button className="uml-btn" onClick={handleCopy} type="button"><FaCode /> Copy</button>
            <button className="uml-btn" onClick={handlePaste} type="button"><FaClipboard /> Paste</button>
          </div>

          <div className="uml-controls">
            <button className="uml-btn" onClick={() => downloadRendered("svg")} type="button"><FaDownload /> SVG</button>
            <button className="uml-btn" onClick={() => downloadRendered("png")} type="button"><FaImage /> PNG</button>
            <button className="uml-btn" onClick={downloadSource} type="button"><FaDownload /> .puml</button>
            <button className="uml-btn" onClick={openRendered} type="button"><FaExpandArrowsAlt /> Open PNG</button>
            <label className="uml-btn uml-upload">
              <FaFileUpload /> Upload
              <input accept=".puml,.txt" onChange={handleFileUpload} type="file" />
            </label>
          </div>
        </section>

        <section className="uml-preview-panel" aria-label="Rendered diagram preview">
          <div className="uml-preview-header">
            <div>
              <h3>{diagramTitle}</h3>
              {diagramType && <p>{diagramType}</p>}
            </div>
            <div className="uml-zoom-actions">
              <button className="uml-icon-btn" onClick={() => panzoomRef.current?.zoomOut()} title="Zoom out" type="button"><FaSearchMinus /></button>
              <button className="uml-icon-btn" onClick={() => panzoomRef.current?.zoomIn()} title="Zoom in" type="button"><FaSearchPlus /></button>
              <button className="uml-icon-btn" onClick={() => panzoomRef.current?.reset()} title="Reset zoom" type="button"><FaCompressArrowsAlt /></button>
            </div>
          </div>

          <div className="uml-stage" aria-busy={rendering || loading}>
            {diagramUrl && format === "svg" && (
              <object
                aria-label={diagramTitle}
                data={diagramUrl}
                onLoad={applyPanzoom}
                ref={previewRef}
                type="image/svg+xml"
              />
            )}
            {diagramUrl && format === "png" && (
              <img alt={diagramTitle} onLoad={applyPanzoom} ref={previewRef} src={diagramUrl} />
            )}
            {!diagramUrl && <p className="uml-empty-state">Paste, upload, or generate PlantUML source.</p>}
            {(rendering || loading) && <div className="uml-loading">{loading ? "Generating diagram" : "Rendering diagram"}</div>}
          </div>

          {error && <p className="uml-error" role="alert">{error}</p>}
        </section>
      </main>
    </div>
  );
}
