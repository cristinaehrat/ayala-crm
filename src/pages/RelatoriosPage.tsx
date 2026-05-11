import { useState } from 'react'
import { useListaEspera, useListaChamada } from '@/hooks/useRelatorios'
import { useMalhaEstrategica } from '@/hooks/useMalhaEstrategica'
import { MARCA_BADGES, formatDate, formatPhone } from '@/lib/utils'
import { Search, AlertCircle } from 'lucide-react'

type Tab = 'lista_espera' | 'lista_chamada' | 'mapa'

const TABS: { id: Tab; label: string }[] = [
  { id: 'lista_espera',  label: 'Lista de Espera' },
  { id: 'lista_chamada', label: 'Lista de Chamada' },
  { id: 'mapa',          label: 'Mapa Estratégico' },
]

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MES_ORDER = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

// ─── Tab 1: Lista de Espera ────────────────────────────────────────────────
function ListaEspera() {
  const { data: leads = [], isLoading } = useListaEspera()
  const [search, setSearch] = useState('')
  const [filtroMarca, setFiltroMarca] = useState('')

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      l.nome?.toLowerCase().includes(q) ||
      l.cidade?.toLowerCase().includes(q) ||
      l.uf?.toLowerCase().includes(q) ||
      l.empresa_oficina?.toLowerCase().includes(q)
    const matchMarca = !filtroMarca || l.marca_interesse === filtroMarca
    return matchSearch && matchMarca
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Buscar nome, cidade, oficina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>
        <select
          value={filtroMarca}
          onChange={(e) => setFiltroMarca(e.target.value)}
          className="input-field w-40 text-xs"
        >
          <option value="">Todas as marcas</option>
          <option value="volvo">Volvo</option>
          <option value="scania">Scania</option>
          <option value="daf">DAF</option>
        </select>
      </div>

      <p className="text-xs text-muted">{isLoading ? 'Carregando...' : `${filtered.length} leads em espera`}</p>

      <div className="section-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Nome', 'Telefone', 'Cidade / UF', 'Marca', 'Turma Interesse', 'Entrada'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-display font-semibold text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const badge = l.marca_interesse ? MARCA_BADGES[l.marca_interesse] : null
                return (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-display font-semibold text-white text-xs">{l.nome ?? '—'}</p>
                      <p className="text-muted text-xs">{l.empresa_oficina ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">{l.telefone ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-white">
                      {[l.cidade, l.uf].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {badge ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold text-white" style={{ backgroundColor: badge.bg }}>
                          {badge.label}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{l.turma_selecionada ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(l.data_entrada)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-white/5">
          {filtered.map((l) => {
            const badge = l.marca_interesse ? MARCA_BADGES[l.marca_interesse] : null
            return (
              <div key={l.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-white text-sm">{l.nome ?? '—'}</p>
                  {badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold text-white shrink-0" style={{ backgroundColor: badge.bg }}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">{l.empresa_oficina ?? ''}</p>
                <p className="text-xs text-muted">{[l.cidade, l.uf].filter(Boolean).join(' / ') || '—'} · {formatDate(l.data_entrada)}</p>
                {l.turma_selecionada && <p className="text-xs text-orange">{l.turma_selecionada}</p>}
              </div>
            )
          })}
          {filtered.length === 0 && !isLoading && (
            <p className="text-center py-8 text-muted text-sm">Nenhum lead em lista de espera</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Lista de Chamada (professor em sala) ───────────────────────────
function ListaChamada() {
  const { data: inscritos = [], isLoading } = useListaChamada()
  const [filtroTurma, setFiltroTurma] = useState('')
  const [somenteCobranca, setSomenteCobranca] = useState(false)

  const turmasUnicas = [...new Set(inscritos.map((i) => i.nome_treinamento_turma).filter(Boolean))] as string[]

  const filtered = inscritos.filter((i) => {
    const matchTurma = !filtroTurma || i.nome_treinamento_turma === filtroTurma
    const matchCobrar = !somenteCobranca || i.cobrar_em_aula === true
    return matchTurma && matchCobrar
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={filtroTurma}
          onChange={(e) => setFiltroTurma(e.target.value)}
          className="input-field flex-1 min-w-48 text-xs"
        >
          <option value="">Todas as turmas</option>
          {turmasUnicas.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={somenteCobranca}
            onChange={(e) => setSomenteCobranca(e.target.checked)}
            className="w-4 h-4 accent-orange cursor-pointer"
          />
          Apenas cobrar em aula
        </label>
      </div>

      <p className="text-xs text-muted">{isLoading ? 'Carregando...' : `${filtered.length} inscritos`}</p>

      <div className="section-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Nome', 'Telefone', 'Turma', 'Data', 'Status Fin.', 'Forma Pgto', 'Saldo', ''].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-display font-semibold text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const cobrar = i.cobrar_em_aula === true
                return (
                  <tr
                    key={i.id_inscricao}
                    className={`border-b border-white/5 transition-colors ${cobrar ? 'bg-red-950/30 hover:bg-red-950/50' : 'hover:bg-white/5'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {cobrar && <AlertCircle size={13} className="text-red-400 shrink-0" />}
                        <p className={`font-display font-semibold text-xs ${cobrar ? 'text-red-300' : 'text-white'}`}>
                          {i.nome ?? '—'}
                        </p>
                      </div>
                      <p className="text-muted text-xs">{i.empresa_oficina ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">
                      {i.telefone_lead ? formatPhone(i.telefone_lead) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-white">{i.nome_treinamento_turma ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(i.data_inicio_turma)}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`font-display font-bold ${
                        i.status_financeiro === 'pago' ? 'text-green-400' :
                        i.status_financeiro === 'inadimplente' ? 'text-red-400' : 'text-yellow-400'
                      }`}>{i.status_financeiro ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{i.forma_pagamento ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-display font-bold text-orange">
                      {(i.saldo_a_receber ?? 0) > 0 ? brl(i.saldo_a_receber!) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {cobrar && (
                        <span className="bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wide">
                          Cobrar
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-white/5">
          {filtered.map((i) => {
            const cobrar = i.cobrar_em_aula === true
            return (
              <div key={i.id_inscricao} className={`p-4 space-y-1 ${cobrar ? 'bg-red-950/30' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {cobrar && <AlertCircle size={13} className="text-red-400 shrink-0" />}
                    <p className={`font-display font-bold text-sm ${cobrar ? 'text-red-300' : 'text-white'}`}>
                      {i.nome ?? '—'}
                    </p>
                  </div>
                  {cobrar && (
                    <span className="bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase">
                      Cobrar
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-mono">{i.telefone_lead ? formatPhone(i.telefone_lead) : '—'}</p>
                <p className="text-xs text-muted">{i.nome_treinamento_turma ?? '—'} · {formatDate(i.data_inicio_turma)}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-display font-bold ${
                    i.status_financeiro === 'pago' ? 'text-green-400' :
                    i.status_financeiro === 'inadimplente' ? 'text-red-400' : 'text-yellow-400'
                  }`}>{i.status_financeiro ?? '—'}</span>
                  {(i.saldo_a_receber ?? 0) > 0 && (
                    <span className="text-orange font-bold">{brl(i.saldo_a_receber!)}</span>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && !isLoading && (
            <p className="text-center py-8 text-muted text-sm">Nenhum inscrito encontrado</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab 4: Mapa Estratégico ───────────────────────────────────────────────
function MapaEstrategico() {
  const { data: malha = [], isLoading } = useMalhaEstrategica()

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Agrupar por mês e ordenar
  const porMes = MES_ORDER.reduce<Record<string, typeof malha>>((acc, mes) => {
    const entries = malha.filter((m) => m.mes === mes)
    if (entries.length > 0) acc[mes] = entries
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">Cronograma de operações itinerantes 2026 — por marca e cidade-base.</p>

      {Object.entries(porMes).map(([mes, entries]) => (
        <div key={mes} className="section-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/3">
            <span className="font-display font-bold text-white text-sm uppercase tracking-wide">{mes}</span>
            <span className="text-xs text-muted">{entries.length} marca{entries.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
            {entries.map((entry) => {
              const badge = MARCA_BADGES[entry.marca]
              return (
                <div key={entry.id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold text-white"
                        style={{ backgroundColor: badge.bg }}
                      >
                        {badge.label}
                      </span>
                    )}
                    {entry.regiao_estrategica && (
                      <span className="text-xs text-muted">{entry.regiao_estrategica}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide font-display font-semibold">Cidade-base</p>
                    <p className="font-display font-bold text-white text-sm">{entry.cidade_base}</p>
                  </div>
                  {entry.cidades_visitacao && (
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide font-display font-semibold">Visitação</p>
                      <p className="text-xs text-white/80">{entry.cidades_visitacao}</p>
                    </div>
                  )}
                  {entry.objetivo && (
                    <p className="text-xs text-muted italic">{entry.objetivo}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(porMes).length === 0 && (
        <div className="text-center py-12 text-muted text-sm">Nenhum dado na malha estratégica</div>
      )}
    </div>
  )
}

// ─── Page principal ─────────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>('lista_espera')

  return (
    <div className="h-full md:ml-56 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-0 shrink-0">
        <h1 className="font-display font-bold text-white text-lg">Relatórios</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 shrink-0 border-b border-white/10 overflow-x-auto scrollbar-none print:hidden">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-display font-semibold transition-colors cursor-pointer border ${
              tab === id
                ? 'bg-orange border-orange text-white'
                : 'bg-transparent border-white/20 text-muted hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'lista_espera'  && <ListaEspera />}
        {tab === 'lista_chamada' && <ListaChamada />}
        {tab === 'mapa'          && <MapaEstrategico />}
      </div>
    </div>
  )
}
