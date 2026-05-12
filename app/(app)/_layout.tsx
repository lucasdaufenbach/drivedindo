import { Redirect, Tabs } from 'expo-router'
import { useAuthStore } from '@store/auth.store'
import { colors, typography } from '@theme/index'
import { Home, Car, Receipt, BarChart3, Settings } from 'lucide-react-native'
import { useVehicleStore } from '@store/vehicle.store'
import { usePendingKmCount } from '@hooks/usePendingKmCount'
import { View, Text, StyleSheet } from 'react-native'

export default function AppLayout() {
  const { session } = useAuthStore()
  const { activeVehicleId } = useVehicleStore()

  // Protege rotas autenticadas
  if (!session) return <Redirect href="/(auth)/login" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.gray100,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fonts.medium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips/index"
        options={{
          title: 'Viagens',
          tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses/index"
        options={{
          title: 'Despesas',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: 'Saldo',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      {/* Telas sem tab visível */}
      <Tabs.Screen name="trips/new" options={{ href: null }} />
      <Tabs.Screen name="trips/[id]" options={{ href: null }} />
      <Tabs.Screen name="expenses/new" options={{ href: null }} />
      <Tabs.Screen name="expenses/[id]" options={{ href: null }} />
      <Tabs.Screen name="vehicles/index" options={{ href: null }} />
      <Tabs.Screen name="vehicles/new" options={{ href: null }} />
      <Tabs.Screen name="vehicles/[id]" options={{ href: null }} />
      <Tabs.Screen name="pending" options={{ href: null }} />
    </Tabs>
  )
}
