<script setup lang="ts">
defineProps<{ id: string }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label :for="id" class="obs-switch-row flex cursor-pointer items-center justify-between gap-3 py-1 select-none touch-manipulation">
    <span><slot /></span>
    <input :id="id" v-model="model" type="checkbox" role="switch" class="peer sr-only">
    <span
      aria-hidden="true"
      class="obs-switch"
    ></span>
  </label>
</template>
