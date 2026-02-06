<script setup lang="ts">
import { computed } from 'vue';

export interface BakeryBadgeProps {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: string;
}

const props = withDefaults(defineProps<BakeryBadgeProps>(), {
  variant: 'primary',
  size: 'md',
  dot: false,
});

const badgeClasses = computed(() => {
  const classes = ['badge'];

  // Variant styles
  const variants = {
    primary: 'bg-bakery-brown-700 text-white',
    success: 'bg-profit/10 text-profit border border-profit/20',
    danger: 'bg-loss/10 text-loss border border-loss/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    info: 'bg-info/10 text-info border border-info/20',
    neutral: 'bg-bakery-brown-100 text-bakery-brown-700 border border-bakery-brown-200',
  };
  classes.push(variants[props.variant]);

  // Size styles
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  classes.push(sizes[props.size]);

  return classes.join(' ');
});
</script>

<template>
  <span :class="badgeClasses">
    <span v-if="dot" class="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
    <span v-if="icon" class="mr-1">{{ icon }}</span>
    <slot></slot>
  </span>
</template>
