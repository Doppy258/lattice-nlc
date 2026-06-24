import type { RequestQuality } from "../../services/requestValidationService";
import { Badge } from "../common/Badge";

type Props = {
  categoryLabel?: string;
  needLabel?: string;
  budgetLabel: string;
  distanceLabel?: string;
  timeLabel?: string;
  preferenceLabels: string[];
  note?: string;
  /** Live OfferRank estimate, or null when the draft isn't matchable yet. */
  estimatedMatches: number | null;
  quality: RequestQuality;
};

const QUALITY_META: Record<RequestQuality, { label: string; tone: "success" | "warning" | "error" }> = {
  strong: { label: "Strong", tone: "success" },
  weak: { label: "Weak", tone: "warning" },
  invalid: { label: "Incomplete", tone: "error" },
};

/** A blank acts as a fill-in-the-blank slot in the live sentence. */
function Slot({ text, placeholder }: { text?: string; placeholder: string }) {
  return <span className={`ping-slot ${text ? "ping-slot--filled" : ""}`}>{text ?? placeholder}</span>;
}

/** Right-column live preview: the sentence, structured summary, and quality. */
export function RequestPreview({
  categoryLabel,
  needLabel,
  budgetLabel,
  distanceLabel,
  timeLabel,
  preferenceLabels,
  note,
  estimatedMatches,
  quality,
}: Props) {
  const q = QUALITY_META[quality];
  return (
    <div className="preview-card">
      <span className="eyebrow">
        <span className="eyebrow__dot" />
        Your request
      </span>

      <p className="ping-sentence">
        I need <Slot text={needLabel} placeholder="something" /> in{" "}
        <Slot text={categoryLabel} placeholder="a category" /> within{" "}
        <Slot text={distanceLabel} placeholder="a distance" /> around{" "}
        <Slot text={timeLabel} placeholder="a time" /> for{" "}
        <Slot text={budgetLabel} placeholder="a budget" />.
      </p>

      <dl className="preview-list">
        <div>
          <dt>Need</dt>
          <dd>{needLabel ?? "Not set"}</dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>{budgetLabel}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{distanceLabel ?? "Not set"}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{timeLabel ?? "Not set"}</dd>
        </div>
      </dl>

      {preferenceLabels.length > 0 && (
        <div className="chip-row preview-card__prefs">
          {preferenceLabels.map((label) => (
            <Badge key={label} tone="accent">
              {label}
            </Badge>
          ))}
        </div>
      )}

      {note && <p className="preview-card__note">“{note}”</p>}

      <div className="preview-card__footer">
        <div>
          <span className="preview-card__metric-label">Estimated matches</span>
          <span className="preview-card__metric mono">
            {estimatedMatches ?? "Not set"}
          </span>
        </div>
        <div className="preview-card__quality">
          <span className="preview-card__metric-label">Request quality</span>
          <Badge tone={q.tone}>{q.label}</Badge>
        </div>
      </div>
    </div>
  );
}
