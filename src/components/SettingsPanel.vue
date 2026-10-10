<script setup lang="ts">
import AboutApp from './AboutApp.vue'
import { ref } from 'vue'
import { themeMode, obsThemeStatus } from '../theme'
import { useObs } from '../composables/obs'
import { defaultValues, useSettingsStore, useObsStore } from '../store'
import BasicDialog from './BasicDialog.vue'
import GearIcon from './icons/GearIcon.vue'
import InputSelect from './commons/InputSelect.vue'
import InputText from './commons/InputText.vue'
import InputSwitch from './commons/InputSwitch.vue'
import BaseButton from './commons/BaseButton.vue'

const store = useSettingsStore()
const obsStore = useObsStore()

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
    class="grid size-8 place-items-center p-1.5! ml-auto [&_svg]:size-[18px]"
    title="Configuración"
    @click="dialog?.open"
  >
    <GearIcon />
  </BaseButton>
  <BasicDialog ref="dialog" title="Configuración" compact-header data-test="settings">
    <div class="text-sm">
      <div class="mb-2">
        <h3 class="font-bold">Al buscar:</h3>
        <InputSwitch v-model="store.onlyInstrumental" id="oi">Solo instrumental</InputSwitch>
        <InputSwitch v-model="store.autoplayMusic" id="am">Autoreproducir música</InputSwitch>
        <InputSwitch v-model="store.autodriveVerses" id="av">Avance automático</InputSwitch>
        <InputSwitch v-model="store.onSearchSwitchToHymnScene" id="sch">Cambiar a escena de himno</InputSwitch>
        <div class="flex flex-col">
          <label for="hs">Escena de himno</label>
          <InputSelect v-model="store.onSearchHymnScene" id="hs">
            <option value="">ninguno</option>
            <option class="hidden" :value="store.onSearchHymnScene">{{ store.onSearchHymnScene }}</option>
            <option v-for="(scene, index) in obsStore.sceneList" :key="index" :value="scene.sceneName">{{ scene.sceneName }}</option>
          </InputSelect>
        </div>
      </div>
      <div class="mb-2">
        <h3 class="font-bold">Al terminar la música:</h3>
        <div class="flex flex-col">
          <label for="sc">Cambiar a escena</label>
          <InputSelect v-model="store.onMusicEndSwitchToScene" id="sc">
            <option value="">ninguno</option>
            <option class="hidden" :value="store.onMusicEndSwitchToScene">{{ store.onMusicEndSwitchToScene }}</option>
            <option v-for="(scene, index) in obsStore.sceneList" :key="index" :value="scene.sceneName">{{ scene.sceneName }}</option>
          </InputSelect>
        </div>  
      </div>
      <div class="mb-2">
        <h3 class="font-bold">Red:</h3>
        <div class="flex flex-col">
          <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <label for="ow">URL de OBS Websocket</label>
            <span class="flex items-center gap-1 text-xs" role="status">
              <span aria-hidden="true" class="size-[7px] shrink-0 rounded-full" :class="connected ? 'bg-green-600' : 'bg-red-600'"></span>
              {{ connected ? 'Conectado' : connecting ? 'Conectando…' : 'Reintentando…' }}
            </span>
          </div>
          <InputText v-model="store.obsWebsocketUrl" id="ow" :placeholder="defaultValues.obsWebsocketUrl" />
        </div>
        <div class="flex flex-col">
          <label for="mh">URL de host de música</label>
          <InputText v-model="store.musicHostUrl" id="mh" :placeholder="defaultValues.musicHostUrl ?? 'default'" />
        </div>
        <div class="flex flex-col">
          <label for="ha">URL de API de himnario</label>
          <InputText v-model="store.hymnalApiUrl" id="ha" :placeholder="defaultValues.hymnalApiUrl" />
        </div>
      </div>
      <div class="mb-3">
        <h3 class="font-bold">Personalización:</h3>
        <div class="flex flex-col">
          <label for="tm">Tema</label>
          <InputSelect v-model="themeMode" id="tm">
            <option value="obs">Seguir tema de OBS</option>
            <option value="light">claro</option>
            <option value="dark">oscuro</option>
          </InputSelect>
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
