import React, { useState } from "react";
import ActionButtons from "./ui/ActionButtons";

export default function PdfToText() {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const maxMb = Number(import.meta.env.VITE_PDF_MAX_MB || 1024);

  const isPdfFile = (file) => {
    return file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setError("");
    setText("");
    setFileName(file.name);
    if (!isPdfFile(file)) {
      setError("Drop or upload a PDF file.");
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File is too large. Max ${maxMb} MB.`);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      setLoading(true);
      const resp = await fetch("/api/pdf-to-text", {
        method: "POST",
        body: form,
      });
      if (!resp.ok) {
        const msg = await resp.text();
        let parsedError = "";
        try {
          parsedError = JSON.parse(msg)?.error || "";
        } catch {
          parsedError = msg;
        }
        throw new Error(parsedError || "Upload failed");
      }
      const data = await resp.json();
      setText(data?.text || "");
    } catch (err) {
      setError(err?.message || "Failed to parse PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!loading) {
      event.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (loading) return;
    const file = Array.from(event.dataTransfer.files || []).find(isPdfFile);
    if (!file) {
      setError("Drop a PDF file from your folder.");
      return;
    }
    handleUpload(file);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <style>{`
        .pdf-shell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; box-shadow: 0 14px 30px rgba(15,23,42,0.08); }
        .pdf-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: 10px; }
        .pdf-btn { padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #cbd5e1; background: #0f172a; color: #fff; font-weight: 800; cursor: pointer; }
        .pdf-btn[aria-disabled="true"] { opacity: 0.65; cursor: not-allowed; }
        .pdf-btn.secondary { background: #f8fafc; color: #0f172a; }
        .pdf-dropzone { border: 2px dashed #94a3b8; border-radius: 12px; background: #f8fafc; padding: 1.5rem; display: grid; gap: 0.75rem; place-items: center; text-align: center; transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease; }
        .pdf-dropzone.dragging { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 4px rgba(37,99,235,0.12); }
        .pdf-drop-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
        .pdf-input { display: none; }
        .pdf-text { width: 100%; min-height: 320px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; background: #fff; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; white-space: pre-wrap; }
        .pdf-meta { color: #475569; font-size: 0.95rem; }
      `}</style>

      <div className="pdf-shell">
        <div className="pdf-card">
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ margin: 0 }}>PDF → Text Converter</h2>
              <div className="pdf-meta">Upload a PDF and get plain text back from the API.</div>
            </div>
            {text && <ActionButtons promptText={text} />}
          </div>

          <div
            className={`pdf-dropzone${isDragging ? " dragging" : ""}`}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className="pdf-drop-title">{loading ? "Uploading PDF..." : "Drag and drop a PDF here"}</p>
            <div className="pdf-meta">Drop a file from your folder, or choose one manually.</div>
            <label className="pdf-btn" aria-disabled={loading} style={{ width: "fit-content" }}>
              {loading ? "Uploading..." : "Choose PDF"}
              <input
                className="pdf-input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  handleUpload(f);
                  e.target.value = "";
                }}
                disabled={loading}
              />
            </label>
          </div>
          {fileName && <div className="pdf-meta">Selected: {fileName}</div>}
          <div className="pdf-meta">Maximum file size: {maxMb} MB</div>
          {error && <div style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</div>}

          <div>
            <div className="pdf-meta" style={{ marginBottom: 6 }}>Extracted Text</div>
            <textarea className="pdf-text" value={text} readOnly placeholder="Upload a PDF to see its text here" />
          </div>
        </div>
      </div>
    </div>
  );
}
