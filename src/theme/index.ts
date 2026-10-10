import { ref, watch, type WatchStopHandle } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore, type ThemeMode } from '../store'
import palettes from './obs-palettes.json'

export let themeMode = ref<ThemeMode>('obs')
let stopThemeWatch: WatchStopHandle | undefined
export function initializeTheme() {
  stopThemeWatch?.()
  themeMode = storeToRefs(useSettingsStore()).theme
  stopThemeWatch = watch(themeMode, applyTheme, { flush: 'sync', immediate: true })
}
export const obsThemeStatus = ref('Esperando conexión y script de OBS')
let snapshot: { dark: boolean; id: string } | undefined
let expiry: ReturnType<typeof setTimeout> | undefined
const keys = [
  'base',
  'control',
  'input',
  'hover',
  'pressed',
  'border',
  'text',
  'muted',
  'focus',
  'selection',
]
function findPalette(id: string) {
  return Object.hasOwn(palettes, id)
    ? palettes[id as keyof typeof palettes]
    : undefined
}

function applyTheme() {
  const root = document.documentElement
  for (const key of keys) root.style.removeProperty(`--obs-${key}`)
  const automatic = themeMode.value === 'obs'
  root.classList.toggle(
    'dark',
    automatic ? (snapshot?.dark ?? true) : themeMode.value === 'dark',
  )
  if (!automatic || !snapshot) return
  const palette = findPalette(snapshot.id)
  if (palette) {
    for (const [key, color] of Object.entries(palette.colors))
      root.style.setProperty(`--obs-${key}`, color)
  }
}

export function clearObsTheme() {
  clearTimeout(expiry)
  snapshot = undefined
  obsThemeStatus.value = 'Sin sincronización; usando oscuro como respaldo'
  applyTheme()
}

export function receiveObsTheme(data: unknown) {
  if (!data || typeof data !== 'object') return
  const value = data as Record<string, unknown>
  if (
    value.type !== 'himnario.theme' ||
    value.version !== 1 ||
    typeof value.dark !== 'boolean' ||
    typeof value.id !== 'string'
  )
    return
  snapshot = { dark: value.dark, id: value.id }
  const palette = findPalette(snapshot.id)
  obsThemeStatus.value = palette
    ? `Sincronizado con ${palette.name}`
    : 'Sincronizado: claro/oscuro (paleta no disponible)'
  clearTimeout(expiry)
  expiry = setTimeout(clearObsTheme, 12000)
  applyTheme()
}
