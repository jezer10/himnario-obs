<script setup lang="ts">
import InputSlider from './commons/InputSlider.vue'
import Popover from 'primevue/popover'
import Message from 'primevue/message'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useHymn } from '../composables/hymn'
import { useObs } from '../composables/obs'
import { useScrub } from '../composables/scrub'
import { usePlayer } from '../composables/player'
import { useSettingsStore } from '../store'
import HymnSearcher from './HymnSearcher.vue'
import SettingsPanel from './SettingsPanel.vue'
import SetupScene from './SetupScene.vue'
import BaseButton from './commons/BaseButton.vue'

const store = useSettingsStore()

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
const searchOpen = ref(false)
const searchArea = ref<HTMLElement>()
async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) { await nextTick(); searchArea.value?.querySelector('input')?.focus() }
}
const audioError = ref('')
const obsError = ref('')

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

async function search(number: number | string) {
  try {
    if (!await searchHymn(number)) return
  } catch {
    audioError.value = 'No se pudo cargar el himno. Intenta nuevamente.'
    return
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
  <main class="box-border mx-auto grid h-dvh min-h-[260px] max-w-[760px] grid-rows-[auto_minmax(0,1fr)_auto] gap-1 p-1.5 reading:gap-2 reading:p-3 spacious:max-w-none spacious:gap-3 spacious:px-6 spacious:pt-4 spacious:pb-0">
    <header class="flex min-w-0 items-center justify-between gap-1 compact:relative compact:justify-end spacious:mx-auto spacious:w-full spacious:max-w-[760px]">
      <BaseButton class="hidden compact:mr-auto compact:grid compact:place-items-center" title="Buscar himno" :aria-expanded="searchOpen" aria-controls="search-area" @click="toggleSearch"><i class="pi pi-search" aria-hidden="true" /></BaseButton>
      <div ref="searchArea" id="search-area" class="min-w-0 flex-1 compact:hidden compact:data-[open=true]:block compact:data-[open=true]:absolute compact:data-[open=true]:top-[calc(100%+4px)] compact:data-[open=true]:inset-x-0 compact:data-[open=true]:z-25 compact:data-[open=true]:bg-obs-base" :data-open="searchOpen"><HymnSearcher @on-play-hymn="search($event); searchOpen = false" /></div>
      <SettingsPanel />
      <SetupScene />
    </header>

    <section class="flex min-h-0 min-w-0 flex-col overflow-auto p-1 text-center [overflow-wrap:anywhere] spacious:mx-auto spacious:w-full spacious:max-w-[1000px] spacious:p-4" aria-label="Vista previa del himno">

      <div class="min-h-0 short:min-h-8 flex-1 content-center overflow-auto py-[3px] [scrollbar-width:thin] [scrollbar-color:var(--p-content-border-color)_transparent] focus-visible:outline-2 focus-visible:outline-obs-focus focus-visible:-outline-offset-2" tabindex="0" aria-label="Letra del verso seleccionado">
        <p v-if="currentVerse.content" class="whitespace-pre-line leading-[1.35] reading:text-[clamp(16px,2.4vw,34px)] reading:leading-[1.55] spacious:text-[clamp(20px,2.4vw,34px)] spacious:leading-[1.55]">{{ currentVerse.content }}</p>
        <p v-else class="text-obs-muted reading:text-sm">{{ hymnData ? 'Avanza al primer verso' : 'Busca por número o nombre' }}</p>
      </div>
      <p v-if="hymnData" class="mt-0.5 shrink-0 text-[11px] spacious:mt-2.5 spacious:text-[13px] text-obs-muted" role="status">{{ hymnData ? (hymnIndex === 0 ? 'Título · ' + hymnData.sequence.length + ' pasos' : currentVerse.label + ' · paso ' + hymnIndex + ' de ' + hymnData.sequence.length) : '' }}</p>
    </section>

    <section class="min-w-0 pt-0.5 spacious:-mx-6 spacious:grid spacious:grid-cols-[44px_minmax(0,1fr)_auto_minmax(0,1fr)] spacious:grid-rows-[44px_22px_14px] spacious:touch:grid-rows-[44px_44px_14px] spacious:items-center spacious:gap-x-3 spacious:gap-y-0.5 spacious:border-t spacious:border-obs-border spacious:bg-obs-control spacious:px-6 spacious:pt-2.5 spacious:pb-2" aria-label="Reproductor de música">
      <div class="hidden spacious:col-start-1 spacious:row-start-1 spacious:grid spacious:size-11 spacious:place-items-center spacious:rounded-md spacious:border spacious:border-obs-border spacious:bg-obs-base spacious:text-[17px] spacious:font-semibold spacious:tabular-nums" :aria-label="hymnData ? 'Himno ' + hymnData.number : 'Sin himno'">{{ hymnData ? String(hymnData.number).padStart(3, '0') : '—' }}</div>
      <div class="mb-1 shrink-0 text-center spacious:col-start-2 spacious:row-start-1 spacious:m-0 spacious:min-w-0 spacious:text-left">
        <span class="text-obs-muted hidden">{{ hymnData ? 'Himno ' + String(hymnData.number).padStart(3, '0') : 'Himnario' }}</span>
        <h1 class="truncate text-sm font-semibold leading-[1.3]" data-test="hymn-title" :title="hymnData?.title">{{ hymnData?.title || 'Elige un himno' }}</h1>
      </div>
      <div data-test="music-caption" class="sr-only" role="status">{{ !hymnData ? 'Sin selección' : playing ? 'Reproduciendo' : 'En pausa' }}</div>
      <div class="flex items-center gap-1.5 text-[11px] tabular-nums [&_svg]:size-[18px] spacious:col-span-full spacious:row-start-2 spacious:gap-2.5 spacious:[&_svg]:size-[22px]">
        <InputSlider class="min-w-0 w-full flex-1 my-3 mx-2" label="Progreso del himno" :max="duration || 1" :step="0.1" :model-value="displayTime" :disabled="!duration" :value-text="formatTime(displayTime) + ' de ' + formatTime(duration)" @update:model-value="seek" @slidestart="startSeek" @slideend="commitSeek" @slidecancel="cancelSeek" />
        <div class="relative shrink-0 justify-self-end">
        <BaseButton class="grid place-items-center" title="Volumen" :aria-expanded="volumeOpen" aria-controls="volume-controls" @click="volumePopover?.toggle($event)">
          <i :class="muted || volume === 0 ? 'pi pi-volume-off' : 'pi pi-volume-up'" aria-hidden="true" />
        </BaseButton>
        <Popover ref="volumePopover" id="volume-controls" aria-label="Ajustar volumen"  :pt="{ content: { class: 'flex items-center gap-2' } }" @show="volumeOpen = true" @hide="volumeOpen = false">
        <BaseButton class="grid place-items-center" :title="muted ? 'Activar sonido' : 'Silenciar'" :aria-pressed="muted" @click="toggleMute">
          <i :class="muted || volume === 0 ? 'pi pi-volume-off' : 'pi pi-volume-up'" aria-hidden="true" />
        </BaseButton>
        <InputSlider class="w-[100px] mx-2" label="Volumen" :max="1" :step="0.01" :model-value="muted ? 0 : volume" :value-text="Math.round((muted ? 0 : volume) * 100) + '%'" @update:model-value="changeVolume" />
        </Popover>
        </div>

      </div>
      <div class="mt-[-3px] mb-1 flex justify-between pr-10 text-[11px] tabular-nums spacious:col-span-full spacious:row-start-3 spacious:m-0 spacious:pr-11 spacious:text-[10px] text-obs-muted"><span>{{ formatTime(displayTime) }}</span><span>{{ formatTime(duration) }}</span></div>
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 [&_svg]:size-[18px] spacious:contents spacious:[&_svg]:size-[22px]">
        <span class="spacious:hidden" aria-hidden="true"></span>
        <div class="flex items-center gap-1.5 spacious:col-start-3 spacious:row-start-1 spacious:gap-2.5" :title="controlHint">
<BaseButton :disabled="!connected || !store.onSearchHymnScene || store.autodriveVerses || hymnIndex < 2" title="Verso anterior" @click="hymnIndex--"><i class="pi pi-step-backward" aria-hidden="true" /></BaseButton>
        <BaseButton :disabled="!hymnData" :title="playing ? 'Pausar música' : 'Reproducir música'" @click="togglePlayback">
          <i :class="playing ? 'pi pi-pause' : 'pi pi-play'" aria-hidden="true" />
        </BaseButton>
<BaseButton :disabled="!connected || !store.onSearchHymnScene || store.autodriveVerses || (hymnData ? hymnIndex >= hymnData.sequence.length : true)" title="Verso siguiente" @click="hymnIndex++"><i class="pi pi-step-forward" aria-hidden="true" /></BaseButton>
        </div>
        <BaseButton class="grid place-items-center justify-self-end spacious:col-start-4 spacious:row-start-1" :disabled="!hymnData" title="Detener" @click="toHomeScene(true)"><i class="pi pi-stop" aria-hidden="true" /></BaseButton>
      </div>
      <Message v-if="audioError" class="mt-1 text-[11px] leading-[1.3] spacious:col-span-full" role="alert" severity="error" :closable="false">{{ audioError }}</Message>
      <Message v-if="obsError" class="mt-1 text-[11px] leading-[1.3] spacious:col-span-full" role="alert" severity="error" :closable="false">{{ obsError }}</Message>
      <audio class="hidden" ref="playerElement" preload="auto" @loadedmetadata="updateDuration" @durationchange="updateDuration" @volumechange="syncVolume" @error="audioError = hymnData ? 'Audio no disponible. Intenta reproducir de nuevo.' : ''" @play="playing = true" @pause="cancelSeek(); playing = false" @emptied="cancelSeek(); playing = false; duration = 0" @ended="cancelSeek(); playing = false">
        <source :src="hymnData && fileUrl()" type="audio/mpeg">
      </audio>
    </section>
  </main>
</template>
