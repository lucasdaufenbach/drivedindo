import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check } from 'lucide-react-native'
import { useState } from 'react'
import { expensesService } from '@services/expenses.service'
import { vehiclesService } from '@services/vehicles.service'
import { tripsService } from '@services/trips.service'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { calculateUsagePercentages } from '@lib/calculations'
import { formatCurrency } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function NewExpenseScreen() {
  const { profile } = useAuthStore()
  const { activeVehicleId } = useVehicleStore()
  const queryClient = useQueryClient()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [paidBy, setPaidBy] = useState<string>(profile?.id ?? '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesService.getCategories(),
  })

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', activeVehicleId],
    queryFn: () => vehiclesService.getById(activeVehicleId!),
    enabled: !!activeVehicleId,
  })

  const members = (vehicle?.vehicle_users ?? []).filter((m: any) => m.is_active)

  // Calcula percentuais baseado em KM do mês atual
  const { data: trips } = useQuery({
    queryKey: ['trips', activeVehicleId, 'month'],
    queryFn: async () => {
      const allTrips = await tripsService.listByVehicle(activeVehicleId!, 100)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      return allTrips.filter((t: any) => t.started_at >= startOfMonth && t.status === 'closed')
    },
    enabled: !!activeVehicleId,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const amountNum = Number(amount.replace(',', '.'))
      if (!amountNum || amountNum <= 0) throw new Error('Informe um valor válido')
      if (!selectedCategory) throw new Error('Selecione uma categoria')
      if (selectedParticipants.length === 0) throw new Error('Selecione ao menos um participante')

      // Calcula percentuais por KM do mês
      const kmByUser: Record<string, number> = {}
      for (const t of trips ?? []) {
        if (!selectedParticipants.includes((t as any).user_id)) continue
        kmByUser[(t as any).user_id] = (kmByUser[(t as any).user_id] ?? 0) + Number((t as any).km_driven ?? 0)
      }

      const usersKm = selectedParticipants.map(uid => ({
        userId: uid,
        userName: members.find((m: any) => m.user_id === uid)?.profiles?.full_name ?? uid,
        kmDriven: kmByUser[uid] ?? 0,
      }))

      const percentages = calculateUsagePercentages(usersKm)

      const participants = percentages.map(p => ({
        user_id: p.userId,
        percentage: p.percentage,
        amount_owed: Number(((p.percentage / 100) * amountNum).toFixed(2)),
      }))

      return expensesService.createExpenseWithParticipants(
        {
          vehicle_id: activeVehicleId!,
          category_id: selectedCategory,
          paid_by: paidBy,
          amount: amountNum,
          description: description || null,
          expense_date: new Date().toISOString().split('T')[0],
        },
        participants.map(p => ({ ...p, expense_id: '' }))
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] })
      queryClient.invalidateQueries({ queryKey: ['balance-data', activeVehicleId] })
      router.back()
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  const toggleParticipant = (uid: string) => {
    setSelectedParticipants(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  const amountNum = Number(amount.replace(',', '.')) || 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.title}>Nova Despesa</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Valor */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Valor</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="R$ 0,00"
              placeholderTextColor={colors.gray300}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          {/* Categorias */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoria</Text>
            <View style={styles.categories}>
              {categories?.map((cat: any) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, selectedCategory === cat.id && { backgroundColor: cat.color ?? colors.primary, borderColor: cat.color ?? colors.primary }]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.catText, selectedCategory === cat.id && { color: colors.white }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: abastecimento no posto Shell"
              placeholderTextColor={colors.gray400}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Quem pagou */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quem pagou</Text>
            {members.map((m: any) => (
              <TouchableOpacity
                key={m.user_id}
                style={[styles.memberRow, paidBy === m.user_id && styles.memberRowSelected]}
                onPress={() => setPaidBy(m.user_id)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(m.profiles?.full_name ?? '?')[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.memberName}>{m.profiles?.full_name}</Text>
                {paidBy === m.user_id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Participantes no rateio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rateio entre</Text>
            <Text style={styles.sectionSub}>Percentual calculado pelo KM rodado no mês</Text>
            {members.map((m: any) => {
              const isSelected = selectedParticipants.includes(m.user_id)
              const kmByUser: Record<string, number> = {}
              for (const t of trips ?? []) {
                if (!selectedParticipants.includes((t as any).user_id)) continue
                kmByUser[(t as any).user_id] = (kmByUser[(t as any).user_id] ?? 0) + Number((t as any).km_driven ?? 0)
              }
              const usersKm = selectedParticipants.map(uid => ({
                userId: uid, userName: '', kmDriven: kmByUser[uid] ?? 0,
              }))
              const percs = calculateUsagePercentages(usersKm)
              const myPerc = percs.find(p => p.userId === m.user_id)
              const myAmount = myPerc ? (myPerc.percentage / 100) * amountNum : 0

              return (
                <TouchableOpacity
                  key={m.user_id}
                  style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                  onPress={() => toggleParticipant(m.user_id)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(m.profiles?.full_name ?? '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.profiles?.full_name}</Text>
                    {isSelected && myPerc && (
                      <Text style={styles.percText}>{myPerc.percentage.toFixed(1)}% • {formatCurrency(myAmount)}</Text>
                    )}
                  </View>
                  {isSelected && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              )
            })}
          </View>

          <TouchableOpacity
            style={[styles.btn, isPending && { opacity: 0.6 }]}
            onPress={() => mutate()}
            disabled={isPending}
          >
            <Text style={styles.btnText}>{isPending ? 'Salvando...' : 'Registrar Despesa'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  title: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, color: colors.gray900 },
  content: { padding: spacing[5], gap: spacing[5] },
  amountCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[5], alignItems: 'center', ...shadows.sm },
  amountLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.gray500, marginBottom: spacing[2] },
  amountInput: { fontSize: 40, fontFamily: typography.fonts.bold, color: colors.gray900, textAlign: 'center', minWidth: 150 },
  section: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[4], gap: spacing[3], ...shadows.sm },
  sectionTitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.gray900 },
  sectionSub: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.gray500, marginTop: -spacing[2] },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  catChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.gray200, backgroundColor: colors.surface },
  catText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.gray700 },
  input: { height: 48, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: spacing[4], fontSize: typography.sizes.base, color: colors.gray900, backgroundColor: colors.surface },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.transparent },
  memberRowSelected: { backgroundColor: colors.primary + '08', borderColor: colors.primary + '30' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold, color: colors.primary },
  memberName: { flex: 1, fontSize: typography.sizes.base, fontFamily: typography.fonts.medium, color: colors.gray900 },
  percText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.gray500 },
  btn: { height: 52, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing[2] },
  btnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
})
