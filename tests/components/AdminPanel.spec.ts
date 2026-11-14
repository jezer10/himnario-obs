import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VueWrapper, flushPromises, mount } from '@vue/test-utils'
import AdminPanel from '../../src/components/AdminPanel.vue'
import sHymn from '../../src/services/HymnService'
import OBSWebSocket from 'obs-websocket-js'
import { usePlaylistsStore } from '../../src/playlists'
import { useSettingsStore } from '../../src/store'

vi.spyOn(sHymn, 'all').mockResolvedValue([])
vi.spyOn(sHymn, 'byNumber').mockResolvedValue({
  id: 25,
  number: 25,
  title: "Siento la presencia del Señor",
  mp3Url: "https://docs.google.com/uc?export=download&id=1LGqFVV0O72W3KGykavnu-WgB-NSm9Se_",
  mp3UrlInstr: "https://docs.google.com/uc?export=download&id=18Gcl7OA_dSWx6ywFletCN4nGeBnhsleg",
  mp3Filename: "025 - Siento la presencia del Senor.mp3",
  verses: [],
  sequence: []
})
vi.spyOn(OBSWebSocket.prototype, 'connect').mockResolvedValue(undefined as any)
vi.spyOn(OBSWebSocket.prototype, 'call').mockResolvedValue({ scenes: [], sceneItems: [], studioModeEnabled: false } as any)

describe("AdminPanel component", () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    wrapper = mount(AdminPanel)
  })

  it('connects automatically and shows status beside the socket URL', async () => {
    await flushPromises()
    await wrapper.get('button[title="Configuración"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('label[for="ow"]').element.parentElement?.textContent).toContain('Conectado')
    expect(wrapper.find('[aria-label="Conexión con OBS"]').exists()).toBe(false)
  })

  it('searches a hymn', async () => {
    const numberInput = wrapper.get('[role="combobox"]')


    await numberInput.setValue('25')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const hymnTitle = wrapper.get('[data-test="hymn-title"]')

    expect(hymnTitle.text()).toContain('Siento la presencia del Señor')

    expect(wrapper.get('[data-test="music-caption"]').text()).toContain('En pausa')
    await wrapper.get('audio').trigger('play')
    expect(wrapper.get('[data-test="music-caption"]').text()).toContain('Reproduciendo')
    await wrapper.get('audio').trigger('pause')
    expect(wrapper.get('[data-test="music-caption"]').text()).toContain('En pausa')

    const sourceAudio = wrapper.get('audio>source')

    expect(sourceAudio.attributes('src')).toContain('025%20-%20Siento%20la%20presencia%20del%20Senor.mp3')
  })

  it('loads playlist entries paused and advances only on request', async () => {
    const playlists = usePlaylistsStore()
    const id = playlists.create('Culto sábado')!
    playlists.add(id, { number: 25, title: 'Primer himno' })
    playlists.add(id, { number: 26, title: 'Segundo himno' })
    useSettingsStore().autoplayMusic = true
    const play = vi.spyOn(wrapper.get('audio').element as HTMLAudioElement, 'play')
    await wrapper.get('[title="Playlists"]').trigger('click')
    await wrapper.get('[aria-label="Cargar himno 25: Primer himno"]').trigger('click')
    await flushPromises()
    expect(play).not.toHaveBeenCalled()
    expect(wrapper.get('.playlist-navigation').text()).toContain('1/2')
    await wrapper.get('audio').trigger('ended')
    await flushPromises()
    expect(wrapper.get('.playlist-navigation').text()).toContain('1/2')
    vi.mocked(sHymn.byNumber).mockRejectedValueOnce(new Error('offline'))
    await wrapper.get('[title="Siguiente himno"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('.playlist-navigation').text()).toContain('1/2')
    await wrapper.get('[title="Siguiente himno"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('.playlist-navigation').text()).toContain('2/2')
    expect(wrapper.get('[title="Siguiente himno"]').attributes('disabled')).toBeDefined()
    expect(play).not.toHaveBeenCalled()
  })

  it('seeks to a clicked verse and continues automatic lyric synchronization', async () => {
    vi.mocked(sHymn.byNumber).mockResolvedValueOnce({
      id: 1, number: 1, title: 'Prueba', mp3Url: '', mp3UrlInstr: '', mp3Filename: '1.mp3',
      verses: [
        { id: 1, number: 1, contents: [{ id: 1, content: 'Primera estrofa' }] },
        { id: 2, number: 2, contents: [{ id: 2, content: 'Segunda estrofa' }] },
      ],
      sequence: [
        { id: 1, timestamp: 1, verseId: 1, verseContentId: 1 },
        { id: 2, timestamp: 20, verseId: 2, verseContentId: 2 },
      ],
    })
    await wrapper.get('[role="combobox"]').setValue('1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    const store = useSettingsStore()
    store.autodriveVerses = false
    await wrapper.findAll('button.lyric-line')[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.get('.active-verse').text()).toBe('Segunda estrofa')
    expect(store.autodriveVerses).toBe(true)
    expect(wrapper.get('audio').element.currentTime).toBe(20)
    expect(OBSWebSocket.prototype.call).toHaveBeenCalledWith('SetInputSettings', {
      inputName: 'verso_contenido', inputSettings: { text: 'Segunda estrofa' },
    })
    wrapper.get('audio').element.currentTime = 2
    await wrapper.get('audio').trigger('timeupdate')
    await flushPromises()
    expect(wrapper.get('.active-verse').text()).toBe('Primera estrofa')
  })
  it('seeks, adjusts volume and toggles mute through custom controls', async () => {
    const audio = wrapper.get('audio')
    const element = audio.element as HTMLAudioElement
    Object.defineProperty(element, 'duration', { configurable: true, value: 180 })
    await audio.trigger('loadedmetadata')
    const progress = wrapper.get('input[aria-label="Progreso del himno"]')
    await progress.setValue('45')
    expect(element.currentTime).toBe(45)
    expect(progress.attributes('aria-valuetext')).toBe('0:45 de 3:00')
    expect(wrapper.find('input[aria-label="Volumen"]').exists()).toBe(false)
    await wrapper.get('[title="Volumen"]').trigger('click')
    await wrapper.get('input[aria-label="Volumen"]').setValue('0.35')
    expect(element.volume).toBe(0.35)
    await wrapper.get('[title="Silenciar"]').trigger('click')
    expect(element.muted).toBe(true)
    await wrapper.get('[title="Activar sonido"]').trigger('click')
    expect(element.muted).toBe(false)
    expect(element.volume).toBe(0.35)
  })

  it('reports playback failures without claiming music is playing', async () => {
    await wrapper.get('[role="combobox"]').setValue('25')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    vi.spyOn(wrapper.get('audio').element as HTMLAudioElement, 'play').mockRejectedValueOnce(new Error('unavailable'))
    await wrapper.get('[title="Reproducir música"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('No se pudo reproducir')
    expect(wrapper.get('[data-test="music-caption"]').text()).toContain('En pausa')
  })

  it.skip('enable/disable autoplay', async () => {
    const connectButton = wrapper.get('[title="Conectar"]')
    const enableAutoplayButton = wrapper.get('[title="Activar"]')
    const startButton = wrapper.get('[title="Principio"]')
    const previousButton = wrapper.get('[title="Verso anterior"]')
    const nextButton = wrapper.get('[title="Verso siguiente"]')
    const stopButton = wrapper.get('[title="Detener"]')

    await connectButton.trigger('click')
    await flushPromises()
    await enableAutoplayButton.trigger('click')
    
    expect(enableAutoplayButton.find('.bg-green').exists()).toBe(true)
    expect(wrapper.find('[title="Desactivar"]').exists()).toBe(true)

    expect(startButton.attributes('disabled')).toBeDefined()
    expect(previousButton.attributes('disabled')).toBeDefined()
    expect(nextButton.attributes('disabled')).toBeDefined()
    expect(stopButton.attributes('disabled')).toBeUndefined()

    await enableAutoplayButton.trigger('click')

    expect(enableAutoplayButton.find('.bg-red').exists()).toBe(true)
    expect(wrapper.find('[title="Activar"]').exists()).toBe(true)

    expect(startButton.attributes('disabled')).toBeDefined()
    expect(previousButton.attributes('disabled')).toBeDefined()
    expect(nextButton.attributes('disabled')).toBeUndefined()
    expect(stopButton.attributes('disabled')).toBeUndefined()
  })

  it.skip('enables/disables controls when connected/disconnected', async () => {
    const numberInput = wrapper.get('[role="combobox"]')

    const startButton = wrapper.get('[title="Principio"]')
    const previousButton = wrapper.get('[title="Verso anterior"]')
    const nextButton = wrapper.get('[title="Verso siguiente"]')
    const stopButton = wrapper.get('[title="Detener"]')

    // enables stop button when connected
    expect(startButton.attributes('disabled')).toBeDefined()
    expect(previousButton.attributes('disabled')).toBeDefined()
    expect(nextButton.attributes('disabled')).toBeDefined()
    expect(stopButton.attributes('disabled')).toBeUndefined()

    await numberInput.setValue('25')
    await searchButton.trigger('click')

    // enables next button when hymn is on title
    expect(startButton.attributes('disabled')).toBeDefined()
    expect(previousButton.attributes('disabled')).toBeDefined()
    expect(nextButton.attributes('disabled')).toBeUndefined()
    expect(stopButton.attributes('disabled')).toBeUndefined()

    await nextButton.trigger('click')

    // enables home button when hymn is on first verse
    expect(startButton.attributes('disabled')).toBeUndefined()
    expect(previousButton.attributes('disabled')).toBeDefined()
    expect(nextButton.attributes('disabled')).toBeUndefined()
    expect(stopButton.attributes('disabled')).toBeUndefined()

    await nextButton.trigger('click')

    // enables previous button and disables next button when hymn is on last verse
    expect(startButton.attributes('disabled')).toBeUndefined()
    expect(previousButton.attributes('disabled')).toBeUndefined()
    expect(nextButton.attributes('disabled')).toBeDefined()
    expect(stopButton.attributes('disabled')).toBeUndefined()

    await startButton.trigger('click')

    // disables home and previous buttons when hymn is on title
    expect(startButton.attributes('disabled')).toBeDefined()
    expect(previousButton.attributes('disabled')).toBeDefined()
    expect(nextButton.attributes('disabled')).toBeUndefined()
    expect(stopButton.attributes('disabled')).toBeUndefined()

    await nextButton.trigger('click')
    await nextButton.trigger('click')
    await searchButton.trigger('click')

    // resets controls when searching a hymn
    expect(startButton.attributes('disabled')).toBeDefined()
    expect(previousButton.attributes('disabled')).toBeDefined()
    expect(nextButton.attributes('disabled')).toBeUndefined()
    expect(stopButton.attributes('disabled')).toBeUndefined()
  })
})
