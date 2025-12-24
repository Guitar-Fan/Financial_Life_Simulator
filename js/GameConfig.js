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
    
    DEMAND: {
        hourlyMultiplier: { 6: 0.3, 7: 0.8, 8: 1.5, 9: 1.2, 10: 0.8, 11: 1.0, 12: 1.3, 13: 1.0, 14: 0.7, 15: 0.9, 16: 1.1, 17: 0.8, 18: 0.4 },
        baseCustomersPerHour: 4
    }
};

window.GAME_CONFIG = GAME_CONFIG;
