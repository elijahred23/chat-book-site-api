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
  FaKeyboard,
  FaBullhorn,
  FaMagic,
  FaListAlt,
  FaDownload,
  FaSitemap,
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
      icon: FaComments,
      title: "Ask AI",
      color: "var(--btn-blue)",
      iconColor: "#0b1220",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setChatPrompt(cleanText));
        dispatch(actions.setIsChatOpen(true));
      },
    },
    {
      icon: FaVolumeUp,
      title: "TTS",
      color: "var(--btn-purple)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setTtsText(cleanText));
        dispatch(actions.setTtsAutoplay(true));
      },
    },
    {
      icon: FaScroll,
      title: "Teleprompter",
      color: "var(--btn-green)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setTeleprompterText(cleanText));
        dispatch(actions.setIsTeleprompterOpen(!isTeleprompterOpen));
      },
    },
    {
      icon: FaProjectDiagram,
      title: "PlantUML",
      color: "var(--btn-orange)",
      iconColor: "#0f172a",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setPlantUMLPrompt(cleanText));
        dispatch(actions.setIsPlantUMLOpen(true));
      },
    },
    {
      icon: GiNotebook,
      title: "Chat Book",
      color: "var(--btn-yellow)",
      iconColor: "#0f172a",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setChatBookSubject(cleanText));
        dispatch(actions.setIsChatBookOpen(true));
      },
    },
    {
      icon: FaSitemap,
      title: "Architecture Diagram",
      color: "var(--btn-orange)",
      iconColor: "#0f172a",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setArchitecturePrompt(cleanText));
        dispatch(actions.setIsArchitectureOpen(true));
      },
    },
    {
      icon: FaListAlt,
      title: "Flashcards Prompt",
      color: "#10b981",
      iconColor: "#0b172a",
      onClick: (e) => {
        e.stopPropagation();
        const seeded = `Create flashcards based on this context. Return concise term-definition pairs in JSON.\n\nContext:\n${cleanText}`;
        dispatch(actions.setFlashcardPrompt(seeded));
        // Open flashcards and close any drawers/panels
        dispatch(actions.setIsChatOpen(false));
        dispatch(actions.setIsTeleprompterOpen(false));
        dispatch(actions.setIsTTSOpen(false));
        dispatch(actions.setIsPlantUMLOpen(false));
        dispatch(actions.setIsPodcastTTSOpen(false));
        dispatch(actions.setIsJSGeneratorOpen(false));
        dispatch(actions.setIsChatBookOpen(false));
        dispatch(actions.setIsYouTubeOpen(false));
        dispatch(actions.setIsHtmlBuilderOpen(false));
        dispatch(actions.setIsTypingOpen(false));
        showMessage({ type: "success", message: "Prompt sent to Flashcards." });
      },
    },
    {
      icon: FaKeyboard,
      title: "Typing Test",
      color: "var(--btn-code)",
      iconColor: "#0b1220",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setTypingSource(cleanText));
        dispatch(actions.setIsTypingOpen(true));
      },
    },
    {
      icon: FaYoutube,
      title: "Open YT Transcript",
      color: "var(--yt-red)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setYouTubeSearchText(cleanText));
        dispatch(actions.setIsYouTubeOpen(true));
      },
    },
    {
      icon: FaCode,
      title: "HTML Builder",
      color: "var(--btn-purple)",
      iconColor: "#0b1220",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setHtmlInput(cleanText));
        dispatch(actions.setIsHtmlBuilderOpen(true));
      },
    },
    {
      icon: FaPodcast,
      title: "Podcast TTS",
      color: "var(--btn-podcast)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setPodcastTTSPrompt(cleanText));
        dispatch(actions.setIsPodcastTTSOpen(true));
      },
    },
    {
      icon: FaMagic,
      title: "JS Generator",
      color: "var(--btn-blue)",
      onClick: (e) => {
        e.stopPropagation();
        dispatch(actions.setIsJSGeneratorOpen(true));
        dispatch(actions.setJSGeneratorPrompt(cleanText));
      },
    },
    {
      icon: FcGoogle,
      title: "Ask Google",
      color: "var(--google-blue)",
      iconColor: "#0b1220",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(`https://www.google.com/search?q=${query}`, "_blank");
      },
    },
    {
      icon: SiWikipedia,
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
      icon: FaDownload,
      title: "Download .txt",
      color: "#e2e8f0",
      iconColor: "#0f172a",
      onClick: async (e) => {
        e.stopPropagation();
        try {
          const isMobile = /Mobi|Android/i.test(navigator.userAgent);
          const supportsPicker = typeof window.showSaveFilePicker === "function";

          if (supportsPicker && !isMobile) {
            const handle = await window.showSaveFilePicker({
              suggestedName: "content.txt",
              types: [
                {
                  description: "Text file",
                  accept: { "text/plain": [".txt"] },
                },
              ],
            });
            const writable = await handle.createWritable();
            await writable.write(cleanText || "");
            await writable.close();
            showMessage?.({ type: "success", message: "File saved where you chose." });
            return;
          }

          // Mobile or no file picker: prompt for name on mobile, otherwise direct download
          let filename = "content.txt";
          if (isMobile) {
            const inputName = window.prompt("Name your file", filename);
            if (!inputName) {
              showMessage?.({ type: "info", message: "Download canceled." });
              return;
            }
            filename = inputName.endsWith(".txt") ? inputName : `${inputName}.txt`;
          }
          const blob = new Blob([cleanText || ""], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          showMessage?.({ type: "success", message: `Downloaded ${filename}` });
        } catch (err) {
          console.error("Download failed", err);
          showMessage?.({ type: "error", message: "Download failed." });
        }
      },
    },
    {
      icon: FaBook,
      title: "Define Word",
      color: "var(--btn-gray)",
      iconColor: "#0f172a",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(`https://www.dictionary.com/browse/${query}`, "_blank");
      },
    },
    {
      icon: GiGraduateCap,
      title: "Google Scholar",
      color: "var(--scholar-blue)",
      iconColor: "#e2e8f0",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(`https://scholar.google.com/scholar?q=${query}`, "_blank");
      },
    },
    {
      icon: FaImage,
      title: "Image Search",
      color: "var(--google-blue)",
      iconColor: "#0b1220",
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
      icon: FaYoutube,
      title: "YouTube Results",
      color: "var(--yt-red)",
      iconColor: "#0b1220",
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
      icon: FaRedditAlien,
      title: "Ask Reddit",
      color: "var(--reddit-orange)",
      iconColor: "#0f172a",
      onClick: (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(cleanText);
        window.open(`https://www.reddit.com/search/?q=${query}`, "_blank");
      },
    },
    {
      icon: FaCopy,
      title: "Copy Text",
      color: "var(--btn-gray)",
      iconColor: "#0f172a",
      onClick: async (e) => {
        e.stopPropagation();
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(cleanText);
          } else {
            const helper = document.createElement("textarea");
            helper.value = cleanText;
            helper.setAttribute("readonly", "");
            helper.style.position = "absolute";
            helper.style.left = "-9999px";
            document.body.appendChild(helper);
            helper.select();
            document.execCommand("copy");
            document.body.removeChild(helper);
          }
          showMessage({ type: "success", message: "Text copied to clipboard!" });
        } catch (err) {
          showMessage({ type: "error", message: "Copy failed. Try copying manually." });
        }
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
          aria-label={btn.title}
          data-tooltip={btn.title}
          style={{
            background: btn.color,
            color: btn.iconColor || "#ffffff",
            boxShadow: "0 14px 30px rgba(15,23,42,0.25)"
          }}
        >
          {(() => {
            const Icon = btn.icon;
            return <Icon size={18} color={btn.iconColor || "#fff"} />;
          })()}
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
          data-tooltip={showAll ? "Show Less" : "Show More"}
        >
          {showAll ? <FaChevronUp /> : <FaEllipsisH />}
        </button>
      )}
    </div>
  );
}
