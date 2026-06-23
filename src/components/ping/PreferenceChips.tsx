import type { BusinessCategory } from "../../models";
import { PREFERENCE_OPTIONS } from "../../data/catalog";

type Props = {
  category: BusinessCategory;
  selected: string[];
  onChange: (preferences: string[]) => void;
};

/** Field 6: optional preference toggle chips, filtered to the chosen category. */
export function PreferenceChips({ category, selected, onChange }: Props) {
  const options = PREFERENCE_OPTIONS.filter(
    (option) => !option.categories || option.categories.includes(category)
  );

  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]
    );
  };

  return (
    <div className="chip-select" role="group" aria-label="Preferences">
      {options.map((option) => {
        const on = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            className={`chip ${on ? "chip--on" : ""}`}
            onClick={() => toggle(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
