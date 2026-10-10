<script setup lang="ts">
import { ref } from 'vue'
import CloseIcon from './icons/CloseIcon.vue'
import BaseButton from './commons/BaseButton.vue';

defineProps({
  title: {
    type: String,
    required: true,
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
  <dialog ref="dialog" class="w-[calc(100%-16px)] max-w-[360px] max-h-[calc(100dvh-16px)] rounded border border-obs-border bg-obs-base text-[13px] text-obs-text [scrollbar-color:var(--obs-border)_var(--obs-base)] [scrollbar-width:thin] backdrop:bg-black/45 m-auto">
    <div class="border-b border-obs-border bg-obs-base [&_input]:w-0 [&_input]:flex-1 sticky top-0 flex items-center gap-2 p-2 w-full z-10">
      <h1 class="font-semibold leading-none">
        {{ title }}
      </h1>
      <slot name="header"></slot>
      <BaseButton
        class="w-7 h-7 flex-shrink-0 ms-auto"
        title="Cerrar"
        @click="close"
      >
        <CloseIcon />
      </BaseButton>
    </div>
    <div class="p-2 text-xs">
      <slot></slot>
      <div class="flex text-xs">
        <slot name="footer"></slot>
      </div>
    </div>
  </dialog>
</template>