<script setup lang="ts">
import AdminPanel from './components/AdminPanel.vue'
</script>

<template>
  <AdminPanel />
</template>

<style>
@import "tailwindcss";
@import "./styles/obs-theme.css";

@custom-variant dark (&:where(.dark, .dark *));
</style>
