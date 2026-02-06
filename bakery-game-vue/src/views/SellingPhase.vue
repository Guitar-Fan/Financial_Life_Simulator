<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryCustomerStore, useBakeryInventoryStore, useBakeryFinancialStore, useBakeryGameStore } from '@/stores';
import { BakeryCard, BakeryButton, BakeryBadge, BakeryModal } from '@/components/base';

const customerStore = useBakeryCustomerStore();
const inventoryStore = useBakeryInventoryStore();
const financialStore = useBakeryFinancialStore();
const gameStore = useBakeryGameStore();

// Simulated customer queue
const customerQueue = ref([
  { id: 'c1', name: 'Alice', icon: '👩', patience: 80, wants: 'croissant', quantity: 3 },
  { id: 'c2', name: 'Bob', icon: '👨', patience: 60, wants: 'baguette', quantity: 2 },
  { id: 'c3', name: 'Carol', icon: '👵', patience: 90, wants: 'muffin', quantity: 6 },
]);

const selectedCustomer = ref<any>(null);
const showInteractionModal = ref(false);

const availableProducts = computed(() => {
  const products = new Map();
  inventoryStore.products.forEach((productData, productType) => {
    const total = productData.batches.reduce((sum: number, batch: any) => sum + batch.quantity, 0);
    if (total > 0) {
      products.set(productType, {
        type: productType,
        total,
        avgQuality: productData.batches.reduce((sum: number, b: any) => sum + b.quality * b.quantity, 0) / total,
        avgFreshness: productData.batches.reduce((sum: number, b: any) => sum + (100 - (financialStore.day - b.bakeDay) * 10) * b.quantity, 0) / total,
      });
    }
  });
  return products;
});

const serveCustomer = (customer: any) => {
  selectedCustomer.value = customer;
  showInteractionModal.value = true;
};

const completeTransaction = (accepted: boolean) => {
  if (!selectedCustomer.value) return;

  if (accepted) {
    const customer = selectedCustomer.value;
    const product = customer.wants;
    const quantity = customer.quantity;
    
    // Check if we have the product
    if (availableProducts.value.has(product)) {
      const basePrice = 5.0; // In real app, from pricing store
      const totalPrice = basePrice * quantity;
      
      // Sell products
      inventoryStore.sellProduct(product, quantity);
      
      // Process sale
      financialStore.processSale(totalPrice, basePrice * 0.4, quantity);
      
      // Remove customer from queue
      const index = customerQueue.value.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        customerQueue.value.splice(index, 1);
      }
    }
  } else {
    // Customer leaves unhappy
    const index = customerQueue.value.findIndex(c => c.id === selectedCustomer.value.id);
    if (index !== -1) {
      customerQueue.value.splice(index, 1);
    }
  }

  selectedCustomer.value = null;
  showInteractionModal.value = false;
};

const endDay = () => {
  gameStore.goToPhase('summary');
};

const getProductIcon = (type: string) => {
  const icons: Record<string, string> = {
    croissant: '🥐',
    baguette: '🥖',
    cake: '🍰',
    muffin: '🧁',
  };
  return icons[type] || '🍞';
};
</script>

<template>
  <div class="grid lg:grid-cols-3 gap-6">
    <!-- Customer Queue (Left) -->
    <div class="lg:col-span-2 space-y-6">
      <BakeryCard title="Customer Queue" subtitle="Serve customers to make sales" variant="glass" padding="md">
        <div v-if="customerQueue.length === 0" class="text-center py-12 text-bakery-brown-500">
          <div class="text-6xl mb-4">😴</div>
          <p class="text-lg font-medium">No customers waiting</p>
          <p class="text-sm mt-2">All customers have been served!</p>
        </div>

        <div v-else class="space-y-4">
          <BakeryCard
            v-for="customer in customerQueue"
            :key="customer.id"
            variant="elevated"
            padding="md"
            hoverable
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="text-5xl">{{ customer.icon }}</div>
                <div>
                  <h4 class="text-lg font-bold">{{ customer.name }}</h4>
                  <div class="flex items-center gap-2 mt-1">
                    <BakeryBadge variant="info" size="sm">
                      Wants: {{ getProductIcon(customer.wants) }} {{ customer.wants }} × {{ customer.quantity }}
                    </BakeryBadge>
                  </div>
                  
                  <!-- Patience Bar -->
                  <div class="mt-2">
                    <div class="flex items-center gap-2 text-xs text-bakery-brown-600">
                      <span>Patience:</span>
                      <div class="flex-1 h-2 bg-bakery-brown-200 rounded-full overflow-hidden">
                        <div
                          :class="[
                            'h-full transition-all',
                            customer.patience > 60 ? 'bg-profit' : customer.patience > 30 ? 'bg-warning' : 'bg-loss'
                          ]"
                          :style="{ width: `${customer.patience}%` }"
                        ></div>
                      </div>
                      <span>{{ customer.patience }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <BakeryButton
                variant="success"
                size="md"
                :disabled="!availableProducts.has(customer.wants)"
                @click="serveCustomer(customer)"
              >
                Serve
              </BakeryButton>
            </div>
          </BakeryCard>
        </div>
      </BakeryCard>

      <!-- Today's Sales -->
      <BakeryCard title="Today's Sales" variant="glass" padding="md">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-white rounded-lg">
            <p class="text-2xl font-bold text-profit">
              {{ financialStore.dailyStats.itemsSold }}
            </p>
            <p class="text-xs text-bakery-brown-600">Items Sold</p>
          </div>
          <div class="text-center p-3 bg-white rounded-lg">
            <p class="text-2xl font-bold text-profit">
              ${{ financialStore.dailyStats.revenue.toFixed(0) }}
            </p>
            <p class="text-xs text-bakery-brown-600">Revenue</p>
          </div>
          <div class="text-center p-3 bg-white rounded-lg">
            <p class="text-2xl font-bold text-bakery-brown-900">
              {{ financialStore.dailyStats.customersServed }}
            </p>
            <p class="text-xs text-bakery-brown-600">Transactions</p>
          </div>
          <div class="text-center p-3 bg-white rounded-lg">
            <p class="text-2xl font-bold" :class="financialStore.grossMarginPercent >= 50 ? 'text-profit' : 'text-warning'">
              {{ financialStore.grossMarginPercent.toFixed(0) }}%
            </p>
            <p class="text-xs text-bakery-brown-600">Margin</p>
          </div>
        </div>
      </BakeryCard>
    </div>

    <!-- Display Case (Right) -->
    <div class="space-y-6">
      <BakeryCard title="Display Case" subtitle="Available products" variant="elevated" padding="md">
        <div v-if="availableProducts.size === 0" class="text-center py-8 text-bakery-brown-500">
          <div class="text-5xl mb-3">📦</div>
          <p>No products available</p>
          <p class="text-xs mt-2">Bake some items first!</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="[productType, product] in availableProducts"
            :key="productType"
            class="p-3 bg-white rounded-lg shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div class="text-4xl">{{ getProductIcon(productType) }}</div>
              <div class="flex-1">
                <h5 class="font-bold capitalize">{{ productType }}</h5>
                <div class="flex items-center gap-2 mt-1">
                  <BakeryBadge variant="success" size="sm">
                    {{ product.total }} available
                  </BakeryBadge>
                </div>
                <div class="flex gap-2 mt-2 text-xs">
                  <div class="flex items-center gap-1">
                    <span>⭐</span>
                    <span>{{ (product.avgQuality * 100).toFixed(0) }}%</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span>🌿</span>
                    <span>{{ (product.avgFreshness * 100).toFixed(0) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BakeryCard>

      <!-- Actions -->
      <BakeryCard variant="outlined" padding="md">
        <div class="space-y-2">
          <BakeryButton
            variant="primary"
            size="lg"
            full-width
            @click="endDay"
          >
            End Day →
          </BakeryButton>
          
          <div class="text-center text-xs text-bakery-brown-600 pt-2">
            {{ customerQueue.length }} customers waiting
          </div>
        </div>
      </BakeryCard>
    </div>
  </div>

  <!-- Customer Interaction Modal -->
  <BakeryModal
    v-model:show="showInteractionModal"
    title="Customer Interaction"
    size="md"
  >
    <div v-if="selectedCustomer" class="space-y-6">
      <div class="text-center">
        <div class="text-6xl mb-3">{{ selectedCustomer.icon }}</div>
        <h3 class="text-2xl font-bold mb-2">{{ selectedCustomer.name }}</h3>
        <p class="text-bakery-brown-600">
          "I'd like {{ selectedCustomer.quantity }} {{ selectedCustomer.wants }}, please!"
        </p>
      </div>

      <div class="bg-bakery-brown-50 p-4 rounded-lg">
        <p class="text-sm font-medium mb-2">Order Details:</p>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span>Product:</span>
            <span class="font-medium">{{ getProductIcon(selectedCustomer.wants) }} {{ selectedCustomer.wants }}</span>
          </div>
          <div class="flex justify-between">
            <span>Quantity:</span>
            <span class="font-medium">{{ selectedCustomer.quantity }}</span>
          </div>
          <div class="flex justify-between">
            <span>Price:</span>
            <span class="font-bold text-profit">${(5.0 * selectedCustomer.quantity).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <BakeryButton
          variant="success"
          size="lg"
          full-width
          @click="completeTransaction(true)"
        >
          ✓ Complete Sale
        </BakeryButton>
        <BakeryButton
          variant="danger"
          size="lg"
          full-width
          @click="completeTransaction(false)"
        >
          ✗ Decline
        </BakeryButton>
      </div>
    </div>
  </BakeryModal>
</template>
