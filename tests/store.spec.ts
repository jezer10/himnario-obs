import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createAppPinia } from '../src/pinia'
import { settingsKey, useObsStore, useSettingsStore } from '../src/store'

function newSession() {
  const pinia = createAppPinia()
  createApp({}).use(pinia)
  return pinia
}

describe('settings persistence', () => {
  it('imports existing settings and does not overwrite subsequent changes', async () => {
    localStorage.clear()
    localStorage.setItem('onlyInstrumental', 'true')
    localStorage.setItem('autodriveVerses', 'false')
    localStorage.setItem('theme', 'light')
    localStorage.setItem('hymnalApiUrl', 'https://example.com')
    const store = useSettingsStore(newSession())
    expect(store.onlyInstrumental).toBe(true)
    expect(store.autodriveVerses).toBe(false)
    expect(store.theme).toBe('light')
    expect(store.hymnalApiUrl).toBe('https://example.com')
    store.onlyInstrumental = false
    await nextTick()
    expect(useSettingsStore(newSession()).onlyInstrumental).toBe(false)
  })

  it('restores preferences, theme and seen version without persisting OBS state', async () => {
    const pinia = newSession()
    const store = useSettingsStore(pinia)
    store.theme = 'dark'
    store.onSearchHymnScene = ''
    store.autoplayMusic = true
    store.markVersionSeen()
    useObsStore(pinia).sceneList = [{ sceneName: 'Live' }]
    await nextTick()
    const reloadedPinia = newSession()
    const reloaded = useSettingsStore(reloadedPinia)
    expect(reloaded.theme).toBe('dark')
    expect(reloaded.onSearchHymnScene).toBe('')
    expect(reloaded.autoplayMusic).toBe(true)
    expect(reloaded.isFirstTimeInVersion).toBe(false)
    expect(useObsStore(reloadedPinia).sceneList).toEqual([])
    expect(JSON.parse(localStorage.getItem(settingsKey)!)).not.toHaveProperty('sceneList')
  })
})
