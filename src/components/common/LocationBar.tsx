import { Button } from "./Button";
import { Icon } from "./Icon";
import { ShareLocationButton } from "./ShareLocationButton";

/**
 * Inline location control shared by the customer-facing pages.
 *
 * Surfaces the "share location" prompt when no location is stored, and —
 * crucially — keeps an "Update" affordance available *after* a location is
 * stored, so a stale or wrong position (e.g. one captured in another city) can
 * always be re-acquired. The previous banners hid themselves once any location
 * existed, which left users with no way to correct a wrong location.
 */
export function LocationBar({
  geo,
  hasLocation,
  purpose = "accurate distances",
}: {
  geo: { loading: boolean; error: string | null; requestLocation: () => void };
  hasLocation: boolean;
  purpose?: string;
}) {
  if (geo.error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--danger-tint)] px-4 py-3">
        <span className="text-[13px] font-medium text-destructive">
          Could not get your location: {geo.error}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={geo.requestLocation}
          disabled={geo.loading}
          iconLeft={<Icon name="location" size={15} />}
        >
          {geo.loading ? "Getting location…" : "Try again"}
        </Button>
      </div>
    );
  }

  if (!hasLocation) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--tint-blue)] px-4 py-3">
        <span className="text-[13px] text-[var(--primary-strong)]">
          Enable location for {purpose}
        </span>
        <ShareLocationButton loading={geo.loading} error={null} onRequest={geo.requestLocation} />
      </div>
    );
  }

  // A location is stored — keep a refresh control so a stale position can be fixed.
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--tint-blue)] px-4 py-3">
      <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--primary-strong)]">
        <Icon name="location" size={14} />
        Using your current location for {purpose}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={geo.requestLocation}
        disabled={geo.loading}
        iconLeft={<Icon name="location" size={15} />}
      >
        {geo.loading ? "Updating…" : "Update location"}
      </Button>
    </div>
  );
}
