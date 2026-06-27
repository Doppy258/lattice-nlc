/**
 * ReportsPage — route: /reports
 *
 * The customer's impact report, framed as a journey: a tier you climb, goal
 * rings you fill, badges you unlock, and a timeline of real milestones — all
 * computed from lifetime activity so achievements never disappear.
 *
 * Below the journey sits a customizable, analytical breakdown: a date-range and
 * category filter scope a separate report used to render savings-by-month,
 * claims-by-category, and rating-distribution charts, plus CSV and print export
 * so the data can be analysed outside the app.
 */
import { useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Award,
  Check,
  Compass,
  Crown,
  Footprints,
  Lock,
  MapPinned,
  MessageSquareText,
  PiggyBank,
  ScanLine,
  Sparkles,
  Store,
  Ticket,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { InsightSummary } from "@/components/common/InsightSummary";
import { PageHeader } from "@/components/common/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { BarColumns, BarList } from "@/components/charts/Charts";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { ALL_CATEGORIES, CATEGORY_META } from "@/data/catalog";
import {
  getUserReport,
  rangeToFromDate,
  RANGE_PRESETS,
  type RangePreset,
} from "@/services/reportService";
import { offerSavingsPerRedemption } from "@/utils/offerPricing";
import { formatCurrency } from "@/utils/formatting";
import { downloadCsv, dateStamp, slugify, printReport, type CsvSection } from "@/utils/export";
import { cn } from "@/lib/utils";
import type { BusinessCategory, Claim, ClaimStatus, ReportFilters, UserReport } from "@/models";

/* ============================================================================
   THE IMPACT JOURNEY
   Impact reframed as progress: a tier you climb, goal rings you fill, badges
   you unlock, and a timeline of real moments. Gamified, but restrained — blue,
   glass, solid colour, soft shadow. No gradients, no neon.
   ========================================================================== */

/** A single source of "impact points". The breakdown is shown to the user, so
 *  the score reads as earned rather than arbitrary. */
type PointDef = { key: string; label: string; each: number; icon: LucideIcon; get: (r: UserReport) => number };

const POINT_DEFS: PointDef[] = [
  { key: "redeemed", label: "Passes redeemed", each: 100, icon: ScanLine, get: (r) => r.totalRedeemed },
  { key: "saved", label: "Dollars saved", each: 5, icon: PiggyBank, get: (r) => Math.round(r.estimatedSavings) },
  { key: "businesses", label: "Local businesses", each: 75, icon: Store, get: (r) => r.businessesSupported },
  { key: "reviews", label: "Reviews shared", each: 25, icon: MessageSquareText, get: (r) => r.reviewsSubmitted },
  { key: "categories", label: "Categories explored", each: 75, icon: Compass, get: (r) => r.claimsByCategory.length },
];

function computePoints(r: UserReport): number {
  return POINT_DEFS.reduce((sum, d) => sum + d.each * d.get(r), 0);
}

type Tier = { name: string; min: number; icon: LucideIcon; blurb: string };

const TIERS: Tier[] = [
  { name: "Newcomer", min: 0, icon: Footprints, blurb: "Just getting started nearby" },
  { name: "Regular", min: 250, icon: Sparkles, blurb: "Showing up for local spots" },
  { name: "Local Champion", min: 700, icon: Award, blurb: "A pillar of the neighbourhood" },
  { name: "Lattice Legend", min: 1400, icon: Crown, blurb: "Local support, mastered" },
];

type GoalDef = { key: string; label: string; current: number; goal: number; color: string; icon: LucideIcon; money: boolean };
type BadgeTone = "blue" | "violet" | "mint" | "amber";
type BadgeDef = { id: string; name: string; desc: string; icon: LucideIcon; tone: BadgeTone; current: number; goal: number; money: boolean };
type JourneyEvent = { id: string; ms: number; dateLabel: string; title: string; detail: string; icon: LucideIcon; highlight: boolean };

const BADGE_TONE: Record<BadgeTone, { card: string; icon: string }> = {
  blue: { card: "bg-[var(--tint-blue)] border-[var(--tint-blue-border)]", icon: "text-[var(--primary-strong)]" },
  violet: { card: "bg-[var(--tint-violet)] border-[var(--tint-violet-border)]", icon: "text-[var(--brand-violet)]" },
  mint: { card: "bg-[var(--tint-mint)] border-[var(--tint-mint-border)]", icon: "text-[var(--success)]" },
  amber: { card: "bg-[var(--tint-amber)] border-[var(--tint-amber-border)]", icon: "text-[var(--warning)]" },
};

/** Next round target above `current` (e.g. 2 businesses -> goal of 3). */
function nextMilestone(current: number, ladder: number[]): number {
  return ladder.find((m) => m > current) ?? ladder[ladder.length - 1];
}

function showVal(n: number, money: boolean): string {
  return money ? formatCurrency(n) : n.toLocaleString();
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMonthYear(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/* ---------------------------------------------------------------- primitives */

/** Solid-stroke SVG progress ring (no gradient). Fills in on mount; static under
 *  reduced motion. The journey's signature shape. */
function ProgressRing({
  value,
  size = 150,
  stroke = 13,
  color = "var(--primary)",
  ariaLabel,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  ariaLabel?: string;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * clamped;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={ariaLabel}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduced ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function StatChip({ icon: Glyph, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 text-[12px] font-medium text-foreground shadow-[var(--shadow-soft)]">
      <Glyph size={14} className="text-primary" aria-hidden="true" />
      {children}
    </span>
  );
}

function SectionHeading({ title, sub, aside }: { title: string; sub?: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.025em] sm:text-[22px]">{title}</h2>
        {sub && <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{sub}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Renders a tier name with its final word in the serif accent face. */
function TierName({ name }: { name: string }) {
  const parts = name.split(" ");
  const last = parts[parts.length - 1];
  const head = parts.slice(0, -1).join(" ");
  return (
    <>
      {head && <>{head} </>}
      <span className="font-accent font-normal text-primary">{last}</span>
    </>
  );
}

function PointTile({ icon: Glyph, label, count, each, subtotal }: { icon: LucideIcon; label: string; count: number; each: number; subtotal: number }) {
  return (
    <div className="rounded-[var(--tile-radius)] border border-border bg-card/85 p-4 shadow-[var(--shadow-soft)]">
      <span className="grid size-8 place-items-center rounded-xl bg-accent text-primary">
        <Glyph size={17} aria-hidden="true" />
      </span>
      <div className="mt-3 font-display text-[22px] font-semibold leading-none tracking-[-0.03em]">+{subtotal.toLocaleString()}</div>
      <div className="mt-1.5 text-[12.5px] font-medium text-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
        {count.toLocaleString()} × {each}
      </div>
    </div>
  );
}

function GoalRing({ goal }: { goal: GoalDef }) {
  const value = goal.goal > 0 ? goal.current / goal.goal : 1;
  const remaining = Math.max(0, goal.goal - goal.current);
  return (
    <Card variant="solid" className="flex flex-col items-center gap-4 p-6 text-center">
      <span className="grid size-9 place-items-center rounded-xl bg-muted">
        <goal.icon size={18} style={{ color: goal.color }} aria-hidden="true" />
      </span>
      <ProgressRing
        value={value}
        size={148}
        stroke={13}
        color={goal.color}
        ariaLabel={`${goal.label}: ${showVal(goal.current, goal.money)} of ${showVal(goal.goal, goal.money)}`}
      >
        <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.03em]">{showVal(goal.current, goal.money)}</span>
        <span className="mt-1 font-mono text-[11px] text-muted-foreground">/ {showVal(goal.goal, goal.money)}</span>
      </ProgressRing>
      <div>
        <div className="font-display text-[15px] font-semibold tracking-[-0.01em]">{goal.label}</div>
        <div className="mt-0.5 text-[12.5px] text-muted-foreground">
          {remaining > 0 ? `${showVal(remaining, goal.money)} to go` : "Goal complete"}
        </div>
      </div>
    </Card>
  );
}

function BadgeCard({ badge }: { badge: BadgeDef }) {
  const earned = badge.current >= badge.goal;
  const tone = BADGE_TONE[badge.tone];
  const pct = Math.min(100, Math.round((badge.current / badge.goal) * 100));
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-[var(--tile-radius)] border p-5 transition-colors",
        earned ? tone.card : "border-border bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-2xl",
            earned ? "bg-card/70 shadow-[var(--shadow-soft)]" : "bg-card/55",
          )}
        >
          <badge.icon size={21} className={earned ? tone.icon : "text-muted-foreground"} aria-hidden="true" />
        </span>
        {earned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-card/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground">
            <Check size={11} aria-hidden="true" /> Earned
          </span>
        ) : (
          <Lock size={15} className="text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div>
        <div className={cn("font-display text-[15px] font-semibold tracking-[-0.01em]", !earned && "text-muted-foreground")}>{badge.name}</div>
        <div className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{badge.desc}</div>
      </div>
      {!earned && (
        <div className="mt-auto pt-1">
          <Progress value={pct} className="h-1.5" indicatorStyle={{ background: "var(--muted-foreground)" }} />
          <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">
            {showVal(badge.current, badge.money)} / {showVal(badge.goal, badge.money)}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineRow({ event, label, isLast }: { event: JourneyEvent; label: string; isLast: boolean }) {
  return (
    <li className="relative flex gap-4">
      {!isLast && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-border" aria-hidden="true" />}
      <span
        className={cn(
          "relative z-[1] grid size-10 shrink-0 place-items-center rounded-full border shadow-[var(--shadow-soft)]",
          event.highlight ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-primary",
        )}
      >
        <event.icon size={18} aria-hidden="true" />
      </span>
      <div className={cn("flex-1", isLast ? "pb-0" : "pb-7")}>
        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          {label}
          {event.dateLabel && <> · {event.dateLabel}</>}
        </div>
        <div className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">{event.title}</div>
        <div className="text-[13px] leading-relaxed text-muted-foreground">{event.detail}</div>
      </div>
    </li>
  );
}

function TierLadderRow({ tier, points, isCurrent }: { tier: Tier; points: number; isCurrent: boolean }) {
  const achieved = points >= tier.min;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3",
        isCurrent ? "border-[var(--tint-blue-border)] bg-[var(--tint-blue)]" : "border-border bg-card/60",
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", achieved ? "bg-card text-primary shadow-[var(--shadow-soft)]" : "bg-muted text-muted-foreground")}>
        <tier.icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("font-display text-[14px] font-semibold tracking-[-0.01em]", !achieved && "text-muted-foreground")}>{tier.name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{tier.min.toLocaleString()}+ pts</div>
      </div>
      {isCurrent ? (
        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-foreground">Now</span>
      ) : achieved ? (
        <Check size={16} className="text-primary" aria-hidden="true" />
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export function ReportsPage() {
  const { data, activeUser } = useApp();
  // Filters scope only the analytical breakdown + export — never the lifetime
  // journey above it, so badges and tiers stay earned regardless of the range.
  const [range, setRange] = useState<RangePreset>("all");
  const [category, setCategory] = useState<BusinessCategory | "all">("all");
  const [status, setStatus] = useState<ClaimStatus | "all">("all");

  const d = useMemo(() => {
    const reportData = { claims: data.claims, offers: data.offers, businesses: data.businesses, reviews: data.reviews };
    const report = getUserReport(activeUser.id, {}, reportData);
    const points = computePoints(report);

    let tierIndex = 0;
    for (let i = 0; i < TIERS.length; i++) if (points >= TIERS[i].min) tierIndex = i;
    const tier = TIERS[tierIndex];
    const nextTier = TIERS[tierIndex + 1] ?? null;
    const progressToNext = nextTier ? (points - tier.min) / (nextTier.min - tier.min) : 1;
    const remaining = nextTier ? Math.max(0, nextTier.min - points) : 0;

    const savingsRounded = Math.round(report.estimatedSavings);
    const categories = report.claimsByCategory.length;

    // Standing among members who have any activity (real percentile).
    const activeIds = [...new Set(data.claims.map((c) => c.userId))];
    const others = activeIds.filter((id) => id !== activeUser.id);
    let below = 0;
    for (const uid of others) {
      if (computePoints(getUserReport(uid, {}, reportData)) < points) below++;
    }
    const aheadPct = others.length > 0 ? Math.round((100 * below) / others.length) : 0;
    const showStanding = others.length > 0 && aheadPct >= 20;
    const memberSince = fmtMonthYear(activeUser.createdAt);

    const pointTiles = POINT_DEFS.map((def) => {
      const count = def.get(report);
      return { key: def.key, label: def.label, icon: def.icon, count, each: def.each, subtotal: count * def.each };
    });

    const goals: GoalDef[] = [
      { key: "biz", label: "Businesses supported", current: report.businessesSupported, goal: nextMilestone(report.businessesSupported, [3, 5, 10, 20, 35]), color: "var(--primary)", icon: Store, money: false },
      { key: "save", label: "Total saved", current: savingsRounded, goal: nextMilestone(savingsRounded, [25, 50, 100, 250, 500, 1000]), color: "var(--success)", icon: PiggyBank, money: true },
      { key: "cat", label: "Categories explored", current: categories, goal: 7, color: "var(--brand-violet)", icon: Compass, money: false },
      { key: "redeem", label: "Passes redeemed", current: report.totalRedeemed, goal: nextMilestone(report.totalRedeemed, [3, 5, 10, 25, 50]), color: "var(--primary-bright)", icon: Ticket, money: false },
    ];

    const badges: BadgeDef[] = [
      { id: "first-steps", name: "First Steps", desc: "Redeem your very first Lattice pass.", icon: Footprints, tone: "blue", current: report.totalRedeemed, goal: 1, money: false },
      { id: "collector", name: "Pass Collector", desc: "Claim five passes in total.", icon: Ticket, tone: "blue", current: report.totalClaimed, goal: 5, money: false },
      { id: "explorer", name: "Explorer", desc: "Claim across three categories.", icon: Compass, tone: "amber", current: categories, goal: 3, money: false },
      { id: "first-word", name: "First Word", desc: "Share your first local review.", icon: MessageSquareText, tone: "mint", current: report.reviewsSubmitted, goal: 1, money: false },
      { id: "voice", name: "Community Voice", desc: "Share ten reviews with the community.", icon: Award, tone: "violet", current: report.reviewsSubmitted, goal: 10, money: false },
      { id: "supporter", name: "Local Supporter", desc: "Support three local businesses.", icon: Store, tone: "mint", current: report.businessesSupported, goal: 3, money: false },
      { id: "trailblazer", name: "Trailblazer", desc: "Claim across five categories.", icon: MapPinned, tone: "amber", current: categories, goal: 5, money: false },
      { id: "saver", name: "Saver", desc: "Save twenty-five dollars in all.", icon: PiggyBank, tone: "amber", current: savingsRounded, goal: 25, money: true },
      { id: "completionist", name: "Completionist", desc: "Explore all seven categories.", icon: Crown, tone: "violet", current: categories, goal: 7, money: false },
    ];
    const earnedCount = badges.filter((b) => b.current >= b.goal).length;
    const locked = badges.filter((b) => b.current < b.goal).sort((a, b) => b.current / b.goal - a.current / a.goal);
    const nudge = locked[0] ?? null;

    // Milestone timeline drawn from real claims.
    const offerById = new Map(data.offers.map((o) => [o.id, o]));
    const bizById = new Map(data.businesses.map((b) => [b.id, b]));
    const myClaims = data.claims.filter((c) => c.userId === activeUser.id);
    const raw: JourneyEvent[] = [];
    const add = (ms: number, title: string, detail: string, icon: LucideIcon) => {
      if (Number.isNaN(ms)) return;
      raw.push({ id: title, ms, dateLabel: fmtDate(new Date(ms).toISOString()), title, detail, icon, highlight: false });
    };

    if (activeUser.createdAt) add(Date.parse(activeUser.createdAt), "Joined Lattice", "Your local journey began here.", Sparkles);

    const byCreated = [...myClaims].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const first = byCreated[0];
    if (first) {
      const o = offerById.get(first.offerId);
      const b = bizById.get(first.businessId);
      add(Date.parse(first.createdAt), "Claimed your first pass", `${o?.title ?? "An offer"} · ${b?.name ?? "a local spot"}`, Ticket);
    }

    const redeemedClaims = myClaims.filter((c) => c.status === "redeemed");
    const byRedeemed = [...redeemedClaims].sort((a, b) => Date.parse(a.redeemedAt ?? a.createdAt) - Date.parse(b.redeemedAt ?? b.createdAt));
    const firstR = byRedeemed[0];
    if (firstR) {
      const b = bizById.get(firstR.businessId);
      add(Date.parse(firstR.redeemedAt ?? firstR.createdAt), "First redemption", `Verified a pass at ${b?.name ?? "a local business"}.`, ScanLine);
    }

    let big: Claim | null = null;
    let bigSave = 0;
    for (const c of redeemedClaims) {
      const o = offerById.get(c.offerId);
      const s = o ? offerSavingsPerRedemption(o) : 0;
      if (s > bigSave) {
        bigSave = s;
        big = c;
      }
    }
    if (big && bigSave > 0) {
      const b = bizById.get(big.businessId);
      add(Date.parse(big.redeemedAt ?? big.createdAt), "Biggest single saving", `Saved ${formatCurrency(bigSave)} at ${b?.name ?? "a local business"}.`, TrendingUp);
    }

    if (report.favoriteCategory) {
      const fav = report.favoriteCategory;
      const favClaims = myClaims.filter((c) => bizById.get(c.businessId)?.category === fav);
      if (favClaims.length > 0) {
        const latest = favClaims.reduce((m, c) => (Date.parse(c.createdAt) > Date.parse(m.createdAt) ? c : m), favClaims[0]);
        add(Date.parse(latest.createdAt), `${CATEGORY_META[fav].label} became your favourite`, `${favClaims.length} claims — your most-loved category.`, Sparkles);
      }
    }

    raw.sort((a, b) => a.ms - b.ms);
    const seen = new Set<string>();
    const events: JourneyEvent[] = [];
    for (const e of raw) {
      if (!seen.has(e.title)) {
        seen.add(e.title);
        events.push(e);
      }
    }
    events.push({ id: "now", ms: Date.now(), dateLabel: "Today", title: "You are here", detail: `${tier.name} · ${points.toLocaleString()} impact points.`, icon: tier.icon, highlight: true });

    return {
      points,
      tier,
      tierIndex,
      nextTier,
      progressToNext,
      remaining,
      pointTiles,
      goals,
      badges,
      earnedCount,
      nudge,
      events,
      aheadPct,
      showStanding,
      memberSince,
    };
  }, [activeUser.id, activeUser.createdAt, data.claims, data.offers, data.businesses, data.reviews]);

  // Filtered report powering the analytical breakdown + export (date range + category).
  const filtered = useMemo(() => {
    const filters: ReportFilters = {
      fromDate: rangeToFromDate(range),
      category: category === "all" ? undefined : category,
      claimStatus: status === "all" ? undefined : status,
    };
    return getUserReport(activeUser.id, filters, {
      claims: data.claims,
      offers: data.offers,
      businesses: data.businesses,
      reviews: data.reviews,
    });
  }, [activeUser.id, range, category, status, data.claims, data.offers, data.businesses, data.reviews]);

  function exportCsv() {
    const rangeLabel = RANGE_PRESETS.find((r) => r.value === range)?.label ?? "All time";
    const categoryLabel = category === "all" ? "All categories" : CATEGORY_META[category].label;
    const sections: CsvSection[] = [
      {
        title: `Impact report — ${activeUser.name}`,
        headers: ["Metric", "Value"],
        rows: [
          ["Date range", rangeLabel],
          ["Category", categoryLabel],
          ["Status filter", status === "all" ? "Any status" : status],
          ["Passes claimed", filtered.totalClaimed],
          ["Passes redeemed", filtered.totalRedeemed],
          ["Estimated savings", formatCurrency(filtered.estimatedSavings)],
          ["Businesses supported", filtered.businessesSupported],
          ["Reviews submitted", filtered.reviewsSubmitted],
          ["Average rating given", filtered.averageRatingGiven || "—"],
          ["Favourite category", filtered.favoriteCategory ? CATEGORY_META[filtered.favoriteCategory].label : "—"],
        ],
      },
      {
        title: "Savings by month",
        headers: ["Month", "Saved"],
        rows: filtered.savingsByMonth.length > 0
          ? filtered.savingsByMonth.map((p) => [p.label, Math.round(p.value)])
          : [["No data", 0]],
      },
      {
        title: "Claims by category",
        headers: ["Category", "Claims"],
        rows: filtered.claimsByCategory.length > 0
          ? filtered.claimsByCategory.map((p) => [p.label, p.value])
          : [["No data", 0]],
      },
      {
        title: "Ratings you gave",
        headers: ["Rating", "Count"],
        rows: filtered.ratingDistribution.map((p) => [p.label, p.value]),
      },
    ];
    downloadCsv(`lattice-impact-${slugify(activeUser.name)}-${dateStamp()}.csv`, sections);
  }

  const hasClaims = data.claims.some((c) => c.userId === activeUser.id);

  if (!hasClaims) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Your impact"
          accent="journey"
          subtitle="Tiers to climb, goals to fill, and badges to earn — all from supporting local."
        />
        <EmptyState
          icon="rankings"
          title="Your journey starts here"
          body="Claim and redeem your first local offer to begin earning tiers, badges, and milestones along the way."
          action={
            <Button variant="brand" iconLeft={<Sparkles size={17} />} onClick={() => navigate("/create")}>
              Create a Lattice
            </Button>
          }
        />
      </div>
    );
  }

  const pct = Math.round(d.progressToNext * 100);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Your impact"
        accent="journey"
        subtitle="Every pass you redeem moves you up a tier, fills a goal, and unlocks the next badge."
      />

      {/* ── Tier hero ─────────────────────────────────────────────────── */}
      <Reveal className="glass-blue beam-host overflow-hidden rounded-[var(--tile-radius-lg)] p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-card/70 text-primary shadow-[var(--shadow-soft)]">
                <d.tier.icon size={24} aria-hidden="true" />
              </span>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Level {String(d.tierIndex + 1).padStart(2, "0")}
                </div>
                <h1 className="font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[38px]">
                  <TierName name={d.tier.name} />
                </h1>
              </div>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{d.tier.blurb}.</p>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-[32px] font-semibold leading-none tracking-[-0.03em]">{d.points.toLocaleString()}</span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">impact points</span>
            </div>

            <div className="mt-5 max-w-md">
              <Progress value={pct} indicatorStyle={{ background: "var(--primary)" }} />
              <div className="mt-2 text-[13px] text-muted-foreground">
                {d.nextTier ? (
                  <>
                    <span className="font-semibold text-foreground">{d.remaining.toLocaleString()} pts</span> to{" "}
                    <span className="font-semibold text-foreground">{d.nextTier.name}</span>
                  </>
                ) : (
                  "You've reached the highest tier — a true Lattice Legend."
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {d.showStanding && <StatChip icon={TrendingUp}>Ahead of {d.aheadPct}% of members</StatChip>}
              {d.memberSince && <StatChip icon={Sparkles}>Member since {d.memberSince}</StatChip>}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center">
            <ProgressRing
              value={d.progressToNext}
              size={208}
              stroke={16}
              color="var(--primary)"
              ariaLabel={d.nextTier ? `${pct}% of the way to ${d.nextTier.name}` : "Highest tier reached"}
            >
              {d.nextTier ? (
                <>
                  <span className="font-display text-[36px] font-semibold leading-none tracking-[-0.03em]">{pct}%</span>
                  <span className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">to {d.nextTier.name}</span>
                </>
              ) : (
                <>
                  <Crown size={32} className="text-primary" aria-hidden="true" />
                  <span className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Max tier</span>
                </>
              )}
            </ProgressRing>
          </div>
        </div>
      </Reveal>

      {/* ── How points are earned ─────────────────────────────────────── */}
      <Reveal delay={0.05} className="rounded-[var(--tile-radius)] border border-border bg-card/85 p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-4 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          How you earned {d.points.toLocaleString()} points
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {d.pointTiles.map((t) => (
            <PointTile key={t.key} icon={t.icon} label={t.label} count={t.count} each={t.each} subtotal={t.subtotal} />
          ))}
        </div>
      </Reveal>

      {/* ── Customizable analytical breakdown + export ─────────────────── */}
      <section className="space-y-4">
        <SectionHeading
          title="By the numbers"
          sub="Filter your activity by time and category, then export it for deeper analysis."
          aside={
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Select
                value={range}
                onChange={(e) => setRange(e.target.value as RangePreset)}
                className="w-40"
                aria-label="Filter by date range"
              >
                {RANGE_PRESETS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory | "all")}
                className="w-40"
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </Select>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClaimStatus | "all")}
                className="w-36"
                aria-label="Filter by status"
              >
                <option value="all">Any status</option>
                <option value="pending">Pending</option>
                <option value="redeemed">Redeemed</option>
                <option value="expired">Expired</option>
              </Select>
              <Button variant="secondary" iconLeft={<Icon name="download" size={16} />} onClick={exportCsv}>
                Export CSV
              </Button>
              <Button variant="secondary" iconLeft={<Icon name="print" size={16} />} onClick={printReport}>
                Print
              </Button>
            </div>
          }
        />

        <InsightSummary
          title="Filtered totals"
          density="comfortable"
          items={[
            { label: "Passes claimed", value: filtered.totalClaimed, detail: "In this range" },
            { label: "Redeemed", value: filtered.totalRedeemed, detail: "Approved in-store" },
            { label: "Saved", value: formatCurrency(filtered.estimatedSavings), detail: "Estimated" },
            { label: "Businesses", value: filtered.businessesSupported, detail: "Supported locally" },
            { label: "Reviews", value: filtered.reviewsSubmitted, detail: "You've written" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="solid" className="space-y-5 p-6">
            <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em]">Savings by month</h3>
            <BarColumns data={filtered.savingsByMonth} color="var(--success)" format={(n) => formatCurrency(n)} />
          </Card>
          <Card variant="solid" className="space-y-5 p-6">
            <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em]">Claims by category</h3>
            <BarList data={filtered.claimsByCategory} color="var(--primary)" />
          </Card>
          <Card variant="solid" className="space-y-5 p-6 lg:col-span-2">
            <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em]">Ratings you've given</h3>
            <BarList data={filtered.ratingDistribution} color="var(--brand-violet)" />
          </Card>
        </div>
      </section>

      {/* ── Goal rings ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading title="Goals in progress" sub="Quiet targets to chase on your way up the tiers." />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.goals.map((g) => (
            <StaggerItem key={g.key}>
              <GoalRing goal={g} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Badges ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading
          title="Badges"
          sub="Earned in full colour. Locked badges show exactly what's next."
          aside={
            <span className="rounded-full border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] px-3 py-1 text-[12px] font-semibold text-[var(--primary-strong)]">
              {d.earnedCount} of {d.badges.length} earned
            </span>
          }
        />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.badges.map((b) => (
            <StaggerItem key={b.id}>
              <BadgeCard badge={b} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Timeline + next milestone / tier ladder ───────────────────── */}
      <section className="space-y-4">
        <SectionHeading title="Your journey so far" sub="Milestones drawn from your real Lattice activity." />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card variant="solid" className="p-6 sm:p-7 lg:col-span-2">
            <ol className="relative">
              {d.events.map((e, i) => (
                <TimelineRow
                  key={e.id}
                  event={e}
                  label={e.highlight ? "Now" : String(i + 1).padStart(2, "0")}
                  isLast={i === d.events.length - 1}
                />
              ))}
            </ol>
          </Card>

          <div className="space-y-6">
            <Card variant="glassBlue" className="space-y-4 p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Next milestone</div>
              {d.nudge ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card/70 text-primary shadow-[var(--shadow-soft)]">
                      <d.nudge.icon size={21} aria-hidden="true" />
                    </span>
                    <div>
                      <div className="font-display text-[16px] font-semibold tracking-[-0.01em]">{d.nudge.name}</div>
                      <div className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{d.nudge.desc}</div>
                    </div>
                  </div>
                  <div>
                    <Progress value={Math.min(100, Math.round((d.nudge.current / d.nudge.goal) * 100))} indicatorStyle={{ background: "var(--primary)" }} />
                    <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                      {showVal(d.nudge.current, d.nudge.money)} / {showVal(d.nudge.goal, d.nudge.money)} ·{" "}
                      {showVal(Math.max(0, d.nudge.goal - d.nudge.current), d.nudge.money)} to go
                    </div>
                  </div>
                  <Button variant="brand" block iconLeft={<ArrowUpRight size={17} />} onClick={() => navigate("/explore")}>
                    Find a local deal
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card/70 text-primary shadow-[var(--shadow-soft)]">
                      <Crown size={21} aria-hidden="true" />
                    </span>
                    <div className="font-display text-[16px] font-semibold tracking-[-0.01em]">Every badge earned</div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    You've unlocked every milestone on the board. Keep supporting local to hold your legend status.
                  </p>
                  <Button variant="secondary" block iconLeft={<Compass size={17} />} onClick={() => navigate("/explore")}>
                    Keep exploring
                  </Button>
                </>
              )}
            </Card>

            <Card variant="solid" className="space-y-3 p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tier ladder</div>
              {TIERS.map((t, i) => (
                <TierLadderRow key={t.name} tier={t} points={d.points} isCurrent={i === d.tierIndex} />
              ))}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
