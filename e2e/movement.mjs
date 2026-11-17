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
  // the pad drops out (battery, Bluetooth) with the stick still pushed: walking stops
  await arena(0, 0)
  await pg.evaluate(() => { window.pad.axes = [0, -1, 0, 0] }); await pg.waitForTimeout(300); await pg.evaluate(() => { navigator.getGamepads = () => [] })
  await pg.waitForTimeout(100); const lost = await at(); await pg.waitForTimeout(500); s = await at()
  if (Math.abs(s.z - lost.z) > 0.01) fails.push('kept walking after the gamepad was gone')
  await pg.evaluate(() => { window.pad.axes = [0, 0, 0, 0]; navigator.getGamepads = () => [window.pad] })
  // holding dig on the treasure chest opens it once: the +50 stays on screen, no "the chest is empty" right after
  await pg.evaluate(() => { const { p, world } = window.cubedao, s = world.SPOTS.islet; Object.assign(p, { x: s.x, z: s.z, y: s.y, vy: 0 }) })
  await pg.waitForTimeout(1500) // landed: now look at the chest, two blocks north
  await pg.evaluate(() => { const { p, world } = window.cubedao, s = world.SPOTS.islet, cx = Math.floor(s.x) + 0.5, cz = Math.floor(s.z - 2) + 0.5, cy = s.y + 0.5
    p.pitch = -Math.atan2(p.y + 1.62 - cy, Math.hypot(p.x - cx, p.z - cz)); p.yaw = Math.atan2(-(cx - p.x), -(cz - p.z)) })
  await pg.waitForTimeout(300)
  await pg.mouse.down(); await pg.waitForTimeout(700); await pg.mouse.up(); await pg.waitForTimeout(100)
  const chest = await pg.evaluate(() => [window.cubedao.state.money, document.getElementById('toast').textContent])
  if (chest[0] !== 50 || !chest[1].includes('+')) fails.push(`chest: ${JSON.stringify(chest)}`)
  // digging next to water lets it in; the last brick placed leaves the hand empty (no silent switch to the grass in the bag)
  await arena(0, 0)
  const aim = () => pg.evaluate(() => { const { p } = window.cubedao; Object.assign(p, { x: 128.5, y: 41, z: 101.5, yaw: 0, pitch: -Math.atan2(1.62 - 0.5, 2) }) }) // at the cell two north
  await pg.evaluate(() => { const { state, setBlock } = window.cubedao; state.inv = { 1: 5, 10: 1 }; setBlock(128, 41, 98, 5); setBlock(128, 41, 99, 2) })
  await aim(); await pg.waitForTimeout(200); await pg.mouse.down(); await pg.mouse.up(); await pg.waitForTimeout(200)
  const wet = await pg.evaluate(() => window.cubedao.world.get(128, 41, 99))
  if (wet !== 5) fails.push(`no water ran into the dug cell: ${wet}`)
  await pg.keyboard.press('Digit3'); await pg.waitForTimeout(100) // the brick (in id order: 1 grass, 2 dirt, 10 brick)
  await aim(); await pg.waitForTimeout(200); await pg.keyboard.press('KeyF'); await pg.waitForTimeout(200)
  const hand = await pg.evaluate(() => [window.cubedao.state.inv[10] ?? 0, !!document.querySelector('#hotbar .sel'), window.cubedao.state.inv[1]])
  if (hand[0] !== 0 || hand[1] || hand[2] !== 5) fails.push(`hand after the last brick: ${JSON.stringify(hand)}`)
  await pg.mouse.wheel(0, -100); await pg.waitForTimeout(150) // scrolling back from the empty hand picks the last item (dirt), not the one before it
  const back = await pg.evaluate(() => document.querySelector('#hotbar .sel')?.dataset.id)
  if (back !== '2') fails.push(`scrolled back from an empty hand to ${back}, want 2 (dirt)`)
  // saved while sailing: still in the boat after a reload (a fresh game started from that save)
  const [sx, sz, SEA, WORLD_V] = await pg.evaluate(() => { // open sea near the island: deep water in a 3×3 around the spot
    const { world } = window.cubedao, deep = (x, z) => world.get(x, world.SEA - 1, z) === 5 && world.get(x, world.SEA - 4, z) === 5
    for (let r = 40; r < 120; r++) for (let a = 0; a < 64; a++) {
      const x = Math.round(world.HOME.x + r * Math.cos(a / 10)), z = Math.round(world.HOME.z + r * Math.sin(a / 10))
      if ([-1, 0, 1].every(dx => [-1, 0, 1].every(dz => deep(x + dx, z + dz)))) return [x + 0.5, z + 0.5, world.SEA, world.WORLD_V]
    }
  })
  const boat = await open({ pos: [sx, SEA + 0.05, sz, 0, 0], world: WORLD_V }) // a save of another world version starts over at home
  await boat.pg.waitForTimeout(800)
  const afloat = await boat.pg.evaluate(() => window.cubedao.p.y - window.cubedao.world.SEA)
  if (Math.abs(afloat - 0.05) > 0.01) fails.push(`out of the boat after a reload (y ${afloat.toFixed(2)} above the sea)`)
  errs.push(...boat.errs); await boat.browser.close()
  // a clear night with the head under water: the murk hides the stars, like the sun, moon and clouds
  await arena(5, 5)
  await pg.evaluate(() => { const { setBlock, setClock } = window.cubedao; for (let x = 121; x < 136; x++) for (let z = 93; z < 108; z++) for (let y = 41; y < 45; y++) setBlock(x, y, z, 5); setClock(280) })
  await pg.waitForTimeout(500)
  if (await pg.evaluate(() => window.cubedao.stars.visible)) fails.push('stars shine through the water')

  await browser.close()
  const ok = fails.length === 0 && errs.length === 0
  console.log(ok ? 'movement: ok' : 'movement: FAILED', ok ? '' : JSON.stringify({ fails, errs }))
  return ok
}
