import { useRef, useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon, type IconName } from "@/components/common/Icon";
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
import { BusinessHoursEditor } from "@/components/domain/BusinessHoursEditor";
import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { CATEGORY_META } from "@/data/catalog";
import { formatRating } from "@/utils/formatting";
import type { Business, BusinessHours, GeoPoint } from "@/models";
import { uploadBusinessImage } from "@/services/imageService";
import { upsertBusiness } from "@/services/dbService";
import { toast } from "sonner";

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
  const [businessLocation, setBusinessLocation] = useState<GeoPoint | null>(business.location);
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4>(business.priceLevel);
  const [tags, setTags] = useState<string[]>(business.tags);
  const [hours, setHours] = useState<BusinessHours[]>(business.hours);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(business.bannerUrl);
  const [uploading, setUploading] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);

  const meta = CATEGORY_META[business.category];
  const tagOptions = Array.from(new Set([...business.tags, ...TAG_SUGGESTIONS]));

  function handleAddressSelect(fullAddress: string, location: GeoPoint) {
    setAddress(fullAddress);
    setBusinessLocation(location);
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleBannerUpload(file: File | null | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBusinessImage(file, business.id, "banner");
      setBannerUrl(url);
      setData((d) => ({
        ...d,
        businesses: d.businesses.map((b) =>
          b.id === business.id ? { ...b, bannerUrl: url } : b,
        ),
      }));
      toast.success("Banner updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const updated: Business = {
      ...business,
      name,
      description,
      address,
      priceLevel,
      tags,
      hours,
      bannerUrl,
      location: businessLocation ?? business.location,
    };
    setData((d) => ({
      ...d,
      businesses: d.businesses.map((b) => (b.id === business.id ? updated : b)),
    }));
    // Persist through to the shared backend so the new address/location/hours
    // sync to every other profile — otherwise the edit stays local to this
    // browser and customers keep matching against the stale location.
    const error = await upsertBusiness(updated);
    if (error) {
      toast.error(`Couldn't sync changes: ${error}`);
      return;
    }
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
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleBannerUpload(e.target.files?.[0]);
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
                iconLeft={<Icon name={uploading ? "clock" : "createOffer"} size={15} />}
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading}
                className="shadow-[var(--shadow-card)] backdrop-blur-sm"
              >
                {uploading ? "Uploading…" : "Change banner"}
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

          <FormField label="Address" htmlFor="biz-address" hint="Search for your location and select from the dropdown.">
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={handleAddressSelect}
              placeholder="Search for your business address"
              id="biz-address"
            />
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
          <div>
            <h3 className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em]">
              <Icon name="clock" size={17} className="text-primary" /> Hours
            </h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Saved with the rest of your profile.
            </p>
          </div>
          <BusinessHoursEditor value={hours} onChange={setHours} />
        </Card>
      </div>
    </div>
  );
}
