import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

export function useScrub(audio: Ref<HTMLAudioElement | null>, currentTime: Ref<number>, duration: Ref<number>) {
  const preview = ref<number | null>(null)
  const displayTime = computed(() => preview.value ?? currentTime.value)
  let dragging = false
  let previousTarget = 0
  let accelerated: HTMLAudioElement | null = null
  let originalRate = 1

  function restoreRate() {
    if (accelerated) accelerated.playbackRate = originalRate
    accelerated = null
  }
  function start() {
    cancel()
    dragging = true
    previousTarget = currentTime.value
  }
  function seek(value: number) {
    const element = audio.value
    if (!element || duration.value <= 0 || !Number.isFinite(value)) return
    const target = Math.max(0, Math.min(duration.value, value))
    if (dragging && !element.paused && target > previousTarget) {
      if (!accelerated) {
        accelerated = element
        originalRate = element.playbackRate
      }
      element.playbackRate = 2
      // Keep the audio continuous. Only the release commits the cursor position.
      preview.value = target
    } else if (target !== previousTarget || !dragging) {
      restoreRate()
      element.currentTime = target
      currentTime.value = target
      preview.value = dragging ? target : null
    }
    previousTarget = target
  }
  function commit(value: number) {
    cancel()
    if (!audio.value || duration.value <= 0 || !Number.isFinite(value)) return
    const target = Math.max(0, Math.min(duration.value, value))
    audio.value.currentTime = target
    currentTime.value = target
  }
  function cancel() {
    restoreRate()
    dragging = false
    preview.value = null
  }
  onBeforeUnmount(cancel)
  return { displayTime, start, seek, commit, cancel }
}
