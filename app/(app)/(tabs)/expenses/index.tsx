import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Receipt } from 'lucide-react-native'
import { expensesService } from '@services/expenses.service'
import { useVehicleStore } from '@store/vehicle.store'
import { formatCurrency, formatDate } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function ExpensesScreen() {
  const { activeVehicleId } = useVehicleStore()

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', activeVehicleId, 'list'],
    queryFn: () => expensesService.listByVehicle(activeVehicleId!, 30),
    enabled: !!activeVehicleId,
  })

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Despesas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/expenses/new')}>
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[8] }} />
      ) : !expenses?.length ? (
        <View style={styles.empty}>
          <Receipt size={48} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhuma despesa</Text>
          <Text style={styles.emptySub}>Registre combustível, manutenções e outros gastos</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/expenses/new')}>
            <Text style={styles.emptyBtnText}>Registrar Despesa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing[5], gap: spacing[3] }}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(app)/expenses/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.dot, { backgroundColor: item.expense_categories?.color ?? colors.gray300 }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.desc} numberOfLines={1}>
                  {item.description ?? item.expense_categories?.name ?? 'Despesa'}
                </Text>
                <Text style={styles.meta}>
                  {item.expense_categories?.name} • {formatDate(item.expense_date)}
                </Text>
                <Text style={styles.payer}>Pago por {item.profiles?.full_name ?? '—'}</Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(Number(item.amount))}</Text>
            </TouchableOpacity>
          )}
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
  dot: { width: 12, height: 12, borderRadius: 6 },
  desc: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.gray900 },
  meta: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.gray500 },
  payer: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium, color: colors.primary },
  amount: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold, color: colors.gray900 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[8] },
  emptyTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, color: colors.gray900 },
  emptySub: { fontSize: typography.sizes.sm, color: colors.gray500, textAlign: 'center' },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: radius.lg, marginTop: spacing[2] },
  emptyBtnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
})
