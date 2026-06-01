import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface HistoricoContato {
  id: string
  id_prospecto: string
  data_contato: string
  consultor: string | null
  tipo_contato: string
  resultado: string | null
  interesse: string | null
  telefone_capturado: string | null
  proximo_passo: string | null
  data_retorno: string | null
  observacoes: string | null
}

export const RESULTADO_LABEL: Record<string, string> = {
  nao_atendeu:        'Não atendeu',
  caixa_postal:       'Caixa postal',
  numero_errado:      'Número errado',
  numero_inexistente: 'Número inexistente',
  falou_secretaria:   'Falou com secretaria',
  falou_responsavel:  'Falou com responsável',
  mensagem_enviada:   'Mensagem enviada',
  sem_resposta_wpp:   'Sem resposta (WPP)',
}

export const INTERESSE_LABEL: Record<string, string> = {
  demonstrou_interesse: 'Demonstrou interesse',
  pediu_preco:          'Pediu preço',
  follow_up:            'Follow-up',
  aguardando_ismenia:   'Aguardando Ismênia',
  sem_interesse:        'Sem interesse',
  qualificado:          'Qualificado',
}

export const TIPO_CONTATO_LABEL: Record<string, string> = {
  ligacao:    'Ligação',
  whatsapp:   'WhatsApp',
  presencial: 'Presencial',
}

export function useHistoricoContatos(id_prospecto: string | null) {
  return useQuery<HistoricoContato[]>({
    queryKey: ['historico_contatos', id_prospecto],
    enabled: !!id_prospecto,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_contatos')
        .select('*')
        .eq('id_prospecto', id_prospecto!)
        .order('data_contato', { ascending: false })
      if (error) throw error
      return (data ?? []) as HistoricoContato[]
    },
  })
}

export interface CreateHistoricoPayload {
  id_prospecto: string
  consultor: string | null
  tipo_contato: string
  resultado: string | null
  interesse: string | null
  telefone_capturado: string | null
  proximo_passo: string | null
  data_retorno: string | null
  observacoes: string | null
}

export function useCreateHistoricoContato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateHistoricoPayload) => {
      const { error } = await supabase.from('historico_contatos').insert(payload)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['historico_contatos', variables.id_prospecto] })
      qc.invalidateQueries({ queryKey: ['prospectos'] })
    },
  })
}

export async function insertHistoricoPresencial(id_prospecto: string, consultor: string | null) {
  await supabase.from('historico_contatos').insert({
    id_prospecto,
    consultor,
    tipo_contato: 'presencial',
    resultado: 'falou_responsavel',
    interesse: null,
  })
}
