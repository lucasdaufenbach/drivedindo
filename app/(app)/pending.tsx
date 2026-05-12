import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, CheckCircle, Clock } from 'lucide-react-native'
import { pendingKmService } from '@services/pending-km.service'
import { vehiclesService } from '@services/vehicles.service'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { formatKm } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function PendingScreen() {
  const { profile } = useAuthStore()
  const { activeVehicleId } = useVehicleStore()
  const queryClient = useQueryClient()

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', activeVehicleId],
    queryFn: () => vehiclesService.getById(activeVehicleId!),
    enabled: !!activeVehicleId,
  })

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pending-km', activeVehicleId],
    queryFn: () => pendingKmService.listPending(activeVehicleId!),
    enabled: !!activeVehicleId,
  })

  const members = (vehicle?.vehicle_users ?? []).filter((m: any) => m.is_active)

  const resolveMutation = useMutation({
    mutationFn: ({ id, type, userId }: { id: string; type: string; userId?: string }) =>
      pendingKmService.resolve(id, {
        resolution_type: type as any,
        resolved_by: profile!.id,
        ...(userId ? { trip_id: undefined } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-km', activeVehicleId] })
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  const handleResolve = (id: string, kmGap: number) => {
    Alert.alert(
      `${formatKm(kmGap)} sem responsável`,
      'Como deseja resolver?',
      [
        {
          text: 'Dividir igualmente',
          onPress: () => resolveMutation.mutate({ id, type: 'split_equally' }),
        },
        {
          text: 'Atribuir a mim',
          onPress: () => resolveMutation.mutate({ id, type: 'assigned_to_user', userId: profile?.id }),
        },
        { text: 'Ignorar', style: 'destructive', onPress: () => resolveMutation.mutate({ id, type: 'ignored' }) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>KM Pendente</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[8] }} />
      ) : !pending?.length ? (
        <View style={styles.empty}>
          <CheckCircle size={48} color={colors.success} />
          <Text style={styles.emptyTitle}>Tudo certo!</Text>
          <Text style={styles.emptySub}>Nenhuma quilometragem pendente</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoBox}>
            <AlertTriangle size={16} color={colors.warning} />
            <Text style={styles.infoText}>
              Foram detectados km rodados sem usuário responsável. Esses km precisam ser atribuídos para o rateio ser justo.
            </Text>
          </View>
          {pending.map((item: any) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.warnIcon}>
                  <AlertTriangle size={18} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kmGap}>{formatKm(Number(item.km_gap))} sem responsável</Text>
                  <Text style={styles.kmRange}>{formatKm(Number(item.km_start))} → {formatKm(Number(item.km_end))}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={() => handleResolve(item.id, Number(item.km_gap))}
                disabled={resolveMutation.isPending}
              >
                <Text style={styles.resolveBtnText}>Resolver</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  title: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, color: colors.gray900 },
  content: { padding: spacing[5], gap: spacing[4] },
  infoBox: { flexDirection: 'row', gap: spacing[2], backgroundColor: colors.warning + '15', borderRadius: radius.lg, padding: spacing[4], alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: typography.sizes.sm, color: colors.gray700 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[4], gap: spacing[3], ...shadows.sm, borderLeftWidth: 3, borderLeftColor: colors.warning },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  warnIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warning + '15', alignItems: 'center', justifyContent: 'center' },
  kmGap: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold, color: colors.gray900 },
  kmRange: { fontSize: typography.sizes.sm, color: colors.gray500, marginTop: 2 },
  resolveBtn: { backgroundColor: colors.warning, paddingVertical: spacing[3], borderRadius: radius.md, alignItems: 'center' },
  resolveBtnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  emptyTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, color: colors.gray900 },
  emptySub: { fontSize: typography.sizes.sm, color: colors.gray500 },
})
