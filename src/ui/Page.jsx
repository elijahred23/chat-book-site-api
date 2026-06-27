export function Page({ className = "", children }) {
  return <div className={`ui-page ${className}`.trim()}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="ui-page__header">
      <div>
        {eyebrow && <p className="ui-page__eyebrow">{eyebrow}</p>}
        <h1 className="ui-page__title">{title}</h1>
        {description && <p className="ui-page__description">{description}</p>}
      </div>
      {actions && <div className="ui-cluster">{actions}</div>}
    </header>
  );
}
