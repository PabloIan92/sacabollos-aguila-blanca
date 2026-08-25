import { NavLink } from 'react-router'
import { navItemsForRole } from '../app/routes'
import type { Profile } from '../auth/AuthProvider'

export function BottomTabBar({ role }: { role: Profile['role'] }) {
  const items = navItemsForRole(role)

  return (
    <nav
      className="bg-navy text-white flex items-stretch overflow-x-auto"
      style={{ height: '56px' }}
      aria-label="Navegación principal"
    >
      {items.map((item) => {
        const Icon = item.icon

        if (!item.available) {
          return (
            <span
              key={item.label}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[110px] text-xs font-sans font-semibold opacity-40 cursor-not-allowed"
              style={{ minHeight: '44px', minWidth: '44px' }}
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
              `flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[110px] text-xs font-sans font-semibold ${
                isActive ? 'bg-blue' : ''
              }`
            }
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Icon size={18} strokeWidth={2} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
