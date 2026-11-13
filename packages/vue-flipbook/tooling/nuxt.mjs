import path from 'node:path'
import { svgDirectoryGenerator } from './directories.mjs'

export default async function svgDirectories(options, nuxt) {
  const generator = await svgDirectoryGenerator(
    path.resolve(nuxt.options.rootDir, nuxt.options.dir.public),
    options,
  )
  await generator.generate()
  if (nuxt.options.dev) {
    let server
    nuxt.hook('vite:serverCreated', (value) => {
      server = value
    })
    const close = generator.startWatching(
      () => server?.ws.send({ type: 'full-reload' }),
      (error) => console.error('[flipbook SVG]', error),
    )
    nuxt.hook('close', close)
  }
}
