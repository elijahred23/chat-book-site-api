/* eslint-disable react/prop-types */
import './ProgressBar.css';

const ProgressBar = ({ progress = 0, label = 'Progress', onChange }) => {
  const value = Math.max(0, Math.min(Number(progress) || 0, 100));

  if (onChange) {
    return (
      <input
        className="progress-container progress-slider"
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        style={{ '--progress-value': `${value}%` }}
      />
    );
  }

  return (
    <div
      className="progress-container"
      role="progressbar"
      aria-label={label}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(value)}
    >
      <div
        className="progress-bar"
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

export default ProgressBar;
