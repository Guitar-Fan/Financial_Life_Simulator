/**
 * FinancialEngine.js - Core financial simulation engine
 * Handles all money, inventory, and financial calculations
 */

class FinancialEngine {
    constructor() {
        this.cash = GAME_CONFIG.STARTING_CASH;
        this.day = 1;
        this.dayOfWeek = 1;  // 1 = Monday
        this.hour = 6;
        this.minute = 0;
        this.isShopOpen = false;
        this.gameSpeed = 1;
        this.isPaused = false;
        
        // Inventory tracking
        this.ingredients = {};
        this.products = {};
        this.pendingOrders = [];
        
        // Initialize empty inventory
        Object.keys(GAME_CONFIG.INGREDIENTS).forEach(key => {
            this.ingredients[key] = {
                quantity: 0,
                avgCost: 0,
                totalCost: 0,
                expiryDates: []  // Track expiry for FIFO
            };
        });
        
        Object.keys(GAME_CONFIG.RECIPES).forEach(key => {
            this.products[key] = {
                quantity: 0,
                unitCost: 0,
                totalCost: 0,
                bakedToday: 0,
                soldToday: 0
            };
        });
        
        // Financial tracking
        this.dailyStats = {
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            transactions: 0,
            customersServed: 0,
            itemsSold: 0,
            stockouts: 0,
            shrinkage: 0,
            purchasesMade: 0
        };
        
        this.allTimeStats = {
            totalRevenue: 0,
            totalCogs: 0,
            totalShrinkage: 0,
            totalCustomers: 0,
            daysOperated: 0
        };
        
        // History for charts
        this.dailyHistory = [];
        this.maxHistoryDays = 30;
        
        // Production queue
        this.productionQueue = [];
        this.ovenCapacity = 3;  // Items that can bake at once
        
        // Event callbacks
        this.callbacks = {
            onCashChange: [],
            onInventoryChange: [],
            onSale: [],
            onProduction: [],
            onDayEnd: [],
            onTimeChange: []
        };
    }
    
    // ==================== EVENT SYSTEM ====================
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }
    
    // ==================== TIME MANAGEMENT ====================
    update(deltaMs) {
        if (this.isPaused) return;
        
        const deltaSeconds = (deltaMs / 1000) * this.gameSpeed;
        const minutesToAdd = deltaSeconds / GAME_CONFIG.TIME.SECONDS_PER_GAME_MINUTE;
        
        this.minute += minutesToAdd;
        
        while (this.minute >= 60) {
            this.minute -= 60;
            this.hour++;
            this.onHourChange();
        }
        
        if (this.hour >= 24) {
            this.hour = 0;
            this.onDayChange();
        }
        
        // Update production
        this.updateProduction(deltaMs);
        
        this.emit('onTimeChange', this.getTimeData());
    }
    
    onHourChange() {
        // Check for shop open/close
        if (this.hour === GAME_CONFIG.TIME.OPENING_HOUR && !this.isShopOpen) {
            this.isShopOpen = true;
        } else if (this.hour === GAME_CONFIG.TIME.CLOSING_HOUR && this.isShopOpen) {
            this.closeShop();
        }
        
        // Check ingredient expiry
        this.checkExpiry();
    }
    
    onDayChange() {
        // Record daily stats
        this.recordDailyStats();
        
        // Reset daily counters
        this.resetDailyStats();
        
        // Process pending deliveries
        this.processDeliveries();
        
        // Increment day
        this.day++;
        this.dayOfWeek = (this.dayOfWeek % 7) + 1;
        
        // Check product freshness
        this.checkProductFreshness();
        
        this.emit('onDayEnd', { day: this.day });
    }
    
    closeShop() {
        this.isShopOpen = false;
        this.dailyStats.daysOperated = 1;
        
        // Calculate daily summary
        const summary = this.getDailySummary();
        this.emit('onDayEnd', summary);
    }
    
    getTimeData() {
        return {
            day: this.day,
            dayOfWeek: this.dayOfWeek,
            dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][this.dayOfWeek % 7],
            hour: this.hour,
            minute: Math.floor(this.minute),
            timeString: this.formatTime(),
            isOpen: this.isShopOpen,
            progress: (this.hour - 6) / 12  // 0-1 progress through business day
        };
    }
    
    formatTime() {
        const h = this.hour % 12 || 12;
        const m = Math.floor(this.minute).toString().padStart(2, '0');
        const ampm = this.hour < 12 ? 'AM' : 'PM';
        return `${h}:${m} ${ampm}`;
    }
    
    // ==================== PURCHASING ====================
    purchaseIngredients(ingredientKey, quantity, vendor) {
        const ingredient = GAME_CONFIG.INGREDIENTS[ingredientKey];
        const vendorData = GAME_CONFIG.VENDORS[vendor];
        
        if (!ingredient || !vendorData) return { success: false, error: 'Invalid item or vendor' };
        
        // Calculate price with vendor multiplier
        const unitPrice = ingredient.basePrice * vendorData.priceMultiplier;
        const totalCost = unitPrice * quantity;
        
        // Check if can afford
        if (totalCost > this.cash) {
            return { success: false, error: 'Insufficient funds' };
        }
        
        // Deduct cash
        this.cash -= totalCost;
        
        // If immediate delivery (Metro Supply)
        if (vendorData.deliveryDays === 0) {
            this.receiveIngredients(ingredientKey, quantity, unitPrice);
        } else {
            // Schedule delivery
            this.pendingOrders.push({
                ingredientKey,
                quantity,
                unitPrice,
                deliveryDay: this.day + vendorData.deliveryDays,
                vendor: vendorData.name
            });
        }
        
        this.dailyStats.purchasesMade += totalCost;
        this.emit('onCashChange', { cash: this.cash, change: -totalCost });
        
        return { 
            success: true, 
            cost: totalCost,
            deliveryDay: vendorData.deliveryDays === 0 ? 'Now' : `Day ${this.day + vendorData.deliveryDays}`
        };
    }
    
    receiveIngredients(ingredientKey, quantity, unitPrice) {
        const inv = this.ingredients[ingredientKey];
        const ingredient = GAME_CONFIG.INGREDIENTS[ingredientKey];
        
        // Calculate new weighted average cost
        const existingValue = inv.quantity * inv.avgCost;
        const newValue = quantity * unitPrice;
        const newTotal = inv.quantity + quantity;
        
        inv.avgCost = newTotal > 0 ? (existingValue + newValue) / newTotal : unitPrice;
        inv.quantity += quantity;
        inv.totalCost = inv.quantity * inv.avgCost;
        
        // Track expiry (FIFO)
        inv.expiryDates.push({
            quantity,
            expiryDay: this.day + ingredient.shelfLife
        });
        
        this.emit('onInventoryChange', { type: 'ingredient', key: ingredientKey });
    }
    
    processDeliveries() {
        const toDeliver = this.pendingOrders.filter(o => o.deliveryDay <= this.day);
        
        toDeliver.forEach(order => {
            this.receiveIngredients(order.ingredientKey, order.quantity, order.unitPrice);
        });
        
        this.pendingOrders = this.pendingOrders.filter(o => o.deliveryDay > this.day);
    }
    
    getIngredientStock(key) {
        return this.ingredients[key]?.quantity || 0;
    }
    
    // ==================== PRODUCTION ====================
    canBakeRecipe(recipeKey, quantity = 1) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe) return { canBake: false, missing: [] };
        
        const missing = [];
        
        for (const [ingKey, amount] of Object.entries(recipe.ingredients)) {
            const needed = amount * quantity;
            const have = this.ingredients[ingKey]?.quantity || 0;
            
            if (have < needed) {
                missing.push({
                    ingredient: GAME_CONFIG.INGREDIENTS[ingKey].name,
                    needed,
                    have,
                    short: needed - have
                });
            }
        }
        
        // Check packaging
        if (recipe.packaging) {
            const packNeeded = recipe.packagingQty * quantity;
            const packHave = this.ingredients[recipe.packaging]?.quantity || 0;
            
            if (packHave < packNeeded) {
                missing.push({
                    ingredient: GAME_CONFIG.INGREDIENTS[recipe.packaging].name,
                    needed: packNeeded,
                    have: packHave,
                    short: packNeeded - packHave
                });
            }
        }
        
        return { canBake: missing.length === 0, missing };
    }
    
    calculateProductCost(recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe) return 0;
        
        let cost = 0;
        
        for (const [ingKey, amount] of Object.entries(recipe.ingredients)) {
            const avgCost = this.ingredients[ingKey]?.avgCost || GAME_CONFIG.INGREDIENTS[ingKey].basePrice;
            cost += amount * avgCost;
        }
        
        // Add packaging cost
        if (recipe.packaging) {
            const packCost = this.ingredients[recipe.packaging]?.avgCost || GAME_CONFIG.INGREDIENTS[recipe.packaging].basePrice;
            cost += recipe.packagingQty * packCost;
        }
        
        return cost;
    }
    
    startBaking(recipeKey, quantity = 1) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        const { canBake, missing } = this.canBakeRecipe(recipeKey, quantity);
        
        if (!canBake) {
            return { success: false, error: 'Missing ingredients', missing };
        }
        
        // Check oven capacity
        const currentBaking = this.productionQueue.filter(p => p.status === 'baking').length;
        if (currentBaking >= this.ovenCapacity) {
            return { success: false, error: 'Oven full! Wait for current batch.' };
        }
        
        // Consume ingredients (FIFO)
        for (const [ingKey, amount] of Object.entries(recipe.ingredients)) {
            this.consumeIngredient(ingKey, amount * quantity);
        }
        
        // Consume packaging
        if (recipe.packaging) {
            this.consumeIngredient(recipe.packaging, recipe.packagingQty * quantity);
        }
        
        // Calculate unit cost
        const unitCost = this.calculateProductCost(recipeKey);
        
        // Add to production queue
        const item = {
            id: Date.now(),
            recipeKey,
            quantity,
            unitCost,
            status: 'baking',
            progress: 0,
            totalTime: recipe.bakeTime * 1000,  // Convert to ms for animation
            startTime: Date.now()
        };
        
        this.productionQueue.push(item);
        this.emit('onProduction', { action: 'start', item });
        
        return { success: true, item };
    }
    
    consumeIngredient(ingredientKey, amount) {
        const inv = this.ingredients[ingredientKey];
        if (!inv) return;
        
        let remaining = amount;
        
        // Consume from oldest first (FIFO)
        while (remaining > 0 && inv.expiryDates.length > 0) {
            const oldest = inv.expiryDates[0];
            
            if (oldest.quantity <= remaining) {
                remaining -= oldest.quantity;
                inv.expiryDates.shift();
            } else {
                oldest.quantity -= remaining;
                remaining = 0;
            }
        }
        
        inv.quantity -= amount;
        inv.totalCost = inv.quantity * inv.avgCost;
    }
    
    updateProduction(deltaMs) {
        this.productionQueue.forEach(item => {
            if (item.status !== 'baking') return;
            
            item.progress += (deltaMs * this.gameSpeed) / item.totalTime;
            
            if (item.progress >= 1) {
                this.completeProduction(item);
            }
        });
        
        // Remove completed items from queue display after animation
        this.productionQueue = this.productionQueue.filter(
            p => p.status !== 'completed' || Date.now() - p.completedAt < 2000
        );
    }
    
    completeProduction(item) {
        item.status = 'completed';
        item.completedAt = Date.now();
        
        const recipe = GAME_CONFIG.RECIPES[item.recipeKey];
        const product = this.products[item.recipeKey];
        
        // Add to finished products inventory
        product.quantity += item.quantity;
        product.unitCost = item.unitCost;
        product.totalCost += item.unitCost * item.quantity;
        product.bakedToday += item.quantity;
        
        this.emit('onProduction', { action: 'complete', item, recipe });
        this.emit('onInventoryChange', { type: 'product', key: item.recipeKey });
    }
    
    getProductStock(key) {
        return this.products[key]?.quantity || 0;
    }
    
    // ==================== SALES ====================
    simulateCustomer() {
        if (!this.isShopOpen) return null;
        
        // Determine customer type
        const types = Object.entries(GAME_CONFIG.DEMAND.CUSTOMER_TYPES);
        const rand = Math.random();
        let cumulative = 0;
        let customerType = null;
        
        for (const [key, type] of types) {
            cumulative += type.probability;
            if (rand <= cumulative) {
                customerType = { key, ...type };
                break;
            }
        }
        
        if (!customerType) customerType = { key: 'COMMUTER', ...GAME_CONFIG.DEMAND.CUSTOMER_TYPES.COMMUTER };
        
        // Determine what they want to buy
        const availableProducts = this.getAvailableProducts();
        const preferredProducts = availableProducts.filter(p => 
            customerType.preferences.includes(GAME_CONFIG.RECIPES[p.key].category)
        );
        
        const productsToConsider = preferredProducts.length > 0 ? preferredProducts : availableProducts;
        
        if (productsToConsider.length === 0) {
            this.dailyStats.stockouts++;
            return { type: customerType, purchased: [], leftEmpty: true };
        }
        
        // Randomly select items
        const numItems = Math.min(
            Math.ceil(customerType.avgItems * (0.5 + Math.random())),
            productsToConsider.length
        );
        
        const purchased = [];
        const shuffled = [...productsToConsider].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < numItems; i++) {
            const product = shuffled[i % shuffled.length];
            const recipe = GAME_CONFIG.RECIPES[product.key];
            
            if (this.products[product.key].quantity > 0) {
                purchased.push({
                    key: product.key,
                    name: recipe.name,
                    icon: recipe.icon,
                    price: recipe.retailPrice * customerType.priceMultiplier,
                    cost: this.products[product.key].unitCost
                });
            }
        }
        
        if (purchased.length > 0) {
            this.processSale(purchased, customerType);
        }
        
        return { type: customerType, purchased };
    }
    
    processSale(items, customerType) {
        let totalRevenue = 0;
        let totalCogs = 0;
        
        items.forEach(item => {
            // Deduct from inventory
            this.products[item.key].quantity--;
            this.products[item.key].soldToday++;
            
            totalRevenue += item.price;
            totalCogs += item.cost;
        });
        
        // Round to 2 decimals
        totalRevenue = Math.round(totalRevenue * 100) / 100;
        totalCogs = Math.round(totalCogs * 100) / 100;
        
        // Add cash
        this.cash += totalRevenue;
        
        // Update stats
        this.dailyStats.revenue += totalRevenue;
        this.dailyStats.cogs += totalCogs;
        this.dailyStats.grossProfit = this.dailyStats.revenue - this.dailyStats.cogs;
        this.dailyStats.transactions++;
        this.dailyStats.customersServed++;
        this.dailyStats.itemsSold += items.length;
        
        this.emit('onSale', {
            items,
            revenue: totalRevenue,
            cogs: totalCogs,
            profit: totalRevenue - totalCogs,
            customerType
        });
        
        this.emit('onCashChange', { cash: this.cash, change: totalRevenue });
        this.emit('onInventoryChange', { type: 'product' });
    }
    
    getAvailableProducts() {
        return Object.entries(this.products)
            .filter(([key, product]) => product.quantity > 0)
            .map(([key, product]) => ({
                key,
                ...product,
                recipe: GAME_CONFIG.RECIPES[key]
            }));
    }
    
    // ==================== EXPIRY & SHRINKAGE ====================
    checkExpiry() {
        Object.entries(this.ingredients).forEach(([key, inv]) => {
            const expired = inv.expiryDates.filter(e => e.expiryDay <= this.day);
            
            expired.forEach(e => {
                const lostValue = e.quantity * inv.avgCost;
                this.dailyStats.shrinkage += lostValue;
                inv.quantity -= e.quantity;
            });
            
            inv.expiryDates = inv.expiryDates.filter(e => e.expiryDay > this.day);
        });
    }
    
    checkProductFreshness() {
        // Products lose freshness - simplified: 50% of products spoil after shelf life
        // In real implementation, would track bake dates
        Object.entries(this.products).forEach(([key, product]) => {
            const recipe = GAME_CONFIG.RECIPES[key];
            if (product.quantity > 0) {
                // Spoil a portion based on shelf life (simplified)
                const spoilRate = 1 / recipe.shelfLife;
                const spoiled = Math.floor(product.quantity * spoilRate * 0.3);
                
                if (spoiled > 0) {
                    const lostValue = spoiled * product.unitCost;
                    this.dailyStats.shrinkage += lostValue;
                    product.quantity -= spoiled;
                }
            }
        });
    }
    
    // ==================== STATISTICS & REPORTING ====================
    resetDailyStats() {
        this.dailyStats = {
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            transactions: 0,
            customersServed: 0,
            itemsSold: 0,
            stockouts: 0,
            shrinkage: 0,
            purchasesMade: 0
        };
        
        // Reset product daily counters
        Object.values(this.products).forEach(p => {
            p.bakedToday = 0;
            p.soldToday = 0;
        });
    }
    
    recordDailyStats() {
        const record = {
            day: this.day,
            ...this.dailyStats,
            cash: this.cash
        };
        
        this.dailyHistory.push(record);
        
        // Keep only recent history
        if (this.dailyHistory.length > this.maxHistoryDays) {
            this.dailyHistory.shift();
        }
        
        // Update all-time stats
        this.allTimeStats.totalRevenue += this.dailyStats.revenue;
        this.allTimeStats.totalCogs += this.dailyStats.cogs;
        this.allTimeStats.totalShrinkage += this.dailyStats.shrinkage;
        this.allTimeStats.totalCustomers += this.dailyStats.customersServed;
        this.allTimeStats.daysOperated++;
    }
    
    getDailySummary() {
        const grossMargin = this.dailyStats.revenue > 0 
            ? (this.dailyStats.grossProfit / this.dailyStats.revenue * 100).toFixed(1)
            : 0;
            
        const avgTicket = this.dailyStats.transactions > 0
            ? (this.dailyStats.revenue / this.dailyStats.transactions).toFixed(2)
            : 0;
        
        return {
            day: this.day,
            revenue: this.dailyStats.revenue,
            cogs: this.dailyStats.cogs,
            grossProfit: this.dailyStats.grossProfit,
            grossMargin: parseFloat(grossMargin),
            transactions: this.dailyStats.transactions,
            customersServed: this.dailyStats.customersServed,
            itemsSold: this.dailyStats.itemsSold,
            avgTicket: parseFloat(avgTicket),
            stockouts: this.dailyStats.stockouts,
            shrinkage: this.dailyStats.shrinkage,
            cash: this.cash
        };
    }
    
    getInventoryValue() {
        let ingredientValue = 0;
        let productValue = 0;
        
        Object.values(this.ingredients).forEach(inv => {
            ingredientValue += inv.quantity * inv.avgCost;
        });
        
        Object.entries(this.products).forEach(([key, product]) => {
            productValue += product.quantity * GAME_CONFIG.RECIPES[key].retailPrice;
        });
        
        return { ingredients: ingredientValue, products: productValue, total: ingredientValue + productValue };
    }
    
    getFinancialMetrics() {
        const inventoryValue = this.getInventoryValue();
        const avgDailyRevenue = this.allTimeStats.daysOperated > 0
            ? this.allTimeStats.totalRevenue / this.allTimeStats.daysOperated
            : 0;
        
        const grossMarginPct = this.allTimeStats.totalRevenue > 0
            ? ((this.allTimeStats.totalRevenue - this.allTimeStats.totalCogs) / this.allTimeStats.totalRevenue * 100)
            : 0;
            
        const shrinkageRate = this.allTimeStats.totalCogs > 0
            ? (this.allTimeStats.totalShrinkage / this.allTimeStats.totalCogs * 100)
            : 0;
        
        return {
            cash: this.cash,
            inventoryValue: inventoryValue.total,
            totalAssets: this.cash + inventoryValue.total,
            avgDailyRevenue: avgDailyRevenue.toFixed(2),
            grossMarginPct: grossMarginPct.toFixed(1),
            shrinkageRate: shrinkageRate.toFixed(1),
            totalRevenue: this.allTimeStats.totalRevenue,
            totalProfit: this.allTimeStats.totalRevenue - this.allTimeStats.totalCogs,
            customersToDate: this.allTimeStats.totalCustomers
        };
    }
    
    // ==================== GAME STATE ====================
    save() {
        return JSON.stringify({
            cash: this.cash,
            day: this.day,
            dayOfWeek: this.dayOfWeek,
            hour: this.hour,
            minute: this.minute,
            ingredients: this.ingredients,
            products: this.products,
            pendingOrders: this.pendingOrders,
            dailyStats: this.dailyStats,
            allTimeStats: this.allTimeStats,
            dailyHistory: this.dailyHistory
        });
    }
    
    load(saveData) {
        const data = JSON.parse(saveData);
        Object.assign(this, data);
    }
}

// Make globally available
window.FinancialEngine = FinancialEngine;
