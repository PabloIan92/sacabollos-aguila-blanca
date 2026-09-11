import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  listAseguradoras,
  createAseguradora,
  updateAseguradora,
  deleteAseguradora,
  listProductores,
  createProductor,
  updateProductor,
  deleteProductor,
} from './api'
import { supabase } from '../../lib/supabaseClient'

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('CRM API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Clientes', () => {
    it('obtiene la lista de clientes enriquecida con casos y patentes', async () => {
      const mockClientes = [
        {
          id: 'c-1',
          nombre: 'Juan Pérez',
          telefono: '1122334455',
          email: 'juan@example.com',
          direccion: null,
          notas: null,
          created_at: '2026-09-01',
          updated_at: '2026-09-01',
        },
      ]
      const mockCasos = [
        {
          cliente_nombre: 'Juan Pérez',
          patente: 'AA123BB',
        },
        {
          cliente_nombre: 'Juan Pérez',
          patente: 'CC999DD',
        },
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'clientes') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockClientes, error: null }),
            }),
          } as any
        }
        if (table === 'casos') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockCasos, error: null }),
          } as any
        }
        return {} as any
      })

      const result = await listClientes()
      expect(result).toHaveLength(1)
      expect(result[0].nombre).toBe('Juan Pérez')
      expect(result[0].total_casos).toBe(2)
      expect(result[0].patentes).toEqual(['AA123BB', 'CC999DD'])
    })

    it('crea un cliente validando nombre obligatorio', async () => {
      await expect(createCliente({ nombre: '   ' })).rejects.toThrow(
        /el nombre del cliente es obligatorio/i
      )

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'c-new', nombre: 'Carlos Gomez', telefono: '1155667788' },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const created = await createCliente({
        nombre: 'Carlos Gomez',
        telefono: '1155667788',
      })
      expect(created.nombre).toBe('Carlos Gomez')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Carlos Gomez',
          telefono: '1155667788',
        })
      )
    })

    it('actualiza un cliente existente', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'c-1', nombre: 'Juan Modificado', telefono: '1100000000' },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const updated = await updateCliente('c-1', { nombre: 'Juan Modificado' })
      expect(updated.nombre).toBe('Juan Modificado')
      expect(mockEq).toHaveBeenCalledWith('id', 'c-1')
    })

    it('elimina un cliente', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

      await deleteCliente('c-1')
      expect(mockEq).toHaveBeenCalledWith('id', 'c-1')
    })
  })

  describe('Aseguradoras', () => {
    it('obtiene lista de aseguradoras con métricas de siniestros y reclamos', async () => {
      const mockAseguradoras = [
        {
          id: 'as-1',
          nombre: 'Sancor Seguros',
          email_siniestros: 'siniestros@sancor.com',
          activa: true,
          created_at: '2026-09-01',
          updated_at: '2026-09-01',
        },
      ]
      const mockCasos = [
        {
          aseguradora: 'Sancor Seguros',
          estado: 'facturado',
        },
        {
          aseguradora: 'Sancor Seguros',
          estado: 'reclamo a la compañía',
        },
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'aseguradoras') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockAseguradoras, error: null }),
            }),
          } as any
        }
        if (table === 'casos') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockCasos, error: null }),
          } as any
        }
        return {} as any
      })

      const result = await listAseguradoras()
      expect(result).toHaveLength(1)
      expect(result[0].nombre).toBe('Sancor Seguros')
      expect(result[0].total_casos).toBe(2)
      expect(result[0].casos_en_reclamo).toBe(1)
    })

    it('crea una aseguradora validando nombre obligatorio', async () => {
      await expect(createAseguradora({ nombre: '' })).rejects.toThrow(
        /el nombre de la aseguradora es obligatorio/i
      )

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'as-new', nombre: 'Federación Patronal', activa: true },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const created = await createAseguradora({ nombre: 'Federación Patronal' })
      expect(created.nombre).toBe('Federación Patronal')
    })

    it('actualiza y elimina aseguradora', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'as-1', nombre: 'San Cristóbal Actualizada' },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const updated = await updateAseguradora('as-1', { nombre: 'San Cristóbal Actualizada' })
      expect(updated.nombre).toBe('San Cristóbal Actualizada')

      const mockDelEq = vi.fn().mockResolvedValue({ error: null })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDelEq })
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

      await deleteAseguradora('as-1')
      expect(mockDelEq).toHaveBeenCalledWith('id', 'as-1')
    })
  })

  describe('Productores', () => {
    it('obtiene lista de productores enriquecida con casos', async () => {
      const mockProductores = [
        {
          id: 'pr-1',
          nombre: 'Martín Productor',
          telefono: '1144556677',
          aseguradora: 'Sancor',
          created_at: '2026-09-01',
          updated_at: '2026-09-01',
        },
      ]
      const mockCasos = [
        {
          productor_nombre: 'Martín Productor',
        },
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'productores') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockProductores, error: null }),
            }),
          } as any
        }
        if (table === 'casos') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockCasos, error: null }),
          } as any
        }
        return {} as any
      })

      const result = await listProductores()
      expect(result).toHaveLength(1)
      expect(result[0].nombre).toBe('Martín Productor')
      expect(result[0].total_casos).toBe(1)
    })

    it('crea productor validando nombre obligatorio', async () => {
      await expect(createProductor({ nombre: ' ' })).rejects.toThrow(
        /el nombre del productor es obligatorio/i
      )

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'pr-new', nombre: 'Laura Productora' },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

      const created = await createProductor({ nombre: 'Laura Productora' })
      expect(created.nombre).toBe('Laura Productora')
    })

    it('actualiza y elimina productor', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'pr-1', nombre: 'Laura Actualizada' },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

      const updated = await updateProductor('pr-1', { nombre: 'Laura Actualizada' })
      expect(updated.nombre).toBe('Laura Actualizada')

      const mockDelEq = vi.fn().mockResolvedValue({ error: null })
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDelEq })
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)

      await deleteProductor('pr-1')
      expect(mockDelEq).toHaveBeenCalledWith('id', 'pr-1')
    })
  })
})
