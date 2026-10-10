<script setup lang="ts">
defineProps<{
  id?: string
}>()

const value = defineModel()
</script>

<template>
  <select v-model="value" :id class="obs-input">
    <slot />
  </select>
</template>
