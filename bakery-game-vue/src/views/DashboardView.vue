<template>
  <div class="min-h-screen p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-bakery-brown-900">Financial Dashboard</h1>
        <p class="text-bakery-brown-600 mt-1">Track your bakery's performance and market conditions</p>
      </div>
      <BakeryButton @click="refreshData" variant="secondary" size="md">
        🔄 Refresh
      </BakeryButton>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white rounded-lg shadow-bakery p-1 flex gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex-1 px-4 py-3 rounded-md font-medium transition-all',
          activeTab === tab.id
            ? 'bg-bakery-gold-500 text-white shadow-md'
            : 'text-bakery-brown-700 hover:bg-bakery-brown-50'
        ]"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Overview Tab -->
      <div v-show="activeTab === 'overview'" class="space-y-6">
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BakeryCard variant="glass" padding="md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-bakery-brown-600">Cash on Hand</p>
                <p class="text-2xl font-bold text-bakery-brown-900 mt-1">
                  {{ formatCurrency(financialStore.cash) }}
                </p>
              </div>
              <div class="text-4xl">💰</div>
            </div>
          </BakeryCard>

          <BakeryCard variant="glass" padding="md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-bakery-brown-600">Today's Revenue</p>
                <p class="text-2xl font-bold text-profit mt-1">
                  {{ formatCurrency(financialStore.dailyStats.revenue) }}
                </p>
              </div>
              <div class="text-4xl">📈</div>
            </div>
          </BakeryCard>

          <BakeryCard variant="glass" padding="md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-bakery-brown-600">Gross Profit</p>
                <p class="text-2xl font-bold mt-1" :class="financialStore.dailyStats.grossProfit >= 0 ? 'text-profit' : 'text-loss'">
                  {{ formatCurrency(financialStore.dailyStats.grossProfit) }}
                </p>
              </div>
              <div class="text-4xl">{{ financialStore.dailyStats.grossProfit >= 0 ? '✅' : '❌' }}</div>
            </div>
          </BakeryCard>

          <BakeryCard variant="glass" padding="md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-bakery-brown-600">Customers Served</p>
                <p class="text-2xl font-bold text-bakery-brown-900 mt-1">
                  {{ financialStore.dailyStats.customersServed }}
                </p>
              </div>
              <div class="text-4xl">👥</div>
            </div>
          </BakeryCard>
        </div>

        <!-- Revenue Trend Chart -->
        <BakeryCard title="Revenue Trend" subtitle="Last 7 days" variant="elevated" padding="lg">
          <LineChart
            :labels="revenueTrendLabels"
            :datasets="[
              { label: 'Revenue', data: revenueTrendData, color: '#10b981', fill: true },
              { label: 'Costs', data: costTrendData, color: '#ef4444', fill: true }
            ]"
            height="350px"
            y-axis-label="Amount ($)"
          />
        </BakeryCard>
      </div>

      <!-- Market Conditions Tab -->
      <div v-show="activeTab === 'market'" class="space-y-6">
        <BakeryCard title="Economic Indicators" variant="glass" padding="lg">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-bakery-cream-50 rounded-lg">
              <p class="text-sm text-bakery-brown-600">Season</p>
              <p class="text-3xl font-bold text-bakery-brown-900 mt-2">
                {{ getCurrentSeason() }}
              </p>
            </div>
            <div class="text-center p-4 bg-bakery-cream-50 rounded-lg">
              <p class="text-sm text-bakery-brown-600">Day</p>
              <p class="text-3xl font-bold text-bakery-brown-900 mt-2">
                {{ financialStore.day }}
              </p>
            </div>
            <div class="text-center p-4 bg-bakery-cream-50 rounded-lg">
              <p class="text-sm text-bakery-brown-600">Markup</p>
              <p class="text-3xl font-bold text-bakery-brown-900 mt-2">
                {{ financialStore.markupPercentage }}%
              </p>
            </div>
          </div>
        </BakeryCard>

        <!-- Ingredient Price Trends -->
        <BakeryCard title="Ingredient Availability" subtitle="Current stock levels" variant="elevated" padding="lg">
          <BarChart
            :labels="ingredientLabels"
            :datasets="[{ label: 'Quantity', data: ingredientQuantities, color: '#d97706' }]"
            height="350px"
            y-axis-label="Units"
          />
        </BakeryCard>
      </div>

      <!-- Business Performance Tab -->
      <div v-show="activeTab === 'business'" class="space-y-6">
        <!-- Performance Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BakeryCard title="Sales by Product" variant="elevated" padding="lg">
            <PieChart
              :labels="productLabels"
              :data="productSales"
              height="300px"
            />
          </BakeryCard>

          <BakeryCard title="Cost Breakdown" variant="elevated" padding="lg">
            <PieChart
              :labels="['Ingredients', 'Labor', 'Overhead']"
              :data="[
                financialStore.dailyStats.cogs,
                financialStore.dailyStats.laborCost || 0,
                financialStore.dailyStats.overhead || 0
              ]"
              height="300px"
            />
          </BakeryCard>
        </div>

        <!-- All-Time Records -->
        <BakeryCard title="All-Time Records" variant="glass" padding="lg">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-white rounded-lg">
              <p class="text-sm text-bakery-brown-600">Best Day Revenue</p>
              <p class="text-xl font-bold text-profit mt-2">
                {{ formatCurrency(financialStore.allTimeStats.highestDailyRevenue || 0) }}
              </p>
            </div>
            <div class="text-center p-4 bg-white rounded-lg">
              <p class="text-sm text-bakery-brown-600">Total Revenue</p>
              <p class="text-xl font-bold text-bakery-brown-900 mt-2">
                {{ formatCurrency(financialStore.allTimeStats.totalRevenue) }}
              </p>
            </div>
            <div class="text-center p-4 bg-white rounded-lg">
              <p class="text-sm text-bakery-brown-600">Days Operated</p>
              <p class="text-xl font-bold text-bakery-brown-900 mt-2">
                {{ financialStore.allTimeStats.daysOperated }}
              </p>
            </div>
            <div class="text-center p-4 bg-white rounded-lg">
              <p class="text-sm text-bakery-brown-600">Total Customers</p>
              <p class="text-xl font-bold text-bakery-gold-600 mt-2">
                {{ financialStore.allTimeStats.totalCustomers }}
              </p>
            </div>
          </div>
        </BakeryCard>
      </div>

      <!-- Pricing Analysis Tab -->
      <div v-show="activeTab === 'pricing'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Margin Calculator -->
          <BakeryCard title="Margin Calculator" variant="elevated" padding="lg">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-bakery-brown-700 mb-2">
                  Current Markup Percentage
                </label>
                <input
                  v-model.number="markupInput"
                  type="number"
                  min="0"
                  max="500"
                  class="w-full px-4 py-2 border border-bakery-brown-300 rounded-lg focus:ring-2 focus:ring-bakery-gold-500 focus:border-transparent"
                />
              </div>
              <div class="p-4 bg-bakery-cream-50 rounded-lg">
                <p class="text-sm text-bakery-brown-600">Gross Margin</p>
                <p class="text-2xl font-bold text-bakery-brown-900 mt-1">
                  {{ calculateMargin(markupInput) }}%
                </p>
              </div>
              <BakeryButton @click="applyMarkup" variant="primary" size="md" class="w-full">
                Apply Markup
              </BakeryButton>
            </div>
          </BakeryCard>

          <!-- Pricing Recommendations -->
          <BakeryCard title="Pricing Insights" variant="glass" padding="lg">
            <div class="space-y-3">
              <div class="p-4 bg-white rounded-lg border-l-4 border-bakery-gold-500">
                <p class="font-medium text-bakery-brown-900">💡 Tip</p>
                <p class="text-sm text-bakery-brown-600 mt-1">
                  Aim for a 30-40% profit margin.
                  Industry average for bakeries is 30-40%.
                </p>
              </div>
              <div class="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                <p class="font-medium text-bakery-brown-900">📊 Analysis</p>
                <p class="text-sm text-bakery-brown-600 mt-1">
                  {{ getPricingRecommendation() }}
                </p>
              </div>
              <div class="p-4 bg-white rounded-lg border-l-4 border-green-500">
                <p class="font-medium text-bakery-brown-900">✅ Best Practice</p>
                <p class="text-sm text-bakery-brown-600 mt-1">
                  Monitor your gross profit margin daily and adjust prices based on ingredient costs and customer demand.
                </p>
              </div>
            </div>
          </BakeryCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryFinancialStore, useBakeryInventoryStore } from '@/stores';
import { BakeryCard, BakeryButton } from '@/components/base';
import { LineChart, BarChart, PieChart } from '@/components/charts';

const financialStore = useBakeryFinancialStore();
const inventoryStore = useBakeryInventoryStore();

const activeTab = ref('overview');
const markupInput = ref(financialStore.markupPercentage);

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'market', label: 'Market', icon: '🏪' },
  { id: 'business', label: 'Performance', icon: '📈' },
  { id: 'pricing', label: 'Pricing', icon: '💰' },
];

// Sample data for revenue trend (last 7 days)
const revenueTrendLabels = computed(() => {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    labels.push(`Day ${Math.max(1, financialStore.day - i)}`);
  }
  return labels;
});

const revenueTrendData = computed(() => {
  // In real app, this would come from historical data
  return [120, 180, 150, 200, 250, 220, financialStore.dailyStats.revenue];
});

const costTrendData = computed(() => {
  return [80, 120, 100, 130, 160, 140, financialStore.dailyStats.cogs];
});

// Ingredient data
const ingredientLabels = computed(() => {
  const labels: string[] = [];
  inventoryStore.ingredients.forEach((_, key) => {
    labels.push(key);
  });
  return labels.slice(0, 8);
});

const ingredientQuantities = computed(() => {
  const quantities: number[] = [];
  inventoryStore.ingredients.forEach((ingredient) => {
    const total = ingredient.batches.reduce((sum: number, batch: any) => sum + batch.quantity, 0);
    quantities.push(total);
  });
  return quantities.slice(0, 8);
});

// Product sales data
const productLabels = computed(() => {
  const labels: string[] = [];
  inventoryStore.products.forEach((_, key) => {
    labels.push(key);
  });
  return labels.length > 0 ? labels : ['No sales yet'];
});

const productSales = computed(() => {
  const sales: number[] = [];
  inventoryStore.products.forEach((product) => {
    sales.push(product.soldToday || 0);
  });
  return sales.length > 0 && sales.some(s => s > 0) ? sales : [1];
});

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getCurrentSeason = () => {
  const day = financialStore.day;
  const seasonIndex = Math.floor((day % 365) / 91);
  const seasons = ['🌸 Spring', '☀️ Summer', '🍂 Fall', '❄️ Winter'];
  return seasons[seasonIndex];
};

const calculateMargin = (markup: number) => {
  return ((markup / (100 + markup)) * 100).toFixed(1);
};

const getPricingRecommendation = () => {
  const margin = financialStore.grossMarginPercent;
  if (margin < 20) {
    return 'Your margins are low. Consider increasing prices or reducing ingredient costs.';
  } else if (margin < 30) {
    return 'Your margins are below industry average. There may be room for price optimization.';
  } else if (margin > 50) {
    return 'Your margins are high, but ensure you\'re not pricing yourself out of the market.';
  }
  return 'Your margins are healthy and within industry standards.';
};

const applyMarkup = () => {
  financialStore.markupPercentage = markupInput.value;
};

const refreshData = () => {
  // In real app, this would refresh data from backend
  console.log('Refreshing dashboard data...');
};
</script>

<style scoped>
.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
