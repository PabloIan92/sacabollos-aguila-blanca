import { NavLink } from 'react-router'
import { navItemsForRole } from '../app/routes'
import type { Profile } from '../auth/AuthProvider'

export function Sidebar({ role }: { role: Profile['role'] }) {
  const items = navItemsForRole(role)

  return (
    <nav
      className="bg-navy text-white flex flex-col p-4 gap-1"
      style={{ width: '220px', minWidth: '220px' }}
      aria-label="Navegación principal"
    >
      {items.map((item) => {
        const Icon = item.icon

        if (!item.available) {
          return (
            <span
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-sans font-semibold opacity-40 cursor-not-allowed"
              title="Disponible en la próxima entrega"
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </span>
          )
        }

        return (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-sans font-semibold ${
                isActive ? 'bg-blue' : 'hover:bg-white/10'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
