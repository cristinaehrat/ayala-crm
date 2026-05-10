import type { LeadFilter } from '@/hooks/useLeads'
import { cn } from '@/lib/utils'

const FILTERS: { id: LeadFilter; label: string }[] = [
  { id: 'todos',                label: 'Todos' },
  { id: 'hot_lead',             label: 'Hot Lead' },
  { id: 'aguardando_pagamento', label: 'Ag. Pagamento' },
  { id: 'ag_ismenia',           label: 'Ag. Ismênia' },
  { id: 'qualificados',         label: 'Qualificados' },
  { id: 'inscrito',             label: 'Inscritos' },
  { id: 'lista_espera',         label: 'Lista Espera' },
  { id: 'curitiba',             label: 'Curitiba' },
  { id: 'joinville',            label: 'Joinville' },
]

interface Props {
  active: LeadFilter
  onChange: (f: LeadFilter) => void
}

export default function LeadFilters({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-3 pt-3 scrollbar-none">
      {FILTERS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-semibold tracking-wide transition-colors cursor-pointer border',
            active === id
              ? 'bg-orange text-white border-orange'
              : 'bg-transparent text-muted border-white/20 hover:border-orange/50 hover:text-white',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
