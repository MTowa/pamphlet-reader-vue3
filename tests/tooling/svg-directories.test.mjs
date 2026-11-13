import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { svgDirectoryGenerator } from '../../packages/vue-flipbook/tooling/directories.mjs'

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'svg-directories-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const publicDir = path.join(root, 'public'),
    book = path.join(publicDir, 'book')
  await mkdir(book, { recursive: true })
  return { root, publicDir, book }
}
const read = async (book) => JSON.parse(await readFile(path.join(book, 'flipbook.json'), 'utf8'))

test('discovers flat SVG files in numeric order, retains filenames, and updates after deletion', async (t) => {
  const { publicDir, book } = await fixture(t)
  for (const name of ['10.svg', '2.svg', '1.svg', '20 日本語 #.SVG', 'notes.txt'])
    await writeFile(path.join(book, name), 'test')
  await mkdir(path.join(book, 'nested'))
  const generator = await svgDirectoryGenerator(publicDir, { directories: ['book'] })
  await generator.generate()
  assert.deepEqual((await read(book)).pages, ['1.svg', '2.svg', '10.svg', '20 日本語 #.SVG'])
  await rm(path.join(book, '2.svg'))
  await generator.generate()
  assert.deepEqual((await read(book)).pages, ['1.svg', '10.svg', '20 日本語 #.SVG'])
})

test('rejects traversal and directories outside public via symlinks', async (t) => {
  const { root, publicDir } = await fixture(t)
  await assert.rejects(svgDirectoryGenerator(publicDir, { directories: ['../private'] }), /invalid/)
  await mkdir(path.join(root, 'private'))
  await symlink(path.join(root, 'private'), path.join(publicDir, 'linked'))
  await assert.rejects(
    svgDirectoryGenerator(publicDir, { directories: ['linked'] }),
    /inside public/,
  )
})

test('rejects empty folders and symlinked SVG files', async (t) => {
  const { root, publicDir, book } = await fixture(t)
  const generator = await svgDirectoryGenerator(publicDir, { directories: ['book'] })
  await assert.rejects(generator.generate(), /no SVG/)
  await writeFile(path.join(root, 'private.svg'), 'private')
  await symlink(path.join(root, 'private.svg'), path.join(book, '1.svg'))
  await assert.rejects(generator.generate(), /regular SVG/)
})

test('does not overwrite user manifests or follow a manifest symlink', async (t) => {
  const { root, publicDir, book } = await fixture(t)
  await writeFile(path.join(book, '1.svg'), 'test')
  const generator = await svgDirectoryGenerator(publicDir, { directories: ['book'] })
  const file = path.join(book, 'flipbook.json')
  await writeFile(file, '{"user":true}')
  await assert.rejects(generator.generate(), /refusing to overwrite/)
  assert.equal(await readFile(file, 'utf8'), '{"user":true}')
  await rm(file)
  await writeFile(path.join(root, 'private.json'), '{}')
  await symlink(path.join(root, 'private.json'), file)
  await assert.rejects(generator.generate(), /regular file/)
  assert.equal(await readFile(path.join(root, 'private.json'), 'utf8'), '{}')
})

test('a development watcher regenerates on SVG addition and can be closed', async (t) => {
  const { publicDir, book } = await fixture(t)
  await writeFile(path.join(book, '1.svg'), 'test')
  const generator = await svgDirectoryGenerator(publicDir, { directories: ['book'] })
  await generator.generate()
  let close
  const update = new Promise((resolve, reject) => {
    close = generator.startWatching(resolve, reject)
    const timeout = setTimeout(() => reject(new Error('Watcher did not regenerate')), 3000)
    t.after(() => clearTimeout(timeout))
  })
  t.after(() => close())
  await writeFile(path.join(book, '2.svg'), 'test')
  await update
  assert.deepEqual((await read(book)).pages, ['1.svg', '2.svg'])
})
