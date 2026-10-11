<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import { useQuery } from '@pinia/colada'
import { useSettingsStore, defaultValues } from '../store'
import sHymn from '../services/HymnService'

const emit = defineEmits<{ onPlayHymn: [number: number] }>()
const id = useId()
const store = useSettingsStore()
const { data, isLoading: loading, error } = useQuery({
  key: () => ['hymns', store.hymnalApiUrl || defaultValues.hymnalApiUrl],
  query: () => sHymn.all(store.hymnalApiUrl || defaultValues.hymnalApiUrl),
  staleTime: 300_000,
})
const hymns = computed(() => data.value ?? [])
const failed = computed(() => error.value !== null)
const query = ref('')
const open = ref(false)
const active = ref(-1)
const root = ref<HTMLElement>()
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
const matches = computed(() => {
  const term = normalize(query.value)
  return hymns.value.filter(h => !term || String(h.number).includes(term) || normalize(h.title).includes(term) || normalize(`${h.number} · ${h.title}`).includes(term))
    .sort((a, b) => Number(String(b.number) === term) - Number(String(a.number) === term))
})
function choose(number: number) {
  const hymn = hymns.value.find(h => h.number === number)
  query.value = hymn ? `${number} · ${hymn.title}` : String(number)
  open.value = false
  active.value = -1
  emit('onPlayHymn', number)
}
function submit() {
  if (!query.value.trim()) return
  if (open.value && active.value >= 0 && matches.value[active.value]) choose(matches.value[active.value].number)
  else if (/^\d+$/.test(query.value.trim()) && +query.value >= 1 && +query.value <= 613) choose(+query.value)
  else if (matches.value.length) choose(matches.value[0].number)
}
async function move(direction: number) {
  open.value = true
  active.value = Math.max(0, Math.min(matches.value.length - 1, active.value + direction))
  await nextTick()
  root.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
}
function blur(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node)) open.value = false
}
</script>

<template>
  <form ref="root" class="relative z-20 min-w-0" role="search" @submit.prevent="submit" @focusout="blur" @keydown.esc.stop.prevent="open = false">
    <input v-model="query" class="hymnal-search min-h-7 min-w-0 rounded border border-obs-border bg-obs-input px-2 py-1 text-inherit hover:bg-obs-hover hover:border-obs-border focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:outline-offset-1 w-full h-8" type="text" role="combobox" aria-label="Buscar himno por número o título" placeholder="Número o título del himno" autocomplete="off" :aria-expanded="open" :aria-controls="id + '-results'" aria-autocomplete="list" :aria-activedescendant="open && active >= 0 ? id + '-option-' + active : undefined" data-test="search-hymn" @focus="open = true" @input="open = true; active = -1" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)">
    <div v-if="open" class="absolute inset-x-0 top-[calc(100%+3px)] max-h-[min(160px,50dvh)] overflow-y-auto rounded border border-obs-border bg-obs-control shadow-[0_4px_12px_rgb(0_0_0/25%)] [scrollbar-width:thin]">
      <ul :id="id + '-results'" role="listbox" aria-label="Himnos encontrados">
        <li class="grid grid-cols-[30px_minmax(0,1fr)] gap-1.5 px-2 py-[7px] cursor-pointer text-[13px] leading-[1.3] [overflow-wrap:anywhere] hover:bg-obs-selection aria-selected:bg-obs-selection" v-for="(hymn, index) in matches" :id="id + '-option-' + index" :key="hymn.id" role="option" :aria-selected="index === active" data-test="hymn-item" @mousedown.prevent @click="choose(hymn.number)">
          <span class="text-obs-muted">{{ String(hymn.number).padStart(3, '0') }}</span><span>{{ hymn.title }}</span>
        </li>
      </ul>
      <p class="p-2 text-xs" v-if="loading || failed || !matches.length" role="status">{{ loading ? 'Cargando himnos…' : failed ? 'Lista no disponible. Escribe un número y pulsa Enter.' : 'Sin resultados' }}</p>
    </div>
  </form>
</template>
