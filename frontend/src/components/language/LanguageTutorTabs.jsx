import PropTypes from "prop-types";
import "./LanguageTutorFrame.css";

const LANGUAGE_TUTOR_SECTIONS = [
  { id: "tutor", label: "Tutor" },
  { id: "loop", label: "Word Loop" },
  { id: "translate", label: (language) => `${language} → English` },
  { id: "games", label: "Games" },
  { id: "downloads", label: "MP3 Downloads" },
];

export default function LanguageTutorTabs({ language, activeTab, onChange, className = "", style, tabStyle, activeTabStyle }) {
  return (
    <nav className={`language-tutor-tabs ${className}`.trim()} style={style} aria-label={`${language} tutor sections`}>
      {LANGUAGE_TUTOR_SECTIONS.map((section) => (
        <button
          type="button"
          className={activeTab === section.id ? "active" : ""}
          style={activeTab === section.id ? activeTabStyle : tabStyle}
          onClick={() => onChange(section.id)}
          key={section.id}
        >
          {typeof section.label === "function" ? section.label(language) : section.label}
        </button>
      ))}
    </nav>
  );
}

LanguageTutorTabs.propTypes = {
  language: PropTypes.string.isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  tabStyle: PropTypes.object,
  activeTabStyle: PropTypes.object,
};
