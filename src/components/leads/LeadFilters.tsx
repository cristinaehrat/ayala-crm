import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { LeadFilter } from '@/hooks/useLeads'
import { useDistinctUFs, useDistinctCidades, useLeadsAgendaCount } from '@/hooks/useLeads'
import { cn } from '@/lib/utils'
import { ChevronDown, BellRing } from 'lucide-react'

const FILTERS_ISA: { id: LeadFilter; label: string }[] = [
  { id: 'hoje',                 label: 'Hoje' },
  { id: 'todos',                label: 'Todos' },
  { id: 'hot_lead',             label: 'Hot Lead' },
  { id: 'ag_ismenia',           label: 'Ag. Consultora' },
  { id: 'para_paola',           label: 'Para Paola' },
  { id: 'follow_up',            label: 'Follow-up' },
  { id: 'qualificados',         label: 'Em Contato' },
  { id: 'aguardando_pagamento', label: 'Oportunidade' },
  { id: 'inscrito',             label: 'Clientes' },
  { id: 'visualizou_preco',     label: 'Viu Preço' },
  { id: 'lista_espera',         label: 'Lista Espera' },
]

const FILTERS_PAOLA: { id: LeadFilter; label: string }[] = [
  { id: 'hoje',                   label: 'Hoje' },
  { id: 'todos',                  label: 'Todos' },
  { id: 'para_paola',             label: 'Para mim' },
  { id: 'requer_atencao',         label: 'Ação Pendente' },
  { id: 'disponivel_transmissao', label: 'Livre 6207' },
  { id: 'hot_lead',               label: 'Hot Lead' },
  { id: 'follow_up',              label: 'Follow-up' },
  { id: 'qualificados',           label: 'Em Contato' },
  { id: 'aguardando_pagamento',   label: 'Oportunidade' },
  { id: 'inscrito',               label: 'Clientes' },
  { id: 'visualizou_preco',       label: 'Viu Preço' },
]

const CONSULTORES_FILTER = ['Ismênia', 'Paola', 'Cristina', 'Bena']

interface Props {
  active: LeadFilter
  onChange: (f: LeadFilter) => void
  mode?: 'default' | 'kanban'
}

export default function LeadFilters({ active, onChange, mode = 'default' }: Props) {
  const [ufOpen, setUfOpen] = useState(false)
  const [cidadeOpen, setCidadeOpen] = useState(false)
  const [consultorOpen, setConsultorOpen] = useState(false)
  const [isPaola, setIsPaola] = useState(false)
  const ufRef = useRef<HTMLDivElement>(null)
  const cidadeRef = useRef<HTMLDivElement>(null)
  const consultorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsPaola(data.user?.email === 'paola@ayalaoficial.com.br')
    })
  }, [])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ufRef.current && !ufRef.current.contains(e.target as Node)) setUfOpen(false)
      if (cidadeRef.current && !cidadeRef.current.contains(e.target as Node)) setCidadeOpen(false)
      if (consultorRef.current && !consultorRef.current.contains(e.target as Node)) setConsultorOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const { data: ufs = [] } = useDistinctUFs()
  const { data: cidades = [] } = useDistinctCidades()
  const { data: agendaCount = 0 } = useLeadsAgendaCount()
  const FILTERS = isPaola ? FILTERS_PAOLA : FILTERS_ISA

  const activeUf = active.startsWith('uf:') ? active.slice(3) : null
  const activeCidade = active.startsWith('cidade:') ? active.slice(7) : null
  const activeConsultor = active.startsWith('consultor:') ? active.slice(10) : null

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
              className={cn(
                pillBase,
                active === id ? pillActive : pillInactive,
                id === 'hoje' && agendaCount > 0 && active !== 'hoje' ? 'border-orange/60 text-orange' : '',
              )}
            >
              {id === 'hoje' && <BellRing size={11} />}
              {label}
              {id === 'hoje' && agendaCount > 0 && (
                <span className={cn('rounded-full text-[10px] font-bold px-1.5 min-w-[1.25rem] text-center leading-5', active === 'hoje' ? 'bg-white/20 text-white' : 'bg-red-500 text-white')}>
                  {agendaCount}
                </span>
              )}
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
          onClick={() => { setCidadeOpen((o) => !o); setUfOpen(false); setConsultorOpen(false) }}
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

      {/* Consultor dropdown */}
      <div className="relative shrink-0" ref={consultorRef}>
        <button
          onClick={() => { setConsultorOpen((o) => !o); setUfOpen(false); setCidadeOpen(false) }}
          className={cn(pillBase, activeConsultor ? pillActive : pillInactive)}
        >
          {activeConsultor ?? 'Consultor'}
          <ChevronDown size={12} />
        </button>
        {consultorOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md z-50 min-w-[110px]">
            <button
              onClick={() => { onChange('todos'); setConsultorOpen(false) }}
              className="block w-full text-left px-3 py-2 text-xs font-display font-semibold text-muted hover:bg-slate-100 transition-colors"
            >
              Todos
            </button>
            {CONSULTORES_FILTER.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(`consultor:${c}` as LeadFilter); setConsultorOpen(false) }}
                className={cn(
                  'block w-full text-left px-3 py-2 text-xs font-display font-semibold hover:bg-slate-100 transition-colors',
                  activeConsultor === c ? 'text-orange' : 'text-navy',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
