import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VueWrapper, flushPromises, mount } from '@vue/test-utils'
import AdminPanel from '../../src/components/AdminPanel.vue'
import sHymn from '../../src/services/HymnService'
import OBSWebSocket from 'obs-websocket-js'

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
vi.spyOn(OBSWebSocket.prototype, 'call').mockResolvedValue({ scenes: [] } as any)

describe("AdminPanel component", () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    wrapper = mount(AdminPanel)
  })

  it('connects automatically and permits manual disconnection', async () => {
    await flushPromises()
    const button = wrapper.get('[aria-label="Conexión con OBS"]')
    expect(button.attributes('aria-checked')).toBe('true')
    await button.trigger('click')
    await flushPromises()
    expect(button.attributes('aria-checked')).toBe('false')
    await button.trigger('click')
    await flushPromises()
    expect(button.attributes('aria-checked')).toBe('true')
  })

  it('searches a hymn', async () => {
    const numberInput = wrapper.get('[role="combobox"]')


    await numberInput.setValue('25')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const hymnTitle = wrapper.get('[data-test="hymn-title"]')

    expect(hymnTitle.text()).toContain('Siento la presencia del Señor')

    expect(wrapper.get('.music-caption').text()).toContain('En pausa')
    await wrapper.get('audio').trigger('play')
    expect(wrapper.get('.music-caption').text()).toContain('Reproduciendo')
    await wrapper.get('audio').trigger('pause')
    expect(wrapper.get('.music-caption').text()).toContain('En pausa')

    const sourceAudio = wrapper.get('audio>source')

    expect(sourceAudio.attributes('src')).toContain('025%20-%20Siento%20la%20presencia%20del%20Senor.mp3')
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
    expect(wrapper.get('.music-caption').text()).toContain('En pausa')
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
