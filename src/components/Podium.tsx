import { motion } from 'framer-motion'
import type { Seller } from '../types'
import { formatCurrency, getPercentage } from '../data'
import { getAvatarUrl } from '../utils/format'

const MEDALS = ['🥇', '🥈', '🥉']
const SHIELD_CLASS = ['gold', 'silver', 'bronze'] as const
const RANK_CLASS = ['rank-1', 'rank-2', 'rank-3'] as const

interface PodiumProps {
  top3: Seller[]
  showPercentage: boolean
  showScore: boolean
}

const podiumVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15 + 0.2,
      duration: 0.7,
      type: 'spring',
      stiffness: 120,
      damping: 14,
    },
  }),
}

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export function Podium({ top3, showPercentage, showScore }: PodiumProps) {
  const order = [top3[1], top3[0], top3[2]]

  return (
    <section className="podium-section">
      <div className="podium-stage">
        <div className="podium-spotlight-beam" />
        <div className="podium-floor" />
        <div className="podium-floor-glow" />
        <div className="podium-sphere s1" />
        <div className="podium-sphere s2" />
        <div className="podium-sphere s3" />

        {order.map((seller, visualIndex) => {
          if (!seller) return null
          const rankIndex = top3.indexOf(seller)
          const shield = SHIELD_CLASS[rankIndex]
          const rankClass = RANK_CLASS[rankIndex]
          const pct = getPercentage(seller)

          return (
            <motion.div
              layout
              key={seller.id}
              className={`podium-card ${rankClass}`}
              custom={visualIndex}
              variants={podiumVariants}
              initial="hidden"
              animate="visible"
              transition={{ layout: { type: 'spring', stiffness: 200, damping: 25 } }}
            >
              <div className={`podium-avatar-stack ${shield}`}>
                {rankIndex === 0 ? (
                  <motion.div
                    className="podium-crown"
                    variants={floatVariants}
                    animate="animate"
                  >
                    👑
                  </motion.div>
                ) : (
                  <motion.div
                    className="podium-badge"
                    variants={floatVariants}
                    animate="animate"
                    style={{ animationDelay: `${rankIndex * 0.5}s` }}
                  >
                    {MEDALS[rankIndex]}
                  </motion.div>
                )}

                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className={`podium-avatar-hero ${shield}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getAvatarUrl(seller.name)
                  }}
                />
              </div>

              <motion.div
                className={`podium-shield ${shield}`}
                animate={
                  rankIndex === 0
                    ? {
                        boxShadow: [
                          '0 0 30px rgba(255, 215, 0, 0.3)',
                          '0 0 50px rgba(255, 215, 0, 0.6)',
                          '0 0 30px rgba(255, 215, 0, 0.3)',
                        ],
                      }
                    : undefined
                }
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="podium-name">{seller.name}</span>
                {showScore && (
                  <span className="podium-score">{formatCurrency(seller.totalValue)}</span>
                )}
                {showPercentage && (
                  <span className="podium-score">{pct}%</span>
                )}
                <span className="podium-score subtle">
                  {seller.paidProposals} propostas
                </span>
              </motion.div>

              <div className={`podium-pedestal ${shield}`} />
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
