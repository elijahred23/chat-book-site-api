export default function Card({ as: Component = "section", variant = "default", className = "", ...props }) {
  const classes = ["ui-card", variant !== "default" ? `ui-card--${variant}` : "", className]
    .filter(Boolean)
    .join(" ");
  return <Component className={classes} {...props} />;
}
