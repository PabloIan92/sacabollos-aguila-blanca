import type { ReactNode } from 'react'
import { Ficha } from './Ficha'

export function FullScreenError({
  title,
  body,
  actions,
}: {
  title: string
  body: string
  actions: ReactNode
}) {
  return (
    <div style={{ padding: '2rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ficha style={{ width: '100%', maxWidth: '400px' }}>
        <p className="font-mono text-xs uppercase tracking-wide text-red mb-2">Error</p>
        <h1 className="font-display text-xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-graphite mb-4">{body}</p>
        <div className="flex gap-2">{actions}</div>
      </Ficha>
    </div>
  )
}
