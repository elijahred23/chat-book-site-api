import { useEffect, useId, useRef } from "react";
import {
  FaBookReader,
  FaCode,
  FaComments,
  FaExpandAlt,
  FaGlobe,
  FaKeyboard,
  FaMagic,
  FaPodcast,
  FaProjectDiagram,
  FaScroll,
  FaTimes,
  FaVolumeUp,
  FaYoutube,
} from "react-icons/fa";
import { GiNotebook } from "react-icons/gi";
import { SiMarkdown } from "react-icons/si";
import Button from "./Button";

const drawerMeta = {
  chat: { icon: FaComments, label: "AI Chat" },
  chat2: { icon: FaComments, label: "Dual Chat" },
  teleprompter: { icon: FaScroll, label: "Teleprompter" },
  tts: { icon: FaVolumeUp, label: "Text to Speech" },
  plantuml: { icon: FaProjectDiagram, label: "PlantUML" },
  podcast: { icon: FaPodcast, label: "Podcast TTS" },
  jsgen: { icon: FaMagic, label: "JS Generator" },
  chatbook: { icon: GiNotebook, label: "Chat Book" },
  youtube: { icon: FaYoutube, label: "YouTube" },
  html: { icon: FaCode, label: "HTML Builder" },
  typing: { icon: FaKeyboard, label: "Typing Test" },
  architecture: { icon: FaProjectDiagram, label: "Diagram" },
  iframe: { icon: FaGlobe, label: "Iframe" },
  large: { icon: FaBookReader, label: "Text Chunker" },
  asmr: { icon: FaKeyboard, label: "ASMR" },
  markdown: { icon: SiMarkdown, label: "Markdown" },
};

export default function SideDrawer({
  isOpen,
  isFullWidth,
  onClose,
  onToggleWidth,
  title,
  children,
  className = "",
  stack = [],
  currentKey,
}) {
  const titleId = useId();
  const drawerRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const meta = drawerMeta[currentKey] || { label: title || "Tool" };
  const displayTitle = title || meta.label;

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    document.body.classList.add("ui-scroll-locked");
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("ui-scroll-locked");
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  const drawerClass = [
    "chat-drawer",
    "ui-drawer",
    isOpen ? "open" : "",
    isFullWidth ? "full ui-drawer--full" : "half ui-drawer--standard",
    className,
  ].filter(Boolean).join(" ");

  return (
    <>
      {isOpen && <button className="ui-drawer__backdrop" type="button" onClick={onClose} aria-label={`Close ${displayTitle}`} />}
      <aside
        ref={drawerRef}
        className={drawerClass}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-labelledby={titleId}
      >
        <header className="ui-drawer__header">
          <div className="ui-drawer__heading">
            {meta.icon && <span className="ui-drawer__title-icon"><meta.icon aria-hidden="true" /></span>}
            <div>
              <span className="ui-drawer__eyebrow">Quick tool</span>
              <h2 id={titleId}>{displayTitle}</h2>
            </div>
          </div>
          <div className="ui-drawer__actions">
            {onToggleWidth && (
              <Button className="ui-drawer__size-button" variant="ghost" onClick={onToggleWidth} aria-label={isFullWidth ? "Use standard drawer width" : "Use full screen width"}>
                <FaExpandAlt aria-hidden="true" />
                <span>{isFullWidth ? "Standard" : "Full screen"}</span>
              </Button>
            )}
            <Button ref={closeRef} iconOnly variant="ghost" onClick={onClose} aria-label={`Close ${displayTitle}`}><FaTimes /></Button>
          </div>
          {stack.length > 1 && (
            <div className="ui-drawer__history" aria-label="Open tool history">
              {stack.map((key, index) => {
                const item = drawerMeta[key];
                if (!item) return null;
                const Icon = item.icon;
                return (
                  <span className={key === currentKey ? "is-active" : ""} key={`${key}-${index}`} title={item.label}>
                    <Icon aria-hidden="true" /><span className="ui-sr-only">{item.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </header>
        <div className="ui-drawer__content">{children}</div>
      </aside>
    </>
  );
}
