<script setup lang="ts">
import { computed } from 'vue';
import { useBakeryFinancialStore, useBakeryGameStore, useBakeryInventoryStore } from '@/stores';
import { BakeryCard, BakeryButton, BakeryBadge } from '@/components/base';

const financialStore = useBakeryFinancialStore();
const gameStore = useBakeryGameStore();
const inventoryStore = useBakeryInventoryStore();

const dailyStats = computed(() => financialStore.dailyStats);
const allTimeStats = computed(() => financialStore.allTimeStats);

const profitColor = computed(() => 
  dailyStats.value.grossProfit >= 0 ? 'text-profit' : 'text-loss'
);

const performanceMetrics = computed(() => {
  const metrics = [];
  
  if (dailyStats.value.grossProfit > 0) {
    metrics.push({ 
      label: '📈 Profitable Day', 
      value: `+$${dailyStats.value.grossProfit.toFixed(0)}`,
      variant: 'success' as const
    });
  } else {
    metrics.push({ 
      label: '📉 Loss Today', 
      value: `-$${Math.abs(dailyStats.value.grossProfit).toFixed(0)}`,
      variant: 'danger' as const
    });
  }
  
  if (financialStore.grossMarginPercent >= 60) {
    metrics.push({ label: '⭐ Excellent Margins', value: `${financialStore.grossMarginPercent.toFixed(0)}%`, variant: 'success' as const });
  } else if (financialStore.grossMarginPercent >= 40) {
    metrics.push({ label: '👍 Good Margins', value: `${financialStore.grossMarginPercent.toFixed(0)}%`, variant: 'info' as const });
  } else {
    metrics.push({ label: '⚠️ Low Margins', value: `${financialStore.grossMarginPercent.toFixed(0)}%`, variant: 'warning' as const });
  }
  
  if (dailyStats.value.itemsSold > 50) {
    metrics.push({ label: '🎯 High Volume', value: `${dailyStats.value.itemsSold} items`, variant: 'success' as const });
  }
  
  return metrics;
});

const recommendations = computed(() => {
  const tips = [];
  
  if (financialStore.grossMarginPercent < 40) {
    tips.push('💡 Consider raising prices to improve margins');
  }
  
  if (dailyStats.value.grossProfit < 0) {
    tips.push('💡 Reduce expenses or increase sales to become profitable');
  }
  
  // Calculate total inventory value
  let totalInventoryValue = 0;
  inventoryStore.ingredients.forEach(ing => {
    totalInventoryValue += ing.totalCost;
  });
  
  if (totalInventoryValue < 100) {
    tips.push('💡 Stock up on ingredients for tomorrow');
  }
  
  if (dailyStats.value.itemsSold < 10) {
    tips.push('💡 Focus on marketing to attract more customers');
  }
  
  if (tips.length === 0) {
    tips.push('✨ Great work today! Keep it up!');
  }
  
  return tips;
});

const startNewDay = () => {
  financialStore.endDay();
  gameStore.goToPhase('buying');
};

const returnToMenu = () => {
  financialStore.endDay();
  gameStore.goToPhase('menu');
};
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Day Summary Header -->
    <div class="text-center animate-fade-in">
      <div class="text-6xl mb-4">{{ dailyStats.grossProfit >= 0 ? '🎉' : '😔' }}</div>
      <h1 class="text-4xl font-display font-bold mb-2">Day {{ financialStore.day }} Complete!</h1>
      <p class="text-xl" :class="profitColor">
        {{ dailyStats.grossProfit >= 0 ? 'Profit' : 'Loss' }}: 
        <span class="font-bold">
          {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(dailyStats.grossProfit)) }}
        </span>
      </p>
    </div>

    <!-- Performance Badges -->
    <div class="flex flex-wrap justify-center gap-3 animate-slide-up">
      <BakeryBadge
        v-for="metric in performanceMetrics"
        :key="metric.label"
        :variant="metric.variant"
        size="lg"
      >
        {{ metric.label }}: {{ metric.value }}
      </BakeryBadge>
    </div>

    <!-- Financial Summary -->
    <div class="grid md:grid-cols-3 gap-6">
      <BakeryCard title="Revenue" variant="glass" padding="md">
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-bakery-brown-600">Sales</span>
            <span class="text-2xl font-bold text-profit">
              ${{ dailyStats.revenue.toFixed(0) }}
            </span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-bakery-brown-600">Items Sold</span>
            <span class="font-medium">{{ dailyStats.itemsSold }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-bakery-brown-600">Transactions</span>
            <span class="font-medium">{{ dailyStats.customersServed }}</span>
          </div>
        </div>
      </BakeryCard>

      <BakeryCard title="Expenses" variant="glass" padding="md">
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-bakery-brown-600">COGS</span>
            <span class="text-2xl font-bold text-loss">
              ${{ dailyStats.cogs.toFixed(0) }}
            </span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-bakery-brown-600">Operating</span>
            <span class="font-medium">
              ${{ ((dailyStats.laborCost || 0) + (dailyStats.overhead || 0)).toFixed(0) }}
            </span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-bakery-brown-600">Total</span>
            <span class="font-medium">
              ${{ (dailyStats.cogs + (dailyStats.laborCost || 0) + (dailyStats.overhead || 0)).toFixed(0) }}
            </span>
          </div>
        </div>
      </BakeryCard>

      <BakeryCard title="Profitability" variant="glass" padding="md">
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-bakery-brown-600">Net Profit</span>
            <span class="text-2xl font-bold" :class="profitColor">
              ${{ dailyStats.grossProfit.toFixed(0) }}
            </span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-bakery-brown-600">Margin</span>
            <span class="font-medium">{{ financialStore.grossMarginPercent.toFixed(1) }}%</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-bakery-brown-600">Cash</span>
            <span class="font-medium" :class="financialStore.cash >= 0 ? 'text-profit' : 'text-loss'">
              ${{ financialStore.cash.toFixed(0) }}
            </span>
          </div>
        </div>
      </BakeryCard>
    </div>

    <!-- All-Time Stats -->
    <BakeryCard title="All-Time Records" variant="elevated" padding="md">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-3 bg-bakery-brown-50 rounded-lg">
          <div class="text-3xl mb-1">🏆</div>
          <p class="text-sm text-bakery-brown-600">Best Day</p>
          <p class="text-lg font-bold text-profit">
            ${{ (allTimeStats.highestDailyProfit || 0).toFixed(0) }}
          </p>
        </div>
        <div class="text-center p-3 bg-bakery-brown-50 rounded-lg">
          <div class="text-3xl mb-1">💰</div>
          <p class="text-sm text-bakery-brown-600">Total Revenue</p>
          <p class="text-lg font-bold">
            ${{ allTimeStats.totalRevenue.toFixed(0) }}
          </p>
        </div>
        <div class="text-center p-3 bg-bakery-brown-50 rounded-lg">
          <div class="text-3xl mb-1">📦</div>
          <p class="text-sm text-bakery-brown-600">Items Sold</p>
          <p class="text-lg font-bold">
            {{ allTimeStats.totalCustomers }}
          </p>
        </div>
        <div class="text-center p-3 bg-bakery-brown-50 rounded-lg">
          <div class="text-3xl mb-1">📊</div>
          <p class="text-sm text-bakery-brown-600">Avg Margin</p>
          <p class="text-lg font-bold">
            {{ financialStore.grossMarginPercent.toFixed(0) }}%
          </p>
        </div>
      </div>
    </BakeryCard>

    <!-- Recommendations -->
    <BakeryCard title="Recommendations" variant="glass" padding="md">
      <div class="space-y-2">
        <div
          v-for="(tip, index) in recommendations"
          :key="index"
          class="p-3 bg-white rounded-lg text-sm"
        >
          {{ tip }}
        </div>
      </div>
    </BakeryCard>

    <!-- Actions -->
    <div class="grid md:grid-cols-2 gap-4">
      <BakeryButton
        variant="success"
        size="xl"
        full-width
        icon="🌅"
        @click="startNewDay"
      >
        Start Day {{ financialStore.day + 1 }}
      </BakeryButton>
      <BakeryButton
        variant="secondary"
        size="xl"
        full-width
        icon="🏠"
        @click="returnToMenu"
      >
        Return to Menu
      </BakeryButton>
    </div>
  </div>
</template>
