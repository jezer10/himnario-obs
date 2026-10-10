<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string
    placeholder?: string
    type?: string
  }>(),
  {
    type: 'text',
  },
)

const value = defineModel()
</script>

<template>
  <input
    v-model="value"
    v-bind="$attrs"
    :id
    :placeholder
    :type
    class="obs-input"
  >
</template>
