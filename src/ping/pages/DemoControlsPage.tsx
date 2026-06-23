import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { useDatabase } from '@/app/useDatabase'
import { resetDemoData } from '@/services/storageService'

/**
 * Demo / admin controls. The Reset button is wired to storageService and works
 * today — proving the full data + persistence layer is live. The seed-data
 * viewer below reflects the current store in real time.
 */
export function DemoControlsPage() {
  const db = useDatabase()
  const [confirming, setConfirming] = useState(false)
  const [resetNote, setResetNote] = useState<string | null>(null)

  const counts: { label: string; value: number }[] = [
    { label: 'Users', value: db.users.length },
    { label: 'Locations', value: db.locations.length },
    { label: 'Businesses', value: db.businesses.length },
    { label: 'Offers', value: db.offers.length },
    { label: 'Claims', value: db.claims.length },
    { label: 'Reviews', value: db.reviews.length },
    { label: 'Saved items', value: db.savedBusinesses.length + db.savedOffers.length },
    { label: 'Rankings', value: db.rankings.length },
  ]

  const handleReset = () => {
    resetDemoData()
    setConfirming(false)
    setResetNote(`Demo data reset at ${new Date().toLocaleTimeString()}.`)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Demo"
        title="Demo Controls"
        description="Ping runs entirely on seeded local data in your browser — no server, no internet. Reset at any time to return to a clean demo state."
      />

      <h2 className="section-title">Seed data viewer</h2>
      <div className="cards-grid">
        {counts.map((c) => (
          <Card key={c.label}>
            <div className="stat">
              <span className="stat__value">{c.value}</span>
              <span className="stat__label">{c.label}</span>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="section-title" style={{ marginTop: 'var(--sp-7)' }}>
        Reset
      </h2>
      <Card pad="lg">
        <div className="spread" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
          <div style={{ maxWidth: '52ch' }}>
            <h3 style={{ marginBottom: 'var(--sp-2)' }}>Reset demo data</h3>
            <p className="muted">
              Rebuilds every collection from the seed set and clears any Pings, claims, reviews, or
              bookmarks created during the demo. Your selected profile stays signed in.
            </p>
            {resetNote && (
              <p style={{ marginTop: 'var(--sp-3)', color: 'var(--emerald)', fontWeight: 600 }}>
                <Icon name="check" size={15} /> {resetNote}
              </p>
            )}
          </div>

          {confirming ? (
            <div className="row">
              <Button variant="danger" onClick={handleReset} iconLeft={<Icon name="check" size={16} />}>
                Yes, reset everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              onClick={() => setConfirming(true)}
              iconLeft={<Icon name="sliders" size={16} />}
            >
              Reset Demo Data
            </Button>
          )}
        </div>
      </Card>

      <Card pad="lg" style={{ marginTop: 'var(--sp-4)' }}>
        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <Badge tone="emerald">
            <Icon name="shield" size={12} /> Offline
          </Badge>
          <span className="muted">
            All data is stored under <code>ping.db.v1</code> in localStorage and persists across
            refreshes. No external APIs, maps, payments, or accounts are used.
          </span>
        </div>
      </Card>
    </div>
  )
}
