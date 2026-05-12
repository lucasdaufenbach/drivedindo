import { supabase } from './supabase'
import type { Database } from '@types/database.types'

type TripInsert = Database['public']['Tables']['trips']['Insert']
type TripUpdate = Database['public']['Tables']['trips']['Update']

export const tripsService = {
  /**
   * Busca a última viagem fechada do veículo para detectar km gap.
   */
  async getLastClosedTrip(vehicleId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'closed')
      .order('km_end', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Busca viagem aberta do usuário no veículo (se houver).
   */
  async getOpenTrip(vehicleId: string, userId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('user_id', userId)
      .eq('status', 'open')
      .maybeSingle()

    if (error) throw error
    return data
  },

  async startTrip(payload: TripInsert) {
    const { data, error } = await supabase
      .from('trips')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async endTrip(tripId: string, update: TripUpdate) {
    const { data, error } = await supabase
      .from('trips')
      .update({ ...update, status: 'closed', ended_at: new Date().toISOString() })
      .eq('id', tripId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async listByVehicle(vehicleId: string, limit = 20, cursor?: string) {
    let query = supabase
      .from('trips')
      .select('*, profiles!trips_user_id_fkey(id, full_name, avatar_url)')
      .eq('vehicle_id', vehicleId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (cursor) {
      query = query.lt('started_at', cursor)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  /**
   * Soma de km por usuário em um período.
   * Usado para calcular percentuais de uso.
   */
  async getKmSummaryByUser(vehicleId: string, from?: string, to?: string) {
    let query = supabase
      .from('trips')
      .select('user_id, km_driven, profiles!trips_user_id_fkey(full_name, avatar_url)')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'closed')
      .not('km_driven', 'is', null)

    if (from) query = query.gte('ended_at', from)
    if (to) query = query.lte('ended_at', to)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },
}
