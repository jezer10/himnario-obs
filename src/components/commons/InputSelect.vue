<script setup lang="ts">
import Select from 'primevue/select'
defineProps<{ id?: string; options: { label: string; value: string }[] }>()
const value = defineModel<string>()
</script>
<template>
  <Select v-model="value" :input-id="id" :options="options" option-label="label" option-value="value"
    append-to="body" size="small" class="min-w-0 w-full" />
</template>
