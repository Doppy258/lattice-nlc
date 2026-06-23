import { Icon } from "../common/Icon";
import { DISTANCE_OPTIONS_KM } from "../../data/catalog";

type Props = {
  value?: number;
  onChange: (km: number) => void;
  originName: string;
};

/** Field 4: distance radius chips, anchored to the seeded demo origin. */
export function DistanceSelector({ value, onChange, originName }: Props) {
  return (
    <div>
      <div className="chip-select" role="radiogroup" aria-label="Distance">
        {DISTANCE_OPTIONS_KM.map((km) => {
          const selected = value === km;
          return (
            <button
              key={km}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`chip ${selected ? "chip--on" : ""}`}
              onClick={() => onChange(km)}
            >
              Within {km} km
            </button>
          );
        })}
      </div>
      <p className="field__hint">
        <Icon name="location" size={13} /> Measured from {originName}
      </p>
    </div>
  );
}
