// Procedural 8x8 atlas of 16px tiles (tile 63 stays empty = fully transparent). No image assets.
type RGBA = number[] | null
const c = (hex: number, k = 1, a = 255): RGBA => [(hex >> 16) * k, (hex >> 8 & 255) * k, (hex & 255) * k, a]
const grass = (r: number) => c(0x5fae3e, 0.85 + r * 0.3)
const dirt = (r: number) => c(0x8a5a36, 0.85 + r * 0.3)

const plank = (_x: number, y: number, r: number, k = 1) => c(0xc49a5a, (y % 4 === 3 ? 0.7 : 0.9 + r * 0.15) * k)

const flower = (petal: number, heart: number) => (x: number, y: number) => {
  const d = Math.hypot(x - 7.5, y - 5)
  return d < 1.5 ? c(heart) : d < 3.6 ? c(petal) : (x === 7 || x === 8) && y >= 8 ? c(0x3c8c32) : null
}

// index = tile id used by BLOCKS[].t
const TILES: ((x: number, y: number, r: number) => RGBA)[] = [
  (_x, _y, r) => grass(r),
  (x, y, r) => y < 3 + (x * 5 % 3 ? 0 : 1) ? grass(r) : dirt(r),
  (_x, _y, r) => dirt(r),
  (_x, _y, r) => c(0x8c8c8c, 0.8 + Math.floor(r * 4) / 4 * 0.35),
  (_x, _y, r) => c(0xe3d49a, 0.9 + r * 0.2),
  (_x, _y, r) => c(0x2a6edc, 0.9 + r * 0.2, 170),
  (x, _y, r) => c(0x7a5230, (x % 4 ? 0.95 : 0.75) + r * 0.15),
  (x, y) => c(0xa9793f, Math.floor(Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))) % 2 ? 0.8 : 1),
  (_x, _y, r) => r < 0.12 ? null : c(0x2f7d32, 0.75 + r * 0.5),
  flower(0xe8436a, 0xffd640),
  (x, y) => [3, 4, 8, 9, 12, 13].includes(x) ? c(0x6fbf3a, (y + x) % 5 === 2 ? 0.6 : x % 2 ? 1 : 0.85) : null, // bamboo
  (x, y, r) => y % 4 === 3 || (x + (y >> 2) % 2 * 4) % 8 === 7 ? c(0xcfc6b8) : c(0xa8432f, 0.85 + r * 0.3),
  (x, y) => x === 0 || y === 0 || x === 15 || y === 15 ? c(0xdcf0ff) : (x + y === 7 && x > 1 && x < 6) || (x + y === 10 && x > 3 && x < 7) ? c(0xffffff) : null,
  (x, y, r) => y < 2 || y > 13 ? c(0xe0b030) : x > 5 && x < 10 && y > 5 && y < 10 ? c(0xffe070) : c(0xd42a20, (x % 4 === 1 ? 0.75 : 0.9) + r * 0.2),
  (x, y, r) => c(0x3d5a6e, y % 4 === 0 ? 0.6 : (x + (y >> 2) % 2 * 2) % 4 === 0 ? 0.75 : 0.9 + r * 0.15),
  (_x, _y, r) => r > 0.93 ? c(0xfff8d0) : c(0xf2c230, 0.8 + r * 0.25),
  plank,                                                                    // 16 plank
  (x, y) => Math.abs(x + y - 15) < 2 && x > 1 && x < 14 ? c(0x7a5230, x % 2 ? 1 : 0.8) : null, // 17 stick
  (x, y) => y < 4 && x > 1 && x < 14 && (y > 0 || (x > 3 && x < 12)) ? c(0x9a9a9a, y % 2 ? 0.8 : 1) // 18 pickaxe
    : (x === 7 || x === 8) && y >= 4 ? c(0x7a5230) : null,
  (x, y, r) => y < 3 || x < 3 || x > 12 ? plank(x, y, r) : null,           // 19 table side
  (x, y, r) => (y > 6 && y < 10) || ((x < 3 || x > 12) && y > 6) || (x < 3) ? plank(x, y, r, 0.8) : null, // 20 chair side
  (x, y, r) => x === 0 || x === 15 || y === 0 ? c(0x5a3c20) : x > 3 && x < 12 && y > 2 && y < 7 ? c(0xbfe3ff)
    : x === 12 && (y === 9 || y === 10) ? c(0xe0b030) : plank(x, y, r, 0.9), // 21 door
  (x, y, r) => y < 8 ? c(0xc0392b, 0.9 + r * 0.15) : plank(x, y, r),       // 22 bed side
  (_x, y, r) => y < 5 ? c(0xf4f4f4) : c(0xc0392b, 0.9 + r * 0.15),         // 23 bed top
  (x, y) => x > 2 && x < 13 && y > 1 && y < 15 ? c(y % 3 === 1 && x > 4 && x < 11 ? 0x9aa0b0 : 0xfafaf0) : null, // 24 paper
  (x, y) => x > 2 && x < 13 && y > 1 && y < 14 ? c(x < 5 ? 0x1c3f8a : y > 11 ? 0xf4f0e0 : y > 4 && y < 7 && x > 6 && x < 11 ? 0xe0b030 : 0x2a5ad0) : null, // 25 book
  (x, y) => Math.hypot(x - 7.5, y - 9) < 5 ? c(0xd42a20, x < 7 && y < 8 ? 1.2 : 1) : x === 8 && y > 1 && y < 5 ? c(0x5a3c20) : x > 8 && x < 12 && y === 3 ? c(0x3c8c32) : null, // 26 apple
  (x, y) => Math.hypot((x - 7.5) * 1.3, y - 8) < 6 ? c(0xf6ead2, x < 7 && y < 7 ? 1 : 0.92) : null, // 27 egg
  (x, y) => y > 7 && y < 13 && x > y - 8 && x < 23 - y ? c(0x8a5a36, y === 8 ? 0.7 : 1) : x === 8 && y > 1 && y < 8 ? c(0x5a3c20) : x > 8 && x < 13 && y > 2 && y < 7 && x - 8 < 8 - y ? c(0xf4f4f4) : null, // 28 boat
  (x, y) => Math.hypot((x - 7) / 1.8, y - 8) < 3 ? (x === 4 && y === 7 ? c(0x111111) : c(0x6fa8dc, y < 8 ? 0.8 : 1.1))
    : x > 11 && x < 15 && Math.abs(y - 8) < x - 10 ? c(0x4a7ab0) : null,    // 29 fish
  (x, y) => x + y === 15 && x > 1 ? c(0x7a5230) : x === 14 && y > 1 && y < 11 ? c(0xdddddd) : x > 12 && y > 10 && y < 13 ? c(0xd42a20) : null, // 30 fishing rod
  flower(0xffd640, 0xe07820),                                               // 31 yellow flower
  flower(0x4a7af0, 0xffffff),                                               // 32 blue flower
  (x, y) => x > 4 && x < 11 && y > 2 && y < 14 ? c(x === 5 || x === 10 || y === 13 ? 0xbfe3ff : y < 5 ? 0xdcf0ff : 0xffffff) : null, // 33 glass of milk
  (x, y, r) => x === 0 || y === 0 || x === 15 || y === 15 ? c(0x8a5a36) // 34 blackboard
    : (y === 4 && x > 2 && x < 10) || (y === 7 && x > 2 && x < 13) || (y === 10 && x > 2 && x < 8) ? c(0xe8f0e8) : c(0x1f4a35, 0.9 + r * 0.15),
  (x, y) => (x * 7 + y * 3) % 11 === 0 && x > 2 && x < 13 && y > 4 && y < 13 ? c(0x6b4a2a) : (x * 7 + y * 3) % 11 === 1 && x > 2 && x < 13 && y > 4 && y < 13 ? c(0xc49a5a) : null, // 35 seeds
  (x, y) => (x === 7 || x === 8) && y > 8 ? c(0x3c8c32) : y > 5 && y < 10 && Math.abs(x - 7.5) < 10 - y + 1 && Math.abs(x - 7.5) > 1 ? c(0x6fbf3a) : null, // 36 sprout
  (x, y) => x % 4 === 1 ? (y < 6 ? c(0xe8c040, y % 2 ? 1 : 0.8) : c(0xb89a3a)) : x % 4 === 2 && y < 5 && y > 0 ? c(0xd4a830) : null, // 37 wheat
  (x, y) => Math.hypot((x - 7.5) / 1.5, y - 9) < 4 ? c(0xc8873a, y < 8 ? 1.15 : x % 4 === 0 && y < 10 ? 0.7 : 1) : null, // 38 bread
  (x, y) => x > 2 && x < 13 && y > 5 && y < 14 ? c(y < 8 ? 0xfff0f0 : y === 10 ? 0xfff0f0 : 0xd98a4a) : (x === 7 || x === 8) && y > 2 && y < 6 ? c(0xd42a20) : null, // 39 cake
  (x, y) => Math.hypot((x - 7) / 1.8, y - 7) < 3 ? c(0xc8702a, (x + y) % 3 ? 1 : 0.7) : x > 11 && x < 15 && Math.abs(y - 7) < x - 10 ? c(0xa85a20) : x + y === 20 && x > 4 ? c(0x7a5230) : null, // 40 grilled fish
  (_x, _y, r) => c(0xf4f8ff, 0.93 + r * 0.07),                              // 41 snow
  (x, y, r) => c(0xf0ece0, (x + y) % 3 ? 0.95 + r * 0.05 : 0.85),              // 42 wool
  ...[0xd42a20, 0xf2c230, 0x2a5ad0].map(col => (x: number, y: number, r: number) => c(col, (x % 4 === 0 || y % 4 === 0 ? 0.8 : 0.95) + r * 0.08)), // 43-45 red, yellow, blue cloth
  (x, y, r) => x === 0 || x === 15 || y === 0 || y === 15 || y === 5 ? c(0x5a3c20) : (x === 7 || x === 8) && y > 3 && y < 9 ? c(0xf2c230) : c(0xa9793f, 0.9 + r * 0.15), // 46 chest
  (x, y) => (x === 7 || x === 8) && y > 7 ? c(0x7a5230) : Math.hypot(x - 7.5, y - 5) < 3.6 ? c(0x3c9c3c, (x + y) % 2 ? 1 : 0.85) : null, // 47 sapling
  (x, y) => x > 4 && x < 11 ? c(0x3f8f3a, x === 6 || x === 9 ? 0.75 : 1) : (y === 6 || y === 7) && (x > 1 && x < 14) ? c(0x3f8f3a) : (x === 2 || x === 13) && y > 2 && y < 8 ? c(0x3f8f3a) : null, // 48 cactus
  (x, y) => x > 1 && x < 14 && y > 3 && y < 13 ? c(Math.abs(x - 7.5) < y - 3 && y < 9 ? 0xd8d2c0 : x === 2 || x === 13 || y === 4 || y === 12 ? 0xc8c0a8 : 0xf4f0e0) : null, // 49 letter
  ...[0x1c1c1c, 0xc8783a].map(ore => (x: number, y: number, r: number) => (x * 7 + y * 13) % 11 < 2 || (x * 3 + y * 5) % 17 === 0 ? c(ore, 0.9 + r * 0.3) : c(0x8c8c8c, 0.8 + Math.floor(r * 4) / 4 * 0.35)), // 50 coal, 51 iron: specks in stone
  (x, y, r) => x > 3 && x < 12 && y > 6 && y < 13 ? (y > 9 ? c(0xff8a20, 0.8 + r * 0.4) : c(0x1c1c1c)) : c(0x8c8c8c, 0.8 + Math.floor(r * 4) / 4 * 0.35), // 52 stove side
  (x, y, r) => Math.hypot(x - 7.5, y - 7.5) < 5 ? c(0x2a2a2a, 0.9 + r * 0.2) : c(0x8c8c8c, 0.8 + Math.floor(r * 4) / 4 * 0.35), // 53 stove top
  (x, y, r) => y % 8 === 7 || x === 0 || x === 15 ? c(0x8a5a36) : c([0xc0392b, 0x2a5ad0, 0x3c8c32, 0xe0b030, 0x7b1fa2][(x + (y >> 3) * 2) % 5], x % 2 ? 1 : 0.85 + r * 0.1), // 54 bookshelf
  (x, y) => x < 2 || x > 13 || y < 2 || y > 13 || x === 7 || x === 8 || y === 7 || y === 8 ? c(0xa9793f) : (x + y) % 9 === 0 ? c(0xdcf0ff) : null, // 55 window
  (x, y, r) => (x * 5 + y * 7) % 13 < 2 ? c(0x9a8a70, 0.8) : c(0xc8b48a, 0.88 + r * 0.2), // 56 path: packed earth and pebbles
]

export function makeAtlas(): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const ctx = cv.getContext('2d')!, img = ctx.createImageData(128, 128)
  TILES.forEach((f, t) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const px = f(x, y, Math.random())
      if (px) img.data.set(px.map(v => Math.min(255, v)), ((t >> 3) * 16 + y) * 512 + ((t % 8) * 16 + x) * 4)
    }
  })
  ctx.putImageData(img, 0, 0)
  return cv
}
