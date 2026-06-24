import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "error";

type Props = {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
};

export function Badge({ tone = "neutral", dot = false, children }: Props) {
  const toneClass: Record<Tone, string> = {
    neutral: "badge--neutral border-slate-200 bg-slate-50 text-slate-600",
    accent: "badge--accent border-blue-200 bg-blue-50 text-blue-700",
    success: "badge--success border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "badge--warning border-amber-200 bg-amber-50 text-amber-700",
    error: "badge--error border-red-200 bg-red-50 text-red-700",
  };
  return (
    <span className={`badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${toneClass[tone]}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}
