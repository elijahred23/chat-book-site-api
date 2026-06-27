import { useEffect, useMemo, useRef, useState } from "react";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import Button from "./Button";

export default function ToolLauncher({ tools, isOpen, onToggle, onClose, hidden = false }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? tools.filter((tool) => tool.label.toLowerCase().includes(normalized)) : tools;
  }, [query, tools]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return undefined;
    }
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (hidden) return null;

  return (
    <div className="tool-launcher">
      {isOpen && (
        <>
          <button className="tool-launcher__backdrop" onClick={onClose} type="button" aria-label="Close quick tools" />
          <section className="tool-launcher__panel" aria-label="Quick tools">
            <div className="tool-launcher__header">
              <div>
                <span>Quick tools</span>
                <h2>What do you want to open?</h2>
              </div>
              <Button iconOnly variant="ghost" onClick={onClose} aria-label="Close quick tools"><FaTimes /></Button>
            </div>
            <label className="tool-launcher__search">
              <FaSearch aria-hidden="true" />
              <span className="ui-sr-only">Search tools</span>
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools…" />
            </label>
            <div className="tool-launcher__grid">
              {filteredTools.map(({ key, label, icon: Icon, active, action }) => (
                <button
                  key={key || label}
                  className={`tool-launcher__item ${active ? "is-active" : ""}`}
                  type="button"
                  onClick={() => {
                    action();
                    onClose();
                  }}
                >
                  <span className="tool-launcher__icon"><Icon aria-hidden="true" /></span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {filteredTools.length === 0 && <p className="tool-launcher__empty">No tools match “{query}”.</p>}
          </section>
        </>
      )}
      <button
        className="tool-launcher__trigger"
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? "Close quick tools" : "Open quick tools"}
        aria-expanded={isOpen}
      >
        {isOpen ? <FaTimes /> : <FaPlus />}
        <span>Tools</span>
      </button>
    </div>
  );
}
