<script setup lang="ts">
import { computed } from 'vue';

export interface BakeryProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  labelFormat?: 'percent' | 'fraction' | 'custom';
  customLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  striped?: boolean;
  animated?: boolean;
}

const props = withDefaults(defineProps<BakeryProgressBarProps>(), {
  max: 100,
  showLabel: true,
  labelFormat: 'percent',
  variant: 'default',
  size: 'md',
  striped: false,
  animated: false,
});

const percentage = computed(() => {
  return Math.min(100, Math.max(0, (props.value / props.max) * 100));
});

const label = computed(() => {
  if (props.customLabel) return props.customLabel;
  
  switch (props.labelFormat) {
    case 'percent':
      return `${Math.round(percentage.value)}%`;
    case 'fraction':
      return `${props.value}/${props.max}`;
    default:
      return '';
  }
});

const barClasses = computed(() => {
  const classes = ['progress-bar'];
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  classes.push(sizes[props.size]);
  
  return classes.join(' ');
});

const fillClasses = computed(() => {
  const classes = ['progress-bar-fill'];
  
  // Variant colors
  const variants = {
    default: 'bg-gradient-to-r from-bakery-gold-400 to-bakery-gold-600',
    success: 'bg-gradient-to-r from-green-400 to-green-600',
    warning: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    danger: 'bg-gradient-to-r from-red-400 to-red-600',
  };
  classes.push(variants[props.variant]);
  
  if (props.striped) {
    classes.push('bg-striped');
  }
  
  if (props.animated) {
    classes.push('animate-pulse');
  }
  
  return classes.join(' ');
});
</script>

<template>
  <div class="w-full">
    <div v-if="showLabel && label" class="flex justify-between items-center mb-1">
      <span class="text-sm font-medium text-bakery-brown-700">{{ label }}</span>
    </div>
    <div :class="barClasses">
      <div
        :class="fillClasses"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.bg-striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}
</style>
