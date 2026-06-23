import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BusinessCategory, NeedType, PingRequest } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { FormError } from '@/components/common/FormError'
import { CategorySelector } from '@/components/ping/CategorySelector'
import { NeedTypeSelector } from '@/components/ping/NeedTypeSelector'
import { BudgetSelector, type BudgetValue } from '@/components/ping/BudgetSelector'
import { DistanceSelector } from '@/components/ping/DistanceSelector'
import { TimeWindowSelector, type CustomTime } from '@/components/ping/TimeWindowSelector'
import { PreferenceChips } from '@/components/ping/PreferenceChips'
import { RequestPreview, type PreviewLine } from '@/components/ping/RequestPreview'
import { VerificationModal } from '@/components/ping/VerificationModal'
import { PREFERENCES, presetWindow, type TimePresetKey } from '@/data/pingConfig'
import {
  detectDuplicateRequest,
  getRequestQuality,
  validateBudgetForNeedType,
  validatePingRequest,
  validateTimeWindow,
  type PingDraft,
  type SimpleCheck,
} from '@/services/requestValidationService'
import { estimateMatchCount } from '@/services/offerMatchingService'
import { getCollection, updateCollection } from '@/services/storageService'
import { makeId } from '@/utils/ids'
import { formatTime } from '@/utils/dateTime'
import { categoryLabel, needTypeLabel } from '@/utils/formatting'
import styles from './create.module.css'

const PREF_LABEL: Record<string, string> = Object.fromEntries(PREFERENCES.map((p) => [p.key, p.label]))

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export function CreatePingPage() {
  const { user, setVerifiedHuman } = useSession()
  const db = useDatabase()
  const navigate = useNavigate()

  const [category, setCategory] = useState<BusinessCategory>()
  const [needType, setNeedType] = useState<NeedType>()
  const [budget, setBudget] = useState<BudgetValue>()
  const [distanceKm, setDistanceKm] = useState(3)
  const [timePreset, setTimePreset] = useState<TimePresetKey>()
  const [customTime, setCustomTime] = useState<CustomTime>({ date: '', start: '', end: '' })
  const [preferences, setPreferences] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const origin =
    db.locations.find((l) => l.id === user.homeLocationId)?.point ?? db.locations[0]?.point

  /* ── Resolve the active time window ─────────────────────────────────── */
  const now = new Date()
  let timeWindow: { start: string; end: string } | null = null
  if (timePreset && timePreset !== 'custom') {
    timeWindow = presetWindow(timePreset, now)
  } else if (timePreset === 'custom' && customTime.date && customTime.start && customTime.end) {
    timeWindow = {
      start: new Date(`${customTime.date}T${customTime.start}`).toISOString(),
      end: new Date(`${customTime.date}T${customTime.end}`).toISOString(),
    }
  }

  const draft: PingDraft = {
    category,
    needType,
    budgetMin: budget?.custom ? undefined : budget?.min,
    budgetMax: budget?.max,
    distanceKm,
    timeStart: timeWindow?.start,
    timeEnd: timeWindow?.end,
    preferences,
    optionalNote: note,
  }

  const validation = validatePingRequest(draft)
  const quality = getRequestQuality(draft)
  const estimate = origin
    ? estimateMatchCount(draft, db.offers, db.businesses, user, origin, now)
    : 0

  const budgetCheck: SimpleCheck = needType
    ? validateBudgetForNeedType(needType, budget?.max)
    : { valid: true }
  const timeCheck: SimpleCheck =
    timePreset === 'custom' ? validateTimeWindow(timeWindow?.start, timeWindow?.end) : { valid: true }

  /* ── Handlers (reset dependent fields on change) ────────────────────── */
  const pickCategory = (c: BusinessCategory) => {
    setCategory(c)
    setNeedType(undefined)
    setBudget(undefined)
    setPreferences([])
    setSubmitError('')
  }
  const pickNeed = (n: NeedType) => {
    setNeedType(n)
    setBudget(undefined)
    setSubmitError('')
  }
  const togglePref = (key: string) =>
    setPreferences((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const handleFindMatches = () => {
    if (!validation.valid) {
      setSubmitError('Add a category, need, distance, and a valid time window first.')
      scrollTo('sec-category')
      return
    }
    const dup = detectDuplicateRequest(user.id, draft, db.pingRequests, now)
    if (!dup.valid) {
      setSubmitError(dup.message ?? 'Duplicate request.')
      return
    }
    setSubmitError('')
    setVerifyOpen(true)
  }

  const handleVerified = () => {
    const request: PingRequest = {
      id: makeId('ping'),
      userId: user.id,
      category: category!,
      needType: needType!,
      budgetMin: draft.budgetMin,
      budgetMax: draft.budgetMax,
      distanceKm,
      timeStart: timeWindow!.start,
      timeEnd: timeWindow!.end,
      preferences,
      optionalNote: note.trim() || undefined,
      verifiedHuman: true,
      status: 'matched',
      createdAt: new Date().toISOString(),
    }
    updateCollection('pingRequests', [...getCollection('pingRequests'), request])
    setVerifiedHuman(true)
    setVerifyOpen(false)
    navigate('/matches')
  }

  /* ── Preview lines ──────────────────────────────────────────────────── */
  const budgetLabel = budget
    ? budget.custom
      ? budget.max !== undefined
        ? `Under $${budget.max}`
        : 'Custom budget'
      : budget.label
    : 'Any price'
  const timeLabel = timeWindow
    ? `${formatTime(new Date(timeWindow.start))}–${formatTime(new Date(timeWindow.end))}`
    : 'a time'
  const prefLabels = preferences.map((p) => PREF_LABEL[p]).filter(Boolean)

  const lines: PreviewLine[] = [
    {
      icon: 'target',
      text: needType ? (
        <>
          <b>{needTypeLabel(needType)}</b> · {categoryLabel(category!)}
        </>
      ) : (
        'What you need'
      ),
      muted: !needType,
    },
    { icon: 'ticket', text: <b>{budgetLabel}</b>, muted: !budget },
    { icon: 'location', text: <>Within <b>{distanceKm} km</b></> },
    {
      icon: 'clock',
      text: timeWindow ? <b>{timeLabel}</b> : 'Choose a time',
      muted: !timeWindow,
    },
    {
      icon: 'sparkle',
      text:
        prefLabels.length > 0
          ? prefLabels.slice(0, 2).join(', ') + (prefLabels.length > 2 ? ` +${prefLabels.length - 2}` : '')
          : 'No preferences',
      muted: prefLabels.length === 0,
    },
  ]

  const Slot = ({ id, filled, children }: { id: string; filled: boolean; children: React.ReactNode }) => (
    <button type="button" className={`${styles.slot} ${filled ? styles.slotFilled : ''}`} onClick={() => scrollTo(id)}>
      {children}
    </button>
  )

  const cta = (
    <div className="stack" style={{ gap: 'var(--sp-2)' }}>
      <Button
        variant="primary"
        block
        pulse={validation.valid}
        disabled={!validation.valid}
        onClick={handleFindMatches}
        iconRight={<Icon name="arrowRight" size={18} />}
      >
        Find Matching Offers
      </Button>
      <FormError>{submitError}</FormError>
    </div>
  )

  return (
    <div>
      <PageHeader
        eyebrow="Create"
        title="Create a Ping"
        description="Describe what you need with a few structured choices — Ping turns it into a ranked list of local offers."
      />

      <div className={styles.page}>
        <div className={styles.builder}>
          <p className={styles.sentence}>
            I need{' '}
            <Slot id="sec-category" filled={!!category}>
              {category ? categoryLabel(category).toLowerCase() : 'something'}
            </Slot>{' '}
            for{' '}
            <Slot id="sec-need" filled={!!needType}>
              {needType ? needTypeLabel(needType).toLowerCase() : 'a need'}
            </Slot>{' '}
            within{' '}
            <Slot id="sec-distance" filled>
              {distanceKm} km
            </Slot>{' '}
            around{' '}
            <Slot id="sec-time" filled={!!timeWindow}>
              {timePreset && timePreset !== 'custom' ? timeLabel : timeWindow ? timeLabel : 'a time'}
            </Slot>{' '}
            for{' '}
            <Slot id="sec-budget" filled={!!budget}>
              {budget ? budgetLabel.toLowerCase() : 'any price'}
            </Slot>
            .
          </p>

          <section id="sec-category" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.sectionTitle}>Category</span>
            </div>
            <CategorySelector value={category} onChange={pickCategory} />
          </section>

          {category && (
            <section id="sec-need" className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.stepNum}>2</span>
                <span className={styles.sectionTitle}>What do you need?</span>
              </div>
              <NeedTypeSelector category={category} value={needType} onChange={pickNeed} />
            </section>
          )}

          {needType && (
            <section id="sec-budget" className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.stepNum}>3</span>
                <span className={styles.sectionTitle}>Budget</span>
                <span className={styles.sectionHint}>optional</span>
              </div>
              <BudgetSelector needType={needType} value={budget} onChange={setBudget} />
              {!budgetCheck.valid && <FormError>{budgetCheck.message}</FormError>}
            </section>
          )}

          <section id="sec-distance" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.stepNum}>4</span>
              <span className={styles.sectionTitle}>Distance</span>
              <span className={styles.sectionHint}>
                from {db.locations.find((l) => l.id === user.homeLocationId)?.label ?? 'you'}
              </span>
            </div>
            <DistanceSelector value={distanceKm} onChange={setDistanceKm} />
          </section>

          <section id="sec-time" className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.stepNum}>5</span>
              <span className={styles.sectionTitle}>Time window</span>
            </div>
            <TimeWindowSelector
              preset={timePreset}
              custom={customTime}
              onPreset={setTimePreset}
              onCustom={setCustomTime}
            />
            {!timeCheck.valid && <FormError>{timeCheck.message}</FormError>}
          </section>

          {category && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.stepNum}>6</span>
                <span className={styles.sectionTitle}>Preferences</span>
                <span className={styles.sectionHint}>optional</span>
              </div>
              <PreferenceChips category={category} value={preferences} onToggle={togglePref} />
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.stepNum}>7</span>
              <span className={styles.sectionTitle}>Anything else?</span>
              <span className={styles.sectionHint}>optional</span>
            </div>
            <textarea
              className={styles.note}
              maxLength={120}
              placeholder="Example: need outlets and a quiet table"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className={styles.noteFoot}>{note.length}/120</div>
          </section>
        </div>

        <aside className={styles.aside}>
          <RequestPreview
            lines={lines}
            estimate={estimate}
            quality={quality.quality}
            qualityReasons={quality.reasons}
            cta={cta}
          />
        </aside>
      </div>

      <div className={styles.mobileBar}>
        <div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
            {quality.quality === 'invalid' ? '—' : estimate} matches
          </div>
          <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>estimated nearby</div>
        </div>
        <Button
          variant="primary"
          pulse={validation.valid}
          disabled={!validation.valid}
          onClick={handleFindMatches}
          iconRight={<Icon name="arrowRight" size={16} />}
        >
          Find offers
        </Button>
      </div>

      <VerificationModal open={verifyOpen} onClose={() => setVerifyOpen(false)} onVerified={handleVerified} />
    </div>
  )
}
