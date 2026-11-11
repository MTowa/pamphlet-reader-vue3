import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = path.join(root, 'packages/vue-flipbook')
await mkdir(path.join(pkg, 'dist/licenses'), { recursive: true })
await copyFile(path.join(root, 'LICENSE'), path.join(pkg, 'LICENSE'))
await copyFile(path.join(root, 'README.md'), path.join(pkg, 'README.md'))
const entries = [
  ['pdfjs-dist/LICENSE', 'PDF.js-LICENSE.txt'],
  ['page-flip/LICENSE', 'StPageFlip-LICENSE.txt'],
]
for (const dir of ['cmaps', 'standard_fonts', 'wasm']) {
  for (const file of await readdir(path.join(pkg, 'node_modules/pdfjs-dist', dir))) {
    if (/^(LICENSE|NOTICE)/.test(file))
      entries.push([`pdfjs-dist/${dir}/${file}`, `${dir}-${file}.txt`])
  }
}
for (const [source, destination] of entries)
  await copyFile(
    path.join(pkg, 'node_modules', source),
    path.join(pkg, 'dist/licenses', destination),
  )
const pdfVersion = JSON.parse(
  await readFile(path.join(pkg, 'node_modules/pdfjs-dist/package.json'), 'utf8'),
).version
await writeFile(
  path.join(pkg, 'THIRD_PARTY_NOTICES.md'),
  `# Third-party notices\n\n- PDF.js ${pdfVersion}: Apache-2.0; https://github.com/mozilla/pdf.js\n- StPageFlip 2.0.7: MIT; https://github.com/Nodlik/StPageFlip\n- StPageFlip is modified to cancel animation frames and timers on destruction. See patches/page-flip@2.0.7.patch in the source repository.\n- Bundled PDF support assets retain their own font, CMap, OpenJPEG, JBIG2 and QCMS licenses. Complete upstream texts are included in dist/licenses/.\n- Vue is a peer dependency (MIT), not bundled.\n- Original sample PDF artwork is MIT licensed.\n`,
)
console.log('Bundled upstream licenses and notices.')
