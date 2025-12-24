/**
 * GameConfig.js - Realistic Bakery Financial Parameters
 * All values based on real-world small bakery economics (2024-2025)
 */

const GAME_CONFIG = {
    // Starting capital - realistic for a small bakery startup
    STARTING_CASH: 15000,
    
    // Time settings
    TIME: {
        GAME_SPEED: 1,          // 1 = normal, 2 = 2x speed
        SECONDS_PER_GAME_MINUTE: 1,  // 1 real second = 1 game minute
        OPENING_HOUR: 6,        // 6 AM
        CLOSING_HOUR: 18,       // 6 PM
        DAYS_PER_WEEK: 7
    },
    
    // Vendors with different pricing, quality, and delivery terms
    VENDORS: {
        SYSCO: {
            id: 'sysco',
            name: 'Sysco Wholesale',
            icon: '🏭',
            specialty: 'Bulk Dry Goods & Staples',
            rating: 4,
            tags: ['Bulk Discounts', 'Net 30'],
            minimumOrder: 100,
            deliveryDays: 2,
            priceMultiplier: 0.85,  // 15% cheaper than retail
            categories: ['dry', 'packaging']
        },
        FARMERS_DIRECT: {
            id: 'farmers',
            name: "Farmer's Direct",
            icon: '🚜',
            specialty: 'Fresh Dairy & Eggs',
            rating: 5,
            tags: ['Farm Fresh', 'Local'],
            minimumOrder: 25,
            deliveryDays: 1,
            priceMultiplier: 1.1,  // Premium for freshness
            categories: ['dairy']
        },
        METRO_SUPPLY: {
            id: 'metro',
            name: 'Metro Restaurant Supply',
            icon: '🏪',
            specialty: 'All-Purpose Bakery Supplies',
            rating: 3,
            tags: ['No Minimum', 'Same Day'],
            minimumOrder: 0,
            deliveryDays: 0,
            priceMultiplier: 1.0,  // Standard pricing
            categories: ['dry', 'dairy', 'packaging']
        },
        PREMIUM_IMPORTS: {
            id: 'premium',
            name: 'Premium Imports Co.',
            icon: '✨',
            specialty: 'Specialty & Gourmet Ingredients',
            rating: 5,
            tags: ['Premium Quality', 'Imported'],
            minimumOrder: 50,
            deliveryDays: 3,
            priceMultiplier: 1.35,  // Premium pricing
            categories: ['specialty']
        }
    },
    
    // Raw ingredients with realistic wholesale pricing
    INGREDIENTS: {
        // Flour & Grains
        FLOUR_AP: {
            id: 'flour_ap',
            name: 'All-Purpose Flour',
            icon: '🌾',
            unit: 'lb',
            basePrice: 0.48,
            category: 'dry',
            shelfLife: 90,
            description: 'Versatile flour for most baked goods'
        },
        FLOUR_BREAD: {
            id: 'flour_bread',
            name: 'Bread Flour',
            icon: '🍞',
            unit: 'lb',
            basePrice: 0.58,
            category: 'dry',
            shelfLife: 90,
            description: 'High-gluten flour for artisan breads'
        },
        SUGAR_WHITE: {
            id: 'sugar_white',
            name: 'Granulated Sugar',
            icon: '🧂',
            unit: 'lb',
            basePrice: 0.52,
            category: 'dry',
            shelfLife: 365,
            description: 'Standard baking sugar'
        },
        SUGAR_BROWN: {
            id: 'sugar_brown',
            name: 'Brown Sugar',
            icon: '🟤',
            unit: 'lb',
            basePrice: 0.68,
            category: 'dry',
            shelfLife: 180,
            description: 'Adds moisture and caramel flavor'
        },
        
        // Leavening & Baking Essentials
        YEAST: {
            id: 'yeast',
            name: 'Active Dry Yeast',
            icon: '🫧',
            unit: 'lb',
            basePrice: 5.20,
            category: 'dry',
            shelfLife: 120,
            description: 'Essential for bread rising'
        },
        BAKING_POWDER: {
            id: 'baking_powder',
            name: 'Baking Powder',
            icon: '⚪',
            unit: 'lb',
            basePrice: 2.80,
            category: 'dry',
            shelfLife: 365,
            description: 'Chemical leavening agent'
        },
        SALT: {
            id: 'salt',
            name: 'Kosher Salt',
            icon: '🧊',
            unit: 'lb',
            basePrice: 0.35,
            category: 'dry',
            shelfLife: 730,
            description: 'Enhances flavor in all baked goods'
        },
        
        // Dairy
        BUTTER: {
            id: 'butter',
            name: 'Unsalted Butter',
            icon: '🧈',
            unit: 'lb',
            basePrice: 4.25,
            category: 'dairy',
            shelfLife: 14,
            description: 'Premium European-style butter'
        },
        EGGS: {
            id: 'eggs',
            name: 'Large Eggs',
            icon: '🥚',
            unit: 'dozen',
            basePrice: 3.85,
            category: 'dairy',
            shelfLife: 21,
            description: 'Farm fresh large eggs'
        },
        MILK: {
            id: 'milk',
            name: 'Whole Milk',
            icon: '🥛',
            unit: 'gal',
            basePrice: 3.95,
            category: 'dairy',
            shelfLife: 10,
            description: 'Fresh whole milk'
        },
        CREAM: {
            id: 'cream',
            name: 'Heavy Cream',
            icon: '🍦',
            unit: 'qt',
            basePrice: 5.50,
            category: 'dairy',
            shelfLife: 14,
            description: '36% butterfat for whipping'
        },
        
        // Specialty
        CHOCOLATE: {
            id: 'chocolate',
            name: 'Chocolate Chips',
            icon: '🍫',
            unit: 'lb',
            basePrice: 5.25,
            category: 'specialty',
            shelfLife: 365,
            description: 'Semi-sweet chocolate morsels'
        },
        VANILLA: {
            id: 'vanilla',
            name: 'Pure Vanilla Extract',
            icon: '🌸',
            unit: 'oz',
            basePrice: 1.85,
            category: 'specialty',
            shelfLife: 730,
            description: 'Madagascar bourbon vanilla'
        },
        COCOA: {
            id: 'cocoa',
            name: 'Dutch Cocoa Powder',
            icon: '🟫',
            unit: 'lb',
            basePrice: 8.50,
            category: 'specialty',
            shelfLife: 365,
            description: 'Alkalized cocoa for rich flavor'
        },
        
        // Packaging
        BREAD_BAG: {
            id: 'bread_bag',
            name: 'Bread Bags',
            icon: '🛍️',
            unit: 'pack (50)',
            basePrice: 4.50,
            category: 'packaging',
            shelfLife: 730,
            description: 'Clear bags with twist ties'
        },
        PASTRY_BOX: {
            id: 'pastry_box',
            name: 'Pastry Boxes',
            icon: '📦',
            unit: 'pack (25)',
            basePrice: 12.50,
            category: 'packaging',
            shelfLife: 730,
            description: 'White bakery boxes 6x6x3'
        },
        CAKE_BOX: {
            id: 'cake_box',
            name: 'Cake Boxes',
            icon: '🎁',
            unit: 'pack (10)',
            basePrice: 18.00,
            category: 'packaging',
            shelfLife: 730,
            description: 'Large boxes 10x10x5'
        }
    },
    
    // Product recipes with realistic costs and margins
    RECIPES: {
        BASIC_BREAD: {
            id: 'basic_bread',
            name: 'Artisan White Bread',
            icon: '🍞',
            category: 'bread',
            retailPrice: 4.50,
            bakeTime: 45,  // game minutes
            shelfLife: 2,  // days
            ingredients: {
                FLOUR_AP: 1.5,      // lbs
                YEAST: 0.02,        // lbs
                SALT: 0.04,         // lbs
                SUGAR_WHITE: 0.06   // lbs
            },
            packaging: 'BREAD_BAG',
            packagingQty: 0.02,  // 1/50 of a pack
            description: 'Classic crusty loaf with soft interior'
        },
        SOURDOUGH: {
            id: 'sourdough',
            name: 'Sourdough Loaf',
            icon: '🥖',
            category: 'bread',
            retailPrice: 7.00,
            bakeTime: 60,
            shelfLife: 3,
            ingredients: {
                FLOUR_BREAD: 1.8,
                SALT: 0.05
            },
            packaging: 'BREAD_BAG',
            packagingQty: 0.02,
            description: 'Tangy artisan sourdough with crispy crust'
        },
        BAGUETTE: {
            id: 'baguette',
            name: 'French Baguette',
            icon: '🥖',
            category: 'bread',
            retailPrice: 3.25,
            bakeTime: 25,
            shelfLife: 1,
            ingredients: {
                FLOUR_BREAD: 0.75,
                YEAST: 0.015,
                SALT: 0.02
            },
            packaging: 'BREAD_BAG',
            packagingQty: 0.02,
            description: 'Crispy French bread, best eaten same day'
        },
        CROISSANT: {
            id: 'croissant',
            name: 'Butter Croissant',
            icon: '🥐',
            category: 'pastry',
            retailPrice: 3.75,
            bakeTime: 20,
            shelfLife: 2,
            ingredients: {
                FLOUR_AP: 0.5,
                BUTTER: 0.35,
                YEAST: 0.01,
                SUGAR_WHITE: 0.04,
                EGGS: 0.08  // eggs by dozen fraction
            },
            packaging: 'PASTRY_BOX',
            packagingQty: 0.04,  // 1/25 of pack
            description: 'Flaky, buttery French pastry'
        },
        PAIN_AU_CHOCOLAT: {
            id: 'pain_chocolat',
            name: 'Pain au Chocolat',
            icon: '🍫',
            category: 'pastry',
            retailPrice: 4.25,
            bakeTime: 20,
            shelfLife: 2,
            ingredients: {
                FLOUR_AP: 0.5,
                BUTTER: 0.35,
                CHOCOLATE: 0.15,
                YEAST: 0.01,
                SUGAR_WHITE: 0.04,
                EGGS: 0.08
            },
            packaging: 'PASTRY_BOX',
            packagingQty: 0.04,
            description: 'Croissant dough with chocolate batons'
        },
        BLUEBERRY_MUFFIN: {
            id: 'muffin',
            name: 'Blueberry Muffin',
            icon: '🧁',
            category: 'pastry',
            retailPrice: 3.50,
            bakeTime: 22,
            shelfLife: 3,
            ingredients: {
                FLOUR_AP: 0.25,
                SUGAR_WHITE: 0.15,
                BUTTER: 0.12,
                EGGS: 0.16,
                MILK: 0.05,
                BAKING_POWDER: 0.015
            },
            packaging: 'PASTRY_BOX',
            packagingQty: 0.04,
            description: 'Moist muffin packed with blueberries'
        },
        CHOCOLATE_COOKIE: {
            id: 'choc_cookie',
            name: 'Chocolate Chip Cookie',
            icon: '🍪',
            category: 'cookie',
            retailPrice: 2.50,
            bakeTime: 12,
            shelfLife: 5,
            ingredients: {
                FLOUR_AP: 0.12,
                BUTTER: 0.08,
                SUGAR_WHITE: 0.08,
                SUGAR_BROWN: 0.04,
                EGGS: 0.08,
                CHOCOLATE: 0.1,
                VANILLA: 0.1
            },
            packaging: 'PASTRY_BOX',
            packagingQty: 0.04,
            description: 'Classic American cookie, crispy outside'
        },
        SUGAR_COOKIE: {
            id: 'sugar_cookie',
            name: 'Sugar Cookie',
            icon: '🍪',
            category: 'cookie',
            retailPrice: 2.00,
            bakeTime: 10,
            shelfLife: 7,
            ingredients: {
                FLOUR_AP: 0.1,
                BUTTER: 0.06,
                SUGAR_WHITE: 0.08,
                EGGS: 0.06,
                VANILLA: 0.05
            },
            packaging: 'PASTRY_BOX',
            packagingQty: 0.04,
            description: 'Soft vanilla cookie, perfect for decorating'
        },
        CUPCAKE: {
            id: 'cupcake',
            name: 'Vanilla Cupcake',
            icon: '🧁',
            category: 'cake',
            retailPrice: 4.00,
            bakeTime: 18,
            shelfLife: 3,
            ingredients: {
                FLOUR_AP: 0.15,
                SUGAR_WHITE: 0.12,
                BUTTER: 0.1,
                EGGS: 0.16,
                MILK: 0.04,
                BAKING_POWDER: 0.008,
                VANILLA: 0.15,
                CREAM: 0.05  // for frosting
            },
            packaging: 'PASTRY_BOX',
            packagingQty: 0.04,
            description: 'Light cupcake with vanilla buttercream'
        },
        CHOCOLATE_CAKE: {
            id: 'choc_cake',
            name: 'Chocolate Layer Cake',
            icon: '🎂',
            category: 'cake',
            retailPrice: 38.00,
            bakeTime: 55,
            shelfLife: 4,
            ingredients: {
                FLOUR_AP: 1.5,
                SUGAR_WHITE: 1.2,
                COCOA: 0.4,
                BUTTER: 0.6,
                EGGS: 0.5,
                MILK: 0.25,
                BAKING_POWDER: 0.05,
                VANILLA: 0.3,
                CREAM: 0.25
            },
            packaging: 'CAKE_BOX',
            packagingQty: 0.1,  // 1/10 of pack
            description: '8-inch double layer with ganache'
        }
    },
    
    // Customer demand patterns
    DEMAND: {
        // Hourly multipliers (percentage of daily traffic)
        HOURLY: {
            6: 0.12,   // Early birds
            7: 0.15,   // Morning rush
            8: 0.12,
            9: 0.08,
            10: 0.07,
            11: 0.08,
            12: 0.10,  // Lunch
            13: 0.06,
            14: 0.05,
            15: 0.06,
            16: 0.06,
            17: 0.05
        },
        // Day of week multipliers
        DAILY: {
            0: 1.3,   // Sunday - high (brunch)
            1: 0.8,   // Monday - low
            2: 0.9,
            3: 1.0,
            4: 1.0,
            5: 1.2,   // Friday - higher
            6: 1.4    // Saturday - highest
        },
        // Base customers per day
        BASE_CUSTOMERS: 45,
        
        // Customer types and their preferences
        CUSTOMER_TYPES: {
            COMMUTER: {
                icon: '👔',
                name: 'Morning Commuter',
                probability: 0.25,
                preferences: ['bread', 'pastry'],
                avgItems: 1.5,
                priceMultiplier: 1.0
            },
            PARENT: {
                icon: '👨‍👧',
                name: 'Parent',
                probability: 0.2,
                preferences: ['cookie', 'cake', 'pastry'],
                avgItems: 3,
                priceMultiplier: 1.0
            },
            FOODIE: {
                icon: '🧑‍🍳',
                name: 'Food Enthusiast',
                probability: 0.15,
                preferences: ['bread', 'pastry'],
                avgItems: 2,
                priceMultiplier: 1.15  // Willing to pay more
            },
            TEEN: {
                icon: '🧑',
                name: 'Teen Customer',
                probability: 0.15,
                preferences: ['cookie', 'pastry'],
                avgItems: 2,
                priceMultiplier: 0.95
            },
            SENIOR: {
                icon: '👴',
                name: 'Senior',
                probability: 0.15,
                preferences: ['bread', 'cake'],
                avgItems: 1.5,
                priceMultiplier: 1.0
            },
            TOURIST: {
                icon: '📸',
                name: 'Tourist',
                probability: 0.1,
                preferences: ['pastry', 'cake'],
                avgItems: 4,
                priceMultiplier: 1.2
            }
        }
    },
    
    // Monthly fixed costs (realistic for small bakery)
    FIXED_COSTS: {
        RENT: 2800,
        UTILITIES: 450,
        INSURANCE: 280,
        LICENSES: 75,
        MARKETING: 200,
        MAINTENANCE: 150,
        PAYROLL_TAX: 350  // Even if owner-operated
    },
    
    // Financial terms for education
    FINANCIAL_TERMS: {
        COGS: 'Cost of Goods Sold - The direct cost to make your products (ingredients + packaging)',
        GROSS_PROFIT: 'Gross Profit = Revenue - COGS. Money left after product costs.',
        GROSS_MARGIN: 'Gross Margin % = (Gross Profit ÷ Revenue) × 100. Industry standard is 60-70%.',
        NET_PROFIT: 'Net Profit = Gross Profit - Operating Expenses. Your actual earnings.',
        INVENTORY_TURNOVER: 'How many times you sell through inventory per period. Higher = better cash flow.',
        SHRINKAGE: 'Product loss from spoilage, damage, or waste. Target under 3%.',
        BREAK_EVEN: 'The sales amount where Revenue = Total Costs. No profit, no loss.',
        WORKING_CAPITAL: 'Cash available for daily operations. Cash - Immediate Obligations.',
        FOOD_COST_RATIO: 'Ingredient cost ÷ Selling price. Target 25-35% for bakeries.'
    }
};

// Make globally available
window.GAME_CONFIG = GAME_CONFIG;
