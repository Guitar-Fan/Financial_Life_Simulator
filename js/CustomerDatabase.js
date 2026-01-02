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
    
    processPurchase(customer, recipeKey, price, quality) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        
        // Record purchase
        const purchase = {
            date: this.engine.day,
            item: recipeKey,
            itemName: recipe.name,
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
        
        // Update metrics
        this.updateMetrics();
        
        return purchase;
    }
    
    calculateSatisfaction(customer, price, quality, recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        const basePrice = recipe.retailPrice;
        
        // Quality component (0-50 points)
        const qualityScore = (quality / 100) * 50 * customer.qualityWeight;
        
        // Price component (0-30 points)
        const priceRatio = price / basePrice;
        const priceScore = Math.max(0, 30 - (priceRatio - 1) * 30 * customer.priceElasticity);
        
        // Service component (0-20 points) - based on staff
        const serviceScore = Math.min(20, this.engine.staff.length * 5 + 10);
        
        // Total satisfaction
        return Math.min(100, qualityScore + priceScore + serviceScore);
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
    
    updateReturnProbability(customer) {
        let probability = 0.5; // Base 50%
        
        // Satisfaction impact
        probability += (customer.satisfaction - 50) / 100; // -0.5 to +0.5
        
        // Loyalty tier impact
        const tierBonuses = { none: 0, bronze: 0.1, silver: 0.2, gold: 0.3, platinum: 0.4 };
        probability += tierBonuses[customer.loyaltyTier] || 0;
        
        // Recency impact
        const daysSinceVisit = this.engine.day - customer.lastVisit;
        probability -= daysSinceVisit * 0.02; // Decay 2% per day
        
        // Trust impact
        probability += customer.trustScore * 0.2;
        
        customer.returnProbability = Math.max(0.05, Math.min(0.95, probability));
        customer.churnRisk = 1 - customer.returnProbability;
    }
    
    // ==================== INCIDENTS ====================
    
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
            metrics: this.metrics
        };
    }
    
    load(data) {
        if (!data) return;
        
        this.customers = new Map(data.customers || []);
        this.nextCustomerId = data.nextCustomerId || 1;
        this.loyaltyProgram = data.loyaltyProgram || this.loyaltyProgram;
        this.marketingChannels = data.marketingChannels || this.marketingChannels;
        this.metrics = data.metrics || this.metrics;
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.CustomerDatabase = CustomerDatabase;
}
