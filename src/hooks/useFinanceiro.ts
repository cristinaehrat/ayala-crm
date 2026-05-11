import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Turma, Inscrito } from '@/lib/types'

export function useFaturamentoMes(mes?: string) {
  return useQuery<number>({
    queryKey: ['faturamento-mes', mes ?? 'all'],
    queryFn: async () => {
      if (!mes) return 0
      const { data: turmasData, error: tErr } = await supabase
        .from('turmas')
        .select('id')
        .gte('data_inicio', `${mes}-01`)
        .lte('data_inicio', `${mes}-31`)
      if (tErr) throw tErr
      const ids = (turmasData ?? []).map((t: { id: string }) => t.id)
      if (!ids.length) return 0
      const { data: inscritosData, error: iErr } = await supabase
        .from('inscritos')
        .select('valor_entrada')
        .in('id_turma', ids)
      if (iErr) throw iErr
      return (inscritosData ?? []).reduce(
        (s: number, i: { valor_entrada: number | null }) => s + (i.valor_entrada ?? 0),
        0,
      )
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useDespesasMes() {
  return useQuery<number>({
    queryKey: ['despesas-mes'],
    queryFn: async () => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('despesas_ayala')
        .select('valor')
        .gte('data', firstDay)
        .lte('data', lastDay)
      if (error) throw error
      return (data ?? []).reduce((s: number, r: { valor: number }) => s + (r.valor ?? 0), 0)
    },
  })
}

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
