import React, { useEffect, useState } from 'react';

const TextSelectionTooltip = ({ onAskAI }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const handleSelection = () => {
      console.log('📱 Selection triggered');

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log('❌ No selection found');
        return;
      }

      const text = selection.toString().trim();
      if (text.length === 0) {
        console.log('⚠️ Empty text selection');
        setVisible(false);
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        console.log('✅ Selected:', text);

        const tooltipWidth = 180;
        const calculatedLeft = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        const maxLeft = window.innerWidth - tooltipWidth - 10;

        setSelectedText(text);
        setPosition({
            top: rect.top + window.scrollY - 70, // ← changed from -60 to -110
            left: Math.min(Math.max(calculatedLeft, 10), maxLeft),
        });


        setTimeout(() => {
          setVisible(true);
        }, 100); // slight delay for mobile long press
      } catch (err) {
        console.error('❌ Error getting selection rect:', err);
      }
    };

    const hideTooltip = () => setVisible(false);

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection); // ✅ mobile
    document.addEventListener('mousedown', hideTooltip);
    document.addEventListener('scroll', hideTooltip);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('mousedown', hideTooltip);
      document.removeEventListener('scroll', hideTooltip);
    };
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedText || selectedText.trim() === '') return;

    console.log('🚀 Sending to Ask AI:', selectedText);
    onAskAI(selectedText);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        backgroundColor: '#007bff',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        zIndex: 9999,
        maxWidth: '180px',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        userSelect: 'none',
      }}
      onClick={handleClick}
      onMouseDown={handleClick} // still needed for desktop
    >
      💬 Ask AI about this
    </div>
  );
};

export default TextSelectionTooltip;
