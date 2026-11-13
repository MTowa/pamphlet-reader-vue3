import assert from 'node:assert/strict'
import { copyFile, mkdir, readdir, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import {
  checkBundledPackages,
  checkLicenseBytes,
  library,
  manifest,
  root,
} from './license-utils.mjs'

const viteRoot = await realpath(path.join(root, 'node_modules/vite'))
const packages = {
  'pdfjs-dist': path.join(library, 'node_modules/pdfjs-dist'),
  'page-flip': path.join(library, 'node_modules/page-flip'),
  vite: viteRoot,
  rolldown: path.join(viteRoot, '../rolldown'),
}
for (const [name, version] of Object.entries(manifest.packages)) {
  const installed = JSON.parse(await readFile(path.join(packages[name], 'package.json'), 'utf8'))
  assert.equal(installed.version, version, `Review licenses before updating ${name}`)
}

// Every shipped support asset must be mapped to reviewed license texts. In
// particular, a new WASM file cannot silently bypass the notice collector.
for (const [directory, extensions] of [
  ['cmaps', ['.bcmap']],
  ['standard_fonts', ['.pfb', '.ttf']],
  ['wasm', ['.wasm']],
]) {
  const actual = (await readdir(path.join(packages['pdfjs-dist'], directory)))
    .filter((name) => extensions.includes(path.extname(name)))
    .sort()
  const groups = manifest.assets.filter((group) => group.directory === directory)
  assert.deepEqual(
    actual,
    groups.flatMap((group) => group.files).sort(),
    `Review ${directory} assets`,
  )
  for (const group of groups) {
    assert.ok(group.licenses.length, `No licenses mapped to ${group.files.join(', ')}`)
    for (const name of group.licenses)
      assert.ok(
        manifest.licenses.some((entry) => entry.file === name),
        `Unreviewed license: ${name}`,
      )
  }
}

// An added upstream NOTICE or LICENSE must be reviewed, even at the package root.
for (const name of ['pdfjs-dist', 'page-flip']) {
  const directories = name === 'pdfjs-dist' ? ['', 'cmaps', 'standard_fonts', 'wasm'] : ['']
  for (const directory of directories)
    for (const file of await readdir(path.join(packages[name], directory))) {
      if (!/^(LICENSE|NOTICE)/i.test(file)) continue
      const source = [name, directory, file].filter(Boolean).join('/')
      assert.ok(
        manifest.licenses.some((entry) => entry.source === source),
        `Review new notice: ${source}`,
      )
    }
}

const output = path.join(library, 'dist/licenses')
checkBundledPackages(
  JSON.parse(await readFile(path.join(output, 'bundled-dependencies.json'), 'utf8')),
)
await mkdir(output, { recursive: true })
for (const entry of manifest.licenses) {
  const snapshot = path.join(root, 'third-party/licenses', entry.file)
  checkLicenseBytes(entry.file, await readFile(snapshot), entry.sha256)
  if (entry.source) {
    const [name, ...relative] = entry.source.split('/')
    let original = await readFile(path.join(packages[name], ...relative))
    if (entry.section === 'leading-comment')
      original = Buffer.concat([
        original.subarray(0, original.indexOf('*/') + 2),
        Buffer.from('\n'),
      ])
    if (entry.section === 'vite-core')
      original = original.subarray(0, original.indexOf('# Licenses of bundled dependencies'))
    checkLicenseBytes(entry.source, original, entry.sha256)
  }
  await copyFile(snapshot, path.join(output, entry.file))
}
await copyFile(path.join(root, 'third-party/manifest.json'), path.join(output, 'manifest.json'))
await copyFile(path.join(root, 'LICENSE'), path.join(library, 'LICENSE'))
await copyFile(path.join(root, 'README.md'), path.join(library, 'README.md'))
console.log(`Verified and bundled ${manifest.licenses.length} upstream license/notice texts.`)
