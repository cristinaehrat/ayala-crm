import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowRightLeft } from 'lucide-react'
import { initials, MARCA_BADGES, findRotaMes } from '@/lib/utils'
import { useMalhaEstrategica } from '@/hooks/useMalhaEstrategica'
import type { Lead } from '@/lib/types'

interface Props {
  lead: Lead
  colIdx?: number
  totalCols?: number
  onMoverLead?: (leadId: string) => void
}

export default function KanbanCard({ lead, onMoverLead }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })
  const { data: malha = [] } = useMalhaEstrategica()
  const rotaMes = findRotaMes(lead.cidade, lead.marca_interesse, malha)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const marca = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-navy2/50 border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing
                 hover:border-orange/30 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center shrink-0">
          <span className="text-white font-display font-bold text-xs">{initials(lead.nome)}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-xs text-white truncate">
            {lead.nome ?? lead.telefone}
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
        {lead.canal_origem && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-white/10 text-muted">
            {lead.canal_origem}
          </span>
        )}
        {rotaMes && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-display font-bold text-white bg-orange/80">
            📍 {rotaMes}
          </span>
        )}
      </div>

      {onMoverLead && (
        <div
          className="flex md:hidden justify-center mt-2 pt-2 border-t border-white/10"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onMoverLead(lead.id) }}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors cursor-pointer"
            aria-label="Mover lead"
          >
            <ArrowRightLeft size={13} /> Mover Lead
          </button>
        </div>
      )}
    </div>
  )
}
