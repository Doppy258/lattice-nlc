import type { InputHTMLAttributes, ReactNode } from "react";
import { FormError } from "./FormError";

type Props = {
  label: string;
  hint?: string;
  error?: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({ label, hint, error, children, ...inputProps }: Props) {
  const id = inputProps.id ?? inputProps.name;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children ?? (
        <input className="text-input" id={id} {...inputProps} />
      )}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <FormError message={error} />}
    </div>
  );
}
