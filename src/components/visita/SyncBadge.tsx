import { useOfflineSync } from '@/hooks/useOfflineSync'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function SyncBadge() {
  const { isOnline, pendingCount, syncAll } = useOfflineSync()

  if (isOnline && pendingCount === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      {!isOnline && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-900/50 border border-red-700/50">
          <WifiOff size={11} className="text-red-400" />
          <span className="text-xs font-display font-semibold text-red-400">Offline</span>
        </div>
      )}
      {pendingCount > 0 && (
        <button
          onClick={syncAll}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange/20 border border-orange/40 cursor-pointer hover:bg-orange/30 transition-colors"
        >
          <RefreshCw size={11} className="text-orange" />
          <span className="text-xs font-display font-semibold text-orange">
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </span>
        </button>
      )}
    </div>
  )
}
