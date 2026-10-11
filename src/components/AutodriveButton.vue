<script setup lang="ts">
import InputSwitch from './commons/InputSwitch.vue'
import { useSettingsStore } from '../store'
const store = useSettingsStore()
</script>
<template>
  <InputSwitch id="autodrive-verses" v-model="store.autodriveVerses">Avance automático</InputSwitch>
</template>
