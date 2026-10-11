<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
defineProps<{ title: string; compactHeader?: boolean }>()
const visible = ref(false)
function open() { visible.value = true }
function close() { visible.value = false }
defineExpose({ open, close })
</script>
<template>
  <Dialog v-model:visible="visible" modal :draggable="false" :header="title" :aria-label="title || 'Detalles'"
    :close-button-props="{ 'aria-label': 'Cerrar', title: 'Cerrar' }"
    class="w-[calc(100%-1rem)] max-w-[440px]" :style="{ maxHeight: 'calc(100dvh - 1rem)' }">
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </Dialog>
</template>
