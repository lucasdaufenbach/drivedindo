import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Car, ChevronRight, Check } from 'lucide-react-native'
import { vehiclesService } from '@services/vehicles.service'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { formatKm } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function VehiclesScreen() {
  const { profile } = useAuthStore()
  const { activeVehicleId, setActiveVehicle, setVehicles } = useVehicleStore()

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles', profile?.id],
    queryFn: async () => {
      const data = await vehiclesService.listForUser(profile!.id)
      setVehicles(data as any)
      return data
    },
    enabled: !!profile?.id,
  })

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Veículos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/vehicles/new')}>
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[8] }} />
      ) : !vehicles?.length ? (
        <View style={styles.empty}>
          <Car size={48} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhum veículo</Text>
          <Text style={styles.emptySub}>Cadastre o seu primeiro veículo para começar</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/vehicles/new')}>
            <Text style={styles.emptyBtnText}>Cadastrar Veículo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing[5], gap: spacing[3] }}
          renderItem={({ item }) => {
            const isActive = item.id === activeVehicleId
            return (
              <TouchableOpacity
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => router.push(`/(app)/vehicles/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                  <Car size={22} color={isActive ? colors.white : colors.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.vehicleName}>{item.name}</Text>
                  <Text style={styles.vehiclePlate}>{item.plate} • {formatKm(Number(item.current_km))}</Text>
                </View>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Check size={14} color={colors.white} />
                    <Text style={styles.activeBadgeText}>Ativo</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => setActiveVehicle(item.id)}
                  >
                    <Text style={styles.selectBtnText}>Usar</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  title: { fontSize: typography.sizes['2xl'], fontFamily: typography.fonts.bold, color: colors.gray900 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[3], ...shadows.sm },
  cardActive: { borderWidth: 2, borderColor: colors.primary },
  iconBox: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.primaryLight + '30', alignItems: 'center', justifyContent: 'center' },
  iconBoxActive: { backgroundColor: colors.primary },
  info: { flex: 1 },
  vehicleName: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.gray900 },
  vehiclePlate: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.gray500, marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radius.full },
  activeBadgeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold, color: colors.white },
  selectBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary },
  selectBtnText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8], gap: spacing[3] },
  emptyTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, color: colors.gray900 },
  emptySub: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.gray500, textAlign: 'center' },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: radius.lg, marginTop: spacing[2] },
  emptyBtnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
})
