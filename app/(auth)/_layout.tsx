import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@store/auth.store'

export default function AuthLayout() {
  const { session } = useAuthStore()

  // Se já autenticado, redireciona para o app
  if (session) return <Redirect href="/(app)/dashboard" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  )
}
