import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHymn } from '../src/composables/hymn'
import type { HymnSequence } from '../src/models/hymn'
import sHymn from '../src/services/HymnService'
import { useSettingsStore } from '../src/store'

const hymn = (number: number): HymnSequence => ({
  id: number, number, title: `Himno ${number}`, mp3Filename: `${number}.mp3`,
  mp3Url: '', mp3UrlInstr: '', verses: [], sequence: [],
})

afterEach(() => vi.restoreAllMocks())

describe('hymn query cache', () => {
  it('reuses a fresh hymn and isolates responses from different servers', async () => {
    const request = vi.spyOn(sHymn, 'byNumber').mockResolvedValue(hymn(1))
    const { searchHymn } = useHymn()
    await searchHymn(1)
    await searchHymn(1)
    expect(request).toHaveBeenCalledTimes(1)
    useSettingsStore().hymnalApiUrl = 'https://other.example'
    await searchHymn(1)
    expect(request).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenLastCalledWith(1, 'https://other.example')
  })

  it('keeps the latest selection when earlier requests finish late', async () => {
    let finish!: (data: HymnSequence) => void
    vi.spyOn(sHymn, 'byNumber')
      .mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
      .mockResolvedValueOnce(hymn(2))
    const { searchHymn, hymnData } = useHymn()
    const earlier = searchHymn(1)
    await searchHymn(2)
    finish(hymn(1))
    expect(await earlier).toBe(false)
    expect(hymnData.value?.number).toBe(2)
  })

  it('reports a failed query and allows a retry without losing the current hymn', async () => {
    vi.spyOn(sHymn, 'byNumber')
      .mockResolvedValueOnce(hymn(1))
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(hymn(2))
    const { searchHymn, hymnData } = useHymn()
    await searchHymn(1)
    await expect(searchHymn(2)).rejects.toThrow('Offline')
    expect(hymnData.value?.number).toBe(1)
    await searchHymn(2)
    expect(hymnData.value?.number).toBe(2)
  })
})
