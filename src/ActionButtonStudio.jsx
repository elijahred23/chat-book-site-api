import { useEffect, useRef, useState } from "react";
import ActionButtons from "./ui/ActionButtons";

const STORAGE_KEY = "action_button_studio_text_v1";

export default function ActionButtonStudio() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [isPasting, setIsPasting] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {}
  }, [text]);

  const handlePasteFromClipboard = async () => {
    try {
      setIsPasting(true);
      const clipText = await navigator.clipboard.readText();
      if (!clipText) return;
      setText((prev) => (prev ? `${prev}\n${clipText}` : clipText));
    } catch {
      // Silent fallback: some browsers block clipboard reads unless trusted interaction policies allow it.
    } finally {
      setIsPasting(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploadName(file.name);
    try {
      const uploadedText = await file.text();
      setText(uploadedText || "");
    } catch {
      setUploadName("");
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "1rem" }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "1rem",
          boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
        }}
      >
        <h2 style={{ margin: 0, color: "#0f172a" }}>Action Button Studio</h2>
        <p style={{ marginTop: "0.4rem", color: "#475569" }}>
          Type, upload, or paste text, then run it through Action Buttons.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text here..."
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: 220,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: "0.85rem",
            fontSize: "0.95rem",
            marginTop: "0.5rem",
            resize: "vertical",
          }}
        />

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
          <button
            onClick={handlePasteFromClipboard}
            style={{
              padding: "0.65rem 0.95rem",
              borderRadius: 10,
              border: "1px solid #94a3b8",
              background: "#e2e8f0",
              color: "#0f172a",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {isPasting ? "Pasting..." : "Paste Clipboard"}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "0.65rem 0.95rem",
              borderRadius: 10,
              border: "1px solid #94a3b8",
              background: "#e2e8f0",
              color: "#0f172a",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Upload File
          </button>

          <button
            onClick={() => {
              setText("");
              setUploadName("");
            }}
            style={{
              padding: "0.65rem 0.95rem",
              borderRadius: 10,
              border: "1px solid #94a3b8",
              background: "#e2e8f0",
              color: "#0f172a",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Clear
          </button>

          {uploadName ? (
            <span style={{ alignSelf: "center", color: "#475569", fontSize: "0.9rem" }}>
              Loaded: {uploadName}
            </span>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json,.csv,.log,.xml,.html,.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.cs,.go,.rs,.php,.rb,text/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      <div style={{ marginTop: "0.9rem" }}>
        <ActionButtons promptText={text} />
      </div>
    </div>
  );
}
