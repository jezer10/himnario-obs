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
    class="obs-field min-h-7 min-w-0 rounded border px-2 py-1 text-inherit"
  >
</template>
