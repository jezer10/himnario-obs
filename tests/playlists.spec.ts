import { describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createAppPinia } from '../src/pinia'
import { playlistsKey, usePlaylistsStore } from '../src/playlists'

describe('local playlists', () => {
  it('persists edits and restores order, names and repeated hymns', () => {
    const store = usePlaylistsStore()
    const id = store.create('  Culto sábado  ')!
    store.add(id, { number: 25, title: 'Himno 25' })
    store.add(id, { number: 25, title: 'Himno 25' })
    const second = store.lists[0]!.entries[1]!.id
    store.move(id, second, -1)
    store.lists[0]!.name = 'Culto domingo'
    const pinia = createAppPinia()
    createApp({}).use(pinia)
    const restored = usePlaylistsStore(pinia)
    expect(restored.lists[0]!.name).toBe('Culto domingo')
    expect(restored.lists[0]!.entries).toHaveLength(2)
    expect(restored.lists[0]!.entries[0]!.id).toBe(second)
    restored.lists[0]!.entries.splice(0, 1)
    expect(JSON.parse(localStorage.getItem(playlistsKey)!)[0].entries).toHaveLength(1)
    restored.lists = []
    expect(localStorage.getItem(playlistsKey)).toBe('[]')
  })

  it('recovers from malformed stored data', () => {
    localStorage.setItem(playlistsKey, '{broken')
    const store = usePlaylistsStore()
    expect(store.lists).toEqual([])
    expect(store.storageError).toContain('recuperar')
    store.create('Nueva')
    expect(store.storageError).toBe('')
  })

  it('reports failed saves while keeping the list in memory', () => {
    const store = usePlaylistsStore()
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('quota') })
    store.create('Culto')
    expect(store.lists).toHaveLength(1)
    expect(store.storageError).toContain('No se pudieron guardar')
    spy.mockRestore()
  })
})
