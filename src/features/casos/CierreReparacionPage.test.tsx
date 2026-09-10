import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { CierreReparacionPage } from './CierreReparacionPage'
import { getCaso, markReadyForSignature, markSigned } from './api'
import { useCasoFotos } from './hooks/useCasoFotos'
import type { Caso } from './types'

vi.mock('./api', () => ({
  getCaso: vi.fn(),
  markReadyForSignature: vi.fn(),
  markSigned: vi.fn(),
}))

vi.mock('./hooks/useCasoFotos', () => ({
  useCasoFotos: vi.fn(),
}))

const mockedGetCaso = vi.mocked(getCaso)
const mockedMarkReadyForSignature = vi.mocked(markReadyForSignature)
const mockedMarkSigned = vi.mocked(markSigned)
const mockedUseCasoFotos = vi.mocked(useCasoFotos)

const uploadFoto = vi.fn()
const listFotos = vi.fn()

function caso(overrides: Partial<Caso> = {}): Caso {
  return {
    id: 'caso-1',
    canal: 'seguro',
    patente: 'AA123BB',
    marca: 'Ford',
    modelo: 'Focus',
    color: 'Gris',
    cliente_nombre: 'Juan Pérez',
    cliente_telefono: '1122334455',
    aseguradora: 'Sancor',
    numero_siniestro: 'S-1',
    denuncia: 'x',
    productor_nombre: null,
    productor_telefono: null,
    presupuesto_monto: null,
    presupuesto_respuesta: null,
    presupuesto_observaciones: null,
    modalidad_contacto: null,
    seguimiento_observaciones: null,
    inspeccion_guardada_at: null,
    danos_zonas: ['capot'],
    turno_fecha: '2026-03-01T10:30:00.000Z',
    orden_ingreso_numero: 'ORD-001',
    ingresado_at: '2026-03-01T11:00:00.000Z',
    repuesto_pendiente: null,
    reparacion_iniciada_at: '2026-03-01T12:00:00.000Z',
    reparacion_lista_at: null,
    firmado_at: null,
    estado: 'en reparación',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

function renderPage(initialPath = '/casos/caso-1/cierre-reparacion') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/casos/:id/cierre-reparacion" element={<CierreReparacionPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CierreReparacionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:foto-local')
    URL.revokeObjectURL = vi.fn()
    uploadFoto.mockResolvedValue('casos/caso-1/final-frente.webp')
    listFotos.mockResolvedValue({})
    mockedUseCasoFotos.mockReturnValue({ uploadFoto, listFotos })
  })

  it('requiere 4 fotos finales antes de habilitar "Listo para firma"', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'en reparación' }))
    listFotos.mockResolvedValue({
      'final-frente': 'https://storage/final-frente.webp',
      'final-atras': 'https://storage/final-atras.webp',
      'final-lateral-izquierdo': 'https://storage/final-lateral-izquierdo.webp',
    })

    renderPage()

    const btn = await screen.findByRole('button', { name: /listo para firma/i })
    expect(btn).toBeDisabled()
  })

  it('habilita "Listo para firma" cuando las 4 fotos finales están presentes y avanza el estado', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'en reparación' }))
    listFotos.mockResolvedValue({
      'final-frente': 'https://storage/final-frente.webp',
      'final-atras': 'https://storage/final-atras.webp',
      'final-lateral-izquierdo': 'https://storage/final-lateral-izquierdo.webp',
      'final-lateral-derecho': 'https://storage/final-lateral-derecho.webp',
    })
    mockedMarkReadyForSignature.mockResolvedValue(
      caso({ estado: 'listo para firma', reparacion_lista_at: new Date().toISOString() })
    )

    renderPage()

    const btn = await screen.findByRole('button', { name: /listo para firma/i })
    await waitFor(() => expect(btn).toBeEnabled())

    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockedMarkReadyForSignature).toHaveBeenCalledWith('caso-1')
    })
  })

  it('en estado "listo para firma" requiere la foto de orden-firmada antes de "Marcar firmado"', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'listo para firma' }))
    listFotos.mockResolvedValue({})

    renderPage()

    const btn = await screen.findByRole('button', { name: /marcar firmado/i })
    expect(btn).toBeDisabled()
  })

  it('en estado "listo para firma" habilita "Marcar firmado" al existir orden-firmada y transiciona a firmado', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'listo para firma' }))
    listFotos.mockResolvedValue({
      'orden-firmada': 'https://storage/orden-firmada.webp',
    })
    mockedMarkSigned.mockResolvedValue(
      caso({ estado: 'firmado', firmado_at: new Date().toISOString() })
    )

    renderPage()

    const btn = await screen.findByRole('button', { name: /marcar firmado/i })
    await waitFor(() => expect(btn).toBeEnabled())

    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockedMarkSigned).toHaveBeenCalledWith('caso-1')
    })
  })

  it('muestra errores de transición y mantiene controles interactivos seguros para reintento', async () => {
    mockedGetCaso.mockResolvedValue(caso({ estado: 'en reparación' }))
    listFotos.mockResolvedValue({
      'final-frente': 'https://storage/final-frente.webp',
      'final-atras': 'https://storage/final-atras.webp',
      'final-lateral-izquierdo': 'https://storage/final-lateral-izquierdo.webp',
      'final-lateral-derecho': 'https://storage/final-lateral-derecho.webp',
    })
    mockedMarkReadyForSignature.mockRejectedValueOnce(new Error('Faltan fotos según la base de datos'))

    renderPage()

    const btn = await screen.findByRole('button', { name: /listo para firma/i })
    await waitFor(() => expect(btn).toBeEnabled())

    fireEvent.click(btn)

    expect(await screen.findByRole('alert')).toHaveTextContent(/faltan fotos según la base de datos/i)
    expect(btn).toBeEnabled()
  })
})
