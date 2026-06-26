/**
 * ComingSoon - on-brand placeholder for routes not yet implemented.
 * Shows the route title, a friendly message, and CTAs to Create a Lattice or
 * return home so the user never hits a dead 404-style page.
 * Props: path (string) — the unknown hash route
 * Role in architecture: Layout — guards every unbuilt route via the switch
 * default in RouteView, maintaining the brand experience during incremental
 * feature delivery.
 */
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { titleForPath } from "./navConfig";


export function ComingSoon({ path }: { path: string }) {
  const title = titleForPath(path);
  return (
    <Reveal className="mx-auto flex max-w-md flex-col items-center gap-5 py-24 text-center">
      <span className="beam-host grid size-16 place-items-center rounded-3xl bg-accent text-primary">
        <Icon name="matches" size={28} />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.03em]">
          {title} <span className="font-accent text-primary">is on the way</span>
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          This screen is part of the next build pass. The core flow — Home, Create a
          Lattice, and Matches — is ready to explore now.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Button variant="brand" iconLeft={<Icon name="ping" size={17} />} onClick={() => navigate("/create")}>
          Create a Lattice
        </Button>
        <Button variant="secondary" onClick={() => navigate("/home")}>
          Back to Home
        </Button>
      </div>
    </Reveal>
  );
}
