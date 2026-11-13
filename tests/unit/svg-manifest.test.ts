import { describe, expect, it } from 'vitest'
import { parseSvgManifest } from '../../packages/vue-flipbook/src/svg/SvgDocumentSession'

const base = new URL('https://example.com/demo/book/')
describe('SVG page lists', () => {
  it('preserves page order and encodes filenames relative to the full directory URL', () => {
    expect(parseSvgManifest({ version: 1, pages: ['2.svg', '10 日本語 #%.SVG'] }, base)).toEqual([
      'https://example.com/demo/book/2.svg',
      'https://example.com/demo/book/10%20%E6%97%A5%E6%9C%AC%E8%AA%9E%20%23%25.SVG',
    ])
  })
  it.each([
    null,
    {},
    { version: 2, pages: ['1.svg'] },
    { version: 1, pages: [] },
    { version: 1, pages: ['../x.svg'] },
    { version: 1, pages: ['https://other.test/x.svg'] },
    { version: 1, pages: ['1.svg', '1.svg'] },
    { version: 1, pages: ['x.png'] },
  ])('rejects invalid or escaping lists: %j', (value) => {
    expect(() => parseSvgManifest(value, base)).toThrow()
  })
})
