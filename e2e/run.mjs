// npm run e2e: serve the production build, run the browser checks, stop the server.
// Needs Google Chrome installed (playwright-core drives it; no browser download).
import { spawn } from 'node:child_process'
import { PORT } from './lib.mjs'
import { smoke } from './smoke.mjs'
import { playthrough } from './playthrough.mjs'
import { movement } from './movement.mjs'
import { drills } from './drills.mjs'

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
let ok = false
try {
  for (let i = 0; i < 50; i++) { // wait for the server
    if (await fetch(`http://localhost:${PORT}/`).then(r => r.ok, () => false)) break
    await new Promise(r => setTimeout(r, 200))
  }
  ok = await smoke() && await movement() && await drills() && await playthrough()
} finally {
  server.kill()
}
process.exit(ok ? 0 : 1)
