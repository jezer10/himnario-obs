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
    aria-label="Autoconducir versos"
    :title="store.autodriveVerses ? 'Desactivar' : 'Activar'"
    @click="setAutodriveVerses(!store.autodriveVerses)"
  >
    <span class="inline-flex h-3.5 w-6 rounded-[9px] bg-obs-border p-0.5 group-aria-checked:bg-obs-focus group-aria-checked:justify-end [&>span]:size-2.5 [&>span]:rounded-full [&>span]:bg-obs-text" aria-hidden="true"><span></span></span>
    <span class="hidden">Autoconducir: {{ store.autodriveVerses ? 'sí' : 'no' }}</span>
    <span class="inline" aria-hidden="true">Auto</span>
  </BaseButton>
</template>