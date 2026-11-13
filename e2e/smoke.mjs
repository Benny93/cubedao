// Fresh load, start, step back, dig one block, open and close every panel, pause into the menu; a new player's welcome card. Fails on any page error.
import { open } from './lib.mjs'

export async function smoke() {
  const { browser, pg, errs, txt } = await open()
  await pg.keyboard.down('KeyS'); await pg.waitForTimeout(300); await pg.keyboard.up('KeyS')
  await pg.mouse.move(640, 360); await pg.mouse.move(640, 660, { steps: 3 })
  await pg.mouse.down(); await pg.mouse.up(); await pg.waitForTimeout(250)
  for (const k of ['KeyE', 'KeyE', 'KeyB', 'KeyB', 'KeyC', 'KeyC', 'KeyQ', 'KeyQ', 'KeyM', 'KeyM']) { await pg.keyboard.press(k); await pg.waitForTimeout(150) }
  const dug = (await txt('#hotbar')).length > 0, locked = await pg.evaluate(() => !!document.pointerLockElement)
  // pause: the menu comes back; its settings page switches the music off, and Back returns to the main page
  await pg.waitForTimeout(1500) // a lock retried after the panel toggles (Chrome waits ~1 s) must land first, or it would hide the menu again
  await pg.evaluate(() => document.exitPointerLock()); await pg.waitForTimeout(300)
  await pg.click('[data-go=opts]'); await pg.click('[data-o=music]'); await pg.click('[data-page=opts] .back')
  const menu = await pg.evaluate(() => window.cubedao.state.opts.music === 1 && !document.querySelector('[data-page=main]').hidden && document.querySelector('#playzh').textContent === '继续')
  await browser.close()
  // a brand-new player gets the welcome card first; its button starts the game
  const w = await open({ welcomed: false })
  const card = await w.pg.isVisible('#panel .welcome')
  await w.pg.click('#panel [data-a=close]'); await w.pg.waitForTimeout(400)
  const welcome = card && await w.pg.evaluate(() => !!document.pointerLockElement)
  errs.push(...w.errs); await w.browser.close()
  const ok = errs.length === 0 && dug && locked && menu && welcome
  console.log(ok ? 'smoke: ok' : `smoke: FAILED (dug a block: ${dug}, pointer locked: ${locked}, menu: ${menu}, welcome card: ${welcome})`, errs)
  return ok
}
