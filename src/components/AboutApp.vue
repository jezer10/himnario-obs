<script setup lang="ts">
import { onMounted, ref } from 'vue'
import packageJson from '../../package.json'
import { useSettingsStore } from '../store.ts'
import BasicDialog from './BasicDialog.vue'
import AboutIcon from './icons/AboutIcon.vue'
import BaseButton from './commons/BaseButton.vue'

const store = useSettingsStore()

const dialog = ref<InstanceType<typeof BasicDialog> | null>(null)

onMounted(() => {
  if (store.isFirstTimeInVersion) {
    store.markVersionSeen()
    dialog.value?.open()
  }
})
</script>

<template>
  <BaseButton
    class="grid size-8 place-items-center p-1.5! [&_svg]:size-[18px]"
    title="Acerca de"
    @click="dialog?.open"
  >
    <AboutIcon />
  </BaseButton>
  <BasicDialog ref="dialog" title="Himnario Adventista Broadcast" data-test="release-notes">
    <div class="flex flex-col gap-1">
      <div>
        <span class="font-bold">Versión</span>
        <p>{{ packageJson.version }}</p>
      </div>
      <div>
        <span class="font-bold">Notas de la versión</span>
        <ul class="list-disc pl-6">
          <li>Se añadió un selector del tema de interfaz (claro y oscuro) en la configuración.</li>
        </ul>
      </div>
      <div>
        <span class="font-bold">Guías</span>
        <ul class="list-disc pl-6">
          <li>
            <a href="https://github.com/jhormanrus/himnario-adventista-broadcast/wiki/C%C3%B3mo-configurar-OBS-Studio-para-usar-el-Himnario-Adventista-Broadcast" target="_blank" rel="noopener noreferrer" class="text-sky-500 hover:underline focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:outline-offset-1">
              Cómo configurar OBS Studio para usar el Himnario Adventista Broadcast
            </a>
          </li>
          <li>
            <a href="https://github.com/jhormanrus/himnario-adventista-broadcast/wiki/C%C3%B3mo-configurar-el-servidor-WebSocket-en-OBS-Studio" target="_blank" rel="noopener noreferrer" class="text-sky-500 hover:underline focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:outline-offset-1">
              Cómo configurar el servidor WebSocket en OBS Studio
            </a>
          </li>
        </ul>
      </div>
      <div>
        <span class="font-bold">Repositorio</span>
        <p><a href="https://github.com/jhormanrus/himnario-adventista-broadcast" target="_blank" rel="noopener noreferrer" class="text-sky-500 hover:underline focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:outline-offset-1">himnario-adventista-broadcast</a></p>
      </div>
      <div>
        <span class="font-bold">Licencia</span>
        <p>MIT License</p>
      </div>
    </div>
  </BasicDialog>
</template>
