import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import LeadDetail from './LeadDetail'

interface Props {
  leadId: string | null
  onClose: () => void
}

export default function LeadDetailModal({ leadId, onClose }: Props) {
  return (
    <Dialog.Root open={!!leadId} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content
          className={cn(
            'fixed z-50 bg-navy focus:outline-none overflow-hidden',
            'inset-0',
            'md:inset-auto md:left-1/2 md:top-1/2',
            'md:-translate-x-1/2 md:-translate-y-1/2',
            'md:w-[700px] md:max-w-[calc(100vw-2rem)] md:h-[90vh]',
            'md:rounded-2xl md:border md:border-white/10 md:shadow-2xl',
          )}
          aria-label="Detalhe do lead"
        >
          {leadId && <LeadDetail leadId={leadId} onClose={onClose} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
