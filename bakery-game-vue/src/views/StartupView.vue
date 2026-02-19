<!--
  StartupView - GAME SHELL
  Dark, immersive container for the entire pre-operational phase.
  Features: resource bar header, tech-tree navigation, ambient particles,
  Factorio-inspired dark warm aesthetic.
-->
<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

import ParticleBackground from '@/components/startup/graphics/ParticleBackground.vue';
import PhaseNavigation from '@/components/startup/PhaseNavigation.vue';
import FinancialSidebar from '@/components/startup/FinancialSidebar.vue';

// Phase components
import BusinessPlanningPhase from '@/components/startup/BusinessPlanningPhase.vue';
import FinancingPhase from '@/components/startup/FinancingPhase.vue';
import LocationPhase from '@/components/startup/LocationPhase.vue';
import PermitsPhase from '@/components/startup/PermitsPhase.vue';
import RenovationEquipmentPhase from '@/components/startup/RenovationEquipmentPhase.vue';
import SuppliersMenuPhase from '@/components/startup/SuppliersMenuPhase.vue';
import StaffingPhase from '@/components/startup/StaffingPhase.vue';
import GrandOpeningPhase from '@/components/startup/GrandOpeningPhase.vue';

const store = useBakeryStartupStore();
const showMobileSidebar = ref(false);
const phaseContentRef = ref<HTMLElement | null>(null);

const phaseLabels: Record<number, string> = {
  1: 'Business Planning',
  2: 'Financing',
  3: 'Location Scouting',
  4: 'Permits & Licensing',
  5: 'Renovation & Equipment',
  6: 'Suppliers & Menu',
  7: 'Staffing',
  8: 'Marketing & Grand Opening',
};

const phaseIcons: Record<number, string> = {
  1: '📋', 2: '💰', 3: '📍', 4: '📜', 5: '🔨', 6: '🧑‍🍳', 7: '👥', 8: '🎉',
};

const currentPhaseLabel = computed(() => phaseLabels[store.currentPhase] || '');

const phaseComponent = computed(() => {
  switch (store.currentPhase) {
    case 1: return BusinessPlanningPhase;
    case 2: return FinancingPhase;
    case 3: return LocationPhase;
    case 4: return PermitsPhase;
    case 5: return RenovationEquipmentPhase;
    case 6: return SuppliersMenuPhase;
    case 7: return StaffingPhase;
    case 8: return GrandOpeningPhase;
    default: return BusinessPlanningPhase;
  }
});

const cashColor = computed(() => {
  if (store.cashRemaining >= 10000) return 'var(--game-success)';
  if (store.cashRemaining >= 0) return 'var(--game-gold-bright)';
  return 'var(--game-danger)';
});

const cashBarPercent = computed(() =>
  Math.max(0, Math.min(100, (store.cashRemaining / Math.max(1, store.totalCapital)) * 100))
);

// Celebration on phase completion
watch(() => store.completedPhases.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#d97706', '#fbbf24', '#34d399'],
      gravity: 1.2,
    });
  }
});

// Phase transition animation
watch(() => store.currentPhase, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (phaseContentRef.value) {
    gsap.fromTo(phaseContentRef.value,
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
    );
  }
});

function formatCurrency(n: number) {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}
</script>

<template>
  <div class="min-h-screen relative game-grid-bg" style="background: var(--game-bg-darkest)">
    <!-- Ambient particles -->
    <ParticleBackground />

    <!-- ═══════════ TOP RESOURCE BAR ═══════════ -->
    <header class="game-header sticky top-0 z-50 relative">
      <div class="max-w-[1600px] mx-auto px-4 py-2">
        <div class="flex items-center justify-between gap-4">
          <!-- Logo / Title -->
          <div class="flex items-center gap-3 flex-shrink-0">
            <!-- Animated bakery icon -->
            <div class="w-10 h-10 rounded-lg flex items-center justify-center relative" style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--game-gold-dim)">
              <span class="text-xl">🥐</span>
              <div class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-game-glow" style="background: var(--game-gold); border: 1px solid var(--game-gold-bright)" />
            </div>
            <div>
              <h1 class="font-game-title text-base font-bold tracking-wide" style="color: var(--game-gold-bright)">
                {{ store.businessName || 'BAKERY TYCOON' }}
              </h1>
              <div class="flex items-center gap-2 text-[10px] uppercase tracking-widest" style="color: var(--game-text-muted)">
                <span>Pre-Operational Phase</span>
                <span style="color: var(--game-border-medium)">|</span>
                <span class="font-game-mono" style="color: var(--game-gold)">Week {{ store.weekNumber }}</span>
              </div>
            </div>
          </div>

          <!-- Resource Counters (Desktop) -->
          <div class="hidden md:flex items-center gap-6">
            <!-- Cash -->
            <div class="flex flex-col items-end">
              <span class="text-[9px] uppercase tracking-widest font-semibold" style="color: var(--game-text-dim)">Cash</span>
              <div class="flex items-center gap-1.5">
                <div class="w-16 h-1.5 rounded-full overflow-hidden" style="background: var(--game-bg-darkest); border: 1px solid var(--game-border-dark)">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :style="{ width: `${cashBarPercent}%`, background: `linear-gradient(90deg, var(--game-gold-dim), ${cashColor})` }"
                  />
                </div>
                <span class="font-game-mono text-sm font-bold tabular-nums" :style="{ color: cashColor }">
                  {{ formatCurrency(store.cashRemaining) }}
                </span>
              </div>
            </div>

            <!-- Capital -->
            <div class="flex flex-col items-end">
              <span class="text-[9px] uppercase tracking-widest font-semibold" style="color: var(--game-text-dim)">Capital</span>
              <span class="font-game-mono text-sm font-bold tabular-nums" style="color: var(--game-text-secondary)">
                {{ formatCurrency(store.totalCapital) }}
              </span>
            </div>

            <!-- Spent -->
            <div class="flex flex-col items-end">
              <span class="text-[9px] uppercase tracking-widest font-semibold" style="color: var(--game-text-dim)">Spent</span>
              <span class="font-game-mono text-sm font-bold tabular-nums" style="color: var(--game-danger)">
                -{{ formatCurrency(store.totalSpent) }}
              </span>
            </div>

            <!-- Readiness -->
            <div class="flex flex-col items-end">
              <span class="text-[9px] uppercase tracking-widest font-semibold" style="color: var(--game-text-dim)">Ready</span>
              <div class="flex items-center gap-1.5">
                <div class="w-12 h-1.5 rounded-full overflow-hidden" style="background: var(--game-bg-darkest); border: 1px solid var(--game-border-dark)">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :style="{
                      width: `${store.startupReadiness.percentage}%`,
                      background: store.startupReadiness.percentage >= 80 ? 'linear-gradient(90deg, #047857, #34d399)' : store.startupReadiness.percentage >= 50 ? 'linear-gradient(90deg, #b45309, #fbbf24)' : 'linear-gradient(90deg, #991b1b, #f87171)',
                    }"
                  />
                </div>
                <span class="font-game-mono text-sm font-bold" :style="{
                  color: store.startupReadiness.percentage >= 80 ? 'var(--game-success)' : store.startupReadiness.percentage >= 50 ? 'var(--game-gold-bright)' : 'var(--game-danger)',
                }">
                  {{ store.startupReadiness.percentage }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Mobile HUD toggle -->
          <button
            class="md:hidden game-btn game-btn--secondary text-xs py-1.5 px-3"
            @click="showMobileSidebar = !showMobileSidebar"
          >
            📊 HUD
          </button>
        </div>
      </div>
      <!-- Bottom glow line -->
      <div class="absolute bottom-0 left-0 right-0 h-px" style="background: linear-gradient(90deg, transparent 5%, var(--game-gold-dim) 50%, transparent 95%)" />
    </header>

    <!-- ═══════════ TECH TREE NAVIGATION ═══════════ -->
    <div class="max-w-[1600px] mx-auto px-4 py-4 relative z-10">
      <PhaseNavigation />
    </div>

    <!-- ═══════════ MAIN CONTENT ═══════════ -->
    <div class="max-w-[1600px] mx-auto px-4 pb-16 relative z-10">
      <div class="flex gap-5">
        <!-- Phase Content -->
        <main class="flex-1 min-w-0" ref="phaseContentRef">
          <!-- Phase Header -->
          <div class="mb-5 flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--game-border-dark)"
            >
              {{ phaseIcons[store.currentPhase] }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="game-badge game-badge--gold">Phase {{ store.currentPhase }}/8</span>
              </div>
              <h2 class="font-game-title text-xl font-bold tracking-wide" style="color: var(--game-text-primary)">
                {{ currentPhaseLabel }}
              </h2>
            </div>
          </div>

          <!-- Dynamic Phase Component -->
          <Transition name="phase" mode="out-in">
            <component :is="phaseComponent" :key="store.currentPhase" />
          </Transition>
        </main>

        <!-- Financial Sidebar (Desktop) -->
        <aside class="hidden xl:block w-80 flex-shrink-0">
          <div class="sticky top-20">
            <FinancialSidebar />
          </div>
        </aside>
      </div>
    </div>

    <!-- ═══════════ MOBILE BOTTOM BAR ═══════════ -->
    <div class="xl:hidden fixed bottom-0 left-0 right-0 z-40" style="background: var(--game-bg-dark); border-top: 1px solid var(--game-border-dark)">
      <div class="flex items-center justify-around py-2 px-3 text-[10px] uppercase tracking-wider">
        <div class="text-center">
          <span style="color: var(--game-text-dim)">Cash</span>
          <p class="font-game-mono font-bold text-xs" :style="{ color: cashColor }">{{ formatCurrency(store.cashRemaining) }}</p>
        </div>
        <div class="text-center">
          <span style="color: var(--game-text-dim)">Spent</span>
          <p class="font-game-mono font-bold text-xs" style="color: var(--game-danger)">{{ formatCurrency(store.totalSpent) }}</p>
        </div>
        <div class="text-center">
          <span style="color: var(--game-text-dim)">Ready</span>
          <p class="font-game-mono font-bold text-xs" :style="{ color: store.startupReadiness.percentage >= 60 ? 'var(--game-success)' : 'var(--game-gold)' }">{{ store.startupReadiness.percentage }}%</p>
        </div>
        <div class="text-center">
          <span style="color: var(--game-text-dim)">Phase</span>
          <p class="font-game-mono font-bold text-xs" style="color: var(--game-gold-bright)">{{ store.currentPhase }}/8</p>
        </div>
      </div>
    </div>

    <!-- ═══════════ MOBILE SIDEBAR OVERLAY ═══════════ -->
    <Transition name="sidebar">
      <div v-if="showMobileSidebar" class="fixed inset-0 z-50 xl:hidden">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showMobileSidebar = false" />
        <div class="absolute right-0 top-0 bottom-0 w-80 overflow-y-auto game-scrollbar" style="background: var(--game-bg-dark); border-left: 1px solid var(--game-border-dark)">
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-game-title text-sm font-bold uppercase tracking-wider" style="color: var(--game-gold-bright)">Financial HUD</h3>
              <button @click="showMobileSidebar = false" class="text-game-muted hover:text-game-primary text-lg">&times;</button>
            </div>
            <FinancialSidebar />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Phase transition */
.phase-enter-active, .phase-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.phase-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.phase-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Sidebar overlay */
.sidebar-enter-active, .sidebar-leave-active {
  transition: all 0.3s ease;
}
.sidebar-enter-from, .sidebar-leave-to {
  opacity: 0;
}
.sidebar-enter-from > div:last-child,
.sidebar-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>
