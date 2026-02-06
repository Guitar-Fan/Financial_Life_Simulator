/**
 * Save Manager Composable - Handle save/load with IndexedDB via Dexie
 */
import Dexie, { type Table } from 'dexie';
import type { SaveData } from '../types/bakery-game-types';
import { useBakeryGameStore } from '../stores/bakery-game-store';
import { useBakeryFinancialStore } from '../stores/bakery-financial-store';
import { useBakeryInventoryStore } from '../stores/bakery-inventory-store';
import { useBakeryProductionStore } from '../stores/bakery-production-store';
import { useBakeryStaffStore } from '../stores/bakery-staff-store';
import { useBakeryCustomerStore } from '../stores/bakery-customer-store';
import { useBakeryEconomyStore } from '../stores/bakery-economy-store';

interface SaveRecord {
  id?: number;
  name: string;
  timestamp: number;
  data: SaveData;
  version: string;
}

class BakerySaveDatabase extends Dexie {
  saves!: Table<SaveRecord>;

  constructor() {
    super('BakeryGameSaves');
    this.version(1).stores({
      saves: '++id, name, timestamp',
    });
  }
}

const db = new BakerySaveDatabase();

export function useBakerySaveManager() {
  const SAVE_VERSION = '1.0.0';

  function createSaveData(): SaveData {
    const gameStore = useBakeryGameStore();
    const financialStore = useBakeryFinancialStore();
    const inventoryStore = useBakeryInventoryStore();
    const productionStore = useBakeryProductionStore();
    const staffStore = useBakeryStaffStore();
    const customerStore = useBakeryCustomerStore();
    const economyStore = useBakeryEconomyStore();

    return {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      financial: {
        cash: financialStore.cash,
        day: financialStore.day,
        hour: financialStore.hour,
        minute: financialStore.minute,
        gameSpeed: gameStore.gameSpeed,
        dailyStats: { ...financialStore.dailyStats },
        allTimeStats: { ...financialStore.allTimeStats },
        pricingOverrides: { ...financialStore.pricingOverrides },
      },
      inventory: {
        ingredients: Object.fromEntries(inventoryStore.ingredients),
        products: Object.fromEntries(inventoryStore.products),
      },
      production: {
        queue: [...productionStore.queue],
        ovenCapacity: productionStore.ovenCapacity,
        bakingSpeedMultiplier: productionStore.bakingSpeedMultiplier,
      },
      staff: [...staffStore.staff],
      customers: Array.from(customerStore.customers.values()),
      economy: {
        inflationRate: economyStore.inflationRate,
        inflationTrend: economyStore.inflationTrend,
        inflationIndex: economyStore.inflationIndex,
        supplyLevels: { ...economyStore.supplyLevels },
        ingredientTrends: { ...economyStore.ingredientTrends },
        activeEvents: [...economyStore.activeEvents],
      },
      equipment: [], // TODO: Add equipment store
      strategy: {
        philosophy: 'efficiency',
        playbook: 'standard',
        pricingStyle: 'competitive',
        inventoryBufferDays: 2,
        vendorPriority: 'quality',
        marketingFocus: 'balanced',
        cashFloorPercent: 20,
        pricingElasticity: 1.0,
      },
      customRecipes: [],
    };
  }

  async function saveGame(saveName: string = 'Auto Save'): Promise<number> {
    try {
      const saveData = createSaveData();
      const saveRecord: SaveRecord = {
        name: saveName,
        timestamp: Date.now(),
        data: saveData,
        version: SAVE_VERSION,
      };

      const id = await db.saves.add(saveRecord);
      console.log(`Game saved successfully: ${saveName} (ID: ${id})`);
      return id;
    } catch (error) {
      console.error('Failed to save game:', error);
      throw error;
    }
  }

  async function loadGame(saveId: number): Promise<boolean> {
    try {
      const saveRecord = await db.saves.get(saveId);
      if (!saveRecord) {
        throw new Error(`Save ${saveId} not found`);
      }

      const data = saveRecord.data;

      // Restore all stores
      const gameStore = useBakeryGameStore();
      const financialStore = useBakeryFinancialStore();
      const inventoryStore = useBakeryInventoryStore();
      const productionStore = useBakeryProductionStore();
      const staffStore = useBakeryStaffStore();
      const customerStore = useBakeryCustomerStore();
      const economyStore = useBakeryEconomyStore();

      // Financial
      financialStore.cash = data.financial.cash;
      financialStore.day = data.financial.day;
      financialStore.hour = data.financial.hour;
      financialStore.minute = data.financial.minute;
      financialStore.dailyStats = { ...data.financial.dailyStats };
      financialStore.allTimeStats = { ...data.financial.allTimeStats };
      financialStore.pricingOverrides = { ...data.financial.pricingOverrides };

      // Inventory
      inventoryStore.ingredients = new Map(Object.entries(data.inventory.ingredients));
      inventoryStore.products = new Map(Object.entries(data.inventory.products));

      // Production
      productionStore.queue = [...data.production.queue];
      productionStore.ovenCapacity = data.production.ovenCapacity;
      productionStore.bakingSpeedMultiplier = data.production.bakingSpeedMultiplier;

      // Staff
      staffStore.staff = [...data.staff];

      // Customers
      customerStore.customers = new Map(data.customers.map(c => [c.id, c]));
      customerStore.recalculateMetrics();

      // Economy
      economyStore.inflationRate = data.economy.inflationRate;
      economyStore.inflationTrend = data.economy.inflationTrend;
      economyStore.inflationIndex = data.economy.inflationIndex;
      economyStore.supplyLevels = { ...data.economy.supplyLevels };
      economyStore.ingredientTrends = { ...data.economy.ingredientTrends };
      economyStore.activeEvents = [...data.economy.activeEvents];

      console.log(`Game loaded successfully from save ${saveId}`);
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  async function listSaves(): Promise<SaveRecord[]> {
    return db.saves.orderBy('timestamp').reverse().toArray();
  }

  async function deleteSave(saveId: number): Promise<void> {
    await db.saves.delete(saveId);
    console.log(`Save ${saveId} deleted`);
  }

  async function autoSave(): Promise<void> {
    // Check if auto-save exists
    const saves = await db.saves.where('name').equals('Auto Save').toArray();
    
    if (saves.length > 0) {
      // Update existing auto-save
      const saveData = createSaveData();
      await db.saves.update(saves[0].id!, {
        timestamp: Date.now(),
        data: saveData,
      });
    } else {
      // Create new auto-save
      await saveGame('Auto Save');
    }
  }

  async function exportSave(saveId: number): Promise<string> {
    const saveRecord = await db.saves.get(saveId);
    if (!saveRecord) {
      throw new Error(`Save ${saveId} not found`);
    }
    
    return JSON.stringify(saveRecord, null, 2);
  }

  async function importSave(jsonData: string): Promise<number> {
    try {
      const saveRecord: SaveRecord = JSON.parse(jsonData);
      
      // Validate structure
      if (!saveRecord.data || !saveRecord.version) {
        throw new Error('Invalid save data format');
      }
      
      // Reset ID to create new save
      delete saveRecord.id;
      saveRecord.name = `${saveRecord.name} (Imported)`;
      
      return await db.saves.add(saveRecord);
    } catch (error) {
      console.error('Failed to import save:', error);
      throw error;
    }
  }

  return {
    saveGame,
    loadGame,
    listSaves,
    deleteSave,
    autoSave,
    exportSave,
    importSave,
  };
}
