import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Empresa } from '@/lib/types'
import { normalizeCity } from '@/lib/utils'

export function useEmpresasCadastradas() {
  return useQuery<Empresa[]>({
    queryKey: ['empresas_cadastradas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_cadastradas')
        .select('*')
        .order('nome_fantasia', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as Empresa[]
    },
  })
}

export function useEmpresaById(id: string | null) {
  return useQuery<Empresa | null>({
    queryKey: ['empresas_cadastradas', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_cadastradas')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) return null
      return data as Empresa
    },
  })
}

export function useEmpresaByToken(token: string | null) {
  return useQuery<Empresa | null>({
    queryKey: ['empresas_cadastradas', 'token', token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_cadastradas')
        .select('*')
        .eq('fill_token', token!)
        .single()
      if (error) return null
      return data as Empresa
    },
  })
}

export function useSearchEmpresas(q: string, phoneDigits?: string, city?: string, uf?: string) {
  return useQuery<Empresa[]>({
    queryKey: ['empresas_cadastradas', 'search', q, phoneDigits, city, uf],
    enabled: q.trim().length >= 2 || (phoneDigits?.length ?? 0) >= 8,
    queryFn: async () => {
      const normalizedQuery = q.trim()
      const normalizedCity = normalizeCity(city ?? normalizedQuery)
      let query = supabase
        .from('empresas_cadastradas')
        .select('*')
        .limit(10)

      const orParts: string[] = []
      if (normalizedQuery.length >= 2) {
        orParts.push(
          `nome_fantasia.ilike.%${normalizedQuery}%`,
          `razao_social.ilike.%${normalizedQuery}%`,
          `cnpj.ilike.%${normalizedQuery}%`,
          `nome_responsavel.ilike.%${normalizedQuery}%`,
        )
      }
      if ((phoneDigits?.length ?? 0) >= 8) {
        orParts.push(`whatsapp_responsavel.ilike.%${phoneDigits}%`)
      }
      if (normalizedCity) {
        orParts.push(`cidade.ilike.%${normalizedCity}%`)
      }

      if (orParts.length > 0) {
        query = query.or(orParts.join(','))
      }

      if (uf) {
        query = query.eq('estado', uf)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Empresa[]
    },
  })
}

export function useCreateEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Empresa, 'id' | 'created_at' | 'updated_at' | 'fill_token' | 'fill_status'>) => {
      const { data: created, error } = await supabase
        .from('empresas_cadastradas')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return created as Empresa
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['empresas_cadastradas'] }),
  })
}

export function useUpdateEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Empresa> }) => {
      const { error } = await supabase
        .from('empresas_cadastradas')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['empresas_cadastradas'] })
      qc.invalidateQueries({ queryKey: ['empresas_cadastradas', id] })
    },
  })
}

export function useLinkEmpresaToLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, empresaId }: { leadId: string; empresaId: string | null }) => {
      const { error } = await supabase
        .from('leads_v2')
        .update({ empresa_id: empresaId })
        .eq('id', leadId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// Atualiza empresa via token (formulário público, sem auth)
export function useUpdateEmpresaByToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ token, data }: { token: string; data: Partial<Empresa> }) => {
      const { error } = await supabase
        .from('empresas_cadastradas')
        .update({ ...data, fill_status: 'preenchido', updated_at: new Date().toISOString() })
        .eq('fill_token', token)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['empresas_cadastradas'] }),
  })
}
