<script setup lang="ts">
import PrimeInputText from 'primevue/inputtext'
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

const value = defineModel<string>()
</script>

<template>
  <PrimeInputText
    v-model="value"
    :id
    :placeholder
    :type
    size="small" class="min-w-0 w-full"
  />
</template>
