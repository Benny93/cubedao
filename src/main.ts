import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { type Word, type Part, type Line, BRICK, PATH, PLANK, WOOD, AIR, GRASS, WATER, BAMBOO, STONE, LEAVES, PICKAXE, APPLE, BLACKBOARD, SEEDS, SPROUT, WHEAT, DIRT, DOOR, DOOR_OPEN, BED, CHEST, SNOW, SAND, SAPLING, LETTER, LANTERN, STOVE, COAL, IRON, GOLD, FISH, ROD, BOAT, BLOCKS, V, ALL_WORDS, NPCS, RECIPES, FOOD, DROPS, PLACES, SOUNDS, VERBS, EDIBLE, LAMPS, state, persist, see, level, html, cn, count, dirTo, quest, canCraft, craft, numWord, price, RANKS, rank, known, reviewWord, checkPinyin, STORIES, BOOK, newNotes, zhVoice, repeat, clQuiz, toneQuiz, numQuiz, type Quiz, WEEK, oclock, SHOP, trade, question, chat, isWord, plain, speak, hasClips, unvoiced, pieced, unlockVoice, saidAt, prefetch } from './words.ts'
import * as world from './world.ts'
import { makeAtlas } from './atlas.ts'

const $ = (id: string) => document.getElementById(id)!
const { SX, SZ, CH } = world

// --- renderer ---
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.prepend(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x8fc7ff)
scene.fog = new THREE.Fog(0x8fc7ff, 60, 150)
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 300)
camera.rotation.order = 'YXZ'
const resize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix() }
addEventListener('resize', resize); resize()

const atlas = makeAtlas()
document.documentElement.style.setProperty('--atlas', `url(${atlas.toDataURL()})`)
const tex = new THREE.CanvasTexture(atlas)
tex.magFilter = tex.minFilter = THREE.NearestFilter
tex.generateMipmaps = false
tex.colorSpace = THREE.SRGBColorSpace
// Night is a shader uniform, not an overlay, so lantern light can beat it: every lit material multiplies its colour by
// max(daylight, lamp light at that vertex). Materials without a lamp attribute (animals, sea, clouds) just follow daylight.
const uDay = { value: 1 }
function nightly<T extends THREE.Material>(m: T, lamp = false): T {
  m.onBeforeCompile = sh => {
    sh.uniforms.uDay = uDay
    if (lamp) sh.vertexShader = 'attribute float lamp;\nvarying float vLamp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLamp = lamp;')
    sh.fragmentShader = (lamp ? 'varying float vLamp;\n' : '') + 'uniform float uDay;\n' + sh.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n  ' + (lamp ? 'diffuseColor.rgb *= max(uDay, vLamp) * mix(vec3(1.0), vec3(1.0, 0.8, 0.5), clamp(vLamp - uDay, 0.0, 1.0));' : 'diffuseColor.rgb *= uDay;'))
  }
  m.customProgramCacheKey = () => lamp ? 'lamp' : 'day' // the two variants must not share a compiled program
  return m
}
const mats = [
  nightly(new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), true),
  nightly(new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }), true),
]

// --- world ---
world.generate()
if (state.world !== world.WORLD_V) { // the island changed shape since this save: keep progress and inventory, drop what was built
  state.edits = {}; state.crops = {}; state.placed = {}; state.pos = state.home = undefined; state.world = world.WORLD_V
}
for (const [i, b] of Object.entries(state.edits)) world.data[+i] = b

const NC = SX / CH
const meshes: THREE.Mesh[] = []
function remesh(cx: number, cz: number) {
  if (cx < 0 || cz < 0 || cx >= NC || cz >= NC) return
  world.meshChunk(cx, cz).forEach((b, i) => {
    const k = (cx + cz * NC) * 2 + i
    let m = meshes[k]
    if (!m) scene.add(m = meshes[k] = new THREE.Mesh(undefined, mats[i]))
    m.geometry.dispose()
    m.userData.empty = b.idx.length === 0
    m.visible = !m.userData.empty
    if (!m.visible) return
    const g = m.geometry = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3))
    g.setAttribute('lamp', new THREE.Float32BufferAttribute(b.lamp, 1))
    g.setIndex(b.idx)
  })
}
world.relight()
for (let cz = 0; cz < NC; cz++) for (let cx = 0; cx < NC; cx++) remesh(cx, cz)

// endless ocean: four big sheets around the island's block of sea, out past the fog
const R = 600, seaMat = nightly(new THREE.MeshBasicMaterial({ color: 0x2a6edc, transparent: true, opacity: 0.67, side: THREE.DoubleSide }))
for (const [x0, z0, x1, z1] of [[-R, -R, SX + R, 0], [-R, SZ, SX + R, SZ + R], [-R, 0, 0, SZ], [SX, 0, SX + R, SZ]]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), seaMat)
  m.rotation.x = -Math.PI / 2
  m.position.set((x0 + x1) / 2, world.SEA, (z0 + z1) / 2)
  scene.add(m)
}

// rain: points that fall through a box that follows the camera
const DROPS_N = 3000, rainPos = new Float32Array(DROPS_N * 3).map((_, i) => (Math.random() - 0.5) * (i % 3 === 1 ? 24 : 40))
const rain = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rainPos, 3)),
  nightly(new THREE.PointsMaterial({ color: 0xdfeaff, size: 0.07, transparent: true, opacity: 0.8 })))
rain.frustumCulled = false
scene.add(rain)
const SKY = new THREE.Color(0x8fc7ff), GREY = new THREE.Color(0x8794a3), DUSK = new THREE.Color(0xf5a36b)
const sky = scene.background = (scene.fog as THREE.Fog).color = new THREE.Color(0x8fc7ff) // one colour object for both

// clouds: flat white slabs drifting east; they can be looked at like anything else
const clouds = Array.from({ length: 50 }, () => {
  const w = 8 + Math.random() * 14, l = 6 + Math.random() * 10
  const m = box(w, 1.5, l, 0xffffff, Math.random() * (SX + 150) - 75, 50 + Math.random() * 8, Math.random() * (SZ + 150) - 75)
  ;(m.material as THREE.MeshBasicMaterial).fog = false // else they fade into the sky colour
  scene.add(m)
  return { m, w, l }
})

// stars: points on a dome that follows the camera, shown on clear nights
const starPos = new Float32Array(900)
for (let i = 0; i < 900; i += 3) {
  const a = Math.random() * Math.PI * 2, e = Math.random() * 1.4 + 0.1
  starPos.set([Math.cos(a) * Math.cos(e) * 240, Math.sin(e) * 240, Math.sin(a) * Math.cos(e) * 240], i)
}
const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(starPos, 3)),
  new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, fog: false }))
stars.frustumCulled = false
scene.add(stars)

const glowTex = (() => { // a soft round glow, for fireflies and the halo round the sun and moon
  const c = document.createElement('canvas'), g = c.getContext('2d')!, r = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  c.width = c.height = 32; r.addColorStop(0, '#fff'); r.addColorStop(0.2, '#fffa'); r.addColorStop(1, '#fff0'); g.fillStyle = r; g.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(c)
})()
// fireflies: little lights that drift and blink over the land on dry nights, always somewhere around you
const FF = 48, ffPos = new Float32Array(FF * 3), ffCol = new Float32Array(FF * 3), ffBase = Array.from({ length: FF }, () => ({ x: -999, y: 0, z: 0, ph: Math.random() * 9 }))
const fireflies = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(ffPos, 3)).setAttribute('color', new THREE.BufferAttribute(ffCol, 3)),
  new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex }))
fireflies.frustumCulled = false
scene.add(fireflies)
function updateFireflies(t: number, on: boolean) {
  fireflies.visible = on
  if (!on) return
  ffBase.forEach((f, i) => {
    if (Math.hypot(f.x - p.x, f.z - p.z) > 18) { f.x = Math.max(0, Math.min(SX - 1, p.x + Math.random() * 32 - 16)); f.z = Math.max(0, Math.min(SZ - 1, p.z + Math.random() * 32 - 16)); f.y = world.surface(Math.floor(f.x), Math.floor(f.z)) + 0.6 + Math.random() * 2 }
    ffPos.set([f.x + Math.sin(t * 0.4 + f.ph) * 1.2, f.y + Math.sin(t * 0.7 + f.ph * 2) * 0.4, f.z + Math.cos(t * 0.3 + f.ph) * 1.2], i * 3)
    const glow = Math.max(0, Math.sin(t * 1.3 + f.ph * 3)) ** 2
    ffCol.set([glow, glow * 0.95, glow * 0.35], i * 3)
  })
  fireflies.geometry.attributes.position.needsUpdate = fireflies.geometry.attributes.color.needsUpdate = true
}

// tiny synth blips instead of sound files
let audio: AudioContext | undefined
function blip(...notes: number[]) {
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
function step(id: number) {
  if (state.opts.voice === 2 || !audio) return
  noise ??= (() => { const b = audio!.createBuffer(1, 2400, audio!.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b })()
  const [freq, vol] = id === STONE || id === BRICK || id === PATH ? [2400, 0.05] : id === PLANK || id === WOOD ? [1300, 0.06] : id === SAND || id === SNOW ? [700, 0.05] : [500, 0.07]
  const src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain(), t = audio.currentTime
  src.buffer = noise; f.type = 'lowpass'; f.frequency.value = freq * (0.9 + Math.random() * 0.2)
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  src.connect(f).connect(g).connect(audio.destination); src.start(t)
}
let stepAt = 0
// rain: looped noise, low-passed to a hiss, faded in and out with the weather (snow is near silent)
let rainGain: GainNode | undefined
function rainSound(level: number) {
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
setInterval(() => {
  if (!audio || audio.state !== 'running') return
  if (!music) {
    const echo = audio.createDelay(), back = audio.createGain()
    music = audio.createGain(); echo.delayTime.value = 0.36; back.gain.value = 0.32
    music.connect(audio.destination); music.connect(echo).connect(back).connect(echo); back.connect(audio.destination)
  }
  music.gain.setTargetAtTime(state.opts.music ? 0 : 1, audio.currentTime, 0.5)
  if (fireflies.visible && state.opts.voice !== 2 && locked() && Math.random() < 0.35) { // crickets on the same dry nights as the fireflies
    const t0 = audio.currentTime, f = 4200 + Math.random() * 600
    for (let i = 0; i < 3; i++) {
      const o = audio.createOscillator(), g = audio.createGain(), t = t0 + i * 0.07
      o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.06)
    }
  }
  else if (uDay.value > 0.9 && !rain.visible && state.opts.voice !== 2 && locked() && Math.random() < 0.08) { // by day, now and then a bird: a quick falling whistle
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
const landCols: number[] = [] // columns changed since the minimap last looked: it repaints just those pixels
function setBlock(x: number, y: number, z: number, b: number) {
  if (landCols.length < 4096) landCols.push(x + z * SX); else landImg = undefined // too many changes (or touch, where nothing reads them): repaint it all next time
  // lamp light only needs redoing when a lantern is placed or removed, or the cell or one next to it is lit
  const glow = !!LAMPS[b] || !!LAMPS[world.get(x, y, z)]
    || [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([a, c, d]) => world.light[world.idx(x + a, y + c, z + d)] > 0)
  world.set(x, y, z, b)
  state.edits[world.idx(x, y, z)] = b
  const cx = Math.floor(x / CH), cz = Math.floor(z / CH)
  if (glow) world.relight()
  // faces and corner shadows of neighbouring chunks depend on this block when it sits on a border;
  // lamp light reaches 15 blocks, so with lanterns about, all nine chunks around are redone
  for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1])
    if (glow || ((!dx || x % CH === (dx < 0 ? 0 : CH - 1)) && (!dz || z % CH === (dz < 0 ? 0 : CH - 1)))) remesh(cx + dx, cz + dz)
}

// --- creatures: boxes with per-face shading ---
function shade(n: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, i: number) { return n.getY(i) > 0 ? 1 : n.getY(i) < 0 ? 0.5 : n.getX(i) ? 0.8 : 0.65 } // top lit, bottom dark
function box(w: number, h: number, l: number, color: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, l), n = g.attributes.normal, col: number[] = []
  for (let i = 0; i < n.count; i++) { const s = shade(n, i); col.push(s, s, s) }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  const m = new THREE.Mesh(g, nightly(new THREE.MeshBasicMaterial({ color, vertexColors: true })))
  m.position.set(x, y, z)
  return m
}
// a creature's rigid part (body, head, a leg …): its boxes baked into one mesh with one shared material, so a pig is
// seven draw calls rather than twenty
const mobMat = nightly(new THREE.MeshBasicMaterial({ vertexColors: true }))
function part(bs: Bx[], [px, py, pz] = [0, 0, 0]) {
  const m = new THREE.Mesh(mergeGeometries(bs.map(([w, h, l, color, x, y, z]) => {
    const g = new THREE.BoxGeometry(w, h, l).translate(x, y, z), n = g.attributes.normal, c = new THREE.Color(color), col: number[] = []
    for (let i = 0; i < n.count; i++) { const s = shade(n, i); col.push(c.r * s, c.g * s, c.b * s) }
    return g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  })), mobMat)
  m.position.set(px, py, pz)
  return m
}
// Creatures face -z. Each species is its own set of boxes: x mirrored with both(); legs hang from their hip (so they
// swing from the top), head and tail are groups that can nod and wag, wings hinge at the body.
type Bx = [number, number, number, number, number, number, number] // w, h, l, colour, x, y (centre; legs: hip), z
const both = (...bs: Bx[]): Bx[] => bs.flatMap(b => [b, [b[0], b[1], b[2], b[3], -b[4], b[5], b[6]] as Bx])
const EYE = 0x111111
function critter(o: { body: Bx[]; coat?: Bx[]; legs?: Bx[]; head: Bx[]; at: [number, number]; tail?: Bx[]; tailAt?: [number, number]; wings?: Bx[] }) {
  const g = new THREE.Group(), add = (m: THREE.Mesh) => { g.add(m); return m }
  add(part(o.body))
  if (o.coat) g.userData.coat = add(part(o.coat)) // the sheep's wool: gone for a while after you take some
  g.userData.legH = o.legs?.[0][1] ?? 0
  g.userData.legs = (o.legs ?? []).map(([w, h, l, c, x, y, z]) => add(part([[w, h, l, c, 0, -h / 2, 0]], [x, y, z])))
  g.userData.head = add(part(o.head, [0, ...o.at]))
  if (o.tail) g.userData.tail = add(part(o.tail, [0, ...o.tailAt!]))
  if (o.wings) g.userData.wings = o.wings.map(([w, h, l, c, x, y, z]) => add(part([[w, h, l, c, Math.sign(x) * w / 2, 0, 0]], [x, y, z])))
  return g
}
const four = (w: number, h: number, c: number, x: number, z: number): Bx[] => both([w, h, w, c, x, h, -z], [w, h, w, c, x, h, z]) // front pair, back pair
const PINK = 0xf0a0a8, WHITE = 0xf4f4f0, BLACK = 0x222226
const pig = () => { const d = 0xd98a94; return critter({
  body: [[0.7, 0.5, 0.95, PINK, 0, 0.5, 0]], legs: four(0.2, 0.25, d, 0.22, 0.3),
  head: [[0.5, 0.45, 0.4, PINK, 0, 0, -0.15], [0.26, 0.18, 0.1, d, 0, -0.05, -0.39], ...both([0.05, 0.05, 0.02, 0x8a4a50, 0.06, -0.04, -0.445], [0.07, 0.07, 0.02, EYE, 0.13, 0.1, -0.355], [0.14, 0.12, 0.06, d, 0.16, 0.26, -0.1])], at: [0.6, -0.5],
  tail: [[0.06, 0.06, 0.12, d, 0, 0, 0.06], [0.06, 0.12, 0.06, d, 0, 0.06, 0.12]], tailAt: [0.62, 0.48] }) }
const cow = () => critter({
  body: [[0.8, 0.65, 1.3, WHITE, 0, 0.88, 0], [0.82, 0.32, 0.36, BLACK, 0, 1.0, 0.25], [0.42, 0.26, 0.3, BLACK, 0.2, 0.74, -0.3], [0.42, 0.22, 0.26, BLACK, -0.2, 0.85, 0.38], [0.3, 0.12, 0.3, PINK, 0, 0.5, 0.35]],
  legs: four(0.2, 0.55, WHITE, 0.27, 0.45),
  head: [[0.5, 0.5, 0.45, WHITE, 0, 0, -0.1], [0.52, 0.18, 0.47, BLACK, 0, 0.17, -0.1], [0.42, 0.22, 0.12, 0xf0b4b4, 0, -0.14, -0.38],
    ...both([0.08, 0.08, 0.02, EYE, 0.14, 0.03, -0.335], [0.08, 0.18, 0.08, 0xe8dcc0, 0.2, 0.32, -0.05], [0.16, 0.08, 0.1, BLACK, 0.32, 0.15, -0.05])], at: [1.15, -0.7],
  tail: [[0.06, 0.5, 0.06, WHITE, 0, -0.25, 0.03], [0.1, 0.12, 0.1, BLACK, 0, -0.5, 0.03]], tailAt: [1.15, 0.65] })
const sheep = () => { const face = 0x3a3a3a; return critter({
  body: [[0.6, 0.46, 0.84, 0xe8d4c4, 0, 0.72, 0]], coat: [[0.75, 0.6, 0.95, WHITE, 0, 0.75, 0], [0.6, 0.12, 0.8, 0xffffff, 0, 1.1, 0], ...both([0.08, 0.4, 0.7, 0xe8e8e0, 0.4, 0.75, 0])],
  legs: four(0.14, 0.45, face, 0.22, 0.3),
  head: [[0.36, 0.4, 0.36, face, 0, -0.02, -0.12], [0.44, 0.16, 0.4, 0xffffff, 0, 0.2, -0.1], ...both([0.16, 0.07, 0.1, face, 0.25, 0.08, -0.05], [0.07, 0.06, 0.02, 0xeeeedd, 0.1, 0.04, -0.305])], at: [1.0, -0.55],
  tail: [[0.12, 0.14, 0.08, WHITE, 0, -0.05, 0.04]], tailAt: [0.9, 0.48] }) }
const chicken = () => critter({
  body: [[0.36, 0.34, 0.46, 0xffffff, 0, 0.42, 0.02], [0.26, 0.24, 0.08, WHITE, 0, 0.6, 0.27], ...both([0.05, 0.22, 0.3, 0xe8e8e8, 0.2, 0.43, 0.04])],
  legs: both([0.05, 0.25, 0.05, 0xe0a020, 0.09, 0.25, 0.02]),
  head: [[0.24, 0.28, 0.22, 0xffffff, 0, 0, -0.02], [0.1, 0.07, 0.1, 0xf0b020, 0, 0, -0.17], [0.06, 0.1, 0.04, 0xd42a20, 0, -0.09, -0.14], [0.05, 0.12, 0.18, 0xd42a20, 0, 0.19, -0.02],
    ...both([0.02, 0.05, 0.05, EYE, 0.125, 0.05, -0.06])], at: [0.66, -0.18] })
const cat = () => { const o = 0xe8a040, st = 0xb86e20; return critter({
  body: [[0.3, 0.3, 0.7, o, 0, 0.42, 0], ...[-0.15, 0.05, 0.25].map(z => [0.32, 0.31, 0.07, st, 0, 0.425, z] as Bx)],
  legs: four(0.09, 0.27, o, 0.1, 0.25),
  head: [[0.32, 0.28, 0.28, o, 0, 0, -0.06], [0.14, 0.09, 0.04, 0xf8e0c0, 0, -0.07, -0.21], [0.05, 0.04, 0.02, 0xf08090, 0, -0.04, -0.235],
    ...both([0.09, 0.12, 0.05, o, 0.1, 0.19, -0.04], [0.05, 0.07, 0.01, PINK, 0.1, 0.18, -0.07], [0.07, 0.07, 0.02, 0x3a9a3a, 0.08, 0.03, -0.205])], at: [0.6, -0.4],
  tail: [[0.07, 0.07, 0.25, o, 0, 0, 0.12], [0.07, 0.3, 0.07, st, 0, 0.15, 0.22]], tailAt: [0.52, 0.35] }) }
const dog = () => { const b = 0x9a6a3a, d = 0x6a4422; return critter({
  body: [[0.36, 0.36, 0.75, b, 0, 0.53, 0], [0.3, 0.2, 0.06, 0xd42a20, 0, 0.62, -0.36]], // a red collar
  legs: four(0.12, 0.35, b, 0.12, 0.26),
  head: [[0.36, 0.34, 0.32, b, 0, 0, -0.05], [0.2, 0.16, 0.18, 0xc8986a, 0, -0.08, -0.28], [0.08, 0.06, 0.03, EYE, 0, -0.02, -0.38],
    ...both([0.07, 0.24, 0.14, d, 0.215, -0.03, -0.03], [0.06, 0.06, 0.02, EYE, 0.09, 0.06, -0.215])], at: [0.8, -0.45],
  tail: [[0.07, 0.07, 0.3, b, 0, 0.1, 0.12]], tailAt: [0.66, 0.36] }) }
const panda = () => critter({
  body: [[0.9, 0.75, 1.15, WHITE, 0, 0.78, 0], [0.92, 0.77, 0.32, BLACK, 0, 0.78, -0.3]],
  legs: four(0.28, 0.42, BLACK, 0.28, 0.38),
  head: [[0.62, 0.55, 0.5, WHITE, 0, 0, -0.08], [0.24, 0.16, 0.08, WHITE, 0, -0.12, -0.36], [0.1, 0.06, 0.02, BLACK, 0, -0.07, -0.405],
    ...both([0.18, 0.18, 0.1, BLACK, 0.25, 0.33, -0.02], [0.16, 0.16, 0.02, BLACK, 0.14, 0.04, -0.335], [0.05, 0.05, 0.02, 0xffffff, 0.14, 0.06, -0.347])], at: [1.05, -0.68],
  tail: [[0.15, 0.15, 0.08, WHITE, 0, 0, 0.04]], tailAt: [0.95, 0.58] })
const penguin = () => critter({
  body: [[0.42, 0.62, 0.38, 0x26262c, 0, 0.39, 0], [0.32, 0.5, 0.04, WHITE, 0, 0.37, -0.19], ...both([0.05, 0.38, 0.2, 0x26262c, 0.235, 0.45, 0])],
  legs: both([0.12, 0.08, 0.18, 0xe07820, 0.1, 0.08, -0.05]),
  head: [[0.34, 0.3, 0.32, 0x26262c, 0, 0, 0], [0.08, 0.06, 0.14, 0xf09020, 0, -0.04, -0.22], ...both([0.07, 0.07, 0.02, WHITE, 0.08, 0.04, -0.165], [0.035, 0.035, 0.02, EYE, 0.08, 0.04, -0.172])], at: [0.85, 0] })
const camel = () => { const c = 0xc8a060, d = 0xa88040; return critter({
  body: [[0.7, 0.6, 1.2, c, 0, 1.2, 0], [0.45, 0.35, 0.35, c, 0, 1.6, -0.25], [0.45, 0.35, 0.35, c, 0, 1.6, 0.3], [0.24, 0.7, 0.24, c, 0, 1.5, -0.68]],
  legs: four(0.18, 0.9, c, 0.24, 0.45),
  head: [[0.3, 0.28, 0.55, c, 0, 0, -0.1], [0.24, 0.18, 0.14, d, 0, -0.05, -0.42], ...both([0.06, 0.1, 0.06, c, 0.12, 0.18, 0.05], [0.02, 0.06, 0.07, EYE, 0.155, 0.06, -0.12])], at: [1.85, -0.75],
  tail: [[0.06, 0.4, 0.06, d, 0, -0.2, 0.03]], tailAt: [1.4, 0.6] }) }
const bird = () => critter({
  body: [[0.2, 0.2, 0.34, 0x3a7af0, 0, 0, 0], [0.16, 0.1, 0.2, 0xf4e090, 0, -0.07, -0.05], [0.14, 0.03, 0.18, 0x2a5ac0, 0, 0.02, 0.24]],
  head: [[0.17, 0.17, 0.16, 0x3a7af0, 0, 0, -0.02], [0.05, 0.04, 0.08, 0xf0b020, 0, -0.01, -0.13], ...both([0.02, 0.04, 0.04, EYE, 0.086, 0.03, -0.05])], at: [0.1, -0.2],
  wings: both([0.24, 0.02, 0.18, 0x2a5ac0, 0.1, 0.04, 0]) })
// villagers: legs and arms hang from hip and shoulder so they can swing; each trade has its own hat and tool
const HAIR = 0x3a2a1a
const GEAR: Record<string, { hat: Bx[]; wear?: Bx[]; tool?: Bx[] }> = { // tool: in the right hand, relative to the shoulder
  teacher: { hat: [[0.47, 0.1, 0.47, HAIR, 0, 1.93, 0], [0.47, 0.3, 0.08, HAIR, 0, 1.76, 0.2]],
    wear: [[0.36, 0.03, 0.02, EYE, 0, 1.75, -0.235], ...both([0.13, 0.1, 0.01, 0xbfe0ff, 0.11, 1.7, -0.234], [0.05, 0.05, 0.01, EYE, 0.11, 1.7, -0.242])], tool: [[0.08, 0.3, 0.22, 0xc0392b, 0, -0.75, -0.08]] },
  carpenter: { hat: [[0.5, 0.14, 0.5, 0xe0b030, 0, 1.96, 0], [0.5, 0.04, 0.16, 0xe0b030, 0, 1.9, -0.32]], tool: [[0.06, 0.4, 0.06, 0x8a5a36, 0, -0.75, -0.1], [0.08, 0.08, 0.22, 0x777777, 0, -0.58, -0.14]] },
  farmer: { hat: [[0.86, 0.05, 0.86, 0xe3d49a, 0, 1.92, 0], [0.46, 0.15, 0.46, 0xe3d49a, 0, 2.02, 0], [0.47, 0.04, 0.47, 0xc0392b, 0, 1.96, 0]] },
  fisher: { hat: [[0.47, 0.12, 0.47, 0xffffff, 0, 1.94, 0], [0.4, 0.03, 0.2, 0x2a6edc, 0, 1.9, -0.31]], wear: [[0.46, 0.14, 0.05, 0xd8d8d8, 0, 1.5, -0.22], [0.2, 0.05, 0.02, 0xd8d8d8, 0, 1.6, -0.235]], tool: [[0.04, 1.4, 0.04, 0x6b4a2a, 0, -0.2, -0.45]] },
  smith: { hat: [[0.47, 0.08, 0.47, HAIR, 0, 1.92, 0]], wear: [[0.52, 0.75, 0.04, 0x5a3a1a, 0, 0.95, -0.15], [0.46, 0.18, 0.05, HAIR, 0, 1.5, -0.22]], tool: [[0.07, 0.45, 0.07, 0x6b4a2a, 0, -0.75, -0.1], [0.12, 0.12, 0.26, 0x444444, 0, -0.55, -0.12]] },
  tailor: { hat: [[0.54, 0.1, 0.54, 0x7b1fa2, 0, 1.94, 0.03], [0.08, 0.06, 0.08, 0x7b1fa2, 0, 2.02, 0.03]], wear: both([0.06, 0.55, 0.03, 0xf0d040, 0.12, 1.2, -0.14]) },
  explorer: { hat: [[0.5, 0.2, 0.5, 0xd42a20, 0, 1.98, 0], [0.54, 0.08, 0.54, WHITE, 0, 1.89, 0], ...both([0.04, 0.24, 0.22, WHITE, 0.25, 1.72, 0.02])], wear: [[0.54, 0.1, 0.3, 0xf0d040, 0, 1.46, 0]] },
  traveller: { hat: [[0.86, 0.04, 0.86, WHITE, 0, 1.91, 0], [0.46, 0.16, 0.46, WHITE, 0, 1.99, 0], [0.47, 0.04, 0.47, 0x2a6edc, 0, 1.94, 0]], wear: [[0.4, 0.5, 0.18, 0x8a5a36, 0, 1.15, 0.22]] },
  cook: { hat: [[0.42, 0.32, 0.42, 0xffffff, 0, 2.06, 0], [0.52, 0.12, 0.52, 0xffffff, 0, 2.26, 0]], tool: [[0.05, 0.4, 0.05, 0xc8a060, 0, -0.75, -0.1], [0.14, 0.04, 0.14, 0xc8a060, 0, -0.55, -0.16]] },
  merchant: { hat: [[0.4, 0.3, 0.4, 0xd42a20, 0, 2.04, 0], [0.42, 0.06, 0.42, 0xe0b030, 0, 1.93, 0]], wear: [[0.18, 0.2, 0.12, 0xe0b030, 0.28, 0.82, -0.12]] },
  friend: { hat: [[0.47, 0.1, 0.47, HAIR, 0, 1.93, 0], ...[-0.15, 0, 0.15].map(x => [0.1, 0.1, 0.1, HAIR, x, 2.02, -0.1] as Bx)] },
}
function person([shirt, trousers]: number[], kind: string) {
  const g = new THREE.Group(), gear = GEAR[kind]
  const hinge = (w: number, h: number, c: number, x: number, y: number, extra: Bx[] = []) => { // a limb hanging from (x, y)
    const m = part([[w, h, 0.22, c, 0, -h / 2, 0], ...extra], [x, y, 0]); g.add(m); return m
  }
  g.add(part([[0.5, 0.7, 0.25, shirt, 0, 1.1, 0], [0.45, 0.45, 0.45, 0xf0c8a0, 0, 1.675, 0], ...both([0.07, 0.07, 0.02, EYE, 0.11, 1.7, -0.23]), [0.14, 0.03, 0.02, 0x8a3a30, 0, 1.56, -0.23], ...gear.hat, ...(gear.wear ?? [])]))
  g.userData.legs = [hinge(0.24, 0.75, trousers, -0.125, 0.75), hinge(0.24, 0.75, trousers, 0.125, 0.75)]
  g.userData.arms = [hinge(0.18, 0.7, shirt, -0.34, 1.45), hinge(0.18, 0.7, shirt, 0.34, 1.45, gear.tool)]
  return g
}

interface Mob { g: THREE.Group; w: Word; x: number; y: number; z: number; r: number; h: number; dir: number; speed: number; t: number; npc?: string; roam?: { x: number; z: number; tx: number; tz: number }; line?: Line; close?: boolean; size?: Word; fed?: number; pet?: boolean; cool?: number; love?: number; fly?: { x: number; z: number; y: number }; swim?: boolean; hop?: number; bubble?: HTMLElement }
const mobs: Mob[] = []
function addMob(g: THREE.Group, w: Word, x: number, z: number, r: number, h: number, npc?: string) {
  const y = npc ? world.SPOTS[npc].y : world.surface(Math.floor(x), Math.floor(z))
  g.position.set(x, y, z)
  scene.add(g)
  const m: Mob = { g, w, x, y, z, r, h, dir: 0, speed: 0, t: 0, npc }
  if (npc && !['fisher', 'friend', 'teacher'].includes(npc)) m.roam = { x, z, tx: x, tz: z } // the ones with a hut floor to walk on
  if (npc) $('hud').append(m.bubble = Object.assign(document.createElement('div'), { className: 'bubble' }))
  mobs.push(m)
}
const onGrass = (x: number, z: number, s: number) => world.get(x, s - 1, z) === GRASS
function spawn(n: number, w: Word, make: () => THREE.Group, r: number, h: number, ok = onGrass, fly = false, fallback?: typeof onGrass) {
  for (let tries = 0; n > 0 && tries < 20000; tries++) {
    const x = 8 + Math.random() * (SX - 16), z = 8 + Math.random() * (SZ - 16), bx = Math.floor(x), bz = Math.floor(z)
    const s = world.surface(bx, bz)
    if (!(fallback && tries > 10000 ? fallback : ok)(bx, bz, s)) continue // e.g. pandas on plain grass once the bamboo is all cut
    // every species comes in small, plain and big, so 大 and 小 mean something
    const size = [V.small, undefined, V.big][n % 3], k = size === V.small ? 0.65 : size === V.big ? 1.35 : 1, g = make()
    g.scale.setScalar(k)
    addMob(g, w, x, z, r * k, h * k); n--
    mobs.at(-1)!.size = size
    if (fly) { mobs.at(-1)!.fly = { x, z, y: s + 4 }; mobs.at(-1)!.dir = Math.random() * 6.28 } // each starts somewhere else on its circle
  }
}
for (const [k, npc] of Object.entries(NPCS)) addMob(person(npc.look, k), npc.w, world.SPOTS[k].x, world.SPOTS[k].z, 0.35, 2, k)
addMob(person([0xe07820, 0x2c4a8a], 'friend'), V.friend, world.SPOTS.friend.x, world.SPOTS.friend.z, 0.35, 2, 'friend')
addMob(person([0x7b1fa2, 0x333333], 'merchant'), V.merchant, world.SPOTS.merchant.x, world.SPOTS.merchant.z, 0.35, 2, 'merchant')
spawn(6, V.pig, pig, 0.6, 1.1)
spawn(6, V.chicken, chicken, 0.35, 0.9)
spawn(5, V.cat, cat, 0.4, 0.8)
spawn(4, V.cow, cow, 0.7, 1.6)
spawn(5, V.sheep, sheep, 0.55, 1.25)
spawn(4, V.dog, dog, 0.45, 1.0)
function fishy() { // blue, orange or green, with fins and a tail that beats
  const [c, d] = [[0x6fa8dc, 0x4a7ab0], [0xf08a30, 0xc8601a], [0x7ac070, 0x4a8a48]][Math.random() * 3 | 0]
  return critter({
    body: [[0.14, 0.26, 0.42, c, 0, 0, 0], [0.1, 0.18, 0.1, c, 0, 0, -0.25], [0.03, 0.1, 0.22, d, 0, 0.17, 0.02], ...both([0.08, 0.02, 0.1, d, 0.1, -0.06, -0.08])],
    head: both([0.02, 0.05, 0.05, EYE, 0.075, 0.04, -0.15]), at: [0, 0],
    tail: [[0.03, 0.3, 0.2, d, 0, 0, 0.1]], tailAt: [0, 0.21] })
}
// along the coast: water three deep, but not the open sea
spawn(24, BLOCKS[FISH].w, fishy, 0.35, 0.4, (x, z) => world.get(x, world.SEA - 3, z) === WATER && world.get(x, world.SEA - 7, z) !== WATER)
for (const m of mobs) if (m.w === BLOCKS[FISH].w) { m.swim = true; m.y = world.SEA - 1.7 }
function butterfly() { // a thin body, antennae, and fore and hind wings that flap from the body
  const col = [0xf2c230, 0xe8436a, 0x4a7af0, 0xffffff][Math.random() * 4 | 0]
  return critter({
    body: [[0.06, 0.06, 0.3, 0x222222, 0, 0, 0]], head: both([0.015, 0.015, 0.14, 0x222222, 0.03, 0.04, -0.06]), at: [0.02, -0.15],
    wings: both([0.26, 0.02, 0.2, col, 0.03, 0, -0.06], [0.18, 0.02, 0.16, col, 0.03, 0, 0.1]) })
}
spawn(10, V.butterfly, butterfly, 0.3, 0.3, onGrass, true)
spawn(6, V.bird, bird, 0.4, 0.4, onGrass, true)
spawn(5, V.panda, panda, 0.7, 1.45, (x, z, s) => onGrass(x, z, s) && world.get(x, s, z) === BAMBOO, false, onGrass)
spawn(6, V.penguin, penguin, 0.35, 1.05, (x, z, s) => world.get(x, s - 1, z) === SNOW && world.biome(x, z) === 1)
spawn(5, V.camel, camel, 0.7, 2.0, (x, z, s) => world.get(x, s - 1, z) === SAND && world.biome(x, z) === 2)
const petKey = (m: Mob) => m.w.hz + (m.size?.hz ?? '')

const tmp = new THREE.Vector3()
const signs: THREE.SpriteMaterial[] = []
// a wooden signpost with the place's name stands by every villager's home
for (const [k, word] of Object.entries(PLACES)) {
  const cv = document.createElement('canvas'), g = cv.getContext('2d')!
  cv.width = 64 * [...word.hz].length + 32; cv.height = 96
  g.fillStyle = '#7a5230'; g.fillRect(0, 0, cv.width, cv.height)
  g.fillStyle = '#c49a5a'; g.fillRect(6, 6, cv.width - 12, cv.height - 12)
  g.fillStyle = '#a81c14'; g.font = 'bold 60px "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif'
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word.hz, cv.width / 2, 52)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: t }))
  signs.push(sign.material)
  // on a post at the corner of the clearing, so it can be read from most directions
  const s = world.SPOTS[k], [ox, oz] = k === 'islet' ? [1.5, -1] : k === 'fisher' ? [-5.5, 1.5] : k === 'teacher' ? [5.5, 3.5] : [4.5, 4.5]
  const x = s.x + ox, z = s.z + oz, y = world.surface(Math.floor(x), Math.floor(z))
  sign.scale.set(cv.width / 64, 1.5, 1)
  sign.position.set(x, y + 2.9, z)
  scene.add(box(0.16, 2.2, 0.16, 0x7a5230, x, y + 1.1, z))
  scene.add(sign)
}
let here = ''
function announcePlace() {
  const k = Object.keys(PLACES).find(k => Math.hypot(world.SPOTS[k].x - p.x, world.SPOTS[k].z - p.z) < (k === 'snow' || k === 'desert' ? 18 : 7)) ?? ''
  if (k === here) return
  here = k
  if (!k) return
  const feel = k === 'snow' ? V.cold : k === 'desert' ? V.hot : undefined // the far islands have weather of their own
  const parts: Part[] = feel ? [PLACES[k], '。', V.here, V.very, feel, '！'] : [PLACES[k]]
  parts.filter(isWord).forEach(w => see(w))
  speak(plain(parts)); toast(feel ? said({ parts, en: `${PLACES[k].en}. It is very ${feel.en} here!` }) : html(PLACES[k]))
}

function updateMobs(dt: number) {
  const hour = (8 + clock / 20) % 24, night = hour >= 21 || hour < 5, now = performance.now()
  for (const m of mobs) {
    const px = p.x - m.x, pz = p.z - m.z, near = Math.hypot(px, pz)
    if (m.npc) { // villagers face the player and show what they are saying when close
      m.g.rotation.y = Math.atan2(-px, -pz)
      let walking = false
      if (m.roam && near > 6 && !night) { // nobody around: potter about the hut (at night they stay put)
        if ((m.t -= dt) < 0) { m.t = 3 + Math.random() * 5; m.roam.tx = m.roam.x + Math.random() * 3.6 - 1.8; m.roam.tz = m.roam.z + Math.random() * 3.6 - 1.8 }
        const dx = m.roam.tx - m.x, dz = m.roam.tz - m.z, d = Math.hypot(dx, dz)
        if (d > 0.1) {
          const nx = m.x + dx / d * 0.8 * dt, nz = m.z + dz / d * 0.8 * dt
          if (!BLOCKS[world.get(Math.floor(nx), m.y, Math.floor(nz))].solid && BLOCKS[world.get(Math.floor(nx), m.y - 1, Math.floor(nz))].solid) { m.x = nx; m.z = nz; m.g.position.set(nx, m.y, nz); walking = true }
          else m.t = 0
          m.g.rotation.y = Math.atan2(-dx, -dz)
        }
      }
      const swing = walking ? Math.sin(performance.now() / 160 + m.x) * 0.5 : 0
      ;(m.g.userData.legs as THREE.Object3D[]).forEach((l, i) => { l.rotation.x = i ? swing : -swing })
      ;(m.g.userData.arms as THREE.Object3D[]).forEach((a, i) => { a.rotation.x = i ? -swing : swing; a.rotation.z = 0 })
      const wave = (now - (m.hop ?? -1e9)) / 1200 // you walked up: the left arm goes up and waves for a moment
      if (wave < 1) { const arm = (m.g.userData.arms as THREE.Object3D[])[0], up = Math.sin(wave * Math.PI); arm.rotation.z = -2.6 * Math.min(1, up * 2) + Math.sin(now / 90) * 0.3 * up }
      const v = tmp.set(m.x, m.y + 2.3, m.z).project(camera), show = near < 9 && v.z < 1
      m.bubble!.style.display = show ? '' : 'none'
      const close = near < 4 // walking up to someone makes them say their line aloud
      if (show && m.line) prefetch(plain(m.line.parts), m.npc)
      if (close && !m.close && m.line && locked()) { speak(plain(m.line.parts), false, m.npc); m.hop = now }
      m.close = close
      if (show) m.bubble!.style.transform = `translate(${(v.x + 1) / 2 * innerWidth}px, ${(1 - v.y) / 2 * innerHeight}px) translate(-50%, -100%)`
      continue
    }
    if (m === riding) { // carried along under the rider
      m.x = p.x; m.z = p.z; m.y = p.y
      m.g.position.set(p.x, p.y, p.z); m.g.rotation.y = p.yaw
      m.g.userData.sleep = m.g.userData.sit = m.g.rotation.x = 0; m.g.userData.baseY = p.y // ridden: wide awake, standing tall
      const swing = action === V.ride && moving ? Math.sin(performance.now() / 90) * 0.6 : 0
      ;(m.g.userData.legs as THREE.Mesh[]).forEach((l, i) => { l.rotation.x = i % 3 ? swing : -swing; l.scale.y = 1 })
      ;(m.g.userData.head as THREE.Object3D).rotation.set(swing * 0.15, 0, 0) // its head bobs along
      continue
    }
    if (m.fly) { // birds circle a point a few blocks up
      const wings = m.g.userData.wings as THREE.Mesh[], bf = m.w === V.butterfly, rad = bf ? 2.2 : 6 // butterflies flutter in small low circles
      // at night birds sit on the ground below their circle with folded wings; butterflies rest out of sight
      if (night) {
        m.x += (m.fly.x - m.x) * Math.min(1, dt); m.z += (m.fly.z - m.z) * Math.min(1, dt); m.y += (m.fly.y - 3.9 - m.y) * Math.min(1, dt)
        wings.forEach(wg => { wg.rotation.z = -Math.sign(wg.position.x) * 1.3 })
        m.g.visible = !bf
      } else {
        m.dir += dt * (bf ? 0.9 : 0.35)
        const tx = m.fly.x + Math.cos(m.dir) * rad, tz = m.fly.z + Math.sin(m.dir) * rad, ty = m.fly.y - (bf ? 2.6 : 0) + Math.sin(m.dir * 3) * (bf ? 0.4 : 1)
        const k = m.g.visible && m.g.userData.aloft ? Math.min(1, dt * 2) : 1 // a butterfly reappears in place (and all start in the air); a bird flies up off the ground
        m.g.userData.aloft = true
        m.x += (tx - m.x) * k; m.z += (tz - m.z) * k; m.y += (ty - m.y) * k
        wings.forEach(wg => { wg.rotation.z = Math.sign(wg.position.x) * Math.sin(performance.now() / (bf ? 60 : 110) + m.fly!.x) * (bf ? 1.1 : 0.7) })
        m.g.visible = true
      }
      m.g.position.set(m.x, m.y, m.z)
      m.g.rotation.y = Math.atan2(Math.sin(m.dir), -Math.cos(m.dir))
      continue
    }
    if (m.swim) { // fish drift about under the surface and turn at the shore
      if ((m.t -= dt) < 0) { m.t = 2 + Math.random() * 4; m.dir = Math.random() * 6.28 }
      const nx = m.x + Math.cos(m.dir) * 0.9 * dt, nz = m.z + Math.sin(m.dir) * 0.9 * dt
      if (world.get(Math.floor(nx), Math.floor(m.y), Math.floor(nz)) === WATER) { m.x = nx; m.z = nz } else m.t = 0
      if (Math.random() < dt * 0.02) m.hop = now // now and then one leaps clear of the water
      const leap = (now - (m.hop ?? -1e9)) / 700, arc = leap < 1 ? Math.sin(leap * Math.PI) : 0
      if (leap >= 0.85 && leap < 1.3 && !m.g.userData.splashed && Math.hypot(px, pz) < 40) { m.g.userData.splashed = true; burst(m.x - 0.5, world.SEA - 0.8, m.z - 0.5, WATER) } // back in: splash
      if (leap < 0.5) m.g.userData.splashed = false
      m.g.position.set(m.x, m.y + arc * 2.4, m.z); m.g.rotation.y = Math.atan2(-Math.cos(m.dir), -Math.sin(m.dir))
      m.g.rotation.order = 'YXZ'; m.g.rotation.x = leap < 1 ? Math.cos(leap * Math.PI) * 0.8 : 0 // nose up, then down
      ;(m.g.userData.tail as THREE.Object3D).rotation.y = Math.sin(performance.now() / 120 + m.x) * 0.5
      continue
    }
    const asleep = night && !m.pet && !((m.love ?? 0) > now) && now - (m.hop ?? -1e9) > 4000 // a click wakes it for a moment
    if (m.pet || (m.love ?? 0) > now) { m.t = 1; m.dir = Math.atan2(pz, px); m.speed = near > 2.5 ? 1.8 : 0 } // fed: follows you
    else if (asleep) m.speed = 0
    else if ((m.w === V.chicken || m.w === V.sheep) && near < 3 && moving && running()) { m.dir = Math.atan2(-pz, -px); m.speed = 2.6; m.t = 1.2 } // run at them and they scurry off
    else if ((m.t -= dt) < 0) { m.t = 2 + Math.random() * 4; m.dir = Math.random() * Math.PI * 2; m.speed = Math.random() < 0.35 ? 0 : 1 }
    const dx = Math.cos(m.dir), dz = Math.sin(m.dir)
    const nx = m.x + dx * m.speed * dt, nz = m.z + dz * m.speed * dt, bx = Math.floor(nx), bz = Math.floor(nz)
    const s = world.surface(bx, bz)
    if (nx > 2 && nz > 2 && nx < SX - 2 && nz < SZ - 2 && Math.abs(s - m.y) <= 1 && world.get(bx, s - 1, bz) !== WATER) { m.x = nx; m.z = nz; m.y = s }
    else if (m.speed) m.t = 0 // blocked: pick a new direction
    // clicked or fed: a little hop (a third of a second, eased in and out)
    // asleep at night: lies down (legs folded under, head low); the size scale applies to the leg height too
    const u = m.g.userData, sl = u.sleep = (u.sleep ?? 0) + ((asleep ? 1 : 0) - (u.sleep ?? 0)) * Math.min(1, dt * 2)
    // a pet that has caught up with you while you stand still sits down: front up, back legs folded
    const sit = u.sit = (u.sit ?? 0) + ((m.pet && !m.speed && !moving && near < 2.6 && u.legs.length === 4 ? 1 : 0) - (u.sit ?? 0)) * Math.min(1, dt * 3)
    m.g.rotation.order = 'YXZ'; m.g.rotation.x = sit * 0.4
    const hop = (now - (m.hop ?? -1e9)) / 330, lift = (hop < 1 ? Math.sin(hop * Math.PI) * 0.35 : 0) - (sl * 0.75 + sit * 0.3) * u.legH * m.g.scale.y
    u.baseY = (u.baseY ?? m.y) + (m.y - (u.baseY ?? m.y)) * Math.min(1, dt * 10) // eased onto steps; lift goes on top
    m.g.position.set(m.x, u.baseY + lift, m.z)
    ;(u.legs as THREE.Object3D[]).forEach((l, i) => { l.scale.y = 1 - sl * 0.75 - (i > 1 ? sit * 0.6 : 0) })
    if (u.coat) u.coat.visible = !(m.cool && m.cool > now)
    // fed or your pet: a little heart bobs above it (made the first time, placed over the top of the model)
    const fond = m.pet || (m.love ?? 0) > now
    if (fond && !u.heart) {
      const top = (new THREE.Box3().setFromObject(m.g).max.y - m.g.position.y) / m.g.scale.y
      const R = 0xe8304a
      u.heart = part([[0.1, 0.08, 0.04, R, -0.05, 0.04, 0], [0.1, 0.08, 0.04, R, 0.05, 0.04, 0], [0.14, 0.06, 0.04, R, 0, -0.02, 0], [0.06, 0.06, 0.04, R, 0, -0.07, 0]], [0, top + 0.25, 0])
      m.g.add(u.heart); u.heartY = top + 0.25
    }
    if (u.heart) { u.heart.visible = fond; u.heart.position.y = u.heartY + Math.sin(now / 300) * 0.05; u.heart.rotation.y = now / 600 } // sheared: the wool grows back when the next can be taken
    m.g.rotation.y = Math.atan2(-dx, -dz)
    const swing = m.speed ? Math.sin(performance.now() / 90 + m.x) * 0.6 : 0 // legs
    if (m.w === V.penguin) m.g.rotation.z = swing * 0.25 // penguins waddle
    ;(m.g.userData.legs as THREE.Mesh[]).forEach((l, i) => { l.rotation.x = i % 3 ? swing : -swing })
    // standing still: grazers nod down to the grass, chickens peck; a happy animal wags its tail
    const t = performance.now() / 1000 + m.x * 7, head = m.g.userData.head as THREE.Object3D | undefined, tail = m.g.userData.tail as THREE.Object3D | undefined
    if (head) {
      // you are close and it is standing: it turns its head to watch you instead of grazing (a cat only once you fed it)
      const watch = !m.speed && near < 4 && sl < 0.5 && (m.w !== V.cat || m.pet || (m.love ?? 0) > now), turn = ((Math.atan2(-px, -pz) - m.g.rotation.y) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI
      head.rotation.y += ((watch ? Math.max(-0.9, Math.min(0.9, turn)) : 0) - head.rotation.y) * Math.min(1, dt * 6)
      head.rotation.x = sl > 0.5 ? -0.35 * sl : m.speed || watch ? 0 : m.w === V.chicken ? -(Math.max(0, Math.sin(t * 2.5)) ** 6) * 0.9 : -(Math.max(0, Math.sin(t * 0.4)) ** 3) * 0.5
    }
    if (tail) tail.rotation.y = Math.sin(t * (m.pet || (m.love ?? 0) > now || (m.w === V.dog && near < 4 && sl < 0.5) ? 16 : 2)) * 0.35 // dogs are glad to see anyone
  }
}

// --- player ---
const p = { x: world.HOME.x + 0.5, y: 0, z: world.HOME.z + 7.5, vy: 0, yaw: 0, pitch: 0, ground: false }
p.y = world.surface(Math.floor(p.x), Math.floor(p.z))
if (state.pos) [p.x, p.y, p.z, p.yaw, p.pitch] = state.pos // carry on where you left off
let wiping = false
const savePos = () => { if (wiping) return; state.pos = [p.x, p.y, p.z, p.yaw, p.pitch]; state.clock = clock; persist() }
addEventListener('pagehide', savePos)
document.addEventListener('visibilitychange', () => { if (document.hidden) savePos() }) // mobile tabs die without pagehide
const keys: Record<string, boolean> = {}
let clock = state.clock // seconds played; the day starts at eight on Monday (declared early: the start screen shows the day)

function hits() {
  for (let x = Math.floor(p.x - 0.3); x <= Math.floor(p.x + 0.3); x++)
    for (let y = Math.floor(p.y); y <= Math.floor(p.y + 1.8); y++)
      for (let z = Math.floor(p.z - 0.3); z <= Math.floor(p.z + 0.3); z++)
        if (BLOCKS[world.get(x, y, z)].solid) return true
  return false
}

while (state.pos && hits() && p.y < world.SY) p.y++ // restored into something built since: pop up out of it
// your pets: the animals are new every visit, so one of the same kind and size becomes yours again, at your side
if (!Array.isArray(state.pets)) state.pets = [] // an imported save from before pets were kept
/** put an animal down next to you where it can walk on: a dry cell whose ground is level with your floor */
function besideYou(m: Mob) {
  const fy = Math.floor(p.y)
  for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 0]]) {
    const x = Math.floor(p.x) + dx, z = Math.floor(p.z) + dz, s = world.surface(x, z)
    if (Math.abs(s - fy) <= 1 && world.get(x, s - 1, z) !== WATER) { m.x = x + 0.5; m.z = z + 0.5; m.y = s; break }
    if (dx === 0 && dz === 0) { m.x = p.x; m.z = p.z; m.y = fy } // under a roof all round: at your feet
  }
  m.g.position.set(m.x, m.y, m.z); m.g.userData.baseY = m.y
}
state.pets = state.pets.filter(k => { // one per kind and size you tamed; a kind that did not turn up this time is forgotten
  const m = mobs.find(m => !m.npc && !m.pet && !m.swim && petKey(m) === k)
  if (m) { m.pet = true; m.fed = 3; besideYou(m) }
  return !!m
})

const onSea = (x: number, z: number) => world.get(Math.floor(x), world.SEA - 1, Math.floor(z)) === WATER
function move(dt: number) {
  const swim = !boating && world.get(Math.floor(p.x), Math.floor(p.y + 0.9), Math.floor(p.z)) === WATER
  const f = +!!(keys.KeyW || keys.ArrowUp || keys.PadW) - +!!(keys.KeyS || keys.ArrowDown || keys.PadS), s = +!!(keys.KeyD || keys.ArrowRight || keys.PadD) - +!!(keys.KeyA || keys.ArrowLeft || keys.PadA) // WASD, arrows or a gamepad
  const sprint = running(), jumping = keys.Space || keys.PadJump
  if (riding && ((jumping && p.ground) || swim)) ride() // hop off; camels do not swim
  if (riding && p.ground) rideLand = [p.x, p.z]
  const sp = (boating ? 6.5 : riding ? 7.5 : (sprint ? 7 : 4.3) * (swim ? 0.6 : 1) * (performance.now() < boost ? 1.35 : 1)) / (f && s ? Math.SQRT2 : 1)
  const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw)
  const dx = (-sin * f + cos * s) * sp * dt, dz = (-cos * f - sin * s) * sp * dt
  if (boating && jumping) { boating = false; p.vy = 8.5 } // jump out
  if (boating) { // glide on the sea surface; land and piers stop the boat
    p.y = world.SEA + 0.05; p.vy = 0
    p.x += dx; if (!onSea(p.x, p.z) || hits()) p.x -= dx
    p.z += dz; if (!onSea(p.x, p.z) || hits()) p.z -= dz
    p.x = Math.min(SX - 0.5, Math.max(0.5, p.x)); p.z = Math.min(SZ - 0.5, Math.max(0.5, p.z))
    action = V.row
    return
  }
  // paddle up while under water; with the head out, Space is a real jump so you can climb onto the shore
  const headWet = world.get(Math.floor(p.x), Math.floor(p.y + 1.62), Math.floor(p.z)) === WATER
  if (swim) p.vy = jumping ? (headWet ? 3 : 8.5) : Math.max(p.vy - 6 * dt, -3)
  else { p.vy = Math.max(p.vy - 28 * dt, -30); if (jumping && p.ground) p.vy = 8.5 }
  // axis by axis; a blocked step moves up against the wall instead of stopping short of it (at speed that gap was a quarter block)
  let blocked = false
  const slide = (axis: 'x' | 'z', d: number) => {
    if (!d) return
    p[axis] += d
    if (!hits()) return
    p[axis] -= d; blocked = true
    const flush = d > 0 ? Math.floor(p[axis] + 0.3 + d) - 0.3 - 1e-4 : Math.floor(p[axis] - 0.3 + d) + 1.3 + 1e-4
    if (Math.abs(flush - p[axis]) < Math.abs(d)) { const was = p[axis]; p[axis] = flush; if (hits()) p[axis] = was }
  }
  slide('x', dx); slide('z', dz)
  // auto-jump: walking into a ledge one block high hops onto it, if there is room up there; swimming with the head out
  // of the water, the same climbs out onto the shore (floating, the feet sit lower: look a little higher)
  if (blocked && ((p.ground && !swim) || (swim && !headWet))) {
    const up = swim ? 1.6 : 1.05
    p.y += up; p.x += dx; p.z += dz
    const free = !hits()
    p.y -= up; p.x -= dx; p.z -= dz
    if (free) p.vy = 8.5
  }
  p.x = Math.min(SX - 0.5, Math.max(0.5, p.x)); p.z = Math.min(SZ - 0.5, Math.max(0.5, p.z))
  p.ground = false
  const dy = p.vy * dt
  p.y += dy
  if (hits()) {
    p.y -= dy
    if (p.vy < 0) { p.y = Math.floor(p.y); p.ground = true } // snap onto the block top
    p.vy = 0
  }
  action = riding ? V.ride : swim ? V.swim : !p.ground ? V.jump : f || s ? (sprint ? V.run : V.walk) : V.stand
  moving = !!(f || s)
  if (moving && p.ground && !swim && !riding && (stepAt -= dt * sp / 4.3) < 0) { stepAt = 0.42; step(world.get(Math.floor(p.x), Math.floor(p.y) - 1, Math.floor(p.z))) }
}
let action = V.stand, boating = false, moving = false
const boat = new THREE.Group()
boat.add(box(1.2, 0.3, 2.4, 0x8a5a36, 0, 0, 0), box(0.12, 0.3, 2.4, 0x6b4a2a, -0.6, 0.25, 0), box(0.12, 0.3, 2.4, 0x6b4a2a, 0.6, 0.25, 0),
  box(1.32, 0.3, 0.12, 0x6b4a2a, 0, 0.25, -1.2), box(1.32, 0.3, 0.12, 0x6b4a2a, 0, 0.25, 1.2))
scene.add(boat)

// --- HUD ---
const icon = (id: number) => { const t = BLOCKS[id].t[1]; return `<i class="ic" style="background-position:${(t % 8) * 100 / 7}% ${(t >> 3) * 100 / 7}%"></i>` }
const ph = (parts: Part[]) => parts.map(x => isWord(x) ? html(x) : x).join('')
const num = (n: number) => cn(Math.min(n, 999))

const said = (q: { parts: Part[]; en: string }) =>
  `<div class="s l${Math.min(...q.parts.filter(isWord).map(level)) ? 1 : 0}">${ph(q.parts)}<div class="en">${q.en}</div></div>`

// what the held item does, for the ones that are not simply placed
const USE: Record<number, string> = {
  [BOAT]: 'right-click water: get in · Space: get out', [ROD]: 'right-click water: fish', [SEEDS]: 'right-click grass or soil: plant',
  [SAPLING]: 'place it: a tree in a minute and a half', [BOOK]: 'right-click: read', [BED]: 'place it, then right-click: sleep / set home',
  [DOOR]: 'place it, then right-click: open / close', [LETTER]: 'take it to the villager it is for', [PICKAXE]: 'carry it: stone can be dug',
  [LANTERN]: 'place it: light at night', [STOVE]: 'place it: light at night',
}
// grammar tips wait their turn in the corner, ten seconds each; all of them stay readable in the dictionary
const tips: string[] = []
setInterval(() => {
  if (panel || !locked()) return // leave the current tip alone while a panel or the start screen is up
  const el = $('tip'), next = tips.shift()
  el.hidden = !next
  if (next) { el.innerHTML = `<b>${V.grammar.hz} ${V.grammar.py}</b> ${next}`; see(V.grammar, 0.2) }
}, 10000)

// plain-English nudges for the very first quests only
const HINTS = [
  'Hold click on a tree trunk to dig 木头, then click the teacher.',
  'Walk up to animals and click them. M opens the map.',
  'Flowers grow in the grass — look for the red ones.',
  'Pandas live in the bamboo.',
  'Stone needs a pickaxe: press E, make 木板, then 棍子, then 镐.',
]
let sel = 0, first = 0, owned: number[] = [], shown: number[] = [], lastQuest = ''
const bar = (f: number) => `<i class="bar${f >= 1 ? ' full' : ''}"><i style="width:${Math.min(1, f) * 100}%"></i></i>`
function questPanel() {
  const where = (k: string) => {
    const s = world.SPOTS[k], dx = s.x - p.x, dz = s.z - p.z, d = Math.round(Math.hypot(dx, dz))
    return d < 4 ? '' : ` <span class="where">${html(dirTo(dx, dz))} ${num(d)}${html(V.meter)}</span>`
  }
  const k = state.track, q = quest(k)
  const h = `<div>${html(NPCS[k].w)}${where(k)}</div>`
    + said(q)
    + (q.act ? `<small>${num(Math.min(did(k), q.n))} / ${cn(q.n)}${bar(did(k) / q.n)}</small>` : q.deliver ? `<small>${icon(LETTER)} → ${html(NPCS[q.deliver].w)}${where(q.deliver)}</small>` : q.find ? '' : `<small>${icon(q.item)} ${num(state.inv[q.item] ?? 0)} / ${cn(q.n)}${bar((state.inv[q.item] ?? 0) / q.n)}</small>`)
    + (k === 'teacher' && HINTS[state.quests.teacher ?? 0] ? `<small class="tip">💡 ${HINTS[state.quests.teacher ?? 0]}</small>` : '')
    + Object.keys(NPCS).filter(o => o !== k && state.seen[NPCS[o].w.hz]).map(o => // only people you have met; signs and the map find the rest
      `<div class="other">${html(NPCS[o].w)}${where(o)}</div>`).join('')
  if (h !== lastQuest) $('quest').innerHTML = lastQuest = h
  for (const m of mobs) if (m.npc) {
    const hr = (8 + clock / 20) % 24, late = hr >= 21 || hr < 5 // villagers turn in
    const b = said(m.line = late ? { parts: [V.goodnight, '！'], en: 'Good night!' } : m.npc === 'merchant' ? SHOP_SAY : m.npc === 'friend' ? CHAT_SAY : quest(m.npc))
    if (m.bubble!.innerHTML !== b) m.bubble!.innerHTML = b
    const q = m.npc === 'merchant' || m.npc === 'friend' || late ? undefined : quest(m.npc) // can you hand it over now? a gold bubble says so
    m.bubble!.classList.toggle('ready', !!q && (q.act ? did(m.npc) >= q.n : !q.deliver && !q.find && (state.inv[q.item] ?? 0) >= q.n))
  }
}
let had: Record<number, number> | null = null, heldSaid = 0, sayHeld = 0, picked = false // picked: the player chose the item (wheel, 1-9, a tap, the gamepad)
function hud() {
  owned = Object.keys(state.inv).map(Number).filter(id => state.inv[id] > 0)
  if (!owned.includes(sel)) sel = owned[0] ?? 0
  if (sel !== heldSaid && picked) { // you picked something else: say its name once the wheel or keys come to rest on it
    clearTimeout(sayHeld)
    sayHeld = setTimeout(() => { if (sel && sel === heldSaid && locked()) { see(BLOCKS[sel].w, 0.2); speak(BLOCKS[sel].w.hz) } }, 400)
  }
  heldSaid = sel; picked = false
  setHeld(sel)
  // nine slots at most; the window only scrolls when the held item leaves it, so 1-9 keep meaning the same slots. B (the bag) shows everything
  const at = owned.indexOf(sel)
  first = Math.max(0, Math.min(first, at, owned.length - 9)); if (at >= first + 9) first = at - 8
  shown = owned.slice(first, first + 9)
  $('hotbar').innerHTML = (shown[0] !== owned[0] ? '<span>‹</span>' : '') + shown.map(id =>
    `<div class="slot${id === sel ? ' sel' : ''}${had && state.inv[id] > (had[id] ?? 0) ? ' up' : ''}" data-id="${id}">${icon(id)}${html(BLOCKS[id].w)}<b>${num(state.inv[id])}</b></div>`).join('')
    + (shown.at(-1) !== owned.at(-1) ? '<span>›</span>' : '')
  had = { ...state.inv } // a slot pops when its count goes up
  const use = sel ? USE[sel] ?? (EDIBLE.has(sel) ? 'right-click: eat or drink · on an animal: feed it' : '') : ''
  $('use').textContent = touch ? use.replace(/right-click/g, '放') : use // on touch the place button does it
  questPanel()
  tips.push(...newNotes()) // grammar met for the first time
  if (rank() > state.rank) { // met enough words for a new title; announce it once the current toast has had its moment
    const title = RANKS[state.rank = rank()][1], parts: Part[] = [V.you, V.am, title, V.le, '！']
    see(title)
    const announce = () => { // not over a panel or the start screen: wait until the player is back in the world
      if (panel || !locked()) return void setTimeout(announce, 1500)
      speak(plain(parts)); blip(523, 659, 784, 1047); toast(said({ parts, en: `You are now a ${title.en}!` }), true)
      for (let i = 0; i < 3; i++) setTimeout(() => burst(p.x - Math.sin(p.yaw) * 4 + i - 1, p.y + 2.5, p.z - Math.cos(p.yaw) * 4, [42, 43, 44][i]), i * 200)
    }
    setTimeout(announce, 2600)
  }
  persist()
}
const toastEl = $('toast')
let toastAt = 0, toastWin = false, toastLater = 0
function toast(h: string, win = false) {
  const wait = toastWin && !win ? 1800 - (performance.now() - toastAt) : 0 // a reward stays up a moment before anything else replaces it
  clearTimeout(toastLater)
  if (wait > 0) return void (toastLater = setTimeout(() => toast(h), wait)) // only the latest waits; older ones would be replaced anyway
  toastWin = win; toastAt = performance.now(); toastEl.innerHTML = h; toastEl.classList.toggle('win', win); toastEl.style.animation = 'none'; void toastEl.offsetWidth; toastEl.style.animation = '' } // win: a gold, popping toast for rewards

// the dictionary is a panel like the others: the mouse is free, so it scrolls
// the dictionary's search box: matches characters, pinyin with or without tone marks, or English
let dictQuery = ''
const dictKey = (w: Word) => { const bare = w.py.replace(/[ǖǘǚǜü]/g, 'v').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return `${w.hz} ${w.py} ${w.py.replace(/ /g, '')} ${bare} ${bare.replace(/ /g, '')} ${bare.replace(/v/g, 'u')} ${w.en}`.toLowerCase() } // ü can be typed v or u
const dictHit = (w: Word) => !dictQuery || dictKey(w).includes(dictQuery.toLowerCase().trim())
$('panel').addEventListener('input', e => {
  const el = e.target as HTMLInputElement
  if (el.id !== 'dsearch') return
  dictQuery = el.value
  $('panel').querySelectorAll<HTMLElement>('[data-s]').forEach(b => { b.hidden = !b.dataset.s!.includes(dictQuery.toLowerCase().trim()) })
})
const dictPanel: Panel = {
  draw: () => {
    const known = ALL_WORDS.filter(w => state.seen[w.hz]).sort((a, b) => state.seen[b.hz] - state.seen[a.hz])
    // one button per word: click to hear it. ● ● ● shows how well you know it
    const by = [0, 1, 2].map(l => known.filter(w => level(w) === l).length) // new, familiar, mastered
    return `<h2>词典 cídiǎn · ${known.length} / ${ALL_WORDS.length} · ${html(RANKS[rank()][1])}</h2><p>● ${by[0]} new · ●● ${by[1]} familiar (English gone) · ●●● ${by[2]} mastered (pinyin gone)</p>` + FOOT
      + (state.notes.length ? `<h3>${html(V.grammar)}</h3><ul class="notes">${state.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : '')
      + (known.length > 8 ? `<p><input id="dsearch" value="${dictQuery.replace(/"/g, '&quot;')}" placeholder="搜索 search: 字, pinyin, English" autocomplete="off"></p>` : '') + '<div class="grid">'
      + known.map(w => `<button data-a="${w.hz}" data-s="${dictKey(w).replace(/"/g, '&quot;')}" class="full"${dictHit(w) ? '' : ' hidden'}>🔊 ${html(w)} <small>${'●'.repeat(level(w) + 1)}</small></button>`).join('') + '</div>'
  },
  click: a => { if (!a.startsWith('enter:')) speak(a) }, // Enter in the search box is not a word
}

// --- interaction ---
type Target = { mob: Mob } | { mob?: undefined; x: number; y: number; z: number; nx: number; ny: number; nz: number } | null
let target: Target = null
const crossEl = $('cross')
const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), new THREE.LineBasicMaterial({ color: 0 }))
scene.add(outline)
const look = new THREE.Vector3()

function findTarget() {
  const o = camera.position.toArray(), d = camera.getWorldDirection(look).toArray()
  // animals can be named from 10 blocks away, blocks only within reach (6)
  const far = world.raycast(o, d, 10, id => id !== AIR && id !== WATER), b = far && far.t <= 6 ? far : null
  let best = far ? far.t : 10, mob: Mob | undefined
  for (const m of mobs) {
    if (m === riding || !m.g.visible) continue // not the camel you are sitting on, nor a butterfly resting out of sight
    const t = world.rayBox(o, d, [m.x - m.r, m.y, m.z - m.r], [m.x + m.r, m.y + m.h, m.z + m.r])
    if (t < best) { best = t; mob = m }
  }
  target = mob ? { mob } : b
  crossEl.classList.toggle('mob', !!mob) // gold over someone you can talk to or feed
  outline.visible = !!target && !target.mob
  if (target && !target.mob) outline.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5)
  const wet = target ? null : world.raycast(o, d, 6, id => id !== AIR)
  const word = target ? (target.mob ? undefined : BLOCKS[world.get(target.x, target.y, target.z)].w)
    // nothing in reach: the first non-air cell can only be water; otherwise name what is in the sky, unless land is in the way
    : wet ? (world.get(wet.x, wet.y - 2, wet.z) === WATER ? V.sea : BLOCKS[WATER].w) // deep water is the sea
    : world.raycast(o, d, 160, id => id !== AIR) ? undefined
    : clouds.some(c => world.rayBox(o, d, [c.m.position.x - c.w / 2, c.m.position.y - 0.75, c.m.position.z - c.l / 2], [c.m.position.x + c.w / 2, c.m.position.y + 0.75, c.m.position.z + c.l / 2]) < 300) ? V.cloud
    : look.dot(sunDir) > 0.995 ? V.sun : look.dot(sunDir) < -0.995 ? V.moon : look.y > 0.3 ? (stars.visible ? V.star : V.sky) : undefined
  const h = target?.mob ? ph(name(target.mob)) : word ? ((state.seen[word.hz] ?? 0) < 1 ? '<b class="new">新 new</b>' : '') + html(word) : '' // a word you have not met yet is marked
  if (h !== lastLabel) $('label').innerHTML = lastLabel = h
  // reading a new word's label for two seconds counts as meeting it: the 新 mark goes, with a soft ding
  if (word !== labelWord || !locked()) { labelWord = word; labelSince = performance.now() } // paused time does not count
  else if (word && locked() && (state.seen[word.hz] ?? 0) < 1 && performance.now() - labelSince > 2000) { state.seen[word.hz] = 1; blip(784, 1047); hud() }
}
let lastLabel = '', labelWord: Word | undefined, labelSince = 0

/** average colour of a tile's opaque pixels, 0-255 */
const rgbCache = new Map<number, number[]>()
let atlasPx: Uint8ClampedArray | undefined // the whole atlas, read back once (reading it tile by tile makes the browser warn)
function tileRGB(tile: number) {
  let c = rgbCache.get(tile)
  if (!c) {
    atlasPx ??= atlas.getContext('2d')!.getImageData(0, 0, atlas.width, atlas.height).data
    const sum = [0, 0, 0, 0], x0 = (tile % 8) * 16, y0 = (tile >> 3) * 16
    for (let y = y0; y < y0 + 16; y++) for (let x = x0; x < x0 + 16; x++) {
      const i = (y * atlas.width + x) * 4
      if (atlasPx[i + 3]) { sum[0] += atlasPx[i]; sum[1] += atlasPx[i + 1]; sum[2] += atlasPx[i + 2]; sum[3]++ }
    }
    rgbCache.set(tile, c = sum.slice(0, 3).map(v => v / (sum[3] || 1)))
  }
  return c
}

// digging throws a few crumbs in the block's colour
const bits: { m: THREE.Mesh; v: THREE.Vector3; t: number }[] = []
const crumb = new THREE.BoxGeometry(0.12, 0.12, 0.12), crumbMats = new Map<number, THREE.Material>()
function burst(x: number, y: number, z: number, id: number) {
  const tile = BLOCKS[id].t[1]
  let mat = crumbMats.get(tile)
  if (!mat) {
    const [r, g, b] = tileRGB(tile)
    crumbMats.set(tile, mat = nightly(new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace) })))
  }
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(crumb, mat)
    m.position.set(x + Math.random(), y + Math.random(), z + Math.random())
    scene.add(m)
    bits.push({ m, v: new THREE.Vector3(Math.random() * 3 - 1.5, Math.random() * 4 + 1, Math.random() * 3 - 1.5), t: 0.6 })
  }
}

const name = (m: Mob): Part[] => [...(m.pet ? [V.my] : []), ...(m.size ? [m.size] : []), m.w] // 小猫, 大牛, 我的小猫

function give(id: number, n = 1) {
  state.inv[id] = (state.inv[id] ?? 0) + n
  see(BLOCKS[id].w)
  toast(`+${ph(count(n, id))}`)
}

/** how often the thing a villager asked you to do has been done since they asked */
const did = (k: string) => Math.max(0, (state.did[quest(k).act ?? ''] ?? 0) - (state.base[k] ?? 0)) // never negative: an un-counted lantern can dip below the baseline
const act = (what: string) => { state.did[what] = (state.did[what] ?? 0) + 1 }

/** what a villager says: shown as a toast, unless the listening option is on (then it is only spoken) */
const heard = (h: string) => { if (!state.opts.ear) toast(h) }

function finish(k: string, cheer: Word) {
  const q = quest(k), reward = BLOCKS[q.reward].w
  state.inv[q.reward] = (state.inv[q.reward] ?? 0) + 12
  state.money += 3
  q.parts.filter(isWord).forEach(w => see(w, 2))
  see(cheer, 2); see(reward)
  state.quests[k] = (state.quests[k] ?? 0) + 1
  const next = quest(k).act
  if (next) state.base[k] = state.did[next] ?? 0 // their next request is something to do: count from now
  if (quest(k).deliver && !state.letters[k]) { state.seen['把字句'] ??= 1; state.letters[k] = 1; state.inv[LETTER] = (state.inv[LETTER] ?? 0) + 1 } // their next errand is a letter: here it is
  if (!state.won && Object.keys(NPCS).every(n => (state.quests[n] ?? 0) >= NPCS[n].asks.length)) { // every villager's whole list, once
    state.won = true
    setTimeout(() => {
      const parts: Part[] = [V.congrats, '！', V.you, V.am, V.we, V.de, V.friend, V.le, '！']
      parts.filter(isWord).forEach(w => see(w))
      speak(plain(parts)); toast(said({ parts, en: 'Congratulations! You are our friend now!' }), true)
      for (let i = 0; i < 12; i++) setTimeout(() => { // fireworks in cloth colours
        burst(p.x + Math.random() * 16 - 8, p.y + 6 + Math.random() * 5, p.z + Math.random() * 16 - 8, [42, 43, 44][i % 3]); blip(523 + i * 60)
      }, i * 350)
    }, 3000)
  }
  speak(cheer.hz + '！', false, k); blip(523, 659, 784)
  toast(said({ parts: [cheer, '！ +', ...count(12, q.reward), ' +', ...price(3)], en: `${cheer.en}! +12 × ${reward.en}, +3 money` }), true)
  burst(p.x - Math.sin(p.yaw) * 4, p.y + 2.5, p.z - Math.cos(p.yaw) * 4, [42, 43, 44][state.quests[k] % 3]) // a little confetti
  hud()
}

/** an animal you click or feed turns to you, stops for a moment and hops */
function notice(m: Mob) {
  m.hop = performance.now()
  if (m.fly || m.swim || m === riding) return
  m.dir = Math.atan2(p.z - m.z, p.x - m.x); m.speed = 0; m.t = Math.max(m.t, 2)
}
function talk(m: Mob) {
  if (!m.npc) {
    const sound = SOUNDS.get(m.w), what = `${m.size ? m.size.en + ' ' : ''}${m.w.en}`
    see(m.w); if (sound) see(sound); if (m.size) see(m.size)
    if ((m.g.userData.sleep ?? 0) > 0.5) { // woken up: 小猫睡觉了
      const parts: Part[] = [...name(m), V.sleep, V.le, '。']
      see(V.sleep); see(V.le, 0.3)
      speak(plain(parts)); toast(said({ parts, en: `The ${what} is asleep.` }))
    } else { speak(plain(name(m)) + (sound ? '。' + sound.hz + '！' : '')); toast(said({ parts: sound ? [...name(m), '：', sound, '！'] : name(m), en: `${what}${sound ? ': ' + sound.en + '!' : ''}` })) }
    notice(m)
    const drop = DROPS.get(m.w) // eggs, milk: one per animal per 20 s
    const gave = !!drop && performance.now() > (m.cool ?? 0)
    if (gave) { m.cool = performance.now() + 20000; give(drop!); burst(m.x - 0.5, m.y, m.z - 0.5, drop!) } // a puff in the egg's, milk's or wool's colour
    // "find a …" quests from villagers you have met are answered by clicking the right animal
    for (const k of Object.keys(NPCS)) {
      const q = quest(k)
      if (!q.find || !state.seen[NPCS[k].w.hz]) continue
      if (q.find === m.w && (!q.size || q.size === m.size)) return finish(k, V.right)
      if (state.track === k && !gave) { // collecting milk or eggs is not a wrong answer
        const parts: Part[] = [V.wrong, '。', V.this, V.am, ...name(m), '。']
        parts.filter(isWord).forEach(w => see(w))
        speak(plain(parts)); toast(said({ parts, en: `Wrong. This is a ${m.size ? m.size.en + ' ' : ''}${m.w.en}.` }))
      }
    }
    return hud()
  }
  if (m.npc === 'friend') { see(V.friend); return openPanel(chatPanel()) }
  if (m.npc === 'merchant') { see(V.merchant); speak(plain(SHOP_SAY.parts), false, 'merchant'); return openPanel(shopPanel) }
  const k = m.npc, npc = NPCS[k], q = quest(k)
  const first = !state.seen[npc.w.hz], tracked = state.track === k
  // a letter someone else gave you for this villager: hand it over, and the sender's errand is done
  const from = Object.keys(state.letters).find(g => quest(g).deliver === k)
  if (from) {
    delete state.letters[from]; state.inv[LETTER] = Math.max(0, (state.inv[LETTER] ?? 0) - 1)
    return finish(from, V.thanks)
  }
  see(npc.w)
  state.track = k
  if (q.act) { // something to do: done yet?
    if (did(k) >= q.n) return finish(k, V.thanks)
    speak(plain(q.parts), false, k); heard(said(q))
    return hud()
  }
  if (q.deliver) { // take the letter (once) and hear where it goes
    state.seen['把字句'] ??= 1 // not a word: the trigger for the note on 把 as object marker (把 the measure word is met much earlier)
    if (!state.letters[k]) { state.letters[k] = 1; give(LETTER) }
    speak(plain(q.parts), false, k); heard(said(q))
    return hud()
  }
  if (q.find || (state.inv[q.item] ?? 0) < q.n) {
    const intro: Part[] = first ? [V.hello, '！', V.me, V.am, npc.w, '。'] : []
    speak(plain([...intro, ...q.parts]), false, k)
    if (first) heard(said({ parts: intro, en: `Hello! I am the ${npc.w.en}.` }))
    else if (tracked && !q.find) { // asked again without enough: say how many are still missing
      const missing = q.n - (state.inv[q.item] ?? 0), parts: Part[] = [V.notEnough, '。', V.still, V.need, ...count(missing, q.item), '。']
      see(V.notEnough); see(V.still)
      speak(plain(parts), false, k); heard(said({ parts, en: `Not enough. ${missing} × ${BLOCKS[q.item].w.en} more.` }))
    }
    else heard(said(q))
    return hud()
  }
  state.inv[q.item] -= q.n
  finish(k, V.thanks)
}

const PAST: Record<string, string> = { 拔: 'pulled up', 挖: 'dug', 砍: 'chopped', 摘: 'picked', 割: 'cut', 拿: 'took' }
function dig() {
  swingAt = performance.now()
  if (!target) return
  if (target.mob) return talk(target.mob)
  let { x, y, z } = target
  if (y < 0) return // bedrock under the world
  const first = world.get(x, y, z)
  if (first === BLACKBOARD) return openPanel(boardPanel)
  if (first === CHEST) return use(x, y, z, first)
  if ([STONE, COAL, IRON, GOLD].includes(first) && !state.inv[PICKAXE]) { // stone needs a pickaxe: craft one (E)
    see(V.need); speak(V.need.hz + plain(count(1, PICKAXE)))
    return toast(said({ parts: [V.need, ...count(1, PICKAXE), '。'], en: 'That needs a pickaxe.' }))
  }
  const natural = !state.placed[world.idx(x, y, z)] // bonus drops only from blocks you didn't put there yourself
  // plants standing on the block come along
  do {
    const id = world.get(x, y, z)
    setBlock(x, y, z, AIR)
    delete state.placed[world.idx(x, y, z)]
    burst(x, y, z, id)
    give(id === SPROUT ? SEEDS : id === DOOR_OPEN ? DOOR : id) // a sprout is just its seed again
    if (id === WHEAT) give(SEEDS, 1 + (Math.random() * 2 | 0))
    blip(150)
  } while (BLOCKS[world.get(x, ++y, z)].plant)
  // say what you did, with the verb that fits: 我砍了一块木头 / 我摘了一朵红花 / 我挖了一块土
  const verb = VERBS.get(first) ?? V.dig, did: Part[] = [V.me, verb, V.le, ...count(1, first === DOOR_OPEN ? DOOR : first), '。']
  see(verb, 0.3); see(V.le, 0.1)
  toast(said({ parts: did, en: `I ${PAST[verb.hz]} 1 × ${BLOCKS[first].w.en}.` })); speak(plain(did))
  if (first === STONE && natural) act('mine') // not a stone you put there yourself
  if (first === LANTERN && !natural) { // taking your lantern back un-counts it, without pushing anyone's request further away
    state.did.lamp = Math.max(0, (state.did.lamp ?? 0) - 1)
    for (const k in state.base) if (quest(k).act === 'lamp') state.base[k] = Math.min(state.base[k], state.did.lamp)
  }
  if (natural && first === LEAVES && Math.random() < 0.25) { give(APPLE); speak(BLOCKS[APPLE].w.hz) }
  if (natural && first === GRASS && Math.random() < 0.2) give(SEEDS)
  if (natural && first === LEAVES && Math.random() < 0.1) give(SAPLING)
  hud()
}

const waterAhead = () => {
  const hit = world.raycast(camera.position.toArray(), camera.getWorldDirection(look).toArray(), 8, id => id !== AIR)
  return hit && world.get(hit.x, hit.y, hit.z) === WATER ? hit : null
}
function sail() {
  if (boating) { boating = false; return }
  const hit = waterAhead()
  if (!hit || !onSea(hit.x, hit.z)) return
  p.x = hit.x + 0.5; p.z = hit.z + 0.5; boating = true
  see(V.row); speak(V.row.hz); toast(html(V.row))
}

let fishAt = 0
function fish() {
  if (!waterAhead() || performance.now() < fishAt) return
  fishAt = performance.now() + 1200
  const w = BLOCKS[FISH].w
  if (Math.random() < 0.5) { give(FISH); speak(w.hz); act('fish') }
  else { see(V.notHave); speak(V.notHave.hz + w.hz); toast(html(V.notHave) + html(w)) }
  hud()
}

function feed(m: Mob) {
  const likes = FOOD.get(m.w) === sel, food = BLOCKS[sel].w, verb = EDIBLE.get(sel) === V.drink ? V.drink : V.eat
  const parts: Part[] = likes ? [m.w, verb, food, '。'] : [m.w, V.not, verb, food, '。']
  parts.filter(isWord).forEach(w => see(w))
  if (likes) { state.inv[sel]--; m.love = performance.now() + 30000; notice(m) }
  if (likes && m.w === V.penguin) act('feed')
  if (likes && (m.fed = (m.fed ?? 0) + 1) === 3) { // third meal: it is yours and stays with you
    m.pet = true; if (!state.pets.includes(petKey(m))) state.pets.push(petKey(m)) // remembered: after a reload an animal like it is yours again
    const mine: Part[] = [V.this, V.am, ...name(m), '！']
    see(V.my); speak(plain(parts) + plain(mine)); blip(523, 659, 784)
    toast(said({ parts: mine, en: `This is my ${m.size ? m.size.en + ' ' : ''}${m.w.en}!` }), true)
    return hud()
  }
  speak(plain(parts))
  toast(said({ parts, en: `The ${m.w.en} ${likes ? 'eats' : verb === V.drink ? "doesn't drink" : "doesn't eat"} ${food.en}.${likes ? ' ❤' : ''}` }))
  hud()
}

// farming: seeds go on grass or dirt, sprout, and are wheat a minute later (also while you are away)
function plant() {
  if (!target || target.mob || target.ny !== 1) return
  const { x, y, z } = target, soil = world.get(x, y, z)
  if ((soil !== GRASS && soil !== DIRT) || world.get(x, y + 1, z) !== AIR) return
  setBlock(x, y + 1, z, SPROUT)
  state.inv[SEEDS]--
  state.crops[world.idx(x, y + 1, z)] = Date.now() + 60000
  act('plant')
  const parts: Part[] = [V.plant, ...count(1, SEEDS), '。']
  parts.filter(isWord).forEach(w => see(w))
  blip(300); speak(plain(parts)); toast(said({ parts, en: 'Plant a seed.' })); hud()
}
function growCrops() {
  for (const [i, t] of Object.entries(state.crops)) {
    if (Date.now() < t) continue
    delete state.crops[+i]
    const x = +i % SX, z = Math.floor(+i / SX) % SZ, y = Math.floor(+i / SX / SZ), near = Math.hypot(x - p.x, z - p.z) < 14
    if (world.data[+i] === SAPLING && Math.floor(p.x) === x && Math.floor(p.z) === z && p.y < y + 6) { state.crops[+i] = Date.now() + 5000; continue } // not while you stand in it
    if (world.data[+i] === SAPLING) { // grow a real tree and record every block of it, so it survives a reload
      const before = world.data.slice()
      world.set(x, y, z, AIR); world.tree(x, y, z, 4 + (Math.random() * 2 | 0))
      world.data.forEach((b, j) => { if (b !== before[j]) state.edits[j] = b })
      delete state.placed[+i]
      world.relight()
      for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) remesh(Math.floor(x / CH) + dx, Math.floor(z / CH) + dz)
      if (near) { see(V.tree); see(V.grow); toast(said({ parts: [V.tree, V.grow, V.le, '！'], en: 'The tree has grown!' })) }
      persist()
      continue
    }
    if (world.data[+i] !== SPROUT) continue // dug up meanwhile
    setBlock(x, y, z, WHEAT)
    if (near) { see(V.ripe); toast(said({ parts: [BLOCKS[WHEAT].w, V.ripe, V.le, '！'], en: 'The wheat is ripe!' })) }
    persist()
  }
}

// right-click things that do something: doors open and close, beds skip the night
function use(x: number, y: number, z: number, id: number) {
  let parts: Part[], en: string
  if (id === CHEST) {
    const chest = BLOCKS[CHEST].w
    if (state.chest) { parts = [chest, V.am, V.empty, V.de, '。']; en = 'The chest is empty.' }
    else {
      state.chest = true; state.money += 50; blip(523, 659, 784, 1047)
      parts = [V.openUp, chest, '！ +', ...price(50)]; en = 'Open the treasure chest! +50 money'
    }
  } else if (id === BED) {
    const hour = (8 + clock / 20) % 24, night = hour >= 18 || hour < 5
    if (night) { clock += ((30 - hour) % 24) * 20; lastPeriod = period(6) } // sleep until six; 睡觉 gets said, not the morning greeting
    state.home = [x, y, z] // your bed is your home: it shows on the map
    parts = night ? [V.sleep, '。'] : [V.this, V.am, V.my, V.home, '。']
    en = night ? 'Sleep.' : 'This is my home.'
  } else {
    const opening = id === DOOR
    setBlock(x, y, z, opening ? DOOR_OPEN : DOOR)
    if (!opening && hits()) setBlock(x, y, z, DOOR_OPEN) // don't shut it on yourself
    parts = [opening ? V.open : V.close, BLOCKS[DOOR].w, '。']
    en = opening ? 'Open the door.' : 'Close the door.'
    blip(opening ? 330 : 220)
  }
  parts.filter(isWord).forEach(w => see(w))
  speak(plain(parts)); toast(said({ parts, en })); hud()
  if (parts[0] === V.sleep) { canvas.animate?.([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], 1800); openPanel(dayPanel); state.dayFrom = snap(); persist() } // the day is over: how it went, then a new one
}

// food: say it, enjoy it, and run a little faster for half a minute
let boost = 0
function eat() {
  const verb = EDIBLE.get(sel)!, food = BLOCKS[sel].w, parts: Part[] = [V.me, verb, V.le, ...count(1, sel), '。', verb === V.drink ? V.tastyDrink : V.tasty, '！']
  state.inv[sel]--
  boost = performance.now() + 30000
  act(verb === V.drink ? 'drink' : 'eat')
  parts.filter(isWord).forEach(w => see(w))
  blip(392, 494); speak(plain(parts)); toast(said({ parts, en: `I ${verb === V.drink ? 'drank' : 'ate'} 1 × ${food.en}. Tasty!` })); hud()
}

// camels can be ridden: right-click one empty-handed to get on, again (or Space) to get off
let riding: Mob | undefined
function ride(m?: Mob) {
  if (riding) { // getting off: the camel stays where it can stand, else goes back to the last such place
    const c = riding, s = world.surface(Math.floor(p.x), Math.floor(p.z))
    if (world.get(Math.floor(p.x), s - 1, Math.floor(p.z)) === WATER) [c.x, c.z] = rideLand // not left in the sea
    const covered = c.x === p.x && c.z === p.z && Math.abs(s - p.y) > 1 // under a roof: it waits right there
    c.y = covered ? Math.floor(p.y) : world.surface(Math.floor(c.x), Math.floor(c.z))
    c.g.position.set(c.x, c.y, c.z); c.t = covered ? 1e9 : 0; c.speed = 0
    riding = undefined
    return
  }
  if (!m || boating || Math.hypot(m.x - p.x, m.z - p.z) > 4) return // walk up to it first
  riding = m; rideLand = [m.x, m.z]
  act('ride')
  const parts: Part[] = [V.me, V.ride, ...name(m), '。']
  parts.filter(isWord).forEach(w => see(w))
  blip(330, 440); speak(plain(parts)); toast(said({ parts, en: `I ride the ${m.w.en}.` })); hud()
}
let rideLand = [0, 0] // where the ridden camel last stood on dry, open ground

function place() {
  swingAt = performance.now()
  // riding comes first, or a camel could never be mounted while you carry anything; cactus in hand still feeds it
  if (riding || (target?.mob?.w === V.camel && sel !== FOOD.get(V.camel))) return ride(target?.mob)
  // a rod or boat aimed at a fish in the water is a cast or a launch, not a meal; butterflies and birds are not fed
  if (target?.mob?.swim && (sel === ROD || sel === BOAT)) return sel === ROD ? fish() : sail()
  if (target?.mob && !target.mob.npc && !target.mob.fly && state.inv[sel]) return feed(target.mob)
  if (target?.mob) return talk(target.mob)
  if (target && !target.mob) {
    const id = world.get(target.x, target.y, target.z)
    if (id === DOOR || id === DOOR_OPEN || id === BED || id === CHEST) return use(target.x, target.y, target.z, id)
  }
  if (sel === ROD) return fish()
  if (EDIBLE.has(sel) && state.inv[sel]) return eat()
  if (sel === BOOK && state.inv[BOOK]) return openPanel(bookPanel()) // a book in your hand can be read anywhere
  if (sel === BOAT) return sail()
  if (sel === SEEDS && state.inv[SEEDS]) return plant()
  if (!target || !sel || !state.inv[sel] || BLOCKS[sel].item || sel === WHEAT) return // wheat is grown, not placed
  const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz
  const old = world.get(x, y, z)
  if ((old !== AIR && old !== WATER) || y >= world.SY) return
  world.set(x, y, z, sel)
  if (hits()) return world.set(x, y, z, old) // would entomb the player
  setBlock(x, y, z, sel)
  state.inv[sel]--
  state.placed[world.idx(x, y, z)] = 1
  if (sel === LANTERN) act('lamp')
  if (sel === SAPLING) state.crops[world.idx(x, y, z)] = Date.now() + 90000 // a tree in a minute and a half
  const word = BLOCKS[sel].w, verb = sel === SAPLING ? V.plant : V.put, did: Part[] = [V.me, verb, V.le, ...count(1, sel), '。']
  blip(300)
  see(word); see(verb, 0.3)
  toast(said({ parts: did, en: `I ${sel === SAPLING ? 'planted' : 'put down'} 1 × ${word.en}.` })); speak(plain(did)); hud()
}

// --- panels (crafting, shop, exam): free the mouse, draw buttons, handle clicks ---
interface Panel { draw: () => string; click: (action: string) => void }
const panelEl = $('panel')
let panel: Panel | null = null
function openPanel(pn: Panel) { panel = pn; panelEl.innerHTML = pn.draw(); if (panelEl.hidden) panelEl.animate?.([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], 160); panelEl.hidden = false; panelEl.tabIndex = -1; panelEl.focus(); $('start').hidden = true; document.exitPointerLock() }
function closePanel(resume = true) { panel = null; panelEl.hidden = true; $('start').hidden = false; if (resume) enter() }
panelEl.onclick = e => {
  const b = (e.target as HTMLElement).closest('button')
  if (!b || !panel) return
  if (b.dataset.a === 'close') return closePanel()
  panel.click(b.dataset.a!)
  redraw()
}
const redraw = () => { if (panel) { panelEl.innerHTML = panel.draw(); ((panel !== dictPanel && panelEl.querySelector('input')) || panelEl).focus() } } // the dictionary's search box only gets focus when clicked, so C still closes it
panelEl.onkeydown = e => { // Enter in a panel's text box (or after it) is that panel's "enter:<text>" action
  if (e.key !== 'Enter' || !panel) return
  // Enter moves on where there is a "next" button, and submits a text box; anywhere else it does nothing
  if (panelEl.querySelector('[data-a=next]')) panel.click('next')
  else if ((e.target as HTMLElement).tagName === 'INPUT') panel.click('enter:' + (e.target as HTMLInputElement).value)
  else return
  redraw()
}
const FOOT = '<p><button data-a="close" class="small">✕ E</button> &nbsp; hold T — translate</p>'
// sleeping at night ends the day: a card with what it brought (words met, requests finished, money earned)
const done = () => Object.values(state.quests).reduce((a, b) => a + b, 0), snap = () => ({ words: known(), done: done(), money: state.money })
state.dayFrom ??= snap() // saved, so a reload mid-day does not reset the count
const dayPanel: Panel = {
  draw: () => {
    const words = Math.max(0, known() - state.dayFrom!.words), reqs = done() - state.dayFrom!.done, money = state.money - state.dayFrom!.money
    return `<h2>${html(V.goodnight)}</h2><div class="ask">🌙 ${ph([V.today, V.me, V.learn, V.le, words === 2 ? V.two : numWord(words), V.ge, V.zi, '。'])}</div>`
      + `<p class="sum">✔ ${num(reqs)} <small>requests finished</small>${money > 0 ? ` · +${ph(price(money))}` : ''}</p>`
      + `<p><button data-a="close" class="small">${html(V.goodnight)} ✕</button></p>`
  },
  click: () => {},
}
const grid = (rows: string[]) => `<div class="grid">${rows.join('')}</div>`

// recipes are written as Chinese counting phrases
const craftPanel: Panel = {
  draw: () => `<h2>${html(V.make)}${html(V.things)}</h2>` + grid(RECIPES.map((r, i) =>
    `<button data-a="${i}"${canCraft(i) ? '' : ' disabled'}>${r.in.map(([id, n]) => icon(id) + ph(count(n, id))).join(' + ')} → ${icon(r.out[0])}${ph(count(r.out[1], r.out[0]))}</button>`)) + FOOT,
  click: a => {
    if (!craft(+a)) return
    const [id, n] = RECIPES[+a].out
    see(V.make); see(BLOCKS[id].cl); see(BLOCKS[id].w)
    blip(440, 554)
    speak(V.make.hz + plain(count(n, id)))
    toast(`${html(V.make)} ${ph(count(n, id))}`)
    hud()
  },
}

const SHOP_SAY = { parts: [V.you, V.need, V.buy, V.what, '？'] as Part[], en: 'What do you want to buy?' }
const shopPanel: Panel = {
  draw: () => `<h2>${html(V.merchant)}</h2>${said(SHOP_SAY)}<p>${html(V.money)}：${ph(price(state.money))}</p>`
    + `<h3>${html(V.buy)}</h3>` + grid(SHOP.buy.map(([id, c], i) => `<button data-a="buy${i}"${state.money >= c ? '' : ' disabled'}>${icon(id)}${ph(count(1, id))} · ${ph(price(c))}</button>`))
    + `<h3>${html(V.sell)}</h3>` + grid(SHOP.sell.map(([id, c], i) => `<button data-a="sell${i}"${state.inv[id] ? '' : ' disabled'}>${icon(id)}${ph(count(1, id))} · ${ph(price(c))}</button>`)) + FOOT,
  click: a => {
    const kind = a.startsWith('buy') ? 'buy' : 'sell', i = +a.slice(kind.length)
    if (!trade(kind, i)) return
    const [id, c] = SHOP[kind][i], parts: Part[] = [V[kind], ...count(1, id), '，', ...price(c), '。']
    parts.filter(isWord).forEach(w => see(w))
    blip(kind === 'buy' ? 392 : 523, 659)
    speak(plain(parts)); toast(said({ parts, en: `${kind === 'buy' ? 'Bought' : 'Sold'} 1 × ${BLOCKS[id].w.en} for ${c}.` }))
    hud()
  },
}

const CHAT_SAY = { parts: [V.hello, '！', V.we, V.chat, V.lets, '！'] as Part[], en: "Hello! Let's chat!" }
// the friend asks about the world as it is right now; pick the reply that is true
const chatCtx = () => ({
  period: lastPeriod, wet: lastWeather === V.rain, hour: (8 + clock / 20) % 24, day: Math.floor((160 + clock) / 480),
  dirTo: (k: string) => { const s = world.SPOTS[k], dx = s.x - p.x, dz = s.z - p.z; return Math.hypot(dx, dz) < 6 ? undefined : dirTo(dx, dz) },
})
function chatPanel(): Panel {
  const ctx = chatCtx
  let c = chat(ctx()), picked = -1
  const ask = () => speak(plain(c.ask.parts), false, 'friend')
  ask()
  return {
    draw: () => {
      const mark = (i: number) => picked < 0 ? '' : i === c.answer ? ' class="ok" disabled' : i === picked ? ' class="bad" disabled' : ' disabled'
      return `<h2>${html(V.friend)}</h2><div class="ask">${c.icon ? icon(c.icon) : ''}${said(c.ask)}</div>`
        + `<div class="col">${c.options.map((o, i) => `<button data-a="${i}"${mark(i)}>${ph(o.parts)}${picked < 0 ? '' : `<small> ${o.en}</small>`}</button>`).join('')}</div>`
        + (picked < 0 ? '' : `<p class="full">${html(picked === c.answer ? V.right : V.wrong)}</p><button data-a="next">${html(V.next)} →</button>`) + FOOT
    },
    click: a => {
      if (a === 'next') { picked = -1; c = chat(ctx()); return ask() }
      picked = +a
      const ok = picked === c.answer, right = c.options[c.answer]
      ;[...c.ask.parts, ...right.parts].filter(isWord).forEach(w => see(w, ok ? 1 : 0.5))
      if (ok) { state.money++; blip(659, 880) } else blip(140)
      see(ok ? V.right : V.wrong); speak(plain(right.parts)); hud()
    },
  }
}

// B: everything you carry, as sentences; click one to hold it
const bagPanel: Panel = {
  draw: () => `<h2>${html(V.bag)}</h2>` + (owned.length ? grid(owned.map(id =>
    `<button data-a="${id}"${id === sel ? ' class="ok"' : ''}>${icon(id)}${ph([V.me, V.have, ...count(Math.min(state.inv[id], 999), id), '。'])}</button>`))
    : `<p class="full">${ph([V.me, V.notHave, V.things, '。'])}</p>`) + FOOT,
  click: a => { sel = +a; hud(); closePanel() },
}

// Q: what everyone you have met is asking for right now; click one to follow it in the corner
const tasksPanel: Panel = {
  draw: () => {
    const met = Object.keys(NPCS).filter(k => state.seen[NPCS[k].w.hz])
    return `<h2>${html(V.tasks)}</h2><div class="col">` + (met.length ? met.map(k => {
      const s = world.SPOTS[k], dx = s.x - p.x, dz = s.z - p.z, q = quest(k)
      return `<button data-a="${k}"${k === state.track ? ' class="ok"' : ''}>${html(NPCS[k].w)} <small>${Math.hypot(dx, dz) < 4 ? '' : `${dirTo(dx, dz).hz} ${num(Math.round(Math.hypot(dx, dz)))}米`}</small><br>${ph(q.parts)}<br><small>${q.en}</small></button>`
    }).join('') : `<p>${ph([V.me, V.notHave, V.tasks, '。'])}</p>`) + '</div>' + FOOT
  },
  click: a => { if (NPCS[a]) { state.track = a; hud(); closePanel() } },
}

// the blackboard's menu of activities
const boardPanel: Panel = {
  draw: () => `<h2>${html(BLOCKS[BLACKBOARD].w)}</h2><div class="col"><button data-a="exam">${html(V.exam)} <small>words: listen and read</small></button>`
    + `<button data-a="compose">${html(V.compose)} <small>put the words in order</small></button>`
    + `<button data-a="pinyin">${html(V.write)}${html(V.pinyin)} <small>type how a word is said</small></button>`
    + `<button data-a="cl">${html(V.measure)} <small>三 ＿ 木头: pick the measure word</small></button>`
    + `<button data-a="tone">${html(V.tone)} <small>hear a word, pick its tone</small></button>`
    + `<button data-a="num">${html(V.number)} <small>hear a number, pick it (十四 or 四十?)</small></button>`
    + `<button data-a="book">${html(V.look)}${html(BLOCKS[BOOK].w)} <small>read a short story</small></button>`
    + `<button data-a="say"${Rec ? '' : ' disabled'}>🎤 ${html(V.say)} <small>${Rec ? 'say a word aloud' : 'needs a browser with speech recognition (Chrome, Edge, Safari)'}</small></button></div>` + FOOT,
  click: a => { panel = a === 'num' ? quizPanel(V.number, numQuiz, true) : a === 'cl' ? quizPanel(V.measure, clQuiz, false) : a === 'tone' ? quizPanel(V.tone, toneQuiz, true) : a === 'exam' ? examPanel() : a === 'compose' ? composePanel() : a === 'book' ? bookPanel() : a === 'say' ? sayPanel() : pinyinPanel() },
}

// say a word into the microphone; the browser's recogniser writes down what it heard and we look for the word in it
// ponytail: compares characters, so a perfect homophone can be marked wrong; only words of two or more characters are asked
const Rec = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
function sayPanel(): Panel {
  const next = () => { let w = reviewWord(); for (let i = 0; i < 50 && [...w.hz].length < 2; i++) w = reviewWord(); return w }
  let word = next(), n = 1, score = 0, heard: string | null = null, listening = false
  const listen = () => {
    const r = new Rec()
    r.lang = 'zh-CN'; r.maxAlternatives = 5
    r.onresult = (e: any) => {
      const alts: string[] = [...e.results[0]].map((a: any) => a.transcript)
      heard = alts.find(t => t.includes(word.hz)) ?? alts[0] ?? ''
    }
    r.onerror = r.onend = () => { // fires after a result too: settle the round exactly once
      if (!listening) return
      listening = false; heard ??= ''
      if (heard.includes(word.hz)) { score++; see(word); blip(659, 880) } else blip(140)
      redraw()
    }
    try { r.start(); listening = true } catch { heard = '' }
  }
  return {
    draw: () => {
      if (n > 5) return `<h2>${html(V.say)}</h2><p class="big">${html(V.right)} ${cn(score)} / ${cn(5)}</p><p>+${ph(price(score * 2))}</p>` + FOOT
      const ok = heard !== null && heard.includes(word.hz)
      return `<h2>${html(V.say)} ${cn(n)} / ${cn(5)}</h2><p class="big full">${html(word)}</p>`
        + (heard === null ? `<button data-a="mic"${listening ? ' disabled' : ''}>🎤 ${listening ? html(V.listen) + '…' : html(V.say)}</button> <button data-a="hear">🔊 ${html(V.listen)}</button>`
          : `<p class="full">${html(ok ? V.right : V.wrong)} — ${html(V.heard)}：${heard || '…'}</p><button data-a="next">${html(V.next)} →</button>`) + FOOT
    },
    click: a => {
      if (a === 'hear') return speak(word.hz)
      if (a === 'mic') return listen()
      if (a !== 'next') return
      heard = null
      if (++n > 5) { state.money += score * 2; blip(523, 659, 784); hud() } else word = next()
    },
  }
}

// a story: click a sentence to hear it and see what it means; finishing one for the first time pays
function bookPanel(): Panel {
  let i = STORIES.findIndex((_, k) => !state.read.includes(k)), open = -1
  if (i < 0) i = Math.random() * STORIES.length | 0
  return {
    draw: () => {
      const s = STORIES[i], isNew = !state.read.includes(i)
      return `<h2>《${html(s.title)}》 ${cn(i + 1)} / ${cn(STORIES.length)}</h2><div class="col">`
        + s.lines.map((l, k) => `<button data-a="${k}">${ph(l.parts)}${k === open ? `<small> ${l.en}</small>` : ''}</button>`).join('') + '</div>'
        + `<button data-a="done">${html(V.read)}${html(V.done)}${html(V.le)}${isNew ? ' +' + ph(price(3)) : ''} →</button>` + FOOT
    },
    click: a => {
      if (a !== 'done') { open = +a; STORIES[i].lines[open].parts.filter(isWord).forEach(w => see(w, 0.5)); return speak(plain(STORIES[i].lines[open].parts)) }
      if (!state.read.includes(i)) { state.read.push(i); state.money += 3; blip(523, 659, 784) }
      act('read')
      i = (i + 1) % STORIES.length; open = -1; hud()
    },
  }
}

// a five-question multiple choice drill; `listen` speaks the word before you answer (tones) instead of after (measure words)
function quizPanel(title: Word, make: () => Quiz, listen: boolean): Panel {
  let q = make(), n = 1, score = 0, picked = -1
  const say = () => speak(plain(q.reveal))
  if (listen) say()
  return {
    draw: () => {
      if (n > 5) return `<h2>${html(title)}</h2><p class="big">${html(V.right)} ${cn(score)} / ${cn(5)}</p><p>+${ph(price(score * 2))}</p>` + FOOT
      const mark = (i: number) => picked < 0 ? '' : i === q.answer ? ' class="ok" disabled' : i === picked ? ' class="bad" disabled' : ' disabled'
      return `<h2>${html(title)} ${cn(n)} / ${cn(5)}</h2><p class="big">${q.prompt.map(x => isWord(x) ? x.hz : x).join('')}</p><p>${q.en}</p>`
        + (listen ? `<button data-a="say">🔊 ${html(V.listen)}</button>` : '')
        + grid(q.options.map((o, i) => `<button data-a="${i}"${mark(i)}>${o}</button>`))
        + (picked < 0 ? '' : `<p class="full">${html(picked === q.answer ? V.right : V.wrong)} — ${ph(q.reveal)}</p><button data-a="next">${html(V.next)} →</button>`) + FOOT
    },
    click: a => {
      if (a === 'say') return say()
      if (a === 'next') { picked = -1; if (++n > 5) { state.money += score * 2; blip(523, 659, 784); hud() } else { q = make(); if (listen) say() } return }
      if (picked >= 0 || isNaN(+a)) return
      picked = +a
      const ok = picked === q.answer
      if (ok) { score++; see(q.word); blip(659, 880) } else { state.seen[q.word.hz] = Math.max(0, (state.seen[q.word.hz] ?? 0) - 1); blip(140) }
      see(ok ? V.right : V.wrong); see(title, 0.2); say(); hud()
    },
  }
}

// type the pinyin of a word you have met; Enter checks, Enter again moves on
function pinyinPanel(): Panel {
  let word = reviewWord(), n = 1, score = 0, result = ''
  return {
    draw: () => {
      if (n > 5) return `<h2>${html(V.write)}${html(V.pinyin)}</h2><p class="big">${html(V.right)} ${cn(score)} / ${cn(5)}</p><p>+${ph(price(score * 2))}</p>` + FOOT
      const verdict = result === 'right' ? html(V.right) : result === 'tones' ? html(V.tone) + html(V.wrong) : html(V.wrong)
      return `<h2>${html(V.write)}${html(V.pinyin)} ${cn(n)} / ${cn(5)}</h2><p class="big">${word.hz}</p><p>${word.en}</p>`
        + (result ? `<p class="full">${verdict} — ${html(word)}</p><button data-a="next">${html(V.next)} →</button>`
          : '<input id="py" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ni3 hao3"><p>tone numbers 1–4 after each syllable, then Enter</p>') + FOOT
    },
    click: a => {
      if (a === 'next') { result = ''; if (++n > 5) { state.money += score * 2; blip(523, 659, 784); hud() } else word = reviewWord(); return }
      if (!a.startsWith('enter:') || !a.slice(6).trim()) return
      result = checkPinyin(a.slice(6), word)
      if (result === 'right') { score++; see(word); blip(659, 880) }
      else { state.seen[word.hz] = Math.max(0, (state.seen[word.hz] ?? 0) - (result === 'tones' ? 1 : 2)); blip(140) }
      see(V.pinyin, 0.2); speak(word.hz); hud()
    },
  }
}

// a sentence someone on the island might say, as shuffled word tiles to put back in order
function randomLine(): Line {
  for (;;) {
    const keys = Object.keys(NPCS), c = chat(chatCtx())
    const l: Line = Math.random() < 0.5 ? quest(keys[Math.random() * keys.length | 0], Math.random() * 30 | 0) : Math.random() < 0.5 ? c.ask : c.options[c.answer]
    const n = l.parts.filter(isWord).length
    if (n >= 3 && n <= 9 && !l.parts.includes('，')) return l
  }
}
function composePanel(): Panel {
  let line: Line, words: Word[], tiles: number[], chosen: number[], n = 0, score = 0
  const deal = () => {
    line = randomLine(); words = line.parts.filter(isWord); chosen = []; n++
    do tiles = words.map((_, i) => i).sort(() => Math.random() - 0.5); while (tiles.every((t, i) => t === i))
    speak(plain(line.parts))
  }
  deal()
  return {
    draw: () => {
      if (n > 5) return `<h2>${html(V.compose)}</h2><p class="big">${html(V.right)} ${cn(score)} / ${cn(5)}</p><p>+${ph(price(score * 2))}</p>` + FOOT
      const done = chosen.length === tiles.length, ok = done && chosen.every((t, i) => words[t].hz === words[i].hz)
      return `<h2>${html(V.compose)} ${cn(n)} / ${cn(5)}</h2><p>${line.en}</p><button data-a="say">🔊 ${html(V.listen)}</button>`
        + `<div class="line">${chosen.map((t, i) => `<button data-a="u${i}"${done ? ' disabled class="' + (ok ? 'ok' : 'bad') + '"' : ''}>${html(words[t])}</button>`).join('')}&nbsp;</div>`
        + `<div class="line">${tiles.filter(t => !chosen.includes(t)).map(t => `<button data-a="t${t}">${html(words[t])}</button>`).join('')}&nbsp;</div>`
        + (done ? `<p class="full">${html(ok ? V.right : V.wrong)}</p><div class="ask">${said(line)}</div><button data-a="next">${html(V.next)} →</button>` : '') + FOOT
    },
    click: a => {
      if (a === 'say') return speak(plain(line.parts))
      if (a === 'next') { if (n < 5) return deal(); n++; state.money += score * 2; blip(523, 659, 784); return hud() }
      if (a[0] === 'u') { chosen.splice(+a.slice(1), 1); return }
      chosen.push(+a.slice(1))
      if (chosen.length < tiles.length) return
      const ok = chosen.every((t, i) => words[t].hz === words[i].hz)
      words.forEach(w => see(w, ok ? 1 : 0.5))
      if (ok) { score++; blip(659, 880) } else blip(140)
      see(ok ? V.right : V.wrong); see(V.compose, 0.2); speak(plain(line.parts)); hud()
    },
  }
}

// the word exam: five questions; right answers pay, wrong ones bring the word's pinyin and English back
function examPanel(): Panel {
  let q = question(), n = 1, score = 0, picked = -1
  const ask = () => { if (q.listen) speak(q.word.hz) }
  ask()
  return {
    draw: () => {
      if (n > 5) return `<h2>${html(V.exam)}</h2><p class="big">${html(V.right)} ${cn(score)} / ${cn(5)}</p><p>+${ph(price(score * 2))}</p>` + FOOT
      const mark = (i: number) => picked < 0 ? '' : i === q.answer ? ' class="ok" disabled' : i === picked ? ' class="bad" disabled' : ' disabled'
      return `<h2>${html(V.exam)} ${cn(n)} / ${cn(5)}</h2>`
        + (q.listen ? `<button data-a="say">🔊 ${html(V.listen)}</button>` : `<p class="big">${q.word.hz}</p>`)
        + grid(q.options.map((o, i) => `<button data-a="${i}"${mark(i)}>${o}</button>`))
        + (picked < 0 ? '' : `<p class="full">${html(picked === q.answer ? V.right : V.wrong)} — ${html(q.word)}</p><button data-a="next">${html(V.next)} →</button>`) + FOOT
    },
    click: a => {
      if (a === 'say') return ask()
      if (a === 'next') {
        picked = -1
        if (++n > 5) { state.money += score * 2; see(V.money); blip(523, 659, 784); hud() } else { q = question(); ask() }
        return
      }
      picked = +a
      const ok = picked === q.answer
      if (ok) { score++; see(q.word); blip(659, 880) }
      else { state.seen[q.word.hz] = Math.max(0, (state.seen[q.word.hz] ?? 0) - 2); blip(140) }
      see(ok ? V.right : V.wrong); see(V.exam, 0.2); speak(q.word.hz); hud()
    },
  }
}

// --- input ---
const canvas = renderer.domElement
// desktop plays while the pointer is locked; touch devices play once started (no pointer lock there)
const touch = matchMedia('(pointer: coarse)').matches || location.search.includes('touch')
let playing = false, started = false
const locked = () => touch ? playing && !panel : document.pointerLockElement === canvas
// Chrome refuses a new lock for about a second after Esc released the last one: try again then, instead of ignoring the click
const lock = (again = true) => (canvas.requestPointerLock() as unknown as Promise<void> | undefined)?.catch?.(() => { if (again) setTimeout(() => lock(false), 1100) })
// the very first Play shows the four things to know, once
const welcomePanel: Panel = {
  draw: () => `<h2>${html(V.hello)}！</h2><div class="welcome">` + (touch
    ? [['👀', 'Look around', 'Drag to look. Everything you look at shows its name in Chinese.'], ['⛏️', '挖 dig · 放 place', 'Hold 挖 to dig, tap 放 to place or use what you hold.'],
      ['💬', 'Talk', 'Tap 挖 on a villager. They ask for things in Chinese; the corner says who and where.'], ['译', 'Translate', 'Tap 译 for pinyin and English, 再 to hear it again.']]
    : [['👀', 'Look around', 'Move the mouse. Everything you look at shows its name in Chinese.'], ['⛏️', 'Dig and build', 'Hold click to dig, right-click to place or use what you hold.'],
      ['💬', 'Talk', 'Click a villager. They ask for things in Chinese; the corner says who and where.'], ['T', 'Translate', 'Hold T for pinyin and English, R to hear it again. Esc pauses.']])
    .map(([i, h, t]) => `<div><b>${i}</b><h3>${h}</h3><small>${t}</small></div>`).join('') + '</div><p><button data-a="close" class="ok go">好！ Let’s go</button></p>',
  click: () => {},
}
const enter = () => { if (!state.welcomed && known() === 0 && !state.money) { state.welcomed = true; persist(); return openPanel(welcomePanel) } /* new players only */ unlockVoice(); try { (audio ??= new AudioContext()).resume() } catch { /* no audio */ } see(V.di, 0.2); see(V.day, 0.2); if (touch) { playing = true; $('start').hidden = true } else lock() }
$('play').onclick = enter
// splash: the logo for a moment, then the menu. Any click or key skips it (and does nothing else)
const splash = $('splash'), endSplash = () => { if (!splash.isConnected || splash.classList.contains('out')) return; splash.classList.add('out'); setTimeout(() => splash.remove(), 600) }
splash.onclick = endSplash
addEventListener('keydown', e => { if (splash.isConnected && !splash.classList.contains('out')) { endSplash(); e.stopImmediatePropagation() } }, true)
setTimeout(endSplash, 2400)
// menu pages: main, how to play, settings, save data
const showPage = (name: string) => document.querySelectorAll<HTMLElement>('#start .page').forEach(el => { el.hidden = el.dataset.page !== name })

// start screen: progress so far, and how much help to show
const OPTS: [keyof typeof state.opts, string, string[]][] = [
  ['py', 'Pinyin', ['fades as you learn', 'always', 'never']], ['en', 'English', ['fades as you learn', 'never']], ['voice', 'Voice', ['normal', 'slow', 'off']],
  ['ear', 'What villagers say', ['shown and spoken', 'spoken only (hold T to read)']], ['music', 'Music', ['on', 'off']], ['ui', 'Text size', ['normal', 'large', 'small']], ['look', 'Look speed', ['normal', 'fast', 'slow']], ['invert', 'Look up / down', ['normal', 'inverted']]]
const lookSpeed = () => [0.0025, 0.004, 0.0015][state.opts.look] ?? 0.0025, upDown = () => state.opts.invert ? -1 : 1
// achievements (成就): read straight off the save, so old saves get theirs too. Listed in the menu; one reached while playing pops up
const ACH: [Word, string, () => unknown][] = ([
  ['新朋友', 'xīn péngyou', 'New friend: finish a first request', () => Object.values(state.quests).some(n => n > 0)],
  ['好帮手', 'hǎo bāngshou', 'Good helper: finish 20 requests', () => done() >= 20],
  ['小学生', 'xiǎoxuéshēng', 'Pupil: meet 50 words', () => known() >= 50],
  ['大学生', 'dàxuéshēng', 'Scholar: meet 150 words', () => known() >= 150],
  ['钓鱼', 'diàoyú', 'Angler: catch a fish', () => state.did.fish],
  ['农民', 'nóngmín', 'Farmer: plant a seed', () => state.did.plant],
  ['矿工', 'kuànggōng', 'Miner: dig stone with a pickaxe', () => state.did.mine],
  ['宠物', 'chǒngwù', 'Pet: tame an animal', () => state.pets.length],
  ['我的家', 'wǒ de jiā', 'Home: make a bed your home', () => state.home],
  ['读书', 'dúshū', 'Reader: read a book', () => state.did.read || state.read.length],
  ['骑骆驼', 'qí luòtuo', 'Rider: ride the camel', () => state.did.ride],
  ['有钱人', 'yǒuqiánrén', 'Rich: have 100 块钱', () => state.money >= 100],
  ['宝藏', 'bǎozàng', 'Treasure: open the treasure chest', () => state.chest],
  ['节日', 'jiérì', "Festival: finish every villager's list", () => state.won],
] as const).map(([hz, py, en, ok]) => [{ hz, py, en: en.split(':')[0] }, en, ok])
const got = new Set([...state.ach ?? [], ...ACH.filter(a => a[2]()).map(a => a[0].hz)]) // saved, so spending the money or losing the pet does not undo one
function checkAch() {
  if (performance.now() - toastAt < 3500) return // let the current toast have its moment
  for (const [w, en, ok] of ACH) if (!got.has(w.hz) && ok()) {
    got.add(w.hz); state.ach = [...got]; persist(); blip(523, 659, 784, 1047)
    toast(`<div class="s l0">🏆 ${html(w)}<div class="en">Achievement: ${en}</div></div>`, true)
    return // one at a time; the next check shows the next
  }
}
// word of the day on the menu: one you have met but not mastered (any word on a first visit); click it to hear it
const wotd = () => { const ws = ALL_WORDS.filter(w => state.seen[w.hz] >= 1 && level(w) < 2), pool = ws.length ? ws : ALL_WORDS; return pool[Math.floor(Date.now() / 864e5) % pool.length] }
$('wotd').onclick = () => { unlockVoice(); speak(wotd().hz) }
function drawStart() {
  const earned = ([w, , ok]: typeof ACH[number]) => got.has(w.hz) || !!ok() // once earned, kept: spending the money or moving the bed does not undo it
  $('ach').innerHTML = `<p>${ACH.filter(earned).length} / ${ACH.length}</p>` + ACH.map(a => `<div class="ach${earned(a) ? ' on' : ''}"><b>${earned(a) ? '🏆' : '🔒'}</b>${html(a[0])}<small>${a[1]}</small></div>`).join('')
  $('wotd').innerHTML = `<small>今天的词 · word of the day 🔊</small>${html(wotd())}`
  const dayN = Math.floor((160 + clock) / 480) + 1 // 第一天, 第二天 …
  $('progress').innerHTML = `<span class="s">${ph([V.di, numWord(Math.min(dayN, 999)), V.day])} · ${html(RANKS[rank()][1])} · ${ph([V.learn, V.le, known() === 2 ? V.two : numWord(known()), V.ge, V.zi])} · ${ph(price(state.money))} · 🏆 ${ACH.filter(([w, , ok]) => got.has(w.hz) || ok()).length}</span>`
    + (RANKS[rank() + 1] ? `<div class="next">${bar((known() - RANKS[rank()][0]) / (RANKS[rank() + 1][0] - RANKS[rank()][0]))}<small>→ ${html(RANKS[rank() + 1][1])} · ${RANKS[rank() + 1][0] - known()} more words</small></div>` : '') // how far to the next title
  $('opts').innerHTML = OPTS.map(([k, label, vals]) => `<button data-o="${k}">${label} <b>${vals[state.opts[k]]}</b></button>`).join('')
  const fresh = known() === 0 && !state.money && !started
  $('playzh').textContent = fresh ? '开始' : '继续'; $('playen').textContent = fresh ? 'Play' : 'Continue'
  // keep a translate toggle that is on (touch) while the option classes are rewritten
  document.body.className = `py${state.opts.py} en${state.opts.en} ear${state.opts.ear}${touch ? ' touch' : ''}${document.body.classList.contains('peek') ? ' peek' : ''}${document.body.classList.contains('photo') ? ' photo' : ''} ui${state.opts.ui}`
  $('progress').hidden = known() === 0 && !state.money // nothing to report on a first visit
  // the voice list can arrive late; only complain once it is there and has no Chinese in it
  const voices = typeof speechSynthesis === 'undefined' ? [] : speechSynthesis.getVoices()
  // hidden while the list may still be loading, when a Mandarin voice exists, or when the voice is switched off
  $('novoice').hidden = state.opts.voice === 2 || hasClips() || !!zhVoice() || (typeof speechSynthesis !== 'undefined' && voices.length === 0 && performance.now() < 3000)
}
if (typeof speechSynthesis !== 'undefined') speechSynthesis.addEventListener?.('voiceschanged', () => drawStart())
setTimeout(drawStart, 3100) // by now a device without any voices has had its chance: show the warning
$('start').onclick = e => {
  try { (audio ??= new AudioContext()).resume() } catch { /* no audio */ } // the menu has music too, once you click something
  const b = (e.target as HTMLElement).closest('button')
  if (b?.dataset.go) return blip(660), showPage(b.dataset.go)
  const k = b?.dataset.o
  if (k === 'reset') { if (confirm('Erase all progress, inventory and buildings?')) { wiping = true; localStorage.removeItem('cubedao'); location.reload() } return }
  if (k === 'export') { // the whole save as text, to paste into another browser
    savePos()
    const text = JSON.stringify(state)
    return void (navigator.clipboard?.writeText(text) ?? Promise.reject()).then(() => alert('Save copied to the clipboard.'), () => prompt('Copy this save:', text))
  }
  if (k === 'import') {
    const text = prompt('Paste a save exported from CubeDao:')
    if (!text) return
    try { // must at least look like a save, or the game would not start again
      const o = JSON.parse(text), obj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)
      if (!obj(o) || !obj(o.inv) || !obj(o.seen) || !obj(o.quests ?? {}) || !obj(o.edits ?? {}) || typeof (o.money ?? 0) !== 'number' || !NPCS[o.track ?? 'teacher']) throw 0
    } catch { return alert('That is not a CubeDao save.') }
    wiping = true; localStorage.setItem('cubedao', text); location.reload()
    return
  }
  const o = OPTS.find(x => x[0] === k)
  if (!o) return
  state.opts[o[0]] = (state.opts[o[0]] + 1) % o[2].length
  persist(); drawStart()
}
drawStart()
document.addEventListener('pointerlockchange', () => { $('start').hidden = locked() || !!panel; $('start').classList.toggle('paused', started); if (!locked()) showPage('main'); drawStart() })
const toggleCraft = () => panel ? closePanel() : openPanel(craftPanel)
// M: a map of the island with its places written in characters; you keep walking while it is open
const mapEl = $('map') as HTMLCanvasElement, land = document.createElement('canvas')
land.width = land.height = SX
function landRGB(x: number, z: number) { // one pixel per column, coloured by its top block and shaded by height
  let y = world.SY - 1
  while (y > 0 && world.get(x, y, z) === AIR) y--
  const [r, gr, b] = tileRGB(BLOCKS[world.get(x, y, z)].t[0]), k = 0.6 + y / 60
  return [r * k, gr * k, b * k, 255]
}
var landImg: ImageData | undefined // var, as setBlock can run before this line; kept, so a changed column is a few bytes, not a redraw
function drawLand() {
  const g = land.getContext('2d')!
  landImg = g.createImageData(SX, SZ)
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) landImg.data.set(landRGB(x, z), (x + z * SX) * 4)
  g.putImageData(landImg, 0, 0); landCols.length = 0
}
function drawMap() {
  const g = mapEl.getContext('2d')!, k = mapEl.width / SX
  g.imageSmoothingEnabled = false
  g.drawImage(land, 0, 0, mapEl.width, mapEl.height)
  g.font = 'bold 20px "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif'; g.textAlign = 'center'; g.lineWidth = 4
  for (const [key, word] of [...Object.entries(PLACES), ['friend', V.friend] as const]) {
    const s = world.SPOTS[key]
    const ty = s.z * k + (key === 'friend' ? 22 : -6) // the friend lives next to the school: label below the dot, not on top of 学校
    g.strokeStyle = '#000'; g.strokeText(word.hz, s.x * k, ty); g.fillStyle = '#fff'; g.fillText(word.hz, s.x * k, ty)
    g.fillStyle = '#ffd640'; g.fillRect(s.x * k - 3, s.z * k - 3, 6, 6)
  }
  if (state.home) { // your bed
    const [hx, , hz] = state.home
    g.strokeStyle = '#000'; g.strokeText(V.home.hz, hx * k, hz * k - 6); g.fillStyle = '#ffd640'; g.fillText(V.home.hz, hx * k, hz * k - 6)
  }
  g.font = 'bold 16px sans-serif'; g.fillStyle = '#e8304a'
  for (const m of mobs) if (m.pet) g.fillText('♥', m.x * k, m.z * k + 5) // your pets, wherever you left them
  g.save(); g.translate(p.x * k, p.z * k); g.rotate(-p.yaw) // you: an arrow pointing where you look (north is up)
  g.fillStyle = '#ff3030'; g.strokeStyle = '#fff'; g.lineWidth = 2
  g.beginPath(); g.moveTo(0, -10); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.fill(); g.stroke(); g.restore()
}
// minimap (bottom right): the land around you, north up like the big map, with nearby places named
const mini = $('mini') as HTMLCanvasElement
function updateLand() { // the land picture, brought up to date: in full the first time, then just the columns that changed
  if (!landImg) return drawLand()
  const g = land.getContext('2d')!
  for (const i of new Set(landCols.splice(0))) { const x = i % SX, z = Math.floor(i / SX); landImg.data.set(landRGB(x, z), i * 4); g.putImageData(landImg, 0, 0, x, z, 1, 1) }
}
function drawMini() {
  updateLand()
  const g = mini.getContext('2d')!, R = 36, k = mini.width / (R * 2), c = mini.width / 2
  g.imageSmoothingEnabled = false
  g.fillStyle = '#2f62a8'; g.fillRect(0, 0, mini.width, mini.height) // the sea beyond the edge of the world
  g.drawImage(land, p.x - R, p.z - R, R * 2, R * 2, 0, 0, mini.width, mini.height)
  g.font = 'bold 14px "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif'; g.textAlign = 'center'; g.lineWidth = 3
  for (const [key, word] of [...Object.entries(PLACES), ['friend', V.friend] as const]) {
    const s = world.SPOTS[key], x = c + (s.x - p.x) * k, y = c + (s.z - p.z) * k
    if (Math.hypot(x - c, y - c) > c - 8) continue
    g.fillStyle = '#ffd640'; g.fillRect(x - 3, y - 3, 6, 6)
    const ty = y + (key === 'friend' ? 17 : -6) // below its dot, as on the big map, so it does not run into 学校
    g.strokeStyle = '#000'; g.strokeText(word.hz, x, ty); g.fillStyle = '#fff'; g.fillText(word.hz, x, ty)
  }
  const at = (x: number, z: number) => [c + (x - p.x) * k, c + (z - p.z) * k] as const, inside = ([x, y]: readonly number[]) => Math.hypot(x - c, y - c) < c - 8
  if (state.home) { const h = at(state.home[0], state.home[2]); if (inside(h)) { g.strokeStyle = '#000'; g.strokeText(V.home.hz, h[0], h[1]); g.fillStyle = '#ffd640'; g.fillText(V.home.hz, h[0], h[1]) } } // your bed
  g.fillStyle = '#e8304a'
  for (const m of mobs) if (m.pet) { const h = at(m.x, m.z); if (inside(h)) g.fillText('♥', h[0], h[1] + 5) } // your pets
  g.save(); g.translate(c, c); g.rotate(-p.yaw)
  g.fillStyle = '#ff3030'; g.strokeStyle = '#fff'; g.lineWidth = 2
  g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke(); g.restore()
}
setTimeout(() => landImg ?? drawLand(), 300) // paint the land while the menu is up, not on the first frame of play
const toggleMap = () => { mapEl.hidden = !mapEl.hidden; if (!mapEl.hidden) { see(V.map); speak(V.map.hz); updateLand(); drawMap() } }

const toggleDict = () => panel ? closePanel() : (dictQuery = '', openPanel(dictPanel))
$('hotbar').onclick = e => { // tap or click a slot to select it
  const el = (e.target as HTMLElement).closest<HTMLElement>('.slot')
  if (el) { sel = +el.dataset.id!; picked = true; hud() }
}

if (touch) {
  $('touch').hidden = false; $('hint').hidden = true
  const stick = $('stick'), nub = stick.firstElementChild as HTMLElement
  const steer = (e: TouchEvent) => { // left stick: digital WASD
    e.preventDefault()
    const t = e.targetTouches[0], r = stick.getBoundingClientRect()
    const x = t ? (t.clientX - r.left) / r.width - 0.5 : 0, y = t ? (t.clientY - r.top) / r.height - 0.5 : 0
    keys.KeyW = y < -0.15; keys.KeyS = y > 0.15; keys.KeyA = x < -0.15; keys.KeyD = x > 0.15
    keys.ShiftLeft = Math.hypot(x, y) > 0.42 // pushed to the rim: run
    nub.style.transform = `translate(${Math.max(-0.5, Math.min(0.5, x)) * 80}px, ${Math.max(-0.5, Math.min(0.5, y)) * 80}px)`
  }
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const) stick.addEventListener(ev, steer, { passive: false })
  // drag anywhere else to look around; one finger steers the view, so a second one landing does not make it jump
  let lx = 0, ly = 0, finger: number | undefined
  canvas.addEventListener('touchstart', e => { if (finger === undefined) { const t = e.changedTouches[0]; finger = t.identifier; lx = t.clientX; ly = t.clientY } })
  const lift = (e: TouchEvent) => { if (Array.from(e.changedTouches).some(t => t.identifier === finger)) finger = undefined }
  canvas.addEventListener('touchend', lift); canvas.addEventListener('touchcancel', lift)
  canvas.addEventListener('touchmove', e => {
    e.preventDefault()
    const t = Array.from(e.changedTouches).find(t => t.identifier === finger)
    if (!t) return
    p.yaw -= (t.clientX - lx) * lookSpeed() * 2.4
    p.pitch = Math.max(-1.55, Math.min(1.55, p.pitch - (t.clientY - ly) * lookSpeed() * 2.4 * upDown()))
    lx = t.clientX; ly = t.clientY
  }, { passive: false })
  const press = (e: TouchEvent, down: boolean) => {
    const k = (e.target as HTMLElement).dataset.k
    if (!k) return
    e.preventDefault()
    if (k === 'jump') keys.Space = down
    else if (k === 'dig' && !down) digAt = Infinity // holding 挖 keeps digging, like holding the mouse button
    else if (!down) return
    else if (k === 'craft') toggleCraft()
    else if (k === 'dict') toggleDict()
    else if (k === 'peek') document.body.classList.toggle('peek')
    else if (k === 'map') toggleMap()
    else if (k === 'tasks') panel ? closePanel() : openPanel(tasksPanel)
    else if (k === 'bag') panel ? closePanel() : openPanel(bagPanel)
    else if (k === 'again') repeat()
    else if (k === 'menu') { if (panel) closePanel(false); $('start').classList.add('paused'); release(); playing = false; $('start').hidden = false; showPage('main'); drawStart() } // touch has no Esc: this pauses
    else if (locked() && k === 'home') goHome()
    else if (locked() && k === 'dig') { dig(); digAt = performance.now() + 280 }
    else if (locked()) place()
  }
  $('touch').addEventListener('touchstart', e => press(e, true), { passive: false })
  $('touch').addEventListener('touchend', e => press(e, false), { passive: false })
}
addEventListener('contextmenu', e => e.preventDefault())
addEventListener('mousemove', e => {
  if (!locked() || Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return // Chrome sometimes reports a huge jump right after locking
  p.yaw -= e.movementX * lookSpeed()
  p.pitch = Math.max(-1.55, Math.min(1.55, p.pitch - e.movementY * lookSpeed() * upDown()))
})
let digAt = Infinity // holding the button keeps digging
addEventListener('mousedown', e => { if (touch || !locked()) return; // touch has its own buttons; ignore synthesised clicks
  if (e.button === 2 || (e.button === 0 && e.ctrlKey)) return place() // ctrl-click is the right click of a one-button Mac trackpad
  if (e.button === 0) { dig(); digAt = performance.now() + 280 } })
addEventListener('mouseup', () => { digAt = Infinity })
// one item per notch of a wheel; a trackpad sends dozens of small deltas per swipe, so they add up to a step first
let wheel = 0
addEventListener('wheel', e => {
  if (!locked() || !owned.length) return // in a panel the wheel scrolls the panel
  wheel += e.deltaMode ? e.deltaY * 40 : e.deltaY
  if (Math.abs(wheel) < 50) return
  cycle(Math.sign(wheel)); wheel = 0
})
const cycle = (d: number) => { if (owned.length) { sel = owned[(owned.indexOf(sel) + d + owned.length) % owned.length]; picked = true; hud() } }
const running = () => !!(keys.ShiftLeft || keys.ShiftRight || keys.PadRun)

// gamepad (standard layout): left stick walks (pushed all the way, or clicked, runs), right stick looks, A jumps,
// RT digs (hold), LT places / uses, LB / RB pick the item, Y says the last line again, d-pad up opens the map.
// Menus still need the mouse.
const padWas: boolean[] = []
function pollPad(dt: number) {
  const gp = navigator.getGamepads?.().find(g => g?.connected)
  if (!gp) { // unplugged mid-press: let go of everything it held
    if (padWas.some(Boolean)) { keys.PadW = keys.PadS = keys.PadA = keys.PadD = keys.PadRun = keys.PadJump = false; if (padWas[7]) digAt = Infinity; padWas.length = 0 }
    return
  }
  const ax = (i: number) => Math.abs(gp.axes[i] ?? 0) > 0.25 ? gp.axes[i] : 0, btn = (i: number) => !!gp.buttons[i]?.pressed, pressed = (i: number) => btn(i) && !padWas[i]
  keys.PadW = ax(1) < 0; keys.PadS = ax(1) > 0; keys.PadA = ax(0) < 0; keys.PadD = ax(0) > 0
  keys.PadRun = btn(10) || Math.hypot(ax(0), ax(1)) > 0.95; keys.PadJump = btn(0)
  if (locked()) {
    const k = lookSpeed() / 0.0025
    p.yaw -= ax(2) * dt * 2.6 * k
    p.pitch = Math.max(-1.55, Math.min(1.55, p.pitch - ax(3) * dt * 2 * k * upDown()))
    if (pressed(7)) { dig(); digAt = performance.now() + 280 } else if (!btn(7) && padWas[7]) digAt = Infinity
    if (pressed(6)) place()
    if (pressed(4)) cycle(-1)
    if (pressed(5)) cycle(1)
    if (pressed(3)) repeat()
    if (pressed(12)) toggleMap() // the map needs no mouse: d-pad up
    if (pressed(9)) document.exitPointerLock() // Start: pause to the menu
  }
  gp.buttons.forEach((b, i) => { padWas[i] = b.pressed })
}
addEventListener('keydown', e => {
  if ((e.target as HTMLElement).tagName === 'INPUT') { if (e.code === 'Escape') closePanel(false); return } // typing, not playing
  keys[e.code] = true
  if (e.repeat) return
  const n = +e.code.slice(5)
  if (e.code.startsWith('Digit') && shown[n - 1]) { sel = shown[n - 1]; picked = true; hud() }
  if (e.code === 'KeyT') document.body.classList.add('peek') // released again on keyup, and by release() if the window loses focus meanwhile
  if (e.code === 'KeyF' && locked()) place()
  if (e.code === 'KeyE') toggleCraft()
  if (e.code === 'Escape' && panel) closePanel(false)
  if (e.code === 'Enter' && !locked() && !panel && !$('start').hidden && !(e.target as HTMLElement).closest('button')) enter() // Enter plays from the menu
  if ((e.code === 'ArrowDown' || e.code === 'ArrowUp') && !locked() && !panel && !$('start').hidden) { // arrows walk the menu's buttons
    const bs = Array.from(document.querySelectorAll<HTMLElement>('#start button')).filter(b => b.offsetParent), i = bs.indexOf(document.activeElement as HTMLElement)
    bs[(i + (e.code === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]?.focus(); e.preventDefault()
  }
  if (e.code === 'KeyC') toggleDict()
  if (e.code === 'KeyM') toggleMap()
  if (e.code === 'KeyH' && locked()) goHome()
  if (e.code === 'KeyR') repeat() // 再说一遍: the last thing said, slowly
  if (e.code === 'KeyP' && locked()) document.body.classList.toggle('photo') // photo mode: the island without the HUD
  if (e.code === 'KeyQ') panel ? closePanel() : (see(V.tasks), speak(V.tasks.hz), openPanel(tasksPanel))
  if (e.code === 'KeyB') panel ? closePanel() : (see(V.bag), speak(V.bag.hz), openPanel(bagPanel))
})
// 回家 (H): back to your bed, or to the school if you have none yet
function goHome() {
  if (state.home && world.get(state.home[0], state.home[1], state.home[2]) !== BED) state.home = undefined // the bed is gone
  const dest = state.home ? V.home : PLACES.teacher
  if (riding) ride()
  boating = false
  if (state.home) { // stand next to the bed, on its floor; on top of it only if every side is walled in
    const [x, y, z] = state.home
    for (const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0], [0, 0]]) {
      Object.assign(p, { x: x + dx + 0.5, y: dx || dz ? y : y + 1, z: z + dz + 0.5, vy: 0 })
      if (!hits()) break
    }
  } else Object.assign(p, { x: world.HOME.x + 0.5, y: world.surface(world.HOME.x, world.HOME.z + 7), z: world.HOME.z + 7.5, vy: 0 })
  while (hits() && p.y < world.SY) p.y++
  for (const m of mobs) if (m.pet && !m.swim) besideYou(m) // pets come along
  const parts: Part[] = [V.me, V.goBack, dest, '。']
  parts.filter(isWord).forEach(w => see(w))
  speak(plain(parts)); toast(said({ parts, en: `I go back ${state.home ? 'home' : 'to the school'}.` })); hud()
}
// switching window or leaving the game mid-keypress would otherwise leave you walking (or digging) forever
const release = () => { for (const k in keys) keys[k] = false; digAt = Infinity; document.body.classList.remove('peek') }
addEventListener('blur', release)
document.addEventListener('pointerlockchange', () => { if (!locked()) release() })
addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'KeyT') document.body.classList.remove('peek') })

// --- day cycle, loop ---
// 凌晨 before five, 早上 to nine, 上午 to twelve, 中午 to one, 下午 to six, then 晚上
const period = (h: number) => h < 5 ? V.dawn : h < 9 ? V.morning : h < 12 ? V.forenoon : h < 13 ? V.noon : h < 18 ? V.afternoon : V.evening
const sunDir = new THREE.Vector3(), sun = box(22, 22, 22, 0xffe070, 0, 0, 0), moon = box(14, 14, 14, 0xe8eef8, 0, 0, 0)
const halos = [0xffd080, 0xa0b8ff].map((color, i) => { // halos: the sun's warm and wide, the moon's faint
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: i ? 0.35 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
  h.scale.setScalar(i ? 50 : 110); scene.add(h); return h
})
for (const m of [sun, moon]) { m.material = new THREE.MeshBasicMaterial({ color: (m.material as THREE.MeshBasicMaterial).color, fog: false }); scene.add(m) } // they shine: no night dimming
// sky dome: the fog colour at the horizon, a deeper blue overhead, and a warm glow around the sun while it is up (strongest at sunrise and sunset)
const dome = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, depthTest: false,
  uniforms: { uSky: { value: sky }, uSun: { value: sunDir } },
  vertexShader: 'varying vec3 vDir;\nvoid main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 uSky; uniform vec3 uSun; varying vec3 vDir;
void main() {
  vec3 c = mix(uSky, uSky * vec3(0.5, 0.68, 0.95), pow(clamp(vDir.y, 0.0, 1.0), 0.6));
  c += vec3(1.0, 0.7, 0.4) * pow(max(dot(vDir, uSun), 0.0), 8.0) * (0.25 + 0.6 * (1.0 - smoothstep(0.0, 0.5, uSun.y))) * smoothstep(-0.15, 0.05, uSun.y); // stronger as it sets
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
}))
dome.renderOrder = -1; dome.frustumCulled = false
scene.add(dome)
// the item in your hand, bottom right: a little block (or a flat item), bobbing as you walk and swinging when you dig or place
const held = new THREE.Mesh(new THREE.BufferGeometry(), nightly(new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, depthTest: false, fog: false })))
held.renderOrder = 10 // drawn last and through everything, so it never sinks into a wall
camera.add(held); scene.add(camera)
let heldId = -1, swingAt = -1e9
function setHeld(id: number) {
  if (id === heldId) return
  heldId = id; held.geometry.dispose()
  if (!id) return void (held.geometry = new THREE.BufferGeometry())
  const b = BLOCKS[id], cube = !!b.opaque, geo = cube ? new THREE.BoxGeometry(1, 1, 1) : new THREE.PlaneGeometry(1, 1), uv = geo.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i++) { // each face onto its atlas tile (box faces: +x -x +y -y +z -z, four corners each)
    const f = Math.floor(i / 4), t = !cube ? b.t[1] : f === 2 ? b.t[0] : f === 3 ? b.t[2] : b.t[1]
    uv.setXY(i, ((t % 8) + 0.01 + uv.getX(i) * 0.98) / 8, 1 - ((t >> 3) + 0.99 - uv.getY(i) * 0.98) / 8)
  }
  held.geometry = geo; held.userData.cube = cube
}
let lastAction = V.stand, lastWeather = V.sunny, lastLand = 0
let tick = 0, lastPeriod = period((8 + clock / 20) % 24), lastInfo = '' // the day starts at eight on Monday

function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.033); last = now
  pollPad(dt)
  if (locked()) { clock += dt; move(dt); if (!started) canvas.animate?.([{ opacity: 0 }, { opacity: 1 }], 700); started = true } // from the menu's flight into your eyes: a fade, not a cut
  if (now > digAt && locked() && target && !target.mob) { dig(); digAt = now + 280 }
  for (let i = bits.length - 1; i >= 0; i--) { // digging debris
    const b = bits[i]
    b.v.y -= 22 * dt; b.m.position.addScaledVector(b.v, dt)
    if ((b.t -= dt) < 0) { scene.remove(b.m); bits.splice(i, 1) }
  }
  updateMobs(dt)
  // on a camel you sit higher, unless there is a ceiling in the way
  const eye = riding && !BLOCKS[world.get(Math.floor(p.x), Math.floor(p.y + 2.9), Math.floor(p.z))].solid ? 2.7 : 1.62
  camera.position.set(p.x, p.y + eye, p.z)
  camera.rotation.set(p.pitch, p.yaw, 0)
  if (!started) { // the menu: a slow flight around the village until you first play
    const t = now / 1000 * 0.04
    camera.position.set(world.HOME.x + Math.cos(t) * 45, world.SEA + 30, world.HOME.z + Math.sin(t) * 45)
    camera.lookAt(world.HOME.x, world.SEA + 4, world.HOME.z)
  }
  // a slightly wider view while running or riding
  const fov = 75 + ((running() && moving) || riding ? 8 : 0) // not tied to the ground, or every hop would pulse it
  if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix() }
  { // the held item
    const k = (now - swingAt) / 250, swing = k < 1 ? Math.sin(k * Math.PI) : 0, bob = moving && p.ground ? Math.sin(now / 90) : 0, cube = held.userData.cube
    held.visible = heldId > 0 && started && !document.body.classList.contains('photo')
    held.position.set(0.48 + bob * 0.01, (cube ? -0.34 : -0.28) + Math.abs(bob) * 0.015 - swing * 0.06, -0.75 - swing * 0.1)
    held.rotation.set((cube ? 0.35 : 0) - swing * 0.9, cube ? -0.7 : -0.35, cube ? 0 : 0.2)
    held.scale.setScalar(cube ? 0.2 : 0.3)
  }
  camera.updateMatrixWorld()
  const hour = (8 + clock / 20) % 24 // 20 s per hour, 8 min per day
  const a = (hour - 6) / 12 * Math.PI // sun rises in the east (+x) at 6, sets in the west at 18
  sunDir.set(Math.cos(a), Math.sin(a), 0.3).normalize()
  sun.position.copy(camera.position).addScaledVector(sunDir, 220)
  moon.position.copy(camera.position).addScaledVector(sunDir, -220)
  halos[0].position.copy(sun.position); halos[1].position.copy(moon.position)
  boat.visible = boating
  boat.position.set(p.x, world.SEA - 0.1, p.z)
  boat.rotation.y = p.yaw
  findTarget()

  uDay.value = 0.3 + 0.7 * Math.max(0, Math.min(1, Math.sin((hour - 6) / 12 * Math.PI) * 2 + 0.2)) // 0.3 at night, 1 by day
  for (const m of signs) m.color.setScalar(uDay.value)
  const per = period(hour)
  if (per !== lastPeriod && per === V.dawn) lastPeriod = per // nobody greets you at midnight
  if (per !== lastPeriod) { // greet each new part of the day; the morning greeting also counts the days: 今天是第二天
    lastPeriod = per
    const day = Math.floor((160 + clock) / 480) + 1
    const parts: Part[] = per === V.morning ? [per, V.good, '！', V.today, V.am, V.di, numWord(Math.min(day, 999)), V.day, '。'] : [per, V.good, '！']
    parts.filter(isWord).forEach(w => see(w, w === per ? 1 : 0.3))
    speak(plain(parts))
    toast(said({ parts, en: per === V.morning ? `Good morning! Today is day ${day}.` : per === V.forenoon ? 'Good morning!' : per === V.noon ? 'Good day!' : `Good ${per.en}!` }))
  }
  if (action !== lastAction) see(lastAction = action, 0.2) // verbs sink in slowly
  // weather: a one-minute shower every four minutes; on the snow island it always snows, on the sand island never rains
  const land = tick % 30 ? lastLand : (lastLand = world.biome(Math.floor(p.x), Math.floor(p.z)))
  const snow = land === 1 // the whole island and its shallows, so wading in and out does not flip the weather
  // showers run 15:30–18:30 and 3:30–6:30, so one never starts or ends at the same instant as a greeting
  const wet = snow || (land !== 2 && (clock + 30) % 240 > 180), weather = snow ? V.snowing : wet ? V.rain : V.sunny
  if (weather !== lastWeather) {
    lastWeather = weather
    const parts: Part[] = wet ? [weather, V.le, '！'] : [V.clear, V.le, '！']
    parts.filter(isWord).forEach(w => see(w))
    speak(plain(parts)); toast(said({ parts, en: snow ? "It's snowing!" : wet ? "It's raining!" : 'The sky has cleared!' }))
    ;(rain.material as THREE.PointsMaterial).size = snow ? 0.16 : 0.07 // flakes are bigger than drops
  }
  rain.visible = wet
  if (tick % 15 === 0) rainSound(!locked() ? 0 : snow ? 0.004 : wet ? 0.03 : 0)
  // sky: grey in rain, orange around six in the morning and evening
  sky.copy(wet ? GREY : SKY).lerp(DUSK, 0.75 * Math.max(0, 1 - Math.min(Math.abs(hour - 6), Math.abs(hour - 18.5)) / 1.5)).multiplyScalar(uDay.value * uDay.value)
  // head under water: everything fades into blue a few blocks away
  const under = world.get(Math.floor(camera.position.x), Math.floor(camera.position.y), Math.floor(camera.position.z)) === WATER, fog = scene.fog as THREE.Fog
  fog.near = under ? 1 : 60; fog.far = under ? 20 : 150
  if (under) sky.setRGB(0.08, 0.25, 0.55).multiplyScalar(uDay.value)
  sun.visible = moon.visible = !under // nothing in the sky shows through the murk
  halos[0].visible = halos[1].visible = !under && !wet // no halo through rain clouds
  for (const c of clouds) c.m.visible = !under
  if (under) stars.visible = false
  for (const c of clouds) if ((c.m.position.x += dt * 1.2) > SX + 75) c.m.position.x -= SX + 150
  stars.visible = !wet && (hour >= 19 || hour < 5)
  updateFireflies(now / 1000, !wet && !under && (hour >= 19.5 || hour < 4.5))
  stars.position.copy(camera.position); dome.position.copy(camera.position)
  if (wet) {
    for (let i = 1; i < rainPos.length; i += 3) if ((rainPos[i] -= (snow ? 3 : 22) * dt) < -12) rainPos[i] += 24 // snow drifts, rain falls
    rain.geometry.attributes.position.needsUpdate = true
    rain.position.copy(camera.position)
  }
  const info = `<div>${html(WEEK[Math.floor((160 + clock) / 480) % 7])} ${html(per)}${ph(oclock(hour))} · ${html(weather)}</div>`
    + html(dirTo(-Math.sin(p.yaw), -Math.cos(p.yaw))) + ' · ' + html(action)
    + `<div class="s">${html(V.money)} ${ph(price(state.money))}</div>`
  if (info !== lastInfo) $('info').innerHTML = lastInfo = info
  if (tick % 5 === 0 && !touch && mapEl.hidden && locked() && !document.body.classList.contains('photo')) drawMini() // often enough that the arrow turns smoothly
  if (++tick % 20 === 0) {
    questPanel(); if (!mapEl.hidden) drawMap()
    // chunks beyond the fog are not worth drawing (the far islands would otherwise cost frames all the time)
    meshes.forEach((m, k) => { m.visible = !m.userData.empty && Math.hypot(((k >> 1) % NC + 0.5) * CH - camera.position.x, (Math.floor((k >> 1) / NC) + 0.5) * CH - camera.position.z) < 175 })
  }
  if (tick % 60 === 0) { growCrops(); if (locked()) announcePlace() }
  if (tick % 90 === 45 && locked()) checkAch()
  // a quiet moment: now and then an animal close by makes its noise (喵！); never over someone talking
  if (tick % 120 === 0 && locked() && now - saidAt > 15000 && Math.random() < 0.4) {
    const m = mobs.find(m => SOUNDS.has(m.w) && (m.g.userData.sleep ?? 0) < 0.5 && !(m.fly && (hour >= 21 || hour < 5)) && Math.hypot(m.x - p.x, m.z - p.z) < 7)
    if (m) { const sound = SOUNDS.get(m.w)!; see(sound, 0.2); speak(sound.hz + '！', false, '', false); m.hop = now; toast(said({ parts: [...name(m), '：', sound, '！'], en: `${m.w.en}: ${sound.en}!` })) }
  }

  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
let last = performance.now()
Object.assign(window, { cubedao: { p, state, world, mobs, sunDir, setBlock, quest, NPCS, unvoiced, pieced, setClock: (v: number) => { clock = v } } }) // console/debug handle
hud()
requestAnimationFrame(frame)
