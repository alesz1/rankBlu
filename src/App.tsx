import { useCallback, useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Podium } from './components/Podium'
import { LeaderboardCard } from './components/LeaderboardCard'
import { MoneyRain } from './components/MoneyRain'
import { SummaryCards } from './components/SummaryCards'
import { HighlightsPanel } from './components/HighlightsPanel'
import { ProgressBar } from './components/ProgressBar'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { loadSellersFromSupabase } from './data'
import { isSupabaseConfigured } from './lib/supabase'
import { playRankChangeSound, playVictorySound } from './utils/audio'
import { loadSavedTheme } from './utils/theme'
import type { Seller, HighlightsData } from './types'

const CIRCLE_R = 22
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R
const META_GERAL = 1000000

export default function App() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [highlights, setHighlights] = useState<HighlightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showPercentage, setShowPercentage] = useState(true)
  const [showScore, setShowScore] = useState(true)
  const [interval, setInterval_] = useState(30)
  const [countdown, setCountdown] = useState(30)
  const [playing, setPlaying] = useState(true)
  const [key, setKey] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isTVMode, setIsTVMode] = useState(false)
  
  const prevSellersRef = useRef<string[]>([])
  const prevLeaderRef = useRef<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)

      if (!isSupabaseConfigured()) {
        throw new Error(
          'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env',
        )
      }

      const { sellers: fetchedSellers, highlights: fetchedHighlights } = await loadSellersFromSupabase()
      
      const newOrder = fetchedSellers.map(s => s.id)
      const oldOrder = prevSellersRef.current
      
      // Assinala posições anteriores
      const sellersWithRank = fetchedSellers.map((seller) => {
        const prevIdx = oldOrder.indexOf(seller.id)
        return {
          ...seller,
          previousRank: oldOrder.length > 0 && prevIdx !== -1 ? prevIdx + 1 : null
        }
      })
      
      if (oldOrder.length > 0) {
        const orderChanged = newOrder.some((id, i) => id !== oldOrder[i])
        if (orderChanged) {
          playRankChangeSound()
        }
        
        // Verifica se o líder mudou
        if (newOrder[0] && prevLeaderRef.current && newOrder[0] !== prevLeaderRef.current) {
          playVictorySound()
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.3 },
            zIndex: 9999
          })
          // Um pequeno toast poderia ser feito aqui, mas o confete já é um ótimo aviso visual
        }
      }
      
      prevSellersRef.current = newOrder
      prevLeaderRef.current = newOrder[0] || null

      setSellers(sellersWithRank)
      setHighlights(fetchedHighlights)
      setKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
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

  const toggleTVMode = () => {
    setIsTVMode(!isTVMode)
    if (!isTVMode) {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn('Fullscreen não permitido automaticamente.')
      })
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }

  const top3 = sellers.slice(0, 3)
  const rest = sellers
  const progress = ((interval - countdown) / interval) * CIRCUMFERENCE
  const totalValueGeral = sellers.reduce((acc, curr) => acc + curr.totalValue, 0)

  return (
    <div className={`app ${isTVMode ? 'tv-mode' : ''}`}>
      {!isTVMode && (
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
      )}

      <main className="main">
        {loading ? (
          <div className="state-message">Carregando ranking...</div>
        ) : error ? (
          <div className="state-message error">{error}</div>
        ) : (
          <div className="dashboard-layout">
            <SummaryCards sellers={sellers} highlights={highlights} />
            
            <ProgressBar total={totalValueGeral} goal={META_GERAL} />

            <div className="dashboard-content">
              <div className="ranking-col">
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
              </div>
              
              {isTVMode && <HighlightsPanel highlights={highlights} />}
            </div>
          </div>
        )}

        {!isTVMode && (
          <Sidebar
            activeInterval={interval}
            isTVMode={isTVMode}
            onIntervalChange={setInterval_}
            onRefresh={() => void refresh()}
            onToggleTVMode={toggleTVMode}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
        
        {/* Floating TV Mode button exit */}
        {isTVMode && (
          <button className="tv-mode-exit" onClick={toggleTVMode} title="Sair do Modo TV">
            ⛶ Sair
          </button>
        )}
      </main>

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

        <div className="footer-center-bar">
          <div className="countdown-progress-bar">
            <div 
              className="countdown-progress-fill" 
              style={{ width: `${((interval - countdown) / interval) * 100}%` }} 
            />
          </div>
          <span className="countdown-seconds">{countdown}s</span>
        </div>

        <div className="footer-right">
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
