<script setup lang="ts">
import { ref } from 'vue'
import { installPrompt } from '../pwa'
import BaseButton from './commons/BaseButton.vue'
import InputText from './commons/InputText.vue'
import sHymn from '../services/HymnService'
import { defaultValues, useSettingsStore } from '../store'

const store = useSettingsStore()
const busy = ref(false)
const message = ref('')
const number = ref('')
const supported = 'serviceWorker' in navigator && 'caches' in window && window.isSecureContext
async function install() {
  const prompt = installPrompt.value
  if (!prompt) return
  await prompt.prompt()
  await prompt.userChoice
  installPrompt.value = undefined
}
async function download(audio: boolean) {
  busy.value = true
  message.value = 'Preparando descarga…'
  const host = (store.hymnalApiUrl || defaultValues.hymnalApiUrl).replace(/\/$/, '')
  const musicHost = (store.musicHostUrl || defaultValues.musicHostUrl).replace(/\/$/, '')
  try {
    const cache = await caches.open('hymnal-data-v1')
    if (audio) {
      const n = Number(number.value)
      if (!Number.isInteger(n) || n < 1) throw new Error('Escribe un número de himno válido.')
      const hymn = await sHymn.byNumber(n, host)
      await cache.put(`${host}/hymn/${n}`, Response.json(hymn))
      const audioCache = await caches.open('hymnal-audio-v1')
      for (const version of ['vocal', 'instrumental']) {
        message.value = `Descargando himno ${n}: ${version === 'vocal' ? 'cantado' : 'instrumental'}…`
        const url = `${musicHost}/${version}/${encodeURIComponent(hymn.mp3Filename)}`
        if (await audioCache.match(url)) continue
        let response: Response
        try {
          response = await fetch(url, { signal: AbortSignal.timeout(180_000) })
        } catch {
          // The default music host serves playable media without CORS headers.
          response = await fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(180_000) })
        }
        if (response.type !== 'opaque' && response.status !== 200)
          throw new Error('No se pudo descargar el audio completo.')
        await audioCache.put(url, response)
        // Opaque responses hide HTTP errors. Verify the saved media is playable.
        if (response.type === 'opaque') {
          const probe = new Audio()
          try {
            await new Promise<void>((resolve, reject) => {
              const timeout = window.setTimeout(() => {
                cleanup()
                reject(new Error('No se pudo verificar el audio.'))
              }, 30_000)
              const cleanup = () => {
                clearTimeout(timeout)
                probe.onloadeddata = null
                probe.onerror = null
              }
              probe.onloadeddata = () => {
                cleanup()
                resolve()
              }
              probe.onerror = () => {
                cleanup()
                reject(new Error('El archivo descargado no se puede reproducir.'))
              }
              probe.preload = 'auto'
              probe.src = url
            })
          } catch (error) {
            await audioCache.delete(url)
            throw error
          } finally {
            probe.removeAttribute('src')
            probe.load()
          }
        }
      }
      message.value = `Himno ${n} guardado con letra y audio cantado e instrumental.`
    } else {
      const hymns = await sHymn.all(host)
      await cache.put(`${host}/hymn`, Response.json(hymns))
      // Sequential requests keep the API load bounded and progress truthful.
      for (const [index, hymn] of hymns.entries()) {
        message.value = `Guardando letras: ${index + 1} de ${hymns.length}…`
        const detail = await sHymn.byNumber(hymn.number, host)
        await cache.put(`${host}/hymn/${hymn.number}`, Response.json(detail))
      }
      message.value = `${hymns.length} himnos guardados para buscar y leer sin conexión.`
    }
    await navigator.storage?.persist?.().catch(() => false)
  } catch (error) {
    message.value = `${error instanceof Error ? error.message : 'No se pudo completar la descarga.'} Puedes reintentar; las descargas terminadas se conservan.`
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-2" aria-labelledby="offline-title">
    <h3 id="offline-title" class="font-bold">Instalación y uso sin conexión</h3>
    <BaseButton v-if="installPrompt" title="Instalar Himnario" @click="install"
      >Instalar Himnario</BaseButton
    >
    <p class="text-xs text-obs-muted">
      Para instalar, usa «Instalar aplicación» en el menú del navegador. En iPhone o iPad: Compartir
      → Añadir a pantalla de inicio.
    </p>
    <p v-if="!supported" role="status" class="text-xs">
      Abre la app mediante HTTPS o localhost en un navegador compatible para activar las descargas.
    </p>
    <template v-else>
      <p class="text-xs text-obs-muted">
        Descarga las letras antes de desconectarte. El audio se guarda por himno; OBS necesita
        seguir accesible en tu equipo o red local.
      </p>
      <BaseButton :disabled="busy" title="Descargar todas las letras" @click="download(false)"
        >Descargar todas las letras</BaseButton
      >
      <label for="offline-hymn">Himno para guardar con audio</label>
      <InputText
        id="offline-hymn"
        v-model="number"
        inputmode="numeric"
        placeholder="Número de himno"
        :disabled="busy"
      />
      <BaseButton
        :disabled="busy || !number.trim()"
        title="Descargar himno con audio"
        @click="download(true)"
        >Descargar himno con audio</BaseButton
      >
      <p class="text-xs text-obs-muted">
        Espera a que termine la descarga. Los archivos se guardan en este navegador; borrar sus
        datos elimina las descargas.
      </p>
      <p role="status" aria-live="polite" class="text-xs">{{ message }}</p>
    </template>
  </section>
</template>
