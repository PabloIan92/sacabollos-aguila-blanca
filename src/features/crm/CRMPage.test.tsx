import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CRMPage } from './CRMPage'
import * as crmApi from './api'
import type { Aseguradora, Cliente, Productor } from './types'

vi.mock('./api', () => ({
  listClientes: vi.fn(),
  createCliente: vi.fn(),
  updateCliente: vi.fn(),
  deleteCliente: vi.fn(),
  listAseguradoras: vi.fn(),
  createAseguradora: vi.fn(),
  updateAseguradora: vi.fn(),
  deleteAseguradora: vi.fn(),
  listProductores: vi.fn(),
  createProductor: vi.fn(),
  updateProductor: vi.fn(),
  deleteProductor: vi.fn(),
}))

const mockedListClientes = vi.mocked(crmApi.listClientes)
const mockedCreateCliente = vi.mocked(crmApi.createCliente)
const mockedDeleteCliente = vi.mocked(crmApi.deleteCliente)
const mockedListAseguradoras = vi.mocked(crmApi.listAseguradoras)
const mockedCreateAseguradora = vi.mocked(crmApi.createAseguradora)
const mockedListProductores = vi.mocked(crmApi.listProductores)

const mockClientes: Cliente[] = [
  {
    id: 'cli-1',
    nombre: 'Juan Pérez',
    telefono: '1122334455',
    email: 'juan@gmail.com',
    direccion: 'Av. Mitre 1234',
    notas: 'Cliente recurrente particular',
    total_casos: 2,
    patentes: ['AA123BB', 'CC999DD'],
    created_at: '2026-09-01',
    updated_at: '2026-09-01',
  },
  {
    id: 'cli-2',
    nombre: 'María González',
    telefono: '1199887766',
    email: null,
    direccion: null,
    notas: null,
    total_casos: 1,
    patentes: ['AB456CD'],
    created_at: '2026-09-02',
    updated_at: '2026-09-02',
  },
]

const mockAseguradoras: Aseguradora[] = [
  {
    id: 'as-1',
    nombre: 'San Cristóbal',
    email_siniestros: 'siniestros@sancristobal.com.ar',
    telefono_contacto: '0810-222-7262',
    contacto_nombre: 'Damián Liquidador',
    notas: 'Convenio directo',
    activa: true,
    total_casos: 5,
    casos_en_reclamo: 1,
    created_at: '2026-09-01',
    updated_at: '2026-09-01',
  },
]

const mockProductores: Productor[] = [
  {
    id: 'pr-1',
    nombre: 'Carlos Asesor',
    telefono: '1133445566',
    email: 'carlos@asesor.com',
    aseguradora: 'San Cristóbal',
    notas: 'Envía 3 autos por mes',
    total_casos: 3,
    created_at: '2026-09-01',
    updated_at: '2026-09-01',
  },
]

describe('CRMPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedListClientes.mockResolvedValue(mockClientes)
    mockedListAseguradoras.mockResolvedValue(mockAseguradoras)
    mockedListProductores.mockResolvedValue(mockProductores)
  })

  it('renderiza la lista de clientes por defecto con sus patentes y teléfonos', async () => {
    render(
      <MemoryRouter>
        <CRMPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    expect(screen.getByText('María González')).toBeInTheDocument()
    expect(screen.getByText('AA123BB')).toBeInTheDocument()
    expect(screen.getByText('CC999DD')).toBeInTheDocument()
    expect(screen.getByText('1122334455')).toBeInTheDocument()
  })

  it('permite cambiar a la pestaña de Aseguradoras', async () => {
    render(
      <MemoryRouter>
        <CRMPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const tabAseguradoras = screen.getByRole('tab', { name: /aseguradoras/i })
    fireEvent.click(tabAseguradoras)

    await waitFor(() => {
      expect(screen.getByText('San Cristóbal')).toBeInTheDocument()
    })

    expect(screen.getByText('siniestros@sancristobal.com.ar')).toBeInTheDocument()
    expect(screen.getByText(/5 siniestros/i)).toBeInTheDocument()
    expect(screen.getByText(/1 en reclamo/i)).toBeInTheDocument()
  })

  it('permite cambiar a la pestaña de Productores', async () => {
    render(
      <MemoryRouter>
        <CRMPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const tabProductores = screen.getByRole('tab', { name: /productores/i })
    fireEvent.click(tabProductores)

    await waitFor(() => {
      expect(screen.getByText('Carlos Asesor')).toBeInTheDocument()
    })

    expect(screen.getByText(/San Cristóbal/i)).toBeInTheDocument()
    expect(screen.getByText(/3 casos derivados/i)).toBeInTheDocument()
  })

  it('filtra clientes mediante el buscador', async () => {
    render(
      <MemoryRouter>
        <CRMPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/buscar clientes/i)
    fireEvent.change(searchInput, { target: { value: 'María' } })

    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
    expect(screen.getByText('María González')).toBeInTheDocument()
  })

  it('abre modal para crear nuevo cliente y lo guarda llamando a createCliente', async () => {
    mockedCreateCliente.mockResolvedValue({
      id: 'cli-3',
      nombre: 'Nuevo Cliente',
      telefono: '1144778899',
      email: null,
      direccion: null,
      notas: null,
      created_at: '2026-09-10',
      updated_at: '2026-09-10',
    })

    render(
      <MemoryRouter>
        <CRMPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const btnNuevo = screen.getByRole('button', { name: /nuevo cliente/i })
    fireEvent.click(btnNuevo)

    const inputNombre = screen.getByLabelText(/nombre completo/i)
    const inputTelefono = screen.getByLabelText(/teléfono/i)

    fireEvent.change(inputNombre, { target: { value: 'Nuevo Cliente' } })
    fireEvent.change(inputTelefono, { target: { value: '1144778899' } })

    const btnGuardar = screen.getByRole('button', { name: /guardar cliente/i })
    fireEvent.click(btnGuardar)

    await waitFor(() => {
      expect(mockedCreateCliente).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nuevo Cliente',
          telefono: '1144778899',
        })
      )
    })
  })

  it('elimina un cliente tras confirmación explícita', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockedDeleteCliente.mockResolvedValue()

    render(
      <MemoryRouter>
        <CRMPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const btnEliminar = screen.getAllByRole('button', { name: /eliminar cliente/i })[0]
    fireEvent.click(btnEliminar)

    await waitFor(() => {
      expect(mockedDeleteCliente).toHaveBeenCalledWith('cli-1')
    })
  })

  it('abre modal para crear nueva aseguradora y la guarda', async () => {
    mockedCreateAseguradora.mockResolvedValue({
      id: 'as-2',
      nombre: 'La Segunda',
      email_siniestros: 'siniestros@lasegunda.com',
      telefono_contacto: null,
      contacto_nombre: null,
      notas: null,
      activa: true,
      created_at: '2026-09-10',
      updated_at: '2026-09-10',
    })

    render(
      <MemoryRouter>
        <CRMPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    const tabAseguradoras = screen.getByRole('tab', { name: /aseguradoras/i })
    fireEvent.click(tabAseguradoras)

    const btnNueva = screen.getByRole('button', { name: /nueva aseguradora/i })
    fireEvent.click(btnNueva)

    const inputNombre = screen.getByLabelText(/nombre de la compañía/i)
    fireEvent.change(inputNombre, { target: { value: 'La Segunda' } })

    const btnGuardar = screen.getByRole('button', { name: /guardar aseguradora/i })
    fireEvent.click(btnGuardar)

    await waitFor(() => {
      expect(mockedCreateAseguradora).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'La Segunda',
        })
      )
    })
  })
})
