export interface CompressOptions {
  maxDimension?: number
  quality?: number
}

export function buildFotoPath(caseId: string, angulo: string): string {
  return `casos/${caseId}/${angulo}.webp`
}

export async function compressToWebP(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxDimension = 1920, quality = 0.8 } = options

  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D del canvas.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality })
  return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
