import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import { colors, spacing, typography, radius, shadows } from '@theme/index'

interface Props {
  children: ReactNode
  style?: object
}

export function Card({ children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  )
}

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  disabled = false, loading = false, icon,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        (disabled || loading) && styles.button_disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {icon && <View style={styles.buttonIcon}>{icon}</View>}
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`], styles[`buttonText_${size}`]]}>
        {loading ? 'Aguarde...' : title}
      </Text>
    </TouchableOpacity>
  )
}

interface BadgeProps {
  label: string
  color?: string
  textColor?: string
}

export function Badge({ label, color = colors.primary, textColor = colors.white }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    ...shadows.md,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  button_primary:   { backgroundColor: colors.primary },
  button_secondary: { backgroundColor: colors.secondary },
  button_outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  button_ghost:     { backgroundColor: 'transparent' },
  button_danger:    { backgroundColor: colors.error },
  button_disabled:  { opacity: 0.5 },

  button_sm: { height: 36, paddingHorizontal: spacing[3] },
  button_md: { height: 48, paddingHorizontal: spacing[5] },
  button_lg: { height: 56, paddingHorizontal: spacing[6] },

  buttonText: {
    fontFamily: typography.fonts.semibold,
  },
  buttonText_primary:   { color: colors.white },
  buttonText_secondary: { color: colors.white },
  buttonText_outline:   { color: colors.primary },
  buttonText_ghost:     { color: colors.primary },
  buttonText_danger:    { color: colors.white },

  buttonText_sm: { fontSize: typography.sizes.sm },
  buttonText_md: { fontSize: typography.sizes.base },
  buttonText_lg: { fontSize: typography.sizes.lg },

  buttonIcon: { marginRight: spacing[2] },

  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
  },
})
