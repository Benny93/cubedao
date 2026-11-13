// Play every villager's whole quest line to the festival. Items for fetch quests and the counters of "do this"
// quests are granted directly (gathering and each action have their own checks); talking, finding the right
// animal and carrying letters go through the real click path. Catches soft-locks in the quest data.
import { open } from './lib.mjs'

export async function playthrough() {
  const { browser, pg, errs, txt, click } = await open()
  const ev = (f, a) => pg.evaluate(f, a)
  // stand next to a mob (villager key or mob index) and aim at it; true once the crosshair label is on it
  async function face(sel) {
    for (const [ox, oz] of [[0, 1.7], [1.7, 0], [-1.7, 0], [0, -1.7], [1.2, 1.2], [-1.2, 1.2]]) {
      const hz = await ev(([sel, ox, oz]) => {
        const { p, mobs } = window.cubedao, m = typeof sel === 'string' ? mobs.find(m => m.npc === sel) : mobs[sel]
        m.speed = 0; m.t = 1e9; if (m.roam) { m.roam.tx = m.x; m.roam.tz = m.z }
        const px = m.x + ox, pz = m.z + oz
        Object.assign(p, { x: px, z: pz, y: m.y, vy: 0, yaw: Math.atan2(-(m.x - px), -(m.z - pz)), pitch: -Math.atan2(1.62 - m.h / 2, Math.hypot(ox, oz)) })
        return m.w.hz
      }, [sel, ox, oz])
      await pg.waitForTimeout(160)
      const label = await pg.evaluate(() => [...document.querySelectorAll('#label ruby')].map(r => r.firstChild.textContent).join(''))
      if (label.endsWith(hz)) return true
    }
    return false
  }
  const keys = await ev(() => Object.keys(window.cubedao.NPCS))
  const need = await ev(() => Object.fromEntries(Object.entries(window.cubedao.NPCS).map(([k, n]) => [k, n.asks.length])))
  const fails = []
  let steps = 0
  for (let round = 0; round < 40; round++) {
    const todo = keys.filter(k => true)
    let progressed = false
    for (const k of todo) {
      const st = await ev(k => { const { state, quest } = window.cubedao, q = quest(k); return { i: state.quests[k] ?? 0, act: q.act, deliver: q.deliver, find: q.find?.hz, size: q.size?.hz, item: q.item, n: q.n } }, k)
      if (st.i >= need[k]) continue
      if (st.act) { // hear it, do it (counted directly here; each action is tested on its own elsewhere), report back
        if (!await face(k)) { fails.push(`${k}#${st.i}: cannot face`); continue }
        await click()
        const before = await ev(k => window.cubedao.state.quests[k] ?? 0, k)
        if (before !== st.i) { fails.push(`${k}#${st.i}: act quest completed before doing anything`); continue }
        await ev(([act, n]) => { const d = window.cubedao.state.did; d[act] = (d[act] ?? 0) + n }, [st.act, st.n])
        await click()
      } else if (st.deliver) {
        if (!await face(k)) { fails.push(`${k}#${st.i}: cannot face sender`); continue }
        await click()
        if (!await face(st.deliver)) { fails.push(`${k}#${st.i}: cannot face ${st.deliver}`); continue }
        await click()
      } else if (st.find) {
        if (!await face(k)) { fails.push(`${k}#${st.i}: cannot face`); continue }
        await click()
        const idxs = await ev(([hz, size]) => window.cubedao.mobs.map((m, i) => m.w.hz === hz && (!size || m.size?.hz === size) ? i : -1).filter(i => i >= 0), [st.find, st.size])
        let done = false
        for (const i of idxs) {
          // animals spawn at random and may stand in a thicket: bring this one onto the open school floor first
          // (and put it back afterwards, so the next animal does not stand inside it)
          const was = await ev(i => { const { mobs, world } = window.cubedao, m = mobs[i], was = [m.x, m.y, m.z]; m.x = world.HOME.x + 2.5; m.z = world.HOME.z - 1.5; m.y = world.HOME.y; return was }, i)
          await pg.waitForTimeout(120)
          const seen = await face(i)
          if (seen) await click()
          await ev(([i, was]) => { const m = window.cubedao.mobs[i]; [m.x, m.y, m.z] = was }, [i, was])
          if (seen) { done = true; break }
        }
        if (!done) { fails.push(`${k}#${st.i}: no reachable ${st.size ?? ''}${st.find} (${idxs.length} candidates)`); continue }
      } else {
        await ev(([item, n]) => { window.cubedao.state.inv[item] = n }, [st.item, st.n])
        if (!await face(k)) { fails.push(`${k}#${st.i}: cannot face`); continue }
        await click()
      }
      await pg.waitForTimeout(80)
      const now = await ev(k => window.cubedao.state.quests[k] ?? 0, k)
      if (now === st.i + 1) { progressed = true; steps++ } else fails.push(`${k}#${st.i}: did not advance (${JSON.stringify(st)}) toast=${(await txt('#toast')).replace(/[^一-鿿。！？]/g, '')}`)
    }
    if (!progressed) break
  }
  await pg.waitForTimeout(3800)
  const end = await ev(() => { const { state } = window.cubedao; return { quests: state.quests, won: state.won, letters: Object.keys(state.letters).length + (state.inv[48] ?? 0) } })
  // lines without a Kokoro clip of their own: add them to scripts/voice-lines.ts
  const { unvoiced, pieced } = await ev(() => ({ unvoiced: [...window.cubedao.unvoiced], pieced: [...window.cubedao.pieced] }))
  if (unvoiced.length) console.log(`playthrough: ${unvoiced.length} lines fell back to the browser voice:`, unvoiced.join(' · '))
  if (pieced.length) console.log(`playthrough: ${pieced.length} lines were said word by word:`, pieced.join(' · '))
  await browser.close()
  // a click on a villager who is owed a letter delivers it first; that shows up here as a retry, not a failure
  const real = fails.filter(f => !f.includes('did not advance') && !f.includes('before doing anything'))
  const ok = end.won && end.letters === 0 && errs.length === 0 && real.length === 0
  console.log(ok ? `playthrough: ok (${steps} quests, festival reached)` : 'playthrough: FAILED', ok ? '' : JSON.stringify({ end, real, errs }))
  return ok
}
