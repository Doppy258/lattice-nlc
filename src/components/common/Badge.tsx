import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "error";

type Props = {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
};

export function Badge({ tone = "neutral", dot = false, children }: Props) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}
