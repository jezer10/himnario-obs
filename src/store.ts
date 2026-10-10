import { defineStore } from 'pinia'
import packageJson from '../package.json'

export type ThemeMode = 'obs' | 'light' | 'dark'
export const settingsKey = 'himnario-settings'
const settingsDefaults = {
  onlyInstrumental: false,
  autoplayMusic: false,
  autodriveVerses: true,
  onSearchSwitchToHymnScene: false,
  onSearchHymnScene: 'Himnario',
  onMusicEndSwitchToScene: '',
  obsWebsocketUrl: '',
  musicHostUrl: '',
  hymnalApiUrl: '',
  theme: 'obs' as ThemeMode,
  version: '',
}

// Import the previous individual keys once, preserving existing settings.
function migrateSettings() {
  if (localStorage.getItem(settingsKey) !== null) return
  const saved: Record<string, string | boolean> = {}
  for (const [key, fallback] of Object.entries(settingsDefaults)) {
    const value = localStorage.getItem(key)
    if (value === null) continue
    if (typeof fallback === 'boolean') {
      if (value === 'true' || value === 'false') saved[key] = value === 'true'
    } else if (key !== 'theme' || ['obs', 'light', 'dark'].includes(value)) {
      saved[key] = value
    }
  }
  localStorage.setItem(settingsKey, JSON.stringify(saved))
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({ ...settingsDefaults }),
  getters: {
    isFirstTimeInVersion: (state) => state.version !== packageJson.version,
  },
  actions: {
    markVersionSeen() {
      this.version = packageJson.version
    },
  },
  persist: {
    key: settingsKey,
    beforeHydrate: migrateSettings,
    pick: Object.keys(settingsDefaults),
  },
})

export const useObsStore = defineStore('obs', {
  state: () => ({
    sceneList: [] as any[],
    sourceList: [] as any[],
    sceneStatus: {
      scene: false,
      source: {
        himnoNumero: false,
        himnoTitulo: false,
        versoNumero: false,
        versoContenido: false,
      },
    },
  }),
})

export const defaultValues = {
  obsWebsocketUrl: 'localhost:4455',
  musicHostUrl: 'https://himnario-music.qhar.in',
  hymnalApiUrl: 'https://himnario-api.qhar.in',
}
