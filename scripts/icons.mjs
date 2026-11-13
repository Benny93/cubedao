// node scripts/icons.mjs: render public/icon.svg onto the splash's dark background as PNGs (home-screen / install icons)
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const svg = readFileSync('public/icon.svg', 'utf8')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
for (const size of [180, 192, 512]) {
  const pg = await browser.newPage({ viewport: { width: size, height: size } })
  await pg.setContent(`<body style="margin:0"><div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#1d4a5e 0,#0d2333 60%,#050c14 100%)">
    <img style="width:78%;height:78%" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></div></body>`)
  await pg.waitForTimeout(200)
  await pg.screenshot({ path: `public/${size === 180 ? 'apple-touch-icon' : 'icon-' + size}.png` })
}
await browser.close()
