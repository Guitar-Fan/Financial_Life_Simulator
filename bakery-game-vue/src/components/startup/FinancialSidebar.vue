<!--
  Financial HUD Sidebar - Game-themed
  Dark, data-dense financial dashboard inspired by Factorio's info panels.
  Animated resource bars, GSAP number counters, risk indicators.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import ResourceCounter from './ui/ResourceCounter.vue';

const store = useBakeryStartupStore();

const cashPercent = computed(() =>
  Math.max(0, Math.min(100, (store.cashRemaining / Math.max(1, store.totalCapital)) * 100))
);

const cashBarColor = computed(() => {
  if (cashPercent.value > 50) return 'success';
  if (cashPercent.value > 20) return 'gold';
  return 'danger';
});

const debtRatio = computed(() => {
  const r = store.financialProjection.debtToEquityRatio;
  if (r < 0.5) return { text: 'LOW', color: 'var(--game-success)', bar: 'success' };
  if (r < 1.5) return { text: 'MED', color: 'var(--game-warning)', bar: 'gold' };
  return { text: 'HIGH', color: 'var(--game-danger)', bar: 'danger' };
});

const runwayColor = computed(() => {
  const m = store.financialProjection.runwayMonths;
  if (m >= 6) return 'var(--game-success)';
  if (m >= 3) return 'var(--game-warning)';
  return 'var(--game-danger)';
});

const readinessBarColor = computed(() => {
  const p = store.startupReadiness.percentage;
  if (p >= 80) return 'success';
  if (p >= 50) return 'gold';
  return 'danger';
});
</script>

<template>
  <div class="game-panel game-panel--gold space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="var(--game-gold)" stroke-width="1.2" fill="none"/>
          <line x1="4" y1="6" x2="12" y2="6" stroke="var(--game-gold-dim)" stroke-width="0.8"/>
          <line x1="4" y1="8.5" x2="10" y2="8.5" stroke="var(--game-border-medium)" stroke-width="0.8"/>
          <line x1="4" y1="10.5" x2="8" y2="10.5" stroke="var(--game-border-dark)" stroke-width="0.8"/>
        </svg>
        <h3 class="font-game-title text-xs font-bold uppercase tracking-widest" style="color: var(--game-gold-bright)">
          Financial HUD
        </h3>
      </div>
      <span class="font-game-mono text-[10px] font-bold" style="color: var(--game-text-dim)">WK {{ store.weekNumber }}</span>
    </div>

    <hr class="game-divider game-divider--gold" style="margin: 0.5rem 0">

    <!-- Capital Stack -->
    <div class="space-y-3">
      <ResourceCounter label="Total Capital" :value="store.totalCapital" prefix="$" color="neutral" size="lg" />

      <div class="flex justify-between items-baseline">
        <span class="text-[10px] uppercase tracking-wider font-semibold" style="color: var(--game-text-dim)">Spent</span>
        <span class="font-game-mono text-sm font-bold" style="color: var(--game-danger)">
          -${{ store.totalSpent.toLocaleString() }}
        </span>
      </div>

      <hr class="game-divider" style="margin: 0.25rem 0">

      <ResourceCounter label="Cash Remaining" :value="store.cashRemaining" prefix="$" :color="cashPercent > 50 ? 'success' : cashPercent > 20 ? 'gold' : 'danger'" size="lg" :show-trend="true" />

      <!-- Cash Bar -->
      <div class="game-resource-bar">
        <div
          :class="['game-resource-bar__fill', `game-resource-bar__fill--${cashBarColor}`]"
          :style="{ width: `${cashPercent}%` }"
        />
      </div>
    </div>

    <hr class="game-divider" style="margin: 0.75rem 0">

    <!-- Monthly Projections -->
    <div class="space-y-2">
      <h4 class="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style="color: var(--game-text-muted)">
        <span style="color: var(--game-gold-dim)">▸</span> Projections
      </h4>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <span class="text-[9px] uppercase tracking-wider" style="color: var(--game-text-dim)">Revenue</span>
          <p class="font-game-mono text-xs font-bold" style="color: var(--game-success)">${{ store.estimatedMonthlyRevenue.toLocaleString() }}<span class="text-[9px]" style="color: var(--game-text-dim)">/mo</span></p>
        </div>
        <div>
          <span class="text-[9px] uppercase tracking-wider" style="color: var(--game-text-dim)">Costs</span>
          <p class="font-game-mono text-xs font-bold" style="color: var(--game-danger)">${{ store.monthlyFixedCosts.toLocaleString() }}<span class="text-[9px]" style="color: var(--game-text-dim)">/mo</span></p>
        </div>
        <div>
          <span class="text-[9px] uppercase tracking-wider" style="color: var(--game-text-dim)">Debt Service</span>
          <p class="font-game-mono text-xs font-bold" style="color: var(--game-warning)">${{ store.monthlyDebtService.toFixed(0) }}<span class="text-[9px]" style="color: var(--game-text-dim)">/mo</span></p>
        </div>
        <div>
          <span class="text-[9px] uppercase tracking-wider" style="color: var(--game-text-dim)">Runway</span>
          <p class="font-game-mono text-xs font-bold" :style="{ color: runwayColor }">{{ store.financialProjection.runwayMonths >= 999 ? '∞' : `${store.financialProjection.runwayMonths.toFixed(1)}` }}<span class="text-[9px]" style="color: var(--game-text-dim)"> mo</span></p>
        </div>
      </div>
    </div>

    <hr class="game-divider" style="margin: 0.75rem 0">

    <!-- Risk Panel -->
    <div class="space-y-2">
      <h4 class="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style="color: var(--game-text-muted)">
        <span style="color: var(--game-danger)">▸</span> Risk Indicators
      </h4>

      <!-- Debt/Equity -->
      <div class="flex items-center justify-between">
        <span class="text-[10px]" style="color: var(--game-text-dim)">Debt/Equity</span>
        <div class="flex items-center gap-2">
          <div class="w-12 game-resource-bar" style="height: 4px">
            <div
              :class="['game-resource-bar__fill', `game-resource-bar__fill--${debtRatio.bar}`]"
              :style="{ width: `${Math.min(100, store.financialProjection.debtToEquityRatio * 50)}%` }"
            />
          </div>
          <span class="game-badge text-[8px]" :class="[`game-badge--${debtRatio.bar === 'gold' ? 'gold' : debtRatio.bar}`]">{{ debtRatio.text }}</span>
        </div>
      </div>

      <!-- Break-Even -->
      <div class="flex items-center justify-between">
        <span class="text-[10px]" style="color: var(--game-text-dim)">Break-Even</span>
        <span
          class="font-game-mono text-[10px] font-bold"
          :style="{ color: store.financialProjection.breakEvenMonths < 12 ? 'var(--game-success)' : store.financialProjection.breakEvenMonths < 999 ? 'var(--game-warning)' : 'var(--game-danger)' }"
        >
          {{ store.financialProjection.breakEvenMonths >= 999 ? 'N/A' : `${store.financialProjection.breakEvenMonths}mo` }}
        </span>
      </div>

      <!-- Burn Rate -->
      <div class="flex items-center justify-between">
        <span class="text-[10px]" style="color: var(--game-text-dim)">Burn Rate</span>
        <span class="font-game-mono text-[10px] font-bold" style="color: var(--game-danger)">
          ${{ store.financialProjection.burnRate.toLocaleString() }}/mo
        </span>
      </div>
    </div>

    <hr class="game-divider" style="margin: 0.75rem 0">

    <!-- Readiness -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style="color: var(--game-text-muted)">
          <span :style="{ color: store.startupReadiness.percentage >= 80 ? 'var(--game-success)' : 'var(--game-gold-dim)' }">▸</span> Readiness
        </h4>
        <span
          class="font-game-mono text-lg font-bold"
          :style="{
            color: store.startupReadiness.percentage >= 80 ? 'var(--game-success)' : store.startupReadiness.percentage >= 50 ? 'var(--game-gold-bright)' : 'var(--game-danger)',
          }"
        >
          {{ store.startupReadiness.percentage }}%
        </span>
      </div>

      <!-- Readiness bar -->
      <div class="game-resource-bar" style="height: 8px">
        <div
          :class="['game-resource-bar__fill', `game-resource-bar__fill--${readinessBarColor}`]"
          :style="{ width: `${store.startupReadiness.percentage}%` }"
        />
      </div>

      <!-- Checklist -->
      <div class="space-y-1 mt-2">
        <div
          v-for="check in store.startupReadiness.checks"
          :key="check.label"
          class="flex items-center gap-2 py-0.5"
        >
          <div
            class="w-3 h-3 rounded-sm flex items-center justify-center text-[8px] font-bold"
            :style="{
              background: check.met ? 'var(--game-success)' : 'transparent',
              border: check.met ? 'none' : '1px solid var(--game-border-medium)',
              color: check.met ? '#1a1610' : 'var(--game-text-dim)',
            }"
          >
            {{ check.met ? '✓' : '' }}
          </div>
          <span
            class="text-[10px]"
            :style="{ color: check.met ? 'var(--game-text-secondary)' : 'var(--game-text-dim)', textDecoration: check.met ? 'none' : 'none' }"
          >
            {{ check.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
