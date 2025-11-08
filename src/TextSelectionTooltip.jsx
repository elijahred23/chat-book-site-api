import React, { useEffect, useState } from 'react';
import { useAppDispatch, actions } from './context/AppContext';
import ActionButtons from './ui/ActionButtons';

export default function TextSelectionTooltip() {
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const showTooltip = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return setVisible(false);

      const text = selection.toString().trim();
      if (!text) return setVisible(false);

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const tooltipWidth = 330;
        const calculatedLeft =
          rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        const maxLeft = window.innerWidth - tooltipWidth - 10;
        const isMobile = window.innerWidth <= 768;

        setSelectedText(text);
        setPosition({
          top: rect.top + window.scrollY - (isMobile ? 120 : 80),
          left: Math.min(Math.max(calculatedLeft, 10), maxLeft),
        });

        setVisible(true);
      } catch (err) {
        console.error("Tooltip position error:", err);
      }
    };

    const handleMouseUp = () => setTimeout(showTooltip, 60);
    const handleTouchEnd = () => setTimeout(showTooltip, 100);

    const handleClickOutside = (e = {}) => {
      const target = e.target;
      if (target?.closest?.('.text-selection-tooltip')) return;

      const sel = window.getSelection();
      if (!sel || sel.toString().trim() === "") setVisible(false);
    };

    const handleScroll = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) showTooltip();
      else setVisible(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="text-selection-tooltip"
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        background: "var(--tooltip-bg, #222)",
        padding: "8px 10px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        zIndex: 9999,
        width: "330px",
        userSelect: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-5px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ActionButtons promptText={selectedText} />
    </div>
  );
}
