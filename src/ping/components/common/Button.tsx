import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ink' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  block?: boolean
  /** Adds the radar "ping" pulse — reserve for the single primary CTA. */
  pulse?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  pulse = false,
  iconLeft,
  iconRight,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    pulse && 'btn--pulse',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}
