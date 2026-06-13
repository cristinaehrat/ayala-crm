import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLeads, useSearchLeadByPhone, type LeadFilter } from '@/hooks/useLeads'
import { useRealtime } from '@/hooks/useRealtime'
import LeadFilters from '@/components/leads/LeadFilters'
import LeadCard from '@/components/leads/LeadCard'
import LeadRow, { LeadRowHeader } from '@/components/leads/LeadRow'
import LeadDetailModal from '@/components/leads/LeadDetailModal'
import NewLeadModal from '@/components/leads/NewLeadModal'
import { Search, Plus } from 'lucide-react'

function SkeletonCard() {
  return (
    <div className="card-lead">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full skeleton-pulse shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-4 w-36 skeleton-pulse" />
          <div className="h-3 w-24 skeleton-pulse" />
          <div className="flex gap-1.5 mt-1">
            <div className="h-4 w-16 skeleton-pulse rounded-full" />
            <div className="h-4 w-12 skeleton-pulse rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

const VALID_FILTERS: LeadFilter[] = [
  'hoje','todos','hot_lead','ag_ismenia','follow_up','qualificados',
  'aguardando_pagamento','inscrito','visualizou_preco','lista_espera',
  'para_paola','requer_atencao',
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

  const phoneDigits = search.replace(/\D/g, '')
  const isPhoneSearch = phoneDigits.length >= 8
  const { data: phoneResults = [], isFetching: isPhoneFetching } = useSearchLeadByPhone(phoneDigits)

  const filtered = search.trim()
    ? isPhoneSearch
      ? phoneResults
      : leads.filter((l) => {
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
      <div className="flex flex-col h-full md:ml-56">
        {/* Search + New */}
        <div className="px-3 pt-3 pb-1 flex gap-2 shrink-0">
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
        <p className="text-xs text-muted px-4 py-2 shrink-0">
          {isLoading || isPhoneFetching ? 'Carregando...' : `${filtered.length} leads`}
        </p>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {(isLoading || isPhoneFetching) && (
            <div className="md:hidden px-3 pt-1 pb-3 space-y-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}
          {(isLoading || isPhoneFetching) && (
            <div className="hidden md:flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && !isPhoneFetching && filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <p className="text-muted text-sm">
                {isPhoneSearch
                  ? 'Nenhum lead encontrado para esse número'
                  : 'Nenhum lead para este filtro'}
              </p>
              {!isPhoneSearch && filter !== 'todos' && (
                <button
                  onClick={() => setFilter('todos')}
                  className="text-xs font-display font-semibold text-orange hover:text-orange2 transition-colors underline underline-offset-2"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Mobile: cards */}
          {!isLoading && filtered.length > 0 && (
            <div className="md:hidden px-3 pt-1 pb-3 space-y-2">
              {filtered.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => setSelectedId(lead.id)}
                />
              ))}
            </div>
          )}

          {/* Desktop: table/cards layout with same information as before */}
          {!isLoading && filtered.length > 0 && (
            <div className="hidden md:block">
              <LeadRowHeader />
              {filtered.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onClick={() => setSelectedId(lead.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <LeadDetailModal leadId={selectedId} onClose={() => setSelectedId(null)} />
      <NewLeadModal open={newLeadOpen} onClose={() => setNewLeadOpen(false)} />
    </>
  )
}
