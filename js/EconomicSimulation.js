/**
 * EconomicSimulation.js
 * Advanced economic simulation with inflation, supply/demand, seasonal effects,
 * and dynamic pricing. Tracks trends for financial dashboard.
 */

class EconomicSimulation {
    constructor() {
        this.day = 1;
        this.season = 'SPRING';
        this.dayOfWeek = 0; // 0 = Monday
        
        // Economic state
        this.inflation = {
            current: 0.03, // 3% annual
            trend: 0,
            history: []
        };
        
        // Ingredient price multipliers (dynamic)
        this.ingredientPrices = {};
        this.initializeIngredientPrices();
        
        // Supply/demand state
        this.marketConditions = {
            grains: { supply: 1.0, demand: 1.0 },
            dairy: { supply: 1.0, demand: 1.0 },
            produce: { supply: 1.0, demand: 1.0 }
        };
        
        // Active economic events
        this.activeEvents = [];
        
        // Historical tracking for charts
        this.history = {
            inflation: [],
            ingredientPrices: {},
            demandMultiplier: [],
            revenue: [],
            costs: [],
            profit: [],
            cashBalance: []
        };
        
        // Initialize price history for each ingredient
        Object.keys(GAME_CONFIG.INGREDIENTS).forEach(key => {
            this.history.ingredientPrices[key] = [];
        });
    }
    
    initializeIngredientPrices() {
        Object.keys(GAME_CONFIG.INGREDIENTS).forEach(key => {
            this.ingredientPrices[key] = 1.0; // Start at base price
        });
    }
    
    // Called each new day
    simulateDay(dayNumber) {
        this.day = dayNumber;
        this.dayOfWeek = (dayNumber - 1) % 7;
        this.updateSeason();
        this.updateInflation();
        this.updateSupplyDemand();
        this.processEconomicEvents();
        this.updateIngredientPrices();
        this.recordHistory();
    }
    
    updateSeason() {
        const dayOfYear = this.day % 365;
        if (dayOfYear < 90) this.season = 'WINTER';
        else if (dayOfYear < 180) this.season = 'SPRING';
        else if (dayOfYear < 270) this.season = 'SUMMER';
        else this.season = 'FALL';
    }
    
    updateInflation() {
        const config = GAME_CONFIG.ECONOMY.INFLATION;
        
        // Random walk with momentum
        const change = (Math.random() - 0.5) * 0.002; // ±0.2% daily swing
        this.inflation.trend = this.inflation.trend * config.momentum + change * (1 - config.momentum);
        
        // Apply trend
        this.inflation.current += this.inflation.trend;
        
        // Clamp to bounds
        this.inflation.current = Math.max(config.minRate, Math.min(config.maxRate, this.inflation.current));
        
        // Occasional trend reversals
        if (Math.random() < config.reversalChance) {
            this.inflation.trend *= -0.5;
        }
    }
    
    updateSupplyDemand() {
        const config = GAME_CONFIG.ECONOMY.SUPPLY_DEMAND;
        const seasonal = GAME_CONFIG.ECONOMY.SEASONS[this.season];
        
        // Apply seasonal modifiers and random market fluctuations
        Object.keys(this.marketConditions).forEach(category => {
            const market = this.marketConditions[category];
            const seasonalSupply = seasonal.supplyMod[category] || 1.0;
            
            // Supply trends toward seasonal baseline with noise
            const targetSupply = seasonalSupply + (Math.random() - 0.5) * 0.2;
            market.supply += (targetSupply - market.supply) * config.equilibriumSpeed;
            
            // Demand has its own dynamics
            const targetDemand = 1.0 + (Math.random() - 0.5) * 0.15;
            market.demand += (targetDemand - market.demand) * config.equilibriumSpeed;
            
            // Clamp
            market.supply = Math.max(0.5, Math.min(1.5, market.supply));
            market.demand = Math.max(0.7, Math.min(1.3, market.demand));
        });
    }
    
    processEconomicEvents() {
        // Check for new events
        GAME_CONFIG.ECONOMY.ECONOMIC_EVENTS.forEach(eventDef => {
            if (Math.random() < eventDef.probability) {
                // Don't duplicate active events
                if (!this.activeEvents.find(e => e.id === eventDef.id)) {
                    this.activeEvents.push({
                        ...eventDef,
                        daysRemaining: eventDef.duration
                    });
                }
            }
        });
        
        // Update active events
        this.activeEvents = this.activeEvents.filter(event => {
            event.daysRemaining--;
            return event.daysRemaining > 0;
        });
    }
    
    updateIngredientPrices() {
        const config = GAME_CONFIG.ECONOMY;
        
        Object.keys(GAME_CONFIG.INGREDIENTS).forEach(key => {
            const ingredient = GAME_CONFIG.INGREDIENTS[key];
            let priceMultiplier = 1.0;
            
            // Base inflation
            priceMultiplier *= (1 + this.inflation.current / 365);
            
            // Supply/demand for category
            const category = ingredient.category;
            if (this.marketConditions[category]) {
                const market = this.marketConditions[category];
                const supplyEffect = market.supply < 1.0 ? 
                    (1 - market.supply) * config.SUPPLY_DEMAND.scarcityImpact :
                    (1 - market.supply) * config.SUPPLY_DEMAND.abundanceImpact;
                priceMultiplier *= (1 + supplyEffect);
                
                const demandEffect = (market.demand - 1.0) * 0.1;
                priceMultiplier *= (1 + demandEffect);
            }
            
            // Seasonal effects
            const seasonal = GAME_CONFIG.ECONOMY.SEASONS[this.season];
            const seasonalMod = seasonal.supplyMod[category] || 1.0;
            priceMultiplier *= (2 - seasonalMod); // Inverse (low supply = high price)
            
            // Day of week (delivery days)
            const weekly = GAME_CONFIG.ECONOMY.WEEKLY_PATTERNS;
            if (weekly.deliveryDays.includes(this.dayOfWeek)) {
                priceMultiplier *= (1 - weekly.deliveryDiscount);
            }
            
            // Active events
            this.activeEvents.forEach(event => {
                if (event.effects.ingredients && event.effects.ingredients[key]) {
                    priceMultiplier *= event.effects.ingredients[key];
                }
            });
            
            // Daily noise
            const noise = 1 + (Math.random() - 0.5) * config.RANDOM.dailyVariance;
            priceMultiplier *= noise;
            
            // Smooth transition
            const smoothing = config.RANDOM.smoothing;
            this.ingredientPrices[key] = 
                this.ingredientPrices[key] * smoothing + 
                priceMultiplier * (1 - smoothing);
            
            // Clamp to bounds
            this.ingredientPrices[key] = Math.max(
                config.TRENDS.minMultiplier, 
                Math.min(config.TRENDS.maxMultiplier, this.ingredientPrices[key])
            );
        });
    }
    
    recordHistory() {
        this.history.inflation.push({
            day: this.day,
            rate: this.inflation.current
        });
        
        Object.keys(this.ingredientPrices).forEach(key => {
            this.history.ingredientPrices[key].push({
                day: this.day,
                multiplier: this.ingredientPrices[key]
            });
        });
        
        // Keep last 90 days
        if (this.history.inflation.length > 90) {
            this.history.inflation.shift();
            Object.keys(this.history.ingredientPrices).forEach(key => {
                this.history.ingredientPrices[key].shift();
            });
        }
    }
    
    recordBusinessMetrics(metrics) {
        // Support both object and individual parameters
        const revenue = typeof metrics === 'object' ? metrics.revenue : arguments[0];
        const costs = typeof metrics === 'object' ? metrics.costs : arguments[1];
        const profit = typeof metrics === 'object' ? metrics.profit : arguments[2];
        const cash = typeof metrics === 'object' ? metrics.cash : arguments[3];
        
        this.history.revenue.push({ day: this.day, value: revenue });
        this.history.costs.push({ day: this.day, value: costs });
        this.history.profit.push({ day: this.day, value: profit });
        this.history.cashBalance.push({ day: this.day, value: cash });
        
        // Keep last 90 days
        if (this.history.revenue.length > 90) {
            this.history.revenue.shift();
            this.history.costs.shift();
            this.history.profit.shift();
            this.history.cashBalance.shift();
        }
    }
    
    getIngredientPrice(ingredientKey, vendorKey) {
        const ingredient = GAME_CONFIG.INGREDIENTS[ingredientKey];
        const vendor = GAME_CONFIG.VENDORS[vendorKey];
        
        const basePrice = ingredient.basePrice;
        const vendorMultiplier = vendor.priceMultiplier;
        const economicMultiplier = this.ingredientPrices[ingredientKey];
        
        return basePrice * vendorMultiplier * economicMultiplier;
    }
    
    getDemandMultiplier() {
        const seasonal = GAME_CONFIG.ECONOMY.SEASONS[this.season];
        let multiplier = seasonal.demandMod;
        
        // Active events
        this.activeEvents.forEach(event => {
            if (event.effects.demand) {
                multiplier *= event.effects.demand;
            }
        });
        
        return multiplier;
    }
    
    getActiveEvents() {
        return this.activeEvents.map(e => ({
            name: e.name,
            description: e.description,
            daysRemaining: e.daysRemaining
        }));
    }
    
    getSummary() {
        return {
            day: this.day,
            season: this.season,
            dayOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][this.dayOfWeek],
            inflation: {
                annual: (this.inflation.current * 100).toFixed(2) + '%',
                trend: this.inflation.trend > 0 ? 'Rising' : this.inflation.trend < 0 ? 'Falling' : 'Stable'
            },
            marketConditions: this.marketConditions,
            activeEvents: this.getActiveEvents()
        };
    }
    
    // Backward compatibility with EconomySimulator interface
    getDailyReport(day) {
        const inflationTrend = this.inflation.trend > 0.01 ? '📈 Rising' :
            this.inflation.trend < -0.01 ? '📉 Falling' : '➡️ Stable';
        
        return {
            day: this.day,
            inflation: {
                rate: (this.inflation.current * 100).toFixed(2) + '%',
                trend: inflationTrend,
                index: 1.0, // Simplified for now
                annualRate: (this.inflation.current * 100).toFixed(1) + '% annual'
            },
            supply: {
                grains: this.marketConditions.grains.supply.toFixed(2),
                dairy: this.marketConditions.dairy.supply.toFixed(2),
                produce: this.marketConditions.produce.supply.toFixed(2)
            },
            season: {
                name: this.season,
                emoji: this.getSeasonEmoji()
            },
            demandModifier: this.getDemandMultiplier().toFixed(2),
            activeEvents: this.activeEvents.map(e => ({
                id: e.id,
                name: e.name,
                icon: e.icon || '⚠️',
                daysRemaining: e.daysRemaining
            }))
        };
    }
    
    getSeasonEmoji() {
        const emojis = {
            SPRING: '🌸',
            SUMMER: '☀️',
            FALL: '🍂',
            WINTER: '❄️'
        };
        return emojis[this.season] || '🌍';
    }
    
    getPriceComparison(ingredientKey, currentPrice) {
        const ingredient = GAME_CONFIG.INGREDIENTS[ingredientKey];
        const basePrice = ingredient.basePrice;
        const percentChange = ((currentPrice - basePrice) / basePrice * 100);
        
        let status = 'normal';
        let arrow = '➡️';
        
        if (percentChange < -5) {
            status = 'low';
            arrow = '📉';
        } else if (percentChange > 5) {
            status = 'high';
            arrow = '📈';
        }
        
        return {
            status,
            arrow,
            percentChange: percentChange.toFixed(1)
        };
    }
    
    getCustomerWillingnessMultiplier() {
        let multiplier = 1.0;
        
        // Active events can affect willingness
        this.activeEvents.forEach(event => {
            if (event.effects.willingness) {
                multiplier *= event.effects.willingness;
            }
        });
        
        return multiplier;
    }

    save() {
        // Deep clone to avoid accidental mutations when reloading
        return JSON.parse(JSON.stringify({
            day: this.day,
            season: this.season,
            dayOfWeek: this.dayOfWeek,
            inflation: this.inflation,
            ingredientPrices: this.ingredientPrices,
            marketConditions: this.marketConditions,
            activeEvents: this.activeEvents,
            history: this.history
        }));
    }

    load(snapshot) {
        if (!snapshot) return;

        this.day = snapshot.day || this.day;
        this.season = snapshot.season || this.season;
        this.dayOfWeek = snapshot.dayOfWeek ?? this.dayOfWeek;

        if (snapshot.inflation) {
            this.inflation = { ...this.inflation, ...snapshot.inflation };
        }

        if (snapshot.ingredientPrices) {
            this.ingredientPrices = { ...snapshot.ingredientPrices };
        }

        if (snapshot.marketConditions) {
            this.marketConditions = { ...snapshot.marketConditions };
        }

        if (snapshot.activeEvents) {
            this.activeEvents = [...snapshot.activeEvents];
        }

        if (snapshot.history) {
            this.history = { ...this.history, ...snapshot.history };
        }

        // Ensure history structures exist for each ingredient after loading
        Object.keys(GAME_CONFIG.INGREDIENTS).forEach(key => {
            if (!this.history.ingredientPrices[key]) {
                this.history.ingredientPrices[key] = [];
            }
        });
    }
}

window.EconomicSimulation = EconomicSimulation;
