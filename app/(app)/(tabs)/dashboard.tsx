import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Car, Plus, AlertTriangle } from 'lucide-react-native'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { useDashboard } from '@features/dashboard/hooks/useDashboard'
import { ActiveTripCard } from '@features/trips/components/ActiveTripCard'
import { BalanceSummaryCard } from '@features/balance/components/BalanceSummaryCard'
import { RecentExpensesList } from '@features/expenses/components/RecentExpensesList'
import { colors, spacing, typography, radius, shadows } from '@theme/index'
import { formatShortName } from '@lib/formatters'

export default function DashboardScreen() {
  const { profile } = useAuthStore()
  const { activeVehicleId } = useVehicleStore()
  const { activeTrip, pendingCount, isLoading, refetch } = useDashboard(activeVehicleId)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Olá, {profile ? formatShortName(profile.full_name) : 'usuário'} 👋
            </Text>
            <Text style={styles.headerSub}>Gerencie seus custos de viagem</Text>
          </View>
        </View>

        {/* Alerta de pendências */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.pendingAlert}
            onPress={() => router.push('/(app)/pending')}
            activeOpacity={0.8}
          >
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={styles.pendingAlertText}>
              {pendingCount} {pendingCount === 1 ? 'km pendente' : 'km pendentes'} sem responsável
            </Text>
            <Text style={styles.pendingAlertCta}>Resolver →</Text>
          </TouchableOpacity>
        )}

        {/* Viagem ativa */}
        {activeTrip ? (
          <ActiveTripCard trip={activeTrip} />
        ) : (
          <TouchableOpacity
            style={styles.startTripButton}
            onPress={() => router.push('/(app)/trips/new')}
            activeOpacity={0.8}
          >
            <Car size={20} color={colors.white} />
            <Text style={styles.startTripButtonText}>Iniciar Viagem</Text>
          </TouchableOpacity>
        )}

        {/* Saldo resumido */}
        {activeVehicleId && (
          <BalanceSummaryCard vehicleId={activeVehicleId} />
        )}

        {/* Atalho despesa */}
        <TouchableOpacity
          style={styles.addExpenseButton}
          onPress={() => router.push('/(app)/expenses/new')}
          activeOpacity={0.8}
        >
          <Plus size={18} color={colors.primary} />
          <Text style={styles.addExpenseButtonText}>Registrar Despesa</Text>
        </TouchableOpacity>

        {/* Despesas recentes */}
        {activeVehicleId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Despesas Recentes</Text>
            <RecentExpensesList vehicleId={activeVehicleId} limit={5} />
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  greeting: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.gray900,
  },
  headerSub: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.gray500,
    marginTop: 2,
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    gap: spacing[2],
  },
  pendingAlertText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.warning,
  },
  pendingAlertCta: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.warning,
  },
  startTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    height: 56,
    borderRadius: radius.lg,
    gap: spacing[2],
    ...shadows.md,
  },
  startTripButtonText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.white,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing[5],
    marginBottom: spacing[5],
    height: 48,
    borderRadius: radius.md,
    gap: spacing[2],
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  addExpenseButtonText: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
  section: {
    marginHorizontal: spacing[5],
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.gray900,
    marginBottom: spacing[3],
  },
  bottomPad: {
    height: spacing[8],
  },
})
