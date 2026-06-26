import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Badge, type BadgeTone } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { FormField } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { Icon, type IconName } from "@/components/common/Icon";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { VerificationModal } from "@/components/domain/VerificationModal";
import { validatePingRequest, getRequestQuality } from "@/services/requestValidationService";
import { getMatchingOffers } from "@/services/offerMatchingService";
import {
  ALL_CATEGORIES,
  CATEGORY_META,
  DEMO_ORIGINS,
  DISTANCE_OPTIONS_KM,
  NEED_TYPES_BY_CATEGORY,
  NEED_TYPE_LABELS,
  PREFERENCE_OPTIONS,
  TIME_WINDOW_PRESETS,
  budgetPresetsFor,
} from "@/data/catalog";
import { customTimeWindow, timeWindowForPreset, type TimeWindowPresetId } from "@/utils/timeWindows";
import { createId } from "@/utils/ids";
import { upsertRequest } from "@/services/dbService";
import { formatTimeRange } from "@/utils/formatting";
import type { BusinessCategory, NeedType, PingRequest } from "@/models";
import { cn } from "@/lib/utils";

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
      <DropdownMenuTrigger
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
        <ChevronDown
          size={16}
          className="shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
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

  const [category, setCategory] = useState<BusinessCategory>();
  const [needType, setNeedType] = useState<NeedType>();
  const [budgetSel, setBudgetSel] = useState<number | "custom" | null>(null);
  const [customBudget, setCustomBudget] = useState("");
  const [budgetMin, setBudgetMin] = useState<number>();
  const [budgetMax, setBudgetMax] = useState<number>();
  // Prefill the search radius from the user's onboarding default (if it's a valid option).
  const [distanceKm, setDistanceKm] = useState<number | undefined>(() =>
    (DISTANCE_OPTIONS_KM as readonly number[]).includes(activeUser.preferences.maxDefaultDistanceKm)
      ? activeUser.preferences.maxDefaultDistanceKm
      : undefined,
  );
  const [timePreset, setTimePreset] = useState<TimeWindowPresetId>();
  const [customDate, setCustomDate] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [timeStart, setTimeStart] = useState<string>();
  const [timeEnd, setTimeEnd] = useState<string>();
  // Prefill the student-discount preference from onboarding.
  const [preferences, setPreferences] = useState<string[]>(() =>
    activeUser.preferences.studentDiscountPreferred ? ["studentDiscount"] : [],
  );
  const [verifyOpen, setVerifyOpen] = useState(false);

  const originName =
    DEMO_ORIGINS.find((o) => o.id === activeUser.homeLocationId)?.name ?? DEMO_ORIGINS[0].name;

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

  const validation = useMemo(() => validatePingRequest(draft, data.requests), [draft, data.requests]);
  const quality = useMemo(() => getRequestQuality(draft, data.requests), [draft, data.requests]);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Create a"
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
          {category && (
            <Badge tone={QUALITY[quality].tone} dot>
              {QUALITY[quality].label}
            </Badge>
          )}
        </div>

        {/* Mad-libs sentence — blanks reveal after a business type is picked */}
        <div className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-3 font-display text-[22px] leading-[1.7] tracking-[-0.015em] text-foreground sm:text-[26px]">
          <span>I'm looking for</span>
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

          {category && (
            <>
              <span>for</span>
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

              <span>on a budget of</span>
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

              <span>within</span>
              <Blank placeholder="any distance" value={distanceKm ? `${distanceKm} km` : undefined}>
                {DISTANCE_OPTIONS_KM.map((km) => (
                  <Option key={km} active={distanceKm === km} onSelect={() => setDistanceKm(km)}>
                    <Icon name="location" size={15} className="text-primary" />
                    Within {km} km
                  </Option>
                ))}
              </Blank>

              <span>of {originName},</span>
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
              <span>.</span>
            </>
          )}
        </div>

        {!category && (
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Choose a business type to begin. Each blank you fill sharpens your matches.
          </p>
        )}

        {category && (
          <>
            {/* Custom time window */}
            {timePreset === "custom" && (
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
            )}
            {budgetSel !== null && errors.budget && (
              <p className="mt-3 text-[13px] font-medium text-destructive">{errors.budget}</p>
            )}

            {/* Preferences */}
            <div className="mt-8 border-t border-border/70 pt-6">
              <div className="mb-3 mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Preferences <span className="text-muted-foreground/55">· Optional</span>
              </div>
              <ChipGroup>
                {availablePrefs.map((pref) => (
                  <ToggleChip
                    key={pref.id}
                    active={preferences.includes(pref.id)}
                    onClick={() => togglePref(pref.id)}
                    icon={preferences.includes(pref.id) ? <Icon name="check" size={14} /> : undefined}
                  >
                    {pref.label}
                  </ToggleChip>
                ))}
              </ChipGroup>
            </div>

            {errors.duplicate && (
              <p className="mt-6 rounded-xl bg-[var(--danger-tint)] px-3 py-2 text-[13px] font-medium text-[var(--danger)]">
                {errors.duplicate}
              </p>
            )}

            {/* Footer */}
            <div className="mt-8 flex flex-col gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="matches" size={16} className="text-primary" />
                <span>Estimated matches</span>
                <span className="mono text-[17px] font-semibold text-foreground">{estMatches ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-1.5 sm:items-end">
                <Button
                  variant="brand"
                  size="lg"
                  disabled={!validation.valid}
                  onClick={() => setVerifyOpen(true)}
                  iconRight={<Icon name="arrow" size={18} />}
                >
                  Find matching offers
                </Button>
                {!validation.valid && (
                  <p className="text-[12px] text-muted-foreground sm:text-right">
                    Fill in every blank to match.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <VerificationModal open={verifyOpen} onOpenChange={setVerifyOpen} onVerified={onVerified} />
    </div>
  );
}
