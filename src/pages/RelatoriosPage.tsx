import { useEffect, useState } from 'react'
import { useListaEspera, useListaChamada } from '@/hooks/useRelatorios'
import { useMalhaEstrategica } from '@/hooks/useMalhaEstrategica'
import { useEmpresasCadastradas } from '@/hooks/useEmpresasCadastradas'
import { MARCA_BADGES, formatDate, formatPhone } from '@/lib/utils'
import { Search, AlertCircle, Printer, X } from 'lucide-react'
import type { InscritoComTelefone, Turma } from '@/lib/types'
import TurmaListaChamada from '@/components/turmas/TurmaListaChamada'

type Tab = 'lista_espera' | 'mapa' | 'lista_chamada' | 'empresas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'lista_espera',  label: 'Lista de Espera' },
  { id: 'mapa',         label: 'Mapa Estratégico' },
  { id: 'lista_chamada',label: 'Lista de Chamada' },
  { id: 'empresas',     label: 'Empresas Cadastradas' },
]

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MES_ORDER = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const FLUXO_LABEL: Record<string, string> = {
  link_whatsapp: 'Link WA', boleto_parceiro: 'Boleto',
  maquina_presencial: 'Máquina', pix_direto: 'PIX',
}
function formatFluxo(csv: string | null, fallback: string | null) {
  if (csv) {
    const labels = csv.split(',').filter(Boolean).map((v) => FLUXO_LABEL[v] ?? v)
    if (labels.length > 0) return labels.join(', ')
  }
  return fallback || '—'
}

// ─── PrintOverlay ──────────────────────────────────────────────────────────
function PrintOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { window.print() }, [])
  return (
    <div className="fixed inset-0 z-50 bg-white text-black overflow-y-auto">
      <div className="print:hidden flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 sticky top-0">
        <p className="font-semibold text-sm text-gray-700">{title}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Printer size={14} /> Imprimir / Salvar PDF
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="p-8 max-w-5xl mx-auto">
        {children}
      </div>
    </div>
  )
}

// ─── Tab 1: Lista de Espera ────────────────────────────────────────────────
function ListaEspera() {
  const { data: leads = [], isLoading } = useListaEspera()
  const [search, setSearch] = useState('')
  const [filtroMarca, setFiltroMarca] = useState('')
  const [printMode, setPrintMode] = useState(false)

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

  const hoje = new Date().toLocaleDateString('pt-BR')

  if (printMode) {
    return (
      <PrintOverlay title="Lista de Espera" onClose={() => setPrintMode(false)}>
        <div className="mb-6 border-b border-gray-300 pb-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Ayala Treinamentos</p>
          <h1 className="text-xl font-bold text-gray-900">Lista de Espera</h1>
          <p className="text-xs text-gray-400 mt-1">Emitido em {hoje} · {filtered.length} leads</p>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {['#', 'Nome', 'Empresa', 'Cidade / UF', 'Marca', 'Turma Interesse', 'Entrada'].map((h) => (
                <th key={h} className="text-left px-3 py-2 border border-gray-200 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, idx) => {
              const badge = l.marca_interesse ? MARCA_BADGES[l.marca_interesse] : null
              return (
                <tr key={l.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 border border-gray-200 text-gray-500">{idx + 1}</td>
                  <td className="px-3 py-2 border border-gray-200 font-semibold">{l.nome ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">{l.empresa_oficina ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-200">{[l.cidade, l.uf].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-3 py-2 border border-gray-200">
                    {badge ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: badge.bg }}>
                        {badge.label}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 border border-gray-200">{l.turma_selecionada ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-200">{formatDate(l.data_entrada)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </PrintOverlay>
    )
  }

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
        <button
          onClick={() => setPrintMode(true)}
          className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-2"
          title="Imprimir lista"
        >
          <Printer size={13} /> Imprimir
        </button>
      </div>

      <p className="text-xs text-muted">{isLoading ? 'Carregando...' : `${filtered.length} leads em espera`}</p>

      <div className="section-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
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
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-display font-semibold text-navy text-xs">{l.nome ?? '—'}</p>
                      <p className="text-muted text-xs">{l.empresa_oficina ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">{l.telefone ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-navy">
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

        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((l) => {
            const badge = l.marca_interesse ? MARCA_BADGES[l.marca_interesse] : null
            return (
              <div key={l.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-navy text-sm">{l.nome ?? '—'}</p>
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
  const [filtroTurmaId, setFiltroTurmaId] = useState('')
  const [somenteCobranca, setSomenteCobranca] = useState(false)
  const [printMode, setPrintMode] = useState(false)

  // Deduplicar turmas por id (UUID) — evita falhas por comparação de string
  const turmasOpts = [
    ...new Map(
      inscritos
        .filter((i) => i.id_turma && i.nome_treinamento_turma)
        .map((i) => [i.id_turma!, { id: i.id_turma!, nome: i.nome_treinamento_turma!, data: i.data_inicio_turma }])
    ).values(),
  ]

  const filtered = inscritos.filter((i) => {
    const matchTurma = !filtroTurmaId || i.id_turma === filtroTurmaId
    const matchCobrar = !somenteCobranca || i.cobrar_em_aula === true
    return matchTurma && matchCobrar
  })

  // Turma selecionada para impressão
  const turmaSelecionada = filtroTurmaId
    ? ({ id: filtroTurmaId, nome_treinamento: turmasOpts.find((t) => t.id === filtroTurmaId)?.nome ?? null } as Turma)
    : null

  // Buscar dados completos da turma para o print (data_inicio, cidade, etc.)
  const turmaParaPrint = filtroTurmaId
    ? (inscritos.find((i) => i.id_turma === filtroTurmaId) as InscritoComTelefone | undefined)
    : undefined

  const turmaObjPrint: Turma | null = turmaSelecionada
    ? {
        ...turmaSelecionada,
        data_inicio: turmaParaPrint?.data_inicio_turma ?? null,
        data_fim: null,
        cidade: turmaParaPrint?.cidade_turma ?? null,
        marca: turmaParaPrint?.marca_turma ?? null,
        vagas_total: null,
        vagas_disponiveis: null,
        status: null,
        despesas_operacionais_total: null,
        valor_recebido_isa_monteiro: null,
        valor_recebido_isa_mg: null,
      }
    : null

  if (printMode && turmaObjPrint) {
    return (
      <TurmaListaChamada
        turma={turmaObjPrint}
        inscritos={filtered}
        onClose={() => setPrintMode(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={filtroTurmaId}
          onChange={(e) => setFiltroTurmaId(e.target.value)}
          className="input-field flex-1 min-w-48 text-xs"
        >
          <option value="">Todas as turmas</option>
          {turmasOpts.map(({ id, nome, data }) => (
            <option key={id} value={id}>{nome}{data ? ` — ${formatDate(data)}` : ''}</option>
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
        <button
          onClick={() => {
            if (!filtroTurmaId) {
              alert('Selecione uma turma para imprimir a lista de chamada.')
              return
            }
            setPrintMode(true)
          }}
          className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-2"
          title="Imprimir lista de chamada"
        >
          <Printer size={13} /> Imprimir
        </button>
      </div>

      <p className="text-xs text-muted">{isLoading ? 'Carregando...' : `${filtered.length} inscritos`}</p>

      <div className="section-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
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
                    className={`border-b border-slate-100 transition-colors ${cobrar ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {cobrar && <AlertCircle size={13} className="text-red-400 shrink-0" />}
                        <p className={`font-display font-semibold text-xs ${cobrar ? 'text-red-600' : 'text-navy'}`}>
                          {i.nome ?? '—'}
                        </p>
                      </div>
                      <p className="text-muted text-xs">{i.empresa_oficina ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">
                      {i.telefone_lead ? formatPhone(i.telefone_lead) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-navy">{i.nome_treinamento_turma ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(i.data_inicio_turma)}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`font-display font-bold ${
                        i.status_financeiro === 'pago' ? 'text-green-600' :
                        i.status_financeiro === 'inadimplente' ? 'text-red-600' : 'text-yellow-600'
                      }`}>{i.status_financeiro ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatFluxo(i.fluxo_pagamento, i.forma_pagamento)}
                    </td>
                    <td className="px-4 py-3 text-xs font-display font-bold text-orange">
                      {(i.saldo_a_receber ?? 0) > 0 ? brl(i.saldo_a_receber!) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {cobrar && (
                        <span className="bg-red-100 text-red-600 border border-red-300 px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wide">
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

        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((i) => {
            const cobrar = i.cobrar_em_aula === true
            return (
              <div key={i.id_inscricao} className={`p-4 space-y-1 ${cobrar ? 'bg-red-50' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {cobrar && <AlertCircle size={13} className="text-red-400 shrink-0" />}
                    <p className={`font-display font-bold text-sm ${cobrar ? 'text-red-600' : 'text-navy'}`}>
                      {i.nome ?? '—'}
                    </p>
                  </div>
                  {cobrar && (
                    <span className="bg-red-100 text-red-600 border border-red-300 px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase">
                      Cobrar
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-mono">{i.telefone_lead ? formatPhone(i.telefone_lead) : '—'}</p>
                <p className="text-xs text-muted">{i.nome_treinamento_turma ?? '—'} · {formatDate(i.data_inicio_turma)}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-display font-bold ${
                    i.status_financeiro === 'pago' ? 'text-green-600' :
                    i.status_financeiro === 'inadimplente' ? 'text-red-600' : 'text-yellow-600'
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

// ─── Tab 3: Mapa Estratégico ───────────────────────────────────────────────
function MapaEstrategico() {
  const { data: malha = [], isLoading } = useMalhaEstrategica()
  const [printMode, setPrintMode] = useState(false)
  const hoje = new Date().toLocaleDateString('pt-BR')

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const porMes = MES_ORDER.reduce<Record<string, typeof malha>>((acc, mes) => {
    const entries = malha.filter((m) => m.mes === mes)
    if (entries.length > 0) acc[mes] = entries
    return acc
  }, {})

  if (printMode) {
    return (
      <PrintOverlay title="Mapa Estratégico" onClose={() => setPrintMode(false)}>
        <div className="mb-6 border-b border-gray-300 pb-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Ayala Treinamentos</p>
          <h1 className="text-xl font-bold text-gray-900">Mapa Estratégico 2026</h1>
          <p className="text-xs text-gray-400 mt-1">Emitido em {hoje}</p>
        </div>
        {Object.entries(porMes).map(([mes, entries]) => (
          <div key={mes} className="mb-6">
            <h2 className="text-sm font-bold text-gray-800 uppercase mb-2 border-b border-gray-200 pb-1">{mes}</h2>
            <div className="grid grid-cols-3 gap-4">
              {entries.map((entry) => {
                const badge = MARCA_BADGES[entry.marca]
                return (
                  <div key={entry.id} className="border border-gray-200 rounded p-3 text-xs">
                    {badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white mb-2" style={{ backgroundColor: badge.bg }}>
                        {badge.label}
                      </span>
                    )}
                    <p className="font-bold text-gray-900">{entry.cidade_base}</p>
                    {entry.regiao_estrategica && <p className="text-gray-500">{entry.regiao_estrategica}</p>}
                    {entry.cidades_visitacao && <p className="text-gray-600 mt-1">Visitação: {entry.cidades_visitacao}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </PrintOverlay>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Cronograma de operações itinerantes 2026 — por marca e cidade-base.</p>
        <button
          onClick={() => setPrintMode(true)}
          className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-2 shrink-0"
          title="Imprimir mapa"
        >
          <Printer size={13} /> Imprimir
        </button>
      </div>

      {Object.entries(porMes).map(([mes, entries]) => (
        <div key={mes} className="section-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
            <span className="font-display font-bold text-navy text-sm uppercase tracking-wide">{mes}</span>
            <span className="text-xs text-slate-600">{entries.length} marca{entries.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
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
                    <p className="text-xs text-slate-600 uppercase tracking-wide font-display font-semibold">Cidade-base</p>
                    <p className="font-display font-bold text-navy text-sm">{entry.cidade_base}</p>
                  </div>
                  {entry.cidades_visitacao && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase tracking-wide font-display font-semibold">Visitação</p>
                      <p className="text-xs text-slate-700">{entry.cidades_visitacao}</p>
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

// ─── Tab 4: Empresas Cadastradas ───────────────────────────────────────────
function EmpresasCadastradas() {
  const { data: empresas = [], isLoading } = useEmpresasCadastradas()
  const [search, setSearch] = useState('')
  const [printMode, setPrintMode] = useState(false)
  const hoje = new Date().toLocaleDateString('pt-BR')

  const filtered = empresas.filter((e) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      e.nome_fantasia?.toLowerCase().includes(q) ||
      e.razao_social?.toLowerCase().includes(q) ||
      e.cnpj?.includes(q) ||
      e.cidade?.toLowerCase().includes(q)
    )
  })

  if (printMode) {
    return (
      <PrintOverlay title="Empresas Cadastradas" onClose={() => setPrintMode(false)}>
        <div className="mb-6 border-b border-gray-300 pb-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Ayala Treinamentos</p>
          <h1 className="text-xl font-bold text-gray-900">Empresas / Oficinas Cadastradas</h1>
          <p className="text-xs text-gray-400 mt-1">Emitido em {hoje} · {filtered.length} empresa{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {['#', 'Razão Social / Fantasia', 'CNPJ', 'Cidade / Estado', 'E-mail', 'Responsável', 'WhatsApp'].map((h) => (
                <th key={h} className="text-left px-3 py-2 border border-gray-200 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, idx) => (
              <tr key={e.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 border border-gray-200 text-gray-500">{idx + 1}</td>
                <td className="px-3 py-2 border border-gray-200">
                  <p className="font-semibold">{e.razao_social ?? e.nome_fantasia ?? '—'}</p>
                  {e.nome_fantasia && e.razao_social && <p className="text-gray-500">{e.nome_fantasia}</p>}
                </td>
                <td className="px-3 py-2 border border-gray-200 font-mono">{e.cnpj ?? '—'}</td>
                <td className="px-3 py-2 border border-gray-200">{[e.cidade, e.estado].filter(Boolean).join(' / ') || '—'}</td>
                <td className="px-3 py-2 border border-gray-200">{e.email ?? '—'}</td>
                <td className="px-3 py-2 border border-gray-200">{e.nome_responsavel ?? '—'}</td>
                <td className="px-3 py-2 border border-gray-200 font-mono">{e.whatsapp_responsavel ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintOverlay>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Buscar por nome, CNPJ ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>
        <button
          onClick={() => setPrintMode(true)}
          className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-2"
          title="Imprimir lista de empresas"
        >
          <Printer size={13} /> Imprimir
        </button>
      </div>

      <p className="text-xs text-muted">
        {isLoading ? 'Carregando...' : `${filtered.length} empresa${filtered.length !== 1 ? 's' : ''} cadastrada${filtered.length !== 1 ? 's' : ''}`}
      </p>

      <div className="section-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {['Razão Social / Fantasia', 'CNPJ', 'Cidade / Estado', 'Responsável', 'WhatsApp'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-display font-semibold text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-display font-semibold text-navy text-xs">{e.razao_social ?? e.nome_fantasia ?? '—'}</p>
                    {e.nome_fantasia && e.razao_social && <p className="text-muted text-xs">{e.nome_fantasia}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted font-mono">{e.cnpj ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-navy">{[e.cidade, e.estado].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-4 py-3 text-xs text-navy">{e.nome_responsavel ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted font-mono">{e.whatsapp_responsavel ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((e) => (
            <div key={e.id} className="p-4 space-y-1">
              <p className="font-display font-bold text-navy text-sm">{e.razao_social ?? e.nome_fantasia ?? '—'}</p>
              {e.nome_fantasia && e.razao_social && <p className="text-xs text-muted">{e.nome_fantasia}</p>}
              <p className="text-xs text-muted font-mono">{e.cnpj ?? '—'}</p>
              <p className="text-xs text-muted">{[e.cidade, e.estado].filter(Boolean).join(' / ') || '—'}</p>
              {e.nome_responsavel && <p className="text-xs text-navy">{e.nome_responsavel}</p>}
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <p className="text-center py-8 text-muted text-sm">Nenhuma empresa cadastrada</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page principal ─────────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>('lista_espera')

  return (
    <div className="h-full md:ml-56 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-0 shrink-0">
        <h1 className="font-display font-bold text-navy text-lg">Relatórios</h1>
      </div>

      <div className="flex gap-2 px-4 py-3 shrink-0 border-b border-slate-200 overflow-x-auto scrollbar-none print:hidden">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-display font-semibold transition-colors cursor-pointer border ${
              tab === id
                ? 'bg-orange border-orange text-white'
                : 'bg-transparent border-slate-300 text-muted hover:text-navy'
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
        {tab === 'empresas'      && <EmpresasCadastradas />}
      </div>
    </div>
  )
}
