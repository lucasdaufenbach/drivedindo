import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@store/auth.store'

export default function AuthLayout() {
  const { session } = useAuthStore()

  // Se já autenticado, redireciona para o app
  if (session) return <Redirect href="/(app)/(tabs)/dashboard" />

  return <Stack screenOptions={{ headerShown: false }} />
}
