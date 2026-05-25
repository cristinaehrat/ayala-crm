import { useState } from 'react'
import { Search, UserCheck, Phone, ChevronDown, MapPin, Wrench, Users, Building2, ClipboardList, CalendarDays, MessageCircle, Info } from 'lucide-react'
import { useProspectos, useQualificarProspecto, useRegistrarTentativa, type ProspectoFilter, type Prospecto } from '@/hooks/useProspectos'
import { useDistinctUFs } from '@/hooks/useLeads'
import { cn, MARCA_BADGES } from '@/lib/utils'
import { toast } from 'sonner'

const FILTERS: { id: ProspectoFilter; label: string }[] = [
  { id: 'todos',       label: 'Todos' },
  { id: 'a_contatar',  label: 'A Contatar' },
  { id: 'em_followup', label: 'Em Follow-up' },
  { id: 'qualificados',label: 'Qualificados' },
  { id: 'convertidos', label: 'Convertidos' },
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

export default function ProspectosPage() {
  const [filter, setFilter] = useState<ProspectoFilter>('todos')
  const [ufFilter, setUfFilter] = useState<string>('')
  const [potencialFilter, setPotencialFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [ufOpen, setUfOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: prospectos = [], isLoading } = useProspectos(filter, ufFilter || undefined)
  const { data: ufs = [] } = useDistinctUFs()
  const qualificar = useQualificarProspecto()
  const registrarTentativa = useRegistrarTentativa()

  const filtered = prospectos.filter((p) => {
    if (potencialFilter && p.potencial !== potencialFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.empresa_oficina?.toLowerCase().includes(q) ||
        p.nome_responsavel_treinamento?.toLowerCase().includes(q) ||
        p.whatsapp_responsavel?.includes(q) ||
        p.cidade?.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function handleQualificar(p: Prospecto, e: React.MouseEvent) {
    e.stopPropagation()
    if (p.qualificado_lead) {
      toast.info('Prospecto já foi qualificado.')
      return
    }
    if (!p.whatsapp_responsavel) {
      toast.error('Prospecto sem telefone — não é possível qualificar sem WhatsApp.')
      return
    }
    await qualificar.mutateAsync(p.id_visita)
    toast.success('Lead qualificado e adicionado ao CRM!')
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
            expanded={p.id_visita === expandedId}
            onQualificar={(e) => handleQualificar(p, e)}
            onTentativa={(e) => handleTentativa(p, e)}
            qualificando={qualificar.isPending}
          />
        ))}
      </div>

      {/* Detail drawer (mobile bottom sheet style) */}
      {selected && (
        <ProspectoDetail prospecto={selected} onClose={() => setDetailId(null)} />
      )}
    </div>
  )
}

function ProspectoCard({
  prospecto: p,
  onClick,
  onOpenDetail,
  expanded,
  onQualificar,
  onTentativa,
  qualificando,
}: {
  prospecto: Prospecto
  onClick: () => void
  onOpenDetail: () => void
  expanded: boolean
  onQualificar: (e: React.MouseEvent) => void
  onTentativa: (e: React.MouseEvent) => void
  qualificando: boolean
}) {
  const marcas = p.marca_interesse ? p.marca_interesse.split(',').map((m) => m.trim()).filter(Boolean) : []
  const statusLabel = p.status_contato ? STATUS_LABEL[p.status_contato] ?? p.status_contato : 'A contatar'
  const nome = p.nome_responsavel_treinamento || p.nome_contato_inicial || '—'
  const isConvertido = !!p.convertido_lead
  const isQualificado = !!p.qualificado_lead && !isConvertido
  const hasLightCard = isConvertido || isQualificado

  return (
    <div
      className={cn(
        'rounded-xl border transition-colors cursor-pointer',
        isConvertido
          ? 'border-blue-200 bg-blue-50'
          : isQualificado
          ? 'border-orange-200 bg-orange-50'
          : 'border-white/10 bg-navy2 hover:border-white/20',
      )}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('font-display font-bold text-sm truncate', hasLightCard ? 'text-navy' : 'text-white')}>{p.empresa_oficina || '—'}</p>
            <p className={cn('text-xs mt-0.5 truncate', hasLightCard ? 'text-slate-600' : 'text-muted')}>{nome} · {p.cidade}{p.uf ? `/${p.uf}` : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {isConvertido && (
              <span className="text-xs font-display font-bold text-blue-700 border border-blue-300 rounded-full px-2 py-0.5 bg-white/80">Convertido</span>
            )}
            {isQualificado && (
              <span className="text-xs font-display font-bold text-orange-700 border border-orange-300 rounded-full px-2 py-0.5 bg-white/80">Qualificado</span>
            )}
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
            hasLightCard ? 'text-slate-700 border-slate-200 bg-white/80' : 'text-muted border-white/10',
          )}>{statusLabel}</span>
          {p.data_visita && (
            <span className={cn('text-xs', hasLightCard ? 'text-slate-500' : 'text-muted')}>{new Date(p.data_visita + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
          )}
        </div>

        {expanded && (
          <div className={cn('mt-3 pt-3 flex gap-2 flex-wrap', hasLightCard ? 'border-t border-slate-200' : 'border-t border-white/10')}>
            {!isQualificado && !isConvertido && (
              <button
                onClick={onQualificar}
                disabled={qualificando}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <UserCheck size={13} />
                Qualificar e promover
              </button>
            )}
            {p.whatsapp_responsavel && (
              <a
                href={`tel:${p.whatsapp_responsavel.replace(/\D/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Phone size={13} />
                Ligar
              </a>
            )}
            {!isConvertido && p.status_contato !== 'sem_resposta' && p.status_contato !== 'desqualificado' && (
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
          </div>
        )}
      </div>
    </div>
  )
}

function ProspectoDetail({ prospecto: p, onClose }: { prospecto: Prospecto; onClose: () => void }) {
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
          <Row icon={<Phone size={14} />} label="Telefone" value={p.whatsapp_responsavel} />
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
          <Row icon={<ClipboardList size={14} />} label="Resultado da visita" value={p.resultado_visita} />
          <Row label="Próximo passo" value={p.proximo_passo} />
          <Row label="Data de retorno" value={p.data_retorno} />
          {p.observacoes && (
            <div>
              <p className="text-xs text-muted uppercase font-display font-semibold tracking-wide">Observações</p>
              <p className="text-white/80 whitespace-pre-wrap mt-1">{p.observacoes}</p>
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
