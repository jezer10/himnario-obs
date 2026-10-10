<script setup lang="ts">
defineProps<{
  id?: string
}>()

const value = defineModel()
</script>

<template>
  <select v-model="value" :id class="min-h-7 min-w-0 rounded border border-obs-border bg-obs-input px-2 py-1 text-inherit hover:bg-obs-hover hover:border-obs-border focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:outline-offset-1">
    <slot />
  </select>
</template>
