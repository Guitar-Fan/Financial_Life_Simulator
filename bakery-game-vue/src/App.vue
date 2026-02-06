<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBakeryGameStore, useBakeryFinancialStore } from '@/stores';

const router = useRouter();
const gameStore = useBakeryGameStore();
const financialStore = useBakeryFinancialStore();

// Sync phase changes with router
watch(() => gameStore.currentPhase, (newPhase) => {
  const routeName = newPhase === 'menu' ? 'menu' : newPhase;
  if (router.currentRoute.value.name !== routeName) {
    router.push({ name: routeName });
  }
}, { immediate: true });

const phaseConfig = [
  { id: 'menu', label: 'Menu', icon: '🏠', color: 'bg-bakery-brown-600' },
  { id: 'buying', label: 'Shop', icon: '🛒', color: 'bg-blue-600' },
  { id: 'baking', label: 'Bake', icon: '🥐', color: 'bg-bakery-gold-600' },
  { id: 'selling', label: 'Sell', icon: '💰', color: 'bg-profit' },
  { id: 'summary', label: 'Day End', icon: '📊', color: 'bg-purple-600' },
];

const currentPhaseIndex = computed(() => 
  phaseConfig.findIndex(p => p.id === gameStore.currentPhase)
);

const formattedTime = computed(() => {
  const { day, hour, minute } = financialStore as any;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `Day ${day} - ${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
});

const formattedCash = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format((financialStore as any).cash);
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Top Navigation Bar -->
    <header class="glass sticky top-0 z-30 shadow-bakery animate-slide-down">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo and Title -->
          <div class="flex items-center gap-3">
            <div class="text-4xl">🥐</div>
            <div>
              <h1 class="text-xl font-display font-bold text-gradient-brown">
                Bakery Tycoon
              </h1>
              <p class="text-xs text-bakery-brown-600">{{ formattedTime }}</p>
            </div>
          </div>

          <!-- Phase Indicators -->
          <nav class="hidden md:flex items-center gap-2">
            <button
              v-for="(phase, index) in phaseConfig"
              :key="phase.id"
              :class="[
                'phase-indicator',
                phase.color,
                'text-white',
                { 'active ring-2 ring-offset-2 ring-bakery-gold-400': index === currentPhaseIndex },
                { 'opacity-50': index !== currentPhaseIndex }
              ]"
              @click="gameStore.goToPhase(phase.id as any)"
            >
              <span class="text-lg">{{ phase.icon }}</span>
              <span class="hidden lg:inline">{{ phase.label }}</span>
            </button>
          </nav>

          <!-- Cash Display -->
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-xs text-bakery-brown-600">Cash</p>
              <p :class="['text-lg font-bold', financialStore.cash >= 0 ? 'money-positive' : 'money-negative']">
                {{ formattedCash }}
              </p>
            </div>

            <!-- Quick Actions -->
            <div class="flex gap-2">
              <button
                class="p-2 rounded-lg hover:bg-bakery-brown-100 transition-colors"
                title="Settings"
              >
                ⚙️
              </button>
              <button
                class="p-2 rounded-lg hover:bg-bakery-brown-100 transition-colors"
                title="Save Game"
              >
                💾
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Phase Selector -->
    <div class="md:hidden glass-dark p-2">
      <select
        :value="gameStore.currentPhase"
        class="w-full bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20"
        @change="gameStore.goToPhase(($event.target as HTMLSelectElement).value as any)"
      >
        <option v-for="phase in phaseConfig" :key="phase.id" :value="phase.id">
          {{ phase.icon }} {{ phase.label }}
        </option>
      </select>
    </div>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <router-view v-slot="{ Component, route }">
        <Transition
          :name="(route.meta.transition as string) || 'fade'"
          mode="out-in"
        >
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </main>

    <!-- Footer / Status Bar -->
    <footer class="glass-dark text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-6">
            <span>Speed: {{ gameStore.gameSpeed }}x</span>
            <span v-if="gameStore.isPaused" class="text-warning">⏸️ Paused</span>
            <span v-else class="text-profit">▶️ Running</span>
          </div>
          <div class="flex items-center gap-6">
            <span>Daily Revenue: {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((financialStore as any).dailyStats.revenue) }}</span>
            <span :class="(financialStore as any).dailyStats.grossProfit >= 0 ? 'money-positive' : 'money-negative'">
              Profit: {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((financialStore as any).dailyStats.grossProfit) }}
            </span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Scale transition */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
