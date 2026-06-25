import { motion } from "motion/react";
import type { BusinessCategory } from "../../models";
import { Icon, type IconName } from "../common/Icon";
import { ALL_CATEGORIES, CATEGORY_META } from "../../data/catalog";
import { cn } from "@/lib/utils";

type Props = {
  value?: BusinessCategory;
  onChange: (category: BusinessCategory) => void;
};

/** Field 1: large selectable cards for the seven top-level categories. */
export function CategorySelector({ value, onChange }: Props) {
  return (
    <div
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
      role="radiogroup"
      aria-label="Category"
    >
      {ALL_CATEGORIES.map((category) => {
        const meta = CATEGORY_META[category];
        const selected = value === category;
        return (
          <motion.button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(category)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40",
              selected
                ? "border-primary bg-brand-tint"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-xl transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-brand-tint text-primary",
              )}
            >
              <Icon name={meta.icon as IconName} size={20} />
            </span>
            <span className="text-sm font-bold text-foreground">
              {meta.label}
            </span>
            <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {meta.description}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
