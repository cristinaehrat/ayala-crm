import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Empresa } from '@/lib/types'

export function useEmpresasCadastradas() {
  return useQuery<Empresa[]>({
    queryKey: ['empresas_cadastradas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_cadastradas')
        .select('*')
        .order('nome_fantasia', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as Empresa[]
    },
  })
}

export function useSearchEmpresas(q: string) {
  return useQuery<Empresa[]>({
    queryKey: ['empresas_cadastradas', 'search', q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_cadastradas')
        .select('*')
        .or(`nome_fantasia.ilike.%${q}%,razao_social.ilike.%${q}%,cnpj.ilike.%${q}%`)
        .limit(10)
      if (error) throw error
      return (data ?? []) as Empresa[]
    },
  })
}

export function useCreateEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Empresa, 'id' | 'created_at'>) => {
      const { data: created, error } = await supabase
        .from('empresas_cadastradas')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return created as Empresa
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['empresas_cadastradas'] }),
  })
}

export function useUpdateEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Empresa> }) => {
      const { error } = await supabase
        .from('empresas_cadastradas')
        .update(data)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['empresas_cadastradas'] }),
  })
}
