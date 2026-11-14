import { afterEach, describe, expect, it, vi } from 'vitest'
import { animateScroll } from '../src/utils/animateScroll'

afterEach(() => vi.restoreAllMocks())

describe('lyric scroll motion', () => {
  it('moves through intermediate positions, eases toward the center and finishes exactly', () => {
    let tick: FrameRequestCallback = () => {}
    vi.spyOn(performance, 'now').mockReturnValue(0)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { tick = callback; return 1 })
    const viewport = document.createElement('div')
    viewport.scrollTop = 20
    animateScroll(viewport, 220)
    tick(140)
    const first = viewport.scrollTop
    tick(280)
    const middle = viewport.scrollTop
    tick(420)
    const late = viewport.scrollTop
    tick(560)
    expect(first).toBeGreaterThan(20)
    expect(middle).toBeGreaterThan(first)
    expect(late).toBeGreaterThan(middle)
    expect(late - middle).toBeLessThan(middle - first)
    expect(viewport.scrollTop).toBe(220)
  })

  it('cancels without snapping and reverses from the current position', () => {
    let tick: FrameRequestCallback = () => {}
    vi.spyOn(performance, 'now').mockReturnValue(0)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { tick = callback; return 7 })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const viewport = document.createElement('div')
    const stop = animateScroll(viewport, 300)
    tick(140)
    const interrupted = viewport.scrollTop
    stop()
    expect(cancel).toHaveBeenCalledWith(7)
    expect(viewport.scrollTop).toBe(interrupted)
    animateScroll(viewport, 0)
    tick(140)
    expect(viewport.scrollTop).toBeGreaterThan(0)
    expect(viewport.scrollTop).toBeLessThan(interrupted)
    tick(560)
    expect(viewport.scrollTop).toBe(0)
  })
})
