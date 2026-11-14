<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import AutoComplete from 'primevue/autocomplete'
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
const newPlaylistId = 'new-playlist'
type PlaylistOption = { id: string; name: string; draft?: string }
const playlistQuery = ref<string | PlaylistOption>(selected.value || '')
const suggestions = ref<PlaylistOption[]>([])
const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
function complete({ query }: { query: string }) {
  const draft = typeof playlistQuery.value === 'string' ? query.trim().slice(0, 80) : ''
  suggestions.value = [
    ...playlists.lists.filter(p => normalize(p.name).includes(normalize(draft))),
    { id: newPlaylistId, name: draft ? `Crear «${draft}»` : 'Nueva playlist', draft },
  ]
}
const panel = ref<HTMLElement>()
const editing = ref(false)
const creating = ref(false)
const searchOpen = ref(false)
const name = ref('')
const adding = ref(false)
const error = ref('')
const notice = ref('')
const confirmDelete = ref(false)
watch(selectedId, () => { playlistQuery.value = selected.value || ''; confirmDelete.value = false; notice.value = ''; error.value = ''; editing.value = false; searchOpen.value = false })
async function editName(rename = false, draft = '') {
  editing.value = rename
  creating.value = !rename
  confirmDelete.value = false
  name.value = rename ? selected.value?.name || '' : draft
  await nextTick()
  panel.value?.querySelector<HTMLInputElement>('.playlist-toolbar input')?.focus()
}
function choosePlaylist(option: PlaylistOption) {
  if (option.id === newPlaylistId) {
    if (option.draft?.trim()) {
      selectedId.value = playlists.create(option.draft)
      playlistQuery.value = selected.value || ''
    } else { void editName() }
    return
  }
  selectedId.value = option.id
}
async function cancelName() {
  editing.value = false
  creating.value = false
  name.value = ''
  playlistQuery.value = selected.value || ''
  await nextTick()
  panel.value?.querySelector<HTMLElement>('.playlist-toolbar [role="combobox"]')?.focus()
}
function saveName() {
  if (!name.value.trim()) return
  if (editing.value && selected.value) selected.value.name = name.value.trim()
  else selectedId.value = playlists.create(name.value)
  editing.value = false
  creating.value = false
  name.value = ''
  playlistQuery.value = selected.value || ''
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
  <section ref="panel" class="playlist-panel" aria-label="Playlists">
    <h2 class="sr-only">Playlists</h2>
    <Message v-if="playlists.storageError" severity="error" :closable="false">{{ playlists.storageError }}</Message>
    <div v-if="!creating && !editing" class="playlist-toolbar">
      <AutoComplete v-model="playlistQuery" :suggestions="suggestions" option-label="name" placeholder="Busca o crea una playlist" aria-label="Playlist" class="playlist-select" fluid size="small" dropdown dropdown-mode="blank" :delay="0" :min-length="0" complete-on-focus :auto-option-focus="false" append-to="body" scroll-height="min(240px,50dvh)" @complete="complete" @option-select="choosePlaylist($event.value)">
        <template #option="{ option }"><span class="playlist-option"><i :class="option.id === newPlaylistId ? 'pi pi-plus' : 'pi pi-list'" aria-hidden="true" /><span>{{ option.name }}</span></span></template>
      </AutoComplete>
      <BaseButton v-if="selected" title="Renombrar playlist" @click="editName(true)"><i class="pi pi-pencil" aria-hidden="true" /></BaseButton>
      <BaseButton v-if="selected" title="Eliminar playlist" @click="confirmDelete = !confirmDelete"><i class="pi pi-trash" aria-hidden="true" /></BaseButton>
    </div>
    <form v-else class="playlist-toolbar" @submit.prevent="saveName" @keydown.esc.prevent="cancelName">
      <InputText v-model="name" :aria-label="editing ? 'Nuevo nombre de la playlist' : 'Nombre de la nueva playlist'" :placeholder="editing ? 'Nuevo nombre' : 'Nombre de la playlist'" maxlength="80" class="playlist-select" />
      <BaseButton type="submit" :disabled="!name.trim()">{{ editing ? 'Guardar' : 'Crear' }}</BaseButton>
      <BaseButton :title="editing ? 'Cancelar cambio de nombre' : 'Cancelar creación'" @click="cancelName"><i class="pi pi-times" aria-hidden="true" /></BaseButton>
    </form>
    <div v-if="confirmDelete" class="playlist-confirm">
      <p>¿Eliminar «{{ selected?.name }}» y su lista de himnos?</p>
      <BaseButton @click="removeList">Eliminar</BaseButton>
      <BaseButton @click="confirmDelete = false">Cancelar</BaseButton>
    </div>
    <template v-if="selected">
      <div class="playlist-list-heading"><span>{{ selected.entries.length }} {{ selected.entries.length === 1 ? 'himno' : 'himnos' }}</span><BaseButton class="playlist-add" :aria-expanded="searchOpen || !selected.entries.length" @click="searchOpen = !searchOpen"><i class="pi pi-plus" aria-hidden="true" />Agregar himnos</BaseButton></div>
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
    <p v-else class="playlist-empty">{{ creating ? 'Dale un nombre, por ejemplo «Culto sábado».' : 'Crea tu primera playlist desde la barra de arriba y prepara el orden de tus himnos.' }}</p>
    <p v-if="playlists.lists.length && !playlists.storageError" class="playlist-local-note">Guardadas en este navegador</p>
  </section>
</template>
