/**
 * Inventory Store - Ingredients and Products with batch tracking
 * Handles quality, freshness, and spoilage
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { IngredientStock, ProductStock, IngredientBatch, ProductBatch } from '../types/bakery-game-types';
import { useBakeryFinancialStore } from './bakery-financial-store';

export const useBakeryInventoryStore = defineStore('bakeryInventory', () => {
  // ============ State ============
  const ingredients = ref<Map<string, IngredientStock>>(new Map());
  const products = ref<Map<string, ProductStock>>(new Map());

  // ============ Getters ============
  const totalIngredientValue = computed(() => {
    let total = 0;
    ingredients.value.forEach(stock => {
      total += stock.totalCost;
    });
    return total;
  });

  const totalProductValue = computed(() => {
    let total = 0;
    products.value.forEach(stock => {
      stock.batches.forEach(batch => {
        total += batch.quantity * batch.unitCost;
      });
    });
    return total;
  });

  const ingredientsByCategory = computed(() => {
    const categorized: Map<string, string[]> = new Map();
    ingredients.value.forEach((_, key) => {
      // Would need ingredient metadata to properly categorize
      // For now, return all under 'general'
      if (!categorized.has('general')) {
        categorized.set('general', []);
      }
      categorized.get('general')!.push(key);
    });
    return categorized;
  });

  function getIngredientStock(key: string): number {
    const stock = ingredients.value.get(key);
    if (!stock) return 0;
    return stock.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  }

  function getIngredientQuality(key: string): number {
    const stock = ingredients.value.get(key);
    if (!stock || stock.batches.length === 0) return 1;
    
    // Weighted average quality by quantity
    let totalQuality = 0;
    let totalQuantity = 0;
    stock.batches.forEach(batch => {
      totalQuality += batch.quality * batch.quantity;
      totalQuantity += batch.quantity;
    });
    
    return totalQuantity > 0 ? totalQuality / totalQuantity : 1;
  }

  function getProductStock(key: string): number {
    const stock = products.value.get(key);
    if (!stock) return 0;
    return stock.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  }

  function getProductQuality(key: string): number {
    const stock = products.value.get(key);
    if (!stock || stock.batches.length === 0) return 1;
    
    let totalQuality = 0;
    let totalQuantity = 0;
    stock.batches.forEach(batch => {
      totalQuality += batch.quality * batch.quantity;
      totalQuantity += batch.quantity;
    });
    
    return totalQuantity > 0 ? totalQuality / totalQuantity : 1;
  }

  // ============ Actions ============
  function purchaseIngredient(
    key: string,
    quantity: number,
    quality: number,
    vendor: string,
    unitPrice: number
  ) {
    const financialStore = useBakeryFinancialStore();
    const totalCost = quantity * unitPrice;
    
    // Deduct from cash
    financialStore.adjustCash(-totalCost, `Purchase ${key}`);
    
    // Add to inventory
    const batch: IngredientBatch = {
      quantity,
      quality,
      purchaseDay: financialStore.day,
      vendor,
      unitCost: unitPrice,
    };
    
    let stock = ingredients.value.get(key);
    if (!stock) {
      stock = { batches: [], totalCost: 0 };
      ingredients.value.set(key, stock);
    }
    
    stock.batches.push(batch);
    stock.totalCost += totalCost;
  }

  function consumeIngredients(recipe: { [key: string]: number }): number {
    // FIFO consumption - use oldest batches first
    let avgQuality = 0;
    let totalIngredients = 0;
    
    for (const [ingredientKey, amountNeeded] of Object.entries(recipe)) {
      const stock = ingredients.value.get(ingredientKey);
      if (!stock || getIngredientStock(ingredientKey) < amountNeeded) {
        throw new Error(`Insufficient ${ingredientKey}`);
      }
      
      let remaining = amountNeeded;
      let qualitySum = 0;
      
      // Consume from oldest batches
      for (let i = 0; i < stock.batches.length && remaining > 0; i++) {
        const batch = stock.batches[i];
        const takeAmount = Math.min(batch.quantity, remaining);
        
        qualitySum += batch.quality * takeAmount;
        batch.quantity -= takeAmount;
        remaining -= takeAmount;
        
        // Remove empty batches
        if (batch.quantity <= 0) {
          stock.batches.splice(i, 1);
          i--;
        }
      }
      
      avgQuality += qualitySum;
      totalIngredients += amountNeeded;
    }
    
    return totalIngredients > 0 ? avgQuality / totalIngredients : 1;
  }

  function addProduct(
    key: string,
    quantity: number,
    quality: number,
    ingredientQuality: number,
    unitCost: number
  ) {
    const financialStore = useBakeryFinancialStore();
    
    const batch: ProductBatch = {
      quantity,
      quality,
      bakeDay: financialStore.day,
      ingredientQuality,
      unitCost,
    };
    
    let stock = products.value.get(key);
    if (!stock) {
      stock = { batches: [], soldToday: 0 };
      products.value.set(key, stock);
    }
    
    stock.batches.push(batch);
  }

  function sellProduct(key: string, quantity: number): { cost: number; quality: number } {
    const stock = products.value.get(key);
    if (!stock || getProductStock(key) < quantity) {
      throw new Error(`Insufficient ${key} in stock`);
    }
    
    let remaining = quantity;
    let totalCost = 0;
    let totalQuality = 0;
    
    // Sell oldest batches first (FIFO)
    for (let i = 0; i < stock.batches.length && remaining > 0; i++) {
      const batch = stock.batches[i];
      const sellAmount = Math.min(batch.quantity, remaining);
      
      totalCost += sellAmount * batch.unitCost;
      totalQuality += batch.quality * sellAmount;
      batch.quantity -= sellAmount;
      remaining -= sellAmount;
      
      if (batch.quantity <= 0) {
        stock.batches.splice(i, 1);
        i--;
      }
    }
    
    stock.soldToday += quantity;
    
    return {
      cost: totalCost,
      quality: totalQuality / quantity,
    };
  }

  function updateFreshness(currentDay: number) {
    // Reduce quality of products based on age
    products.value.forEach(stock => {
      stock.batches.forEach(batch => {
        const age = currentDay - batch.bakeDay;
        if (age > 0) {
          // Reduce quality by 10% per day
          batch.quality = Math.max(0.3, batch.quality * Math.pow(0.9, age));
        }
      });
    });
  }

  function discardSpoiled(currentDay: number, maxAge: number = 3) {
    const discarded: { [key: string]: number } = {};
    
    products.value.forEach((stock, key) => {
      let discardedQty = 0;
      stock.batches = stock.batches.filter(batch => {
        const age = currentDay - batch.bakeDay;
        if (age > maxAge || batch.quality < 0.4) {
          discardedQty += batch.quantity;
          return false;
        }
        return true;
      });
      
      if (discardedQty > 0) {
        discarded[key] = discardedQty;
      }
    });
    
    return discarded;
  }

  function resetInventory() {
    ingredients.value.clear();
    products.value.clear();
  }

  return {
    // State
    ingredients,
    products,
    
    // Getters
    totalIngredientValue,
    totalProductValue,
    ingredientsByCategory,
    getIngredientStock,
    getIngredientQuality,
    getProductStock,
    getProductQuality,
    
    // Actions
    purchaseIngredient,
    consumeIngredients,
    addProduct,
    sellProduct,
    updateFreshness,
    discardSpoiled,
    resetInventory,
  };
}, {
  persist: {
    key: 'bakery_inventory_state',
    storage: localStorage,
    serializer: {
      serialize: (state) => {
        // Convert Maps to objects for serialization
        return JSON.stringify({
          ingredients: Array.from(state.ingredients.entries()),
          products: Array.from(state.products.entries()),
        });
      },
      deserialize: (value) => {
        const data = JSON.parse(value);
        return {
          ingredients: new Map(data.ingredients),
          products: new Map(data.products),
        };
      },
    },
  },
});
