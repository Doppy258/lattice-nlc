import type { ReactNode } from "react";
import { Badge as UIBadge } from "@/components/ui/badge";

type Tone = "neutral" | "accent" | "success" | "warning" | "error";

type Props = {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
};

const toneMap = {
  neutral: "secondary",
  accent: "default",
  success: "success",
  warning: "warning",
  error: "destructive",
} as const;

/** App pill badge. Public API unchanged; rendered on the shadcn badge primitive. */
export function Badge({ tone = "neutral", dot = false, children }: Props) {
  return (
    <UIBadge variant={toneMap[tone]}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </UIBadge>
  );
}
