import { cn, MARCA_BADGES, relativeTime, formatPhone, ETIQUETA_CORES, ETIQUETA_LABELS, getPrimaryLeadLabel, getLeadActionSignals } from '@/lib/utils'
import { KANBAN_COLUMNS } from '@/lib/types'
import type { Lead } from '@/lib/types'

interface Props {
  lead: Lead
  onClick: () => void
}

const STATUS_COLORS: Record<string, string> = {
  lead_novo:            '#1565C0',
  qualificado:          '#2563EB',
  aguardando_ismenia:   '#7C3AED',
  visualizou_preco:     '#B45309',
  reserva:              '#DC2626',
  aguardando_pagamento: '#B45309',
  inscrito:             '#2E7D32',
  lista_espera:         '#E65100',
  sem_interesse:        '#64748B',
  perdido:              '#475569',
}

const COL = 'grid-cols-[minmax(250px,320px)_132px_188px_minmax(190px,1fr)_86px_118px] xl:grid-cols-[minmax(290px,360px)_144px_210px_minmax(220px,1fr)_92px_124px] gap-x-3 justify-start'

export function LeadRowHeader() {
  return (
    <div
      className={cn(
        'hidden md:grid items-center px-4 py-2',
        'border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur z-10',
        'text-[10px] font-display font-bold text-slate-500 uppercase tracking-widest',
        COL,
      )}
    >
      <span>Nome / Empresa</span>
      <span>Telefone</span>
      <span>Status</span>
      <span>Próx. passo</span>
      <span>Marca</span>
      <span>Últ. contato</span>
    </div>
  )
}

export default function LeadRow({ lead, onClick }: Props) {
  const marca = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null
  const actionSignals = getLeadActionSignals(lead)
  const primaryLabel = getPrimaryLeadLabel(lead.etiqueta_chatwoot)
  const hidePrimaryLabel = primaryLabel != null && actionSignals.some((signal) =>
    signal.id === primaryLabel || (signal.id === 'follow_up' && primaryLabel === 'visualizou_preco'),
  )
  const statusLabel = primaryLabel
    ? ETIQUETA_LABELS[primaryLabel] ?? primaryLabel
    : KANBAN_COLUMNS.find((c) => c.id === lead.status)?.label
  const statusColor = primaryLabel
    ? ETIQUETA_CORES[primaryLabel]
    : lead.status
      ? STATUS_COLORS[lead.status]
      : undefined

  return (
    <div
      onClick={onClick}
      className={cn(
        'hidden md:grid items-center px-4 py-3 my-2 rounded-xl',
        'border border-slate-200 bg-slate-50 shadow-sm',
        actionSignals.some((signal) => signal.id === 'hot_lead') && 'ring-1 ring-red-500/25',
        'hover:border-orange/30 hover:shadow-md hover:bg-blue-50 cursor-pointer transition-all',
        COL,
      )}
    >
      {/* Nome / Empresa */}
      <div className="min-w-0 pr-3">
        <p className="font-display font-semibold text-sm text-navy truncate">
          {lead.nome ?? lead.telefone}
        </p>
        <p className="text-xs text-slate-600 truncate mt-0.5">
          {[lead.empresa_oficina, lead.cidade && lead.uf ? `${lead.cidade}/${lead.uf}` : lead.cidade ?? lead.uf]
            .filter(Boolean)
            .join(' · ') || 'Sem empresa'}
        </p>
      </div>

      {/* Telefone */}
      <p className="text-xs text-slate-600 truncate pr-2">
        {formatPhone(lead.telefone) || '—'}
      </p>

      {/* Status */}
      <div className="pr-2">
        <div className="flex items-center gap-1 flex-wrap">
          {actionSignals.map((signal) => (
            <span
              key={signal.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-display font-bold tracking-wide uppercase"
              style={{ backgroundColor: signal.bg, color: signal.text }}
            >
              {signal.label}
            </span>
          ))}
          {!hidePrimaryLabel && statusLabel && statusColor ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-display font-bold tracking-wide text-white"
              style={{ backgroundColor: statusColor }}
            >
              {statusLabel}
            </span>
          ) : null}
          {actionSignals.length === 0 && (!statusLabel || !statusColor) && (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      </div>

      {/* Próximo passo */}
      <div className="min-w-0 pr-2">
        <p className="text-xs text-slate-600 truncate">
          {lead.proximo_passo || '—'}
        </p>
      </div>

      {/* Marca */}
      <div className="pr-2">
        {marca ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-display font-bold text-white"
            style={{ backgroundColor: marca.bg }}
          >
            {marca.label}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* Última atividade */}
      <div className="min-w-0">
        <p className="text-xs text-slate-600 truncate">
          {relativeTime(lead.ultimo_contato ?? lead.data_entrada)}
        </p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">
          {lead.canal_origem || '—'}
        </p>
      </div>
    </div>
  )
}
