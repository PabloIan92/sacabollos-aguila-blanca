import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { CasoNuevoPage } from './CasoNuevoPage'
import { createCaso } from './api'
import { useAuth } from '../../auth/useAuth'

vi.mock('./api')
vi.mock('../../auth/useAuth')

const mockedCreateCaso = vi.mocked(createCaso)
const mockedUseAuth = vi.mocked(useAuth)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/casos/nuevo']}>
      <Routes>
        <Route path="/casos/nuevo" element={<CasoNuevoPage />} />
        <Route path="/casos/:id/ficha-inspeccion" element={<div>FICHA DE INSPECCION</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Juan Pérez' } })
  fireEvent.change(screen.getByLabelText('Teléfono del cliente'), { target: { value: '1122334455' } })
  fireEvent.change(screen.getByLabelText('Patente'), { target: { value: 'AA123BB' } })
  fireEvent.change(screen.getByLabelText('Número de siniestro'), { target: { value: 'S-1' } })
  fireEvent.change(screen.getByLabelText('Denuncia'), { target: { value: 'Choque en cruce' } })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { user: { id: 'user-1' } },
  } as unknown as ReturnType<typeof useAuth>)
})

describe('CasoNuevoPage', () => {
  it('el select de aseguradora tiene exactamente las 6 opciones de D-18', () => {
    renderPage()
    const options = screen.getAllByRole('option') as HTMLOptionElement[]
    expect(options).toHaveLength(6)
    expect(options.map((option) => option.value)).toEqual([
      'San Cristóbal',
      'Federación Patronal',
      'Mercantil Andes',
      'Triunfo',
      'Sancor',
      'Cooperativa de Seguros',
    ])
  })

  it('deshabilita el submit hasta completar los campos obligatorios', () => {
    renderPage()
    const submit = screen.getByRole('button', { name: 'Crear caso' })
    expect(submit).toBeDisabled()

    fillRequiredFields()
    expect(submit).not.toBeDisabled()
  })

  it('al guardar con éxito llama a createCaso una sola vez y navega a la ficha de inspección', async () => {
    mockedCreateCaso.mockResolvedValue({
      id: 'caso-1',
    } as unknown as Awaited<ReturnType<typeof createCaso>>)
    renderPage()
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Crear caso' }))

    await waitFor(() => expect(mockedCreateCaso).toHaveBeenCalledTimes(1))
    expect(mockedCreateCaso).toHaveBeenCalledWith(
      expect.objectContaining({
        canal: 'seguro',
        patente: 'AA123BB',
        cliente_nombre: 'Juan Pérez',
        cliente_telefono: '1122334455',
        numero_siniestro: 'S-1',
        denuncia: 'Choque en cruce',
        created_by: 'user-1',
      })
    )
    expect(await screen.findByText('FICHA DE INSPECCION')).toBeInTheDocument()
  })
})
