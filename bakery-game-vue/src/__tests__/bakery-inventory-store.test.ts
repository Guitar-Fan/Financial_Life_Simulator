/**
 * Unit Tests for Bakery Inventory Store
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBakeryInventoryStore } from '../stores/bakery-inventory-store';
import { useBakeryFinancialStore } from '../stores/bakery-financial-store';

describe('Bakery Inventory Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('purchases ingredients correctly', () => {
    const inventoryStore = useBakeryInventoryStore();
    const financialStore = useBakeryFinancialStore();
    const initialCash = financialStore.cash;
    
    inventoryStore.purchaseIngredient('flour', 10, 1.0, 'BulkSupplies', 2.50);
    
    expect(inventoryStore.getIngredientStock('flour')).toBe(10);
    expect(financialStore.cash).toBe(initialCash - 25); // 10 * 2.50
  });

  it('tracks ingredient quality correctly', () => {
    const store = useBakeryInventoryStore();
    
    store.purchaseIngredient('flour', 10, 1.2, 'PremiumVendor', 3.00);
    expect(store.getIngredientQuality('flour')).toBe(1.2);
    
    store.purchaseIngredient('flour', 10, 0.8, 'BudgetVendor', 2.00);
    expect(store.getIngredientQuality('flour')).toBe(1.0); // Average of 1.2 and 0.8
  });

  it('consumes ingredients FIFO style', () => {
    const store = useBakeryInventoryStore();
    
    // Buy two batches
    store.purchaseIngredient('flour', 10, 1.0, 'Vendor1', 2.50);
    store.purchaseIngredient('flour', 10, 1.2, 'Vendor2', 3.00);
    
    // Consume 15 units (should take 10 from first batch, 5 from second)
    const quality = store.consumeIngredients({ flour: 15 });
    
    expect(store.getIngredientStock('flour')).toBe(5);
    expect(quality).toBeCloseTo(1.0667, 1); // Weighted average
  });

  it('throws error when insufficient ingredients', () => {
    const store = useBakeryInventoryStore();
    
    store.purchaseIngredient('flour', 5, 1.0, 'Vendor1', 2.50);
    
    expect(() => {
      store.consumeIngredients({ flour: 10 });
    }).toThrow('Insufficient flour');
  });

  it('adds and tracks product batches', () => {
    const store = useBakeryInventoryStore();
    
    store.addProduct('croissant', 20, 1.1, 1.0, 2.50);
    
    expect(store.getProductStock('croissant')).toBe(20);
    expect(store.getProductQuality('croissant')).toBe(1.1);
  });

  it('sells products FIFO style', () => {
    const store = useBakeryInventoryStore();
    
    store.addProduct('croissant', 10, 1.0, 1.0, 2.00);
    store.addProduct('croissant', 10, 1.2, 1.1, 2.50);
    
    const result = store.sellProduct('croissant', 15);
    
    expect(store.getProductStock('croissant')).toBe(5);
    expect(result.cost).toBe(32.50); // (10 * 2.00) + (5 * 2.50)
    expect(result.quality).toBeCloseTo(1.0667, 1);
  });

  it('reduces product quality over time', () => {
    const store = useBakeryInventoryStore();
    const financialStore = useBakeryFinancialStore();
    
    store.addProduct('bread', 10, 1.0, 1.0, 2.00);
    
    financialStore.day = 2; // Next day
    store.updateFreshness(financialStore.day);
    
    const quality = store.getProductQuality('bread');
    expect(quality).toBeLessThan(1.0);
    expect(quality).toBeCloseTo(0.9, 1);
  });

  it('discards spoiled products', () => {
    const store = useBakeryInventoryStore();
    const financialStore = useBakeryFinancialStore();
    
    store.addProduct('bread', 10, 1.0, 1.0, 2.00);
    
    financialStore.day = 5; // 4 days later
    const discarded = store.discardSpoiled(financialStore.day, 3);
    
    expect(discarded.bread).toBe(10);
    expect(store.getProductStock('bread')).toBe(0);
  });

  it('calculates total inventory value', () => {
    const store = useBakeryInventoryStore();
    
    store.purchaseIngredient('flour', 10, 1.0, 'Vendor1', 2.50);
    store.purchaseIngredient('butter', 5, 1.0, 'Vendor2', 4.00);
    
    expect(store.totalIngredientValue).toBe(45); // (10*2.50) + (5*4.00)
  });
});
