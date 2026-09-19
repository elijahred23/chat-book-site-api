import PropTypes from "prop-types";
import "./LanguageTutorFrame.css";

const voiceKey = (voice) => `${voice.name}__${voice.lang}`;

export default function LanguageVoicePicker({ label, value, voices, onChange, extraOptions = [], className = "language-voice-picker", selectClassName = "", style, selectStyle }) {
  return (
    <section className={className} style={style}>
      <label>
        <strong>{label}</strong>
        <select className={selectClassName} style={selectStyle} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">System default</option>
          {extraOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          {voices.map((voice) => <option value={voiceKey(voice)} key={voiceKey(voice)}>{voice.name} ({voice.lang})</option>)}
        </select>
      </label>
    </section>
  );
}

LanguageVoicePicker.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  voices: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string.isRequired, lang: PropTypes.string.isRequired })).isRequired,
  onChange: PropTypes.func.isRequired,
  extraOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })),
  className: PropTypes.string,
  selectClassName: PropTypes.string,
  style: PropTypes.object,
  selectStyle: PropTypes.object,
};
