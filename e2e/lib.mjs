// Shared helpers for the browser checks. They drive the built game in headless Chrome (software GL) through
// the debug handle `window.cubedao` that src/main.ts exposes.
import { chromium } from 'playwright-core'

export const PORT = 4173
/** open the game with a given save (default: fresh, past the welcome card), start it, and return helpers */
export async function open(save = {}) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  const errs = []
  pg.on('console', m => m.type() === 'error' && errs.push(m.text()))
  pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
  // seed the save before the game's first load (the game saves on pagehide, so a reload would overwrite it)
  await pg.addInitScript(s => { if (!sessionStorage.seeded) { localStorage.setItem('cubedao', JSON.stringify({ welcomed: true, ...s })); sessionStorage.seeded = 1 } }, save)
  await pg.goto(`http://localhost:${PORT}/`)
  await pg.waitForFunction(() => window.cubedao)
  await pg.click('#play'); await pg.waitForTimeout(400)
  const txt = id => pg.textContent(id)
  const click = async (button = 'left') => { await pg.mouse.down({ button }); await pg.mouse.up({ button }); await pg.waitForTimeout(250) }
  return { browser, pg, errs, txt, click }
}
