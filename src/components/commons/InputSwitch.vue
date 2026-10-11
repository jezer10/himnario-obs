<script setup lang="ts">
import ToggleSwitch from 'primevue/toggleswitch'
defineProps<{ id: string }>()
const model = defineModel<boolean>({ required: true })
</script>
<template>
  <label :for="id" class="flex cursor-pointer items-center justify-between gap-3 py-2 select-none touch-manipulation">
    <span><slot /></span>
    <ToggleSwitch v-model="model" :input-id="id" />
  </label>
</template>
