import { toast } from "sonner";
import { useApp } from "@/app/providers";
import { useHashRoute } from "@/app/navigation";
import { Icon } from "@/components/common/Icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { initials } from "@/utils/formatting";
import type { User } from "@/models";
import { LatticeMark } from "./LatticeMark";
import { titleForPath } from "./navConfig";

function UserSwitcher() {
  const { data, activeUser, setActiveUserId, setActiveBusinessId } = useApp();
  const groups: Array<{ label: string; users: User[] }> = [
    { label: "Customers", users: data.users.filter((u) => u.role === "customer") },
    { label: "Business owners", users: data.users.filter((u) => u.role === "businessOwner") },
    { label: "Admin", users: data.users.filter((u) => u.role === "admin") },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card/70 pl-1.5 pr-3 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] transition-[transform,background-color] duration-200 hover:bg-card active:scale-[0.98]"
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-[11px]">{initials(activeUser.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate sm:block">{activeUser.name}</span>
          <Icon name="chevron" size={15} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {groups.map((group) =>
          group.users.length ? (
            <div key={group.label}>
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.users.map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => {
                    setActiveUserId(u.id);
                    setActiveBusinessId("");
                  }}
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1">{u.name}</span>
                  {u.id === activeUser.id && <Icon name="check" size={15} className="text-primary" />}
                </DropdownMenuItem>
              ))}
            </div>
          ) : null,
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BusinessSwitcher() {
  const { ownedBusinesses, activeBusiness, setActiveBusinessId } = useApp();
  if (ownedBusinesses.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card/70 px-3 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] transition-[transform,background-color] duration-200 hover:bg-card active:scale-[0.98] sm:flex"
        >
          <Icon name="store" size={16} className="text-primary" />
          <span className="max-w-32 truncate">{activeBusiness?.name ?? "Select business"}</span>
          <Icon name="chevron" size={15} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>Your businesses</DropdownMenuLabel>
        {ownedBusinesses.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => setActiveBusinessId(b.id)}>
            <span className="flex-1">{b.name}</span>
            {b.id === activeBusiness?.id && <Icon name="check" size={15} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar() {
  const { path } = useHashRoute();
  const { resetDemo } = useApp();
  const title = titleForPath(path);

  return (
    <header className="glass sticky top-0 z-30 flex h-[var(--topbar-h)] items-center gap-3 px-5 min-[900px]:px-8">
      {/* Mobile brand (sidebar is hidden under 900px) */}
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2.5 min-[900px]:hidden"
        aria-label="Lattice home"
        onClick={() => (window.location.hash = "#/home")}
      >
        <LatticeMark size={34} />
      </button>

      <h1 className="hidden text-[19px] font-semibold tracking-[-0.03em] text-foreground min-[900px]:block">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <BusinessSwitcher />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                resetDemo();
                toast.success("Demo data reset", { description: "Seeded data restored to its original state." });
              }}
              aria-label="Reset demo data"
              className="grid size-10 cursor-pointer place-items-center rounded-full border border-border bg-card/70 text-muted-foreground shadow-[var(--shadow-soft)] transition-[transform,color,background-color] duration-200 hover:bg-card hover:text-foreground active:scale-95"
            >
              <Icon name="demo" size={17} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reset demo data</TooltipContent>
        </Tooltip>
        <UserSwitcher />
      </div>
    </header>
  );
}
