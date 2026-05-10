import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Turma } from '@/lib/types'

export function useTurmas() {
  return useQuery<Turma[]>({
    queryKey: ['turmas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .order('status', { ascending: true, nullsFirst: false })
        .order('data_inicio', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as Turma[]
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
