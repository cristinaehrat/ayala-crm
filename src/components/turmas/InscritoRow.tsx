import type { Inscrito } from '@/lib/types'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  inscrito: Inscrito
  onClick?: () => void
}

const STATUS_COLORS: Record<string, string> = {
  pago:         'text-green-400',
  pendente:     'text-yellow-400',
  inadimplente: 'text-red-400',
}

export default function InscritoRow({ inscrito, onClick }: Props) {
  const temSaldo = (inscrito.saldo_a_receber ?? 0) > 0
  const statusColor = inscrito.status_financeiro
    ? STATUS_COLORS[inscrito.status_financeiro] ?? 'text-muted'
    : 'text-muted'

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 ${
        onClick ? 'cursor-pointer hover:bg-white/5 rounded-lg px-1 -mx-1 transition-colors' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display font-semibold text-sm text-white truncate">
            {inscrito.nome ?? '—'}
          </p>
          {temSaldo && <AlertCircle size={13} className="text-orange shrink-0" />}
          {inscrito.comprovante_validado && <CheckCircle2 size={13} className="text-green-400 shrink-0" />}
        </div>
        <p className="text-xs text-muted truncate">{inscrito.empresa_oficina}</p>
      </div>

      <div className="text-right shrink-0 ml-3">
        <p className={`text-xs font-display font-bold ${statusColor}`}>
          {inscrito.status_financeiro ?? '—'}
        </p>
        {temSaldo && (
          <p className="text-xs text-orange font-semibold">
            R$ {(inscrito.saldo_a_receber ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>
    </div>
  )
}
