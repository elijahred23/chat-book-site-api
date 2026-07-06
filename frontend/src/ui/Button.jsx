import { forwardRef } from "react";

const Button = forwardRef(function Button({
  as: Component = "button",
  variant = "secondary",
  iconOnly = false,
  className = "",
  type,
  ...props
}, ref) {
  const classes = [
    "ui-btn",
    variant !== "secondary" ? `ui-btn--${variant}` : "",
    iconOnly ? "ui-btn--icon" : "",
    className,
  ].filter(Boolean).join(" ");

  return <Component ref={ref} className={classes} type={Component === "button" ? (type || "button") : type} {...props} />;
});

export default Button;
