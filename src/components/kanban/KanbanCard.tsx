import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { initials, MARCA_BADGES } from '@/lib/utils'
import type { Lead } from '@/lib/types'

interface Props {
  lead: Lead
}

export default function KanbanCard({ lead }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })

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
      </div>
    </div>
  )
}
