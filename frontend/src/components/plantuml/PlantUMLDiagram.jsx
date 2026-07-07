/* eslint-disable react/prop-types */
import { useState } from "react";

export default function PlantUMLDiagram({ diagramId, title, description, className = "" }) {
  const [source, setSource] = useState("");
  const [isSourceVisible, setIsSourceVisible] = useState(false);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [error, setError] = useState("");
  const imageUrl = `/api/plantuml/diagrams/${diagramId}.svg`;

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const filenameBase = (title || diagramId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "diagram";

  const loadSource = async () => {
    if (source) return source;
    setIsLoadingSource(true);
    setError("");

    try {
      const response = await fetch(`/api/plantuml/diagrams/${diagramId}/source`);
      if (!response.ok) throw new Error("Could not load PlantUML source.");
      const text = await response.text();
      setSource(text);
      return text;
    } catch (err) {
      setError(err.message);
      return "";
    } finally {
      setIsLoadingSource(false);
    }
  };

  const handleToggleSource = async () => {
    if (!isSourceVisible) await loadSource();
    setIsSourceVisible((current) => !current);
  };

  const handleCopySource = async () => {
    const text = await loadSource();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Clipboard access is unavailable.");
    }
  };

  const handleDownloadSource = async () => {
    const text = await loadSource();
    if (!text) return;
    downloadBlob(new Blob([text], { type: "text/plain" }), `${filenameBase}.puml`);
  };

  const handleDownloadSvg = async () => {
    try {
      setError("");
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Could not download the rendered SVG.");
      downloadBlob(await response.blob(), `${filenameBase}.svg`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <figure className={`plantuml-diagram ${className}`.trim()}>
      <figcaption>
        <div>
          <span>PlantUML</span>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        <div className="plantuml-diagram__actions">
          <a href={imageUrl} rel="noreferrer" target="_blank">Open in new tab</a>
          <button type="button" onClick={handleCopySource}>Copy source</button>
          <button type="button" onClick={handleDownloadSource}>Download .puml</button>
          <button type="button" onClick={handleDownloadSvg}>Download SVG</button>
          <button type="button" onClick={handleToggleSource}>
            {isSourceVisible ? "Hide source" : "Show source"}
          </button>
        </div>
      </figcaption>

      <div className="plantuml-diagram__stage">
        <img
          alt={`${title} diagram`}
          onError={() => setError("The diagram could not be rendered through the API.")}
          src={imageUrl}
        />
      </div>

      {error && <p className="plantuml-diagram__error" role="alert">{error}</p>}
      {isSourceVisible && (
        <pre className="plantuml-diagram__source">
          <code>{isLoadingSource ? "Loading PlantUML source..." : source}</code>
        </pre>
      )}
    </figure>
  );
}
