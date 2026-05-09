import { cn, initials, relativeTime, ETIQUETA_CORES, ETIQUETA_LABELS, MARCA_BADGES } from '@/lib/utils'
import type { Lead } from '@/lib/types'

interface Props {
  lead: Lead
  active?: boolean
  onClick: () => void
}

export default function LeadCard({ lead, active, onClick }: Props) {
  const etiquetaCor = lead.etiqueta_chatwoot ? ETIQUETA_CORES[lead.etiqueta_chatwoot] : null
  const etiquetaLabel = lead.etiqueta_chatwoot ? ETIQUETA_LABELS[lead.etiqueta_chatwoot] ?? lead.etiqueta_chatwoot : null
  const marca = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null

  return (
    <div
      onClick={onClick}
      className={cn('card-lead', active && 'card-lead-active')}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-navy2 flex items-center justify-center">
            <span className="font-display font-bold text-sm text-white">
              {initials(lead.nome)}
            </span>
          </div>
          {lead.requer_atencao && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-orange animate-pulse-orange border-2 border-navy" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="font-display font-semibold text-sm text-white truncate">
              {lead.nome ?? lead.telefone}
            </p>
            <span className="text-muted text-xs shrink-0">
              {relativeTime(lead.updated_at ?? lead.data_entrada)}
            </span>
          </div>

          <p className="text-muted text-xs truncate mt-0.5">
            {lead.empresa_oficina ?? lead.cidade ?? '—'}
          </p>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {etiquetaCor && etiquetaLabel && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold tracking-wide uppercase text-white"
                style={{ backgroundColor: etiquetaCor }}
              >
                {etiquetaLabel}
              </span>
            )}
            {marca && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold tracking-wide text-white"
                style={{ backgroundColor: marca.bg }}
              >
                {marca.label}
              </span>
            )}
            {lead.origem === 'visita' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold tracking-wide text-white bg-purple-700">
                Visita
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
