import Dexie, { type Table } from 'dexie'

export interface PendingVisita {
  id?: number
  tempId: string
  payload: Record<string, unknown>
  createdAt: string
  syncStatus: 'pendente' | 'sincronizando' | 'erro'
  errorMsg?: string
}

class VisitaDB extends Dexie {
  pendentes!: Table<PendingVisita>

  constructor() {
    super('AyalaCRM')
    this.version(1).stores({
      pendentes: '++id, tempId, syncStatus, createdAt',
    })
  }
}

export const db = new VisitaDB()
