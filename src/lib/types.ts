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
  interesses: string[] | null
  data_entrada: string | null
  ultimo_contato: string | null
  porte_oficina: string | null
  qtd_interessados: string | null
  total_interacoes: number | null
  follow_up_enviado: boolean | null
}

export type TurmaStatus = 'aberta' | 'espera' | 'encerrada'

export interface Turma {
  id: string
  marca: string | null
  nome_treinamento: string | null
  data_inicio: string | null
  data_fim: string | null
  cidade: string | null
  vagas_total: number | null
  vagas_disponiveis: number | null
  status: TurmaStatus | null
  despesas_operacionais_total: number | null
  valor_recebido_isa_monteiro: number | null
  valor_recebido_isa_mg: number | null
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
  cpf: string | null
  empresa_id: string | null
}

export interface Empresa {
  id: string
  created_at: string | null
  nome_fantasia: string | null
  razao_social: string | null
  cnpj: string | null
  inscricao_estadual: string | null
  endereco: string | null
  bairro: string | null
  cep: string | null
  cidade: string | null
  estado: string | null
  email: string | null
  nome_responsavel: string | null
  whatsapp_responsavel: string | null
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
  forma_pagamento: 'pix' | 'dinheiro' | 'cartao' | null
  conta_bancaria: 'nu_pf' | 'inter_pf' | 'sicoob_pf' | 'outros' | null
  qtd_parcelas: number | null
  viagem_referencia: string | null
  turma_id: string | null
  criado_por: string | null
  created_at: string | null
}

export type KanbanStatus =
  | 'lead_novo'
  | 'aguardando_ismenia'
  | 'aguardando_pagamento'
  | 'inscrito'
  | 'lista_espera'
  | 'perdido'

export const KANBAN_COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: 'lead_novo',            label: 'Novo Lead' },
  { id: 'aguardando_ismenia',   label: 'Ag. Ismênia' },
  { id: 'aguardando_pagamento', label: 'Ag. Pagamento' },
  { id: 'inscrito',             label: 'Inscrito' },
  { id: 'lista_espera',         label: 'Lista Espera' },
  { id: 'perdido',              label: 'Perdido' },
]
