import { type Ref, ref, onBeforeUnmount } from 'vue'

export function usePlayer() {
  const player: Ref<HTMLAudioElement | null> = ref(null)
  const currentTime = ref(0)
  let frame = 0
  const cleanup: (() => void)[] = []
  function syncTime() {
    const time = player.value?.currentTime
    if (time !== undefined && Number.isFinite(time)) currentTime.value = time
  }
  function stopFrames() {
    cancelAnimationFrame(frame)
    frame = 0
    syncTime()
  }
  function startFrames() {
    stopFrames()
    const tick = () => {
      syncTime()
      const audio = player.value
      frame = audio && !audio.paused && !audio.ended ? requestAnimationFrame(tick) : 0
    }
    frame = requestAnimationFrame(tick)
  }
  onBeforeUnmount(() => {
    stopFrames()
    cleanup.forEach(remove => remove())
  })

  function load() {
    player.value?.load()
  }

  function play() {
    player.value?.play()
  }

  async function stop() {
    if (!player.value) {
      return
    }
    const originalVolume = player.value.volume
    const delay = 2000
    await fadeOutVolume(delay)
    player.value.pause()
    player.value.volume = originalVolume
  }

  function fadeOutVolume(delay: number) {
    if (!player.value) {
      return
    }
    const originalVolume = player.value.volume
    if (originalVolume === 0) return
    return new Promise<void>((resolve) => {
      const interval = setInterval(
        () => {
          if (!player.value) {
            return
          }
          if (player.value.volume <= 0.01) {
            player.value.volume = 0
            clearInterval(interval)
            resolve()
          } else {
            player.value.volume = Math.max(0, player.value.volume - 0.01)
          }
        },
        delay / (originalVolume / 0.01),
      )
    })
  }

  function onTimeUpdate(callback: () => void) {
    const audio = player.value
    if (!audio) return
    const update = () => { syncTime(); callback() }
    const listeners: [string, EventListener][] = [
      ['timeupdate', update],
      ['playing', startFrames],
      ['pause', stopFrames],
      ['waiting', stopFrames],
      ['ended', stopFrames],
      ['emptied', stopFrames],
      ['seeking', syncTime],
      ['seeked', syncTime],
    ]
    listeners.forEach(([event, handler]) => audio.addEventListener(event, handler))
    cleanup.push(() => listeners.forEach(([event, handler]) => audio.removeEventListener(event, handler)))
    if (!audio.paused && !audio.ended) startFrames()
  }

  function onEnded(callback: () => void) {
    const audio = player.value
    audio?.addEventListener('ended', callback)
    cleanup.push(() => audio?.removeEventListener('ended', callback))
  }
  return {
    player,
    currentTime,
    load,
    play,
    stop,
    onTimeUpdate,
    onEnded,
  }
}
