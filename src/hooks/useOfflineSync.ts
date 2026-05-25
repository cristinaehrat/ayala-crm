import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/dexie'
import { persistProspectoPayload } from '@/lib/prospectos'
import { toast } from 'sonner'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const pending = useLiveQuery(() => db.pendentes.where('syncStatus').equals('pendente').toArray())

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Sync automático ao reconectar
  useEffect(() => {
    if (!isOnline || !pending?.length) return
    syncAll()
  }, [isOnline, pending?.length])

  async function syncAll() {
    const items = await db.pendentes.where('syncStatus').equals('pendente').toArray()
    if (!items.length) return

    let synced = 0
    for (const item of items) {
      try {
        await db.pendentes.update(item.id!, { syncStatus: 'sincronizando' })
        await persistProspectoPayload(item.payload)
        await db.pendentes.delete(item.id!)
        synced++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await db.pendentes.update(item.id!, { syncStatus: 'erro', errorMsg: msg })
      }
    }

    if (synced > 0) {
      toast.success(`${synced} visita(s) sincronizada(s) com sucesso!`)
    }
  }

  return {
    isOnline,
    pendingCount: pending?.length ?? 0,
    syncAll,
  }
}
