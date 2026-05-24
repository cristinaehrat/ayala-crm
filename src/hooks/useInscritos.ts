import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inscrito } from '@/lib/types'

export function useInscritos(turmaId: string | null) {
  return useQuery<Inscrito[]>({
    queryKey: ['inscritos', turmaId],
    enabled: !!turmaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscritos')
        .select('*')
        .eq('id_turma', turmaId!)
        .order('nome', { ascending: true })
      if (error) throw error
      return (data ?? []) as Inscrito[]
    },
  })
}

export function useUpdateInscrito() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id_inscricao, data }: { id_inscricao: string; data: Partial<Inscrito> }) => {
      const { error } = await supabase
        .from('inscritos')
        .update(data)
        .eq('id_inscricao', id_inscricao)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscritos'] })
      qc.invalidateQueries({ queryKey: ['financeiro'] })
    },
  })
}

export function useCreateInscrito() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      id_turma: string
      id_lead?: string
      nome: string
      empresa_oficina?: string
      valor_total?: number
      status_financeiro?: string
    }) => {
      const { error } = await supabase.from('inscritos').insert({
        ...data,
        status_financeiro: data.status_financeiro ?? 'pendente',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscritos'] })
      qc.invalidateQueries({ queryKey: ['financeiro'] })
    },
  })
}

export function useInscritoByToken(token: string | null) {
  return useQuery<Inscrito | null>({
    queryKey: ['inscritos', 'token', token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscritos')
        .select('*')
        .eq('fill_token', token!)
        .single()
      if (error) return null
      return data as Inscrito
    },
  })
}

export function useUpdateInscritoByToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ token, data }: { token: string; data: Partial<Inscrito> }) => {
      const { error } = await supabase
        .from('inscritos')
        .update({ ...data, fill_status: 'preenchido' })
        .eq('fill_token', token)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscritos'] }),
  })
}

export function useDeleteInscrito() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id_inscricao: string) => {
      const { error } = await supabase
        .from('inscritos')
        .delete()
        .eq('id_inscricao', id_inscricao)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscritos'] })
      qc.invalidateQueries({ queryKey: ['financeiro'] })
      qc.invalidateQueries({ queryKey: ['relatorios'] })
    },
  })
}
