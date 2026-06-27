import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaBookOpen, FaCode, FaCog, FaHome, FaMusic, FaTimes } from "react-icons/fa";
import Button from "./Button";

const navigationGroups = [
  {
    label: "Workspace",
    icon: FaHome,
    items: [
      { to: "/", label: "Home" },
      { to: "/flashCards", label: "Flash Cards" },
      { to: "/Quran", label: "Quran" },
      { to: "/bengali", label: "Bengali Tutor" },
    ],
  },
  {
    label: "Practice",
    icon: FaCode,
    items: [
      { to: "/coding", label: "Coding Problems" },
      { to: "/system-design", label: "System Design" },
      { to: "/typingTest", label: "Typing Test" },
    ],
  },
  {
    label: "Create & read",
    icon: FaBookOpen,
    items: [
      { to: "/chatBook", label: "Chat Book" },
      { to: "/pdf-to-text", label: "PDF to Text" },
      { to: "/markdown-viewer", label: "Markdown Viewer" },
    ],
  },
  {
    label: "Media & tools",
    icon: FaMusic,
    items: [
      { to: "/youTubeTranscript", label: "YouTube Transcript" },
      { to: "/media-player", label: "Media Player" },
      { to: "/action-buttons-studio", label: "Action Studio" },
    ],
  },
];

export default function AppHeader({ isOpen, onToggle, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <header className="app-header">
      <NavLink className="app-brand" to="/" aria-label="Eli Himi workspace home" onClick={onClose}>
        <span className="app-brand__mark" aria-hidden="true">EH</span>
        <span className="app-brand__copy">
          <strong>Eli Himi</strong>
          <span>Learning workspace</span>
        </span>
      </NavLink>

      <nav className="app-header__quick-nav" aria-label="Primary navigation">
        <NavLink to="/flashCards">Flash cards</NavLink>
        <NavLink to="/coding">Coding</NavLink>
        <NavLink to="/system-design">System design</NavLink>
      </nav>

      <Button
        iconOnly
        className="app-header__menu-button"
        onClick={onToggle}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
        aria-controls="app-navigation-panel"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </Button>

      {isOpen && (
        <>
          <button className="app-nav__backdrop" type="button" onClick={onClose} aria-label="Close navigation" />
          <div className="app-nav" id="app-navigation-panel" ref={panelRef}>
            <div className="app-nav__header">
              <div>
                <span className="app-nav__eyebrow">Navigate</span>
                <h2>Choose a workspace</h2>
              </div>
              <Button iconOnly variant="ghost" onClick={onClose} aria-label="Close navigation"><FaTimes /></Button>
            </div>
            <div className="app-nav__groups">
              {navigationGroups.map(({ label, icon: Icon, items }) => (
                <section className="app-nav__group" key={label}>
                  <h3><Icon aria-hidden="true" /> {label}</h3>
                  <div className="app-nav__links">
                    {items.map((item) => (
                      <NavLink key={item.to} to={item.to} onClick={onClose}>{item.label}</NavLink>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <NavLink className="app-nav__settings" to="/apiCheck" onClick={onClose}>
              <FaCog aria-hidden="true" /> Settings and API status
            </NavLink>
          </div>
        </>
      )}
    </header>
  );
}
