import React from "react";
import "./ActionButtons.css"; // optional external CSS
import { useAppDispatch, useAppState, actions } from "../context/AppContext";

const ActionButtons = ({ promptText }) => {
  const dispatch = useAppDispatch();
  const { isChatOpen, isTTSOpen, isTeleprompterOpen } = useAppState();

  const handleAskAI = () => {
    dispatch(actions.setSelectedText(promptText));
    dispatch(actions.setIsChatOpen(!isChatOpen));
  };

  const handleTTS = () => {
    dispatch(actions.setTtsText(promptText));
    dispatch(actions.setIsTTSOpen(!isTTSOpen));
  };

  const handleTeleprompter = () => {
    dispatch(actions.setTeleprompterText(promptText));
    dispatch(actions.setIsTeleprompterOpen(!isTeleprompterOpen));
  };

  // Button configuration for easy future expansion
  const buttons = [
    { label: "💬 Ask AI", onClick: handleAskAI },
    { label: "🔊 TTS", onClick: handleTTS },
    { label: "📜 Teleprompter", onClick: handleTeleprompter },
  ];

  return (
    <div className="action-buttons">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          onClick={btn.onClick}
          className="action-btn"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;
