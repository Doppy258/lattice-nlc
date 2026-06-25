import { motion } from "motion/react";
import { navigate } from "../../app/navigation";
import { Icon } from "../common/Icon";
import { MOBILE_NAV } from "../../app/routes";
import { cn } from "@/lib/utils";
import { SPRING } from "@/components/motion/tokens";

export function MobileNav({ currentPath }: { currentPath: string }) {
  const pingPath = "/create-ping";
  const items = MOBILE_NAV.filter((item) => item.path !== pingPath);
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  const Item = ({ path, label, icon }: (typeof items)[number]) => {
    const active = currentPath === path;
    return (
      <a
        href={`#${path}`}
        aria-current={active ? "page" : undefined}
        onClick={(e) => {
          e.preventDefault();
          navigate(path);
        }}
        className={cn(
          "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="mobilenav-active"
            transition={SPRING}
            className="absolute inset-0 rounded-2xl bg-brand-tint"
          />
        )}
        <Icon name={icon} size={20} className="relative z-10" />
        <span className="relative z-10">{label}</span>
      </a>
    );
  };

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-3 z-40 flex items-end justify-center gap-1 rounded-full border border-border bg-[var(--surface-glass-strong)] p-1.5 shadow-lift backdrop-blur-xl lg:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {left.map((item) => (
        <Item key={item.path} {...item} />
      ))}
      <div className="-mt-7 flex shrink-0 flex-col items-center px-1">
        <motion.button
          type="button"
          aria-label="Start a request"
          aria-current={currentPath === pingPath ? "page" : undefined}
          onClick={() => navigate(pingPath)}
          whileTap={{ scale: 0.92 }}
          className="grid size-14 place-items-center rounded-full text-white shadow-[0_16px_30px_-12px_rgba(37,99,255,0.9)] outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2"
          style={{ background: "var(--grad-brand)" }}
        >
          <Icon name="ping" size={22} />
        </motion.button>
      </div>
      {right.map((item) => (
        <Item key={item.path} {...item} />
      ))}
    </nav>
  );
}
