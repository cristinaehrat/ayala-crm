import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Lead } from '@/lib/types'
import KanbanCard from './KanbanCard'

interface Props {
  id: string
  label: string
  leads: Lead[]
  accent?: string
  surface?: string
  subtitle?: string
  countLabel?: string
  colIdx?: number
  totalCols?: number
  onMoverLead?: (leadId: string) => void
  onOpenLead?: (leadId: string) => void
}

export default function KanbanColumn({
  id,
  label,
  leads,
  accent = '#0D1F3C',
  surface = '#EFF6FF',
  subtitle,
  countLabel,
  colIdx,
  totalCols,
  onMoverLead,
  onOpenLead,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      className={`flex flex-col w-full md:w-64 xl:w-full shrink-0 rounded-xl border transition-colors min-h-0
        ${isOver ? 'border-orange/50 bg-orange/5' : 'border-slate-200 bg-slate-50/80'}`}
    >
      <div className="border-b border-slate-200 px-3 py-2.5" style={{ backgroundColor: surface }}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span
              className="font-display font-bold text-xs uppercase tracking-wide"
              style={{ color: accent }}
            >
              {label}
            </span>
            {subtitle ? (
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{subtitle}</p>
            ) : null}
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-display font-semibold shrink-0"
            style={{ backgroundColor: '#FFFFFF', color: accent }}
          >
            {countLabel ?? leads.length}
          </span>
        </div>
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
