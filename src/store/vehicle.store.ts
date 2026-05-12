import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Vehicle } from '@types/domain.types'

interface VehicleState {
  activeVehicleId: string | null
  vehicles: Vehicle[]
}

interface VehicleActions {
  setActiveVehicle: (vehicleId: string) => void
  setVehicles: (vehicles: Vehicle[]) => void
  clearVehicles: () => void
}

export const useVehicleStore = create<VehicleState & VehicleActions>()(
  persist(
    (set) => ({
      activeVehicleId: null,
      vehicles: [],

      setActiveVehicle: (vehicleId) => set({ activeVehicleId: vehicleId }),
      setVehicles: (vehicles) => set({ vehicles }),
      clearVehicles: () => set({ vehicles: [], activeVehicleId: null }),
    }),
    {
      name: 'vehicle-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
