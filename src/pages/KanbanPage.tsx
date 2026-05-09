import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
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

export default function KanbanPage() {
  const { data: leads = [], isLoading } = useLeads('todos')
  const updateStatus = useUpdateLeadStatus()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
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

    // over.id can be column id or another card id — find the column
    const targetColumn = KANBAN_COLUMNS.find((c) => c.id === String(over.id))
    if (!targetColumn) {
      // dropped over a card — find that card's column
      const targetLead = leads.find((l) => l.id === String(over.id))
      if (!targetLead || targetLead.status === lead.status) return
      await updateStatus.mutateAsync({ id: lead.id, status: targetLead.status ?? 'lead_novo' })
      return
    }
    if (targetColumn.id === lead.status) return
    await updateStatus.mutateAsync({ id: lead.id, status: targetColumn.id })
  }

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full md:ml-56">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full md:ml-56 overflow-x-auto p-4">
      <h1 className="font-display font-bold text-white text-lg mb-4 shrink-0">
        Funil Comercial
      </h1>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 pb-4">
          {KANBAN_COLUMNS.map(({ id, label }) => {
            const colLeads = leads.filter(
              (l) => (l.status ?? 'lead_novo') === id,
            )
            return <KanbanColumn key={id} id={id} label={label} leads={colLeads} />
          })}
        </div>

        <DragOverlay>
          {activeLead ? <KanbanCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
