import { BellRing } from 'lucide-react'
import { cn, initials, formatPhone, relativeTime, ETIQUETA_CORES, ETIQUETA_LABELS, MARCA_BADGES, POTENCIAL_BADGES, INTERESSE_TAGS, findRotaMes, getPrimaryLeadLabel, getLeadActionSignals, STATUS_COLORS } from '@/lib/utils'
import { useMalhaEstrategica } from '@/hooks/useMalhaEstrategica'
import { KANBAN_COLUMNS } from '@/lib/types'
import type { Lead } from '@/lib/types'

interface Props {
  lead: Lead
  active?: boolean
  onClick: () => void
  variant?: 'light' | 'dark'
}

export default function LeadCard({ lead, active, onClick, variant = 'light' }: Props) {
  const { data: malha = [] } = useMalhaEstrategica()
  const dark = variant === 'dark'

  const actionSignals = getLeadActionSignals(lead)
  const primaryLabel  = getPrimaryLeadLabel(lead.etiqueta_chatwoot)
  const hidePrimaryLabel = primaryLabel != null && actionSignals.some((signal) =>
    signal.id === primaryLabel || (signal.id === 'follow_up' && primaryLabel === 'visualizou_preco'),
  )
  const etiquetaCor   = primaryLabel ? ETIQUETA_CORES[primaryLabel] : null
  const etiquetaLabel = primaryLabel ? ETIQUETA_LABELS[primaryLabel] ?? primaryLabel : null
  const marca         = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null
  const potencial     = lead.potencial ? POTENCIAL_BADGES[lead.potencial] : null
  const rotaMes       = findRotaMes(lead.cidade, lead.marca_interesse, malha)
  const statusLabel    = KANBAN_COLUMNS.find((c) => c.id === lead.status)?.label
  const statusColor    = lead.status ? STATUS_COLORS[lead.status] : undefined

  return (
    <div
      onClick={onClick}
      className={cn(
        dark
          ? 'rounded-xl border p-3 cursor-pointer shadow-sm transition duration-150'
          : 'card-lead',
        actionSignals.some((signal) => signal.id === 'hot_lead') && 'ring-1 ring-red-500/30',
        dark
          ? active
            ? 'border-orange/60 bg-slate-50 shadow-md'
            : 'border-slate-200 bg-slate-50 hover:border-orange/40 hover:bg-blue-50 hover:shadow-md'
          : active && 'card-lead-active',
      )}
    >
      {actionSignals.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {actionSignals.map((signal) => (
            <span
              key={signal.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-display font-bold tracking-wide uppercase"
              style={{ backgroundColor: signal.bg, color: signal.text }}
            >
              {signal.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', dark ? 'bg-navy' : 'bg-navy2')}>
            <span className="font-display font-bold text-sm text-white">
              {initials(lead.nome)}
            </span>
          </div>
          {lead.requer_atencao && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-orange animate-pulse-orange border-2',
              dark ? 'border-navy2' : 'border-navy',
            )} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className={cn('font-display font-semibold text-sm truncate', dark ? 'text-navy' : 'text-navy')}>
              {lead.nome ?? formatPhone(lead.telefone)}
            </p>
            <span className={cn('text-xs shrink-0', dark ? 'text-slate-500' : 'text-slate-500')}>
              {relativeTime(lead.ultimo_contato ?? lead.data_entrada)}
            </span>
          </div>

          <p className={cn('text-xs truncate mt-0.5', dark ? 'text-slate-600' : 'text-slate-600')}>
            {lead.empresa_oficina ?? lead.cidade ?? '—'}
          </p>

          {/* Tags — máx 2 linhas, hierarquia visual */}
          <div className="flex items-center gap-1 mt-2 flex-wrap overflow-hidden max-h-[2.5rem]">
            {/* Tag primária: etiqueta com cor de status */}
            {!hidePrimaryLabel && etiquetaCor && etiquetaLabel && (
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
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-semibold shrink-0',
                  dark ? 'text-white' : 'text-white',
                )}
                style={{ backgroundColor: `${marca.bg}99` }}
              >
                {marca.label}
              </span>
            )}
            {potencial && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold text-white shrink-0"
                style={{ backgroundColor: potencial.bg }}
              >
                {potencial.label}
              </span>
            )}
            {dark && statusLabel && statusColor && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold tracking-wide text-white shrink-0"
                style={{ backgroundColor: statusColor }}
              >
                {statusLabel}
              </span>
            )}
            {lead.origem === 'visita' && (
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-semibold shrink-0',
                dark ? 'text-slate-700 bg-slate-100' : 'text-slate-700 bg-slate-100',
              )}>
                Visita
              </span>
            )}
            {/* Interesses */}
            {(lead.interesses ?? []).map((interesse) => {
              const tag = INTERESSE_TAGS.find((t) => t.value === interesse)
              if (!tag) return null
              return (
                <span
                  key={tag.value}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold text-white shrink-0"
                  style={{ backgroundColor: tag.bg }}
                >
                  {tag.label}
                </span>
              )
            })}
            {/* Badge de Rota Estratégica */}
            {rotaMes && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold text-white bg-orange/80 shrink-0">
                📍 Rota {rotaMes}
              </span>
            )}
            {lead.data_retorno && (() => {
              const today = new Date(); today.setHours(0,0,0,0)
              const d = new Date(lead.data_retorno + 'T12:00:00')
              const vencido = d < today
              const urgente = !vencido && (d.getTime()-today.getTime())/86400000 <= 3
              const [,m,dd] = lead.data_retorno.split('-')
              return (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-display font-bold border shrink-0 ${vencido?'bg-red-50 text-red-600 border-red-200':urgente?'bg-orange/10 text-orange border-orange/30':'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  <BellRing size={9}/>{dd}/{m}
                </span>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
