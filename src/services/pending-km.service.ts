import { supabase } from './supabase'
import type { Database } from '@types/database.types'

type PendingKmInsert = Database['public']['Tables']['pending_km']['Insert']
type PendingKmUpdate = Database['public']['Tables']['pending_km']['Update']

export const pendingKmService = {
  async create(pending: PendingKmInsert) {
    const { data, error } = await supabase
      .from('pending_km')
      .insert(pending)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async listPending(vehicleId: string) {
    const { data, error } = await supabase
      .from('pending_km')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'pending')
      .order('detected_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async resolve(
    pendingId: string,
    update: PendingKmUpdate & { resolved_by: string }
  ) {
    const { data, error } = await supabase
      .from('pending_km')
      .update({
        ...update,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', pendingId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
