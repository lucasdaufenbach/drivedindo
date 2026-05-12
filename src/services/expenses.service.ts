import { supabase } from './supabase'
import type { Database } from '@types/database.types'

type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type ParticipantInsert = Database['public']['Tables']['expense_participants']['Insert']

export const expensesService = {
  /**
   * Cria despesa e seus participantes atomicamente.
   * Os percentuais e amounts são calculados antes de chamar este serviço.
   */
  async createExpenseWithParticipants(
    expense: ExpenseInsert,
    participants: ParticipantInsert[]
  ) {
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    if (expenseError) throw expenseError

    const participantsWithId = participants.map(p => ({
      ...p,
      expense_id: expenseData.id,
    }))

    const { error: participantsError } = await supabase
      .from('expense_participants')
      .insert(participantsWithId)

    if (participantsError) throw participantsError

    return expenseData
  },

  async listByVehicle(vehicleId: string, limit = 20, cursor?: string) {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        expense_categories(id, name, icon, color),
        profiles!expenses_paid_by_fkey(id, full_name, avatar_url),
        expense_participants(
          id, user_id, percentage, amount_owed,
          profiles!expense_participants_user_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('vehicle_id', vehicleId)
      .order('expense_date', { ascending: false })
      .limit(limit)

    if (cursor) {
      query = query.lt('expense_date', cursor)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data ?? []
  },

  /**
   * Retorna dados brutos para cálculo de saldo.
   * Retorna: quanto cada usuário pagou e quanto deve.
   */
  async getBalanceData(vehicleId: string) {
    const { data, error } = await supabase
      .from('expense_participants')
      .select(`
        user_id,
        amount_owed,
        expenses!inner(
          vehicle_id,
          paid_by,
          amount
        )
      `)
      .eq('expenses.vehicle_id', vehicleId)

    if (error) throw error
    return data ?? []
  },
}
