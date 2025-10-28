import React, { useEffect, useState } from 'react';

const TextSelectionTooltip = ({ onAskAI, onSendToTTS }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const showTooltipForSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setVisible(false);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setVisible(false);
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const tooltipWidth = 220;
        const calculatedLeft =
          rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        const maxLeft = window.innerWidth - tooltipWidth - 10;

        setSelectedText(text);
        setPosition({
          top: rect.top + window.scrollY - 80,
          left: Math.min(Math.max(calculatedLeft, 10), maxLeft),
        });

        // Always force visible when selection exists
        setVisible(true);
      } catch (err) {
        console.error('Error getting selection rect:', err);
      }
    };

    const handleMouseUp = () => {
      // Delay slightly to allow selection API to update
      setTimeout(showTooltipForSelection, 60);
    };

    const handleTouchEnd = () => {
      setTimeout(showTooltipForSelection, 100);
    };

    const handleClickOutside = (e = {}) => {
      const target =
        e && e.target && e.target.nodeType === 1 ? e.target : null;

      // Ignore clicks inside tooltip
      if (target?.closest?.('.text-selection-tooltip')) return;

      // Hide only if no text remains selected
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().trim().length > 0;
      if (!hasSelection) setVisible(false);
    };

    const handleScroll = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        // Recalculate position while keeping tooltip visible
        showTooltipForSelection();
      } else {
        setVisible(false);
      }
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
        position: 'absolute',
        top: position.top,
        left: position.left,
        backgroundColor: '#007bff',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 9999,
        width: '220px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        userSelect: 'none',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-5px)',
      }}
    >
      <button
        style={{
          background: 'transparent',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          flex: 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onAskAI(selectedText);
          window.getSelection().removeAllRanges(); // clear selection
          setVisible(false);
        }}
      >
        💬 Ask AI
      </button>

      <div
        style={{
          width: '1px',
          height: '20px',
          background: 'rgba(255,255,255,0.4)',
        }}
      />

      <button
        style={{
          background: 'transparent',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          flex: 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSendToTTS(selectedText);
          window.getSelection().removeAllRanges(); // clear selection
          setVisible(false);
        }}
      >
        🗣️ Send to TTS
      </button>
    </div>
  );
};

export default TextSelectionTooltip;
