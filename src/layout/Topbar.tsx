import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../auth/AuthProvider'
import { Button } from '../ui/PrimaryButton'
import { Menu, LogOut, Search, User } from 'lucide-react'

const ROLE_LABELS: Record<Profile['role'], string> = {
  dueno: 'Dueño',
  recepcion: 'Recepción',
  taller: 'Taller',
}

export function Topbar({ profile }: { profile: Profile }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-nav h-16 sm:h-18 bg-surface/80 backdrop-blur-sm border-b border-outline flex items-center justify-between gap-4 px-4 sm:px-6"
      style={{ minHeight: '72px' }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img
          src="/assets/logo-aguila-blanca.jpg"
          alt=""
          className="bg-surface-container border border-outline rounded-lg object-contain flex-shrink-0"
          style={{ width: '40px', height: '40px' }}
        />
        <h1 className="font-display font-bold uppercase text-headline-small hidden sm:block">
          Aguila Blanca
        </h1>
        <h1 className="font-display font-bold uppercase text-title-large sm:hidden">
          Aguila Blanca
        </h1>
      </div>

      <div className="flex items-center justify-end gap-2 flex-shrink-0">
        <div className="relative hidden sm:block">
          <Button
            variant="text"
            size="sm"
            leftIcon={<Search size={20} />}
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Buscar"
            className="text-on-surface-variant hover:bg-surface-container"
          >
            Buscar
          </Button>
          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 animate-scale-in">
              <div className="bg-surface shadow-elevation-3 rounded-lg border border-outline overflow-hidden">
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

        <span className="hidden sm:flex items-center px-2.5 py-1 text-label-medium font-medium bg-primary-container text-on-primary-container rounded-full">
          {ROLE_LABELS[profile.role]}
        </span>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container transition-colors duration-fast"
            aria-label="Menú de usuario"
            aria-expanded={userMenuOpen}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
              <User size={20} strokeWidth={2} />
            </div>
            <span className="hidden sm:block text-body-medium font-medium text-on-surface truncate max-w-[140px]">
              {profile.full_name}
            </span>
            <Menu size={18} strokeWidth={2} className="text-on-surface-variant" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 animate-scale-in">
              <div className="bg-surface shadow-elevation-3 rounded-lg border border-outline overflow-hidden py-1">
                <div className="px-3 py-2 border-b border-outline-variant">
                  <p className="text-label-medium font-medium text-on-surface">{profile.full_name}</p>
                  <p className="text-label-small text-on-surface-variant capitalize">{ROLE_LABELS[profile.role]}</p>
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-body-medium text-on-surface hover:bg-surface-container rounded-none"
                >
                  <LogOut size={18} strokeWidth={2} />
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