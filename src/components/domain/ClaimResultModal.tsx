/**
 * ClaimResultModal - success modal displayed after a claim is completed.
 * Wraps the live LatticePass (QR + backup code + countdown) and provides
 * navigation to the /claims page or dismissal.
 * Props: result (ClaimResult | null), onClose (() => void)
 * Role in architecture: Domain — bridges the claim flow and the pass display,
 * giving users a clear next step after claiming an offer.
 */
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Modal } from "@/components/common/Modal";
import { LatticePass } from "./LatticePass";
import type { ClaimResult } from "./useClaim";


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
      title="Your Lattice Pass"
      description="Show the QR or backup code at the business before it expires — they approve to redeem."
      footer={
        <>
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
        </>
      }
    >
      {result && (
        <LatticePass claim={result.claim} offer={result.offer} business={result.business} />
      )}
    </Modal>
  );
}
