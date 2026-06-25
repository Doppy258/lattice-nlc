import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type {
  Business,
  BusinessCategory,
  GeoPoint,
  MatchResult,
  NeedType,
  Offer,
  PingRequest,
} from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { createId } from "../utils/ids";
import {
  CATEGORY_META,
  DEMO_ORIGINS,
  NEED_TYPES_BY_CATEGORY,
  NEED_TYPE_LABELS,
  PREFERENCE_OPTIONS,
  TIME_WINDOW_PRESETS,
} from "../data/catalog";
import { NOTE_MAX } from "../utils/constants";
import { formatCurrency, formatDistance, formatTimeRange } from "../utils/formatting";
import { distanceKm as measureDistance } from "../utils/distance";
import {
  getRequestQuality,
  validatePingRequest,
  type PingDraft,
} from "../services/requestValidationService";
import { getMatchingOffers, getOriginPoint } from "../services/offerMatchingService";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { SPRING_SOFT } from "@/components/motion/tokens";
import { CategorySelector } from "../components/ping/CategorySelector";
import { NeedTypeSelector } from "../components/ping/NeedTypeSelector";
import { BudgetSelector } from "../components/ping/BudgetSelector";
import { DistanceSelector } from "../components/ping/DistanceSelector";
import {
  TimeWindowSelector,
  type TimeWindowValue,
} from "../components/ping/TimeWindowSelector";
import { PreferenceChips } from "../components/ping/PreferenceChips";
import { VerificationModal } from "../components/ping/VerificationModal";
import { businessGrade, businessImageUrl } from "../utils/businessVisuals";
import { cn } from "@/lib/utils";

type Budget = { budgetMin?: number; budgetMax?: number };
type LocationState = "seeded" | "requesting" | "granted" | "denied" | "unsupported";

type LiveMatchRow = {
  match: MatchResult;
  offer: Offer;
  business: Business;
  distance: number;
};

const PREF_LABELS = new Map(PREFERENCE_OPTIONS.map((p) => [p.id, p.label]));

function budgetToLabel(budget: Budget): string {
  const { budgetMin, budgetMax } = budget;
  if (budgetMin !== undefined && budgetMax !== undefined) return `$${budgetMin}-${budgetMax}`;
  if (budgetMax !== undefined) return `Under $${budgetMax}`;
  if (budgetMin !== undefined) return `$${budgetMin}+`;
  return "No budget";
}

function fallbackWindow() {
  const start = new Date();
  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
  return { timeStart: start.toISOString(), timeEnd: end.toISOString() };
}

function StudioSection({
  title,
  error,
  children,
}: {
  title: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="rounded-3xl border border-border bg-card p-5 shadow-soft"
    >
      <h2 className="font-display mb-3.5 text-xl font-medium">{title}</h2>
      {children}
      {error && (
        <p className="mt-2.5 text-sm font-medium text-destructive">{error}</p>
      )}
    </motion.section>
  );
}

export function CreatePingPage() {
  const { data, setData, activeUser } = useApp();

  const [category, setCategory] = useState<BusinessCategory>();
  const [needType, setNeedType] = useState<NeedType>();
  const [budget, setBudget] = useState<Budget>({});
  const [budgetChosen, setBudgetChosen] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number>();
  const [timeWindow, setTimeWindow] = useState<TimeWindowValue>({ timeStart: "", timeEnd: "" });
  const [preferences, setPreferences] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [originOverride, setOriginOverride] = useState<GeoPoint>();
  const [locationState, setLocationState] = useState<LocationState>("seeded");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>();

  const seededOrigin =
    DEMO_ORIGINS.find((o) => o.id === activeUser.homeLocationId) ?? DEMO_ORIGINS[0];
  const origin = originOverride ?? getOriginPoint(activeUser);
  const originName = originOverride ? "Your location" : seededOrigin.name;

  const draft: PingDraft = useMemo(
    () => ({
      userId: activeUser.id,
      category,
      needType,
      budgetMin: budget.budgetMin,
      budgetMax: budget.budgetMax,
      distanceKm,
      timeStart: timeWindow.timeStart || undefined,
      timeEnd: timeWindow.timeEnd || undefined,
      preferences,
      optionalNote: note || undefined,
    }),
    [activeUser.id, category, needType, budget, distanceKm, timeWindow, preferences, note],
  );

  const validation = useMemo(
    () => validatePingRequest(draft, data.requests),
    [draft, data.requests],
  );
  const quality = useMemo(
    () => getRequestQuality(draft, data.requests),
    [draft, data.requests],
  );

  const clarityPct = quality === "strong" ? 100 : quality === "weak" ? 76 : 40;
  const clarityLabel =
    quality === "strong"
      ? "Strong & specific"
      : quality === "weak"
        ? "Ready to send"
        : "Still shaping";

  const errorFor = (field: string): string | undefined =>
    validation.errors.find((e) => e.field === field)?.message;

  const liveRequest = useMemo<PingRequest | undefined>(() => {
    if (!category) return undefined;
    const window = timeWindow.timeStart && timeWindow.timeEnd ? timeWindow : fallbackWindow();
    return {
      id: "draft-preview",
      userId: activeUser.id,
      category,
      needType: needType ?? NEED_TYPES_BY_CATEGORY[category][0],
      budgetMin: budget.budgetMin,
      budgetMax: budget.budgetMax,
      distanceKm: distanceKm ?? 5,
      timeStart: window.timeStart,
      timeEnd: window.timeEnd,
      preferences,
      optionalNote: note || undefined,
      verifiedHuman: false,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
  }, [activeUser.id, category, needType, budget, distanceKm, timeWindow, preferences, note]);

  const liveRows = useMemo<LiveMatchRow[]>(() => {
    if (!liveRequest) return [];
    const offerById = new Map(data.offers.map((o) => [o.id, o]));
    const bizById = new Map(data.businesses.map((b) => [b.id, b]));
    return getMatchingOffers(liveRequest, data.offers, data.businesses, activeUser, origin)
      .map((match) => {
        const offer = offerById.get(match.offerId);
        const business = bizById.get(match.businessId);
        if (!offer || !business) return null;
        return { match, offer, business, distance: measureDistance(origin, business.location) };
      })
      .filter((row): row is LiveMatchRow => row !== null)
      .slice(0, 8);
  }, [liveRequest, data.offers, data.businesses, activeUser, origin]);

  const nearbyBusinesses = useMemo(
    () =>
      [...data.businesses]
        .sort((a, b) => measureDistance(origin, a.location) - measureDistance(origin, b.location))
        .slice(0, 5),
    [data.businesses, origin],
  );

  const previewRows =
    liveRows.length > 0
      ? liveRows
      : nearbyBusinesses
          .map((business) => ({
            business,
            offer:
              data.offers.find((offer) => offer.businessId === business.id) ?? data.offers[0],
            distance: measureDistance(origin, business.location),
            match: {
              offerId: "",
              businessId: business.id,
              requestId: "preview",
              score: Math.max(62, Math.round(92 - measureDistance(origin, business.location) * 4)),
              scoreBreakdown: {
                categoryScore: 0,
                budgetScore: 0,
                distanceScore: 0,
                ratingScore: 0,
                timeScore: 0,
                verificationScore: 0,
                preferenceScore: 0,
              },
              reasons: ["Close to you", "Popular locally"],
            },
          }))
          .filter((row) => row.offer);

  const timeLabel = (() => {
    if (!timeWindow.presetId) return undefined;
    if (timeWindow.presetId === "custom") {
      return timeWindow.timeStart && timeWindow.timeEnd
        ? formatTimeRange(timeWindow.timeStart, timeWindow.timeEnd)
        : "Custom";
    }
    return TIME_WINDOW_PRESETS.find((p) => p.id === timeWindow.presetId)?.label;
  })();

  const slots = [
    { label: "Category", value: category ? CATEGORY_META[category].label : "Select category", filled: !!category },
    { label: "Need", value: needType ? NEED_TYPE_LABELS[needType] : "Choose need", filled: !!needType },
    { label: "Distance", value: distanceKm !== undefined ? `Within ${distanceKm} km` : "Set distance", filled: distanceKm !== undefined },
    { label: "Time", value: timeLabel ?? "Set time", filled: !!timeLabel },
    { label: "Budget", value: budgetChosen ? budgetToLabel(budget) : "Set budget", filled: budgetChosen },
  ];

  const selectedRow =
    previewRows.find((row) => row.business.id === selectedBusinessId) ?? previewRows[0];

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("unsupported");
      return;
    }
    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOriginOverride({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationState("granted");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const onCategory = (c: BusinessCategory) => {
    setCategory(c);
    setNeedType(undefined);
    setBudget({});
    setBudgetChosen(false);
    setPreferences([]);
    setSelectedBusinessId(undefined);
  };

  const onNeedType = (n: NeedType) => {
    setNeedType(n);
    setBudget({});
    setBudgetChosen(false);
    setSelectedBusinessId(undefined);
  };

  const submit = () => {
    if (!category || !needType || distanceKm === undefined) return;
    const request: PingRequest = {
      id: createId("req"),
      userId: activeUser.id,
      category,
      needType,
      budgetMin: budget.budgetMin,
      budgetMax: budget.budgetMax,
      distanceKm,
      timeStart: timeWindow.timeStart,
      timeEnd: timeWindow.timeEnd,
      preferences,
      optionalNote: note || undefined,
      verifiedHuman: true,
      status: "submitted",
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, requests: [...prev.requests, request] }));
    setVerifying(false);
    navigate("/matches");
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Hero */}
      <section className="grid grid-cols-1 gap-5 rounded-[28px] border border-border bg-card p-7 shadow-card sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0 max-w-2xl">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Icon name="ping" size={15} /> New Request
          </span>
          <h1 className="font-display mt-2.5 text-[2rem] leading-[1.05] font-medium tracking-[-0.02em] text-balance sm:text-4xl">
            Make one good request. Let the best local options come to you.
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Pick the basics, add your preferences, and Lattice previews nearby
            businesses as your request takes shape.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-secondary/40 p-5 lg:w-[240px]">
          <span className="mono text-5xl leading-none font-extrabold text-primary">
            {clarityPct}%
          </span>
          <span className="text-sm text-muted-foreground">request clarity</span>
          <Progress value={clarityPct} className="mt-1" />
          <div className="mt-1">
            <Badge tone={validation.valid ? "success" : "accent"}>{clarityLabel}</Badge>
          </div>
        </div>
      </section>

      {/* Sentence builder */}
      <section
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
        aria-label="Request sentence preview"
      >
        {slots.map((slot) => (
          <div
            key={slot.label}
            className={cn(
              "flex flex-col gap-0.5 rounded-2xl border p-3.5 transition-colors duration-200",
              slot.filled
                ? "border-primary/40 bg-brand-tint"
                : "border-dashed border-border bg-card",
            )}
          >
            <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              {slot.label}
            </span>
            <motion.span
              key={slot.value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "truncate text-sm font-bold",
                slot.filled ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {slot.value}
            </motion.span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        {/* Form */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Starting point
              </span>
              <div className="font-bold text-foreground">{originName}</div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={requestLocation}
              disabled={locationState === "requesting"}
              iconLeft={<Icon name="location" size={15} />}
            >
              {locationState === "requesting" ? "Finding" : "Use location"}
            </Button>
          </div>

          {(locationState === "denied" || locationState === "unsupported") && (
            <p className="rounded-2xl border border-border bg-card p-3.5 text-sm text-muted-foreground">
              Location is not available, so Lattice is previewing from the
              downtown San Antonio demo origin.
            </p>
          )}

          <StudioSection title="What kind of place?" error={errorFor("category")}>
            <CategorySelector value={category} onChange={onCategory} />
          </StudioSection>

          <StudioSection title="What do you need?" error={errorFor("needType")}>
            {category ? (
              <NeedTypeSelector category={category} value={needType} onChange={onNeedType} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a category to unlock more specific needs.
              </p>
            )}
          </StudioSection>

          <StudioSection
            title="Budget and distance"
            error={errorFor("budget") ?? errorFor("distance")}
          >
            {needType ? (
              <BudgetSelector
                needType={needType}
                budgetMin={budget.budgetMin}
                budgetMax={budget.budgetMax}
                onChange={(b) => {
                  setBudget(b);
                  setBudgetChosen(true);
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Choose a need first.</p>
            )}
            <div className="mt-4">
              <DistanceSelector
                value={distanceKm}
                onChange={setDistanceKm}
                originName={originName}
              />
            </div>
          </StudioSection>

          <StudioSection title="When?" error={errorFor("time")}>
            <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
          </StudioSection>

          <StudioSection title="Preferences">
            {category ? (
              <PreferenceChips
                category={category}
                selected={preferences}
                onChange={setPreferences}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Preferences appear after category selection.
              </p>
            )}
          </StudioSection>

          <StudioSection title="Anything specific?" error={errorFor("note")}>
            <Textarea
              value={note}
              maxLength={NOTE_MAX}
              placeholder="Example: close to school, quiet table, good for three people"
              onChange={(e) => setNote(e.target.value)}
              aria-label="Optional note"
            />
            <div className="mt-1.5 text-right text-xs text-muted-foreground">
              {note.length}/{NOTE_MAX}
            </div>
          </StudioSection>
        </div>

        {/* Preview */}
        <aside className="grid gap-3.5 lg:sticky lg:top-24">
          <div className="relative h-[300px] overflow-hidden rounded-3xl border border-border bg-muted">
            {selectedRow && (
              <>
                <img
                  src={businessImageUrl(selectedRow.business)}
                  alt={`${selectedRow.business.name} preview`}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 grid gap-1.5 rounded-2xl bg-white/90 p-4 backdrop-blur-md">
                  <div>
                    <Badge tone="accent">{businessGrade(selectedRow.business)}</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedRow.business.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedRow.offer.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <strong className="text-primary">
                      {selectedRow.match.score}% match
                    </strong>
                    <span className="text-sm text-muted-foreground">
                      {formatDistance(selectedRow.distance)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              category ? CATEGORY_META[category].label : "Category",
              needType ? NEED_TYPE_LABELS[needType] : "Need",
              budgetChosen ? budgetToLabel(budget) : "Budget",
              timeLabel ?? "Time",
              ...preferences.map((id) => PREF_LABELS.get(id) ?? id),
            ].map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="inline-flex h-7 items-center rounded-full bg-brand-tint px-2.5 text-xs font-semibold text-primary"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-3.5 shadow-soft">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {liveRows.length ? "Live matches" : "Nearby now"}
                </span>
                <h2 className="font-display text-lg font-medium">
                  {previewRows.length} businesses in range
                </h2>
              </div>
              <Badge tone="neutral">{originName}</Badge>
            </div>

            <div className="grid gap-1">
              <AnimatePresence initial={false}>
                {previewRows.map((row, index) => (
                  <motion.button
                    key={`${row.business.id}-${row.offer.id}`}
                    type="button"
                    onMouseEnter={() => setSelectedBusinessId(row.business.id)}
                    onFocus={() => setSelectedBusinessId(row.business.id)}
                    onClick={() => setSelectedBusinessId(row.business.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: index * 0.025, duration: 0.18 }}
                    className={cn(
                      "grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                      selectedRow?.business.id === row.business.id
                        ? "border-primary bg-brand-tint"
                        : "border-transparent hover:bg-muted",
                    )}
                  >
                    <img
                      src={businessImageUrl(row.business)}
                      alt=""
                      className="size-11 rounded-xl object-cover"
                    />
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-foreground">
                        {row.business.name}
                      </strong>
                      <small className="block truncate text-xs text-muted-foreground">
                        {row.offer.title}
                      </small>
                    </span>
                    <span className="mono font-bold text-primary">
                      {formatCurrency(row.offer.price)}
                    </span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {errorFor("duplicate") && (
            <p className="text-sm font-medium text-destructive">
              {errorFor("duplicate")}
            </p>
          )}

          <Button
            block
            size="lg"
            disabled={!validation.valid}
            onClick={() => setVerifying(true)}
          >
            Find matching offers
          </Button>
          {!validation.valid && (
            <p className="text-center text-sm text-muted-foreground">
              Complete the required fields to send this request.
            </p>
          )}
        </aside>
      </div>

      <VerificationModal
        open={verifying}
        onClose={() => setVerifying(false)}
        onVerified={submit}
      />
    </div>
  );
}
