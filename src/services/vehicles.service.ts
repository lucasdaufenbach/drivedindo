import { supabase } from './supabase'
import type { Database } from '@types/database.types'

type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']

export const vehiclesService = {
  async create(vehicle: VehicleInsert) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single()

    if (error) throw error

    // Adicionar criador como owner
    await supabase.from('vehicle_users').insert({
      vehicle_id: data.id,
      user_id: vehicle.created_by,
      role: 'owner',
    })

    return data
  },

  async listForUser(userId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_users!inner(user_id, role, is_active)
      `)
      .eq('vehicle_users.user_id', userId)
      .eq('vehicle_users.is_active', true)

    if (error) throw error
    return data ?? []
  },

  async getById(vehicleId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_users(
          id, user_id, role, joined_at, is_active,
          profiles!vehicle_users_user_id_fkey(id, full_name, avatar_url, phone)
        )
      `)
      .eq('id', vehicleId)
      .single()

    if (error) throw error
    return data
  },

  async addMember(vehicleId: string, userId: string) {
    const { data, error } = await supabase
      .from('vehicle_users')
      .insert({ vehicle_id: vehicleId, user_id: userId, role: 'member' })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeMember(vehicleId: string, userId: string) {
    const { error } = await supabase
      .from('vehicle_users')
      .update({ is_active: false })
      .eq('vehicle_id', vehicleId)
      .eq('user_id', userId)

    if (error) throw error
  },
}
