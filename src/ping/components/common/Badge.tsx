import type { HTMLAttributes } from 'react'

type Tone = 'neutral' | 'signal' | 'emerald' | 'amber' | 'danger' | 'info' | 'outline'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone
}

export function Badge({ tone = 'neutral', className = '', children, ...rest }: BadgeProps) {
  const classes = ['badge', tone !== 'neutral' && `badge--${tone}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}
