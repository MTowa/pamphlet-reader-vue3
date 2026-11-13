import { describe, expect, it } from 'vitest'
import { clampPage, renderWindow, visiblePages } from '../../packages/vue-flipbook/src/utils/pages'

describe('one-based page mapping', () => {
  it.each([
    [1, 6, 'spread', true, [1]],
    [2, 6, 'spread', true, [2, 3]],
    [3, 6, 'spread', true, [2, 3]],
    [6, 6, 'spread', true, [6]],
    [1, 6, 'spread', false, [1, 2]],
    [2, 6, 'spread', false, [1, 2]],
    [5, 5, 'spread', false, [5]],
    [3, 6, 'single', true, [3]],
    [1, 1, 'spread', true, [1]],
    [999, 6, 'single', true, [6]],
  ] as const)('maps page %s of %s (%s, cover %s)', (page, count, mode, cover, expected) => {
    expect(visiblePages(page, count, mode, cover)).toEqual(expected)
  })
  it('clamps invalid page requests', () => {
    expect(clampPage(NaN, 6)).toBe(1)
    expect(clampPage(-10, 6)).toBe(1)
    expect(clampPage(4.8, 6)).toBe(4)
    expect(clampPage(90, 6)).toBe(6)
  })
  it('prioritizes visible pages and bounds the window', () => {
    expect(renderWindow([20, 21], 80)).toEqual([20, 21, 22, 19, 23, 18])
    expect(renderWindow([1], 1)).toEqual([1])
    expect(renderWindow([80], 80)).toEqual([80, 79, 78])
  })
})
