import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { playRankChangeSound } from '../utils/audio'

const INTERVALS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
]

interface SidebarProps {
  activeInterval: number
  onIntervalChange: (seconds: number) => void
  onRefresh: () => void
  onOpenPhotos: () => void
  onOpenSettings: () => void
}

export function Sidebar({
  activeInterval,
  onIntervalChange,
  onRefresh,
  onOpenPhotos,
  onOpenSettings,
}: SidebarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <aside className="sidebar">
      {INTERVALS.map((item, i) => (
        <motion.button
          key={item.value}
          className={`sidebar-btn ${activeInterval === item.value ? 'active' : ''}`}
          onClick={() => onIntervalChange(item.value)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          {item.label}
        </motion.button>
      ))}

      <div className="sidebar-spacer" />

      <motion.button
        className="sidebar-icon-btn"
        onClick={toggleFullscreen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
      >
        {isFullscreen ? '⛶' : '📺'}
      </motion.button>

      <motion.button
        className="sidebar-icon-btn"
        onClick={() => playRankChangeSound()}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Testar Som de Ultrapassagem"
      >
        🎵
      </motion.button>

      <motion.button
        className="sidebar-icon-btn"
        onClick={onRefresh}
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        title="Atualizar agora"
      >
        ↻
      </motion.button>

      <motion.button
        className="sidebar-icon-btn"
        onClick={onOpenPhotos}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Fotos dos vendedores"
      >
        🖼
      </motion.button>

      <motion.button
        className="sidebar-icon-btn"
        onClick={onOpenSettings}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Configurações"
      >
        ⚙
      </motion.button>
    </aside>
  )
}
