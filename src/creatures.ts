// The island's animals and villagers as models: boxes with per-face shading, baked into a mesh per rigid part (body,
// head, each leg …) so a part can swing, nod or wag. Behaviour (walking, sleeping, being fed) is in main.ts.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { nightly, shade } from './render.ts'

// a creature's rigid part (body, head, a leg …): its boxes baked into one mesh with one shared material, so a pig is
// seven draw calls rather than twenty
const mobMat = nightly(new THREE.MeshBasicMaterial({ vertexColors: true }))
export function part(bs: Bx[], [px, py, pz] = [0, 0, 0]) {
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
export const pig = () => { const d = 0xd98a94; return critter({
  body: [[0.7, 0.5, 0.95, PINK, 0, 0.5, 0]], legs: four(0.2, 0.25, d, 0.22, 0.3),
  head: [[0.5, 0.45, 0.4, PINK, 0, 0, -0.15], [0.26, 0.18, 0.1, d, 0, -0.05, -0.39], ...both([0.05, 0.05, 0.02, 0x8a4a50, 0.06, -0.04, -0.445], [0.07, 0.07, 0.02, EYE, 0.13, 0.1, -0.355], [0.14, 0.12, 0.06, d, 0.16, 0.26, -0.1])], at: [0.6, -0.5],
  tail: [[0.06, 0.06, 0.12, d, 0, 0, 0.06], [0.06, 0.12, 0.06, d, 0, 0.06, 0.12]], tailAt: [0.62, 0.48] }) }
export const cow = () => critter({
  body: [[0.8, 0.65, 1.3, WHITE, 0, 0.88, 0], [0.82, 0.32, 0.36, BLACK, 0, 1.0, 0.25], [0.42, 0.26, 0.3, BLACK, 0.2, 0.74, -0.3], [0.42, 0.22, 0.26, BLACK, -0.2, 0.85, 0.38], [0.3, 0.12, 0.3, PINK, 0, 0.5, 0.35]],
  legs: four(0.2, 0.55, WHITE, 0.27, 0.45),
  head: [[0.5, 0.5, 0.45, WHITE, 0, 0, -0.1], [0.52, 0.18, 0.47, BLACK, 0, 0.17, -0.1], [0.42, 0.22, 0.12, 0xf0b4b4, 0, -0.14, -0.38],
    ...both([0.08, 0.08, 0.02, EYE, 0.14, 0.03, -0.335], [0.08, 0.18, 0.08, 0xe8dcc0, 0.2, 0.32, -0.05], [0.16, 0.08, 0.1, BLACK, 0.32, 0.15, -0.05])], at: [1.15, -0.7],
  tail: [[0.06, 0.5, 0.06, WHITE, 0, -0.25, 0.03], [0.1, 0.12, 0.1, BLACK, 0, -0.5, 0.03]], tailAt: [1.15, 0.65] })
export const sheep = () => { const face = 0x3a3a3a; return critter({
  body: [[0.6, 0.46, 0.84, 0xe8d4c4, 0, 0.72, 0]], coat: [[0.75, 0.6, 0.95, WHITE, 0, 0.75, 0], [0.6, 0.12, 0.8, 0xffffff, 0, 1.1, 0], ...both([0.08, 0.4, 0.7, 0xe8e8e0, 0.4, 0.75, 0])],
  legs: four(0.14, 0.45, face, 0.22, 0.3),
  head: [[0.36, 0.4, 0.36, face, 0, -0.02, -0.12], [0.44, 0.16, 0.4, 0xffffff, 0, 0.2, -0.1], ...both([0.16, 0.07, 0.1, face, 0.25, 0.08, -0.05], [0.07, 0.06, 0.02, 0xeeeedd, 0.1, 0.04, -0.305])], at: [1.0, -0.55],
  tail: [[0.12, 0.14, 0.08, WHITE, 0, -0.05, 0.04]], tailAt: [0.9, 0.48] }) }
export const chicken = () => critter({
  body: [[0.36, 0.34, 0.46, 0xffffff, 0, 0.42, 0.02], [0.26, 0.24, 0.08, WHITE, 0, 0.6, 0.27], ...both([0.05, 0.22, 0.3, 0xe8e8e8, 0.2, 0.43, 0.04])],
  legs: both([0.05, 0.25, 0.05, 0xe0a020, 0.09, 0.25, 0.02]),
  head: [[0.24, 0.28, 0.22, 0xffffff, 0, 0, -0.02], [0.1, 0.07, 0.1, 0xf0b020, 0, 0, -0.17], [0.06, 0.1, 0.04, 0xd42a20, 0, -0.09, -0.14], [0.05, 0.12, 0.18, 0xd42a20, 0, 0.19, -0.02],
    ...both([0.02, 0.05, 0.05, EYE, 0.125, 0.05, -0.06])], at: [0.66, -0.18] })
export const cat = () => { const o = 0xe8a040, st = 0xb86e20; return critter({
  body: [[0.3, 0.3, 0.7, o, 0, 0.42, 0], ...[-0.15, 0.05, 0.25].map(z => [0.32, 0.31, 0.07, st, 0, 0.425, z] as Bx)],
  legs: four(0.09, 0.27, o, 0.1, 0.25),
  head: [[0.32, 0.28, 0.28, o, 0, 0, -0.06], [0.14, 0.09, 0.04, 0xf8e0c0, 0, -0.07, -0.21], [0.05, 0.04, 0.02, 0xf08090, 0, -0.04, -0.235],
    ...both([0.09, 0.12, 0.05, o, 0.1, 0.19, -0.04], [0.05, 0.07, 0.01, PINK, 0.1, 0.18, -0.07], [0.07, 0.07, 0.02, 0x3a9a3a, 0.08, 0.03, -0.205])], at: [0.6, -0.4],
  tail: [[0.07, 0.07, 0.25, o, 0, 0, 0.12], [0.07, 0.3, 0.07, st, 0, 0.15, 0.22]], tailAt: [0.52, 0.35] }) }
export const dog = () => { const b = 0x9a6a3a, d = 0x6a4422; return critter({
  body: [[0.36, 0.36, 0.75, b, 0, 0.53, 0], [0.3, 0.2, 0.06, 0xd42a20, 0, 0.62, -0.36]], // a red collar
  legs: four(0.12, 0.35, b, 0.12, 0.26),
  head: [[0.36, 0.34, 0.32, b, 0, 0, -0.05], [0.2, 0.16, 0.18, 0xc8986a, 0, -0.08, -0.28], [0.08, 0.06, 0.03, EYE, 0, -0.02, -0.38],
    ...both([0.07, 0.24, 0.14, d, 0.215, -0.03, -0.03], [0.06, 0.06, 0.02, EYE, 0.09, 0.06, -0.215])], at: [0.8, -0.45],
  tail: [[0.07, 0.07, 0.3, b, 0, 0.1, 0.12]], tailAt: [0.66, 0.36] }) }
export const panda = () => critter({
  body: [[0.9, 0.75, 1.15, WHITE, 0, 0.78, 0], [0.92, 0.77, 0.32, BLACK, 0, 0.78, -0.3]],
  legs: four(0.28, 0.42, BLACK, 0.28, 0.38),
  head: [[0.62, 0.55, 0.5, WHITE, 0, 0, -0.08], [0.24, 0.16, 0.08, WHITE, 0, -0.12, -0.36], [0.1, 0.06, 0.02, BLACK, 0, -0.07, -0.405],
    ...both([0.18, 0.18, 0.1, BLACK, 0.25, 0.33, -0.02], [0.16, 0.16, 0.02, BLACK, 0.14, 0.04, -0.335], [0.05, 0.05, 0.02, 0xffffff, 0.14, 0.06, -0.347])], at: [1.05, -0.68],
  tail: [[0.15, 0.15, 0.08, WHITE, 0, 0, 0.04]], tailAt: [0.95, 0.58] })
export const penguin = () => critter({
  body: [[0.42, 0.62, 0.38, 0x26262c, 0, 0.39, 0], [0.32, 0.5, 0.04, WHITE, 0, 0.37, -0.19], ...both([0.05, 0.38, 0.2, 0x26262c, 0.235, 0.45, 0])],
  legs: both([0.12, 0.08, 0.18, 0xe07820, 0.1, 0.08, -0.05]),
  head: [[0.34, 0.3, 0.32, 0x26262c, 0, 0, 0], [0.08, 0.06, 0.14, 0xf09020, 0, -0.04, -0.22], ...both([0.07, 0.07, 0.02, WHITE, 0.08, 0.04, -0.165], [0.035, 0.035, 0.02, EYE, 0.08, 0.04, -0.172])], at: [0.85, 0] })
export const camel = () => { const c = 0xc8a060, d = 0xa88040; return critter({
  body: [[0.7, 0.6, 1.2, c, 0, 1.2, 0], [0.45, 0.35, 0.35, c, 0, 1.6, -0.25], [0.45, 0.35, 0.35, c, 0, 1.6, 0.3], [0.24, 0.7, 0.24, c, 0, 1.5, -0.68]],
  legs: four(0.18, 0.9, c, 0.24, 0.45),
  head: [[0.3, 0.28, 0.55, c, 0, 0, -0.1], [0.24, 0.18, 0.14, d, 0, -0.05, -0.42], ...both([0.06, 0.1, 0.06, c, 0.12, 0.18, 0.05], [0.02, 0.06, 0.07, EYE, 0.155, 0.06, -0.12])], at: [1.85, -0.75],
  tail: [[0.06, 0.4, 0.06, d, 0, -0.2, 0.03]], tailAt: [1.4, 0.6] }) }
export const bird = () => critter({
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
export function person([shirt, trousers]: number[], kind: string) {
  const g = new THREE.Group(), gear = GEAR[kind]
  const hinge = (w: number, h: number, c: number, x: number, y: number, extra: Bx[] = []) => { // a limb hanging from (x, y)
    const m = part([[w, h, 0.22, c, 0, -h / 2, 0], ...extra], [x, y, 0]); g.add(m); return m
  }
  g.add(part([[0.5, 0.7, 0.25, shirt, 0, 1.1, 0], [0.45, 0.45, 0.45, 0xf0c8a0, 0, 1.675, 0], ...both([0.07, 0.07, 0.02, EYE, 0.11, 1.7, -0.23]), [0.14, 0.03, 0.02, 0x8a3a30, 0, 1.56, -0.23], ...gear.hat, ...(gear.wear ?? [])]))
  g.userData.legs = [hinge(0.24, 0.75, trousers, -0.125, 0.75), hinge(0.24, 0.75, trousers, 0.125, 0.75)]
  g.userData.arms = [hinge(0.18, 0.7, shirt, -0.34, 1.45), hinge(0.18, 0.7, shirt, 0.34, 1.45, gear.tool)]
  return g
}

export function fishy() { // blue, orange or green, with fins and a tail that beats
  const [c, d] = [[0x6fa8dc, 0x4a7ab0], [0xf08a30, 0xc8601a], [0x7ac070, 0x4a8a48]][Math.random() * 3 | 0]
  return critter({
    body: [[0.14, 0.26, 0.42, c, 0, 0, 0], [0.1, 0.18, 0.1, c, 0, 0, -0.25], [0.03, 0.1, 0.22, d, 0, 0.17, 0.02], ...both([0.08, 0.02, 0.1, d, 0.1, -0.06, -0.08])],
    head: both([0.02, 0.05, 0.05, EYE, 0.075, 0.04, -0.15]), at: [0, 0],
    tail: [[0.03, 0.3, 0.2, d, 0, 0, 0.1]], tailAt: [0, 0.21] })
}
export function butterfly() { // a thin body, antennae, and fore and hind wings that flap from the body
  const col = [0xf2c230, 0xe8436a, 0x4a7af0, 0xffffff][Math.random() * 4 | 0]
  return critter({
    body: [[0.06, 0.06, 0.3, 0x222222, 0, 0, 0]], head: both([0.015, 0.015, 0.14, 0x222222, 0.03, 0.04, -0.06]), at: [0.02, -0.15],
    wings: both([0.26, 0.02, 0.2, col, 0.03, 0, -0.06], [0.18, 0.02, 0.16, col, 0.03, 0, 0.1]) })
}
