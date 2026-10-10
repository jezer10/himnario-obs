<script setup lang="ts">
import { ref } from 'vue'
import CloseIcon from './icons/CloseIcon.vue'
import BaseButton from './commons/BaseButton.vue';

defineProps({
  title: {
    type: String,
    required: true,
  },
  compactHeader: {
    type: Boolean,
    default: false,
  },
})

defineExpose({
  open,
  close,
})

const dialog = ref<HTMLDialogElement | null>(null)

function open() {
  dialog.value?.showModal()
}

function close() {
  dialog.value?.close()
}
</script>

<template>
  <dialog ref="dialog" class="w-[calc(100%_-_16px)] max-w-[360px] max-h-[calc(100dvh_-_16px)] overflow-hidden open:flex open:flex-col rounded border border-obs-border bg-obs-base text-[13px] text-obs-text backdrop:bg-black/45 m-auto [overflow-wrap:anywhere]">
    <div class="shrink-0 border-b border-obs-border bg-obs-base [&_input]:w-0 [&_input]:flex-1 flex items-center gap-2 px-2 w-full" :class="compactHeader ? 'py-1' : 'py-2'">
      <h1 v-if="title" class="min-w-0 font-semibold leading-snug">
        {{ title }}
      </h1>
      <slot name="header"></slot>
      <BaseButton
        class="grid size-8 flex-shrink-0 place-items-center p-1.5! ms-auto [&_svg]:size-[18px]"
        title="Cerrar"
        @click="close"
      >
        <CloseIcon />
      </BaseButton>
    </div>
    <div class="min-h-0 overflow-y-auto p-2 text-xs [scrollbar-color:var(--obs-border)_var(--obs-base)] [scrollbar-width:thin]">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="flex flex-wrap shrink-0 items-center gap-2 border-t border-obs-border bg-obs-base p-2 text-xs">
      <slot name="footer"></slot>
    </div>
  </dialog>
</template>
