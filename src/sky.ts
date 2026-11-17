// Everything above and around the island: the endless sea, rain, the sky colour, clouds, stars, fireflies, the sun,
// the moon and their halos, and the sky dome. The frame loop in main.ts moves and colours them.
import * as THREE from 'three'
import * as world from './world.ts'
import { scene, nightly, box } from './render.ts'

const { SX, SZ } = world

// endless ocean: four big sheets around the island's block of sea, out past the fog
const R = 600, seaMat = nightly(new THREE.MeshBasicMaterial({ color: 0x2a6edc, transparent: true, opacity: 0.67, side: THREE.DoubleSide }))
for (const [x0, z0, x1, z1] of [[-R, -R, SX + R, 0], [-R, SZ, SX + R, SZ + R], [-R, 0, 0, SZ], [SX, 0, SX + R, SZ]]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), seaMat)
  m.rotation.x = -Math.PI / 2
  m.position.set((x0 + x1) / 2, world.SEA, (z0 + z1) / 2)
  scene.add(m)
}

// rain: points that fall through a box that follows the camera
export const DROPS_N = 3000, rainPos = new Float32Array(DROPS_N * 3).map((_, i) => (Math.random() - 0.5) * (i % 3 === 1 ? 24 : 40))
export const rain = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rainPos, 3)),
  nightly(new THREE.PointsMaterial({ color: 0xdfeaff, size: 0.07, transparent: true, opacity: 0.8 })))
rain.frustumCulled = false
scene.add(rain)
export const SKY = new THREE.Color(0x8fc7ff), GREY = new THREE.Color(0x8794a3), DUSK = new THREE.Color(0xf5a36b)
export const sky = scene.background = (scene.fog as THREE.Fog).color = new THREE.Color(0x8fc7ff) // one colour object for both

// clouds: flat white slabs drifting east; they can be looked at like anything else
export const clouds = Array.from({ length: 50 }, () => {
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
export const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(starPos, 3)),
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
export const fireflies = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(ffPos, 3)).setAttribute('color', new THREE.BufferAttribute(ffCol, 3)),
  new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex }))
fireflies.frustumCulled = false
scene.add(fireflies)
/** move and blink the fireflies round (px, pz); on: a dry night */
export function updateFireflies(t: number, on: boolean, px: number, pz: number) {
  fireflies.visible = on
  if (!on) return
  ffBase.forEach((f, i) => {
    if (Math.hypot(f.x - px, f.z - pz) > 18) { f.x = Math.max(0, Math.min(SX - 1, px + Math.random() * 32 - 16)); f.z = Math.max(0, Math.min(SZ - 1, pz + Math.random() * 32 - 16)); f.y = world.surface(Math.floor(f.x), Math.floor(f.z)) + 0.6 + Math.random() * 2 }
    ffPos.set([f.x + Math.sin(t * 0.4 + f.ph) * 1.2, f.y + Math.sin(t * 0.7 + f.ph * 2) * 0.4, f.z + Math.cos(t * 0.3 + f.ph) * 1.2], i * 3)
    const glow = Math.max(0, Math.sin(t * 1.3 + f.ph * 3)) ** 2
    ffCol.set([glow, glow * 0.95, glow * 0.35], i * 3)
  })
  fireflies.geometry.attributes.position.needsUpdate = fireflies.geometry.attributes.color.needsUpdate = true
}

export const sunDir = new THREE.Vector3(), sun = box(22, 22, 22, 0xffe070, 0, 0, 0), moon = box(14, 14, 14, 0xe8eef8, 0, 0, 0)
export const halos = [0xffd080, 0xa0b8ff].map((color, i) => { // halos: the sun's warm and wide, the moon's faint
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: i ? 0.35 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
  h.scale.setScalar(i ? 50 : 110); scene.add(h); return h
})
for (const m of [sun, moon]) { m.material = new THREE.MeshBasicMaterial({ color: (m.material as THREE.MeshBasicMaterial).color, fog: false }); scene.add(m) } // they shine: no night dimming
// sky dome: the fog colour at the horizon, a deeper blue overhead, and a warm glow around the sun while it is up (strongest at sunrise and sunset)
export const dome = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
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
