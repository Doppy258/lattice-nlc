import type { BusinessCategory, NeedType } from "../../models";
import { NEED_TYPES_BY_CATEGORY, NEED_TYPE_LABELS } from "../../data/catalog";
import { chipClass } from "./chip";

type Props = {
  category: BusinessCategory;
  value?: NeedType;
  onChange: (needType: NeedType) => void;
};

/** Field 2: category-scoped need-type chips (options depend on the category). */
export function NeedTypeSelector({ category, value, onChange }: Props) {
  const options = NEED_TYPES_BY_CATEGORY[category];
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Need type">
      {options.map((needType) => {
        const selected = value === needType;
        return (
          <button
            key={needType}
            type="button"
            role="radio"
            aria-checked={selected}
            className={chipClass(selected)}
            onClick={() => onChange(needType)}
          >
            {NEED_TYPE_LABELS[needType]}
          </button>
        );
      })}
    </div>
  );
}
