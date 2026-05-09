import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Turma, Inscrito } from '@/lib/types'

export interface TurmaFinanceiro {
  turma: Turma
  inscritos: Inscrito[]
  receita_total: number
  recebido: number
  a_receber: number
  despesas: number
  margem: number
}

export interface FinanceiroSummary {
  turmas: TurmaFinanceiro[]
  total_receita: number
  total_recebido: number
  total_a_receber: number
  total_despesas: number
  total_margem: number
}

export function useFinanceiro() {
  return useQuery<FinanceiroSummary>({
    queryKey: ['financeiro'],
    queryFn: async () => {
      const [turmasRes, inscritosRes] = await Promise.all([
        supabase.from('turmas').select('*').order('data_inicio', { ascending: false }),
        supabase.from('inscritos').select('*'),
      ])
      if (turmasRes.error) throw turmasRes.error
      if (inscritosRes.error) throw inscritosRes.error

      const turmas = (turmasRes.data ?? []) as Turma[]
      const allInscritos = (inscritosRes.data ?? []) as Inscrito[]

      const turmasFinanceiro: TurmaFinanceiro[] = turmas.map((turma) => {
        const inscritos = allInscritos.filter((i) => i.id_turma === turma.id)
        const receita_total = inscritos.reduce((s, i) => s + (i.valor_total ?? 0), 0)
        const a_receber = inscritos.reduce((s, i) => s + (i.saldo_a_receber ?? 0), 0)
        const recebido = receita_total - a_receber
        const despesas = turma.despesas_operacionais_total ?? 0
        const margem = recebido - despesas
        return { turma, inscritos, receita_total, recebido, a_receber, despesas, margem }
      })

      return {
        turmas: turmasFinanceiro,
        total_receita:   turmasFinanceiro.reduce((s, t) => s + t.receita_total, 0),
        total_recebido:  turmasFinanceiro.reduce((s, t) => s + t.recebido, 0),
        total_a_receber: turmasFinanceiro.reduce((s, t) => s + t.a_receber, 0),
        total_despesas:  turmasFinanceiro.reduce((s, t) => s + t.despesas, 0),
        total_margem:    turmasFinanceiro.reduce((s, t) => s + t.margem, 0),
      }
    },
  })
}
