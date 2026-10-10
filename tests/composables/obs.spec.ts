import { beforeEach, describe, expect, it, vi } from 'vitest'
import OBSWebSocket from 'obs-websocket-js'
import { useObs } from '../../src/composables/obs'
import { useSettingsStore } from '../../src/store'

const names = ['himno_numero', 'himno_titulo', 'verso_numero', 'verso_contenido']
let studio = false
let program = 'Himnario'
let preview = 'Himnario'
let api: ReturnType<typeof useObs>
const call = vi.spyOn(OBSWebSocket.prototype, 'call')
vi.spyOn(OBSWebSocket.prototype, 'connect').mockResolvedValue(undefined as never)

beforeEach(async () => {
  studio = false
  program = 'Himnario'
  preview = 'Himnario'
  call.mockReset()
  call.mockImplementation(async (request) => {
    if (request === 'GetSceneList') return { scenes: [{ sceneName: 'Himnario' }], currentProgramSceneName: program, currentPreviewSceneName: preview } as never
    if (request === 'GetSceneItemList') return { sceneItems: names.map((sourceName, sceneItemId) => ({ sourceName, sceneItemId })) } as never
    if (request === 'GetStudioModeEnabled') return { studioModeEnabled: studio } as never
    if (request === 'GetCurrentProgramScene') return { currentProgramSceneName: program } as never
    if (request === 'GetCurrentPreviewScene') return { currentPreviewSceneName: preview } as never
    if (request === 'GetCurrentSceneTransitionCursor') return { transitionCursor: 1 } as never
    return {} as never
  })
  api = useObs()
  api.connected.value = false
  await api.connect()
  call.mockClear()
})

describe('Hymn output in normal and studio modes', () => {
  it('updates title and verse visibility in normal mode without a transition', async () => {
    await api.displayHymn(true, '1', 'Título')
    await api.displayHymn(false, '1', 'Estrofa')
    const visibility = call.mock.calls.filter(([name]) => name === 'SetSceneItemEnabled')
    expect(visibility.map(([, data]) => (data as { sceneItemEnabled: boolean }).sceneItemEnabled))
      .toEqual([true, true, false, false, false, false, true, true])
    expect(call).not.toHaveBeenCalledWith('SetCurrentProgramScene', expect.anything())
  })

  it('publishes title, verses, and return to title when the hymn is on air in studio mode', async () => {
    studio = true
    await api.displayHymn(true, '1', 'Título')
    await api.displayHymn(false, '1', 'Estrofa')
    await api.displayHymn(true, '1', 'Título')
    const publish = call.mock.calls.filter(([name]) => name === 'SetCurrentProgramScene')
    expect(publish).toEqual(Array(3).fill(['SetCurrentProgramScene', { sceneName: 'Himnario' }]))
    expect(call).not.toHaveBeenCalledWith('TriggerStudioModeTransition')
    expect(call).not.toHaveBeenCalledWith('SetCurrentPreviewScene', expect.anything())
  })

  it.each([false, true])('prepares the hymn without replacing another program scene with studio=%s', async (mode) => {
    studio = mode
    program = 'Cámara'
    await api.displayHymn(true, '1', 'Título')
    expect(call).toHaveBeenCalledWith('SetInputSettings', expect.anything())
    expect(call).not.toHaveBeenCalledWith('SetCurrentProgramScene', expect.anything())
  })

  it('changes visibility in the owning group for grouped text sources', async () => {
    const original = call.getMockImplementation()!
    call.mockImplementation(async (request, data) => {
      if (request === 'GetSceneItemList') return { sceneItems: [{ sourceName: 'Textos', isGroup: true }] } as never
      if (request === 'GetGroupSceneItemList') return { sceneItems: names.map((sourceName, sceneItemId) => ({ sourceName, sceneItemId })) } as never
      return original(request, data)
    })
    await api.displayHymn(false, '1', 'Estrofa')
    const visibility = call.mock.calls.filter(([name]) => name === 'SetSceneItemEnabled')
    expect(visibility).toHaveLength(4)
    for (const [, data] of visibility) expect(data).toMatchObject({ sceneName: 'Textos' })
  })

  it('restores an unrelated preview after OBS swaps scenes on transition', async () => {
    studio = true
    preview = 'Cámara'
    const original = call.getMockImplementation()!
    call.mockImplementation(async (request, data) => {
      if (request === 'SetCurrentProgramScene') preview = 'Himnario'
      return original(request, data)
    })
    await api.displayHymn(false, '1', 'Estrofa')
    expect(call).toHaveBeenCalledWith('SetCurrentProgramScene', { sceneName: 'Himnario' })
    expect(call).toHaveBeenCalledWith('SetCurrentPreviewScene', { sceneName: 'Cámara' })
  })

  it('does not overwrite a preview selected by the operator during transition', async () => {
    studio = true
    preview = 'Cámara'
    const original = call.getMockImplementation()!
    call.mockImplementation(async (request, data) => {
      if (request === 'SetCurrentProgramScene') preview = 'Biblia'
      return original(request, data)
    })
    await api.displayHymn(false, '1', 'Estrofa')
    expect(call).not.toHaveBeenCalledWith('SetCurrentPreviewScene', expect.anything())
  })

  it('waits for an active transition before publishing', async () => {
    studio = true
    let remaining = 2
    const original = call.getMockImplementation()!
    call.mockImplementation(async (request, data) => {
      if (request === 'GetCurrentSceneTransitionCursor' && remaining-- > 0) return { transitionCursor: 0.5 } as never
      return original(request, data)
    })
    await api.displayHymn(true, '1', 'Título')
    const publishIndex = call.mock.calls.findIndex(([name]) => name === 'SetCurrentProgramScene')
    expect(call.mock.calls.slice(0, publishIndex).filter(([name]) => name === 'GetCurrentSceneTransitionCursor')).toHaveLength(3)
  })

  it.each([false, true])('honors explicit scene switching with studio=%s', async (mode) => {
    studio = mode
    program = 'Cámara'
    useSettingsStore().onSearchSwitchToHymnScene = true
    await api.displayHymn(true, '1', 'Título')
    expect(call).toHaveBeenCalledWith('SetCurrentProgramScene', { sceneName: 'Himnario' })
  })

  it('serializes rapid updates and writes all text before publishing', async () => {
    studio = true
    await Promise.all([api.displayHymn(true, '1', 'Título'), api.displayHymn(false, '2', 'Estrofa')])
    const requests = call.mock.calls
    const firstPublish = requests.findIndex(([name]) => name === 'SetCurrentProgramScene')
    const verseWrite = requests.findIndex(([name, data]) => name === 'SetInputSettings' && (data as { inputName: string }).inputName === 'verso_numero')
    expect(firstPublish).toBeLessThan(verseWrite)
    expect(requests.filter(([name]) => name === 'SetCurrentProgramScene')).toHaveLength(2)
  })

  it('allows a subsequent update after a failed request', async () => {
    call.mockRejectedValueOnce(new Error('connection interrupted'))
    await expect(api.displayHymn(true, '1', 'Título')).rejects.toThrow('connection interrupted')
    await expect(api.displayHymn(false, '1', 'Estrofa')).resolves.toBeUndefined()
  })

  it('does nothing while disconnected', async () => {
    api.connected.value = false
    await api.displayHymn(true, '1', 'Título')
    expect(call).not.toHaveBeenCalled()
  })
})
