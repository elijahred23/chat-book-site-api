import { useId } from "react";

export default function Field({ label, hint, error, as: Component = "input", id, className = "", ...props }) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label className={`ui-field ${className}`.trim()} htmlFor={controlId}>
      {label && <span className="ui-field__label">{label}</span>}
      <Component
        id={controlId}
        className="ui-input"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {hint && <span className="ui-field__hint" id={hintId}>{hint}</span>}
      {error && <span className="ui-field__error" id={errorId}>{error}</span>}
    </label>
  );
}
