import type { ReactNode } from "react";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/motion/Reveal";

/** Centered glass card on the blue-tinted canvas — the shared auth/onboarding frame. */
export function AuthShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-dvh place-items-center p-5">
      <Reveal className={wide ? "w-full max-w-xl" : "w-full max-w-md"} y={12}>
        <div className="glass-strong rounded-[var(--tile-radius-lg)] p-7 sm:p-8">{children}</div>
      </Reveal>
    </div>
  );
}

/** Inline error banner — solid danger tint, no gradient. */
export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-xl bg-[var(--danger-tint)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--danger)]"
    >
      <Icon name="alert" size={15} />
      <span>{message}</span>
    </div>
  );
}
