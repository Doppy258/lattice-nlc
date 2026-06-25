import type { ReactNode } from "react";
import { useApp } from "../../app/providers";
import { ALL_CATEGORIES } from "../../data/catalog";
import { LatticeField } from "./LatticeField";

type Stat = { num: number; label: string };

/**
 * Shared layout for the three entry screens (Login · Signup · Onboarding).
 * A living lattice field fills the viewport; a constant brand rail sits to one
 * side for continuity; the screen's content floats in a glass panel. The brand
 * stats are read live from the seeded dataset so the numbers are always honest.
 */
export function EntryShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { data } = useApp();

  const stats: Stat[] = [
    { num: data?.offers?.length ?? 0, label: "local offers" },
    { num: data?.businesses?.length ?? 0, label: "small businesses" },
    { num: ALL_CATEGORIES.length, label: "categories" },
  ];

  return (
    <div className={`entry${wide ? " entry--wide" : ""}`}>
      <LatticeField />

      <div className="entry__inner">
        <aside className="entry__brand">
          <div className="entry__brandhead entry__rise entry__rise--1">
            <span className="entry__logo">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </span>
            <span className="entry__wordmark">Lattice</span>
          </div>

          <h1 className="entry__headline entry__rise entry__rise--2">
            Find local offers that <span className="entry__accent">fit</span> you.
          </h1>

          <p className="entry__lede entry__rise entry__rise--3">
            Lattice ranks nearby small-business deals against what you actually need —
            then helps you claim, redeem, and keep your own shortlist.
          </p>

          <div className="entry__stats entry__rise entry__rise--3">
            {stats.map((s) => (
              <div className="entry__stat" key={s.label}>
                <span className="entry__statnum">{s.num}</span>
                <span className="entry__statlabel">{s.label}</span>
              </div>
            ))}
          </div>

          <span className="entry__trust entry__rise entry__rise--4">
            <span className="entry__trustdot" />
            Private by default · works fully offline
          </span>
        </aside>

        <div className="entry__panelwrap">
          <div className="entry__panel entry__rise entry__rise--panel">{children}</div>
        </div>
      </div>
    </div>
  );
}
