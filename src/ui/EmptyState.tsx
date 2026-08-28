import type { LucideIcon } from 'lucide-react'
import { Button } from './PrimaryButton'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  variant = 'default'
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'destructive' }
  illustration?: React.ReactNode
  variant?: 'default' | 'illustrated'
}) {
  if (variant === 'illustrated') {
    return (
      <div className="animate-slide-up text-center" style={{ maxWidth: '360px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div className="mx-auto mb-6" style={{ width: '80px', height: '80px' }}>
          {illustration ? (
            illustration
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-light rounded-2xl">
              <Icon size={40} strokeWidth={2} className="text-blue" />
            </div>
          )}
        </div>
        <h2 className="font-display font-bold text-headline-small text-graphite mb-2">{title}</h2>
        {description && (
          <p className="text-body-medium text-steel-600 mb-6 max-w-sm mx-auto">{description}</p>
        )}
        {action && (
          <Button variant={action.variant || 'secondary'} size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fade-in border-2 border-dashed border-steel-300 rounded-xl bg-steel-50/80" style={{ padding: '2.5rem' }}>
      <Icon size={28} strokeWidth={2} className="text-steel-400 mb-2" />
      <p className="font-sans font-semibold text-body-large text-graphite mb-1">{title}</p>
      {description && <p className="font-sans text-body-medium text-steel-600">{description}</p>}
      {action && (
        <Button variant={action.variant || 'secondary'} size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}