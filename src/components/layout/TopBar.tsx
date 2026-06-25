import { Check, ChevronDown, LogOut, MapPin, Menu, Store } from "lucide-react";
import { useApp } from "../../app/providers";
import { navigate } from "../../app/navigation";
import { initials } from "../../utils/formatting";
import { CATEGORY_META, DEMO_ORIGINS } from "../../data/catalog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isSupabaseConfigured } from "../../services/supabaseClient";

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  businessOwner: "Business owner",
  admin: "Admin",
};

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const {
    data,
    activeUser,
    activeUserId,
    setActiveUserId,
    ownedBusinesses,
    activeBusinessId,
    setActiveBusinessId,
    signOut,
  } = useApp();

  const originName =
    DEMO_ORIGINS.find((o) => o.id === activeUser.homeLocationId)?.name ??
    "San Antonio";

  const switchUser = (id: string) => {
    setActiveUserId(id);
    const role = data.users.find((u) => u.id === id)?.role;
    navigate(role === "businessOwner" ? "/business" : "/home");
  };

  const showBizSwitch =
    (activeUser.role === "businessOwner" || activeUser.role === "admin") &&
    ownedBusinesses.length > 0;
  const activeBusiness = ownedBusinesses.find((b) => b.id === activeBusinessId);

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-2.5 border-b border-border/70 bg-[var(--surface-glass)] px-4 backdrop-blur-xl sm:px-8 lg:px-10">
      <button
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/45 lg:hidden"
      >
        <Menu className="size-5" strokeWidth={1.8} />
      </button>

      <div className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 text-sm font-medium text-foreground sm:inline-flex">
        <MapPin className="size-4 text-primary" strokeWidth={1.9} />
        <span>{originName}</span>
      </div>

      {showBizSwitch && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/80 pr-2.5 pl-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/45">
              <span className="grid size-7 place-items-center rounded-full bg-brand-tint text-primary">
                <Store className="size-4" strokeWidth={1.9} />
              </span>
              <span className="hidden max-w-[140px] truncate text-left text-sm font-semibold sm:block">
                {activeBusiness?.name ?? "Select business"}
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Managing</DropdownMenuLabel>
            {ownedBusinesses.map((biz) => (
              <DropdownMenuItem
                key={biz.id}
                className="gap-2.5 py-2"
                onSelect={() => setActiveBusinessId(biz.id)}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-tint text-primary">
                  <Store className="size-4" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {biz.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {CATEGORY_META[biz.category].label}
                  </span>
                </span>
                {biz.id === activeBusinessId && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex h-11 items-center gap-2.5 rounded-full border border-border bg-card/80 py-1 pr-2.5 pl-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/45">
            <Avatar className="size-9">
              <AvatarFallback>{initials(activeUser.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[150px] truncate text-sm font-semibold">
                {activeUser.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {ROLE_LABELS[activeUser.role]}
              </span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Switch profile</DropdownMenuLabel>
          {data.users.map((user) => (
            <DropdownMenuItem
              key={user.id}
              className="gap-2.5 py-2"
              onSelect={() => switchUser(user.id)}
            >
              <Avatar className="size-8">
                <AvatarFallback className="text-[11px]">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {user.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role]}
                </span>
              </span>
              {user.id === activeUserId && (
                <Check className="size-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          {isSupabaseConfigured && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem
                className="gap-2.5 py-2"
                onSelect={() => {
                  signOut();
                  navigate("/login");
                }}
              >
                <LogOut className="size-4" strokeWidth={1.9} />
                <span>Sign out</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

    </header>
  );
}
