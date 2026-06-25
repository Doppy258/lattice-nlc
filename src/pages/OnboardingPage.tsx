import { useState, type FormEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { ALL_CATEGORIES, CATEGORY_META, DEMO_ORIGINS } from "../data/catalog";
import type { BusinessCategory } from "../models";

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

  const anim = (reduced ? {} : slideUp);

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-card__hero">
          <div className="onboarding-card__brand">
            <div className="onboarding-card__logo">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="24" height="24" rx="8" fill="white" />
                <path d="M8 14h12M14 8v12" stroke="#0066cc" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="onboarding-card__title">Welcome to Lattice</h1>
              <p className="onboarding-card__subtitle">
                {activeUser.name}, let's get you set up
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="onboarding-steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`onboarding-step ${i === step ? "onboarding-step--active" : ""} ${i < step ? "onboarding-step--done" : ""}`}
            >
              <span className="onboarding-step__dot">
                {i < step ? <Icon name="check" size={12} /> : i + 1}
              </span>
              <span className="onboarding-step__label">{label}</span>
              {i < STEPS.length - 1 && <span className="onboarding-step__connector" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: "var(--space-4)" }}>
            <Icon name="alert" size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 0: Categories */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step-0" {...anim} transition={spring}>
              <p className="onboarding-card__hint">Pick the types of businesses you're most interested in.</p>
              <div className="onboarding-categories">
                {ALL_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const selected = categories.includes(cat);
                  return (
                    <motion.button
                      key={cat}
                      className={`onboarding-cat ${selected ? "onboarding-cat--on" : ""}`}
                      onClick={() => toggleCategory(cat)}
                      type="button"
                      whileTap={reduced ? undefined : { scale: 0.97 }}
                      layout
                    >
                      <span className="onboarding-cat__icon">
                        <Icon name={meta.icon as any} size={20} />
                      </span>
                      <span className="onboarding-cat__label">{meta.label}</span>
                      <span className="onboarding-cat__desc">{meta.description}</span>
                      {selected && (
                        <motion.span
                          className="onboarding-cat__check"
                          initial={reduced ? false : { scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 14 }}
                        >
                          <Icon name="check" size={14} />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <motion.div key="step-1" {...anim} transition={spring}>
              <p className="onboarding-card__hint">Where are you usually looking from?</p>
              <div className="onboarding-locations">
                {DEMO_ORIGINS.map((origin) => (
                  <motion.button
                    key={origin.id}
                    className={`onboarding-loc ${locationId === origin.id ? "onboarding-loc--on" : ""}`}
                    onClick={() => setLocationId(origin.id)}
                    type="button"
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                  >
                    <span className="onboarding-loc__icon">
                      <Icon name="location" size={18} />
                    </span>
                    <span className="onboarding-loc__name">{origin.name}</span>
                    {locationId === origin.id && (
                      <motion.span
                        className="onboarding-loc__check"
                        initial={reduced ? false : { scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 14 }}
                      >
                        <Icon name="check" size={14} />
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <motion.div key="step-2" {...anim} transition={spring}>
              <p className="onboarding-card__hint">Any extra preferences? You can always change these later.</p>
              <div className="onboarding-prefs">
                <motion.label
                  className={`onboarding-pref ${studentDiscount ? "onboarding-pref--on" : ""}`}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                >
                  <div className="onboarding-pref__row">
                    <span className="onboarding-pref__box">
                      {studentDiscount && (
                        <motion.span
                          className="onboarding-pref__check"
                          initial={reduced ? false : { scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 14 }}
                        >
                          <Icon name="check" size={12} />
                        </motion.span>
                      )}
                    </span>
                    <span className="onboarding-pref__label">I'm a student — show me student discounts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={studentDiscount}
                    onChange={(e) => setStudentDiscount(e.target.checked)}
                    style={{ display: "none" }}
                  />
                </motion.label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="onboarding-actions">
          {step > 0 && (
            <Button variant="ghost" onClick={() => { setStep((s) => s - 1); setError(""); }}>
              Back
            </Button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleFinish}>
              Get started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
