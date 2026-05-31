import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MalhaEstrategica } from '@/lib/types'

export const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function useMalhaEstrategica() {
  return useQuery<MalhaEstrategica[]>({
    queryKey: ['malha_estrategica'],
    staleTime: 1000 * 60 * 10, // 10 min — dados mudam raramente
    queryFn: async () => {
      const { data, error } = await supabase
        .from('malha_estrategica')
        .select('*')
        .order('marca')
      if (error) throw error
      return (data ?? []) as MalhaEstrategica[]
    },
  })
}
