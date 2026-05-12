import { useQuery } from '@tanstack/react-query'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native'
import { expensesService } from '@services/expenses.service'
import { balanceService } from '@services/balance.service'
import { calculateBalances } from '@lib/calculations'
import { formatBalance } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'
import { useAuthStore } from '@store/auth.store'

interface Props {
  vehicleId: string
}

export function BalanceSummaryCard({ vehicleId }: Props) {
  const { profile } = useAuthStore()

  const { data: balanceRaw } = useQuery({
    queryKey: ['balance-data', vehicleId],
    queryFn: () => expensesService.getBalanceData(vehicleId),
  })

  if (!balanceRaw || !profile) return null

  // Transformar dados brutos para cálculo
  const expenseRecords = balanceRaw.map((row: any) => ({
    userId: row.user_id,
    userName: '',
    avatarUrl: null,
    amountPaid: row.expenses?.paid_by === row.user_id ? row.expenses?.amount ?? 0 : 0,
    amountOwed: row.amount_owed,
  }))

  const balances = calculateBalances(expenseRecords)
  const myBalance = balances.find(b => b.userId === profile.id)

  if (!myBalance) return null

  const isPositive = myBalance.balance > 0.01
  const isNegative = myBalance.balance < -0.01

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/(app)/balance')}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Seu saldo</Text>
          <Text style={[
            styles.amount,
            isPositive && styles.amountCredit,
            isNegative && styles.amountDebit,
          ]}>
            {formatBalance(myBalance.balance)}
          </Text>
          <Text style={styles.sub}>
            {isPositive
              ? 'Você tem a receber'
              : isNegative
              ? 'Você deve'
              : 'Tudo quitado'}
          </Text>
        </View>
        <View style={[
          styles.icon,
          isPositive && styles.iconCredit,
          isNegative && styles.iconDebit,
          !isPositive && !isNegative && styles.iconNeutral,
        ]}>
          {isPositive ? (
            <TrendingUp size={22} color={colors.credit} />
          ) : isNegative ? (
            <TrendingDown size={22} color={colors.debit} />
          ) : (
            <Minus size={22} color={colors.neutral} />
          )}
        </View>
      </View>
      <Text style={styles.cta}>Ver detalhes →</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    padding: spacing[5],
    borderRadius: radius.lg,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.gray500,
    marginBottom: spacing[1],
  },
  amount: {
    fontSize: typography.sizes['2xl'],
    fontFamily: typography.fonts.bold,
    color: colors.gray900,
  },
  amountCredit: { color: colors.credit },
  amountDebit: { color: colors.debit },
  sub: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.gray400,
    marginTop: 2,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCredit:  { backgroundColor: '#F0FDF4' },
  iconDebit:   { backgroundColor: '#FEF2F2' },
  iconNeutral: { backgroundColor: colors.gray100 },
  cta: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
})
