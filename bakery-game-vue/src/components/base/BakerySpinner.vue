<template>
  <div class="loading-spinner" :class="sizeClass">
    <div class="spinner" :class="variantClass"></div>
    <p v-if="text" class="loading-text" :class="textSizeClass">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'primary',
});

const sizeClass = computed(() => {
  const sizes = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-5',
  };
  return sizes[props.size];
});

const textSizeClass = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  return sizes[props.size];
});

const variantClass = computed(() => {
  const variants = {
    primary: 'border-bakery-gold-600 border-t-transparent',
    secondary: 'border-bakery-brown-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };
  return variants[props.variant];
});
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  border-radius: 50%;
  border-style: solid;
  animation: spin 1s linear infinite;
}

.loading-spinner.gap-2 .spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 2px;
}

.loading-spinner.gap-3 .spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 3px;
}

.loading-spinner.gap-4 .spinner {
  width: 3.5rem;
  height: 3.5rem;
  border-width: 4px;
}

.loading-spinner.gap-5 .spinner {
  width: 4.5rem;
  height: 4.5rem;
  border-width: 5px;
}

.loading-text {
  color: #78350f;
  font-weight: 500;
  margin-top: 0.5rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
