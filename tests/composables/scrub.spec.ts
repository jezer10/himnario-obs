import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useScrub } from '../../src/composables/scrub'

function setup(playing = true) {
  const element = document.createElement('audio')
  Object.defineProperty(element, 'paused', { configurable: true, value: !playing })
  const time = ref(0)
  let scrub!: ReturnType<typeof useScrub>
  const wrapper = mount({ setup() { scrub = useScrub(ref(element), time, ref(180)); return () => null } })
  return { element, time, scrub, wrapper }
}
describe('continuous forward scrub', () => {
  it('accelerates without repeatedly seeking and commits the release position', () => {
    const { element, scrub } = setup()
    scrub.start()
    scrub.seek(10)
    scrub.seek(30)
    expect(element.playbackRate).toBe(2)
    expect(element.currentTime).toBe(0)
    expect(scrub.displayTime.value).toBe(30)
    scrub.commit(35)
    expect(element.currentTime).toBe(35)
    expect(element.playbackRate).toBe(1)
  })
  it('seeks backwards normally and restores the original rate', () => {
    const { element, scrub } = setup()
    element.playbackRate = 1.25
    scrub.start()
    scrub.seek(60)
    scrub.seek(20)
    expect(element.currentTime).toBe(20)
    expect(element.playbackRate).toBe(1.25)
  })
  it('keeps paused audio paused and supports ordinary clicks without acceleration', () => {
    const { element, scrub } = setup(false)
    scrub.start()
    scrub.seek(30)
    expect(element.currentTime).toBe(30)
    expect(element.playbackRate).toBe(1)
    expect(element.paused).toBe(true)
    scrub.cancel()
    scrub.seek(45)
    expect(element.currentTime).toBe(45)
  })
  it('restores playback speed on cancellation and unmount', () => {
    const { element, scrub, wrapper } = setup()
    scrub.start()
    scrub.seek(30)
    scrub.cancel()
    expect(element.playbackRate).toBe(1)
    scrub.start()
    scrub.seek(60)
    wrapper.unmount()
    expect(element.playbackRate).toBe(1)
  })
})
