import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/lib/types'
import { isSuspiciousCity, needsLeadFollowUp, normalizeCity } from '@/lib/utils'

export type LeadFilter =
  | 'todos'
  | 'hoje'
  | 'ag_ismenia'
  | 'qualificados'
  | 'hot_lead'
  | 'follow_up'
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
  hoje:                 (q) => { const today = new Date().toISOString().split('T')[0]; return q.not('data_retorno', 'is', null).lte('data_retorno', today) },
  ag_ismenia:           (q) => q.ilike('etiqueta_chatwoot', '%aguardando_ismenia%'),
  qualificados:         (q) => q.eq('status', 'qualificado'),
  hot_lead:             (q) => q.ilike('etiqueta_chatwoot', '%hot_lead%'),
  follow_up:            (q) => q.ilike('etiqueta_chatwoot', '%visualizou_preco%'),
  lista_espera:         (q) => q.eq('status', 'lista_espera'),
  aguardando_pagamento: (q) => q.eq('status', 'aguardando_pagamento'),
  inscrito:             (q) => q.eq('status', 'inscrito'),
  visualizou_preco:     (q) => q.ilike('etiqueta_chatwoot', '%visualizou_preco%'),
}

export function useLeads(filter: LeadFilter = 'todos') {
  return useQuery<Lead[]>({
    queryKey: ['leads', filter],
    queryFn: async () => {
      if (filter.startsWith('cidade:')) {
        const city = normalizeCity(filter.slice(7).trim())
        if (!city) return []

        const { data, error } = await supabase
          .from('leads_v2')
          .select('*')
          .not('cidade', 'is', null)
          .order('ultimo_contato', { ascending: false, nullsFirst: false })
          .order('data_entrada', { ascending: false, nullsFirst: false })
          .limit(5000)

        if (error) throw error

        return ((data ?? []) as Lead[])
          .filter((lead) => !isSuspiciousCity(lead.cidade))
          .filter((lead) => normalizeCity(lead.cidade) === city)
          .slice(0, 200)
      }

      let query = supabase
        .from('leads_v2')
        .select('*')

      if (filter.startsWith('uf:')) {
        query = query.ilike('uf', filter.slice(3).trim())
      } else {
        query = FILTER_MAP[filter as FixedFilter](query)
      }

      if (filter === 'hoje') {
        query = query.order('data_retorno', { ascending: true }).limit(200)
      } else {
        query = query
          .order('ultimo_contato', { ascending: false, nullsFirst: false })
          .order('data_entrada', { ascending: false, nullsFirst: false })
          .limit(filter === 'follow_up' ? 500 : 200)
      }

      const { data, error } = await query
      if (error) throw error
      const leads = (data ?? []) as Lead[]
      if (filter === 'follow_up') {
        return leads.filter((lead) => needsLeadFollowUp(lead)).slice(0, 200)
      }
      return leads
    },
  })
}

export function useLeadsAgendaCount() {
  const today = new Date().toISOString().split('T')[0]
  return useQuery<number>({
    queryKey: ['leads', 'agenda-count', today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leads_v2')
        .select('*', { count: 'exact', head: true })
        .not('data_retorno', 'is', null)
        .lte('data_retorno', today)
      if (error) throw error
      return count ?? 0
    },
    staleTime: 60_000,
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
      const unique = new Map<string, string>()
      for (const row of data ?? []) {
        const raw = (row as { cidade: string | null }).cidade
        if (isSuspiciousCity(raw)) continue
        const normalized = normalizeCity(raw)
        if (!normalized) continue
        unique.set(normalized.toLocaleLowerCase('pt-BR'), normalized)
      }
      return [...unique.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))
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

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads_v2').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useTurma(id: string | null | undefined) {
  return useQuery<{ nome_treinamento: string | null; data_inicio: string | null; cidade: string | null } | null>({
    queryKey: ['turma', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('turmas')
        .select('nome_treinamento, data_inicio, cidade')
        .eq('id', id)
        .single()
      if (error) return null
      return data
    },
    staleTime: 10 * 60 * 1000,
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
        cidade: normalizeCity(data.cidade) ?? null,
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

export function useLeadsByProspecto(idProspecto: string | null) {
  return useQuery<Pick<Lead, 'id' | 'nome' | 'telefone' | 'status' | 'potencial' | 'etiqueta_chatwoot'>[]>({
    queryKey: ['leads', 'by-prospecto', idProspecto],
    enabled: !!idProspecto,
    queryFn: async () => {
      if (!idProspecto) return []
      const { data, error } = await supabase
        .from('leads_v2')
        .select('id,nome,telefone,status,potencial,etiqueta_chatwoot')
        .eq('id_prospecto', idProspecto)
        .order('data_entrada', { ascending: false })
      if (error) throw error
      return data as Pick<Lead, 'id' | 'nome' | 'telefone' | 'status' | 'potencial' | 'etiqueta_chatwoot'>[]
    },
    staleTime: 60 * 1000,
  })
}
