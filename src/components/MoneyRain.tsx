import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const MONEY_EMOJIS = ['💸', '💵', '💰', '🤑', '🪙']

interface MoneyParticle {
  id: number
  x: number
  emoji: string
  delay: number
  duration: number
  size: number
}

export function MoneyRain() {
  const [particles, setParticles] = useState<MoneyParticle[]>([])

  useEffect(() => {
    const triggerRain = () => {
      const newParticles = Array.from({ length: 40 }).map((_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100, // percentage across screen width
        emoji: MONEY_EMOJIS[Math.floor(Math.random() * MONEY_EMOJIS.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2, // 2s to 4s falling
        size: 24 + Math.random() * 24, // 24px to 48px
      }))

      setParticles((prev) => [...prev, ...newParticles])

      // Clean up particles after animation
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.some(np => np.id === p.id)))
      }, 5000)
    }

    window.addEventListener('money-rain', triggerRain)
    return () => window.removeEventListener('money-rain', triggerRain)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: -100, x: `${p.x}vw`, rotate: 0 }}
            animate={{ 
              opacity: [1, 1, 0], 
              y: '110vh', 
              x: [`${p.x}vw`, `${p.x - 5}vw`, `${p.x + 5}vw`],
              rotate: 360 
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              fontSize: p.size,
              filter: 'drop-shadow(0 0 10px rgba(0, 255, 0, 0.5))'
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
