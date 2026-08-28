import { NavLink } from 'react-router'
import { navItemsForRole } from '../app/routes'
import type { Profile } from '../auth/AuthProvider'

export function Sidebar({ role }: { role: Profile['role'] }) {
  const items = navItemsForRole(role)

  return (
    <nav
      className="bg-white border-r border-steel-200 flex flex-col shadow-level-1"
      style={{ width: '280px', minWidth: '280px', minHeight: 'calc(100vh - 64px)' }}
      aria-label="Navegación principal"
    >
      <div className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const Icon = item.icon
          const isDisabled = !item.available

          if (isDisabled) {
            return (
              <span
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 text-label-large font-medium text-steel-500 opacity-50 cursor-not-allowed rounded-lg"
                title="Disponible en la próxima entrega"
              >
                <Icon size={22} strokeWidth={2} />
                {item.label}
              </span>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 text-label-large font-medium rounded-lg
                transition-all duration-fast easing-standard
                ${isActive
                  ? 'bg-blue-light text-blue'
                  : 'text-graphite hover:bg-steel-50'}
                focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2
              `}
            >
              <Icon size={22} strokeWidth={2} />
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}