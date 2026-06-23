import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Icon } from "../components/common/Icon";

const STEPS = [
  { icon: "ping" as const, title: "01 — Ping", body: "Describe what you need with structured fields: category, budget, distance, and timing." },
  { icon: "matches" as const, title: "02 — Match", body: "OfferRank scores nearby offers and explains why each one fits your request." },
  { icon: "redeem" as const, title: "03 — Claim", body: "Claim an offer to get a code, redeem it in store, then leave a verified review." },
];

const FAQ = [
  {
    q: "How is this different from a maps search?",
    a: "Maps search is built around browsing places. Lattice is built around structured demand — you describe a specific need and we rank claimable offers by fit.",
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
    a: "Yes. Everything runs on seeded local data persisted in your browser — no internet, accounts, or live APIs required.",
  },
];

export function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="How Lattice works"
        subtitle="Turn a specific local need into a short, ranked list of offers you can claim right away."
      />

      <div className="metric-grid">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <span className="empty-state__icon" style={{ marginBottom: "var(--space-3)" }}>
              <Icon name={s.icon} size={20} />
            </span>
            <h3 className="card__title" style={{ fontSize: "var(--text-base)" }}>
              {s.title}
            </h3>
            <p className="metric__hint">{s.body}</p>
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: "var(--space-6)" }}>
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
