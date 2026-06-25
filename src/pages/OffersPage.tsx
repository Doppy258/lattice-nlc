import { useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { Badge, type BadgeTone } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Icon } from "@/components/common/Icon";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { Progress } from "@/components/ui/progress";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import {
  classifyOffer,
  getOwnerOffers,
  toggleOfferActive,
  deleteOffer,
  type OfferStatus,
} from "@/services/offerService";
import { OFFER_TYPE_LABELS } from "@/data/catalog";
import { formatCurrency, relativeTime } from "@/utils/formatting";
import type { Offer } from "@/models";

type Filter = "all" | OfferStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "full", label: "Full" },
];

const STATUS: Record<OfferStatus, { tone: BadgeTone; label: string }> = {
  active: { tone: "success", label: "Active" },
  paused: { tone: "warning", label: "Paused" },
  expired: { tone: "neutral", label: "Expired" },
  full: { tone: "violet", label: "Full" },
};

export function OffersPage() {
  const { data, activeBusiness, setData } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  if (!activeBusiness) {
    return (
      <EmptyState
        icon="store"
        title="No business selected"
        body="Switch to a business-owner account (Sam or Nina) from the account menu in the top bar to manage a storefront."
        action={
          <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/home")}>
            Back to Home
          </Button>
        }
      />
    );
  }

  const offers = getOwnerOffers(activeBusiness.id, data.offers);
  const activeCount = offers.filter((o) => classifyOffer(o) === "active").length;
  const totalClaims = offers.reduce((sum, o) => sum + o.currentClaims, 0);
  const totalViews = offers.reduce((sum, o) => sum + o.views, 0);

  const filtered = filter === "all" ? offers : offers.filter((o) => classifyOffer(o) === filter);

  function handleToggle(o: Offer) {
    setData((d) => ({ ...d, offers: toggleOfferActive(o.id, d.offers) }));
    toast.success(o.active ? "Offer paused" : "Offer resumed");
  }

  function handleDelete(o: Offer) {
    if (o.currentClaims > 0 && !window.confirm("This offer has active claims. Delete anyway?")) return;
    setData((d) => ({ ...d, offers: deleteOffer(o.id, d.offers) }));
    toast.success("Offer deleted");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your"
        accent="offers"
        subtitle={`Manage every deal running at ${activeBusiness.name} — pause, edit, or launch something new.`}
        actions={
          <Button variant="brand" iconLeft={<Icon name="plus" size={17} />} onClick={() => navigate("/create-offer")}>
            New offer
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total offers" value={offers.length} icon={<Icon name="offers" size={17} />} tone="blue" />
        <StatTile label="Active" value={activeCount} icon={<Icon name="check" size={17} />} tone="mint" />
        <StatTile label="Total claims" value={totalClaims} icon={<Icon name="claims" size={17} />} tone="violet" />
        <StatTile label="Total views" value={totalViews} icon={<Icon name="analytics" size={17} />} tone="amber" />
      </div>

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState
          icon="offers"
          title={offers.length === 0 ? "No offers yet" : `No ${filter} offers`}
          body={
            offers.length === 0
              ? "Create your first offer to start matching with nearby students."
              : "Nothing here right now — try another filter or launch a new offer."
          }
          action={
            <Button variant="brand" iconLeft={<Icon name="plus" size={17} />} onClick={() => navigate("/create-offer")}>
              Create your first offer
            </Button>
          }
        />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((offer) => {
            const status = classifyOffer(offer);
            const meta = STATUS[status];
            const pct = Math.min(
              100,
              Math.round((offer.currentClaims / Math.max(1, offer.maxClaims)) * 100),
            );
            const hasSavings =
              offer.originalPrice !== undefined && offer.originalPrice > offer.price;
            return (
              <StaggerItem key={offer.id}>
                <Card variant="interactive" className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                        {offer.title}
                      </h3>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {OFFER_TYPE_LABELS[offer.offerType]}
                      </p>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-display text-[24px] font-semibold leading-none tracking-[-0.03em] text-foreground">
                      {formatCurrency(offer.price)}
                    </span>
                    {hasSavings && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(offer.originalPrice!)}
                      </span>
                    )}
                    {offer.studentOnly && (
                      <Badge tone="violet" icon={<Icon name="education" size={13} />}>
                        Student
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Progress value={pct} />
                    <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                      <span>
                        <span className="mono font-medium text-foreground">{offer.currentClaims}</span> /{" "}
                        {offer.maxClaims} claimed
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="analytics" size={13} /> {offer.views} views
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Icon name="clock" size={13} /> Ends {relativeTime(offer.validUntil)}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<Icon name="createOffer" size={15} />}
                      onClick={() => navigate(`/create-offer?id=${offer.id}`)}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(offer)}>
                      {offer.active ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="ml-auto"
                      iconLeft={<Icon name="close" size={15} />}
                      onClick={() => handleDelete(offer)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
