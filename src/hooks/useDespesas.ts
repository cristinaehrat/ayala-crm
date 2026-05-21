import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Despesa } from '@/lib/types'

export function useDespesas(mes?: string) {
  return useQuery<Despesa[]>({
    queryKey: ['despesas', mes ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('despesas_ayala')
        .select('*')
        .order('data', { ascending: false })
      if (mes) {
        q = q.gte('data', `${mes}-01`).lte('data', `${mes}-31`)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Despesa[]
    },
  })
}

export function useCreateDespesa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Despesa, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('despesas_ayala').insert(data)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['despesas'] }),
  })
}

export function useUpdateDespesa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Despesa, 'id' | 'created_at'>> }) => {
      const { error } = await supabase.from('despesas_ayala').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['despesas'] }),
  })
}

export function useDeleteDespesa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('despesas_ayala').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['despesas'] }),
  })
}
