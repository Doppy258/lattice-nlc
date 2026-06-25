import { Icon } from "../common/Icon";
import { DISTANCE_OPTIONS_KM } from "../../data/catalog";
import { chipClass } from "./chip";

type Props = {
  value?: number;
  onChange: (km: number) => void;
  originName: string;
};

/** Field 4: distance radius chips, anchored to the seeded demo origin. */
export function DistanceSelector({ value, onChange, originName }: Props) {
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Distance">
        {DISTANCE_OPTIONS_KM.map((km) => {
          const selected = value === km;
          return (
            <button
              key={km}
              type="button"
              role="radio"
              aria-checked={selected}
              className={chipClass(selected)}
              onClick={() => onChange(km)}
            >
              Within {km} km
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="location" size={13} /> Measured from {originName}
      </p>
    </div>
  );
}
