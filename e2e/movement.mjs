// Walking against a wall ends flush with it, a one-block ledge is hopped onto, wading out of shallow water climbs
// the step onto the shore, and a gamepad's left stick walks. Built on a stone floor high above the island.
import { open } from './lib.mjs'

export async function movement() {
  const { browser, pg, errs } = await open()
  await pg.evaluate(() => { window.pad = { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) }; navigator.getGamepads = () => [window.pad] })
  // floor at y 40 over x 120..136, z 92..108, walled in; y 41 holds `ledge` for z <= 95 and `pool` elsewhere (0 air, 3 stone, 5 water)
  const arena = (ledge, pool) => pg.evaluate(([ledge, pool]) => {
    const { p, setBlock } = window.cubedao
    for (let x = 120; x <= 136; x++) for (let z = 92; z <= 108; z++) {
      setBlock(x, 40, z, 3)
      for (let y = 41; y < 45; y++) setBlock(x, y, z, x === 120 || x === 136 || z === 92 || z === 108 ? 3 : y === 41 ? (z <= 95 ? ledge : pool) : 0)
    }
    Object.assign(p, { x: 128.5, y: 41, z: 100.5, vy: 0, yaw: 0, pitch: 0 })
  }, [ledge, pool])
  const walk = async (key, ms = 2200) => { await pg.keyboard.down(key); await pg.waitForTimeout(ms); await pg.keyboard.up(key) }
  const at = () => pg.evaluate(() => { const { p } = window.cubedao; return { x: p.x, y: p.y, z: p.z } })
  const fails = []

  await arena(0, 0) // empty room: run north into the wall
  await walk('KeyW')
  let s = await at()
  if (Math.abs(s.z - 93.3) > 0.01) fails.push(`stopped ${(s.z - 93.3).toFixed(2)} short of the wall`)
  await arena(3, 0) // a stone ledge one block high along the north wall
  await walk('KeyW')
  s = await at()
  if (s.y !== 42) fails.push(`did not hop onto the ledge (y ${s.y})`)
  await arena(3, 5) // shallow water, one deep, up to the ledge
  await pg.waitForTimeout(500)
  await walk('KeyW', 3000)
  s = await at()
  if (s.y !== 42) fails.push(`stuck in the shallows (y ${s.y.toFixed(2)})`)
  await arena(0, 0)
  await pg.evaluate(() => { window.pad.axes = [0, -1, 0, 0] }); await pg.waitForTimeout(500); await pg.evaluate(() => { window.pad.axes = [0, 0, 0, 0] })
  s = await at()
  if (s.z > 99.5) fails.push('the gamepad stick did not walk')

  await browser.close()
  const ok = fails.length === 0 && errs.length === 0
  console.log(ok ? 'movement: ok' : 'movement: FAILED', ok ? '' : JSON.stringify({ fails, errs }))
  return ok
}
