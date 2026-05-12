import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Receipt, User, Calendar } from 'lucide-react-native'
import { expensesService } from '@services/expenses.service'
import { useVehicleStore } from '@store/vehicle.store'
import { formatCurrency, formatDate } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { activeVehicleId } = useVehicleStore()

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', activeVehicleId, 'list'],
    queryFn: () => expensesService.listByVehicle(activeVehicleId!, 100),
    enabled: !!activeVehicleId,
  })

  const expense = expenses?.find((e: any) => e.id === id)

  if (isLoading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[8] }} />
    </SafeAreaView>
  )

  if (!expense) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}><ArrowLeft size={24} color={colors.gray900} /></TouchableOpacity>
        <Text style={styles.title}>Despesa</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.empty}><Text style={styles.emptyText}>Despesa não encontrada</Text></View>
    </SafeAreaView>
  )

  const participants: any[] = expense.expense_participants ?? []

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}><ArrowLeft size={24} color={colors.gray900} /></TouchableOpacity>
        <Text style={styles.title}>Despesa</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.heroCard, { borderTopColor: expense.expense_categories?.color ?? colors.primary }]}>
          <View style={[styles.catDot, { backgroundColor: expense.expense_categories?.color ?? colors.primary }]} />
          <Text style={styles.catName}>{expense.expense_categories?.name ?? 'Despesa'}</Text>
          <Text style={styles.heroAmount}>{formatCurrency(Number(expense.amount))}</Text>
          {expense.description && <Text style={styles.heroDesc}>{expense.description}</Text>}
        </View>

        {/* Informações */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.gray400} />
            <Text style={styles.infoLabel}>Data</Text>
            <Text style={styles.infoValue}>{formatDate(expense.expense_date)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <User size={16} color={colors.gray400} />
            <Text style={styles.infoLabel}>Pago por</Text>
            <Text style={styles.infoValue}>{expense.profiles?.full_name ?? '—'}</Text>
          </View>
        </View>

        {/* Rateio */}
        {participants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rateio</Text>
            {participants.map((p: any) => (
              <View key={p.id} style={styles.participantRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(p.profiles?.full_name ?? '?')[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.participantName}>{p.profiles?.full_name}</Text>
                <View style={styles.participantRight}>
                  <Text style={styles.participantPct}>{Number(p.percentage).toFixed(1)}%</Text>
                  <Text style={styles.participantAmt}>{formatCurrency(Number(p.amount_owed))}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  title: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, color: colors.gray900 },
  content: { padding: spacing[5], gap: spacing[4] },
  heroCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[5], alignItems: 'center', gap: spacing[2], borderTopWidth: 4, ...shadows.sm },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.gray500 },
  heroAmount: { fontSize: 40, fontFamily: typography.fonts.bold, color: colors.gray900 },
  heroDesc: { fontSize: typography.sizes.sm, color: colors.gray600, textAlign: 'center' },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[4], ...shadows.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  infoLabel: { flex: 1, fontSize: typography.sizes.sm, color: colors.gray500 },
  infoValue: { fontSize: typography.sizes.base, fontFamily: typography.fonts.medium, color: colors.gray900 },
  divider: { height: 1, backgroundColor: colors.gray100, marginHorizontal: -spacing[4] },
  section: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[4], gap: spacing[2], ...shadows.sm },
  sectionTitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.gray900, marginBottom: spacing[1] },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.bold, color: colors.primary },
  participantName: { flex: 1, fontSize: typography.sizes.base, fontFamily: typography.fonts.medium, color: colors.gray900 },
  participantRight: { alignItems: 'flex-end', gap: 2 },
  participantPct: { fontSize: typography.sizes.xs, color: colors.gray500 },
  participantAmt: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold, color: colors.gray900 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: typography.sizes.base, color: colors.gray500 },
})
