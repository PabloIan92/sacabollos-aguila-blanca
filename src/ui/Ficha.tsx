import { forwardRef, type HTMLAttributes, type ForwardRefExoticComponent, type RefAttributes } from 'react'

interface FichaProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'outlined'
  interactive?: boolean
}

const FichaComponent = forwardRef<HTMLDivElement, FichaProps>(
  ({ className = '', children, variant = 'elevated', interactive = false, ...props }, ref) => {
    const baseClasses = 'rounded-xl transition-all duration-medium easing-standard'

    const variantClasses = {
      elevated: `
        bg-white shadow-level-2
        hover:shadow-level-3 hover:-translate-y-0.5
        ${interactive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2' : ''}
      `,
      flat: `
        bg-steel-50 border border-steel-200
        hover:bg-steel-100 hover:border-steel-300
        ${interactive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2' : ''}
      `,
      outlined: `
        bg-white border-2 border-steel-300
        hover:border-blue hover:shadow-level-1
        ${interactive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2' : ''}
      `
    }

    const interactiveActive = interactive ? 'active:scale-[0.99] active:shadow-level-1' : ''

    return (
      <div
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant].trim()}
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