import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeCity } from '@/lib/utils'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export interface Prospecto {
  id_visita: string
  data_visita: string | null
  consultor: string | null
  empresa_oficina: string | null
  nome_responsavel_treinamento: string | null
  nome_contato_inicial: string | null
  whatsapp_responsavel: string | null
  cidade: string | null
  uf: string | null
  tipo_oficina: string | null
  porte_oficina: string | null
  multimarcas: boolean | null
  especializacao_oficina: string | null
  marca_interesse: string | null
  perfil: string | null
  qtd_interessados: string | null
  potencial: string | null
  resultado_visita: string | null
  proximo_passo: string | null
  data_retorno: string | null
  empresa_parceira: string | null
  observacoes: string | null
  status_contato: string | null
  data_tentativa_1: string | null
  data_tentativa_2: string | null
  data_tentativa_3: string | null
  qualificado_lead: boolean | null
  convertido_lead: boolean | null
  endereco: string | null
  place_id: string | null
  telefone_oficina: string | null
  telefone_financeiro: string | null
  telefone_participante: string | null
  participantes: { nome: string; telefone: string }[] | null
  instagram_handle: string | null
  facebook_url: string | null
  website_url: string | null
  empresa_id: string | null
}

export type ProspectoFilter = 'todos' | 'a_contatar' | 'em_followup' | 'sem_leads' | 'com_leads' | 'hoje'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

const FILTER_MAP: Record<ProspectoFilter, (q: AnyQuery) => AnyQuery> = {
  todos:       (q) => q,
  a_contatar:  (q) => q.or('status_contato.eq.a_contatar,status_contato.is.null').eq('qualificado_lead', false),
  em_followup: (q) => q.in('status_contato', ['tentativa_1', 'tentativa_2', 'tentativa_3']),
  sem_leads:   (q) => q,
  com_leads:   (q) => q,
  hoje:        (q) => {
    const today = new Date().toISOString().split('T')[0]
    return q.not('data_retorno', 'is', null).lte('data_retorno', today)
  },
}

export function useProspectos(filter: ProspectoFilter = 'todos', uf?: string, cidade?: string) {
  return useQuery<Prospecto[]>({
    queryKey: ['prospectos', filter, uf, cidade],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase.from('cadastro_prospectos').select('*')
      q = FILTER_MAP[filter](q)
      if (uf) q = q.eq('uf', uf)
      if (cidade) q = q.eq('cidade', cidade)
      if (filter === 'hoje') {
        q = q.order('data_retorno', { ascending: true }).limit(300)
      } else {
        q = q.order('data_visita', { ascending: false, nullsFirst: false }).limit(300)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Prospecto[]
    },
  })
}

export function useProspectosByDataVisita(date: string | null) {
  return useQuery<Prospecto[]>({
    queryKey: ['prospectos', 'data_visita', date],
    enabled: !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cadastro_prospectos')
        .select('*')
        .eq('data_visita', date!)
        .order('empresa_oficina', { ascending: true })
      if (error) throw error
      return (data ?? []) as Prospecto[]
    },
  })
}

export function useProspectosAgendaCount() {
  const today = new Date().toISOString().split('T')[0]
  return useQuery<number>({
    queryKey: ['prospectos', 'agenda-count', today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('cadastro_prospectos')
        .select('*', { count: 'exact', head: true })
        .not('data_retorno', 'is', null)
        .lte('data_retorno', today)
      if (error) throw error
      return count ?? 0
    },
    staleTime: 60_000,
  })
}

export function useSearchProspectos(query: string, phoneDigits?: string, city?: string, uf?: string) {
  return useQuery<Prospecto[]>({
    queryKey: ['prospectos', 'search', query, phoneDigits, city, uf],
    enabled: query.trim().length >= 2 || (phoneDigits?.length ?? 0) >= 8,
    queryFn: async () => {
      const normalizedQuery = removeAccents(query.trim())
      const normalizedCity = normalizeCity(city ?? query.trim())
      let q = supabase
        .from('cadastro_prospectos')
        .select('*')
        .limit(8)

      const orParts: string[] = []
      if (normalizedQuery.length >= 2) {
        orParts.push(
          `empresa_oficina.ilike.%${normalizedQuery}%`,
          `nome_responsavel_treinamento.ilike.%${normalizedQuery}%`,
          `nome_contato_inicial.ilike.%${normalizedQuery}%`,
        )
        if (normalizedCity) {
          orParts.push(`cidade.ilike.%${normalizedCity}%`)
        }
      }
      if ((phoneDigits?.length ?? 0) >= 8) {
        orParts.push(`whatsapp_responsavel.ilike.%${phoneDigits}%`)
        orParts.push(`telefone_oficina.ilike.%${phoneDigits}%`)
        orParts.push(`telefone.ilike.%${phoneDigits}%`)
      }

      if (orParts.length > 0) {
        q = q.or(orParts.join(','))
      }

      if (uf) {
        q = q.eq('uf', uf)
      }

      q = q.order('data_visita', { ascending: false, nullsFirst: false })
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Prospecto[]
    },
  })
}


export function useProspectoLeadCounts() {
  return useQuery<Record<string, number>>({
    queryKey: ['prospectos', 'lead-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_v2')
        .select('id_prospecto')
        .not('id_prospecto', 'is', null)
        .limit(5000)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        const id = (row as { id_prospecto: string | null }).id_prospecto
        if (id) counts[id] = (counts[id] ?? 0) + 1
      }
      return counts
    },
    staleTime: 60 * 1000,
  })
}

export function getProspectoLeadCount(
  prospecto: Pick<Prospecto, 'id_visita'>,
  counts: Record<string, number>,
) {
  return counts[prospecto.id_visita] ?? 0
}

export function useUpdateProspecto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id_visita, data }: { id_visita: string; data: Partial<Prospecto> }) => {
      const { error } = await supabase
        .from('cadastro_prospectos')
        .update(data)
        .eq('id_visita', id_visita)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospectos'] })
      qc.invalidateQueries({ queryKey: ['prospectos', 'search'] })
    },
  })
}

export function useCreateLeadFromProspecto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (prospecto: Prospecto) => {
      const telefone = prospecto.whatsapp_responsavel?.trim()
      if (!telefone) {
        throw new Error('Prospecto sem WhatsApp do responsável')
      }

      const payload = {
        telefone,
        nome: prospecto.nome_responsavel_treinamento || prospecto.nome_contato_inicial || prospecto.empresa_oficina,
        empresa_oficina: prospecto.empresa_oficina ?? null,
        cidade: prospecto.cidade ?? null,
        uf: prospecto.uf ?? null,
        marca_interesse: prospecto.marca_interesse
          ? (prospecto.marca_interesse.split(',')[0].trim().toLowerCase() || null)
          : null,
        canal_origem: 'visita',
        origem: 'visita',
        potencial: prospecto.potencial ?? null,
        tipo_oficina: prospecto.tipo_oficina ?? null,
        porte_oficina: prospecto.porte_oficina ?? null,
        perfil: prospecto.perfil ?? null,
        consultor: prospecto.consultor ?? null,
        resultado_visita: prospecto.resultado_visita ?? null,
        proximo_passo: prospecto.proximo_passo ?? null,
        empresa_id: prospecto.empresa_id ?? null,
        id_prospecto: prospecto.id_visita,
        observacoes: prospecto.observacoes ?? null,
        data_visita: prospecto.data_visita ?? null,
        status: 'em_contato',
        data_entrada: new Date().toISOString(),
        ultimo_contato: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('leads_v2')
        .upsert(payload, { onConflict: 'telefone', ignoreDuplicates: false })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['prospectos', 'lead-counts'] })
    },
  })
}

export function useProspecto(id: string | null) {
  return useQuery<Prospecto | null>({
    queryKey: ['prospectos', 'single', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cadastro_prospectos')
        .select('*')
        .eq('id_visita', id!)
        .single()
      if (error) throw error
      return data as Prospecto
    },
  })
}

export function useCreateProspecto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Omit<Prospecto, 'id_visita'>>) => {
      const { data: row, error } = await supabase
        .from('cadastro_prospectos')
        .insert(data)
        .select('*')
        .single()
      if (error) throw error
      return row as Prospecto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospectos'] })
    },
  })
}

export function useDistinctCidades() {
  return useQuery<string[]>({
    queryKey: ['prospectos', 'distinct-cidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cadastro_prospectos')
        .select('cidade')
        .not('cidade', 'is', null)
        .order('cidade', { ascending: true })
        .limit(1000)
      if (error) throw error
      const seen = new Set<string>()
      const unique: string[] = []
      for (const row of data ?? []) {
        const c = (row as { cidade: string }).cidade
        if (c && !seen.has(c)) { seen.add(c); unique.push(c) }
      }
      return unique
    },
    staleTime: 5 * 60 * 1000,
  })
}

export interface ExtracaoResultProspecto {
  id_visita: string | null
  empresa_oficina: string | null
  endereco: string | null
  telefone_oficina: string | null
  potencial: string | null
  status_contato: string | null
  _novo: boolean
}

export interface ExtracaoResult {
  status: string
  cidade: string
  uf: string
  total_analisado: number
  total_filtrado: number
  criados: number
  atualizados: number
  prospectos: ExtracaoResultProspecto[]
}

export function useExtrairProspectos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ cidade, uf }: { cidade: string; uf: string }): Promise<ExtracaoResult> => {
      const resp = await fetch('https://n8n.ayalaoficial.com.br/webhook/extrair-prospectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidade, uf }),
      })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 200)}`)
      }
      const data = await resp.json()
      if (data.status !== 'OK') throw new Error(data.message || 'Erro na extração')
      return data as ExtracaoResult
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospectos'] })
    },
  })
}

export function useRegistrarTentativa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id_visita, status_contato, campo_data }: {
      id_visita: string
      status_contato: string
      campo_data: 'data_tentativa_1' | 'data_tentativa_2' | 'data_tentativa_3'
    }) => {
      const { error } = await supabase
        .from('cadastro_prospectos')
        .update({ status_contato, [campo_data]: new Date().toISOString() })
        .eq('id_visita', id_visita)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospectos'] })
    },
  })
}
