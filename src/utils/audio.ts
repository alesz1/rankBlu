// Base64 audio string for a subtle 'ding' sound
const DING_SOUND = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
// Note: For a real ding sound, we should use a proper base64 encoded MP3 or WAV.
// Because generating a full audio file in base64 here without external resources is tricky,
// we will use a small beep synthesized via the Web Audio API instead, which is more reliable.

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
