import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../auth/AuthProvider'

const ROLE_LABELS: Record<Profile['role'], string> = {
  dueno: 'Dueño',
  recepcion: 'Recepción',
  taller: 'Taller',
}

export function Topbar({ profile }: { profile: Profile }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <header
      className="flex items-center justify-between gap-4 bg-navy text-white"
      style={{ minHeight: '76px', padding: '12px clamp(16px, 4vw, 42px)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/assets/logo-aguila-blanca.jpg"
          alt=""
          className="border-2 border-steel-300 bg-white object-contain"
          style={{ width: '48px', height: '48px' }}
        />
        <h1
          className="font-display uppercase m-0"
          style={{ fontSize: 'clamp(1.1rem, 3vw, 1.55rem)', lineHeight: 1 }}
        >
          Aguila Blanca
        </h1>
      </div>

      <div className="flex items-center justify-end gap-2.5 flex-wrap">
        <span className="font-mono text-xs border border-white/35 bg-white/10 px-2.5 py-2">
          {ROLE_LABELS[profile.role]}
        </span>

        {confirming ? (
          <div className="flex items-center gap-2 font-sans text-sm">
            <span>¿Cerrar sesión de {profile.full_name}?</span>
            <button
              className="font-semibold underline"
              onClick={() => supabase.auth.signOut()}
            >
              Cerrar sesión
            </button>
            <button className="opacity-80" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button
            className="border border-white/32 bg-transparent text-white font-semibold px-2.5 py-2"
            onClick={() => setConfirming(true)}
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </header>
  )
}
