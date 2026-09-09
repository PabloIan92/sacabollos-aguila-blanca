import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FotoUploader } from './FotoUploader'
import { useCasoFotos } from '../hooks/useCasoFotos'

vi.mock('../hooks/useCasoFotos')

const mockedUseCasoFotos = vi.mocked(useCasoFotos)
const uploadFoto = vi.fn()
const listFotos = vi.fn()
const angulos = ['frente', 'atras', 'lateral-izquierdo', 'lateral-derecho'] as const

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:foto-local')
  URL.revokeObjectURL = vi.fn()
  uploadFoto.mockResolvedValue('casos/caso-1/frente.webp')
  listFotos.mockResolvedValue({})
  mockedUseCasoFotos.mockReturnValue({ uploadFoto, listFotos })
})

describe('FotoUploader', () => {
  it('recupera las fotos existentes y cuenta solo URLs válidas de los ángulos requeridos', async () => {
    listFotos.mockResolvedValue({
      frente: 'https://storage.example/frente.webp',
      atras: '',
      'lateral-izquierdo': 'no-es-una-url',
      'lateral-derecho': 'https://storage.example/lateral-derecho.webp',
      extra: 'https://storage.example/extra.webp',
    })
    const onUploadedCountChange = vi.fn()

    render(
      <FotoUploader
        caseId="caso-1"
        angulos={angulos}
        onUploadedCountChange={onUploadedCountChange}
      />
    )

    await waitFor(() => expect(listFotos).toHaveBeenCalledWith('caso-1', angulos))
    expect(await screen.findByAltText('Preview frente')).toHaveAttribute(
      'src',
      'https://storage.example/frente.webp'
    )
    expect(screen.getByAltText('Preview lateral derecho')).toHaveAttribute(
      'src',
      'https://storage.example/lateral-derecho.webp'
    )
    expect(screen.queryByAltText('Preview atras')).not.toBeInTheDocument()
    expect(screen.queryByAltText('Preview lateral izquierdo')).not.toBeInTheDocument()
    await waitFor(() => expect(onUploadedCountChange).toHaveBeenLastCalledWith(2))
  })

  it('sale de la carga fallida, muestra un mensaje fijo y permite reintentar', async () => {
    listFotos
      .mockRejectedValueOnce(new Error('storage unavailable'))
      .mockResolvedValueOnce({ frente: 'https://storage.example/frente.webp' })

    render(
      <FotoUploader
        caseId="caso-1"
        angulos={angulos}
        onUploadedCountChange={vi.fn()}
      />
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las fotos. Intentá nuevamente.'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar carga de fotos' }))

    expect(await screen.findByAltText('Preview frente')).toBeInTheDocument()
    expect(listFotos).toHaveBeenCalledTimes(2)
  })

  it('sale de una subida fallida, conserva el control y permite reintentar', async () => {
    uploadFoto
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce('casos/caso-1/frente.webp')
    render(
      <FotoUploader
        caseId="caso-1"
        angulos={angulos}
        onUploadedCountChange={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Foto frente')
    const file = new File(['foto'], 'frente.jpg', { type: 'image/jpeg' })

    await waitFor(() => expect(input).toBeEnabled())
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo subir la foto. Intentá nuevamente.'
    )
    expect(screen.queryByText('Subiendo…')).not.toBeInTheDocument()
    expect(input).toBeEnabled()

    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByAltText('Preview frente')).toBeInTheDocument()
    expect(uploadFoto).toHaveBeenCalledTimes(2)
  })
})
