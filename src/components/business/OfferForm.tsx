import { useMemo, useState } from "react";
import type { Offer, OfferType } from "../../models";
import { validateOfferInput, type OfferInput } from "../../services/offerService";
import { ALL_OFFER_TYPES, OFFER_TYPE_LABELS } from "../../data/catalog";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { FormField } from "../common/FormField";

type Props = {
  /** Supplied in edit mode to seed the fields. */
  initial?: Offer;
  onSubmit: (input: OfferInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

/** Local form state mirrors OfferInput but keeps numeric fields as strings. */
type FormState = {
  title: string;
  description: string;
  offerType: OfferType;
  price: string;
  originalPrice: string;
  validFrom: string;
  validUntil: string;
  maxClaims: string;
  tags: string;
  studentOnly: boolean;
  verificationRequired: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** ISO → "YYYY-MM-DDTHH:mm" in local time for <input type="datetime-local">. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function defaultWindow(): { from: string; until: string } {
  const from = new Date();
  const until = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from: toLocalInput(from.toISOString()), until: toLocalInput(until.toISOString()) };
}

function initialState(offer?: Offer): FormState {
  const win = defaultWindow();
  return {
    title: offer?.title ?? "",
    description: offer?.description ?? "",
    offerType: offer?.offerType ?? "discount",
    price: offer ? String(offer.price) : "",
    originalPrice: offer?.originalPrice !== undefined ? String(offer.originalPrice) : "",
    validFrom: offer ? toLocalInput(offer.validFrom) : win.from,
    validUntil: offer ? toLocalInput(offer.validUntil) : win.until,
    maxClaims: offer ? String(offer.maxClaims) : "25",
    tags: offer ? offer.tags.join(", ") : "",
    studentOnly: offer?.studentOnly ?? false,
    verificationRequired: offer?.verificationRequired ?? false,
  };
}

function toInput(form: FormState): OfferInput {
  const originalPrice = form.originalPrice.trim() === "" ? undefined : Number(form.originalPrice);
  return {
    title: form.title,
    description: form.description,
    offerType: form.offerType,
    price: Number(form.price),
    originalPrice,
    validFrom: fromLocalInput(form.validFrom),
    validUntil: fromLocalInput(form.validUntil),
    maxClaims: Number(form.maxClaims),
    tags: form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    studentOnly: form.studentOnly,
    verificationRequired: form.verificationRequired,
  };
}

export function OfferForm({ initial, onSubmit, onCancel, submitLabel = "Publish offer" }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const input = useMemo(() => toInput(form), [form]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateOfferInput(input);
    if (!validation.valid) {
      setErrors(Object.fromEntries(validation.errors.map((x) => [x.field, x.message])));
      return;
    }
    setErrors({});
    onSubmit(input);
  };

  const err = (field: string) => errors[field];

  return (
    <form className="offer-form" onSubmit={submit} noValidate>
      <FormField
        label="Offer title"
        id="offer-title"
        value={form.title}
        maxLength={80}
        placeholder="e.g. Student lunch bowl - 20% off"
        onChange={(e) => set("title", e.target.value)}
        error={err("title")}
      />

      <FormField label="Description" id="offer-desc" error={err("description")}>
        <textarea
          id="offer-desc"
          className="text-input text-area"
          value={form.description}
          maxLength={240}
          placeholder="What's included and any conditions customers should know."
          onChange={(e) => set("description", e.target.value)}
        />
      </FormField>

      <div className="offer-form__grid">
        <FormField label="Offer type" id="offer-type">
          <select
            id="offer-type"
            className="select-input"
            value={form.offerType}
            onChange={(e) => set("offerType", e.target.value as OfferType)}
          >
            {ALL_OFFER_TYPES.map((t) => (
              <option key={t} value={t}>
                {OFFER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Max claims"
          id="offer-max"
          type="number"
          min={1}
          value={form.maxClaims}
          onChange={(e) => set("maxClaims", e.target.value)}
          error={err("maxClaims")}
        />

        <FormField
          label="Offer price ($)"
          id="offer-price"
          type="number"
          min={0}
          step="0.01"
          value={form.price}
          placeholder="0 for free"
          onChange={(e) => set("price", e.target.value)}
          error={err("price")}
        />

        <FormField
          label="Original price ($)"
          id="offer-original"
          type="number"
          min={0}
          step="0.01"
          value={form.originalPrice}
          placeholder="Optional"
          onChange={(e) => set("originalPrice", e.target.value)}
          error={err("originalPrice")}
        />

        <FormField
          label="Valid from"
          id="offer-from"
          type="datetime-local"
          value={form.validFrom}
          onChange={(e) => set("validFrom", e.target.value)}
        />

        <FormField
          label="Valid until"
          id="offer-until"
          type="datetime-local"
          value={form.validUntil}
          onChange={(e) => set("validUntil", e.target.value)}
          error={err("validUntil")}
        />
      </div>

      <FormField
        label="Tags"
        id="offer-tags"
        value={form.tags}
        placeholder="Comma-separated, e.g. vegetarian, quick, student"
        onChange={(e) => set("tags", e.target.value)}
      />

      <div className="offer-form__toggles">
        <label className="verify__check">
          <input
            type="checkbox"
            checked={form.studentOnly}
            onChange={(e) => set("studentOnly", e.target.checked)}
          />
          <span>Student-only offer</span>
        </label>
        <label className="verify__check">
          <input
            type="checkbox"
            checked={form.verificationRequired}
            onChange={(e) => set("verificationRequired", e.target.checked)}
          />
          <span>Require ID/verification at redemption</span>
        </label>
      </div>

      <div className="offer-form__actions">
        <Button type="submit" iconLeft={<Icon name="check" size={16} />}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
