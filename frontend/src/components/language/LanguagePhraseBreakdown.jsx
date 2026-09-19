import PropTypes from "prop-types";

export default function LanguagePhraseBreakdown({ phrase, languageCode, direction = "ltr", speechSource, onSpeechSourceChange, onSpeakWord, visiblePronunciation = true }) {
  if (!phrase.words?.length) return null;
  return (
    <div className="bn-breakdown language-phrase-breakdown">
      <div className="bn-breakdown-header">
        <div className="bn-breakdown-heading">
          <strong>Phrase breakdown</strong>
          <span>{phrase.words.length} words · tap a word to hear it</span>
        </div>
        <label className="bn-breakdown-speech-control"><span>Voice</span><select className="bn-select" value={speechSource} onChange={(event) => onSpeechSourceChange(event.target.value)} aria-label="Choose phrase breakdown word speech source"><option value="google">Google</option><option value="system">System</option></select></label>
      </div>
      <div className="bn-breakdown-list" dir={direction}>
        {phrase.words.map((word, index) => (
          <div className="bn-breakdown-word" key={`${word.script}-${index}`}>
            <span className="bn-breakdown-number" aria-hidden="true">{index + 1}</span>
            <button type="button" className="bn-breakdown-speakable" lang={languageCode} dir={direction} aria-label={`Hear ${word.script}`} onClick={() => onSpeakWord(word.script, speechSource)}>{word.script}</button>
            <div className="bn-breakdown-meaning" dir="ltr">
              {visiblePronunciation && <span className="bn-pronunciation">{word.pronunciation}</span>}
              <span className="bn-translation">{word.en}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

LanguagePhraseBreakdown.propTypes = {
  phrase: PropTypes.shape({ words: PropTypes.arrayOf(PropTypes.object) }).isRequired,
  languageCode: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(["ltr", "rtl"]),
  speechSource: PropTypes.oneOf(["google", "system"]).isRequired,
  onSpeechSourceChange: PropTypes.func.isRequired,
  onSpeakWord: PropTypes.func.isRequired,
  visiblePronunciation: PropTypes.bool,
};
