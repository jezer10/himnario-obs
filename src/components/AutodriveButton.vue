<script setup lang="ts">
import { useSettingsStore } from '../store'
import BaseButton from './commons/BaseButton.vue';

const store = useSettingsStore()

function setAutodriveVerses(on: boolean) {
  store.autodriveVerses = on
}
</script>

<template>
  <BaseButton
    class="group flex items-center justify-center gap-1 whitespace-nowrap px-[5px]! py-0.5! text-xs!"
    role="switch"
    :aria-checked="store.autodriveVerses"
    aria-label="Avance automático"
    :title="store.autodriveVerses ? 'Desactivar avance automático' : 'Activar avance automático'"
    @click="setAutodriveVerses(!store.autodriveVerses)"
  >
    <span class="inline-flex h-3.5 w-6 rounded-[9px] bg-obs-border p-0.5 group-aria-checked:bg-obs-focus group-aria-checked:justify-end [&>span]:size-2.5 [&>span]:rounded-full [&>span]:bg-obs-text" aria-hidden="true"><span></span></span>
    <span>Avance automático</span>
  </BaseButton>
</template>
