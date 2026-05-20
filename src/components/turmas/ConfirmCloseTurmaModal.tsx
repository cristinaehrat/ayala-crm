import Modal from '@/components/ui/Modal'

interface Props {
  open: boolean
  inscritosCount: number
  pending: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export default function ConfirmCloseTurmaModal({
  open,
  inscritosCount,
  pending,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Encerrar Turma" className="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-white/80">
          Fechar turma com {inscritosCount} inscritos? Novas inscrições serão bloqueadas.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="btn-primary px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? 'Encerrando...' : 'Confirmar fechar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
