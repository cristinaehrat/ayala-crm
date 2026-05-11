export interface Lead {
  id: string
  telefone: string
  nome: string | null
  cidade: string | null
  uf: string | null
  empresa_oficina: string | null
  marca_interesse: string | null
  perfil: string | null
  status: string | null
  etiqueta_chatwoot: string | null
  origem: string | null
  canal_origem: string | null
  conversation_id: string | null
  potencial: string | null
  resultado_visita: string | null
  proximo_passo: string | null
  observacoes: string | null
  requer_atencao: boolean | null
  data_visita: string | null
  tipo_oficina: string | null
  consultor: string | null
  instagram_handle: string | null
  catalogo_id: string | null
  turma_selecionada: string | null
  data_entrada: string | null
  ultimo_contato: string | null
}

export interface Turma {
  id: string
  marca: string | null
  nome_treinamento: string | null
  data_inicio: string | null
  data_fim: string | null
  cidade: string | null
  vagas_total: number | null
  vagas_disponiveis: number | null
  status: string | null
  despesas_operacionais_total: number | null
}

export interface Inscrito {
  id_inscricao: string
  id_lead: string | null
  id_turma: string | null
  nome: string | null
  empresa_oficina: string | null
  valor_total: number | null
  valor_entrada: number | null
  saldo_a_receber: number | null
  status_financeiro: string | null
  vencimento_1: string | null
  vencimento_2: string | null
  vencimento_3: string | null
  vencimento_4: string | null
  pagante_nome_nf: string | null
  pagante_documento: string | null
  pagante_email_nf: string | null
  fluxo_pagamento: string | null
  custodia_entrada: 'Ayala' | 'Parceiro' | null
  comprovante_validado: boolean | null
  observacoes_negociacao: string | null
  forma_pagamento: string | null
  qtd_parcelas: number | null
  valor_parcela: number | null
  url_comprovante: string | null
  cobrar_em_aula: boolean | null
}

export interface CatalogoTreinamento {
  id: string
  nome_treinamento: string | null
  marca: string | null
  descricao_curta: string | null
}

export interface MalhaEstrategica {
  id: string
  mes: string
  marca: string
  cidade_base: string
  regiao_estrategica: string | null
  cidades_visitacao: string | null
  objetivo: string | null
  observacoes: string | null
}

export interface InscritoComTelefone extends Inscrito {
  telefone_lead: string | null
  nome_treinamento_turma: string | null
  data_inicio_turma: string | null
  cidade_turma: string | null
  marca_turma: string | null
}

export interface Despesa {
  id: string
  data: string
  categoria: string
  descricao: string | null
  valor: number
  viagem_referencia: string | null
  turma_id: string | null
  criado_por: string | null
  created_at: string | null
}

export type KanbanStatus =
  | 'lead_novo'
  | 'qualificado'
  | 'aguardando_ismenia'
  | 'inscrito'
  | 'pgto_confirmado'
  | 'perdido'

export const KANBAN_COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: 'lead_novo',          label: 'Novo Lead' },
  { id: 'qualificado',        label: 'Qualificado' },
  { id: 'aguardando_ismenia', label: 'Ag. Ismênia' },
  { id: 'inscrito',           label: 'Inscrito' },
  { id: 'pgto_confirmado',    label: 'Pago' },
  { id: 'perdido',            label: 'Perdido' },
]
