import { useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import { useHashRoute, navigate } from "@/app/navigation";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { FormField } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { Icon } from "@/components/common/Icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { OfferCard } from "@/components/domain/OfferCard";
import {
  createOffer,
  updateOffer,
  validateOfferInput,
  getOwnerOffers,
  type OfferInput,
} from "@/services/offerService";
import { ALL_OFFER_TYPES, OFFER_TYPE_LABELS } from "@/data/catalog";
import type { Offer, OfferType } from "@/models";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DESC_MAX = 240;
const TITLE_MAX = 80;
const GENERIC_TAGS = ["student-friendly", "fast", "popular", "limited"];

/** Date -> "YYYY-MM-DDTHH:MM" in local wall-clock time for <input type="datetime-local">. */
function toLocalInputValue(date: Date): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

/** datetime-local string -> ISO (UTC); "" when empty/unparseable so validation can flag it. */
function localToIso(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function CreateOfferPage() {
  const { data, activeBusiness, setData } = useApp();
  const { query } = useHashRoute();
  const editId = query.get("id");

  const existing = useMemo(
    () =>
      editId && activeBusiness
        ? getOwnerOffers(activeBusiness.id, data.offers).find((o) => o.id === editId)
        : undefined,
    [editId, activeBusiness, data.offers],
  );

  const [title, setTitle] = useState(() => existing?.title ?? "");
  const [description, setDescription] = useState(() => existing?.description ?? "");
  const [offerType, setOfferType] = useState<OfferType>(() => existing?.offerType ?? "discount");
  const [price, setPrice] = useState<number>(() => existing?.price ?? 0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(
    () => existing?.originalPrice,
  );
  const [validFrom, setValidFrom] = useState(() =>
    toLocalInputValue(existing ? new Date(existing.validFrom) : new Date()),
  );
  const [validUntil, setValidUntil] = useState(() =>
    toLocalInputValue(existing ? new Date(existing.validUntil) : new Date(Date.now() + WEEK_MS)),
  );
  const [maxClaims, setMaxClaims] = useState<number>(() => existing?.maxClaims ?? 25);
  const [tags, setTags] = useState<string[]>(() => existing?.tags ?? []);
  const [studentOnly, setStudentOnly] = useState<boolean>(() => existing?.studentOnly ?? false);
  const [verificationRequired, setVerificationRequired] = useState<boolean>(
    () => existing?.verificationRequired ?? false,
  );
  const [oneTimePerUser, setOneTimePerUser] = useState<boolean>(() => existing?.oneTimePerUser ?? true);
  const [redemptionWindowMinutes, setRedemptionWindowMinutes] = useState<number>(
    () => existing?.redemptionWindowMinutes ?? 5,
  );

  const input: OfferInput = useMemo(
    () => ({
      title,
      description,
      offerType,
      price,
      originalPrice,
      validFrom: localToIso(validFrom),
      validUntil: localToIso(validUntil),
      maxClaims,
      tags,
      studentOnly,
      verificationRequired,
      oneTimePerUser,
      redemptionWindowMinutes,
    }),
    [
      title,
      description,
      offerType,
      price,
      originalPrice,
      validFrom,
      validUntil,
      maxClaims,
      tags,
      studentOnly,
      verificationRequired,
      oneTimePerUser,
      redemptionWindowMinutes,
    ],
  );

  const validation = useMemo(() => validateOfferInput(input), [input]);
  const errors = useMemo(
    () =>
      Object.fromEntries(validation.errors.map((e) => [e.field, e.message])) as Record<string, string>,
    [validation],
  );

  const suggestedTags = useMemo(
    () =>
      Array.from(
        new Set([...(activeBusiness?.tags ?? []), ...GENERIC_TAGS, ...(existing?.tags ?? [])]),
      ),
    [activeBusiness, existing],
  );

  if (!activeBusiness) {
    return (
      <EmptyState
        icon="store"
        title="No business selected"
        body="This is the business workspace. Create your storefront in onboarding, or sign in with a business account to manage your offers."
        action={
          <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/home")}>
            Back to Home
          </Button>
        }
      />
    );
  }

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const previewOffer: Offer = {
    id: editId ?? "preview",
    businessId: activeBusiness.id,
    category: activeBusiness.category,
    currentClaims: 0,
    views: 0,
    active: true,
    createdAt: new Date().toISOString(),
    ...input,
  };

  function handleSubmit() {
    if (!validation.valid || !activeBusiness) return;
    if (editId) {
      setData((d) => ({ ...d, offers: updateOffer(editId, input, d.offers) }));
      toast.success("Offer updated");
      navigate("/offers");
      return;
    }
    const res = createOffer(input, activeBusiness.id, activeBusiness.category);
    if (res.ok) {
      setData((d) => ({ ...d, offers: [...d.offers, res.offer] }));
      toast.success("Offer published");
      navigate("/offers");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editId ? "Edit" : "Create an"}
        accent="offer"
        subtitle={`This offer inherits the ${activeBusiness.category} category from ${activeBusiness.name}, so it always matches your storefront.`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Composer */}
        <Card variant="solid" className="space-y-5 p-5 sm:p-6">
          <FormField label="Offer title" htmlFor="offer-title" required error={errors.title}>
            <Input
              id="offer-title"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Half-price study-session lunch bowl"
              aria-invalid={!!errors.title}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="offer-description"
            required
            error={errors.description}
            hint={`${description.length}/${DESC_MAX} characters`}
          >
            <Textarea
              id="offer-description"
              value={description}
              maxLength={DESC_MAX}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's included, who it's for, and any conditions students should know."
              aria-invalid={!!errors.description}
            />
          </FormField>

          <FormField label="Offer type" htmlFor="offer-type">
            <Select
              id="offer-type"
              value={offerType}
              onChange={(e) => setOfferType(e.target.value as OfferType)}
            >
              {ALL_OFFER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {OFFER_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Price" htmlFor="offer-price" required error={errors.price}>
              <Input
                id="offer-price"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                placeholder="0.00"
                value={price === 0 ? "" : price}
                onChange={(e) => setPrice(e.target.value === "" ? 0 : Number(e.target.value))}
                aria-invalid={!!errors.price}
              />
            </FormField>
            <FormField
              label="Original price"
              htmlFor="offer-original-price"
              error={errors.originalPrice}
              hint="Optional — shown struck-through to highlight savings."
            >
              <Input
                id="offer-original-price"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={originalPrice ?? ""}
                onChange={(e) =>
                  setOriginalPrice(e.target.value === "" ? undefined : Number(e.target.value))
                }
                aria-invalid={!!errors.originalPrice}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Starts" htmlFor="offer-valid-from">
              <Input
                id="offer-valid-from"
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </FormField>
            <FormField label="Ends" htmlFor="offer-valid-until" required error={errors.validUntil}>
              <Input
                id="offer-valid-until"
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                aria-invalid={!!errors.validUntil}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Total redemption limit"
              htmlFor="offer-max-claims"
              required
              error={errors.maxClaims}
              hint="How many redemptions before the offer is full."
            >
              <Input
                id="offer-max-claims"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={maxClaims}
                onChange={(e) => setMaxClaims(Number(e.target.value))}
                aria-invalid={!!errors.maxClaims}
              />
            </FormField>
            <FormField
              label="Redemption window (min)"
              htmlFor="offer-window"
              hint="How long a customer's pass stays valid after claiming."
            >
              <Input
                id="offer-window"
                type="number"
                min={1}
                max={120}
                step={1}
                inputMode="numeric"
                value={redemptionWindowMinutes}
                onChange={(e) => setRedemptionWindowMinutes(Math.max(1, Number(e.target.value)))}
              />
            </FormField>
          </div>

          <FormField label="Tags" hint="Tap to add tags that help nearby students find this offer.">
            <ChipGroup>
              {suggestedTags.map((t) => (
                <ToggleChip key={t} type="button" active={tags.includes(t)} onClick={() => toggleTag(t)}>
                  {t}
                </ToggleChip>
              ))}
            </ChipGroup>
          </FormField>

          <FormField label="Options">
            <ChipGroup>
              <ToggleChip
                type="button"
                active={oneTimePerUser}
                icon={<Icon name="check" size={14} />}
                onClick={() => setOneTimePerUser((v) => !v)}
              >
                One-time per customer
              </ToggleChip>
              <ToggleChip
                type="button"
                active={studentOnly}
                icon={<Icon name="education" size={14} />}
                onClick={() => setStudentOnly((v) => !v)}
              >
                Students only
              </ToggleChip>
              <ToggleChip
                type="button"
                active={verificationRequired}
                icon={<Icon name="check" size={14} />}
                onClick={() => setVerificationRequired((v) => !v)}
              >
                Requires verification
              </ToggleChip>
            </ChipGroup>
          </FormField>

          <div className="space-y-2 pt-1">
            <Button
              variant="brand"
              size="lg"
              block
              disabled={!validation.valid}
              onClick={handleSubmit}
              iconLeft={<Icon name={editId ? "check" : "plus"} size={18} />}
            >
              {editId ? "Save changes" : "Publish offer"}
            </Button>
            {!validation.valid && (
              <p className="text-center text-[12px] text-muted-foreground">
                Complete the required fields to {editId ? "save" : "publish"}.
              </p>
            )}
          </div>
        </Card>

        {/* Live preview */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-semibold tracking-[-0.02em]">
                Live <span className="font-accent font-normal text-primary">preview</span>
              </h2>
              <Badge tone={validation.valid ? "success" : "warning"}>
                {validation.valid ? "Ready to publish" : `${validation.errors.length} to fix`}
              </Badge>
            </div>
            <OfferCard offer={previewOffer} business={activeBusiness} />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              This is exactly how your offer appears to students in their matches. Claim and save
              actions are inactive in this preview.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
