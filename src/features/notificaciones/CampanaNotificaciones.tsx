import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotificaciones } from './notificacionesContext'

function getTiempoRelativo(date: Date) {
  const ahora = new Date()
  const difMs = ahora.getTime() - date.getTime()
  const difMin = Math.floor(difMs / 60000)
  
  if (difMin < 1) return 'hace un momento'
  if (difMin < 60) return `hace ${difMin} min`
  const difHoras = Math.floor(difMin / 60)
  if (difHoras < 24) return `hace ${difHoras} hs`
  const difDias = Math.floor(difHoras / 24)
  return `hace ${difDias} d`
}

export function CampanaNotificaciones() {
  const { notificaciones, sinLeer, marcarTodasLeidas, marcarLeida } = useNotificaciones()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const ultimas = notificaciones.slice(0, 10)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white"
        aria-label="Notificaciones"
      >
        <Bell size={24} />
        {sinLeer > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-red transform translate-x-1/4 -translate-y-1/4 rounded-full">
            {sinLeer > 99 ? '99+' : sinLeer}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-graphite rounded-md shadow-lg overflow-hidden z-50 text-navy font-sans">
          <div className="flex justify-between items-center px-4 py-3 bg-steel-100 border-b border-graphite">
            <h3 className="font-semibold text-sm m-0">Notificaciones</h3>
            {sinLeer > 0 && (
              <button
                onClick={() => {
                  marcarTodasLeidas()
                }}
                className="text-xs text-blue hover:underline"
              >
                Marcar leídas
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {ultimas.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <ul className="m-0 p-0 list-none">
                {ultimas.map((notif) => (
                  <li
                    key={notif.id}
                    className={`p-3 border-b border-graphite/30 last:border-0 hover:bg-steel-100 cursor-pointer transition-colors ${
                      !notif.leida ? 'bg-blue/5' : ''
                    }`}
                    onClick={() => {
                      if (!notif.leida) marcarLeida(notif.id)
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        <strong className="font-mono">{notif.patente}</strong>{' '}
                        {notif.mensaje.replace(notif.patente, '').replace(' — ', '')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getTiempoRelativo(notif.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
