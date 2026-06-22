import { motion } from 'framer-motion'
import { formatCurrency } from '../utils/format'
import type { HighlightsData } from '../types'

interface HighlightsPanelProps {
  highlights: HighlightsData | null
}

export function HighlightsPanel({ highlights }: HighlightsPanelProps) {
  if (!highlights) return null

  const items = [
    {
      title: 'Maior Venda',
      value: formatCurrency(highlights.biggestSaleValue),
      sub: highlights.biggestSaleSellerName,
      icon: '🔥',
    },
    {
      title: 'Mais Propostas',
      value: `${highlights.mostProposalsValue} pagas`,
      sub: highlights.mostProposalsSellerName,
      icon: '🎯',
    },
    {
      title: 'Melhor Vendedor',
      value: formatCurrency(highlights.bestSellerValue),
      sub: highlights.bestSellerName,
      icon: '⭐',
    },
    {
      title: 'Média por Vendedor',
      value: formatCurrency(highlights.averagePerSeller),
      sub: 'Geral',
      icon: '📊',
    },
  ]

  return (
    <aside className="highlights-panel">
      <h3 className="highlights-title">Destaques</h3>
      <div className="highlights-list">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            className="highlight-item"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <div className="highlight-icon">{item.icon}</div>
            <div className="highlight-content">
              <span className="highlight-item-title">{item.title}</span>
              <span className="highlight-item-value">{item.value}</span>
              <span className="highlight-item-sub">{item.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </aside>
  )
}
