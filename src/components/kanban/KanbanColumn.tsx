import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Lead } from '@/lib/types'
import KanbanCard from './KanbanCard'

interface Props {
  id: string
  label: string
  leads: Lead[]
  colIdx?: number
  totalCols?: number
  onMoverLead?: (leadId: string) => void
  onOpenLead?: (leadId: string) => void
}

export default function KanbanColumn({ id, label, leads, colIdx, totalCols, onMoverLead, onOpenLead }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      className={`flex flex-col w-full md:w-64 shrink-0 rounded-xl border transition-colors
        ${isOver ? 'border-orange/50 bg-orange/5' : 'border-slate-200 bg-slate-50/80'}`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
        <span className="font-display font-bold text-xs text-navy uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs text-muted bg-slate-200 px-2 py-0.5 rounded-full font-display font-semibold">
          {leads.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-24">
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              colIdx={colIdx}
              totalCols={totalCols}
              onMoverLead={onMoverLead}
              onOpenLead={onOpenLead}
            />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <p className="text-center text-muted text-xs py-4">Vazio</p>
        )}
      </div>
    </div>
  )
}
