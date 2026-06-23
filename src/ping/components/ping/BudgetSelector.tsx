import type { NeedType } from '@/models'
import { budgetChipsFor } from '@/data/pingConfig'
import styles from '@/pages/create.module.css'

export type BudgetValue = { label: string; min?: number; max?: number; custom?: boolean }

export function BudgetSelector({
  needType,
  value,
  onChange,
}: {
  needType: NeedType
  value?: BudgetValue
  onChange: (value: BudgetValue) => void
}) {
  const chips = budgetChipsFor(needType)
  const isCustom = Boolean(value?.custom)

  return (
    <div>
      <div className={styles.chips}>
        {chips.map((c) => (
          <button
            key={c.label}
            type="button"
            className="chip"
            aria-pressed={!isCustom && value?.label === c.label}
            onClick={() => onChange({ label: c.label, min: c.min, max: c.max })}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          className="chip"
          aria-pressed={isCustom}
          onClick={() => onChange({ label: 'Custom', custom: true, max: value?.max })}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <label className={styles.budgetInput}>
          <span>$</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max budget"
            value={value?.max ?? ''}
            onChange={(e) =>
              onChange({
                label: 'Custom',
                custom: true,
                max: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
            aria-label="Custom maximum budget"
          />
        </label>
      )}
    </div>
  )
}
