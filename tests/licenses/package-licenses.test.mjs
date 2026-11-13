import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { library, verifyPackagedLicenses } from '../../scripts/license-utils.mjs'

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'flipbook-license-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await cp(path.join(library, 'dist/licenses'), path.join(root, 'dist/licenses'), {
    recursive: true,
  })
  for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md'])
    await cp(path.join(library, name), path.join(root, name))
  return root
}

test('the built distribution preserves every reviewed notice', async () => {
  await verifyPackagedLicenses(library)
})

test('a missing QuickJS license is rejected even when code can still run', async (t) => {
  const root = await fixture(t)
  await rm(path.join(root, 'dist/licenses/wasm-LICENSE_QUICKJS.txt'))
  await assert.rejects(verifyPackagedLicenses(root), /LICENSE_QUICKJS/)
})

test('a truncated copyright/permission notice is rejected', async (t) => {
  const root = await fixture(t)
  await writeFile(path.join(root, 'dist/licenses/StPageFlip-LICENSE.txt'), 'MIT License\n')
  await assert.rejects(verifyPackagedLicenses(root), /altered license text: StPageFlip/)
})

test('an additional bundled dependency requires a fresh review', async (t) => {
  const root = await fixture(t)
  const file = path.join(root, 'dist/licenses/bundled-dependencies.json')
  const dependencies = JSON.parse(await readFile(file, 'utf8'))
  dependencies.push({
    name: 'unreviewed-library',
    version: '1.0.0',
    identifier: 'MIT',
    text: 'MIT',
  })
  await writeFile(file, JSON.stringify(dependencies))
  await assert.rejects(verifyPackagedLicenses(root), /Bundled dependencies need a license review/)
})
