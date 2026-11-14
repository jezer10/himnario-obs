<script setup lang="ts">
import InputSlider from './commons/InputSlider.vue'
import { animateScroll } from '../utils/animateScroll'
import Popover from 'primevue/popover'
import Message from 'primevue/message'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHymn } from '../composables/hymn'
import { useObs } from '../composables/obs'
import { useScrub } from '../composables/scrub'
import { usePlayer } from '../composables/player'
import { useSettingsStore } from '../store'
import HymnSearcher from './HymnSearcher.vue'
import SettingsPanel from './SettingsPanel.vue'
import SetupScene from './SetupScene.vue'
import BaseButton from './commons/BaseButton.vue'
import PlaylistPanel from './PlaylistPanel.vue'
import { usePlaylistsStore, type PlaylistEntry } from '../playlists'

const store = useSettingsStore()
const playlists = usePlaylistsStore()
const playlistsOpen = ref(false)
const playlistLoading = ref(false)
const activePlaylistId = ref('')
const activeEntryId = ref('')
const activePlaylist = computed(() => playlists.lists.find(p => p.id === activePlaylistId.value))
const playlistIndex = computed(() => activePlaylist.value?.entries.findIndex(e => e.id === activeEntryId.value) ?? -1)
const nextPlaylistEntry = computed(() => playlistIndex.value < 0 ? undefined : activePlaylist.value?.entries[playlistIndex.value + 1])
async function selectPlaylistEntry(listId: string, entry: PlaylistEntry) {
  if (playlistLoading.value) return
  playlistLoading.value = true
  try {
    if (await search(entry.number, true)) {
      activePlaylistId.value = listId
      activeEntryId.value = entry.id
    }
  } finally { playlistLoading.value = false }
}

const {
  connect,
  connected,
  setCurrentScene,
  displayHymn,
} = useObs()

const { hymnIndex, hymnData, searchHymn, fileUrl } = useHymn()

const { onTimeUpdate, onEnded, player: playerElement, ...player } = usePlayer()

const playing = ref(false)
const duration = ref(0)
const { displayTime, start: startSeek, seek, commit: commitSeek, cancel: cancelSeek } = useScrub(playerElement, player.currentTime, duration)
const volume = ref(1)
const muted = ref(false)
const volumeOpen = ref(false)
const volumePopover = ref<InstanceType<typeof Popover>>()
const audioError = ref('')
const obsError = ref('')
const searchOpen = ref(false)
const lyricsViewport = ref<HTMLElement>()
const lyricPadding = ref({ top: 0, bottom: 0 })
let lyricObserver: ResizeObserver | undefined
let cancelScroll: (() => void) | undefined
let centerRequest = 0
let animateVerseClick = false

function stopLyricMotion() {
  cancelScroll?.()
  cancelScroll = undefined
}
async function centerActiveLyric(animate = false, userRequested = false) {
  const request = ++centerRequest
  stopLyricMotion()
  const viewport = lyricsViewport.value
  if (!viewport) return
  const lines = viewport.querySelectorAll<HTMLElement>('.lyric-line')
  const active = viewport.querySelector<HTMLElement>('.active-verse')
  if (!active || !lines.length) return
  lyricPadding.value = {
    top: Math.max(16, (viewport.clientHeight - lines[0]!.offsetHeight) / 2),
    bottom: Math.max(16, (viewport.clientHeight - lines[lines.length - 1]!.offsetHeight) / 2),
  }
  await nextTick()
  if (request !== centerRequest) return
  const relativeTop = active.getBoundingClientRect().top - viewport.getBoundingClientRect().top
  const target = Math.max(0, Math.min(viewport.scrollHeight - viewport.clientHeight,
    viewport.scrollTop + relativeTop - Math.max(16, (viewport.clientHeight - active.offsetHeight) / 2)))
  const start = viewport.scrollTop
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!animate || (reducedMotion && !userRequested) || Math.abs(target - start) < 1) {
    viewport.scrollTop = target
    return
  }
  cancelScroll = animateScroll(viewport, target)
}
watch(lyricsViewport, (viewport) => {
  lyricObserver?.disconnect()
  if (viewport && typeof ResizeObserver !== 'undefined') {
    lyricObserver = new ResizeObserver(() => { void centerActiveLyric() })
    if (viewport.parentElement) lyricObserver.observe(viewport.parentElement)
  }
}, { flush: 'post' })
onBeforeUnmount(() => {
  centerRequest++
  stopLyricMotion()
  lyricObserver?.disconnect()
})
async function updateObs(title: boolean, number: string, text: string) {
  try {
    await displayHymn(title, number, text)
    obsError.value = ''
  } catch {
    obsError.value = 'No se pudo actualizar la salida de OBS. Revisa la conexión e intenta nuevamente.'
  }
}
function formatTime(value: number) {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
}
function updateDuration() {
  const value = playerElement.value?.duration
  duration.value = value && Number.isFinite(value) ? value : 0
}
async function togglePlayback() {
  if (!playerElement.value) return
  if (!playerElement.value.paused) { playerElement.value.pause(); return }
  audioError.value = ''
  try { await playerElement.value.play() } catch { audioError.value = 'No se pudo reproducir el audio.' }
}
function changeVolume(value: number) {
  if (!playerElement.value) return
  playerElement.value.volume = value
  playerElement.value.muted = false
  syncVolume()
}
function syncVolume() {
  volume.value = playerElement.value?.volume ?? 1
  muted.value = playerElement.value?.muted ?? false
}
function toggleMute() {
  if (playerElement.value) { playerElement.value.muted = !playerElement.value.muted; syncVolume() }
}
const activeVerseIndex = computed(() => Math.max(0, hymnIndex.value - 1))
const lyricLines = computed(() => (hymnData.value?.sequence ?? []).map((step, index) => {
  const verse = hymnData.value?.verses.find(v => v.id === step.verseId)
  return { index, content: verse?.contents.find(c => c.id === step.verseContentId)?.content ?? '' }
}))
watch(hymnIndex, async () => {
  const fromClick = animateVerseClick
  animateVerseClick = false
  await nextTick()
  await centerActiveLyric(true, fromClick)
})
watch(hymnData, async () => {
  await nextTick()
  await centerActiveLyric()
})
function selectVerse(index: number) {
  const step = hymnData.value?.sequence[index]
  const audio = playerElement.value
  if (!step || !audio || !Number.isFinite(step.timestamp) || step.timestamp < 0) return
  cancelSeek()
  const target = duration.value > 0 ? Math.min(step.timestamp, duration.value) : step.timestamp
  try {
    audio.currentTime = target
    player.currentTime.value = target
    audioError.value = ''
  } catch {
    audioError.value = 'No se pudo saltar a este verso. Espera a que cargue el audio e intenta de nuevo.'
    return
  }
  store.autodriveVerses = true
  if (hymnIndex.value === index + 1) {
    void centerActiveLyric(true, true)
    void showVerse(index)
  } else {
    animateVerseClick = true
    hymnIndex.value = index + 1
  }
}
const controlHint = computed(() => {
  if (!connected.value) return 'Conecta OBS para controlar los versos.'
  if (!store.onSearchHymnScene) return 'Selecciona la escena del himno en configuración.'
  if (!hymnData.value) return 'Busca un himno para comenzar.'
  if (store.autodriveVerses) return 'Los versos avanzan con la música.'
  return 'Control manual de versos.'
})

onMounted(() => {
  void connect()
  onTimeUpdate(() => handleMusicTimestamp())
  onEnded(() => toHomeScene())
})

watch(hymnIndex, async (index) => {
  if (index === 0) {
    return
  }
  await showVerse(index - 1)
})

async function search(number: number | string, fromPlaylist = false) {
  try {
    if (!await searchHymn(number)) return
  } catch {
    audioError.value = 'No se pudo cargar el himno. Intenta nuevamente.'
    return
  }
  searchOpen.value = false
  if (!fromPlaylist) {
    activePlaylistId.value = ''
    activeEntryId.value = ''
  }
  await nextTick()
  audioError.value = ''
  cancelSeek()
  duration.value = 0
  player.currentTime.value = 0
  player.load()
  if (connected.value) {
    await goTitle()
  }
  if (store.autoplayMusic && !fromPlaylist) {
    await togglePlayback()
  }
  return true
}

function handleMusicTimestamp() {
  if (!store.autodriveVerses) {
    return
  }
  const nextSequence = hymnData.value?.sequence
    .filter((v) => Number.isFinite(v.timestamp) && v.timestamp >= 0 && v.timestamp - 0.5 < player.currentTime.value)
    .reverse()[0]
  if (!nextSequence) {
    return
  }
  if (!hymnData.value) {
    return
  }
  const position = hymnData.value.sequence.indexOf(nextSequence) + 1
  if (nextSequence && position !== hymnIndex.value) {
    hymnIndex.value = position
  }
}

async function goTitle() {
  hymnIndex.value = 0
  await showTitle()
}

async function toHomeScene(fadeoutMusic = false) {
  if (fadeoutMusic) {
    cancelSeek()
    await player.stop()
  }
  if (!connected.value) {
    return
  }
  if (store.onMusicEndSwitchToScene) {
    await setCurrentScene(store.onMusicEndSwitchToScene)
  }
}

async function showTitle() {
  if (!hymnData.value) return
  await updateObs(true, String(hymnData.value.number), hymnData.value.title)
}

async function showVerse(index: number) {
  if (!hymnData.value) {
    return
  }
  const sequence = hymnData.value.sequence[index]
  const verse = hymnData.value?.verses.find((v) => v.id === sequence.verseId)
  const content = verse?.contents.find((c) => c.id === sequence.verseContentId)
  const verseNumber = verse?.number === 0 ? 'Coro' : String(verse?.number)
  await updateObs(false, verseNumber, content?.content ?? '')
}
</script>

<template>
  <main class="music-deck">
    <header class="deck-header">
      <div class="track-info">
        <span class="track-version">{{ hymnData ? 'Himno ' + String(hymnData.number).padStart(3, '0') : 'Himnario' }}</span>
        <h1 data-test="hymn-title" :title="hymnData?.title">{{ hymnData?.title || 'Elige un himno' }}</h1>
      </div>
      <div class="header-actions">
        <span class="obs-status" :class="{ 'is-connected': connected }" role="status" :title="connected ? 'OBS conectado' : 'OBS sin conexión'" :aria-label="connected ? 'OBS conectado' : 'OBS sin conexión'"><span class="status-dot" aria-hidden="true" /></span>
        <BaseButton title="Buscar himno" :aria-expanded="!playlistsOpen && (searchOpen || !hymnData)" aria-controls="hymn-search" @click="searchOpen = playlistsOpen || !searchOpen; playlistsOpen = false"><i class="pi pi-search" aria-hidden="true" /></BaseButton>
        <SettingsPanel />
        <BaseButton title="Playlists" :aria-pressed="playlistsOpen" aria-controls="playlists-view" @click="playlistsOpen = !playlistsOpen"><i :class="playlistsOpen ? 'pi pi-align-left' : 'pi pi-list'" aria-hidden="true" /></BaseButton>
      </div>
      <SetupScene />
      <div v-if="!playlistsOpen && (searchOpen || !hymnData)" id="hymn-search" class="deck-search"><HymnSearcher @on-play-hymn="search" /></div>
      <span data-test="music-caption" class="sr-only" role="status">{{ !hymnData ? 'Sin selección' : playing ? 'Reproduciendo' : 'En pausa' }}</span>
    </header>
    <PlaylistPanel v-if="playlistsOpen" id="playlists-view" :active-entry-id="activeEntryId" :busy="playlistLoading" @select="selectPlaylistEntry" />
    <section v-else class="verse-preview" aria-label="Vista previa del himno">
      <div ref="lyricsViewport" class="lyrics-scroll"
        :style="{ paddingTop: lyricPadding.top + 'px', paddingBottom: lyricPadding.bottom + 'px' }"
        tabindex="0" aria-label="Letra del verso seleccionado"
        @wheel.passive="stopLyricMotion" @touchstart.passive="stopLyricMotion" @keydown="stopLyricMotion">
        <button v-for="line in lyricLines" :key="line.index" type="button" class="lyric-line" @click="selectVerse(line.index)" :title="'Ir al verso ' + (line.index + 1) + ' · sincronizar música'"
          :class="{ 'active-verse': line.index === activeVerseIndex, 'neighbor-verse': line.index !== activeVerseIndex }"
          :aria-current="line.index === activeVerseIndex ? 'true' : undefined">{{ line.content }}</button>
        <div v-if="!lyricLines.length" class="preview-empty">
          <p>Busca un himno</p>
          <span>Por número o título</span>
        </div>
      </div>
    </section>

    <section class="deck-player" aria-label="Reproductor de música">
      <div v-if="activePlaylist && playlistIndex >= 0" class="playlist-navigation">
        <span>{{ activePlaylist.name }} · {{ playlistIndex + 1 }}/{{ activePlaylist.entries.length }}</span>
        <BaseButton :disabled="playlistLoading || !nextPlaylistEntry" title="Siguiente himno" @click="nextPlaylistEntry && selectPlaylistEntry(activePlaylistId, nextPlaylistEntry)">{{ playlistLoading ? 'Cargando…' : nextPlaylistEntry ? 'Siguiente himno' : 'Fin de la playlist' }}<i class="pi pi-angle-right" aria-hidden="true" /></BaseButton>
      </div>
      <div class="seek-row flex items-center gap-1.5 text-[11px] tabular-nums [&_svg]:size-[18px]    ">
        <InputSlider class="min-w-0 w-full flex-1 my-3 mx-2" label="Progreso del himno" :max="duration || 1" :step="0.1" :model-value="displayTime" :disabled="!duration" :value-text="formatTime(displayTime) + ' de ' + formatTime(duration)" @update:model-value="seek" @slidestart="startSeek" @slideend="commitSeek" @slidecancel="cancelSeek" />
        <div class="relative shrink-0 justify-self-end">
        <BaseButton class="grid place-items-center" title="Volumen" :aria-expanded="volumeOpen" aria-controls="volume-controls" @click="volumePopover?.toggle($event)">
          <i :class="muted || volume === 0 ? 'pi pi-volume-off' : 'pi pi-volume-up'" aria-hidden="true" />
        </BaseButton>
        <Popover ref="volumePopover" id="volume-controls" aria-label="Ajustar volumen"  :pt="{ content: { class: 'flex items-center gap-2' } }" @show="volumeOpen = true" @hide="volumeOpen = false">
        <BaseButton class="grid place-items-center" :title="muted ? 'Activar sonido' : 'Silenciar'" :aria-pressed="muted" @click="toggleMute">
          <i :class="muted || volume === 0 ? 'pi pi-volume-off' : 'pi pi-volume-up'" aria-hidden="true" />
        </BaseButton>
        <InputSlider class="volume-slider w-[100px] mx-2" label="Volumen" :max="1" :step="0.01" :model-value="muted ? 0 : volume" :value-text="Math.round((muted ? 0 : volume) * 100) + '%'" @update:model-value="changeVolume" />
        <BaseButton :disabled="!hymnData" title="Detener" @click="toHomeScene(true)"><i class="pi pi-stop" aria-hidden="true" /></BaseButton>
        </Popover>
        </div>

      </div>
      <div class="time-row mt-[-3px] mb-1 flex justify-between pr-10 text-[11px] tabular-nums      text-obs-muted"><span>{{ formatTime(displayTime) }}</span><span>{{ formatTime(duration) }}</span></div>
      <div class="transport-row grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 [&_svg]:size-[18px]  ">

        <div class="flex items-center gap-1.5   " :title="controlHint">
<BaseButton :disabled="!connected || !store.onSearchHymnScene || store.autodriveVerses || hymnIndex < 2" title="Verso anterior" @click="hymnIndex--"><i class="pi pi-step-backward" aria-hidden="true" /></BaseButton>
        <BaseButton class="play-button" :disabled="!hymnData" :title="playing ? 'Pausar música' : 'Reproducir música'" @click="togglePlayback">
          <i :class="playing ? 'pi pi-pause' : 'pi pi-play'" aria-hidden="true" /><span>{{ playing ? 'Pausa' : 'Reproducir' }}</span>
        </BaseButton>
<BaseButton :disabled="!connected || !store.onSearchHymnScene || store.autodriveVerses || (hymnData ? hymnIndex >= hymnData.sequence.length : true)" title="Verso siguiente" @click="hymnIndex++"><i class="pi pi-step-forward" aria-hidden="true" /></BaseButton>
        </div>

      </div>
      <Message v-if="audioError" class="mt-1 text-[11px] leading-[1.3] " role="alert" severity="error" :closable="false">{{ audioError }}</Message>
      <Message v-if="obsError" class="mt-1 text-[11px] leading-[1.3] " role="alert" severity="error" :closable="false">{{ obsError }}</Message>
      <audio class="hidden" ref="playerElement" preload="auto" @loadedmetadata="updateDuration" @durationchange="updateDuration" @volumechange="syncVolume" @error="audioError = hymnData ? 'Audio no disponible. Intenta reproducir de nuevo.' : ''" @play="playing = true" @pause="cancelSeek(); playing = false" @emptied="cancelSeek(); playing = false; duration = 0" @ended="cancelSeek(); playing = false">
        <source :src="hymnData && fileUrl()" type="audio/mpeg">
      </audio>
    </section>
  </main>
</template>
