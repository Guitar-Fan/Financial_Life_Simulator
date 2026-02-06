<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryInventoryStore, useBakeryFinancialStore, useBakeryGameStore } from '@/stores';
import { BakeryCard, BakeryButton, BakeryBadge } from '@/components/base';

const inventoryStore = useBakeryInventoryStore();
const financialStore = useBakeryFinancialStore();
const gameStore = useBakeryGameStore();

// Sample ingredient data (in real app, this would come from a store or config)
const availableIngredients = ref([
  { id: 'flour', name: 'Flour', icon: '🌾', category: 'grain', basePrice: 2.5, unit: 'kg' },
  { id: 'sugar', name: 'Sugar', icon: '🍚', category: 'grain', basePrice: 3.0, unit: 'kg' },
  { id: 'butter', name: 'Butter', icon: '🧈', category: 'dairy', basePrice: 8.0, unit: 'kg' },
  { id: 'milk', name: 'Milk', icon: '🥛', category: 'dairy', basePrice: 4.5, unit: 'L' },
  { id: 'eggs', name: 'Eggs', icon: '🥚', category: 'dairy', basePrice: 6.0, unit: 'dozen' },
  { id: 'chocolate', name: 'Chocolate', icon: '🍫', category: 'specialty', basePrice: 12.0, unit: 'kg' },
  { id: 'vanilla', name: 'Vanilla', icon: '🌿', category: 'specialty', basePrice: 15.0, unit: 'bottle' },
  { id: 'yeast', name: 'Yeast', icon: '🧪', category: 'grain', basePrice: 5.0, unit: 'pkg' },
]);

const selectedCategory = ref<string>('all');
const cart = ref<Map<string, number>>(new Map());

const categories = [
  { id: 'all', name: 'All', icon: '🛒' },
  { id: 'grain', name: 'Grains', icon: '🌾' },
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'specialty', name: 'Specialty', icon: '✨' },
];

const filteredIngredients = computed(() => {
  if (selectedCategory.value === 'all') return availableIngredients.value;
  return availableIngredients.value.filter(i => i.category === selectedCategory.value);
});

const cartTotal = computed(() => {
  let total = 0;
  cart.value.forEach((quantity, ingredientId) => {
    const ingredient = availableIngredients.value.find(i => i.id === ingredientId);
    if (ingredient) {
      total += ingredient.basePrice * quantity;
    }
  });
  return total;
});

const canAfford = computed(() => cartTotal.value <= financialStore.cash);

const addToCart = (ingredientId: string) => {
  const current = cart.value.get(ingredientId) || 0;
  cart.value.set(ingredientId, current + 10);
};

const removeFromCart = (ingredientId: string) => {
  const current = cart.value.get(ingredientId) || 0;
  if (current > 10) {
    cart.value.set(ingredientId, current - 10);
  } else {
    cart.value.delete(ingredientId);
  }
};

const updateCartQuantity = (ingredientId: string, quantity: number) => {
  if (quantity > 0) {
    cart.value.set(ingredientId, quantity);
  } else {
    cart.value.delete(ingredientId);
  }
};

const completePurchase = () => {
  if (!canAfford.value) return;

  cart.value.forEach((quantity, ingredientId) => {
    const ingredient = availableIngredients.value.find(i => i.id === ingredientId);
    if (ingredient) {
      inventoryStore.purchaseIngredient(
        ingredientId,
        quantity,
        1.0, // quality
        'Market Vendor',
        ingredient.basePrice
      );
    }
  });

  cart.value.clear();
  gameStore.goToPhase('baking');
};

const skipPhase = () => {
  gameStore.goToPhase('baking');
};
</script>

<template>
  <div class="grid lg:grid-cols-3 gap-6">
    <!-- Ingredient Marketplace (Left - 2/3) -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Category Filter -->
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            selectedCategory === category.id
              ? 'bg-bakery-gold-500 text-white shadow-gold'
              : 'bg-white hover:bg-bakery-brown-100'
          ]"
          @click="selectedCategory = category.id"
        >
          <span class="mr-2">{{ category.icon }}</span>
          {{ category.name }}
        </button>
      </div>

      <!-- Ingredient Grid -->
      <div class="grid sm:grid-cols-2 gap-4">
        <BakeryCard
          v-for="ingredient in filteredIngredients"
          :key="ingredient.id"
          variant="elevated"
          padding="md"
          hoverable
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-3xl">{{ ingredient.icon }}</span>
                <div>
                  <h4 class="font-bold text-bakery-brown-900">{{ ingredient.name }}</h4>
                  <p class="text-xs text-bakery-brown-600">
                    ${{ ingredient.basePrice.toFixed(2) }}/{{ ingredient.unit }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 mt-3">
                <BakeryButton
                  size="sm"
                  variant="secondary"
                  @click="addToCart(ingredient.id)"
                >
                  Add 10
                </BakeryButton>
                <BakeryBadge
                  v-if="cart.has(ingredient.id)"
                  variant="success"
                  size="md"
                >
                  {{ cart.get(ingredient.id) }} in cart
                </BakeryBadge>
              </div>

              <!-- Current Stock -->
              <div class="mt-2 text-xs text-bakery-brown-500">
                In stock: {{ inventoryStore.getIngredientStock(ingredient.id) }} {{ ingredient.unit }}
              </div>
            </div>
          </div>
        </BakeryCard>
      </div>
    </div>

    <!-- Shopping Cart (Right - 1/3) -->
    <div class="space-y-6">
      <BakeryCard title="Shopping Cart" variant="glass" padding="md">
        <div v-if="cart.size === 0" class="text-center py-8 text-bakery-brown-500">
          <div class="text-5xl mb-3">🛒</div>
          <p>Your cart is empty</p>
          <p class="text-xs mt-2">Add ingredients to get started</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="[ingredientId, quantity] in cart"
            :key="ingredientId"
            class="flex items-center justify-between p-3 bg-white rounded-lg"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-2xl">
                  {{ availableIngredients.find(i => i.id === ingredientId)?.icon }}
                </span>
                <span class="font-medium text-sm">
                  {{ availableIngredients.find(i => i.id === ingredientId)?.name }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  :value="quantity"
                  min="0"
                  step="10"
                  class="w-20 px-2 py-1 border border-bakery-brown-300 rounded text-sm"
                  @input="updateCartQuantity(ingredientId, parseInt(($event.target as HTMLInputElement).value))"
                >
                <button
                  class="text-loss hover:text-red-600 text-sm"
                  @click="removeFromCart(ingredientId)"
                >
                  ❌
                </button>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-profit">
                ${{ ((availableIngredients.find(i => i.id === ingredientId)?.basePrice || 0) * quantity).toFixed(2) }}
              </p>
            </div>
          </div>

          <!-- Cart Summary -->
          <div class="border-t border-bakery-brown-200 pt-3 mt-3">
            <div class="flex justify-between items-center mb-3">
              <span class="font-bold">Total:</span>
              <span class="text-xl font-bold text-bakery-brown-900">
                ${{ cartTotal.toFixed(2) }}
              </span>
            </div>

            <div v-if="!canAfford" class="mb-3">
              <BakeryBadge variant="danger" size="md" full-width>
                ⚠️ Insufficient funds
              </BakeryBadge>
            </div>

            <BakeryButton
              variant="success"
              size="lg"
              full-width
              :disabled="!canAfford || cart.size === 0"
              @click="completePurchase"
            >
              Complete Purchase
            </BakeryButton>
          </div>
        </div>
      </BakeryCard>

      <!-- Quick Actions -->
      <BakeryCard variant="outlined" padding="md">
        <div class="space-y-2">
          <BakeryButton
            variant="ghost"
            size="md"
            full-width
            @click="skipPhase"
          >
            Skip to Baking →
          </BakeryButton>
          <BakeryButton
            variant="ghost"
            size="md"
            full-width
            @click="cart.clear()"
          >
            Clear Cart
          </BakeryButton>
        </div>
      </BakeryCard>
    </div>
  </div>
</template>
