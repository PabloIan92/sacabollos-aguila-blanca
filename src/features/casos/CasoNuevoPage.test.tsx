import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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

function fillCommonFields() {
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Ana Gómez' } })
  fireEvent.change(screen.getByLabelText('Teléfono del cliente'), { target: { value: '1199887766' } })
  fireEvent.change(screen.getByLabelText('Patente'), { target: { value: 'AC456DE' } })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { user: { id: 'user-1' } },
  } as unknown as ReturnType<typeof useAuth>)
})

describe('CasoNuevoPage', () => {
  it('permite elegir entre Seguro y Particular y mantiene Seguro como opción inicial', () => {
    renderPage()

    const canal = screen.getByLabelText('Canal') as HTMLSelectElement
    expect(canal.value).toBe('seguro')
    expect(within(canal).getAllByRole('option')).toHaveLength(2)
  })

  it('el select de aseguradora tiene exactamente las 6 opciones de D-18', () => {
    renderPage()
    const options = within(screen.getByLabelText('Aseguradora')).getAllByRole(
      'option'
    ) as HTMLOptionElement[]
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

  it('para Particular muestra presupuesto, oculta seguro y exige un monto mayor que cero', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Canal'), { target: { value: 'particular' } })

    expect(screen.queryByLabelText('Aseguradora')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Número de siniestro')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Denuncia')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Monto del presupuesto')).toBeInTheDocument()
    expect(screen.getByLabelText('Observaciones del presupuesto')).toBeInTheDocument()

    fillCommonFields()
    const submit = screen.getByRole('button', { name: 'Crear caso' })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Monto del presupuesto'), { target: { value: '0' } })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Monto del presupuesto'), { target: { value: '125000.50' } })
    expect(submit).not.toBeDisabled()
  })

  it('crea un caso Particular con los campos de seguro en null y navega a inspección', async () => {
    mockedCreateCaso.mockResolvedValue({ id: 'caso-particular' } as Awaited<ReturnType<typeof createCaso>>)
    renderPage()
    fireEvent.change(screen.getByLabelText('Canal'), { target: { value: 'particular' } })
    fillCommonFields()
    fireEvent.change(screen.getByLabelText('Monto del presupuesto'), { target: { value: '125000.50' } })
    fireEvent.change(screen.getByLabelText('Observaciones del presupuesto'), {
      target: { value: 'Reparación de capot' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Crear caso' }))

    await waitFor(() =>
      expect(mockedCreateCaso).toHaveBeenCalledWith(
        expect.objectContaining({
          canal: 'particular',
          patente: 'AC456DE',
          cliente_nombre: 'Ana Gómez',
          cliente_telefono: '1199887766',
          aseguradora: null,
          numero_siniestro: null,
          denuncia: null,
          productor_nombre: null,
          productor_telefono: null,
          presupuesto_monto: 125000.5,
          presupuesto_observaciones: 'Reparación de capot',
          presupuesto_respuesta: 'pendiente',
          modalidad_contacto: null,
          seguimiento_observaciones: null,
          inspeccion_guardada_at: null,
          created_by: 'user-1',
        })
      )
    )
    expect(await screen.findByText('FICHA DE INSPECCION')).toBeInTheDocument()
  })

  it('muestra un error recuperable y vuelve a habilitar el formulario si falla el alta', async () => {
    mockedCreateCaso.mockRejectedValue(new Error('network'))
    renderPage()
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Crear caso' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos crear el caso. Intentá nuevamente.'
    )
    expect(screen.getByRole('button', { name: 'Crear caso' })).not.toBeDisabled()
  })
})
