import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { User, Car, LogOut, ChevronRight, Shield } from 'lucide-react-native'
import { useAuthStore } from '@store/auth.store'
import { useVehicleStore } from '@store/vehicle.store'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

export default function SettingsScreen() {
  const { profile, signOut } = useAuthStore()
  const { vehicles, activeVehicleId, setActiveVehicle } = useVehicleStore()

  const handleSignOut = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login') } },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Configurações</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(profile?.full_name ?? '?')[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{profile?.full_name ?? 'Usuário'}</Text>
            <Text style={styles.profileRole}>Membro do veículo</Text>
          </View>
        </View>

        {/* Veículos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veículos</Text>
          {vehicles.map(v => (
            <TouchableOpacity
              key={v.id}
              style={styles.row}
              onPress={() => router.push(`/(app)/vehicles/${v.id}`)}
            >
              <Car size={18} color={colors.gray500} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{v.name}</Text>
                <Text style={styles.rowSub}>{v.plate}</Text>
              </View>
              {v.id === activeVehicleId && (
                <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Ativo</Text></View>
              )}
              <ChevronRight size={18} color={colors.gray400} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/vehicles/index')}>
            <Car size={18} color={colors.primary} />
            <Text style={[styles.rowTitle, { color: colors.primary, flex: 1 }]}>Gerenciar veículos</Text>
            <ChevronRight size={18} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Ações */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <LogOut size={18} color={colors.error} />
            <Text style={[styles.rowTitle, { color: colors.error, flex: 1 }]}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  title: { fontSize: typography.sizes['2xl'], fontFamily: typography.fonts.bold, color: colors.gray900 },
  content: { padding: spacing[5], gap: spacing[4] },
  profileCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[5], flexDirection: 'row', alignItems: 'center', gap: spacing[4], ...shadows.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.sizes['2xl'], fontFamily: typography.fonts.bold, color: colors.white },
  profileName: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold, color: colors.gray900 },
  profileRole: { fontSize: typography.sizes.sm, color: colors.gray500, marginTop: 2 },
  section: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing[2], ...shadows.sm },
  sectionTitle: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold, color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[1] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  rowTitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.medium, color: colors.gray900 },
  rowSub: { fontSize: typography.sizes.xs, color: colors.gray500, marginTop: 2 },
  activeBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.primary + '15' },
  activeBadgeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium, color: colors.primary },
})
