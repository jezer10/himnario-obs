<script setup lang="ts">
import Button from 'primevue/button'
withDefaults(
  defineProps<{
    title?: string
    type?: HTMLButtonElement['type']
  }>(),
  {
    type: 'button',
  },
)
</script>

<template>
  <Button
    :aria-label="title"
    :title
    :type
    size="small" severity="secondary" class="shrink-0"
  >
    <slot />
  </Button>
</template>
