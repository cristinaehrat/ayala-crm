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
import { ChevronLeft, ChevronRight, Flame, PhoneCall, RefreshCw } from 'lucide-react'
import { hasLeadLabel, needsLeadFollowUp } from '@/lib/utils'

const DESKTOP_GRID_ROWS = [
  KANBAN_COLUMNS.slice(0, 5),
  KANBAN_COLUMNS.slice(5, 10),
]

function getColumnLeads(leads: Lead[], colId: string): Lead[] {
  if (colId === 'aguardando_ismenia') {
    return leads.filter((l) =>
      l.status === 'aguardando_ismenia' ||
      l.etiqueta_chatwoot?.toLowerCase().includes('aguardando_ismenia')
    )
  }
  if (colId === 'qualificado') {
    return leads
      .filter((l) => (l.status ?? 'lead_novo') === colId)
      .slice(0, 25)
  }
  return leads.filter((l) => (l.status ?? 'lead_novo') === colId)
}

function getColumnTotalCount(leads: Lead[], colId: string): number {
  if (colId === 'aguardando_ismenia') {
    return leads.filter((l) =>
      l.status === 'aguardando_ismenia' ||
      l.etiqueta_chatwoot?.toLowerCase().includes('aguardando_ismenia')
    ).length
  }
  return leads.filter((l) => (l.status ?? 'lead_novo') === colId).length
}

export default function KanbanPage() {
  const [filter, setFilter] = useState<LeadFilter>('todos')
  const { data: leads = [], isLoading } = useLeads(filter)
  const { data: allLeads = [] } = useLeads('todos')
  const updateStatus = useUpdateLeadStatus()
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeCol, setActiveCol] = useState(0)
  const [moveSheetLeadId, setMoveSheetLeadId] = useState<string | null>(null)
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)

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
        { id: lead.id, status: targetLead.status ?? 'lead_novo' },
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full md:ml-56">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const colLeadsCount = KANBAN_COLUMNS.map(({ id }) =>
    getColumnTotalCount(leads, id),
  )
  const hotLeadQueue = allLeads.filter((lead) => hasLeadLabel(lead.etiqueta_chatwoot, 'hot_lead')).slice(0, 2)
  const agIsmeniaQueue = allLeads.filter((lead) => hasLeadLabel(lead.etiqueta_chatwoot, 'aguardando_ismenia')).slice(0, 2)
  const followUpQueue = allLeads.filter((lead) => needsLeadFollowUp(lead)).slice(0, 2)
  const priorityGroups = [
    {
      id: 'hot_lead',
      label: 'Hot Leads',
      helper: 'clicou em garantir vaga',
      count: allLeads.filter((lead) => hasLeadLabel(lead.etiqueta_chatwoot, 'hot_lead')).length,
      leads: hotLeadQueue,
      icon: Flame,
      accent: '#C62828',
      surface: '#FEE2E2',
      onClick: () => setFilter('hot_lead'),
    },
    {
      id: 'ag_ismenia',
      label: 'Ag. Ismênia',
      helper: 'pedem resposta humana',
      count: allLeads.filter((lead) => hasLeadLabel(lead.etiqueta_chatwoot, 'aguardando_ismenia')).length,
      leads: agIsmeniaQueue,
      icon: PhoneCall,
      accent: '#F97316',
      surface: '#FFEDD5',
      onClick: () => setFilter('ag_ismenia'),
    },
    {
      id: 'follow_up',
      label: 'Follow-up',
      helper: 'viram preço e travaram',
      count: allLeads.filter((lead) => needsLeadFollowUp(lead)).length,
      leads: followUpQueue,
      icon: RefreshCw,
      accent: '#B45309',
      surface: '#FEF3C7',
      onClick: () => setFilter('follow_up'),
    },
  ]

  return (
    <div className="h-full md:ml-56 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="font-display font-bold text-navy text-lg">Funil Comercial</h1>
      </div>

      <LeadFilters active={filter} onChange={setFilter} />

      <div className="px-4 pb-2 shrink-0">
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {priorityGroups.map((group) => {
            const Icon = group.icon
            return (
              <button
                key={group.id}
                onClick={group.onClick}
                className="rounded-2xl border border-slate-200 p-2.5 text-left transition-all hover:shadow-md hover:border-orange/30 bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-display font-bold uppercase tracking-wide" style={{ backgroundColor: group.surface, color: group.accent }}>
                      <Icon size={12} />
                      {group.label}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">{group.helper}</p>
                  </div>
                  <span className="shrink-0 text-base font-display font-bold" style={{ color: group.accent }}>
                    {group.count}
                  </span>
                </div>

                <div className="mt-2 space-y-1.5">
                  {group.leads.length > 0 ? (
                    group.leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5"
                        style={{ backgroundColor: group.surface }}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-display font-semibold text-navy truncate">
                            {lead.nome ?? lead.telefone}
                          </p>
                          <p className="text-[11px] text-slate-600 truncate">
                            {lead.empresa_oficina ?? lead.cidade ?? 'Sem empresa'}
                          </p>
                        </div>
                        <span className="text-[11px] font-display font-bold shrink-0" style={{ color: group.accent }}>
                          na fila
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 py-1.5">Sem leads nesta fila.</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
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
            const colLeads = getColumnLeads(leads, id)
            const totalCount = getColumnTotalCount(leads, id)
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
                  subtitle={id === 'qualificado' ? 'fila operacional recente' : undefined}
                  countLabel={id === 'qualificado' && totalCount > colLeads.length ? `${colLeads.length}/${totalCount}` : String(totalCount)}
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
            const colLeads = getColumnLeads(leads, id)
            const totalCount = getColumnTotalCount(leads, id)
            return (
              <KanbanColumn
                key={id}
                id={id}
                label={label}
                leads={colLeads}
                accent={accent}
                surface={surface}
                subtitle={id === 'qualificado' ? 'fila operacional recente' : undefined}
                countLabel={id === 'qualificado' && totalCount > colLeads.length ? `${colLeads.length}/${totalCount}` : String(totalCount)}
                colIdx={i}
                totalCols={KANBAN_COLUMNS.length}
                onOpenLead={(id) => setOpenLeadId(id)}
              />
            )
          })}
        </div>

        {/* Desktop largo: grade 5x2 */}
        <div className="hidden xl:grid flex-1 overflow-hidden px-4 pb-4 gap-3 grid-cols-5 auto-rows-fr">
          {DESKTOP_GRID_ROWS.map((row, rowIndex) =>
            row.map(({ id, label, accent, surface }) => {
              const colLeads = getColumnLeads(leads, id)
              const totalCount = getColumnTotalCount(leads, id)
              return (
                <KanbanColumn
                  key={id}
                  id={id}
                  label={label}
                  leads={colLeads}
                  accent={accent}
                  surface={surface}
                  subtitle={id === 'qualificado' ? 'fila operacional recente' : rowIndex === 0 ? 'avanço comercial' : 'fechamento e saída'}
                  countLabel={id === 'qualificado' && totalCount > colLeads.length ? `${colLeads.length}/${totalCount}` : String(totalCount)}
                  colIdx={rowIndex}
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
