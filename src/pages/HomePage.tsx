import { useMemo } from "react";
import { motion } from "motion/react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Icon, type IconName } from "../components/common/Icon";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { RichListRow } from "../components/common/RichListRow";
import { ScrollRail } from "../components/common/ScrollRail";
import { BentoGrid, BentoTile, StatTile, TileHeader, MiniDonut } from "../components/bento";
import { formatCurrency, relativeTime } from "../utils/formatting";
import { ALL_CATEGORIES, CATEGORY_META, DEMO_ORIGINS } from "../data/catalog";
import { getUserReport } from "../services/reportService";
import { getUserClaims } from "../services/claimService";
import { businessImageUrl } from "../utils/businessVisuals";

type Delta = { value: number; direction: "up" | "down" | "flat" };

/** Read-side: count items per month over the last `months` (for sparklines). */
function monthlyCounts(items: { createdAt: string }[], months = 6): number[] {
  const now = new Date();
  const buckets = new Array(months).fill(0) as number[];
  for (const it of items) {
    const d = new Date(it.createdAt);
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diff >= 0 && diff < months) buckets[months - 1 - diff] += 1;
  }
  return buckets;
}

function trendDelta(series: number[]): Delta | undefined {
  if (series.length < 2) return undefined;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0 && last === 0) return undefined;
  const pct = prev === 0 ? 100 : Math.round(((last - prev) / Math.abs(prev)) * 100);
  return { value: pct, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

export function HomePage() {
  const { data, activeUser } = useApp();
  const firstName = activeUser.name.split(" ")[0];

  const originName =
    DEMO_ORIGINS.find((o) => o.id === activeUser.homeLocationId)?.name ?? "your area";

  const report = useMemo(
    () =>
      getUserReport(
        activeUser.id,
        {},
        { claims: data.claims, offers: data.offers, businesses: data.businesses, reviews: data.reviews },
      ),
    [activeUser.id, data],
  );

  const offerById = useMemo(() => new Map(data.offers.map((o) => [o.id, o])), [data.offers]);
  const bizById = useMemo(() => new Map(data.businesses.map((b) => [b.id, b])), [data.businesses]);

  const allUserClaims = useMemo(() => getUserClaims(activeUser.id, data.claims), [activeUser.id, data.claims]);
  const activeClaims = useMemo(() => allUserClaims.filter((c) => c.status === "active"), [allUserClaims]);

  const recommended = useMemo(
    () => data.offers.filter((o) => o.active && o.originalPrice).sort((a, b) => b.views - a.views).slice(0, 6),
    [data.offers],
  );

  const claimsTrend = useMemo(() => monthlyCounts(allUserClaims, 6), [allUserClaims]);
  const savingsSeries = report.savingsByMonth.map((p) => p.value);
  const businessesSeries = report.businessesByMonth.map((p) => p.value);
  const redemptionRate = report.totalClaimed > 0 ? report.totalRedeemed / report.totalClaimed : 0;

  return (
    <BentoGrid>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <BentoTile colSpan={4} rowSpan={2} variant="gradient" className="justify-between gap-6 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-24 size-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,255,0.18), transparent 62%)" }}
        />
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {originName}
          </span>
          <h1 className="font-display mt-3 text-[2.1rem] leading-[1.04] font-bold tracking-tight text-balance sm:text-[2.7rem] lg:text-[3rem]">
            What do you need nearby, {firstName}?
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Describe what you're looking for and Lattice ranks nearby offers by budget, timing, distance, and fit.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => navigate("/create-ping")}
            className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring/50"
            style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
          >
            <Icon name="ping" size={18} />
            Start a request
          </button>
          <button
            onClick={() => navigate("/explore")}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-5 text-[15px] font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Icon name="explore" size={18} />
            Explore businesses
          </button>
        </div>

        {/* Floating deal thumbnails (lg+) */}
        <div className="pointer-events-none absolute top-6 right-6 hidden h-[200px] w-[230px] lg:block" aria-hidden>
          {recommended.slice(0, 3).map((offer, index) => {
            const business = bizById.get(offer.businessId);
            if (!business) return null;
            const layout = ["right-0 top-0 rotate-[6deg]", "right-24 top-10 rotate-[-5deg]", "right-6 top-24 rotate-[2deg]"][index];
            return (
              <motion.img
                key={offer.id}
                initial={{ opacity: 0, y: 18, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                src={businessImageUrl(business)}
                alt=""
                className={`absolute size-24 rounded-2xl border-4 border-card object-cover shadow-lift ${layout}`}
              />
            );
          })}
        </div>
      </BentoTile>

      {/* ── Stat band ───────────────────────────────────────────────── */}
      <StatTile
        label="Active claims"
        value={activeClaims.length}
        icon="claims"
        accent
        series={claimsTrend}
        onClick={() => navigate("/claims")}
      />
      <StatTile
        label="Money saved"
        value={report.estimatedSavings}
        format={(n) => formatCurrency(Math.round(n))}
        icon="reports"
        delta={trendDelta(savingsSeries)}
        series={savingsSeries.length > 1 ? savingsSeries : undefined}
        onClick={() => navigate("/reports")}
      />
      <StatTile
        label="Businesses supported"
        value={report.businessesSupported}
        icon="store"
        series={businessesSeries.length > 1 ? businessesSeries : undefined}
        onClick={() => navigate("/reports")}
      />
      <StatTile
        label="Saved"
        value={activeUser.preferences.savedBusinessIds.length}
        icon="saved"
        onClick={() => navigate("/saved")}
      />
      <BentoTile colSpan={2} variant="surface" interactive as="button" onClick={() => navigate("/claims")} className="flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-muted-foreground">Redeemed</div>
          <div className="font-mono text-[2.3rem] leading-none font-bold tabular-nums text-foreground">
            {report.totalRedeemed}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">of {report.totalClaimed} claims</div>
        </div>
        <MiniDonut value={redemptionRate} size={84} sublabel="redeemed" />
      </BentoTile>

      {/* ── Trending ────────────────────────────────────────────────── */}
      <BentoTile colSpan={4} variant="surface" className="gap-1">
        <TileHeader
          title="Trending deals"
          action={
            <button
              onClick={() => navigate("/explore")}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-opacity hover:opacity-80"
            >
              Browse all <Icon name="arrow" size={14} />
            </button>
          }
        />
        <ScrollRail>
          {recommended.map((offer) => {
            const biz = bizById.get(offer.businessId);
            const saving = offer.originalPrice ? offer.originalPrice - offer.price : 0;
            return (
              <motion.button
                key={offer.id}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/business/profile?b=${offer.businessId}`)}
                className="group w-[230px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card text-left outline-none transition-shadow hover:shadow-[var(--tile-shadow-lift)] focus-visible:ring-2 focus-visible:ring-ring/45"
              >
                {biz && (
                  <div className="h-28 overflow-hidden">
                    <img
                      src={businessImageUrl(biz)}
                      alt=""
                      className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
                    />
                  </div>
                )}
                <div className="p-3">
                  <div className="truncate text-sm font-semibold text-foreground">{offer.title}</div>
                  <div className="truncate text-[12px] text-muted-foreground">{biz?.name}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary tabular-nums">
                      {formatCurrency(offer.price)}
                    </span>
                    {saving > 0 && <Badge tone="success">Save {formatCurrency(saving)}</Badge>}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </ScrollRail>
      </BentoTile>

      {/* ── Browse categories (tall) ────────────────────────────────── */}
      <BentoTile colSpan={2} rowSpan={2} variant="outline" className="gap-1">
        <TileHeader title="Browse" />
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-1 lg:grid-cols-2">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => navigate("/explore")}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-left text-[13px] font-semibold text-foreground outline-none transition-colors hover:border-primary/30 hover:bg-brand-tint focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-tint text-primary">
                <Icon name={CATEGORY_META[cat].icon as IconName} size={15} />
              </span>
              <span className="truncate">{CATEGORY_META[cat].label}</span>
            </button>
          ))}
        </div>
      </BentoTile>

      {/* ── Active claims list ──────────────────────────────────────── */}
      <BentoTile colSpan={4} variant="surface" className="gap-1">
        <TileHeader
          title="Active claims"
          action={
            <button
              onClick={() => navigate("/claims")}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-opacity hover:opacity-80"
            >
              View all <Icon name="arrow" size={14} />
            </button>
          }
        />
        {activeClaims.length === 0 ? (
          <EmptyState
            variant="ticket"
            title="No active claims yet"
            body="Start a request to find offers you can claim in a couple of clicks."
            actionLabel="Start a request"
            onAction={() => navigate("/create-ping")}
          />
        ) : (
          <div className="grid gap-0.5">
            {activeClaims.slice(0, 4).map((claim) => {
              const offer = offerById.get(claim.offerId);
              const biz = bizById.get(claim.businessId);
              return (
                <RichListRow
                  key={claim.id}
                  thumbnail={biz ? businessImageUrl(biz) : undefined}
                  title={offer?.title ?? "Offer"}
                  meta={`${biz?.name ?? "Business"} · expires ${relativeTime(claim.expiresAt)}`}
                  trailing={
                    <span className="font-mono rounded-lg bg-brand-tint px-2 py-1 text-[13px] font-bold text-primary tabular-nums">
                      {claim.claimCode}
                    </span>
                  }
                  onClick={() => navigate("/claims")}
                />
              );
            })}
          </div>
        )}
      </BentoTile>
    </BentoGrid>
  );
}
