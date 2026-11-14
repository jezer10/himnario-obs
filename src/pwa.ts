import { ref } from 'vue'

interface InstallPrompt extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: string }>
}

export const installPrompt = ref<InstallPrompt>()

// Listen from startup: the browser may offer installation before Settings opens.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  installPrompt.value = event as InstallPrompt
})
window.addEventListener('appinstalled', () => {
  installPrompt.value = undefined
})
