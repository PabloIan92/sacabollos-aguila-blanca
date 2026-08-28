import { NavLink } from 'react-router'
import { navItemsForRole } from '../app/routes'
import type { Profile } from '../auth/AuthProvider'

export function Sidebar({ role }: { role: Profile['role'] }) {
  const items = navItemsForRole(role)

  return (
    <nav
      className="bg-surface-container border-r border-outline flex flex-col"
      style={{ width: '288px', minWidth: '288px', minHeight: 'calc(100vh - 72px)' }}
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
                className="flex items-center gap-3 px-3 py-2.5 text-label-large font-medium text-on-surface-variant opacity-50 cursor-not-allowed rounded-md"
                title="Disponible en la próxima entrega"
              >
                <Icon size={24} strokeWidth={2} />
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
                flex items-center gap-3 px-3 py-2.5 text-label-large font-medium rounded-md
                transition-colors duration-fast easing-standard
                ${isActive
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface hover:bg-surface-container-high'}
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              `}
            >
              <Icon size={24} strokeWidth={2} />
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}