import { useState } from 'react'
import type { BusinessCategory, Offer, OfferType } from '@/models'
import { Button } from '@/components/common/Button'
import { FormError } from '@/components/common/FormError'
import { CATEGORIES } from '@/data/pingConfig'
import { OFFER_TYPE_LABELS } from '@/utils/formatting'
import {
  OFFER_DESC_MAX,
  OFFER_TITLE_MAX,
  validateOffer,
  type OfferDraft,
} from '@/services/businessService'
import { shift } from '@/utils/dateTime'
import styles from '@/pages/business.module.css'

const OFFER_TYPES = Object.keys(OFFER_TYPE_LABELS) as OfferType[]

/** Format an ISO string as the value a <input type="datetime-local"> expects. */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function OfferForm({
  defaultCategory,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultCategory: BusinessCategory
  initial?: Offer
  submitLabel: string
  onSubmit: (draft: OfferDraft) => void
  onCancel?: () => void
}) {
  const now = new Date()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [category, setCategory] = useState<BusinessCategory>(initial?.category ?? defaultCategory)
  const [offerType, setOfferType] = useState<OfferType>(initial?.offerType ?? 'discount')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [originalPrice, setOriginalPrice] = useState(initial?.originalPrice ? String(initial.originalPrice) : '')
  const [validFrom, setValidFrom] = useState(toLocalInput(initial?.validFrom ?? now.toISOString()))
  const [validUntil, setValidUntil] = useState(
    toLocalInput(initial?.validUntil ?? shift(now, { days: 30 }).toISOString()),
  )
  const [maxClaims, setMaxClaims] = useState(initial ? String(initial.maxClaims) : '25')
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '')
  const [studentOnly, setStudentOnly] = useState(initial?.studentOnly ?? false)
  const [verificationRequired, setVerificationRequired] = useState(initial?.verificationRequired ?? false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = () => {
    const draft: OfferDraft = {
      title,
      category,
      offerType,
      description,
      price: price === '' ? NaN : Number(price),
      originalPrice: originalPrice === '' ? undefined : Number(originalPrice),
      validFrom: validFrom ? new Date(validFrom).toISOString() : '',
      validUntil: validUntil ? new Date(validUntil).toISOString() : '',
      maxClaims: maxClaims === '' ? NaN : Number(maxClaims),
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      studentOnly,
      verificationRequired,
    }
    const v = validateOffer(draft)
    if (!v.valid) {
      setErrors(Object.fromEntries(v.errors.map((e) => [e.field, e.message])))
      return
    }
    setErrors({})
    onSubmit(draft)
  }

  return (
    <div className={styles.form}>
      <div className={styles.field + ' ' + styles['field--full']}>
        <label className={styles.label} htmlFor="of-title">
          Offer title
        </label>
        <input
          id="of-title"
          className={styles.input}
          maxLength={OFFER_TITLE_MAX}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Student lunch bowl"
        />
        <FormError>{errors.title}</FormError>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="of-cat">
            Category
          </label>
          <select id="of-cat" className={styles.selectField} value={category} onChange={(e) => setCategory(e.target.value as BusinessCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c.category} value={c.category}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="of-type">
            Offer type
          </label>
          <select id="of-type" className={styles.selectField} value={offerType} onChange={(e) => setOfferType(e.target.value as OfferType)}>
            {OFFER_TYPES.map((t) => (
              <option key={t} value={t}>
                {OFFER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="of-desc">
          Description
        </label>
        <textarea
          id="of-desc"
          className={styles.textarea}
          maxLength={OFFER_DESC_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's included?"
        />
        <FormError>{errors.description}</FormError>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="of-price">
            Price ($)
          </label>
          <input id="of-price" className={styles.input} type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          <FormError>{errors.price}</FormError>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="of-orig">
            Original price ($) — optional
          </label>
          <input id="of-orig" className={styles.input} type="number" min={0} step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
          <FormError>{errors.originalPrice}</FormError>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="of-from">
            Starts
          </label>
          <input id="of-from" className={styles.input} type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="of-until">
            Ends
          </label>
          <input id="of-until" className={styles.input} type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
      </div>
      <FormError>{errors.dates}</FormError>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="of-max">
            Max claims
          </label>
          <input id="of-max" className={styles.input} type="number" min={1} value={maxClaims} onChange={(e) => setMaxClaims(e.target.value)} />
          <FormError>{errors.maxClaims}</FormError>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="of-tags">
            Tags (comma-separated)
          </label>
          <input id="of-tags" className={styles.input} value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="good value, student-friendly" />
        </div>
      </div>

      <div className={styles.toggleRow}>
        <label className={styles.toggle}>
          <input type="checkbox" checked={studentOnly} onChange={(e) => setStudentOnly(e.target.checked)} />
          Student discount
        </label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={verificationRequired} onChange={(e) => setVerificationRequired(e.target.checked)} />
          Verification required
        </label>
      </div>

      <div className={styles.formActions}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" onClick={submit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
