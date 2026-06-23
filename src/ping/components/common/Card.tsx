import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  pad?: 'md' | 'lg'
  flush?: boolean
}

/** The base surface for offers, businesses, claims, reports, and saved items. */
export function Card({ pad = 'md', flush = false, className = '', children, ...rest }: CardProps) {
  const classes = ['card', pad === 'lg' && 'card--pad-lg', flush && 'card--flush', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
