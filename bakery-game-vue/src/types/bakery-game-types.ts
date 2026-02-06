/**
 * Core Type Definitions for Bakery Game
 * Migrated from vanilla JS implementation
 */

// ============ Financial Types ============
export interface DailyStats {
  revenue: number;
  cogs: number;
  grossProfit: number;
  customersServed: number;
  customersMissed: number;
  itemsSold: number;
  laborCost?: number;
  overhead?: number;
}

export interface AllTimeStats {
  totalRevenue: number;
  totalCogs: number;
  totalExpenses: number;
  totalCustomers: number;
  daysOperated: number;
  highestDailyRevenue?: number;
  highestDailyProfit?: number;
}

export interface PricingOverrides {
  [productKey: string]: number;
}

// ============ Inventory Types ============
export interface IngredientBatch {
  quantity: number;
  quality: number; // 0.5-1.5 multiplier
  purchaseDay: number;
  vendor: string;
  unitCost: number;
}

export interface IngredientStock {
  batches: IngredientBatch[];
  totalCost: number;
}

export interface ProductBatch {
  quantity: number;
  quality: number;
  bakeDay: number;
  ingredientQuality: number;
  unitCost: number;
}

export interface ProductStock {
  batches: ProductBatch[];
  soldToday: number;
}

export type IngredientCategory = 'grains' | 'dairy' | 'produce' | 'proteins' | 'sweets';

export interface Ingredient {
  key: string;
  name: string;
  icon: string;
  basePrice: number;
  unit: string;
  category: IngredientCategory;
  shelfLife: number; // days
}

// ============ Production Types ============
export type ProductionStage = 'prep' | 'mixing' | 'proofing' | 'baking' | 'cooling' | 'decorating';

export interface ProductionStageInfo {
  name: ProductionStage;
  duration: number; // minutes
  skillImpact: number; // how much employee skill affects this stage (0-1)
  requiresOven: boolean;
}

export interface ProductionQueueItem {
  id: string;
  recipeKey: string;
  quantity: number;
  currentStage: ProductionStage;
  stageIndex: number;
  stages: ProductionStageInfo[];
  progress: number; // 0-1 for current stage
  totalTime: number;
  ingredientQuality: number;
  prepQuality: number;
  assignedEmployee: string | null;
  employeeSkillImpact: number;
  waitingForOven: boolean;
  hasOvenSlot: boolean;
}

export interface Recipe {
  key: string;
  name: string;
  icon: string;
  ingredients: { [ingredientKey: string]: number };
  bakeTime: number;
  sellPrice: number;
  category: 'bread' | 'pastry' | 'cake' | 'cookie' | 'specialty';
  difficulty: 'easy' | 'medium' | 'hard';
  stages?: ProductionStageInfo[];
}

// ============ Staff Types ============
export type EmployeeRole = 'baker' | 'decorator' | 'cashier' | 'manager';

export interface Employee {
  id: string;
  name: string;
  face: string; // emoji
  role: EmployeeRole;
  skillLevel: number; // 1-10
  efficiency: number; // 0.5-2.0 multiplier
  baseSalary: number;
  benefits: number;
  happiness: number; // 0-100
  fatigue: number; // 0-100
  hoursWorkedToday: number;
  hoursWorkedThisWeek: number;
  daysWorked: number;
  trainingLevel: number; // 0-5
  trainingCost: number;
  hireDate: number; // day number
}

// ============ Customer Types ============
export type CustomerSegment = 'budget' | 'mainstream' | 'premium' | 'foodie';
export type AgeGroup = 'teen' | 'young_adult' | 'adult' | 'senior';
export type Gender = 'male' | 'female' | 'non_binary';

export interface CustomerPersonality {
  patience: number; // 0-1: how long they'll wait
  chattiness: number; // 0-1: dialogue length
  impulsiveness: number; // 0-1: likelihood of impulse buys
  flexibility: number; // 0-1: acceptance of substitutions
  moodiness: number; // 0-1: mood volatility
}

export interface CustomerPreferences {
  sweetness: number; // -1 to 1: savory to sweet
  heartiness: number; // 0-1: light to heavy
  indulgence: number; // 0-1: practical to luxury
  healthConsciousness: number; // 0-1: indulgent to healthy
  adventurousness: number; // 0-1: classic to exotic
}

export interface PurchaseHistoryItem {
  day: number;
  items: string[];
  total: number;
  satisfaction: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ageGroup: AgeGroup;
  gender: Gender;
  segment: CustomerSegment;
  priceElasticity: number;
  qualityWeight: number;
  trendSeeking: number;
  personality: CustomerPersonality;
  preferences: CustomerPreferences;
  willingnessToPay: {
    base: number;
    modifiers: number[];
  };
  currentMood: number; // 0-100
  visits: number;
  firstVisit: number;
  lastVisit: number;
  totalSpent: number;
  purchaseHistory: PurchaseHistoryItem[];
  satisfactionHistory: number[];
  satisfaction: number;
  trustScore: number;
  loyaltyTier: 'new' | 'regular' | 'loyal' | 'vip';
  acquisitionChannel: string;
  returnProbability: number;
  churnRisk: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  returningCustomers: number;
  newCustomersToday: number;
  averageSatisfaction: number;
  averageSpend: number;
  customerLifetimeValue: number;
  churnRate: number;
  npsScore: number;
}

// ============ Economy Types ============
export interface MarketEvent {
  name: string;
  description: string;
  daysRemaining: number;
  effects: {
    inflation?: number;
    supply?: { [category: string]: number };
    demand?: number;
    ingredientPrices?: { [key: string]: number };
  };
}

export interface SupplyLevels {
  grains: number;
  dairy: number;
  produce: number;
}

export interface PriceHistory {
  inflation: number[];
  ingredients: { [ingredientKey: string]: number[] };
}

// ============ Equipment Types ============
export type EquipmentType = 'oven' | 'mixer' | 'display' | 'freezer';
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'broken';

export interface Equipment {
  id: string;
  type: EquipmentType;
  name: string;
  capacity: number;
  efficiency: number; // 0.5-1.5 multiplier
  condition: EquipmentCondition;
  maintenanceCost: number;
  purchasePrice: number;
  purchaseDay: number;
  lastMaintenance: number;
}

// ============ Strategy Types ============
export type BusinessPhilosophy = 'efficiency' | 'quality' | 'growth' | 'sustainability';
export type PricingStyle = 'value' | 'competitive' | 'premium' | 'dynamic';

export interface StrategySettings {
  philosophy: BusinessPhilosophy;
  playbook: string;
  pricingStyle: PricingStyle;
  inventoryBufferDays: number;
  vendorPriority: 'price' | 'quality' | 'reliability';
  marketingFocus: 'organic' | 'paid' | 'balanced';
  cashFloorPercent: number;
  pricingElasticity: number;
}

// ============ Game State Types ============
export type GamePhase = 'menu' | 'setup' | 'buying' | 'baking' | 'selling' | 'summary';

export interface SaveData {
  version: string;
  savedAt: number;
  financial: {
    cash: number;
    day: number;
    hour: number;
    minute: number;
    gameSpeed: number;
    dailyStats: DailyStats;
    allTimeStats: AllTimeStats;
    pricingOverrides: PricingOverrides;
  };
  inventory: {
    ingredients: { [key: string]: IngredientStock };
    products: { [key: string]: ProductStock };
  };
  production: {
    queue: ProductionQueueItem[];
    ovenCapacity: number;
    bakingSpeedMultiplier: number;
  };
  staff: Employee[];
  customers: Customer[];
  economy: {
    inflationRate: number;
    inflationTrend: number;
    inflationIndex: number;
    supplyLevels: SupplyLevels;
    ingredientTrends: { [key: string]: number };
    activeEvents: MarketEvent[];
  };
  equipment: Equipment[];
  strategy: StrategySettings;
  customRecipes: Recipe[];
}
