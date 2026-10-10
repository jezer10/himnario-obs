import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearObsTheme,
  obsThemeStatus,
  receiveObsTheme,
  themeMode,
} from '../../src/theme/index'

const event = (id: string, dark = true) => ({
  type: 'himnario.theme',
  version: 1,
  id,
  dark,
})
const root = document.documentElement

describe('OBS theme synchronization', () => {
  beforeEach(() => {
    clearObsTheme()
    themeMode.value = 'obs'
  })
  afterEach(clearObsTheme)

  it('applies the selected OBS palette and subsequent changes', () => {
    receiveObsTheme(event('com.obsproject.Yami.Acri'))
    expect(root.style.getPropertyValue('--obs-control')).toBe('#162458')
    receiveObsTheme(event('com.obsproject.Yami.Light', false))
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.style.getPropertyValue('--obs-base')).toBe('rgb(229,229,229)')
  })

  it('keeps manual selection and resumes with the latest snapshot', () => {
    themeMode.value = 'light'
    receiveObsTheme(event('com.obsproject.Yami.Grey'))
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.style.getPropertyValue('--obs-base')).toBe('')
    themeMode.value = 'obs'
    expect(root.style.getPropertyValue('--obs-base')).toBe('rgb(47,47,47)')
  })

  it('clears palette overrides on disconnect', () => {
    receiveObsTheme(event('com.obsproject.Yami.Light', false))
    clearObsTheme()
    expect(root.style.getPropertyValue('--obs-base')).toBe('')
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('rejects unrelated or malformed events and safely handles unknown themes', () => {
    receiveObsTheme({ type: 'other', dark: false })
    receiveObsTheme({ ...event('x'), dark: 'false' })
    expect(root.classList.contains('dark')).toBe(true)
    receiveObsTheme(event('__proto__', false))
    expect(root.classList.contains('dark')).toBe(false)
    expect(obsThemeStatus.value).toContain('paleta no disponible')
  })
})
