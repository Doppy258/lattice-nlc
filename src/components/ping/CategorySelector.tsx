import type { BusinessCategory } from "../../models";
import { Icon, type IconName } from "../common/Icon";
import { ALL_CATEGORIES, CATEGORY_META } from "../../data/catalog";

type Props = {
  value?: BusinessCategory;
  onChange: (category: BusinessCategory) => void;
};

/** Field 1: large selectable cards for the seven top-level categories. */
export function CategorySelector({ value, onChange }: Props) {
  return (
    <div className="select-grid" role="radiogroup" aria-label="Category">
      {ALL_CATEGORIES.map((category) => {
        const meta = CATEGORY_META[category];
        const selected = value === category;
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`select-card ${selected ? "select-card--on" : ""}`}
            onClick={() => onChange(category)}
          >
            <span className="select-card__icon">
              <Icon name={meta.icon as IconName} size={20} />
            </span>
            <span className="select-card__label">{meta.label}</span>
            <span className="select-card__desc">{meta.description}</span>
          </button>
        );
      })}
    </div>
  );
}
