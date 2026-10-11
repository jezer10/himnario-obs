import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import ObsPreset from './theme/obs-preset'
import { PiniaColada } from '@pinia/colada'
import { createAppPinia } from './pinia'
import { initializeTheme } from './theme'
import 'primeicons/primeicons.css'
import './styles/main.css'

const app = createApp(App)
app.use(createAppPinia())
app.use(PiniaColada)
app.use(PrimeVue, {
  ripple: true,
  theme: { preset: ObsPreset, options: { darkModeSelector: '.dark', cssLayer: { name: 'primevue', order: 'theme, base, primevue, utilities' } } },
  license: import.meta.env.VITE_PRIMEUI_LICENSE || undefined,
})
initializeTheme()
app.mount('#app')
