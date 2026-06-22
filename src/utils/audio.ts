
export function playRankChangeSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    
    // Frequências para um arpejo "Level Up" (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50]
    const noteDuration = 0.08
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc.type = 'square' // Tipo square dá aquele tom retrô/arcade
      osc.frequency.value = freq
      
      const startTime = ctx.currentTime + (i * noteDuration)
      const stopTime = startTime + noteDuration
      
      // Envelope de volume (ataque rápido, decaimento exponencial)
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, stopTime)
      
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc.start(startTime)
      osc.stop(stopTime)
    })
    
    // Dispara o evento de chuva de dinheiro
    window.dispatchEvent(new Event('money-rain'))
  } catch (err) {
    console.warn('Could not play sound:', err)
  }
}

export function playVictorySound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    
    // Fanfare notas (C5, E5, G5, C6) mas com acordes ou ritmo diferente
    const notes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 523.25, d: 0.15 }, // C5
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.40 }, // E5 longo
    ]
    
    let startTime = ctx.currentTime
    
    notes.forEach(({ f, d }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc.type = 'square'
      osc.frequency.value = f
      
      const stopTime = startTime + d
      
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.001, stopTime)
      
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc.start(startTime)
      osc.stop(stopTime)
      
      startTime += d + 0.05
    })
  } catch (err) {
    console.warn('Could not play victory sound:', err)
  }
}
