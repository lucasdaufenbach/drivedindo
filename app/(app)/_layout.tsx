import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@store/auth.store'

export default function AppLayout() {
  const { session } = useAuthStore()
  if (!session) return <Redirect href="/(auth)/login" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trips/new" options={{ headerShown: false }} />
      <Stack.Screen name="trips/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="expenses/new" options={{ headerShown: false }} />
      <Stack.Screen name="expenses/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="vehicles/index" options={{ headerShown: false }} />
      <Stack.Screen name="vehicles/new" options={{ headerShown: false }} />
      <Stack.Screen name="vehicles/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="pending" options={{ headerShown: false }} />
    </Stack>
  )
}
