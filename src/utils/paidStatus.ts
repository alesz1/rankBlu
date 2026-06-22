const PAID_STATUS_VALUES = new Set(['pago', 'paga'])

export function isPaidStatus(status: string | null | undefined): boolean {
  const normalized = String(status ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return PAID_STATUS_VALUES.has(normalized)
}
