/**
 * CreateLatticePage — route: /create
 *
 * The core "mad-libs" request builder. Customers fill structured blanks
 * (category, need, budget, distance, time, preferences) to produce a
 * PingRequest that gets matched against local offers by the matching engine.
 * Supports both create and edit (via ?edit=id) flows with a human-verification
 * gate before submission.
 */

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "@/app/providers";
import { navigate, useHashRoute } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Badge, type BadgeTone } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { FormField } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { Icon, type IconName } from "@/components/common/Icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BotCheckModal } from "@/components/domain/BotCheckModal";
import { ShareLocationButton } from "@/components/common/ShareLocationButton";
import { useUserLocation } from "@/hooks/useUserLocation";
import { validatePingRequest, getRequestQuality } from "@/services/requestValidationService";
import { getMatchingOffers } from "@/services/offerMatchingService";
import {
  ALL_CATEGORIES,
  CATEGORY_META,
  DISTANCE_OPTIONS_KM,
  NEED_TYPES_BY_CATEGORY,
  NEED_TYPE_LABELS,
  PREFERENCE_OPTIONS,
  TIME_WINDOW_PRESETS,
  budgetPresetsFor,
} from "@/data/catalog";
import { customTimeWindow, timeWindowForPreset, type TimeWindowPresetId } from "@/utils/timeWindows";
import { NOTE_MAX } from "@/utils/constants";
import { createId } from "@/utils/ids";
import { upsertRequest } from "@/services/dbService";
import { formatTimeRange } from "@/utils/formatting";
import type { BusinessCategory, NeedType, PingRequest } from "@/models";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

const QUALITY: Record<string, { tone: BadgeTone; label: string }> = {
  invalid: { tone: "danger", label: "Incomplete" },
  weak: { tone: "warning", label: "Weak" },
  strong: { tone: "success", label: "Strong" },
};

/** An inline, fill-in-the-blank dropdown used to build the mad-libs sentence. */
function Blank({
  placeholder,
  value,
  invalid,
  align = "start",
  children,
}: {
  placeholder: string;
  value?: ReactNode;
  invalid?: boolean;
  align?: "start" | "center" | "end";
  children: ReactNode;
}) {
  const filled = value !== undefined && value !== null && value !== "";
  return (
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <motion.button
        whileTap={{ scale: 0.96 }}
        className={cn(
          "group inline-flex max-w-full cursor-pointer items-center gap-1 rounded-xl px-2.5 py-0.5 align-middle font-semibold outline-none transition-all duration-200",
          filled
            ? "bg-secondary text-primary-strong ring-1 ring-inset ring-primary/20 hover:ring-primary/40"
            : "bg-accent/60 text-primary underline decoration-dashed decoration-primary/40 underline-offset-4 hover:bg-accent",
          invalid && !filled && "bg-[var(--danger-tint)] text-[var(--danger)] no-underline",
          "focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:ring-2 data-[state=open]:ring-primary/40",
        )}
      >
        <span className="truncate">{filled ? value : placeholder}</span>
        <motion.span
          animate={{ rotate: filled ? 0 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            size={16}
            className="shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </motion.span>
      </motion.button>
    </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="max-h-[18rem] overflow-y-auto">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A single selectable row inside a Blank's dropdown, with a check when active. */
function Option({
  active,
  onSelect,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="justify-between gap-3">
      <span className="flex items-center gap-2">{children}</span>
      {active && <Check size={15} className="shrink-0 text-primary" />}
    </DropdownMenuItem>
  );
}

export function CreateLatticePage() {
  const { data, activeUser, setData } = useApp();
  const { query } = useHashRoute();
  const editId = query.get("edit");
  const existing = useMemo(
    () => (editId ? data.requests.find((r) => r.id === editId) : undefined),
    [editId, data.requests],
  );
  const geolocation = useUserLocation();

  function handleShareLocation() {
    geolocation.requestLocation();
  }

  // Location counts as "ready" only when the browser has actually granted
  // access. A stored activeUser.location isn't enough on its own — the user
  // may have revoked the browser permission since it was captured (e.g.
  // resetting it before a demo), in which case we still want to surface the
  // enable-location button so the permission prompt can fire again.
  const locationReady =
    geolocation.permission === "granted" ||
    (geolocation.permission === "unknown" && !!activeUser.location);
  const showLocationPrompt = !locationReady;

  const [category, setCategory] = useState<BusinessCategory | undefined>(() => existing?.category);
  const [needType, setNeedType] = useState<NeedType | undefined>(() => existing?.needType);
  const [budgetSel, setBudgetSel] = useState<number | "custom" | null>(() => {
    if (!existing || existing.budgetMax === undefined) return null;
    const presets = budgetPresetsFor(existing.needType);
    const idx = presets.findIndex((p) => p.max === existing.budgetMax && p.min === (existing.budgetMin ?? undefined));
    return idx >= 0 ? idx : "custom";
  });
  const [customBudget, setCustomBudget] = useState(() =>
    existing && existing.budgetMax !== undefined ? String(existing.budgetMax) : "",
  );
  const [budgetMin, setBudgetMin] = useState<number | undefined>(() => existing?.budgetMin);
  const [budgetMax, setBudgetMax] = useState<number | undefined>(() => existing?.budgetMax);
  // Prefill the search radius from the user's onboarding default (if it's a valid option).
  const [distanceKm, setDistanceKm] = useState<number | undefined>(() =>
    existing?.distanceKm ?? (
      (DISTANCE_OPTIONS_KM as readonly number[]).includes(activeUser.preferences.maxDefaultDistanceKm)
        ? activeUser.preferences.maxDefaultDistanceKm
        : undefined
    ),
  );
  const [timePreset, setTimePreset] = useState<TimeWindowPresetId | undefined>(() => {
    if (!existing || !existing.timeStart || !existing.timeEnd) return undefined;
    const match = TIME_WINDOW_PRESETS.find(
      (p) => p.id !== "custom" && timeWindowForPreset(p.id)?.timeStart === existing.timeStart && timeWindowForPreset(p.id)?.timeEnd === existing.timeEnd,
    );
    return match?.id ?? "custom";
  });
  const [customDate, setCustomDate] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [timeStart, setTimeStart] = useState<string | undefined>(() => existing?.timeStart);
  const [timeEnd, setTimeEnd] = useState<string | undefined>(() => existing?.timeEnd);
  // Prefill the student-discount preference from onboarding.
  const [preferences, setPreferences] = useState<string[]>(() =>
    existing?.preferences ?? (activeUser.preferences.studentDiscountPreferred ? ["studentDiscount"] : []),
  );
  const [note, setNote] = useState(() => existing?.optionalNote ?? "");
  const [verifyOpen, setVerifyOpen] = useState(false);

  const draft = useMemo(
    () => ({
      userId: activeUser.id,
      category,
      needType,
      budgetMin,
      budgetMax,
      distanceKm,
      timeStart,
      timeEnd,
      preferences,
    }),
    [activeUser.id, category, needType, budgetMin, budgetMax, distanceKm, timeStart, timeEnd, preferences],
  );

  const validationExisting = useMemo(
    () => (editId ? data.requests.filter((r) => r.id !== editId) : data.requests),
    [editId, data.requests],
  );
  const validation = useMemo(() => validatePingRequest(draft, validationExisting), [draft, validationExisting]);
  const quality = useMemo(() => getRequestQuality(draft, validationExisting), [draft, validationExisting]);
  const errors = useMemo(
    () => Object.fromEntries(validation.errors.map((e) => [e.field, e.message])) as Record<string, string>,
    [validation],
  );

  const estMatches = useMemo(() => {
    if (!validation.valid) return null;
    const req = { ...draft, id: "preview", status: "submitted", createdAt: new Date().toISOString(), verifiedHuman: false } as PingRequest;
    return getMatchingOffers(req, data.offers, data.businesses, activeUser).length;
  }, [validation.valid, draft, data.offers, data.businesses, activeUser]);

  function selectCategory(cat: BusinessCategory) {
    setCategory(cat);
    setNeedType(undefined);
    setBudgetSel(null);
    setBudgetMin(undefined);
    setBudgetMax(undefined);
  }

  function selectNeed(nt: NeedType) {
    setNeedType(nt);
    setBudgetSel(null);
    setBudgetMin(undefined);
    setBudgetMax(undefined);
  }

  function selectBudget(i: number) {
    const preset = budgetPresetsFor(needType!)[i];
    setBudgetSel(i);
    setBudgetMin(preset.min);
    setBudgetMax(preset.max);
  }

  function applyCustomBudget(value: string) {
    setCustomBudget(value);
    setBudgetSel("custom");
    const max = parseFloat(value);
    setBudgetMin(undefined);
    setBudgetMax(Number.isFinite(max) ? max : undefined);
  }

  function selectTime(id: TimeWindowPresetId) {
    setTimePreset(id);
    if (id === "custom") {
      const w = customTimeWindow(customDate, customStart, customEnd);
      setTimeStart(w.timeStart || undefined);
      setTimeEnd(w.timeEnd || undefined);
    } else {
      const w = timeWindowForPreset(id);
      setTimeStart(w?.timeStart);
      setTimeEnd(w?.timeEnd);
    }
  }

  function updateCustomTime(date: string, start: string, end: string) {
    setCustomDate(date);
    setCustomStart(start);
    setCustomEnd(end);
    const w = customTimeWindow(date, start, end);
    setTimeStart(w.timeStart || undefined);
    setTimeEnd(w.timeEnd || undefined);
  }

  function togglePref(id: string) {
    setPreferences((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function onVerified() {
    if (editId && existing) {
      const updated: PingRequest = {
        ...existing,
        category: category!,
        needType: needType!,
        budgetMin,
        budgetMax,
        distanceKm: distanceKm!,
        timeStart: timeStart!,
        timeEnd: timeEnd!,
        preferences,
        optionalNote: note || undefined,
        verifiedHuman: true,
      };
      setData((d) => ({
        ...d,
        requests: d.requests.map((r) => (r.id === editId ? updated : r)),
      }));
      void upsertRequest(updated);
      navigate(`/matches?request=${editId}`);
      return;
    }
    // Build the request locally (works with or without Supabase), append it to
    // app state, then best-effort sync to the shared backend — a no-op when
    // Supabase isn't configured (demo mode), matching the claim/offer flows.
    const request: PingRequest = {
      id: createId("req"),
      userId: activeUser.id,
      category: category!,
      needType: needType!,
      budgetMin,
      budgetMax,
      distanceKm: distanceKm!,
      timeStart: timeStart!,
      timeEnd: timeEnd!,
      preferences,
      verifiedHuman: true,
      status: "submitted",
      createdAt: new Date().toISOString(),
    };
    setData((d) => ({ ...d, requests: [...d.requests, request] }));
    void upsertRequest(request);
    navigate(`/matches?request=${request.id}`);
  }

  const availablePrefs = PREFERENCE_OPTIONS.filter(
    (p) => !p.categories || (category && p.categories.includes(category)),
  );

  const budgetPresets = needType ? budgetPresetsFor(needType) : [];
  const budgetValue =
    typeof budgetSel === "number"
      ? budgetPresets[budgetSel]?.label
      : budgetSel === "custom"
        ? "a custom amount"
        : undefined;

  const timeValue =
    timePreset === "custom"
      ? timeStart && timeEnd
        ? formatTimeRange(timeStart, timeEnd)
        : "a custom time"
      : timePreset
        ? TIME_WINDOW_PRESETS.find((p) => p.id === timePreset)?.label
        : undefined;

  const slideFade = {
    initial: { opacity: 0, y: 14, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -8, filter: "blur(4px)" },
  };

  return (
    <Reveal>
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={editId ? "Edit your" : "Create a"}
        accent="Lattice"
        subtitle="Fill in the blanks and we'll match you with verified local offers — by budget, timing, distance, and preferences."
      />

      <Card variant="solid" className="p-7 sm:p-9">
        {/* Step marker — this card is the request, the first move in the flow — beside a live quality read */}
        <div className="flex items-center justify-between gap-3">
          <span className="mono inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-[2px] bg-primary" aria-hidden="true" />
            <span className="text-foreground">01</span>
            <span className="text-muted-foreground/50">—</span>
            Request
          </span>
        </div>
        <AnimatePresence>
          {category && (
            <motion.div
              key="request-badge"
              {...slideFade}
              className="mb-5 flex items-center justify-between gap-3"
            >
              <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Your request
              </span>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Badge tone={QUALITY[quality].tone}>{QUALITY[quality].label}</Badge>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mad-libs sentence — blanks reveal after a business type is picked */}
        <div className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-3 font-display text-[22px] leading-[1.7] tracking-[-0.015em] text-foreground sm:text-[26px]">
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            I'm looking for
          </motion.span>
          <Blank
            placeholder="a business type"
            value={category ? CATEGORY_META[category].label : undefined}
          >
            {ALL_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <Option key={cat} active={category === cat} onSelect={() => selectCategory(cat)}>
                  <Icon name={meta.icon as IconName} size={16} className="text-primary" />
                  {meta.label}
                </Option>
              );
            })}
          </Blank>

          <AnimatePresence>
            {category && (
              <motion.span key="for-span" {...slideFade} transition={{ delay: 0.05 }}>
                for
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {category && (
              <motion.div key="need-blank" {...slideFade} transition={{ delay: 0.1 }}>
                <Blank
                  placeholder="what you need"
                  value={needType ? NEED_TYPE_LABELS[needType] : undefined}
                >
                  {NEED_TYPES_BY_CATEGORY[category].map((nt) => (
                    <Option key={nt} active={needType === nt} onSelect={() => selectNeed(nt)}>
                      {NEED_TYPE_LABELS[nt]}
                    </Option>
                  ))}
                </Blank>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {category && (
              <motion.span key="budget-span" {...slideFade} transition={{ delay: 0.15 }}>
                on a budget of
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {category && (
              <motion.div key="budget-blank" {...slideFade} transition={{ delay: 0.2 }}>
                <Blank placeholder="anything" value={budgetValue} invalid={!!errors.budget}>
                  {budgetPresets.map((preset, i) => (
                    <Option key={preset.label} active={budgetSel === i} onSelect={() => selectBudget(i)}>
                      {preset.label}
                    </Option>
                  ))}
                  <DropdownMenuSeparator />
                  <Option active={budgetSel === "custom"} onSelect={() => applyCustomBudget(customBudget)}>
                    Custom amount…
                  </Option>
                </Blank>
              </motion.div>
            )}
          </AnimatePresence>

              {budgetSel === "custom" && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-0.5 text-primary-strong ring-1 ring-inset ring-primary/20">
                  <span>$</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="max"
                    value={customBudget}
                    onChange={(e) => applyCustomBudget(e.target.value)}
                    aria-invalid={!!errors.budget}
                    className="w-16 bg-transparent font-semibold text-primary-strong outline-none placeholder:text-primary/40"
                  />
                </span>
              )}

          <AnimatePresence>
            {category && (
              <motion.span key="within-span" {...slideFade} transition={{ delay: 0.25 }}>
                within
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {category && (
              <motion.div key="distance-blank" {...slideFade} transition={{ delay: 0.3 }}>
                <Blank placeholder="any distance" value={distanceKm ? `${distanceKm} km` : undefined}>
                  {DISTANCE_OPTIONS_KM.map((km) => (
                    <Option key={km} active={distanceKm === km} onSelect={() => setDistanceKm(km)}>
                      <Icon name="location" size={15} className="text-primary" />
                      Within {km} km
                    </Option>
                  ))}
                </Blank>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {category && (
              <motion.span key="location-span" {...slideFade} transition={{ delay: 0.35 }}>
                of your location,
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {category && (
              <motion.div key="time-blank" {...slideFade} transition={{ delay: 0.4 }}>
                <Blank placeholder="anytime" value={timeValue} invalid={!!errors.time}>
                  {TIME_WINDOW_PRESETS.map((preset) => (
                    <Option
                      key={preset.id}
                      active={timePreset === preset.id}
                      onSelect={() => selectTime(preset.id)}
                    >
                      <Icon name="clock" size={15} className="text-primary" />
                      {preset.label}
                    </Option>
                  ))}
                </Blank>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {category && (
              <motion.span key="period" {...slideFade} transition={{ delay: 0.45 }}>
                .
              </motion.span>
            )}
          </AnimatePresence>
          {!category && (
            <span className="ml-2 text-[16px] leading-relaxed text-muted-foreground">
              Choose a business type to begin.
            </span>
          )}
        </div>

        <AnimatePresence>
          {category && (
            <motion.div key="form-body" {...slideFade} transition={{ delay: 0.5 }}>
            {/* Custom time window */}
            {timePreset === "custom" && (
              <motion.div
                key="custom-time"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-6 grid gap-3 rounded-[16px] bg-muted/60 p-4 ring-1 ring-inset ring-border/70 sm:grid-cols-3">
                  <div className="mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:col-span-3">
                  Custom window
                </div>
                <FormField label="Date" htmlFor="c-date">
                    <Input id="c-date" type="date" value={customDate} onChange={(e) => updateCustomTime(e.target.value, customStart, customEnd)} />
                  </FormField>
                  <FormField label="Start" htmlFor="c-start">
                    <Input id="c-start" type="time" value={customStart} onChange={(e) => updateCustomTime(customDate, e.target.value, customEnd)} />
                  </FormField>
                  <FormField label="End" htmlFor="c-end">
                    <Input id="c-end" type="time" value={customEnd} onChange={(e) => updateCustomTime(customDate, customStart, e.target.value)} />
                  </FormField>
                </div>
              </motion.div>
            )}
            <AnimatePresence>
              {budgetSel !== null && errors.budget && (
                <motion.p
                  key="budget-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-3 text-[13px] font-medium text-destructive"
                >
                  {errors.budget}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Preferences */}
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="mt-8 border-t border-border/70 pt-6"
            >
              <div className="mb-3 mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Preferences <span className="text-muted-foreground/55">· Optional</span>
              </div>
              <Stagger>
                <ChipGroup>
                  {availablePrefs.map((pref) => (
                    <StaggerItem key={pref.id} as="span">
                      <ToggleChip
                        active={preferences.includes(pref.id)}
                        onClick={() => togglePref(pref.id)}
                        icon={preferences.includes(pref.id) ? <Icon name="check" size={14} /> : undefined}
                      >
                        {pref.label}
                      </ToggleChip>
                    </StaggerItem>
                  ))}
                </ChipGroup>
              </Stagger>
            </motion.div>

            {/* Note */}
            <motion.div
              key="note"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="mt-6"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-foreground">
                  Note <span className="font-normal">(optional)</span>
                </span>
                <span className="mono text-[12px] text-muted-foreground">
                  {note.length}/{NOTE_MAX}
                </span>
              </div>
              <Textarea
                value={note}
                maxLength={NOTE_MAX}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Example: need outlets and a quiet table"
                aria-invalid={!!errors.note}
              />
              <AnimatePresence>
                {errors.note && (
                  <motion.p
                    key="note-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1.5 text-[13px] font-medium text-destructive"
                  >
                    {errors.note}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {errors.duplicate && (
                <motion.p
                  key="duplicate-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-5 rounded-xl bg-[var(--danger-tint)] px-3 py-2 text-[13px] font-medium text-[var(--danger)]"
                >
                  {errors.duplicate}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showLocationPrompt && (
                <motion.div
                  key="location-banner"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-5 flex flex-col gap-2 rounded-xl bg-[var(--tint-blue)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-[13px] text-[var(--primary-strong)]">
                    {geolocation.permission === "denied"
                      ? "Location is blocked. Re-enable it in your browser to match by distance."
                      : "Enable location for accurate distance matching"}
                  </span>
                  <ShareLocationButton
                    loading={geolocation.loading}
                    error={geolocation.error}
                    onRequest={handleShareLocation}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              key="footer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="matches" size={16} className="text-primary" />
                <span>Estimated matches</span>
                <span className="mono text-base font-semibold text-foreground">{estMatches ?? "—"}</span>
              </div>
              <motion.div whileTap={validation.valid ? { scale: 0.97 } : undefined}>
                <Button
                  variant="brand"
                  size="lg"
                  disabled={!validation.valid}
                  onClick={() => setVerifyOpen(true)}
                  iconRight={<Icon name="arrow" size={18} />}
                >
                  Find matching offers
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Card>

      <BotCheckModal
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onVerified={onVerified}
        title="Quick verification"
        description="A quick human check keeps offers fair before we match your Lattice."
      />
    </div>
    </Reveal>
  );
}
