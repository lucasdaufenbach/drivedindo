import { useQuery } from '@tanstack/react-query'
import { tripsService } from '@services/trips.service'
import { pendingKmService } from '@services/pending-km.service'
import { useAuthStore } from '@store/auth.store'

export function useDashboard(vehicleId: string | null) {
  const { profile } = useAuthStore()

  const activeTripQuery = useQuery({
    queryKey: ['trips', 'active', vehicleId, profile?.id],
    queryFn: () => tripsService.getOpenTrip(vehicleId!, profile!.id),
    enabled: !!vehicleId && !!profile?.id,
  })

  const pendingKmQuery = useQuery({
    queryKey: ['pending-km', vehicleId],
    queryFn: () => pendingKmService.listPending(vehicleId!),
    enabled: !!vehicleId,
  })

  const isLoading = activeTripQuery.isLoading || pendingKmQuery.isLoading

  function refetch() {
    activeTripQuery.refetch()
    pendingKmQuery.refetch()
  }

  return {
    activeTrip: activeTripQuery.data ?? null,
    pendingCount: pendingKmQuery.data?.length ?? 0,
    isLoading,
    refetch,
  }
}
