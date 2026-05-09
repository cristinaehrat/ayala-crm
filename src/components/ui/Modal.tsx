import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, children, className }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-lg max-h-[90vh] overflow-y-auto',
            'bg-navy border border-white/10 rounded-2xl shadow-2xl',
            'focus:outline-none',
            className,
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-navy z-10">
            <Dialog.Title className="font-display font-bold text-white text-base">
              {title}
            </Dialog.Title>
            <Dialog.Close
              onClick={onClose}
              className="text-muted hover:text-white cursor-pointer transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
