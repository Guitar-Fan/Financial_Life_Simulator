<!--
  Phase Navigation - Factorio-style Tech Tree
  SVG-based connected node tree with glow effects, unlock animations,
  and progress tracking. Each node represents a startup phase.
-->
<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import gsap from 'gsap';

const store = useBakeryStartupStore();
const treeRef = ref<HTMLElement | null>(null);

const phases = [
  { id: 1, label: 'Business\nPlan', icon: '📋', color: '#f59e0b' },
  { id: 2, label: 'Financing', icon: '💰', color: '#34d399' },
  { id: 3, label: 'Location', icon: '📍', color: '#60a5fa' },
  { id: 4, label: 'Permits', icon: '📜', color: '#f87171' },
  { id: 5, label: 'Build-Out', icon: '🔨', color: '#c084fc' },
  { id: 6, label: 'Suppliers\n& Menu', icon: '🧑‍🍳', color: '#fb923c' },
  { id: 7, label: 'Staffing', icon: '👥', color: '#2dd4bf' },
  { id: 8, label: 'Grand\nOpening', icon: '🎉', color: '#fbbf24' },
];

const getPhaseState = (phaseId: number) => {
  if (store.completedPhases.includes(phaseId)) return 'completed';
  if (store.currentPhase === phaseId) return 'active';
  if (store.currentPhase > phaseId || store.completedPhases.includes(phaseId - 1) || phaseId === 1) return 'unlocked';
  return 'locked';
};

// Animate on phase change
watch(() => store.currentPhase, () => {
  if (treeRef.value) {
    const activeNode = treeRef.value.querySelector('.tech-node--active');
    if (activeNode) {
      gsap.fromTo(activeNode, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    }
  }
});

// SVG line progress
const lineProgress = computed(() => {
  const completed = store.completedPhases.length;
  return (completed / 7) * 100; // 7 connections between 8 nodes
});
</script>

<template>
  <div ref="treeRef" class="w-full">
    <!-- Desktop: Full tech tree -->
    <div class="hidden lg:block">
      <div class="relative" style="padding: 8px 0">
        <!-- SVG Connection Lines -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <defs>
            <!-- Glow filter -->
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <!-- Completed line gradient -->
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#b45309"/>
              <stop offset="100%" stop-color="#f59e0b"/>
            </linearGradient>
          </defs>
          <!-- Background line -->
          <line x1="6%" y1="50%" x2="94%" y2="50%" stroke="#3d3426" stroke-width="2" stroke-dasharray="8 4"/>
          <!-- Progress line (animated) -->
          <line
            x1="6%"
            y1="50%"
            :x2="`${6 + lineProgress * 0.88}%`"
            y2="50%"
            stroke="url(#lineGrad)"
            stroke-width="3"
            filter="url(#glow)"
            class="transition-all duration-700"
          />
        </svg>

        <!-- Nodes -->
        <div class="flex items-center justify-between relative z-10">
          <button
            v-for="phase in phases"
            :key="phase.id"
            @click="store.goToPhase(phase.id)"
            :disabled="getPhaseState(phase.id) === 'locked'"
            :class="[
              'tech-node flex flex-col items-center gap-1.5 transition-all duration-300 group relative',
              `tech-node--${getPhaseState(phase.id)}`,
              getPhaseState(phase.id) === 'active' && 'tech-node--active',
            ]"
            :style="{ cursor: getPhaseState(phase.id) === 'locked' ? 'not-allowed' : 'pointer' }"
          >
            <!-- Node circle -->
            <div
              :class="[
                'w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-all duration-300 relative',
                'border-2',
              ]"
              :style="{
                background: getPhaseState(phase.id) === 'completed'
                  ? `linear-gradient(135deg, ${phase.color}33, ${phase.color}11)`
                  : getPhaseState(phase.id) === 'active'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'var(--game-bg-panel)',
                borderColor: getPhaseState(phase.id) === 'completed'
                  ? phase.color
                  : getPhaseState(phase.id) === 'active'
                    ? 'var(--game-gold)'
                    : 'var(--game-border-dark)',
                boxShadow: getPhaseState(phase.id) === 'active'
                  ? `0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1)`
                  : getPhaseState(phase.id) === 'completed'
                    ? `0 0 12px ${phase.color}33`
                    : 'none',
                opacity: getPhaseState(phase.id) === 'locked' ? '0.35' : '1',
                filter: getPhaseState(phase.id) === 'locked' ? 'saturate(0.2)' : 'none',
              }"
            >
              <!-- Completed checkmark overlay -->
              <span v-if="getPhaseState(phase.id) === 'completed'" class="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" :style="{ background: phase.color, color: '#1a1610' }">✓</span>
              <!-- Active pulse ring -->
              <div v-if="getPhaseState(phase.id) === 'active'" class="absolute inset-0 rounded-lg animate-game-glow" style="border: 1px solid var(--game-gold-dim)" />
              <!-- Icon -->
              <span>{{ phase.icon }}</span>
              <!-- Lock icon for locked -->
              <span v-if="getPhaseState(phase.id) === 'locked'" class="absolute inset-0 flex items-center justify-center text-sm bg-black/40 rounded-lg">🔒</span>
            </div>

            <!-- Label -->
            <span
              :class="['text-[10px] font-semibold text-center leading-tight whitespace-pre-line max-w-[72px]']"
              :style="{
                color: getPhaseState(phase.id) === 'active'
                  ? 'var(--game-gold-bright)'
                  : getPhaseState(phase.id) === 'completed'
                    ? phase.color
                    : getPhaseState(phase.id) === 'locked'
                      ? 'var(--game-text-dim)'
                      : 'var(--game-text-muted)',
              }"
            >
              {{ phase.label }}
            </span>

            <!-- Tooltip on hover -->
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <div class="px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap" style="background: var(--game-bg-darkest); border: 1px solid var(--game-border-medium); color: var(--game-text-secondary)">
                {{ getPhaseState(phase.id) === 'locked' ? '🔒 Locked' : getPhaseState(phase.id) === 'completed' ? '✓ Complete' : 'Phase ' + phase.id }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile: Compact scrollable pills -->
    <div class="lg:hidden">
      <div class="flex items-center gap-2 overflow-x-auto pb-2 px-1 game-scrollbar">
        <button
          v-for="phase in phases"
          :key="phase.id"
          @click="store.goToPhase(phase.id)"
          :disabled="getPhaseState(phase.id) === 'locked'"
          :class="['flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border']"
          :style="{
            background: getPhaseState(phase.id) === 'active'
              ? 'rgba(245, 158, 11, 0.15)'
              : getPhaseState(phase.id) === 'completed'
                ? `${phase.color}15`
                : 'var(--game-bg-panel)',
            borderColor: getPhaseState(phase.id) === 'active'
              ? 'var(--game-gold-dim)'
              : getPhaseState(phase.id) === 'completed'
                ? `${phase.color}40`
                : 'var(--game-border-dark)',
            color: getPhaseState(phase.id) === 'active'
              ? 'var(--game-gold-bright)'
              : getPhaseState(phase.id) === 'completed'
                ? phase.color
                : 'var(--game-text-dim)',
            opacity: getPhaseState(phase.id) === 'locked' ? '0.4' : '1',
            cursor: getPhaseState(phase.id) === 'locked' ? 'not-allowed' : 'pointer',
          }"
        >
          <span>{{ getPhaseState(phase.id) === 'completed' ? '✓' : phase.icon }}</span>
          <span class="hidden sm:inline">{{ phase.label.replace('\n', ' ') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tech-node--active {
  transform: scale(1.05);
}
.tech-node:not(:disabled):hover {
  transform: scale(1.08);
}
</style>
