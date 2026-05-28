import { useEffect, useState } from 'react'
import { Search, Phone, ChevronDown, MapPin, Wrench, Users, Building2, ClipboardList, CalendarDays, MessageCircle, Info, Edit2, UserPlus, User } from 'lucide-react'
import { useProspectos, useRegistrarTentativa, useUpdateProspecto, useCreateLeadFromProspecto, useProspectoLeadCounts, getProspectoLeadCount, type ProspectoFilter, type Prospecto } from '@/hooks/useProspectos'
import { useDistinctUFs, useLeadsByProspecto } from '@/hooks/useLeads'
import { cn, MARCA_BADGES, UF_OPTIONS, PORTE_OFICINA_OPTIONS, PERFIL_OPTIONS } from '@/lib/utils'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'

const FILTERS: { id: ProspectoFilter; label: string }[] = [
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
  const [ufFilter, setUfFilter] = useState<string>('')
  const [potencialFilter, setPotencialFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [ufOpen, setUfOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Prospecto | null>(null)

  const { data: prospectos = [], isLoading } = useProspectos(filter, ufFilter || undefined)
  const { data: leadCounts = {} } = useProspectoLeadCounts()
  const { data: ufs = [] } = useDistinctUFs()
  const updateProspecto = useUpdateProspecto()
  const createLead = useCreateLeadFromProspecto()
  const registrarTentativa = useRegistrarTentativa()

  const filtered = prospectos.filter((p) => {
    if (potencialFilter && p.potencial !== potencialFilter) return false
    const leadCount = getProspectoLeadCount(p, leadCounts)
    if (filter === 'sem_leads' && leadCount > 0) return false
    if (filter === 'com_leads' && leadCount === 0) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.empresa_oficina?.toLowerCase().includes(q) ||
        p.nome_responsavel_treinamento?.toLowerCase().includes(q) ||
        p.nome_contato_inicial?.toLowerCase().includes(q) ||
        p.whatsapp_responsavel?.includes(q) ||
        p.cidade?.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function handleCreateLead(p: Prospecto, e: React.MouseEvent) {
    e.stopPropagation()
    if (!p.whatsapp_responsavel) {
      toast.error('Oficina sem WhatsApp do responsável — não é possível criar o lead.')
      return
    }
    await createLead.mutateAsync(p)
    toast.success('Lead vinculado ao CRM criado com sucesso!')
  }

  async function handleTentativa(p: Prospecto, e: React.MouseEvent) {
    e.stopPropagation()
    const status = p.status_contato ?? 'a_contatar'
    const next: Record<string, { status: string; campo: 'data_tentativa_1' | 'data_tentativa_2' | 'data_tentativa_3' }> = {
      a_contatar:  { status: 'tentativa_1', campo: 'data_tentativa_1' },
      tentativa_1: { status: 'tentativa_2', campo: 'data_tentativa_2' },
      tentativa_2: { status: 'tentativa_3', campo: 'data_tentativa_3' },
      tentativa_3: { status: 'sem_resposta', campo: 'data_tentativa_3' },
    }
    const action = next[status]
    if (!action) {
      toast.info('Sem próxima tentativa disponível neste status.')
      return
    }
    await registrarTentativa.mutateAsync({
      id_visita: p.id_visita,
      status_contato: action.status,
      campo_data: action.campo,
    })
    toast.success(`Registrado: ${STATUS_LABEL[action.status]}`)
  }

  const selected = detailId ? prospectos.find((p) => p.id_visita === detailId) ?? null : null

  return (
    <div className="flex flex-col h-full md:ml-56">
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
            className={cn(pillBase, filter === id ? pillActive : pillInactive)}
          >
            {label}
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
      </div>

      <p className="text-xs text-muted px-4 py-1 shrink-0">
        {isLoading ? 'Carregando...' : `${filtered.length} prospectos`}
      </p>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">Nenhum prospecto encontrado</div>
        )}
        {!isLoading && filtered.map((p) => (
          <ProspectoCard
            key={p.id_visita}
            prospecto={p}
            onClick={() => setExpandedId(p.id_visita === expandedId ? null : p.id_visita)}
            onOpenDetail={() => setDetailId(p.id_visita)}
            onEdit={() => setEditing(p)}
            expanded={p.id_visita === expandedId}
            leadCount={getProspectoLeadCount(p, leadCounts)}
            onCreateLead={(e) => handleCreateLead(p, e)}
            onTentativa={(e) => handleTentativa(p, e)}
            creatingLead={createLead.isPending}
          />
        ))}
      </div>

      {/* Detail drawer (mobile bottom sheet style) */}
      {selected && (
        <ProspectoDetail prospecto={selected} onClose={() => setDetailId(null)} />
      )}

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
  expanded,
  onCreateLead,
  onTentativa,
  leadCount,
  creatingLead,
}: {
  prospecto: Prospecto
  onClick: () => void
  onOpenDetail: () => void
  onEdit: () => void
  expanded: boolean
  onCreateLead: (e: React.MouseEvent) => void
  onTentativa: (e: React.MouseEvent) => void
  leadCount: number
  creatingLead: boolean
}) {
  const marcas = p.marca_interesse ? p.marca_interesse.split(',').map((m) => m.trim()).filter(Boolean) : []
  const statusLabel = p.status_contato ? STATUS_LABEL[p.status_contato] ?? p.status_contato : 'A contatar'
  const nome = p.nome_responsavel_treinamento || p.nome_contato_inicial || '—'
  const hasLeads = leadCount > 0
  const ligarTel = p.whatsapp_responsavel || p.telefone_oficina

  return (
    <div
      className={cn(
        'rounded-xl border transition-colors cursor-pointer',
        hasLeads
          ? 'border-blue-200 bg-blue-50'
          : 'border-white/10 bg-navy2 hover:border-white/20',
      )}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('font-display font-bold text-sm truncate', hasLeads ? 'text-navy' : 'text-white')}>{p.empresa_oficina || '—'}</p>
            <p className={cn('text-xs mt-0.5 truncate', hasLeads ? 'text-slate-600' : 'text-muted')}>{nome} · {p.cidade}{p.uf ? `/${p.uf}` : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={cn('text-xs font-display font-bold rounded-full px-2 py-0.5 border', hasLeads ? 'text-blue-700 border-blue-300 bg-white/80' : 'text-slate-300 border-white/10')}>
              {leadCount} {leadCount === 1 ? 'lead' : 'leads'}
            </span>
            {p.potencial && (
              <span className={cn('text-xs font-display font-semibold', POTENCIAL_COLOR[p.potencial] ?? 'text-muted')}>
                {p.potencial === 'alto' ? '🔥' : p.potencial === 'medio' ? '~' : '❄'} {p.potencial}
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
          <span className={cn(
            'px-1.5 py-0.5 rounded text-xs font-display font-semibold border',
            hasLeads ? 'text-slate-700 border-slate-200 bg-white/80' : 'text-muted border-white/10',
          )}>{statusLabel}</span>
          {p.data_visita && (
            <span className={cn('text-xs', hasLeads ? 'text-slate-500' : 'text-muted')}>{new Date(p.data_visita + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
          )}
        </div>

        {expanded && (
          <div className={cn('mt-3 pt-3 flex gap-2 flex-wrap', hasLeads ? 'border-t border-slate-200' : 'border-t border-white/10')}>
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
            {!hasLeads && (
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
            )}
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
            {p.status_contato !== 'sem_resposta' && p.status_contato !== 'desqualificado' && (
              <button
                onClick={onTentativa}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Phone size={13} />
                Registrar Tentativa
              </button>
            )}
            {p.whatsapp_responsavel && (
              <a
                href={`https://wa.me/${p.whatsapp_responsavel.replace(/\D/g, '')}`}
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
  lead_novo:            'Novo',
  qualificado:          'Qualificado',
  lista_espera:         'Lista de espera',
  aguardando_pagamento: 'Ag. pagamento',
  inscrito:             'Inscrito',
}

function ProspectoDetail({ prospecto: p, onClose }: { prospecto: Prospecto; onClose: () => void }) {
  const { data: leadsVinculados = [] } = useLeadsByProspecto(p.id_visita)

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-end md:items-center md:justify-center" onClick={onClose}>
      <div
        className="bg-navy w-full md:max-w-lg md:rounded-2xl md:border md:border-white/10 max-h-[80vh] overflow-y-auto rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-display font-bold text-white">{p.empresa_oficina || 'Prospecto'}</h3>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
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

          <Row icon={<ClipboardList size={14} />} label="Resultado da visita" value={p.resultado_visita} />
          <Row label="Próximo passo" value={p.proximo_passo} />
          <Row label="Data de retorno" value={p.data_retorno} />
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
          <Field label="Data de retorno">
            <input type="date" className="input-field" value={form.data_retorno} onChange={(e) => set('data_retorno', e.target.value)} />
          </Field>
          <Field label="Consultor">
            <input className="input-field" value={form.consultor} onChange={(e) => set('consultor', e.target.value)} />
          </Field>
          <Field label="Parceiro">
            <select className="input-field" value={form.empresa_parceira} onChange={(e) => set('empresa_parceira', e.target.value)}>
              <option value="">Selecione</option>
              {PARCEIRO_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Resultado da visita / contato">
          <textarea rows={3} className="input-field resize-none" value={form.resultado_visita} onChange={(e) => set('resultado_visita', e.target.value)} />
        </Field>
        <Field label="Próximo passo">
          <input className="input-field" value={form.proximo_passo} onChange={(e) => set('proximo_passo', e.target.value)} />
        </Field>
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
