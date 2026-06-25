import { useState, type FormEvent } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { ALL_CATEGORIES, CATEGORY_META, DEMO_ORIGINS } from "../data/catalog";
import type { BusinessCategory } from "../models";

const STEPS = ["Your name", "Your interests", "Your location", "Preferences"];

export function OnboardingPage() {
  const { activeUser, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(activeUser?.name ?? "");
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
      case 0: return name.trim().length > 0;
      case 1: return categories.length > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) {
      setError(step === 0 ? "Please enter your name." : "Please select at least one category.");
      return;
    }
    setError("");
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleFinish = (e: FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      setError("Please select at least one category.");
      return;
    }
    completeOnboarding({
      name: name.trim(),
      homeLocationId: locationId,
      preferences: {
        ...activeUser.preferences,
        preferredCategories: categories,
        studentDiscountPreferred: studentDiscount,
      },
    });
    navigate("/home");
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__brand">
          <div className="auth-card__logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="24" height="24" rx="8" fill="#0066cc" />
              <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="auth-card__title">Welcome to Lattice</h1>
          <p className="auth-card__subtitle">
            Let's get you set up — step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Steps indicator */}
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
            </div>
          ))}
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: "var(--space-4)" }}>
            <Icon name="alert" size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="field">
            <label className="field__label" htmlFor="onb-name">What should we call you?</label>
            <input
              id="onb-name"
              className="text-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Step 1: Categories */}
        {step === 1 && (
          <div>
            <p className="auth-card__hint">Pick the types of businesses you're most interested in.</p>
            <div className="onboarding-categories">
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const selected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    className={`select-card ${selected ? "select-card--on" : ""}`}
                    onClick={() => toggleCategory(cat)}
                    type="button"
                  >
                    <span className="select-card__icon">
                      <Icon name={meta.icon as any} size={18} />
                    </span>
                    <span className="select-card__label">{meta.label}</span>
                    <span className="select-card__desc">{meta.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <p className="auth-card__hint">Where are you usually looking from?</p>
            <div className="chip-select" style={{ marginTop: "var(--space-3)" }}>
              {DEMO_ORIGINS.map((origin) => (
                <button
                  key={origin.id}
                  className={`chip ${locationId === origin.id ? "chip--on" : ""}`}
                  onClick={() => setLocationId(origin.id)}
                  type="button"
                >
                  {origin.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div>
            <p className="auth-card__hint">Any extra preferences? You can always change these later.</p>
            <label className="onboarding-toggle" style={{ marginTop: "var(--space-3)" }}>
              <input
                type="checkbox"
                checked={studentDiscount}
                onChange={(e) => setStudentDiscount(e.target.checked)}
              />
              <span>I'm a student — show me student discounts</span>
            </label>
          </div>
        )}

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
