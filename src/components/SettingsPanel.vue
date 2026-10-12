<script setup lang="ts">
import AboutApp from './AboutApp.vue'
import { computed, ref } from 'vue'
import { themeMode, obsThemeStatus } from '../theme'
import { useObs } from '../composables/obs'
import { defaultValues, useSettingsStore, useObsStore } from '../store'
import BasicDialog from './BasicDialog.vue'
import InputSelect from './commons/InputSelect.vue'
import InputText from './commons/InputText.vue'
import InputSwitch from './commons/InputSwitch.vue'
import BaseButton from './commons/BaseButton.vue'

const store = useSettingsStore()
const obsStore = useObsStore()
const sceneOptions = computed(() => [
  { label: 'ninguno', value: '' },
  ...Array.from(new Set([
    store.onSearchHymnScene, store.onMusicEndSwitchToScene,
    ...obsStore.sceneList.map(scene => scene.sceneName),
  ].filter(Boolean))).map(value => ({ label: value, value })),
])
const themeOptions = [
  { label: 'Seguir claro/oscuro de OBS', value: 'obs' },
  { label: 'claro', value: 'light' },
  { label: 'oscuro', value: 'dark' },
]

const { reconnect, connected, connecting } = useObs()

const dialog = ref<InstanceType<typeof BasicDialog> | null>(null)
async function closeDialog() {
  store.$persist()
  void reconnect()
  dialog.value?.close()
}
</script>

<template>
  <BaseButton
    class="grid place-items-center ml-auto"
    title="Configuración"
    @click="dialog?.open"
  >
    <i class="pi pi-cog" aria-hidden="true" />
  </BaseButton>
  <BasicDialog ref="dialog" title="Configuración" compact-header data-test="settings">
    <div class="text-sm space-y-4">
      <div class="mb-2">
        <h3 class="font-bold">Al buscar:</h3>
        <InputSwitch v-model="store.onlyInstrumental" id="oi">Solo instrumental</InputSwitch>
        <InputSwitch v-model="store.autoplayMusic" id="am">Autoreproducir música</InputSwitch>
        <InputSwitch v-model="store.autodriveVerses" id="av">Avance automático</InputSwitch>
        <InputSwitch v-model="store.onSearchSwitchToHymnScene" id="sch">Cambiar a escena de himno</InputSwitch>
        <div class="flex flex-col gap-2">
          <label for="hs">Escena de himno</label>
          <InputSelect v-model="store.onSearchHymnScene" id="hs" :options="sceneOptions" />
        </div>
      </div>
      <div class="mb-2">
        <h3 class="font-bold">Al terminar la música:</h3>
        <div class="flex flex-col gap-2">
          <label for="sc">Cambiar a escena</label>
          <InputSelect v-model="store.onMusicEndSwitchToScene" id="sc" :options="sceneOptions" />
        </div>  
      </div>
      <div class="mb-2">
        <h3 class="font-bold">Red:</h3>
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <label for="ow">URL de OBS Websocket</label>
            <span class="flex items-center gap-1 text-xs" role="status">
              <span aria-hidden="true" class="size-[7px] shrink-0 rounded-full" :class="connected ? 'bg-status-success' : 'bg-status-danger'"></span>
              {{ connected ? 'Conectado' : connecting ? 'Conectando…' : 'Reintentando…' }}
            </span>
          </div>
          <InputText v-model="store.obsWebsocketUrl" id="ow" :placeholder="defaultValues.obsWebsocketUrl" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="mh">URL de host de música</label>
          <InputText v-model="store.musicHostUrl" id="mh" :placeholder="defaultValues.musicHostUrl ?? 'default'" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="ha">URL de API de himnario</label>
          <InputText v-model="store.hymnalApiUrl" id="ha" :placeholder="defaultValues.hymnalApiUrl" />
        </div>
      </div>
      <div class="mb-3">
        <h3 class="font-bold">Personalización:</h3>
        <div class="flex flex-col gap-2">
          <label for="tm">Tema</label>
          <InputSelect v-model="themeMode" id="tm" :options="themeOptions" />
          <p v-if="themeMode === 'obs'" class="text-obs-muted mt-1 text-xs" role="status">{{ obsThemeStatus }}</p>
          <p v-if="themeMode === 'obs'" class="mt-1 text-xs">
            Carga el <a href="./obs/himnario-theme.lua" download class="underline focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:outline-offset-1">script de tema</a>
            en OBS: Herramientas → Scripts → +. El panel se conecta automáticamente.
          </p>
        </div>
      </div>
    </div>
    <template v-slot:footer>
      <AboutApp />
      <BaseButton
        class="ml-auto"
        title="Guardar y cerrar"
        @click="closeDialog"
      >
        Guardar y cerrar
      </BaseButton>
    </template>
  </BasicDialog>
</template>
