import { useMemo, useState, type FormEvent } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { Icon } from "@/components/common/Icon";
import { LatticeMark } from "@/components/layout/LatticeMark";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthError, AuthShell } from "./authShared";
import { ALL_CATEGORIES, CATEGORY_META } from "@/data/catalog";
import { upsertBusiness } from "@/services/dbService";
import type { Business, BusinessCategory } from "@/models";
import { createId } from "@/utils/ids";

export function BusinessOnboardingPage() {
  const { activeUser, completeOnboarding, setData } = useApp();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("food");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const categoryLabel = useMemo(() => CATEGORY_META[category].label.toLowerCase(), [category]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Enter your storefront name.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Add a short description so customers know what you offer.");
      return;
    }
    if (address.trim().length < 4) {
      setError("Enter a storefront address.");
      return;
    }

    setSubmitting(true);
    const business: Business = {
      id: createId("biz"),
      name: name.trim(),
      category,
      description: description.trim(),
      address: address.trim(),
      location: { lat: 43.6532, lng: -79.3832 },
      hours: [],
      ratingAverage: 0,
      reviewCount: 0,
      verified: false,
      priceLevel: 2,
      tags: [categoryLabel],
      accessibilityFeatures: [],
      ownerUserId: activeUser.id,
      createdAt: new Date().toISOString(),
    };

    const businessError = await upsertBusiness(business);
    if (businessError) {
      setSubmitting(false);
      setError(`Couldn't create your storefront: ${businessError}`);
      return;
    }

    setData((d) => ({ ...d, businesses: [business, ...d.businesses] }));
    const err = await completeOnboarding({
      role: "businessOwner",
      name: activeUser.name,
      homeLocationId: activeUser.homeLocationId || "origin_school",
      preferences: activeUser.preferences,
    });
    setSubmitting(false);

    if (err) {
      setError(err);
      return;
    }
    navigate("/dashboard");
  }

  return (
    <AuthShell wide>
      <div className="flex items-center justify-between gap-3">
        <LatticeMark size={40} />
        <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-[var(--primary-strong)]">
          Business setup
        </span>
      </div>

      <h1 className="mt-5 font-display text-[26px] font-semibold tracking-[-0.035em]">
        Set up your <span className="font-accent font-normal text-primary">storefront</span>
      </h1>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Add the basics customers will see before you publish offers and redeem passes.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <AuthError message={error} />}

        <FormField label="Business name" htmlFor="business-name" required>
          <Input
            id="business-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Harbour Roast"
            autoFocus
          />
        </FormField>

        <FormField label="Category" htmlFor="business-category">
          <Select
            id="business-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as BusinessCategory)}
          >
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Description" htmlFor="business-description" required>
          <Textarea
            id="business-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you sell, and what should nearby customers know?"
            className="min-h-24"
          />
        </FormField>

        <FormField label="Address" htmlFor="business-address" required>
          <Input
            id="business-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 College Street"
          />
        </FormField>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          block
          disabled={submitting}
          iconLeft={<Icon name="store" size={18} />}
        >
          {submitting ? "Saving..." : "Create storefront"}
        </Button>
      </form>
    </AuthShell>
  );
}
