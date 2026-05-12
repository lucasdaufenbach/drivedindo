import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Navigation, Clock } from 'lucide-react-native'
import type { Trip } from '@types/domain.types'
import { formatKm, formatDateTime } from '@lib/formatters'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

interface Props {
  trip: Trip
}

export function ActiveTripCard({ trip }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/trips/${trip.id}`)}
      activeOpacity={0.8}
    >
      {/* Badge */}
      <View style={styles.badge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>Viagem em andamento</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Navigation size={22} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.kmStart}>
            Partiu de {formatKm(trip.km_start)}
          </Text>
          <View style={styles.timeRow}>
            <Clock size={12} color={colors.gray400} />
            <Text style={styles.time}>{formatDateTime(trip.started_at)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.endButton}
          onPress={() => router.push(`/(app)/trips/${trip.id}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.endButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  kmStart: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    color: colors.gray900,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.gray400,
  },
  endButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  endButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.white,
  },
})
