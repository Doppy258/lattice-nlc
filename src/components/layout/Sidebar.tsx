import { motion } from "motion/react";
import { useApp } from "@/app/providers";
import { useHashRoute, navigate } from "@/app/navigation";
import { Icon } from "@/components/common/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LatticeMark } from "./LatticeMark";
import { navForRole, type NavItem } from "./navConfig";

function isActive(path: string, target: string): boolean {
  return path === target || path.startsWith(`${target}/`);
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative grid size-12 cursor-pointer place-items-center rounded-2xl text-muted-foreground transition-colors duration-200",
            "hover:bg-white/55 hover:text-foreground",
            active &&
              "bg-primary text-white shadow-[var(--shadow-cta)] hover:bg-primary hover:text-white",
          )}
        >
          <Icon name={item.icon} size={20} strokeWidth={active ? 2.1 : 1.8} />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const { path } = useHashRoute();
  const { activeUser } = useApp();
  const nav = navForRole(activeUser.role);

  return (
    <aside className="glass-blue fixed left-0 top-0 z-40 hidden h-screen w-[var(--sidebar-w)] flex-col items-center gap-1 py-5 min-[900px]:flex">
      <button
        type="button"
        onClick={() => navigate("/home")}
        aria-label="Lattice home"
        className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
      >
        <LatticeMark size={42} />
      </button>

      <nav className="mt-4 flex flex-1 flex-col items-center gap-1.5">
        {nav.map((item) => (
          <SidebarLink key={item.path} item={item} active={isActive(path, item.path)} />
        ))}
      </nav>
    </aside>
  );
}
