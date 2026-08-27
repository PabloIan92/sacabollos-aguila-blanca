import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { FichaInspeccionPage } from './FichaInspeccionPage'
import { getCaso, updateCasoEstado } from './api'
import { useCasoFotos } from './hooks/useCasoFotos'
import { ZONAS_DANO } from './types'
import type { Caso } from './types'

vi.mock('./api')
vi.mock('./hooks/useCasoFotos')

const mockedGetCaso = vi.mocked(getCaso)
const mockedUpdateCasoEstado = vi.mocked(updateCasoEstado)
const mockedUseCasoFotos = vi.mocked(useCasoFotos)

const uploadFoto = vi.fn()

function caso(overrides: Partial<Caso> = {}): Caso {
  return {
    id: 'caso-1',
    canal: 'seguro',
    patente: 'AA123BB',
    marca: null,
    modelo: null,
    color: null,
    cliente_nombre: 'Juan Pérez',
    cliente_telefono: '1122334455',
    aseguradora: 'Sancor',
    numero_siniestro: 'S-1',
    denuncia: 'Choque en cruce',
    productor_nombre: null,
    productor_telefono: null,
    danos_zonas: [],
    turno_fecha: null,
    orden_ingreso_numero: null,
    ingresado_at: null,
    estado: 'borrador',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    estado_changed_at: '2026-01-01',
    created_by: 'user-1',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/casos/caso-1/ficha-inspeccion']}>
      <Routes>
        <Route path="/casos/:id/ficha-inspeccion" element={<FichaInspeccionPage />} />
        <Route path="/casos" element={<div>LISTADO DE CASOS</div>} />
      </Routes>
    </MemoryRouter>
  )
}

async function subirLasCuatroFotos() {
  for (const angulo of ['frente', 'atras', 'lateral-izquierdo', 'lateral-derecho']) {
    const file = new File(['contenido'], `${angulo}.jpg`, { type: 'image/jpeg' })
    const etiqueta = angulo.replace(/-/g, ' ')
    const input = screen.getByLabelText(`Foto ${etiqueta}`)
    fireEvent.change(input, { target: { files: [file] } })
    await screen.findByAltText(`Preview ${etiqueta}`)
  }

  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Guardar ficha de inspección' })).not.toBeDisabled()
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  mockedGetCaso.mockResolvedValue(caso())
  mockedUpdateCasoEstado.mockResolvedValue(caso())
  uploadFoto.mockResolvedValue('casos/caso-1/frente.webp')
  mockedUseCasoFotos.mockReturnValue({ uploadFoto, listFotos: vi.fn() })
})

describe('FichaInspeccionPage', () => {
  it('renderiza exactamente las 10 zonas de ZONAS_DANO', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.getAllByRole('checkbox')).toHaveLength(ZONAS_DANO.length)
  })

  it('renderiza exactamente 4 dropzones, una por ángulo', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.getAllByLabelText(/^Foto /)).toHaveLength(4)
  })

  it('el botón de guardar queda deshabilitado hasta subir las 4 fotos', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    const guardar = screen.getByRole('button', { name: 'Guardar ficha de inspección' })
    expect(guardar).toBeDisabled()

    await subirLasCuatroFotos()
    expect(guardar).not.toBeDisabled()
  })

  it('el botón de marcar enviado queda deshabilitado hasta guardar la ficha, y avanza el estado al presionarlo', async () => {
    renderPage()
    await screen.findByText('Ficha de inspección')
    expect(screen.getByRole('button', { name: 'Marcar como enviado a la aseguradora' })).toBeDisabled()

    await subirLasCuatroFotos()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha de inspección' }))
    await waitFor(() =>
      expect(mockedUpdateCasoEstado).toHaveBeenCalledWith('caso-1', 'borrador', { danos_zonas: [] })
    )

    const marcarEnviado = await waitFor(() => {
      const boton = screen.getByRole('button', { name: 'Marcar como enviado a la aseguradora' })
      expect(boton).not.toBeDisabled()
      return boton
    })

    fireEvent.click(marcarEnviado)
    await waitFor(() =>
      expect(mockedUpdateCasoEstado).toHaveBeenCalledWith('caso-1', 'enviado a la aseguradora')
    )
    expect(await screen.findByText('LISTADO DE CASOS')).toBeInTheDocument()
  })
})
