import { useQuery } from '@tanstack/react-query'
import { pendingKmService } from '@services/pending-km.service'
import { useVehicleStore } from '@store/vehicle.store'

export function usePendingKmCount() {
  const { activeVehicleId } = useVehicleStore()

  const { data } = useQuery({
    queryKey: ['pending-km', activeVehicleId],
    queryFn: () => pendingKmService.listPending(activeVehicleId!),
    enabled: !!activeVehicleId,
  })

  return data?.length ?? 0
}
