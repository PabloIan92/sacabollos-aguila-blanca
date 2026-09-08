import { forwardRef, type HTMLAttributes, type ForwardRefExoticComponent, type RefAttributes } from 'react'

interface FichaProps extends HTMLAttributes<HTMLDivElement> {}

const FichaComponent = forwardRef<HTMLDivElement, FichaProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`
        bg-white border-2 border-graphite shadow-[6px_6px_0_rgba(27,29,33,0.08)]
        p-4 ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  )
)

FichaComponent.displayName = 'Ficha'

export const Ficha = FichaComponent as ForwardRefExoticComponent<FichaProps & RefAttributes<HTMLDivElement>>