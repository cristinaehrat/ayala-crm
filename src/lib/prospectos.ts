import { supabase } from '@/lib/supabase'

export async function persistProspectoPayload(payload: Record<string, unknown>) {
  // Se não há id_visita explícito (operador não selecionou sugestão),
  // tenta encontrar registro existente por nome+cidade antes de inserir.
  // Isso evita duplicatas quando a busca não exibiu sugestão ou foi ignorada.
  if (!payload.id_visita && payload.empresa_oficina && payload.cidade) {
    const { data: existing } = await supabase
      .from('cadastro_prospectos')
      .select('id_visita')
      .ilike('empresa_oficina', payload.empresa_oficina as string)
      .eq('cidade', payload.cidade as string)
      .limit(1)
      .maybeSingle()
    if (existing?.id_visita) {
      payload.id_visita = existing.id_visita
    }
  }

  const onConflict = typeof payload.id_visita === 'string' && payload.id_visita
    ? 'id_visita'
    : 'whatsapp_responsavel'

  const { data, error } = await supabase
    .from('cadastro_prospectos')
    .upsert(payload, { onConflict, ignoreDuplicates: false })
    .select('id_visita')
    .single()

  if (error) throw error

  const idVisita = (data as { id_visita: string } | null)?.id_visita
  if (idVisita) {
    await supabase.from('historico_contatos').insert({
      id_prospecto: idVisita,
      consultor:    typeof payload.consultor === 'string' ? payload.consultor : null,
      tipo_contato: 'presencial',
      resultado:    'falou_responsavel',
      interesse:    payload.qualificado_lead ? 'qualificado' : null,
    })
  }
}
