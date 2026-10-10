<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useHymn } from '../composables/hymn'
import { useObs } from '../composables/obs'
import { usePlayer } from '../composables/player'
import { store } from '../store'
import AboutApp from './AboutApp.vue'
import AutodriveButton from './AutodriveButton.vue'
import HymnSearcher from './HymnSearcher.vue'
import SettingsPanel from './SettingsPanel.vue'
import SetupScene from './SetupScene.vue'
import HomeIcon from './icons/HomeIcon.vue'
import NextIcon from './icons/NextIcon.vue'
import PreviousIcon from './icons/PreviousIcon.vue'
import PlayIcon from './icons/PlayIcon.vue'
import StopIcon from './icons/StopIcon.vue'
import BaseButton from './commons/BaseButton.vue'

const {
  connect,
  disconnect,
  connected,
  setCurrentScene,
  setSourceVisibility,
  setSourceText,
} = useObs()

const { hymnIndex, hymnData, searchHymn, fileUrl } = useHymn()

const { onTimeUpdate, onEnded, player: playerElement, ...player } = usePlayer()

const playing = ref(false)
const duration = ref(0)
const volume = ref(1)
const muted = ref(false)
const volumeOpen = ref(false)
function closeVolume(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) volumeOpen.value = false
}
function dismissVolume(event: KeyboardEvent) {
  volumeOpen.value = false
  ;(event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>('[aria-controls="volume-controls"]')?.focus()
}
const audioError = ref('')
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
function seek(event: Event) {
  if (playerElement.value && duration.value > 0) {
    playerElement.value.currentTime = Number((event.target as HTMLInputElement).value)
    player.currentTime.value = playerElement.value.currentTime
  }
}
function changeVolume(event: Event) {
  if (!playerElement.value) return
  playerElement.value.volume = Number((event.target as HTMLInputElement).value)
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
const currentVerse = computed(() => {
  const step = hymnData.value?.sequence[hymnIndex.value - 1]
  const verse = hymnData.value?.verses.find(v => v.id === step?.verseId)
  return {
    label: verse ? (verse.number === 0 ? 'Coro' : 'Verso ' + verse.number) : 'Título',
    content: verse?.contents.find(c => c.id === step?.verseContentId)?.content,
  }
})
const controlHint = computed(() => {
  if (!connected.value) return 'Conecta OBS para controlar los versos.'
  if (!store.onSearchHymnScene) return 'Selecciona la escena del himno en configuración.'
  if (!hymnData.value) return 'Busca un himno para comenzar.'
  if (store.autodriveVerses) return 'Los versos avanzan con la música.'
  return 'Control manual de versos.'
})

onMounted(() => {
  onTimeUpdate(() => handleMusicTimestamp())
  onEnded(() => toHomeScene())
})

watch(hymnIndex, async (index) => {
  if (index === 0) {
    return
  }
  await showVerse(index - 1)
  if (!store.onSearchSwitchToHymnScene) {
    return
  }
  if (!store.onSearchHymnScene) {
    return
  }
  await setCurrentScene(store.onSearchHymnScene)
})

async function search(number: number | string) {
  await searchHymn(number)
  await nextTick()
  audioError.value = ''
  duration.value = 0
  player.currentTime.value = 0
  player.load()
  if (connected.value) {
    goTitle()
  }
  if (store.autoplayMusic) {
    await togglePlayback()
  }
}

function handleMusicTimestamp() {
  if (!connected.value) {
    return
  }
  if (!store.autodriveVerses) {
    return
  }
  const nextSequence = hymnData.value?.sequence
    .filter((v) => v.timestamp && v.timestamp - 0.5 < player.currentTime.value)
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
  if (!store.onSearchSwitchToHymnScene) {
    return
  }
  if (!store.onSearchHymnScene) {
    return
  }
  await setCurrentScene(store.onSearchHymnScene)
}

async function toHomeScene(fadeoutMusic = false) {
  if (fadeoutMusic) {
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
  await setSourceVisibility('himno_numero', true)
  await setSourceVisibility('himno_titulo', true)
  await setSourceVisibility('verso_numero', false)
  await setSourceVisibility('verso_contenido', false)
  await setSourceText('himno_numero', hymnData.value?.number.toString())
  await setSourceText('himno_titulo', hymnData.value?.title)
}

async function showVerse(index: number) {
  if (!hymnData.value) {
    return
  }
  const sequence = hymnData.value.sequence[index]
  const verse = hymnData.value?.verses.find((v) => v.id === sequence.verseId)
  const content = verse?.contents.find((c) => c.id === sequence.verseContentId)
  const verseNumber = verse?.number === 0 ? 'Coro' : String(verse?.number)
  await setSourceVisibility('himno_numero', false)
  await setSourceVisibility('himno_titulo', false)
  await setSourceVisibility('verso_numero', true)
  await setSourceVisibility('verso_contenido', true)
  await setSourceText('verso_numero', verseNumber)
  await setSourceText('verso_contenido', content?.content)
}
</script>

<template>
  <main class="obs-panel">
    <header class="player-header">
      <BaseButton :title="connected ? 'Desconectar' : 'Conectar'" class="connection-button" @click="connected ? disconnect() : connect()">
        <span aria-hidden="true" class="status-dot" :class="connected ? 'bg-green-600' : 'bg-red-600'"></span>
        {{ connected ? 'Conectado' : 'Desconectado' }}
      </BaseButton>
      <div class="player-utilities"><SettingsPanel /><AboutApp /></div>
      <SetupScene />
    </header>

    <HymnSearcher @on-play-hymn="search($event)" />

    <section class="hymn-preview" aria-label="Vista previa del himno">
      <div class="hymn-heading">
        <span class="obs-muted hymn-eyebrow">{{ hymnData ? 'Himno ' + String(hymnData.number).padStart(3, '0') : 'Himnario' }}</span>
        <h1 data-test="hymn-title" :title="hymnData?.title">{{ hymnData?.title || 'Elige un himno' }}</h1>
      </div>
      <div class="verse-preview" :class="{ 'empty-preview': !currentVerse.content }" tabindex="0" aria-label="Letra del verso seleccionado">
        <p v-if="currentVerse.content" class="verse-content">{{ currentVerse.content }}</p>
        <p v-else class="obs-muted">{{ hymnData ? 'Avanza al primer verso' : 'Busca por número o nombre' }}</p>
      </div>
      <p class="verse-position obs-muted" role="status">{{ hymnData ? (hymnIndex === 0 ? 'Título · ' + hymnData.sequence.length + ' pasos' : currentVerse.label + ' · paso ' + hymnIndex + ' de ' + hymnData.sequence.length) : 'Vista previa de la letra' }}</p>
    </section>

    <section class="verse-controls" aria-label="Control de versos" :title="controlHint">
      <div class="verse-buttons">
        <BaseButton :disabled="!connected || !store.onSearchHymnScene || store.autodriveVerses || hymnIndex < 1" title="Mostrar título del himno" @click="goTitle()"><HomeIcon /><span>Título</span></BaseButton>
        <BaseButton :disabled="!connected || !store.onSearchHymnScene || store.autodriveVerses || hymnIndex < 2" title="Verso anterior" @click="hymnIndex--"><PreviousIcon /><span>Anterior</span></BaseButton>
        <BaseButton :disabled="!connected || !store.onSearchHymnScene || store.autodriveVerses || (hymnData ? hymnIndex >= hymnData.sequence.length : true)" title="Verso siguiente" @click="hymnIndex++"><NextIcon /><span>Siguiente</span></BaseButton>
        <BaseButton :disabled="!connected" title="Detener" @click="toHomeScene(true)"><StopIcon /><span>Detener</span></BaseButton>
      </div>
      <AutodriveButton />
      <p class="control-hint obs-muted">{{ controlHint }}</p>
    </section>

    <section class="music-controls" aria-label="Reproductor de música">
      <div class="music-caption sr-only" role="status">{{ !hymnData ? 'Sin selección' : playing ? 'Reproduciendo' : 'En pausa' }}</div>
      <div class="audio-progress">
        <span>{{ formatTime(player.currentTime.value) }}</span>
        <input aria-label="Progreso del himno" type="range" min="0" :max="duration || 1" step="0.1" :value="player.currentTime.value" :disabled="!duration" :aria-valuetext="formatTime(player.currentTime.value) + ' de ' + formatTime(duration)" @input="seek">
        <span>{{ formatTime(duration) }}</span>
      </div>
      <div class="audio-transport">
        <span class="audio-label obs-muted">Música</span>
        <BaseButton class="audio-play" :disabled="!hymnData" :title="playing ? 'Pausar música' : 'Reproducir música'" @click="togglePlayback">
          <svg v-if="playing" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
          <PlayIcon v-else />
        </BaseButton>
        <div class="volume-control" @focusout="closeVolume" @keydown.esc.stop.prevent="dismissVolume">
        <BaseButton class="audio-mute" title="Volumen" :aria-expanded="volumeOpen" aria-controls="volume-controls" @click="volumeOpen = !volumeOpen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5Z" /><path v-if="muted || volume === 0" d="m16 9 6 6m0-6-6 6" /><path v-else d="M15 8q5 4 0 8m3-11q8 7 0 14" /></svg>
        </BaseButton>
        <div v-if="volumeOpen" id="volume-controls" class="volume-popover" role="group" aria-label="Ajustar volumen">
        <BaseButton class="audio-mute" :title="muted ? 'Activar sonido' : 'Silenciar'" :aria-pressed="muted" @click="toggleMute">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5Z" /><path v-if="muted || volume === 0" d="m16 9 6 6m0-6-6 6" /><path v-else d="M15 8q5 4 0 8m3-11q8 7 0 14" /></svg>
        </BaseButton>
        <input aria-label="Volumen" type="range" min="0" max="1" step="0.01" :value="muted ? 0 : volume" :aria-valuetext="Math.round((muted ? 0 : volume) * 100) + '%'" @input="changeVolume">
        </div>
        </div>
      </div>
      <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>
      <audio ref="playerElement" preload="metadata" @loadedmetadata="updateDuration" @durationchange="updateDuration" @volumechange="syncVolume" @error="audioError = hymnData ? 'Audio no disponible. Intenta reproducir de nuevo.' : ''" @play="playing = true" @pause="playing = false" @emptied="playing = false; duration = 0" @ended="playing = false">
        <source :src="hymnData && fileUrl()" type="audio/mpeg">
      </audio>
    </section>
  </main>
</template>
