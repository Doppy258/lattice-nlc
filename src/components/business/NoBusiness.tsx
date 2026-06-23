import { PageHeader } from "../layout/PageHeader";
import { EmptyState } from "../common/EmptyState";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { navigate } from "../../app/navigation";

/**
 * Shown on business screens when the active user owns no business (e.g. the
 * admin demo account). Points them at the profile switcher / demo data.
 */
export function NoBusiness() {
  return (
    <>
      <PageHeader eyebrow="Business" title="No business selected" />
      <EmptyState
        icon="store"
        title="This account doesn't manage a business"
        body="Switch to a business-owner profile from the top bar to manage offers, claims, and reviews."
        actions={
          <Button variant="secondary" onClick={() => navigate("/demo")} iconLeft={<Icon name="demo" size={16} />}>
            View seeded data
          </Button>
        }
      />
    </>
  );
}
