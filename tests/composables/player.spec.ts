import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { usePlayer } from '../../src/composables/player'

afterEach(() => vi.unstubAllGlobals())

function setup() {
  const frames = new Map<number, FrameRequestCallback>()
  let id = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key))
  const audio = document.createElement('audio')
  Object.defineProperty(audio, 'paused', { configurable: true, value: false })
  const update = vi.fn()
  let player!: ReturnType<typeof usePlayer>
  const wrapper = mount({
    setup() {
      player = usePlayer()
      player.player.value = audio
      player.onTimeUpdate(update)
      return () => null
    },
  })
  const tick = () => {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach((callback) => callback(0))
  }
  return { audio, player, update, wrapper, frames, tick }
}

describe('smooth audio progress', () => {
  it('samples actual audio time between timeupdate events without repeating callbacks', () => {
    const { audio, player, update, wrapper, tick } = setup()
    for (const time of [0.016, 0.032, 0.048]) {
      audio.currentTime = time
      tick()
      expect(player.currentTime.value).toBe(time)
    }
    expect(update).not.toHaveBeenCalled()
    audio.dispatchEvent(new Event('timeupdate'))
    expect(update).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('stops during buffering and pause, resumes playing and syncs seeks immediately', () => {
    const { audio, player, wrapper, frames, tick } = setup()
    audio.dispatchEvent(new Event('waiting'))
    expect(frames.size).toBe(0)
    audio.dispatchEvent(new Event('playing'))
    audio.currentTime = 12.25
    tick()
    expect(player.currentTime.value).toBe(12.25)
    Object.defineProperty(audio, 'paused', { value: true })
    audio.dispatchEvent(new Event('pause'))
    expect(frames.size).toBe(0)
    audio.currentTime = 40
    audio.dispatchEvent(new Event('seeked'))
    expect(player.currentTime.value).toBe(40)
    expect(frames.size).toBe(0)
    wrapper.unmount()
  })

  it('cleans up animation and event listeners on unmount', () => {
    const { audio, update, wrapper, frames } = setup()
    expect(frames.size).toBe(1)
    wrapper.unmount()
    expect(frames.size).toBe(0)
    audio.dispatchEvent(new Event('playing'))
    audio.dispatchEvent(new Event('timeupdate'))
    expect(frames.size).toBe(0)
    expect(update).not.toHaveBeenCalled()
  })
})
