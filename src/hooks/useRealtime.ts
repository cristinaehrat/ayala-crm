import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Lead } from '@/lib/types'

export function useRealtime() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('crm-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads_v2' },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['leads'] })
          const lead = payload.new as Lead
          if (lead.requer_atencao) {
            toast(`🔴 Novo lead: ${lead.nome ?? lead.telefone}`, {
              description: lead.empresa_oficina ?? lead.cidade ?? '',
              duration: 8000,
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads_v2' },
        () => {
          qc.invalidateQueries({ queryKey: ['leads'] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inscritos' },
        () => {
          qc.invalidateQueries({ queryKey: ['inscritos'] })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'turmas' },
        () => {
          qc.invalidateQueries({ queryKey: ['turmas'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
