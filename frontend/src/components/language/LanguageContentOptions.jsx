import PropTypes from "prop-types";

export default function LanguageContentOptions({ value, onChange, scriptLabel, showBreakdown = false, className = "language-content-options" }) {
  const options = [
    ["script", scriptLabel],
    ["pronunciation", "Pronunciation"],
    ["english", "English"],
    ...(showBreakdown ? [["breakdown", "Breakdown"]] : []),
  ];
  return (
    <fieldset className={className}>
      <legend>Content options</legend>
      {options.map(([key, label]) => <label key={key}><input type="checkbox" checked={Boolean(value[key])} onChange={(event) => onChange({ ...value, [key]: event.target.checked })} /><span>{label}</span></label>)}
    </fieldset>
  );
}

LanguageContentOptions.propTypes = {
  value: PropTypes.shape({ script: PropTypes.bool, pronunciation: PropTypes.bool, english: PropTypes.bool, breakdown: PropTypes.bool }).isRequired,
  onChange: PropTypes.func.isRequired,
  scriptLabel: PropTypes.string.isRequired,
  showBreakdown: PropTypes.bool,
  className: PropTypes.string,
};
