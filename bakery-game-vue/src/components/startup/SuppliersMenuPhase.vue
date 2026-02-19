<!--
  Phase 6: Suppliers & Menu
  Player selects ingredient suppliers (each with hidden quality/reliability variance)
  and builds their opening menu from available recipes with pricing decisions.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import { SUPPLIERS, AVAILABLE_RECIPES } from '@/data/startup-data';
import type { SupplierId, RecipeId } from '@/types/startup-types';
import AdvisorAvatar from './graphics/AdvisorAvatar.vue';
import SpeechBubble from './graphics/SpeechBubble.vue';

const store = useBakeryStartupStore();
const activeTab = ref<'suppliers' | 'menu'>('suppliers');
const expandedSupplier = ref<SupplierId | null>(null);

const priceOverrides = ref<Record<string, number>>({});

function hasSupplier(id: SupplierId): boolean {
  return store.supplierContracts.some(c => c.supplierId === id);
}

function toggleSupplier(id: SupplierId) {
  if (hasSupplier(id)) {
    store.removeSupplierContract(id);
  } else {
    const supplier = SUPPLIERS.find(s => s.id === id);
    if (supplier) {
      store.addSupplierContract(id, supplier.minimumOrder);
    }
  }
}

function hasMenuItem(id: RecipeId): boolean {
  return store.menuSelections.some(m => m.recipeId === id);
}

function toggleMenuItem(id: RecipeId) {
  if (hasMenuItem(id)) {
    store.removeMenuItem(id);
  } else {
    const recipe = AVAILABLE_RECIPES.find(r => r.id === id);
    if (recipe) {
      const customPrice = priceOverrides.value[id] || recipe.suggestedPrice;
      store.addMenuItem(id, customPrice);
    }
  }
}

function updatePrice(recipeId: RecipeId, price: number) {
  priceOverrides.value[recipeId] = price;
  if (hasMenuItem(recipeId)) {
    store.removeMenuItem(recipeId);
    store.addMenuItem(recipeId, price);
  }
}

function profitMargin(recipe: typeof AVAILABLE_RECIPES[0]): number {
  const price = priceOverrides.value[recipe.id] || recipe.suggestedPrice;
  return ((price - recipe.baseCost) / price) * 100;
}

function qualityStars(level: number): number {
  return Math.round(Math.min(5, Math.max(1, level * 3.5)));
}

function reliabilityStars(score: number): number {
  return Math.round(Math.min(5, Math.max(1, score * 5)));
}

function priceLevelDisplay(priceLevel: number): string {
  if (priceLevel < 0.85) return '$';
  if (priceLevel > 1.15) return '$$$';
  return '$$';
}

function getRecipeCategories(recipe: typeof AVAILABLE_RECIPES[0]): string[] {
  return [...new Set(recipe.ingredients.map(i => i.category).filter(c => c !== 'water'))];
}

const hasAnySupplier = computed(() => store.supplierContracts.length > 0);
const hasAnyMenu = computed(() => store.menuSelections.length >= 3);
const canProceed = computed(() => hasAnySupplier.value && hasAnyMenu.value);

const categoryCoverage = computed(() => {
  const needed = new Set<string>();
  store.menuSelections.forEach(m => {
    const recipe = AVAILABLE_RECIPES.find(r => r.id === m.recipeId);
    if (recipe) {
      getRecipeCategories(recipe).forEach(c => needed.add(c));
    }
  });
  const covered = new Set<string>();
  store.supplierContracts.forEach(c => {
    const supplier = SUPPLIERS.find(s => s.id === c.supplierId);
    supplier?.ingredientCategories?.forEach(cat => covered.add(cat));
  });
  const missing = [...needed].filter(n => !covered.has(n));
  return { needed: [...needed], covered: [...covered], missing };
});

const weeklyIngredientCost = computed(() => {
  return store.menuSelections.reduce((sum, m) => {
    const recipe = AVAILABLE_RECIPES.find(r => r.id === m.recipeId);
    return sum + (recipe?.baseCost || 0) * 20;
  }, 0);
});

const advisorMessage = computed(() => {
  if (!hasAnySupplier.value) return 'You need reliable ingredients to bake consistently. Choose suppliers carefully — cheap isn\'t always better when quality slips mid-season.';
  if (!hasAnyMenu.value) return 'Great suppliers lined up! Now let\'s build your menu. Start with 3-5 items you can execute flawlessly. Add specialties later.';
  if (categoryCoverage.value.missing.length > 0) return `Watch out — your menu requires ${categoryCoverage.value.missing.join(', ')} but you don't have a supplier for those categories yet.`;
  return `Looking good! ${store.menuSelections.length} menu items with solid supplier coverage. Make sure your pricing gives you healthy margins.`;
});
</script>

<template>
  <div class="space-y-5 animate-game-fade-in">
    <!-- Advisor -->
    <div class="flex items-start gap-4">
      <AdvisorAvatar character="chef" :size="64" :mood="canProceed ? 'happy' : 'neutral'" />
      <SpeechBubble :type="categoryCoverage.missing.length > 0 ? 'warning' : 'tip'" position="left">
        <p><strong class="text-[var(--game-gold)]">Chef Margaux DuPont:</strong> {{ advisorMessage }}</p>
      </SpeechBubble>
    </div>

    <!-- Summary Bar -->
    <div class="game-panel p-4 grid grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-lg font-bold text-[var(--game-info)] font-game-mono">{{ store.supplierContracts.length }}</p>
        <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Suppliers</p>
      </div>
      <div>
        <p class="text-lg font-bold text-[#c084fc] font-game-mono">{{ store.menuSelections.length }}</p>
        <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Menu Items</p>
      </div>
      <div>
        <p class="text-lg font-bold text-[var(--game-gold)] font-game-mono">~${{ weeklyIngredientCost.toLocaleString() }}<span class="text-xs">/wk</span></p>
        <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Ingredient Cost</p>
      </div>
    </div>

    <!-- Coverage Warning -->
    <div v-if="categoryCoverage.missing.length > 0 && store.menuSelections.length > 0"
      class="game-panel game-panel--danger p-3 text-sm"
      style="color: var(--game-danger)"
    >
      ⚠️ Missing supplier coverage for: <strong>{{ categoryCoverage.missing.join(', ') }}</strong>
    </div>

    <!-- Tab Toggle -->
    <div class="game-tabs">
      <button
        @click="activeTab = 'suppliers'"
        :class="['game-tab', activeTab === 'suppliers' ? 'game-tab--active' : '']"
      >
        📦 Suppliers ({{ store.supplierContracts.length }})
      </button>
      <button
        @click="activeTab = 'menu'"
        :class="['game-tab', activeTab === 'menu' ? 'game-tab--active' : '']"
      >
        🍰 Menu ({{ store.menuSelections.length }})
      </button>
    </div>

    <!-- Suppliers Tab -->
    <Transition name="fade" mode="out-in">
      <div v-if="activeTab === 'suppliers'" class="space-y-3">
        <div
          v-for="supplier in SUPPLIERS"
          :key="supplier.id"
          class="game-panel overflow-hidden"
          :class="{ 'game-panel--success': hasSupplier(supplier.id) }"
        >
          <div
            class="p-4 flex items-start justify-between cursor-pointer"
            @click="expandedSupplier = expandedSupplier === supplier.id ? null : supplier.id"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ supplier.icon }}</span>
                <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ supplier.name }}</h4>
                <span v-if="hasSupplier(supplier.id)" class="game-badge game-badge--success">CONTRACTED</span>
              </div>
              <p class="text-xs text-[var(--game-text-muted)] mt-1">{{ supplier.description }}</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <span v-for="cat in supplier.ingredientCategories" :key="cat" class="game-badge capitalize">{{ cat }}</span>
              </div>
            </div>
            <span class="text-[var(--game-text-dim)] text-xs ml-2">{{ expandedSupplier === supplier.id ? '▲' : '▼' }}</span>
          </div>

          <Transition name="expand">
            <div v-if="expandedSupplier === supplier.id" class="px-4 pb-4 space-y-3 pt-3" style="border-top: 1px solid var(--game-border-dark)">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div class="p-2 rounded-md text-center" style="background: var(--game-bg-dark)">
                  <p class="text-[var(--game-text-muted)]">Quality</p>
                  <div class="flex justify-center mt-1">
                    <span v-for="i in 5" :key="i" :style="{ color: i <= qualityStars(supplier.qualityLevel) ? 'var(--game-gold)' : 'var(--game-border-dark)' }">★</span>
                  </div>
                </div>
                <div class="p-2 rounded-md text-center" style="background: var(--game-bg-dark)">
                  <p class="text-[var(--game-text-muted)]">Reliability</p>
                  <div class="flex justify-center mt-1">
                    <span v-for="i in 5" :key="i" :style="{ color: i <= reliabilityStars(supplier.reliabilityScore) ? 'var(--game-info)' : 'var(--game-border-dark)' }">★</span>
                  </div>
                </div>
                <div class="p-2 rounded-md text-center" style="background: var(--game-bg-dark)">
                  <p class="text-[var(--game-text-muted)]">Price Level</p>
                  <p class="font-bold mt-1 text-[var(--game-text-primary)]">{{ priceLevelDisplay(supplier.priceLevel) }}</p>
                </div>
                <div class="p-2 rounded-md text-center" style="background: var(--game-bg-dark)">
                  <p class="text-[var(--game-text-muted)]">Min Order</p>
                  <p class="font-bold mt-1 text-[var(--game-text-primary)] font-game-mono">${{ supplier.minimumOrder }}</p>
                </div>
              </div>

              <div class="text-xs space-y-1 text-[var(--game-text-muted)]">
                <p>Delivery: <strong class="text-[var(--game-text-secondary)]">{{ supplier.deliveryDays.join(', ') }}</strong></p>
                <p>Delivery Fee: <strong class="text-[var(--game-text-secondary)]">${{ supplier.deliveryFee }} (free over ${{ supplier.freeDeliveryMinimum }})</strong></p>
                <p>Credit Terms: <strong class="text-[var(--game-text-secondary)] capitalize">{{ supplier.creditTerms }}</strong></p>
              </div>

              <button
                @click.stop="toggleSupplier(supplier.id)"
                :class="['game-btn w-full py-2.5', hasSupplier(supplier.id) ? 'game-btn--danger' : 'game-btn--primary']"
              >
                {{ hasSupplier(supplier.id) ? 'Cancel Contract' : 'Sign Contract' }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Menu Tab -->
      <div v-else class="space-y-4">
        <p class="text-xs text-[var(--game-text-muted)]">Select at least 3 items for your opening menu. Adjust prices to balance accessibility and profit margins.</p>

        <div
          v-for="recipe in AVAILABLE_RECIPES"
          :key="recipe.id"
          class="game-panel p-4 transition-all"
          :class="{ 'game-panel--gold': hasMenuItem(recipe.id) }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ recipe.icon }}</span>
                <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ recipe.name }}</h4>
                <span class="game-badge capitalize">{{ recipe.category }}</span>
              </div>
              <p class="text-xs text-[var(--game-text-muted)] mt-1">{{ recipe.description }}</p>
            </div>
            <button
              @click="toggleMenuItem(recipe.id)"
              class="ml-3 flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center text-lg transition-all"
              :style="{
                background: hasMenuItem(recipe.id) ? 'var(--game-gold)' : 'var(--game-bg-dark)',
                color: hasMenuItem(recipe.id) ? '#1a1610' : 'var(--game-text-dim)',
                border: `1px solid ${hasMenuItem(recipe.id) ? 'var(--game-gold)' : 'var(--game-border-dark)'}`,
              }"
            >
              {{ hasMenuItem(recipe.id) ? '✓' : '+' }}
            </button>
          </div>

          <!-- Stats Grid -->
          <div class="mt-3 grid grid-cols-4 gap-2 text-xs">
            <div class="p-2 rounded-md" style="background: var(--game-bg-dark)">
              <p class="text-[var(--game-text-muted)]">Cost</p>
              <p class="font-bold text-[var(--game-text-primary)] font-game-mono">${{ recipe.baseCost.toFixed(2) }}</p>
            </div>
            <div class="p-2 rounded-md" style="background: var(--game-bg-dark)">
              <p class="text-[var(--game-text-muted)]">Suggested</p>
              <p class="font-bold text-[var(--game-text-primary)] font-game-mono">${{ recipe.suggestedPrice.toFixed(2) }}</p>
            </div>
            <div class="p-2 rounded-md" style="background: var(--game-bg-dark)">
              <p class="text-[var(--game-text-muted)]">Difficulty</p>
              <div class="flex mt-0.5">
                <span v-for="i in 5" :key="i" class="text-xs" :style="{ color: i <= recipe.difficulty ? 'var(--game-gold)' : 'var(--game-border-dark)' }">●</span>
              </div>
            </div>
            <div class="p-2 rounded-md" :style="{
              background: profitMargin(recipe) >= 60 ? 'rgba(52,211,153,0.08)' : profitMargin(recipe) >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(248,113,113,0.08)',
            }">
              <p class="text-[var(--game-text-muted)]">Margin</p>
              <p class="font-bold font-game-mono" :style="{
                color: profitMargin(recipe) >= 60 ? 'var(--game-success)' : profitMargin(recipe) >= 40 ? 'var(--game-gold)' : 'var(--game-danger)',
              }">
                {{ profitMargin(recipe).toFixed(0) }}%
              </p>
            </div>
          </div>

          <!-- Price Slider -->
          <div v-if="hasMenuItem(recipe.id)" class="mt-3 rounded-md p-3" style="background: rgba(245, 158, 11, 0.06); border: 1px solid var(--game-border-dark)">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-[var(--game-text-muted)]">Your Price:</span>
              <span class="font-bold text-[var(--game-gold)] font-game-mono">${{ (priceOverrides[recipe.id] || recipe.suggestedPrice).toFixed(2) }}</span>
            </div>
            <input
              type="range"
              :value="priceOverrides[recipe.id] || recipe.suggestedPrice"
              @input="updatePrice(recipe.id, parseFloat(($event.target as HTMLInputElement).value))"
              :min="recipe.baseCost * 1.1"
              :max="recipe.suggestedPrice * 2"
              :step="0.25"
              class="game-slider w-full"
            />
            <div class="flex justify-between text-[9px] mt-1 text-[var(--game-text-dim)]">
              <span>Low (high volume)</span>
              <span>High (premium)</span>
            </div>
          </div>

          <!-- Required Categories -->
          <div v-if="getRecipeCategories(recipe).length > 0" class="mt-2 flex gap-1.5">
            <span
              v-for="cat in getRecipeCategories(recipe)"
              :key="cat"
              class="game-badge capitalize"
              :class="categoryCoverage.covered.includes(cat) ? 'game-badge--success' : 'game-badge--danger'"
            >
              {{ cat }} {{ categoryCoverage.covered.includes(cat) ? '✓' : '✗' }}
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-4">
      <button @click="store.goToPhase(5)" class="game-btn game-btn--ghost">← Renovation</button>
      <button
        @click="store.completeCurrentPhase()"
        :disabled="!canProceed"
        :class="['game-btn py-3 px-6', canProceed ? 'game-btn--primary' : '']"
      >
        {{ canProceed ? 'Hire Staff →' : `Need supplier + ${Math.max(0, 3 - store.menuSelections.length)} more items` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
