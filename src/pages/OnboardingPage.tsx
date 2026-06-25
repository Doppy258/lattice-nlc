import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { ALL_CATEGORIES, CATEGORY_META, DEMO_ORIGINS } from "../data/catalog";
import type { BusinessCategory } from "../models";
import { EntryShell } from "../components/entry/EntryShell";

const STEPS = [
  {
    label: "Interests",
    title: "What are you into?",
    hint: "Pick the kinds of places you want Lattice to surface. Choose as many as you like.",
  },
  {
    label: "Location",
    title: "Where are you searching from?",
    hint: "Lattice ranks offers by distance from here. You can change it anytime.",
  },
  {
    label: "Preferences",
    title: "A few finishing touches",
    hint: "Optional — then you're all set.",
  },
];

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };
const slideUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };
const pop = { type: "spring" as const, stiffness: 220, damping: 14 };

export function OnboardingPage() {
  const { activeUser, completeOnboarding } = useApp();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [locationId, setLocationId] = useState(activeUser?.homeLocationId ?? "origin_school");
  const [studentDiscount, setStudentDiscount] = useState(false);
  const [error, setError] = useState("");

  const toggleCategory = (cat: BusinessCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return categories.length > 0;
      case 1: return true;
      case 2: return true;
      default: return false;
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

  const handleFinish = () => {
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
  const current = STEPS[step];
  const pct = ((step + 1) / STEPS.length) * 100;
  const selectedOrigin = DEMO_ORIGINS.find((o) => o.id === locationId);
  const isLast = step === STEPS.length - 1;

  return (
    <EntryShell wide>
      <div className="wiz__progress">
        <div className="wiz__progresshead">
          <span className="wiz__counter">
            Step 0{step + 1} / 0{STEPS.length}
          </span>
          <span className="wiz__steplabel">{current.label}</span>
        </div>
        <div
          className="wiz__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        >
          <div className="wiz__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <h2 className="wiz__title">{current.title}</h2>
      <p className="wiz__hint">
        {step === 0 ? `${activeUser.name}, ${current.hint.charAt(0).toLowerCase()}${current.hint.slice(1)}` : current.hint}
      </p>

      {error && (
        <div className="auth-error" style={{ marginTop: "var(--space-4)" }}>
          <Icon name="alert" size={15} />
          <span>{error}</span>
        </div>
      )}

      <div className="wiz__body">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step-0" {...anim} transition={spring}>
              <div className="wiz__cats">
                {ALL_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const selected = categories.includes(cat);
                  return (
                    <motion.button
                      key={cat}
                      type="button"
                      aria-pressed={selected}
                      className={`wiz-cat ${selected ? "wiz-cat--on" : ""}`}
                      onClick={() => toggleCategory(cat)}
                      whileTap={reduced ? undefined : { scale: 0.97 }}
                      layout
                    >
                      <span className="wiz-cat__icon">
                        <Icon name={meta.icon as never} size={20} />
                      </span>
                      <span className="wiz-cat__label">{meta.label}</span>
                      <span className="wiz-cat__desc">{meta.description}</span>
                      {selected && (
                        <motion.span
                          className="wiz-cat__check"
                          initial={reduced ? false : { scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={pop}
                        >
                          <Icon name="check" size={13} />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step-1" {...anim} transition={spring}>
              <div className="wiz__locs">
                {DEMO_ORIGINS.map((origin) => {
                  const on = locationId === origin.id;
                  return (
                    <motion.button
                      key={origin.id}
                      type="button"
                      aria-pressed={on}
                      className={`wiz-loc ${on ? "wiz-loc--on" : ""}`}
                      onClick={() => setLocationId(origin.id)}
                      whileTap={reduced ? undefined : { scale: 0.97 }}
                    >
                      <span className="wiz-loc__pin">
                        <Icon name="location" size={18} />
                      </span>
                      <span className="wiz-loc__name">{origin.name}</span>
                      {on && (
                        <motion.span
                          className="wiz-loc__check"
                          initial={reduced ? false : { scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={pop}
                        >
                          <Icon name="check" size={13} />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" {...anim} transition={spring}>
              <div className="wiz__prefs">
                <label className={`wiz-pref ${studentDiscount ? "wiz-pref--on" : ""}`}>
                  <span className="wiz-pref__text">
                    <span className="wiz-pref__label">I'm a student</span>
                    <span className="wiz-pref__desc">Surface student discounts first.</span>
                  </span>
                  <span className="wiz-switch" aria-hidden="true">
                    <span className="wiz-switch__knob" />
                  </span>
                  <input
                    type="checkbox"
                    checked={studentDiscount}
                    onChange={(e) => setStudentDiscount(e.target.checked)}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div className="wiz-summary">
                <div className="wiz-summary__title">Your setup</div>
                <div className="wiz-summary__row">
                  <span className="wiz-summary__key">Interests</span>
                  <span className="wiz-summary__val">
                    {categories.length ? (
                      categories.map((c) => (
                        <span className="wiz-chip" key={c}>
                          {CATEGORY_META[c].label}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "var(--e-faint)", fontWeight: 400 }}>None selected</span>
                    )}
                  </span>
                </div>
                <div className="wiz-summary__row">
                  <span className="wiz-summary__key">Location</span>
                  <span className="wiz-summary__val">{selectedOrigin?.name ?? "—"}</span>
                </div>
                <div className="wiz-summary__row">
                  <span className="wiz-summary__key">Student</span>
                  <span className="wiz-summary__val">
                    {studentDiscount ? "Yes — show student discounts" : "Not now"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="wiz__actions">
        {step > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setStep((s) => s - 1);
              setError("");
            }}
          >
            Back
          </Button>
        )}
        <div className="wiz__spacer" />
        {isLast ? (
          <Button className="entry__cta" onClick={handleFinish} iconRight={<Icon name="check" size={16} />}>
            Get started
          </Button>
        ) : (
          <Button className="entry__cta" onClick={handleNext} iconRight={<Icon name="arrow" size={16} />}>
            Continue
          </Button>
        )}
      </div>
    </EntryShell>
  );
}
