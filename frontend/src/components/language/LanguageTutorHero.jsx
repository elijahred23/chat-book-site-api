import PropTypes from "prop-types";

export default function LanguageTutorHero({ nativeName, languageCode, direction = "ltr", title, eyebrow, description, itemCount, countLabel = "study items", className = "language-tutor-hero", copyClassName = "", kickerClassName = "", countClassName = "", children }) {
  return (
    <header className={className}>
      <div className={copyClassName}>
        <span className={kickerClassName}>{eyebrow}</span>
        <h1><span lang={languageCode} dir={direction}>{nativeName}</span> {title}</h1>
        <p>{description}</p>
      </div>
      {Number.isFinite(itemCount) && <div className={countClassName}><strong>{itemCount}</strong><span>{countLabel}</span></div>}
      {children}
    </header>
  );
}

LanguageTutorHero.propTypes = {
  nativeName: PropTypes.string.isRequired,
  languageCode: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(["ltr", "rtl"]),
  title: PropTypes.string.isRequired,
  eyebrow: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  itemCount: PropTypes.number,
  countLabel: PropTypes.string,
  className: PropTypes.string,
  copyClassName: PropTypes.string,
  kickerClassName: PropTypes.string,
  countClassName: PropTypes.string,
  children: PropTypes.node,
};
