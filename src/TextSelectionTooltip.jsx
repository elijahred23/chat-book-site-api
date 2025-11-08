import React, { useEffect, useState } from 'react';
import { useAppDispatch, actions } from './context/AppContext';

const TextSelectionTooltip = ({ onAskAI, onSendToTTS, onSendToTeleprompter }) => {
  const dispatch = useAppDispatch();
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

        setSelectedText(text);
        setPosition({
          top: rect.top + window.scrollY - 120,
          left: Math.min(Math.max(calculatedLeft, 10), maxLeft),
        });

        setVisible(true);
      } catch (err) {
        console.error('Error getting selection rect:', err);
      }
    };

    const handleMouseUp = () => setTimeout(showTooltipForSelection, 60);
    const handleTouchEnd = () => setTimeout(showTooltipForSelection, 100);

    const handleClickOutside = (e = {}) => {
      const target = e?.target?.nodeType === 1 ? e.target : null;
      if (target?.closest?.('.text-selection-tooltip')) return;

      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().trim().length > 0;
      if (!hasSelection) setVisible(false);
    };

    const handleScroll = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
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

  const buttonStyle = {
    background: 'transparent',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    flex: 1,
    padding: '4px',
  };

  const dividerStyle = {
    width: '1px',
    height: '20px',
    background: 'rgba(255,255,255,0.4)',
  };

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
        width: '330px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        userSelect: 'none',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-5px)',
      }}
    >
      {/* Ask AI */}
      <button
        style={buttonStyle}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(actions.setSelectedText(selectedText));
          onAskAI?.(selectedText);
          window.getSelection().removeAllRanges();
          setVisible(false);
        }}
      >
        💬 Ask AI
      </button>

      <div style={dividerStyle} />

      {/* Send to TTS */}
      <button
        style={buttonStyle}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(actions.setTtsText(selectedText));
          onSendToTTS?.(selectedText);
          window.getSelection().removeAllRanges();
          setVisible(false);
        }}
      >
        🗣️ TTS
      </button>

      <div style={dividerStyle} />

      {/* Send to Teleprompter */}
      <button
        style={buttonStyle}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(actions.setTeleprompterText(selectedText));
          onSendToTeleprompter?.(selectedText);
          window.getSelection().removeAllRanges();
          setVisible(false);
        }}
      >
        📜 Teleprompter
      </button>
      {/* Send to plant uml */}
      <button 
        style={buttonStyle}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(actions.setPlantUMLPrompt(selectedText));
          dispatch(actions.setIsPlantUMLOpen(true));
          window.getSelection().removeAllRanges();
          setVisible(false);
        }}
      >
        🌿 PlantUML
      </button>
      {/* Send to podcast */}
      <button 
        style={buttonStyle}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(actions.setPodcastTTSPrompt(selectedText));
          dispatch(actions.setIsPodcastTTSOpen(true));
          window.getSelection().removeAllRanges();
          setVisible(false);
        }}
      >
        🎙️ Podcast
      </button>
    </div>
  );
};

export default TextSelectionTooltip;
