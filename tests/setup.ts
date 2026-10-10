import { afterEach, beforeEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { config } from '@vue/test-utils'
import { createApp } from 'vue'
import { setActivePinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { createAppPinia } from '../src/pinia'
import { initializeTheme } from '../src/theme'

beforeEach(() => {
  localStorage.clear()
  const pinia = createAppPinia()
  createApp({}).use(pinia).use(PiniaColada)
  setActivePinia(pinia)
  config.global.plugins = [pinia, PiniaColada]
  initializeTheme()
})
enableAutoUnmount(afterEach)
