import { ClipboardList, Calendar, Receipt, UserPlus, type LucideIcon } from 'lucide-react'
import type { Profile } from '../auth/AuthProvider'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: Array<Profile['role']>
  available: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Casos', icon: ClipboardList, roles: ['dueno', 'taller'], available: true },
  { to: '/', label: 'Turnos', icon: Calendar, roles: ['recepcion'], available: true },
  { to: '/casos', label: 'Casos', icon: ClipboardList, roles: ['recepcion'], available: true },
  { to: '/facturacion', label: 'Facturación', icon: Receipt, roles: ['dueno'], available: false },
  { to: '/invitar', label: 'Invitar', icon: UserPlus, roles: ['dueno', 'recepcion'], available: false },
]

export function navItemsForRole(role: Profile['role']): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role))
}
