import { useMemo, useState } from 'react'
import type { BusinessCategory } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { BusinessCard } from '@/components/businesses/BusinessCard'
import { CATEGORIES } from '@/data/pingConfig'
import { haversineKm } from '@/utils/distance'
import styles from './explore.module.css'

export function ExplorePage() {
  const { user } = useSession()
  const db = useDatabase()
  const now = Date.now()
  const origin = db.locations.find((l) => l.id === user.homeLocationId)?.point ?? db.locations[0]?.point

  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<'all' | BusinessCategory>('all')
  const [minRating, setMinRating] = useState(0)
  const [maxDist, setMaxDist] = useState(0) // 0 = any
  const [sort, setSort] = useState('rating')

  // Active-deal counts and save counts per business.
  const dealCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of db.offers) {
      if (o.active && new Date(o.validFrom).getTime() <= now && new Date(o.validUntil).getTime() >= now) {
        map.set(o.businessId, (map.get(o.businessId) ?? 0) + 1)
      }
    }
    return map
  }, [db.offers, now])

  const saveCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of db.savedBusinesses) map.set(s.businessId, (map.get(s.businessId) ?? 0) + 1)
    return map
  }, [db.savedBusinesses])

  const distanceTo = (bizId: string): number | null => {
    const b = db.businesses.find((x) => x.id === bizId)
    return b && origin ? haversineKm(origin, b.location) : null
  }

  const results = db.businesses
    .filter((b) => {
      if (cat !== 'all' && b.category !== cat) return false
      if (b.ratingAverage < minRating) return false
      if (maxDist > 0) {
        const d = distanceTo(b.id)
        if (d != null && d > maxDist) return false
      }
      if (query.trim()) {
        const q = query.toLowerCase()
        const hay = `${b.name} ${b.description} ${b.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sort) {
        case 'reviews':
          return b.reviewCount - a.reviewCount
        case 'closest':
          return (distanceTo(a.id) ?? 1e9) - (distanceTo(b.id) ?? 1e9)
        case 'saved':
          return (saveCounts.get(b.id) ?? 0) - (saveCounts.get(a.id) ?? 0)
        case 'deals':
          return (dealCounts.get(b.id) ?? 0) - (dealCounts.get(a.id) ?? 0)
        case 'alpha':
          return a.name.localeCompare(b.name)
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return b.ratingAverage - a.ratingAverage
      }
    })

  return (
    <div>
      <PageHeader
        eyebrow="Explore"
        title="Explore businesses"
        description="Browse every local business by category, rating, distance, and deals."
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search businesses, tags, or what they offer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search businesses"
          />
        </div>
        <div className={styles.filters}>
          <select className={styles.select} value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.category} value={c.category}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            aria-label="Minimum rating"
          >
            <option value={0}>Any rating</option>
            <option value={3}>3.0+</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
          <select
            className={styles.select}
            value={maxDist}
            onChange={(e) => setMaxDist(Number(e.target.value))}
            aria-label="Maximum distance"
          >
            <option value={0}>Any distance</option>
            <option value={1}>Within 1 km</option>
            <option value={3}>Within 3 km</option>
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
          </select>
          <select
            className={`${styles.select} ${styles.spacer}`}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort by"
          >
            <option value="rating">Highest rating</option>
            <option value="reviews">Most reviews</option>
            <option value="closest">Closest</option>
            <option value="saved">Most saved</option>
            <option value="deals">Active deals</option>
            <option value="alpha">Alphabetical</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      <p className={styles.count}>
        <b>{results.length}</b> {results.length === 1 ? 'business' : 'businesses'}
      </p>

      {results.length === 0 ? (
        <EmptyState icon={<Icon name="search" size={40} />} title="No businesses found">
          Try clearing a filter or searching for something else.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {results.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              distanceKm={distanceTo(b.id)}
              activeDeals={dealCounts.get(b.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
