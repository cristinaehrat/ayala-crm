import { supabase } from '@/lib/supabase'

export async function persistProspectoPayload(payload: Record<string, unknown>) {
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
