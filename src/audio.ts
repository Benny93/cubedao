// Sound made as it plays, no sound files: blips, footsteps, the rain's hiss, music on a pentatonic zither, and
// crickets and birds. 'Voice: off' in the settings silences all of it.
import { state, STONE, BRICK, PATH, PLANK, WOOD, SAND, SNOW } from './words.ts'
import { uDay } from './render.ts'
import { rain, fireflies } from './sky.ts'

let audio: AudioContext | undefined
/** a click or key press lets the page make sound: start (or resume) it then */
// a hidden tab is silent: the music's timer keeps ticking there, and the rain is only turned down by frames, which stop
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) audio?.suspend(); else audio?.resume() })
export function wakeAudio() { try { (audio ??= new AudioContext()).resume() } catch { /* no audio */ } }
// tiny synth blips
export function blip(...notes: number[]) {
  if (state.opts.voice === 2) return // 'Voice: off' is silence
  try {
    audio ??= new AudioContext()
    notes.forEach((f, i) => {
      const o = audio!.createOscillator(), g = audio!.createGain(), t = audio!.currentTime + i * 0.09
      o.type = 'square'; o.frequency.value = f
      g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
      o.connect(g).connect(audio!.destination); o.start(t); o.stop(t + 0.13)
    })
  } catch { /* no audio: play silently */ }
}
// footsteps: a short burst of filtered noise, brighter on stone and wood, duller on grass, soft on sand and snow
let noise: AudioBuffer | undefined
export function step(id: number) {
  if (state.opts.voice === 2 || !audio) return
  noise ??= (() => { const b = audio!.createBuffer(1, 2400, audio!.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b })()
  const [freq, vol] = id === STONE || id === BRICK || id === PATH ? [2400, 0.05] : id === PLANK || id === WOOD ? [1300, 0.06] : id === SAND || id === SNOW ? [700, 0.05] : [500, 0.07]
  const src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain(), t = audio.currentTime
  src.buffer = noise; f.type = 'lowpass'; f.frequency.value = freq * (0.9 + Math.random() * 0.2)
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  src.connect(f).connect(g).connect(audio.destination); src.start(t)
}
// rain: looped noise, low-passed to a hiss, faded in and out with the weather (snow is near silent)
let rainGain: GainNode | undefined
export function rainSound(level: number) {
  if (!audio || audio.state !== 'running') return
  if (!rainGain) {
    const len = audio.sampleRate * 2, b = audio.createBuffer(1, len, audio.sampleRate), d = b.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    const src = audio.createBufferSource(), f = audio.createBiquadFilter()
    src.buffer = b; src.loop = true; f.type = 'lowpass'; f.frequency.value = 1200
    rainGain = audio.createGain(); rainGain.gain.value = 0
    src.connect(f).connect(rainGain).connect(audio.destination); src.start()
  }
  rainGain.gain.setTargetAtTime(state.opts.voice === 2 ? 0 : level, audio.currentTime, 0.8)
}

// music: a slow random walk on the pentatonic scale (G A B D E), plucked like a zither, with an echo; sparser at night
let music: GainNode | undefined, note = 5, beat = 0
/** start the music and the crickets and birds; `playing`: the player is in the world (not in a menu) */
export function startMusic(playing: () => boolean) {
  setInterval(() => {
    if (!audio || audio.state !== 'running') return
    if (!music) {
      const echo = audio.createDelay(), back = audio.createGain()
      music = audio.createGain(); echo.delayTime.value = 0.36; back.gain.value = 0.32
      music.connect(audio.destination); music.connect(echo).connect(back).connect(echo); back.connect(audio.destination)
    }
    music.gain.setTargetAtTime(state.opts.music ? 0 : 1, audio.currentTime, 0.5)
    if (fireflies.visible && state.opts.voice !== 2 && playing() && Math.random() < 0.35) { // crickets on the same dry nights as the fireflies
      const t0 = audio.currentTime, f = 4200 + Math.random() * 600
      for (let i = 0; i < 3; i++) {
        const o = audio.createOscillator(), g = audio.createGain(), t = t0 + i * 0.07
        o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
        o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.06)
      }
    }
    else if (uDay.value > 0.9 && !rain.visible && state.opts.voice !== 2 && playing() && Math.random() < 0.08) { // by day, now and then a bird: a quick falling whistle
      const t0 = audio.currentTime, f = 2600 + Math.random() * 1400
      for (let i = 0; i < 2; i++) {
        const o = audio.createOscillator(), g = audio.createGain(), t = t0 + i * 0.16
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.12)
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)
        o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.14)
      }
    }
    if (state.opts.music) return
    const pluck = (semi: number, vol: number, len: number) => {
      const t = audio!.currentTime, f = 196 * 2 ** (semi / 12), g = audio!.createGain(), lp = audio!.createBiquadFilter()
      lp.type = 'lowpass'; lp.frequency.value = 1600
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len)
      for (const [type, mul] of [['triangle', 1], ['sine', 2]] as const) {
        const o = audio!.createOscillator(); o.type = type; o.frequency.value = f * mul; o.connect(lp); o.start(t); o.stop(t + len)
      }
      lp.connect(g).connect(music!)
    }
    const scale = (i: number) => [0, 2, 4, 7, 9][i % 5] + 12 * Math.floor(i / 5)
    if (beat++ % 8 === 0) pluck(scale(Math.random() < 0.6 ? 0 : 3) - 12, 0.05, 3) // a low note every few bars
    if (Math.random() < (uDay.value < 0.6 ? 0.3 : 0.55)) { // the melody: mostly steps, sometimes a leap
      note = Math.max(0, Math.min(11, note + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]))
      pluck(scale(note), 0.035, 1.6)
    }
  }, 600)
}
