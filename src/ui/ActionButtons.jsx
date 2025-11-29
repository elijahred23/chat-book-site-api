import "./ActionButtons.css";
import { useAppDispatch, useAppState, actions } from "../context/AppContext";
import {
  FaComments,
  FaVolumeUp,
  FaScroll,
  FaProjectDiagram,
  FaPodcast,
  FaCopy,
  FaCode,
  FaBook,
  FaYoutube,
  FaImage,
  FaEllipsisH,
  FaChevronUp,
} from "react-icons/fa";
import { useFlyout } from "../context/FlyoutContext";
import { FcGoogle } from "react-icons/fc";
import { SiWikipedia } from "react-icons/si";
import { GiGraduateCap } from "react-icons/gi";
import { FaRedditAlien } from "react-icons/fa";
import { useState } from "react";
import { GiNotebook } from "react-icons/gi";

function removeMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, (m) =>
      m.replace(/```[a-zA-Z]*\n?/, "").replace(/```$/, "")
    )
    .replace(/`([^`]*)`/g, "$1")
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

export default function ActionButtons({ promptText, limitButtons = false }) {
  const dispatch = useAppDispatch();
  const { isChatOpen, isTTSOpen, isTeleprompterOpen } = useAppState();
  const cleanText = removeMarkdown(promptText || "");
  const { showMessage } = useFlyout();
  const [showAll, setShowAll] = useState(false);

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
      icon: <GiNotebook />,
      title: "Chat Book",
      color: "var(--btn-orange)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setChatBookSubject(cleanText));
        dispatch(actions.setIsChatBookOpen(true));
      },
    },
    {
      icon: <FaPodcast />,
      title: "Podcast TTS",
      color: "var(--btn-podcast)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setPodcastTTSPrompt(cleanText));
        dispatch(actions.setIsPodcastTTSOpen(true));
      },
    },
    {
      icon: <FaCode />,
      title: "JS Generator",
      color: "var(--btn-code)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setIsJSGeneratorOpen(true));
        dispatch(actions.setJSGeneratorPrompt(cleanText));
      },
    },
    {
      icon: <FcGoogle />,
      title: "Ask Google",
      color: "var(--google-blue)",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(`https://www.google.com/search?q=${query}`, "_blank");
      },
    },
    {
      icon: <SiWikipedia />,
      title: "Ask Wikipedia",
      color: "var(--wiki-grey)",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(
          `https://en.wikipedia.org/wiki/Special:Search?search=${query}`,
          "_blank"
        );
      },
    },
    {
      icon: <FaYoutube />,
      title: "Ask YouTube",
      color: "var(--yt-red)",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText + " explanation");
        window.open(
          `https://www.youtube.com/results?search_query=${query}`,
          "_blank"
        );
      },
    },
    {
      icon: <FaBook />,
      title: "Define Word",
      color: "var(--btn-gray)",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(`https://www.dictionary.com/browse/${query}`, "_blank");
      },
    },
    {
      icon: <GiGraduateCap />,
      title: "Google Scholar",
      color: "var(--scholar-blue)",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(`https://scholar.google.com/scholar?q=${query}`, "_blank");
      },
    },
    {
      icon: <FaImage />,
      title: "Image Search",
      color: "var(--google-blue)",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(
          `https://www.google.com/search?tbm=isch&q=${query}`,
          "_blank"
        );
      },
    },
    {
      icon: <FaRedditAlien />,
      title: "Ask Reddit",
      color: "var(--reddit-orange)",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(`https://www.reddit.com/search/?q=${query}`, "_blank");
      },
    },
    {
      icon: <FaCopy />,
      title: "Copy Text",
      color: "var(--btn-gray)",
      onClick: async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(cleanText);
        showMessage({ type: "success", message: "Text copied to clipboard!" });
      },
    }
  ];

  const visibleButtons =
    limitButtons && !showAll ? buttons.slice(0, 5) : buttons;

  return (
    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
      {visibleButtons.map((btn, idx) => (
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

      {limitButtons && (
        <button
          className="icon-btn more-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(!showAll);
          }}
          title={showAll ? "Show Less" : "Show More"}
        >
          {showAll ? <FaChevronUp /> : <FaEllipsisH />}
        </button>
      )}
    </div>
  );
}
