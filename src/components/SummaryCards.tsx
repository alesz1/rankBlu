import { motion } from 'framer-motion'
import { formatCurrency } from '../utils/format'
import type { Seller, HighlightsData } from '../types'

interface SummaryCardsProps {
  sellers: Seller[]
  highlights: HighlightsData | null
}

export function SummaryCards({ sellers }: SummaryCardsProps) {
  const totalValue = sellers.reduce((acc, curr) => acc + curr.totalValue, 0)
  const totalProposals = sellers.reduce((acc, curr) => acc + curr.paidProposals, 0)
  const avgTicket = totalProposals > 0 ? totalValue / totalProposals : 0
  const leader = sellers[0]?.name ?? 'Nenhum'

  const cards = [
    { label: 'Líder Atual', value: leader, icon: '👑', color: 'var(--neon-gold)' },
    { label: 'Total Vendido', value: formatCurrency(totalValue), icon: '💰', color: 'var(--neon-cyan)' },
    { label: 'Vendedores', value: sellers.length.toString(), icon: '👥', color: 'var(--neon-pink)' },
    { label: 'Propostas Pagas', value: totalProposals.toString(), icon: '✅', color: 'var(--neon-green)' },
    { label: 'Ticket Médio', value: formatCurrency(avgTicket), icon: '📈', color: 'var(--neon-purple)' },
  ]

  return (
    <div className="summary-cards">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          className="summary-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{ '--card-color': card.color } as React.CSSProperties}
        >
          <div className="summary-icon" style={{ textShadow: `0 0 10px ${card.color}` }}>
            {card.icon}
          </div>
          <div className="summary-info">
            <span className="summary-label">{card.label}</span>
            <span className="summary-value" style={{ color: card.color }}>
              {card.value}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
