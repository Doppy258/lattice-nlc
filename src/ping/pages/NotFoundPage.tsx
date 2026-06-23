import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { RadarMark } from '@/components/common/RadarMark'

export function NotFoundPage() {
  return (
    <div style={{ paddingTop: 'var(--sp-8)' }}>
      <EmptyState
        icon={<RadarMark size={64} />}
        title="No signal here"
        action={
          <Link to="/" className="btn btn--primary">
            Back to home
          </Link>
        }
      >
        That page is out of range. Let’s get you back to where the offers are.
      </EmptyState>
    </div>
  )
}
