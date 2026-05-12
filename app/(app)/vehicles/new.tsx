import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react-native'
import { vehiclesService } from '@services/vehicles.service'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { createVehicleSchema } from '@lib/validators'
import type { z } from 'zod'
import { colors, spacing, typography, radius } from '@theme/index'

type FormData = z.infer<typeof createVehicleSchema>

export default function NewVehicleScreen() {
  const { profile } = useAuthStore()
  const { setActiveVehicle } = useVehicleStore()
  const queryClient = useQueryClient()

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: { name: '', plate: '', model: '', color: '', currentKm: 0 },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => vehiclesService.create({
      name: data.name,
      plate: data.plate,
      model: data.model ?? null,
      color: data.color ?? null,
      year: data.year ?? null,
      current_km: data.currentKm,
      created_by: profile!.id,
    }),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setActiveVehicle(vehicle.id)
      router.replace('/(app)/(tabs)/dashboard')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.title}>Novo Veículo</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {[
            { name: 'name' as const, label: 'Nome *', placeholder: 'Ex: Onix da Família' },
            { name: 'plate' as const, label: 'Placa *', placeholder: 'ABC1D23', autoCapitalize: 'characters' as const },
            { name: 'model' as const, label: 'Modelo', placeholder: 'Ex: Chevrolet Onix 1.0' },
            { name: 'color' as const, label: 'Cor', placeholder: 'Ex: Prata' },
          ].map(({ name, label, placeholder, autoCapitalize }) => (
            <Controller key={name} control={control} name={name}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={[styles.input, errors[name] && styles.inputError]}
                    placeholder={placeholder} placeholderTextColor={colors.gray400}
                    autoCapitalize={autoCapitalize ?? 'sentences'}
                    onBlur={onBlur} onChangeText={onChange} value={value as string ?? ''}
                  />
                  {errors[name] && <Text style={styles.error}>{errors[name]?.message}</Text>}
                </View>
              )}
            />
          ))}

          <Controller control={control} name="currentKm"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>KM Atual *</Text>
                <TextInput
                  style={[styles.input, errors.currentKm && styles.inputError]}
                  placeholder="0" placeholderTextColor={colors.gray400}
                  keyboardType="numeric" onBlur={onBlur}
                  onChangeText={(v) => onChange(Number(v.replace(/\D/g, '')))}
                  value={value?.toString() ?? '0'}
                />
                {errors.currentKm && <Text style={styles.error}>{errors.currentKm.message}</Text>}
              </View>
            )}
          />

          <TouchableOpacity
            style={[styles.btn, isPending && { opacity: 0.6 }]}
            onPress={handleSubmit((data) => mutate(data))}
            disabled={isPending}
          >
            <Text style={styles.btnText}>{isPending ? 'Cadastrando...' : 'Cadastrar Veículo'}</Text>
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
  form: { padding: spacing[5], gap: spacing[4] },
  field: { gap: spacing[1] },
  label: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.gray700 },
  input: { height: 48, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: spacing[4], fontSize: typography.sizes.base, fontFamily: typography.fonts.regular, color: colors.gray900, backgroundColor: colors.surface },
  inputError: { borderColor: colors.error },
  error: { fontSize: typography.sizes.xs, color: colors.error, fontFamily: typography.fonts.regular },
  btn: { height: 52, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing[4] },
  btnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold, color: colors.white },
})
