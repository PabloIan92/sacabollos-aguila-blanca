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
  action?: { label: string; onClick: () => void; variant?: 'filled' | 'tonal' | 'outlined' | 'text' }
  illustration?: React.ReactNode
  variant?: 'default' | 'warm'
}) {
  if (variant === 'warm') {
    return (
      <div
        className="animate-slide-up max-w-md mx-auto text-center"
        style={{ padding: '3rem 2rem' }}
      >
        <div className="mx-auto mb-6" style={{ width: '96px', height: '96px' }}>
          {illustration ? (
            illustration
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-container rounded-full">
              <Icon size={48} strokeWidth={2} className="text-on-primary-container" />
            </div>
          )}
        </div>
        <h2 className="font-display text-headline-small font-bold text-on-surface mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-body-medium text-on-surface-variant mb-6 max-w-sm mx-auto">
            {description}
          </p>
        )}
        {action && (
          <Button
            variant={action.variant || 'tonal'}
            size="md"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className="animate-fade-in border-2 border-dashed border-outline-variant rounded-xl"
      style={{ background: 'rgba(255,255,255,0.72)', color: '#4e5964', padding: '2.5rem' }}
    >
      <Icon size={28} strokeWidth={2} className="mb-2" />
      <p className="font-sans font-semibold text-body-large mb-1">{title}</p>
      {description && <p className="font-sans text-body-medium">{description}</p>}
      {action && (
        <Button
          variant={action.variant || 'tonal'}
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}