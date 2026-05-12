import { useQuery } from '@tanstack/react-query'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { expensesService } from '@services/expenses.service'
import { formatCurrency, formatRelativeDate } from '@lib/formatters'
import { colors, spacing, typography, radius } from '@theme/index'

interface Props {
  vehicleId: string
  limit?: number
}

export function RecentExpensesList({ vehicleId, limit = 5 }: Props) {
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', vehicleId, 'recent'],
    queryFn: () => expensesService.listByVehicle(vehicleId, limit),
  })

  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.skeleton} />
        ))}
      </View>
    )
  }

  if (!expenses?.length) {
    return (
      <Text style={styles.empty}>Nenhuma despesa registrada.</Text>
    )
  }

  return (
    <View style={styles.list}>
      {expenses.map((expense: any) => (
        <TouchableOpacity
          key={expense.id}
          style={styles.item}
          onPress={() => router.push(`/(app)/expenses/${expense.id}`)}
          activeOpacity={0.7}
        >
          <View style={[styles.categoryDot, { backgroundColor: expense.expense_categories?.color ?? colors.gray300 }]} />
          <View style={styles.info}>
            <Text style={styles.description} numberOfLines={1}>
              {expense.description ?? expense.expense_categories?.name ?? 'Despesa'}
            </Text>
            <Text style={styles.date}>
              {formatRelativeDate(expense.expense_date)}
            </Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing[2] },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[3],
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  info: { flex: 1 },
  description: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.medium,
    color: colors.gray900,
  },
  date: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.gray400,
    marginTop: 2,
  },
  amount: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.gray900,
  },
  empty: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.gray400,
    textAlign: 'center',
    paddingVertical: spacing[6],
  },
  skeletonContainer: { gap: spacing[2] },
  skeleton: {
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
  },
})
