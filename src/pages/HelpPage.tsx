import { PageHero } from "../components/layout/PageHero";
import { Card } from "../components/common/Card";
import { Icon } from "../components/common/Icon";

const STEPS = [
  { icon: "ping" as const, num: "01", title: "Request", body: "Describe what you need with structured fields: category, budget, distance, and timing." },
  { icon: "matches" as const, num: "02", title: "Match", body: "OfferRank scores nearby offers and explains why each one fits your request." },
  { icon: "redeem" as const, num: "03", title: "Claim", body: "Claim an offer to get a code, redeem it in store, then leave a verified review." },
];

const FAQ = [
  {
    q: "How is this different from a maps search?",
    a: "Maps search is built around browsing places. Lattice is built around structured demand: you describe a specific need and we rank claimable offers by fit.",
  },
  {
    q: "What is the intelligent feature?",
    a: "OfferRank. It scores offers by category fit, budget, distance, rating, time availability, verification, and preferences, then explains every match.",
  },
  {
    q: "How do you keep requests realistic?",
    a: "Structured inputs plus semantic validation. Each need type has a realistic minimum budget, required fields, and duplicate-request cooldowns.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. Everything runs on seeded local data persisted in your browser. No internet, accounts, or live APIs required.",
  },
];

export function HelpPage() {
  return (
    <>
      <PageHero
        variant="split"
        kicker="Help"
        title="How Lattice works"
        subtitle="Turn a specific local need into a short, ranked list of offers you can claim right away."
      />

      <div className="help-zigzag">
        {STEPS.map((s) => (
          <div key={s.num} className="help-step">
            <div>
              <h3 className="card__title" style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-3)" }}>
                {s.num} - {s.title}
              </h3>
              <p className="metric__hint">{s.body}</p>
            </div>
            <div className="help-step__visual">
              <Icon name={s.icon} size={32} />
            </div>
          </div>
        ))}
      </div>

      <Card variant="bento" style={{ marginTop: "var(--space-8)" }}>
        <h2 className="card__title" style={{ marginBottom: "var(--space-5)" }}>
          Frequently asked
        </h2>
        {FAQ.map((item) => (
          <div key={item.q} className="help-item">
            <p className="help-item__q">{item.q}</p>
            <p className="help-item__a">{item.a}</p>
          </div>
        ))}
      </Card>
    </>
  );
}
