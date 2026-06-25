import { useState } from "react";
import { TIME_WINDOW_PRESETS } from "../../data/catalog";
import {
  customTimeWindow,
  timeWindowForPreset,
  type TimeWindowPresetId,
} from "../../utils/timeWindows";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { chipClass } from "./chip";

export type TimeWindowValue = {
  presetId?: TimeWindowPresetId;
  timeStart: string;
  timeEnd: string;
};

type Props = {
  value: TimeWindowValue;
  onChange: (value: TimeWindowValue) => void;
};

/**
 * Field 5: time-window presets with a custom date/time fallback. Presets are
 * resolved to concrete ISO windows so downstream validation and matching can
 * treat every choice uniformly.
 */
export function TimeWindowSelector({ value, onChange }: Props) {
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const choosePreset = (presetId: TimeWindowPresetId) => {
    if (presetId === "custom") {
      const window = customTimeWindow(date, start, end);
      onChange({ presetId, ...window });
      return;
    }
    const window = timeWindowForPreset(presetId) ?? { timeStart: "", timeEnd: "" };
    onChange({ presetId, ...window });
  };

  const updateCustom = (next: { date?: string; start?: string; end?: string }) => {
    const d = next.date ?? date;
    const s = next.start ?? start;
    const e = next.end ?? end;
    if (next.date !== undefined) setDate(next.date);
    if (next.start !== undefined) setStart(next.start);
    if (next.end !== undefined) setEnd(next.end);
    onChange({ presetId: "custom", ...customTimeWindow(d, s, e) });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Time window">
        {TIME_WINDOW_PRESETS.map((preset) => {
          const selected = value.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={chipClass(selected)}
              onClick={() => choosePreset(preset.id)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {value.presetId === "custom" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => updateCustom({ date: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Start</Label>
            <Input
              type="time"
              value={start}
              onChange={(e) => updateCustom({ start: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>End</Label>
            <Input
              type="time"
              value={end}
              onChange={(e) => updateCustom({ end: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
