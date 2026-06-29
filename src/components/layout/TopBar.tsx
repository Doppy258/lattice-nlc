/**
 * TopBar - the sticky header visible on every authenticated page. Shows the
 * current page title (desktop), a mobile brand mark that navigates home, a
 * business-owner switcher dropdown, and the user profile dropdown (with sign-out).
 * Props: none (reads route + auth context)
 * Role in architecture: Layout — top-level chrome element used inside AppLayout.
 * Provides navigation affordances and user/session controls without leaving the
 * current page context.
 */
import { useApp } from "@/app/providers";
import { useHashRoute, navigate } from "@/app/navigation";
import { Icon } from "@/components/common/Icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/utils/formatting";
import { LatticeMark } from "./LatticeMark";
import { homePathForRole, titleForPath } from "./navConfig";

function ProfileMenu() {
  const { activeUser, signOut } = useApp();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card/70 pl-1.5 pr-3 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] outline-none transition-[transform,background-color] duration-200 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-[11px]">{initials(activeUser.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate sm:block">{activeUser.name}</span>
          <Icon name="chevron" size={15} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem onClick={() => navigate("/help")} className="cursor-pointer gap-2.5">
          <Icon name="help" size={16} />
          Help
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer gap-2.5">
          <Icon name="settings" size={16} />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer gap-2.5 text-destructive focus:text-destructive"
        >
          <Icon name="logout" size={16} />
          Sign out
        </DropdownMenuItem>
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
          className="hidden h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card/70 px-3 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] outline-none transition-[transform,background-color] duration-200 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] sm:flex"
        >
          <Icon name="store" size={16} className="text-primary" />
          <span className="max-w-32 truncate">{activeBusiness?.name ?? "Select business"}</span>
          <Icon name="chevron" size={15} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {ownedBusinesses.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => setActiveBusinessId(b.id)} className="cursor-pointer gap-2">
            <Icon name="store" size={14} />
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
  const { activeUser } = useApp();
  const title = titleForPath(path);

  return (
    <header className="glass sticky top-0 z-30 flex h-[var(--topbar-h)] items-center gap-3 px-5 min-[900px]:px-8">
      {/* Mobile brand (sidebar is hidden under 900px) */}
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background min-[900px]:hidden"
        aria-label="Lattice home"
        onClick={() => navigate(homePathForRole(activeUser.role))}
      >
        <LatticeMark size={34} />
      </button>

      <h1 className="hidden text-[19px] font-semibold tracking-[-0.03em] text-foreground min-[900px]:block">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <BusinessSwitcher />
        <ProfileMenu />
      </div>
    </header>
  );
}
