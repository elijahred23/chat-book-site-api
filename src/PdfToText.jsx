import React, { useState } from "react";
import ActionButtons from "./ui/ActionButtons";

export default function PdfToText() {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const maxMb = Number(import.meta.env.VITE_PDF_MAX_MB || 1024);

  const handleUpload = async (file) => {
    if (!file) return;
    setError("");
    setText("");
    setFileName(file.name);
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
        throw new Error(msg || "Upload failed");
      }
      const data = await resp.json();
      setText(data?.text || "");
    } catch (err) {
      setError(err?.message || "Failed to parse PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <style>{`
        .pdf-shell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; box-shadow: 0 14px 30px rgba(15,23,42,0.08); }
        .pdf-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: 10px; }
        .pdf-btn { padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #cbd5e1; background: #0f172a; color: #fff; font-weight: 800; cursor: pointer; }
        .pdf-btn.secondary { background: #f8fafc; color: #0f172a; }
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

          <label className="pdf-btn" style={{ width: "fit-content" }}>
            {loading ? "Uploading…" : "Upload PDF"}
            <input
              className="pdf-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                handleUpload(f);
                e.target.value = "";
              }}
              disabled={loading}
            />
          </label>
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
