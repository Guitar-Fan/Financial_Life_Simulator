/**
 * Economy Store - Market simulation with inflation, supply/demand, and events
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MarketEvent, SupplyLevels, PriceHistory } from '../types/bakery-game-types';

export const useBakeryEconomyStore = defineStore('bakeryEconomy', () => {
  // ============ State ============
  const inflationRate = ref<number>(0.02); // 2% annual default
  const inflationTrend = ref<number>(0); // Directional change
  const inflationIndex = ref<number>(1.0); // Cumulative multiplier
  
  const supplyLevels = ref<SupplyLevels>({
    grains: 1.0,
    dairy: 1.0,
    produce: 1.0,
  });
  
  const ingredientTrends = ref<{ [key: string]: number }>({});
  const activeEvents = ref<MarketEvent[]>([]);
  
  const priceHistory = ref<PriceHistory>({
    inflation: [],
    ingredients: {},
  });

  // ============ Getters ============
  const currentSeason = computed(() => {
    // Simple season calculation (would use actual date)
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  });

  const marketSummary = computed(() => {
    return {
      inflation: inflationRate.value,
      trend: inflationTrend.value > 0 ? 'rising' : inflationTrend.value < 0 ? 'falling' : 'stable',
      supply: {
        grains: supplyLevels.value.grains > 1.1 ? 'abundant' : supplyLevels.value.grains < 0.9 ? 'scarce' : 'normal',
        dairy: supplyLevels.value.dairy > 1.1 ? 'abundant' : supplyLevels.value.dairy < 0.9 ? 'scarce' : 'normal',
        produce: supplyLevels.value.produce > 1.1 ? 'abundant' : supplyLevels.value.produce < 0.9 ? 'scarce' : 'normal',
      },
      activeEvents: activeEvents.value.length,
    };
  });

  function getIngredientPrice(basePrice: number, ingredientKey: string, category: string): number {
    let price = basePrice;
    
    // Apply inflation
    price *= inflationIndex.value;
    
    // Apply category supply levels
    const categorySupply = supplyLevels.value[category as keyof SupplyLevels] || 1.0;
    price *= (2 - categorySupply); // High supply = lower price
    
    // Apply ingredient-specific trend
    const trend = ingredientTrends.value[ingredientKey] || 1.0;
    price *= trend;
    
    // Apply active event effects
    activeEvents.value.forEach(event => {
      if (event.effects.ingredientPrices && event.effects.ingredientPrices[ingredientKey]) {
        price *= event.effects.ingredientPrices[ingredientKey];
      }
    });
    
    return Math.round(price * 100) / 100;
  }

  function getPriceComparison(basePrice: number, ingredientKey: string, category: string) {
    const currentPrice = getIngredientPrice(basePrice, ingredientKey, category);
    const lastPrice = priceHistory.value.ingredients[ingredientKey]?.slice(-1)[0] || basePrice;
    
    const change = currentPrice - lastPrice;
    const changePercent = (change / lastPrice) * 100;
    
    return {
      current: currentPrice,
      previous: lastPrice,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  }

  // ============ Actions ============
  function simulateDay() {
    // Update inflation with random walk
    inflationTrend.value += (Math.random() - 0.5) * 0.001; // Small random changes
    inflationTrend.value = Math.max(-0.01, Math.min(0.01, inflationTrend.value)); // Bound it
    
    inflationRate.value += inflationTrend.value;
    inflationRate.value = Math.max(-0.05, Math.min(0.15, inflationRate.value)); // -5% to 15%
    
    // Apply daily inflation (divide annual by 365)
    const dailyInflation = 1 + (inflationRate.value / 365);
    inflationIndex.value *= dailyInflation;
    
    // Update supply levels with seasonal patterns and randomness
    Object.keys(supplyLevels.value).forEach(category => {
      const key = category as keyof SupplyLevels;
      let supply = supplyLevels.value[key];
      
      // Random fluctuation
      supply += (Math.random() - 0.5) * 0.1;
      
      // Seasonal effects
      if (currentSeason.value === 'summer' && category === 'produce') {
        supply += 0.05; // More produce in summer
      }
      if (currentSeason.value === 'winter' && category === 'produce') {
        supply -= 0.05; // Less produce in winter
      }
      
      // Bound between 0.5 and 1.5
      supplyLevels.value[key] = Math.max(0.5, Math.min(1.5, supply));
    });
    
    // Update ingredient trends (random walk for each ingredient)
    Object.keys(ingredientTrends.value).forEach(key => {
      let trend = ingredientTrends.value[key];
      trend += (Math.random() - 0.5) * 0.05;
      ingredientTrends.value[key] = Math.max(0.7, Math.min(1.4, trend));
    });
    
    // Update active events
    activeEvents.value = activeEvents.value.filter(event => {
      event.daysRemaining--;
      return event.daysRemaining > 0;
    });
    
    // Record price history
    priceHistory.value.inflation.push(inflationRate.value);
    if (priceHistory.value.inflation.length > 90) {
      priceHistory.value.inflation.shift(); // Keep last 90 days
    }
  }

  function triggerEvent(event: MarketEvent) {
    activeEvents.value.push(event);
    
    // Apply immediate effects
    if (event.effects.inflation) {
      inflationRate.value += event.effects.inflation;
    }
    
    if (event.effects.supply) {
      Object.entries(event.effects.supply).forEach(([category, multiplier]) => {
        const key = category as keyof SupplyLevels;
        if (supplyLevels.value[key] !== undefined) {
          supplyLevels.value[key] *= multiplier;
        }
      });
    }
    
    console.log(`Market Event: ${event.name} - ${event.description}`);
  }

  function updateSupply(category: keyof SupplyLevels, multiplier: number) {
    supplyLevels.value[category] *= multiplier;
    supplyLevels.value[category] = Math.max(0.5, Math.min(1.5, supplyLevels.value[category]));
  }

  function initializeIngredient(key: string, initialTrend: number = 1.0) {
    if (!ingredientTrends.value[key]) {
      ingredientTrends.value[key] = initialTrend;
    }
    if (!priceHistory.value.ingredients[key]) {
      priceHistory.value.ingredients[key] = [];
    }
  }

  function recordIngredientPrice(key: string, price: number) {
    if (!priceHistory.value.ingredients[key]) {
      priceHistory.value.ingredients[key] = [];
    }
    
    priceHistory.value.ingredients[key].push(price);
    
    // Keep last 90 days
    if (priceHistory.value.ingredients[key].length > 90) {
      priceHistory.value.ingredients[key].shift();
    }
  }

  function resetEconomy() {
    inflationRate.value = 0.02;
    inflationTrend.value = 0;
    inflationIndex.value = 1.0;
    supplyLevels.value = {
      grains: 1.0,
      dairy: 1.0,
      produce: 1.0,
    };
    ingredientTrends.value = {};
    activeEvents.value = [];
    priceHistory.value = {
      inflation: [],
      ingredients: {},
    };
  }

  return {
    // State
    inflationRate,
    inflationTrend,
    inflationIndex,
    supplyLevels,
    ingredientTrends,
    activeEvents,
    priceHistory,
    
    // Getters
    currentSeason,
    marketSummary,
    getIngredientPrice,
    getPriceComparison,
    
    // Actions
    simulateDay,
    triggerEvent,
    updateSupply,
    initializeIngredient,
    recordIngredientPrice,
    resetEconomy,
  };
}, {
  persist: {
    key: 'bakery_economy_state',
    storage: localStorage,
  },
});
