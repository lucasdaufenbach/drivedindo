import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Gauge, AlertTriangle } from 'lucide-react-native'
import { z } from 'zod'
import { tripsService } from '@services/trips.service'
import { pendingKmService } from '@services/pending-km.service'
import { vehiclesService } from '@services/vehicles.service'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { formatKm } from '@lib/formatters'
import { colors, spacing, typography, radius } from '@theme/index'

const schema = z.object({
  kmStart: z.string().min(1, 'Informe o KM inicial').transform(v => Number(v.replace(/\D/g, ''))),
  notes: z.string().optional(),
})

export default function NewTripScreen() {
  const { profile } = useAuthStore()
  const { activeVehicleId } = useVehicleStore()
  const queryClient = useQueryClient()

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', activeVehicleId],
    queryFn: () => vehiclesService.getById(activeVehicleId!),
    enabled: !!activeVehicleId,
  })

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { kmStart: vehicle?.current_km?.toString() ?? '', notes: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ kmStart, notes }: { kmStart: number; notes?: string }) => {
      const lastTrip = await tripsService.getLastClosedTrip(activeVehicleId!)
      const lastKm = Number(vehicle?.current_km ?? 0)

      // Detecta KM gap
      if (lastKm > 0 && kmStart > lastKm + 0.5) {
        await pendingKmService.create({
          vehicle_id: activeVehicleId!,
          km_start: lastKm,
          km_end: kmStart,
        })
      }

      return tripsService.startTrip({
        vehicle_id: activeVehicleId!,
        user_id: profile!.id,
        km_start: kmStart,
        notes: notes || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', activeVehicleId] })
      queryClient.invalidateQueries({ queryKey: ['trips', 'active', activeVehicleId] })
      queryClient.invalidateQueries({ queryKey: ['pending-km', activeVehicleId] })
      router.replace('/(app)/(tabs)/dashboard')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  const currentKm = Number(vehicle?.current_km ?? 0)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.title}>Iniciar Viagem</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Info do veículo */}
          {vehicle && (
            <View style={styles.vehicleCard}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <View style={styles.kmRow}>
                <Gauge size={16} color={colors.primary} />
                <Text style={styles.currentKm}>KM atual: {formatKm(currentKm)}</Text>
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>KM Inicial *</Text>
            <Controller control={control} name="kmStart"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.inputLarge, errors.kmStart && styles.inputError]}
                  placeholder={currentKm > 0 ? currentKm.toString() : '0'}
                  placeholderTextColor={colors.gray400}
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoFocus
                />
              )}
            />
            {errors.kmStart && <Text style={styles.error}>{errors.kmStart.message as string}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Observações (opcional)</Text>
            <Controller control={control} name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ex: viagem para o trabalho"
                  placeholderTextColor={colors.gray400}
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>

          <View style={styles.infoBox}>
            <AlertTriangle size={14} color={colors.warning} />
            <Text style={styles.infoText}>
              Se o KM informado for maior que o KM atual do veículo, o sistema irá criar uma pendência para os km não registrados.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, isPending && { opacity: 0.6 }]}
            onPress={handleSubmit((data) => mutate(data as any))}
            disabled={isPending}
          >
            <Text style={styles.btnText}>{isPending ? 'Iniciando...' : 'Iniciar Viagem'}</Text>
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
  vehicleCard: { backgroundColor: colors.primary + '10', borderRadius: radius.xl, padding: spacing[4], gap: spacing[2] },
  vehicleName: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.primary },
  kmRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  currentKm: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.gray600 },
  field: { gap: spacing[2] },
  label: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.gray700 },
  inputLarge: { height: 64, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: spacing[4], fontSize: 28, fontFamily: typography.fonts.bold, color: colors.gray900, backgroundColor: colors.surface },
  input: { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: spacing[4], paddingVertical: spacing[3], fontSize: typography.sizes.base, fontFamily: typography.fonts.regular, color: colors.gray900, backgroundColor: colors.surface },
  textArea: { height: 80, textAlignVertical: 'top' },
  inputError: { borderColor: colors.error },
  error: { fontSize: typography.sizes.xs, color: colors.error },
  infoBox: { flexDirection: 'row', gap: spacing[2], backgroundColor: colors.warning + '15', borderRadius: radius.md, padding: spacing[3], alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.gray700 },
  btn: { height: 52, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing[2] },
  btnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
})
