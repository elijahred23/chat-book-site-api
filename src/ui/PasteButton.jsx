import React, { useState } from 'react';

const PasteButton = ({
  setPasteText,
  onPaste,
  children = 'Paste',
  className = '',
  feedbackDuration = 1500,
}) => {
  const [pasted, setPasted] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPasteText(text);
      if (onPaste) onPaste(text);
      setPasted(true);
      setTimeout(() => setPasted(false), feedbackDuration);
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
      alert('Clipboard access denied or unsupported by browser.');
    }
  };

  return (
    <button
      onClick={handlePaste}
      className={className}
      aria-label="Paste from clipboard"
    >
      {pasted ? '✅ Pasted!' : children}
    </button>
  );
};

export default PasteButton;
