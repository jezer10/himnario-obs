import { type Ref, ref } from 'vue'
import { useQueryCache } from '@pinia/colada'
import type { HymnSequence } from '../models/hymn.ts'
import sHymn from '../services/HymnService.ts'
import { defaultValues, useSettingsStore } from '../store.ts'

export function useHymn() {
  const store = useSettingsStore()
  const cache = useQueryCache()
  let searchId = 0
  const hymnIndex: Ref<number> = ref(0)
  const hymnNumber: Ref<number | string> = ref('')
  const hymnData: Ref<HymnSequence | undefined> = ref()

  async function searchHymn(number: number | string) {
    if (!number) {
      alert('Ingrese un número de himno')
      return
    }
    const currentSearch = ++searchId
    const host = store.hymnalApiUrl || defaultValues.hymnalApiUrl
    const entry = cache.ensure({
      key: ['hymns', host, +number],
      query: () => sHymn.byNumber(+number, host),
      staleTime: 300_000,
    })
    const result = await cache.refresh(entry)
    if (currentSearch !== searchId) return false
    if (result.status === 'error') throw result.error
    hymnData.value = result.data
    hymnIndex.value = 0
    return true
  }

  function fileUrl() {
    if (!hymnData.value) {
      return ''
    }
    const fileName = hymnData.value.mp3Filename
    const hostUrl = `${store.musicHostUrl ? store.musicHostUrl : defaultValues.musicHostUrl}/${
      store.onlyInstrumental ? 'instrumental' : 'vocal'
    }/${encodeURIComponent(fileName)}`
    return hostUrl
  }

  return {
    hymnIndex,
    hymnNumber,
    hymnData,
    searchHymn,
    fileUrl,
  }
}
