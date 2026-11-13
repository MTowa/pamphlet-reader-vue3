import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const root = fileURLToPath(new URL('..', import.meta.url))
export const library = path.join(root, 'packages/vue-flipbook')
export const manifest = JSON.parse(
  await readFile(path.join(root, 'third-party/manifest.json'), 'utf8'),
)
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

export function checkLicenseBytes(name, bytes, expectedHash) {
  assert.equal(sha256(bytes), expectedHash, `Missing or altered license text: ${name}`)
}

export function checkBundledPackages(dependencies) {
  const actual = Object.fromEntries(dependencies.map(({ name, version }) => [name, version]))
  assert.deepEqual(actual, manifest.bundledPackages, 'Bundled dependencies need a license review')
  for (const dependency of dependencies)
    assert.ok(dependency.text?.trim(), `Missing bundled license text: ${dependency.name}`)
}

/** Read actual installed/extracted package bytes, not npm pack's filename list. */
export async function verifyPackagedLicenses(packageRoot) {
  const directory = path.join(packageRoot, 'dist/licenses')
  for (const entry of manifest.licenses)
    checkLicenseBytes(entry.file, await readFile(path.join(directory, entry.file)), entry.sha256)
  for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md'])
    assert.deepEqual(
      await readFile(path.join(packageRoot, name)),
      await readFile(path.join(library, name)),
      `Package differs from reviewed ${name}`,
    )
  assert.deepEqual(
    JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8')),
    manifest,
    'Package license inventory differs from reviewed inventory',
  )
  checkBundledPackages(
    JSON.parse(await readFile(path.join(directory, 'bundled-dependencies.json'), 'utf8')),
  )
}
