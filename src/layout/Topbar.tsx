import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../auth/AuthProvider'
import { Button } from '../ui/PrimaryButton'
import { LogOut, Search, User, ChevronDown } from 'lucide-react'

const ROLE_LABELS: Record<Profile['role'], string> = {
  dueno: 'Dueño',
  recepcion: 'Recepción',
  taller: 'Taller',
}

const ROLE_ICONS: Record<Profile['role'], React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  dueno: User,
  recepcion: User,
  taller: User,
}

export function Topbar({ profile }: { profile: Profile }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const RoleIcon = ROLE_ICONS[profile.role]

  return (
    <header className="sticky top-0 z-nav h-16 bg-white/95 backdrop-blur-sm border-b border-steel-200 shadow-level-1 flex items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img
          src="/assets/logo-aguila-blanca.jpg"
          alt=""
          className="bg-steel-100 border border-steel-300 rounded-lg object-contain flex-shrink-0"
          style={{ width: '40px', height: '40px' }}
        />
        <h1 className="font-display font-bold uppercase text-headline-small hidden sm:block text-graphite">
          Aguila Blanca
        </h1>
        <h1 className="font-display font-bold uppercase text-title-large sm:hidden text-graphite">
          Aguila Blanca
        </h1>
      </div>

      <div className="flex items-center justify-end gap-2 flex-shrink-0">
        <div className="relative hidden sm:block">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Search size={18} />}
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Buscar"
            className="text-steel-600 hover:bg-steel-100"
          >
            Buscar
          </Button>
          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 animate-scale-in">
              <div className="bg-white shadow-level-4 rounded-lg border border-steel-200 overflow-hidden">
                <input
                  type="search"
                  placeholder="Buscar casos, clientes..."
                  className="w-full px-3 py-2 text-body-medium border-0 outline-none bg-transparent"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        <span className="hidden sm:flex items-center px-2.5 py-1 text-label-medium font-medium bg-blue-light text-blue rounded-full">
          {ROLE_LABELS[profile.role]}
        </span>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-steel-100 transition-colors duration-fast"
            aria-label="Menú de usuario"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 rounded-full bg-blue-light text-blue flex items-center justify-center flex-shrink-0">
              <RoleIcon size={20} strokeWidth={2} />
            </div>
            <span className="hidden sm:block text-body-medium font-medium text-graphite truncate max-w-[140px]">
              {profile.full_name}
            </span>
            <ChevronDown size={16} strokeWidth={2} className="text-steel-500" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 animate-scale-in">
              <div className="bg-white shadow-level-4 rounded-lg border border-steel-200 overflow-hidden py-1">
                <div className="px-3 py-2 border-b border-steel-200">
                  <p className="text-label-medium font-medium text-graphite">{profile.full_name}</p>
                  <p className="text-label-small text-steel-500 capitalize">{ROLE_LABELS[profile.role]}</p>
                </div>
                <button
                  onClick={() => { supabase.auth.signOut(); setUserMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-body-medium text-graphite hover:bg-steel-50 rounded-none"
                >
                  <LogOut size={18} strokeWidth={2} className="text-steel-500" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}