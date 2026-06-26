import { forwardRef, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Badge, type BadgeTone } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
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
import { NOTE_MAX } from "@/utils/constants";
import { toast } from "sonner";
import { requestRepo } from "@/repositories";
import { formatCurrency, formatTimeRange } from "@/utils/formatting";
import type { BusinessCategory, NeedType } from "@/models";
import { cn } from "@/lib/utils";

const QUALITY: Record<string, { tone: BadgeTone; label: string }> = {
  invalid: { tone: "danger", label: "Incomplete" },
  weak: { tone: "warning", label: "Weak" },
  strong: { tone: "success", label: "Strong" },
};

/** need type -> its owning category, so picking a need derives the category. */
const NEED_TO_CATEGORY = (() => {
  const map = {} as Record<NeedType, BusinessCategory>;
  (Object.keys(NEED_TYPES_BY_CATEGORY) as BusinessCategory[]).forEach((cat) => {
    NEED_TYPES_BY_CATEGORY[cat].forEach((nt) => {
      map[nt] = cat;
    });
  });
  return map;
})();

const PREF_LABEL = Object.fromEntries(PREFERENCE_OPTIONS.map((p) => [p.id, p.label]));

/**
 * Inline "Mad Libs" blank — a fillable token inside the request sentence.
 * Empty: a dashed-underline faded placeholder word. Filled: a solid signal-blue
 * pill. Used as the trigger child of a Radix dropdown (forwardRef + asChild).
 */
const Blank = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & {
    filled?: boolean;
    invalid?: boolean;
    placeholder: ReactNode;
    value?: ReactNode;
    chevron?: boolean;
  }
>(({ filled, invalid, placeholder, value, chevron = true, className, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    data-filled={filled || undefined}
    className={cn(
      "mx-0.5 inline-flex max-w-full items-center gap-1 align-middle outline-none transition-colors duration-150",
      "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
      filled
        ? "rounded-full border border-primary/35 bg-secondary px-2.5 py-0.5 text-[0.86em] font-semibold text-secondary-foreground ring-1 ring-inset ring-primary/15"
        : "rounded-md border-b border-dashed border-[var(--input)] px-0.5 text-[0.92em] font-medium text-muted-foreground/80 hover:border-foreground/45 hover:text-foreground",
      invalid &&
        "border-destructive text-destructive ring-destructive/30 hover:border-destructive hover:text-destructive",
      "disabled:cursor-not-allowed disabled:opacity-45",
      className,
    )}
    {...rest}
  >
    <span className="truncate">{filled ? value : placeholder}</span>
    {chevron && <Icon name="chevron" size={13} className="shrink-0 opacity-55" />}
  </button>
));
Blank.displayName = "Blank";

/** Quiet ghost chip used in the optional "refine" row. */
const RefineChip = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & {
    filled?: boolean;
    invalid?: boolean;
    icon?: IconName;
    chevron?: boolean;
  }
>(({ filled, invalid, icon, chevron = true, className, children, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium outline-none transition-colors duration-200",
      "focus-visible:ring-2 focus-visible:ring-ring/40",
      filled
        ? "border-primary/35 bg-secondary text-secondary-foreground ring-1 ring-inset ring-primary/15"
        : "border-dashed border-[var(--input)] bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      invalid && "border-destructive text-destructive",
      "disabled:cursor-not-allowed disabled:opacity-45",
      className,
    )}
    {...rest}
  >
    {icon && <Icon name={icon} size={14} className="shrink-0" />}
    {children}
    {chevron && <Icon name="chevron" size={13} className="shrink-0 opacity-55" />}
  </button>
));
RefineChip.displayName = "RefineChip";

const menuContentCls = "max-h-[min(62vh,420px)] min-w-[13rem] overflow-y-auto";

export function CreateLatticePage() {
  const { data, activeUser, setData } = useApp();

  const [category, setCategory] = useState<BusinessCategory>();
  const [needType, setNeedType] = useState<NeedType>();
  const [budgetSel, setBudgetSel] = useState<number | "custom" | null>(null);
  const [customBudget, setCustomBudget] = useState("");
  const [budgetMin, setBudgetMin] = useState<number>();
  const [budgetMax, setBudgetMax] = useState<number>();
  const [distanceKm, setDistanceKm] = useState<number>();
  const [timePreset, setTimePreset] = useState<TimeWindowPresetId>();
  const [customDate, setCustomDate] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [timeStart, setTimeStart] = useState<string>();
  const [timeEnd, setTimeEnd] = useState<string>();
  const [preferences, setPreferences] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
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
    const req = { ...draft, id: "preview", status: "submitted", createdAt: new Date().toISOString(), verifiedHuman: false } as Parameters<typeof getMatchingOffers>[0];
    return getMatchingOffers(req, data.offers, data.businesses, activeUser).length;
  }, [validation.valid, draft, data.offers, data.businesses, activeUser]);

  function selectNeed(nt: NeedType) {
    const cat = NEED_TO_CATEGORY[nt];
    setNeedType(nt);
    setCategory(cat);
    // budget presets are need-specific — reset on need change
    setBudgetSel(null);
    setBudgetMin(undefined);
    setBudgetMax(undefined);
    setCustomBudget("");
    // drop any preferences not available for the new category
    setPreferences((prev) =>
      prev.filter((id) => {
        const opt = PREFERENCE_OPTIONS.find((p) => p.id === id);
        return !opt?.categories || opt.categories.includes(cat);
      }),
    );
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

  function clearBudget() {
    setBudgetSel(null);
    setBudgetMin(undefined);
    setBudgetMax(undefined);
    setCustomBudget("");
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
          ? "any budget"
          : null;

  const whenValue =
    timePreset === "custom"
      ? timeStart && timeEnd
        ? formatTimeRange(timeStart, timeEnd)
        : "custom…"
      : TIME_WINDOW_PRESETS.find((p) => p.id === timePreset)?.label;

  const prefsLabel =
    preferences.length === 0
      ? "preferences"
      : preferences.length === 1
        ? PREF_LABEL[preferences[0]].toLowerCase()
        : `${PREF_LABEL[preferences[0]].toLowerCase()} +${preferences.length - 1}`;

  const missingHint = !needType
    ? "Pick what you need."
    : distanceKm === undefined
      ? "Choose how far you'll go."
      : !timeStart || !timeEnd
        ? "Choose when you need it."
        : errors.time
          ? errors.time
          : errors.budget
            ? "Adjust your budget to continue."
            : errors.note
              ? "Fix your note to continue."
              : "Complete the required blanks to match.";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create a"
        accent="Lattice"
        subtitle="Fill in the blanks and we'll match you with verified local offers nearby."
      />

      <Card variant="solid" className="mx-auto max-w-[760px] p-6 sm:p-8">
        <p className="mono mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          New request
        </p>

        {/* ── The Mad Libs sentence ── */}
        <p className="font-display text-[20px] leading-[2.1] tracking-[-0.01em] text-foreground sm:text-[23px]">
          Find me{" "}
          {/* need (folds in category via grouped menu) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Blank filled={!!needType} placeholder="something" value={needType && NEED_TYPE_LABELS[needType]} aria-label="What you need" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={menuContentCls}>
              {ALL_CATEGORIES.map((cat, ci) => (
                <div key={cat}>
                  {ci > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>{CATEGORY_META[cat].label}</DropdownMenuLabel>
                  {NEED_TYPES_BY_CATEGORY[cat].map((nt) => (
                    <DropdownMenuItem key={nt} onSelect={() => selectNeed(nt)}>
                      <span className="flex-1">{NEED_TYPE_LABELS[nt]}</span>
                      {needType === nt && <Icon name="check" size={15} className="text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>{" "}
          within{" "}
          {/* distance */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Blank filled={distanceKm !== undefined} placeholder="how far" value={distanceKm !== undefined ? `${distanceKm} km` : undefined} aria-label="Distance" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {DISTANCE_OPTIONS_KM.map((km) => (
                <DropdownMenuItem key={km} onSelect={() => setDistanceKm(km)}>
                  <span className="flex-1">Within {km} km</span>
                  {distanceKm === km && <Icon name="check" size={15} className="text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>{" "}
          of{" "}
          {/* origin — static, never a dropdown */}
          <span
            className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-[var(--brand-tint)] px-2.5 py-0.5 align-middle text-[0.86em] font-semibold text-[var(--primary-strong)]"
            title="Your saved home location"
          >
            <Icon name="location" size={13} className="shrink-0" />
            {originName}
          </span>
          ,{" "}
          {/* when */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Blank
                filled={!!(timeStart && timeEnd)}
                invalid={!!(timePreset && errors.time)}
                placeholder="anytime"
                value={whenValue}
                aria-label="When you need it"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {TIME_WINDOW_PRESETS.map((preset) => (
                <DropdownMenuItem key={preset.id} onSelect={() => selectTime(preset.id)}>
                  <span className="flex-1">{preset.label}</span>
                  {timePreset === preset.id && <Icon name="check" size={15} className="text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-muted-foreground">.</span>
        </p>

        {/* custom time drawer — only when "Custom" is chosen */}
        {timePreset === "custom" && (
          <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:grid-cols-3">
            <FormField label="Date" htmlFor="c-date">
              <Input id="c-date" type="date" value={customDate} onChange={(e) => updateCustomTime(e.target.value, customStart, customEnd)} />
            </FormField>
            <FormField label="Start" htmlFor="c-start">
              <Input id="c-start" type="time" value={customStart} onChange={(e) => updateCustomTime(customDate, e.target.value, customEnd)} />
            </FormField>
            <FormField label="End" htmlFor="c-end">
              <Input id="c-end" type="time" value={customEnd} onChange={(e) => updateCustomTime(customDate, customStart, e.target.value)} />
            </FormField>
            {errors.time && <p className="text-[13px] font-medium text-destructive sm:col-span-3">{errors.time}</p>}
          </div>
        )}

        {/* ── Optional refine row ── */}
        <div className="mt-6 border-t border-border pt-5">
          <p className="mono mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Refine · optional
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* budget (depends on need) */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <RefineChip
                    icon="ticket"
                    filled={budgetSel !== null}
                    invalid={!!errors.budget}
                    disabled={!needType}
                    title={!needType ? "Pick a need first" : undefined}
                  >
                    {budgetSel !== null && budgetText ? budgetText : "Budget"}
                  </RefineChip>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={menuContentCls}>
                  {(needType ? budgetPresetsFor(needType) : []).map((preset, i) => (
                    <DropdownMenuItem key={preset.label} onSelect={() => selectBudget(i)}>
                      <span className="flex-1">{preset.label}</span>
                      {budgetSel === i && <Icon name="check" size={15} className="text-primary" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => applyCustomBudget(customBudget || "")}>
                    Custom max…
                  </DropdownMenuItem>
                  {budgetSel !== null && (
                    <DropdownMenuItem onSelect={clearBudget} className="text-muted-foreground">
                      Clear budget
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {budgetSel === "custom" && (
                <Input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder="Max $"
                  aria-label="Custom budget maximum"
                  value={customBudget}
                  onChange={(e) => applyCustomBudget(e.target.value)}
                  aria-invalid={!!errors.budget}
                  aria-describedby={errors.budget ? "budget-error" : undefined}
                  className="h-9 w-24"
                />
              )}
            </div>

            {/* preferences (multi-select, depends on category) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <RefineChip
                  icon="saved"
                  filled={preferences.length > 0}
                  disabled={!needType}
                  title={!needType ? "Pick a need first" : undefined}
                  aria-label={preferences.length ? `${preferences.length} preferences selected` : "Add preferences"}
                >
                  {prefsLabel}
                </RefineChip>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={menuContentCls}>
                <DropdownMenuLabel>Preferences</DropdownMenuLabel>
                {availablePrefs.map((pref) => (
                  <DropdownMenuCheckboxItem
                    key={pref.id}
                    checked={preferences.includes(pref.id)}
                    onCheckedChange={() => togglePref(pref.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {pref.label}
                  </DropdownMenuCheckboxItem>
                ))}
                {preferences.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setPreferences([])} className="text-muted-foreground">
                      Clear all
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* note (inline expand) */}
            <RefineChip
              icon="reviews"
              chevron={false}
              filled={note.length > 0}
              invalid={!!errors.note}
              onClick={() => setNoteOpen((o) => !o)}
              aria-expanded={noteOpen}
            >
              {note.length > 0 ? "Note added" : "Note"}
            </RefineChip>
          </div>

          {errors.budget && (
            <p id="budget-error" className="mt-2.5 text-[13px] font-medium text-destructive">
              {errors.budget}
            </p>
          )}

          {noteOpen && (
            <div className="mt-3">
              <Textarea
                value={note}
                maxLength={NOTE_MAX}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. need outlets and a quiet table"
                aria-invalid={!!errors.note}
                autoFocus
              />
              <div className="mt-1.5 flex items-center justify-between">
                {errors.note ? (
                  <p className="text-[13px] font-medium text-destructive">{errors.note}</p>
                ) : note.length > 0 ? (
                  <button
                    type="button"
                    className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setNote("");
                      setNoteOpen(false);
                    }}
                  >
                    Remove note
                  </button>
                ) : (
                  <span />
                )}
                <span className="mono text-[12px] text-muted-foreground">
                  {note.length}/{NOTE_MAX}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer status rail ── */}
        {errors.duplicate && (
          <p className="mt-5 rounded-xl bg-[var(--danger-tint)] px-3 py-2 text-[13px] font-medium text-[var(--danger)]">
            {errors.duplicate}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div className="flex items-center gap-3">
            <Badge tone={QUALITY[quality].tone} dot>
              {QUALITY[quality].label}
            </Badge>
            <span className="mono text-sm text-muted-foreground">
              {validation.valid ? (
                <>
                  ~<span className="font-semibold text-foreground">{estMatches}</span> matches
                </>
              ) : (
                "— matches"
              )}
            </span>
          </div>
          <Button
            variant="brand"
            size="lg"
            disabled={!validation.valid}
            onClick={() => setVerifyOpen(true)}
            iconRight={<Icon name="arrow" size={18} />}
          >
            Find matching offers
          </Button>
        </div>
        {!validation.valid && (
          <p className="mt-2.5 text-right text-[12px] text-muted-foreground">{missingHint}</p>
        )}
      </Card>

      <VerificationModal open={verifyOpen} onOpenChange={setVerifyOpen} onVerified={onVerified} />
    </div>
  );
}
