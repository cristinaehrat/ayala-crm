import { cn, initials, relativeTime, ETIQUETA_CORES, ETIQUETA_LABELS, MARCA_BADGES, findRotaMes } from '@/lib/utils'
import { useMalhaEstrategica } from '@/hooks/useMalhaEstrategica'
import type { Lead } from '@/lib/types'

interface Props {
  lead: Lead
  active?: boolean
  onClick: () => void
}

export default function LeadCard({ lead, active, onClick }: Props) {
  const { data: malha = [] } = useMalhaEstrategica()

  const etiquetaCor   = lead.etiqueta_chatwoot ? ETIQUETA_CORES[lead.etiqueta_chatwoot] : null
  const etiquetaLabel = lead.etiqueta_chatwoot ? ETIQUETA_LABELS[lead.etiqueta_chatwoot] ?? lead.etiqueta_chatwoot : null
  const marca         = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null
  const rotaMes       = findRotaMes(lead.cidade, lead.marca_interesse, malha)

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
            <p className="font-display font-semibold text-sm text-navy truncate">
              {lead.nome ?? lead.telefone}
            </p>
            <span className="text-muted text-xs shrink-0">
              {relativeTime(lead.ultimo_contato ?? lead.data_entrada)}
            </span>
          </div>

          <p className="text-muted text-xs truncate mt-0.5">
            {lead.empresa_oficina ?? lead.cidade ?? '—'}
          </p>

          {/* Tags — máx 2 linhas, hierarquia visual */}
          <div className="flex items-center gap-1 mt-2 flex-wrap overflow-hidden max-h-[2.5rem]">
            {/* Tag primária: etiqueta com cor de status */}
            {etiquetaCor && etiquetaLabel && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold tracking-wide uppercase text-white shrink-0"
                style={{ backgroundColor: etiquetaCor }}
              >
                {etiquetaLabel}
              </span>
            )}
            {/* Tags secundárias: neutras, menores */}
            {marca && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-semibold text-white/70 shrink-0"
                style={{ backgroundColor: `${marca.bg}99` }}
              >
                {marca.label}
              </span>
            )}
            {lead.origem === 'visita' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-semibold text-muted bg-slate-100 shrink-0">
                Visita
              </span>
            )}
            {/* Badge de Rota Estratégica */}
            {rotaMes && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold text-white bg-orange/80 shrink-0">
                📍 Rota {rotaMes}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
