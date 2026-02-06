<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryProductionStore, useBakeryInventoryStore, useBakeryGameStore } from '@/stores';
import { BakeryCard, BakeryButton, BakeryBadge, BakeryProgressBar } from '@/components/base';
import type { Recipe } from '@/types/bakery-game-types';

const productionStore = useBakeryProductionStore();
const inventoryStore = useBakeryInventoryStore();
const gameStore = useBakeryGameStore();

// Sample recipes (in real app, from config)
const recipes = ref<Recipe[]>([
  {
    key: 'croissant',
    name: 'Croissant',
    icon: '🥐',
    ingredients: { flour: 10, butter: 5, yeast: 1 },
    bakeTime: 50,
    sellPrice: 3.5,
    category: 'pastry',
    difficulty: 'medium',
  },
  {
    key: 'baguette',
    name: 'Baguette',
    icon: '🥖',
    ingredients: { flour: 15, water: 8, yeast: 1 },
    bakeTime: 60,
    sellPrice: 2.5,
    category: 'bread',
    difficulty: 'hard',
  },
  {
    key: 'cake',
    name: 'Cake',
    icon: '🍰',
    ingredients: { flour: 8, sugar: 6, eggs: 4, butter: 4 },
    bakeTime: 100,
    sellPrice: 15.0,
    category: 'cake',
    difficulty: 'hard',
  },
  {
    key: 'muffin',
    name: 'Muffins',
    icon: '🧁',
    ingredients: { flour: 6, sugar: 4, eggs: 2, milk: 3 },
    bakeTime: 41,
    sellPrice: 2.0,
    category: 'pastry',
    difficulty: 'easy',
  },
]);

const selectedRecipe = ref<Recipe | null>(null);
const selectedBatchSize = ref(1);

const productionQueue = computed(() => productionStore.queue);
const ovenCapacity = computed(() => ({
  used: productionStore.itemsInOven,
  available: productionStore.ovenSlotsAvailable,
  total: productionStore.ovenCapacity,
}));

// Helper to get recipe by key
const getRecipe = (key: string) => {
  return recipes.value.find(r => r.key === key) || { key, name: key, icon: '🥐', ingredients: {}, bakeTime: 0, sellPrice: 0, category: 'bread' as const, difficulty: 'easy' as const };
};

const canBake = computed(() => {
  if (!selectedRecipe.value) return false;
  
  // Check ingredients
  const needed = selectedRecipe.value.ingredients;
  for (const [ingredient, amount] of Object.entries(needed)) {
    const available = inventoryStore.getIngredientStock(ingredient);
    if (available < amount * selectedBatchSize.value) {
      return false;
    }
  }
  
  // Check oven capacity
  if (ovenCapacity.value.available < 1) {
    return false;
  }
  
  return true;
});

const startBaking = () => {
  if (!selectedRecipe.value || !canBake.value) return;
  
  productionStore.startBaking(selectedRecipe.value, selectedBatchSize.value);
  selectedRecipe.value = null;
  selectedBatchSize.value = 1;
};

const getStageProgress = (item: any) => {
  const totalTime = item.prepTimeLeft + item.mixingTimeLeft + item.bakingTimeLeft + item.coolingTimeLeft;
  const elapsed = (item.prepTime - item.prepTimeLeft) +
                 (item.mixingTime - item.mixingTimeLeft) +
                 (item.bakingTime - item.bakingTimeLeft) +
                 (item.coolingTime - item.coolingTimeLeft);
  return (elapsed / totalTime) * 100;
};

const getStageLabel = (item: any) => {
  if (item.prepTimeLeft > 0) return `Prep: ${item.prepTimeLeft}m`;
  if (item.mixingTimeLeft > 0) return `Mixing: ${item.mixingTimeLeft}m`;
  if (item.bakingTimeLeft > 0) return `Baking: ${item.bakingTimeLeft}m`;
  if (item.coolingTimeLeft > 0) return `Cooling: ${item.coolingTimeLeft}m`;
  return 'Ready!';
};

const proceedToSelling = () => {
  gameStore.goToPhase('selling');
};
</script>

<template>
  <div class="grid lg:grid-cols-3 gap-6">
    <!-- Recipe Book (Left) -->
    <div class="lg:col-span-2 space-y-6">
      <BakeryCard title="Recipe Book" subtitle="Choose a recipe to start baking" variant="glass" padding="md">
        <div class="grid sm:grid-cols-2 gap-4">
          <BakeryCard
            v-for="recipe in recipes"
            :key="recipe.key"
            :variant="selectedRecipe?.key === recipe.key ? 'elevated' : 'default'"
            padding="md"
            hoverable
            @click="selectedRecipe = recipe"
          >
            <div class="cursor-pointer">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-4xl">{{ recipe.icon }}</span>
                <div>
                  <h4 class="font-bold text-lg">{{ recipe.name }}</h4>
                  <BakeryBadge
                    :variant="recipe.difficulty === 'easy' ? 'success' : recipe.difficulty === 'medium' ? 'warning' : 'danger'"
                    size="sm"
                  >
                    {{ recipe.difficulty }}
                  </BakeryBadge>
                </div>
              </div>

              <div class="space-y-2 text-sm">
                <div>
                  <p class="text-xs text-bakery-brown-600 mb-1">Ingredients:</p>
                  <div class="flex flex-wrap gap-1">
                    <BakeryBadge
                      v-for="(amount, ingredient) in recipe.ingredients"
                      :key="ingredient"
                      variant="neutral"
                      size="sm"
                    >
                      {{ ingredient }}: {{ amount }}
                    </BakeryBadge>
                  </div>
                </div>

                <div class="flex justify-between text-xs text-bakery-brown-600">
                  <span>⏱️ {{ recipe.bakeTime }}m total</span>
                  <span>📦 Yields 1 batch</span>
                </div>
              </div>
            </div>
          </BakeryCard>
        </div>
      </BakeryCard>

      <!-- Production Queue -->
      <BakeryCard title="Production Queue" variant="glass" padding="md">
        <div v-if="productionQueue.length === 0" class="text-center py-8 text-bakery-brown-500">
          <div class="text-5xl mb-3">🥐</div>
          <p>No items in production</p>
          <p class="text-xs mt-2">Select a recipe and start baking!</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in productionQueue"
            :key="item.id"
            class="p-4 bg-white rounded-lg shadow-sm"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ getRecipe(item.recipeKey).icon }}</span>
                <div>
                  <h5 class="font-bold">{{ getRecipe(item.recipeKey).name }}</h5>
                  <p class="text-xs text-bakery-brown-600">Batch: {{ item.quantity }}</p>
                </div>
              </div>
              <BakeryBadge
                :variant="item.currentStage === 'prep' || item.currentStage === 'mixing' ? 'info' : 
                         item.currentStage === 'baking' ? 'warning' : 'success'"
              >
                {{ item.currentStage }}
              </BakeryBadge>
            </div>

            <BakeryProgressBar
              :value="getStageProgress(item)"
              :custom-label="getStageLabel(item)"
              :variant="item.currentStage === 'baking' ? 'warning' : 'default'"
              size="md"
            />
          </div>
        </div>
      </BakeryCard>
    </div>

    <!-- Baking Control Panel (Right) -->
    <div class="space-y-6">
      <!-- Selected Recipe -->
      <BakeryCard v-if="selectedRecipe" title="Baking Setup" variant="elevated" padding="md">
        <div class="text-center mb-4">
          <div class="text-5xl mb-2">{{ selectedRecipe.icon }}</div>
          <h3 class="text-xl font-bold">{{ selectedRecipe.name }}</h3>
        </div>

        <div class="space-y-4">
          <!-- Batch Size -->
          <div>
            <label class="block text-sm font-medium mb-2">Batch Size</label>
            <input
              v-model.number="selectedBatchSize"
              type="number"
              min="1"
              max="10"
              class="w-full px-3 py-2 border border-bakery-brown-300 rounded-lg"
            >
            <p class="text-xs text-bakery-brown-600 mt-1">
              Will produce {{ selectedBatchSize }} batch{{ selectedBatchSize > 1 ? 'es' : '' }}
            </p>
          </div>

          <!-- Ingredient Check -->
          <div>
            <p class="text-sm font-medium mb-2">Ingredients Needed:</p>
            <div class="space-y-1">
              <div
                v-for="(amount, ingredient) in selectedRecipe.ingredients"
                :key="ingredient"
                class="flex justify-between text-sm"
              >
                <span>{{ ingredient }}</span>
                <span
                  :class="inventoryStore.getIngredientStock(ingredient as string) >= amount * selectedBatchSize 
                    ? 'text-profit' : 'text-loss'"
                >
                  {{ inventoryStore.getIngredientStock(ingredient as string) }} / {{ amount * selectedBatchSize }}
                </span>
              </div>
            </div>
          </div>

          <BakeryButton
            variant="success"
            size="lg"
            full-width
            :disabled="!canBake"
            @click="startBaking"
          >
            Start Baking
          </BakeryButton>

          <BakeryButton
            variant="ghost"
            size="md"
            full-width
            @click="selectedRecipe = null"
          >
            Cancel
          </BakeryButton>
        </div>
      </BakeryCard>

      <!-- Oven Status -->
      <BakeryCard title="Oven Status" variant="glass" padding="md">
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Capacity</span>
            <span class="text-lg font-bold">
              {{ ovenCapacity.used }} / {{ ovenCapacity.total }}
            </span>
          </div>

          <BakeryProgressBar
            :value="ovenCapacity.used"
            :max="ovenCapacity.total"
            label-format="fraction"
            :variant="ovenCapacity.available === 0 ? 'danger' : 'warning'"
          />

          <div class="text-xs text-bakery-brown-600 text-center">
            {{ ovenCapacity.available }} slots available
          </div>
        </div>
      </BakeryCard>

      <!-- Actions -->
      <BakeryCard variant="outlined" padding="md">
        <BakeryButton
          variant="primary"
          size="lg"
          full-width
          @click="proceedToSelling"
        >
          Proceed to Selling →
        </BakeryButton>
      </BakeryCard>
    </div>
  </div>
</template>
