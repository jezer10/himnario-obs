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
    :aria-label="title"
    :title
    :type
    class="obs-button shrink-0 min-h-8 rounded border border-transparent bg-obs-control px-2 py-1 text-inherit hover:bg-obs-hover hover:border-obs-border active:bg-obs-pressed disabled:text-obs-muted disabled:bg-obs-base disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:outline-offset-1"
  >
    <slot />
  </button>
</template>
