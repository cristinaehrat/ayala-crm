import type { LeadFilter } from '@/hooks/useLeads'
import { useDistinctUFs } from '@/hooks/useLeads'
import { cn } from '@/lib/utils'

const FILTERS: { id: LeadFilter; label: string }[] = [
  { id: 'todos',                label: 'Todos' },
  { id: 'ag_ismenia',           label: 'Ag. Ismênia' },
  { id: 'hot_lead',             label: 'Hot Lead' },
  { id: 'aguardando_pagamento', label: 'Ag. Pagamento' },
  { id: 'qualificados',         label: 'Qualificados' },
  { id: 'inscrito',             label: 'Inscritos' },
  { id: 'lista_espera',         label: 'Lista Espera' },
]

interface Props {
  active: LeadFilter
  onChange: (f: LeadFilter) => void
}

export default function LeadFilters({ active, onChange }: Props) {
  const { data: ufs = [] } = useDistinctUFs()

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
      {ufs.map((uf) => {
        const filterId = `uf:${uf}` as LeadFilter
        return (
          <button
            key={uf}
            onClick={() => onChange(filterId)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-semibold tracking-wide transition-colors cursor-pointer border',
              active === filterId
                ? 'bg-orange text-white border-orange'
                : 'bg-transparent text-muted border-white/20 hover:border-orange/50 hover:text-white',
            )}
          >
            {uf}
          </button>
        )
      })}
    </div>
  )
}
