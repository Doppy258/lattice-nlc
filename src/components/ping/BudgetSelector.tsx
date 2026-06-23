import { useEffect, useState } from "react";
import type { NeedType } from "../../models";
import { budgetPresetsFor } from "../../data/catalog";

type Budget = { budgetMin?: number; budgetMax?: number };

type Props = {
  needType: NeedType;
  budgetMin?: number;
  budgetMax?: number;
  onChange: (budget: Budget) => void;
};

/** Field 3: need-type-aware budget chips, plus a custom-amount input. */
export function BudgetSelector({ needType, budgetMin, budgetMax, onChange }: Props) {
  const presets = budgetPresetsFor(needType);
  const [custom, setCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // Reset to preset mode whenever the need type (and thus the presets) changes.
  useEffect(() => {
    setCustom(false);
    setCustomValue("");
  }, [needType]);

  const isPresetSelected = (p: { min?: number; max?: number }): boolean =>
    !custom && p.min === budgetMin && p.max === budgetMax;

  const applyCustom = (raw: string) => {
    setCustomValue(raw);
    const value = Number(raw);
    onChange({
      budgetMin: undefined,
      budgetMax: raw === "" || Number.isNaN(value) ? undefined : value,
    });
  };

  return (
    <div className="chip-select" role="group" aria-label="Budget">
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          aria-pressed={isPresetSelected(preset)}
          className={`chip ${isPresetSelected(preset) ? "chip--on" : ""}`}
          onClick={() => {
            setCustom(false);
            onChange({ budgetMin: preset.min, budgetMax: preset.max });
          }}
        >
          {preset.label}
        </button>
      ))}
      <button
        type="button"
        aria-pressed={custom}
        className={`chip ${custom ? "chip--on" : ""}`}
        onClick={() => {
          setCustom(true);
          applyCustom(customValue);
        }}
      >
        Custom
      </button>

      {custom && (
        <label className="budget-custom">
          <span className="budget-custom__prefix">Up to $</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            className="budget-custom__input"
            value={customValue}
            placeholder="20"
            onChange={(e) => applyCustom(e.target.value)}
            aria-label="Custom maximum budget"
          />
        </label>
      )}
    </div>
  );
}
