import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Car, UserPlus, Users, Gauge } from 'lucide-react-native'
import { vehiclesService } from '@services/vehicles.service'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { formatKm } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'
import { useState } from 'react'
import { supabase } from '@services/supabase'

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { profile } = useAuthStore()
  const { activeVehicleId, setActiveVehicle } = useVehicleStore()
  const queryClient = useQueryClient()
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesService.getById(id),
    enabled: !!id,
  })

  const addMemberMutation = useMutation({
    mutationFn: async (nameOrEmail: string) => {
      const query = nameOrEmail.includes('@')
        ? supabase.from('profiles').select('id, full_name').ilike('full_name', `%${nameOrEmail}%`).limit(5)
        : supabase.from('profiles').select('id, full_name').ilike('full_name', `%${nameOrEmail}%`).limit(5)

      const { data: results, error } = await query
      if (error || !results?.length) throw new Error('Usuário não encontrado. Verifique o nome.')
      if (results.length > 1) throw new Error(`Encontrados ${results.length} usuários. Seja mais específico.`)
      const userId = results[0].id
      return vehiclesService.addMember(id, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] })
      setShowAddMember(false)
      setMemberEmail('')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  const members = vehicle?.vehicle_users ?? []
  const isOwner = members.some((m: any) => m.user_id === profile?.id && m.role === 'owner')
  const isActive = id === activeVehicleId

  if (isLoading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[8] }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{vehicle?.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View style={styles.iconBox}>
              <Car size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>{vehicle?.name}</Text>
              <Text style={styles.vehicleSub}>{vehicle?.plate}{vehicle?.model ? ` • ${vehicle.model}` : ''}</Text>
            </View>
            {!isActive && (
              <TouchableOpacity style={styles.useBtn} onPress={() => setActiveVehicle(id)}>
                <Text style={styles.useBtnText}>Usar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Gauge size={16} color={colors.primary} />
              <Text style={styles.statValue}>{formatKm(Number(vehicle?.current_km ?? 0))}</Text>
              <Text style={styles.statLabel}>KM Atual</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Users size={16} color={colors.secondary} />
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Membros</Text>
            </View>
          </View>
        </View>

        {/* Membros */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Membros</Text>
            {isOwner && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddMember(true)}>
                <UserPlus size={16} color={colors.primary} />
                <Text style={styles.addBtnText}>Convidar</Text>
              </TouchableOpacity>
            )}
          </View>
          {members.map((m: any) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(m.profiles?.full_name ?? '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.profiles?.full_name ?? '—'}</Text>
                <Text style={styles.memberRole}>{m.role === 'owner' ? 'Proprietário' : 'Membro'}</Text>
              </View>
              {m.user_id === profile?.id && (
                <View style={styles.youBadge}><Text style={styles.youBadgeText}>Você</Text></View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal convidar */}
      <Modal visible={showAddMember} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Convidar membro</Text>
            <Text style={styles.modalSub}>O usuário precisa ter uma conta no DriveDindo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do usuário"
              placeholderTextColor={colors.gray400}
              autoCapitalize="words"
              value={memberEmail}
              onChangeText={setMemberEmail}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddMember(false); setMemberEmail('') }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, addMemberMutation.isPending && { opacity: 0.6 }]}
                onPress={() => addMemberMutation.mutate(memberEmail)}
                disabled={addMemberMutation.isPending}
              >
                <Text style={styles.confirmBtnText}>{addMemberMutation.isPending ? 'Buscando...' : 'Convidar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  title: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, color: colors.gray900, flex: 1, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[5], ...shadows.sm, gap: spacing[4] },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconBox: { width: 52, height: 52, borderRadius: radius.xl, backgroundColor: colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center' },
  vehicleName: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, color: colors.gray900 },
  vehicleSub: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.gray500, marginTop: 2 },
  useBtn: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.md, backgroundColor: colors.primary },
  useBtnText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, color: colors.white },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, color: colors.gray900 },
  statLabel: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.gray500 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.gray100 },
  section: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[5], gap: spacing[3], ...shadows.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.gray900 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  addBtnText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.primary },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold, color: colors.primary },
  memberName: { fontSize: typography.sizes.base, fontFamily: typography.fonts.medium, color: colors.gray900 },
  memberRole: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.gray500 },
  youBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.primary + '15' },
  youBadgeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium, color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: spacing[6], gap: spacing[4] },
  modalTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, color: colors.gray900 },
  modalSub: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.gray500 },
  input: { height: 48, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: spacing[4], fontSize: typography.sizes.base, fontFamily: typography.fonts.regular, color: colors.gray900 },
  modalActions: { flexDirection: 'row', gap: spacing[3] },
  cancelBtn: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.gray200 },
  cancelBtnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.medium, color: colors.gray600 },
  confirmBtn: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primary },
  confirmBtnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
})
