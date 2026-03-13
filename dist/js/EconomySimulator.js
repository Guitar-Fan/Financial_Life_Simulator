/**
 * EconomySimulator.js - Real-world economic simulation engine
 * Handles inflation, supply/demand, trends, and market dynamics
 * 
 * This creates a living economy where prices trend up/down based on:
 * - Inflation/deflation cycles
 * - Supply and demand dynamics
 * - Seasonal patterns
 * - Random economic events
 * - Daily variance with smoothed random walks
 */

class EconomySimulator {
    constructor() {
        this.reset();
    }

    reset() {
        const config = window.GAME_CONFIG?.ECONOMY || this.getDefaultConfig();

        // Current economic state
        this.inflationRate = config.INFLATION.baseRate;
        this.inflationTrend = 0; // -1 to 1, direction of inflation change

        // Cumulative inflation index (starts at 1.0)
        this.inflationIndex = 1.0;

        // Supply levels by commodity type
        this.supplyLevels = {
            grains: 1.0,
            dairy: 1.0,
            produce: 1.0
        };

        // Price trends for each ingredient (random walk values)
        this.ingredientTrends = {};
        if (window.GAME_CONFIG?.INGREDIENTS) {
            Object.keys(GAME_CONFIG.INGREDIENTS).forEach(key => {
                this.ingredientTrends[key] = 1.0; // Start at baseline
            });
        }

        // Active economic events
        this.activeEvents = [];

        // Price history for charts (last 30 days)
        this.priceHistory = {
            inflation: [],
            ingredients: {}
        };

        // Callbacks for event system
        this.callbacks = {};
    }

    getDefaultConfig() {
        // Fallback config if GAME_CONFIG not loaded
        return {
            INFLATION: {
                baseRate: 0.03,
                minRate: -0.02,
                maxRate: 0.08,
                momentum: 0.1,
                reversalChance: 0.05
            }
        };
    }

    // ==================== EVENT SYSTEM ====================
    on(event, callback) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(callback);
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }

    // ==================== DAILY UPDATE ====================
    simulateDay(day) {
        // Ensure ingredient trends are initialized
        if (window.GAME_CONFIG?.INGREDIENTS) {
            Object.keys(GAME_CONFIG.INGREDIENTS).forEach(key => {
                if (this.ingredientTrends[key] === undefined) {
                    this.ingredientTrends[key] = 1.0;
                }
            });
        }

        this.updateInflation(day);
        this.updateSupplyLevels(day);
        this.updateIngredientTrends(day);
        this.processEconomicEvents(day);
        this.recordHistory(day);

        return this.getDailyReport(day);
    }

    // ==================== INFLATION SIMULATION ====================
    updateInflation(day) {
        const config = window.GAME_CONFIG?.ECONOMY?.INFLATION || this.getDefaultConfig().INFLATION;

        // Random walk for inflation trend with momentum
        const trendChange = (Math.random() - 0.5) * 2 * config.momentum;
        this.inflationTrend = Math.max(-1, Math.min(1,
            this.inflationTrend * 0.9 + trendChange
        ));

        // Chance of trend reversal (economic shocks)
        if (Math.random() < config.reversalChance) {
            this.inflationTrend *= -0.5;
        }

        // Update inflation rate based on trend
        const rateChange = this.inflationTrend * 0.005; // Small daily adjustments
        this.inflationRate = Math.max(config.minRate,
            Math.min(config.maxRate, this.inflationRate + rateChange)
        );

        // Compound daily inflation into index
        const dailyInflation = this.inflationRate / 365;
        this.inflationIndex *= (1 + dailyInflation);

        this.emit('inflation_update', {
            rate: this.inflationRate,
            index: this.inflationIndex,
            trend: this.inflationTrend > 0.1 ? 'rising' :
                this.inflationTrend < -0.1 ? 'falling' : 'stable'
        });
    }

    // ==================== SUPPLY LEVELS ====================
    updateSupplyLevels(day) {
        const season = this.getSeason(day);
        const seasonConfig = window.GAME_CONFIG?.ECONOMY?.SEASONS?.[season];
        const supplyDemandConfig = window.GAME_CONFIG?.ECONOMY?.SUPPLY_DEMAND;

        const equilibriumSpeed = supplyDemandConfig?.equilibriumSpeed || 0.2;

        Object.keys(this.supplyLevels).forEach(commodity => {
            // Target supply based on season
            const seasonalTarget = seasonConfig?.supplyMod?.[commodity] || 1.0;

            // Move toward seasonal target with some randomness
            const current = this.supplyLevels[commodity];
            const diff = seasonalTarget - current;
            const randomShift = (Math.random() - 0.5) * 0.1;

            this.supplyLevels[commodity] = Math.max(0.5, Math.min(1.5,
                current + diff * equilibriumSpeed + randomShift
            ));
        });
    }

    getSeason(day) {
        const dayOfYear = day % 360;
        if (dayOfYear < 90) return 'SPRING';
        if (dayOfYear < 180) return 'SUMMER';
        if (dayOfYear < 270) return 'FALL';
        return 'WINTER';
    }

    getSeasonInfo(day) {
        const season = this.getSeason(day);
        const seasonConfig = window.GAME_CONFIG?.ECONOMY?.SEASONS?.[season];
        const icons = { SPRING: '🌸', SUMMER: '☀️', FALL: '🍂', WINTER: '❄️' };

        return {
            name: season,
            icon: icons[season] || '🌍',
            description: seasonConfig?.description || '',
            demandMod: seasonConfig?.demandMod || 1.0
        };
    }

    // ==================== INGREDIENT PRICE TRENDS ====================
    updateIngredientTrends(day) {
        const trends = window.GAME_CONFIG?.ECONOMY?.TRENDS || {
            persistence: 0.85,
            maxDailyChange: 0.05,
            minMultiplier: 0.6,
            maxMultiplier: 1.8
        };
        const random = window.GAME_CONFIG?.ECONOMY?.RANDOM || {
            dailyVariance: 0.03,
            smoothing: 0.7
        };
        const supplyDemandConfig = window.GAME_CONFIG?.ECONOMY?.SUPPLY_DEMAND || {
            scarcityImpact: 0.15,
            abundanceImpact: 0.08
        };

        Object.keys(this.ingredientTrends).forEach(key => {
            const ingredient = window.GAME_CONFIG?.INGREDIENTS?.[key];
            if (!ingredient) return;

            const commodity = this.getCommodityType(ingredient.category);
            const supplyLevel = this.supplyLevels[commodity] || 1.0;

            // Supply effect on price trend
            // Low supply = higher prices, high supply = lower prices
            const supplyEffect = supplyLevel < 1.0
                ? 1 + (1 - supplyLevel) * supplyDemandConfig.scarcityImpact
                : 1 - (supplyLevel - 1) * supplyDemandConfig.abundanceImpact;

            // Random walk with mean reversion to prevent runaway prices
            const current = this.ingredientTrends[key];
            const meanReversion = (1.0 - current) * 0.1; // Pull toward 1.0
            const randomWalk = (Math.random() - 0.5) * 2 * trends.maxDailyChange;
            const smoothedRandom = randomWalk * (1 - random.smoothing);

            // Combine effects
            let newTrend = current * trends.persistence
                + meanReversion
                + smoothedRandom;

            // Apply supply effect
            newTrend *= supplyEffect;

            // Clamp to bounds to keep prices realistic
            this.ingredientTrends[key] = Math.max(trends.minMultiplier,
                Math.min(trends.maxMultiplier, newTrend)
            );
        });
    }

    getCommodityType(category) {
        const mapping = {
            dry: 'grains',
            dairy: 'dairy',
            produce: 'produce'
        };
        return mapping[category] || 'grains';
    }

    // ==================== ECONOMIC EVENTS ====================
    processEconomicEvents(day) {
        // Decrement active event durations
        this.activeEvents = this.activeEvents.filter(event => {
            event.remainingDays--;
            if (event.remainingDays <= 0) {
                this.emit('event_ended', event);
                return false;
            }
            return true;
        });

        // Roll for new events
        const events = window.GAME_CONFIG?.ECONOMY?.ECONOMIC_EVENTS || [];
        events.forEach(eventDef => {
            if (Math.random() < eventDef.probability) {
                // Check if already active
                if (this.activeEvents.find(e => e.id === eventDef.id)) return;

                const event = {
                    ...eventDef,
                    remainingDays: eventDef.duration,
                    startDay: day
                };
                this.activeEvents.push(event);
                this.emit('event_started', event);
            }
        });
    }

    getActiveEventEffects() {
        const effects = {
            ingredients: {},
            demand: 1.0,
            willingness: 1.0,
            expenses: {},
            priceElasticity: 1.0
        };

        this.activeEvents.forEach(event => {
            if (event.effects.ingredients) {
                Object.entries(event.effects.ingredients).forEach(([key, mult]) => {
                    effects.ingredients[key] = (effects.ingredients[key] || 1.0) * mult;
                });
            }
            if (event.effects.demand) effects.demand *= event.effects.demand;
            if (event.effects.willingness) effects.willingness *= event.effects.willingness;
            if (event.effects.priceElasticity) effects.priceElasticity *= event.effects.priceElasticity;
            if (event.effects.expenses) {
                Object.entries(event.effects.expenses).forEach(([key, mult]) => {
                    effects.expenses[key] = (effects.expenses[key] || 1.0) * mult;
                });
            }
        });

        return effects;
    }

    // ==================== PRICE CALCULATION ====================
    getIngredientPrice(ingredientKey, vendorKey, quantity = 1, day = 1) {
        const ingredient = window.GAME_CONFIG?.INGREDIENTS?.[ingredientKey];
        const vendor = window.GAME_CONFIG?.VENDORS?.[vendorKey];

        if (!ingredient) return 0;

        const basePrice = ingredient.basePrice;

        // 1. Vendor multiplier
        let price = basePrice * (vendor?.priceMultiplier || 1.0);

        // 2. Inflation effect
        price *= this.inflationIndex;

        // 3. Ingredient trend (random walk)
        price *= this.ingredientTrends[ingredientKey] || 1.0;

        // 4. Day of week effect
        const dayOfWeek = day % 7;
        const weeklyConfig = window.GAME_CONFIG?.ECONOMY?.WEEKLY_PATTERNS;
        if (weeklyConfig?.deliveryDays?.includes(dayOfWeek)) {
            price *= (1 - (weeklyConfig.deliveryDiscount || 0.05));
        }

        // 5. Active event effects
        const eventEffects = this.getActiveEventEffects();
        if (eventEffects.ingredients[ingredientKey]) {
            price *= eventEffects.ingredients[ingredientKey];
        }

        // 6. Daily random variance (small jitter for realism)
        const variance = window.GAME_CONFIG?.ECONOMY?.RANDOM?.dailyVariance || 0.03;
        const jitter = 1 + (Math.random() - 0.5) * 2 * variance;
        price *= jitter;

        // 7. Bulk discounts
        const bulkDiscounts = window.GAME_CONFIG?.ECONOMY?.VENDOR_PRICING?.BULK_DISCOUNTS || [];
        let discount = 0;
        bulkDiscounts.forEach(tier => {
            if (quantity >= tier.minQty) {
                discount = tier.discount;
            }
        });
        price *= (1 - discount);

        return Math.round(price * 100) / 100;
    }

    // Get price comparison to base
    getPriceComparison(ingredientKey, currentPrice) {
        const ingredient = window.GAME_CONFIG?.INGREDIENTS?.[ingredientKey];
        if (!ingredient) return { ratio: 1, status: 'normal' };

        const ratio = currentPrice / ingredient.basePrice;
        let status = 'normal';
        let color = '#f39c12'; // yellow
        let arrow = '➡️';

        if (ratio < 0.9) {
            status = 'low';
            color = '#2ecc71'; // green
            arrow = '📉';
        } else if (ratio > 1.1) {
            status = 'high';
            color = '#e74c3c'; // red
            arrow = '📈';
        }

        return {
            ratio,
            status,
            color,
            arrow,
            percentChange: ((ratio - 1) * 100).toFixed(1)
        };
    }

    // ==================== DEMAND CALCULATION ====================
    getDemandModifier(day) {
        const season = this.getSeason(day);
        const seasonConfig = window.GAME_CONFIG?.ECONOMY?.SEASONS?.[season];
        const dayOfWeek = day % 7;
        const weeklyConfig = window.GAME_CONFIG?.ECONOMY?.WEEKLY_PATTERNS;

        let modifier = (seasonConfig?.demandMod || 1.0) * (weeklyConfig?.traffic?.[dayOfWeek] || 1.0);

        // Event effects
        const eventEffects = this.getActiveEventEffects();
        modifier *= eventEffects.demand;

        return modifier;
    }

    getCustomerWillingnessMultiplier() {
        const eventEffects = this.getActiveEventEffects();
        return eventEffects.willingness;
    }

    // ==================== HISTORY & REPORTING ====================
    recordHistory(day) {
        this.priceHistory.inflation.push({
            day,
            rate: this.inflationRate,
            index: this.inflationIndex
        });

        // Keep last 30 days
        if (this.priceHistory.inflation.length > 30) {
            this.priceHistory.inflation.shift();
        }

        Object.keys(this.ingredientTrends).forEach(key => {
            if (!this.priceHistory.ingredients[key]) {
                this.priceHistory.ingredients[key] = [];
            }
            this.priceHistory.ingredients[key].push({
                day,
                trend: this.ingredientTrends[key]
            });
            if (this.priceHistory.ingredients[key].length > 30) {
                this.priceHistory.ingredients[key].shift();
            }
        });
    }

    getDailyReport(day) {
        const season = this.getSeasonInfo(day);
        const inflationTrend = this.inflationTrend > 0.1 ? '📈 Rising' :
            this.inflationTrend < -0.1 ? '📉 Falling' : '➡️ Stable';

        return {
            day,
            inflation: {
                rate: (this.inflationRate * 100).toFixed(2) + '%',
                trend: inflationTrend,
                index: this.inflationIndex.toFixed(3),
                annualRate: (this.inflationRate * 100).toFixed(1) + '% annual'
            },
            supply: {
                grains: this.supplyLevels.grains.toFixed(2),
                dairy: this.supplyLevels.dairy.toFixed(2),
                produce: this.supplyLevels.produce.toFixed(2)
            },
            season: season,
            demandModifier: this.getDemandModifier(day).toFixed(2),
            activeEvents: this.activeEvents.map(e => ({
                id: e.id,
                name: e.name,
                icon: e.name.split(' ')[0], // First emoji
                daysRemaining: e.remainingDays
            }))
        };
    }

    // Get trend indicator for an ingredient
    getIngredientTrendInfo(ingredientKey) {
        const history = this.priceHistory.ingredients[ingredientKey];
        if (!history || history.length < 2) {
            return { trend: 'stable', arrow: '➡️', change: 0 };
        }

        const recent = history.slice(-5);
        const avgRecent = recent.reduce((s, r) => s + r.trend, 0) / recent.length;
        const current = this.ingredientTrends[ingredientKey] || 1.0;
        const change = current - avgRecent;

        if (change > 0.03) return { trend: 'rising', arrow: '📈', change };
        if (change < -0.03) return { trend: 'falling', arrow: '📉', change };
        return { trend: 'stable', arrow: '➡️', change };
    }

    // ==================== SAVE/LOAD ====================
    save() {
        return {
            inflationRate: this.inflationRate,
            inflationTrend: this.inflationTrend,
            inflationIndex: this.inflationIndex,
            supplyLevels: this.supplyLevels,
            ingredientTrends: this.ingredientTrends,
            activeEvents: this.activeEvents,
            priceHistory: this.priceHistory
        };
    }

    load(data) {
        if (data.inflationRate !== undefined) this.inflationRate = data.inflationRate;
        if (data.inflationTrend !== undefined) this.inflationTrend = data.inflationTrend;
        if (data.inflationIndex !== undefined) this.inflationIndex = data.inflationIndex;
        if (data.supplyLevels) this.supplyLevels = data.supplyLevels;
        if (data.ingredientTrends) this.ingredientTrends = data.ingredientTrends;
        if (data.activeEvents) this.activeEvents = data.activeEvents;
        if (data.priceHistory) this.priceHistory = data.priceHistory;
    }
}

window.EconomySimulator = EconomySimulator;
