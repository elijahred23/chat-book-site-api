import "./ActionButtons.css";
import { useAppDispatch, useAppState, actions } from "../context/AppContext";

function removeMarkdown(text) {
  // Preserve content of code blocks (```...```)
  text = text.replace(/```[\s\S]*?```/g, match =>
    match.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, '')
  );

  // Preserve inline code
  text = text.replace(/`([^`]*)`/g, '$1');

  // Remove images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');

  // Convert links [text](url) → text
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

  // Remove bold, italics, strikethrough
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Bold
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');    // Italics
  text = text.replace(/~~(.*?)~~/g, '$1');        // Strikethrough

  // Remove headers
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, '');

  // Remove blockquotes
  text = text.replace(/^>\s?/gm, '');

  // Remove lists and horizontal rules
  text = text.replace(/^\s*[\*\-\+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  text = text.replace(/^([-*_] *){3,}$/gm, '');

  // Collapse extra newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

const ActionButtons = ({ promptText }) => {
  const dispatch = useAppDispatch();
  const { isChatOpen, isTTSOpen, isTeleprompterOpen } = useAppState();

  const cleanText = removeMarkdown(promptText || "");

  const handleAskAI = () => {
    dispatch(actions.setSelectedText(cleanText));
    dispatch(actions.setIsChatOpen(!isChatOpen));
  };

  const handleTTS = () => {
    dispatch(actions.setTtsText(cleanText));
    dispatch(actions.setIsTTSOpen(!isTTSOpen));
  };

  const handleTeleprompter = () => {
    dispatch(actions.setTeleprompterText(cleanText));
    dispatch(actions.setIsTeleprompterOpen(!isTeleprompterOpen));
  };

  const buttons = [
    { label: "💬 Ask AI", onClick: handleAskAI },
    { label: "🔊 TTS", onClick: handleTTS },
    { label: "📜 Teleprompter", onClick: handleTeleprompter },
  ];

  return (
    <div className="action-buttons">
      {buttons.map((btn, idx) => (
        <button key={idx} onClick={btn.onClick} className="action-btn">
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;
