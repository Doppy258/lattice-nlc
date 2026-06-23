import { useMemo, useState, type ReactNode } from "react";
import type { BusinessCategory, NeedType, PingRequest } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { createId } from "../utils/ids";
import {
  CATEGORY_META,
  DEMO_ORIGINS,
  NEED_TYPE_LABELS,
  PREFERENCE_OPTIONS,
  TIME_WINDOW_PRESETS,
} from "../data/catalog";
import { NOTE_MAX } from "../utils/constants";
import { formatTimeRange } from "../utils/formatting";
import {
  getRequestQuality,
  validatePingRequest,
  type PingDraft,
} from "../services/requestValidationService";
import { getMatchingOffers } from "../services/offerMatchingService";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/common/Button";
import { FormError } from "../components/common/FormError";
import { CategorySelector } from "../components/ping/CategorySelector";
import { NeedTypeSelector } from "../components/ping/NeedTypeSelector";
import { BudgetSelector } from "../components/ping/BudgetSelector";
import { DistanceSelector } from "../components/ping/DistanceSelector";
import {
  TimeWindowSelector,
  type TimeWindowValue,
} from "../components/ping/TimeWindowSelector";
import { PreferenceChips } from "../components/ping/PreferenceChips";
import { RequestPreview } from "../components/ping/RequestPreview";
import { VerificationModal } from "../components/ping/VerificationModal";

type Budget = { budgetMin?: number; budgetMax?: number };

const PREF_LABELS = new Map(PREFERENCE_OPTIONS.map((p) => [p.id, p.label]));

function budgetToLabel(budget: Budget): string {
  const { budgetMin, budgetMax } = budget;
  if (budgetMin !== undefined && budgetMax !== undefined) return `$${budgetMin}–$${budgetMax}`;
  if (budgetMax !== undefined) return `Under $${budgetMax}`;
  if (budgetMin !== undefined) return `$${budgetMin}+`;
  return "No budget";
}

/** A labeled builder step with an optional inline error message. */
function Step({
  step,
  label,
  hint,
  error,
  children,
}: {
  step: number;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <section className="builder-step">
      <div className="builder-step__head">
        <span className="builder-step__num">{step}</span>
        <div>
          <h2 className="builder-step__label">{label}</h2>
          {hint && <p className="builder-step__hint">{hint}</p>}
        </div>
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

  const originName =
    DEMO_ORIGINS.find((o) => o.id === activeUser.homeLocationId)?.name ?? "your area";

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

  // Live OfferRank estimate once the matchable fields are present.
  const estimatedMatches = useMemo(() => {
    if (!category || !needType || distanceKm === undefined) return null;
    if (!timeWindow.timeStart || !timeWindow.timeEnd) return null;
    const candidate: PingRequest = {
      id: "draft",
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
      verifiedHuman: false,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    return getMatchingOffers(candidate, data.offers, data.businesses, activeUser).length;
  }, [category, needType, budget, distanceKm, timeWindow, preferences, note, data, activeUser]);

  const timeLabel = (() => {
    if (!timeWindow.presetId) return undefined;
    if (timeWindow.presetId === "custom") {
      return timeWindow.timeStart && timeWindow.timeEnd
        ? formatTimeRange(timeWindow.timeStart, timeWindow.timeEnd)
        : "Custom";
    }
    return TIME_WINDOW_PRESETS.find((p) => p.id === timeWindow.presetId)?.label;
  })();

  const onCategory = (c: BusinessCategory) => {
    setCategory(c);
    setNeedType(undefined);
    setBudget({});
    setBudgetChosen(false);
    setPreferences([]);
  };

  const onNeedType = (n: NeedType) => {
    setNeedType(n);
    setBudget({});
    setBudgetChosen(false);
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
    <>
      <PageHeader
        eyebrow="Create Ping"
        title="Tell us what you need"
        subtitle="Build a structured request and we'll match it with nearby local offers."
      />

      <div className="builder-layout">
        <div className="builder-steps">
          <Step step={1} label="What category?" error={errorFor("category")}>
            <CategorySelector value={category} onChange={onCategory} />
          </Step>

          <Step step={2} label="What do you need?" error={errorFor("needType")}>
            {category ? (
              <NeedTypeSelector category={category} value={needType} onChange={onNeedType} />
            ) : (
              <p className="builder-step__gated">Choose a category first.</p>
            )}
          </Step>

          <Step
            step={3}
            label="What's your budget?"
            hint="Pick a range or set a custom amount."
            error={errorFor("budget")}
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
              <p className="builder-step__gated">Choose what you need first.</p>
            )}
          </Step>

          <Step step={4} label="How far will you go?" error={errorFor("distance")}>
            <DistanceSelector value={distanceKm} onChange={setDistanceKm} originName={originName} />
          </Step>

          <Step step={5} label="When do you need it?" error={errorFor("time")}>
            <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
          </Step>

          <Step step={6} label="Any preferences?" hint="Optional — boosts matches that fit.">
            {category ? (
              <PreferenceChips
                category={category}
                selected={preferences}
                onChange={setPreferences}
              />
            ) : (
              <p className="builder-step__gated">Choose a category to see relevant preferences.</p>
            )}
          </Step>

          <Step step={7} label="Add a note" hint="Optional — describe specifics." error={errorFor("note")}>
            <textarea
              className="text-input text-area"
              value={note}
              maxLength={NOTE_MAX}
              placeholder="Example: need outlets and a quiet table"
              onChange={(e) => setNote(e.target.value)}
              aria-label="Optional note"
            />
            <div className="char-count">
              {note.length}/{NOTE_MAX}
            </div>
          </Step>
        </div>

        <aside className="builder-preview">
          <RequestPreview
            categoryLabel={category ? CATEGORY_META[category].label : undefined}
            needLabel={needType ? NEED_TYPE_LABELS[needType] : undefined}
            budgetLabel={budgetChosen ? budgetToLabel(budget) : "—"}
            distanceLabel={distanceKm !== undefined ? `${distanceKm} km` : undefined}
            timeLabel={timeLabel}
            preferenceLabels={preferences.map((id) => PREF_LABELS.get(id) ?? id)}
            note={note || undefined}
            estimatedMatches={estimatedMatches}
            quality={quality}
          />

          {errorFor("duplicate") && <FormError message={errorFor("duplicate")} />}

          <Button
            block
            size="lg"
            disabled={!validation.valid}
            onClick={() => setVerifying(true)}
          >
            Find matching offers
          </Button>
          {!validation.valid && (
            <p className="builder-preview__hint">
              Complete the required fields to match offers.
            </p>
          )}
        </aside>
      </div>

      <VerificationModal
        open={verifying}
        onClose={() => setVerifying(false)}
        onVerified={submit}
      />
    </>
  );
}
