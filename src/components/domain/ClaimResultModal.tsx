import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Modal } from "@/components/common/Modal";
import { ClaimCodeCard } from "./ClaimCodeCard";
import type { ClaimResult } from "./useClaim";

/** Success modal shown after a claim, wrapping the ClaimCodeCard. */
export function ClaimResultModal({
  result,
  onClose,
}: {
  result: ClaimResult | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!result}
      onOpenChange={(o) => !o && onClose()}
      title="Offer claimed"
      description="Show your code at the business before it expires to redeem."
    >
      {result && (
        <div className="space-y-4">
          <ClaimCodeCard claim={result.claim} offer={result.offer} business={result.business} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
            <Button
              variant="brand"
              iconLeft={<Icon name="claims" size={17} />}
              onClick={() => {
                onClose();
                navigate("/claims");
              }}
            >
              View my claims
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
