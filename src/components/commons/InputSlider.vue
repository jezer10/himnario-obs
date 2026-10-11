<script setup lang="ts">
import Slider from 'primevue/slider'
defineProps<{ modelValue: number; min?: number; max: number; step: number; disabled?: boolean; label: string; valueText: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: number]; slideend: [value: number]; slidestart: []; slidecancel: [] }>()
</script>
<template>
  <Slider :model-value="modelValue" :min="min ?? 0" :max="max" :step="step" :disabled="disabled" :aria-label="label"
    :pt="{ handle: { onPointerdown: () => emit('slidestart'), onPointercancel: () => emit('slidecancel') }, input: { 'aria-valuetext': valueText } }"
    @slideend="emit('slideend', $event.value as number)"
    @update:model-value="emit('update:modelValue', $event as number)" />
</template>
