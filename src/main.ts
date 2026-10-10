import { createApp } from 'vue'
import App from './App.vue'
import { PiniaColada } from '@pinia/colada'
import { createAppPinia } from './pinia'
import { initializeTheme } from './theme'

const app = createApp(App)
app.use(createAppPinia())
app.use(PiniaColada)
initializeTheme()
app.mount('#app')
