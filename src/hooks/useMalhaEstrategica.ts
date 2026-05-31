import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MalhaEstrategica } from '@/lib/types'

export const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function useMalhaEstrategica() {
  return useQuery<MalhaEstrategica[]>({
    queryKey: ['malha_estrategica'],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('malha_estrategica')
        .select('*')
        .order('mes')
        .order('marca')
      if (error) throw error
      return (data ?? []) as MalhaEstrategica[]
    },
  })
}

type MalhaPayload = Omit<MalhaEstrategica, 'id'>

export function useCreateMalha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: MalhaPayload) => {
      const { error } = await supabase.from('malha_estrategica').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['malha_estrategica'] })
    },
  })
}

export function useUpdateMalha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: MalhaEstrategica) => {
      const { error } = await supabase
        .from('malha_estrategica')
        .update(payload)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['malha_estrategica'] })
    },
  })
}

export function useDeleteMalha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('malha_estrategica')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['malha_estrategica'] })
    },
  })
}
