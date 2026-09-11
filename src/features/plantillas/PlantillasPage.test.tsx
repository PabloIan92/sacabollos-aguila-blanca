import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlantillasPage } from './PlantillasPage'
import * as casosApi from '../casos/api'
import * as crmApi from '../crm/api'
import type { Caso } from '../casos/types'
import type { Aseguradora } from '../crm/types'

vi.mock('../casos/api')
vi.mock('../crm/api')

describe('PlantillasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(casosApi.listCasos).mockResolvedValue([
      { id: '1', patente: 'AA111BB', cliente_nombre: 'Pepe', canal: 'seguro', aseguradora: 'Sura' } as Caso
    ])
    vi.mocked(crmApi.listAseguradoras).mockResolvedValue([
      { id: '1', nombre: 'Sura', email_siniestros: 'sura@test.com' } as Aseguradora
    ])

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renderiza selector de caso y carga datos', async () => {
    render(<PlantillasPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('select-caso')).toBeInTheDocument()
    })
    
    expect(screen.getByText('AA111BB - Pepe')).toBeInTheDocument()
  })

  it('genera email, llama clipboard y tiene mailto correcto', async () => {
    render(<PlantillasPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId('select-caso')).toBeInTheDocument()
    })

    const selectCaso = screen.getByTestId('select-caso')
    fireEvent.change(selectCaso, { target: { value: '1' } })

    const btnGenerar = screen.getByText('Generar Email')
    fireEvent.click(btnGenerar)

    expect(await screen.findByText('sura@test.com')).toBeInTheDocument()

    const btnCopiar = screen.getByText('Copiar al portapapeles')
    fireEvent.click(btnCopiar)
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
    expect(await screen.findByText('¡Copiado!')).toBeInTheDocument()

    const btnAbrir = screen.getByText('Abrir en correo')
    expect(btnAbrir.closest('a')).toHaveAttribute('href', expect.stringContaining('mailto:sura@test.com?subject='))
  })
})
