import { Tabs } from 'expo-router'
import { colors, typography } from '@theme/index'
import { Home, Car, Receipt, BarChart3, Settings } from 'lucide-react-native'
import { usePendingKmCount } from '@hooks/usePendingKmCount'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function PendingBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  )
}

export default function TabsLayout() {
  const pendingCount = usePendingKmCount()
  const insets = useSafeAreaInsets()

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
          paddingBottom: insets.bottom + 4,
          height: 56 + insets.bottom,
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
          tabBarIcon: ({ color, size }) => (
            <View>
              <Car size={size} color={color} />
              <PendingBadge count={pendingCount} />
            </View>
          ),
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
    </Tabs>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: typography.fonts.bold,
    color: colors.white,
  },
})
