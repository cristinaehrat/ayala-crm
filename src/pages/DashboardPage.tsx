import { useLeads } from '@/hooks/useLeads'
import { useTurmas } from '@/hooks/useTurmas'
import { Users, TrendingUp, GraduationCap, Clock } from 'lucide-react'
import { MARCA_BADGES } from '@/lib/utils'

export default function DashboardPage() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads('todos')
  const { data: turmas = [], isLoading: turmasLoading } = useTurmas()

  const total = leads.length
  const qualificados = leads.filter((l) => l.status === 'qualificado').length
  const inscritos = leads.filter((l) => l.status === 'inscrito' || l.etiqueta_chatwoot === 'inscrito').length
  const agIsmenia = leads.filter((l) => l.status === 'aguardando_ismenia').length

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
    <div className="h-full md:ml-56 overflow-y-auto p-4">
      <h1 className="font-display font-bold text-white text-lg mb-5">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard
          icon={<Users size={18} />}
          label="Total Leads"
          value={total}
          loading={leadsLoading}
          color="text-orange"
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label="Qualificados"
          value={qualificados}
          loading={leadsLoading}
          color="text-blue-400"
        />
        <MetricCard
          icon={<GraduationCap size={18} />}
          label="Inscritos"
          value={inscritos}
          loading={leadsLoading}
          color="text-green-400"
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Ag. Ismênia"
          value={agIsmenia}
          loading={leadsLoading}
          color="text-yellow-400"
        />
      </div>

      {/* Funil por origem */}
      {origens.length > 0 && (
        <div className="section-card p-4 mb-6">
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

      {/* Turmas abertas */}
      {!turmasLoading && turmasAbertas.length > 0 && (
        <div className="section-card p-4">
          <h2 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wide">
            Turmas Abertas
          </h2>
          <div className="space-y-3">
            {turmasAbertas.map((t) => {
              const total_v = t.vagas_total ?? 0
              const disp = t.vagas_disponiveis ?? 0
              const pct = total_v > 0 ? Math.round(((total_v - disp) / total_v) * 100) : 0
              const marca = t.marca ? MARCA_BADGES[t.marca] : null
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
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display font-semibold text-white truncate">
                      {t.nome_treinamento}
                    </p>
                    <p className="text-xs text-muted">{t.cidade}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-display font-bold text-white">{disp} vagas</p>
                    <div className="w-16 h-1 bg-white/10 rounded-full mt-1">
                      <div
                        className="h-full bg-orange rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  icon, label, value, loading, color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  loading: boolean
  color: string
}) {
  return (
    <div className="section-card p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="font-display font-bold text-2xl text-white">
        {loading ? '—' : value}
      </p>
      <p className="text-xs text-muted font-display font-semibold mt-0.5">{label}</p>
    </div>
  )
}
