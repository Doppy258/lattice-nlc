import { useEffect, useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { FormError } from '@/components/common/FormError'
import { Icon } from '@/components/common/Icon'
import styles from '@/pages/create.module.css'

const VERIFICATION_CODE = '2468'
const MAX_ATTEMPTS = 3

/**
 * Mock anti-bot step shown before matching (PRD §10.3): agree to a pledge and
 * type the code 2468, with at most three attempts.
 */
export function VerificationModal({
  open,
  onClose,
  onVerified,
}: {
  open: boolean
  onClose: () => void
  onVerified: () => void
}) {
  const [agree, setAgree] = useState(false)
  const [code, setCode] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')

  // Reset whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setAgree(false)
      setCode('')
      setAttempts(0)
      setError('')
    }
  }, [open])

  const locked = attempts >= MAX_ATTEMPTS

  const submit = () => {
    if (!agree) {
      setError('Please confirm you’ll only claim offers you intend to use.')
      return
    }
    if (code.trim() !== VERIFICATION_CODE) {
      const next = attempts + 1
      setAttempts(next)
      setError(
        next >= MAX_ATTEMPTS
          ? 'Too many attempts. Close this and try again.'
          : `That code isn’t right — enter ${VERIFICATION_CODE}. ${MAX_ATTEMPTS - next} attempt${
              MAX_ATTEMPTS - next === 1 ? '' : 's'
            } left.`,
      )
      return
    }
    onVerified()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Anti-bot check"
      title="Quick verification"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={locked}
            iconLeft={<Icon name="shield" size={16} />}
          >
            Verify &amp; match
          </Button>
        </>
      }
    >
      <p className="muted" style={{ marginBottom: 'var(--sp-3)' }}>
        One quick check keeps Ping fair for local businesses.
      </p>

      <label className={styles.verifyCheck}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>I agree to only claim offers I intend to use.</span>
      </label>

      <div className={styles.verifyCode}>
        <label htmlFor="verify-code">
          Enter the code <strong>{VERIFICATION_CODE}</strong>
        </label>
        <input
          id="verify-code"
          className={styles.codeInput}
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={code}
          autoComplete="off"
          disabled={locked}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        <p className={styles.verifyHint}>This stands in for a real bot check in the demo.</p>
      </div>

      <FormError>{error}</FormError>
    </Modal>
  )
}
