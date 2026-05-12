import { supabase } from './supabase'
import type { Database } from '@types/database.types'

type SettlementInsert = Database['public']['Tables']['settlements']['Insert']

export const balanceService = {
  async createSettlement(settlement: SettlementInsert) {
    const { data, error } = await supabase
      .from('settlements')
      .insert(settlement)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async listSettlements(vehicleId: string) {
    const { data, error } = await supabase
      .from('settlements')
      .select(`
        *,
        payer:profiles!settlements_paid_by_fkey(id, full_name, avatar_url),
        payee:profiles!settlements_paid_to_fkey(id, full_name, avatar_url)
      `)
      .eq('vehicle_id', vehicleId)
      .order('settled_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },
}
