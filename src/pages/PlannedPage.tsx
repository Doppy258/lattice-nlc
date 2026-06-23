import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { Button } from "../components/common/Button";
import { Icon, type IconName } from "../components/common/Icon";
import { navigate } from "../app/navigation";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: IconName;
  /** What is already wired up beneath this screen (the Phase 1/2 foundation). */
  readyNote: string;
};

/**
 * Placeholder for screens delivered in a later build phase (Phase 3+). The
 * underlying models, seed data, and services these screens consume are already
 * implemented, so this communicates intent rather than an unfinished state.
 */
export function PlannedPage({ eyebrow, title, subtitle, icon, readyNote }: Props) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <EmptyState
        icon={icon}
        title="Screen scheduled for the next build phase"
        body={readyNote}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/home")} iconLeft={<Icon name="home" size={16} />}>
              Back to Home
            </Button>
            <Button variant="ghost" onClick={() => navigate("/demo")} iconLeft={<Icon name="demo" size={16} />}>
              View seeded data
            </Button>
          </>
        }
      />
    </>
  );
}
