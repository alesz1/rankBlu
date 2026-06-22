import { getSupabase } from '../lib/supabase'
import type { Seller, HighlightsData } from '../types'
import { slugify } from '../utils/format'
import { isPaidStatus } from '../utils/paidStatus'

interface VendedorRow {
  id: string
  nome: string
}

interface PropostaRow {
  vendedor_id: string | null
  valor: number | null
  status: string | null
}

export async function loadSellersFromSupabase(): Promise<{ sellers: Seller[], highlights: HighlightsData }> {
  const supabase = getSupabase()

  const [{ data: vendedores, error: vendedoresError }, { data: propostas, error: propostasError }] =
    await Promise.all([
      supabase.from('vendedores').select('id, nome'),
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
  const sellerNames = new Map<string, string>()
  
  // Mapeia nomes para facilitar as estatísticas de Highlights
  for (const v of (vendedores ?? []) as VendedorRow[]) {
    sellerNames.set(v.id, v.nome)
  }

  let biggestSaleValue = 0
  let biggestSaleSellerId = ''

  for (const proposta of (propostas ?? []) as PropostaRow[]) {
    if (!proposta.vendedor_id || !isPaidStatus(proposta.status)) continue

    const valor = Number(proposta.valor ?? 0)
    
    // Calcula maior venda individual
    if (valor > biggestSaleValue) {
      biggestSaleValue = valor
      biggestSaleSellerId = proposta.vendedor_id
    }

    const current = stats.get(proposta.vendedor_id) ?? {
      paidProposals: 0,
      totalValue: 0,
    }

    current.paidProposals += 1
    current.totalValue += valor
    stats.set(proposta.vendedor_id, current)
  }

  const ranked = ((vendedores ?? []) as VendedorRow[])
    .map((vendedor) => {
      const sellerStats = stats.get(vendedor.id) ?? {
        paidProposals: 0,
        totalValue: 0,
      }

      // Usa foto local normalizada. Se falhar, o React fará fallback no <img onError={...} />
      const localAvatar = `/fotos-vendedores/${slugify(vendedor.nome)}.jpg`

      return {
        id: vendedor.id,
        name: vendedor.nome,
        avatar: localAvatar,
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

  const sellers = ranked.map((seller) => ({
    ...seller,
    goalValue: topValue,
  }))

  // Calcula highlights
  let mostProposalsValue = 0
  let mostProposalsSellerId = ''
  let bestSellerValue = 0
  let bestSellerId = ''
  let totalValueAll = 0

  for (const [vendedorId, sellerStats] of stats.entries()) {
    if (sellerStats.paidProposals > mostProposalsValue) {
      mostProposalsValue = sellerStats.paidProposals
      mostProposalsSellerId = vendedorId
    }
    if (sellerStats.totalValue > bestSellerValue) {
      bestSellerValue = sellerStats.totalValue
      bestSellerId = vendedorId
    }
    totalValueAll += sellerStats.totalValue
  }

  const averagePerSeller = sellers.length > 0 ? totalValueAll / sellers.length : 0

  const highlights: HighlightsData = {
    biggestSaleValue,
    biggestSaleSellerName: sellerNames.get(biggestSaleSellerId) ?? 'Desconhecido',
    mostProposalsValue,
    mostProposalsSellerName: sellerNames.get(mostProposalsSellerId) ?? 'Desconhecido',
    bestSellerValue,
    bestSellerName: sellerNames.get(bestSellerId) ?? 'Desconhecido',
    averagePerSeller,
  }

  return { sellers, highlights }
}
