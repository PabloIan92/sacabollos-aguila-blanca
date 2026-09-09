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
  const numeroSiniestro = screen.queryByLabelText('Número de siniestro')
  const denuncia = screen.queryByLabelText('Denuncia')
  if (numeroSiniestro && denuncia) {
    fireEvent.change(numeroSiniestro, { target: { value: 'S-1' } })
    fireEvent.change(denuncia, { target: { value: 'Choque en cruce' } })
  }
}

function selectParticular() {
  fireEvent.change(screen.getByLabelText('Canal'), { target: { value: 'particular' } })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { user: { id: 'user-1' } },
  } as unknown as ReturnType<typeof useAuth>)
})

describe('CasoNuevoPage', () => {
  it('muestra Seguro por defecto y permite cambiar a Particular', () => {
    renderPage()

    expect(screen.getByLabelText('Canal')).toHaveValue('seguro')
    expect(screen.getByLabelText('Aseguradora')).toBeInTheDocument()
    expect(screen.queryByLabelText('Presupuesto')).not.toBeInTheDocument()

    selectParticular()

    expect(screen.getByLabelText('Canal')).toHaveValue('particular')
    expect(screen.queryByLabelText('Aseguradora')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Número de siniestro')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Denuncia')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Productor / asesor')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Presupuesto')).toBeInTheDocument()
    expect(screen.getByLabelText('Observaciones del presupuesto')).toBeInTheDocument()
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

  it('exige un presupuesto mayor que cero para un particular', () => {
    renderPage()
    selectParticular()
    fillRequiredFields()
    const submit = screen.getByRole('button', { name: 'Crear caso' })

    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Presupuesto'), { target: { value: '0' } })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Presupuesto'), { target: { value: '-1' } })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Presupuesto'), { target: { value: '150000.50' } })
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

  it('crea un particular sin campos de seguro y con observaciones opcionales', async () => {
    mockedCreateCaso.mockResolvedValue({
      id: 'caso-particular-1',
    } as unknown as Awaited<ReturnType<typeof createCaso>>)
    renderPage()
    selectParticular()
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Presupuesto'), { target: { value: '150000.50' } })
    fireEvent.change(screen.getByLabelText('Observaciones del presupuesto'), {
      target: { value: 'Incluye materiales' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Crear caso' }))

    await waitFor(() => expect(mockedCreateCaso).toHaveBeenCalledTimes(1))
    const payload = mockedCreateCaso.mock.calls[0][0]
    expect(payload).toEqual(
      expect.objectContaining({
        canal: 'particular',
        patente: 'AA123BB',
        cliente_nombre: 'Juan Pérez',
        cliente_telefono: '1122334455',
        presupuesto_monto: 150000.5,
        presupuesto_observaciones: 'Incluye materiales',
        created_by: 'user-1',
      })
    )
    expect(payload).not.toHaveProperty('aseguradora')
    expect(payload).not.toHaveProperty('numero_siniestro')
    expect(payload).not.toHaveProperty('denuncia')
    expect(payload).not.toHaveProperty('productor_nombre')
    expect(payload).not.toHaveProperty('productor_telefono')
    expect(await screen.findByText('FICHA DE INSPECCION')).toBeInTheDocument()
  })

  it('envía null cuando las observaciones del presupuesto quedan vacías', async () => {
    mockedCreateCaso.mockResolvedValue({
      id: 'caso-particular-1',
    } as unknown as Awaited<ReturnType<typeof createCaso>>)
    renderPage()
    selectParticular()
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Presupuesto'), { target: { value: '1' } })

    fireEvent.click(screen.getByRole('button', { name: 'Crear caso' }))

    await waitFor(() =>
      expect(mockedCreateCaso).toHaveBeenCalledWith(
        expect.objectContaining({ presupuesto_observaciones: null })
      )
    )
  })

  it('muestra un error fijo, conserva los datos y permite reintentar', async () => {
    mockedCreateCaso
      .mockRejectedValueOnce(new Error('duplicate key value violates constraint casos_pkey'))
      .mockResolvedValueOnce({ id: 'caso-2' } as unknown as Awaited<ReturnType<typeof createCaso>>)
    renderPage()
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Crear caso' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo crear el caso. Intentá nuevamente.'
    )
    expect(screen.queryByText(/duplicate key/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Cliente')).toHaveValue('Juan Pérez')
    const retry = screen.getByRole('button', { name: 'Crear caso' })
    expect(retry).not.toBeDisabled()

    fireEvent.click(retry)

    await waitFor(() => expect(mockedCreateCaso).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('FICHA DE INSPECCION')).toBeInTheDocument()
  })
})
