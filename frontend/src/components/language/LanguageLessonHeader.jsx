import PropTypes from "prop-types";

export default function LanguageLessonHeader({ title, summary, badges, className = "language-lesson-header", badgeClassName = "language-lesson-badge" }) {
  return (
    <div className={className}>
      <h2>{title}</h2>
      <p>{summary}</p>
      <div>{badges.filter(Boolean).map((badge) => <span className={badgeClassName} key={badge}>{badge}</span>)}</div>
    </div>
  );
}

LanguageLessonHeader.propTypes = {
  title: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired,
  badges: PropTypes.arrayOf(PropTypes.string).isRequired,
  className: PropTypes.string,
  badgeClassName: PropTypes.string,
};
