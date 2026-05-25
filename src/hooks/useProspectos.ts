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

export type ProspectoFilter = 'todos' | 'a_contatar' | 'em_followup' | 'qualificados' | 'convertidos'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

const FILTER_MAP: Record<ProspectoFilter, (q: AnyQuery) => AnyQuery> = {
  todos:       (q) => q,
  a_contatar:  (q) => q.eq('status_contato', 'a_contatar').eq('qualificado_lead', false),
  em_followup: (q) => q.in('status_contato', ['tentativa_1', 'tentativa_2', 'tentativa_3']),
  qualificados:(q) => q.eq('qualificado_lead', true).eq('convertido_lead', false),
  convertidos: (q) => q.eq('convertido_lead', true),
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

export function useQualificarProspecto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id_visita: string) => {
      const { error } = await supabase
        .from('cadastro_prospectos')
        .update({ qualificado_lead: true })
        .eq('id_visita', id_visita)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospectos'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
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
