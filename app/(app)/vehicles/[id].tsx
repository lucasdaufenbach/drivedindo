import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { colors, typography, spacing } from '@theme/index'

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Veículo</Text>
      <Text style={styles.subtitle}>{id}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: typography.sizes['2xl'], fontFamily: typography.fonts.bold, color: colors.gray900 },
  subtitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.regular, color: colors.gray500, marginTop: spacing[2] },
})
