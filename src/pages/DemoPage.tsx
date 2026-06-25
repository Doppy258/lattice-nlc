import { motion } from "motion/react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Badge, type BadgeTone } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { StatTile } from "@/components/common/StatTile";
import { PageHeader } from "@/components/common/PageHeader";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { UserRole } from "@/models";
import { VERIFICATION_CODE } from "@/utils/constants";
import { initials } from "@/utils/formatting";
import { cn } from "@/lib/utils";

const ROLE_META: Record<UserRole, { label: string; tone: BadgeTone }> = {
  customer: { label: "Customer", tone: "brand" },
  businessOwner: { label: "Business owner", tone: "violet" },
  admin: { label: "Admin", tone: "warning" },
};

export function DemoPage() {
  const {
    data,
    activeUserId,
    setActiveUserId,
    ownedBusinesses,
    activeBusinessId,
    setActiveBusinessId,
    resetDemo,
  } = useApp();

  const order: UserRole[] = ["customer", "businessOwner", "admin"];
  const users = [...data.users].sort(
    (a, b) => order.indexOf(a.role) - order.indexOf(b.role) || a.name.localeCompare(b.name),
  );

  function handleReset() {
    if (window.confirm("Reset all demo data to its seeded state? This clears your claims, reviews, offers and rankings.")) {
      resetDemo();
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Demo"
        accent="controls"
        subtitle="Switch between seeded identities to explore both sides of Lattice, jump into a storefront, or reset everything to a clean state for the next walkthrough."
        actions={
          <Button variant="danger" iconLeft={<Icon name="demo" size={16} />} onClick={handleReset}>
            Reset demo data
          </Button>
        }
      />

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile tone="blue" label="Users" value={data.users.length} icon={<Icon name="home" size={17} />} />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="violet" label="Businesses" value={data.businesses.length} icon={<Icon name="store" size={17} />} />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="mint" label="Offers" value={data.offers.length} icon={<Icon name="ticket" size={17} />} />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="amber" label="Claims" value={data.claims.length} icon={<Icon name="claims" size={17} />} />
        </StaggerItem>
      </Stagger>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em]">
            Switch <span className="font-accent font-normal text-primary">account</span>
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Customers see the discovery side; business owners get the storefront suite.
          </p>
        </div>
        <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => {
            const active = u.id === activeUserId;
            const role = ROLE_META[u.role];
            return (
              <StaggerItem key={u.id}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveUserId(u.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-[var(--tile-radius)] border p-4 text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5",
                    active
                      ? "border-primary/45 bg-[var(--tint-blue)] ring-1 ring-inset ring-primary/20 shadow-[var(--shadow-soft)]"
                      : "border-border bg-card shadow-[var(--shadow-card)] hover:border-[var(--input)]",
                  )}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-[14px] font-semibold text-[var(--primary-strong)]">
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-display text-[15px] font-semibold tracking-[-0.02em]">{u.name}</span>
                      {active && <Icon name="check" size={14} className="shrink-0 text-primary" />}
                    </div>
                    <p className="truncate text-[12px] text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge tone={role.tone}>{role.label}</Badge>
                </motion.button>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {ownedBusinesses.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em]">
              Active <span className="font-accent font-normal text-primary">storefront</span>
            </h2>
            <p className="text-[13px] text-muted-foreground">
              This owner manages {ownedBusinesses.length} {ownedBusinesses.length === 1 ? "business" : "businesses"}. Pick which one the suite controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {ownedBusinesses.map((b) => {
              const active = b.id === activeBusinessId;
              return (
                <motion.button
                  key={b.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveBusinessId(b.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                    active
                      ? "border-primary/40 bg-[var(--brand-tint)] text-[var(--primary-strong)]"
                      : "border-border bg-card text-foreground hover:border-[var(--input)] hover:bg-muted",
                  )}
                >
                  <Icon name="store" size={14} /> {b.name}
                  {active && <Icon name="check" size={14} className="text-primary" />}
                </motion.button>
              );
            })}
          </div>
          <Button variant="secondary" iconLeft={<Icon name="store" size={16} />} onClick={() => navigate("/dashboard")}>
            Go to business dashboard
          </Button>
        </section>
      )}

      <Card variant="glassBlue" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card/70 text-primary shadow-[var(--shadow-soft)]">
            <Icon name="check" size={20} />
          </span>
          <div>
            <h3 className="font-display text-[16px] font-semibold tracking-[-0.02em]">Verification code</h3>
            <p className="text-[13px] text-muted-foreground">
              Any human-check or claim step in the demo accepts this code.
            </p>
          </div>
        </div>
        <span className="mono self-start rounded-xl bg-card/80 px-4 py-2 text-2xl font-semibold tracking-[0.18em] text-[var(--primary-strong)] shadow-[var(--shadow-soft)] sm:self-auto">
          {VERIFICATION_CODE}
        </span>
      </Card>
    </div>
  );
}
