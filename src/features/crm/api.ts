import { supabase } from '../../lib/supabaseClient'
import type {
  Aseguradora,
  Cliente,
  CreateAseguradoraInput,
  CreateClienteInput,
  CreateProductorInput,
  Productor,
  UpdateAseguradoraInput,
  UpdateClienteInput,
  UpdateProductorInput,
} from './types'

// ==========================================
// CLIENTES
// ==========================================

export async function listClientes(): Promise<Cliente[]> {
  const { data: clientesData, error: clientesError } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre', { ascending: true })

  if (clientesError) throw clientesError
  const clientes = (clientesData || []) as Cliente[]
  if (clientes.length === 0) return []

  // Consultar casos para enriquecer con cantidad de casos y patentes
  const { data: casosData } = await supabase
    .from('casos')
    .select('cliente_nombre, patente')

  const casosMap = new Map<string, string[]>()
  for (const c of casosData || []) {
    if (c.cliente_nombre) {
      const key = c.cliente_nombre.trim().toLowerCase()
      const list = casosMap.get(key) || []
      if (c.patente && !list.includes(c.patente)) {
        list.push(c.patente)
      }
      casosMap.set(key, list)
    }
  }

  return clientes.map((cli) => {
    const patentes = casosMap.get(cli.nombre.trim().toLowerCase()) || []
    return {
      ...cli,
      total_casos: patentes.length,
      patentes,
    }
  })
}

export async function createCliente(input: CreateClienteInput): Promise<Cliente> {
  const nombreLimpio = input.nombre?.trim()
  if (!nombreLimpio) {
    throw new Error('El nombre del cliente es obligatorio')
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: nombreLimpio,
      telefono: input.telefono?.trim() || null,
      email: input.email?.trim() || null,
      direccion: input.direccion?.trim() || null,
      notas: input.notas?.trim() || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Cliente
}

export async function updateCliente(id: string, input: UpdateClienteInput): Promise<Cliente> {
  const payload: any = {}
  if (input.nombre !== undefined) {
    const nombre = input.nombre.trim()
    if (!nombre) throw new Error('El nombre del cliente es obligatorio')
    payload.nombre = nombre
  }
  if (input.telefono !== undefined) payload.telefono = input.telefono?.trim() || null
  if (input.email !== undefined) payload.email = input.email?.trim() || null
  if (input.direccion !== undefined) payload.direccion = input.direccion?.trim() || null
  if (input.notas !== undefined) payload.notas = input.notas?.trim() || null

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Cliente
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}

// ==========================================
// ASEGURADORAS
// ==========================================

export async function listAseguradoras(): Promise<Aseguradora[]> {
  const { data: asegData, error: asegError } = await supabase
    .from('aseguradoras')
    .select('*')
    .order('nombre', { ascending: true })

  if (asegError) throw asegError
  const aseguradoras = (asegData || []) as Aseguradora[]
  if (aseguradoras.length === 0) return []

  // Consultar casos para estadísticas de aseguradoras
  const { data: casosData } = await supabase
    .from('casos')
    .select('aseguradora, estado')

  const totalMap = new Map<string, number>()
  const reclamosMap = new Map<string, number>()

  for (const c of casosData || []) {
    if (c.aseguradora) {
      const key = c.aseguradora.trim().toLowerCase()
      totalMap.set(key, (totalMap.get(key) || 0) + 1)
      if (c.estado === 'reclamo a la compañía') {
        reclamosMap.set(key, (reclamosMap.get(key) || 0) + 1)
      }
    }
  }

  return aseguradoras.map((a) => {
    const key = a.nombre.trim().toLowerCase()
    return {
      ...a,
      total_casos: totalMap.get(key) || 0,
      casos_en_reclamo: reclamosMap.get(key) || 0,
    }
  })
}

export async function createAseguradora(input: CreateAseguradoraInput): Promise<Aseguradora> {
  const nombreLimpio = input.nombre?.trim()
  if (!nombreLimpio) {
    throw new Error('El nombre de la aseguradora es obligatorio')
  }

  const { data, error } = await supabase
    .from('aseguradoras')
    .insert({
      nombre: nombreLimpio,
      email_siniestros: input.email_siniestros?.trim() || null,
      telefono_contacto: input.telefono_contacto?.trim() || null,
      contacto_nombre: input.contacto_nombre?.trim() || null,
      notas: input.notas?.trim() || null,
      activa: input.activa ?? true,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Aseguradora
}

export async function updateAseguradora(
  id: string,
  input: UpdateAseguradoraInput
): Promise<Aseguradora> {
  const payload: any = {}
  if (input.nombre !== undefined) {
    const nombre = input.nombre.trim()
    if (!nombre) throw new Error('El nombre de la aseguradora es obligatorio')
    payload.nombre = nombre
  }
  if (input.email_siniestros !== undefined)
    payload.email_siniestros = input.email_siniestros?.trim() || null
  if (input.telefono_contacto !== undefined)
    payload.telefono_contacto = input.telefono_contacto?.trim() || null
  if (input.contacto_nombre !== undefined)
    payload.contacto_nombre = input.contacto_nombre?.trim() || null
  if (input.notas !== undefined) payload.notas = input.notas?.trim() || null
  if (input.activa !== undefined) payload.activa = input.activa

  const { data, error } = await supabase
    .from('aseguradoras')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Aseguradora
}

export async function deleteAseguradora(id: string): Promise<void> {
  const { error } = await supabase.from('aseguradoras').delete().eq('id', id)
  if (error) throw error
}

// ==========================================
// PRODUCTORES
// ==========================================

export async function listProductores(): Promise<Productor[]> {
  const { data: prodData, error: prodError } = await supabase
    .from('productores')
    .select('*')
    .order('nombre', { ascending: true })

  if (prodError) throw prodError
  const productores = (prodData || []) as Productor[]
  if (productores.length === 0) return []

  const { data: casosData } = await supabase
    .from('casos')
    .select('productor_nombre')

  const totalMap = new Map<string, number>()
  for (const c of casosData || []) {
    if (c.productor_nombre) {
      const key = c.productor_nombre.trim().toLowerCase()
      totalMap.set(key, (totalMap.get(key) || 0) + 1)
    }
  }

  return productores.map((p) => ({
    ...p,
    total_casos: totalMap.get(p.nombre.trim().toLowerCase()) || 0,
  }))
}

export async function createProductor(input: CreateProductorInput): Promise<Productor> {
  const nombreLimpio = input.nombre?.trim()
  if (!nombreLimpio) {
    throw new Error('El nombre del productor es obligatorio')
  }

  const { data, error } = await supabase
    .from('productores')
    .insert({
      nombre: nombreLimpio,
      telefono: input.telefono?.trim() || null,
      email: input.email?.trim() || null,
      aseguradora: input.aseguradora?.trim() || null,
      notas: input.notas?.trim() || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Productor
}

export async function updateProductor(
  id: string,
  input: UpdateProductorInput
): Promise<Productor> {
  const payload: any = {}
  if (input.nombre !== undefined) {
    const nombre = input.nombre.trim()
    if (!nombre) throw new Error('El nombre del productor es obligatorio')
    payload.nombre = nombre
  }
  if (input.telefono !== undefined) payload.telefono = input.telefono?.trim() || null
  if (input.email !== undefined) payload.email = input.email?.trim() || null
  if (input.aseguradora !== undefined) payload.aseguradora = input.aseguradora?.trim() || null
  if (input.notas !== undefined) payload.notas = input.notas?.trim() || null

  const { data, error } = await supabase
    .from('productores')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Productor
}

export async function deleteProductor(id: string): Promise<void> {
  const { error } = await supabase.from('productores').delete().eq('id', id)
  if (error) throw error
}
