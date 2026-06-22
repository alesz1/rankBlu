import { motion } from 'framer-motion'
import type { Seller } from '../types'
import { formatCurrency, getPercentage } from '../data'

const BADGES = ['🥇', '🥈', '🥉']

interface LeaderboardCardProps {
  seller: Seller
  rank: number
  showPercentage: boolean
  showScore: boolean
  index: number
}

export function LeaderboardCard({
  seller,
  rank,
  showPercentage,
  showScore,
  index,
}: LeaderboardCardProps) {
  const pct = getPercentage(seller)
  const topClass = rank <= 3 ? `top-${rank}` : ''

  return (
    <motion.div
      layout
      className={`leaderboard-card ${topClass}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        layout: { type: 'spring', stiffness: 200, damping: 25 },
        delay: index * 0.04,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {rank <= 3 ? (
        <motion.span
          className="rank-badge"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
        >
          {BADGES[rank - 1]}
        </motion.span>
      ) : (
        <span className="rank-number">{rank}</span>
      )}

      <img src={seller.avatar} alt={seller.name} className="card-avatar" />

      <div className="card-info">
        <div className="card-name">{seller.name}</div>
        <div className="progress-bar-wrap">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ delay: index * 0.04 + 0.3, duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="card-stats">
          <span>Propostas: {seller.paidProposals}</span>
          {showScore && <span>Valor: {formatCurrency(seller.totalValue)}</span>}
          {showPercentage && <span className="pct">{pct}%</span>}
        </div>
      </div>
    </motion.div>
  )
}
