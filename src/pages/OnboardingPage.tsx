import { useState, type FormEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { BrandLockup } from "@/components/layout/LatticeMark";
import { AuthError, AuthShell } from "./authShared";
import { ALL_CATEGORIES, CATEGORY_META, DEMO_ORIGINS } from "../data/catalog";
import type { BusinessCategory } from "../models";
import { cn } from "@/lib/utils";

const STEPS = ["Your interests", "Your location", "Preferences"];

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };
const slideUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export function OnboardingPage() {
  const { activeUser, completeOnboarding } = useApp();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [locationId, setLocationId] = useState(activeUser?.homeLocationId ?? "origin_school");
  const [studentDiscount, setStudentDiscount] = useState(false);
  const [error, setError] = useState("");

  const toggleCategory = (cat: BusinessCategory) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return categories.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) {
      setError("Please select at least one category.");
      return;
    }
    setError("");
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleFinish = (e: FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      setError("Please select at least one category.");
      return;
    }
    completeOnboarding({
      name: activeUser.name,
      homeLocationId: locationId,
      preferences: {
        ...activeUser.preferences,
        preferredCategories: categories,
        studentDiscountPreferred: studentDiscount,
      },
    });
    navigate("/home");
  };

  const anim = reduced ? {} : slideUp;

  return (
    <AuthShell wide>
      <div className="flex items-center gap-3">
        <BrandLockup size={38} />
      </div>
      <h1 className="mt-5 font-display text-[26px] font-semibold tracking-[-0.035em]">
        Welcome to <span className="font-accent font-normal text-primary">Lattice</span>
      </h1>
      <p className="mt-1 text-[14px] text-muted-foreground">
        {activeUser.name}, let's tune Lattice to what you need.
      </p>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
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
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-5">
          <AuthError message={error} />
        </div>
      )}

      <div className="mt-5 min-h-[230px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step-0" {...anim} transition={spring}>
              <p className="mb-3 text-[14px] text-muted-foreground">
                Pick the kinds of businesses you're most interested in.
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
              <p className="mb-3 text-[14px] text-muted-foreground">Where are you usually searching from?</p>
              <div className="space-y-2.5">
                {DEMO_ORIGINS.map((origin) => {
                  const selected = locationId === origin.id;
                  return (
                    <motion.button
                      key={origin.id}
                      type="button"
                      onClick={() => setLocationId(origin.id)}
                      whileTap={reduced ? undefined : { scale: 0.99 }}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                        selected
                          ? "border-primary/40 bg-[var(--tint-blue)] ring-1 ring-inset ring-primary/20"
                          : "border-border bg-card hover:border-[var(--input)]",
                      )}
                    >
                      <span className={cn("grid size-10 place-items-center rounded-xl", selected ? "bg-primary text-white" : "bg-accent text-primary")}>
                        <Icon name="location" size={18} />
                      </span>
                      <span className="flex-1 text-[15px] font-semibold">{origin.name}</span>
                      {selected && <Icon name="check" size={18} className="text-primary" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" {...anim} transition={spring}>
              <p className="mb-3 text-[14px] text-muted-foreground">Any extra preferences? You can change these anytime.</p>
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
                <span className="flex items-center gap-2 text-[15px] font-medium">
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
          <Button variant="brand" iconRight={<Icon name="arrow" size={16} />} onClick={handleFinish}>
            Get started
          </Button>
        )}
      </div>
    </AuthShell>
  );
}
