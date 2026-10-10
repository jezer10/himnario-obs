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
  <dialog ref="dialog" class="obs-dialog m-auto">
    <div class="obs-dialog-header sticky top-0 flex items-center gap-2 p-2 w-full z-10">
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