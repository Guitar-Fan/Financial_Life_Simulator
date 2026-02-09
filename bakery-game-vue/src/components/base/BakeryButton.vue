<script setup lang="ts">
import { computed } from 'vue';

export interface BakeryButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<BakeryButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  iconPosition: 'left',
  fullWidth: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => {
  const classes = [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  // Variant styles
  const variants: Record<string, string> = {
    primary: 'bg-bakery-brown-700 text-white hover:bg-bakery-brown-800 focus:ring-bakery-brown-500 shadow-bakery',
    secondary: 'bg-bakery-cream-400 text-bakery-brown-900 hover:bg-bakery-cream-500 focus:ring-bakery-cream-500',
    success: 'bg-profit text-white hover:bg-green-600 focus:ring-green-500',
    danger: 'bg-loss text-white hover:bg-red-600 focus:ring-red-500',
    warning: 'bg-warning text-white hover:bg-yellow-600 focus:ring-yellow-500',
    info: 'bg-info text-white hover:bg-blue-600 focus:ring-blue-500',
    ghost: 'bg-transparent text-bakery-brown-700 hover:bg-bakery-brown-100 focus:ring-bakery-brown-300',
  };
  classes.push(variants[props.variant]);

  // Size styles
  const sizes: Record<string, string> = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };
  classes.push(sizes[props.size]);

  if (props.fullWidth) {
    classes.push('w-full');
  }

  return classes.join(' ');
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <!-- Icon (left) -->
    <span v-if="icon && iconPosition === 'left' && !loading">{{ icon }}</span>

    <!-- Default slot for button text -->
    <slot></slot>

    <!-- Icon (right) -->
    <span v-if="icon && iconPosition === 'right' && !loading">{{ icon }}</span>
  </button>
</template>
