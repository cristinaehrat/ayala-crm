import { useLeads } from '@/hooks/useLeads'
import { useTurmas } from '@/hooks/useTurmas'
import { Users, TrendingUp, GraduationCap, Clock, Flame, DollarSign, BarChart2 } from 'lucide-react'
import { MARCA_BADGES } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads('todos')
  const { data: turmas = [], isLoading: turmasLoading } = useTurmas()

  const total        = leads.length
  const qualificados = leads.filter((l) => l.status === 'qualificado').length
  const inscritos    = leads.filter((l) => l.status === 'inscrito' || l.etiqueta_chatwoot === 'inscrito').length
  const agIsmenia    = leads.filter((l) => l.status === 'aguardando_ismenia').length
  const hotLeads     = leads.filter((l) => l.etiqueta_chatwoot === 'hot_lead').length
  const agPagamento  = leads.filter((l) => l.etiqueta_chatwoot === 'aguardando_pagamento').length

  const origens = [
    { label: 'Meta Joinville', count: leads.filter((l) => l.canal_origem?.includes('joinville')).length },
    { label: 'Meta Curitiba',  count: leads.filter((l) => l.canal_origem?.includes('curitiba')).length },
    { label: 'Visita',         count: leads.filter((l) => l.origem === 'visita').length },
    { label: 'Indicação',      count: leads.filter((l) => l.canal_origem?.includes('indicac')).length },
    { label: 'Outros',         count: leads.filter((l) =>
      !l.canal_origem?.includes('joinville') &&
      !l.canal_origem?.includes('curitiba') &&
      l.origem !== 'visita' &&
      !l.canal_origem?.includes('indicac')).length },
  ].filter((o) => o.count > 0)

  const maxOrigem = Math.max(...origens.map((o) => o.count), 1)
  const turmasAbertas = turmas.filter((t) => t.status === 'aberta')

  return (
    <div className="h-full md:ml-56 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="font-display font-bold text-white text-lg">Dashboard</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {(
          <>
            {/* Row 1 — Pipeline */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={<Users size={18} />}         label="Total Leads"  value={total}        loading={leadsLoading} color="text-orange"       linkTo="/leads" />
              <MetricCard icon={<TrendingUp size={18} />}    label="Qualificados" value={qualificados} loading={leadsLoading} color="text-blue-400"    linkTo="/leads?filter=qualificados" />
              <MetricCard icon={<GraduationCap size={18} />} label="Inscritos"    value={inscritos}    loading={leadsLoading} color="text-green-400"   linkTo="/leads?filter=inscrito" />
              <MetricCard icon={<Clock size={18} />}          label="Ag. Ismênia"  value={agIsmenia}    loading={leadsLoading} color="text-yellow-400"  linkTo="/leads?filter=ag_ismenia" />
            </div>

            {/* Row 2 — Ação imediata */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={<Flame size={18} />}
                label="Hot Leads"
                value={hotLeads}
                loading={leadsLoading}
                color="text-red-400"
                highlight
                linkTo="/leads?filter=hot_lead"
              />
              <MetricCard
                icon={<DollarSign size={18} />}
                label="Ag. Pagamento"
                value={agPagamento}
                loading={leadsLoading}
                color="text-yellow-300"
                highlight
                linkTo="/leads?filter=aguardando_pagamento"
              />
            </div>

            {/* Funil por origem */}
            {origens.length > 0 && (
              <div className="section-card p-4">
                <h2 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wide">
                  Origem dos Leads
                </h2>
                <div className="space-y-3">
                  {origens.map(({ label, count }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white font-display font-semibold">{label}</span>
                        <span className="text-muted">{count}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange rounded-full transition-all"
                          style={{ width: `${(count / maxOrigem) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ocupação das turmas */}
            {!turmasLoading && turmasAbertas.length > 0 && (
              <div className="section-card p-4">
                <h2 className="font-display font-bold text-white text-sm mb-1 uppercase tracking-wide flex items-center gap-2">
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
                          <p className="text-xs font-display font-semibold text-white truncate flex-1">
                            {t.nome_treinamento}
                          </p>
                          <span className="text-xs font-display font-bold text-white shrink-0">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
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
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  icon, label, value, loading, color, highlight, linkTo,
}: {
  icon: React.ReactNode
  label: string
  value: number
  loading: boolean
  color: string
  highlight?: boolean
  linkTo?: string
}) {
  const content = (
    <div className={`section-card p-4 transition-colors ${
      highlight && value > 0 ? 'border-orange/40' : ''
    } ${linkTo ? 'hover:border-orange/60 hover:bg-white/10 cursor-pointer' : ''}`}>
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className={`font-display font-bold text-2xl ${highlight && value > 0 ? 'text-orange' : 'text-white'}`}>
        {loading ? '—' : value}
      </p>
      <p className="text-xs text-muted font-display font-semibold mt-0.5">{label}</p>
    </div>
  )

  if (linkTo) return <Link to={linkTo}>{content}</Link>
  return content
}
