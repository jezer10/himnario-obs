<script setup lang="ts">
defineProps<{
  id?: string
}>()

const value = defineModel()
</script>

<template>
  <select v-model="value" :id class="obs-select min-h-7 min-w-0 rounded border px-2 py-1 text-inherit">
    <slot />
  </select>
</template>
