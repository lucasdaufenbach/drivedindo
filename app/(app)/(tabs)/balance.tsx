import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus, ArrowRight, CheckCircle } from 'lucide-react-native'
import { expensesService } from '@services/expenses.service'
import { balanceService } from '@services/balance.service'
import { vehiclesService } from '@services/vehicles.service'
import { calculateBalances, minimizeSettlements } from '@lib/calculations'
import { formatCurrency, formatBalance } from '@lib/formatters'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function BalanceScreen() {
  const { profile } = useAuthStore()
  const { activeVehicleId } = useVehicleStore()
  const queryClient = useQueryClient()

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', activeVehicleId],
    queryFn: () => vehiclesService.getById(activeVehicleId!),
    enabled: !!activeVehicleId,
  })

  const { data: balanceRaw, isLoading } = useQuery({
    queryKey: ['balance-data', activeVehicleId],
    queryFn: () => expensesService.getBalanceData(activeVehicleId!),
    enabled: !!activeVehicleId,
  })

  const settleMutation = useMutation({
    mutationFn: ({ from, to, amount }: { from: string; to: string; amount: number }) =>
      balanceService.createSettlement({ vehicle_id: activeVehicleId!, paid_by: from, paid_to: to, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-data', activeVehicleId] })
      Alert.alert('Sucesso', 'Pagamento registrado!')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  const members = (vehicle?.vehicle_users ?? []).filter((m: any) => m.is_active)

  const profileMap: Record<string, string> = {}
  for (const m of members) {
    profileMap[(m as any).user_id] = (m as any).profiles?.full_name ?? 'Usuário'
  }

  const expenses = (balanceRaw ?? []).map((row: any) => ({
    userId: row.user_id,
    userName: profileMap[row.user_id] ?? row.user_id,
    avatarUrl: null,
    amountPaid: row.expenses?.paid_by === row.user_id ? Number(row.expenses?.amount ?? 0) : 0,
    amountOwed: Number(row.amount_owed ?? 0),
  }))

  const balances = calculateBalances(expenses)
  const settlements = minimizeSettlements(balances)

  const totalExpenses = balances.reduce((s, b) => s + b.totalPaid, 0)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Saldo</Text></View>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[8] }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total de despesas</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalExpenses)}</Text>
          </View>

          {/* Saldos individuais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saldo por pessoa</Text>
            {balances.map(b => {
              const isCredit = b.balance > 0.01
              const isDebit = b.balance < -0.01
              const Icon = isCredit ? TrendingUp : isDebit ? TrendingDown : Minus
              const col = isCredit ? colors.credit : isDebit ? colors.debit : colors.neutral
              return (
                <View key={b.userId} style={styles.balanceRow}>
                  <View style={[styles.avatar, { backgroundColor: col + '20' }]}>
                    <Text style={[styles.avatarText, { color: col }]}>{(b.userName ?? '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.balanceName}>{b.userName}{b.userId === profile?.id ? ' (você)' : ''}</Text>
                    <Text style={styles.balanceSub}>
                      Pagou {formatCurrency(b.totalPaid)} • Deve {formatCurrency(b.totalOwed)}
                    </Text>
                  </View>
                  <Text style={[styles.balanceValue, { color: col }]}>{formatBalance(b.balance)}</Text>
                </View>
              )
            })}
          </View>

          {/* Sugestões de liquidação */}
          {settlements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acertar contas</Text>
              <Text style={styles.sectionSub}>Número mínimo de transferências</Text>
              {settlements.map((s, i) => (
                <View key={i} style={styles.settlementRow}>
                  <View style={styles.settlePart}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(s.from.userName ?? '?')[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.settleName}>{s.from.userName}</Text>
                  </View>
                  <View style={styles.settleCenter}>
                    <ArrowRight size={16} color={colors.gray400} />
                    <Text style={styles.settleAmount}>{formatCurrency(s.amount)}</Text>
                  </View>
                  <View style={[styles.settlePart, { justifyContent: 'flex-end' }]}>
                    <Text style={styles.settleName}>{s.to.userName}</Text>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(s.to.userName ?? '?')[0].toUpperCase()}</Text>
                    </View>
                  </View>
                  {s.from.userId === profile?.id && (
                    <TouchableOpacity
                      style={styles.settleBtn}
                      onPress={() => settleMutation.mutate({ from: s.from.userId, to: s.to.userId, amount: s.amount })}
                      disabled={settleMutation.isPending}
                    >
                      <CheckCircle size={16} color={colors.white} />
                      <Text style={styles.settleBtnText}>Paguei</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {balances.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhuma despesa registrada ainda</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  title: { fontSize: typography.sizes['2xl'], fontFamily: typography.fonts.bold, color: colors.gray900 },
  content: { padding: spacing[5], gap: spacing[4] },
  totalCard: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing[5], alignItems: 'center', gap: spacing[1] },
  totalLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.white + 'CC' },
  totalValue: { fontSize: typography.sizes['3xl'], fontFamily: typography.fonts.bold, color: colors.white },
  section: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[4], gap: spacing[3], ...shadows.sm },
  sectionTitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.gray900 },
  sectionSub: { fontSize: typography.sizes.xs, color: colors.gray500, marginTop: -spacing[2] },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold, color: colors.primary },
  balanceName: { fontSize: typography.sizes.base, fontFamily: typography.fonts.medium, color: colors.gray900 },
  balanceSub: { fontSize: typography.sizes.xs, color: colors.gray500, marginTop: 2 },
  balanceValue: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold },
  settlementRow: { gap: spacing[3] },
  settlePart: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 },
  settleCenter: { alignItems: 'center', gap: 2 },
  settleAmount: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.bold, color: colors.gray900 },
  settleName: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.gray700 },
  settleBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], backgroundColor: colors.secondary, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.md },
  settleBtnText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, color: colors.white },
  empty: { alignItems: 'center', padding: spacing[8] },
  emptyText: { fontSize: typography.sizes.base, color: colors.gray500 },
})
