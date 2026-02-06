<script setup lang="ts">
import { watch } from 'vue';

export interface BakeryModalProps {
  show: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
}

const props = withDefaults(defineProps<BakeryModalProps>(), {
  show: false,
  size: 'md',
  closable: true,
});

const emit = defineEmits<{
  close: [];
  'update:show': [value: boolean];
}>();

const closeModal = () => {
  if (props.closable) {
    emit('update:show', false);
    emit('close');
  }
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal();
  }
};

// Prevent body scroll when modal is open
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-full mx-4',
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[1040] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-300"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="show"
            :class="['bg-white rounded-2xl shadow-2xl w-full bakery-scrollbar overflow-y-auto max-h-[90vh]', sizeClasses[size]]"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-bakery-brown-200">
              <h2 class="text-2xl font-display font-bold text-bakery-brown-900">
                <slot name="title">{{ title }}</slot>
              </h2>
              <button
                v-if="closable"
                class="text-bakery-brown-400 hover:text-bakery-brown-600 transition-colors p-1"
                @click="closeModal"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-6">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="p-6 border-t border-bakery-brown-200 bg-bakery-brown-50">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
