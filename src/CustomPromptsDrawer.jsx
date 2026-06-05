import React, { useState, useEffect, useMemo } from "react";
import { useFlyout } from "./context/FlyoutContext";
import { FaCopy, FaTrash, FaPlus, FaDownload, FaUpload } from "react-icons/fa";
import ActionButtons from "./ui/ActionButtons";

const STORAGE_KEY = "custom_stored_prompts";

export default function CustomPromptsDrawer() {
  const [prompts, setPrompts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [activeCategory, setActiveCategory] = useState("All");
  const [accumulatedText, setAccumulatedText] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const { showMessage } = useFlyout();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }, [prompts]);

  const validateKey = (key) => /^[a-zA-Z0-9_]+$/.test(key);
  const isKeyValid = validateKey(newKey) || newKey === "";

  const handleAdd = () => {
    if (!validateKey(newKey)) {
      showMessage?.({ type: "error", message: "Invalid key! Only alphanumeric and underscores allowed." });
      return;
    }
    if (prompts.some((p) => p.key === newKey)) {
      showMessage?.({ type: "error", message: "Key already exists!" });
      return;
    }
    if (!newValue.trim()) {
      showMessage?.({ type: "error", message: "Value cannot be empty." });
      return;
    }

    setPrompts([...prompts, { key: newKey, value: newValue, category: newCategory.trim() || "General" }]);
    setNewKey("");
    setNewValue("");
    setNewCategory("General");
    showMessage?.({ type: "success", message: `Added shortcut: ${newKey}` });
  };

  const handleAppend = (val) => {
    setAccumulatedText((prev) => (prev ? prev + " | " + val : val));
    showMessage?.({ type: "success", message: "Value appended", duration: 1000 });
  };

  const handleCopy = async () => {
    if (!accumulatedText) return;
    try {
      await navigator.clipboard.writeText(accumulatedText);
      showMessage?.({ type: "success", message: "Copied to clipboard!" });
    } catch {
      showMessage?.({ type: "error", message: "Failed to copy." });
    }
  };

  const removePrompt = (key) => {
    setPrompts(prompts.filter((p) => p.key !== key));
  };

  const handleDownloadJSON = () => {
    if (prompts.length === 0) return;
    try {
      const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "custom_shortcuts.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showMessage?.({ type: "success", message: "Shortcuts exported!" });
    } catch (err) {
      showMessage?.({ type: "error", message: "Export failed." });
    }
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let imported;
      try {
        imported = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file content.");
      }

      if (!Array.isArray(imported)) {
        throw new Error("JSON data must be an array of shortcuts.");
      }

      const validated = imported.map((item, idx) => {
        if (!item || typeof item !== "object") throw new Error(`Item at index ${idx} is not an object.`);
        if (typeof item.key !== "string" || !validateKey(item.key)) throw new Error(`Invalid key at index ${idx}: "${item.key}"`);
        if (typeof item.value !== "string") throw new Error(`Invalid value at index ${idx}: Expected string.`);
        return { 
          key: item.key, 
          value: item.value, 
          category: typeof item.category === "string" ? item.category : "General" 
        };
      });

      setPrompts((prev) => {
        const existingKeys = new Set(prev.map((p) => p.key));
        const newOnes = validated.filter((v) => !existingKeys.has(v.key));
        showMessage?.({ type: "success", message: `Imported ${newOnes.length} new items.${newOnes.length < validated.length ? " Skipped duplicates." : ""}` });
        return [...prev, ...newOnes];
      });
    } catch (err) {
      showMessage?.({ type: "error", message: err.message });
    } finally {
      e.target.value = "";
    }
  };

  const allCategories = useMemo(() => {
    const cats = new Set(prompts.map((p) => p.category));
    return ["All", ...Array.from(cats).sort()];
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    if (activeCategory === "All") return prompts;
    return prompts.filter((p) => p.category === activeCategory);
  }, [prompts, activeCategory]);

  return (
    <div className="cp-drawer-container">
      <style>{`
        .cp-drawer-container { display: flex; flex-direction: column; gap: 1rem; color: #1e293b; font-family: "Inter", system-ui, sans-serif; }
        .cp-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .cp-input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .cp-input { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; width: 100%; box-sizing: border-box; outline: none; }
        .cp-input:focus { border-color: #2563eb; ring: 2px #dbeafe; }
        .cp-input.error { border-color: #ef4444; background: #fef2f2; }
        .cp-btn { padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #0f172a; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; justify-content: center; transition: background 0.2s; }
        .cp-btn:hover { background: #1e293b; }
        .cp-btn.secondary { background: #f8fafc; color: #0f172a; }
        .cp-btn.secondary:hover { background: #f1f5f9; }
        .cp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cp-shortcuts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0.5rem; }
        .cp-shortcut-item { display: flex; align-items: center; background: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; }
        .cp-shortcut-btn { padding: 0.5rem 0.8rem; background: none; border: none; font-weight: 700; cursor: pointer; color: #334155; }
        .cp-shortcut-btn:hover { color: #2563eb; }
        .cp-shortcut-del { padding: 0.5rem; background: none; border: none; border-left: 1px solid #e2e8f0; cursor: pointer; color: #94a3b8; }
        .cp-shortcut-del:hover { color: #ef4444; }
        .cp-accumulated { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .cp-textarea { width: 100%; min-height: 140px; padding: 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; resize: vertical; box-sizing: border-box; outline: none; }
        .cp-label-small { fontSize: 0.75rem; fontWeight: 700; textTransform: uppercase; color: #64748b; marginBottom: 2px; }
        .cp-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 0.5rem; }
        .cp-tab { padding: 4px 10px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; font-size: 0.75rem; font-weight: 700; cursor: pointer; color: #64748b; }
        .cp-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
      `}</style>

      <div className="cp-card">
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>Shortcut Manager</h3>
        <div className="cp-input-group">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: "0.5rem" }}>
            <div>
              <label className="cp-label-small">Category</label>
              <input
                className="cp-input"
                placeholder="e.g. Code"
                value={newCategory}
                list="category-options"
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <datalist id="category-options">
                {allCategories.filter(c => c !== "All").map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="cp-label-small">Key</label>
              <input
                className={`cp-input ${!isKeyValid ? "error" : ""}`}
                placeholder="e.g. fix_bug"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <label className="cp-label-small">Value</label>
              <input
                className="cp-input"
                placeholder="Text to append..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
          </div>
          {!isKeyValid && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>Key must be alphanumeric or underscores.</span>}

          <button
            className="cp-btn"
            style={{ marginTop: "0.5rem" }}
            onClick={handleAdd}
            disabled={!newKey || !newValue || !isKeyValid}
          >
            <FaPlus size={10} /> Save Shortcut
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", paddingLeft: "4px" }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase" }}>
          Your Shortcuts
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <label className="cp-btn secondary" style={{ padding: "4px 8px", fontSize: "0.7rem", height: "auto", cursor: "pointer" }}>
            <FaUpload size={10} /> Import JSON
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: "none" }} />
          </label>
          {prompts.length > 0 && (
          <button 
            className="cp-btn secondary" 
            style={{ padding: "4px 8px", fontSize: "0.7rem", height: "auto" }} 
            onClick={handleDownloadJSON}
          >
            <FaDownload size={10} /> Export JSON
          </button>
          )}
        </div>
      </div>

      {allCategories.length > 2 ? (
        <div style={{ marginBottom: "0.75rem" }}>
          <select
            className="cp-input"
            style={{ fontWeight: 700, color: "#64748b", background: "#f8fafc" }}
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                Viewing: {cat}
              </option>
            ))}
          </select>
        </div>
      ) : allCategories.length === 2 && (
        <div className="cp-tabs">
          {allCategories.map((cat) => (
            <button
              key={cat}
              className={`cp-tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="cp-shortcuts">
        {filteredPrompts.map((p) => (
          <div key={p.key} className="cp-shortcut-item">
            <button className="cp-shortcut-btn" onClick={() => handleAppend(p.value)}>
              {p.key}
            </button>
            <button className="cp-shortcut-del" onClick={() => removePrompt(p.key)} title="Delete shortcut">
              <FaTrash size={10} />
            </button>
          </div>
        ))}
        {filteredPrompts.length === 0 && <div style={{ color: "#94a3b8", fontSize: "0.9rem", fontStyle: "italic", padding: "0.5rem" }}>No shortcuts found.</div>}
      </div>

      <div className="cp-accumulated">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
            />
            Show Content
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="cp-btn secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} onClick={() => setAccumulatedText("")} disabled={!accumulatedText}>
              Clear
            </button>
            <button className="cp-btn" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} onClick={handleCopy} disabled={!accumulatedText}>
              <FaCopy size={10} /> Copy
            </button>
          </div>
        </div>

        <textarea
          className="cp-textarea"
          style={{ 
            display: isVisible ? "block" : "none",
            background: "#fff"
          }}
          value={accumulatedText}
          onChange={(e) => setAccumulatedText(e.target.value)}
          placeholder="Appended text will appear here..."
        />
        {!isVisible && accumulatedText && (
           <div style={{ padding: "1.5rem", borderRadius: "8px", background: "#f8fafc", border: "1px dashed #cbd5e1", fontSize: "0.85rem", color: "#64748b", textAlign: "center" }}>
             Content hidden • {accumulatedText.length} characters ready
           </div>
        )}
      </div>
      {accumulatedText && <ActionButtons promptText={accumulatedText}/>}
    </div>
  );
}