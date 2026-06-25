import { useEffect, useState } from "react";
import type { NeedType } from "../../models";
import { budgetPresetsFor } from "../../data/catalog";
import { chipClass } from "./chip";

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
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Budget">
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          aria-pressed={isPresetSelected(preset)}
          className={chipClass(isPresetSelected(preset))}
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
        className={chipClass(custom)}
        onClick={() => {
          setCustom(true);
          applyCustom(customValue);
        }}
      >
        Custom
      </button>

      {custom && (
        <label className="inline-flex h-10 items-center gap-1.5 rounded-full border border-input bg-card pr-1.5 pl-3.5 text-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <span className="text-muted-foreground">Up to $</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            className="w-16 bg-transparent text-foreground outline-none"
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
