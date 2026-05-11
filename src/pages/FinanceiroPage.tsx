import { useState } from 'react'
import { useFinanceiro, useDespesasMes } from '@/hooks/useFinanceiro'
import { useUpdateTurma } from '@/hooks/useTurmas'
import { MARCA_BADGES } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Check, Edit2, Building2, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function SummaryCard({
  label,
  value,
  icon,
  highlight,
  colorClass,
}: {
  label: string
  value: number
  icon: React.ReactNode
  highlight?: boolean
  colorClass?: string
}) {
  return (
    <div className={`section-card p-4 cursor-pointer hover:border-orange/30 transition-colors ${highlight ? 'border-orange/30' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-display font-semibold text-muted uppercase tracking-wide">{label}</span>
        <span className={highlight ? 'text-orange' : colorClass ?? 'text-muted'}>{icon}</span>
      </div>
      <p className={`font-display font-bold text-lg ${colorClass ?? (highlight ? 'text-orange' : 'text-white')}`}>
        {brl(value)}
      </p>
    </div>
  )
}

function DespesasEditor({ turmaId, value }: { turmaId: string; value: number | null }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? 0))
  const update = useUpdateTurma()

  async function save() {
    const n = parseFloat(draft.replace(',', '.'))
    if (isNaN(n)) return
    await update.mutateAsync({ id: turmaId, data: { despesas_operacionais_total: n } })
    toast.success('Despesas atualizadas')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs text-muted">R$</span>
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="input-field py-0.5 px-2 text-xs w-28"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button onClick={save} className="text-orange hover:text-orange2 cursor-pointer" aria-label="Salvar">
          <Check size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(String(value ?? 0)); setEditing(true) }}
      className="flex items-center gap-1 text-xs text-muted hover:text-white cursor-pointer mt-1"
    >
      <span>Despesas: {brl(value ?? 0)}</span>
      <Edit2 size={11} />
    </button>
  )
}

export default function FinanceiroPage() {
  const { data, isLoading } = useFinanceiro()
  const { data: despesasMes = 0 } = useDespesasMes()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full md:ml-56">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const margemLiquida = data.total_recebido - despesasMes

  return (
    <div className="h-full overflow-y-auto md:ml-56 p-4 space-y-6">
      <h1 className="font-display font-bold text-white text-lg">Financeiro</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SummaryCard label="Receita"          value={data.total_receita}   icon={<DollarSign size={16} />} />
        <SummaryCard label="Recebido"         value={data.total_recebido}  icon={<TrendingUp size={16} />} />
        <SummaryCard label="A Receber"        value={data.total_a_receber} icon={<AlertCircle size={16} />} />
        <SummaryCard label="Despesas do Mês"  value={despesasMes}          icon={<Calendar size={16} />} colorClass="text-red-400" />
        <SummaryCard label="Desp. Operac."    value={data.total_despesas}  icon={<TrendingDown size={16} />} />
        <SummaryCard label="Margem Líquida"   value={margemLiquida}        icon={<TrendingUp size={16} />} highlight />
      </div>

      {/* Custódia da Entrada */}
      {(() => {
        const allInscritos = data.turmas.flatMap((t) => t.inscritos)
        const recIsm = allInscritos
          .filter((i) => i.custodia_entrada === 'Ayala' || i.custodia_entrada === null)
          .reduce((s, i) => s + (i.valor_entrada ?? 0), 0)
        const recPar = allInscritos
          .filter((i) => i.custodia_entrada === 'Parceiro')
          .reduce((s, i) => s + (i.valor_entrada ?? 0), 0)
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="section-card p-4 cursor-pointer hover:border-orange/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-orange" />
                <span className="text-xs font-display font-semibold text-muted uppercase tracking-wide">Recebido Ismênia</span>
              </div>
              <p className="font-display font-bold text-lg text-orange">{brl(recIsm)}</p>
            </div>
            <div className="section-card p-4 cursor-pointer hover:border-orange/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={14} className="text-blue-400" />
                <span className="text-xs font-display font-semibold text-muted uppercase tracking-wide">Recebido Parceiros</span>
              </div>
              <p className="font-display font-bold text-lg text-blue-400">{brl(recPar)}</p>
            </div>
          </div>
        )
      })()}

      {/* Turmas table */}
      <div className="section-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="font-display font-semibold text-white text-sm">Por Turma</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Turma', 'Marca', 'Inscritos', 'Receita', 'Recebido', 'A Receber', 'Despesas', 'Margem'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-display font-semibold text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.turmas.map(({ turma, inscritos, receita_total, recebido, a_receber, despesas, margem }) => {
                const badge = turma.marca ? MARCA_BADGES[turma.marca] : null
                return (
                  <tr key={turma.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-display font-semibold text-white text-xs leading-tight">
                        {turma.nome_treinamento ?? '—'}
                      </p>
                      <p className="text-muted text-xs">{turma.cidade}</p>
                      <DespesasEditor turmaId={turma.id} value={turma.despesas_operacionais_total} />
                    </td>
                    <td className="px-4 py-3">
                      {badge ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold text-white"
                          style={{ backgroundColor: badge.bg }}
                        >
                          {badge.label}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-white text-xs">{inscritos.length}</td>
                    <td className="px-4 py-3 text-white text-xs">{brl(receita_total)}</td>
                    <td className="px-4 py-3 text-green-400 text-xs">{brl(recebido)}</td>
                    <td className="px-4 py-3 text-yellow-400 text-xs">{brl(a_receber)}</td>
                    <td className="px-4 py-3 text-red-400 text-xs">{brl(despesas)}</td>
                    <td className={`px-4 py-3 text-xs font-display font-bold ${margem >= 0 ? 'text-orange' : 'text-red-400'}`}>
                      {brl(margem)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-white/5">
          {data.turmas.map(({ turma, inscritos, receita_total, recebido, a_receber, despesas, margem }) => {
            const badge = turma.marca ? MARCA_BADGES[turma.marca] : null
            return (
              <div key={turma.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold text-white text-sm">
                      {turma.nome_treinamento ?? '—'}
                    </p>
                    <p className="text-muted text-xs">{turma.cidade}</p>
                  </div>
                  {badge && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold text-white shrink-0"
                      style={{ backgroundColor: badge.bg }}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted">Inscritos: </span><span className="text-white">{inscritos.length}</span></div>
                  <div><span className="text-muted">Receita: </span><span className="text-white">{brl(receita_total)}</span></div>
                  <div><span className="text-muted">Recebido: </span><span className="text-green-400">{brl(recebido)}</span></div>
                  <div><span className="text-muted">A Receber: </span><span className="text-yellow-400">{brl(a_receber)}</span></div>
                  <div><span className="text-muted">Despesas: </span><span className="text-red-400">{brl(despesas)}</span></div>
                  <div>
                    <span className="text-muted">Margem: </span>
                    <span className={margem >= 0 ? 'text-orange font-bold' : 'text-red-400 font-bold'}>{brl(margem)}</span>
                  </div>
                </div>
                <DespesasEditor turmaId={turma.id} value={turma.despesas_operacionais_total} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
