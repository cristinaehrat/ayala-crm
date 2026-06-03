import { supabase } from '@/lib/supabase'

export async function persistProspectoPayload(payload: Record<string, unknown>) {
  // Step 1: resolve id_visita if prospecto already exists in cadastro_prospectos
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

  // Step 2: if still no id_visita, check leads_v2 for an existing Maps record.
  // When found, enrich it in-place instead of creating a duplicate in cadastro_prospectos.
  if (!payload.id_visita && payload.empresa_oficina && payload.cidade) {
    const { data: mapsRecord } = await supabase
      .from('leads_v2')
      .select('id')
      .eq('canal_origem', 'maps')
      .ilike('empresa_oficina', payload.empresa_oficina as string)
      .eq('cidade', payload.cidade as string)
      .limit(1)
      .maybeSingle()

    if (mapsRecord) {
      // Enrich the Maps record with visit data.
      // Intentionally skip telefone — leads_v2 has a UNIQUE constraint on it and
      // the Maps record already has the extracted phone. Paola can update via CRM.
      const { error } = await supabase
        .from('leads_v2')
        .update({
          canal_origem:     'visita',
          data_visita:      payload.data_visita ?? null,
          nome:             payload.nome_responsavel_treinamento ?? null,
          resultado_visita: payload.resultado_visita ?? null,
          potencial:        payload.potencial ?? null,
          proximo_passo:    payload.proximo_passo ?? null,
          data_retorno:     payload.data_retorno ?? null,
          observacoes:      payload.observacoes ?? null,
          consultor:        payload.consultor ?? null,
          tipo_oficina:     payload.tipo_oficina ?? null,
          porte_oficina:    payload.porte_oficina ?? null,
          ...(payload.marca_interesse ? { marca_interesse: payload.marca_interesse } : {}),
          ...(payload.qualificado_lead ? { status: 'em_contato' } : {}),
          ultimo_contato:   new Date().toISOString(),
        })
        .eq('id', mapsRecord.id)

      if (error) throw error

      // id_prospecto is nullable — safe to insert with null when bypassing cadastro_prospectos
      await supabase.from('historico_contatos').insert({
        id_prospecto: null,
        consultor:    typeof payload.consultor === 'string' ? payload.consultor : null,
        tipo_contato: 'presencial',
        resultado:    'falou_responsavel',
        interesse:    payload.qualificado_lead ? 'qualificado' : null,
      })

      return
    }
  }

  // Step 3: no Maps record found — standard cadastro_prospectos upsert path
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
