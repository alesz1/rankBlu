import type { Seller } from './types'
import { isPaidStatus } from './utils/paidStatus'

const CSV_PATH = '/data/propostas.csv'

function parseCsvLine(line: string): string[] {
  const cols: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ';' && !inQuotes) {
      cols.push(cur)
      cur = ''
      continue
    }
    cur += char
  }

  cols.push(cur)
  return cols
}

function parseNumber(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0

  if (trimmed.includes(',')) {
    const normalized = trimmed.replace(/\./g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

function titleCase(name: string): string {
  return normalizeName(name)
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function slugify(name: string): string {
  return normalizeName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0a1040&color=00d4ff&bold=true&size=128`
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function getPercentage(seller: Seller): number {
  if (seller.goalValue <= 0) return 0
  return Math.round((seller.totalValue / seller.goalValue) * 100)
}

export function parsePropostasCsv(csvText: string): Seller[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0]).map((col) => col.replace(/"/g, '').trim())
  const indexes = {
    vendedor: header.indexOf('Vendedor'),
    valorFinal: header.indexOf('Valor Final (R$)'),
    status: header.indexOf('Status'),
    situacao: header.indexOf('Situação vendedor'),
  }

  if (indexes.vendedor === -1 || indexes.valorFinal === -1) {
    throw new Error('CSV inválido: colunas obrigatórias não encontradas.')
  }

  const grouped = new Map<string, { paidProposals: number; totalValue: number }>()

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line)
    const status = (cols[indexes.status] ?? '').trim()
    const situacao = (cols[indexes.situacao] ?? '').trim()
    const isPaid = isPaidStatus(status) || isPaidStatus(situacao)

    if (!isPaid) continue

    const rawName = cols[indexes.vendedor] ?? ''
    const name = titleCase(rawName)
    if (!name) continue

    const value = parseNumber(cols[indexes.valorFinal] ?? '0')
    const current = grouped.get(name) ?? { paidProposals: 0, totalValue: 0 }
    current.paidProposals += 1
    current.totalValue += value
    grouped.set(name, current)
  }

  const topValue = Math.max(
    ...[...grouped.values()].map((item) => item.totalValue),
    1,
  )

  return [...grouped.entries()]
    .map(([name, stats]) => ({
      id: slugify(name),
      name,
      avatar: getAvatarUrl(name),
      paidProposals: stats.paidProposals,
      totalValue: stats.totalValue,
      goalValue: topValue,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
}

export async function loadSellersFromCsv(path = CSV_PATH): Promise<Seller[]> {
  const response = await fetch(`${path}?t=${Date.now()}`)
  if (!response.ok) {
    throw new Error('Não foi possível carregar o arquivo CSV.')
  }

  const csvText = await response.text()
  const sellers = parsePropostasCsv(csvText)

  if (sellers.length === 0) {
    throw new Error('Nenhuma proposta paga encontrada no CSV.')
  }

  return sellers
}
