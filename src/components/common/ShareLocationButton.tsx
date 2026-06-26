import { Button } from "./Button";
import { Icon } from "./Icon";

export function ShareLocationButton({
  loading,
  error,
  onRequest,
}: {
  loading: boolean;
  error: string | null;
  onRequest: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={onRequest} disabled={loading} iconLeft={<Icon name="location" size={15} />}>
        {loading ? "Getting location…" : "Share your location"}
      </Button>
      {error && (
        <span className="text-[12px] text-destructive">{error}</span>
      )}
    </div>
  );
}
