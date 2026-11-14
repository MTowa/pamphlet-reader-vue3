import assert from 'node:assert/strict'
import { copyFile, cp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { library, root, verifyPackagedLicenses } from './license-utils.mjs'

const output = path.join(root, 'playground/vue-app/dist')
const report = JSON.parse(
  await readFile(path.join(output, 'licenses/application-dependencies.json'), 'utf8'),
)
const vueLicense = await readFile(path.join(root, 'node_modules/vue/LICENSE'), 'utf8')
assert.deepEqual(
  report.map(({ name, version }) => [name, version]).sort(),
  ['@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom', '@vue/shared']
    .map((name) => [name, '3.5.45'])
    .sort(),
  'Review introduction-site dependencies before changing the license inventory',
)
for (const dependency of report) {
  assert.equal(dependency.identifier, 'MIT')
  assert.equal(dependency.text.trim(), vueLicense.trim(), dependency.name + ' license changed')
}
await verifyPackagedLicenses(library)
await cp(path.join(library, 'dist/licenses'), path.join(output, 'licenses/flipbook'), {
  recursive: true,
})
await copyFile(
  path.join(library, 'THIRD_PARTY_NOTICES.md'),
  path.join(output, 'THIRD_PARTY_NOTICES.md'),
)
await copyFile(path.join(root, 'LICENSE'), path.join(output, 'LICENSE.txt'))
await writeFile(path.join(output, 'licenses/Vue-LICENSE.txt'), vueLicense)
await copyFile(
  path.join(root, 'playground/vue-app/src/assets/ATTRIBUTION.md'),
  path.join(output, 'licenses/Site-assets.md'),
)
await writeFile(path.join(output, '.nojekyll'), '')
console.log('Included original, Vue and flipbook dependency notices in the site distribution.')
