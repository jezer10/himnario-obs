import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

export function useScrub(audio: Ref<HTMLAudioElement | null>, currentTime: Ref<number>, duration: Ref<number>) {
  const preview = ref<number | null>(null)
  const displayTime = computed(() => preview.value ?? currentTime.value)
  let dragging = false
  function start() {
    cancel()
    dragging = true
  }
  function seek(value: number) {
    const element = audio.value
    if (!element || duration.value <= 0 || !Number.isFinite(value)) return
    const target = Math.max(0, Math.min(duration.value, value))
    element.currentTime = target
    currentTime.value = target
    preview.value = dragging ? target : null
  }
  function commit(value: number) {
    cancel()
    if (!audio.value || duration.value <= 0 || !Number.isFinite(value)) return
    const target = Math.max(0, Math.min(duration.value, value))
    audio.value.currentTime = target
    currentTime.value = target
  }
  function cancel() {
    dragging = false
    preview.value = null
  }
  onBeforeUnmount(cancel)
  return { displayTime, start, seek, commit, cancel }
}
