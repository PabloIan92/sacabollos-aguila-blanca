import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon
  title: string
  body: string
}) {
  return (
    <div
      className="border-2 border-dashed border-steel-300 p-6 flex flex-col items-center text-center gap-2"
      style={{ background: 'rgba(255,255,255,0.72)', color: '#4e5964' }}
    >
      <Icon size={28} strokeWidth={2} />
      <p className="font-sans font-bold">{title}</p>
      <p className="font-sans text-sm">{body}</p>
    </div>
  )
}
