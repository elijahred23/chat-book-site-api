import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  FaBookReader,
  FaChevronUp,
  FaComments,
  FaCopy,
  FaDownload,
  FaEllipsisH,
  FaKeyboard,
  FaLanguage,
  FaLightbulb,
  FaListAlt,
  FaProjectDiagram,
  FaQuestionCircle,
  FaScroll,
  FaVolumeUp,
  FaYoutube,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { GiGraduateCap, GiNotebook } from "react-icons/gi";
import { SiMarkdown, SiWikipedia } from "react-icons/si";
import { actions, useAppDispatch, useAppState } from "../context/AppContext";
import { useFlyout } from "../context/FlyoutContext";
import "./ActionButtons.css";

function removeMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```[a-zA-Z]*\n?/, "").replace(/```$/, "")
    )
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[*+-]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^([-*_] *){3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function keepBengaliText(text) {
  return (text.match(/[\u0980-\u09FF\u0964]+/g) || []).join(" ");
}

function downloadText(text, extension, mimeType, showMessage) {
  const filename = `content.${extension}`;
  const blob = new Blob([text || ""], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage?.({ type: "success", message: `Downloaded ${filename}` });
}

const AI_INSTRUCTIONS = {
  summarize: "Summarize the following text. Preserve the most important facts and return a concise, well-structured summary:\n\n",
  explain: "Explain the following text in simple language for a beginner. Define unfamiliar terms and use a short example where helpful:\n\n",
  quiz: "Create a quiz from the following text. Include a mix of multiple-choice and short-answer questions, then provide a clearly separated answer key:\n\n",
};

export default function ActionButtons({ promptText, limitButtons = false }) {
  const dispatch = useAppDispatch();
  const state = useAppState();
  const navigate = useNavigate();
  const { showMessage } = useFlyout();
  const [showAll, setShowAll] = useState(false);
  const rawText = promptText || "";
  const cleanText = removeMarkdown(rawText);

  const openChat = (prompt) => {
    dispatch(actions.setChatPrompt(prompt));
    dispatch(actions.setIsChatOpen(true));
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage?.({ type: "success", message: `${label} copied to clipboard!` });
    } catch {
      showMessage?.({ type: "error", message: "Copy failed. Try copying manually." });
    }
  };

  const groups = [
    {
      label: "AI",
      buttons: [
        { icon: FaComments, title: "Ask AI", drawer: "chat", color: "var(--btn-blue)", onClick: () => openChat(cleanText) },
        { icon: FaListAlt, title: "Summarize", drawer: "chat", color: "var(--btn-purple)", onClick: () => openChat(AI_INSTRUCTIONS.summarize + cleanText) },
        { icon: FaLightbulb, title: "Explain Simply", drawer: "chat", color: "var(--btn-orange)", onClick: () => openChat(AI_INSTRUCTIONS.explain + cleanText) },
        { icon: FaQuestionCircle, title: "Create Quiz", drawer: "chat", color: "var(--btn-pink)", onClick: () => openChat(AI_INSTRUCTIONS.quiz + cleanText) },
      ],
    },
    {
      label: "Learn",
      buttons: [
        { icon: FaLanguage, title: "Break Down Bengali", drawer: "bengaliBreakdown", color: "#047857", onClick: () => { dispatch(actions.setBengaliBreakdownText(keepBengaliText(cleanText))); dispatch(actions.setIsBengaliBreakdownOpen(true)); } },
        {
          icon: GiGraduateCap,
          title: "Create Flashcards",
          color: "var(--scholar-blue)",
          onClick: () => {
            dispatch(actions.setFlashcardPrompt(cleanText));
            navigate("/flashCards");
          },
        },
        { icon: GiNotebook, title: "Chat Book", drawer: "chatbook", color: "var(--btn-yellow)", iconColor: "#0f172a", onClick: () => { dispatch(actions.setChatBookSubject(cleanText)); dispatch(actions.setIsChatBookOpen(true)); } },
        { icon: FaKeyboard, title: "Typing Test", drawer: "typing", color: "var(--btn-code)", iconColor: "#0b1220", onClick: () => { dispatch(actions.setTypingSource(cleanText)); dispatch(actions.setIsTypingOpen(true)); } },
        { icon: FaProjectDiagram, title: "PlantUML Diagram", drawer: "plantuml", color: "var(--btn-slate)", onClick: () => { dispatch(actions.setPlantUMLPrompt(cleanText)); dispatch(actions.setIsPlantUMLOpen(true)); } },
      ],
    },
    {
      label: "Read",
      buttons: [
        { icon: FaVolumeUp, title: "Text to Speech", drawer: "tts", color: "var(--btn-purple)", onClick: () => { dispatch(actions.setTtsText(cleanText)); dispatch(actions.setTtsAutoplay(true)); dispatch(actions.setIsTTSOpen(true)); } },
        { icon: FaScroll, title: "Teleprompter", drawer: "teleprompter", color: "var(--btn-green)", onClick: () => { dispatch(actions.setTeleprompterText(cleanText)); dispatch(actions.setIsTeleprompterOpen(true)); } },
        { icon: SiMarkdown, title: "Markdown Viewer", drawer: "markdown", color: "#0f766e", onClick: () => { dispatch(actions.setMarkdownViewerText(rawText)); dispatch(actions.setIsMarkdownViewerOpen(true)); } },
        { icon: FaBookReader, title: "Chunk Text", drawer: "large", color: "#8b5cf6", onClick: () => { dispatch(actions.setCopyText(cleanText)); dispatch(actions.setLargeTextBuffer(cleanText)); dispatch(actions.setIsLargeTextOpen(true)); } },
      ],
    },
    {
      label: "Search",
      buttons: [
        { icon: FcGoogle, title: "Search Google", color: "var(--google-blue)", iconColor: "#0b1220", onClick: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(cleanText)}`, "_blank", "noopener,noreferrer") },
        { icon: SiWikipedia, title: "Search Wikipedia", color: "var(--wiki-grey)", onClick: () => window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanText)}`, "_blank", "noopener,noreferrer") },
        { icon: FaYoutube, title: "Search YouTube", drawer: "youtube", color: "var(--yt-red)", onClick: () => { dispatch(actions.setYouTubeSearchText(cleanText)); dispatch(actions.setIsYouTubeOpen(true)); } },
      ],
    },
    {
      label: "Export",
      buttons: [
        { icon: FaCopy, title: "Copy Text", color: "var(--btn-gray)", onClick: () => copyText(cleanText, "Text") },
        { icon: FaDownload, title: "Download Text", color: "#e2e8f0", iconColor: "#0f172a", onClick: () => downloadText(cleanText, "txt", "text/plain", showMessage) },
        { icon: SiMarkdown, title: "Copy Markdown", color: "#0f766e", onClick: () => copyText(rawText, "Markdown") },
      ],
    },
  ];

  const openDrawer = state.drawerStack?.[state.drawerStack.length - 1];
  const drawerLabels = {
    chat: "AI Chat", chatbook: "Chat Book", typing: "Typing Test", plantuml: "PlantUML",
    tts: "Text to Speech", teleprompter: "Teleprompter", markdown: "Markdown Viewer",
    large: "Text Chunker", youtube: "YouTube Transcript",
    bengaliBreakdown: "Bengali Breakdown",
  };
  let remaining = limitButtons && !showAll ? 8 : Number.POSITIVE_INFINITY;

  return (
    <div className="action-buttons-panel" onClick={(event) => event.stopPropagation()}>
      {openDrawer && drawerLabels[openDrawer] ? (
        <div className="action-drawer-status" role="status">
          <span aria-hidden="true" /> Open drawer: {drawerLabels[openDrawer]}
        </div>
      ) : null}

      <div className="action-button-groups">
        {groups.map((group) => {
          const visible = group.buttons.slice(0, Math.max(remaining, 0));
          remaining -= visible.length;
          if (!visible.length) return null;
          return (
            <section className="action-button-group" aria-label={`${group.label} actions`} key={group.label}>
              <span className="action-group-label">{group.label}</span>
              <div className="action-buttons">
                {visible.map((button) => {
                  const Icon = button.icon;
                  const isActive = Boolean(button.drawer && button.drawer === openDrawer);
                  return (
                    <button
                      key={button.title}
                      type="button"
                      onClick={button.onClick}
                      className={`icon-btn${isActive ? " is-active" : ""}`}
                      title={button.title}
                      aria-label={button.title}
                      aria-pressed={button.drawer ? isActive : undefined}
                      data-tooltip={button.title}
                      style={{ background: button.color, color: button.iconColor || "#fff" }}
                    >
                      <Icon size={15} color={button.iconColor || "#fff"} />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {limitButtons ? (
          <button
            type="button"
            className="icon-btn more-btn"
            onClick={() => setShowAll((current) => !current)}
            title={showAll ? "Show Less" : "Show More"}
            aria-label={showAll ? "Show fewer actions" : "Show all actions"}
            aria-expanded={showAll}
            data-tooltip={showAll ? "Show Less" : "Show More"}
          >
            {showAll ? <FaChevronUp /> : <FaEllipsisH />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

ActionButtons.propTypes = {
  promptText: PropTypes.string,
  limitButtons: PropTypes.bool,
};
