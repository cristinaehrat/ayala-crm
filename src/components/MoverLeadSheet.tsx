import { useUpdateLeadStatus } from '@/hooks/useLeads'

const DESTINOS = [
  { value: 'lead_novo',            label: 'Lead Novo' },
  { value: 'qualificado',          label: 'Qualificado' },
  { value: 'aguardando_pagamento', label: 'Ag. Pagamento' },
  { value: 'inscrito',             label: 'Inscrito' },
  { value: 'lista_espera',         label: 'Lista de Espera' },
  { value: 'perdido',              label: 'Perdido' },
  { value: 'sem_interesse',        label: 'Sem Interesse' },
] as const

interface Props {
  leadId: string
  open: boolean
  onClose: () => void
}

export default function MoverLeadSheet({ leadId, open, onClose }: Props) {
  const updateStatus = useUpdateLeadStatus()

  if (!open) return null

  async function handleMover(status: string) {
    await updateStatus.mutateAsync({ id: leadId, status })
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed bottom-0 left-0 right-0 bg-footer border-t border-white/10 rounded-t-2xl z-50 p-4">
        <p className="font-display font-bold text-white text-base mb-4">Mover para...</p>
        {DESTINOS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleMover(value)}
            disabled={updateStatus.isPending}
            className="w-full min-h-[48px] rounded-lg btn-secondary text-sm text-left px-4 mb-2 disabled:opacity-50"
          >
            {label}
          </button>
        ))}
        <button
          onClick={onClose}
          className="w-full min-h-[48px] rounded-lg text-muted font-display font-semibold text-sm mt-1 cursor-pointer hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </>
  )
}
