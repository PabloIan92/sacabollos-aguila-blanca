import { forwardRef, type HTMLAttributes, type ForwardRefExoticComponent, type RefAttributes } from 'react'

interface FichaProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined'
  elevation?: 0 | 1 | 2 | 3 | 4 | 5
  interactive?: boolean
}

const FichaComponent = forwardRef<HTMLDivElement, FichaProps>(
  ({ className = '', children, variant = 'elevated', elevation = 1, interactive = false, ...props }, ref) => {
    const baseClasses = 'rounded-lg transition-all duration-medium easing-standard'

    const variantClasses = {
      elevated: `
        bg-surface shadow-elevation-1
        hover:shadow-elevation-2 hover:-translate-y-0.5
        ${interactive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2' : ''}
      `,
      filled: `
        bg-surface-container-high
        hover:bg-surface-container-highest
        ${interactive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2' : ''}
      `,
      outlined: `
        bg-surface border border-outline
        hover:bg-surface-container hover:border-outline-variant
        ${interactive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2' : ''}
      `
    }

    const elevationClasses = {
      0: 'shadow-none',
      1: 'shadow-elevation-1',
      2: 'shadow-elevation-2',
      3: 'shadow-elevation-3',
      4: 'shadow-elevation-4',
      5: 'shadow-elevation-5'
    }

    const interactiveActive = interactive ? 'active:scale-[0.99] active:shadow-elevation-1' : ''

    return (
      <div
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant].trim()}
          ${elevationClasses[elevation]}
          ${interactiveActive}
          p-4 sm:p-6
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </div>
    )
  }
)

FichaComponent.displayName = 'Ficha'

export const Ficha = FichaComponent as ForwardRefExoticComponent<FichaProps & RefAttributes<HTMLDivElement>>