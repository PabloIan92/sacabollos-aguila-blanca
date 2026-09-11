import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Briefcase,
  Car,
  Edit2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react'
import {
  createAseguradora,
  createCliente,
  createProductor,
  deleteAseguradora,
  deleteCliente,
  deleteProductor,
  listAseguradoras,
  listClientes,
  listProductores,
  updateAseguradora,
  updateCliente,
  updateProductor,
} from './api'
import type {
  Aseguradora,
  Cliente,
  CRMTab,
  Productor,
} from './types'

function limpiarTelefono(tel: string | null): string {
  if (!tel) return ''
  const soloDigitos = tel.replace(/\D/g, '')
  if (soloDigitos.startsWith('549')) return soloDigitos
  if (soloDigitos.startsWith('54')) return `549${soloDigitos.slice(2)}`
  return `549${soloDigitos}`
}

export function CRMPage() {
  const [tab, setTab] = useState<CRMTab>('clientes')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([])
  const [productores, setProductores] = useState<Productor[]>([])

  // Modales
  const [modalClienteOpen, setModalClienteOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  const [modalAseguradoraOpen, setModalAseguradoraOpen] = useState(false)
  const [editingAseguradora, setEditingAseguradora] = useState<Aseguradora | null>(null)

  const [modalProductorOpen, setModalProductorOpen] = useState(false)
  const [editingProductor, setEditingProductor] = useState<Productor | null>(null)

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      const [cliData, asegData, prodData] = await Promise.all([
        listClientes(),
        listAseguradoras(),
        listProductores(),
      ])
      setClientes(cliData)
      setAseguradoras(asegData)
      setProductores(prodData)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los datos del CRM')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Filtrado reactivo según la pestaña
  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) => {
      const matchNombre = c.nombre.toLowerCase().includes(q)
      const matchTel = c.telefono?.toLowerCase().includes(q) ?? false
      const matchPatentes = c.patentes?.some((p) => p.toLowerCase().includes(q)) ?? false
      return matchNombre || matchTel || matchPatentes
    })
  }, [clientes, busqueda])

  const aseguradorasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return aseguradoras
    return aseguradoras.filter((a) => {
      const matchNombre = a.nombre.toLowerCase().includes(q)
      const matchContacto = a.contacto_nombre?.toLowerCase().includes(q) ?? false
      const matchEmail = a.email_siniestros?.toLowerCase().includes(q) ?? false
      return matchNombre || matchContacto || matchEmail
    })
  }, [aseguradoras, busqueda])

  const productoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return productores
    return productores.filter((p) => {
      const matchNombre = p.nombre.toLowerCase().includes(q)
      const matchAseg = p.aseguradora?.toLowerCase().includes(q) ?? false
      const matchTel = p.telefono?.toLowerCase().includes(q) ?? false
      return matchNombre || matchAseg || matchTel
    })
  }, [productores, busqueda])

  // Handlers Clientes
  const handleDeleteCliente = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cliente?')) return
    try {
      await deleteCliente(id)
      setClientes((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el cliente')
    }
  }

  // Handlers Aseguradoras
  const handleDeleteAseguradora = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta aseguradora?')) return
    try {
      await deleteAseguradora(id)
      setAseguradoras((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar la aseguradora')
    }
  }

  // Handlers Productores
  const handleDeleteProductor = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este productor?')) return
    try {
      await deleteProductor(id)
      setProductores((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el productor')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-graphite pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-navy">
            CRM y Directorio Comercial
          </h1>
          <p className="text-xs font-mono text-steel-500 uppercase mt-0.5">
            Gestión de clientes, aseguradoras aliadas y red de productores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono border border-graphite hover:bg-steel-100 transition"
            title="Actualizar datos"
          >
            <RefreshCw size={14} />
            <span>Actualizar</span>
          </button>

          {tab === 'clientes' && (
            <button
              onClick={() => {
                setEditingCliente(null)
                setModalClienteOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-mono uppercase font-bold hover:bg-blue transition"
            >
              <Plus size={14} />
              <span>Nuevo Cliente</span>
            </button>
          )}

          {tab === 'aseguradoras' && (
            <button
              onClick={() => {
                setEditingAseguradora(null)
                setModalAseguradoraOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-mono uppercase font-bold hover:bg-blue transition"
            >
              <Plus size={14} />
              <span>Nueva Aseguradora</span>
            </button>
          )}

          {tab === 'productores' && (
            <button
              onClick={() => {
                setEditingProductor(null)
                setModalProductorOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-mono uppercase font-bold hover:bg-blue transition"
            >
              <Plus size={14} />
              <span>Nuevo Productor</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs y Buscador */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex border-b-2 border-steel-200">
          <button
            role="tab"
            aria-selected={tab === 'clientes'}
            onClick={() => {
              setTab('clientes')
              setBusqueda('')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-bold uppercase transition border-b-2 -mb-[2px] ${
              tab === 'clientes'
                ? 'border-navy text-navy bg-steel-100'
                : 'border-transparent text-steel-400 hover:text-navy'
            }`}
          >
            <User size={16} />
            <span>Clientes ({clientes.length})</span>
          </button>

          <button
            role="tab"
            aria-selected={tab === 'aseguradoras'}
            onClick={() => {
              setTab('aseguradoras')
              setBusqueda('')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-bold uppercase transition border-b-2 -mb-[2px] ${
              tab === 'aseguradoras'
                ? 'border-navy text-navy bg-steel-100'
                : 'border-transparent text-steel-400 hover:text-navy'
            }`}
          >
            <Shield size={16} />
            <span>Aseguradoras ({aseguradoras.length})</span>
          </button>

          <button
            role="tab"
            aria-selected={tab === 'productores'}
            onClick={() => {
              setTab('productores')
              setBusqueda('')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-bold uppercase transition border-b-2 -mb-[2px] ${
              tab === 'productores'
                ? 'border-navy text-navy bg-steel-100'
                : 'border-transparent text-steel-400 hover:text-navy'
            }`}
          >
            <Briefcase size={16} />
            <span>Productores ({productores.length})</span>
          </button>
        </div>

        <div className="relative min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={
              tab === 'clientes'
                ? 'Buscar clientes por nombre, teléfono o patente...'
                : tab === 'aseguradoras'
                ? 'Buscar aseguradoras...'
                : 'Buscar productores...'
            }
            className="w-full pl-9 pr-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
          />
        </div>
      </div>

      {/* Contenido según Tab */}
      {loading ? (
        <div className="p-12 text-center text-steel-500 font-mono text-sm flex items-center justify-center gap-3">
          <RefreshCw className="animate-spin" size={20} />
          <span>Cargando datos del CRM...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border-2 border-red text-red flex items-center gap-2 font-mono text-sm">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* TAB 1: CLIENTES */}
          {tab === 'clientes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientesFiltrados.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-white border-2 border-graphite text-steel-400 font-mono text-sm">
                  No se encontraron clientes registrados.
                </div>
              ) : (
                clientesFiltrados.map((cli) => (
                  <div
                    key={cli.id}
                    className="bg-white border-2 border-graphite p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display font-bold text-lg text-navy uppercase">
                          {cli.nombre}
                        </h2>
                        {cli.total_casos !== undefined && cli.total_casos > 0 && (
                          <span className="px-2 py-0.5 bg-steel-100 text-navy font-mono text-xs font-semibold rounded shrink-0">
                            {cli.total_casos} {cli.total_casos === 1 ? 'caso' : 'casos'}
                          </span>
                        )}
                      </div>

                      {cli.telefono && (
                        <div className="flex items-center gap-2 text-sm font-mono text-graphite mt-2">
                          <Phone size={14} className="text-steel-400" />
                          <span>{cli.telefono}</span>
                        </div>
                      )}

                      {cli.email && (
                        <div className="flex items-center gap-2 text-xs font-sans text-steel-500 mt-1">
                          <Mail size={14} className="text-steel-400" />
                          <span>{cli.email}</span>
                        </div>
                      )}

                      {/* Patentes vinculadas */}
                      {cli.patentes && cli.patentes.length > 0 && (
                        <div className="mt-3">
                          <span className="text-[11px] font-mono text-steel-400 uppercase block mb-1 flex items-center gap-1">
                            <Car size={12} />
                            <span>Vehículos:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {cli.patentes.map((pat) => (
                              <span
                                key={pat}
                                className="px-2 py-0.5 bg-navy text-white text-xs font-mono font-bold"
                              >
                                {pat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {cli.notas && (
                        <p className="text-xs font-sans text-steel-500 italic mt-3 bg-steel-50 p-2 border border-steel-200">
                          {cli.notas}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-steel-200 pt-3 mt-4">
                      <div className="flex items-center gap-2">
                        {cli.telefono && (
                          <>
                            <a
                              href={`https://wa.me/${limpiarTelefono(cli.telefono)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-green text-white hover:bg-green-700 transition"
                              title="Enviar WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </a>
                            <a
                              href={`tel:${cli.telefono}`}
                              className="p-1.5 bg-blue text-white hover:bg-navy transition"
                              title="Llamar por teléfono"
                            >
                              <Phone size={14} />
                            </a>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCliente(cli)
                            setModalClienteOpen(true)
                          }}
                          className="p-1.5 border border-steel-300 text-steel-600 hover:bg-steel-100 transition"
                          title="Editar cliente"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          aria-label="Eliminar cliente"
                          onClick={() => handleDeleteCliente(cli.id)}
                          className="p-1.5 border border-red-300 text-red hover:bg-red-50 transition"
                          title="Eliminar cliente"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ASEGURADORAS */}
          {tab === 'aseguradoras' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aseguradorasFiltradas.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-white border-2 border-graphite text-steel-400 font-mono text-sm">
                  No se encontraron aseguradoras registradas.
                </div>
              ) : (
                aseguradorasFiltradas.map((aseg) => (
                  <div
                    key={aseg.id}
                    className="bg-white border-2 border-graphite p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display font-bold text-lg text-navy uppercase">
                          {aseg.nombre}
                        </h2>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                            aseg.activa ? 'bg-green text-white' : 'bg-steel-300 text-steel-600'
                          }`}
                        >
                          {aseg.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs font-mono bg-steel-100 px-2 py-0.5 text-navy font-semibold">
                          {aseg.total_casos || 0} siniestros
                        </span>
                        {aseg.casos_en_reclamo !== undefined && aseg.casos_en_reclamo > 0 && (
                          <span className="text-xs font-mono bg-red-100 text-red px-2 py-0.5 font-bold">
                            {aseg.casos_en_reclamo} en reclamo
                          </span>
                        )}
                      </div>

                      {aseg.contacto_nombre && (
                        <div className="text-xs font-sans text-graphite font-medium mt-3">
                          Contacto: <strong>{aseg.contacto_nombre}</strong>
                        </div>
                      )}

                      {aseg.email_siniestros && (
                        <div className="flex items-center gap-2 text-xs font-mono text-steel-500 mt-1">
                          <Mail size={14} className="text-steel-400" />
                          <span className="truncate">{aseg.email_siniestros}</span>
                        </div>
                      )}

                      {aseg.telefono_contacto && (
                        <div className="flex items-center gap-2 text-xs font-mono text-steel-500 mt-1">
                          <Phone size={14} className="text-steel-400" />
                          <span>{aseg.telefono_contacto}</span>
                        </div>
                      )}

                      {aseg.notas && (
                        <p className="text-xs font-sans text-steel-500 italic mt-2 bg-steel-50 p-2 border border-steel-200">
                          {aseg.notas}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-steel-200 pt-3 mt-4">
                      <div className="flex items-center gap-2">
                        {aseg.email_siniestros && (
                          <a
                            href={`mailto:${aseg.email_siniestros}`}
                            className="p-1.5 bg-navy text-white hover:bg-blue transition"
                            title="Enviar correo"
                          >
                            <Mail size={14} />
                          </a>
                        )}
                        {aseg.telefono_contacto && (
                          <a
                            href={`tel:${aseg.telefono_contacto}`}
                            className="p-1.5 bg-blue text-white hover:bg-navy transition"
                            title="Llamar"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAseguradora(aseg)
                            setModalAseguradoraOpen(true)
                          }}
                          className="p-1.5 border border-steel-300 text-steel-600 hover:bg-steel-100 transition"
                          title="Editar aseguradora"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          aria-label="Eliminar aseguradora"
                          onClick={() => handleDeleteAseguradora(aseg.id)}
                          className="p-1.5 border border-red-300 text-red hover:bg-red-50 transition"
                          title="Eliminar aseguradora"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PRODUCTORES */}
          {tab === 'productores' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productoresFiltrados.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-white border-2 border-graphite text-steel-400 font-mono text-sm">
                  No se encontraron productores registrados.
                </div>
              ) : (
                productoresFiltrados.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white border-2 border-graphite p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display font-bold text-lg text-navy uppercase">
                          {prod.nombre}
                        </h2>
                        {prod.total_casos !== undefined && (
                          <span className="px-2 py-0.5 bg-steel-100 text-navy font-mono text-xs font-semibold rounded shrink-0">
                            {prod.total_casos} casos derivados
                          </span>
                        )}
                      </div>

                      {prod.aseguradora && (
                        <div className="text-xs font-mono text-blue font-bold mt-1">
                          Compañía: {prod.aseguradora}
                        </div>
                      )}

                      {prod.telefono && (
                        <div className="flex items-center gap-2 text-sm font-mono text-graphite mt-2">
                          <Phone size={14} className="text-steel-400" />
                          <span>{prod.telefono}</span>
                        </div>
                      )}

                      {prod.email && (
                        <div className="flex items-center gap-2 text-xs font-sans text-steel-500 mt-1">
                          <Mail size={14} className="text-steel-400" />
                          <span>{prod.email}</span>
                        </div>
                      )}

                      {prod.notas && (
                        <p className="text-xs font-sans text-steel-500 italic mt-3 bg-steel-50 p-2 border border-steel-200">
                          {prod.notas}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-steel-200 pt-3 mt-4">
                      <div className="flex items-center gap-2">
                        {prod.telefono && (
                          <>
                            <a
                              href={`https://wa.me/${limpiarTelefono(prod.telefono)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-green text-white hover:bg-green-700 transition"
                              title="Enviar WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </a>
                            <a
                              href={`tel:${prod.telefono}`}
                              className="p-1.5 bg-blue text-white hover:bg-navy transition"
                              title="Llamar"
                            >
                              <Phone size={14} />
                            </a>
                          </>
                        )}
                        {prod.email && (
                          <a
                            href={`mailto:${prod.email}`}
                            className="p-1.5 bg-navy text-white hover:bg-blue transition"
                            title="Enviar correo"
                          >
                            <Mail size={14} />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProductor(prod)
                            setModalProductorOpen(true)
                          }}
                          className="p-1.5 border border-steel-300 text-steel-600 hover:bg-steel-100 transition"
                          title="Editar productor"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          aria-label="Eliminar productor"
                          onClick={() => handleDeleteProductor(prod.id)}
                          className="p-1.5 border border-red-300 text-red hover:bg-red-50 transition"
                          title="Eliminar productor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL CLIENTE */}
      {modalClienteOpen && (
        <ModalClienteForm
          cliente={editingCliente}
          onClose={() => {
            setModalClienteOpen(false)
            setEditingCliente(null)
          }}
          onSaved={(guardado) => {
            setClientes((prev) => {
              const existe = prev.some((c) => c.id === guardado.id)
              if (existe) {
                return prev.map((c) => (c.id === guardado.id ? { ...c, ...guardado } : c))
              }
              return [guardado, ...prev]
            })
            setModalClienteOpen(false)
            setEditingCliente(null)
          }}
        />
      )}

      {/* MODAL ASEGURADORA */}
      {modalAseguradoraOpen && (
        <ModalAseguradoraForm
          aseguradora={editingAseguradora}
          onClose={() => {
            setModalAseguradoraOpen(false)
            setEditingAseguradora(null)
          }}
          onSaved={(guardada) => {
            setAseguradoras((prev) => {
              const existe = prev.some((a) => a.id === guardada.id)
              if (existe) {
                return prev.map((a) => (a.id === guardada.id ? { ...a, ...guardada } : a))
              }
              return [guardada, ...prev]
            })
            setModalAseguradoraOpen(false)
            setEditingAseguradora(null)
          }}
        />
      )}

      {/* MODAL PRODUCTOR */}
      {modalProductorOpen && (
        <ModalProductorForm
          productor={editingProductor}
          onClose={() => {
            setModalProductorOpen(false)
            setEditingProductor(null)
          }}
          onSaved={(guardado) => {
            setProductores((prev) => {
              const existe = prev.some((p) => p.id === guardado.id)
              if (existe) {
                return prev.map((p) => (p.id === guardado.id ? { ...p, ...guardado } : p))
              }
              return [guardado, ...prev]
            })
            setModalProductorOpen(false)
            setEditingProductor(null)
          }}
        />
      )}
    </div>
  )
}

// ==========================================
// SUBCOMPONENTES MODALES
// ==========================================

function ModalClienteForm({
  cliente,
  onClose,
  onSaved,
}: {
  cliente: Cliente | null
  onClose: () => void
  onSaved: (cliente: Cliente) => void
}) {
  const [nombre, setNombre] = useState(cliente?.nombre || '')
  const [telefono, setTelefono] = useState(cliente?.telefono || '')
  const [email, setEmail] = useState(cliente?.email || '')
  const [direccion, setDireccion] = useState(cliente?.direccion || '')
  const [notas, setNotas] = useState(cliente?.notas || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre completo es obligatorio')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      if (cliente) {
        const actualizado = await updateCliente(cliente.id, {
          nombre,
          telefono,
          email,
          direccion,
          notas,
        })
        onSaved(actualizado)
      } else {
        const nuevo = await createCliente({
          nombre,
          telefono,
          email,
          direccion,
          notas,
        })
        onSaved(nuevo)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al guardar cliente')
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-graphite max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-steel-200 pb-2">
          <h2 className="font-display font-bold uppercase text-lg text-navy">
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="p-1 text-steel-400 hover:text-navy">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red text-red text-xs font-mono">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="cliente-nombre"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Nombre Completo *
            </label>
            <input
              id="cliente-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="cliente-telefono"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Teléfono
            </label>
            <input
              id="cliente-telefono"
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 1122334455"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="cliente-email"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Email
            </label>
            <input
              id="cliente-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@gmail.com"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="cliente-direccion"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Dirección
            </label>
            <input
              id="cliente-direccion"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle y número, localidad"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="cliente-notas"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Notas adicionales
            </label>
            <textarea
              id="cliente-notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones de atención, preferencias..."
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-steel-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase font-bold border border-steel-300 hover:bg-steel-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-navy text-white text-xs font-mono uppercase font-bold hover:bg-blue disabled:opacity-50"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalAseguradoraForm({
  aseguradora,
  onClose,
  onSaved,
}: {
  aseguradora: Aseguradora | null
  onClose: () => void
  onSaved: (aseguradora: Aseguradora) => void
}) {
  const [nombre, setNombre] = useState(aseguradora?.nombre || '')
  const [emailSiniestros, setEmailSiniestros] = useState(aseguradora?.email_siniestros || '')
  const [telefonoContacto, setTelefonoContacto] = useState(aseguradora?.telefono_contacto || '')
  const [contactoNombre, setContactoNombre] = useState(aseguradora?.contacto_nombre || '')
  const [notas, setNotas] = useState(aseguradora?.notas || '')
  const [activa, setActiva] = useState(aseguradora?.activa ?? true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre de la aseguradora es obligatorio')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      if (aseguradora) {
        const actualizado = await updateAseguradora(aseguradora.id, {
          nombre,
          email_siniestros: emailSiniestros,
          telefono_contacto: telefonoContacto,
          contacto_nombre: contactoNombre,
          notas,
          activa,
        })
        onSaved(actualizado)
      } else {
        const nueva = await createAseguradora({
          nombre,
          email_siniestros: emailSiniestros,
          telefono_contacto: telefonoContacto,
          contacto_nombre: contactoNombre,
          notas,
          activa,
        })
        onSaved(nueva)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al guardar aseguradora')
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-graphite max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-steel-200 pb-2">
          <h2 className="font-display font-bold uppercase text-lg text-navy">
            {aseguradora ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
          </h2>
          <button onClick={onClose} className="p-1 text-steel-400 hover:text-navy">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red text-red text-xs font-mono">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="aseg-nombre"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Nombre de la Compañía *
            </label>
            <input
              id="aseg-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: San Cristóbal"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="aseg-email"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Email para Siniestros y Presupuestos
            </label>
            <input
              id="aseg-email"
              type="email"
              value={emailSiniestros}
              onChange={(e) => setEmailSiniestros(e.target.value)}
              placeholder="siniestros@compania.com.ar"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="aseg-telefono"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Teléfono de Contacto
            </label>
            <input
              id="aseg-telefono"
              type="text"
              value={telefonoContacto}
              onChange={(e) => setTelefonoContacto(e.target.value)}
              placeholder="0810-xxx-xxxx o número directo"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="aseg-contacto"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Nombre del Liquidador / Contacto
            </label>
            <input
              id="aseg-contacto"
              type="text"
              value={contactoNombre}
              onChange={(e) => setContactoNombre(e.target.value)}
              placeholder="Nombre del asesor asignado"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="aseg-notas"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Notas
            </label>
            <textarea
              id="aseg-notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Convenios, particularidades de auditoría..."
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              id="aseg-activa"
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
              className="w-4 h-4 text-navy border-steel-300 focus:ring-0"
            />
            <label htmlFor="aseg-activa" className="text-xs font-mono uppercase font-semibold text-graphite">
              Convenio activo con el taller
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-steel-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase font-bold border border-steel-300 hover:bg-steel-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-navy text-white text-xs font-mono uppercase font-bold hover:bg-blue disabled:opacity-50"
            >
              Guardar Aseguradora
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalProductorForm({
  productor,
  onClose,
  onSaved,
}: {
  productor: Productor | null
  onClose: () => void
  onSaved: (productor: Productor) => void
}) {
  const [nombre, setNombre] = useState(productor?.nombre || '')
  const [telefono, setTelefono] = useState(productor?.telefono || '')
  const [email, setEmail] = useState(productor?.email || '')
  const [aseguradora, setAseguradora] = useState(productor?.aseguradora || '')
  const [notas, setNotas] = useState(productor?.notas || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre del productor es obligatorio')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      if (productor) {
        const actualizado = await updateProductor(productor.id, {
          nombre,
          telefono,
          email,
          aseguradora,
          notas,
        })
        onSaved(actualizado)
      } else {
        const nuevo = await createProductor({
          nombre,
          telefono,
          email,
          aseguradora,
          notas,
        })
        onSaved(nuevo)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al guardar productor')
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-graphite max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-steel-200 pb-2">
          <h2 className="font-display font-bold uppercase text-lg text-navy">
            {productor ? 'Editar Productor' : 'Nuevo Productor'}
          </h2>
          <button onClick={onClose} className="p-1 text-steel-400 hover:text-navy">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red text-red text-xs font-mono">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="prod-nombre"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Nombre Completo *
            </label>
            <input
              id="prod-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Laura Productora"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="prod-aseguradora"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Compañía Principal con la que Opera
            </label>
            <input
              id="prod-aseguradora"
              type="text"
              value={aseguradora}
              onChange={(e) => setAseguradora(e.target.value)}
              placeholder="Ej: Sancor Seguros, Federación Patronal..."
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="prod-telefono"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Teléfono
            </label>
            <input
              id="prod-telefono"
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 1133445566"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="prod-email"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Email
            </label>
            <input
              id="prod-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="productor@asesor.com"
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label
              htmlFor="prod-notas"
              className="block text-xs font-mono uppercase text-steel-500 mb-1 font-semibold"
            >
              Notas
            </label>
            <textarea
              id="prod-notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones de convenio, comisión..."
              className="w-full px-3 py-2 text-sm font-sans border border-steel-300 focus:outline-none focus:border-navy"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-steel-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase font-bold border border-steel-300 hover:bg-steel-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-navy text-white text-xs font-mono uppercase font-bold hover:bg-blue disabled:opacity-50"
            >
              Guardar Productor
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
