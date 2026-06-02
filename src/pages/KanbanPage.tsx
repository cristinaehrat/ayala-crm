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
import { useQueryClient } from '@tanstack/react-query'
import { useLeads, useUpdateLeadStatus } from '@/hooks/useLeads'
import type { LeadFilter } from '@/hooks/useLeads'
import LeadFilters from '@/components/leads/LeadFilters'
import { KANBAN_COLUMNS } from '@/lib/types'
import type { Lead } from '@/lib/types'
import KanbanColumn from '@/components/kanban/KanbanColumn'
import KanbanCard from '@/components/kanban/KanbanCard'
import MoverLeadSheet from '@/components/MoverLeadSheet'
import LeadDetailModal from '@/components/leads/LeadDetailModal'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

const DESKTOP_GRID_ROWS = [KANBAN_COLUMNS]

function getColumnLeads(leads: Lead[], colId: string): Lead[] {
  if (colId === 'em_contato') {
    return leads.filter((l) => (l.status ?? 'novo') === colId).slice(0, 25)
  }
  return leads.filter((l) => (l.status ?? 'novo') === colId)
}

function getColumnTotalCount(leads: Lead[], colId: string): number {
  return leads.filter((l) => (l.status ?? 'novo') === colId).length
}

export default function KanbanPage() {
  const [filter, setFilter] = useState<LeadFilter>('todos')
  const { data: leads = [], isLoading } = useLeads(filter)
  const updateStatus = useUpdateLeadStatus()
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeCol, setActiveCol] = useState(0)
  const [moveSheetLeadId, setMoveSheetLeadId] = useState<string | null>(null)
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // TouchSensor removido: conflita com scroll vertical no mobile
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const lead = leads.find((l) => l.id === String(active.id))
    if (!lead) return

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leads'] })

    const targetColumn = KANBAN_COLUMNS.find((c) => c.id === String(over.id))
    if (!targetColumn) {
      const targetLead = leads.find((l) => l.id === String(over.id))
      if (!targetLead || targetLead.status === lead.status) return
      updateStatus.mutate(
        { id: lead.id, status: targetLead.status ?? 'novo' },
        { onSuccess: invalidate, onError: invalidate },
      )
      return
    }
    if (targetColumn.id === lead.status) return
    updateStatus.mutate(
      { id: lead.id, status: targetColumn.id },
      { onSuccess: invalidate, onError: invalidate },
    )
  }

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  const filteredLeads = search.trim()
    ? leads.filter((lead) => {
        const q = search.toLowerCase()
        return (
          lead.nome?.toLowerCase().includes(q) ||
          lead.telefone?.includes(q) ||
          lead.empresa_oficina?.toLowerCase().includes(q)
        )
      })
    : leads

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full md:ml-56">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const colLeadsCount = KANBAN_COLUMNS.map(({ id }) =>
    getColumnTotalCount(filteredLeads, id),
  )

  return (
    <div className="h-full md:ml-56 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="font-display font-bold text-navy text-lg">Funil Comercial</h1>
      </div>

      <div className="px-4 pt-1 pb-2 shrink-0 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative md:max-w-sm md:w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Buscar lead por nome, telefone ou oficina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>
        <LeadFilters active={filter} onChange={setFilter} mode="kanban" />
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
                  : 'bg-transparent text-muted border-slate-300 hover:border-orange/50 hover:text-navy'
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
          {KANBAN_COLUMNS.map(({ id, label, accent, surface }, i) => {
            const colLeads = getColumnLeads(filteredLeads, id)
            const totalCount = getColumnTotalCount(filteredLeads, id)
            return (
              <div
                key={id}
                className={`${i === activeCol ? 'flex' : 'hidden'} flex-col w-full h-full`}
              >
                <KanbanColumn
                  id={id}
                  label={label}
                  leads={colLeads}
                  accent={accent}
                  surface={surface}
                  countLabel={id === 'em_contato' && totalCount > colLeads.length ? `${colLeads.length}/${totalCount}` : String(totalCount)}
                  colIdx={i}
                  totalCols={KANBAN_COLUMNS.length}
                  onMoverLead={(id) => setMoveSheetLeadId(id)}
                  onOpenLead={(id) => setOpenLeadId(id)}
                />
              </div>
            )
          })}
        </div>

        {/* Desktop médio: trilho horizontal */}
        <div className="hidden md:flex xl:hidden flex-1 overflow-x-auto gap-3 px-4 pb-4">
          {KANBAN_COLUMNS.map(({ id, label, accent, surface }, i) => {
            const colLeads = getColumnLeads(filteredLeads, id)
            const totalCount = getColumnTotalCount(filteredLeads, id)
            return (
              <KanbanColumn
                key={id}
                id={id}
                label={label}
                leads={colLeads}
                accent={accent}
                surface={surface}
                countLabel={id === 'em_contato' && totalCount > colLeads.length ? `${colLeads.length}/${totalCount}` : String(totalCount)}
                colIdx={i}
                totalCols={KANBAN_COLUMNS.length}
                onOpenLead={(id) => setOpenLeadId(id)}
              />
            )
          })}
        </div>

        {/* Desktop largo: grade 5 colunas */}
        <div className="hidden xl:grid flex-1 overflow-hidden px-4 pb-4 gap-3 grid-cols-5 auto-rows-fr">
          {DESKTOP_GRID_ROWS.map((row) =>
            row.map(({ id, label, accent, surface }) => {
              const colLeads = getColumnLeads(filteredLeads, id)
              const totalCount = getColumnTotalCount(filteredLeads, id)
              return (
                <KanbanColumn
                  key={id}
                  id={id}
                  label={label}
                  leads={colLeads}
                  accent={accent}
                  surface={surface}
                  countLabel={id === 'em_contato' && totalCount > colLeads.length ? `${colLeads.length}/${totalCount}` : String(totalCount)}
                  colIdx={0}
                  totalCols={row.length}
                  onOpenLead={(leadId) => setOpenLeadId(leadId)}
                />
              )
            }),
          )}
        </div>

        <DragOverlay>
          {activeLead ? <KanbanCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>

      {moveSheetLeadId && (
        <MoverLeadSheet
          leadId={moveSheetLeadId}
          open={!!moveSheetLeadId}
          onClose={() => setMoveSheetLeadId(null)}
        />
      )}

      <LeadDetailModal leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
    </div>
  )
}
