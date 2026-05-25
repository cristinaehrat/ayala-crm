import { supabase } from '@/lib/supabase'

export async function persistProspectoPayload(payload: Record<string, unknown>) {
  const onConflict = typeof payload.id_visita === 'string' && payload.id_visita
    ? 'id_visita'
    : 'whatsapp_responsavel'

  const { error } = await supabase
    .from('cadastro_prospectos')
    .upsert(payload, { onConflict, ignoreDuplicates: false })

  if (error) throw error
}
