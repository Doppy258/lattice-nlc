import type { ReactNode } from 'react'
import type { IconName } from '@/components/common/Icon'
import { Icon } from '@/components/common/Icon'
import type { RequestQuality } from '@/services/requestValidationService'
import styles from '@/pages/create.module.css'

export type PreviewLine = { icon: IconName; text: ReactNode; muted?: boolean }

const QUALITY_LABEL: Record<RequestQuality, string> = {
  strong: 'Strong request',
  weak: 'Could be sharper',
  invalid: 'Needs more detail',
}
const QUALITY_DOT: Record<RequestQuality, string> = {
  strong: styles.qStrong,
  weak: styles.qWeak,
  invalid: styles.qInvalid,
}

/** The live "Your Ping" card: summary, estimated matches, and request quality. */
export function RequestPreview({
  lines,
  estimate,
  quality,
  qualityReasons,
  cta,
}: {
  lines: PreviewLine[]
  estimate: number
  quality: RequestQuality
  qualityReasons: string[]
  cta: ReactNode
}) {
  return (
    <div className={styles.preview}>
      <div className={styles.previewTop}>
        <span className={styles.previewLabel}>Your Ping</span>
        <div className={styles.previewList}>
          {lines.map((line, i) => (
            <div
              key={i}
              className={`${styles.previewItem} ${line.muted ? styles.previewItemMuted : ''}`}
            >
              <Icon name={line.icon} size={16} />
              <span>{line.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.previewMeta}>
        <span className={styles.previewMetaLabel}>
          {quality === 'invalid' ? 'Estimated matches' : 'Estimated matches nearby'}
        </span>
        <span className={styles.previewMatches}>{quality === 'invalid' ? '—' : estimate}</span>
      </div>

      <div className={styles.qualityRow}>
        <span className={`${styles.qualityDot} ${QUALITY_DOT[quality]}`} />
        <span className={styles.qualityText}>{QUALITY_LABEL[quality]}</span>
      </div>
      {qualityReasons.length > 0 && (
        <div className={styles.qualityReasons}>
          {qualityReasons.slice(0, 3).map((r) => (
            <span key={r} className={styles.qualityReason}>
              {r}
            </span>
          ))}
        </div>
      )}

      <div className={styles.ctaWrap}>{cta}</div>
    </div>
  )
}
