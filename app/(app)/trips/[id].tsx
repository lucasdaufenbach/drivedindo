import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Navigation, Clock, Gauge, Flag } from 'lucide-react-native'
import { useState } from 'react'
import { tripsService } from '@services/trips.service'
import { formatKm, formatDateTime } from '@lib/formatters'
import { useVehicleStore } from '@store/vehicle.store'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { activeVehicleId } = useVehicleStore()
  const queryClient = useQueryClient()
  const [kmEnd, setKmEnd] = useState('')
  const [notes, setNotes] = useState('')

  const { data: trips } = useQuery({
    queryKey: ['trips', activeVehicleId],
    queryFn: () => tripsService.listByVehicle(activeVehicleId!, 50),
    enabled: !!activeVehicleId,
  })
  const trip = trips?.find((t: any) => t.id === id)

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const km = Number(kmEnd.replace(/\D/g, ''))
      if (!km || km <= Number(trip!.km_start)) {
        throw new Error(`KM final deve ser maior que ${formatKm(Number(trip!.km_start))}`)
      }
      return tripsService.endTrip(id, { km_end: km, notes: notes || null })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', activeVehicleId] })
      queryClient.invalidateQueries({ queryKey: ['trips', 'active', activeVehicleId] })
      queryClient.invalidateQueries({ queryKey: ['vehicle', activeVehicleId] })
      router.replace('/(app)/(tabs)/dashboard')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  if (!trip) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[8] }} />
    </SafeAreaView>
  )

  const isOpen = trip.status === 'open'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>Viagem</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status card */}
        <View style={[styles.card, isOpen && styles.cardOpen]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, isOpen && styles.iconBoxOpen]}>
              <Navigation size={22} color={isOpen ? colors.white : colors.gray500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusText}>{isOpen ? 'Viagem em andamento' : 'Viagem concluída'}</Text>
              <Text style={styles.dateTxt}>{formatDateTime(trip.started_at ?? '')}</Text>
            </View>
            <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
              <Text style={[styles.badgeText, isOpen ? styles.badgeTextOpen : styles.badgeTextClosed]}>
                {isOpen ? 'Aberta' : 'Concluída'}
              </Text>
            </View>
          </View>

          <View style={styles.kmSection}>
            <View style={styles.kmItem}>
              <Gauge size={14} color={colors.gray400} />
              <Text style={styles.kmLabel}>Partida</Text>
              <Text style={styles.kmValue}>{formatKm(Number(trip.km_start))}</Text>
            </View>
            {trip.km_end != null && (
              <>
                <View style={styles.kmArrow}><Text style={styles.kmArrowText}>→</Text></View>
                <View style={styles.kmItem}>
                  <Flag size={14} color={colors.gray400} />
                  <Text style={styles.kmLabel}>Chegada</Text>
                  <Text style={styles.kmValue}>{formatKm(Number(trip.km_end))}</Text>
                </View>
                <View style={styles.kmArrow}><Text style={styles.kmArrowText}>=</Text></View>
                <View style={styles.kmItem}>
                  <Navigation size={14} color={colors.secondary} />
                  <Text style={styles.kmLabel}>Rodado</Text>
                  <Text style={[styles.kmValue, { color: colors.secondary }]}>{formatKm(Number(trip.km_driven))}</Text>
                </View>
              </>
            )}
          </View>

          {trip.notes && (
            <Text style={styles.notes}>{trip.notes}</Text>
          )}
        </View>

        {/* Formulário de conclusão */}
        {isOpen && (
          <View style={styles.endSection}>
            <Text style={styles.endTitle}>Finalizar Viagem</Text>
            <View style={styles.field}>
              <Text style={styles.label}>KM Final *</Text>
              <TextInput
                style={styles.inputLarge}
                placeholder="Informe o KM atual"
                placeholderTextColor={colors.gray400}
                keyboardType="numeric"
                value={kmEnd}
                onChangeText={setKmEnd}
                autoFocus
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Observações (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: sem ocorrências"
                placeholderTextColor={colors.gray400}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
            <TouchableOpacity
              style={[styles.btn, isPending && { opacity: 0.6 }]}
              onPress={() => mutate()}
              disabled={isPending}
            >
              <Text style={styles.btnText}>{isPending ? 'Finalizando...' : 'Finalizar Viagem'}</Text>
            </TouchableOpacity>
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
  content: { padding: spacing[5], gap: spacing[5] },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[5], gap: spacing[4], ...shadows.sm },
  cardOpen: { borderWidth: 2, borderColor: colors.success + '40' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  iconBoxOpen: { backgroundColor: colors.success },
  statusText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.gray900 },
  dateTxt: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.gray500, marginTop: 2 },
  badge: { paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radius.full },
  badgeOpen: { backgroundColor: colors.success + '20' },
  badgeClosed: { backgroundColor: colors.gray100 },
  badgeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium },
  badgeTextOpen: { color: colors.success },
  badgeTextClosed: { color: colors.gray500 },
  kmSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray50, borderRadius: radius.lg, padding: spacing[4] },
  kmItem: { flex: 1, alignItems: 'center', gap: 4 },
  kmLabel: { fontSize: typography.sizes.xs, color: colors.gray500 },
  kmValue: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold, color: colors.gray900 },
  kmArrow: { paddingHorizontal: spacing[2] },
  kmArrowText: { fontSize: typography.sizes.lg, color: colors.gray400 },
  notes: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.gray600, fontStyle: 'italic' },
  endSection: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[5], gap: spacing[4], ...shadows.sm },
  endTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, color: colors.gray900 },
  field: { gap: spacing[2] },
  label: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.gray700 },
  inputLarge: { height: 64, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: spacing[4], fontSize: 28, fontFamily: typography.fonts.bold, color: colors.gray900, backgroundColor: colors.surface },
  input: { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: spacing[4], paddingVertical: spacing[3], fontSize: typography.sizes.base, color: colors.gray900, backgroundColor: colors.surface },
  textArea: { height: 80, textAlignVertical: 'top' },
  btn: { height: 52, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
})
