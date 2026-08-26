import { supabase } from '../../../lib/supabaseClient'
import { buildFotoPath, compressToWebP } from '../../../lib/imageCompression'

const SIGNED_URL_EXPIRES_IN = 3600

export function useCasoFotos() {
  async function uploadFoto(caseId: string, angulo: string, file: File): Promise<string> {
    const comprimido = await compressToWebP(file)
    const path = buildFotoPath(caseId, angulo)
    const { error } = await supabase.storage
      .from('casos-fotos')
      .upload(path, comprimido, { cacheControl: '3600', upsert: true })
    if (error) throw error
    return path
  }

  async function listFotos(
    caseId: string,
    angulos: readonly string[]
  ): Promise<Record<string, string>> {
    const paths = angulos.map((angulo) => buildFotoPath(caseId, angulo))
    const { data, error } = await supabase.storage
      .from('casos-fotos')
      .createSignedUrls(paths, SIGNED_URL_EXPIRES_IN)
    if (error) throw error

    const mapa: Record<string, string> = {}
    angulos.forEach((angulo, i) => {
      const entrada = data[i]
      if (entrada && !entrada.error && entrada.signedUrl) {
        mapa[angulo] = entrada.signedUrl
      }
    })
    return mapa
  }

  return { uploadFoto, listFotos }
}
