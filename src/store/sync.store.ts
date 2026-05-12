import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { OfflineOperation, OfflineOperationType } from '@types/domain.types'
import { tripsService } from '@services/trips.service'
import { expensesService } from '@services/expenses.service'

interface SyncState {
  queue: OfflineOperation[]
  isSyncing: boolean
}

interface SyncActions {
  enqueue: (type: OfflineOperationType, payload: Record<string, unknown>) => void
  processQueue: () => Promise<void>
  clearQueue: () => void
}

export const useSyncStore = create<SyncState & SyncActions>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,

      enqueue: (type, payload) => {
        const operation: OfflineOperation = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type,
          payload,
          createdAt: new Date().toISOString(),
          attempts: 0,
        }
        set((state) => ({ queue: [...state.queue, operation] }))
      },

      processQueue: async () => {
        const { queue, isSyncing } = get()
        if (isSyncing || queue.length === 0) return

        set({ isSyncing: true })
        try {
          for (const operation of queue) {
            try {
              await executeOperation(operation)
              // Remover da fila após sucesso
              set((state) => ({
                queue: state.queue.filter((op) => op.id !== operation.id),
              }))
            } catch {
              // Incrementar tentativas — máximo 3
              set((state) => ({
                queue: state.queue.map((op) =>
                  op.id === operation.id
                    ? { ...op, attempts: op.attempts + 1 }
                    : op
                ),
              }))
            }
          }
          // Remover operações com muitas falhas
          set((state) => ({
            queue: state.queue.filter((op) => op.attempts < 3),
          }))
        } finally {
          set({ isSyncing: false })
        }
      },

      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

async function executeOperation(op: OfflineOperation): Promise<void> {
  switch (op.type) {
    case 'START_TRIP':
      await tripsService.startTrip(op.payload as Parameters<typeof tripsService.startTrip>[0])
      break
    case 'END_TRIP': {
      const { tripId, ...update } = op.payload as { tripId: string } & Record<string, unknown>
      await tripsService.endTrip(tripId, update as Parameters<typeof tripsService.endTrip>[1])
      break
    }
    case 'ADD_EXPENSE': {
      const { expense, participants } = op.payload as {
        expense: Parameters<typeof expensesService.createExpenseWithParticipants>[0]
        participants: Parameters<typeof expensesService.createExpenseWithParticipants>[1]
      }
      await expensesService.createExpenseWithParticipants(expense, participants)
      break
    }
    default:
      throw new Error(`Operação desconhecida: ${op.type}`)
  }
}
