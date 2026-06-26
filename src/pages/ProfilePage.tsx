import { useRef, useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon, type IconName } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RatingStars } from "@/components/common/RatingStars";
import { FormField } from "@/components/common/FormField";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Reveal } from "@/components/motion/Reveal";
import { BusinessImage } from "@/components/domain/BusinessImage";
import { CATEGORY_META } from "@/data/catalog";
import { formatRating } from "@/utils/formatting";
import type { Business } from "@/models";
import { uploadBusinessImage, type BusinessImageKind } from "@/services/imageService";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRICE_LEVELS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
const TAG_SUGGESTIONS = [
  "Student favorite",
  "Locally owned",
  "Great value",
  "Cozy",
  "Fast service",
  "Group-friendly",
  "Vegetarian options",
  "Quiet",
];

function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hr} ${period}` : `${hr}:${String(m).padStart(2, "0")} ${period}`;
}

export function ProfilePage() {
  const { activeBusiness } = useApp();

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

  return <ProfileEditor key={activeBusiness.id} business={activeBusiness} />;
}

function ProfileEditor({ business }: { business: Business }) {
  const { setData } = useApp();
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description);
  const [address, setAddress] = useState(business.address);
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4>(business.priceLevel);
  const [tags, setTags] = useState<string[]>(business.tags);
  const [imageUrl, setImageUrl] = useState<string | undefined>(business.imageUrl);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(business.bannerUrl);
  const [uploading, setUploading] = useState<BusinessImageKind | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const meta = CATEGORY_META[business.category];
  const tagOptions = Array.from(new Set([...business.tags, ...TAG_SUGGESTIONS]));
  const today = new Date().getDay();

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleUpload(kind: BusinessImageKind, file: File | null | undefined) {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadBusinessImage(file, business.id, kind);
      if (kind === "logo") setImageUrl(url);
      else setBannerUrl(url);
      // Persist the image immediately (sync effect upserts the owned business).
      setData((d) => ({
        ...d,
        businesses: d.businesses.map((b) =>
          b.id === business.id ? { ...b, [kind === "logo" ? "imageUrl" : "bannerUrl"]: url } : b,
        ),
      }));
      toast.success(`${kind === "logo" ? "Logo" : "Banner"} updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function save() {
    setData((d) => ({
      ...d,
      businesses: d.businesses.map((b) =>
        b.id === business.id
          ? { ...b, name, description, address, priceLevel, tags, imageUrl, bannerUrl }
          : b,
      ),
    }));
    toast.success("Profile saved");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your"
        accent="storefront"
        subtitle="Edit how your business appears to customers browsing and matching across Lattice."
      />

      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleUpload("logo", e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleUpload("banner", e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Reveal>
        <div className="overflow-hidden rounded-[var(--tile-radius-lg)]">
          <BusinessImage business={{ ...business, bannerUrl }} className="h-44 w-full sm:h-56" width={1500} eager>
            <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-card/85 px-3 py-1 text-xs font-semibold text-[var(--primary-strong)] shadow-[var(--shadow-soft)] backdrop-blur-sm">
              <Icon name={meta.icon as IconName} size={13} /> {meta.label}
            </span>
            <div className="absolute right-4 top-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Icon name={uploading === "banner" ? "clock" : "createOffer"} size={15} />}
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading !== null}
                className="shadow-[var(--shadow-card)] backdrop-blur-sm"
              >
                {uploading === "banner" ? "Uploading…" : "Change banner"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Icon name="explore" size={15} />}
                onClick={() => navigate(`/business?id=${business.id}`)}
                className="shadow-[var(--shadow-card)] backdrop-blur-sm"
              >
                View public profile
              </Button>
            </div>

            {/* Logo / profile picture */}
            <div className="absolute bottom-4 left-4">
              <div className="relative">
                <span className="grid size-[72px] place-items-center overflow-hidden rounded-2xl border-2 border-card bg-card text-primary shadow-[var(--shadow-card)]">
                  {imageUrl ? (
                    <img src={imageUrl} alt={`${business.name} logo`} className="size-full object-cover" />
                  ) : (
                    <Icon name={meta.icon as IconName} size={26} />
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading !== null}
                  aria-label="Upload logo"
                  className="absolute -bottom-1 -right-1 grid size-7 cursor-pointer place-items-center rounded-full border border-card bg-primary text-white shadow-[var(--shadow-soft)] transition-transform active:scale-95 disabled:opacity-60"
                >
                  <Icon name={uploading === "logo" ? "clock" : "plus"} size={14} />
                </button>
              </div>
            </div>
          </BusinessImage>
        </div>
      </Reveal>

      <Card variant="solid" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm">
          <span className="inline-flex items-center gap-2">
            <RatingStars rating={business.ratingAverage} size={15} />
            <span className="font-semibold text-foreground">{formatRating(business.ratingAverage)}</span>
            <span className="text-muted-foreground">({business.reviewCount} reviews)</span>
          </span>
          <span aria-hidden className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">{meta.label}</span>
          <span aria-hidden className="text-muted-foreground/50">·</span>
          <span className="font-semibold text-foreground">{"$".repeat(business.priceLevel)}</span>
          <span aria-hidden className="text-muted-foreground/50">·</span>
          {business.verified ? (
            <Badge tone="brand" icon={<Icon name="check" size={12} />}>
              Verified
            </Badge>
          ) : (
            <Badge tone="neutral">Unverified</Badge>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card variant="solid" className="space-y-5 p-5 sm:p-6 lg:col-span-2">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em]">
            <Icon name="store" size={18} className="text-primary" /> Storefront details
          </h2>

          <FormField label="Business name" htmlFor="biz-name">
            <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>

          <FormField label="Description" htmlFor="biz-desc" hint="A short pitch shown on your public profile.">
            <Textarea
              id="biz-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <FormField label="Address" htmlFor="biz-address">
            <Input id="biz-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormField>

          <FormField label="Price level" htmlFor="biz-price">
            <Select
              id="biz-price"
              className="w-40"
              value={String(priceLevel)}
              onChange={(e) => setPriceLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
            >
              {PRICE_LEVELS.map((n) => (
                <option key={n} value={n}>
                  {"$".repeat(n)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Tags" hint="Toggle the highlights customers see on your storefront.">
            <ChipGroup>
              {tagOptions.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <ToggleChip
                    key={tag}
                    type="button"
                    active={active}
                    icon={<Icon name={active ? "check" : "plus"} size={14} />}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </ToggleChip>
                );
              })}
            </ChipGroup>
          </FormField>

          <div className="flex justify-end pt-1">
            <Button variant="brand" iconLeft={<Icon name="check" size={17} />} onClick={save}>
              Save changes
            </Button>
          </div>
        </Card>

        <Card variant="solid" className="space-y-3 p-5 sm:p-6">
          <h3 className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em]">
            <Icon name="clock" size={17} className="text-primary" /> Hours
          </h3>
          <ul className="space-y-1.5 text-sm">
            {DAYS.map((day, i) => {
              const h = business.hours.find((x) => x.dayOfWeek === i);
              const isToday = i === today;
              return (
                <li
                  key={day}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${isToday ? "bg-[var(--tint-blue)]" : ""}`}
                >
                  <span className={isToday ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {day}
                  </span>
                  <span className={isToday ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {h ? `${fmtTime(h.openTime)} – ${fmtTime(h.closeTime)}` : "Closed"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
