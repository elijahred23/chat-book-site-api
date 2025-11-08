import "./ActionButtons.css";
import { useAppDispatch, useAppState, actions } from "../context/AppContext";
import { FaComments, FaVolumeUp, FaScroll, FaProjectDiagram } from "react-icons/fa";
import { FaPodcast } from "react-icons/fa";


function removeMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, m => m.replace(/```[a-zA-Z]*\n?/, "").replace(/```$/, ""))
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!$begin:math:display$.*?$end:math:display$$begin:math:text$.*?$end:math:text$/g, "")
    .replace(/$begin:math:display$([^$end:math:display$]+)\]$begin:math:text$([^)]+)$end:math:text$/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[\*\-\+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^([-*_] *){3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ActionButtons({ promptText }) {
  const dispatch = useAppDispatch();
  const { isChatOpen, isTTSOpen, isTeleprompterOpen } = useAppState();
  const cleanText = removeMarkdown(promptText || "");

  const buttons = [
    {
      icon: <FaComments />,
      title: "Ask AI",
      color: "var(--btn-blue)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setChatPrompt(cleanText));
        dispatch(actions.setIsChatOpen(true));
      },
    },
    {
      icon: <FaVolumeUp />,
      title: "TTS",
      color: "var(--btn-purple)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setTtsText(cleanText));
        dispatch(actions.setIsTTSOpen(!isTTSOpen));
      },
    },
    {
      icon: <FaScroll />,
      title: "Teleprompter",
      color: "var(--btn-green)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setTeleprompterText(cleanText));
        dispatch(actions.setIsTeleprompterOpen(!isTeleprompterOpen));
      },
    },
    {
      icon: <FaProjectDiagram />,
      title: "PlantUML",
      color: "var(--btn-orange)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setPlantUMLPrompt(cleanText));
        dispatch(actions.setIsPlantUMLOpen(true));
      },
    },
    {
      icon: <FaPodcast />,
      title: "PlantUML",
      color: "var(--btn-podcast)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setPodcastTTSPrompt(cleanText));
        dispatch(actions.setIsPodcastTTSOpen(true));
      },
    },
  ];

  return (
    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          onClick={btn.onClick}
          className="icon-btn"
          title={btn.title}
          style={{ background: btn.color }}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}
