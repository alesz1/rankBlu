import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { PREDEFINED_THEMES, applyThemeColors, applyRandomTheme } from '../utils/theme'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="photo-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="photo-modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="photo-modal-header">
              <div>
                <h2>Configurações de Tema</h2>
                <p>Altere as cores principais do seu ranking.</p>
              </div>
              <button className="photo-modal-close" onClick={onClose} title="Fechar">
                ✕
              </button>
            </div>

            <div className="photo-modal-list" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  className="photo-btn primary"
                  onClick={applyRandomTheme}
                  style={{
                    padding: '16px',
                    fontSize: '16px',
                    background: 'linear-gradient(90deg, #ff00ff, #00d4ff)',
                    border: 'none',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '16px'
                  }}
                >
                  🎲 Gerar Cores Aleatórias
                </button>
                
                <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Temas Pré-definidos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {PREDEFINED_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      className="photo-btn"
                      onClick={() => applyThemeColors(theme.cyan, theme.cyanDim)}
                      style={{
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        border: `1px solid ${theme.cyanDim}`,
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: theme.cyan,
                        boxShadow: `0 0 8px ${theme.cyan}`
                      }}></span>
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
