import { useMemo, useState, type ReactNode } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Badge, type BadgeTone } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { FormField } from "@/components/common/FormField";
import { HelpTooltip } from "@/components/common/HelpTooltip";
import { PageHeader } from "@/components/common/PageHeader";
import { Icon, type IconName } from "@/components/common/Icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { NOTE_MAX } from "@/utils/constants";
import { toast } from "sonner";
import { requestRepo } from "@/repositories";
import { formatCurrency, formatTimeRange } from "@/utils/formatting";
import type { BusinessCategory, NeedType, PingRequest } from "@/models";
import { cn } from "@/lib/utils";

const QUALITY: Record<string, { tone: BadgeTone; label: string }> = {
  invalid: { tone: "danger", label: "Incomplete" },
  weak: { tone: "warning", label: "Weak" },
  strong: { tone: "success", label: "Strong" },
};

function Section({
  step,
  title,
  hint,
  disabled,
  children,
}: {
  step: number;
  title: string;
  hint?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Card variant="solid" className={cn("p-5", disabled && "pointer-events-none opacity-55")}>
      <div className="mb-3.5 flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-accent text-[12px] font-bold text-primary">
          {step}
        </span>
        <h3 className="font-display text-[16px] font-semibold tracking-[-0.02em]">{title}</h3>
        {hint && <HelpTooltip label={hint} />}
      </div>
      {children}
    </Card>
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
  const [note, setNote] = useState("");
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
      optionalNote: note || undefined,
    }),
    [activeUser.id, category, needType, budgetMin, budgetMax, distanceKm, timeStart, timeEnd, preferences, note],
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

  async function onVerified() {
    try {
      const created = await requestRepo.submit({
        category: category!,
        needType: needType!,
        distanceKm: distanceKm!,
        timeStart: timeStart!,
        timeEnd: timeEnd!,
        budgetMin,
        budgetMax,
        preferences,
        optionalNote: note || undefined,
        verifiedHuman: true,
      });
      setData((d) => ({ ...d, requests: [...d.requests, created] }));
      navigate(`/matches?request=${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit your request.");
    }
  }

  const availablePrefs = PREFERENCE_OPTIONS.filter(
    (p) => !p.categories || (category && p.categories.includes(category)),
  );
  const budgetText =
    budgetMax !== undefined
      ? `under ${formatCurrency(budgetMax)}`
      : budgetMin !== undefined
        ? `${formatCurrency(budgetMin)}+`
        : budgetSel !== null
          ? "Any budget"
          : "—";

  const summary: Array<{ label: string; value: ReactNode; icon: IconName }> = [
    { label: "Need", icon: "ping", value: needType ? NEED_TYPE_LABELS[needType] : "—" },
    { label: "Budget", icon: "ticket", value: budgetText },
    { label: "Distance", icon: "location", value: distanceKm ? `within ${distanceKm} km` : "—" },
    {
      label: "When",
      icon: "clock",
      value: timeStart && timeEnd ? formatTimeRange(timeStart, timeEnd) : "—",
    },
    {
      label: "Preferences",
      icon: "saved",
      value: preferences.length ? `${preferences.length} selected` : "None",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create a"
        accent="Lattice"
        subtitle="Describe what you need and we'll match you with verified local offers — by budget, timing, distance, and preferences."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Builder */}
        <div className="space-y-4">
          <Section step={1} title="What kind of business?">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => selectCategory(cat)}
                    aria-pressed={selected}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all duration-200",
                      selected
                        ? "border-primary/40 bg-secondary ring-1 ring-inset ring-primary/15"
                        : "border-border bg-card hover:-translate-y-0.5 hover:border-[var(--input)]",
                    )}
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
                      <Icon name={meta.icon as IconName} size={18} />
                    </span>
                    <span className="text-sm font-semibold">{meta.label}</span>
                    <span className="text-[12px] leading-snug text-muted-foreground">{meta.description}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section step={2} title="What do you need?" disabled={!category}>
            <ChipGroup>
              {(category ? NEED_TYPES_BY_CATEGORY[category] : []).map((nt) => (
                <ToggleChip key={nt} active={needType === nt} onClick={() => selectNeed(nt)}>
                  {NEED_TYPE_LABELS[nt]}
                </ToggleChip>
              ))}
            </ChipGroup>
          </Section>

          <Section
            step={3}
            title="What's your budget?"
            disabled={!needType}
            hint="Each need type has a realistic minimum — too low and we'll suggest a better range."
          >
            <ChipGroup>
              {(needType ? budgetPresetsFor(needType) : []).map((preset, i) => (
                <ToggleChip key={preset.label} active={budgetSel === i} onClick={() => selectBudget(i)}>
                  {preset.label}
                </ToggleChip>
              ))}
              {needType && (
                <ToggleChip active={budgetSel === "custom"} onClick={() => applyCustomBudget(customBudget || "")}>
                  Custom
                </ToggleChip>
              )}
            </ChipGroup>
            {budgetSel === "custom" && (
              <div className="mt-3 max-w-48">
                <Input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder="Max $"
                  value={customBudget}
                  onChange={(e) => applyCustomBudget(e.target.value)}
                  aria-invalid={!!errors.budget}
                />
              </div>
            )}
            {needType && errors.budget && (
              <p className="mt-2 text-[13px] font-medium text-destructive">{errors.budget}</p>
            )}
          </Section>

          <Section step={4} title="How far will you go?" disabled={!needType}>
            <ChipGroup>
              {DISTANCE_OPTIONS_KM.map((km) => (
                <ToggleChip
                  key={km}
                  active={distanceKm === km}
                  icon={<Icon name="location" size={14} />}
                  onClick={() => setDistanceKm(km)}
                >
                  Within {km} km
                </ToggleChip>
              ))}
            </ChipGroup>
            <p className="mt-2.5 text-[13px] text-muted-foreground">
              From <span className="font-medium text-foreground">{originName}</span>
            </p>
          </Section>

          <Section step={5} title="When do you need it?" disabled={!needType}>
            <ChipGroup>
              {TIME_WINDOW_PRESETS.map((preset) => (
                <ToggleChip
                  key={preset.id}
                  active={timePreset === preset.id}
                  icon={<Icon name="clock" size={14} />}
                  onClick={() => selectTime(preset.id)}
                >
                  {preset.label}
                </ToggleChip>
              ))}
            </ChipGroup>
            {timePreset === "custom" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
            {timePreset && errors.time && (
              <p className="mt-2 text-[13px] font-medium text-destructive">{errors.time}</p>
            )}
          </Section>

          <Section step={6} title="Any preferences?" disabled={!category}>
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
          </Section>

          <Section step={7} title="Add a note (optional)" disabled={!category}>
            <Textarea
              value={note}
              maxLength={NOTE_MAX}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Example: need outlets and a quiet table"
              aria-invalid={!!errors.note}
            />
            <div className="mt-1.5 flex items-center justify-between">
              {errors.note ? (
                <p className="text-[13px] font-medium text-destructive">{errors.note}</p>
              ) : (
                <span />
              )}
              <span className="mono text-[12px] text-muted-foreground">
                {note.length}/{NOTE_MAX}
              </span>
            </div>
          </Section>
        </div>

        {/* Live preview */}
        <aside className="h-fit lg:sticky lg:top-24">
          <Card variant="glassBlue" className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">
                Your <span className="font-accent font-normal text-primary">Lattice</span>
              </h3>
              <Badge tone={QUALITY[quality].tone}>{QUALITY[quality].label}</Badge>
            </div>

            <div className="space-y-2.5">
              {summary.map((row) => (
                <div key={row.label} className="flex items-center gap-2.5 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-card/70 text-primary">
                    <Icon name={row.icon} size={14} />
                  </span>
                  <span className="w-24 shrink-0 text-muted-foreground">{row.label}</span>
                  <span className="truncate font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated matches</span>
              <span className="mono text-lg font-semibold text-foreground">{estMatches ?? "—"}</span>
            </div>

            {errors.duplicate && (
              <p className="rounded-xl bg-[var(--danger-tint)] px-3 py-2 text-[13px] font-medium text-[var(--danger)]">
                {errors.duplicate}
              </p>
            )}

            <Button
              variant="brand"
              block
              size="lg"
              disabled={!validation.valid}
              onClick={() => setVerifyOpen(true)}
              iconRight={<Icon name="arrow" size={18} />}
            >
              Find matching offers
            </Button>
            {!validation.valid && (
              <p className="text-center text-[12px] text-muted-foreground">
                Complete the required steps to match.
              </p>
            )}
          </Card>
        </aside>
      </div>

      <VerificationModal open={verifyOpen} onOpenChange={setVerifyOpen} onVerified={onVerified} />
    </div>
  );
}
