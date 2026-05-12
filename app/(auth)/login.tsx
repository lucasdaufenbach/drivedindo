import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useAuthStore } from '@store/auth.store'
import { signInSchema, type SignInInput } from '@lib/validators'
import { colors, spacing, typography, radius } from '@theme/index'

export default function LoginScreen() {
  const { signIn, isLoading } = useAuthStore()

  const { control, handleSubmit, formState: { errors } } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: SignInInput) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      await signIn(data.email, data.password)
      router.replace('/(app)/dashboard')
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      // Tratamento de erro de autenticação
      console.error('Login error:', err)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🚗</Text>
          <Text style={styles.title}>DriveDindo</Text>
          <Text style={styles.subtitle}>Divisão inteligente de custos</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry
                  autoComplete="password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                )}
              </View>
            )}
          />

          <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
            Esqueci minha senha
          </Link>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Não tem conta? </Text>
            <Link href="/(auth)/register" style={styles.registerLink}>
              Cadastrar
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logo: {
    fontSize: 56,
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontFamily: typography.fonts.bold,
    color: colors.gray900,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.gray500,
  },
  form: {
    gap: spacing[4],
  },
  fieldWrapper: {
    gap: spacing[1],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.gray700,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.gray900,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.error,
  },
  forgotLink: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
    textAlign: 'right',
  },
  button: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.white,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  registerText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.gray500,
  },
  registerLink: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
})
