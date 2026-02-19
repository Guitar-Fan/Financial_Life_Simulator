<!--
  ResourceCounter - Animated numeric display for game resources.
  Shows label, value, and optional trend indicator.
  Uses GSAP for smooth number counting animations.
-->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import gsap from 'gsap';

const props = withDefaults(defineProps<{
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color?: 'gold' | 'success' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  decimals?: number;
}>(), {
  prefix: '',
  suffix: '',
  color: 'gold',
  size: 'md',
  showTrend: false,
  decimals: 0,
});

const displayValue = ref(0);
const previousValue = ref(0);
const trend = ref<'up' | 'down' | 'none'>('none');

function animateValue(newVal: number) {
  if (props.showTrend) {
    if (newVal > previousValue.value) trend.value = 'up';
    else if (newVal < previousValue.value) trend.value = 'down';
    else trend.value = 'none';
  }
  previousValue.value = newVal;

  gsap.to(displayValue, {
    value: newVal,
    duration: 0.8,
    ease: 'power2.out',
  });
}

watch(() => props.value, animateValue);

onMounted(() => {
  animateValue(props.value);
});

const colorClasses: Record<string, string> = {
  gold: 'color: var(--game-gold-bright)',
  success: 'color: var(--game-success)',
  danger: 'color: var(--game-danger)',
  info: 'color: var(--game-info)',
  neutral: 'color: var(--game-text-primary)',
};

const sizeClasses: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-2xl',
};
</script>

<template>
  <div class="flex flex-col">
    <span class="text-[10px] uppercase tracking-widest font-semibold" style="color: var(--game-text-muted)">
      {{ label }}
    </span>
    <div class="flex items-baseline gap-1">
      <span
        :class="['font-game-mono font-bold tabular-nums', sizeClasses[size]]"
        :style="colorClasses[color]"
      >
        {{ prefix }}{{ displayValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}{{ suffix }}
      </span>
      <span
        v-if="showTrend && trend !== 'none'"
        :class="['text-xs font-bold', trend === 'up' ? 'text-game-success' : 'text-game-danger']"
      >
        {{ trend === 'up' ? '▲' : '▼' }}
      </span>
    </div>
  </div>
</template>
