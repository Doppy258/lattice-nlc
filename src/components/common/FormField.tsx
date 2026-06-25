import type { InputHTMLAttributes, ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  hint?: string;
  error?: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

/** Labeled field. Public API unchanged; composed from shadcn label + input. */
export function FormField({ label, hint, error, children, ...inputProps }: Props) {
  const id = inputProps.id ?? inputProps.name;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children ?? <Input id={id} aria-invalid={!!error} {...inputProps} />}
      {hint && !error && (
        <span className="text-xs text-muted-foreground">{hint}</span>
      )}
      {error && (
        <span className="text-xs font-medium text-destructive">{error}</span>
      )}
    </div>
  );
}
