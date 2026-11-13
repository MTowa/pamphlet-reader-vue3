import { spawn } from 'node:child_process'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const root = process.env.FLIPBOOK_CONSUMER_ROOT
if (!root) throw new Error('Run through test:package with isolated consumer directories.')

for (const [app, port, base, args] of [
  ['vue-app', 4183, '/demo/', ['node_modules/vite/bin/vite.js', '--strictPort']],
  ['nuxt-app', 4184, '/nuxt-demo/', ['node_modules/nuxt/bin/nuxt.mjs', 'dev', '--no-fork']],
]) {
  const cwd = path.join(root, app)
  const extra = path.join(cwd, 'public/pamphlet/007-dev-check.svg')
  const server = spawn(process.execPath, [...args, '--host', '127.0.0.1', '--port', String(port)], {
    cwd,
    env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const collect = (chunk) => {
    output = (output + chunk).slice(-6000)
  }
  server.stdout.on('data', collect)
  server.stderr.on('data', collect)
  const exited = new Promise((resolve, reject) => {
    server.once('exit', resolve)
    server.once('error', reject)
  })
  async function waitForPages(expected) {
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      if (server.exitCode !== null) throw new Error(app + ' exited early:\n' + output)
      try {
        const response = await fetch(`http://127.0.0.1:${port}${base}pamphlet/flipbook.json`, {
          signal: AbortSignal.timeout(2000),
        })
        const index = await response.json()
        if (
          index.pages.length === expected &&
          (expected !== 7 || index.pages.at(-1) === '007-dev-check.svg')
        )
          return
      } catch {
        /* Server or regenerated index not ready. */
      }
      await delay(100)
    }
    throw new Error(app + ' did not serve ' + expected + ' pages:\n' + output)
  }
  let created = false
  try {
    await waitForPages(6)
    // Let the module attach its watcher before sending file events.
    const response = await fetch(`http://127.0.0.1:${port}${base}?format=svg`, {
      signal: AbortSignal.timeout(60_000),
    })
    if (!response.ok) throw new Error('Development app returned ' + response.status)
    await writeFile(extra, await readFile(path.join(cwd, 'public/pamphlet/001.svg')), {
      flag: 'wx',
    })
    created = true
    await waitForPages(7)
    await unlink(extra)
    await waitForPages(6)
    console.log('Verified development addition/deletion: ' + app)
  } finally {
    if (created)
      await unlink(extra).catch((error) => {
        if (error.code !== 'ENOENT') throw error
      })
    server.kill('SIGTERM')
    const kill = setTimeout(() => server.kill('SIGKILL'), 5000)
    await exited.finally(() => clearTimeout(kill))
  }
}
