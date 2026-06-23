import { useMemo, useState } from "react";
import type { Offer } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import {
  classifyOffer,
  deleteOffer,
  getOwnerOffers,
  toggleOfferActive,
  updateOffer,
  type OfferInput,
  type OfferStatus,
} from "../services/offerService";
import { byDate } from "../utils/sorting";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { Modal } from "../components/common/Modal";
import { EmptyState } from "../components/common/EmptyState";
import { OwnerOfferRow } from "../components/business/OwnerOfferRow";
import { OfferForm } from "../components/business/OfferForm";
import { NoBusiness } from "../components/business/NoBusiness";

type Tab = "active" | "paused" | "expired";

const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "expired", label: "Expired" },
];

/** Active tab also surfaces "full" offers (live but at their claim limit). */
function inTab(status: OfferStatus, tab: Tab): boolean {
  if (tab === "active") return status === "active" || status === "full";
  return status === tab;
}

export function ManageOffersPage() {
  const { data, setData, activeBusiness } = useApp();
  const [tab, setTab] = useState<Tab>("active");
  const [editingId, setEditingId] = useState<string | null>(null);

  const offers = useMemo(() => {
    if (!activeBusiness) return [];
    return [...getOwnerOffers(activeBusiness.id, data.offers)].sort(
      byDate((o) => o.createdAt, "desc")
    );
  }, [activeBusiness, data.offers]);

  const withStatus = useMemo(
    () => offers.map((offer) => ({ offer, status: classifyOffer(offer) })),
    [offers]
  );

  const counts: Record<Tab, number> = {
    active: withStatus.filter((x) => inTab(x.status, "active")).length,
    paused: withStatus.filter((x) => inTab(x.status, "paused")).length,
    expired: withStatus.filter((x) => inTab(x.status, "expired")).length,
  };

  const editing = editingId ? offers.find((o) => o.id === editingId) ?? null : null;

  if (!activeBusiness) return <NoBusiness />;

  const list = withStatus.filter((x) => inTab(x.status, tab));

  const onToggle = (offer: Offer) =>
    setData((prev) => ({ ...prev, offers: toggleOfferActive(offer.id, prev.offers) }));

  const onDelete = (offer: Offer) => {
    if (offer.currentClaims > 0) return;
    setData((prev) => ({ ...prev, offers: deleteOffer(offer.id, prev.offers) }));
  };

  const onSaveEdit = (input: OfferInput) => {
    if (!editingId) return;
    setData((prev) => ({ ...prev, offers: updateOffer(editingId, input, prev.offers) }));
    setEditingId(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Manage offers"
        subtitle={`Offers for ${activeBusiness.name}`}
        actions={
          <Button
            onClick={() => navigate("/business/create-offer")}
            iconLeft={<Icon name="createOffer" size={16} />}
          >
            Create offer
          </Button>
        }
      />

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? "tab--on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="tab__count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="offers"
          title={`No ${tab} offers`}
          body={
            tab === "active"
              ? "Publish an offer to start attracting nearby customers."
              : "Offers in this state will show up here."
          }
          actions={
            tab === "active" ? (
              <Button
                onClick={() => navigate("/business/create-offer")}
                iconLeft={<Icon name="createOffer" size={16} />}
              >
                Create offer
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="owner-offer-list">
          {list.map(({ offer, status }) => (
            <OwnerOfferRow
              key={offer.id}
              offer={offer}
              status={status}
              onEdit={() => setEditingId(offer.id)}
              onToggleActive={() => onToggle(offer)}
              onDelete={() => onDelete(offer)}
            />
          ))}
        </div>
      )}

      <Modal open={!!editing} title="Edit offer" onClose={() => setEditingId(null)}>
        {editing && (
          <OfferForm
            initial={editing}
            submitLabel="Save changes"
            onSubmit={onSaveEdit}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>
    </>
  );
}
