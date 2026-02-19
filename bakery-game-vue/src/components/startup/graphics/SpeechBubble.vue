<!-- 
  Speech Bubble Component - Game-themed
  Dark styled dialogue bubbles for advisor NPCs with glow effects.
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const props = withDefaults(defineProps<{
  type?: 'tip' | 'warning' | 'congratulation' | 'question';
  position?: 'left' | 'right' | 'top';
  animated?: boolean;
}>(), {
  type: 'tip',
  position: 'left',
  animated: true,
});

const isVisible = ref(!props.animated);

onMounted(() => {
  if (props.animated) {
    setTimeout(() => { isVisible.value = true; }, 100);
  }
});

const typeConfig = computed(() => {
  const configs = {
    tip: { border: 'var(--game-gold-dim)', bg: 'rgba(245, 158, 11, 0.08)', glow: 'rgba(245, 158, 11, 0.1)', text: 'var(--game-gold-bright)', icon: '💡' },
    warning: { border: '#991b1b', bg: 'rgba(248, 113, 113, 0.08)', glow: 'rgba(248, 113, 113, 0.1)', text: 'var(--game-danger)', icon: '⚠️' },
    congratulation: { border: '#047857', bg: 'rgba(52, 211, 153, 0.08)', glow: 'rgba(52, 211, 153, 0.1)', text: 'var(--game-success)', icon: '🎉' },
    question: { border: '#1e40af', bg: 'rgba(96, 165, 250, 0.08)', glow: 'rgba(96, 165, 250, 0.1)', text: 'var(--game-info)', icon: '❓' },
  };
  return configs[props.type];
});
</script>

<template>
  <div
    class="relative max-w-lg transition-all duration-500"
    :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
    :style="{
      background: typeConfig.bg,
      border: `1px solid ${typeConfig.border}`,
      borderRadius: '8px',
      padding: '0.875rem 1.25rem',
      boxShadow: `0 0 20px ${typeConfig.glow}, var(--game-shadow-sm)`,
    }"
  >
    <!-- Top highlight line -->
    <div
      class="absolute top-0 left-4 right-4 h-px"
      :style="{ background: `linear-gradient(90deg, transparent, ${typeConfig.border}, transparent)` }"
    />

    <!-- Speech bubble tail -->
    <div v-if="position === 'left'"
      class="absolute -left-2 top-4 w-0 h-0"
      :style="{
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: `10px solid ${typeConfig.border}`,
      }"
    />
    <div v-if="position === 'right'"
      class="absolute -right-2 top-4 w-0 h-0"
      :style="{
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderLeft: `10px solid ${typeConfig.border}`,
      }"
    />
    
    <div class="flex gap-3 items-start">
      <span class="text-lg flex-shrink-0">{{ typeConfig.icon }}</span>
      <div class="text-sm leading-relaxed" style="color: var(--game-text-secondary)">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
