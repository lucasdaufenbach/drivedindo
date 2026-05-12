/**
 * Formata valor em reais (BRL).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata saldo com sinal (+/-).
 */
export function formatBalance(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  if (value > 0.01) return `+${formatted}`
  if (value < -0.01) return `-${formatted}`
  return formatted
}

/**
 * Formata quilometragem.
 */
export function formatKm(km: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(km) + ' km'
}

/**
 * Formata percentual.
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Formata data para exibição.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Formata data e hora.
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formata data relativa (ex: "há 2 dias").
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `Há ${diffDays} dias`
  return formatDate(dateStr)
}

/**
 * Formata nome abreviado (Primeiro + inicial do sobrenome).
 */
export function formatShortName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}
