<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Message from 'primevue/message'
import BaseButton from './commons/BaseButton.vue'
import HymnSearcher from './HymnSearcher.vue'
import { usePlaylistsStore, type PlaylistEntry } from '../playlists'
import { defaultValues, useSettingsStore } from '../store'
import sHymn from '../services/HymnService'

defineProps<{ activeEntryId?: string; busy?: boolean }>()
const emit = defineEmits<{ select: [listId: string, entry: PlaylistEntry] }>()
const playlists = usePlaylistsStore()
const settings = useSettingsStore()
const selectedId = ref<string | undefined>(playlists.lists[0]?.id)
const selected = computed(() => playlists.lists.find(p => p.id === selectedId.value))
const editing = ref(false)
const creating = ref(false)
const searchOpen = ref(false)
const name = ref('')
const adding = ref(false)
const error = ref('')
const notice = ref('')
const confirmDelete = ref(false)
watch(selectedId, () => { confirmDelete.value = false; notice.value = ''; error.value = ''; editing.value = false })
function saveName() {
  if (!name.value.trim()) return
  if (editing.value && selected.value) selected.value.name = name.value.trim()
  else selectedId.value = playlists.create(name.value)
  editing.value = false
  creating.value = false
  name.value = ''
}
function removeList() {
  playlists.lists = playlists.lists.filter(p => p.id !== selectedId.value)
  selectedId.value = playlists.lists[0]?.id
  confirmDelete.value = false
}
async function add(number: number) {
  const listId = selectedId.value
  if (!listId || adding.value) return
  searchOpen.value = true
  adding.value = true
  error.value = ''
  notice.value = ''
  try {
    const hymn = await sHymn.byNumber(number, settings.hymnalApiUrl || defaultValues.hymnalApiUrl)
    playlists.add(listId, hymn)
    if (selectedId.value === listId) notice.value = `Himno ${hymn.number} agregado.`
  } catch { error.value = 'No se pudo agregar el himno. Intenta nuevamente.' }
  finally { adding.value = false }
}
</script>

<template>
  <section class="playlist-panel" aria-label="Playlists">
    <div class="playlist-heading"><div><h2>Playlists</h2><span>Guardadas en este navegador</span></div><BaseButton v-if="playlists.lists.length" title="Nueva playlist" @click="creating = !creating; editing = false; name = ''"><i class="pi pi-plus" aria-hidden="true" /></BaseButton></div>
    <Message v-if="playlists.storageError" severity="error" :closable="false">{{ playlists.storageError }}</Message>
    <div v-if="playlists.lists.length" class="playlist-toolbar">
      <Select v-model="selectedId" :options="playlists.lists" option-label="name" option-value="id" aria-label="Playlist" class="playlist-select" />
      <BaseButton title="Renombrar playlist" @click="editing = true; name = selected?.name || ''"><i class="pi pi-pencil" aria-hidden="true" /></BaseButton>
      <BaseButton title="Eliminar playlist" @click="confirmDelete = !confirmDelete"><i class="pi pi-trash" aria-hidden="true" /></BaseButton>
    </div>
    <form v-if="!playlists.lists.length || creating || editing" class="playlist-toolbar" @submit.prevent="saveName">
      <InputText v-model="name" :aria-label="editing ? 'Nuevo nombre de la playlist' : 'Nombre de la nueva playlist'" :placeholder="editing ? 'Nuevo nombre' : 'Nueva playlist, ej. Culto sábado'" maxlength="80" class="playlist-select" />
      <BaseButton type="submit" :disabled="!name.trim()">{{ editing ? 'Guardar' : 'Crear' }}</BaseButton>
      <BaseButton v-if="editing" title="Cancelar cambio de nombre" @click="editing = false; name = ''"><i class="pi pi-times" aria-hidden="true" /></BaseButton>
    </form>
    <div v-if="confirmDelete" class="playlist-confirm">
      <p>¿Eliminar «{{ selected?.name }}» y su lista de himnos?</p>
      <BaseButton @click="removeList">Eliminar</BaseButton>
      <BaseButton @click="confirmDelete = false">Cancelar</BaseButton>
    </div>
    <template v-if="selected">
      <BaseButton class="playlist-add" :aria-expanded="searchOpen || !selected.entries.length" @click="searchOpen = !searchOpen"><i class="pi pi-plus" aria-hidden="true" />Agregar himnos</BaseButton>
      <div v-if="searchOpen || !selected.entries.length">
        <HymnSearcher @on-play-hymn="add" />
      </div>
      <p v-if="adding || notice" class="playlist-note" role="status">{{ adding ? 'Agregando himno…' : notice }}</p>
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
      <p v-if="!selected.entries.length" class="playlist-empty">Esta playlist aún no tiene himnos. Busca el primero por número o título.</p>
      <ol v-else class="playlist-entries">
        <li v-for="(entry, index) in selected.entries" :key="entry.id" :class="{ 'is-active': entry.id === activeEntryId }">
          <button class="playlist-track" :disabled="busy" :aria-current="entry.id === activeEntryId ? 'true' : undefined" :aria-label="`Cargar himno ${entry.number}: ${entry.title}`" @click="emit('select', selected.id, entry)">
            <span class="playlist-position">{{ index + 1 }}</span><span><strong>{{ entry.number }} · {{ entry.title }}</strong><small v-if="entry.id === activeEntryId">Himno actual</small></span>
          </button>
          <div class="playlist-entry-actions">
            <BaseButton :title="`Subir himno ${entry.number}`" :disabled="index === 0" @click="playlists.move(selected.id, entry.id, -1)"><i class="pi pi-angle-up" aria-hidden="true" /></BaseButton>
            <BaseButton :title="`Bajar himno ${entry.number}`" :disabled="index === selected.entries.length - 1" @click="playlists.move(selected.id, entry.id, 1)"><i class="pi pi-angle-down" aria-hidden="true" /></BaseButton>
            <BaseButton :title="`Quitar himno ${entry.number}`" @click="selected.entries.splice(index, 1)"><i class="pi pi-times" aria-hidden="true" /></BaseButton>
          </div>
        </li>
      </ol>
    </template>
    <p v-else class="playlist-empty">Prepara el orden de los himnos para tu próximo culto. Crea una playlist para comenzar.</p>
  </section>
</template>
