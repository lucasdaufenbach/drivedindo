import type { UserKmSummary, UserPercentage, UserBalance, SettlementSuggestion } from '@types/domain.types'

// ============================================================
// PERCENTUAIS DE USO
// ============================================================

/**
 * Calcula percentual proporcional ao uso real.
 * Se nenhum km foi rodado, divide igualmente.
 */
export function calculateUsagePercentages(users: UserKmSummary[]): UserPercentage[] {
  const totalKm = users.reduce((sum, u) => sum + u.kmDriven, 0)

  if (totalKm === 0) {
    const equalShare = Number((100 / users.length).toFixed(2))
    return users.map(u => ({ ...u, percentage: equalShare }))
  }

  // Calcular percentuais com correção de arredondamento
  const percentages = users.map(u => ({
    ...u,
    percentage: (u.kmDriven / totalKm) * 100,
  }))

  // Garantir que a soma seja exatamente 100%
  const rounded = percentages.map(u => ({
    ...u,
    percentage: Number(u.percentage.toFixed(2)),
  }))

  const sumDiff = 100 - rounded.reduce((sum, u) => sum + u.percentage, 0)
  if (rounded.length > 0 && Math.abs(sumDiff) > 0) {
    // Adicionar diferença ao maior percentual
    const maxIdx = rounded.reduce(
      (maxI, u, i, arr) => (u.percentage > arr[maxI].percentage ? i : maxI),
      0
    )
    rounded[maxIdx].percentage = Number(
      (rounded[maxIdx].percentage + sumDiff).toFixed(2)
    )
  }

  return rounded
}

// ============================================================
// SALDO
// ============================================================

interface RawExpenseData {
  userId: string
  userName: string
  avatarUrl: string | null
  amountPaid: number
  amountOwed: number
}

/**
 * Calcula saldo de cada participante.
 * balance positivo = credor (pagou mais do que deve)
 * balance negativo = devedor (pagou menos do que deve)
 *
 * NUNCA persiste este resultado — sempre calculado dinamicamente.
 */
export function calculateBalances(expenses: RawExpenseData[]): UserBalance[] {
  const map = new Map<string, {
    userName: string
    avatarUrl: string | null
    paid: number
    owed: number
  }>()

  for (const e of expenses) {
    const current = map.get(e.userId) ?? {
      userName: e.userName,
      avatarUrl: e.avatarUrl,
      paid: 0,
      owed: 0,
    }
    map.set(e.userId, {
      ...current,
      paid: current.paid + e.amountPaid,
      owed: current.owed + e.amountOwed,
    })
  }

  return Array.from(map.entries()).map(([userId, data]) => ({
    userId,
    userName: data.userName,
    avatarUrl: data.avatarUrl,
    balance: Number((data.paid - data.owed).toFixed(2)),
    totalPaid: Number(data.paid.toFixed(2)),
    totalOwed: Number(data.owed.toFixed(2)),
  }))
}

// ============================================================
// MINIMIZAÇÃO DE TRANSFERÊNCIAS
// ============================================================

/**
 * Algoritmo greedy de minimização de transferências.
 * Garante o número mínimo de transações necessárias.
 *
 * Complexidade: O(n log n)
 */
export function minimizeSettlements(balances: UserBalance[]): SettlementSuggestion[] {
  const suggestions: SettlementSuggestion[] = []

  const creditors = balances
    .filter(b => b.balance > 0.01)
    .map(b => ({ ...b, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining)

  const debtors = balances
    .filter(b => b.balance < -0.01)
    .map(b => ({ ...b, remaining: Math.abs(b.balance) }))
    .sort((a, b) => b.remaining - a.remaining)

  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const amount = Math.min(creditor.remaining, debtor.remaining)

    suggestions.push({
      from: balances.find(b => b.userId === debtor.userId)!,
      to: balances.find(b => b.userId === creditor.userId)!,
      amount: Number(amount.toFixed(2)),
    })

    creditor.remaining = Number((creditor.remaining - amount).toFixed(2))
    debtor.remaining = Number((debtor.remaining - amount).toFixed(2))

    if (creditor.remaining < 0.01) i++
    if (debtor.remaining < 0.01) j++
  }

  return suggestions
}

// ============================================================
// DETECÇÃO DE KM GAP
// ============================================================

const KM_GAP_TOLERANCE = 0.1 // km

/**
 * Detecta gap de km entre o fim da última viagem e o início da nova.
 */
export function detectKmGap(
  newTripKmStart: number,
  lastRecordedKmEnd: number | null
): { hasGap: true; gapStart: number; gapEnd: number; gapKm: number } | { hasGap: false } {
  if (lastRecordedKmEnd === null) return { hasGap: false }

  const gap = newTripKmStart - lastRecordedKmEnd

  if (gap > KM_GAP_TOLERANCE) {
    return {
      hasGap: true,
      gapStart: lastRecordedKmEnd,
      gapEnd: newTripKmStart,
      gapKm: Number(gap.toFixed(1)),
    }
  }

  return { hasGap: false }
}

// ============================================================
// CÁLCULO DE DESPESA POR PARTICIPANTE
// ============================================================

/**
 * Calcula amount_owed de cada participante baseado nos percentuais.
 */
export function calculateParticipantAmounts(
  totalAmount: number,
  participants: Array<{ userId: string; percentage: number }>
): Array<{ userId: string; percentage: number; amountOwed: number }> {
  const results = participants.map(p => ({
    userId: p.userId,
    percentage: p.percentage,
    amountOwed: Number(((totalAmount * p.percentage) / 100).toFixed(2)),
  }))

  // Corrigir diferença de arredondamento no maior valor
  const sumCalc = results.reduce((s, p) => s + p.amountOwed, 0)
  const diff = Number((totalAmount - sumCalc).toFixed(2))

  if (Math.abs(diff) > 0 && results.length > 0) {
    const maxIdx = results.reduce(
      (maxI, p, i, arr) => (p.amountOwed > arr[maxI].amountOwed ? i : maxI),
      0
    )
    results[maxIdx].amountOwed = Number((results[maxIdx].amountOwed + diff).toFixed(2))
  }

  return results
}
