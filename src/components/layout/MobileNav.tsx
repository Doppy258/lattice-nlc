/**
 * MobileNav — bottom tab bar (<900px) showing the first 4 nav items from
 * `navForRole`. A "More" button opens a Dialog with the remaining items
 * in a 3-column grid. Hidden above 900px where <Sidebar> takes over.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { useApp } from "@/app/providers";
import { useHashRoute, navigate } from "@/app/navigation";
import { Icon } from "@/components/common/Icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { navForRole, type NavItem } from "./navConfig";

function isActive(path: string, target: string): boolean {
  return path === target || path.startsWith(`${target}/`);
}

function MobileLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => {
        navigate(item.path);
        onClick?.();
      }}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon name={item.icon} size={21} strokeWidth={active ? 2.2 : 1.8} />
      <span className="tracking-tight">{item.label}</span>
    </motion.button>
  );
}

export function MobileNav() {
  const { path } = useHashRoute();
  const { activeUser } = useApp();
  const [open, setOpen] = useState(false);

  const nav = navForRole(activeUser.role);
  const primary = nav.slice(0, 4);
  const rest = nav.slice(4);

  return (
    <>
      <nav className="glass fixed inset-x-0 bottom-0 z-40 flex h-[68px] items-stretch justify-around gap-1 px-2 min-[900px]:hidden">
        {primary.map((item) => (
          <MobileLink key={item.path} item={item} active={isActive(path, item.path)} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="More"
          className="flex h-full flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium text-muted-foreground transition-colors active:scale-95"
        >
          <Icon name="demo" size={21} />
          <span className="tracking-tight">More</span>
        </button>
      </nav>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-7">
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
          </DialogHeader>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {rest.map((item) => {
              const active = isActive(path, item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3.5 text-xs font-medium text-foreground shadow-[var(--shadow-soft)] transition-[transform,background-color] active:scale-95",
                    active && "border-primary/30 bg-accent text-accent-foreground",
                  )}
                >
                  <Icon name={item.icon} size={22} className={active ? "text-primary" : "text-muted-foreground"} />
                  {item.label}
                </button>
              );
            })}
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
