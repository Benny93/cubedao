// The renderer, the scene and camera, the block texture atlas, and night: a shader uniform every lit material follows.
import * as THREE from 'three'
import { makeAtlas } from './atlas.ts'

export const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.prepend(renderer.domElement)
export const scene = new THREE.Scene()
scene.background = new THREE.Color(0x8fc7ff)
scene.fog = new THREE.Fog(0x8fc7ff, 60, 150)
export const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 300)
camera.rotation.order = 'YXZ'
const resize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix() }
addEventListener('resize', resize); resize()

export const atlas = makeAtlas()
document.documentElement.style.setProperty('--atlas', `url(${atlas.toDataURL()})`)
export const tex = new THREE.CanvasTexture(atlas)
tex.magFilter = tex.minFilter = THREE.NearestFilter
tex.generateMipmaps = false
tex.colorSpace = THREE.SRGBColorSpace
// Night is a shader uniform, not an overlay, so lantern light can beat it: every lit material multiplies its colour by
// max(daylight, lamp light at that vertex). Materials without a lamp attribute (animals, sea, clouds) just follow daylight.
export const uDay = { value: 1 }
export function nightly<T extends THREE.Material>(m: T, lamp = false): T {
  m.onBeforeCompile = sh => {
    sh.uniforms.uDay = uDay
    if (lamp) sh.vertexShader = 'attribute float lamp;\nvarying float vLamp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLamp = lamp;')
    sh.fragmentShader = (lamp ? 'varying float vLamp;\n' : '') + 'uniform float uDay;\n' + sh.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n  ' + (lamp ? 'diffuseColor.rgb *= max(uDay, vLamp) * mix(vec3(1.0), vec3(1.0, 0.8, 0.5), clamp(vLamp - uDay, 0.0, 1.0));' : 'diffuseColor.rgb *= uDay;'))
  }
  m.customProgramCacheKey = () => lamp ? 'lamp' : 'day' // the two variants must not share a compiled program
  return m
}
export const mats = [
  nightly(new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), true),
  nightly(new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }), true),
]


// a box with per-face shading, top lit and bottom dark (clouds, the sun and moon)
export function shade(n: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, i: number) { return n.getY(i) > 0 ? 1 : n.getY(i) < 0 ? 0.5 : n.getX(i) ? 0.8 : 0.65 } // top lit, bottom dark
export function box(w: number, h: number, l: number, color: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, l), n = g.attributes.normal, col: number[] = []
  for (let i = 0; i < n.count; i++) { const s = shade(n, i); col.push(s, s, s) }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  const m = new THREE.Mesh(g, nightly(new THREE.MeshBasicMaterial({ color, vertexColors: true })))
  m.position.set(x, y, z)
  return m
}
