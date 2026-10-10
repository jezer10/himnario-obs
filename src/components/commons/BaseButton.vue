<script setup lang="ts">
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
  <button
    :title
    :type
    class="obs-button"
  >
    <slot />
  </button>
</template>
