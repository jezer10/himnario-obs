<script setup lang="ts">
import { onMounted } from 'vue'
import { Analytics } from '@vercel/analytics/vue'
import { injectSpeedInsights } from '@vercel/speed-insights'
import AdminPanel from './components/AdminPanel.vue'

onMounted(() => {
  injectSpeedInsights({ framework: 'vue' })
})
</script>

<template>
  <AdminPanel />
  <Analytics />
</template>
