import { cn, MARCA_BADGES, relativeTime, formatPhone } from '@/lib/utils'
import { KANBAN_COLUMNS } from '@/lib/types'
import type { Lead } from '@/lib/types'

interface Props {
  lead: Lead
  onClick: () => void
}

const STATUS_COLORS: Record<string, string> = {
  lead_novo:            '#1565C0',
  aguardando_ismenia:   '#7C3AED',
  aguardando_pagamento: '#B45309',
  inscrito:             '#2E7D32',
  lista_espera:         '#E65100',
  perdido:              '#475569',
}

const COL = 'grid-cols-[minmax(0,1fr)_140px_80px_80px] lg:grid-cols-[minmax(0,1fr)_130px_110px_140px_80px_80px]'

export function LeadRowHeader() {
  return (
    <div
      className={cn(
        'hidden md:grid items-center px-4 py-2',
        'border-b border-border-subtle sticky top-0 bg-app z-10',
        'text-[10px] font-display font-bold text-muted uppercase tracking-widest',
        COL,
      )}
    >
      <span>Nome / Empresa</span>
      <span className="hidden lg:block">Telefone</span>
      <span className="hidden lg:block">Canal</span>
      <span>Status</span>
      <span>Marca</span>
      <span className="text-right">Atividade</span>
    </div>
  )
}

export default function LeadRow({ lead, onClick }: Props) {
  const marca = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null
  const statusLabel = KANBAN_COLUMNS.find((c) => c.id === lead.status)?.label
  const statusColor = lead.status ? STATUS_COLORS[lead.status] : undefined

  return (
    <div
      onClick={onClick}
      className={cn(
        'hidden md:grid items-center px-4 py-3',
        'border-b border-border-subtle last:border-0',
        'hover:bg-slate-50 cursor-pointer transition-colors',
        COL,
      )}
    >
      {/* Nome / Empresa */}
      <div className="min-w-0 pr-3">
        <p className="font-display font-semibold text-sm text-navy truncate">
          {lead.nome ?? lead.telefone}
        </p>
        {lead.empresa_oficina && (
          <p className="text-xs text-muted truncate mt-0.5">{lead.empresa_oficina}</p>
        )}
      </div>

      {/* Telefone — lg+ */}
      <p className="hidden lg:block text-xs text-muted truncate pr-2">
        {formatPhone(lead.telefone) || '—'}
      </p>

      {/* Canal origem — lg+ */}
      <p className="hidden lg:block text-xs text-muted truncate pr-2">
        {lead.canal_origem || '—'}
      </p>

      {/* Status */}
      <div className="pr-2">
        {statusLabel && statusColor ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-display font-bold tracking-wide text-white"
            style={{ backgroundColor: statusColor }}
          >
            {statusLabel}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
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
          <span className="text-xs text-muted">—</span>
        )}
      </div>

      {/* Última atividade */}
      <p className="text-xs text-muted text-right truncate">
        {relativeTime(lead.ultimo_contato ?? lead.data_entrada)}
      </p>
    </div>
  )
}
