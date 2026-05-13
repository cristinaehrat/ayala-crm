import { useLeads } from '@/hooks/useLeads'
import { useTurmas } from '@/hooks/useTurmas'
import { useFinanceiro } from '@/hooks/useFinanceiro'
import { Eye, Clock, DollarSign, AlertTriangle, BarChart2, ChevronRight } from 'lucide-react'
import { MARCA_BADGES } from '@/lib/utils'
import { Link, useNavigate } from 'react-router-dom'

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: leads = [], isLoading: leadsLoading } = useLeads('todos')
  const { data: turmas = [], isLoading: turmasLoading } = useTurmas()
  const { data: financeiro } = useFinanceiro()

  const visPreco  = leads.filter((l) => l.etiqueta_chatwoot?.toLowerCase().includes('visualizou_preco')).length
  const agIsmenia = leads.filter((l) => l.etiqueta_chatwoot?.toLowerCase().includes('aguardando_ismenia')).length

  const turmasAbertas = turmas.filter((t) => t.status === 'aberta')
  const turmasCriticas = turmasAbertas.filter((t) => (t.vagas_disponiveis ?? 0) <= 5)

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

        {/* Faturamento por Turma */}
        {financeiro && turmasAbertas.length > 0 && (
          <div className="section-card p-4">
            <h2 className="font-display font-bold text-navy text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
              <DollarSign size={15} className="text-orange" />
              Faturamento — Turmas Abertas
            </h2>
            <div className="space-y-3">
              {financeiro.turmas
                .filter((tf) => tf.turma.status === 'aberta')
                .map(({ turma, receita_total }) => {
                  const marca = turma.marca ? MARCA_BADGES[turma.marca] : null
                  return (
                    <div
                      key={turma.id}
                      onClick={() => navigate(`/turmas?turma=${turma.id}`)}
                      className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2 py-1 -my-1 transition-colors"
                    >
                      {marca && (
                        <span
                          className="shrink-0 px-2 py-0.5 rounded text-xs font-display font-bold text-white"
                          style={{ backgroundColor: marca.bg }}
                        >
                          {marca.label}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-semibold text-navy truncate">
                          {turma.nome_treinamento}
                        </p>
                        <p className="text-xs text-muted">{turma.vagas_disponiveis ?? 0} vagas disponíveis</p>
                      </div>
                      <p className="text-xs font-display font-bold text-orange shrink-0">
                        {brl(receita_total)}
                      </p>
                      <ChevronRight size={13} className="text-muted shrink-0" />
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
