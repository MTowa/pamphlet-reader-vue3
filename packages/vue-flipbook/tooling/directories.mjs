import { watch } from 'node:fs'
import { lstat, readFile, realpath, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const manifestName = 'flipbook.json'
const generator = '@your-org/vue-flipbook'
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'variant' })
export const comparePages = (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0)

export async function svgDirectoryGenerator(publicDir, options) {
  if (!Array.isArray(options?.directories) || !options.directories.length)
    throw new Error('flipbook SVG: register at least one directory relative to public/.')
  const root = await realpath(publicDir)
  const directories = []
  for (const name of new Set(options.directories)) {
    if (
      typeof name !== 'string' ||
      !name ||
      path.isAbsolute(name) ||
      name.includes('\\') ||
      name.includes('\0') ||
      name.split('/').some((part) => !part || part === '.' || part === '..')
    )
      throw new Error(`flipbook SVG: invalid public directory: ${name}`)
    const directory = await realpath(path.join(root, name))
    const relative = path.relative(root, directory)
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
      throw new Error('flipbook SVG: directory must stay inside public/.')
    directories.push(directory)
  }

  async function generate() {
    for (const directory of directories) {
      const entries = await readdir(directory, { withFileTypes: true })
      const pages = []
      for (const entry of entries) {
        if (!/\.svg$/i.test(entry.name)) continue
        if (
          !entry.isFile() ||
          entry.name.includes('\\') ||
          [...entry.name].some((character) => character.charCodeAt(0) < 32)
        )
          throw new Error(`flipbook SVG: expected a regular SVG file: ${entry.name}`)
        pages.push(entry.name)
      }
      if (!pages.length) throw new Error(`flipbook SVG: no SVG pages in ${directory}`)
      pages.sort(comparePages)
      const destination = path.join(directory, manifestName)
      let previous
      try {
        if (!(await lstat(destination)).isFile())
          throw new Error(`flipbook SVG: manifest must be a regular file: ${destination}`)
        previous = await readFile(destination, 'utf8')
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      if (previous !== undefined) {
        let owned = false
        try {
          owned = JSON.parse(previous).generator === generator
        } catch {
          /* Keep user files. */
        }
        if (!owned)
          throw new Error(`flipbook SVG: refusing to overwrite an unrelated ${destination}`)
      }
      const next = JSON.stringify({ version: 1, generator, pages }, null, 2) + '\n'
      if (next !== previous) await writeFile(destination, next)
    }
  }

  function startWatching(changed, failed) {
    let timer,
      closed = false
    let pending = Promise.resolve()
    const watchers = directories.map((directory) =>
      watch(directory, (_event, filename) => {
        if (filename && !/\.svg$/i.test(String(filename))) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          pending = pending
            .then(async () => {
              if (closed) return
              await generate()
              if (!closed) changed()
            })
            .catch(failed)
        }, 100)
      }),
    )
    for (const watcher of watchers) watcher.on('error', failed)
    return () => {
      closed = true
      clearTimeout(timer)
      watchers.forEach((watcher) => watcher.close())
    }
  }
  return { generate, startWatching }
}
