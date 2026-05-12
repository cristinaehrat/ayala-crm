import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/lib/types'

export type LeadFilter =
  | 'todos'
  | 'ag_ismenia'
  | 'qualificados'
  | 'hot_lead'
  | 'lista_espera'
  | 'aguardando_pagamento'
  | 'inscrito'
  | 'visualizou_preco'
  | `uf:${string}`
  | `cidade:${string}`

type FixedFilter = Exclude<LeadFilter, `uf:${string}` | `cidade:${string}`>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

const FILTER_MAP: Record<FixedFilter, (q: AnyQuery) => AnyQuery> = {
  todos:                (q) => q,
  ag_ismenia:           (q) => q.ilike('etiqueta_chatwoot', '%aguardando_ismenia%'),
  qualificados:         (q) => q.eq('status', 'qualificado'),
  hot_lead:             (q) => q.eq('etiqueta_chatwoot', 'hot_lead'),
  lista_espera:         (q) => q.eq('etiqueta_chatwoot', 'lista_espera'),
  aguardando_pagamento: (q) => q.eq('etiqueta_chatwoot', 'aguardando_pagamento'),
  inscrito:             (q) => q.eq('status', 'inscrito'),
  visualizou_preco:     (q) => q.ilike('etiqueta_chatwoot', '%visualizou_preco%'),
}

export function useLeads(filter: LeadFilter = 'todos') {
  return useQuery<Lead[]>({
    queryKey: ['leads', filter],
    queryFn: async () => {
      let query = supabase
        .from('leads_v2')
        .select('*')

      if (filter.startsWith('uf:')) {
        query = query.ilike('uf', filter.slice(3).trim())
      } else if (filter.startsWith('cidade:')) {
        query = query.ilike('cidade', filter.slice(7).trim())
      } else {
        query = FILTER_MAP[filter as FixedFilter](query)
      }

      query = query
        .order('ultimo_contato', { ascending: false, nullsFirst: false })
        .order('data_entrada', { ascending: false, nullsFirst: false })
        .limit(200)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Lead[]
    },
  })
}

export function useDistinctUFs() {
  return useQuery<string[]>({
    queryKey: ['distinct-ufs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_v2')
        .select('uf')
        .not('uf', 'is', null)
        .neq('uf', '')
        .limit(5000)
      if (error) throw error
      const all = (data ?? [])
        .map((r: { uf: string | null }) => r.uf?.trim().toUpperCase())
        .filter((v): v is string => !!v)
      return [...new Set(all)].sort()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useDistinctCidades() {
  return useQuery<string[]>({
    queryKey: ['distinct-cidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_v2')
        .select('cidade')
        .not('cidade', 'is', null)
        .neq('cidade', '')
        .limit(5000)
      if (error) throw error
      const all = (data ?? [])
        .map((r: { cidade: string | null }) => r.cidade?.trim())
        .filter((v): v is string => !!v)
      return [...new Set(all)].sort()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useLead(id: string | null) {
  return useQuery<Lead | null>({
    queryKey: ['lead', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('leads_v2')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Lead
    },
  })
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('leads_v2')
        .update({ status, ultimo_contato: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
    },
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const { error } = await supabase
        .from('leads_v2')
        .update({ ...data, ultimo_contato: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', id] })
    },
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      telefone: string
      nome?: string
      empresa_oficina?: string
      cidade?: string
      uf?: string
      marca_interesse?: string
      canal_origem?: string
      potencial?: string
    }) => {
      const { error } = await supabase.from('leads_v2').insert({
        ...data,
        status: 'lead_novo',
        data_entrada: new Date().toISOString(),
        ultimo_contato: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
