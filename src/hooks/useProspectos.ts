import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeCity } from '@/lib/utils'

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
}

export type ProspectoFilter = 'todos' | 'a_contatar' | 'em_followup' | 'sem_leads' | 'com_leads'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

const FILTER_MAP: Record<ProspectoFilter, (q: AnyQuery) => AnyQuery> = {
  todos:       (q) => q,
  a_contatar:  (q) => q.eq('status_contato', 'a_contatar').eq('qualificado_lead', false),
  em_followup: (q) => q.in('status_contato', ['tentativa_1', 'tentativa_2', 'tentativa_3']),
  sem_leads:   (q) => q,
  com_leads:   (q) => q,
}

export function useProspectos(filter: ProspectoFilter = 'todos', uf?: string) {
  return useQuery<Prospecto[]>({
    queryKey: ['prospectos', filter, uf],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase.from('cadastro_prospectos').select('*')
      q = FILTER_MAP[filter](q)
      if (uf) q = q.eq('uf', uf)
      q = q.order('data_visita', { ascending: false, nullsFirst: false }).limit(300)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Prospecto[]
    },
  })
}

export function useSearchProspectos(query: string, phoneDigits?: string, city?: string, uf?: string) {
  return useQuery<Prospecto[]>({
    queryKey: ['prospectos', 'search', query, phoneDigits, city, uf],
    enabled: query.trim().length >= 2 || (phoneDigits?.length ?? 0) >= 8,
    queryFn: async () => {
      const normalizedQuery = query.trim()
      const normalizedCity = normalizeCity(city ?? normalizedQuery)
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

function prospectoKey(prospecto: Pick<Prospecto, 'empresa_oficina' | 'cidade' | 'uf'>) {
  const empresa = prospecto.empresa_oficina?.trim().toLocaleLowerCase('pt-BR') ?? ''
  const cidade = normalizeCity(prospecto.cidade)?.toLocaleLowerCase('pt-BR') ?? ''
  const uf = prospecto.uf?.trim().toUpperCase() ?? ''
  return `${empresa}::${cidade}::${uf}`
}

export function useProspectoLeadCounts() {
  return useQuery<Record<string, number>>({
    queryKey: ['prospectos', 'lead-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_v2')
        .select('empresa_oficina,cidade,uf')
        .limit(5000)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        const key = prospectoKey({
          empresa_oficina: (row as { empresa_oficina: string | null }).empresa_oficina,
          cidade: (row as { cidade: string | null }).cidade,
          uf: (row as { uf: string | null }).uf,
        })
        if (!key.startsWith('::')) {
          counts[key] = (counts[key] ?? 0) + 1
        }
      }
      return counts
    },
    staleTime: 60 * 1000,
  })
}

export function getProspectoLeadCount(
  prospecto: Pick<Prospecto, 'empresa_oficina' | 'cidade' | 'uf'>,
  counts: Record<string, number>,
) {
  return counts[prospectoKey(prospecto)] ?? 0
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
        marca_interesse: prospecto.marca_interesse ?? null,
        canal_origem: 'visita',
        origem: 'visita',
        potencial: prospecto.potencial ?? null,
        tipo_oficina: prospecto.tipo_oficina ?? null,
        porte_oficina: prospecto.porte_oficina ?? null,
        perfil: prospecto.perfil ?? null,
        consultor: prospecto.consultor ?? null,
        resultado_visita: prospecto.resultado_visita ?? null,
        proximo_passo: prospecto.proximo_passo ?? null,
        observacoes: prospecto.observacoes ?? null,
        data_visita: prospecto.data_visita ?? null,
        status: 'lead_novo',
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
