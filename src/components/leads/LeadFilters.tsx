import { useState, useRef, useEffect } from 'react'
import type { LeadFilter } from '@/hooks/useLeads'
import { useDistinctUFs, useDistinctCidades } from '@/hooks/useLeads'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

const FILTERS: { id: LeadFilter; label: string }[] = [
  { id: 'todos',                label: 'Todos' },
  { id: 'hot_lead',             label: 'Hot Lead' },
  { id: 'ag_ismenia',           label: 'Ag. Ismênia' },
  { id: 'follow_up',            label: 'Follow-up' },
  { id: 'qualificados',         label: 'Qualif. recentes' },
  { id: 'aguardando_pagamento', label: 'Ag. Pagamento' },
  { id: 'inscrito',             label: 'Inscritos' },
  { id: 'visualizou_preco',     label: 'Viu Preço' },
  { id: 'lista_espera',         label: 'Lista Espera' },
]

interface Props {
  active: LeadFilter
  onChange: (f: LeadFilter) => void
  mode?: 'default' | 'kanban'
}

export default function LeadFilters({ active, onChange, mode = 'default' }: Props) {
  const [ufOpen, setUfOpen] = useState(false)
  const [cidadeOpen, setCidadeOpen] = useState(false)
  const ufRef = useRef<HTMLDivElement>(null)
  const cidadeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ufRef.current && !ufRef.current.contains(e.target as Node)) setUfOpen(false)
      if (cidadeRef.current && !cidadeRef.current.contains(e.target as Node)) setCidadeOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const { data: ufs = [] } = useDistinctUFs()
  const { data: cidades = [] } = useDistinctCidades()

  const activeUf = active.startsWith('uf:') ? active.slice(3) : null
  const activeCidade = active.startsWith('cidade:') ? active.slice(7) : null

  const pillBase =
    'px-2.5 py-1 rounded-full text-xs font-display font-semibold tracking-wide transition-colors cursor-pointer border flex items-center gap-1'
  const pillActive = 'bg-orange text-white border-orange'
  const pillInactive = 'bg-transparent text-muted border-slate-300 hover:border-orange/50 hover:text-navy'
  const showDefaultFilters = mode === 'default'

  return (
    <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-2">
      {showDefaultFilters
        ? FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(pillBase, active === id ? pillActive : pillInactive)}
            >
              {label}
            </button>
          ))
        : (
          <button
            onClick={() => onChange('todos')}
            className={cn(pillBase, active === 'todos' ? pillActive : pillInactive)}
          >
            Todos
          </button>
        )}

      {/* UF dropdown */}
      <div className="relative shrink-0" ref={ufRef}>
        <button
          onClick={() => { setUfOpen((o) => !o); setCidadeOpen(false) }}
          className={cn(pillBase, activeUf ? pillActive : pillInactive)}
        >
          {activeUf ?? 'UF'}
          <ChevronDown size={12} />
        </button>
        {ufOpen && ufs.length > 0 && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md z-50 max-h-48 overflow-y-auto min-w-[80px]">
            {ufs.map((uf) => (
              <button
                key={uf}
                onClick={() => { onChange(`uf:${uf}` as LeadFilter); setUfOpen(false) }}
                className={cn(
                  'block w-full text-left px-3 py-2 text-xs font-display font-semibold hover:bg-slate-100 transition-colors',
                  activeUf === uf ? 'text-orange' : 'text-navy',
                )}
              >
                {uf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cidade dropdown */}
      <div className="relative shrink-0" ref={cidadeRef}>
        <button
          onClick={() => { setCidadeOpen((o) => !o); setUfOpen(false) }}
          className={cn(pillBase, activeCidade ? pillActive : pillInactive)}
        >
          {activeCidade ?? 'Cidade'}
          <ChevronDown size={12} />
        </button>
        {cidadeOpen && cidades.length > 0 && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md z-50 max-h-48 overflow-y-auto min-w-[120px]">
            <button
              onClick={() => { onChange('todos'); setCidadeOpen(false) }}
              className="block w-full text-left px-3 py-2 text-xs font-display font-semibold text-muted hover:bg-slate-100 transition-colors"
            >
              Todas
            </button>
            {cidades.map((cidade) => (
              <button
                key={cidade}
                onClick={() => { onChange(`cidade:${cidade}` as LeadFilter); setCidadeOpen(false) }}
                className={cn(
                  'block w-full text-left px-3 py-2 text-xs font-display font-semibold hover:bg-slate-100 transition-colors',
                  activeCidade === cidade ? 'text-orange' : 'text-navy',
                )}
              >
                {cidade}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
