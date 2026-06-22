export interface Seller {
  id: string
  name: string
  avatar: string
  paidProposals: number
  totalValue: number
  goalValue: number
  previousRank?: number | null
}

export interface HighlightsData {
  biggestSaleValue: number
  biggestSaleSellerName: string
  mostProposalsValue: number
  mostProposalsSellerName: string
  bestSellerValue: number
  bestSellerName: string
  averagePerSeller: number
}

export interface RankingConfig {
  name: string
  showPercentage: boolean
  showScore: boolean
  refreshInterval: number
}
