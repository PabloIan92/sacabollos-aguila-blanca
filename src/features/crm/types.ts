export interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  notas: string | null
  created_at: string
  updated_at: string
  total_casos?: number
  patentes?: string[]
}

export interface CreateClienteInput {
  nombre: string
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  notas?: string | null
}

export type UpdateClienteInput = Partial<CreateClienteInput>

export interface Aseguradora {
  id: string
  nombre: string
  email_siniestros: string | null
  telefono_contacto: string | null
  contacto_nombre: string | null
  notas: string | null
  activa: boolean
  created_at: string
  updated_at: string
  total_casos?: number
  casos_en_reclamo?: number
}

export interface CreateAseguradoraInput {
  nombre: string
  email_siniestros?: string | null
  telefono_contacto?: string | null
  contacto_nombre?: string | null
  notas?: string | null
  activa?: boolean
}

export type UpdateAseguradoraInput = Partial<CreateAseguradoraInput>

export interface Productor {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  aseguradora: string | null
  notas: string | null
  created_at: string
  updated_at: string
  total_casos?: number
}

export interface CreateProductorInput {
  nombre: string
  telefono?: string | null
  email?: string | null
  aseguradora?: string | null
  notas?: string | null
}

export type UpdateProductorInput = Partial<CreateProductorInput>

export type CRMTab = 'clientes' | 'aseguradoras' | 'productores'
