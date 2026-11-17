import * as THREE from 'three'
import { type Word, type Part, type Line, ACH, done, countNum, forget, bedtime, untilHour, ready, searchKey, searchHit, act, unact, did, complete, handOver, hourOf, dayOf, period, BRICK, PATH, PLANK, WOOD, AIR, GRASS, WATER, BAMBOO, STONE, LEAVES, PICKAXE, APPLE, BLACKBOARD, SEEDS, SPROUT, WHEAT, DIRT, DOOR, DOOR_OPEN, BED, CHEST, SNOW, SAND, SAPLING, LETTER, LANTERN, STOVE, COAL, IRON, GOLD, FISH, ROD, BOAT, BLOCKS, V, ALL_WORDS, NPCS, RECIPES, FOOD, NO_SIZE, DROPS, PLACES, SOUNDS, VERBS, EDIBLE, state, persist, see, level, html, cn, count, dirTo, quest, canCraft, craft, numWord, price, RANKS, rank, known, reviewWord, checkPinyin, STORIES, BOOK, newNotes, zhVoice, repeat, clQuiz, toneQuiz, numQuiz, type Quiz, WEEK, oclock, SHOP, trade, question, chat, isWord, plain, speak, hasClips, unvoiced, pieced, unlockVoice, saidAt, prefetch } from './words.ts'
import * as world from './world.ts'
import { t, LANGS } from './i18n.ts'
import { version } from '../package.json'
import { renderer, scene, camera, atlas, tex, uDay, nightly, mats, box } from './render.ts'
import { rain, rainPos, SKY, GREY, DUSK, sky, clouds, stars, updateFireflies, sunDir, sun, moon, halos, dome } from './sky.ts'
import { blip, step, rainSound, startMusic, wakeAudio } from './audio.ts'
import { part, person, pig, cow, sheep, chicken, cat, dog, panda, penguin, camel, bird, fishy, butterfly } from './creatures.ts'

const $ = (id: string) => document.getElementById(id)!
document.querySelectorAll<HTMLElement>('[data-t]').forEach(el => { el.innerHTML = t(el.innerHTML.trim()) }) // the page's own English (index.html)
const { SX, SZ, CH } = world

// --- world ---
world.generate()
if (state.world !== world.WORLD_V) { // the island changed shape since this save: keep progress and inventory, drop what was built
  state.edits = {}; state.crops = {}; state.placed = {}; state.pos = state.home = undefined; state.world = world.WORLD_V
}
world.load(state.edits)

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

let stepAt = 0
startMusic(() => locked())
const landCols: number[] = [] // columns changed since the minimap last looked: it repaints just those pixels
function setBlock(x: number, y: number, z: number, b: number) {
  if (landCols.length < 4096) landCols.push(x + z * SX); else landImg = undefined // too many changes (or touch, where nothing reads them): repaint it all next time
  for (const [cx, cz] of world.edit(x, y, z, b)) remesh(cx, cz)
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
    const pick = [V.small, undefined, V.big][n % 3], size = NO_SIZE.get(w) === pick ? undefined : pick, k = size === V.small ? 0.65 : size === V.big ? 1.35 : 1, g = make()
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
// along the coast: water three deep, but not the open sea
spawn(24, BLOCKS[FISH].w, fishy, 0.35, 0.4, (x, z) => world.get(x, world.SEA - 3, z) === WATER && world.get(x, world.SEA - 7, z) !== WATER)
for (const m of mobs) if (m.w === BLOCKS[FISH].w) { m.swim = true; m.y = world.SEA - 1.7 }
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
  speak(plain(parts)); toast(feel ? said({ parts, en: t('{0}. It is very {1} here!', PLACES[k].en, feel.en) }) : html(PLACES[k]))
}

function updateMobs(dt: number) {
  const night = bedtime(hourOf(clock)), now = performance.now()
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
    const s = world.floorNear(bx, m.y, bz) // a step up or down at most, and never into water; under roofs and trees only
    // for your pets (following you home): wild animals keep to open ground and stay out of the villagers' huts
    if (nx > 2 && nz > 2 && nx < SX - 2 && nz < SZ - 2 && s >= 0 && (m.pet || s === world.surface(bx, bz))) { m.x = nx; m.z = nz; m.y = s }
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
let wiping = false, looked = !document.hidden // a tab loaded (or reloaded by another tab's save) in the background and never looked at
// such a tab has nothing of its own to save: closing it must not write its older position back over the tab you play in
const savePos = () => { if (wiping || !looked) return; state.pos = [p.x, p.y, p.z, p.yaw, p.pitch]; state.clock = clock; persist() }
addEventListener('pagehide', savePos)
// another tab saved: what this one holds is older, and saving it on close would undo that play; load the newer save instead
addEventListener('storage', e => { if (e.key === 'cubedao') { wiping = true; location.reload() } })
document.addEventListener('visibilitychange', () => { if (document.hidden) savePos(); else looked = true }) // mobile tabs die without pagehide
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
/** put an animal down next to you where it can walk on: a dry floor level with yours (indoors too); none at all
 * (out at sea): it stays where it is and walks over to you, rather than stand in you or on the water */
function besideYou(m: Mob) {
  const fy = Math.floor(p.y)
  // last of all your own cell (a pit with no room beside you: at your feet); out at sea not even that, so no pet on the water
  for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 0]]) {
    const x = Math.floor(p.x) + dx, z = Math.floor(p.z) + dz, f = world.floorNear(x, fy, z)
    if (f >= 0) { m.x = x + 0.5; m.z = z + 0.5; m.y = f; break }
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
let action = V.stand, moving = false
// saved on the boat (it holds you just above the sea): back in the boat after a reload, not swimming in open water
let boating = !!state.pos && onSea(p.x, p.z) && Math.abs(p.y - (world.SEA + 0.05)) < 0.01
const boat = new THREE.Group()
boat.add(box(1.2, 0.3, 2.4, 0x8a5a36, 0, 0, 0), box(0.12, 0.3, 2.4, 0x6b4a2a, -0.6, 0.25, 0), box(0.12, 0.3, 2.4, 0x6b4a2a, 0.6, 0.25, 0),
  box(1.32, 0.3, 0.12, 0x6b4a2a, 0, 0.25, -1.2), box(1.32, 0.3, 0.12, 0x6b4a2a, 0, 0.25, 1.2))
scene.add(boat)

// --- HUD ---
const icon = (id: number) => { const t = BLOCKS[id].t[1]; return `<i class="ic" style="background-position:${(t % 8) * 100 / 7}% ${(t >> 3) * 100 / 7}%"></i>` }
const ph = (parts: Part[]) => parts.map(x => isWord(x) ? html(x) : x).join('')
const num = (n: number) => cn(n)

const said = (q: { parts: Part[]; en: string }) =>
  `<div class="s l${Math.min(...q.parts.filter(isWord).map(level)) ? 1 : 0}">${ph(q.parts)}<div class="en">${q.en}</div></div>`

// what the held item does, for the ones that are not simply placed
const USE: Record<number, string> = {
  [BOAT]: t('right-click water: get in · Space: get out'), [ROD]: t('right-click water: fish'), [SEEDS]: t('right-click grass or soil: plant'),
  [SAPLING]: t('place it: a tree in a minute and a half'), [BOOK]: t('right-click: read'), [BED]: t('place it, then right-click: sleep / set home'),
  [DOOR]: t('place it, then right-click: open / close'), [LETTER]: t('take it to the villager it is for'), [PICKAXE]: t('carry it: stone can be dug'),
  [LANTERN]: t('place it: light at night'), [STOVE]: t('place it: light at night'),
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
].map(h => t(h))
let sel = 0, emptied = false, first = 0, owned: number[] = [], shown: number[] = [], lastQuest = ''
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
    const late = bedtime(hourOf(clock)) // villagers turn in
    const b = said(m.line = late ? { parts: [V.goodnight, '！'], en: t('Good night!') } : m.npc === 'merchant' ? SHOP_SAY : m.npc === 'friend' ? CHAT_SAY : quest(m.npc))
    if (m.bubble!.innerHTML !== b) m.bubble!.innerHTML = b
    const asks = m.npc !== 'merchant' && m.npc !== 'friend' && !late // can you hand it over now? a gold bubble says so
    m.bubble!.classList.toggle('ready', asks && ready(m.npc))
  }
}
let had: Record<number, number> | null = null, heldSaid = 0, sayHeld = 0, picked = false // picked: the player chose the item (wheel, 1-9, a tap, the gamepad)
function hud() {
  owned = Object.keys(state.inv).map(Number).filter(id => state.inv[id] > 0)
  if (owned.includes(sel)) emptied = false // holding something again
  if (sel && !owned.includes(sel)) { sel = 0; emptied = true } // the stack ran out: an empty hand, not a silent switch to whatever comes first
  if (!sel && !emptied) sel = owned[0] ?? 0 // a new game, or your first find: hold it
  if (sel !== heldSaid && picked) { // you picked something else: say its name once the wheel or keys come to rest on it
    clearTimeout(sayHeld)
    sayHeld = setTimeout(() => { if (sel && sel === heldSaid && locked()) { see(BLOCKS[sel].w, 0.2); speak(BLOCKS[sel].w.hz) } }, 400)
  }
  heldSaid = sel; picked = false
  setHeld(sel)
  // nine slots at most; the window only scrolls when the held item leaves it, so 1-9 keep meaning the same slots. B (the bag) shows everything
  const at = owned.indexOf(sel)
  if (at >= 0) { first = Math.max(0, Math.min(first, at, owned.length - 9)); if (at >= first + 9) first = at - 8 } // empty-handed: the hotbar stays put
  first = Math.max(0, Math.min(first, owned.length - 9))
  shown = owned.slice(first, first + 9)
  $('hotbar').innerHTML = (shown[0] !== owned[0] ? '<span>‹</span>' : '') + shown.map(id =>
    `<div class="slot${id === sel ? ' sel' : ''}${had && state.inv[id] > (had[id] ?? 0) ? ' up' : ''}" data-id="${id}">${icon(id)}${html(BLOCKS[id].w)}<b>${num(state.inv[id])}</b></div>`).join('')
    + (shown.at(-1) !== owned.at(-1) ? '<span>›</span>' : '')
  had = { ...state.inv } // a slot pops when its count goes up
  const use = sel ? USE[sel] ?? (EDIBLE.has(sel) ? t('right-click: eat or drink · on an animal: feed it') : '') : ''
  $('use').textContent = touch ? use.replace(t('right-click'), '放') : use // on touch the place button does it
  questPanel()
  tips.push(...newNotes()) // grammar met for the first time
  if (rank() > state.rank) { // met enough words for a new title; announce it once the current toast has had its moment
    const title = RANKS[state.rank = rank()][1], parts: Part[] = [V.you, V.am, title, V.le, '！']
    see(title)
    const announce = () => { // not over a panel or the start screen: wait until the player is back in the world
      if (panel || !locked()) return void setTimeout(announce, 1500)
      speak(plain(parts)); blip(523, 659, 784, 1047); toast(said({ parts, en: t('You are now a {0}!', title.en) }), true)
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
let dictQuery = ''
$('panel').addEventListener('input', e => {
  const el = e.target as HTMLInputElement
  if (el.id !== 'dsearch') return
  dictQuery = el.value
  $('panel').querySelectorAll<HTMLElement>('[data-s]').forEach(b => { b.hidden = !searchHit(b.dataset.s!, dictQuery) })
})
const dictPanel: Panel = {
  draw: () => {
    const known = ALL_WORDS.filter(w => state.seen[w.hz] >= 1).sort((a, b) => state.seen[a.hz] - state.seen[b.hz])
    // one button per word, the ones you know least first: click to hear it. ● ● ● shows how well you know it
    const by = [0, 1, 2].map(l => known.filter(w => level(w) === l).length) // new, familiar, mastered
    return `<h2>词典 cídiǎn · ${known.length} / ${ALL_WORDS.length} · ${html(RANKS[rank()][1])}</h2><p>${t('● {0} new · ●● {1} familiar (English gone) · ●●● {2} mastered (pinyin gone)', by[0], by[1], by[2])}</p>` + FOOT
      + (state.notes.length ? `<h3>${html(V.grammar)}</h3><ul class="notes">${state.notes.map(n => `<li>${t(n)}</li>`).join('')}</ul>` : '')
      + (known.length > 8 ? `<p><input id="dsearch" value="${dictQuery.replace(/"/g, '&quot;')}" placeholder="搜索 ${t('search: 字, pinyin, English')}" autocomplete="off"></p>` : '') + '<div class="grid">'
      + known.map(w => `<button data-a="${w.hz}" data-s="${searchKey(w).replace(/"/g, '&quot;')}" class="full"${searchHit(searchKey(w), dictQuery) ? '' : ' hidden'}>🔊 ${html(w)} <small>${'●'.repeat(level(w) + 1)}</small></button>`).join('') + '</div>'
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
  // reading a new word's label for two seconds counts as meeting it: the 新 mark goes, with a soft ding and the word said once
  if (word !== labelWord || !locked()) { labelWord = word; labelSince = performance.now() } // paused time does not count
  else if (word && locked() && (state.seen[word.hz] ?? 0) < 1 && performance.now() - labelSince > 2000) { state.seen[word.hz] = 1; blip(784, 1047); if (performance.now() - saidAt > 4000) speak(word.hz); hud() } // not over a villager still talking
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


/** say a line out loud and show it; every word in it counts as met */
function narrate(parts: Part[], en: string, win = false) {
  parts.filter(isWord).forEach(w => see(w))
  speak(plain(parts)); toast(said({ parts, en }), win)
}

/** what a villager says: shown as a toast, unless the listening option is on (then it is only spoken) */
const heard = (h: string) => { if (!state.opts.ear) toast(h) }

function finish(k: string, cheer: Word, voice = k) { // voice: who says it (a letter's addressee thanks you for the sender's errand)
  const q = quest(k), reward = BLOCKS[q.reward].w
  q.parts.filter(isWord).forEach(w => see(w, 2))
  see(cheer, 2); see(reward)
  if (complete(k)) { // every villager's whole list, once
    setTimeout(() => {
      const parts: Part[] = [V.congrats, '！', V.you, V.am, V.we, V.de, V.friend, V.le, '！']
      narrate(parts, t('Congratulations! You are our friend now!'), true)
      for (let i = 0; i < 12; i++) setTimeout(() => { // fireworks in cloth colours
        burst(p.x + Math.random() * 16 - 8, p.y + 6 + Math.random() * 5, p.z + Math.random() * 16 - 8, [42, 43, 44][i % 3]); blip(523 + i * 60)
      }, i * 350)
    }, 3000)
  }
  speak(cheer.hz + '！', false, voice); blip(523, 659, 784)
  toast(said({ parts: [cheer, '！ +', ...count(12, q.reward), ' +', ...price(3)], en: t('{0}! +12 × {1}, +3 money', cheer.en, reward.en) }), true)
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
      speak(plain(parts)); toast(said({ parts, en: t('The {0} is asleep.', what) }))
    } else { speak(plain(name(m)) + (sound ? '。' + sound.hz + '！' : '')); toast(said({ parts: sound ? [...name(m), '：', sound, '！'] : name(m), en: sound ? `${what}: ${sound.en}!` : what })) }
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
        narrate(parts, t('Wrong. This is a {0}.', what))
      }
    }
    return hud()
  }
  if (m.npc === 'friend') { see(V.friend); return openPanel(chatPanel()) }
  if (m.npc === 'merchant') { see(V.merchant); speak(plain(SHOP_SAY.parts), false, 'merchant'); return openPanel(shopPanel) }
  const k = m.npc, npc = NPCS[k], q = quest(k)
  const first = !state.seen[npc.w.hz], tracked = state.track === k
  // a letter someone else gave you for this villager: hand it over, and the sender's errand is done
  const from = handOver(k)
  if (from) return finish(from, V.thanks, k)
  see(npc.w)
  state.track = k
  if (q.act) { // something to do: done yet?
    if (ready(k)) return finish(k, V.thanks)
    speak(plain(q.parts), false, k); heard(said(q))
    return hud()
  }
  if (q.deliver) { // take the letter (once) and hear where it goes
    state.seen['把字句'] ??= 1 // not a word: the trigger for the note on 把 as object marker (把 the measure word is met much earlier)
    if (!state.letters[k]) { state.letters[k] = 1; give(LETTER) }
    speak(plain(q.parts), false, k); heard(said(q))
    return hud()
  }
  if (!ready(k)) {
    const intro: Part[] = first ? [V.hello, '！', V.me, V.am, npc.w, '。'] : []
    speak(plain([...intro, ...q.parts]), false, k)
    if (first) heard(said({ parts: intro, en: t('Hello! I am the {0}.', npc.w.en) }))
    else if (tracked && !q.find) { // asked again without enough: say how many are still missing
      const missing = q.n - (state.inv[q.item] ?? 0), parts: Part[] = [V.notEnough, '。', V.still, V.need, ...count(missing, q.item), '。']
      see(V.notEnough); see(V.still)
      speak(plain(parts), false, k); heard(said({ parts, en: t('Not enough. {0} × {1} more.', missing, BLOCKS[q.item].w.en) }))
    }
    else heard(said(q))
    return hud()
  }
  state.inv[q.item] -= q.n
  finish(k, V.thanks)
}

const PAST: Record<string, string> = { 拔: 'I pulled up 1 × {0}.', 挖: 'I dug 1 × {0}.', 砍: 'I chopped 1 × {0}.', 摘: 'I picked 1 × {0}.', 割: 'I cut 1 × {0}.', 拿: 'I took 1 × {0}.' }
function dig() {
  swingAt = performance.now()
  if (!target) return
  if (target.mob) return talk(target.mob)
  let { x, y, z } = target
  if (y < 0) return // bedrock under the world
  const first = world.get(x, y, z)
  if (first === BLACKBOARD) return openPanel(boardPanel)
  if (first === CHEST) { digAt = Infinity; return use(x, y, z, first) } // once per press: held, the next dig would say the chest you just emptied is empty
  if ([STONE, COAL, IRON, GOLD].includes(first) && !state.inv[PICKAXE]) { // stone needs a pickaxe: craft one (E)
    see(V.need); speak(V.need.hz + plain(count(1, PICKAXE)))
    return toast(said({ parts: [V.need, ...count(1, PICKAXE), '。'], en: t('That needs a pickaxe.') }))
  }
  const natural = !state.placed[world.idx(x, y, z)] // bonus drops only from blocks you didn't put there yourself
  // plants standing on the block come along
  do {
    const id = world.get(x, y, z)
    setBlock(x, y, z, wetBeside(x, y, z) ? WATER : AIR) // dug next to water: it runs in, no dry hole in the sea
    delete state.placed[world.idx(x, y, z)]
    if (id === BED && state.home?.join() === [x, y, z].join()) state.home = undefined // your bed is gone: so is 家 on the map
    burst(x, y, z, id)
    give(id === SPROUT ? SEEDS : id === DOOR_OPEN ? DOOR : id) // a sprout is just its seed again
    if (id === WHEAT) give(SEEDS, 1 + (Math.random() * 2 | 0))
    blip(150)
  } while (BLOCKS[world.get(x, ++y, z)].plant)
  // say what you did, with the verb that fits: 我砍了一块木头 / 我摘了一朵红花 / 我挖了一块土
  const verb = VERBS.get(first) ?? V.dig, did: Part[] = [V.me, verb, V.le, ...count(1, first === DOOR_OPEN ? DOOR : first), '。']
  see(verb, 0.3); see(V.le, 0.1)
  toast(said({ parts: did, en: t(PAST[verb.hz], BLOCKS[first].w.en) })); speak(plain(did))
  if (first === STONE && natural) act('mine') // not a stone you put there yourself
  if (first === LANTERN && !natural) unact('lamp') // taking your lantern back
  if (natural && first === LEAVES && Math.random() < 0.25) { give(APPLE); speak(BLOCKS[APPLE].w.hz) }
  if (natural && first === GRASS && Math.random() < 0.2) give(SEEDS)
  if (natural && first === LEAVES && Math.random() < 0.1) give(SAPLING)
  hud()
}

const wetBeside = (x: number, y: number, z: number) => [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].some(([dx, dy, dz]) => world.get(x + dx, y + dy, z + dz) === WATER)
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
    toast(said({ parts: mine, en: m.size ? t('This is my {0} {1}!', m.size.en, m.w.en) : t('This is my {0}!', m.w.en) }), true)
    return hud()
  }
  speak(plain(parts))
  toast(said({ parts, en: likes ? t('The {0} eats {1}.', m.w.en, food.en) + ' ❤' : t(verb === V.drink ? "The {0} doesn't drink {1}." : "The {0} doesn't eat {1}.", m.w.en, food.en) }))
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
  blip(300); narrate(parts, t('Plant a seed.')); hud()
}
function growCrops() {
  for (const [i, due] of Object.entries(state.crops)) {
    if (Date.now() < due) continue
    delete state.crops[+i]
    const x = +i % SX, z = Math.floor(+i / SX) % SZ, y = Math.floor(+i / SX / SZ), near = Math.hypot(x - p.x, z - p.z) < 14
    if (world.data[+i] === SAPLING && Math.floor(p.x) === x && Math.floor(p.z) === z && p.y < y + 6) { state.crops[+i] = Date.now() + 5000; continue } // not while you stand in it
    if (world.data[+i] === SAPLING) { // grow a real tree and record every block of it, so it survives a reload
      for (const [cx, cz] of world.growTree(x, y, z, 4 + (Math.random() * 2 | 0))) remesh(cx, cz)
      delete state.placed[+i]
      if (near) { see(V.tree); see(V.grow); toast(said({ parts: [V.tree, V.grow, V.le, '！'], en: t('The tree has grown!') })) }
      persist()
      continue
    }
    if (world.data[+i] !== SPROUT) continue // dug up meanwhile
    setBlock(x, y, z, WHEAT)
    if (near) { see(V.ripe); toast(said({ parts: [BLOCKS[WHEAT].w, V.ripe, V.le, '！'], en: t('The wheat is ripe!') })) }
    persist()
  }
}

// right-click things that do something: doors open and close, beds skip the night
function use(x: number, y: number, z: number, id: number) {
  let parts: Part[], en: string
  if (id === CHEST) {
    const chest = BLOCKS[CHEST].w
    if (state.chest) { parts = [chest, V.am, V.empty, V.de, '。']; en = t('The chest is empty.') }
    else {
      state.chest = true; state.money += 50; blip(523, 659, 784, 1047)
      parts = [V.openUp, chest, '！ +', ...price(50)]; en = t('Open the treasure chest! +50 money')
    }
  } else if (id === BED) {
    const hour = hourOf(clock), night = hour >= 18 || hour < 5
    if (night) { clock += untilHour(clock, 6); lastPeriod = period(6) } // sleep until six; 睡觉 gets said, not the morning greeting
    state.home = [x, y, z] // your bed is your home: it shows on the map
    parts = night ? [V.sleep, '。'] : [V.this, V.am, V.my, V.home, '。']
    en = night ? t('Sleep.') : t('This is my home.')
  } else {
    const opening = id === DOOR
    setBlock(x, y, z, opening ? DOOR_OPEN : DOOR)
    if (!opening && hits()) return setBlock(x, y, z, DOOR_OPEN) // don't shut it on yourself, nor say that it shut
    parts = [opening ? V.open : V.close, BLOCKS[DOOR].w, '。']
    en = opening ? t('Open the door.') : t('Close the door.')
    blip(opening ? 330 : 220)
  }
  narrate(parts, en); hud()
  if (parts[0] === V.sleep) { canvas.animate?.([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], 1800); openPanel(dayPanel()); state.dayFrom = snap(); persist() } // the day is over: how it went, then a new one
}

// food: say it, enjoy it, and run a little faster for half a minute
let boost = 0
function eat() {
  const verb = EDIBLE.get(sel)!, food = BLOCKS[sel].w, parts: Part[] = [V.me, verb, V.le, ...count(1, sel), '。', verb === V.drink ? V.tastyDrink : V.tasty, '！']
  state.inv[sel]--
  boost = performance.now() + 30000
  act(verb === V.drink ? 'drink' : 'eat')
  blip(392, 494); narrate(parts, t(verb === V.drink ? 'I drank 1 × {0}. Tasty!' : 'I ate 1 × {0}. Tasty!', food.en)); hud()
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
  blip(330, 440); narrate(parts, t('I ride the {0}.', m.w.en)); hud()
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
  toast(said({ parts: did, en: t(sel === SAPLING ? 'I planted 1 × {0}.' : 'I put down 1 × {0}.', word.en) })); speak(plain(did)); hud()
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
const FOOT = `<p><button data-a="close" class="small">✕</button> &nbsp; ${t('hold T — translate')}</p>`
// sleeping at night ends the day: a card with what it brought (words met, requests finished, money earned)
const snap = () => ({ words: known(), done: done(), money: state.money, met: ALL_WORDS.filter(w => state.seen[w.hz] >= 1).map(w => w.hz) })
state.dayFrom ??= snap() // saved, so a reload mid-day does not reset the count
function dayPanel(from = state.dayFrom!): Panel { // drawn once, against the day just ended: clicking a word must not recount it against the new day
  const met = from.met, fresh = met ? ALL_WORDS.filter(w => state.seen[w.hz] >= 1 && !met.includes(w.hz)).slice(0, 24) : [] // a save from before met was kept: just the count
  const words = Math.max(0, known() - from.words), reqs = done() - from.done, money = state.money - from.money
  const card = `<h2>${html(V.goodnight)}</h2><div class="ask">🌙 ${ph([V.today, V.me, V.learn, V.le, countNum(words), V.ge, V.zi, '。'])}</div>`
    + `<p class="sum">✔ ${num(reqs)} <small>${t('requests finished')}</small>${money > 0 ? ` · +${ph(price(money))}` : ''}</p>`
    + (fresh.length ? `<div class="grid">${fresh.map(w => `<button data-a="${w.hz}">🔊 ${html(w)}</button>`).join('')}</div>` : '') // today's new words: click to hear them again
    + `<p><button data-a="close" class="small">${html(V.goodnight)} ✕</button></p>`
  return { draw: () => card, click: a => speak(a) }
}
/** an answer button once one was picked: the right one green, the picked wrong one red, all of them done */
const mark = (i: number, picked: number, answer: number) => picked < 0 ? '' : i === answer ? ' class="ok" disabled' : i === picked ? ' class="bad" disabled' : ' disabled'
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

const SHOP_SAY = { parts: [V.you, V.need, V.buy, V.what, '？'] as Part[], en: t('What do you want to buy?') }
const shopPanel: Panel = {
  draw: () => `<h2>${html(V.merchant)}</h2>${said(SHOP_SAY)}<p>${html(V.money)}：${ph(price(state.money))}</p>`
    + `<h3>${html(V.buy)}</h3>` + grid(SHOP.buy.map(([id, c], i) => `<button data-a="buy${i}"${state.money >= c ? '' : ' disabled'}>${icon(id)}${ph(count(1, id))} · ${ph(price(c))}</button>`))
    + `<h3>${html(V.sell)}</h3>` + grid(SHOP.sell.map(([id, c], i) => `<button data-a="sell${i}"${state.inv[id] ? '' : ' disabled'}>${icon(id)}${ph(count(1, id))} · ${ph(price(c))}</button>`)) + FOOT,
  click: a => {
    const kind = a.startsWith('buy') ? 'buy' : 'sell', i = +a.slice(kind.length)
    if (!trade(kind, i)) return
    const [id, c] = SHOP[kind][i], parts: Part[] = [V[kind], ...count(1, id), '，', ...price(c), '。']
    blip(kind === 'buy' ? 392 : 523, 659); narrate(parts, t(kind === 'buy' ? 'Bought 1 × {0} for {1}.' : 'Sold 1 × {0} for {1}.', BLOCKS[id].w.en, c))
    hud()
  },
}

const CHAT_SAY = { parts: [V.hello, '！', V.we, V.chat, V.lets, '！'] as Part[], en: t("Hello! Let's chat!") }
// the friend asks about the world as it is right now; pick the reply that is true
const chatCtx = () => ({
  period: lastPeriod, wet: lastWeather === V.rain, hour: hourOf(clock), day: dayOf(clock),
  dirTo: (k: string) => { const s = world.SPOTS[k], dx = s.x - p.x, dz = s.z - p.z; return Math.hypot(dx, dz) < 6 ? undefined : dirTo(dx, dz) },
})
function chatPanel(): Panel {
  const ctx = chatCtx
  let c = chat(ctx()), picked = -1
  const ask = () => speak(plain(c.ask.parts), false, 'friend')
  ask()
  return {
    draw: () => {
      return `<h2>${html(V.friend)}</h2><div class="ask">${c.icon ? icon(c.icon) : ''}${said(c.ask)}</div>`
        + `<div class="col">${c.options.map((o, i) => `<button data-a="${i}"${mark(i, picked, c.answer)}>${ph(o.parts)}${picked < 0 || state.opts.en === 1 ? '' : `<small> ${o.en}</small>`}</button>`).join('')}</div>`
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
    `<button data-a="${id}"${id === sel ? ' class="ok"' : ''}>${icon(id)}${ph([V.me, V.have, ...count(state.inv[id], id), '。'])}</button>`))
    : `<p class="full">${ph([V.me, V.notHave, V.things, '。'])}</p>`) + FOOT,
  click: a => { sel = +a; hud(); closePanel() },
}

// Q: what everyone you have met is asking for right now; click one to follow it in the corner
const tasksPanel: Panel = {
  draw: () => {
    const met = Object.keys(NPCS).filter(k => state.seen[NPCS[k].w.hz] || k === state.track) // the one followed in the corner, even before you meet them
    return `<h2>${html(V.tasks)}</h2><div class="col tasks">` + (met.length ? met.map(k => {
      const s = world.SPOTS[k], dx = s.x - p.x, dz = s.z - p.z, q = quest(k)
      return `<button data-a="${k}"${k === state.track ? ' class="ok"' : ''}>${ready(k) ? '<b class="tick">✔</b> ' : ''}${html(NPCS[k].w)} <small>${Math.hypot(dx, dz) < 4 ? '' : `${dirTo(dx, dz).hz} ${num(Math.round(Math.hypot(dx, dz)))}米`}</small>${said(q)}</button>` // as in the corner: English only while the words are new, blurred in listening-only mode
    }).join('') : `<p>${ph([V.me, V.notHave, V.tasks, '。'])}</p>`) + '</div>' + FOOT
  },
  click: a => { if (NPCS[a]) { state.track = a; hud(); closePanel() } },
}

// the blackboard's menu of activities
const boardPanel: Panel = {
  draw: () => `<h2>${html(BLOCKS[BLACKBOARD].w)}</h2><div class="col"><button data-a="exam">${html(V.exam)} <small>${t('words: listen and read')}</small></button>`
    + `<button data-a="compose">${html(V.compose)} <small>${t('put the words in order')}</small></button>`
    + `<button data-a="pinyin">${html(V.write)}${html(V.pinyin)} <small>${t('type how a word is said')}</small></button>`
    + `<button data-a="cl">${html(V.measure)} <small>${t('三 ＿ 木头: pick the measure word')}</small></button>`
    + `<button data-a="tone">${html(V.tone)} <small>${t('hear a word, pick its tone')}</small></button>`
    + `<button data-a="num">${html(V.number)} <small>${t('hear a number, pick it (十四 or 四十?)')}</small></button>`
    + `<button data-a="book">${html(V.look)}${html(BLOCKS[BOOK].w)} <small>${t('read a short story')}</small></button>`
    + `<button data-a="say"${Rec ? '' : ' disabled'}>🎤 ${html(V.say)} <small>${Rec ? t('say a word aloud') : t('needs a browser with speech recognition (Chrome, Edge, Safari)')}</small></button></div>` + FOOT,
  click: a => { panel = a === 'num' ? quizPanel(V.number, numQuiz, true) : a === 'cl' ? quizPanel(V.measure, clQuiz, false) : a === 'tone' ? quizPanel(V.tone, toneQuiz, true) : a === 'exam' ? examPanel() : a === 'compose' ? composePanel() : a === 'book' ? bookPanel() : a === 'say' ? sayPanel() : pinyinPanel() },
}

// the blackboard's drills: five rounds, the score, a result card, and 两块钱 for each right answer, paid as it is given
// (closing a drill early keeps what it earned).
// round(right) deals one round: its body is drawn under the heading, and it calls right() when answered correctly
interface Round { body: () => string; click: (action: string) => void }
function drill(title: string, round: (right: () => void) => Round, end?: () => void): Panel {
  let n = 1, score = 0
  const right = () => { score++; state.money += 2; hud() }
  let r = round(right)
  return {
    draw: () => n > 5
      ? `<h2>${title}</h2><p class="big">${html(V.right)} ${cn(score)} / ${cn(5)}</p><p>+${ph(price(score * 2))}</p>` + FOOT
      : `<h2>${title} ${cn(n)} / ${cn(5)}</h2>` + r.body() + FOOT,
    click: a => {
      if (a !== 'next') return r.click(a)
      if (++n <= 5) { r = round(right); return }
      end?.(); blip(523, 659, 784); hud()
    },
  }
}

// say a word into the microphone; the browser's recogniser writes down what it heard and we look for the word in it
// ponytail: compares characters, so a perfect homophone can be marked wrong; only words of two or more characters are asked
const Rec = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
function sayPanel(): Panel {
  const next = () => { let w = reviewWord(); for (let i = 0; i < 50 && [...w.hz].length < 2; i++) w = reviewWord(); return w }
  return drill(html(V.say), right => {
    const word = next()
    let heard: string | null = null, listening = false
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
        if (heard.includes(word.hz)) { right(); see(word); blip(659, 880) } else blip(140)
        redraw()
      }
      try { r.start(); listening = true } catch { heard = '' }
    }
    return {
      body: () => {
        const ok = heard !== null && heard.includes(word.hz)
        return `<p class="big full">${html(word)}</p>`
          + (heard === null ? `<button data-a="mic"${listening ? ' disabled' : ''}>🎤 ${listening ? html(V.listen) + '…' : html(V.say)}</button> <button data-a="hear">🔊 ${html(V.listen)}</button>`
            : `<p class="full">${html(ok ? V.right : V.wrong)} — ${html(V.heard)}：${heard || '…'}</p><button data-a="next">${html(V.next)} →</button>`)
      },
      click: a => { if (a === 'hear') speak(word.hz); else if (a === 'mic') listen() },
    }
  })
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
  return drill(html(title), right => {
    const q = make()
    let picked = -1
    const say = () => speak(plain(q.reveal))
    if (listen) say()
    return {
      body: () => `<p class="big">${q.prompt.map(x => isWord(x) ? x.hz : x).join('')}</p><p>${q.en}</p>`
        + (listen ? `<button data-a="say">🔊 ${html(V.listen)}</button>` : '')
        + grid(q.options.map((o, i) => `<button data-a="${i}"${mark(i, picked, q.answer)}>${o}</button>`))
        + (picked < 0 ? '' : `<p class="full">${html(picked === q.answer ? V.right : V.wrong)} — ${ph(q.reveal)}</p><button data-a="next">${html(V.next)} →</button>`),
      click: a => {
        if (a === 'say') return say()
        if (picked >= 0 || isNaN(+a)) return
        picked = +a
        const ok = picked === q.answer
        if (ok) { right(); see(q.word); blip(659, 880) } else { forget(q.word, 1); blip(140) }
        see(ok ? V.right : V.wrong); see(title, 0.2); say(); hud()
      },
    }
  })
}

// type the pinyin of a word you have met; Enter checks, Enter again moves on
function pinyinPanel(): Panel {
  return drill(`${html(V.write)}${html(V.pinyin)}`, right => {
    const word = reviewWord()
    let result = ''
    return {
      body: () => {
        const verdict = result === 'right' ? html(V.right) : result === 'tones' ? html(V.tone) + html(V.wrong) : html(V.wrong)
        return `<p class="big">${word.hz}</p><p>${word.en}</p>`
          + (result ? `<p class="full">${verdict} — ${html(word)}</p><button data-a="next">${html(V.next)} →</button>`
            : `<input id="py" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ni3 hao3"><p>${t('tone numbers 1–4 after each syllable, then Enter')}</p>`)
      },
      click: a => {
        if (!a.startsWith('enter:') || !a.slice(6).trim()) return
        result = checkPinyin(a.slice(6), word)
        if (result === 'right') { right(); see(word); blip(659, 880) }
        else { forget(word, result === 'tones' ? 1 : 2); blip(140) }
        see(V.pinyin, 0.2); speak(word.hz); hud()
      },
    }
  })
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
  return drill(html(V.compose), right => {
    const line = randomLine(), words = line.parts.filter(isWord), chosen: number[] = []
    let tiles: number[]
    do tiles = words.map((_, i) => i).sort(() => Math.random() - 0.5); while (tiles.every((t, i) => t === i))
    speak(plain(line.parts))
    return {
      body: () => {
        const done = chosen.length === tiles.length, ok = done && chosen.every((t, i) => words[t].hz === words[i].hz)
        return `<p>${line.en}</p><button data-a="say">🔊 ${html(V.listen)}</button>`
          + `<div class="line">${chosen.map((t, i) => `<button data-a="u${i}"${done ? ' disabled class="' + (ok ? 'ok' : 'bad') + '"' : ''}>${html(words[t])}</button>`).join('')}&nbsp;</div>`
          + `<div class="line">${tiles.filter(t => !chosen.includes(t)).map(t => `<button data-a="t${t}">${html(words[t])}</button>`).join('')}&nbsp;</div>`
          + (done ? `<p class="full">${html(ok ? V.right : V.wrong)}</p><div class="ask">${said(line)}</div><button data-a="next">${html(V.next)} →</button>` : '')
      },
      click: a => {
        if (a === 'say') return speak(plain(line.parts))
        if (a[0] === 'u') { chosen.splice(+a.slice(1), 1); return }
        chosen.push(+a.slice(1))
        if (chosen.length < tiles.length) return
        const ok = chosen.every((t, i) => words[t].hz === words[i].hz)
        words.forEach(w => see(w, ok ? 1 : 0.5))
        if (ok) { right(); blip(659, 880) } else blip(140)
        see(ok ? V.right : V.wrong); see(V.compose, 0.2); speak(plain(line.parts)); hud()
      },
    }
  })
}

// the word exam: five questions; right answers pay, wrong ones bring the word's pinyin and English back
function examPanel(): Panel {
  return drill(html(V.exam), right => {
    const q = question()
    let picked = -1
    const ask = () => { if (q.listen) speak(q.word.hz) }
    ask()
    return {
      body: () => (q.listen ? `<button data-a="say">🔊 ${html(V.listen)}</button>` : `<p class="big">${q.word.hz}</p>`)
        + grid(q.options.map((o, i) => `<button data-a="${i}"${mark(i, picked, q.answer)}>${o}</button>`))
        + (picked < 0 ? '' : `<p class="full">${html(picked === q.answer ? V.right : V.wrong)} — ${html(q.word)}</p><button data-a="next">${html(V.next)} →</button>`),
      click: a => {
        if (a === 'say') return ask()
        picked = +a
        const ok = picked === q.answer
        if (ok) { right(); see(q.word); blip(659, 880) }
        else { forget(q.word, 2); blip(140) }
        see(ok ? V.right : V.wrong); see(V.exam, 0.2); speak(q.word.hz); hud()
      },
    }
  }, () => see(V.money)) // the exam also says what it pays in: 钱
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
    .map(([i, h, s]) => `<div><b>${i}</b><h3>${t(h)}</h3><small>${t(s)}</small></div>`).join('') + `</div><p><button data-a="close" class="ok go">好！ ${t('Let’s go')}</button></p>`,
  click: () => {},
}
const enter = () => { if (!state.welcomed && known() === 0 && !state.money) { state.welcomed = true; persist(); return openPanel(welcomePanel) } /* new players only */ unlockVoice(); wakeAudio(); see(V.di, 0.2); see(V.day, 0.2); if (touch) { playing = true; $('start').hidden = true } else lock() }
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
  ...([['py', 'Pinyin', ['fades as you learn', 'always', 'never']], ['en', 'English', ['fades as you learn', 'never']], ['voice', 'Voice', ['normal', 'slow', 'off']],
  ['ear', 'What villagers say', ['shown and spoken', 'spoken only (hold T to read)']], ['music', 'Music', ['on', 'off']], ['ui', 'Text size', ['normal', 'large', 'small']], ['look', 'Look speed', ['normal', 'fast', 'slow']], ['invert', 'Look up / down', ['normal', 'inverted']]] as const)
    .map(([k, label, vals]): [keyof typeof state.opts, string, string[]] => [k, t(label), vals.map(v => t(v))])]
const lookSpeed = () => [0.0025, 0.004, 0.0015][state.opts.look] ?? 0.0025, upDown = () => state.opts.invert ? -1 : 1
const got = new Set([...state.ach ?? [], ...ACH.filter(a => a[2]()).map(a => a[0].hz)]) // saved, so spending the money or losing the pet does not undo one
state.ach = [...got] // one already earned when the save was made (before achievements were kept) is kept from now on too
function checkAch() {
  if (performance.now() - toastAt < 3500) return // let the current toast have its moment
  for (const [w, en, ok] of ACH) if (!got.has(w.hz) && ok()) {
    got.add(w.hz); state.ach = [...got]; persist(); blip(523, 659, 784, 1047)
    toast(`<div class="s l0">🏆 ${html(w)}<div class="en">${t('Achievement: {0}', en)}</div></div>`, true)
    return // one at a time; the next check shows the next
  }
}
// word of the day on the menu: one you have met but not mastered (any word on a first visit); click it to hear it
const wotd = () => { const ws = ALL_WORDS.filter(w => state.seen[w.hz] >= 1 && level(w) < 2), pool = ws.length ? ws : ALL_WORDS; return pool[Math.floor(Date.now() / 864e5) % pool.length] }
$('ver').textContent = 'v' + version // from package.json: bump it there
$('wotd').onclick = () => { unlockVoice(); speak(wotd().hz) }
function drawStart() {
  const earned = ([w, , ok]: typeof ACH[number]) => got.has(w.hz) || !!ok() // once earned, kept: spending the money or moving the bed does not undo it
  $('ach').innerHTML = `<p>${ACH.filter(earned).length} / ${ACH.length}</p>` + ACH.map(a => `<div class="ach${earned(a) ? ' on' : ''}"><b>${earned(a) ? '🏆' : '🔒'}</b>${html(a[0])}<small>${a[1]}</small></div>`).join('')
  $('wotd').innerHTML = `<small>今天的词 · ${t('word of the day')} 🔊</small>${html(wotd())}`
  const dayN = dayOf(clock) + 1 // 第一天, 第二天 …
  $('progress').innerHTML = `<span class="s">${ph([V.di, numWord(dayN), V.day])} · ${html(RANKS[rank()][1])} · ${ph([V.learn, V.le, countNum(known()), V.ge, V.zi])} · ${ph(price(state.money))} · 🏆 ${ACH.filter(([w, , ok]) => got.has(w.hz) || ok()).length}</span>`
    + (RANKS[rank() + 1] ? `<div class="next">${bar((known() - RANKS[rank()][0]) / (RANKS[rank() + 1][0] - RANKS[rank()][0]))}<small>→ ${html(RANKS[rank() + 1][1])} · ${t('{0} more words', RANKS[rank() + 1][0] - known())}</small></div>` : '') // how far to the next title
  // the learner's own language: a list, each named in itself, since you may not read the current one
  $('opts').innerHTML = `<label class="lang">🌐 ${t('Language')} <select data-o="lang">${LANGS.map((n, i) => `<option value="${i}"${i === state.opts.lang ? ' selected' : ''}>${n}</option>`).join('')}</select></label>` + OPTS.map(([k, label, vals]) => `<button data-o="${k}">${label} <b>${vals[state.opts[k]]}</b></button>`).join('')
  const fresh = known() === 0 && !state.money && !started
  $('playzh').textContent = fresh ? '开始' : '继续'; $('playen').textContent = fresh ? t('Play') : t('Continue')
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
  wakeAudio() // the menu has music too, once you click something
  const b = (e.target as HTMLElement).closest('button')
  if (b?.dataset.go) return blip(660), showPage(b.dataset.go)
  const k = b?.dataset.o
  if (k === 'reset') { if (confirm(t('Erase all progress, inventory and buildings?'))) { wiping = true; localStorage.removeItem('cubedao'); location.reload() } return }
  if (k === 'export') { // the whole save as text, to paste into another browser
    savePos()
    const text = JSON.stringify(state)
    return void (navigator.clipboard?.writeText(text) ?? Promise.reject()).then(() => alert(t('Save copied to the clipboard.')), () => prompt(t('Copy this save:'), text))
  }
  if (k === 'import') {
    const text = prompt(t('Paste a save exported from CubeDao:'))
    if (!text) return
    try { // must at least look like a save, or the game would not start again
      const o = JSON.parse(text), obj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)
      if (!obj(o) || !obj(o.inv) || !obj(o.seen) || !obj(o.quests ?? {}) || !obj(o.edits ?? {}) || typeof (o.money ?? 0) !== 'number' || !NPCS[o.track ?? 'teacher']
        || !Array.isArray(o.pos ?? []) || !Object.values(o.inv).every(n => typeof n === 'number')
        || !Object.keys(o.inv).every(id => BLOCKS[+id]) || !Object.values(o.edits ?? {}).every(b => BLOCKS[b as number])) throw 0 // an item or block this game does not have would crash it
    } catch { return alert(t('That is not a CubeDao save.')) }
    wiping = true; localStorage.setItem('cubedao', text); location.reload()
    return
  }
  const o = OPTS.find(x => x[0] === k)
  if (!o) return
  state.opts[o[0]] = (state.opts[o[0]] + 1) % o[2].length
  persist(); drawStart()
}
$('opts').onchange = e => { // a new language: glosses are translated as they load, so start again in it
  state.opts.lang = +(e.target as HTMLSelectElement).value; savePos(); location.reload()
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
/** the villager the followed request sends you to: the letter's addressee once you carry it, else the one who asked */
const goal = () => { const q = quest(state.track); return q.deliver && state.letters[state.track] ? q.deliver : state.track }
function drawMap() {
  const g = mapEl.getContext('2d')!, k = mapEl.width / SX
  g.imageSmoothingEnabled = false
  g.drawImage(land, 0, 0, mapEl.width, mapEl.height)
  const t = world.SPOTS[goal()] // where the request followed in the corner leads: a gold ring
  if (t) { g.strokeStyle = '#ffd640'; g.lineWidth = 3; g.beginPath(); g.arc(t.x * k, t.z * k, 13, 0, 7); g.stroke() }
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
  const t = world.SPOTS[goal()] // where the request followed in the corner leads: ringed when near, a gold notch on the rim pointing at it when not
  if (t) {
    const [x, y] = at(t.x, t.z), a = Math.atan2(y - c, x - c)
    g.strokeStyle = '#ffd640'; g.fillStyle = '#ffd640'; g.lineWidth = 2
    if (inside([x, y])) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.stroke() }
    else { g.save(); g.translate(c + Math.cos(a) * (c - 10), c + Math.sin(a) * (c - 10)); g.rotate(a); g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.restore() }
  }
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
    else if (locked() && k === 'dig') digNow()
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
const digNow = (now = performance.now()) => { digAt = now + 280; dig() } // and again every 280 ms while held (dig() may call that off: the chest)
addEventListener('mousedown', e => { if (touch || !locked()) return; // touch has its own buttons; ignore synthesised clicks
  if (e.button === 2 || (e.button === 0 && e.ctrlKey)) return place() // ctrl-click is the right click of a one-button Mac trackpad
  if (e.button === 0) digNow() })
addEventListener('mouseup', () => { digAt = Infinity })
// one item per notch of a wheel; a trackpad sends dozens of small deltas per swipe, so they add up to a step first
let wheel = 0
addEventListener('wheel', e => {
  if (!locked() || !owned.length) return // in a panel the wheel scrolls the panel
  wheel += e.deltaMode ? e.deltaY * 40 : e.deltaY
  if (Math.abs(wheel) < 50) return
  cycle(Math.sign(wheel)); wheel = 0
})
const cycle = (d: number) => { if (owned.length) { const i = owned.indexOf(sel); sel = owned[i < 0 ? (d > 0 ? 0 : owned.length - 1) : (i + d + owned.length) % owned.length]; /* from an empty hand: the first or the last */ picked = true; hud() } }
const running = () => !!(keys.ShiftLeft || keys.ShiftRight || keys.PadRun)

// gamepad (standard layout): left stick walks (pushed all the way, or clicked, runs), right stick looks, A jumps,
// RT digs (hold), LT places / uses, LB / RB pick the item, Y says the last line again, d-pad up opens the map.
// Menus still need the mouse.
const padWas: boolean[] = []
function pollPad(dt: number) {
  const gp = navigator.getGamepads?.().find(g => g?.connected)
  if (!gp) { // unplugged mid-press: let go of everything it held, the stick too (it is no button, so padWas does not know it)
    keys.PadW = keys.PadS = keys.PadA = keys.PadD = keys.PadRun = keys.PadJump = false
    if (padWas[7]) digAt = Infinity
    padWas.length = 0
    return
  }
  const ax = (i: number) => Math.abs(gp.axes[i] ?? 0) > 0.25 ? gp.axes[i] : 0, btn = (i: number) => !!gp.buttons[i]?.pressed, pressed = (i: number) => btn(i) && !padWas[i]
  keys.PadW = ax(1) < 0; keys.PadS = ax(1) > 0; keys.PadA = ax(0) < 0; keys.PadD = ax(0) > 0
  keys.PadRun = btn(10) || Math.hypot(ax(0), ax(1)) > 0.95; keys.PadJump = btn(0)
  if (locked()) {
    const k = lookSpeed() / 0.0025
    p.yaw -= ax(2) * dt * 2.6 * k
    p.pitch = Math.max(-1.55, Math.min(1.55, p.pitch - ax(3) * dt * 2 * k * upDown()))
    if (pressed(7)) digNow(); else if (!btn(7) && padWas[7]) digAt = Infinity
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
  if ((e.target as HTMLElement).tagName === 'SELECT') return // the language list keeps its own keys (arrows, Enter)
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
  narrate(parts, state.home ? t('I go back home.') : t('I go back to the school.')); hud()
}
// switching window or leaving the game mid-keypress would otherwise leave you walking (or digging) forever
const release = () => { for (const k in keys) keys[k] = false; digAt = Infinity; document.body.classList.remove('peek') }
addEventListener('blur', release)
document.addEventListener('pointerlockchange', () => { if (!locked()) release() })
addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'KeyT') document.body.classList.remove('peek') })

// --- day cycle, loop ---
// 凌晨 before five, 早上 to nine, 上午 to twelve, 中午 to one, 下午 to six, then 晚上
// the item in your hand, bottom right: a little block (or a flat item), bobbing as you walk and swinging when you dig or place
const held = new THREE.Mesh(new THREE.BufferGeometry(), nightly(new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, fog: false })))
// drawn in a pass of its own after the world, on a cleared depth buffer: always in front (walls, water, anything
// transparent), and depth-tested against itself so a cube shows its front faces. handCam follows camera's lens each frame
const handScene = new THREE.Scene(), handCam = new THREE.PerspectiveCamera()
handScene.add(handCam); handCam.add(held)
let heldId = -1, swingAt = -1e9
function setHeld(id: number) {
  if (id === heldId) return
  heldId = id; held.geometry.dispose()
  if (!id) return void (held.geometry = new THREE.BufferGeometry())
  const b = BLOCKS[id], cube = !!b.opaque || id === WATER, geo = cube ? new THREE.BoxGeometry(1, 1, 1) : new THREE.PlaneGeometry(1, 1), uv = geo.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i++) { // each face onto its atlas tile (box faces: +x -x +y -y +z -z, four corners each)
    const f = Math.floor(i / 4), t = !cube ? b.t[1] : f === 2 ? b.t[0] : f === 3 ? b.t[2] : b.t[1]
    uv.setXY(i, ((t % 8) + 0.01 + uv.getX(i) * 0.98) / 8, 1 - ((t >> 3) + 0.99 - uv.getY(i) * 0.98) / 8)
  }
  held.geometry = geo; held.userData.cube = cube
}
let lastAction = V.stand, lastWeather = V.sunny, lastLand = 0
let tick = 0, lastPeriod = period(hourOf(clock)), lastInfo = '' // the day starts at eight on Monday

function frame(now: number) {
  // a slow device (20 fps) still runs at full speed; only a stall (a hidden tab, a hitch) is cut short. Walking and falling
  // go in steps of 33 ms at most, so a big step never carries you through a wall or a floor
  const dt = Math.min((now - last) / 1000, 0.1); last = now
  pollPad(dt)
  if (locked()) { clock += dt; for (let left = dt; left > 1e-6; left -= 0.033) move(Math.min(left, 0.033)); if (!started) canvas.animate?.([{ opacity: 0 }, { opacity: 1 }], 700); started = true } // from the menu's flight into your eyes: a fade, not a cut
  if (now > digAt && locked() && target && !target.mob) digNow(now)
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
  const hour = hourOf(clock)
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
    const day = dayOf(clock) + 1
    const parts: Part[] = per === V.morning ? [per, V.good, '！', V.today, V.am, V.di, numWord(day), V.day, '。'] : [per, V.good, '！']
    parts.filter(isWord).forEach(w => see(w, w === per ? 1 : 0.3))
    speak(plain(parts))
    toast(said({ parts, en: per === V.morning ? t('Good morning! Today is day {0}.', day) : per === V.forenoon ? t('Good morning!') : per === V.noon ? t('Good day!') : per === V.afternoon ? t('Good afternoon!') : per === V.evening ? t('Good evening!') : t('Good {0}!', per.en) }))
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
    narrate(parts, snow ? t("It's snowing!") : wet ? t("It's raining!") : t('The sky has cleared!'))
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
  for (const c of clouds) if ((c.m.position.x += dt * 1.2) > SX + 75) c.m.position.x -= SX + 150
  stars.visible = !wet && !under && (hour >= 19 || hour < 5)
  updateFireflies(now / 1000, !wet && !under && (hour >= 19.5 || hour < 4.5), p.x, p.z)
  stars.position.copy(camera.position); dome.position.copy(camera.position)
  if (wet) {
    for (let i = 1; i < rainPos.length; i += 3) if ((rainPos[i] -= (snow ? 3 : 22) * dt) < -12) rainPos[i] += 24 // snow drifts, rain falls
    rain.geometry.attributes.position.needsUpdate = true
    rain.position.copy(camera.position)
  }
  const info = `<div>${html(WEEK[dayOf(clock) % 7])} ${html(per)}${ph(oclock(hour))} · ${html(weather)}</div>`
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
  if (held.visible) { // the hand, over everything
    handCam.projectionMatrix.copy(camera.projectionMatrix); handCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse)
    renderer.autoClear = false; renderer.clearDepth(); renderer.render(handScene, handCam); renderer.autoClear = true
  }
  requestAnimationFrame(frame)
}
let last = performance.now()
Object.assign(window, { cubedao: { p, state, world, mobs, sunDir, stars, setBlock, quest, NPCS, unvoiced, pieced, setClock: (v: number) => { clock = v } } }) // console/debug handle
hud()
requestAnimationFrame(frame)
