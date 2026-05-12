import { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '@store/auth.store'
import { useSyncStore } from '@store/sync.store'
import { useNetworkStatus } from '@hooks/useNetworkStatus'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
})

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore()
  const { processQueue } = useSyncStore()
  const isOnline = useNetworkStatus()

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isInitialized && fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [isInitialized, fontsLoaded])

  // Processar fila offline ao voltar online
  useEffect(() => {
    if (isOnline) {
      processQueue()
    }
  }, [isOnline, processQueue])

  if (!isInitialized || !fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
