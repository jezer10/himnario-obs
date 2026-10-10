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
    role="switch"
    :aria-checked="store.autodriveVerses"
    aria-label="Autoconducir versos"
    :title="store.autodriveVerses ? 'Desactivar' : 'Activar'"
    @click="setAutodriveVerses(!store.autodriveVerses)"
  >
    <span class="switch-track" aria-hidden="true"><span></span></span>
    <span class="autodrive-full">Autoconducir: {{ store.autodriveVerses ? 'sí' : 'no' }}</span>
    <span class="autodrive-short" aria-hidden="true">Auto</span>
  </BaseButton>
</template>