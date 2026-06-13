import { useLeads } from '@/hooks/useLeads'
import { useTurmas } from '@/hooks/useTurmas'
import { useProspectosAgendaCount } from '@/hooks/useProspectos'
import { Eye, Clock, AlertTriangle, BarChart2, ChevronRight, BellRing, User } from 'lucide-react'
import { MARCA_BADGES } from '@/lib/utils'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [isPaola, setIsPaola] = useState(false)
  const { data: leads = [], isLoading: leadsLoading } = useLeads('todos')
  const { data: turmas = [], isLoading: turmasLoading } = useTurmas()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsPaola(data.user?.email === 'paola@ayalaoficial.com.br')
    })
  }, [])

  const { data: prospectoAgendaCount = 0 } = useProspectosAgendaCount()

  const visPreco  = leads.filter((l) => l.etiqueta_chatwoot?.toLowerCase().includes('visualizou_preco')).length
  const agIsmenia = leads.filter((l) => l.etiqueta_chatwoot?.toLowerCase().includes('aguardando_ismenia')).length
  const paraPoala = leads.filter((l) => l.etiqueta_chatwoot?.toLowerCase().includes('para_paola')).length
  const requerAtencao = leads.filter((l) => l.requer_atencao).length

  const turmasAbertas = turmas.filter((t) => t.status === 'aberta')
  const turmasCriticas = turmasAbertas.filter((t) => (t.vagas_disponiveis ?? 0) <= 5)

  const statusCounts = {
    novo:        leads.filter((l) => (l.status ?? 'novo') === 'novo').length,
    em_contato:  leads.filter((l) => l.status === 'em_contato').length,
    oportunidade:leads.filter((l) => l.status === 'oportunidade').length,
    cliente:     leads.filter((l) => l.status === 'cliente').length,
    inativo:     leads.filter((l) => l.status === 'inativo').length,
  }
  const totalAtivos = Object.values(statusCounts).reduce((a, b) => a + b, 0) - statusCounts.inativo

  const FUNIL_STEPS = [
    { key: 'novo',        label: 'Novos',      color: '#3b82f6', navFilter: 'todos' as const },
    { key: 'em_contato',  label: 'Em Contato', color: '#f97316', navFilter: 'qualificados' as const },
    { key: 'oportunidade',label: 'Oprtnd.',    color: '#eab308', navFilter: 'aguardando_pagamento' as const },
    { key: 'cliente',     label: 'Clientes',   color: '#22c55e', navFilter: 'inscrito' as const },
    { key: 'inativo',     label: 'Inativos',   color: '#94a3b8', navFilter: 'todos' as const },
  ] as const

  if (isPaola) {
    return (
      <div className="h-full md:ml-56 flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-2 shrink-0">
          <h1 className="font-display font-bold text-navy text-lg">Dashboard</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Para você + Atenção pendente */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/leads?filter=para_paola">
              <div className={`section-card p-4 transition-all hover:border-purple-400/60 hover:shadow-md cursor-pointer ${paraPoala > 0 ? 'border-purple-400/40' : ''}`}>
                <div className="mb-2 text-purple-500"><User size={18} /></div>
                <p aria-live="polite" className={`font-display font-bold text-2xl ${paraPoala > 0 ? 'text-purple-600' : 'text-navy'}`}>
                  {leadsLoading ? '—' : paraPoala}
                </p>
                <p className="text-xs text-muted font-display font-semibold mt-0.5">Para você</p>
              </div>
            </Link>
            <Link to="/leads?filter=requer_atencao">
              <div className={`section-card p-4 transition-all hover:border-orange/60 hover:shadow-md cursor-pointer ${requerAtencao > 0 ? 'border-orange/40' : ''}`}>
                <div className="mb-2 text-orange"><BellRing size={18} /></div>
                <p aria-live="polite" className={`font-display font-bold text-2xl ${requerAtencao > 0 ? 'text-orange' : 'text-navy'}`}>
                  {leadsLoading ? '—' : requerAtencao}
                </p>
                <p className="text-xs text-muted font-display font-semibold mt-0.5">Atenção pendente</p>
              </div>
            </Link>
          </div>

          {/* Retornos de hoje — prospectos com data_retorno vencida */}
          {prospectoAgendaCount > 0 && (
            <Link to="/prospectos">
              <div className="section-card p-4 border-l-4 border-l-orange flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <BellRing size={18} className="text-orange shrink-0" />
                  <div>
                    <p className="font-display font-bold text-navy text-sm">Retornos de hoje</p>
                    <p className="text-xs text-muted mt-0.5">Oficinas aguardando contato</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-display font-bold text-2xl text-orange">{prospectoAgendaCount}</span>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </div>
            </Link>
          )}

          {/* Vagas Críticas */}
          {!turmasLoading && turmasCriticas.length > 0 && (
            <div className="section-card p-4">
              <h2 className="font-display font-bold text-navy text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500" />
                Vagas Críticas
              </h2>
              <div className="space-y-2">
                {turmasCriticas.map((t) => {
                  const marca = t.marca ? MARCA_BADGES[t.marca] : null
                  const esgotada = (t.vagas_disponiveis ?? 0) === 0
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      {marca && (
                        <span className="shrink-0 px-2 py-0.5 rounded text-xs font-display font-bold text-white" style={{ backgroundColor: marca.bg }}>
                          {marca.label}
                        </span>
                      )}
                      <p className="text-xs font-display font-semibold text-navy flex-1 truncate">{t.nome_treinamento}</p>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {esgotada && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                        )}
                        <span className={`text-xs font-display font-bold ${esgotada ? 'text-red-600' : 'text-yellow-600'}`}>
                          {t.vagas_disponiveis ?? 0} vaga{(t.vagas_disponiveis ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ocupação das turmas */}
          {!turmasLoading && turmasAbertas.length > 0 && (
            <div className="section-card p-4">
              <h2 className="font-display font-bold text-navy text-sm mb-1 uppercase tracking-wide flex items-center gap-2">
                <BarChart2 size={15} className="text-orange" />
                Ocupação das Turmas
              </h2>
              <p className="text-xs text-muted mb-4">Percentual de vagas preenchidas</p>
              <div className="space-y-4">
                {turmasAbertas.map((t) => {
                  const total_v = t.vagas_total ?? 0
                  const disp    = t.vagas_disponiveis ?? 0
                  const ocup    = total_v > 0 ? total_v - disp : 0
                  const pct     = total_v > 0 ? Math.round((ocup / total_v) * 100) : 0
                  const marca   = t.marca ? MARCA_BADGES[t.marca] : null
                  const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f97316' : '#3b82f6'
                  return (
                    <div key={t.id}>
                      <div className="flex items-center gap-2 mb-1">
                        {marca && (
                          <span className="shrink-0 px-2 py-0.5 rounded text-xs font-display font-bold text-white" style={{ backgroundColor: marca.bg }}>
                            {marca.label}
                          </span>
                        )}
                        <p className="text-xs font-display font-semibold text-navy truncate flex-1">{t.nome_treinamento}</p>
                        <span className="text-xs font-display font-bold text-navy shrink-0">{pct}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                      <p className="text-xs text-muted mt-1">{ocup}/{total_v} vagas · {t.cidade}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full md:ml-56 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="font-display font-bold text-navy text-lg">Dashboard</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Ação imediata */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/leads?filter=visualizou_preco">
            <div className={`section-card p-4 transition-all hover:border-blue-400/60 hover:shadow-md cursor-pointer ${visPreco > 0 ? 'border-blue-400/40' : ''}`}>
              <div className="mb-2 text-blue-500"><Eye size={18} /></div>
              <p className={`font-display font-bold text-2xl ${visPreco > 0 ? 'text-blue-600' : 'text-navy'}`}>
                {leadsLoading ? '—' : visPreco}
              </p>
              <p className="text-xs text-muted font-display font-semibold mt-0.5">Visualizou Preço</p>
            </div>
          </Link>
          <Link to="/leads?filter=ag_ismenia">
            <div className={`section-card p-4 transition-all hover:border-orange/60 hover:shadow-md cursor-pointer ${agIsmenia > 0 ? 'border-yellow-400/30' : ''}`}>
              <div className="mb-2 text-yellow-500"><Clock size={18} /></div>
              <p className={`font-display font-bold text-2xl ${agIsmenia > 0 ? 'text-yellow-600' : 'text-navy'}`}>
                {leadsLoading ? '—' : agIsmenia}
              </p>
              <p className="text-xs text-muted font-display font-semibold mt-0.5">Ag. Ismênia</p>
            </div>
          </Link>
        </div>

        {/* Mini-funil de leads por status */}
        <div className="section-card p-4">
          <h2 className="font-display font-bold text-navy text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
            <BarChart2 size={15} className="text-orange" />
            Funil de Leads
          </h2>
          <div className="grid grid-cols-5 gap-1">
            {FUNIL_STEPS.map(({ key, label, color, navFilter }) => {
              const count = statusCounts[key as keyof typeof statusCounts]
              const pct = totalAtivos > 0 && key !== 'inativo'
                ? Math.round((count / totalAtivos) * 100)
                : 0
              return (
                <button
                  key={key}
                  onClick={() => navigate(`/leads?filter=${navFilter}`)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer touch-manipulation"
                >
                  <span className="font-display font-bold text-lg text-navy">
                    {leadsLoading ? '—' : count}
                  </span>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[10px] text-muted font-display font-semibold text-center leading-tight">
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Vagas Críticas */}
        {!turmasLoading && turmasCriticas.length > 0 && (
          <div className="section-card p-4">
            <h2 className="font-display font-bold text-navy text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              Vagas Críticas
            </h2>
            <div className="space-y-2">
              {turmasCriticas.map((t) => {
                const marca = t.marca ? MARCA_BADGES[t.marca] : null
                const esgotada = (t.vagas_disponiveis ?? 0) === 0
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    {marca && (
                      <span
                        className="shrink-0 px-2 py-0.5 rounded text-xs font-display font-bold text-white"
                        style={{ backgroundColor: marca.bg }}
                      >
                        {marca.label}
                      </span>
                    )}
                    <p className="text-xs font-display font-semibold text-navy flex-1 truncate">
                      {t.nome_treinamento}
                    </p>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {esgotada && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                      )}
                      <span className={`text-xs font-display font-bold ${esgotada ? 'text-red-600' : 'text-yellow-600'}`}>
                        {t.vagas_disponiveis ?? 0} vaga{(t.vagas_disponiveis ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}


        {/* Ocupação das turmas */}
        {!turmasLoading && turmasAbertas.length > 0 && (
          <div className="section-card p-4">
            <h2 className="font-display font-bold text-navy text-sm mb-1 uppercase tracking-wide flex items-center gap-2">
              <BarChart2 size={15} className="text-orange" />
              Ocupação das Turmas
            </h2>
            <p className="text-xs text-muted mb-4">Percentual de vagas preenchidas</p>
            <div className="space-y-4">
              {turmasAbertas.map((t) => {
                const total_v = t.vagas_total ?? 0
                const disp    = t.vagas_disponiveis ?? 0
                const ocup    = total_v > 0 ? total_v - disp : 0
                const pct     = total_v > 0 ? Math.round((ocup / total_v) * 100) : 0
                const marca   = t.marca ? MARCA_BADGES[t.marca] : null
                const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f97316' : '#3b82f6'
                return (
                  <div key={t.id}>
                    <div className="flex items-center gap-2 mb-1">
                      {marca && (
                        <span
                          className="shrink-0 px-2 py-0.5 rounded text-xs font-display font-bold text-white"
                          style={{ backgroundColor: marca.bg }}
                        >
                          {marca.label}
                        </span>
                      )}
                      <p className="text-xs font-display font-semibold text-navy truncate flex-1">
                        {t.nome_treinamento}
                      </p>
                      <span className="text-xs font-display font-bold text-navy shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">{ocup}/{total_v} vagas · {t.cidade}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
