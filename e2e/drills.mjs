// The blackboard's word exam through the real click path: clicking the blackboard opens it, five questions are
// answered, a wrong answer makes that word less known (its pinyin and English come back), and the result card
// shows the score and pays 两块钱 per right answer. Then the measure-word, tone, number, pinyin and sentence drills
// count their five rounds, end on the result card and pay the same way (saying a word needs a microphone: not here).
import { open } from './lib.mjs'

export async function drills() {
  const { browser, pg, errs, click } = await open({ money: 0 })
  const fails = []
  // stand in the pavilion a step and a half south of the blackboard, looking north at it
  await pg.evaluate(() => { const { p, world } = window.cubedao; Object.assign(p, { x: world.HOME.x - 1.5, y: world.HOME.y, z: world.HOME.z - 0.5, vy: 0, yaw: 0, pitch: 0 }) })
  await pg.waitForTimeout(300)
  await click()
  if (await pg.isHidden('#panel')) fails.push('clicking the blackboard did not open it')
  // answer the first option every time; sit the exam again until a wrong answer to a written word was seen (nearly always the first time)
  let score = 0, checked = 0
  for (let exam = 0; exam < 4 && !checked && !fails.length; exam++) {
    if (exam) { await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); await pg.evaluate(() => { const { p, world } = window.cubedao; Object.assign(p, { x: world.HOME.x - 1.5, y: world.HOME.y, z: world.HOME.z - 0.5, vy: 0, yaw: 0, pitch: 0 }) }); await pg.click('#play').catch(() => {}); await pg.waitForTimeout(300); await click() }
    await pg.click('#panel button[data-a="exam"]')
    for (let i = 0; i < 5; i++) {
      const hz = await pg.$('#panel p.big') && await pg.textContent('#panel p.big') // the word, when it is written rather than spoken
      const before = 5
      if (hz) await pg.evaluate(hz => { window.cubedao.state.seen[hz] = 5 }, hz) // well known, so what a wrong answer costs shows
      await pg.click('#panel .grid button[data-a="0"]')
      const ok = await pg.getAttribute('#panel .grid button[data-a="0"]', 'class') === 'ok'
      if (ok) score++
      else if (hz) {
        const after = await pg.evaluate(hz => window.cubedao.state.seen[hz], hz)
        const want = Math.max(0, before - 2) + (hz === '不对' ? 1 : 0) + (hz === '考试' ? 0.2 : 0) // a wrong answer costs it two; 不对 and 考试 are also said
        if (Math.abs(after - want) > 1e-9) fails.push(`wrong answer to ${hz}: known ${before} → ${after}, want ${want}`)
        checked++
      }
      await pg.click('#panel button[data-a="next"]')
    }
    const card = await pg.textContent('#panel')
    if (!await pg.isVisible('#panel p.big') || !card.includes(' / 五')) fails.push(`no result card: ${card}`)
    const money = await pg.evaluate(() => window.cubedao.state.money)
    if (money !== score * 2) fails.push(`paid ${money} for ${score} right`)
  }
  if (!checked) fails.push('never answered a written word wrongly')

  // the other drills: each counts its rounds 一 to 五 in the heading, ends on the result card, and pays two per right answer
  const board = async () => { await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); await pg.evaluate(() => { const { p, world } = window.cubedao; Object.assign(p, { x: world.HOME.x - 1.5, y: world.HOME.y, z: world.HOME.z - 0.5, vy: 0, yaw: 0, pitch: 0 }) }); await pg.click('#play').catch(() => {}); await pg.waitForTimeout(300); await click() }
  for (const kind of ['cl', 'tone', 'num', 'pinyin', 'compose']) {
    await board()
    if (await pg.isHidden('#panel button[data-a="exam"]')) { fails.push(`${kind}: blackboard did not open`); continue }
    await pg.click(`#panel button[data-a="${kind}"]`)
    const was = await pg.evaluate(() => window.cubedao.state.money)
    let right = 0
    for (let i = 0; i < 5; i++) {
      const h = await pg.textContent('#panel h2')
      if (!h.includes(`${'一二三四五'[i]} / 五`)) fails.push(`${kind} round ${i + 1}: heading ${h}`)
      if (kind === 'pinyin') { await pg.fill('#py', 'x'); await pg.press('#py', 'Enter'); await pg.press('#panel', 'Enter') } // always wrong; Enter again moves on
      else if (kind === 'compose') { // put the tiles back in the sentence's order: always right
        const n = await pg.$$eval('#panel .line:last-of-type button', bs => bs.length)
        for (let t = 0; t < n; t++) await pg.click(`#panel button[data-a="t${t}"]`)
        if (await pg.getAttribute('#panel button[data-a="u0"]', 'class') === 'ok') right++
        await pg.click('#panel button[data-a="next"]')
      } else {
        await pg.click('#panel .grid button[data-a="0"]')
        if (await pg.getAttribute('#panel .grid button[data-a="0"]', 'class') === 'ok') right++
        await pg.click('#panel button[data-a="next"]')
      }
    }
    const card = await pg.textContent('#panel'), paid = await pg.evaluate(() => window.cubedao.state.money) - was
    if (!await pg.isVisible('#panel p.big') || !card.includes(' / 五')) fails.push(`${kind}: no result card: ${card}`)
    if (paid !== right * 2 || (kind === 'compose' && right !== 5)) fails.push(`${kind}: paid ${paid} for ${right} right`)
  }
  await browser.close()
  const ok = fails.length === 0 && errs.length === 0
  console.log(ok ? 'drills: ok' : 'drills: FAILED', ok ? '' : JSON.stringify({ fails, errs }))
  return ok
}
