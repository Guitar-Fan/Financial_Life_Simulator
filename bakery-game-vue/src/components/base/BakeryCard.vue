<script setup lang="ts">
import { computed } from 'vue';

export interface BakeryCardProps {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<BakeryCardProps>(), {
  variant: 'default',
  hoverable: false,
  padding: 'md',
});

const cardClasses = computed(() => {
  const classes = ['rounded-xl transition-all duration-300'];

  // Variant styles
  const variants = {
    default: 'bg-white shadow-md',
    glass: 'glass shadow-bakery',
    elevated: 'bg-white shadow-bakery-lg',
    outlined: 'bg-white border-2 border-bakery-brown-200',
  };
  classes.push(variants[props.variant]);

  // Padding
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };
  classes.push(paddings[props.padding]);

  if (props.hoverable) {
    classes.push('card-hover cursor-pointer');
  }

  return classes.join(' ');
});
</script>

<template>
  <div :class="cardClasses">
    <!-- Header section -->
    <div v-if="title || subtitle || $slots.header" class="mb-4">
      <slot name="header">
        <h3 v-if="title" class="text-xl font-display font-bold text-bakery-brown-900">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-sm text-bakery-brown-600 mt-1">
          {{ subtitle }}
        </p>
      </slot>
    </div>

    <!-- Main content -->
    <div>
      <slot></slot>
    </div>

    <!-- Footer section -->
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-bakery-brown-200">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
