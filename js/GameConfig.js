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
        // LOCATIONS - Detailed real estate with multiple parameters
        locations: [
            {
                id: 'downtown_prime',
                name: 'Downtown Prime - Main Street',
                rent: 450,
                traffic: 2.0,
                size: 1200, // sq ft
                parking: 'street',
                visibility: 'excellent',
                competition: 'high',
                demographics: 'affluent',
                walkScore: 95,
                transitAccess: 'excellent',
                zoningFees: 200,
                icon: '🏙️',
                description: 'Prime location with maximum foot traffic. High rent but wealthy clientele. Parking challenges.',
                pros: ['High foot traffic', 'Wealthy customers', 'Great visibility'],
                cons: ['Very expensive', 'High competition', 'Limited parking']
            },
            {
                id: 'downtown_side',
                name: 'Downtown - Side Street',
                rent: 280,
                traffic: 1.4,
                size: 900,
                parking: 'limited',
                visibility: 'good',
                competition: 'medium',
                demographics: 'mixed',
                walkScore: 88,
                transitAccess: 'good',
                zoningFees: 150,
                icon: '🏢',
                description: 'Still downtown but quieter street. Good balance of cost and traffic.',
                pros: ['Good location', 'Reasonable rent', 'Less competition'],
                cons: ['Lower visibility', 'Smaller space']
            },
            {
                id: 'suburbs_plaza',
                name: 'Suburban Shopping Plaza',
                rent: 200,
                traffic: 1.2,
                size: 1500,
                parking: 'ample',
                visibility: 'good',
                competition: 'low',
                demographics: 'families',
                walkScore: 60,
                transitAccess: 'fair',
                zoningFees: 100,
                icon: '🏬',
                description: 'Family-oriented area with good parking. Steady daytime traffic.',
                pros: ['Ample parking', 'Family customers', 'Larger space'],
                cons: ['Car-dependent', 'Lower evening traffic']
            },
            {
                id: 'suburbs_residential',
                name: 'Residential Neighborhood',
                rent: 150,
                traffic: 0.9,
                size: 800,
                parking: 'street',
                visibility: 'fair',
                competition: 'low',
                demographics: 'locals',
                walkScore: 70,
                transitAccess: 'limited',
                zoningFees: 75,
                icon: '🏡',
                description: 'Quiet neighborhood spot. Build loyal local base over time.',
                pros: ['Low rent', 'No competition', 'Community feel'],
                cons: ['Low initial traffic', 'Limited growth']
            },
            {
                id: 'college_campus',
                name: 'Near College Campus',
                rent: 320,
                traffic: 1.8,
                size: 1000,
                parking: 'bike_racks',
                visibility: 'excellent',
                competition: 'medium',
                demographics: 'students',
                walkScore: 92,
                transitAccess: 'excellent',
                zoningFees: 125,
                icon: '🎓',
                description: 'Student-heavy area. High volume but price-sensitive customers.',
                pros: ['High volume', 'Late hours viable', 'Young crowd'],
                cons: ['Price-sensitive', 'Seasonal (summer slow)']
            },
            {
                id: 'industrial_wholesale',
                name: 'Industrial - Wholesale District',
                rent: 120,
                traffic: 0.5,
                size: 2000,
                parking: 'loading_dock',
                visibility: 'poor',
                competition: 'none',
                demographics: 'businesses',
                walkScore: 30,
                transitAccess: 'poor',
                zoningFees: 50,
                icon: '🏭',
                description: 'Large space for wholesale/catering focus. No foot traffic.',
                pros: ['Very low rent', 'Huge space', 'B2B opportunity'],
                cons: ['No walk-ins', 'Requires delivery setup']
            }
        ],

        // EQUIPMENT - Professional bakery equipment tiers
        equipment: {
            ovens: [
                {
                    id: 'home_oven',
                    name: 'Residential Oven (Used)',
                    cost: 800,
                    capacity: 1,
                    speed: 0.7,
                    reliability: 0.6,
                    energyCost: 1.2,
                    warranty: 0,
                    icon: '🔥',
                    description: 'Barely legal for commercial use. Frequent breakdowns.',
                    lifespan: 3 // years
                },
                {
                    id: 'basic_convection',
                    name: 'Basic Convection Oven',
                    cost: 2500,
                    capacity: 2,
                    speed: 1.0,
                    reliability: 0.8,
                    energyCost: 1.0,
                    warranty: 1,
                    icon: '🔥',
                    description: 'Entry-level commercial. Reliable starter oven.',
                    lifespan: 7
                },
                {
                    id: 'pro_deck',
                    name: 'Professional Deck Oven',
                    cost: 6000,
                    capacity: 4,
                    speed: 1.15,
                    reliability: 0.9,
                    energyCost: 0.95,
                    warranty: 3,
                    icon: '🌋',
                    description: 'Serious baker\'s choice. Even heat distribution.',
                    lifespan: 12
                },
                {
                    id: 'commercial_rack',
                    name: 'Commercial Rack Oven',
                    cost: 12000,
                    capacity: 8,
                    speed: 1.3,
                    reliability: 0.95,
                    energyCost: 0.85,
                    warranty: 5,
                    icon: '🏭',
                    description: 'High-volume production. Rotating racks, consistent results.',
                    lifespan: 15
                }
            ],
            mixers: [
                {
                    id: 'hand_tools',
                    name: 'Hand Tools Only',
                    cost: 200,
                    efficiency: 0.5,
                    capacity: 5, // lbs of dough
                    icon: '🥄',
                    description: 'Manual mixing. Exhausting but cheap.'
                },
                {
                    id: 'countertop_mixer',
                    name: 'Countertop Stand Mixer',
                    cost: 800,
                    efficiency: 1.0,
                    capacity: 10,
                    icon: '🔄',
                    description: 'Small batches. Good for artisan approach.'
                },
                {
                    id: 'floor_mixer',
                    name: 'Floor Stand Mixer (20qt)',
                    cost: 3500,
                    efficiency: 1.5,
                    capacity: 30,
                    icon: '⚙️',
                    description: 'Commercial workhorse. Handles large batches.'
                },
                {
                    id: 'spiral_mixer',
                    name: 'Spiral Mixer (60qt)',
                    cost: 8000,
                    efficiency: 2.0,
                    capacity: 80,
                    icon: '🌀',
                    description: 'Professional grade. Perfect for artisan bread.'
                }
            ],
            displays: [
                {
                    id: 'folding_table',
                    name: 'Folding Table',
                    cost: 50,
                    appeal: 0.7,
                    capacity: 20,
                    icon: '📋',
                    description: 'Barely presentable. Customers notice.'
                },
                {
                    id: 'basic_case',
                    name: 'Basic Display Case',
                    cost: 1200,
                    appeal: 1.0,
                    capacity: 40,
                    icon: '🪟',
                    description: 'Clean glass case. Professional appearance.'
                },
                {
                    id: 'refrigerated_case',
                    name: 'Refrigerated Display',
                    cost: 3500,
                    appeal: 1.3,
                    capacity: 60,
                    shelfLifeBonus: 2, // extra days
                    icon: '❄️',
                    description: 'Keeps products fresh longer. Attractive lighting.'
                },
                {
                    id: 'european_case',
                    name: 'European-Style Display',
                    cost: 6500,
                    appeal: 1.6,
                    capacity: 80,
                    shelfLifeBonus: 3,
                    icon: '✨',
                    description: 'Stunning presentation. Customers pay premium.'
                }
            ]
        },

        // STAFF - Detailed employee profiles
        staff: [
            {
                id: 'solo',
                name: 'Solo Operation',
                monthlyCost: 0,
                efficiency: 1.0,
                skillLevel: 'owner',
                hours: 'unlimited',
                benefits: 0,
                icon: '👤',
                description: 'You do everything. Maximum control, maximum burnout risk.',
                pros: ['No payroll', 'Full control'],
                cons: ['Limited hours', 'Burnout risk', 'Can\'t scale']
            },
            {
                id: 'part_time',
                name: 'Part-Time Helper',
                monthlyCost: 1200,
                efficiency: 0.6,
                skillLevel: 'entry',
                hours: '20/week',
                benefits: 0,
                icon: '👨‍🍳',
                description: 'High school student. Unreliable but affordable.',
                pros: ['Cheap labor', 'Flexible'],
                cons: ['High turnover', 'Training needed', 'Limited availability']
            },
            {
                id: 'assistant_baker',
                name: 'Assistant Baker',
                monthlyCost: 2400,
                efficiency: 1.2,
                skillLevel: 'intermediate',
                hours: 'full-time',
                benefits: 300,
                icon: '👨‍🍳',
                description: 'Culinary school grad. Eager to learn, solid skills.',
                pros: ['Full-time coverage', 'Growing skills', 'Reliable'],
                cons: ['Moderate cost', 'Needs supervision']
            },
            {
                id: 'head_baker',
                name: 'Experienced Head Baker',
                monthlyCost: 4000,
                efficiency: 1.8,
                skillLevel: 'expert',
                hours: 'full-time',
                benefits: 600,
                icon: '👨‍🍳',
                description: '10+ years experience. Can run operations independently.',
                pros: ['Expert skills', 'Independent', 'Can train others'],
                cons: ['Expensive', 'May demand equity']
            },
            {
                id: 'small_team',
                name: 'Small Team (3 people)',
                monthlyCost: 6500,
                efficiency: 2.5,
                skillLevel: 'mixed',
                hours: 'full coverage',
                benefits: 900,
                icon: '👥',
                description: 'Baker + 2 assistants. Can handle growth.',
                pros: ['Shift coverage', 'Redundancy', 'Growth ready'],
                cons: ['High payroll', 'Management overhead']
            }
        ],

        // PERMITS & LICENSES - Comprehensive regulatory compliance
        paperwork: [
            // Required permits
            {
                id: 'business_license',
                name: 'Business License',
                cost: 500,
                annual: 200,
                required: true,
                processingTime: 2, // days
                icon: '📜',
                description: 'Basic business registration with the city.'
            },
            {
                id: 'health_permit',
                name: 'Health Department Permit',
                cost: 400,
                annual: 300,
                required: true,
                processingTime: 5,
                inspectionRequired: true,
                icon: '🏥',
                description: 'Mandatory health inspection and certification.'
            },
            {
                id: 'food_handlers',
                name: 'Food Handler Certifications',
                cost: 150,
                annual: 0,
                required: true,
                processingTime: 1,
                icon: '👨‍🍳',
                description: 'Required certification for all staff.'
            },
            // Optional but beneficial
            {
                id: 'liquor_license',
                name: 'Liquor License (Beer/Wine)',
                cost: 2000,
                annual: 500,
                required: false,
                processingTime: 30,
                revenueBonus: 1.15,
                icon: '🍷',
                description: 'Serve beer and wine. Increases revenue 15%.'
            },
            {
                id: 'sidewalk_permit',
                name: 'Sidewalk Café Permit',
                cost: 300,
                annual: 150,
                required: false,
                processingTime: 7,
                trafficBonus: 1.1,
                icon: '☕',
                description: 'Outdoor seating. Attracts 10% more customers.'
            },
            {
                id: 'catering_license',
                name: 'Catering License',
                cost: 600,
                annual: 200,
                required: false,
                processingTime: 10,
                icon: '🎉',
                description: 'Unlock catering/events revenue stream.'
            },
            {
                id: 'organic_cert',
                name: 'Organic Certification',
                cost: 1500,
                annual: 400,
                required: false,
                processingTime: 45,
                priceMultiplier: 1.25,
                icon: '🌱',
                description: 'Charge premium prices. Appeals to health-conscious.'
            }
        ],

        // INSURANCE - Risk management options
        insurance: [
            {
                id: 'basic_liability',
                name: 'Basic Liability',
                monthlyCost: 150,
                coverage: 500000,
                covers: ['slip_fall', 'property_damage'],
                icon: '🛡️',
                description: 'Minimum required coverage. $500k limit.'
            },
            {
                id: 'standard_package',
                name: 'Standard Business Package',
                monthlyCost: 280,
                coverage: 1000000,
                covers: ['liability', 'property', 'equipment', 'business_interruption'],
                icon: '🛡️',
                description: 'Comprehensive protection. $1M coverage.'
            },
            {
                id: 'premium_coverage',
                name: 'Premium Coverage',
                monthlyCost: 450,
                coverage: 2000000,
                covers: ['liability', 'property', 'equipment', 'business_interruption', 'cyber', 'employment'],
                icon: '🛡️',
                description: 'Full protection. $2M coverage plus cyber and employment.'
            }
        ],

        // FINANCING - Capital sources
        financing: [
            {
                id: 'personal_savings',
                name: 'Personal Savings Only',
                amount: 0,
                interestRate: 0,
                term: 0,
                description: 'Bootstrap with your own money. No debt.'
            },
            {
                id: 'sba_loan',
                name: 'SBA Small Business Loan',
                amount: 25000,
                interestRate: 0.065, // 6.5%
                term: 60, // months
                monthlyPayment: 488,
                description: 'Government-backed. Low rate, long term.'
            },
            {
                id: 'bank_loan',
                name: 'Bank Business Loan',
                amount: 20000,
                interestRate: 0.085, // 8.5%
                term: 36,
                monthlyPayment: 631,
                description: 'Traditional bank loan. Moderate rate.'
            },
            {
                id: 'credit_card',
                name: 'Business Credit Card',
                amount: 10000,
                interestRate: 0.18, // 18%
                term: 24,
                monthlyPayment: 499,
                description: 'Quick access. Very high interest rate.'
            },
            {
                id: 'family_loan',
                name: 'Family & Friends',
                amount: 15000,
                interestRate: 0.03, // 3%
                term: 48,
                monthlyPayment: 332,
                description: 'Low interest but personal risk.'
            }
        ],

        // UTILITIES & SERVICES
        utilities: [
            {
                id: 'basic_power',
                name: 'Standard Electric Service',
                monthlyCost: 200,
                reliability: 0.95,
                description: 'Basic grid power. Occasional outages.'
            },
            {
                id: 'commercial_power',
                name: 'Commercial Electric + Backup',
                monthlyCost: 350,
                reliability: 0.99,
                description: 'Priority service with backup generator.'
            },
            {
                id: 'basic_internet',
                name: 'Basic Internet',
                monthlyCost: 60,
                features: ['email', 'pos'],
                description: 'Enough for POS and email.'
            },
            {
                id: 'business_internet',
                name: 'Business Fiber',
                monthlyCost: 120,
                features: ['email', 'pos', 'online_orders', 'cloud'],
                description: 'Fast, reliable. Enables online ordering.'
            }
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
            bakeTime: 0.1, // ~6 seconds in real time (was 3 minutes)
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
            bakeTime: 0.1, // ~6 seconds
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
            bakeTime: 0.05, // ~3 seconds
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
            bakeTime: 0.1, // ~6 seconds
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
            bakeTime: 0.15, // ~9 seconds (bigger item)
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
    },

    STRATEGY: {
        PHILOSOPHIES: {
            craftsmanship: {
                id: 'craftsmanship',
                name: 'Craftsmanship First',
                icon: '🥐',
                summary: 'Premium sourcing, slower growth, loyal superfans.',
                defaults: {
                    vendor: 'FARMERS',
                    pricingStyle: 'premium',
                    marketingFocus: 'PREMIUM',
                    bufferDays: 2
                },
                modifiers: {
                    qualityBias: 1.1,
                    costDiscipline: 0.95,
                    marketingTone: 'storytelling'
                }
            },
            lean_optimist: {
                id: 'lean_optimist',
                name: 'Lean Optimizer',
                icon: '🧮',
                summary: 'Tight inventory, ruthless on costs, volume mindset.',
                defaults: {
                    vendor: 'SYSCO',
                    pricingStyle: 'value',
                    marketingFocus: 'BUDGET',
                    bufferDays: 1
                },
                modifiers: {
                    qualityBias: 0.9,
                    costDiscipline: 1.1,
                    marketingTone: 'deal'
                }
            },
            neighborhood_builder: {
                id: 'neighborhood_builder',
                name: 'Neighborhood Builder',
                icon: '🏘️',
                summary: 'Stable margins, community events, balanced sourcing.',
                defaults: {
                    vendor: 'METRO',
                    pricingStyle: 'balanced',
                    marketingFocus: 'REGULAR',
                    bufferDays: 1.5
                },
                modifiers: {
                    qualityBias: 1.0,
                    costDiscipline: 1.0,
                    marketingTone: 'story'
                }
            }
        },
        PLAYBOOKS: {
            steady_shop: {
                id: 'steady_shop',
                name: 'Steady Artisan Shop',
                icon: '🧺',
                summary: 'Moderate buffers, focus on best sellers.',
                inventoryDays: 1.5,
                cashFloor: 0.2,
                dailyOutput: 18,
                automationBias: { procurement: 'balanced', pricing: 'market' },
                productionFocus: [
                    { recipe: 'BREAD', weight: 0.35 },
                    { recipe: 'CROISSANT', weight: 0.25 },
                    { recipe: 'COOKIE', weight: 0.2 },
                    { recipe: 'MUFFIN', weight: 0.2 }
                ]
            },
            growth_push: {
                id: 'growth_push',
                name: 'Growth Push',
                icon: '🚀',
                summary: 'Aggressive hiring and display-filling output.',
                inventoryDays: 2.2,
                cashFloor: 0.1,
                dailyOutput: 28,
                automationBias: { procurement: 'aggressive', pricing: 'premium' },
                productionFocus: [
                    { recipe: 'CROISSANT', weight: 0.35 },
                    { recipe: 'MUFFIN', weight: 0.25 },
                    { recipe: 'COOKIE', weight: 0.2 },
                    { recipe: 'CAKE', weight: 0.2 }
                ]
            },
            lean_cashflow: {
                id: 'lean_cashflow',
                name: 'Lean Cashflow',
                icon: '💼',
                summary: 'Minimal inventory, safeguard liquidity.',
                inventoryDays: 1,
                cashFloor: 0.35,
                dailyOutput: 14,
                automationBias: { procurement: 'conservative', pricing: 'value' },
                productionFocus: [
                    { recipe: 'BREAD', weight: 0.4 },
                    { recipe: 'COOKIE', weight: 0.3 },
                    { recipe: 'MUFFIN', weight: 0.2 },
                    { recipe: 'CROISSANT', weight: 0.1 }
                ]
            }
        },
        PRICING_STYLES: {
            premium: {
                id: 'premium',
                label: 'Premium Experience',
                description: 'Charge 15% more; best for high quality and events.',
                priceMultiplier: 1.15,
                elasticityBias: 0.9
            },
            balanced: {
                id: 'balanced',
                label: 'Market Rate',
                description: 'Stick close to book price and ride demand swings.',
                priceMultiplier: 1.0,
                elasticityBias: 1.0
            },
            value: {
                id: 'value',
                label: 'Value Menu',
                description: 'Trim 10% to move volume and attract budget shoppers.',
                priceMultiplier: 0.9,
                elasticityBias: 1.1
            }
        },
        INVENTORY_BOUNDS: { minDays: 0.5, maxDays: 3 }
    }
};

window.GAME_CONFIG = GAME_CONFIG;
