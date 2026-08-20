import { forwardRef, type ButtonHTMLAttributes, type ForwardRefExoticComponent, type RefAttributes } from 'react'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

const PrimaryButtonComponent = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ loading, disabled, children, className = '', ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2.5 text-sm font-sans font-semibold
        bg-blue text-white
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-opacity duration-150
        ${className}
      `.trim()}
      {...props}
    >
      {loading ? 'Ingresando…' : children}
    </button>
  )
)

PrimaryButtonComponent.displayName = 'PrimaryButton'

export const PrimaryButton = PrimaryButtonComponent as ForwardRefExoticComponent<PrimaryButtonProps & RefAttributes<HTMLButtonElement>>