import { useState } from "react";

type Props = {
  /** Accessible label + tooltip text explaining the adjacent control/metric. */
  text: string;
  label?: string;
};

export function HelpTooltip({ text, label = "More info" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="help-tooltip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="help-tooltip__trigger"
        aria-label={label}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span className="help-tooltip__bubble" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
