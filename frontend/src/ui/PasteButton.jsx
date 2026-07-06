import { useState } from 'react';
import { useFlyout } from '../context/FlyoutContext';

const PasteButton = ({
  setPasteText,
  onPaste,
  children = 'Paste',
  className = '',
  feedbackDuration = 1500,
}) => {
  const [pasted, setPasted] = useState(false);
  const { showMessage } = useFlyout();

  const handlePaste = async () => {
    try {
      let text = "";
      if (navigator.clipboard?.readText) {
        text = await navigator.clipboard.readText();
      } else {
        text = window.prompt("Paste here:") || "";
      }
      setPasteText(text);
      if (onPaste) onPaste(text);
      setPasted(true);
      setTimeout(() => setPasted(false), feedbackDuration);
      showMessage?.({ type: "success", message: "Pasted from clipboard" });
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
      showMessage?.({ type: "error", message: "Clipboard access denied or unsupported." }) || alert('Clipboard access denied or unsupported by browser.');
    }
  };

  return (
    <button
      onClick={handlePaste}
      className={`${className || 'ui-btn'} clipboard-btn`.trim()}
      aria-label="Paste from clipboard"
    >
      <span>
        {pasted ? 'Done!' : children}
      </span>
    </button>
  );
};

export default PasteButton;
