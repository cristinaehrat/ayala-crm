import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Lead, InscritoComTelefone, Turma } from '@/lib/types'

// Tab 1 — Lista de Espera
export function useListaEspera() {
  return useQuery<Lead[]>({
    queryKey: ['relatorios', 'lista_espera'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_v2')
        .select('*')
        .eq('etiqueta_chatwoot', 'lista_espera')
        .order('data_entrada', { ascending: false, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as Lead[]
    },
  })
}

// Tab 2 — Lista de Chamada (professor em sala)
// Retorna inscritos com cobrar_em_aula = true + telefone do lead + dados da turma
export function useListaChamada() {
  return useQuery<InscritoComTelefone[]>({
    queryKey: ['relatorios', 'lista_chamada'],
    queryFn: async () => {
      const { data: inscritos, error: errI } = await supabase
        .from('inscritos')
        .select('*')
        .order('id_turma')
        .order('nome')

      if (errI) throw errI

      const lista = (inscritos ?? [])

      // Buscar turmas
      const turmaIds = [...new Set(lista.map((i) => i.id_turma).filter(Boolean))]
      const leadIds  = [...new Set(lista.map((i) => i.id_lead).filter(Boolean))]

      const [turmasRes, leadsRes] = await Promise.all([
        turmaIds.length > 0
          ? supabase.from('turmas').select('id,nome_treinamento,data_inicio,cidade,marca').in('id', turmaIds)
          : Promise.resolve({ data: [], error: null }),
        leadIds.length > 0
          ? supabase.from('leads_v2').select('id,telefone').in('id', leadIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (turmasRes.error) throw turmasRes.error
      if (leadsRes.error) throw leadsRes.error

      const turmaMap = Object.fromEntries(
        ((turmasRes.data ?? []) as Turma[]).map((t) => [t.id, t]),
      )
      const leadMap = Object.fromEntries(
        ((leadsRes.data ?? []) as { id: string; telefone: string }[]).map((l) => [l.id, l.telefone]),
      )

      return lista.map((i) => {
        const turma = i.id_turma ? turmaMap[i.id_turma] : null
        return {
          ...i,
          telefone_lead:        i.id_lead ? (leadMap[i.id_lead] ?? null) : null,
          nome_treinamento_turma: turma?.nome_treinamento ?? null,
          data_inicio_turma:    turma?.data_inicio ?? null,
          cidade_turma:         turma?.cidade ?? null,
          marca_turma:          turma?.marca ?? null,
        } as InscritoComTelefone
      })
    },
  })
}

// Tab 3 — Fechamento Financeiro por Parceiro
export interface TurmaFechamento {
  turma_id: string
  nome_turma: string | null
  cidade: string | null
  data_inicio: string | null
  status: string | null
  qtd_inscritos: number
  receita_total: number
  entradas_ayala: number
  a_receber: number
  valor_recebido_isa_monteiro: number | null
  valor_recebido_isa_mg: number | null
}

export interface FechamentoParceiro {
  marca: string
  parceiro: string
  turmas: TurmaFechamento[]
}

const PARCEIROS: Record<string, string> = {
  volvo:  'Treinatec Brasil',
  daf:    'Monteiro Eletro Diesel',
  scania: 'MG Soluções Automotivas',
}

export function useFechamentoParceiros() {
  return useQuery<FechamentoParceiro[]>({
    queryKey: ['relatorios', 'fechamento_parceiros'],
    queryFn: async () => {
      const [turmasRes, inscritosRes] = await Promise.all([
        supabase
          .from('turmas')
          .select('id,nome_treinamento,cidade,marca,data_inicio,status,valor_recebido_isa_monteiro,valor_recebido_isa_mg'),
        supabase
          .from('inscritos')
          .select('id_turma,valor_total,valor_entrada,saldo_a_receber,custodia_entrada'),
      ])
      if (turmasRes.error) throw turmasRes.error
      if (inscritosRes.error) throw inscritosRes.error

      const turmas = (turmasRes.data ?? []) as {
        id: string
        nome_treinamento: string | null
        cidade: string | null
        marca: string | null
        data_inicio: string | null
        status: string | null
        valor_recebido_isa_monteiro: number | null
        valor_recebido_isa_mg: number | null
      }[]
      const inscritos = (inscritosRes.data ?? []) as {
        id_turma: string | null
        valor_total: number | null
        valor_entrada: number | null
        saldo_a_receber: number | null
        custodia_entrada: string | null
      }[]

      return (['volvo', 'daf', 'scania'] as const).map((marca) => {
        const turmasDaMarca = turmas.filter((t) => t.marca === marca)

        const turmasData: TurmaFechamento[] = turmasDaMarca.map((t) => {
          const alunosDaTurma = inscritos.filter((i) => i.id_turma === t.id)
          const qtd_inscritos = alunosDaTurma.length
          const receita_total = alunosDaTurma.reduce((s, i) => s + (i.valor_total ?? 0), 0)
          const a_receber = alunosDaTurma.reduce((s, i) => s + (i.saldo_a_receber ?? 0), 0)

          let entradas_ayala: number
          if (marca === 'daf') {
            entradas_ayala = qtd_inscritos * 300
          } else if (marca === 'volvo') {
            entradas_ayala = alunosDaTurma
              .filter((i) => i.custodia_entrada === 'Ayala' || i.custodia_entrada === null)
              .reduce((s, i) => s + (i.valor_entrada ?? 0), 0)
          } else {
            entradas_ayala = 0
          }

          return {
            turma_id: t.id,
            nome_turma: t.nome_treinamento,
            cidade: t.cidade,
            data_inicio: t.data_inicio,
            status: t.status,
            qtd_inscritos,
            receita_total,
            entradas_ayala,
            a_receber,
            valor_recebido_isa_monteiro: t.valor_recebido_isa_monteiro,
            valor_recebido_isa_mg: t.valor_recebido_isa_mg,
          }
        })

        return {
          marca,
          parceiro: PARCEIROS[marca],
          turmas: turmasData,
        }
      })
    },
  })
}
