import obsWebSocket, { OBSWebSocketError, EventSubscription } from 'obs-websocket-js'
import { type Ref, ref } from 'vue'
import { defaultValues, useObsStore, useSettingsStore } from '../store.ts'

import { receiveObsTheme, clearObsTheme } from '../theme'

const obs = new obsWebSocket()
obs.on('CustomEvent', receiveObsTheme)
obs.on('ConnectionClosed', () => {
  connected.value = false
  clearObsTheme()
})

const connected: Ref<boolean> = ref(false)

export function useObs() {
  const store = useSettingsStore()
  const obsStore = useObsStore()
  const sceneStatus = obsStore.sceneStatus
  let displayQueue: Promise<void> = Promise.resolve()

  // Serialize complete frames so rapid manual/automatic advances cannot mix
  // a title's visibility with a later verse's text.
  function displayHymn(title: boolean, number: string, text: string) {
    const sceneName = store.onSearchHymnScene
    const switchToScene = store.onSearchSwitchToHymnScene
    const update = displayQueue.then(async () => {
      if (!connected.value || !sceneName) return
      await getSceneItems(sceneName)
      await setSourceText(title ? 'himno_numero' : 'verso_numero', number)
      await setSourceText(title ? 'himno_titulo' : 'verso_contenido', text)
      for (const [name, visible] of [
        ['himno_numero', title], ['himno_titulo', title],
        ['verso_numero', !title], ['verso_contenido', !title],
      ] as const) {
        await setSourceVisibility(name, visible, sceneName)
      }
      if (switchToScene) {
        await setCurrentScene(sceneName)
        return
      }
      const { studioModeEnabled } = await obs.call('GetStudioModeEnabled')
      if (!studioModeEnabled) return
      const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene')
      if (currentProgramSceneName === sceneName) {
        // Refresh the studio-mode copy of this scene, never transition whatever
        // unrelated scene the operator happens to have selected in Preview.
        await setCurrentScene(sceneName, true)
      }
    })
    displayQueue = update.catch(() => {})
    return update
  }
  async function connect(quiet = false) {
    if (connected.value) return
    const url = `ws://${store.obsWebsocketUrl || defaultValues.obsWebsocketUrl}`
    try {
      await obs.connect(url, undefined, {
        eventSubscriptions: EventSubscription.All | EventSubscription.Vendors,
      })
      await getScenes()
      if (
        obsStore.sceneList.find((s) => s.sceneName === store.onSearchHymnScene)
      ) {
        sceneStatus.scene = true
        await getSceneItems(store.onSearchHymnScene)
        const items = obsStore.sourceList.map((s) => s.sourceName)
        sceneStatus.source.himnoNumero = items.includes('himno_numero')
        sceneStatus.source.himnoTitulo = items.includes('himno_titulo')
        sceneStatus.source.versoNumero = items.includes('verso_numero')
        sceneStatus.source.versoContenido = items.includes('verso_contenido')
      } else {
        sceneStatus.scene = false
        sceneStatus.source = {
          himnoNumero: false,
          himnoTitulo: false,
          versoNumero: false,
          versoContenido: false,
        }
      }
      connected.value = true
    } catch {
      if (!quiet) alert('Conexión fallida')
    }
  }

  async function disconnect() {
    await obs.disconnect()
    connected.value = false
  }

  async function reconnect() {
    if (!connected.value) {
      return
    }
    await disconnect()
    await connect()
  }

  async function getScenes() {
    const { scenes } = await obs.call('GetSceneList')
    obsStore.sceneList = scenes
  }

  async function getSceneItems(sceneName: string) {
    let { sceneItems } = await obs.call('GetSceneItemList', { sceneName })
    // Get group scene items
    const groupSceneItems = []
    for (const item of sceneItems) {
      if (!item.isGroup) {
        continue
      }
      const { sceneItems } = await obs.call('GetGroupSceneItemList', {
        sceneName: item.sourceName as string,
      })
      sceneItems.map((i) => {
        i.groupName = item.sourceName
        return i
      })
      groupSceneItems.push(...sceneItems)
    }
    sceneItems = sceneItems.filter((item) => !item.isGroup)
    sceneItems.push(...groupSceneItems)
    // Set source list
    obsStore.sourceList = sceneItems
  }

  async function waitForTransition() {
    const deadline = Date.now() + 30_000
    do {
      // OBS may acknowledge the request before the first transition frame.
      await new Promise(resolve => setTimeout(resolve, 50))
      const { transitionCursor } = await obs.call('GetCurrentSceneTransitionCursor')
      if (!(transitionCursor > 0 && transitionCursor < 1)) return
    } while (Date.now() < deadline)
    throw new Error('La transición de OBS no ha terminado.')
  }

  async function setCurrentScene(sceneName: string, preservePreview = false) {
    const { studioModeEnabled } = await obs.call('GetStudioModeEnabled')
    if (!studioModeEnabled) {
      await obs.call('SetCurrentProgramScene', { sceneName })
      return
    }
    await waitForTransition()
    const { currentPreviewSceneName } = await obs.call('GetCurrentPreviewScene')
    // Recheck after waiting: an operator may have taken another scene live.
    if (preservePreview) {
      const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene')
      if (currentProgramSceneName !== sceneName) return
    }
    await obs.call('SetCurrentProgramScene', { sceneName })
    await waitForTransition()
    if (preservePreview && currentPreviewSceneName !== sceneName) {
      const latest = await obs.call('GetSceneList')
      // OBS's "swap preview/program" option can replace Preview after the fade.
      // Restore it only if it still shows the scene our refresh put there.
      if (latest.currentProgramSceneName === sceneName && latest.currentPreviewSceneName === sceneName) {
        await obs.call('SetCurrentPreviewScene', { sceneName: currentPreviewSceneName })
      }
    }
  }

  async function setSourceVisibility(sourceName: string, visible: boolean, sceneName = store.onSearchHymnScene) {
    const sceneItem = obsStore.sourceList.find((s) => s.sourceName === sourceName)
    if (!sceneItem) return
    await obs.call('SetSceneItemEnabled', {
      sceneName: sceneItem.groupName ?? sceneName,
      sceneItemId: sceneItem.sceneItemId,
      sceneItemEnabled: visible,
    })
  }

  async function setSourceText(sourceName: string, text = '') {
    await obs.call('SetInputSettings', {
      inputName: sourceName,
      inputSettings: {
        text: text,
      },
    })
  }

  async function createScene() {
    await obs.call('CreateScene', { sceneName: store.onSearchHymnScene })
  }

  async function createSource(
    inputName:
      | 'himno_numero'
      | 'himno_titulo'
      | 'verso_numero'
      | 'verso_contenido',
  ) {
    try {
      await obs.call('CreateInput', {
        sceneName: store.onSearchHymnScene,
        inputName,
        inputKind: 'text_gdiplus_v2',
      })
    } catch (error) {
      if (!(error instanceof OBSWebSocketError)) {
        return
      }
      if (error.code === 601) {
        alert(`Este nombre ya está en uso: ${inputName}`)
      }
    }
  }

  function on(
    event: 'SceneListChanged' | 'SceneItemCreated' | 'SceneItemRemoved',
    callback: (data: any) => void,
  ) {
    obs.on(event, callback)
  }

  return {
    on,
    connect,
    disconnect,
    reconnect,
    connected,
    displayHymn,
    getSceneItems,
    setCurrentScene,
    setSourceVisibility,
    setSourceText,
    createScene,
    createSource,
  }
}
