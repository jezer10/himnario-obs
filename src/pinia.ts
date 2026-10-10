import { createPinia } from 'pinia'
import persistedState from 'pinia-plugin-persistedstate'

export function createAppPinia() {
  return createPinia().use(persistedState)
}
