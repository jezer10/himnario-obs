import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface PlaylistEntry {
  id: string
  number: number
  title: string
}
export interface Playlist {
  id: string
  name: string
  entries: PlaylistEntry[]
}
export const playlistsKey = 'himnario-playlists-v1'

export const usePlaylistsStore = defineStore('playlists', () => {
  const lists = ref<Playlist[]>([])
  const storageError = ref('')
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(playlistsKey) || '[]')
    if (
      !Array.isArray(saved) ||
      !saved.every(
        (p) =>
          p &&
          typeof p.id === 'string' &&
          typeof p.name === 'string' &&
          Array.isArray(p.entries) &&
          p.entries.every(
            (e: PlaylistEntry) =>
              e &&
              typeof e.id === 'string' &&
              Number.isInteger(e.number) &&
              e.number > 0 &&
              typeof e.title === 'string',
          ),
      )
    )
      throw new Error('Invalid playlists')
    lists.value = saved
  } catch {
    storageError.value =
      'No se pudieron recuperar las playlists guardadas. Puedes crear una nueva lista.'
  }
  watch(
    lists,
    () => {
      try {
        localStorage.setItem(playlistsKey, JSON.stringify(lists.value))
        storageError.value = ''
      } catch {
        storageError.value =
          'No se pudieron guardar los cambios. Se conservarán solo mientras esta ventana siga abierta.'
      }
    },
    { deep: true, flush: 'sync' },
  )
  function create(name: string) {
    if (!name.trim()) return
    const list: Playlist = { id: crypto.randomUUID(), name: name.trim(), entries: [] }
    lists.value.push(list)
    return list.id
  }
  function add(listId: string, hymn: { number: number; title: string }) {
    lists.value
      .find((p) => p.id === listId)
      ?.entries.push({ id: crypto.randomUUID(), number: hymn.number, title: hymn.title })
  }
  function move(listId: string, entryId: string, offset: number) {
    const entries = lists.value.find((p) => p.id === listId)?.entries
    if (!entries) return
    const index = entries.findIndex((e) => e.id === entryId)
    const target = index + offset
    if (index < 0 || target < 0 || target >= entries.length) return
    const [entry] = entries.splice(index, 1)
    entries.splice(target, 0, entry!)
  }
  return { lists, storageError, create, add, move }
})
