import type { Database } from './database.types'

// Extrair Row types do banco
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleUser = Database['public']['Tables']['vehicle_users']['Row']
export type Trip = Database['public']['Tables']['trips']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseParticipant = Database['public']['Tables']['expense_participants']['Row']
export type PendingKm = Database['public']['Tables']['pending_km']['Row']
export type Settlement = Database['public']['Tables']['settlements']['Row']
export type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row']

// Domain types compostos
export interface VehicleMember {
  profile: Profile
  vehicleUser: VehicleUser
}

export interface TripWithUser extends Trip {
  profile: Profile
}

export interface ExpenseWithDetails extends Expense {
  category: ExpenseCategory | null
  payer: Profile
  participants: (ExpenseParticipant & { profile: Profile })[]
}

// Tipos de cálculo financeiro
export interface UserKmSummary {
  userId: string
  userName: string
  kmDriven: number
}

export interface UserPercentage extends UserKmSummary {
  percentage: number
}

export interface UserBalance {
  userId: string
  userName: string
  avatarUrl: string | null
  balance: number          // positivo = credor, negativo = devedor
  totalPaid: number
  totalOwed: number
}

export interface SettlementSuggestion {
  from: UserBalance
  to: UserBalance
  amount: number
}

// Fila offline
export type OfflineOperationType = 'START_TRIP' | 'END_TRIP' | 'ADD_EXPENSE'

export interface OfflineOperation {
  id: string
  type: OfflineOperationType
  payload: Record<string, unknown>
  createdAt: string
  attempts: number
}

// Formulários
export interface StartTripFormData {
  vehicleId: string
  kmStart: number
  notes?: string
}

export interface EndTripFormData {
  kmEnd: number
  notes?: string
}

export interface AddExpenseFormData {
  vehicleId: string
  categoryId: string
  amount: number
  description?: string
  expenseDate: string
  paidBy: string
  // divisão manual opcional — se vazia usa percentuais automáticos
  customParticipants?: Array<{ userId: string; percentage: number }>
}
