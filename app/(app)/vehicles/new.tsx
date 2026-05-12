import { View, Text, StyleSheet } from 'react-native'
import { colors, typography, spacing } from '@theme/index'

export default function NewVehicleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novo Veículo</Text>
      <Text style={styles.subtitle}>Em breve</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: typography.sizes['2xl'], fontFamily: typography.fonts.bold, color: colors.gray900 },
  subtitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.regular, color: colors.gray500, marginTop: spacing[2] },
})
