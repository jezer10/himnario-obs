<script setup lang="ts">
import Message from 'primevue/message'
import type { OBSEventTypes } from 'obs-websocket-js'
import { ref, watch } from 'vue'
import { useObs } from '../composables/obs'
import { useObsStore, useSettingsStore } from '../store'
import BasicDialog from './BasicDialog.vue'
import BaseButton from './commons/BaseButton.vue'

const store = useSettingsStore()
const obsStore = useObsStore()
const sceneStatus = obsStore.sceneStatus

const { on, connected, getSceneItems, createScene, createSource } = useObs()

const creating = ref(false)
const creationError = ref('')

const dialog = ref<InstanceType<typeof BasicDialog> | null>(null)

watch(connected, async (connected) => {
  if (!connected) {
    return
  }
  if (sceneStatus.scene && Object.values(sceneStatus.source).every((v) => v)) {
    return
  }
  dialog.value?.open()
})

on('SceneListChanged', checkScene)
on('SceneItemCreated', checkSource)
on('SceneItemRemoved', checkSource)

function checkScene({ scenes }: OBSEventTypes['SceneListChanged']) {
  sceneStatus.scene = scenes.some(
    (scene) => scene.sceneName === store.onSearchHymnScene,
  )
}

async function checkSource({
  sceneName,
  sourceName,
}: OBSEventTypes['SceneItemCreated' | 'SceneItemRemoved']) {
  if (sceneName !== store.onSearchHymnScene) {
    return
  }
  if (!['verso_contenido', 'verso_numero', 'himno_titulo', 'himno_numero'].includes(sourceName)) return
  try {
    await getSceneItems(store.onSearchHymnScene)
  } catch (error) {
    creationError.value = error instanceof Error ? error.message : String(error)
  }
}

async function createSceneAndSources() {
  if (creating.value) return
  creating.value = true
  creationError.value = ''
  try {
    if (!sceneStatus.scene) await createScene()
    sceneStatus.scene = true
    await getSceneItems(store.onSearchHymnScene)
    if (!sceneStatus.source.versoContenido) await createSource('verso_contenido')
    if (!sceneStatus.source.versoNumero) await createSource('verso_numero')
    if (!sceneStatus.source.himnoTitulo) await createSource('himno_titulo')
    if (!sceneStatus.source.himnoNumero) await createSource('himno_numero')
    await getSceneItems(store.onSearchHymnScene)
    if (!Object.values(sceneStatus.source).every(Boolean)) {
      throw new Error('No se pudieron verificar todas las fuentes de texto. Revisa los recursos de la escena.')
    }
  } catch (error) {
    creationError.value = error instanceof Error ? error.message : String(error)
  } finally {
    creating.value = false
  }
}

</script>

<template>
  <BasicDialog ref="dialog" title="" data-test="settings">
    <template v-slot:header>
      <div class="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]">
        <div class="shrink-0 rounded-full w-2 h-2" :class="sceneStatus.scene? 'bg-status-success' : 'bg-status-danger'"></div>
        {{ store.onSearchHymnScene }}
      </div>
    </template>
    <div class="space-y-1">
      <div class="bg-obs-control w-full flex items-stretch rounded-sm divide-x divide-obs-base">
        <div class="px-2 py-1 flex items-center">
          <div class="shrink-0 rounded-full w-2 h-2" :class="sceneStatus.source.himnoNumero? 'bg-status-success' : 'bg-status-danger'"></div>
        </div>
        <div class="px-2 py-1 min-w-0 grow flex flex-wrap gap-x-2">
          himno_numero
          <span class="ms-auto opacity-60">Texto</span>
        </div>
      </div>
      <div class="bg-obs-control w-full flex items-stretch rounded-sm divide-x divide-obs-base">
        <div class="px-2 py-1 flex items-center">
          <div class="shrink-0 rounded-full w-2 h-2" :class="sceneStatus.source.himnoTitulo? 'bg-status-success' : 'bg-status-danger'"></div>
        </div>
        <div class="px-2 py-1 min-w-0 grow flex flex-wrap gap-x-2">
          himno_titulo
          <span class="ms-auto opacity-60">Texto</span>
        </div>
      </div>
      <div class="bg-obs-control w-full flex items-stretch rounded-sm divide-x divide-obs-base">
        <div class="px-2 py-1 flex items-center">
          <div class="shrink-0 rounded-full w-2 h-2" :class="sceneStatus.source.versoNumero? 'bg-status-success' : 'bg-status-danger'"></div>
        </div>
        <div class="px-2 py-1 min-w-0 grow flex flex-wrap gap-x-2">
          verso_numero
          <span class="ms-auto opacity-60">Texto</span>
        </div>
      </div>
      <div class="bg-obs-control w-full flex items-stretch rounded-sm divide-x divide-obs-base">
        <div class="px-2 py-1 flex items-center">
          <div class="shrink-0 rounded-full w-2 h-2" :class="sceneStatus.source.versoContenido? 'bg-status-success' : 'bg-status-danger'"></div>
        </div>
        <div class="px-2 py-1 min-w-0 grow flex flex-wrap gap-x-2">
          verso_contenido
          <span class="ms-auto opacity-60">Texto</span>
        </div>
      </div>
      <p v-if="!sceneStatus.scene || Object.values(sceneStatus.source).some(v => !v)" class="pt-1 pb-2">⚠️ Se encontraron recursos faltantes</p>
      <p v-else class="pt-1">✅ Todos los recursos están listos</p>
    </div>
    <template v-slot:footer>
      <Message v-if="creationError" severity="error" :closable="false">{{ creationError }}</Message>
      <BaseButton
        v-if="!sceneStatus.scene || Object.values(sceneStatus.source).some(v => !v)"
        class="ml-auto"
        :disabled="creating"
        @click="createSceneAndSources()"
      >
        {{ creating ? 'Creando…' : 'Crear recursos' }}
      </BaseButton>
    </template>
  </BasicDialog>
</template>
