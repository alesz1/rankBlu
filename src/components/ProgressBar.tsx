import { motion } from 'framer-motion'
import { formatCurrency } from '../utils/format'

interface ProgressBarProps {
  total: number
  goal: number
}

export function ProgressBar({ total, goal }: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((total / goal) * 100))

  return (
    <div className="goal-progress-container">
      <div className="goal-progress-header">
        <span className="goal-progress-title">Meta Geral: {formatCurrency(goal)}</span>
        <span className="goal-progress-percentage">{percentage}% atingido</span>
      </div>
      <div className="goal-progress-track">
        <motion.div
          className="goal-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <div className="goal-progress-glow" />
        </motion.div>
      </div>
    </div>
  )
}
