export type Theme = {
  id: string
  name: string
  cyan: string
  cyanDim: string
}

export const PREDEFINED_THEMES: Theme[] = [
  { id: 'default', name: 'Azul Neon (Padrão)', cyan: '#00d4ff', cyanDim: '#0099cc' },
  { id: 'cyberpunk', name: 'Cyberpunk (Rosa)', cyan: '#ff00ff', cyanDim: '#cc00cc' },
  { id: 'matrix', name: 'Matrix (Verde)', cyan: '#00ff41', cyanDim: '#00cc33' },
  { id: 'blood', name: 'Ruby (Vermelho)', cyan: '#ff3333', cyanDim: '#cc0000' },
  { id: 'gold', name: 'Amber (Laranja)', cyan: '#ffaa00', cyanDim: '#cc8800' },
]

export function applyThemeColors(cyan: string, cyanDim: string) {
  const root = document.documentElement
  root.style.setProperty('--cyan', cyan)
  root.style.setProperty('--cyan-dim', cyanDim)
  
  // We can save to localStorage
  localStorage.setItem('public_rank_theme_cyan', cyan)
  localStorage.setItem('public_rank_theme_cyandim', cyanDim)
}

export function loadSavedTheme() {
  const cyan = localStorage.getItem('public_rank_theme_cyan')
  const cyanDim = localStorage.getItem('public_rank_theme_cyandim')
  if (cyan && cyanDim) {
    applyThemeColors(cyan, cyanDim)
  }
}

// Generate random neon-like color
export function applyRandomTheme() {
  const hue = Math.floor(Math.random() * 360)
  // Neon colors usually have high saturation and lightness around 50-60%
  const cyan = `hsl(${hue}, 100%, 50%)`
  const cyanDim = `hsl(${hue}, 100%, 40%)`
  applyThemeColors(cyan, cyanDim)
}
