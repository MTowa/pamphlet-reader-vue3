import type { Plugin } from 'vite'

export interface SvgDirectoryOptions {
  /** Non-recursive directories relative to Vite/Nuxt's public directory. */
  directories: string[]
}
export declare function svgDirectories(options: SvgDirectoryOptions): Plugin
