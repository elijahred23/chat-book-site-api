import React from "react";
import {
  FaComments,
  FaVolumeUp,
  FaScroll,
  FaProjectDiagram,
  FaPodcast,
  FaMagic,
  FaYoutube,
  FaCode,
  FaKeyboard,
  FaSitemap,
  FaTimes,
} from "react-icons/fa";
import { GiNotebook } from "react-icons/gi";

const ICONS = {
  chat: FaComments,
  teleprompter: FaScroll,
  tts: FaVolumeUp,
  plantuml: FaProjectDiagram,
  podcast: FaPodcast,
  jsgen: FaMagic,
  chatbook: GiNotebook,
  youtube: FaYoutube,
  html: FaCode,
  typing: FaKeyboard,
  architecture: FaSitemap,
};

const LABELS = {
  chat: "Chat",
  teleprompter: "Teleprompter",
  tts: "TTS",
  plantuml: "PlantUML",
  podcast: "Podcast",
  jsgen: "JS Gen",
  chatbook: "Chat Book",
  youtube: "YouTube",
  html: "HTML",
  typing: "Typing",
  architecture: "Diagram",
};

export default function SideDrawer({
  isOpen,
  isFullWidth,
  onClose,
  onToggleWidth,
  closeLabel = "✖",
  children,
  className = "",
  stack = [],
  currentKey,
}) {
  const drawerClass = `chat-drawer ${isOpen ? "open" : ""} ${isFullWidth ? "full" : "half"} ${className}`.trim();
  const IconFor = (key) => ICONS[key];

  return (
    <div className={drawerClass}>
      <div className="chat-drawer-header" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {onToggleWidth && (
            <button className="width-toggle-btn" onClick={onToggleWidth}>
              {isFullWidth ? "↔ Half Width" : "↔ Full Width"}
            </button>
          )}
          <button
            className="close-chat-btn"
            onClick={onClose}
            aria-label={closeLabel || "Close"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minWidth: 44,
            }}
          >
            <FaTimes />
          </button>
        </div>
        {stack.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "6px 8px",
            }}
          >
            {stack.map((key, idx) => {
              const Icon = IconFor(key);
              const isActive = key === currentKey;
              return (
                <span
                  key={`${key}-${idx}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "999px",
                    background: isActive ? "linear-gradient(135deg, #2563eb, #60a5fa)" : "#e2e8f0",
                    color: isActive ? "#fff" : "#0f172a",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  title={LABELS[key] || key}
                >
                  {Icon ? <Icon size={14} /> : null}
                </span>
              );
            })}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
