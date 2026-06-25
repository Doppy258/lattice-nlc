import { motion } from "motion/react";
import { ChevronsLeft } from "lucide-react";
import { useApp } from "../../app/providers";
import { navigate } from "../../app/navigation";
import { Icon } from "../common/Icon";
import { BUSINESS_NAV, DEMO_NAV, USER_NAV, type NavItem } from "../../app/routes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SPRING } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

type Group = { label: string; items: NavItem[] };

function groupsForRole(role: string): Group[] {
  const user: Group = { label: "Discover", items: USER_NAV };
  const business: Group = { label: "Business", items: BUSINESS_NAV };
  const demo: Group = { label: "Admin", items: DEMO_NAV };
  if (role === "businessOwner") return [business, demo];
  if (role === "admin") return [user, business, demo];
  return [user, demo];
}

type Props = {
  currentPath: string;
  onNavigate?: () => void;
  /** Mobile drawer variant: always shows labels, no collapse control. */
  drawer?: boolean;
  /** Desktop icon-only mode. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ currentPath, onNavigate, drawer = false, collapsed = false, onToggleCollapse }: Props) {
  const { activeUser } = useApp();
  const groups = groupsForRole(activeUser.role);
  const scope = drawer ? "nav-drawer" : "nav-desktop";
  const iconOnly = collapsed && !drawer;

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const Row = ({ item }: { item: NavItem }) => {
    const active = currentPath === item.path;
    const body = (
      <a
        href={`#${item.path}`}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        onClick={(e) => {
          e.preventDefault();
          go(item.path);
        }}
        className={cn(
          "relative flex h-11 items-center rounded-xl outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/45",
          iconOnly ? "w-11 justify-center" : "gap-3 px-3",
          active
            ? "text-white"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId={`${scope}-active`}
            transition={SPRING}
            className="absolute inset-0 rounded-xl"
            style={{ background: "var(--grad-brand)", boxShadow: "0 10px 22px -12px rgba(37,99,255,0.9)" }}
          />
        )}
        <Icon name={item.icon} size={20} className="relative z-10 shrink-0" />
        {!iconOnly && (
          <span className="relative z-10 text-[15px] font-medium">{item.label}</span>
        )}
      </a>
    );

    if (iconOnly) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{body}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return body;
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        drawer && "bg-card",
      )}
    >
      {/* Brand */}
      <button
        onClick={() => go("/home")}
        className={cn(
          "mb-2 flex items-center rounded-xl p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/45",
          iconOnly ? "justify-center" : "gap-2.5",
        )}
        aria-label="Lattice home"
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
          style={{ background: "var(--grad-brand)", boxShadow: "var(--tile-shadow-lift)" }}
        >
          <img className="size-5 brightness-0 invert" src="/assets/lattice-mark.svg" alt="" />
        </span>
        {!iconOnly && (
          <span className="font-display text-[20px] font-bold tracking-tight">Lattice</span>
        )}
      </button>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
        {groups.map((group, gi) => (
          <div key={group.label} className="flex flex-col gap-1">
            {iconOnly ? (
              gi > 0 && <span className="mx-auto my-1.5 h-px w-7 bg-border" />
            ) : (
              <div className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <Row key={item.path} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse control (desktop only) */}
      {!drawer && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-1 flex h-10 items-center rounded-xl text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/45",
            iconOnly ? "w-11 justify-center" : "gap-2 px-3",
          )}
        >
          <ChevronsLeft
            className={cn("size-5 shrink-0 transition-transform", collapsed && "rotate-180")}
            strokeWidth={1.9}
          />
          {!iconOnly && <span className="text-sm font-medium">Collapse</span>}
        </button>
      )}
    </div>
  );
}
