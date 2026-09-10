import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FotoUploader } from './FotoUploader'
import { useCasoFotos } from '../hooks/useCasoFotos'

vi.mock('../hooks/useCasoFotos', () => ({ useCasoFotos: vi.fn() }))

const mockedUseCasoFotos = vi.mocked(useCasoFotos)
const uploadFoto = vi.fn()
const listFotos = vi.fn()
const onUploadedCountChange = vi.fn()

const ANGULOS = ['frente', 'atras'] as const

function renderUploader() {
  return render(
    <FotoUploader
      caseId="caso-1"
      angulos={ANGULOS}
      onUploadedCountChange={onUploadedCountChange}
    />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:foto-local')
  URL.revokeObjectURL = vi.fn()
  uploadFoto.mockResolvedValue('casos/caso-1/frente.webp')
  listFotos.mockResolvedValue({})
  mockedUseCasoFotos.mockReturnValue({ uploadFoto, listFotos })
})

describe('FotoUploader', () => {
  it('rehidrata al montar las fotos persistidas y cuenta solo las URLs válidas', async () => {
    listFotos.mockResolvedValue({
      frente: 'https://storage.test/frente.webp',
    })

    renderUploader()

    expect(listFotos).toHaveBeenCalledWith('caso-1', ANGULOS)
    expect(await screen.findByAltText('Preview frente')).toHaveAttribute(
      'src',
      'https://storage.test/frente.webp'
    )
    expect(screen.queryByAltText('Preview atras')).not.toBeInTheDocument()
    await waitFor(() => expect(onUploadedCountChange).toHaveBeenLastCalledWith(1))
  })

  it('ignora una rehidratación que termina después de desmontarse', async () => {
    let resolveFotos!: (fotos: Record<string, string>) => void
    listFotos.mockReturnValue(new Promise((resolve) => (resolveFotos = resolve)))

    const { unmount } = renderUploader()
    unmount()
    resolveFotos({ frente: 'https://storage.test/frente.webp' })

    await Promise.resolve()
    expect(onUploadedCountChange).not.toHaveBeenCalledWith(1)
  })

  it('mantiene el uploader usable si falla la consulta de fotos existentes', async () => {
    listFotos.mockRejectedValue(new Error('storage unavailable'))
    renderUploader()

    await waitFor(() => expect(onUploadedCountChange).toHaveBeenLastCalledWith(0))
    expect(screen.getAllByLabelText(/^Foto /)).toHaveLength(2)
  })

it('muestra alerta y permite reintentar cuando falla listFotos', async () => {
    listFotos.mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValueOnce({ frente: 'https://storage.test/frente.webp' })
    renderUploader()

    // Esperar a que aparezca la alerta
    const alertElement = await screen.findByRole('alert')
    expect(alertElement).toHaveTextContent('No se pudieron cargar las fotos existentes.')
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()

    // Hacer clic en reintentar
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    // Verificar que se intenta listar nuevamente
    await waitFor(() => {
      expect(listFotos).toHaveBeenCalledTimes(2)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    const previewElement = await screen.findByAltText('Preview frente')
    expect(previewElement).toHaveAttribute('src', 'https://storage.test/frente.webp')
})

  it('maneja error en uploadFoto, revoca URL y permite reintentar', async () => {
    listFotos.mockResolvedValue({})
    renderUploader()

    const file = new File(['foto'], 'frente.jpg', { type: 'image/jpeg' })

    // Simular error en la primera subida
    uploadFoto.mockRejectedValueOnce(new Error('upload failed'))

    fireEvent.change(screen.getByLabelText('Foto frente'), { target: { files: [file] } })

    // Esperar a que aparezca la alerta de error
    const alertElement = await screen.findByRole('alert')
    expect(alertElement).toHaveTextContent('No se pudo subir la foto. Intentá nuevamente.')
    // Verificar que se revocó la URL
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto-local')

    // Verificar que el input sigue habilitado
    expect(screen.getByLabelText('Foto frente')).not.toBeDisabled()

    // Simular éxito en el reintento
    uploadFoto.mockResolvedValueOnce('casos/caso-1/frente.webp')

    // Volver a seleccionar el archivo para reintentar
    fireEvent.change(screen.getByLabelText('Foto frente'), { target: { files: [file] } })

    // Verificar que se intenta subir nuevamente
    expect(uploadFoto).toHaveBeenCalledTimes(2)

    // Después del reintento exitoso, la alerta debería desaparecer
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    // Y debería mostrar la preview
    const previewElement = await screen.findByAltText('Preview frente')
    expect(previewElement).toHaveAttribute('src', 'blob:foto-local')
  })

  it('revoca al desmontar solo las object URLs creadas para archivos locales', async () => {
    listFotos.mockResolvedValue({ frente: 'https://storage.test/frente.webp' })
    const { unmount } = renderUploader()
    await screen.findByAltText('Preview frente')

    const file = new File(['foto'], 'atras.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Foto atras'), { target: { files: [file] } })
    await screen.findByAltText('Preview atras')

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto-local')
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('https://storage.test/frente.webp')
  });
})