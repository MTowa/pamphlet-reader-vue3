import { spawnSync } from 'node:child_process'
import { openSync, closeSync, readFileSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = fileURLToPath(new URL('..', import.meta.url))
const artifacts = path.join(root, '.artifacts')
await mkdir(artifacts, { recursive: true })
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const library = path.join(root, 'packages/vue-flipbook')
const libManifest = JSON.parse(await readFile(path.join(library, 'package.json'), 'utf8'))
const consumers = await mkdtemp(path.join(tmpdir(), 'vue-flipbook-consumers-'))
let sequence = 0

function run(command, args, cwd, extraEnv = {}) {
  const log = path.join(artifacts, 'package-check-' + ++sequence + '.log')
  console.log('Running ' + command + ' ' + args.join(' ') + ' (log: ' + path.basename(log) + ')')
  const fd = openSync(log, 'w')
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1', ...extraEnv },
    stdio: ['ignore', fd, fd],
  })
  closeSync(fd)
  if (result.error || result.status !== 0) {
    console.error(readFileSync(log, 'utf8').slice(-16000))
    throw result.error ?? new Error(command + ' failed with exit ' + result.status)
  }
  return log
}

// Explicit typecheck: declaration plugins may print diagnostics without failing.
run(
  process.execPath,
  [
    path.join(root, 'node_modules/vue-tsc/bin/vue-tsc.js'),
    '--noEmit',
    '-p',
    path.join(library, 'tsconfig.json'),
  ],
  root,
)
run(
  process.execPath,
  [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--logLevel', 'warn'],
  library,
)
run(process.execPath, [path.join(root, 'scripts/package-notices.mjs')], root)
const packLog = run(
  'npm',
  ['pack', '--ignore-scripts', '--json', '--pack-destination', artifacts],
  library,
)
const packed = JSON.parse(await readFile(packLog, 'utf8'))[0]
const tarball = path.join(artifacts, packed.filename)
const names = packed.files.map((entry) => entry.path)
for (const required of [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/style.css',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
]) {
  if (!names.includes(required)) throw new Error('Missing package file: ' + required)
}
if (names.some((name) => name.startsWith('src/') || name.startsWith('node_modules/')))
  throw new Error('Unexpected source or node_modules in tarball')

for (const app of ['vue-app', 'nuxt-app']) {
  const original = path.join(root, 'playground', app)
  const destination = path.join(consumers, app)
  await cp(original, destination, {
    recursive: true,
    filter: (source) =>
      !['node_modules', 'dist', '.nuxt', '.output'].includes(path.basename(source)),
  })
  const deps = { [libManifest.name]: 'file:' + tarball, vue: manifest.devDependencies.vue }
  const dev = {
    typescript: manifest.devDependencies.typescript,
    'vue-tsc': manifest.devDependencies['vue-tsc'],
    '@types/node': manifest.devDependencies['@types/node'],
  }
  if (app === 'vue-app') {
    dev.vite = manifest.devDependencies.vite
    dev['@vitejs/plugin-vue'] = manifest.devDependencies['@vitejs/plugin-vue']
    await cp(path.join(root, 'tsconfig.base.json'), path.join(destination, 'tsconfig.base.json'))
    const config = JSON.parse(await readFile(path.join(destination, 'tsconfig.json'), 'utf8'))
    config.extends = './tsconfig.base.json'
    await writeFile(path.join(destination, 'tsconfig.json'), JSON.stringify(config, null, 2))
  } else {
    const originalManifest = JSON.parse(await readFile(path.join(original, 'package.json'), 'utf8'))
    deps.nuxt = originalManifest.dependencies.nuxt
  }
  await writeFile(
    path.join(destination, 'package.json'),
    JSON.stringify(
      {
        name: 'isolated-' + app,
        private: true,
        type: 'module',
        dependencies: deps,
        devDependencies: dev,
      },
      null,
      2,
    ),
  )
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], destination)
  const installed = await realpath(path.join(destination, 'node_modules', libManifest.name))
  if (installed.startsWith(root))
    throw new Error('Consumer resolved workspace source instead of installed tarball')
  if (app === 'vue-app') {
    run(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'], destination)
    run(
      process.execPath,
      ['node_modules/vite/bin/vite.js', 'build', '--logLevel', 'warn'],
      destination,
    )
  } else {
    run(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', 'typecheck'], destination)
    run(
      process.execPath,
      ['node_modules/nuxt/bin/nuxt.mjs', 'build', '--logLevel', 'warn'],
      destination,
    )
  }
}
const report = {
  tarball,
  consumers,
  package: libManifest.name,
  version: libManifest.version,
  sha256: createHash('sha256')
    .update(await readFile(tarball))
    .digest('hex'),
  node: process.version,
  verified: false,
}
await writeFile(path.join(artifacts, 'package-verification.json'), JSON.stringify(report, null, 2))
run(process.execPath, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test'], root, {
  FLIPBOOK_CONSUMER_ROOT: consumers,
  CI: '1',
})
report.verified = true
await writeFile(path.join(artifacts, 'package-verification.json'), JSON.stringify(report, null, 2))
console.log('Verified installed Vue + Nuxt production consumers: ' + consumers)
console.log('Tarball: ' + tarball)
