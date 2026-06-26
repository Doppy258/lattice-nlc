/**
 * OnboardingPage - /onboarding.
 * Purpose: Three-step onboarding wizard for new users — selects interest
 * categories, accessibility needs, and general preferences (radius, student
 * discount). Saves preferences to Supabase Auth metadata and marks user as
 * onboarded.
 * Key flows: Step indicator and animated transitions; category toggle grid;
 * accessibility options; radius + student discount toggle; final submit
 * calls completeOnboarding then navigates to /home.
 */
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { LatticeMark } from "@/components/layout/LatticeMark";
import { AuthError, AuthShell } from "./authShared";
import {
  ALL_CATEGORIES,
  CATEGORY_META,
  DISTANCE_OPTIONS_KM,
} from "../data/catalog";
import type { BusinessCategory } from "../models";
import { cn } from "@/lib/utils";

type StepMeta = { label: string; icon: string; use: string };
const STEPS: StepMeta[] = [
  { label: "Interests", icon: "explore", use: "Picks the offers we feature for you on your home feed." },
  { label: "Accessibility", icon: "saved", use: "Helps us prioritise venues that fit how you want to spend time." },
  { label: "Preferences", icon: "saved", use: "Pre-fills your search radius and deals when you create a Lattice." },
];

const ACCESSIBILITY_OPTIONS = [
  {
    id: "wheelchairAccessible",
    label: "Wheelchair accessible",
    description: "Prioritise venues with step-free access.",
    icon: "check",
  },
  {
    id: "quiet",
    label: "Quiet environment",
    description: "Prefer calmer spots for studying or focused time.",
    icon: "saved",
  },
] as const;

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };
const slideUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export function OnboardingPage() {
  const { activeUser, completeOnboarding } = useApp();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<BusinessCategory[]>(
    activeUser?.preferences?.preferredCategories ?? [],
  );
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>(
    activeUser?.preferences?.accessibilityNeeds ?? [],
  );
  const [radiusKm, setRadiusKm] = useState<number>(activeUser?.preferences?.maxDefaultDistanceKm ?? 5);
  const [studentDiscount, setStudentDiscount] = useState(
    activeUser?.preferences?.studentDiscountPreferred ?? false,
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const firstName = activeUser.name.split(" ")[0];

  const toggleCategory = (cat: BusinessCategory) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleAccessibilityNeed = (need: string) => {
    setAccessibilityNeeds((prev) => (
      prev.includes(need) ? prev.filter((item) => item !== need) : [...prev, need]
    ));
  };

  const canAdvance = () => (step === 0 ? categories.length > 0 : true);

  const handleNext = () => {
    if (!canAdvance()) {
      setError("Pick at least one interest so we can tailor your matches.");
      return;
    }
    setError("");
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      setStep(0);
      setError("Pick at least one interest so we can tailor your matches.");
      return;
    }
    setSubmitting(true);
    const err = await completeOnboarding({
      name: activeUser.name,
      preferences: {
        ...activeUser.preferences,
        preferredCategories: categories,
        accessibilityNeeds,
        maxDefaultDistanceKm: radiusKm,
        studentDiscountPreferred: studentDiscount,
      },
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    navigate("/home");
  };

  const anim = reduced ? {} : slideUp;

  return (
    <AuthShell wide>
      <div className="flex items-center justify-between gap-3">
        <LatticeMark size={40} />
        <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-[var(--primary-strong)]">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      <h1 className="mt-5 font-display text-[26px] font-semibold tracking-[-0.035em]">
        Welcome, <span className="font-accent font-normal text-primary">{firstName}</span>
      </h1>
      <p className="mt-1 text-[14px] text-muted-foreground">
        A few quick answers and Lattice starts matching you with the right local offers.
      </p>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold transition-colors",
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "bg-[var(--brand-tint)] text-[var(--primary-strong)] ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Icon name="check" size={13} /> : i + 1}
              </span>
              <span className={cn("hidden text-[13px] font-medium sm:block", active ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </div>
          );
        })}
      </div>

      {/* Relevance hint — tells the user exactly how the current step is used. */}
      <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[var(--tint-blue)] px-3.5 py-2.5 text-[13px] text-[var(--primary-strong)]">
        <Icon name={STEPS[step].icon as never} size={15} className="mt-px shrink-0" />
        <span>{STEPS[step].use}</span>
      </div>

      {error && (
        <div className="mt-4">
          <AuthError message={error} />
        </div>
      )}

      <div className="mt-5 min-h-[238px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step-0" {...anim} transition={spring}>
              <p className="mb-3 text-[14px] font-medium text-foreground">
                What are you into? <span className="text-muted-foreground">Pick a few.</span>
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {ALL_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const selected = categories.includes(cat);
                  return (
                    <motion.button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      whileTap={reduced ? undefined : { scale: 0.97 }}
                      aria-pressed={selected}
                      className={cn(
                        "relative flex cursor-pointer flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-colors",
                        selected
                          ? "border-primary/40 bg-[var(--tint-blue)] ring-1 ring-inset ring-primary/20"
                          : "border-border bg-card hover:border-[var(--input)]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-xl",
                          selected ? "bg-primary text-white" : "bg-accent text-primary",
                        )}
                      >
                        <Icon name={meta.icon as never} size={18} />
                      </span>
                      <span className="text-[14px] font-semibold tracking-[-0.01em]">{meta.label}</span>
                      <span className="text-[11px] leading-snug text-muted-foreground">{meta.description}</span>
                      {selected && (
                        <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-primary text-white">
                          <Icon name="check" size={12} />
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step-1" {...anim} transition={spring}>
              <p className="mb-3 text-[14px] font-medium text-foreground">
                Any venue needs we should remember?
              </p>
              <div className="space-y-2.5">
                <motion.button
                  type="button"
                  onClick={() => setAccessibilityNeeds([])}
                  whileTap={reduced ? undefined : { scale: 0.99 }}
                  aria-pressed={accessibilityNeeds.length === 0}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                    accessibilityNeeds.length === 0
                      ? "border-primary/40 bg-[var(--tint-blue)] ring-1 ring-inset ring-primary/20"
                      : "border-border bg-card hover:border-[var(--input)]",
                  )}
                >
                  <span className={cn("grid size-10 place-items-center rounded-xl", accessibilityNeeds.length === 0 ? "bg-primary text-white" : "bg-accent text-primary")}>
                    <Icon name="check" size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-semibold">No special needs</span>
                    <span className="block text-[12px] text-muted-foreground">Show me the best overall matches.</span>
                  </span>
                  {accessibilityNeeds.length === 0 && <Icon name="check" size={18} className="text-primary" />}
                </motion.button>

                {ACCESSIBILITY_OPTIONS.map((option) => {
                  const selected = accessibilityNeeds.includes(option.id);
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      onClick={() => toggleAccessibilityNeed(option.id)}
                      whileTap={reduced ? undefined : { scale: 0.99 }}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                        selected
                          ? "border-primary/40 bg-[var(--tint-blue)] ring-1 ring-inset ring-primary/20"
                          : "border-border bg-card hover:border-[var(--input)]",
                      )}
                    >
                      <span className={cn("grid size-10 place-items-center rounded-xl", selected ? "bg-primary text-white" : "bg-accent text-primary")}>
                        <Icon name={option.icon} size={18} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-[15px] font-semibold">{option.label}</span>
                        <span className="block text-[12px] text-muted-foreground">{option.description}</span>
                      </span>
                      {selected && <Icon name="check" size={18} className="text-primary" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" {...anim} transition={spring} className="space-y-5">
              <div>
                <p className="mb-3 text-[14px] font-medium text-foreground">
                  Default match radius
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {DISTANCE_OPTIONS_KM.map((km) => {
                    const selected = radiusKm === km;
                    return (
                      <motion.button
                        key={km}
                        type="button"
                        onClick={() => setRadiusKm(km)}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        aria-pressed={selected}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                          selected
                            ? "border-primary/40 bg-[var(--tint-blue)] text-[var(--primary-strong)] ring-1 ring-inset ring-primary/20"
                            : "border-border bg-card text-foreground hover:border-[var(--input)]",
                        )}
                      >
                        <Icon name="location" size={14} /> Within {km} km
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[14px] font-medium text-foreground">Extra preferences</p>
                <motion.label
                  whileTap={reduced ? undefined : { scale: 0.99 }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors",
                    studentDiscount
                      ? "border-primary/40 bg-[var(--tint-blue)] ring-1 ring-inset ring-primary/20"
                      : "border-border bg-card hover:border-[var(--input)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md border transition-colors",
                      studentDiscount ? "border-primary bg-primary text-white" : "border-input bg-card",
                    )}
                  >
                    {studentDiscount && <Icon name="check" size={14} />}
                  </span>
                  <span className="flex flex-1 items-center gap-2 text-[15px] font-medium">
                    <Icon name="education" size={17} className="text-primary" />
                    I'm a student — prioritise student discounts
                  </span>
                  <input
                    type="checkbox"
                    checked={studentDiscount}
                    onChange={(e) => setStudentDiscount(e.target.checked)}
                    className="sr-only"
                  />
                </motion.label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={() => { setStep((s) => s - 1); setError(""); }}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <Button variant="brand" iconRight={<Icon name="arrow" size={16} />} onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button variant="brand" iconRight={<Icon name="arrow" size={16} />} onClick={handleFinish} disabled={submitting}>
            {submitting ? "Saving…" : "Get started"}
          </Button>
        )}
      </div>
    </AuthShell>
  );
}
