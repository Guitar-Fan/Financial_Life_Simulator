/**
 * GameConfig.js - Realistic Bakery Financial Parameters
 */

const GAME_CONFIG = {
    STARTING_CASH: 15000,

    TIME: {
        SECONDS_PER_GAME_MINUTE: 0.3,
        OPENING_HOUR: 6,
        CLOSING_HOUR: 18
    },

    // Daily fixed expenses
    DAILY_EXPENSES: {
        rent: { name: 'Daily Rent', amount: 150, icon: '🏠' },
        utilities: { name: 'Utilities', amount: 45, icon: '💡' },
        insurance: { name: 'Insurance', amount: 25, icon: '🛡️' }
    },

    SETUP_OPTIONS: {
        locations: [
            { id: 'downtown', name: 'Downtown', rent: 300, traffic: 1.5, icon: '🏙️', description: 'High rent, high foot traffic.' },
            { id: 'suburbs', name: 'Suburbs', rent: 150, traffic: 1.0, icon: '🏡', description: 'Moderate rent, steady customers.' },
            { id: 'industrial', name: 'Industrial Zone', rent: 80, traffic: 0.6, icon: '🏭', description: 'Low rent, mostly delivery/bulk.' }
        ],
        equipment: [
            { id: 'basic', name: 'Basic Oven', cost: 2000, capacity: 2, icon: '🔥', description: '2 slots, slow heating.' },
            { id: 'pro', name: 'Professional Oven', cost: 5000, capacity: 5, icon: '🌋', description: '5 slots, fast heating.' }
        ],
        staff: [
            { id: 'solo', name: 'Solo Operation', cost: 0, bonus: 0, icon: '👤', description: 'You do everything yourself.' },
            { id: 'assistant', name: 'Hire Assistant', cost: 1000, bonus: 0.2, icon: '👥', description: 'Speeds up baking by 20%.' }
        ],
        paperwork: [
            { id: 'license', name: 'Business License', cost: 500, icon: '📜' },
            { id: 'health', name: 'Health Permit', cost: 300, icon: '🏥' }
        ]
    },

    // Crisis events
    CRISIS_EVENTS: [
        {
            id: 'oven_malfunction',
            title: '🔥 Oven Malfunction!',
            description: 'Your main oven is overheating!',
            urgent: true,
            choices: [
                { text: 'Call repair ($200)', cost: 200, outcome: 'Oven repaired! Production continues.', success: true },
                { text: 'Try to fix yourself', cost: 0, outcome: 'Made it worse... Oven down for 2 hours.', success: false }
            ]
        },
        {
            id: 'health_inspector',
            title: '👨‍⚕️ Health Inspector!',
            description: 'Surprise inspection! Kitchen is being evaluated.',
            urgent: true,
            choices: [
                { text: 'Show them around ($0)', cost: 0, outcome: 'Passed! Good reputation.', success: true, bonus: 50 },
                { text: 'Quick bribe ($300)', cost: 300, outcome: 'Risky but passed...', success: true }
            ]
        },
        {
            id: 'rush_order',
            title: '📞 Big Order Request!',
            description: 'Local business wants 10 pastries NOW!',
            urgent: false,
            choices: [
                { text: 'Accept (+$80 bonus)', cost: 0, outcome: 'Challenge accepted!', success: true, bonus: 80 },
                { text: 'Decline politely', cost: 0, outcome: 'Maybe next time.', success: true }
            ]
        },
        {
            id: 'ingredient_spoiled',
            title: '🦠 Spoiled Ingredients!',
            description: 'Some dairy went bad overnight!',
            urgent: true,
            choices: [
                { text: 'Dispose all dairy ($80)', cost: 80, outcome: 'Safety first!', success: true },
                { text: 'Check each item', cost: 0, outcome: 'Saved some, lost time.', success: true }
            ]
        }
    ],

    // Customer faces
    CUSTOMERS: [
        { face: '👨', name: 'Mike', patience: 'normal' },
        { face: '👩', name: 'Sarah', patience: 'patient' },
        { face: '👴', name: 'Harold', patience: 'patient' },
        { face: '👵', name: 'Betty', patience: 'patient' },
        { face: '🧑', name: 'Alex', patience: 'impatient' },
        { face: '👨‍🦱', name: 'Carlos', patience: 'normal' },
        { face: '👩‍🦰', name: 'Emma', patience: 'normal' },
        { face: '🧔', name: 'James', patience: 'impatient' }
    ],

    CUSTOMER_DIALOGUES: {
        greeting: [
            "Hi! What do you have fresh today?",
            "Good morning! Smells amazing in here!",
            "Hello! I'm looking for something sweet.",
            "Hey there! What's your best seller?",
            "Hi! I heard great things about this place!"
        ],
        ordering: [
            "I'll take a {item} please!",
            "Can I get one {item}?",
            "Ooh, the {item} looks delicious!",
            "I'd love a {item}!",
            "One {item} for me, please!"
        ],
        happy: [
            "This is AMAZING! 🤩",
            "So good! I'll be back!",
            "Best {item} in town!",
            "Wow, perfection! ⭐",
            "You made my day! 😊"
        ],
        sad: [
            "Oh no, you're out of that? 😢",
            "Nothing I want is available...",
            "I'll try somewhere else.",
            "Maybe next time then.",
            "That's disappointing."
        ]
    },

    VENDORS: {
        SYSCO: {
            id: 'sysco',
            name: 'Sysco Wholesale',
            icon: '🏭',
            specialty: 'Bulk Dry Goods',
            rating: 4,
            priceMultiplier: 0.85,
            qualityMultiplier: 0.90,  // Lower starting quality
            categories: ['dry']
        },
        FARMERS: {
            id: 'farmers',
            name: "Farmer's Direct",
            icon: '🚜',
            specialty: 'Fresh Dairy & Eggs',
            rating: 5,
            priceMultiplier: 1.1,
            qualityMultiplier: 1.10,  // Higher starting quality
            categories: ['dairy']
        },
        METRO: {
            id: 'metro',
            name: 'Metro Supply',
            icon: '🏪',
            specialty: 'All-Purpose',
            rating: 3,
            priceMultiplier: 1.0,
            qualityMultiplier: 1.0,
            categories: ['dry', 'dairy']
        }
    },

    // Quality thresholds for pricing and usability
    QUALITY: {
        FRESH: 80,           // 80-100% = Fresh, full price
        GOOD: 60,            // 60-79% = Good, 90% price
        ACCEPTABLE: 40,      // 40-59% = Acceptable, 75% price
        STALE: 20,           // 20-39% = Stale, 50% price, customers may refuse
        SPOILED: 0           // 0-19% = Spoiled, cannot use
    },

    // Prep-ahead options for advanced baking
    PREP_OPTIONS: {
        FRESH: { id: 'fresh', name: 'Bake Fresh', icon: '🔥', qualityBonus: 1.0, timeMultiplier: 1.0 },
        PAR_BAKED: { id: 'parbaked', name: 'Par-Bake', icon: '⏸️', qualityBonus: 0.95, timeMultiplier: 0.6 },
        FROZEN_DOUGH: { id: 'frozen', name: 'Freeze Dough', icon: '❄️', qualityBonus: 0.90, shelfExtension: 7 }
    },

    INGREDIENTS: {
        FLOUR: {
            id: 'flour', name: 'All-Purpose Flour', icon: '🌾', unit: 'lb', basePrice: 0.50, category: 'dry',
            shelfLife: 30, baseQuality: 100, decayRate: 2
        },
        SUGAR: {
            id: 'sugar', name: 'Sugar', icon: '🧂', unit: 'lb', basePrice: 0.55, category: 'dry',
            shelfLife: 60, baseQuality: 100, decayRate: 1
        },
        BUTTER: {
            id: 'butter', name: 'Butter', icon: '🧈', unit: 'lb', basePrice: 3.50, category: 'dairy',
            shelfLife: 14, baseQuality: 100, decayRate: 5
        },
        EGGS: {
            id: 'eggs', name: 'Eggs', icon: '🥚', unit: 'dozen', basePrice: 3.25, category: 'dairy',
            shelfLife: 21, baseQuality: 100, decayRate: 4
        },
        MILK: {
            id: 'milk', name: 'Milk', icon: '🥛', unit: 'gallon', basePrice: 4.50, category: 'dairy',
            shelfLife: 7, baseQuality: 100, decayRate: 10
        },
        YEAST: {
            id: 'yeast', name: 'Yeast', icon: '🫧', unit: 'pack', basePrice: 1.00, category: 'dry',
            shelfLife: 14, baseQuality: 100, decayRate: 5
        },
        CHOCOLATE: {
            id: 'chocolate', name: 'Chocolate', icon: '🍫', unit: 'lb', basePrice: 8.00, category: 'dry',
            shelfLife: 90, baseQuality: 100, decayRate: 1
        },
        VANILLA: {
            id: 'vanilla', name: 'Vanilla', icon: '🌸', unit: 'bottle', basePrice: 5.00, category: 'dry',
            shelfLife: 365, baseQuality: 100, decayRate: 0.5
        }
    },

    RECIPES: {
        BREAD: {
            id: 'bread',
            name: 'Fresh Bread',
            icon: '🍞',
            category: 'bread',
            bakeTime: 3,
            retailPrice: 4.50,
            ingredients: { FLOUR: 2, SUGAR: 0.1, BUTTER: 0.2, YEAST: 0.5, MILK: 0.2 },
            shelfLife: 2,      // Days the product stays fresh
            decayRate: 30      // % quality lost per day
        },
        CROISSANT: {
            id: 'croissant',
            name: 'Croissant',
            icon: '🥐',
            category: 'pastry',
            bakeTime: 4,
            retailPrice: 3.50,
            ingredients: { FLOUR: 0.5, BUTTER: 0.5, EGGS: 0.25, SUGAR: 0.1, YEAST: 0.2 },
            shelfLife: 1,
            decayRate: 40
        },
        COOKIE: {
            id: 'cookie',
            name: 'Chocolate Cookie',
            icon: '🍪',
            category: 'cookie',
            bakeTime: 2,
            retailPrice: 2.00,
            ingredients: { FLOUR: 0.25, SUGAR: 0.15, BUTTER: 0.2, EGGS: 0.1, CHOCOLATE: 0.15 },
            shelfLife: 5,
            decayRate: 15
        },
        MUFFIN: {
            id: 'muffin',
            name: 'Muffin',
            icon: '🧁',
            category: 'pastry',
            bakeTime: 3,
            retailPrice: 2.75,
            ingredients: { FLOUR: 0.3, SUGAR: 0.15, BUTTER: 0.15, EGGS: 0.2, MILK: 0.1 },
            shelfLife: 3,
            decayRate: 25
        },
        CAKE: {
            id: 'cake',
            name: 'Chocolate Cake',
            icon: '🎂',
            category: 'cake',
            bakeTime: 5,
            retailPrice: 25.00,
            ingredients: { FLOUR: 1.5, SUGAR: 1.0, BUTTER: 0.75, EGGS: 1.0, CHOCOLATE: 0.5, MILK: 0.5 },
            shelfLife: 4,
            decayRate: 20
        }
    },

    // ==================== ECONOMIC SIMULATION ====================
    ECONOMY: {
        // --- MACRO ECONOMIC CYCLES ---
        INFLATION: {
            // Base annual inflation rate (applied daily as day/365 portion)
            baseRate: 0.03,  // 3% annual

            // Inflation can swing between these bounds
            minRate: -0.02,   // -2% (deflation)
            maxRate: 0.08,    // 8% (high inflation)

            // How quickly inflation trends change (0-1, lower = slower)
            momentum: 0.1,

            // Chance per day of trend reversal
            reversalChance: 0.05
        },

        // --- SUPPLY & DEMAND DYNAMICS ---
        SUPPLY_DEMAND: {
            // How much scarcity affects prices (multiplier per 10% shortage)
            scarcityImpact: 0.15,

            // How much abundance reduces prices (multiplier per 10% surplus)
            abundanceImpact: 0.08,

            // Market rebalancing speed (0-1)
            equilibriumSpeed: 0.2
        },

        // --- SEASONAL MODIFIERS ---
        SEASONS: {
            SPRING: {
                demandMod: 1.0,
                supplyMod: { grains: 0.9, dairy: 1.1, produce: 0.8 },
                description: 'Fresh produce scarce, dairy abundant'
            },
            SUMMER: {
                demandMod: 0.9,  // People on vacation
                supplyMod: { grains: 1.0, dairy: 1.0, produce: 1.3 },
                description: 'Lower foot traffic, abundant produce'
            },
            FALL: {
                demandMod: 1.15, // Back to school, holidays coming
                supplyMod: { grains: 1.2, dairy: 1.0, produce: 1.0 },
                description: 'Grain harvest, high demand'
            },
            WINTER: {
                demandMod: 1.2,  // Holiday season
                supplyMod: { grains: 1.0, dairy: 0.9, produce: 0.7 },
                description: 'Peak demand, produce expensive'
            }
        },

        // --- DAY OF WEEK PATTERNS ---
        WEEKLY_PATTERNS: {
            // Customer traffic multipliers (0 = Monday)
            traffic: [0.8, 0.9, 1.0, 1.0, 1.15, 1.3, 1.1],

            // Ingredient delivery days affect prices
            deliveryDays: [1, 4], // Tuesday, Friday = fresh stock, slightly lower prices
            deliveryDiscount: 0.05
        },

        // --- VENDOR PRICING ---
        VENDOR_PRICING: {
            // Bulk discount tiers
            BULK_DISCOUNTS: [
                { minQty: 10, discount: 0.05 },  // 5% off 10+ units
                { minQty: 25, discount: 0.10 },  // 10% off 25+ units
                { minQty: 50, discount: 0.15 }   // 15% off 50+ units
            ]
        },

        // --- RANDOM EVENTS AFFECTING ECONOMY ---
        ECONOMIC_EVENTS: [
            {
                id: 'flour_shortage',
                name: '🌾 Wheat Shortage',
                description: 'Poor harvest reported. Flour prices rising.',
                probability: 0.02,
                duration: 5,  // days
                effects: {
                    ingredients: { FLOUR: 1.4 }  // 40% price increase
                }
            },
            {
                id: 'dairy_surplus',
                name: '🥛 Dairy Surplus',
                description: 'Dairy farmers have excess stock!',
                probability: 0.03,
                duration: 4,
                effects: {
                    ingredients: { MILK: 0.7, BUTTER: 0.75, EGGS: 0.8 }
                }
            },
            {
                id: 'sugar_spike',
                name: '🍬 Sugar Prices Surge',
                description: 'Global sugar demand drives prices up.',
                probability: 0.025,
                duration: 6,
                effects: {
                    ingredients: { SUGAR: 1.35, CHOCOLATE: 1.2 }
                }
            },
            {
                id: 'local_festival',
                name: '🎉 Local Festival',
                description: 'Town festival brings crowds!',
                probability: 0.04,
                duration: 2,
                effects: {
                    demand: 1.5,  // 50% more customers
                    willingness: 1.1  // Will pay 10% more
                }
            },
            {
                id: 'competitor_opens',
                name: '🏪 New Competitor',
                description: 'A new bakery opened nearby!',
                probability: 0.02,
                duration: 7,
                effects: {
                    demand: 0.75,  // 25% fewer customers
                    priceElasticity: 1.3  // Customers more price-sensitive
                }
            },
            {
                id: 'energy_costs',
                name: '⚡ Energy Price Spike',
                description: 'Utility costs are up this week.',
                probability: 0.03,
                duration: 5,
                effects: {
                    expenses: { utilities: 1.5 }
                }
            },
            {
                id: 'butter_shortage',
                name: '🧈 Butter Scarcity',
                description: 'Supply chain issues affecting butter!',
                probability: 0.025,
                duration: 4,
                effects: {
                    ingredients: { BUTTER: 1.5 }
                }
            },
            {
                id: 'good_harvest',
                name: '🌾 Excellent Harvest',
                description: 'Great weather led to bumper crops!',
                probability: 0.03,
                duration: 8,
                effects: {
                    ingredients: { FLOUR: 0.8, SUGAR: 0.85 }
                }
            }
        ],

        // --- TREND GENERATION ---
        TRENDS: {
            // Price trend persistence (higher = trends last longer)
            persistence: 0.85,

            // Maximum daily change percentage
            maxDailyChange: 0.05,

            // Bounds on how far prices can deviate from base
            minMultiplier: 0.6,  // Prices can't go below 60% of base
            maxMultiplier: 1.8   // Prices can't go above 180% of base
        },

        // --- RANDOMNESS CONSTRAINTS ---
        RANDOM: {
            // Daily price jitter (±%)
            dailyVariance: 0.03,

            // Smoothing factor for random walks (0-1, higher = smoother)
            smoothing: 0.7
        }
    },

    // --- PRICE ELASTICITY (demand response to price) ---
    PRICE_ELASTICITY: {
        DEFAULT: -1.2,
        CATEGORY_MULTIPLIERS: {
            bread: 0.8,    // Staples less elastic
            pastry: 1.2,   // Discretionary more elastic
            cookie: 1.0,   // Middle ground
            cake: 1.5      // Luxury most elastic
        }
    },

    // --- CUSTOMER SEGMENTS ---
    CUSTOMER_SEGMENTS: {
        BUDGET: {
            name: 'Budget Shopper',
            icon: '💰',
            weight: 0.35,
            priceMultiplier: 0.85,
            qualityTolerance: 0.6,
            description: 'Seeks deals, less picky about quality'
        },
        REGULAR: {
            name: 'Regular Customer',
            icon: '😊',
            weight: 0.45,
            priceMultiplier: 1.0,
            qualityTolerance: 0.8,
            description: 'Balanced price/quality expectations'
        },
        PREMIUM: {
            name: 'Quality Seeker',
            icon: '⭐',
            weight: 0.20,
            priceMultiplier: 1.25,
            qualityTolerance: 1.0,
            description: 'Pays more for high quality'
        }
    },

    DEMAND: {
        hourlyMultiplier: { 6: 0.3, 7: 0.8, 8: 1.5, 9: 1.2, 10: 0.8, 11: 1.0, 12: 1.3, 13: 1.0, 14: 0.7, 15: 0.9, 16: 1.1, 17: 0.8, 18: 0.4 },
        baseCustomersPerHour: 4
    }
};

window.GAME_CONFIG = GAME_CONFIG;
