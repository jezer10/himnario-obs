<script setup lang="ts">
import AutoComplete from 'primevue/autocomplete'
import Message from 'primevue/message'
import { computed, ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { useSettingsStore, defaultValues } from '../store'
import sHymn from '../services/HymnService'
import type { Hymn } from '../models/hymn'

const emit = defineEmits<{ onPlayHymn: [number: number] }>()
const store = useSettingsStore()
const { data, isLoading: loading, error } = useQuery({
  key: () => ['hymns', store.hymnalApiUrl || defaultValues.hymnalApiUrl],
  query: () => sHymn.all(store.hymnalApiUrl || defaultValues.hymnalApiUrl),
  staleTime: 300_000,
})
const query = ref<string | Hymn>('')
const suggestions = ref<Hymn[]>([])
const searcher = ref<InstanceType<typeof AutoComplete> & { hide: () => void }>()
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
const label = (hymn: Hymn) => typeof hymn === 'string' ? hymn : hymn.number + ' · ' + hymn.title
const matches = computed(() => {
  const term = normalize(typeof query.value === 'string' ? query.value : label(query.value))
  return (data.value ?? []).filter(h => !term || normalize(label(h)).includes(term))
    .sort((a, b) => Number(String(b.number) === term) - Number(String(a.number) === term))
})
function complete() { suggestions.value = [...matches.value] }
function choose(hymn: Hymn) { emit('onPlayHymn', hymn.number) }
function submit() {
  if (typeof query.value !== 'string') { choose(query.value); return }
  const term = query.value.trim()
  if (!term) return
  const number = /^\d+$/.test(term) && +term >= 1 && +term <= 613 ? +term : matches.value[0]?.number
  if (number) {
    query.value = (data.value ?? []).find(h => h.number === number) ?? String(number)
    searcher.value?.hide()
    emit('onPlayHymn', number)
  }
}
</script>

<template>
  <form class="relative min-w-0" role="search" @submit.prevent="submit">
    <AutoComplete ref="searcher" v-model="query" :suggestions="suggestions" :option-label="label"
      :delay="0" :min-length="0" complete-on-focus :auto-option-focus="false" append-to="body"
      aria-label="Buscar himno por número o título" placeholder="Número o título del himno"
      fluid size="small" input-class="w-full"
      scroll-height="min(160px,50dvh)" empty-search-message="No se encontraron himnos"
      :pt="{ pcInputText: { root: { 'data-test': 'search-hymn' } } }"
      @complete="complete" @option-select="choose($event.value)">
      <template #option="{ option }"><span data-test="hymn-item">{{ label(option) }}</span></template>
    </AutoComplete>
    <Message v-if="loading" severity="info" class="text-xs" :closable="false">Cargando himnos…</Message>
    <Message v-else-if="error" severity="error" class="text-xs" :closable="false">No se pudo cargar la lista. Puedes buscar por número.</Message>
  </form>
</template>
