/**
 * Financial Store - Core business financials, pricing, and statistics
 * Migrated from FinancialEngine.js
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DailyStats, AllTimeStats, PricingOverrides } from '../types/bakery-game-types';

export const useBakeryFinancialStore = defineStore('bakeryFinancial', () => {
  // ============ State ============
  const cash = ref<number>(50000); // Starting capital
  const day = ref<number>(1);
  const hour = ref<number>(6); // Open at 6 AM
  const minute = ref<number>(0);
  const markupPercentage = ref<number>(200); // 200% markup default
  const pricingOverrides = ref<PricingOverrides>({});
  
  // Operating costs
  const rentAmount = ref<number>(2500);
  const utilityBase = ref<number>(300);
  const insuranceCost = ref<number>(500);
  const marketingBudget = ref<number>(0);
  
  // Stats
  const dailyStats = ref<DailyStats>({
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    customersServed: 0,
    customersMissed: 0,
    itemsSold: 0,
    laborCost: 0,
    overhead: 0,
  });
  
  const allTimeStats = ref<AllTimeStats>({
    totalRevenue: 0,
    totalCogs: 0,
    totalExpenses: 0,
    totalCustomers: 0,
    daysOperated: 0,
    highestDailyRevenue: 0,
    highestDailyProfit: 0,
  });

  // ============ Getters ============
  const currentTime = computed(() => {
    const h = hour.value.toString().padStart(2, '0');
    const m = minute.value.toString().padStart(2, '0');
    const period = hour.value >= 12 ? 'PM' : 'AM';
    const displayHour = hour.value > 12 ? hour.value - 12 : hour.value === 0 ? 12 : hour.value;
    return `${displayHour}:${m} ${period}`;
  });

  const grossMarginPercent = computed(() => {
    if (dailyStats.value.revenue === 0) return 0;
    return ((dailyStats.value.grossProfit / dailyStats.value.revenue) * 100);
  });

  const netProfit = computed(() => {
    const labor = dailyStats.value.laborCost || 0;
    const overhead = dailyStats.value.overhead || 0;
    return dailyStats.value.grossProfit - labor - overhead;
  });

  const laborCostPercent = computed(() => {
    if (dailyStats.value.revenue === 0) return 0;
    return ((dailyStats.value.laborCost || 0) / dailyStats.value.revenue) * 100;
  });

  const cashRunwayDays = computed(() => {
    const monthlyBurn = 8000; // Estimated monthly operating costs
    return Math.floor(cash.value / (monthlyBurn / 30));
  });

  const isAfterHours = computed(() => {
    return hour.value < 6 || hour.value >= 20; // Closed from 8 PM to 6 AM
  });

  const averageTicket = computed(() => {
    if (dailyStats.value.customersServed === 0) return 0;
    return dailyStats.value.revenue / dailyStats.value.customersServed;
  });

  // ============ Actions ============
  function processSale(amount: number, cost: number, items: number = 1) {
    cash.value += amount;
    dailyStats.value.revenue += amount;
    dailyStats.value.cogs += cost;
    dailyStats.value.grossProfit += (amount - cost);
    dailyStats.value.itemsSold += items;
    dailyStats.value.customersServed += 1;
  }

  function processExpense(amount: number, category: 'labor' | 'overhead' | 'cogs' = 'overhead') {
    cash.value -= amount;
    
    if (category === 'labor') {
      dailyStats.value.laborCost = (dailyStats.value.laborCost || 0) + amount;
    } else if (category === 'overhead') {
      dailyStats.value.overhead = (dailyStats.value.overhead || 0) + amount;
    } else if (category === 'cogs') {
      dailyStats.value.cogs += amount;
    }
    
    allTimeStats.value.totalExpenses += amount;
  }

  function advanceTime(minutes: number) {
    minute.value += minutes;
    
    while (minute.value >= 60) {
      minute.value -= 60;
      hour.value += 1;
    }
    
    while (hour.value >= 24) {
      hour.value -= 24;
      day.value += 1;
    }
  }

  function setTime(h: number, m: number) {
    hour.value = h;
    minute.value = m;
  }

  function endDay() {
    // Pay daily expenses
    const dailyRent = rentAmount.value / 30;
    const dailyUtility = utilityBase.value / 30;
    const dailyInsurance = insuranceCost.value / 30;
    
    processExpense(dailyRent, 'overhead');
    processExpense(dailyUtility, 'overhead');
    processExpense(dailyInsurance, 'overhead');
    
    // Update all-time stats
    allTimeStats.value.totalRevenue += dailyStats.value.revenue;
    allTimeStats.value.totalCogs += dailyStats.value.cogs;
    allTimeStats.value.totalCustomers += dailyStats.value.customersServed;
    allTimeStats.value.daysOperated += 1;
    
    if (dailyStats.value.revenue > (allTimeStats.value.highestDailyRevenue || 0)) {
      allTimeStats.value.highestDailyRevenue = dailyStats.value.revenue;
    }
    
    const todayProfit = netProfit.value;
    if (todayProfit > (allTimeStats.value.highestDailyProfit || 0)) {
      allTimeStats.value.highestDailyProfit = todayProfit;
    }
    
    // Reset daily stats for tomorrow
    dailyStats.value = {
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      customersServed: 0,
      customersMissed: 0,
      itemsSold: 0,
      laborCost: 0,
      overhead: 0,
    };
    
    // Advance to next day at 6 AM
    day.value += 1;
    hour.value = 6;
    minute.value = 0;
  }

  function setPricing(productKey: string, price: number) {
    pricingOverrides.value[productKey] = price;
  }

  function clearPricing(productKey: string) {
    delete pricingOverrides.value[productKey];
  }

  function setMarkup(percent: number) {
    markupPercentage.value = Math.max(100, Math.min(500, percent));
  }

  function adjustCash(amount: number, reason: string = 'adjustment') {
    cash.value += amount;
    console.log(`Cash ${amount >= 0 ? 'added' : 'removed'}: $${Math.abs(amount)} - ${reason}`);
  }

  function resetDailyStats() {
    dailyStats.value = {
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      customersServed: 0,
      customersMissed: 0,
      itemsSold: 0,
      laborCost: 0,
      overhead: 0,
    };
  }

  function resetFinancials() {
    cash.value = 50000;
    day.value = 1;
    hour.value = 6;
    minute.value = 0;
    markupPercentage.value = 200;
    pricingOverrides.value = {};
    rentAmount.value = 2500;
    utilityBase.value = 300;
    insuranceCost.value = 500;
    marketingBudget.value = 0;
    resetDailyStats();
    allTimeStats.value = {
      totalRevenue: 0,
      totalCogs: 0,
      totalExpenses: 0,
      totalCustomers: 0,
      daysOperated: 0,
      highestDailyRevenue: 0,
      highestDailyProfit: 0,
    };
  }

  return {
    // State
    cash,
    day,
    hour,
    minute,
    markupPercentage,
    pricingOverrides,
    rentAmount,
    utilityBase,
    insuranceCost,
    marketingBudget,
    dailyStats,
    allTimeStats,
    
    // Getters
    currentTime,
    grossMarginPercent,
    netProfit,
    laborCostPercent,
    cashRunwayDays,
    isAfterHours,
    averageTicket,
    
    // Actions
    processSale,
    processExpense,
    advanceTime,
    setTime,
    endDay,
    setPricing,
    clearPricing,
    setMarkup,
    adjustCash,
    resetDailyStats,
    resetFinancials,
  };
}, {
  persist: {
    key: 'bakery_financial_state',
    storage: localStorage,
  },
});
