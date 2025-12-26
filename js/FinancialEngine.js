/**
 * FinancialEngine.js - Core financial simulation engine
 */

class FinancialEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.cash = GAME_CONFIG.STARTING_CASH;
        this.day = 1;
        this.hour = GAME_CONFIG.TIME.OPENING_HOUR;
        this.minute = 0;
        this.isPaused = true;
        this.gameSpeed = 1;

        // Initialize inventory with batch tracking for quality
        this.ingredients = {};
        Object.keys(GAME_CONFIG.INGREDIENTS).forEach(key => {
            this.ingredients[key] = {
                batches: [],  // Array of { quantity, quality, purchaseDay, vendorQuality }
                totalCost: 0
            };
        });

        // Products with freshness tracking
        this.products = {};
        Object.keys(GAME_CONFIG.RECIPES).forEach(key => {
            this.products[key] = {
                batches: [],  // Array of { quantity, quality, bakeDay, ingredientQuality }
                soldToday: 0
            };
        });

        // Production
        this.productionQueue = [];
        this.ovenCapacity = 2;
        this.bakingSpeedMultiplier = 1.0;
        this.trafficMultiplier = 1.0;
        this.rentAmount = GAME_CONFIG.DAILY_EXPENSES.rent.amount;

        // Prepared items (par-baked, frozen dough)
        this.preparedItems = [];

        // Economic simulation engine
        this.economy = new EconomySimulator();
        this.lastEconomyDay = 0;  // Track when we last simulated economy
        this.economyReport = null;  // Latest economy report

        // Daily stats
        this.dailyStats = {
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            customersServed: 0,
            customersMissed: 0,
            itemsSold: 0
        };

        // All time stats
        this.allTimeStats = {
            totalRevenue: 0,
            totalCogs: 0,
            totalExpenses: 0,
            totalCustomers: 0,
            daysOperated: 0
        };

        // Event callbacks
        this.callbacks = {};
    }

    on(event, callback) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(callback);
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }

    // ==================== PURCHASING ====================
    purchaseIngredient(ingredientKey, quantity, vendor) {
        const ingredient = GAME_CONFIG.INGREDIENTS[ingredientKey];
        const vendorData = GAME_CONFIG.VENDORS[vendor];

        // Use dynamic pricing from economy simulator
        const unitPrice = this.economy.getIngredientPrice(ingredientKey, vendor, quantity, this.day);
        const totalCost = unitPrice * quantity;

        if (this.cash < totalCost) {
            return { success: false, message: 'Not enough cash!' };
        }

        this.cash -= totalCost;

        // Calculate starting quality based on vendor
        const vendorQualityMult = vendorData?.qualityMultiplier || 1.0;
        const startingQuality = Math.min(100, ingredient.baseQuality * vendorQualityMult);

        // Add batch with quality tracking
        this.ingredients[ingredientKey].batches.push({
            quantity: quantity,
            quality: startingQuality,
            purchaseDay: this.day,
            vendor: vendor,
            unitCost: unitPrice
        });
        this.ingredients[ingredientKey].totalCost += totalCost;

        // Get price comparison for feedback
        const priceComparison = this.economy.getPriceComparison(ingredientKey, unitPrice);

        this.emit('purchase', { ingredient: ingredientKey, quantity, cost: totalCost, quality: startingQuality, priceComparison });
        return {
            success: true,
            message: `Purchased ${quantity} ${ingredient.unit} of ${ingredient.name}`,
            quality: startingQuality,
            unitPrice,
            priceComparison
        };
    }

    // Get current dynamic price for an ingredient
    getCurrentIngredientPrice(ingredientKey, vendorKey, quantity = 1) {
        return this.economy.getIngredientPrice(ingredientKey, vendorKey, quantity, this.day);
    }

    // ==================== CUSTOMER SEGMENTS ====================
    selectCustomerSegment() {
        const segments = GAME_CONFIG.CUSTOMER_SEGMENTS;
        if (!segments) {
            return { key: 'REGULAR', name: 'Regular Customer', icon: '😊', priceMultiplier: 1.0, qualityTolerance: 0.8 };
        }

        const rand = Math.random();
        let cumulative = 0;

        for (const [key, segment] of Object.entries(segments)) {
            cumulative += segment.weight;
            if (rand <= cumulative) {
                return { key, ...segment };
            }
        }

        // Default fallback
        return { key: 'REGULAR', ...segments.REGULAR };
    }

    // Check if customer will buy at current price given their segment
    willCustomerBuy(recipeKey, segment, currentPrice) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe) return false;

        const referencePrice = recipe.retailPrice;
        const quality = this.getProductQuality(recipeKey);

        // Quality bonus - higher quality increases willingness to pay
        const qualityBonus = (quality / 100) * (segment.qualityTolerance || 0.8);

        // Maximum price this customer segment will pay
        const maxWillingPrice = referencePrice * (segment.priceMultiplier || 1.0) * (0.8 + qualityBonus * 0.4);

        // Apply event-based willingness modifier
        const willingnessMultiplier = this.economy.getCustomerWillingnessMultiplier();

        return currentPrice <= maxWillingPrice * willingnessMultiplier;
    }

    getIngredientStock(key) {
        const ingredient = this.ingredients[key];
        if (!ingredient || !ingredient.batches) return 0;
        return ingredient.batches.reduce((sum, b) => sum + b.quantity, 0);
    }

    // Get the average quality of an ingredient across all batches
    getIngredientQuality(key) {
        const ingredient = this.ingredients[key];
        if (!ingredient || !ingredient.batches || ingredient.batches.length === 0) return 0;

        let totalQty = 0;
        let weightedQuality = 0;
        ingredient.batches.forEach(batch => {
            weightedQuality += batch.quality * batch.quantity;
            totalQty += batch.quantity;
        });

        return totalQty > 0 ? weightedQuality / totalQty : 0;
    }

    // Get quality label based on percentage
    getQualityLabel(quality) {
        if (quality >= GAME_CONFIG.QUALITY.FRESH) return { label: 'Fresh', color: '#2ECC71', emoji: '✨' };
        if (quality >= GAME_CONFIG.QUALITY.GOOD) return { label: 'Good', color: '#F39C12', emoji: '👍' };
        if (quality >= GAME_CONFIG.QUALITY.ACCEPTABLE) return { label: 'Acceptable', color: '#E67E22', emoji: '😐' };
        if (quality >= GAME_CONFIG.QUALITY.STALE) return { label: 'Stale', color: '#E74C3C', emoji: '👎' };
        return { label: 'Spoiled', color: '#8E44AD', emoji: '🤢' };
    }

    // Update ingredient quality at end of day
    updateIngredientQuality() {
        const spoiled = [];

        Object.entries(this.ingredients).forEach(([key, ingredient]) => {
            const config = GAME_CONFIG.INGREDIENTS[key];

            ingredient.batches = ingredient.batches.filter(batch => {
                // Decay quality based on ingredient's decay rate
                batch.quality -= config.decayRate;

                // Check if spoiled
                if (batch.quality <= 0) {
                    spoiled.push({ ingredient: key, name: config.name, quantity: batch.quantity });
                    return false;
                }
                return true;
            });
        });

        return spoiled;
    }

    // ==================== PRODUCTION ====================
    canBakeRecipe(recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe) return { canBake: false, missing: [] };

        const missing = [];
        for (const [ingKey, needed] of Object.entries(recipe.ingredients)) {
            const have = this.getIngredientStock(ingKey);
            // Only count ingredients above spoiled threshold
            const usableQty = this.getUsableIngredientStock(ingKey);
            if (usableQty < needed) {
                const ing = GAME_CONFIG.INGREDIENTS[ingKey];
                missing.push({
                    ingredient: ing?.name || ingKey,
                    needed: needed,
                    have: usableQty,
                    quality: this.getIngredientQuality(ingKey).toFixed(0)
                });
            }
        }

        return { canBake: missing.length === 0, missing };
    }

    // Get usable stock (not spoiled)
    getUsableIngredientStock(key) {
        const ingredient = this.ingredients[key];
        if (!ingredient || !ingredient.batches) return 0;
        return ingredient.batches
            .filter(b => b.quality >= GAME_CONFIG.QUALITY.STALE)
            .reduce((sum, b) => sum + b.quantity, 0);
    }

    calculateProductCost(recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe) return 0;

        let cost = 0;
        for (const [ingKey, amount] of Object.entries(recipe.ingredients)) {
            const ing = GAME_CONFIG.INGREDIENTS[ingKey];
            if (ing) {
                cost += ing.basePrice * amount;
            }
        }
        return cost;
    }

    // Calculate expected quality of product based on ingredient quality
    calculateProductQuality(recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe) return 100;

        let totalWeight = 0;
        let weightedQuality = 0;

        for (const [ingKey, amount] of Object.entries(recipe.ingredients)) {
            const quality = this.getIngredientQuality(ingKey);
            weightedQuality += quality * amount;
            totalWeight += amount;
        }

        return totalWeight > 0 ? weightedQuality / totalWeight : 100;
    }

    // Consume ingredients using FIFO (oldest first)
    consumeIngredients(recipeKey, quantity = 1) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        let avgQuality = 0;
        let totalAmount = 0;
        let totalCost = 0;

        for (const [ingKey, amountNeeded] of Object.entries(recipe.ingredients)) {
            let remaining = amountNeeded * quantity;
            const batches = this.ingredients[ingKey].batches;

            // Sort by purchase day (oldest first) then by quality (lowest first)
            batches.sort((a, b) => a.purchaseDay - b.purchaseDay || a.quality - b.quality);

            while (remaining > 0 && batches.length > 0) {
                const batch = batches[0];

                // Skip spoiled ingredients
                if (batch.quality < GAME_CONFIG.QUALITY.STALE) {
                    batches.shift();
                    continue;
                }

                const useAmount = Math.min(batch.quantity, remaining);
                avgQuality += batch.quality * useAmount;
                totalAmount += useAmount;
                totalCost += batch.unitCost * useAmount;

                batch.quantity -= useAmount;
                remaining -= useAmount;

                if (batch.quantity <= 0) {
                    batches.shift();
                }
            }
        }

        return {
            avgQuality: totalAmount > 0 ? avgQuality / totalAmount : 100,
            totalCost
        };
    }

    startBaking(recipeKey, quantity = 1) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        const { canBake, missing } = this.canBakeRecipe(recipeKey);

        if (!canBake) {
            return { success: false, message: 'Missing ingredients!', missing };
        }

        // Check oven capacity
        const activeBaking = this.productionQueue.filter(p => p.status === 'baking').length;
        if (activeBaking >= this.ovenCapacity) {
            return { success: false, message: 'Oven is full! Wait for items to finish.' };
        }

        // Consume ingredients and get quality info
        const { avgQuality, totalCost } = this.consumeIngredients(recipeKey, quantity);

        // Add to queue with ingredient quality info
        const productionItem = {
            id: Date.now(),
            recipeKey,
            recipeName: recipe.name,
            recipeIcon: recipe.icon,
            quantity,
            status: 'baking',
            progress: 0,
            totalTime: recipe.bakeTime * 60 * 1000 / 10, // Faster for gameplay
            startTime: Date.now(),
            unitCost: totalCost / quantity,
            ingredientQuality: avgQuality  // Track quality of ingredients used
        };

        this.productionQueue.push(productionItem);
        this.emit('baking_started', productionItem);

        const qualityLabel = this.getQualityLabel(avgQuality);
        return {
            success: true,
            message: `Started baking ${quantity}x ${recipe.name}! ${qualityLabel.emoji} ${qualityLabel.label} ingredients`,
            item: productionItem,
            ingredientQuality: avgQuality
        };
    }

    updateProduction(deltaMs) {
        const completed = [];

        this.productionQueue.forEach(item => {
            if (item.status === 'baking') {
                item.progress += deltaMs;

                if (item.progress >= item.totalTime) {
                    item.status = 'complete';

                    // Add to products as a batch with quality
                    this.products[item.recipeKey].batches.push({
                        quantity: item.quantity,
                        quality: item.ingredientQuality || 100,  // Product starts with ingredient quality
                        bakeDay: this.day,
                        unitCost: item.unitCost
                    });

                    completed.push(item);
                }
            }
        });

        // Remove completed
        this.productionQueue = this.productionQueue.filter(p => p.status === 'baking');

        completed.forEach(item => {
            this.emit('baking_complete', item);
        });

        return completed;
    }

    getProductStock(recipeKey) {
        const product = this.products[recipeKey];
        if (!product || !product.batches) return 0;
        return product.batches.reduce((sum, b) => sum + b.quantity, 0);
    }

    getProductQuality(recipeKey) {
        const product = this.products[recipeKey];
        if (!product || !product.batches || product.batches.length === 0) return 0;

        let totalQty = 0;
        let weightedQuality = 0;
        product.batches.forEach(batch => {
            weightedQuality += batch.quality * batch.quantity;
            totalQty += batch.quantity;
        });

        return totalQty > 0 ? weightedQuality / totalQty : 0;
    }

    // Update product quality at end of day
    updateProductQuality() {
        const stale = [];

        Object.entries(this.products).forEach(([key, product]) => {
            const config = GAME_CONFIG.RECIPES[key];

            product.batches = product.batches.filter(batch => {
                // Decay quality based on product's decay rate
                batch.quality -= config.decayRate;

                // Track stale items
                if (batch.quality < GAME_CONFIG.QUALITY.STALE && batch.quality > 0) {
                    stale.push({ product: key, name: config.name, quantity: batch.quantity, quality: batch.quality });
                }

                // Remove spoiled items
                if (batch.quality <= 0) {
                    return false;
                }
                return true;
            });
        });

        return stale;
    }

    // Get price multiplier based on product quality
    getQualityPriceMultiplier(quality) {
        if (quality >= GAME_CONFIG.QUALITY.FRESH) return 1.0;      // Full price
        if (quality >= GAME_CONFIG.QUALITY.GOOD) return 0.90;      // 90% price
        if (quality >= GAME_CONFIG.QUALITY.ACCEPTABLE) return 0.75; // 75% price
        if (quality >= GAME_CONFIG.QUALITY.STALE) return 0.50;     // 50% price
        return 0;  // Spoiled - cannot sell
    }

    getTotalProductsAvailable() {
        let total = 0;
        Object.keys(this.products).forEach(key => {
            total += this.getProductStock(key);
        });
        return total;
    }

    // ==================== SALES ====================
    processSale(recipeKey, quantity = 1) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        const product = this.products[recipeKey];
        const stock = this.getProductStock(recipeKey);

        if (!product || stock < quantity) {
            return { success: false, message: 'Not enough stock!' };
        }

        // Sell from oldest batch first (FIFO) and calculate quality-adjusted price
        let remaining = quantity;
        let totalRevenue = 0;
        let totalCogs = 0;
        let avgQuality = 0;
        let soldQty = 0;

        // Sort batches by bake day (oldest first)
        product.batches.sort((a, b) => a.bakeDay - b.bakeDay);

        while (remaining > 0 && product.batches.length > 0) {
            const batch = product.batches[0];
            const sellAmount = Math.min(batch.quantity, remaining);

            // Quality-adjusted pricing
            const priceMultiplier = this.getQualityPriceMultiplier(batch.quality);
            const unitRevenue = recipe.retailPrice * priceMultiplier;

            totalRevenue += unitRevenue * sellAmount;
            totalCogs += batch.unitCost * sellAmount;
            avgQuality += batch.quality * sellAmount;
            soldQty += sellAmount;

            batch.quantity -= sellAmount;
            remaining -= sellAmount;

            if (batch.quantity <= 0) {
                product.batches.shift();
            }
        }

        avgQuality = soldQty > 0 ? avgQuality / soldQty : 100;
        const profit = totalRevenue - totalCogs;

        this.cash += totalRevenue;
        product.soldToday += quantity;

        this.dailyStats.revenue += totalRevenue;
        this.dailyStats.cogs += totalCogs;
        this.dailyStats.grossProfit += profit;
        this.dailyStats.itemsSold += quantity;
        this.dailyStats.customersServed++;

        this.allTimeStats.totalRevenue += totalRevenue;
        this.allTimeStats.totalCogs += totalCogs;
        this.allTimeStats.totalCustomers++;

        const qualityLabel = this.getQualityLabel(avgQuality);
        this.emit('sale', { recipe, quantity, revenue: totalRevenue, profit, quality: avgQuality });

        return {
            success: true,
            revenue: totalRevenue,
            profit,
            quality: avgQuality,
            qualityLabel: qualityLabel.label,
            priceMultiplier: this.getQualityPriceMultiplier(avgQuality)
        };
    }

    missedCustomer() {
        this.dailyStats.customersMissed++;
    }

    // ==================== EXPENSES ====================
    payDailyExpenses() {
        let totalExpenses = 0;
        const expenses = [];

        Object.entries(GAME_CONFIG.DAILY_EXPENSES).forEach(([key, expense]) => {
            let amount = expense.amount;
            if (key === 'rent') amount = this.rentAmount;

            totalExpenses += amount;
            expenses.push({ ...expense, amount, key });
        });

        this.cash -= totalExpenses;
        this.allTimeStats.totalExpenses += totalExpenses;

        return { total: totalExpenses, expenses };
    }

    // ==================== DAY MANAGEMENT ====================
    endDay() {
        const expenseResult = this.payDailyExpenses();

        // Update quality of ingredients and products (decay overnight)
        const spoiledIngredients = this.updateIngredientQuality();
        const staleProducts = this.updateProductQuality();

        const summary = {
            day: this.day,
            revenue: this.dailyStats.revenue,
            cogs: this.dailyStats.cogs,
            grossProfit: this.dailyStats.grossProfit,
            expenses: expenseResult.total,
            expenseDetails: expenseResult.expenses,
            netProfit: this.dailyStats.grossProfit - expenseResult.total,
            customersServed: this.dailyStats.customersServed,
            customersMissed: this.dailyStats.customersMissed,
            itemsSold: this.dailyStats.itemsSold,
            cashEnd: this.cash,
            spoiledIngredients: spoiledIngredients,  // Items that went bad
            staleProducts: staleProducts,            // Products losing freshness
            economyReport: this.economy.simulateDay(this.day) // Run economy sim
        };

        this.allTimeStats.daysOperated++;

        // Reset daily stats
        this.dailyStats = {
            revenue: 0, cogs: 0, grossProfit: 0,
            customersServed: 0, customersMissed: 0, itemsSold: 0
        };

        // Reset sold today
        Object.values(this.products).forEach(p => p.soldToday = 0);

        // Next day
        this.day++;
        this.hour = GAME_CONFIG.TIME.OPENING_HOUR;
        this.minute = 0;

        this.emit('day_end', summary);
        return summary;
    }

    // ==================== TIME ====================
    update(deltaMs) {
        if (this.isPaused) return;

        const deltaSeconds = (deltaMs / 1000) * this.gameSpeed;
        const minutesToAdd = deltaSeconds / GAME_CONFIG.TIME.SECONDS_PER_GAME_MINUTE;

        this.minute += minutesToAdd;

        while (this.minute >= 60) {
            this.minute -= 60;
            this.hour++;
            this.emit('hour_change', { hour: this.hour });
        }

        // Update production
        this.updateProduction(deltaMs * this.gameSpeed);
    }

    getTimeString() {
        const h = Math.floor(this.hour);
        const m = Math.floor(this.minute);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    isClosingTime() {
        return this.hour >= GAME_CONFIG.TIME.CLOSING_HOUR;
    }

    // ==================== METRICS ====================
    getFinancialMetrics() {
        return {
            cash: this.cash,
            dailyRevenue: this.dailyStats.revenue,
            dailyProfit: this.dailyStats.grossProfit,
            dailyCogs: this.dailyStats.cogs,
            grossMargin: this.dailyStats.revenue > 0
                ? ((this.dailyStats.grossProfit / this.dailyStats.revenue) * 100).toFixed(1)
                : '0.0',
            customersToday: this.dailyStats.customersServed,
            missedToday: this.dailyStats.customersMissed
        };
    }

    // ==================== SAVE/LOAD ====================
    save() {
        return {
            cash: this.cash,
            day: this.day,
            ingredients: this.ingredients,
            products: this.products,
            allTimeStats: this.allTimeStats,
            economy: this.economy.save()
        };
    }

    load(data) {
        if (data.cash !== undefined) this.cash = data.cash;
        if (data.day !== undefined) this.day = data.day;
        if (data.ingredients) this.ingredients = data.ingredients;
        if (data.products) this.products = data.products;
        if (data.allTimeStats) this.allTimeStats = data.allTimeStats;
        if (data.economy) this.economy.load(data.economy);
    }
}

window.FinancialEngine = FinancialEngine;
