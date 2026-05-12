export const colors = {
  // Brand
  primary:     '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight:'#A5B4FC',
  secondary:   '#10B981',

  // Semantic
  success:     '#22C55E',
  warning:     '#F59E0B',
  error:       '#EF4444',
  info:        '#3B82F6',

  // Balance specific
  credit:      '#22C55E',
  debit:       '#EF4444',
  neutral:     '#6B7280',

  // Grays
  gray50:      '#F9FAFB',
  gray100:     '#F3F4F6',
  gray200:     '#E5E7EB',
  gray300:     '#D1D5DB',
  gray400:     '#9CA3AF',
  gray500:     '#6B7280',
  gray600:     '#4B5563',
  gray700:     '#374151',
  gray800:     '#1F2937',
  gray900:     '#111827',

  // Surface
  background:  '#F9FAFB',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F3F4F6',

  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const

export type ColorToken = keyof typeof colors
