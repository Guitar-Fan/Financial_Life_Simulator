/**
 * CustomerDatabase.js - Comprehensive customer tracking and behavior system
 * Manages individual customers, their preferences, purchase history, and loyalty
 */

class CustomerDatabase {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.customers = new Map(); // customerID -> Customer object
        this.nextCustomerId = 1;
        this.loyaltyProgram = {
            enabled: false,
            tiers: {
                bronze: { minVisits: 3, discount: 0.05, appealBonus: 0.1 },
                silver: { minVisits: 10, discount: 0.10, appealBonus: 0.2 },
                gold: { minVisits: 25, discount: 0.15, appealBonus: 0.3 },
                platinum: { minVisits: 50, discount: 0.20, appealBonus: 0.5 }
            }
        };

        // Customer demographics distribution
        this.demographics = {
            ageGroups: [
                { range: '18-25', weight: 0.20, priceElasticity: 1.3, qualityWeight: 0.6, trendSeeking: 0.9 },
                { range: '26-35', weight: 0.30, priceElasticity: 1.1, qualityWeight: 0.8, trendSeeking: 0.7 },
                { range: '36-50', weight: 0.25, priceElasticity: 0.9, qualityWeight: 1.0, trendSeeking: 0.5 },
                { range: '51-65', weight: 0.15, priceElasticity: 0.7, qualityWeight: 1.1, trendSeeking: 0.3 },
                { range: '65+', weight: 0.10, priceElasticity: 0.8, qualityWeight: 0.9, trendSeeking: 0.2 }
            ],
            genders: ['Male', 'Female', 'Other']
        };

        // Marketing channels and their effectiveness
        this.marketingChannels = {
            ORGANIC: { enabled: true, cost: 0, effectiveness: 1.0, retention: 0.8 },
            SOCIAL_MEDIA: { enabled: false, cost: 150, effectiveness: 1.5, retention: 0.6 },
            EMAIL: { enabled: false, cost: 50, effectiveness: 1.2, retention: 0.7 },
            LOCAL_ADS: { enabled: false, cost: 300, effectiveness: 1.8, retention: 0.5 },
            REFERRAL: { enabled: false, cost: 100, effectiveness: 2.0, retention: 0.9 }
        };

        // Customer incident types
        this.incidentTypes = [
            {
                id: 'complaint_quality',
                name: 'Quality Complaint',
                probability: 0.02,
                trigger: (customer) => customer.lastPurchaseQuality < 60,
                effect: { satisfaction: -20, reviewChance: 0.3, negativeReviewChance: 0.8 }
            },
            {
                id: 'complaint_price',
                name: 'Price Complaint',
                probability: 0.03,
                trigger: (customer) => customer.priceElasticity > 1.2,
                effect: { satisfaction: -10, pricePerception: 0.9, returnChance: -0.2 }
            },
            {
                id: 'allergy_incident',
                name: 'Allergy Concern',
                probability: 0.01,
                trigger: (customer) => customer.allergies.length > 0,
                effect: { satisfaction: -30, trustScore: -0.3, returnChance: -0.5 }
            },
            {
                id: 'exceptional_service',
                name: 'Exceptional Service',
                probability: 0.05,
                trigger: (customer) => this.engine.staff.length >= 2,
                effect: { satisfaction: 30, loyaltyBonus: 0.2, reviewChance: 0.5, positiveReviewChance: 0.9 }
            },
            {
                id: 'viral_moment',
                name: 'Customer Social Post',
                probability: 0.01,
                trigger: (customer) => customer.ageGroup === '18-25' && customer.satisfaction > 80,
                effect: { newCustomers: Math.floor(Math.random() * 5) + 3, brandAwareness: 0.1 }
            },
            {
                id: 'special_request',
                name: 'Custom Order Request',
                probability: 0.04,
                trigger: (customer) => customer.visits > 5,
                effect: { opportunityRevenue: Math.random() * 50 + 30, relationshipBonus: 0.15 }
            }
        ];

        // Tracking metrics
        this.metrics = {
            totalCustomers: 0,
            returningCustomers: 0,
            newCustomersToday: 0,
            averageSatisfaction: 75,
            averageSpend: 0,
            customerLifetimeValue: 0,
            churnRate: 0,
            npsScore: 0 // Net Promoter Score
        };

        // Ingredient preference adoption + demand tracking
        this.preferenceSampleRate = 0.38;
        this.ingredientDemandMetrics = {};
        Object.entries(GAME_CONFIG.INGREDIENTS || {}).forEach(([key, ingredient]) => {
            this.ingredientDemandMetrics[key] = {
                ingredientKey: key,
                ingredientName: ingredient.name || key,
                icon: ingredient.icon || '🧂',
                unitsSold: 0,
                orders: 0,
                revenue: 0,
                preferenceMatches: 0
            };
        });

        // Initialize some seed customers for existing businesses
        this.generateSeedCustomers(5);
    }

    // ==================== CUSTOMER CREATION ====================

    generateSeedCustomers(count) {
        for (let i = 0; i < count; i++) {
            const customer = this.createCustomer({
                isReturning: true,
                visits: Math.floor(Math.random() * 10) + 1
            });
            this.customers.set(customer.id, customer);
        }
    }

    createCustomer(options = {}) {
        const ageGroup = this.selectDemographic(this.demographics.ageGroups);
        const segment = this.engine.selectCustomerSegment();

        // Generate personality using new personality generator
        const personality = this.generatePersonality(ageGroup, segment);
        const preferences = this.generatePreferences(ageGroup, segment, personality);
        const willingnessToPay = this.generateWillingnessToPay(ageGroup, segment);
        const ingredientPreference = this.generateIngredientPreference(segment, personality);

        const customer = {
            id: this.nextCustomerId++,
            name: this.generateCustomerName(),
            email: options.email || this.generateEmail(),
            phone: this.generatePhone(),

            // Demographics
            ageGroup: ageGroup.range,
            gender: this.demographics.genders[Math.floor(Math.random() * this.demographics.genders.length)],

            // Behavioral attributes
            segment: segment.key,
            priceElasticity: ageGroup.priceElasticity * (0.8 + Math.random() * 0.4),
            qualityWeight: ageGroup.qualityWeight,
            trendSeeking: ageGroup.trendSeeking,

            // NEW: Personality Traits
            personality: personality,

            // NEW: Detailed Preferences
            preferences: preferences,

            // Ingredient preference can influence demand and cart size
            ingredientPreference: ingredientPreference,

            // NEW: Willingness to Pay
            willingnessToPay: willingnessToPay,

            // NEW: Current Mood and External Factors
            currentMood: 50 + (Math.random() * 40 - 20), // Start at 30-70
            lastMoodUpdate: this.engine.day,
            externalFactors: {
                weatherSensitivity: Math.random() * 100,
                timeOfDaySensitivity: Math.random() * 100,
                economicSensitivity: Math.random() * 100
            },

            // Preferences
            favoriteItems: [],
            allergies: this.generateAllergies(),
            dietaryRestrictions: this.generateDietaryRestrictions(),
            preferredTime: this.generatePreferredTime(),

            // Interaction history
            visits: options.visits || 0,
            firstVisit: options.firstVisit || this.engine.day,
            lastVisit: options.lastVisit || this.engine.day,
            totalSpent: options.totalSpent || 0,
            purchaseHistory: options.purchaseHistory || [],

            // Quality tracking
            lastPurchaseQuality: 100,
            averageQuality: 100,

            // Engagement
            satisfaction: 75,
            trustScore: 0.5,
            loyaltyTier: 'none',
            emailsOpened: 0,
            emailsSent: 0,
            onlineOrders: 0,

            // NEW: Satisfaction History Breakdown
            satisfactionHistory: [],

            // Acquisition
            acquisitionChannel: options.channel || 'ORGANIC',
            acquisitionDate: this.engine.day,

            // Status
            isActive: true,
            returnProbability: 0.5,
            churnRisk: 0.3,

            // Special
            customOrders: [],
            complaints: [],
            compliments: []
        };

        this.metrics.totalCustomers++;
        return customer;
    }

    selectDemographic(groups) {
        const rand = Math.random();
        let cumulative = 0;
        for (const group of groups) {
            cumulative += group.weight;
            if (rand <= cumulative) return group;
        }
        return groups[0];
    }

    generateCustomerName() {
        const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
            'Isabella', 'James', 'Mia', 'Lucas', 'Charlotte', 'Alex', 'Harper'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
            'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Lee'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }

    generateEmail() {
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
        const randomStr = Math.random().toString(36).substring(7);
        return `customer${randomStr}@${domains[Math.floor(Math.random() * domains.length)]}`;
    }

    generatePhone() {
        return `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    }

    generateAllergies() {
        const allergies = ['nuts', 'dairy', 'eggs', 'gluten', 'soy'];
        const hasAllergy = Math.random() < 0.15; // 15% have allergies
        if (!hasAllergy) return [];
        return [allergies[Math.floor(Math.random() * allergies.length)]];
    }

    generateDietaryRestrictions() {
        const restrictions = ['vegetarian', 'vegan', 'keto', 'paleo', 'none'];
        const weights = [0.08, 0.03, 0.02, 0.01, 0.86];
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < restrictions.length; i++) {
            cumulative += weights[i];
            if (rand <= cumulative) return restrictions[i];
        }
        return 'none';
    }

    generatePreferredTime() {
        const times = ['early_morning', 'morning', 'lunch', 'afternoon', 'evening'];
        return times[Math.floor(Math.random() * times.length)];
    }

    // ==================== STAGE 1: PERSONALITY GENERATION ====================

    /**
     * Generate unique personality traits based on age group and customer segment
     */
    generatePersonality(ageGroup, segment) {
        // Base personality traits (0-100)
        let patience = 50;
        let chattiness = 50;
        let impulsiveness = 50;
        let flexibility = 50;
        let moodiness = 50;

        // Age group influences
        switch (ageGroup.range) {
            case '18-25':
                impulsiveness += 20;
                chattiness += 15;
                patience -= 10;
                moodiness += 10;
                break;
            case '26-35':
                flexibility += 15;
                impulsiveness += 5;
                break;
            case '36-50':
                patience += 15;
                chattiness -= 5;
                flexibility += 10;
                break;
            case '51-65':
                patience += 20;
                chattiness += 10;
                impulsiveness -= 15;
                moodiness -= 10;
                break;
            case '65+':
                patience += 25;
                chattiness += 20;
                impulsiveness -= 20;
                flexibility -= 10;
                break;
        }

        // Segment influences
        switch (segment.key) {
            case 'BUDGET':
                patience -= 10;
                chattiness -= 15;
                impulsiveness += 10;
                break;
            case 'PREMIUM':
                patience += 15;
                chattiness += 10;
                flexibility -= 5;
                break;
            case 'HEALTH':
                patience += 10;
                chattiness += 5;
                flexibility -= 10;
                break;
            case 'TRENDY':
                impulsiveness += 15;
                chattiness += 10;
                moodiness += 10;
                break;
        }

        // Add randomness (±20)
        const randomize = (val) => Math.max(0, Math.min(100, val + (Math.random() * 40 - 20)));

        return {
            patience: randomize(patience),
            chattiness: randomize(chattiness),
            impulsiveness: randomize(impulsiveness),
            flexibility: randomize(flexibility),
            moodiness: randomize(moodiness)
        };
    }

    /**
     * Generate detailed customer preferences based on personality
     */
    generatePreferences(ageGroup, segment, personality) {
        // Service speed preference
        let serviceSpeed = 'normal';
        if (personality.patience < 40) serviceSpeed = 'fast';
        else if (personality.patience > 70) serviceSpeed = 'slow';

        // Interaction style preference
        let interactionStyle = 'friendly';
        if (personality.chattiness < 35) interactionStyle = 'minimal';
        else if (personality.chattiness > 70) interactionStyle = 'chatty';

        // Quality vs Price orientation (0 = price focused, 100 = quality focused)
        let qualityVsPrice = 50;
        if (segment.key === 'BUDGET') qualityVsPrice = 20;
        else if (segment.key === 'PREMIUM') qualityVsPrice = 85;
        else if (segment.key === 'HEALTH') qualityVsPrice = 75;
        else if (segment.key === 'TRENDY') qualityVsPrice = 60;

        // Add personality influence
        qualityVsPrice += (personality.impulsiveness - 50) * -0.3;

        return {
            serviceSpeed: serviceSpeed,
            interactionStyle: interactionStyle,
            qualityVsPrice: Math.max(0, Math.min(100, qualityVsPrice)),
            brandLoyalty: Math.max(0, Math.min(100, 50 - personality.moodiness * 0.3 + personality.flexibility * 0.2)),
            adventurousness: Math.max(0, Math.min(100, personality.impulsiveness * 0.7 + (100 - personality.patience) * 0.3))
        };
    }

    /**
     * Generate willingness to pay based on customer characteristics
     */
    generateWillingnessToPay(ageGroup, segment) {
        let baseRange = [3, 8]; // Default price range
        let qualityMultiplier = 1.0;

        // Segment affects base budget
        switch (segment.key) {
            case 'BUDGET':
                baseRange = [2, 5];
                qualityMultiplier = 0.8;
                break;
            case 'PREMIUM':
                baseRange = [8, 20];
                qualityMultiplier = 1.5;
                break;
            case 'HEALTH':
                baseRange = [6, 15];
                qualityMultiplier = 1.3;
                break;
            case 'TRENDY':
                baseRange = [5, 12];
                qualityMultiplier = 1.2;
                break;
            default:
                baseRange = [4, 10];
        }

        // Age group affects budget
        switch (ageGroup.range) {
            case '18-25':
                baseRange = [baseRange[0] * 0.8, baseRange[1] * 0.9];
                break;
            case '26-35':
                baseRange = [baseRange[0] * 1.1, baseRange[1] * 1.2];
                break;
            case '36-50':
                baseRange = [baseRange[0] * 1.2, baseRange[1] * 1.3];
                break;
            case '51-65':
                baseRange = [baseRange[0] * 1.1, baseRange[1] * 1.2];
                break;
            case '65+':
                baseRange = [baseRange[0] * 0.9, baseRange[1] * 1.0];
                break;
        }

        const base = (baseRange[0] + baseRange[1]) / 2;

        return {
            base: parseFloat(base.toFixed(2)),
            priceRange: [parseFloat(baseRange[0].toFixed(2)), parseFloat(baseRange[1].toFixed(2))],
            qualityMultiplier: qualityMultiplier
        };
    }

    generateIngredientPreference(segment, personality) {
        const ingredients = Object.entries(GAME_CONFIG.INGREDIENTS || {});
        if (ingredients.length === 0) {
            return { active: false };
        }

        let chance = this.preferenceSampleRate;
        const segmentKey = segment?.key || 'REGULAR';
        if (segmentKey === 'TRENDY' || segmentKey === 'PREMIUM') chance += 0.12;
        if (segmentKey === 'BUDGET') chance -= 0.06;
        if ((personality?.impulsiveness || 50) > 65) chance += 0.05;
        chance = Math.max(0.15, Math.min(0.72, chance));

        if (Math.random() > chance) {
            return { active: false };
        }

        const [ingredientKey, ingredient] = ingredients[Math.floor(Math.random() * ingredients.length)];
        const strength = Number((0.18 + Math.random() * 0.28).toFixed(2));

        return {
            active: true,
            ingredientKey,
            ingredientName: ingredient.name || ingredientKey,
            icon: ingredient.icon || '🧂',
            buyBoost: Number((1 + strength).toFixed(2)),
            cartBoost: Number((0.25 + strength).toFixed(2))
        };
    }

    // ==================== CUSTOMER VISITS ====================

    generateDailyCustomers(baseTraffic = 20) {
        const customers = [];
        const dayOfWeek = this.engine.day % 7;
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

        // Apply various multipliers
        let traffic = baseTraffic;
        traffic *= this.engine.trafficMultiplier || 1.0; // Location-based
        traffic *= this.engine.menuAppeal || 1.0; // Menu variety
        traffic *= isWeekend ? 1.3 : 1.0; // Weekend boost
        traffic *= this.engine.economy.getDemandMultiplier(); // Economic conditions

        // Marketing channel effects
        Object.values(this.marketingChannels).forEach(channel => {
            if (channel.enabled) {
                traffic *= channel.effectiveness;
            }
        });

        // Reputation effect
        const avgSatisfaction = this.metrics.averageSatisfaction;
        traffic *= 0.5 + (avgSatisfaction / 100); // 0.5x to 1.5x based on satisfaction

        const customerCount = Math.floor(traffic);

        // Generate mix of new and returning customers
        for (let i = 0; i < customerCount; i++) {
            const isReturning = Math.random() < this.getReturningCustomerRate();

            if (isReturning && this.customers.size > 0) {
                // Select existing customer
                const existingCustomer = this.selectReturningCustomer();
                if (existingCustomer) {
                    // STAGE 1: Update their mood before they visit
                    this.updateCustomerMood(existingCustomer);
                    customers.push(existingCustomer);
                    continue;
                }
            }

            // Create new customer
            const newCustomer = this.createCustomer();
            this.customers.set(newCustomer.id, newCustomer);
            customers.push(newCustomer);
            this.metrics.newCustomersToday++;
        }

        return customers;
    }

    getReturningCustomerRate() {
        const baseRate = 0.3; // 30% base returning rate
        const satisfactionBonus = (this.metrics.averageSatisfaction - 50) / 100; // -0.5 to +0.5
        const loyaltyBonus = this.loyaltyProgram.enabled ? 0.2 : 0;

        return Math.max(0.1, Math.min(0.9, baseRate + satisfactionBonus + loyaltyBonus));
    }

    selectReturningCustomer() {
        const activeCustomers = Array.from(this.customers.values())
            .filter(c => c.isActive && c.returnProbability > Math.random());

        if (activeCustomers.length === 0) return null;

        // Weight by return probability
        const totalWeight = activeCustomers.reduce((sum, c) => sum + c.returnProbability, 0);
        let rand = Math.random() * totalWeight;

        for (const customer of activeCustomers) {
            rand -= customer.returnProbability;
            if (rand <= 0) return customer;
        }

        return activeCustomers[0];
    }

    // ==================== PURCHASE BEHAVIOR ====================

    processPurchase(customer, recipeKey, price, quality, quantity = 1) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];

        // Record purchase
        const purchase = {
            date: this.engine.day,
            item: recipeKey,
            itemName: recipe.name,
            quantity: Math.max(1, Number(quantity) || 1),
            price: price,
            quality: quality,
            satisfaction: this.calculateSatisfaction(customer, price, quality, recipeKey)
        };

        customer.purchaseHistory.push(purchase);
        customer.totalSpent += price;
        customer.visits++;
        customer.lastVisit = this.engine.day;
        customer.lastPurchaseQuality = quality;

        // Update averages
        customer.averageQuality = (customer.averageQuality * (customer.visits - 1) + quality) / customer.visits;

        // Update favorite items
        this.updateFavoriteItems(customer, recipeKey);

        // Update satisfaction
        customer.satisfaction = Math.max(0, Math.min(100,
            customer.satisfaction * 0.7 + purchase.satisfaction * 0.3
        ));

        // Update loyalty tier
        this.updateLoyaltyTier(customer);

        // Update return probability
        this.updateReturnProbability(customer);

        // Check for incidents
        this.checkForIncidents(customer, purchase);

        this.trackIngredientSignals(customer, recipeKey, purchase.price, purchase.quantity);

        // Update metrics
        this.updateMetrics();

        return purchase;
    }

    trackIngredientSignals(customer, recipeKey, revenue, quantity = 1) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe || !recipe.ingredients) return;

        const pref = customer?.ingredientPreference;
        const preferredKey = pref?.active ? pref.ingredientKey : null;
        const qty = Math.max(1, Number(quantity) || 1);
        const totalRecipeWeight = Math.max(1, Object.values(recipe.ingredients).reduce((sum, amount) => sum + amount, 0));

        Object.entries(recipe.ingredients).forEach(([ingredientKey, amount]) => {
            if (!this.ingredientDemandMetrics[ingredientKey]) {
                const ing = GAME_CONFIG.INGREDIENTS?.[ingredientKey] || {};
                this.ingredientDemandMetrics[ingredientKey] = {
                    ingredientKey,
                    ingredientName: ing.name || ingredientKey,
                    icon: ing.icon || '🧂',
                    unitsSold: 0,
                    orders: 0,
                    revenue: 0,
                    preferenceMatches: 0
                };
            }

            const metric = this.ingredientDemandMetrics[ingredientKey];
            const units = qty * amount;
            const revenueShare = (revenue || 0) * (amount / totalRecipeWeight);

            metric.unitsSold += units;
            metric.orders += 1;
            metric.revenue += revenueShare;

            if (preferredKey && ingredientKey === preferredKey) {
                metric.preferenceMatches += qty;
            }
        });
    }

    /**
     * Simplified satisfaction model: quality + value + upgrade-driven experience.
     */
    calculateSatisfaction(customer, price, quality, recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        const expectedPrice = Math.max(0.5, Number(customer?.willingnessToPay?.base) || Number(recipe?.retailPrice) || 5);
        const qualityFactor = Math.max(0, Math.min(1, (quality || 0) / 100));
        const qualityPreference = Math.max(0.75, Math.min(1.3, Number(customer?.qualityWeight) || 1));
        const qualityScore = Math.min(48, qualityFactor * qualityPreference * 48);

        const valueFactor = this.calculateValuePerception(price, expectedPrice);
        const valueScore = valueFactor * 34;

        const upgradeFactor = this.getUpgradeInfluenceScore(customer);
        const upgradeScore = upgradeFactor * 18;

        const totalSatisfaction = Math.max(0, Math.min(100, qualityScore + valueScore + upgradeScore));

        // Record in satisfaction history
        const satisfactionRecord = {
            day: this.engine.day,
            bakeryScore: parseFloat(totalSatisfaction.toFixed(2)),
            personalScore: 0,
            total: parseFloat(totalSatisfaction.toFixed(2)),
            breakdown: {
                quality: parseFloat(qualityScore.toFixed(2)),
                bakeryLooks: parseFloat((upgradeFactor * 8).toFixed(2)),
                service: parseFloat((upgradeFactor * 10).toFixed(2)),
                value: parseFloat(valueScore.toFixed(2)),
                mood: 0,
                personality: 0,
                external: 0
            }
        };

        customer.satisfactionHistory.push(satisfactionRecord);

        // Keep last 30 satisfaction records
        if (customer.satisfactionHistory.length > 30) {
            customer.satisfactionHistory = customer.satisfactionHistory.slice(-30);
        }

        return totalSatisfaction;
    }

    calculateValuePerception(price, expectedPrice) {
        const safeExpected = Math.max(0.5, Number(expectedPrice) || 1);
        if (price <= safeExpected) return 1;
        return Math.max(0, 1 - ((price - safeExpected) / safeExpected));
    }

    getUpgradeInfluenceScore() {
        const menuAppeal = Math.max(0.7, Math.min(1.8, Number(this.engine?.getMenuAppealMultiplier?.() || this.engine?.menuAppeal || 1)));
        const menuScore = Math.max(0, Math.min(1, (menuAppeal - 0.7) / 1.1));

        const equipmentGroups = this.engine?.equipment && typeof this.engine.equipment === 'object'
            ? Object.values(this.engine.equipment)
            : [];
        const equipmentItems = equipmentGroups.flatMap(group => Array.isArray(group) ? group : []);
        const equipmentScore = equipmentItems.length
            ? equipmentItems.reduce((sum, eq) => {
                const reliability = Number(eq?.reliability);
                const quality = Number(eq?.quality);
                const score = Number.isFinite(reliability)
                    ? reliability
                    : (Number.isFinite(quality) ? (quality / 100) : 0.65);
                return sum + Math.max(0, Math.min(1.1, score));
            }, 0) / equipmentItems.length
            : 0.65;

        const staffList = Array.isArray(this.engine?.staff) ? this.engine.staff : [];
        const serviceScore = staffList.length
            ? Math.max(0.45, Math.min(1.2, staffList.reduce((sum, staff) => {
                const skill = Number.isFinite(staff?.skillLevel) ? staff.skillLevel : (Number(staff?.skill) || 50) / 20;
                const training = Number(staff?.trainingLevel) || 0;
                return sum + Math.max(0.35, Math.min(1.3, (skill / 5) + training * 0.06));
            }, 0) / staffList.length))
            : 0.45;

        const combined = (menuScore * 0.45) + (equipmentScore * 0.3) + (serviceScore * 0.25);
        return Math.max(0, Math.min(1, combined));
    }

    /**
     * Calculate bakery experience score based on equipment and setup
     */
    calculateBakeryExperience() {
        // Base on average equipment quality
        if (!this.engine.equipment || this.engine.equipment.length === 0) {
            return 0.5; // Minimal setup
        }

        const avgQuality = this.engine.equipment.reduce((sum, eq) => sum + (eq.quality || 70), 0) / this.engine.equipment.length;
        return avgQuality / 100;
    }

    /**
     * Calculate service quality based on staff and customer preferences
     */
    calculateServiceQuality(customer) {
        const staffCount = this.engine.staff ? this.engine.staff.length : 0;

        // Base service score from staff count
        let serviceQuality = Math.min(1.0, 0.3 + (staffCount * 0.15));

        // Adjust for customer's service speed preference
        if (customer.preferences.serviceSpeed === 'fast' && staffCount >= 2) {
            serviceQuality += 0.1; // Happy with fast service
        } else if (customer.preferences.serviceSpeed === 'slow' && staffCount === 0) {
            serviceQuality -= 0.1; // Overwhelmed owner
        }

        return Math.max(0, Math.min(1.0, serviceQuality));
    }

    /**
     * Calculate how well the interaction matched customer's personality
     */
    calculatePersonalityMatch(customer) {
        // This is simplified for now - will be enhanced in Stage 3 with actual interactions
        // For now, it's based on whether their preferences are being met

        let matchScore = 0.7; // Default neutral match

        // Chatty customers are happier at small bakeries (personal touch)
        if (customer.personality.chattiness > 70) {
            matchScore += 0.1;
        }

        // Moody customers are unpredictable
        if (customer.personality.moodiness > 70) {
            matchScore += (Math.random() * 0.4 - 0.2); // Random swing
        }

        // Impatient customers want quick service
        if (customer.personality.patience < 40 && this.engine.staff.length < 2) {
            matchScore -= 0.15;
        }

        return Math.max(0, Math.min(1.0, matchScore));
    }

    /**
     * Calculate external factors affecting satisfaction (weather, economy, etc.)
     */
    calculateExternalFactors(customer) {
        let externalScore = 0.5; // Neutral base

        // Weather effect (if economy has weather)
        if (this.engine.economy && this.engine.economy.weather) {
            const weather = this.engine.economy.weather;
            const sensitivity = customer.externalFactors.weatherSensitivity / 100;

            if (weather === 'sunny' || weather === 'clear') {
                externalScore += 0.2 * sensitivity;
            } else if (weather === 'rainy' || weather === 'stormy') {
                externalScore -= 0.3 * sensitivity;
            } else if (weather === 'snowy') {
                externalScore -= 0.1 * sensitivity;
            }
        }

        // Economic conditions
        if (this.engine.economy && this.engine.economy.getDemandMultiplier) {
            const economicHealth = this.engine.economy.getDemandMultiplier();
            const economicSens = customer.externalFactors.economicSensitivity / 100;
            externalScore += (economicHealth - 1.0) * 0.3 * economicSens;
        }

        // Time of day effect (simplified)
        const timeSens = customer.externalFactors.timeOfDaySensitivity / 100;
        const preferredTime = customer.preferredTime;
        // This could be enhanced with actual time tracking in Stage 2

        return Math.max(0, Math.min(1.0, externalScore));
    }

    updateFavoriteItems(customer, recipeKey) {
        const existing = customer.favoriteItems.find(f => f.item === recipeKey);
        if (existing) {
            existing.count++;
        } else {
            customer.favoriteItems.push({ item: recipeKey, count: 1 });
        }

        // Sort by count
        customer.favoriteItems.sort((a, b) => b.count - a.count);

        // Keep top 5
        customer.favoriteItems = customer.favoriteItems.slice(0, 5);
    }

    updateLoyaltyTier(customer) {
        if (!this.loyaltyProgram.enabled) {
            customer.loyaltyTier = 'none';
            return;
        }

        const visits = customer.visits;
        const tiers = this.loyaltyProgram.tiers;

        if (visits >= tiers.platinum.minVisits) customer.loyaltyTier = 'platinum';
        else if (visits >= tiers.gold.minVisits) customer.loyaltyTier = 'gold';
        else if (visits >= tiers.silver.minVisits) customer.loyaltyTier = 'silver';
        else if (visits >= tiers.bronze.minVisits) customer.loyaltyTier = 'bronze';
        else customer.loyaltyTier = 'none';
    }

    /**
     * Simplified return probability: quality + value + upgrades (+ slight noise).
     */
    updateReturnProbability(customer) {
        const avgQuality = Math.max(0, Math.min(1, Number(customer.averageQuality || customer.lastPurchaseQuality || 70) / 100));

        const recentPurchases = (customer.purchaseHistory || []).slice(-5);
        const expected = Math.max(0.5, Number(customer?.willingnessToPay?.base) || 5);
        const valueScore = recentPurchases.length
            ? recentPurchases.reduce((sum, p) => sum + this.calculateValuePerception(Number(p.price) || 0, expected), 0) / recentPurchases.length
            : this.calculateValuePerception(expected, expected);

        const upgradeScore = this.getUpgradeInfluenceScore(customer);
        const slightNoise = (Math.random() * 0.06) - 0.03;

        let probability = 0.22;
        probability += avgQuality * 0.42;
        probability += valueScore * 0.28;
        probability += upgradeScore * 0.12;
        probability += slightNoise;

        customer.returnProbability = Math.max(0.05, Math.min(0.95, probability));
        customer.churnRisk = 1 - customer.returnProbability;
    }

    /**
     * Get average satisfaction from recent history
     */
    getAverageSatisfaction(customer) {
        if (customer.satisfactionHistory.length === 0) {
            return customer.satisfaction; // Fall back to stored satisfaction
        }

        // Weight recent visits more heavily
        const recentCount = Math.min(5, customer.satisfactionHistory.length);
        const recentSatisfactions = customer.satisfactionHistory.slice(-recentCount);

        let weightedSum = 0;
        let weightTotal = 0;

        recentSatisfactions.forEach((record, index) => {
            const weight = index + 1; // More recent = higher weight
            weightedSum += record.total * weight;
            weightTotal += weight;
        });

        return weightedSum / weightTotal;
    }

    // ==================== INCIDENTS ====================

    /**
     * STAGE 1: Update customer mood based on external factors
     */
    updateCustomerMood(customer) {
        let moodChange = 0;

        // Weather effect
        if (this.engine.economy && this.engine.economy.weather) {
            const weather = this.engine.economy.weather;
            const weatherSens = customer.externalFactors.weatherSensitivity / 100;

            if (weather === 'sunny' || weather === 'clear') {
                moodChange += 10 * weatherSens;
            } else if (weather === 'rainy' || weather === 'stormy') {
                moodChange -= 15 * weatherSens;
            } else if (weather === 'snowy') {
                moodChange -= 5 * weatherSens;
            } else if (weather === 'cloudy') {
                moodChange -= 3 * weatherSens;
            }
        }

        // Economic stress
        if (this.engine.economy && this.engine.economy.getDemandMultiplier) {
            const economicHealth = this.engine.economy.getDemandMultiplier();
            const economicSens = customer.externalFactors.economicSensitivity / 100;

            if (economicHealth < 0.8) {
                moodChange -= 10 * economicSens;
            } else if (economicHealth > 1.2) {
                moodChange += 5 * economicSens;
            }
        }

        // Personality-based mood swings
        const moodinessEffect = customer.personality.moodiness / 100;
        const randomSwing = (Math.random() * 20 - 10) * moodinessEffect;
        moodChange += randomSwing;

        // Apply mood change with dampening
        customer.currentMood += moodChange * 0.3; // Dampen changes
        customer.currentMood = Math.max(0, Math.min(100, customer.currentMood));
        customer.lastMoodUpdate = this.engine.day;

        return customer.currentMood;
    }

    checkForIncidents(customer, purchase) {
        for (const incident of this.incidentTypes) {
            if (Math.random() < incident.probability && incident.trigger(customer)) {
                this.triggerIncident(customer, incident, purchase);
            }
        }
    }

    triggerIncident(customer, incident, purchase) {
        const effects = incident.effect;

        // Apply effects
        if (effects.satisfaction) {
            customer.satisfaction = Math.max(0, Math.min(100, customer.satisfaction + effects.satisfaction));
        }
        if (effects.trustScore) {
            customer.trustScore = Math.max(0, Math.min(1, customer.trustScore + effects.trustScore));
        }
        if (effects.returnChance) {
            customer.returnProbability = Math.max(0, Math.min(1, customer.returnProbability + effects.returnChance));
        }

        // Record incident
        const record = {
            date: this.engine.day,
            type: incident.id,
            name: incident.name,
            effects: effects,
            purchase: purchase
        };

        if (effects.satisfaction < 0) {
            customer.complaints.push(record);
        } else if (effects.satisfaction > 0) {
            customer.compliments.push(record);
        }

        // Emit event for game controller to handle
        this.engine.emit('customer_incident', {
            customer: customer,
            incident: incident,
            effects: effects
        });

        return record;
    }

    // ==================== MARKETING ====================

    enableMarketingChannel(channelKey) {
        if (this.marketingChannels[channelKey]) {
            this.marketingChannels[channelKey].enabled = true;
            return { success: true, cost: this.marketingChannels[channelKey].cost };
        }
        return { success: false };
    }

    sendEmailCampaign(subject, targetSegment = null) {
        const targetCustomers = Array.from(this.customers.values())
            .filter(c => c.isActive && (!targetSegment || c.segment === targetSegment));

        const emailCost = 0.05; // $0.05 per email
        const totalCost = targetCustomers.length * emailCost;

        if (this.engine.cash < totalCost) {
            return { success: false, message: 'Not enough cash' };
        }

        this.engine.cash -= totalCost;

        // Simulate email opens
        const openRate = 0.25; // 25% open rate
        let opened = 0;

        targetCustomers.forEach(customer => {
            customer.emailsSent++;
            if (Math.random() < openRate) {
                customer.emailsOpened++;
                opened++;
                // Boost return probability temporarily
                customer.returnProbability = Math.min(0.95, customer.returnProbability + 0.1);
            }
        });

        return {
            success: true,
            sent: targetCustomers.length,
            opened: opened,
            cost: totalCost,
            openRate: (opened / targetCustomers.length * 100).toFixed(1) + '%'
        };
    }

    // ==================== LOYALTY PROGRAM ====================

    enableLoyaltyProgram() {
        this.loyaltyProgram.enabled = true;
        // Update all existing customers
        this.customers.forEach(customer => this.updateLoyaltyTier(customer));
    }

    getLoyaltyDiscount(customer) {
        if (!this.loyaltyProgram.enabled || customer.loyaltyTier === 'none') {
            return 0;
        }
        return this.loyaltyProgram.tiers[customer.loyaltyTier].discount;
    }

    // ==================== ANALYTICS ====================

    updateMetrics() {
        const activeCustomers = Array.from(this.customers.values()).filter(c => c.isActive);

        if (activeCustomers.length === 0) return;

        // Average satisfaction
        this.metrics.averageSatisfaction = activeCustomers.reduce((sum, c) => sum + c.satisfaction, 0) / activeCustomers.length;

        // Average spend
        this.metrics.averageSpend = activeCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / activeCustomers.length;

        // Returning customers
        this.metrics.returningCustomers = activeCustomers.filter(c => c.visits > 1).length;

        // Customer lifetime value
        const avgVisits = activeCustomers.reduce((sum, c) => sum + c.visits, 0) / activeCustomers.length;
        this.metrics.customerLifetimeValue = this.metrics.averageSpend / avgVisits * avgVisits * 1.5; // Projected

        // Churn rate
        this.metrics.churnRate = activeCustomers.reduce((sum, c) => sum + c.churnRisk, 0) / activeCustomers.length;

        // NPS Score (simplified)
        const promoters = activeCustomers.filter(c => c.satisfaction >= 80).length;
        const detractors = activeCustomers.filter(c => c.satisfaction < 50).length;
        this.metrics.npsScore = ((promoters - detractors) / activeCustomers.length * 100).toFixed(0);
    }

    getAnalytics() {
        return {
            totalCustomers: this.customers.size,
            activeCustomers: Array.from(this.customers.values()).filter(c => c.isActive).length,
            newToday: this.metrics.newCustomersToday,
            returningRate: (this.metrics.returningCustomers / this.customers.size * 100).toFixed(1) + '%',
            avgSatisfaction: this.metrics.averageSatisfaction.toFixed(1),
            avgSpend: this.metrics.averageSpend.toFixed(2),
            lifetimeValue: this.metrics.customerLifetimeValue.toFixed(2),
            churnRate: (this.metrics.churnRate * 100).toFixed(1) + '%',
            npsScore: this.metrics.npsScore,
            loyaltyDistribution: this.getLoyaltyDistribution()
        };
    }

    getLoyaltyDistribution() {
        const dist = { none: 0, bronze: 0, silver: 0, gold: 0, platinum: 0 };
        this.customers.forEach(c => {
            dist[c.loyaltyTier]++;
        });
        return dist;
    }

    getIngredientInsights(limit = 8) {
        const activeCustomers = Array.from(this.customers.values()).filter(c => c.isActive);
        const totalActive = Math.max(1, activeCustomers.length);
        const preferenceCounts = {};

        activeCustomers.forEach(customer => {
            const pref = customer?.ingredientPreference;
            if (pref?.active && pref.ingredientKey) {
                preferenceCounts[pref.ingredientKey] = (preferenceCounts[pref.ingredientKey] || 0) + 1;
            }
        });

        const insights = Object.entries(this.ingredientDemandMetrics || {}).map(([ingredientKey, metric]) => {
            const preferenceShare = (preferenceCounts[ingredientKey] || 0) / totalActive;
            const units = Number(metric.unitsSold) || 0;
            const matches = Number(metric.preferenceMatches) || 0;
            const score = (units * 0.6) + (matches * 1.6) + (preferenceShare * 80);

            let guidance = 'Hold';
            if (score >= 28) guidance = 'Test +5% price';
            else if (score <= 8) guidance = 'Keep price low';

            return {
                ingredientKey,
                ingredientName: metric.ingredientName,
                icon: metric.icon,
                unitsSold: units,
                orders: Number(metric.orders) || 0,
                revenue: Number(metric.revenue) || 0,
                preferenceMatches: matches,
                preferenceShare,
                score,
                guidance
            };
        });

        return insights
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    getTopCustomers(limit = 10) {
        return Array.from(this.customers.values())
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
    }

    getAtRiskCustomers() {
        return Array.from(this.customers.values())
            .filter(c => c.isActive && c.churnRisk > 0.7)
            .sort((a, b) => b.churnRisk - a.churnRisk);
    }

    // ==================== DAILY OPERATIONS ====================

    startDay() {
        this.metrics.newCustomersToday = 0;

        // Process marketing costs
        Object.values(this.marketingChannels).forEach(channel => {
            if (channel.enabled) {
                this.engine.cash -= channel.cost / 30; // Daily cost
            }
        });
    }

    endDay() {
        // Update all customer probabilities
        this.customers.forEach(customer => {
            this.updateReturnProbability(customer);

            // Mark as churned if very low probability and no recent visit
            if (customer.returnProbability < 0.1 && (this.engine.day - customer.lastVisit) > 30) {
                customer.isActive = false;
            }
        });

        this.updateMetrics();
    }

    // ==================== SAVE/LOAD ====================

    save() {
        return {
            customers: Array.from(this.customers.entries()),
            nextCustomerId: this.nextCustomerId,
            loyaltyProgram: this.loyaltyProgram,
            marketingChannels: this.marketingChannels,
            metrics: this.metrics,
            ingredientDemandMetrics: this.ingredientDemandMetrics
        };
    }

    load(data) {
        if (!data) return;

        this.customers = new Map(data.customers || []);
        this.nextCustomerId = data.nextCustomerId || 1;
        this.loyaltyProgram = data.loyaltyProgram || this.loyaltyProgram;
        this.marketingChannels = data.marketingChannels || this.marketingChannels;
        this.metrics = data.metrics || this.metrics;

        if (data.ingredientDemandMetrics) {
            this.ingredientDemandMetrics = data.ingredientDemandMetrics;
        }

        this.customers.forEach(customer => {
            if (!customer.ingredientPreference) {
                customer.ingredientPreference = { active: false };
            }
        });
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.CustomerDatabase = CustomerDatabase;
}
