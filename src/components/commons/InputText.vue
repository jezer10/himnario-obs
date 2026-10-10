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
    class="min-h-7 min-w-0 rounded border border-obs-border bg-obs-input px-2 py-1 text-inherit hover:bg-obs-hover hover:border-obs-border focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:outline-offset-1"
  >
</template>
