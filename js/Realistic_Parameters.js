/**
 * Realistic_Parameters.js
 * 
 * Centralized configuration database with realistic bakery business parameters.
 * All values based on 2024-2025 industry standards for small independent bakeries.
 * No live data syncing - all parameters are static offline constants.
 */

const REALISTIC_PARAMETERS = {
    
    // ===== STARTING CAPITAL =====
    STARTING_CASH: 50000,
    
    // ===== INGREDIENT COSTS (Per Unit - Wholesale Pricing) =====
    INGREDIENTS: {
        // Dry Goods
        FLOUR_AP: { name: 'All-Purpose Flour', unit: 'lb', cost: 0.45, category: 'dry', shelfLife: 45 },
        FLOUR_BREAD: { name: 'Bread Flour', unit: 'lb', cost: 0.55, category: 'dry', shelfLife: 45 },
        SUGAR: { name: 'Granulated Sugar', unit: 'lb', cost: 0.50, category: 'dry', shelfLife: 90 },
        BROWN_SUGAR: { name: 'Brown Sugar', unit: 'lb', cost: 0.58, category: 'dry', shelfLife: 90 },
        YEAST: { name: 'Active Dry Yeast', unit: 'lb', cost: 4.50, category: 'dry', shelfLife: 180 },
        BAKING_POWDER: { name: 'Baking Powder', unit: 'lb', cost: 2.20, category: 'dry', shelfLife: 365 },
        SALT: { name: 'Salt', unit: 'lb', cost: 0.25, category: 'dry', shelfLife: 365 },
        VANILLA: { name: 'Vanilla Extract', unit: 'oz', cost: 0.75, category: 'dry', shelfLife: 730 },
        
        // Dairy & Eggs
        BUTTER: { name: 'Unsalted Butter', unit: 'lb', cost: 3.50, category: 'dairy', shelfLife: 7 },
        EGGS: { name: 'Eggs', unit: 'each', cost: 0.23, category: 'dairy', shelfLife: 14 },
        MILK: { name: 'Whole Milk', unit: 'gal', cost: 3.20, category: 'dairy', shelfLife: 7 },
        CREAM: { name: 'Heavy Cream', unit: 'qt', cost: 4.50, category: 'dairy', shelfLife: 7 },
        
        // Other Ingredients
        CHOCOLATE_CHIPS: { name: 'Chocolate Chips', unit: 'lb', cost: 4.50, category: 'dry', shelfLife: 180 },
        COCOA: { name: 'Cocoa Powder', unit: 'lb', cost: 6.50, category: 'dry', shelfLife: 365 },
        HONEY: { name: 'Honey', unit: 'lb', cost: 6.00, category: 'dry', shelfLife: 365 },
        
        // Packaging
        BREAD_BAG: { name: 'Bread Bag', unit: 'each', cost: 0.08, category: 'packaging', shelfLife: 730 },
        SMALL_BOX: { name: 'Small Bakery Box', unit: 'each', cost: 0.35, category: 'packaging', shelfLife: 730 },
        MEDIUM_BOX: { name: 'Medium Bakery Box', unit: 'each', cost: 0.55, category: 'packaging', shelfLife: 730 },
        LARGE_BOX: { name: 'Large Bakery Box', unit: 'each', cost: 0.85, category: 'packaging', shelfLife: 730 },
    },
    
    // ===== PRODUCT RECIPES & PRICING =====
    RECIPES: {
        BASIC_BREAD: {
            name: 'Basic White Bread',
            sku: 'BRD001',
            ingredients: {
                FLOUR_AP: 1.2,
                YEAST: 0.02,
                SALT: 0.05,
                SUGAR: 0.08,
                BREAD_BAG: 1
            },
            retailPrice: 3.50,
            productionTime: 0, // Instant production
            shelfLife: 1, // 1 day
            category: 'bread'
        },
        ARTISAN_SOURDOUGH: {
            name: 'Artisan Sourdough',
            sku: 'BRD002',
            ingredients: {
                FLOUR_BREAD: 1.5,
                SALT: 0.06,
                BREAD_BAG: 1
            },
            retailPrice: 6.50,
            productionTime: 0,
            shelfLife: 2,
            category: 'bread'
        },
        BAGUETTE: {
            name: 'French Baguette',
            sku: 'BRD003',
            ingredients: {
                FLOUR_BREAD: 0.8,
                YEAST: 0.015,
                SALT: 0.03,
                BREAD_BAG: 1
            },
            retailPrice: 2.75,
            productionTime: 0,
            shelfLife: 1,
            category: 'bread'
        },
        CROISSANT: {
            name: 'Butter Croissant',
            sku: 'PST001',
            ingredients: {
                FLOUR_AP: 0.6,
                BUTTER: 0.4,
                YEAST: 0.01,
                SUGAR: 0.05,
                EGGS: 0.5,
                SMALL_BOX: 1
            },
            retailPrice: 3.25,
            productionTime: 0,
            shelfLife: 2,
            category: 'pastry'
        },
        CHOCOLATE_CROISSANT: {
            name: 'Pain au Chocolat',
            sku: 'PST002',
            ingredients: {
                FLOUR_AP: 0.6,
                BUTTER: 0.4,
                CHOCOLATE_CHIPS: 0.15,
                YEAST: 0.01,
                SUGAR: 0.05,
                EGGS: 0.5,
                SMALL_BOX: 1
            },
            retailPrice: 3.75,
            productionTime: 0,
            shelfLife: 2,
            category: 'pastry'
        },
        MUFFIN: {
            name: 'Blueberry Muffin',
            sku: 'PST003',
            ingredients: {
                FLOUR_AP: 0.3,
                SUGAR: 0.2,
                BUTTER: 0.15,
                EGGS: 1,
                MILK: 0.08,
                BAKING_POWDER: 0.02,
                SMALL_BOX: 1
            },
            retailPrice: 2.95,
            productionTime: 0,
            shelfLife: 3,
            category: 'pastry'
        },
        CHOCOLATE_CHIP_COOKIE: {
            name: 'Chocolate Chip Cookie',
            sku: 'CKE001',
            ingredients: {
                FLOUR_AP: 0.15,
                BUTTER: 0.1,
                SUGAR: 0.12,
                BROWN_SUGAR: 0.05,
                EGGS: 0.5,
                CHOCOLATE_CHIPS: 0.1,
                SMALL_BOX: 1
            },
            retailPrice: 1.75,
            productionTime: 0,
            shelfLife: 5,
            category: 'cookie'
        },
        SUGAR_COOKIE: {
            name: 'Sugar Cookie',
            sku: 'CKE002',
            ingredients: {
                FLOUR_AP: 0.12,
                BUTTER: 0.08,
                SUGAR: 0.1,
                EGGS: 0.4,
                VANILLA: 0.1,
                SMALL_BOX: 1
            },
            retailPrice: 1.50,
            productionTime: 0,
            shelfLife: 5,
            category: 'cookie'
        },
        LAYER_CAKE: {
            name: '8" Layer Cake',
            sku: 'CKE003',
            ingredients: {
                FLOUR_AP: 2.0,
                SUGAR: 1.5,
                BUTTER: 0.8,
                EGGS: 4,
                MILK: 0.25,
                BAKING_POWDER: 0.08,
                VANILLA: 0.5,
                LARGE_BOX: 1
            },
            retailPrice: 35.00,
            productionTime: 0,
            shelfLife: 3,
            category: 'cake'
        },
        CUPCAKE: {
            name: 'Decorated Cupcake',
            sku: 'CKE004',
            ingredients: {
                FLOUR_AP: 0.2,
                SUGAR: 0.15,
                BUTTER: 0.1,
                EGGS: 0.6,
                MILK: 0.03,
                BAKING_POWDER: 0.01,
                SMALL_BOX: 1
            },
            retailPrice: 3.25,
            productionTime: 0,
            shelfLife: 3,
            category: 'cake'
        }
    },
    
    // ===== SUPPLY CHAIN PARAMETERS =====
    SUPPLY_CHAIN: {
        // Delivery Schedules (days of week: 0=Sunday, 1=Monday, etc.)
        DELIVERY_DAYS: {
            DAIRY: [1, 4], // Monday and Thursday
            DRY_GOODS: [1], // Monday only
            PACKAGING: [1] // Monday only
        },
        
        // Lead Times (in game days)
        LEAD_TIMES: {
            dairy: 2,
            dry: 3,
            packaging: 3
        },
        
        // Minimum Order Quantities
        MOQ: {
            FLOUR_AP: 100,
            FLOUR_BREAD: 100,
            SUGAR: 50,
            BUTTER: 20,
            EGGS: 60, // 5 dozen
            MILK: 5,
            YEAST: 5,
            BREAD_BAG: 100,
            SMALL_BOX: 50,
            MEDIUM_BOX: 50,
            LARGE_BOX: 25
        },
        
        // Bulk Discount Tiers (percentage off)
        BULK_DISCOUNTS: {
            FLOUR_AP: [
                { min: 100, max: 200, discount: 0 },
                { min: 201, max: 500, discount: 0.08 },
                { min: 501, max: Infinity, discount: 0.15 }
            ],
            BUTTER: [
                { min: 20, max: 29, discount: 0 },
                { min: 30, max: Infinity, discount: 0.10 }
            ],
            EGGS: [
                { min: 60, max: 179, discount: 0 },
                { min: 180, max: Infinity, discount: 0.12 }
            ]
        },
        
        // Payment Terms Discounts
        PAYMENT_TERMS: {
            CASH_ON_DELIVERY: 0.02, // 2% discount
            NET_15: 0, // Standard pricing
            NET_30: 0 // Available after 3 months
        }
    },
    
    // ===== MONTHLY FIXED COSTS =====
    FIXED_COSTS: {
        RENT: 3800,
        ELECTRICITY: 750,
        GAS: 475,
        WATER: 150,
        TRASH: 175,
        INSURANCE: 350,
        MAINTENANCE: 400,
        LICENSES: 85,
        POS_SOFTWARE: 120,
        INTERNET: 95,
        CLEANING: 180,
        MARKETING: 300,
        ACCOUNTING: 200,
        
        // Total
        get TOTAL() {
            return this.RENT + this.ELECTRICITY + this.GAS + this.WATER + 
                   this.TRASH + this.INSURANCE + this.MAINTENANCE + this.LICENSES +
                   this.POS_SOFTWARE + this.INTERNET + this.CLEANING + 
                   this.MARKETING + this.ACCOUNTING;
        }
    },
    
    // ===== CUSTOMER DEMAND PATTERNS =====
    DEMAND: {
        // Time of Day Distribution (percentage of daily traffic)
        TIME_OF_DAY: {
            6: 0.15,   // 6-7 AM: 15%
            7: 0.15,   // 7-8 AM: 15%
            8: 0.10,   // 8-9 AM: 10%
            9: 0.08,   // 9-10 AM: 8%
            10: 0.07,  // 10-11 AM: 7%
            11: 0.08,  // 11 AM-12 PM: 8%
            12: 0.07,  // 12-1 PM: 7%
            13: 0.05,  // 1-2 PM: 5%
            14: 0.03,  // 2-3 PM: 3%
            15: 0.04,  // 3-4 PM: 4%
            16: 0.10,  // 4-5 PM: 10%
            17: 0.10,  // 5-6 PM: 10%
            18: 0.03,  // 6-7 PM: 3%
            19: 0.02   // 7-8 PM: 2%
        },
        
        // Day of Week Distribution (percentage of weekly sales)
        DAY_OF_WEEK: {
            0: 0.11,  // Sunday: 11%
            1: 0.10,  // Monday: 10%
            2: 0.12,  // Tuesday: 12%
            3: 0.13,  // Wednesday: 13%
            4: 0.14,  // Thursday: 14%
            5: 0.18,  // Friday: 18%
            6: 0.22   // Saturday: 22%
        },
        
        // Base customers per day (weekday average)
        BASE_CUSTOMERS_PER_DAY: 100,
        
        // Average transaction value
        AVERAGE_TRANSACTION: 18,
        
        // Items per transaction range
        ITEMS_PER_TRANSACTION_MIN: 1,
        ITEMS_PER_TRANSACTION_MAX: 3,
        
        // Product category preferences (probability)
        CATEGORY_PREFERENCES: {
            bread: 0.35,
            pastry: 0.25,
            cookie: 0.20,
            cake: 0.12,
            specialty: 0.08
        }
    },
    
    // ===== SHRINKAGE & WASTE =====
    SHRINKAGE: {
        // Target waste percentages
        EXCELLENT: 0.12,
        AVERAGE: 0.15,
        POOR: 0.22,
        
        // Waste by category (daily unsold)
        CATEGORY_WASTE: {
            bread: 0.10,
            pastry: 0.12,
            cookie: 0.06,
            cake: 0.03
        }
    },
    
    // ===== GAME TIME PARAMETERS =====
    TIME: {
        REAL_SECONDS_PER_GAME_DAY: 90,
        REAL_SECONDS_PER_GAME_HOUR: 3.75,
        
        // Shop hours
        OPENING_HOUR: 6,  // 6 AM
        CLOSING_HOUR: 20, // 8 PM
        
        // Days in a game month
        DAYS_PER_MONTH: 30,
        
        // Win condition
        MONTHS_TO_WIN: 12
    },
    
    // ===== FINANCIAL TARGETS =====
    TARGETS: {
        // Gross margin target
        TARGET_GROSS_MARGIN: 0.78,
        
        // Net profit margin target
        TARGET_NET_MARGIN: 0.10,
        
        // Inventory turnover target
        TARGET_INVENTORY_TURNOVER: 12,
        
        // Win condition net worth
        WIN_NET_WORTH: 20000,
        
        // Bankruptcy threshold
        BANKRUPTCY_NET_WORTH: 5000,
        
        // Cash reserve target
        CASH_RESERVE_TARGET: 15000
    },
    
    // ===== TUTORIAL SETTINGS =====
    TUTORIAL: {
        DURATION_MINUTES: 5,
        SKIP_AVAILABLE: true,
        SHOW_ON_FIRST_LAUNCH: true,
        MENU_ACCESS: true
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = REALISTIC_PARAMETERS;
}
