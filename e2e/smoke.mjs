// Fresh load, start, step back, dig one block, open and close every panel, pause into the menu; a new player's welcome card. Fails on any page error.
import { open, PORT } from './lib.mjs'
import { chromium } from 'playwright-core'

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
  // an achievement the save already earned (here: 100 块钱, from before achievements were kept) survives spending the money
  const r = await open({ money: 150 })
  await r.pg.evaluate(() => { window.cubedao.state.money = 0 })
  await r.pg.reload(); await r.pg.waitForFunction(() => window.cubedao)
  const kept = await r.pg.evaluate(() => [...document.querySelectorAll('#ach .ach.on')].some(e => [...e.querySelectorAll('ruby')].map(r => r.firstChild.textContent).join('') === '有钱人'))
  errs.push(...r.errs); await r.browser.close()
  // the dictionary lists the words you have met (seen once or more), not ones only glimpsed (a verb said in passing)
  const d = await open({ seen: { '猫': 5, '跑': 0.2 } })
  await d.pg.keyboard.press('KeyC'); await d.pg.waitForTimeout(300)
  const dict = await d.pg.evaluate(() => !!document.querySelector('#panel [data-a="猫"]') && !document.querySelector('#panel [data-a="跑"]'))
  errs.push(...d.errs); await d.browser.close()
  // import turns away text that would stop the game from starting or break the counts
  let refused = true
  for (const bad of ['{"inv":{},"seen":{},"pos":5}', '{"inv":{"1":"5"},"seen":{}}', '{"inv":{"9999":1},"seen":{}}']) {
    const b = await open(), alerts = []
    b.pg.on('dialog', dg => { if (dg.type() === 'prompt') dg.accept(bad); else { alerts.push(dg.message()); dg.accept() } })
    await b.pg.evaluate(() => document.exitPointerLock()); await b.pg.waitForTimeout(300)
    await b.pg.click('[data-go=save]'); await b.pg.click('[data-o=import]'); await b.pg.waitForTimeout(800)
    if (!alerts.includes('That is not a CubeDao save.')) refused = false
    await b.browser.close()
  }
  // the learner's language: picking Deutsch in the settings reloads the game with German help text and meanings
  const l = await open()
  await l.pg.evaluate(() => document.exitPointerLock()); await l.pg.waitForTimeout(300)
  await l.pg.click('[data-go=opts]'); await l.pg.selectOption('[data-o=lang]', '1'); await l.pg.waitForTimeout(500); await l.pg.waitForFunction(() => window.cubedao)
  const lang = await l.pg.evaluate(() => window.cubedao.state.opts.lang === 1 && document.querySelector('[data-go=how] small').textContent === 'So wird gespielt'
    && window.cubedao.NPCS.teacher.w.en === 'Lehrer' && /^Hallo!/.test(window.cubedao.quest('teacher').en))
  errs.push(...l.errs); await l.browser.close()
  // sleeping in a bed at night: the day's card lists the words met that day (狗 is new, 猫 was known in the morning) and keeps them after one is clicked
  const n = await open({ seen: { '猫': 5, '狗': 3 }, dayFrom: { words: 1, done: 0, money: 0, met: ['猫'] }, clock: 280 })
  await n.pg.evaluate(() => {
    const { p, world, setBlock } = window.cubedao, x = world.HOME.x + 2, z = world.HOME.z - 1, y = world.HOME.y
    Object.assign(p, { x: x + 0.5, y, z: z + 0.5, vy: 0, yaw: 0, pitch: -1.5 }) // standing on the bed, looking down at it
    setBlock(x, y - 1, z, 21) // BED
  })
  await n.pg.waitForTimeout(300); await n.pg.keyboard.press('KeyF'); await n.pg.waitForTimeout(400)
  const words = () => n.pg.evaluate(() => [...document.querySelectorAll('#panel .grid button')].map(b => b.dataset.a).join())
  const listed = await words()
  if (listed) { await n.pg.click('#panel .grid button'); await n.pg.waitForTimeout(200) }
  const day = listed.split(',').includes('狗') && !listed.split(',').includes('猫') && await words() === listed
  errs.push(...n.errs); await n.browser.close()
  // digging up the bed you sleep in takes 家 off the map
  const h = await open()
  const bed = await h.pg.evaluate(async () => {
    const { p, world, setBlock, state } = window.cubedao, x = world.HOME.x + 2, y = world.HOME.y - 1, z = world.HOME.z - 1
    setBlock(x, y, z, 21); state.home = [x, y, z] // the floor under you is your bed, and your home
    Object.assign(p, { x: x + 0.5, y: y + 1, z: z + 0.5, vy: 0, yaw: 0, pitch: -1.5 }) // standing on it, looking down
    await new Promise(r => setTimeout(r, 300)); return [x, y, z]
  })
  await h.pg.mouse.down(); await h.pg.mouse.up(); await h.pg.waitForTimeout(300)
  const home = await h.pg.evaluate(bed => [window.cubedao.state.home === undefined, window.cubedao.world.get(...bed)], bed)
  errs.push(...h.errs); await h.browser.close()
  // two tabs: progress made in one is not undone when the other, idle one is closed (it reloads the newer save instead)
  const tb2 = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const ctx = await tb2.newContext({ viewport: { width: 1000, height: 600 } })
  await ctx.addInitScript(() => { if (!localStorage.cubedao) localStorage.setItem('cubedao', JSON.stringify({ welcomed: true, money: 5 })) })
  const B = await ctx.newPage(); await B.goto(`http://localhost:${PORT}/`); await B.waitForFunction(() => window.cubedao)
  const A = await ctx.newPage(); await A.goto(`http://localhost:${PORT}/`); await A.waitForFunction(() => window.cubedao)
  A.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); B.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
  await A.evaluate(() => { window.cubedao.state.money = 999; dispatchEvent(new Event('pagehide')) }) // A saves
  await B.waitForTimeout(1500); await B.waitForFunction(() => window.cubedao)
  await B.close({ runBeforeUnload: true }); await A.waitForTimeout(300)
  const tabs = await A.evaluate(() => JSON.parse(localStorage.cubedao).money) === 999
  await tb2.close()
  const ok = errs.length === 0 && dug && locked && menu && welcome && kept && dict && refused && lang && day && tabs && home[0] && home[1] === 0
  console.log(ok ? 'smoke: ok' : `smoke: FAILED (dug a block: ${dug}, pointer locked: ${locked}, menu: ${menu}, welcome card: ${welcome}, achievement kept: ${kept}, dictionary: ${dict}, bad import refused: ${refused}, German: ${lang}, day card: ${day}, two tabs: ${tabs}, home gone with its bed: ${home})`, errs)
  return ok
}
