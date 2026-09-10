import React, { useState, useEffect, useCallback } from 'react'
import { UserPlus, Users, Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { listColaboradores, invitarColaborador } from './api'
import type { Colaborador } from './types'

export function InvitarPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  // Formulario
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'recepcion' | 'taller'>('taller')
  const [enviando, setEnviando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const cargarEquipo = useCallback(async () => {
    setLoading(true)
    setErrorCarga(null)
    try {
      const data = await listColaboradores()
      setColaboradores(data)
    } catch (err: any) {
      setErrorCarga(err?.message || 'Error al cargar los miembros del equipo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarEquipo()
  }, [cargarEquipo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm(null)
    setMensajeExito(null)

    if (!fullName.trim()) {
      setErrorForm('Por favor ingrese el nombre del colaborador')
      return
    }
    if (!email.trim()) {
      setErrorForm('Por favor ingrese el correo electrónico')
      return
    }

    setEnviando(true)
    try {
      const res = await invitarColaborador({
        full_name: fullName.trim(),
        email: email.trim(),
        role,
      })
      setMensajeExito(res.message)
      setFullName('')
      setEmail('')
      setRole('taller')
      await cargarEquipo()
    } catch (err: any) {
      setErrorForm(err?.message || 'Error al procesar la invitación')
    } finally {
      setEnviando(false)
    }
  }

  const roleLabel = (r: string) => {
    switch (r) {
      case 'dueno':
        return 'Dueño'
      case 'recepcion':
        return 'Recepción'
      case 'taller':
        return 'Taller'
      default:
        return r
    }
  }

  const roleBadgeColor = (r: string) => {
    switch (r) {
      case 'dueno':
        return 'bg-yellow-400/20 text-yellow-800 border-yellow-400'
      case 'recepcion':
        return 'bg-blue/10 text-blue border-blue/30'
      case 'taller':
        return 'bg-green-600/10 text-green-700 border-green-600/30'
      default:
        return 'bg-steel-200 text-steel-700 border-steel-300'
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-graphite pb-4">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-tight text-navy flex items-center gap-2">
            <Users size={24} />
            Gestión de Equipo e Invitaciones
          </h1>
          <p className="text-xs font-mono text-steel-500 uppercase mt-1">
            Administración de colaboradores, roles y accesos al taller
          </p>
        </div>
        <button
          onClick={cargarEquipo}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-semibold uppercase bg-steel-100 hover:bg-steel-200 text-navy border border-steel-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Alerta de error de carga */}
      {errorCarga && (
        <div className="p-4 bg-red-50 border-2 border-red-600 text-red-700 text-xs font-mono flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorCarga}</span>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Formulario de Invitación (2 columnas) */}
        <div className="md:col-span-2 bg-white border-2 border-graphite p-5 flex flex-col gap-4 shadow-sm">
          <div className="border-b border-steel-200 pb-3 flex items-center gap-2 text-navy font-mono font-bold uppercase text-sm">
            <UserPlus size={18} />
            <span>Invitar Colaborador</span>
          </div>

          {mensajeExito && (
            <div className="p-3 bg-green-50 border border-green-600 text-green-800 text-xs font-mono flex items-start gap-2">
              <CheckCircle size={16} className="shrink-0 mt-0.5 text-green-600" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {errorForm && (
            <div className="p-3 bg-red-50 border border-red-600 text-red-700 text-xs font-mono flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorForm}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="input-full-name" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
                Nombre Completo *
              </label>
              <input
                id="input-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Marcos Gómez"
                className="w-full px-3 py-2 text-sm font-mono border border-steel-300 focus:outline-none focus:border-navy"
                disabled={enviando}
              />
            </div>

            <div>
              <label htmlFor="input-email" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
                Correo Electrónico *
              </label>
              <input
                id="input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: marcos@aguilablanca.com"
                className="w-full px-3 py-2 text-sm font-mono border border-steel-300 focus:outline-none focus:border-navy"
                disabled={enviando}
              />
            </div>

            <div>
              <label htmlFor="select-role" className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold">
                Rol en el Sistema *
              </label>
              <select
                id="select-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'recepcion' | 'taller')}
                className="w-full px-3 py-2 text-sm font-mono border border-steel-300 focus:outline-none focus:border-navy bg-white"
                disabled={enviando}
              >
                <option value="taller">Taller (Módulo de daños, piezas y reparación)</option>
                <option value="recepcion">Recepción (Ingreso, inspección, turnos y clientes)</option>
              </select>
            </div>

            <div className="bg-steel-50 p-3 border border-steel-200 text-xs font-mono text-steel-600 flex items-start gap-2">
              <Shield size={16} className="shrink-0 text-steel-400 mt-0.5" />
              <span>
                Los permisos se asignan automáticamente según el rol seleccionado. El rol Dueño solo puede ser asignado por administradores del sistema.
              </span>
            </div>

            <button
              id="btn-enviar-invitacion"
              type="submit"
              disabled={enviando}
              className="mt-2 w-full py-2.5 px-4 bg-navy hover:bg-navy/90 text-white font-mono font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {enviando ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Enviar Invitación</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Colaboradores (3 columnas) */}
        <div className="md:col-span-3 bg-white border-2 border-graphite p-5 flex flex-col gap-4 shadow-sm">
          <div className="border-b border-steel-200 pb-3 flex items-center justify-between">
            <span className="text-navy font-mono font-bold uppercase text-sm flex items-center gap-2">
              <Users size={18} />
              Equipo Activo ({colaboradores.length})
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-steel-400 gap-2">
              <RefreshCw size={24} className="animate-spin" />
              <span className="text-xs font-mono uppercase">Cargando colaboradores...</span>
            </div>
          ) : colaboradores.length === 0 ? (
            <div className="py-8 text-center text-steel-400 text-xs font-mono uppercase">
              No hay colaboradores registrados.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-steel-200">
              {colaboradores.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-mono font-bold text-navy">{c.full_name}</span>
                    <span className="text-xs font-mono text-steel-400">ID: {c.id.slice(0, 8)}...</span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 border uppercase ${roleBadgeColor(
                      c.role
                    )}`}
                  >
                    {roleLabel(c.role)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
