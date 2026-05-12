import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@services/supabase'

/**
 * Assina mudanças realtime de um veículo.
 * Invalida as queries relevantes automaticamente.
 */
export function useVehicleRealtime(vehicleId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!vehicleId) return

    const channel = supabase
      .channel(`vehicle:${vehicleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `vehicle_id=eq.${vehicleId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['trips', vehicleId] })
        queryClient.invalidateQueries({ queryKey: ['trips', 'active', vehicleId] })
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'expenses',
        filter: `vehicle_id=eq.${vehicleId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['expenses', vehicleId] })
        queryClient.invalidateQueries({ queryKey: ['balance-data', vehicleId] })
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pending_km',
        filter: `vehicle_id=eq.${vehicleId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['pending-km', vehicleId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vehicleId, queryClient])
}
