import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { useLeads, useUpdateLeadStatus } from '@/hooks/useLeads'
import { KANBAN_COLUMNS } from '@/lib/types'
import KanbanColumn from '@/components/kanban/KanbanColumn'
import KanbanCard from '@/components/kanban/KanbanCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function KanbanPage() {
  const { data: leads = [], isLoading } = useLeads('todos')
  const updateStatus = useUpdateLeadStatus()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeCol, setActiveCol] = useState(0)

  // TouchSensor removido: conflita com scroll vertical no mobile
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const lead = leads.find((l) => l.id === String(active.id))
    if (!lead) return

    const targetColumn = KANBAN_COLUMNS.find((c) => c.id === String(over.id))
    if (!targetColumn) {
      const targetLead = leads.find((l) => l.id === String(over.id))
      if (!targetLead || targetLead.status === lead.status) return
      await updateStatus.mutateAsync({ id: lead.id, status: targetLead.status ?? 'lead_novo' })
      return
    }
    if (targetColumn.id === lead.status) return
    await updateStatus.mutateAsync({ id: lead.id, status: targetColumn.id })
  }

  async function handleMoveCard(leadId: string, direction: 'prev' | 'next') {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return
    const curIdx  = KANBAN_COLUMNS.findIndex((c) => c.id === (lead.status ?? 'lead_novo'))
    const nextIdx = direction === 'next' ? curIdx + 1 : curIdx - 1
    if (nextIdx < 0 || nextIdx >= KANBAN_COLUMNS.length) return
    await updateStatus.mutateAsync({ id: lead.id, status: KANBAN_COLUMNS[nextIdx].id })
  }

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full md:ml-56">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const colLeadsCount = KANBAN_COLUMNS.map(({ id }) =>
    leads.filter((l) => (l.status ?? 'lead_novo') === id).length,
  )

  return (
    <div className="h-full md:ml-56 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="font-display font-bold text-white text-lg">Funil Comercial</h1>
      </div>

      {/* Mobile: column selector */}
      <div className="flex md:hidden items-center gap-2 px-4 pb-2 shrink-0">
        <button
          onClick={() => setActiveCol((c) => Math.max(0, c - 1))}
          disabled={activeCol === 0}
          className="p-1 text-muted disabled:opacity-30 cursor-pointer disabled:cursor-default"
          aria-label="Coluna anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none">
          {KANBAN_COLUMNS.map(({ id, label }, i) => (
            <button
              key={id}
              onClick={() => setActiveCol(i)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-display font-semibold transition-colors cursor-pointer border ${
                activeCol === i
                  ? 'bg-orange text-white border-orange'
                  : 'bg-transparent text-muted border-white/20 hover:border-orange/40 hover:text-white'
              }`}
            >
              {label}
              {colLeadsCount[i] > 0 && (
                <span className="ml-1 opacity-70">{colLeadsCount[i]}</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setActiveCol((c) => Math.min(KANBAN_COLUMNS.length - 1, c + 1))}
          disabled={activeCol === KANBAN_COLUMNS.length - 1}
          className="p-1 text-muted disabled:opacity-30 cursor-pointer disabled:cursor-default"
          aria-label="Próxima coluna"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* Mobile: single column view */}
        <div className="flex md:hidden flex-1 overflow-hidden px-4 pb-4">
          {KANBAN_COLUMNS.map(({ id, label }, i) => {
            const colLeads = leads.filter((l) => (l.status ?? 'lead_novo') === id)
            return (
              <div
                key={id}
                className={`${i === activeCol ? 'flex' : 'hidden'} flex-col w-full`}
              >
                <KanbanColumn
                  id={id}
                  label={label}
                  leads={colLeads}
                  colIdx={i}
                  totalCols={KANBAN_COLUMNS.length}
                  onMoveCard={handleMoveCard}
                />
              </div>
            )
          })}
        </div>

        {/* Desktop: all columns horizontally — drag & drop funciona normalmente */}
        <div className="hidden md:flex flex-1 overflow-x-auto gap-3 px-4 pb-4">
          {KANBAN_COLUMNS.map(({ id, label }, i) => {
            const colLeads = leads.filter((l) => (l.status ?? 'lead_novo') === id)
            return (
              <KanbanColumn
                key={id}
                id={id}
                label={label}
                leads={colLeads}
                colIdx={i}
                totalCols={KANBAN_COLUMNS.length}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeLead ? <KanbanCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
