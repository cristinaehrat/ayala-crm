import { useState } from 'react'
import { useUpdateTurma } from '@/hooks/useTurmas'
import { Check, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CampoManualEditor({
  turmaId,
  field,
  value,
  label,
}: {
  turmaId: string
  field: 'valor_recebido_isa_monteiro' | 'valor_recebido_isa_mg'
  value: number | null
  label: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))
  const update = useUpdateTurma()

  async function save() {
    const n = parseFloat(draft.replace(',', '.'))
    if (isNaN(n)) return
    const patch = field === 'valor_recebido_isa_monteiro'
      ? { valor_recebido_isa_monteiro: n }
      : { valor_recebido_isa_mg: n }
    await update.mutateAsync({ id: turmaId, data: patch })
    toast.success('Salvo')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 print:hidden">
        <span className="text-xs text-muted">R$</span>
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="input-field py-0.5 px-2 text-xs w-28"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button
          onClick={save}
          disabled={update.isPending}
          className="text-orange hover:text-orange2 cursor-pointer"
          aria-label="Salvar"
        >
          <Check size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(String(value ?? '')); setEditing(true) }}
      className="flex items-center gap-1 text-xs text-muted hover:text-white cursor-pointer"
    >
      <span>{label}: {value !== null ? brl(value) : '—'}</span>
      <Edit2 size={11} className="print:hidden" />
    </button>
  )
}
