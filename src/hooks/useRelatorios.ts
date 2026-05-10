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
export interface FechamentoParceiro {
  marca: string
  parceiro: string
  qtd_turmas: number
  qtd_alunos: number
  faturamento_bruto: number
  custodia_ayala: number
  custodia_parceiro: number
  despesas: number
  saldo_liquido: number
}

const PARCEIROS: Record<string, string> = {
  Volvo:  'Treinatec Brasil',
  DAF:    'Monteiro Eletro Diesel',
  Scania: 'MG Soluções Automotivas',
}

export function useFechamentoParceiros() {
  return useQuery<FechamentoParceiro[]>({
    queryKey: ['relatorios', 'fechamento_parceiros'],
    queryFn: async () => {
      const [turmasRes, inscritosRes] = await Promise.all([
        supabase.from('turmas').select('id,marca,despesas_operacionais_total'),
        supabase.from('inscritos').select('id_turma,valor_total,valor_entrada,saldo_a_receber,custodia_entrada'),
      ])
      if (turmasRes.error) throw turmasRes.error
      if (inscritosRes.error) throw inscritosRes.error

      const turmas   = (turmasRes.data ?? []) as { id: string; marca: string | null; despesas_operacionais_total: number | null }[]
      const inscritos = inscritosRes.data ?? []

      const marcas = ['Volvo', 'DAF', 'Scania']

      return marcas.map((marca) => {
        const turmasDaMarca = turmas.filter((t) => t.marca === marca)
        const turmaIds      = turmasDaMarca.map((t) => t.id)
        const alunos        = inscritos.filter((i) => turmaIds.includes(i.id_turma ?? ''))

        const faturamento_bruto = alunos.reduce((s, i) => s + (i.valor_total ?? 0), 0)
        const custodia_ayala    = alunos
          .filter((i) => i.custodia_entrada === 'Ayala')
          .reduce((s, i) => s + (i.valor_entrada ?? 0), 0)
        const custodia_parceiro = alunos
          .filter((i) => i.custodia_entrada === 'Parceiro')
          .reduce((s, i) => s + (i.valor_entrada ?? 0), 0)
        const despesas = turmasDaMarca.reduce(
          (s, t) => s + (t.despesas_operacionais_total ?? 0),
          0,
        )
        // Saldo líquido = O que o parceiro precisa repassar à Ismênia
        // = Faturamento total - o que a Ismênia já tem (custódia Ayala) - despesas operacionais
        const saldo_liquido = faturamento_bruto - custodia_ayala - despesas

        return {
          marca,
          parceiro:       PARCEIROS[marca] ?? marca,
          qtd_turmas:     turmasDaMarca.length,
          qtd_alunos:     alunos.length,
          faturamento_bruto,
          custodia_ayala,
          custodia_parceiro,
          despesas,
          saldo_liquido,
        }
      })
    },
  })
}
