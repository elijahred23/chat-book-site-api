import './ProgressBar.css';

const ProgressBar = ({ progress = 0, label = 'Progress' }) => {
  const value = Math.max(0, Math.min(Number(progress) || 0, 100));

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
