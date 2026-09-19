import PropTypes from "prop-types";

const defaultClasses = {
  section: "language-item-list",
  heading: "language-item-list__heading",
  card: "language-item-card",
  copy: "language-item-card__copy",
  script: "language-item-card__script",
  pronunciation: "language-item-card__pronunciation",
  translation: "language-item-card__translation",
  context: "language-item-card__context",
};

export default function LanguageTutorItemList({
  items,
  kind,
  scriptKey,
  languageCode,
  direction = "ltr",
  visibleContent,
  idPrefix,
  classes = {},
  renderActions,
  renderBreakdown,
}) {
  const styles = { ...defaultClasses, ...classes };
  const isPhrases = kind === "phrases";
  return (
    <section className={styles.section}>
      <div className={styles.heading}><span>{isPhrases ? "Speak in context" : "Build your foundation"}</span><h3>{items.length} {isPhrases ? "key phrases" : "vocabulary words"}</h3></div>
      {items.map((item, index) => (
        <article id={`${idPrefix}-${kind}-${index}`} className={styles.card} key={`${item[scriptKey]}-${index}`}>
          <div className={styles.copy}>
            {visibleContent.script && <div className={styles.script} lang={languageCode} dir={direction}>{item[scriptKey]}</div>}
            {visibleContent.pronunciation && item.pronunciation && <div className={styles.pronunciation}>{item.pronunciation}</div>}
            {visibleContent.english && <div className={styles.translation}>{item.en}</div>}
            {isPhrases && item.context && <div className={styles.context}><span>Context</span>{item.context}</div>}
            {visibleContent.breakdown && renderBreakdown?.(item, index)}
          </div>
          {renderActions?.(item, index)}
        </article>
      ))}
    </section>
  );
}

LanguageTutorItemList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    pronunciation: PropTypes.string,
    en: PropTypes.string.isRequired,
    context: PropTypes.string,
  })).isRequired,
  kind: PropTypes.oneOf(["phrases", "vocab"]).isRequired,
  scriptKey: PropTypes.string.isRequired,
  languageCode: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(["ltr", "rtl"]),
  visibleContent: PropTypes.shape({
    script: PropTypes.bool.isRequired,
    pronunciation: PropTypes.bool.isRequired,
    english: PropTypes.bool.isRequired,
    breakdown: PropTypes.bool,
  }).isRequired,
  idPrefix: PropTypes.string.isRequired,
  classes: PropTypes.object,
  renderActions: PropTypes.func,
  renderBreakdown: PropTypes.func,
};
