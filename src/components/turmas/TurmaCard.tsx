import { Calendar, MapPin, Users } from 'lucide-react'
import { MARCA_BADGES, formatDate } from '@/lib/utils'
import type { Turma } from '@/lib/types'

interface Props {
  turma: Turma
  onClick: () => void
  active?: boolean
}

export default function TurmaCard({ turma, onClick, active }: Props) {
  const total = turma.vagas_total ?? 0
  const disponiveis = turma.vagas_disponiveis ?? 0
  const ocupadas = total - disponiveis
  const pct = total > 0 ? Math.round((ocupadas / total) * 100) : 0
  const marca = turma.marca ? MARCA_BADGES[turma.marca] : null

  const barColor =
    pct >= 90 ? 'bg-red-500' :
    pct >= 70 ? 'bg-orange' :
    'bg-green-500'

  return (
    <div
      onClick={onClick}
      className={`section-card p-4 cursor-pointer hover:border-orange/40 transition-colors ${
        active ? 'border-orange' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-display font-bold text-white text-sm leading-tight">
            {turma.nome_treinamento ?? '—'}
          </h3>
          {marca && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold text-white mt-1"
              style={{ backgroundColor: marca.bg }}
            >
              {marca.label}
            </span>
          )}
        </div>
        <span
          className={`text-xs font-display font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
            turma.status === 'aberta'
              ? 'bg-green-900/50 text-green-400'
              : 'bg-white/10 text-muted'
          }`}
        >
          {turma.status ?? '—'}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-muted mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} />
          <span>
            {formatDate(turma.data_inicio)}
            {turma.data_fim ? ` → ${formatDate(turma.data_fim)}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} />
          <span>{turma.cidade ?? '—'}</span>
        </div>
      </div>

      {/* Vagas */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center gap-1 text-muted">
            <Users size={11} />
            <span>{ocupadas}/{total} vagas</span>
          </div>
          <span className={`font-display font-bold ${disponiveis === 0 ? 'text-red-400' : 'text-green-400'}`}>
            {disponiveis === 0 ? 'Lotada' : `${disponiveis} restantes`}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
