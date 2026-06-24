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
import { FormError } from "../components/common/FormError";
import { Icon } from "../components/common/Icon";
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
    <section className="studio-section">
      <div className="studio-section__head">
        <h2>{title}</h2>
      </div>
      {children}
      <FormError message={error} />
    </section>
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
    [activeUser.id, category, needType, budget, distanceKm, timeWindow, preferences, note]
  );

  const validation = useMemo(
    () => validatePingRequest(draft, data.requests),
    [draft, data.requests]
  );
  const quality = useMemo(
    () => getRequestQuality(draft, data.requests),
    [draft, data.requests]
  );

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
    [data.businesses, origin]
  );

  const previewRows = liveRows.length > 0 ? liveRows : nearbyBusinesses.map((business) => ({
    business,
    offer: data.offers.find((offer) => offer.businessId === business.id) ?? data.offers[0],
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
  })).filter((row) => row.offer);

  const timeLabel = (() => {
    if (!timeWindow.presetId) return undefined;
    if (timeWindow.presetId === "custom") {
      return timeWindow.timeStart && timeWindow.timeEnd
        ? formatTimeRange(timeWindow.timeStart, timeWindow.timeEnd)
        : "Custom";
    }
    return TIME_WINDOW_PRESETS.find((p) => p.id === timeWindow.presetId)?.label;
  })();

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
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
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
    <div className="ping-studio-page">
      <section className="ping-studio-hero">
        <div>
          <span className="soft-kicker">Create Ping</span>
          <h1>Make one good request. Let the best local options come to you.</h1>
          <p>
            Pick the basics, add your vibe, and Lattice previews nearby businesses as your Ping takes shape.
          </p>
        </div>
        <div className="studio-score-card">
          <strong>{quality.score}%</strong>
          <span>request clarity</span>
          <div>
            <Badge tone={validation.valid ? "success" : "accent"}>
              {validation.valid ? "Ready to send" : "Still shaping"}
            </Badge>
          </div>
        </div>
      </section>

      <div className="ping-studio-layout">
        <section className="studio-form">
          <div className="studio-location">
            <div>
              <span>Starting point</span>
              <strong>{originName}</strong>
            </div>
            <button
              type="button"
              className="soft-location-btn"
              onClick={requestLocation}
              disabled={locationState === "requesting"}
            >
              <Icon name="location" size={15} />
              {locationState === "requesting" ? "Finding" : "Use location"}
            </button>
          </div>

          {(locationState === "denied" || locationState === "unsupported") && (
            <p className="studio-note">
              Location is not available, so Lattice is previewing from the demo Oakville origin.
            </p>
          )}

          <StudioSection title="What kind of place?" error={errorFor("category")}>
            <CategorySelector value={category} onChange={onCategory} />
          </StudioSection>

          <StudioSection title="What do you need?" error={errorFor("needType")}>
            {category ? (
              <NeedTypeSelector category={category} value={needType} onChange={onNeedType} />
            ) : (
              <p className="studio-empty">Choose a category to unlock more specific needs.</p>
            )}
          </StudioSection>

          <StudioSection title="Budget and distance" error={errorFor("budget") ?? errorFor("distance")}>
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
              <p className="studio-empty">Choose a need first.</p>
            )}
            <DistanceSelector value={distanceKm} onChange={setDistanceKm} originName={originName} />
          </StudioSection>

          <StudioSection title="When?" error={errorFor("time")}>
            <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
          </StudioSection>

          <StudioSection title="Preferences">
            {category ? (
              <PreferenceChips category={category} selected={preferences} onChange={setPreferences} />
            ) : (
              <p className="studio-empty">Preferences appear after category selection.</p>
            )}
          </StudioSection>

          <StudioSection title="Anything specific?" error={errorFor("note")}>
            <textarea
              className="text-input text-area"
              value={note}
              maxLength={NOTE_MAX}
              placeholder="Example: close to school, quiet table, good for three people"
              onChange={(e) => setNote(e.target.value)}
              aria-label="Optional note"
            />
            <div className="char-count">
              {note.length}/{NOTE_MAX}
            </div>
          </StudioSection>
        </section>

        <aside className="studio-preview">
          <div className="studio-preview__scene">
            {selectedRow && (
              <>
                <img
                  src={businessImageUrl(selectedRow.business)}
                  alt={`${selectedRow.business.name} preview`}
                />
                <div className="studio-preview__floating-card">
                  <Badge tone="accent">{businessGrade(selectedRow.business)}</Badge>
                  <h2>{selectedRow.business.name}</h2>
                  <p>{selectedRow.offer.title}</p>
                  <div>
                    <strong>{selectedRow.match.score}% match</strong>
                    <span>{formatDistance(selectedRow.distance)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="studio-summary">
            <span>{category ? CATEGORY_META[category].label : "Category"}</span>
            <span>{needType ? NEED_TYPE_LABELS[needType] : "Need"}</span>
            <span>{budgetChosen ? budgetToLabel(budget) : "Budget"}</span>
            <span>{timeLabel ?? "Time"}</span>
            {preferences.map((id) => (
              <span key={id}>{PREF_LABELS.get(id) ?? id}</span>
            ))}
          </div>

          <div className="studio-matches">
            <div className="studio-matches__head">
              <div>
                <span>{liveRows.length ? "Live matches" : "Nearby now"}</span>
                <h2>{previewRows.length} businesses in range</h2>
              </div>
              <Badge tone="neutral">{originName}</Badge>
            </div>

            <AnimatePresence initial={false}>
              {previewRows.map((row, index) => (
                <motion.button
                  key={`${row.business.id}-${row.offer.id}`}
                  type="button"
                  className={`studio-match ${selectedRow?.business.id === row.business.id ? "studio-match--on" : ""}`}
                  onMouseEnter={() => setSelectedBusinessId(row.business.id)}
                  onFocus={() => setSelectedBusinessId(row.business.id)}
                  onClick={() => setSelectedBusinessId(row.business.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.025, duration: 0.18 }}
                >
                  <img src={businessImageUrl(row.business)} alt="" />
                  <span>
                    <strong>{row.business.name}</strong>
                    <small>{row.offer.title}</small>
                  </span>
                  <em>{formatCurrency(row.offer.price)}</em>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {errorFor("duplicate") && <FormError message={errorFor("duplicate")} />}

          <Button block size="lg" disabled={!validation.valid} onClick={() => setVerifying(true)}>
            Send Ping
          </Button>
          {!validation.valid && (
            <p className="builder-preview__hint">
              Complete the required fields to send this Ping.
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
