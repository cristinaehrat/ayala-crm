import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Turma, TurmaStatus } from '@/lib/types'

const STATUS_ORDER: Record<TurmaStatus, number> = {
  aberta: 0,
  espera: 1,
  encerrada: 2,
}

export function useTurmas() {
  return useQuery<Turma[]>({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .order('data_inicio', { ascending: true, nullsFirst: false })
      if (error) throw error
      return ((data ?? []) as Turma[]).sort((a, b) => {
        const statusA = a.status ? (STATUS_ORDER[a.status] ?? 99) : 99
        const statusB = b.status ? (STATUS_ORDER[b.status] ?? 99) : 99
        if (statusA !== statusB) return statusA - statusB

        const dataA = a.data_inicio ?? ''
        const dataB = b.data_inicio ?? ''
        if (dataA !== dataB) return dataA.localeCompare(dataB)

        return (a.nome_treinamento ?? '').localeCompare(b.nome_treinamento ?? '')
      })
    },
  })
}

export function useUpdateTurma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Turma> }) => {
      const { error } = await supabase
        .from('turmas')
        .update(data)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['turmas'] })
      qc.invalidateQueries({ queryKey: ['financeiro'] })
    },
  })
}

export function useCloseTurma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ turmaId }: { turmaId: string }) => {
      const { error } = await supabase
        .from('turmas')
        .update({ status: 'encerrada' })
        .eq('id', turmaId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['turmas'] })
      qc.invalidateQueries({ queryKey: ['financeiro'] })
    },
  })
}
