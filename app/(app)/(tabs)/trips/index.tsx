import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Navigation, Car } from 'lucide-react-native'
import { tripsService } from '@services/trips.service'
import { useVehicleStore } from '@store/vehicle.store'
import { formatKm, formatDateTime } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function TripsScreen() {
  const { activeVehicleId } = useVehicleStore()

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips', activeVehicleId],
    queryFn: () => tripsService.listByVehicle(activeVehicleId!, 30),
    enabled: !!activeVehicleId,
  })

  if (!activeVehicleId) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Viagens</Text></View>
      <View style={styles.empty}>
        <Car size={48} color={colors.gray300} />
        <Text style={styles.emptyTitle}>Nenhum veículo ativo</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/vehicles/index')}>
          <Text style={styles.emptyBtnText}>Selecionar Veículo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Viagens</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/trips/new')}>
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[8] }} />
      ) : !trips?.length ? (
        <View style={styles.empty}>
          <Navigation size={48} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhuma viagem</Text>
          <Text style={styles.emptySub}>Inicie uma viagem para registrar km</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/trips/new')}>
            <Text style={styles.emptyBtnText}>Iniciar Viagem</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing[5], gap: spacing[3] }}
          renderItem={({ item }) => {
            const isOpen = item.status === 'open'
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(app)/trips/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.statusDot, isOpen && styles.statusDotOpen]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Text style={styles.kmText}>{formatKm(Number(item.km_start))}</Text>
                    {item.km_end != null && (
                      <>
                        <Text style={styles.arrow}> → </Text>
                        <Text style={styles.kmText}>{formatKm(Number(item.km_end))}</Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.dateTxt}>{formatDateTime(item.started_at ?? '')}</Text>
                  {(item as any).profiles?.full_name && (
                    <Text style={styles.userTxt}>{(item as any).profiles.full_name}</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {item.km_driven != null && (
                    <Text style={styles.driven}>{formatKm(Number(item.km_driven))}</Text>
                  )}
                  <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
                    <Text style={[styles.badgeText, isOpen ? styles.badgeTextOpen : styles.badgeTextClosed]}>
                      {isOpen ? 'Aberta' : 'Concluída'}
                    </Text>
                  </View>
                </View>
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
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gray300 },
  statusDotOpen: { backgroundColor: colors.success },
  row: { flexDirection: 'row', alignItems: 'center' },
  kmText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.gray900 },
  arrow: { fontSize: typography.sizes.sm, color: colors.gray400 },
  dateTxt: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.gray500, marginTop: 2 },
  userTxt: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium, color: colors.primary, marginTop: 2 },
  driven: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, color: colors.secondary },
  badge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full },
  badgeOpen: { backgroundColor: colors.success + '20' },
  badgeClosed: { backgroundColor: colors.gray100 },
  badgeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium },
  badgeTextOpen: { color: colors.success },
  badgeTextClosed: { color: colors.gray500 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[8] },
  emptyTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, color: colors.gray900 },
  emptySub: { fontSize: typography.sizes.sm, color: colors.gray500, textAlign: 'center' },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: radius.lg, marginTop: spacing[2] },
  emptyBtnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
})
