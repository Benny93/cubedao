// Voxel data, terrain generation, ray casting and chunk meshing. Pure (no DOM/three): testable in node.
import { AIR, GRASS, DIRT, STONE, SAND, WATER, WOOD, LEAVES, FLOWER, BAMBOO, LANTERN, TILE, PLANK, TABLE, YFLOWER, BFLOWER, BRICK, BLACKBOARD, SNOW, CHEST, CACTUS, COAL, IRON, GOLD, STOVE, SHELF, PATH, LAMPS, BLOCKS } from './words.ts'

// ponytail: one fixed 256x48x256 sea with a few islands, not infinite chunks. Stream chunks if the world needs to grow.
export const SX = 256, SY = 48, SZ = 256, CH = 16, SEA = 14
export const data = new Uint8Array(SX * SY * SZ)
/** bump when generation changes shape, so saved edits made on an older island are dropped rather than replayed */
export const WORLD_V = 7
export const HOME = { x: SX >> 1, y: 0, z: SZ >> 1 } // pavilion floor, y set by generate()
/** where each villager stands (feet), filled by generate() */
export const SPOTS: Record<string, { x: number; y: number; z: number }> = {}

const inb = (x: number, y: number, z: number) => x >= 0 && x < SX && y >= 0 && y < SY && z >= 0 && z < SZ
export const idx = (x: number, y: number, z: number) => x + SX * (z + SZ * y)
export const get = (x: number, y: number, z: number) => y < 0 ? STONE : inb(x, y, z) ? data[idx(x, y, z)] : AIR
export const set = (x: number, y: number, z: number, b: number) => { if (inb(x, y, z)) data[idx(x, y, z)] = b }

function hash(x: number, z: number, s: number) {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(s, 1442695041) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function noise(x: number, z: number, s: number) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz)
  const a = hash(xi, zi, s), b = hash(xi + 1, zi, s), c = hash(xi, zi + 1, s), d = hash(xi + 1, zi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
// islands as offsets from HOME: radius, how high the middle rises, how bumpy; index = biome (0 home, 1 snow, 2 sand)
const ISLES = [{ x: 0, z: 0, r: 52, up: 14, bump: 20 }, { x: 70, z: -75, r: 27, up: 15, bump: 16 }, { x: 75, z: 80, r: 29, up: 12, bump: 8 }]
const ISLET = { x: HOME.x - 50, z: HOME.z + 48 } // a sandy islet south-west of the main island, reachable by boat
/** [height, biome] of a column */
function column(x: number, z: number): [number, number] {
  const f = (noise(x / 40, z / 40, 0) + noise(x / 18, z / 18, 1) * 0.5 + noise(x / 8, z / 8, 2) * 0.25) / 1.75
  const i = Math.hypot(x - ISLET.x, z - ISLET.z)
  let h = Math.max(1, i < 7 ? Math.floor(SEA + 3.5 - i * 0.55) : 0), biome = 0
  ISLES.forEach((s, k) => {
    const d = Math.hypot(x - HOME.x - s.x, z - HOME.z - s.z) / s.r, hk = Math.floor(2 + f * s.bump + s.up * (1 - d * d)) // falls off into the sea
    if (hk > h) { h = hk; biome = k }
  })
  return [Math.min(SY - 10, h), biome]
}
const height = (x: number, z: number) => column(x, z)[0]
export const biome = (x: number, z: number) => column(x, z)[1]

export function tree(x: number, y: number, z: number, th: number) {
  for (let i = 0; i < th; i++) if (get(x, y + i, z) === AIR) set(x, y + i, z, WOOD) // never through a roof or a lantern
  for (let dy = th - 2; dy <= th + 1; dy++) {
    const r = dy < th ? 2 : 1
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.abs(dx) === r && Math.abs(dz) === r) continue
      if (get(x + dx, y + dy, z + dz) === AIR) set(x + dx, y + dy, z + dz, LEAVES)
    }
  }
}

/** Flatten a (2r+1)² site and put up four posts and a roof. Returns the floor's walking height. */
function hut(cx: number, cz: number, r: number, floor: number, roof: number) {
  const h0 = Math.max(height(cx, cz), SEA + 2)
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const x = cx + dx, z = cz + dz
    for (let y = 0; y < SY; y++) set(x, y, z, y < h0 - 1 ? (BLOCKS[get(x, y, z)].opaque ? get(x, y, z) : DIRT) : y === h0 - 1 ? floor : AIR)
    set(x, h0 + 3, z, roof)
    if (Math.abs(dx) === r - 1 && Math.abs(dz) === r - 1) for (let y = h0; y < h0 + 3; y++) set(x, y, z, WOOD)
  }
  // grade the land around it: clear plants, and let the ground rise or fall at most one block per step away
  for (let dx = -r - 5; dx <= r + 5; dx++) for (let dz = -r - 5; dz <= r + 5; dz++) {
    const d = Math.max(Math.abs(dx), Math.abs(dz)) - r
    if (d <= 0) continue
    const x = cx + dx, z = cz + dz, h = height(x, z), t = Math.max(h0 - d, Math.min(h0 + d, h))
    for (let y = Math.min(h, t); y < SY; y++) set(x, y, z, y < t ? DIRT : y < SEA && t < SEA ? WATER : AIR)
    if (t !== h || t > SEA + 1) set(x, t - 1, z, t <= SEA + 1 || biome(x, z) === 2 ? SAND : biome(x, z) === 1 ? SNOW : GRASS)
  }
  return h0
}

export function generate() {
  data.fill(AIR)
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    const [h, kind] = column(x, z), sandy = h <= SEA + 1 || kind === 2, rocky = h > 30
    // the rock hides coal anywhere, iron lower down, and a little gold near the bottom
    const rock = (y: number) => { const o = hash(x * 31 + y, z, 11); return o < 0.025 ? COAL : y < 11 && o < 0.04 ? IRON : y < 7 && o > 0.994 ? GOLD : STONE }
    for (let y = 0; y < h; y++) set(x, y, z, y < h - 4 ? rock(y) : sandy ? SAND : y < h - 1 ? DIRT : h > 31 || kind === 1 ? SNOW : rocky ? STONE : GRASS)
    for (let y = h; y < SEA; y++) set(x, y, z, WATER)
    const r = hash(x, z, 5)
    if (kind === 2 && h > SEA + 1 && r < 0.02) for (let i = 0, n = 1 + (hash(x, z, 9) * 3 | 0); i < n; i++) set(x, h + i, z, CACTUS) // sand island: cactus
    if (kind === 1 && !sandy && r < 0.004) tree(x, h, z, 5)                                                                       // snow island: a few trees
    if (sandy || rocky || kind) continue
    if (r < 0.012) tree(x, h, z, 4 + (hash(x, z, 6) * 2 | 0))
    else if (noise(x / 20, z / 20, 7) > 0.6 && hash(x, z, 8) < 0.35) for (let i = 0, n = 2 + (hash(x, z, 9) * 3 | 0); i < n; i++) set(x, h + i, z, BAMBOO)
    else if (r < 0.045) set(x, h, z, [FLOWER, YFLOWER, BFLOWER][hash(x, z, 10) * 3 | 0])
  }
  // the teacher's pavilion at the island centre
  const h0 = HOME.y = hut(HOME.x, HOME.z, 4, STONE, TILE)
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) set(HOME.x + dx, h0 + 4, HOME.z + dz, TILE)
  set(HOME.x, h0 + 2, HOME.z, LANTERN)
  SPOTS.teacher = { x: HOME.x + 0.5, y: h0, z: HOME.z + 2.5 }
  for (let y = h0; y < h0 + 2; y++) set(HOME.x - 2, y, HOME.z - 3, BLACKBOARD) // click it to sit an exam
  for (let y = h0; y < h0 + 2; y++) set(HOME.x + 2, y, HOME.z - 3, SHELF)
  // a friend waits at a table on the lawn east of the pavilion
  const tx = HOME.x + 9, tz = HOME.z + 2, th = surface(tx, tz)
  set(tx + 1, surface(tx + 1, tz), tz, TABLE)
  SPOTS.friend = { x: tx + 0.5, y: th, z: tz + 0.5 }

  // merchant's stall, south-west of the pavilion
  const mx = HOME.x - 14, mz = HOME.z + 10, // far enough that its grading leaves the pavilion alone
    mh = hut(mx, mz, 3, STONE, BRICK)
  SPOTS.merchant = { x: mx + 0.5, y: mh, z: mz + 0.5 }

  // carpenter's workshop, north-west
  const cx = HOME.x - 24, cz = HOME.z - 10, ch = hut(cx, cz, 3, PLANK, PLANK)
  set(cx - 1, ch, cz - 1, TABLE)
  SPOTS.carpenter = { x: cx + 0.5, y: ch, z: cz + 0.5 }

  // farmer's thatched shed, east, ringed with flowers
  const fx = HOME.x + 24, fz = HOME.z - 6, fh = hut(fx, fz, 3, DIRT, LEAVES)
  for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) {
    const x = fx + dx, z = fz + dz, h = surface(x, z)
    if (Math.max(Math.abs(dx), Math.abs(dz)) > 3 && (dx + dz) % 2 === 0 && get(x, h - 1, z) === GRASS) set(x, h, z, YFLOWER)
  }
  SPOTS.farmer = { x: fx + 0.5, y: fh, z: fz + 0.5 }

  // cook's kitchen, north
  const kx = HOME.x + 6, kz = HOME.z - 24, kh = hut(kx, kz, 3, STONE, TILE)
  set(kx + 1, kh, kz - 1, TABLE)
  set(kx - 1, kh, kz - 1, STOVE)
  SPOTS.cook = { x: kx + 0.5, y: kh, z: kz + 0.5 }

  // smithy, south
  const bx = HOME.x - 2, bz = HOME.z + 30, bh = hut(bx, bz, 3, STONE, STONE)
  SPOTS.smith = { x: bx + 0.5, y: bh, z: bz + 0.5 }

  // tailor's shop, north-west
  const sx = HOME.x - 16, sz = HOME.z - 30, sh = hut(sx, sz, 3, PLANK, BRICK)
  SPOTS.tailor = { x: sx + 0.5, y: sh, z: sz + 0.5 }

  // the far islands: a signpost spot in the middle of each
  // the far islands: a shelter in the middle of each, with someone who needs things from the main island
  for (const [k, who, i, floor, roof] of [['snow', 'explorer', 1, SNOW, PLANK], ['desert', 'traveller', 2, SAND, LEAVES]] as const) {
    const x = HOME.x + ISLES[i].x, z = HOME.z + ISLES[i].z, y = hut(x, z, 3, floor, roof)
    SPOTS[k] = SPOTS[who] = { x: x + 0.5, y, z: z + 0.5 }
  }

  // treasure on the islet
  const ih = height(ISLET.x, ISLET.z)
  for (let y = ih; y < SY; y++) set(ISLET.x, y, ISLET.z, y === ih ? CHEST : AIR)
  SPOTS.islet = { x: ISLET.x + 0.5, y: ih, z: ISLET.z + 2.5 }

  // fisherman's pier: walk east along a line south of the pavilion until the sea
  const pz = HOME.z + 18
  let px = HOME.x
  while (px < SX - 10 && height(px, pz) >= SEA) px++
  for (let i = -2; i <= 5; i++) for (let k = 0; k <= 1; k++) for (let y = SEA; y < SEA + 6; y++) set(px + i, y, pz + k, y === SEA ? PLANK : AIR)
  SPOTS.fisher = { x: px + 4, y: SEA + 1, z: pz + 1 }

  // footpaths from the school to every home on the main island: grass becomes 路, plants on it go
  for (const k of ['carpenter', 'farmer', 'cook', 'tailor', 'merchant', 'smith', 'fisher', 'friend']) {
    const to = SPOTS[k], n = Math.ceil(Math.hypot(to.x - HOME.x, to.z - HOME.z))
    for (let i = 0; i <= n; i++) for (const side of [0, 1]) { // two wide
      const x = Math.floor(HOME.x + (to.x - HOME.x) * i / n) + (Math.abs(to.z - HOME.z) > Math.abs(to.x - HOME.x) ? side : 0)
      const z = Math.floor(HOME.z + (to.z - HOME.z) * i / n) + (Math.abs(to.z - HOME.z) > Math.abs(to.x - HOME.x) ? 0 : side)
      let y = SY - 1
      while (y > 0 && get(x, y, z) !== GRASS) y--
      if (!y || BLOCKS[get(x, y + 1, z)].solid) continue // no grass here, or a tree stands on it
      set(x, y, z, PATH)
      while (BLOCKS[get(x, y + 1, z)].plant) set(x, ++y, z, AIR)
    }
  }
}

/** y of the first free cell above the top solid-or-water block of a column */
export function surface(x: number, z: number) {
  for (let y = SY - 1; y >= 0; y--) { const b = get(x, y, z); if (BLOCKS[b].solid || b === WATER) return y + 1 }
  return 0
}

/** Voxel DDA. Returns the first cell whose block satisfies `hit`, plus the face normal it was entered through. */
export function raycast(o: number[], d: number[], max: number, hit: (id: number) => boolean) {
  const p = o.map(Math.floor), s = d.map(Math.sign), td = d.map(v => Math.abs(1 / v))
  const tm = d.map((v, i) => v > 0 ? (p[i] + 1 - o[i]) * td[i] : v < 0 ? (o[i] - p[i]) * td[i] : Infinity)
  const n = [0, 0, 0]
  for (let t = 0; t <= max;) {
    if (hit(get(p[0], p[1], p[2]))) return { x: p[0], y: p[1], z: p[2], nx: n[0], ny: n[1], nz: n[2], t }
    const a = tm[0] < tm[1] ? (tm[0] < tm[2] ? 0 : 2) : (tm[1] < tm[2] ? 1 : 2)
    p[a] += s[a]; t = tm[a]; tm[a] += td[a]
    n.fill(0); n[a] = -s[a]
  }
  return null
}

/** Ray vs axis-aligned box: entry distance, or Infinity on a miss */
export function rayBox(o: number[], d: number[], lo: number[], hi: number[]) {
  let t0 = 0, t1 = Infinity
  for (let i = 0; i < 3; i++) {
    const a = (lo[i] - o[i]) / d[i], b = (hi[i] - o[i]) / d[i]
    t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b))
  }
  return t0 <= t1 ? t0 : Infinity
}

// --- meshing ---
// corners counter-clockwise seen from outside: bottom-left, bottom-right, top-right, top-left
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], s: 0.8 },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], s: 0.8 },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], s: 1 },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: 0.5 },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], s: 0.65 },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], s: 0.65 },
]
const PLANT = [
  [[0.15, 0, 0.15], [0.85, 0, 0.85], [0.85, 1, 0.85], [0.15, 1, 0.15]],
  [[0.15, 0, 0.85], [0.85, 0, 0.15], [0.85, 1, 0.15], [0.15, 1, 0.85]],
]
const UV = [[0, 0], [1, 0], [1, 1], [0, 1]]
export interface Buf { pos: number[]; uv: number[]; col: number[]; lamp: number[]; idx: number[] }

// --- lamp light: lanterns shine 15 cells, losing one per step, and not through opaque blocks ---
export const light = new Uint8Array(SX * SY * SZ)
const lit = (x: number, y: number, z: number) => inb(x, y, z) ? light[idx(x, y, z)] / 15 : 0
/** Recompute all lamp light. Returns whether anything is lit. ponytail: full flood on every call; fine for dozens of lanterns, track dirty regions if someone builds a city of them. */
export function relight() {
  light.fill(0)
  const q: number[] = []
  for (let i = 0; i < data.length; i++) { const l = LAMPS[data[i]]; if (l) { light[i] = l; q.push(i) } }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], l = light[i] - 1, x = i % SX, z = Math.floor(i / SX) % SZ, y = Math.floor(i / SX / SZ)
    if (l > 0) for (const f of FACES) {
      const X = x + f.n[0], Y = y + f.n[1], Z = z + f.n[2]
      if (!inb(X, Y, Z)) continue
      const j = idx(X, Y, Z)
      if (light[j] < l && !BLOCKS[data[j]].opaque) { light[j] = l; q.push(j) }
    }
  }
  return q.length > 0
}

function quad(o: Buf, x: number, y: number, z: number, c: number[][], tile: number, shade: number, lamp: number, ao?: number[]) {
  const i = o.pos.length / 3, tx = tile % 8, ty = tile >> 3
  c.forEach((v, k) => {
    o.pos.push(x + v[0], y + v[1], z + v[2])
    // 8x8 atlas, inset a hair so neighbouring tiles don't bleed
    o.uv.push((tx + 0.01 + UV[k][0] * 0.98) / 8, 1 - (ty + 0.99 - UV[k][1] * 0.98) / 8)
    const s = ao ? shade * (0.5 + ao[k] / 6) : shade
    o.col.push(s, s, s)
    o.lamp.push(lamp)
  })
  // split along the brighter diagonal so the corner shadows interpolate evenly
  if (ao && ao[0] + ao[2] < ao[1] + ao[3]) o.idx.push(i + 1, i + 2, i + 3, i + 1, i + 3, i)
  else o.idx.push(i, i + 1, i + 2, i, i + 2, i + 3)
}

/** Geometry for one 16x16 column chunk: [solid, water] */
export function meshChunk(cx: number, cz: number): Buf[] {
  const out: Buf[] = [{ pos: [], uv: [], col: [], lamp: [], idx: [] }, { pos: [], uv: [], col: [], lamp: [], idx: [] }]
  for (let y = 0; y < SY; y++) for (let z = cz * CH; z < cz * CH + CH; z++) for (let x = cx * CH; x < cx * CH + CH; x++) {
    const b = get(x, y, z)
    if (b === AIR) continue
    const def = BLOCKS[b], o = out[b === WATER ? 1 : 0]
    if (def.plant) { for (const c of PLANT) quad(o, x, y, z, c, def.t[1], 1, lit(x, y, z)); continue }
    const tile = (i: number) => def.t[i === 2 ? 0 : i === 3 ? 2 : 1]
    if (def.shape) { // furniture: a few boxes instead of a cube
      for (const s of def.shape) FACES.forEach((f, i) => quad(o, x, y, z, f.c.map(v => v.map((k, a) => s[a] + k * (s[a + 3] - s[a]))), def.st ?? tile(i), f.s, lit(x, y, z)))
      continue
    }
    FACES.forEach((f, i) => {
      const nb = get(x + f.n[0], y + f.n[1], z + f.n[2])
      if (BLOCKS[nb].opaque || (nb === b && b !== LEAVES)) return
      // ambient occlusion: each corner is darker the more of its three outer neighbours are solid
      const ax = f.n.findIndex(v => v !== 0), [u, w] = [0, 1, 2].filter(a => a !== ax)
      const solid = (du: number, dw: number) => { const q = [x + f.n[0], y + f.n[1], z + f.n[2]]; q[u] += du; q[w] += dw; return BLOCKS[get(q[0], q[1], q[2])].opaque ? 1 : 0 }
      const ao = b === WATER ? undefined : f.c.map(v => {
        const du = v[u] ? 1 : -1, dw = v[w] ? 1 : -1, s1 = solid(du, 0), s2 = solid(0, dw)
        return s1 && s2 ? 0 : 3 - s1 - s2 - solid(du, dw)
      })
      quad(o, x, y, z, f.c, tile(i), f.s, LAMPS[b] ? 1 : lit(x + f.n[0], y + f.n[1], z + f.n[2]), ao) // a face is lit by the air in front of it
    })
  }
  return out
}
