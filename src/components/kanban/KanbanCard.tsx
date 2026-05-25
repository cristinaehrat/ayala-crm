import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowRightLeft } from 'lucide-react'
import { initials, formatPhone, MARCA_BADGES, POTENCIAL_BADGES, INTERESSE_TAGS, findRotaMes, getLeadActionSignals } from '@/lib/utils'
import { useMalhaEstrategica } from '@/hooks/useMalhaEstrategica'
import type { Lead } from '@/lib/types'
import { useRef } from 'react'

interface Props {
  lead: Lead
  colIdx?: number
  totalCols?: number
  onMoverLead?: (leadId: string) => void
  onOpenLead?: (leadId: string) => void
}

export default function KanbanCard({ lead, onMoverLead, onOpenLead }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })
  const { data: malha = [] } = useMalhaEstrategica()
  const rotaMes = findRotaMes(lead.cidade, lead.marca_interesse, malha)
  const actionSignals = getLeadActionSignals(lead)
  const lastClick = useRef(0)

  function handleClick() {
    const now = Date.now()
    if (now - lastClick.current < 350) {
      onOpenLead?.(lead.id)
      lastClick.current = 0
    } else {
      lastClick.current = now
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const marca = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null
  const potencial = lead.potencial ? POTENCIAL_BADGES[lead.potencial] : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`bg-white border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing
                 hover:border-orange/30 hover:shadow-md transition-all ${
                   actionSignals.some((signal) => signal.id === 'hot_lead')
                     ? 'border-red-300 ring-1 ring-red-500/25'
                     : 'border-slate-200'
                 }`}
      data-hot-lead={actionSignals.some((signal) => signal.id === 'hot_lead') || undefined}
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

      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center shrink-0">
          <span className="text-white font-display font-bold text-xs">{initials(lead.nome)}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-xs text-navy truncate">
            {lead.nome ?? formatPhone(lead.telefone)}
          </p>
          <p className="text-muted text-xs truncate">{lead.empresa_oficina ?? lead.cidade}</p>
        </div>
        {lead.requer_atencao && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-orange animate-pulse-orange" />
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        {marca && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-display font-bold text-white"
            style={{ backgroundColor: marca.bg }}
          >
            {marca.label}
          </span>
        )}
        {potencial && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-display font-bold text-white"
            style={{ backgroundColor: potencial.bg }}
          >
            {potencial.label}
          </span>
        )}
        {lead.canal_origem && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-muted">
            {lead.canal_origem}
          </span>
        )}
        {(lead.interesses ?? []).map((interesse) => {
          const tag = INTERESSE_TAGS.find((t) => t.value === interesse)
          if (!tag) return null
          return (
            <span
              key={tag.value}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold text-white"
              style={{ backgroundColor: tag.bg }}
            >
              {tag.label}
            </span>
          )
        })}
        {rotaMes && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold text-white bg-orange/80">
            📍 {rotaMes}
          </span>
        )}
      </div>

      {onMoverLead && (
        <div
          className="flex md:hidden justify-center mt-2 pt-2 border-t border-slate-200"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onMoverLead(lead.id) }}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-navy transition-colors cursor-pointer"
            aria-label="Mover lead"
          >
            <ArrowRightLeft size={13} /> Mover Lead
          </button>
        </div>
      )}
    </div>
  )
}
