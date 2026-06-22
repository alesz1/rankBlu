import { useCallback, useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { applyPhotosMap } from './applySellerPhotos'
import { Podium } from './components/Podium'
import { LeaderboardCard } from './components/LeaderboardCard'
import { MoneyRain } from './components/MoneyRain'
import { PhotoManagerModal } from './components/PhotoManagerModal'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { loadSellersFromSupabase } from './data'
import { isSupabaseConfigured } from './lib/supabase'
import { playRankChangeSound } from './utils/audio'
import { loadSavedTheme } from './utils/theme'
import type { Seller } from './types'

const CIRCLE_R = 22
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R

export default function App() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPercentage, setShowPercentage] = useState(true)
  const [showScore, setShowScore] = useState(true)
  const [interval, setInterval_] = useState(30)
  const [countdown, setCountdown] = useState(30)
  const [playing, setPlaying] = useState(true)
  const [key, setKey] = useState(0)
  const [photoManagerOpen, setPhotoManagerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const prevSellersRef = useRef<string[]>([])

  const loadData = useCallback(async () => {
    try {
      setError(null)

      if (!isSupabaseConfigured()) {
        throw new Error(
          'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env',
        )
      }

      const data = await loadSellersFromSupabase()
      
      const newOrder = data.map(s => s.id)
      const oldOrder = prevSellersRef.current
      if (oldOrder.length > 0) {
        const orderChanged = newOrder.some((id, idx) => id !== oldOrder[idx])
        if (orderChanged) {
          playRankChangeSound()
        }
      }
      prevSellersRef.current = newOrder

      setSellers(data)
      setKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePhotosUpdated = useCallback((photos: Record<string, string>) => {
    setSellers((current) => applyPhotosMap(current, photos))
    setKey((k) => k + 1)
  }, [])

  const refresh = useCallback(async () => {
    setCountdown(interval)
    await loadData()
  }, [interval, loadData])

  useEffect(() => {
    loadSavedTheme()
    loadData()
  }, [loadData])

  useEffect(() => {
    setCountdown(interval)
  }, [interval])

  useEffect(() => {
    if (!playing) return

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          void loadData()
          return interval
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [playing, interval, loadData])

  const top3 = sellers.slice(0, 3)
  const rest = sellers
  const progress = ((interval - countdown) / interval) * CIRCUMFERENCE

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="ranking-name">
            Nome do Ranking: <strong>SouBlu · Propostas Pagas</strong>
          </div>
        </div>

        <h1 className="header-title">
          <span className="trophy">🏆</span>
          Ranking de vendas
        </h1>

        <div className="header-controls">
          <label className="toggle-group">
            Exibir Porcentagem
            <span className="toggle">
              <input
                type="checkbox"
                checked={showPercentage}
                onChange={(e) => setShowPercentage(e.target.checked)}
              />
              <span className="toggle-slider" />
            </span>
          </label>
          <label className="toggle-group">
            Exibir pontuação
            <span className="toggle">
              <input
                type="checkbox"
                checked={showScore}
                onChange={(e) => setShowScore(e.target.checked)}
              />
              <span className="toggle-slider" />
            </span>
          </label>
        </div>
      </header>

      <main className="main">
        {loading ? (
          <div className="state-message">Carregando ranking...</div>
        ) : error ? (
          <div className="state-message error">{error}</div>
        ) : (
          <>
            <Podium
              key={`podium-${key}`}
              top3={top3}
              showPercentage={showPercentage}
              showScore={showScore}
            />

            <section className="leaderboard-section">
              <motion.div layout className="leaderboard-grid">
                <AnimatePresence>
                  {rest.map((seller, i) => (
                    <LeaderboardCard
                      key={seller.id}
                      seller={seller}
                      rank={i + 1}
                      showPercentage={showPercentage}
                      showScore={showScore}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          </>
        )}

        <Sidebar
          activeInterval={interval}
          onIntervalChange={setInterval_}
          onRefresh={() => void refresh()}
          onOpenPhotos={() => setPhotoManagerOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </main>

      <PhotoManagerModal
        open={photoManagerOpen}
        sellers={sellers}
        onClose={() => setPhotoManagerOpen(false)}
        onPhotosUpdated={handlePhotosUpdated}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <MoneyRain />

      <footer className="footer">
        <div className="footer-left">
          <div className="footer-dot" />
          <span className="footer-status">
            {sellers.length} vendedores · Supabase · Atualização automática
          </span>
        </div>

        <div className="footer-right">
          <span className="countdown-text">
            O Ranking atualizará em <strong>{countdown}s</strong>...
          </span>
          <div className="play-btn-wrap">
            <svg className="countdown-ring" width="48" height="48" viewBox="0 0 48 48">
              <circle className="track" cx="24" cy="24" r={CIRCLE_R} />
              <circle
                className="progress"
                cx="24"
                cy="24"
                r={CIRCLE_R}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE - progress}
              />
            </svg>
            <button
              className="play-btn"
              onClick={() => setPlaying((p) => !p)}
              title={playing ? 'Pausar' : 'Retomar'}
            >
              {playing ? '⏸' : '▶'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
