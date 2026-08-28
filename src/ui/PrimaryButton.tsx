import { forwardRef, type ButtonHTMLAttributes, type ForwardRefExoticComponent, type RefAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
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
      primary: `
        bg-blue text-white
        hover:bg-blue-hover
        active:bg-navy
        focus-visible:ring-2 focus-visible:ring-blue/30
        disabled:opacity-40 disabled:cursor-not-allowed
      `,
      secondary: `
        bg-steel-100 text-graphite border border-steel-300
        hover:bg-steel-200 hover:border-steel-400
        active:bg-steel-300
        focus-visible:ring-2 focus-visible:ring-steel-400/30
        disabled:opacity-40 disabled:cursor-not-allowed
      `,
      outlined: `
        bg-transparent text-blue border-2 border-blue
        hover:bg-blue-light
        active:bg-blue-container
        focus-visible:ring-2 focus-visible:ring-blue/30
        disabled:opacity-40 disabled:cursor-not-allowed disabled:border-steel-300 disabled:text-steel-500
      `,
      ghost: `
        bg-transparent text-graphite
        hover:bg-steel-100
        active:bg-steel-200
        focus-visible:ring-2 focus-visible:ring-steel-400/30
        disabled:opacity-40 disabled:cursor-not-allowed
      `,
      destructive: `
        bg-red text-white
        hover:bg-red-hover
        active:bg-red-hover
        focus-visible:ring-2 focus-visible:ring-red/30
        disabled:opacity-40 disabled:cursor-not-allowed
      `
    }

    const sizeClasses = {
      sm: 'h-9 px-3 text-label-medium gap-1.5',
      md: 'h-10 px-4 text-label-large gap-2',
      lg: 'h-11 px-5 text-title-small gap-2'
    }

    const iconSizes = { sm: 16, md: 18, lg: 20 }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          font-sans font-semibold
          rounded-lg
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
          <svg className="animate-spin" width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
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

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export const PrimaryButton = ButtonComponent as ForwardRefExoticComponent<PrimaryButtonProps & RefAttributes<HTMLButtonElement>>