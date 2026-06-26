import { useState } from "react";
import { useApp } from "@/app/providers";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { Badge } from "@/components/common/Badge";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/common/FormField";
import { ChipGroup, ToggleChip } from "@/components/common/ToggleChip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ALL_CATEGORIES, CATEGORY_META } from "@/data/catalog";
import { initials, formatRating } from "@/utils/formatting";
import { toast } from "sonner";
import type { BusinessCategory } from "@/models";

const DISTANCE_OPTIONS = [1, 3, 5, 10];

export function SettingsPage() {
  const { activeUser, setData, signOut } = useApp();
  const [name, setName] = useState(activeUser.name);
  const [maxDistance, setMaxDistance] = useState(activeUser.preferences.maxDefaultDistanceKm);
  const [studentDiscount, setStudentDiscount] = useState(activeUser.preferences.studentDiscountPreferred);
  const [preferredCategories, setPreferredCategories] = useState<BusinessCategory[]>(activeUser.preferences.preferredCategories);

  function toggleCategory(cat: BusinessCategory) {
    setPreferredCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function saveProfile() {
    setData((d) => ({
      ...d,
      users: d.users.map((u) =>
        u.id === activeUser.id
          ? {
              ...u,
              name,
              preferences: {
                ...u.preferences,
                maxDefaultDistanceKm: maxDistance,
                studentDiscountPreferred: studentDiscount,
                preferredCategories,
              },
            }
          : u
      ),
    }));
    toast.success("Settings saved");
  }

  const roleLabel = activeUser.role === "businessOwner" ? "Business owner" : activeUser.role === "admin" ? "Admin" : "Customer";
  const roleTone = activeUser.role === "admin" ? "warning" : activeUser.role === "businessOwner" ? "violet" : "brand";

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your"
        accent="settings"
        subtitle="Manage your profile, preferences, and account."
      />

      {/* Profile card */}
      <Reveal>
        <Card variant="solid" className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-xl font-semibold">{initials(activeUser.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em]">{activeUser.name}</h2>
              <p className="text-[13px] text-muted-foreground">{activeUser.email}</p>
              <Badge tone={roleTone}>{roleLabel}</Badge>
            </div>
          </div>
        </Card>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile editor */}
        <Reveal className="lg:col-span-2">
          <Card variant="solid" className="space-y-5 p-5 sm:p-6">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em]">
              <Icon name="home" size={18} className="text-primary" /> Profile
            </h2>

            <FormField label="Display name" htmlFor="settings-name">
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <FormField label="Email" htmlFor="settings-email" hint="Managed by your account provider.">
              <Input
                id="settings-email"
                value={activeUser.email}
                disabled
                className="opacity-60"
              />
            </FormField>

            <FormField label="Max search distance" htmlFor="settings-distance" hint="How far Lattice will search for offers.">
              <Select
                id="settings-distance"
                value={String(maxDistance)}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-40"
              >
                {DISTANCE_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} km</option>
                ))}
              </Select>
            </FormField>

            <div className="flex justify-end pt-1">
              <Button variant="brand" iconLeft={<Icon name="check" size={17} />} onClick={saveProfile}>
                Save changes
              </Button>
            </div>
          </Card>
        </Reveal>

        {/* Preferences sidebar */}
        <Reveal>
          <Card variant="solid" className="space-y-5 p-5 sm:p-6">
            <h3 className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em]">
              <Icon name="rankings" size={17} className="text-primary" /> Preferences
            </h3>

            <div className="space-y-3">
              <FormField label="Interested categories">
                <ChipGroup>
                  {ALL_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const active = preferredCategories.includes(cat);
                    return (
                      <ToggleChip
                        key={cat}
                        type="button"
                        active={active}
                        icon={<Icon name={active ? "check" : "plus"} size={14} />}
                        onClick={() => toggleCategory(cat)}
                      >
                        {meta.label}
                      </ToggleChip>
                    );
                  })}
                </ChipGroup>
              </FormField>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm font-medium">Student discounts</span>
                <button
                  type="button"
                  onClick={() => setStudentDiscount(!studentDiscount)}
                  className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                    studentDiscount ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                      studentDiscount ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Account section */}
      <Reveal>
        <Card variant="solid" className="p-5 sm:p-6">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em]">
            <Icon name="claims" size={18} className="text-primary" /> Account
          </h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{activeUser.email}</span>
          </p>
          <div className="mt-4">
            <Button
              variant="danger"
              iconLeft={<Icon name="logout" size={17} />}
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
