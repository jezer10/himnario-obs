<script setup lang="ts">
import { onMounted } from 'vue'
import { injectSpeedInsights } from '@vercel/speed-insights'
import AdminPanel from './components/AdminPanel.vue'

onMounted(() => {
  injectSpeedInsights({
    framework: 'vue',
  })
})
</script>

<template>
  <AdminPanel />
</template>

