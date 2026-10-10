<script setup lang="ts">
import { store } from '../store'
import BaseButton from './commons/BaseButton.vue';

function setAutodriveVerses(on: boolean) {
  store.autodriveVerses = on
  localStorage.setItem('autodriveVerses', `${on}`)
}
</script>

<template>
  <BaseButton
    class="autodrive-button"
    :aria-pressed="store.autodriveVerses"
    aria-label="Autoconducir versos"
    :title="store.autodriveVerses ? 'Desactivar' : 'Activar'"
    @click="setAutodriveVerses(!store.autodriveVerses)"
  >
    <div class="rounded-full w-2 h-2" :class="store.autodriveVerses? 'bg-green-600' : 'bg-red-600'"></div>
    <span class="autodrive-full">Autoconducir: {{ store.autodriveVerses ? 'sí' : 'no' }}</span>
    <span class="autodrive-short" aria-hidden="true">Auto</span>
  </BaseButton>
</template>