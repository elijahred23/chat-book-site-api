import PropTypes from "prop-types";

export default function LanguageTutorContentTabs({ activeTab, onChange, phraseCount, vocabCount, className = "language-content-tabs", buttonClassName = "" }) {
  return (
    <div className={className} role="tablist" aria-label="Lesson content">
      <button type="button" role="tab" aria-selected={activeTab === "phrases"} className={`${buttonClassName} ${activeTab === "phrases" ? "active" : ""}`.trim()} onClick={() => onChange("phrases")} disabled={!phraseCount}>Key Phrases</button>
      <button type="button" role="tab" aria-selected={activeTab === "vocab"} className={`${buttonClassName} ${activeTab === "vocab" ? "active" : ""}`.trim()} onClick={() => onChange("vocab")} disabled={!vocabCount}>Vocabulary</button>
    </div>
  );
}

LanguageTutorContentTabs.propTypes = {
  activeTab: PropTypes.oneOf(["phrases", "vocab"]).isRequired,
  onChange: PropTypes.func.isRequired,
  phraseCount: PropTypes.number.isRequired,
  vocabCount: PropTypes.number.isRequired,
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
};
