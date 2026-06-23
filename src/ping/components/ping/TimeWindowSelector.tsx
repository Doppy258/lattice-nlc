import { TIME_PRESETS, type TimePresetKey } from '@/data/pingConfig'
import styles from '@/pages/create.module.css'

export type CustomTime = { date: string; start: string; end: string }

export function TimeWindowSelector({
  preset,
  custom,
  onPreset,
  onCustom,
}: {
  preset?: TimePresetKey
  custom: CustomTime
  onPreset: (key: TimePresetKey) => void
  onCustom: (custom: CustomTime) => void
}) {
  return (
    <div>
      <div className={styles.chips}>
        {TIME_PRESETS.map((t) => (
          <button
            key={t.key}
            type="button"
            className="chip"
            aria-pressed={preset === t.key}
            onClick={() => onPreset(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className={styles.customRow}>
          <div className={styles.customField}>
            <label htmlFor="ping-date">Date</label>
            <input
              id="ping-date"
              className={styles.input}
              type="date"
              value={custom.date}
              onChange={(e) => onCustom({ ...custom, date: e.target.value })}
            />
          </div>
          <div className={styles.customField}>
            <label htmlFor="ping-start">Start</label>
            <input
              id="ping-start"
              className={styles.input}
              type="time"
              value={custom.start}
              onChange={(e) => onCustom({ ...custom, start: e.target.value })}
            />
          </div>
          <div className={styles.customField}>
            <label htmlFor="ping-end">End</label>
            <input
              id="ping-end"
              className={styles.input}
              type="time"
              value={custom.end}
              onChange={(e) => onCustom({ ...custom, end: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
