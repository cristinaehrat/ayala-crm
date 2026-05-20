import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/lib/types'

export function useTurmaLeads(turmaId: string | null) {
  return useQuery<Lead[]>({
    queryKey: ['turma-leads', turmaId],
    enabled: !!turmaId,
    queryFn: async () => {
      if (!turmaId) return []

      const { data: inscritos, error: errInscritos } = await supabase
        .from('inscritos')
        .select('id_lead')
        .eq('id_turma', turmaId)
        .not('id_lead', 'is', null)

      if (errInscritos) throw errInscritos

      const leadIds = [...new Set(
        (inscritos ?? [])
          .map((i: { id_lead: string | null }) => i.id_lead)
          .filter((id): id is string => !!id),
      )]

      if (leadIds.length === 0) return []

      const { data: leads, error: errLeads } = await supabase
        .from('leads_v2')
        .select('*')
        .in('id', leadIds)
        .order('ultimo_contato', { ascending: false, nullsFirst: false })
        .order('data_entrada', { ascending: false, nullsFirst: false })

      if (errLeads) throw errLeads
      return (leads ?? []) as Lead[]
    },
  })
}
