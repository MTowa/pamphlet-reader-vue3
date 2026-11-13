import { svgDirectoryGenerator } from './directories.mjs'

/** Configure once; the browser only reads the generated static manifest. */
export function svgDirectories(options) {
  let generator, close
  return {
    name: 'vue-flipbook-svg-directories',
    async configResolved(config) {
      if (!config.publicDir)
        throw new Error(
          'flipbook SVG: Vite publicDir must be enabled. For Nuxt, use the Nuxt module.',
        )
      generator = await svgDirectoryGenerator(config.publicDir, options)
      await generator.generate()
    },
    async buildStart() {
      await generator.generate()
    },
    configureServer(server) {
      close = generator.startWatching(
        () => server.ws.send({ type: 'full-reload' }),
        (error) => server.config.logger.error(String(error)),
      )
      server.httpServer?.once('close', () => close?.())
    },
    closeBundle() {
      close?.()
    },
  }
}
