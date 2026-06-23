import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
}

/** Friendly empty/zero-data placeholder used across list screens. */
export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="empty">
      {icon}
      <h3>{title}</h3>
      {children && <p className="muted" style={{ maxWidth: '38ch' }}>{children}</p>}
      {action}
    </div>
  )
}
