import { forwardRef, type ButtonHTMLAttributes, type ForwardRefExoticComponent, type RefAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'filled',
    size = 'md',
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    className = '',
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    const variantClasses = {
      filled: `
        bg-primary text-on-primary
        hover:bg-primary/90
        active:bg-primary/80
        focus-visible:ring-2 focus-visible:ring-primary/30
        disabled:opacity-38 disabled:cursor-not-allowed
      `,
      tonal: `
        bg-secondary-container text-on-secondary-container
        hover:bg-secondary-container/90
        active:bg-secondary-container/80
        focus-visible:ring-2 focus-visible:ring-secondary/30
        disabled:opacity-38 disabled:cursor-not-allowed
      `,
      outlined: `
        bg-transparent text-primary border border-primary
        hover:bg-primary/10
        active:bg-primary/20
        focus-visible:ring-2 focus-visible:ring-primary/30
        disabled:opacity-38 disabled:cursor-not-allowed disabled:border-outline-variant disabled:text-on-surface-variant
      `,
      text: `
        bg-transparent text-primary
        hover:bg-primary/10
        active:bg-primary/20
        focus-visible:ring-2 focus-visible:ring-primary/30
        disabled:opacity-38 disabled:cursor-not-allowed
      `
    }

    const sizeClasses = {
      sm: 'h-8 px-3 text-label-large gap-1.5',
      md: 'h-10 px-4 text-label-large gap-2',
      lg: 'h-12 px-6 text-label-large gap-2'
    }

    const iconSizes = {
      sm: 16,
      md: 18,
      lg: 20
    }

    const IconSize = iconSizes[size]

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          font-sans font-medium
          rounded-full
          transition-all duration-fast easing-standard
          select-none
          ${variantClasses[variant].trim()}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.trim()}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin"
            width={IconSize}
            height={IconSize}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

ButtonComponent.displayName = 'Button'

export const Button = ButtonComponent as ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>

/* Alias for backwards compatibility */
interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export const PrimaryButton = ButtonComponent as ForwardRefExoticComponent<PrimaryButtonProps & RefAttributes<HTMLButtonElement>>