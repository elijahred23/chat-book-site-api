import React from "react";

export default function SideDrawer({
  isOpen,
  isFullWidth,
  onClose,
  onToggleWidth,
  closeLabel = "✖",
  children,
  className = "",
}) {
  const drawerClass = `chat-drawer ${isOpen ? "open" : ""} ${isFullWidth ? "full" : "half"} ${className}`.trim();
  return (
    <div className={drawerClass}>
      <div className="chat-drawer-header">
        {onToggleWidth && (
          <button className="width-toggle-btn" onClick={onToggleWidth}>
            {isFullWidth ? "↔ Half Width" : "↔ Full Width"}
          </button>
        )}
        <button className="close-chat-btn" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
      {children}
    </div>
  );
}
