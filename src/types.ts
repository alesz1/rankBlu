export interface Seller {
  id: string
  name: string
  avatar: string
  paidProposals: number
  totalValue: number
  goalValue: number
}

export interface RankingConfig {
  name: string
  showPercentage: boolean
  showScore: boolean
  refreshInterval: number
}
