import { useEffect, useState } from 'react'
import { Search, Phone, ChevronDown, MapPin, Wrench, Users, Building2, ClipboardList, CalendarDays, MessageCircle, Info, Edit2, UserPlus, User, Plus, Trash2, AtSign, Globe, ExternalLink, PhoneCall, BellRing, Check, X, Download, Sparkles, ChevronUp } from 'lucide-react'

function lembreteStatus(data_retorno?: string | null) {
  if (!data_retorno) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(data_retorno + 'T12:00:00')
  if (d < today) return 'vencido'
  if ((d.getTime() - today.getTime()) / 86400000 <= 3) return 'urgente'
  return 'futuro'
}
function fmtLembrete(data_retorno: string) {
  const [, m, d] = data_retorno.split('-')
  return `${d}/${m}`
}
import { useProspectos, useProspectosByDataVisita, useProspectosAgendaCount, useUpdateProspecto, useCreateLeadFromProspecto, useProspectoLeadCounts, getProspectoLeadCount, useDistinctCidades, useDistinctUFsProspectos, useExtrairProspectos, type ExtracaoResult, type ProspectoFilter, type Prospecto } from '@/hooks/useProspectos'
import { useLeadsByProspecto } from '@/hooks/useLeads'
import { cn, MARCA_BADGES, UF_OPTIONS, PORTE_OFICINA_OPTIONS, PERFIL_OPTIONS, CONSULTORES } from '@/lib/utils'
import { useHistoricoContatos, useCreateHistoricoContato, RESULTADO_LABEL, INTERESSE_LABEL, TIPO_CONTATO_LABEL } from '@/hooks/useHistoricoContatos'

function toWaLink(phone: string): string {
  const d = phone.replace(/\D/g, '')
  return `https://wa.me/${d.startsWith('55') ? d : '55' + d}`
}
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'

const FILTERS: { id: ProspectoFilter; label: string }[] = [
  { id: 'hoje',        label: 'Hoje' },
  { id: 'todos',       label: 'Todos' },
  { id: 'a_contatar',  label: 'A Contatar' },
  { id: 'em_followup', label: 'Em Follow-up' },
  { id: 'sem_leads',   label: 'Sem Leads' },
  { id: 'com_leads',   label: 'Com Leads' },
]

const STATUS_LABEL: Record<string, string> = {
  a_contatar:    'A contatar',
  tentativa_1:   '1ª tentativa',
  tentativa_2:   '2ª tentativa',
  tentativa_3:   '3ª tentativa',
  sem_resposta:  'Sem resposta',
  retornou:      'Retornou',
  desqualificado:'Desqualificado',
}

const POTENCIAL_COLOR: Record<string, string> = {
  alto:          'text-red-400',
  medio:         'text-orange',
  baixo:         'text-muted',
  sem_interesse: 'text-slate-500',
}

const PARCEIRO_LABEL: Record<string, string> = {
  treinatec:   'Treinatec Brasil',
  monteiro:    'Monteiro Eletro Diesel',
  mg_solucoes: 'MG Soluções',
}

const pillBase = 'px-2.5 py-1 rounded-full text-xs font-display font-semibold tracking-wide transition-colors cursor-pointer border flex items-center gap-1'
const pillActive = 'bg-orange text-white border-orange'
const pillInactive = 'bg-transparent text-muted border-slate-300 hover:border-orange/50 hover:text-navy'

const POTENCIAL_FILTERS = [
  { value: 'alto',  label: '🔥 Alto' },
  { value: 'medio', label: 'Médio' },
  { value: 'baixo', label: '❄ Baixo' },
]

const STATUS_LEGEND = [
  { accent: 'bg-white/25',    label: 'A contatar' },
  { accent: 'bg-green-400',   label: 'Visitado' },
  { accent: 'bg-orange',      label: 'Retornou' },
  { accent: 'bg-amber-400',   label: 'Em tentativa' },
  { accent: 'bg-sky-400',     label: 'Tem leads' },
  { accent: 'bg-slate-600',   label: 'Sem interesse' },
]

const STATUS_ACCENT: Record<string, string> = {
  retornou:    'bg-orange',
  tentativa_1: 'bg-amber-400',
  tentativa_2: 'bg-amber-400',
  tentativa_3: 'bg-amber-400',
  sem_resposta:'bg-amber-400',
  desqualificado: 'bg-slate-600',
}

const STATUS_PILL_COLOR: Record<string, string> = {
  retornou:    'text-orange border-orange/30',
  tentativa_1: 'text-amber-400 border-amber-400/30',
  tentativa_2: 'text-amber-400 border-amber-400/30',
  tentativa_3: 'text-amber-400 border-amber-400/30',
  sem_resposta:'text-amber-400 border-amber-400/30',
  desqualificado: 'text-slate-500 border-slate-600/30',
  a_contatar:  'text-slate-300 border-white/10',
}

const TIPO_OFICINA_OPTIONS = [
  { value: 'mecanica_movel',  label: 'Mecânica Móvel' },
  { value: 'mecatronica',     label: 'Mecatrônica' },
  { value: 'transportadora',  label: 'Transportadora' },
  { value: 'eletrica_diesel', label: 'Elétrica Diesel' },
  { value: 'mecanica_diesel', label: 'Mecânica Diesel' },
  { value: 'diesel_sos',      label: 'Diesel SOS' },
  { value: 'eletro_mecanica', label: 'Eletro-Mecânica' },
  { value: 'outros',          label: 'Outros' },
  { value: 'fora_publico',    label: 'Fora do público-alvo' },
]

const PARCEIRO_OPTIONS = [
  { value: 'treinatec', label: 'Treinatec Brasil' },
  { value: 'monteiro', label: 'Monteiro Eletro Diesel' },
  { value: 'mg_solucoes', label: 'MG Soluções' },
] as const

const MARCAS = ['Volvo', 'DAF', 'Scania'] as const

export default function ProspectosPage() {
  const [filter, setFilter] = useState<ProspectoFilter>('todos')
  const [dataVisita, setDataVisita] = useState<string>('')
  const [ufFilter, setUfFilter] = useState<string>('')
  const [cidadeFilter, setCidadeFilter] = useState<string>('')
  const [potencialFilter, setPotencialFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [ufOpen, setUfOpen] = useState(false)
  const [cidadeOpen, setCidadeOpen] = useState(false)
  const [buscandoInsta, setBuscandoInsta] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Prospecto | null>(null)
  const [contatoProspecto, setContatoProspecto] = useState<Prospecto | null>(null)
  const [extCidade, setExtCidade] = useState('')
  const [extUf, setExtUf] = useState('')
  const [extResultado, setExtResultado] = useState<ExtracaoResult | null>(null)
  const [extAberto, setExtAberto] = useState(false)
  const extrairProspectos = useExtrairProspectos()

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ayala_prospectos_extracao')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.cidade) setExtCidade(parsed.cidade)
        if (parsed.uf) setExtUf(parsed.uf)
        if (parsed.resultado) { setExtResultado(parsed.resultado); setExtAberto(true) }
      }
    } catch { /* ignora */ }
  }, [])

  async function handleExtrair() {
    if (!extCidade.trim() || !extUf) {
      toast.error('Informe cidade e UF antes de extrair.')
      return
    }
    try {
      const result = await extrairProspectos.mutateAsync({ cidade: extCidade.trim(), uf: extUf })
      setExtResultado(result)
      setExtAberto(true)
      try { localStorage.setItem('ayala_prospectos_extracao', JSON.stringify({ cidade: extCidade.trim(), uf: extUf, resultado: result })) } catch { /* ignora */ }
      setCidadeFilter(extCidade.trim())
      toast.success(`${result.criados} nova${result.criados !== 1 ? 's' : ''} oficina${result.criados !== 1 ? 's' : ''} · ${result.atualizados} atualizada${result.atualizados !== 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao extrair prospectos')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const { data: prospectos = [], isLoading, isError, error } = useProspectos(dataVisita ? 'todos' : filter, dataVisita ? undefined : (ufFilter || undefined), dataVisita ? undefined : (cidadeFilter || undefined))
  const { data: visitasData = [], isLoading: loadingVisitas } = useProspectosByDataVisita(dataVisita || null)
  const { data: leadCounts = {} } = useProspectoLeadCounts()
  const { data: ufs = [] } = useDistinctUFsProspectos()
  const { data: cidades = [] } = useDistinctCidades()
  const { data: agendaCount = 0 } = useProspectosAgendaCount()
  const updateProspecto = useUpdateProspecto()
  const createLead = useCreateLeadFromProspecto()
  const createHistorico = useCreateHistoricoContato()

  const baseList = dataVisita ? visitasData : prospectos
  const filtered = baseList.filter((p) => {
    if (potencialFilter && p.potencial !== potencialFilter) return false
    const leadCount = getProspectoLeadCount(p, leadCounts)
    if (!dataVisita && filter === 'sem_leads' && leadCount > 0) return false
    if (!dataVisita && filter === 'com_leads' && leadCount === 0) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.empresa_oficina?.toLowerCase().includes(q) ||
        p.nome_responsavel_treinamento?.toLowerCase().includes(q) ||
        p.nome_contato_inicial?.toLowerCase().includes(q) ||
        p.whatsapp_responsavel?.includes(q) ||
        p.telefone_oficina?.includes(q) ||
        p.cidade?.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function handleConcluirLembrete(p: Prospecto, e?: React.MouseEvent) {
    e?.stopPropagation()
    await updateProspecto.mutateAsync({ id_visita: p.id_visita, data: { data_retorno: null } })
    await createHistorico.mutateAsync({
      id_prospecto:      p.id_visita,
      consultor:         null,
      tipo_contato:      'retorno',
      resultado:         'concluido',
      interesse:         null,
      telefone_capturado: null,
      proximo_passo:     p.proximo_passo ?? null,
      data_retorno:      null,
      observacoes:       null,
    })
    toast.success('Lembrete concluído')
  }

  async function handleCreateLead(p: Prospecto, e: React.MouseEvent) {
    e.stopPropagation()
    if (!p.whatsapp_responsavel) {
      toast.error('Oficina sem WhatsApp do responsável — não é possível criar o lead.')
      return
    }
    try {
      await createLead.mutateAsync(p)
      toast.success('Lead vinculado ao CRM criado com sucesso!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar lead')
    }
  }

  async function handleBuscarInstagram() {
    if (!cidadeFilter) return
    setBuscandoInsta(true)
    try {
      const resp = await fetch('https://n8n.ayalaoficial.com.br/webhook/instagram-oficinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cidade: cidadeFilter,
          uf: ufFilter || undefined,
          hashtags: ['oficinacaminhao', 'mecanicadiesel', 'eletricadiesel', 'truckcenter', 'dieselpesado'],
        }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      if (data.status === 'iniciado') {
        toast.success('Busca iniciada! Novas oficinas aparecerão em ~10 minutos.')
      } else {
        const criados: number = data.criados ?? 0
        const duplicatas: number = data.duplicatas ?? 0
        if (criados > 0) {
          toast.success(`${criados} nova${criados !== 1 ? 's' : ''} oficina${criados !== 1 ? 's' : ''} adicionada${criados !== 1 ? 's' : ''}!${duplicatas > 0 ? ` (${duplicatas} duplicata${duplicatas !== 1 ? 's' : ''} ignorada${duplicatas !== 1 ? 's' : ''})` : ''}`)
        } else {
          toast('Nenhuma oficina nova encontrada no Instagram para esta cidade.')
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao buscar no Instagram')
    } finally {
      setBuscandoInsta(false)
    }
  }

  const selected = detailId ? prospectos.find((p) => p.id_visita === detailId) ?? null : null

  return (
    <div className="flex flex-col h-full md:ml-56">
      {/* Painel de Extração */}
      <div className="px-3 pt-3 shrink-0">
        <div className="rounded-xl border border-orange/30 bg-orange/5 overflow-hidden">
          <button
            onClick={() => setExtAberto(o => !o)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-orange shrink-0" />
              <span className="text-xs font-display font-bold text-orange">Extrair prospectos do Google Maps</span>
              {extResultado && (
                <span className="text-[10px] font-display font-semibold text-orange/70 bg-orange/10 rounded-full px-2 py-0.5">
                  {extResultado.criados + extResultado.atualizados} oficinas · {extResultado.cidade}/{extResultado.uf}
                </span>
              )}
            </div>
            {extAberto ? <ChevronUp size={13} className="text-orange/60 shrink-0" /> : <ChevronDown size={13} className="text-orange/60 shrink-0" />}
          </button>
          {extAberto && (
            <div className="px-3 pb-3 border-t border-orange/20 pt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cidade"
                  value={extCidade}
                  onChange={e => {
                    setExtCidade(e.target.value)
                    try { localStorage.setItem('ayala_prospectos_extracao', JSON.stringify({ cidade: e.target.value, uf: extUf, resultado: extResultado })) } catch { /* ignora */ }
                  }}
                  className="input-field flex-1 text-xs"
                />
                <select
                  value={extUf}
                  onChange={e => {
                    setExtUf(e.target.value)
                    try { localStorage.setItem('ayala_prospectos_extracao', JSON.stringify({ cidade: extCidade, uf: e.target.value, resultado: extResultado })) } catch { /* ignora */ }
                  }}
                  className="input-field w-20 text-xs"
                >
                  <option value="">UF</option>
                  {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <button
                  onClick={handleExtrair}
                  disabled={extrairProspectos.isPending || !extCidade.trim() || !extUf}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  {extrairProspectos.isPending
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Download size={13} />}
                  {extrairProspectos.isPending ? 'Extraindo...' : 'Extrair'}
                </button>
              </div>
              {extResultado && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-display font-semibold text-orange/70 uppercase tracking-wide">
                    Última extração — {extResultado.cidade}/{extResultado.uf} · {extResultado.criados} novas · {extResultado.atualizados} atualizadas · {extResultado.total_analisado} analisadas
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {extResultado.prospectos.map((p, i) => (
                      <div key={p.id_visita ?? i} className={cn('flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs', p._novo ? 'bg-orange/10 border border-orange/20' : 'bg-white/5 border border-white/5')}>
                        {p._novo && <span className="text-[9px] font-display font-bold text-orange uppercase tracking-wide shrink-0">Novo</span>}
                        <span className={cn('font-semibold truncate', p._novo ? 'text-white' : 'text-muted')}>{p.empresa_oficina || '—'}</span>
                        {p.telefone_oficina && <span className="text-muted shrink-0 font-mono text-[10px]">{p.telefone_oficina}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filtro de visitas por data */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-0 shrink-0 flex-wrap">
        <CalendarDays size={13} className="text-muted shrink-0" />
        <span className="text-xs text-muted font-display shrink-0">Visitas do dia:</span>
        <button
          onClick={() => setDataVisita(dataVisita === today ? '' : today)}
          className={cn(pillBase, dataVisita === today ? pillActive : pillInactive)}
        >
          Hoje
          {dataVisita === today && (
            <span className="rounded-full text-[10px] font-bold px-1.5 min-w-[1.25rem] text-center leading-5 bg-white/20 text-white">
              {loadingVisitas ? '…' : visitasData.length}
            </span>
          )}
        </button>
        <input
          type="date"
          value={dataVisita}
          onChange={(e) => setDataVisita(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-navy h-7 cursor-pointer"
        />
        {dataVisita && (
          <button onClick={() => setDataVisita('')} className="text-[11px] text-muted hover:text-navy flex items-center gap-0.5">
            <X size={11} />limpar
          </button>
        )}
        {dataVisita && !loadingVisitas && (
          <span className="text-xs font-display font-semibold text-orange">
            {visitasData.length} visita{visitasData.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1 flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Buscar oficina, contato, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-2 shrink-0">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              pillBase,
              filter === id ? pillActive : pillInactive,
              id === 'hoje' && agendaCount > 0 && filter !== 'hoje' ? 'border-orange/60 text-orange' : '',
            )}
          >
            {id === 'hoje' && <BellRing size={11} />}
            {label}
            {id === 'hoje' && agendaCount > 0 && (
              <span className={cn('rounded-full text-[10px] font-bold px-1.5 min-w-[1.25rem] text-center leading-5', filter === 'hoje' ? 'bg-white/20 text-white' : 'bg-red-500 text-white')}>
                {agendaCount}
              </span>
            )}
          </button>
        ))}
        {/* Potencial pills */}
        {POTENCIAL_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPotencialFilter(potencialFilter === value ? '' : value)}
            className={cn(pillBase, potencialFilter === value ? pillActive : pillInactive)}
          >
            {label}
          </button>
        ))}

        {/* UF dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setUfOpen((o) => !o)}
            className={cn(pillBase, ufFilter ? pillActive : pillInactive)}
          >
            {ufFilter || 'UF'}
            <ChevronDown size={12} />
          </button>
          {ufOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md z-50 max-h-48 overflow-y-auto min-w-[80px]">
              <button
                onClick={() => { setUfFilter(''); setUfOpen(false) }}
                className="block w-full text-left px-3 py-2 text-xs font-display font-semibold text-muted hover:bg-slate-100"
              >
                Todos
              </button>
              {ufs.map((uf) => (
                <button
                  key={uf}
                  onClick={() => { setUfFilter(uf); setUfOpen(false) }}
                  className={cn(
                    'block w-full text-left px-3 py-2 text-xs font-display font-semibold hover:bg-slate-100',
                    ufFilter === uf ? 'text-orange' : 'text-navy',
                  )}
                >
                  {uf}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cidade dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setCidadeOpen((o) => !o)}
            className={cn(pillBase, cidadeFilter ? pillActive : pillInactive)}
          >
            {cidadeFilter || 'Cidade'}
            <ChevronDown size={12} />
          </button>
          {cidadeOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md z-50 max-h-48 overflow-y-auto min-w-[120px]">
              <button
                onClick={() => { setCidadeFilter(''); setCidadeOpen(false) }}
                className="block w-full text-left px-3 py-2 text-xs font-display font-semibold text-muted hover:bg-slate-100"
              >
                Todas
              </button>
              {cidades.map((cidade) => (
                <button
                  key={cidade}
                  onClick={() => { setCidadeFilter(cidade); setCidadeOpen(false) }}
                  className={cn(
                    'block w-full text-left px-3 py-2 text-xs font-display font-semibold hover:bg-slate-100',
                    cidadeFilter === cidade ? 'text-orange' : 'text-navy',
                  )}
                >
                  {cidade}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botão Instagram — só quando cidade selecionada */}
        {cidadeFilter && (
          <button
            onClick={handleBuscarInstagram}
            disabled={buscandoInsta}
            className={cn(pillBase, 'border-pink-300 text-pink-600 hover:border-pink-400 hover:text-pink-700 disabled:opacity-60')}
          >
            {buscandoInsta ? (
              <div className="w-3 h-3 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <AtSign size={12} />
            )}
            {buscandoInsta ? 'Buscando...' : 'Instagram'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-x-3 gap-y-1 px-4 py-1.5 shrink-0 flex-wrap">
        <span className="text-[10px] text-slate-500 font-display uppercase tracking-wider shrink-0">Legenda</span>
        {STATUS_LEGEND.map(({ accent, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn('w-1 h-3.5 rounded-full shrink-0', accent)} />
            <span className="text-[10px] text-slate-400 whitespace-nowrap">{label}</span>
          </div>
        ))}
        <span className="ml-auto text-[11px] text-muted">
          {isLoading ? '…' : `${filtered.length} prospectos`}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isError && (
          <div className="text-center py-12 space-y-3">
            <p className="text-red-400 text-sm font-display font-semibold">Erro ao carregar prospectos</p>
            <p className="text-muted text-xs font-mono">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
            <button onClick={() => window.location.reload()} className="btn-secondary text-xs px-4 py-2 mx-auto flex items-center gap-1.5">
              Tentar novamente
            </button>
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">Nenhum prospecto encontrado</div>
        )}
        {!isLoading && filtered.map((p) => (
          <ProspectoCard
            key={p.id_visita}
            prospecto={p}
            onClick={() => setExpandedId(p.id_visita === expandedId ? null : p.id_visita)}
            onOpenDetail={() => setDetailId(p.id_visita)}
            onEdit={() => setEditing(p)}
            onRegistrarContato={(e) => { e.stopPropagation(); setContatoProspecto(p) }}
            onConcluirLembrete={(e) => handleConcluirLembrete(p, e)}
            expanded={p.id_visita === expandedId}
            leadCount={getProspectoLeadCount(p, leadCounts)}
            onCreateLead={(e) => handleCreateLead(p, e)}
            creatingLead={createLead.isPending}
          />
        ))}
      </div>

      {/* Detail drawer (mobile bottom sheet style) */}
      {selected && (
        <ProspectoDetail prospecto={selected} onClose={() => setDetailId(null)} onRegistrarContato={() => { setDetailId(null); setContatoProspecto(selected) }} onConcluirLembrete={() => handleConcluirLembrete(selected)} />
      )}

      <RegistrarContatoModal
        prospecto={contatoProspecto}
        onClose={() => setContatoProspecto(null)}
        onSave={async (payload, novoStatus) => {
          await createHistorico.mutateAsync(payload)
          if (novoStatus) {
            await updateProspecto.mutateAsync({ id_visita: payload.id_prospecto, data: { status_contato: novoStatus } })
          }
          if (payload.telefone_capturado) {
            await updateProspecto.mutateAsync({ id_visita: payload.id_prospecto, data: { whatsapp_responsavel: payload.telefone_capturado } })
          }
          toast.success('Contato registrado!')
          setContatoProspecto(null)
        }}
        saving={createHistorico.isPending}
      />

      <ProspectoEditModal
        prospecto={editing}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (!editing) return
          await updateProspecto.mutateAsync({ id_visita: editing.id_visita, data })
          toast.success('Ficha da oficina atualizada')
          setEditing(null)
        }}
        saving={updateProspecto.isPending}
      />
    </div>
  )
}

function ProspectoCard({
  prospecto: p,
  onClick,
  onOpenDetail,
  onEdit,
  onRegistrarContato,
  onConcluirLembrete,
  expanded,
  onCreateLead,
  leadCount,
  creatingLead,
}: {
  prospecto: Prospecto
  onClick: () => void
  onOpenDetail: () => void
  onEdit: () => void
  onRegistrarContato: (e: React.MouseEvent) => void
  onConcluirLembrete: (e: React.MouseEvent) => void
  expanded: boolean
  onCreateLead: (e: React.MouseEvent) => void
  leadCount: number
  creatingLead: boolean
}) {
  const marcas = p.marca_interesse ? p.marca_interesse.split(',').map((m) => m.trim()).filter(Boolean) : []
  const statusLabel = p.status_contato ? STATUS_LABEL[p.status_contato] ?? p.status_contato : 'A contatar'
  const nome = p.nome_responsavel_treinamento || p.nome_contato_inicial || '—'
  const hasLeads = leadCount > 0
  const ligarTel = p.whatsapp_responsavel || p.telefone_oficina
  const isDesqualificado = p.status_contato === 'desqualificado' || p.potencial === 'sem_interesse'

  const isVisitado = !!p.data_visita
  const accentColor = hasLeads
    ? 'bg-sky-400'
    : (p.status_contato ? STATUS_ACCENT[p.status_contato] : null)
    ?? (isDesqualificado ? 'bg-slate-600' : isVisitado ? 'bg-green-400' : 'bg-white/25')

  const statusPillColor = hasLeads
    ? 'text-sky-400 border-sky-400/30'
    : STATUS_PILL_COLOR[p.status_contato ?? ''] ?? 'text-slate-300 border-white/10'

  const bgTint = hasLeads
    ? 'bg-sky-400/5'
    : p.status_contato === 'retornou'
    ? 'bg-orange/5'
    : ''

  return (
    <div
      className={cn(
        'relative rounded-xl border border-white/10 cursor-pointer transition-colors overflow-hidden',
        bgTint || 'bg-navy2',
        isDesqualificado ? 'opacity-60' : 'hover:border-white/20',
      )}
      onClick={onClick}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1 shrink-0', accentColor)} />
      <div className="p-3 pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-display font-bold text-sm truncate text-white">{p.empresa_oficina || '—'}</p>
              {p.instagram_handle && <AtSign size={11} className="text-pink-400 shrink-0" />}
            </div>
            <p className="text-xs mt-0.5 truncate text-muted">{nome} · {p.cidade}{p.uf ? `/${p.uf}` : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {hasLeads && (
              <span className="text-xs font-display font-bold rounded-full px-2 py-0.5 border text-sky-400 border-sky-400/30">
                {leadCount} {leadCount === 1 ? 'lead' : 'leads'}
              </span>
            )}
            {p.potencial && p.potencial !== 'sem_interesse' && (
              <span className={cn('text-xs font-display font-semibold', POTENCIAL_COLOR[p.potencial] ?? 'text-muted')}>
                {p.potencial === 'alto' ? '▲' : '~'} {p.potencial}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 mt-2 flex-wrap">
          {marcas.map((m) => {
            const badge = MARCA_BADGES[m]
            return badge ? (
              <span key={m} className="px-1.5 py-0.5 rounded text-xs font-display font-bold text-white" style={{ backgroundColor: badge.bg }}>{badge.label}</span>
            ) : null
          })}
          <span className={cn('px-1.5 py-0.5 rounded text-xs font-display font-semibold border', statusPillColor)}>
            {statusLabel}
          </span>
          {p.data_visita && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-display font-semibold text-green-400 border border-green-400/20 bg-green-400/5">
              <CalendarDays size={9} className="shrink-0" />
              {new Date(p.data_visita + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
          {p.data_retorno && (() => {
            const st = lembreteStatus(p.data_retorno)
            const cls = st === 'vencido' ? 'text-red-400 border-red-400/40' : st === 'urgente' ? 'text-orange border-orange/40' : 'text-slate-400 border-white/10'
            return <span className={cn('flex items-center gap-0.5 text-[10px] border rounded px-1 py-0.5 font-display font-bold', cls)}><BellRing size={9}/>{fmtLembrete(p.data_retorno)}</span>
          })()}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 flex gap-2 flex-wrap border-t border-white/10">
            {p.data_retorno && (
              <button
                onClick={onConcluirLembrete}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-green-400 border-green-400/30 hover:border-green-400/60"
              >
                <Check size={13} />
                Feito
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Edit2 size={13} />
              Editar oficina
            </button>
            <button
              onClick={onCreateLead}
              disabled={creatingLead}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <UserPlus size={13} />
              {hasLeads ? 'Adicionar contato' : 'Criar lead vinculado'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetail()
              }}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Info size={13} />
              Ver detalhes
            </button>
            {ligarTel && (
              <a
                href={`tel:${ligarTel.replace(/\D/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Phone size={13} />
                Ligar
              </a>
            )}
            <button
              onClick={onRegistrarContato}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-orange border-orange/40 hover:border-orange"
            >
              <PhoneCall size={13} />
              Registrar Contato
            </button>
            {p.whatsapp_responsavel && (
              <a
                href={toWaLink(p.whatsapp_responsavel)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <MessageCircle size={13} />
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const STATUS_LEAD_LABEL: Record<string, string> = {
  novo:         'Novo',
  em_contato:   'Em Contato',
  oportunidade: 'Oportunidade',
  cliente:      'Cliente',
  inativo:      'Inativo',
}

function ProspectoDetail({ prospecto: p, onClose, onRegistrarContato, onConcluirLembrete }: { prospecto: Prospecto; onClose: () => void; onRegistrarContato: () => void; onConcluirLembrete: () => void }) {
  const { data: leadsVinculados = [] } = useLeadsByProspecto(p.id_visita)
  const { data: historico = [] } = useHistoricoContatos(p.id_visita)

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-end md:items-center md:justify-center" onClick={onClose}>
      <div
        className="bg-navy w-full md:max-w-lg md:rounded-2xl md:border md:border-white/10 max-h-[80vh] overflow-y-auto rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
          <h3 className="font-display font-bold text-white truncate">{p.empresa_oficina || 'Prospecto'}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRegistrarContato}
              className="flex items-center gap-1.5 text-xs font-display font-bold text-orange border border-orange/40 rounded-lg px-3 py-1.5 hover:border-orange transition-colors"
            >
              <PhoneCall size={13} />
              Registrar Contato
            </button>
            <button onClick={onClose} className="text-muted hover:text-white">✕</button>
          </div>
        </div>
        <div className="p-4 space-y-2.5 text-sm">
          <Row icon={<Building2 size={14} />} label="Oficina" value={p.empresa_oficina} />
          <Row icon={<MapPin size={14} />} label="Endereço" value={p.endereco} />
          <Row icon={<Users size={14} />} label="Responsável" value={p.nome_responsavel_treinamento ?? p.nome_contato_inicial} />
          <Row icon={<Wrench size={14} />} label="Tipo" value={p.tipo_oficina} />
          <Row icon={<Users size={14} />} label="Porte" value={p.porte_oficina} />
          <Row icon={<MapPin size={14} />} label="Cidade" value={p.cidade && p.uf ? `${p.cidade}/${p.uf}` : p.cidade} />
          <Row label="Multimarcas" value={p.multimarcas ? 'Sim' : null} />
          <Row label="Especialização" value={p.especializacao_oficina} />
          <Row label="Marcas de interesse" value={p.marca_interesse} />
          <Row label="Perfil" value={p.perfil === 'grupo_b2b' ? `Grupo B2B${p.qtd_interessados ? ` (${p.qtd_interessados} pessoas)` : ''}` : p.perfil} />
          <Row label="Potencial" value={p.potencial} />
          <Row icon={<CalendarDays size={14} />} label="Data da visita" value={p.data_visita} />
          <Row label="Parceiro" value={p.empresa_parceira ? (PARCEIRO_LABEL[p.empresa_parceira] ?? p.empresa_parceira) : null} />
          <Row label="Consultor" value={p.consultor} />

          {(p.telefone_oficina || p.whatsapp_responsavel || p.telefone_financeiro || p.telefone_participante) && (
            <div>
              <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide mb-1.5">Telefones</p>
              <div className="space-y-1.5">
                <TelRow label="Geral / Maps" value={p.telefone_oficina} />
                <TelRow label="Resp. treinamento" value={p.whatsapp_responsavel} isWhatsApp />
                <TelRow label="Financeiro / RH" value={p.telefone_financeiro} />
                <TelRow label="Técnico participante" value={p.telefone_participante} />
              </div>
            </div>
          )}

          {p.participantes && p.participantes.length > 0 && (
            <div>
              <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide mb-1.5">Participantes</p>
              <div className="space-y-1.5">
                {p.participantes.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <User size={12} className="text-muted shrink-0" />
                    <span className="text-white text-xs">{pt.nome}</span>
                    {pt.telefone && (
                      <a href={toWaLink(pt.telefone)} target="_blank" rel="noreferrer" className="text-green-400 text-xs hover:underline ml-1">
                        {pt.telefone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(p.instagram_handle || p.facebook_url || p.website_url) && (
            <div>
              <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide mb-1.5">Presença Digital</p>
              <div className="space-y-1.5">
                {p.instagram_handle && (
                  <div className="flex items-center gap-2">
                    <AtSign size={13} className="text-pink-400 shrink-0" />
                    <a
                      href={`https://instagram.com/${p.instagram_handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-300 hover:text-pink-200 text-xs hover:underline"
                    >
                      @{p.instagram_handle}
                    </a>
                  </div>
                )}
                {p.facebook_url && (
                  <div className="flex items-center gap-2">
                    <ExternalLink size={13} className="text-blue-400 shrink-0" />
                    <a
                      href={p.facebook_url.startsWith('http') ? p.facebook_url : `https://${p.facebook_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 hover:text-blue-200 text-xs hover:underline truncate"
                    >
                      {p.facebook_url}
                    </a>
                  </div>
                )}
                {p.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-slate-400 shrink-0" />
                    <a
                      href={p.website_url.startsWith('http') ? p.website_url : `https://${p.website_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-300 hover:text-slate-200 text-xs hover:underline truncate"
                    >
                      {p.website_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <Row icon={<ClipboardList size={14} />} label="Resultado da visita" value={p.resultado_visita} />
          {(p.proximo_passo || p.data_retorno) && (
            <div className="flex flex-col gap-1.5">
              {p.proximo_passo && <div className="flex items-start gap-2"><BellRing size={13} className={p.data_retorno ? (lembreteStatus(p.data_retorno) === 'vencido' ? 'text-red-400 mt-0.5 shrink-0' : lembreteStatus(p.data_retorno) === 'urgente' ? 'text-orange mt-0.5 shrink-0' : 'text-slate-400 mt-0.5 shrink-0') : 'text-slate-500 mt-0.5 shrink-0'}/><p className="text-white/90 text-sm">{p.proximo_passo}</p></div>}
              {p.data_retorno && (() => { const st = lembreteStatus(p.data_retorno); const cls = st === 'vencido' ? 'text-red-400 bg-red-900/20 border-red-400/20' : st === 'urgente' ? 'text-orange bg-orange/10 border-orange/20' : 'text-slate-400 bg-white/5 border-white/10'; return <span className={cn('self-start text-xs font-display font-bold border rounded px-2 py-0.5', cls)}>🔔 Lembrar em {fmtLembrete(p.data_retorno)}{st === 'vencido' ? ' · VENCIDO' : ''}</span> })()}
              {p.data_retorno && (
                <button
                  onClick={onConcluirLembrete}
                  className="self-start flex items-center gap-1.5 text-xs font-display font-bold text-green-400 border border-green-400/30 rounded-lg px-3 py-1.5 hover:border-green-400/60 transition-colors bg-green-400/5"
                >
                  <Check size={13} />
                  Feito — concluir lembrete
                </button>
              )}
            </div>
          )}
          {p.observacoes && (
            <div>
              <p className="text-xs text-muted uppercase font-display font-semibold tracking-wide">Observações</p>
              <p className="text-white/80 whitespace-pre-wrap mt-1">{p.observacoes}</p>
            </div>
          )}

          {leadsVinculados.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide mb-2">
                Leads vinculados ({leadsVinculados.length})
              </p>
              <div className="space-y-2">
                {leadsVinculados.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    <User size={13} className="text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{lead.nome || lead.telefone || '—'}</p>
                      {lead.telefone && <p className="text-muted text-xs font-mono">{lead.telefone}</p>}
                    </div>
                    <span className="text-xs text-muted shrink-0">
                      {STATUS_LEAD_LABEL[lead.status ?? ''] ?? lead.status ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de contatos */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide mb-2">
              Histórico de contatos ({historico.length})
            </p>
            {historico.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Nenhum contato registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {historico.map((h) => {
                  const tipoLabel = TIPO_CONTATO_LABEL[h.tipo_contato] ?? h.tipo_contato
                  const resultadoLabel = h.resultado ? (RESULTADO_LABEL[h.resultado] ?? h.resultado) : null
                  const interesseLabel = h.interesse ? (INTERESSE_LABEL[h.interesse] ?? h.interesse) : null
                  const dataFmt = new Date(h.data_contato).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                  const horaFmt = new Date(h.data_contato).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={h.id} className="bg-white/5 rounded-lg px-3 py-2 text-xs space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-white">{tipoLabel}</span>
                          {resultadoLabel && <span className="text-muted">· {resultadoLabel}</span>}
                          {interesseLabel && <span className="text-orange font-semibold">· {interesseLabel}</span>}
                        </div>
                        <span className="text-muted shrink-0">{dataFmt} {horaFmt}</span>
                      </div>
                      {h.consultor && <p className="text-muted">por {h.consultor}</p>}
                      {h.telefone_capturado && <p className="text-green-400">📞 {h.telefone_capturado}</p>}
                      {h.proximo_passo && <p className="text-slate-300">→ {h.proximo_passo}</p>}
                      {h.observacoes && <p className="text-slate-400 italic">{h.observacoes}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-muted mt-0.5 shrink-0">{icon}</span>}
      <div>
        <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function TelRow({ label, value, isWhatsApp }: { label: string; value?: string | null; isWhatsApp?: boolean }) {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return (
    <div className="flex items-center gap-2">
      <Phone size={12} className="text-muted shrink-0" />
      <span className="text-xs text-muted font-display font-semibold uppercase tracking-wide w-32 shrink-0">{label}</span>
      <a href={`tel:${digits}`} className="text-white hover:text-orange text-xs">{value}</a>
      {isWhatsApp && (
        <a
          href={`https://wa.me/${digits}`}
          target="_blank"
          rel="noreferrer"
          className="text-green-400 text-xs hover:underline shrink-0"
        >
          (WA)
        </a>
      )}
    </div>
  )
}

const RESULTADOS_LIGACAO = [
  { value: 'nao_atendeu',        label: 'Não atendeu' },
  { value: 'caixa_postal',       label: 'Caixa postal' },
  { value: 'numero_errado',      label: 'Número errado' },
  { value: 'numero_inexistente', label: 'Número inexistente' },
  { value: 'falou_secretaria',   label: 'Falou com secretaria' },
  { value: 'falou_responsavel',  label: 'Falou com responsável' },
]

const RESULTADOS_WPP = [
  { value: 'mensagem_enviada',  label: 'Mensagem enviada' },
  { value: 'sem_resposta_wpp',  label: 'Sem resposta' },
  { value: 'falou_responsavel', label: 'Respondeu' },
]

const INTERESSES = [
  { value: 'demonstrou_interesse', label: 'Demonstrou interesse' },
  { value: 'pediu_preco',          label: 'Pediu preço' },
  { value: 'follow_up',            label: 'Follow-up / retornar' },
  { value: 'aguardando_ismenia',   label: 'Aguardando Ismênia' },
  { value: 'sem_interesse',        label: 'Sem interesse' },
  { value: 'qualificado',          label: 'Qualificado ✓' },
]

const STATUS_POR_RESULTADO: Record<string, string> = {
  nao_atendeu:        'tentativa_1',
  caixa_postal:       'tentativa_1',
  numero_errado:      'desqualificado',
  numero_inexistente: 'desqualificado',
  falou_secretaria:   'tentativa_2',
  falou_responsavel:  'retornou',
  mensagem_enviada:   'tentativa_1',
  sem_resposta_wpp:   'tentativa_1',
}

type ContatoForm = {
  consultor: string
  tipo_contato: 'ligacao' | 'whatsapp' | 'presencial'
  resultado: string
  interesse: string
  telefone_capturado: string
  proximo_passo: string
  data_retorno: string
  observacoes: string
}

const CONTATO_EMPTY: ContatoForm = {
  consultor: '', tipo_contato: 'ligacao', resultado: '',
  interesse: '', telefone_capturado: '', proximo_passo: '',
  data_retorno: '', observacoes: '',
}

import type { CreateHistoricoPayload } from '@/hooks/useHistoricoContatos'

function RegistrarContatoModal({
  prospecto,
  onClose,
  onSave,
  saving,
}: {
  prospecto: Prospecto | null
  onClose: () => void
  onSave: (payload: CreateHistoricoPayload, novoStatus: string | null) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<ContatoForm>(CONTATO_EMPTY)

  useEffect(() => {
    if (prospecto) setForm(CONTATO_EMPTY)
  }, [prospecto])

  if (!prospecto) return null

  function set<K extends keyof ContatoForm>(field: K, value: ContatoForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resultadosDisponiveis = form.tipo_contato === 'whatsapp' ? RESULTADOS_WPP : RESULTADOS_LIGACAO
  const mostrarInteresse = ['falou_responsavel', 'falou_secretaria'].includes(form.resultado)
  const mostrarTelefone  = ['falou_responsavel', 'falou_secretaria'].includes(form.resultado)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.resultado && form.tipo_contato !== 'presencial') return
    const novoStatus = form.resultado ? (STATUS_POR_RESULTADO[form.resultado] ?? null) : null
    const finalStatus = form.interesse === 'sem_interesse' ? 'desqualificado' : novoStatus
    await onSave({
      id_prospecto:      prospecto!.id_visita,
      consultor:         form.consultor || null,
      tipo_contato:      form.tipo_contato,
      resultado:         form.resultado || null,
      interesse:         form.interesse || null,
      telefone_capturado: form.telefone_capturado.trim() || null,
      proximo_passo:     form.proximo_passo.trim() || null,
      data_retorno:      form.data_retorno || null,
      observacoes:       form.observacoes.trim() || null,
    }, finalStatus)
  }

  const ligarTel = prospecto.whatsapp_responsavel || prospecto.telefone_oficina

  return (
    <Modal open={!!prospecto} onClose={onClose} title={`Registrar Contato — ${prospecto.empresa_oficina || 'Oficina'}`}>
      {ligarTel && (
        <div className="mb-4 flex gap-2">
          <a
            href={`tel:${ligarTel.replace(/\D/g, '')}`}
            className="flex-1 flex items-center justify-center gap-2 bg-orange/10 border border-orange/30 text-orange rounded-lg py-2.5 text-sm font-display font-bold hover:bg-orange/20 transition-colors"
          >
            <Phone size={15} />
            Ligar agora
          </a>
          {prospecto.whatsapp_responsavel && (
            <a
              href={toWaLink(prospecto.whatsapp_responsavel)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg py-2.5 text-sm font-display font-bold hover:bg-green-500/20 transition-colors"
            >
              <MessageCircle size={15} />
              WhatsApp
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Consultor">
          <select className="input-field" value={form.consultor} onChange={(e) => set('consultor', e.target.value)}>
            <option value="">— Selecione</option>
            {CONSULTORES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Tipo de contato">
          <div className="flex gap-2">
            {(['ligacao', 'whatsapp', 'presencial'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { set('tipo_contato', t); set('resultado', '') }}
                className={cn(
                  'flex-1 rounded-lg text-xs font-display font-bold py-2 px-3 border transition-colors cursor-pointer',
                  form.tipo_contato === t
                    ? 'border-orange bg-orange/10 text-orange'
                    : 'border-white/10 bg-white/5 text-white hover:border-orange/50',
                )}
              >
                {TIPO_CONTATO_LABEL[t]}
              </button>
            ))}
          </div>
        </Field>

        {form.tipo_contato !== 'presencial' && (
          <Field label="Resultado da ligação / mensagem">
            <select
              className="input-field"
              value={form.resultado}
              onChange={(e) => set('resultado', e.target.value)}
              required
            >
              <option value="">— Selecione</option>
              {resultadosDisponiveis.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Field>
        )}

        {(mostrarInteresse || form.tipo_contato === 'presencial') && (
          <Field label="Interesse demonstrado">
            <select className="input-field" value={form.interesse} onChange={(e) => set('interesse', e.target.value)}>
              <option value="">— Selecione</option>
              {INTERESSES.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </Field>
        )}

        {mostrarTelefone && (
          <Field label="Telefone capturado (opcional)">
            <input
              type="tel"
              className="input-field"
              value={form.telefone_capturado}
              onChange={(e) => set('telefone_capturado', e.target.value)}
              placeholder="Número do responsável ou técnico"
            />
          </Field>
        )}

        <div>
          <label className="field-label flex items-center gap-1.5"><BellRing size={12} className="text-orange"/>Próximo passo <span className="text-muted font-normal normal-case tracking-normal">+ lembrete</span></label>
          <input className="input-field" value={form.proximo_passo} onChange={(e) => set('proximo_passo', e.target.value)} placeholder="Ex: Ligar na sexta após 14h"/>
          <input type="date" className="input-field mt-1.5" value={form.data_retorno} onChange={(e) => set('data_retorno', e.target.value)} title="Data do lembrete"/>
        </div>

        <Field label="Observações">
          <textarea
            rows={3}
            className="input-field resize-none"
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            placeholder="Detalhes da conversa, nome de quem atendeu..."
          />
        </Field>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
            {saving ? 'Salvando...' : 'Salvar contato'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary px-5">
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

type Participante = { nome: string; telefone: string }

type ProspectoEditForm = {
  empresa_oficina: string
  nome_responsavel_treinamento: string
  nome_contato_inicial: string
  cidade: string
  uf: string
  endereco: string
  tipo_oficinas: string[]
  porte_oficina: string
  multimarcas: boolean
  especializacao_oficina: string
  marcas: string[]
  perfil: string
  qtd_interessados: string
  potencial: string
  qualificado_lead: boolean
  resultado_visita: string
  proximo_passo: string
  data_retorno: string
  consultor: string
  empresa_parceira: string
  observacoes: string
  telefone_oficina: string
  whatsapp_responsavel: string
  telefone_financeiro: string
  telefone_participante: string
  participantes: Participante[]
  instagram_handle: string
  facebook_url: string
  website_url: string
}

function ProspectoEditModal({
  prospecto,
  onClose,
  onSave,
  saving,
}: {
  prospecto: Prospecto | null
  onClose: () => void
  onSave: (data: Partial<Prospecto>) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<ProspectoEditForm | null>(null)

  useEffect(() => {
    if (!prospecto) {
      setForm(null)
      return
    }
    setForm({
      empresa_oficina: prospecto.empresa_oficina ?? '',
      nome_responsavel_treinamento: prospecto.nome_responsavel_treinamento ?? '',
      nome_contato_inicial: prospecto.nome_contato_inicial ?? '',
      cidade: prospecto.cidade ?? '',
      uf: prospecto.uf ?? '',
      endereco: prospecto.endereco ?? '',
      tipo_oficinas: (prospecto.tipo_oficina ?? '').split(',').map(v => v.trim()).filter(Boolean),
      porte_oficina: prospecto.porte_oficina ?? '',
      multimarcas: prospecto.multimarcas ?? false,
      especializacao_oficina: prospecto.especializacao_oficina ?? '',
      marcas: (prospecto.marca_interesse ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => value.toLowerCase())
        .map((value) => value === 'volvo' ? 'Volvo' : value === 'daf' ? 'DAF' : value === 'scania' ? 'Scania' : value),
      perfil: prospecto.perfil ?? '',
      qtd_interessados: prospecto.qtd_interessados ?? '',
      potencial: prospecto.potencial ?? '',
      qualificado_lead: prospecto.qualificado_lead ?? false,
      resultado_visita: prospecto.resultado_visita ?? '',
      proximo_passo: prospecto.proximo_passo ?? '',
      data_retorno: prospecto.data_retorno ?? '',
      consultor: prospecto.consultor ?? '',
      empresa_parceira: prospecto.empresa_parceira ?? '',
      observacoes: prospecto.observacoes ?? '',
      telefone_oficina: prospecto.telefone_oficina ?? '',
      whatsapp_responsavel: prospecto.whatsapp_responsavel ?? '',
      telefone_financeiro: prospecto.telefone_financeiro ?? '',
      telefone_participante: prospecto.telefone_participante ?? '',
      participantes: prospecto.participantes ?? [],
      instagram_handle: prospecto.instagram_handle ?? '',
      facebook_url: prospecto.facebook_url ?? '',
      website_url: prospecto.website_url ?? '',
    })
  }, [prospecto])

  if (!form) return null

  function set<K extends keyof ProspectoEditForm>(field: K, value: ProspectoEditForm[K]) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  function toggleMarca(marca: string) {
    setForm((prev) => prev ? ({
      ...prev,
      marcas: prev.marcas.includes(marca)
        ? prev.marcas.filter((item) => item !== marca)
        : [...prev.marcas, marca],
    }) : prev)
  }

  function toggleTipoOficina(v: string) {
    setForm((prev) => prev ? ({
      ...prev,
      tipo_oficinas: prev.tipo_oficinas.includes(v)
        ? prev.tipo_oficinas.filter((item) => item !== v)
        : [...prev.tipo_oficinas, v],
    }) : prev)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    const foraPublico = form.tipo_oficinas.includes('fora_publico')
    await onSave({
      empresa_oficina: form.empresa_oficina || null,
      nome_responsavel_treinamento: form.nome_responsavel_treinamento || null,
      nome_contato_inicial: form.nome_contato_inicial || null,
      cidade: form.cidade || null,
      uf: form.uf || null,
      endereco: form.endereco || null,
      tipo_oficina: form.tipo_oficinas.length ? form.tipo_oficinas.join(',') : null,
      porte_oficina: form.porte_oficina || null,
      multimarcas: form.multimarcas,
      especializacao_oficina: form.especializacao_oficina || null,
      marca_interesse: form.marcas.length ? form.marcas.join(',').toLowerCase() : null,
      perfil: form.perfil || null,
      qtd_interessados: form.qtd_interessados || null,
      potencial: foraPublico ? 'sem_interesse' : (form.potencial || null),
      qualificado_lead: form.qualificado_lead,
      resultado_visita: form.resultado_visita || null,
      proximo_passo: form.proximo_passo || null,
      data_retorno: form.data_retorno || null,
      consultor: form.consultor || null,
      empresa_parceira: form.empresa_parceira || null,
      observacoes: form.observacoes || null,
      telefone_oficina: form.telefone_oficina || null,
      whatsapp_responsavel: form.whatsapp_responsavel || null,
      telefone_financeiro: form.telefone_financeiro || null,
      telefone_participante: form.telefone_participante || null,
      participantes: form.participantes.filter(p => p.nome.trim() || p.telefone.trim()),
      instagram_handle: form.instagram_handle || null,
      facebook_url: form.facebook_url || null,
      website_url: form.website_url || null,
    })
  }

  return (
    <Modal open={!!prospecto} onClose={onClose} title="Ficha da Oficina">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nomes e localização */}
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Oficina">
            <input className="input-field" value={form.empresa_oficina} onChange={(e) => set('empresa_oficina', e.target.value)} />
          </Field>
          <Field label="Responsável pelo treinamento">
            <input className="input-field" value={form.nome_responsavel_treinamento} onChange={(e) => set('nome_responsavel_treinamento', e.target.value)} />
          </Field>
          <Field label="Financeiro / recepção / contato inicial">
            <input className="input-field" value={form.nome_contato_inicial} onChange={(e) => set('nome_contato_inicial', e.target.value)} />
          </Field>
          <Field label="Cidade">
            <input className="input-field" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
          </Field>
          <Field label="UF">
            <select className="input-field" value={form.uf} onChange={(e) => set('uf', e.target.value)}>
              <option value="">UF</option>
              {UF_OPTIONS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </Field>
          <Field label="Porte">
            <select className="input-field" value={form.porte_oficina} onChange={(e) => set('porte_oficina', e.target.value)}>
              <option value="">Selecione</option>
              {PORTE_OFICINA_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Endereço">
          <input
            className="input-field"
            value={form.endereco}
            onChange={(e) => set('endereco', e.target.value)}
            placeholder="Rua, número, bairro"
          />
        </Field>

        <Field label="Tipo de oficina">
          <div className="flex flex-wrap gap-2">
            {TIPO_OFICINA_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleTipoOficina(t.value)}
                className={cn(
                  'rounded-lg text-xs font-display font-bold py-2 px-3 transition-colors cursor-pointer border',
                  form.tipo_oficinas.includes(t.value)
                    ? 'border-orange bg-orange/10 text-orange'
                    : 'border-white/10 bg-white/5 text-white hover:border-orange/50',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex items-center gap-3 h-11 px-3 bg-white/5 border border-white/10 rounded-lg">
          <input type="checkbox" id="multimarcas_prospecto" checked={form.multimarcas} onChange={(e) => set('multimarcas', e.target.checked)} className="w-4 h-4 accent-orange cursor-pointer" />
          <label htmlFor="multimarcas_prospecto" className="text-sm text-white cursor-pointer">Multimarcas</label>
        </div>

        <Field label="Especialização da oficina">
          <input className="input-field" value={form.especializacao_oficina} onChange={(e) => set('especializacao_oficina', e.target.value)} />
        </Field>

        <Field label="Marcas de interesse">
          <div className="flex gap-2">
            {MARCAS.map((marca) => (
              <button
                key={marca}
                type="button"
                onClick={() => toggleMarca(marca)}
                className={cn(
                  'flex-1 rounded-lg text-sm font-display font-bold transition-colors cursor-pointer border min-h-[44px]',
                  form.marcas.includes(marca)
                    ? 'border-orange bg-orange/10 text-orange'
                    : 'border-white/10 bg-white/5 text-white hover:border-orange/50',
                )}
              >
                {marca}
              </button>
            ))}
          </div>
        </Field>

        {/* Telefones — 2×2 grid */}
        <div>
          <p className="text-xs font-display font-semibold text-muted uppercase tracking-wide mb-2">Telefones</p>
          <div className="grid gap-3 grid-cols-2">
            <Field label="Geral / Maps">
              <input type="tel" className="input-field" value={form.telefone_oficina} onChange={(e) => set('telefone_oficina', e.target.value)} placeholder="(47) 3333-4444" />
            </Field>
            <Field label="Resp. treinamento (WhatsApp)">
              <input type="tel" className="input-field" value={form.whatsapp_responsavel} onChange={(e) => set('whatsapp_responsavel', e.target.value)} placeholder="(47) 99999-9999" />
            </Field>
            <Field label="Financeiro / RH / Secretaria">
              <input type="tel" className="input-field" value={form.telefone_financeiro} onChange={(e) => set('telefone_financeiro', e.target.value)} placeholder="(47) 3333-4444" />
            </Field>
            <Field label="Técnico participante">
              <input type="tel" className="input-field" value={form.telefone_participante} onChange={(e) => set('telefone_participante', e.target.value)} placeholder="(47) 99999-9999" />
            </Field>
          </div>
        </div>

        {/* Presença Digital */}
        <div>
          <p className="text-xs font-display font-semibold text-muted uppercase tracking-wide mb-2">Presença Digital</p>
          <div className="space-y-3">
            <Field label="Instagram (sem @)">
              <div className="relative">
                <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                <input
                  type="text"
                  className="input-field pl-8"
                  value={form.instagram_handle}
                  onChange={(e) => set('instagram_handle', e.target.value.replace(/^@/, ''))}
                  placeholder="mecanicadiesel"
                />
              </div>
            </Field>
            <Field label="Facebook (URL)">
              <input
                type="url"
                className="input-field"
                value={form.facebook_url}
                onChange={(e) => set('facebook_url', e.target.value)}
                placeholder="facebook.com/oficina..."
              />
            </Field>
            <Field label="Site (URL)">
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  className="input-field pl-8"
                  value={form.website_url}
                  onChange={(e) => set('website_url', e.target.value)}
                  placeholder="www.oficina.com.br"
                />
              </div>
            </Field>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Perfil">
            <select className="input-field" value={form.perfil} onChange={(e) => set('perfil', e.target.value)}>
              <option value="">Selecione</option>
              {PERFIL_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
          <Field label="Qtd. interessados">
            <input className="input-field" value={form.qtd_interessados} onChange={(e) => set('qtd_interessados', e.target.value)} />
          </Field>
          <Field label="Potencial">
            <select className="input-field" value={form.potencial} onChange={(e) => set('potencial', e.target.value)}>
              <option value="">Selecione</option>
              <option value="alto">Alto</option>
              <option value="medio">Médio</option>
              <option value="baixo">Baixo</option>
              <option value="sem_interesse">Sem interesse</option>
            </select>
          </Field>
            <Field label="Consultor">
            <select className="input-field" value={form.consultor} onChange={(e) => set('consultor', e.target.value)}>
              <option value="">— Selecione</option>
              {CONSULTORES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Parceiro">
            <select className="input-field" value={form.empresa_parceira} onChange={(e) => set('empresa_parceira', e.target.value)}>
              <option value="">Selecione</option>
              {PARCEIRO_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Participantes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-display font-semibold text-muted uppercase tracking-wide">Participantes do treinamento</p>
            <button
              type="button"
              onClick={() => set('participantes', [...form.participantes, { nome: '', telefone: '' }])}
              className="flex items-center gap-1 text-xs text-orange hover:text-orange/80 font-display font-bold cursor-pointer"
            >
              <Plus size={13} /> Adicionar
            </button>
          </div>
          {form.participantes.length === 0 && (
            <p className="text-xs text-slate-500 italic">Nenhum participante adicionado ainda.</p>
          )}
          <div className="space-y-2">
            {form.participantes.map((pt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="input-field flex-1 text-xs"
                  placeholder="Nome"
                  value={pt.nome}
                  onChange={(e) => {
                    const list = [...form.participantes]
                    list[i] = { ...list[i], nome: e.target.value }
                    set('participantes', list)
                  }}
                />
                <input
                  className="input-field flex-1 text-xs"
                  placeholder="WhatsApp / Telefone"
                  value={pt.telefone}
                  onChange={(e) => {
                    const list = [...form.participantes]
                    list[i] = { ...list[i], telefone: e.target.value }
                    set('participantes', list)
                  }}
                />
                <button
                  type="button"
                  onClick={() => set('participantes', form.participantes.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-red-400 cursor-pointer shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 h-11 px-3 bg-white/5 border border-white/10 rounded-lg">
          <input type="checkbox" id="qualificado_lead_edit" checked={form.qualificado_lead} onChange={(e) => set('qualificado_lead', e.target.checked)} className="w-4 h-4 accent-orange cursor-pointer" />
          <label htmlFor="qualificado_lead_edit" className="text-sm text-white cursor-pointer">Qualificado como lead</label>
        </div>

        <Field label="Resultado da visita / contato">
          <textarea rows={3} className="input-field resize-none" value={form.resultado_visita} onChange={(e) => set('resultado_visita', e.target.value)} />
        </Field>
        <div>
          <label className="field-label flex items-center gap-1.5"><BellRing size={12} className="text-orange"/>Próximo passo <span className="text-muted font-normal normal-case tracking-normal">+ lembrete</span></label>
          <input className="input-field" value={form.proximo_passo} onChange={(e) => set('proximo_passo', e.target.value)}/>
          <input type="date" className="input-field mt-1.5" value={form.data_retorno ?? ''} onChange={(e) => set('data_retorno', e.target.value)} title="Data do lembrete"/>
        </div>
        <Field label="Observações / dono / particularidades">
          <textarea rows={4} className="input-field resize-none" value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} />
        </Field>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
            {saving ? 'Salvando...' : 'Salvar ficha'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary px-5">
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
