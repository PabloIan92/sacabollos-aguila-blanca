import { ClipboardList, Calendar, Receipt, UserPlus, Package, Users, BarChart2, Mail, type LucideIcon } from 'lucide-react'
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
  { to: '/stock', label: 'Stock', icon: Package, roles: ['dueno', 'recepcion', 'taller'], available: true },
  { to: '/facturacion', label: 'Facturación', icon: Receipt, roles: ['dueno'], available: true },
  { to: '/informes', label: 'Informes', icon: BarChart2, roles: ['dueno'], available: true },
  { to: '/crm', label: 'CRM', icon: Users, roles: ['dueno', 'recepcion'], available: true },
  { to: '/plantillas', label: 'Plantillas', icon: Mail, roles: ['dueno', 'recepcion'], available: true },
  { to: '/invitar', label: 'Invitar', icon: UserPlus, roles: ['dueno', 'recepcion'], available: true },
]

export function navItemsForRole(role: Profile['role']): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role))
}
