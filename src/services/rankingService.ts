import { getSupabase } from '../lib/supabase'
import type { Seller } from '../types'
import { getAvatarUrl } from '../utils/format'
import { isPaidStatus } from '../utils/paidStatus'

interface VendedorRow {
  id: string
  nome: string
  foto: string | null
}

interface PropostaRow {
  vendedor_id: string | null
  valor: number | null
  status: string | null
}

export async function loadSellersFromSupabase(): Promise<Seller[]> {
  const supabase = getSupabase()

  const [{ data: vendedores, error: vendedoresError }, { data: propostas, error: propostasError }] =
    await Promise.all([
      supabase.from('vendedores').select('id, nome, foto'),
      supabase.from('propostas').select('vendedor_id, valor, status'),
    ])

  if (vendedoresError) {
    throw new Error(`Erro ao carregar vendedores: ${vendedoresError.message}`)
  }

  if (propostasError) {
    throw new Error(`Erro ao carregar propostas: ${propostasError.message}`)
  }

  if (!propostas?.length) {
    throw new Error(
      'Nenhuma proposta encontrada no Supabase. Execute supabase/rls-policies.sql no SQL Editor para liberar leitura publica.',
    )
  }

  const stats = new Map<string, { paidProposals: number; totalValue: number }>()

  for (const proposta of (propostas ?? []) as PropostaRow[]) {
    if (!proposta.vendedor_id || !isPaidStatus(proposta.status)) continue

    const current = stats.get(proposta.vendedor_id) ?? {
      paidProposals: 0,
      totalValue: 0,
    }

    current.paidProposals += 1
    current.totalValue += Number(proposta.valor ?? 0)
    stats.set(proposta.vendedor_id, current)
  }

  const ranked = ((vendedores ?? []) as VendedorRow[])
    .map((vendedor) => {
      const sellerStats = stats.get(vendedor.id) ?? {
        paidProposals: 0,
        totalValue: 0,
      }

      return {
        id: vendedor.id,
        name: vendedor.nome,
        avatar: vendedor.foto || getAvatarUrl(vendedor.nome),
        paidProposals: sellerStats.paidProposals,
        totalValue: sellerStats.totalValue,
        goalValue: 1,
      }
    })
    .filter((seller) => seller.paidProposals > 0)
    .sort((a, b) => b.totalValue - a.totalValue)

  if (!ranked.length) {
    throw new Error('Nenhuma proposta paga encontrada no Supabase.')
  }

  const topValue = Math.max(...ranked.map((seller) => seller.totalValue), 1)

  return ranked.map((seller) => ({
    ...seller,
    goalValue: topValue,
  }))
}
