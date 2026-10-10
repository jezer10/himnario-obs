import type { Hymn, HymnSequence } from '../models/hymn.ts'
import { defaultValues } from '../store.ts'
import Fetch from './api.ts'

const sHymn = {
  async all(host = defaultValues.hymnalApiUrl): Promise<Hymn[]> {
    const url = `${host}/hymn`
    const response = await Fetch(url)
    if (!response.ok) throw new Error('No se pudieron cargar los himnos')
    return response.json()
  },
  async byNumber(_number: number, host = defaultValues.hymnalApiUrl): Promise<HymnSequence> {
    const url = `${
      host
    }/hymn/${_number}`
    const response = await Fetch(url)
    if (response.status === 404) {
      throw new Error('Himno no encontrado')
    }
    if (!response.ok) throw new Error('No se pudieron cargar los himnos')
    return response.json()
  },
}

export default sHymn
