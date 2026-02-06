/**
 * Unit Tests for Bakery Financial Store
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBakeryFinancialStore } from '../stores/bakery-financial-store';

describe('Bakery Financial Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with correct default values', () => {
    const store = useBakeryFinancialStore();
    
    expect(store.cash).toBe(50000);
    expect(store.day).toBe(1);
    expect(store.hour).toBe(6);
    expect(store.minute).toBe(0);
    expect(store.markupPercentage).toBe(200);
  });

  it('processes sales correctly', () => {
    const store = useBakeryFinancialStore();
    const initialCash = store.cash;
    
    store.processSale(100, 40, 2);
    
    expect(store.cash).toBe(initialCash + 100);
    expect(store.dailyStats.revenue).toBe(100);
    expect(store.dailyStats.cogs).toBe(40);
    expect(store.dailyStats.grossProfit).toBe(60);
    expect(store.dailyStats.customersServed).toBe(1);
    expect(store.dailyStats.itemsSold).toBe(2);
  });

  it('processes expenses correctly', () => {
    const store = useBakeryFinancialStore();
    const initialCash = store.cash;
    
    store.processExpense(500, 'labor');
    
    expect(store.cash).toBe(initialCash - 500);
    expect(store.dailyStats.laborCost).toBe(500);
    expect(store.allTimeStats.totalExpenses).toBe(500);
  });

  it('advances time correctly', () => {
    const store = useBakeryFinancialStore();
    
    store.advanceTime(30); // 30 minutes
    expect(store.minute).toBe(30);
    
    store.advanceTime(40); // Another 40 minutes
    expect(store.hour).toBe(7);
    expect(store.minute).toBe(10);
  });

  it('handles day overflow correctly', () => {
    const store = useBakeryFinancialStore();
    store.setTime(23, 50);
    
    store.advanceTime(20); // Should roll over to next day
    
    expect(store.day).toBe(2);
    expect(store.hour).toBe(0);
    expect(store.minute).toBe(10);
  });

  it('calculates gross margin correctly', () => {
    const store = useBakeryFinancialStore();
    
    store.processSale(100, 60); // 40% margin
    
    expect(store.grossMarginPercent).toBe(40);
  });

  it('calculates net profit correctly', () => {
    const store = useBakeryFinancialStore();
    
    store.processSale(1000, 400); // $600 gross profit
    store.processExpense(200, 'labor');
    store.processExpense(100, 'overhead');
    
    expect(store.netProfit).toBe(300); // 600 - 200 - 100
  });

  it('ends day and resets stats', () => {
    const store = useBakeryFinancialStore();
    
    store.processSale(500, 200);
    store.processExpense(100, 'labor');
    
    const dayBeforeEnd = store.day;
    store.endDay();
    
    expect(store.day).toBe(dayBeforeEnd + 1);
    expect(store.hour).toBe(6);
    expect(store.minute).toBe(0);
    expect(store.dailyStats.revenue).toBe(0);
    expect(store.allTimeStats.totalRevenue).toBe(500);
  });

  it('tracks all-time high revenue', () => {
    const store = useBakeryFinancialStore();
    
    store.processSale(1000, 400);
    store.endDay();
    
    expect(store.allTimeStats.highestDailyRevenue).toBe(1000);
    
    store.processSale(1500, 600);
    store.endDay();
    
    expect(store.allTimeStats.highestDailyRevenue).toBe(1500);
  });

  it('sets and clears pricing overrides', () => {
    const store = useBakeryFinancialStore();
    
    store.setPricing('croissant', 5.99);
    expect(store.pricingOverrides.croissant).toBe(5.99);
    
    store.clearPricing('croissant');
    expect(store.pricingOverrides.croissant).toBeUndefined();
  });
});
