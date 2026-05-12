import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLeads, type LeadFilter } from '@/hooks/useLeads'
import { useRealtime } from '@/hooks/useRealtime'
import LeadFilters from '@/components/leads/LeadFilters'
import LeadCard from '@/components/leads/LeadCard'
import LeadDetail from '@/components/leads/LeadDetail'
import NewLeadModal from '@/components/leads/NewLeadModal'
import { Search, Plus } from 'lucide-react'

const VALID_FILTERS: LeadFilter[] = [
  'todos','ag_ismenia','qualificados','hot_lead','lista_espera',
  'aguardando_pagamento','visualizou_preco',
]

export default function LeadsPage() {
  useRealtime()
  const [searchParams] = useSearchParams()
  const paramFilter = searchParams.get('filter') as LeadFilter | null
  const [filter, setFilter] = useState<LeadFilter>(
    paramFilter && VALID_FILTERS.includes(paramFilter) ? paramFilter : 'todos',
  )
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newLeadOpen, setNewLeadOpen] = useState(false)

  const { data: leads = [], isLoading } = useLeads(filter)

  const filtered = search.trim()
    ? leads.filter((l) => {
        const q = search.toLowerCase()
        return (
          l.nome?.toLowerCase().includes(q) ||
          l.telefone?.includes(q) ||
          l.empresa_oficina?.toLowerCase().includes(q)
        )
      })
    : leads

  return (
    <>
      <div className="flex h-full md:ml-56">
        {/* Left panel — list */}
        <div
          className={`flex flex-col overflow-hidden border-r border-white/10 bg-navy
            ${selectedId ? 'hidden md:flex md:w-96 lg:w-[440px]' : 'flex w-full md:w-96 lg:w-[440px]'}`}
        >
          {/* Search + New */}
          <div className="px-3 pt-3 pb-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
                placeholder="Buscar nome, telefone, oficina..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 text-xs"
              />
            </div>
            <button
              onClick={() => setNewLeadOpen(true)}
              className="btn-primary px-3 flex items-center gap-1 shrink-0"
              aria-label="Novo lead"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Filters */}
          <LeadFilters active={filter} onChange={setFilter} />

          {/* Counter */}
          <p className="text-xs text-muted px-4 py-2">
            {isLoading ? 'Carregando...' : `${filtered.length} leads`}
          </p>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-12 text-muted text-sm">
                Nenhum lead encontrado
              </div>
            )}
            {filtered.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                active={selectedId === lead.id}
                onClick={() => setSelectedId(lead.id)}
              />
            ))}
          </div>
        </div>

        {/* Right panel — detail */}
        {selectedId && (
          <div className="flex-1 bg-navy overflow-hidden">
            <LeadDetail leadId={selectedId} onClose={() => setSelectedId(null)} />
          </div>
        )}

        {/* Desktop placeholder */}
        {!selectedId && (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-navy2/50 flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-muted" />
              </div>
              <p className="text-sm font-display font-semibold">Selecione um lead</p>
            </div>
          </div>
        )}
      </div>

      <NewLeadModal open={newLeadOpen} onClose={() => setNewLeadOpen(false)} />
    </>
  )
}
