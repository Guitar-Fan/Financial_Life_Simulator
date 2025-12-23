/**
 * Economic_Simulation_Core.js
 * 
 * Orchestrates all game systems and manages the economic simulation loop.
 * Handles customer generation, sales processing, shrinkage detection,
 * and financial event triggers.
 */

class EconomicSimulationCore {
    constructor(gameState, ledger, costing, supplyChain) {
        this.gameState = gameState;
        this.ledger = ledger;
        this.costing = costing;
        this.supplyChain = supplyChain;
        
        // Customer simulation
        this.customerSpawnAccumulator = 0;
        this.customersToday = 0;
        
        // Track last update
        this.lastHourCheck = gameState.currentHour;
        this.lastDayCheck = gameState.currentDay;
        
        // Event callbacks for visual system
        this.eventCallbacks = {
            'customer-purchase': [],
            'production-complete': [],
            'shrinkage-detected': []
        };
        
        // Set up state change listener
        this.gameState.onStateChange((newState, oldState) => {
            this.handleStateChange(newState, oldState);
        });
    }
    
    /**
     * Register event callback
     */
    on(eventName, callback) {
        if (this.eventCallbacks[eventName]) {
            this.eventCallbacks[eventName].push(callback);
        }
    }
    
    /**
     * Emit event to all listeners
     */
    emit(eventName, data) {
        if (this.eventCallbacks[eventName]) {
            this.eventCallbacks[eventName].forEach(callback => callback(data));
        }
    }
    
    /**
     * Main update loop (called every frame)
     */
    update(deltaTimeSeconds) {
        // Only simulate during SALES_FLOOR state
        if (this.gameState.currentState !== this.gameState.STATES.SALES_FLOOR) {
            return;
        }
        
        // Check for hour changes
        if (this.gameState.currentHour !== this.lastHourCheck) {
            this.onHourChange();
            this.lastHourCheck = this.gameState.currentHour;
        }
        
        // Check for day changes
        if (this.gameState.currentDay !== this.lastDayCheck) {
            this.onDayChange();
            this.lastDayCheck = this.gameState.currentDay;
        }
        
        // Simulate customer arrivals and purchases
        this.simulateCustomers(deltaTimeSeconds);
        
        // Update inventory history for KPIs
        this.updateFinancialMetrics();
    }
    
    /**
     * Handle state changes
     */
    handleStateChange(newState, oldState) {
        if (newState === this.gameState.STATES.SALES_FLOOR) {
            // Opening shop
            this.customersToday = 0;
            console.log(`Shop opened on Day ${this.gameState.currentDay}`);
        }
        
        if (oldState === this.gameState.STATES.SALES_FLOOR && 
            newState === this.gameState.STATES.DAY_SUMMARY) {
            // Shop closed - process end of day
            this.processEndOfDay();
        }
        
        if (newState === this.gameState.STATES.PURCHASING) {
            // Start of new day - process deliveries
            this.processDeliveries();
        }
    }
    
    /**
     * Called every hour during sales floor
     */
    onHourChange() {
        console.log(`Hour ${this.gameState.currentHour}:00`);
        
        // Check for expired inventory
        this.checkShrinkage();
        
        // Update inventory metrics
        this.ledger.updateInventoryHistory();
    }
    
    /**
     * Called when day changes
     */
    onDayChange() {
        console.log(`Day ${this.gameState.currentDay} started`);
        
        // Check for month end
        if (this.gameState.getDayOfMonth() === 1 && this.gameState.currentDay > 1) {
            this.processMonthEnd();
        }
        
        // Set transaction day
        this.ledger.setTransactionDay(this.gameState.currentDay);
    }
    
    /**
     * Simulate customer arrivals and purchases
     */
    simulateCustomers(deltaTimeSeconds) {
        // Get demand rate for current hour
        const currentHour = this.gameState.currentHour;
        const hourDemandRate = REALISTIC_PARAMETERS.DEMAND.TIME_OF_DAY[currentHour] || 0;
        
        if (hourDemandRate === 0) return;
        
        // Get day of week multiplier
        const dayOfWeek = this.gameState.currentDayOfWeek;
        const dayMultiplier = REALISTIC_PARAMETERS.DEMAND.DAY_OF_WEEK[dayOfWeek] || 1;
        
        // Calculate customers per second for this hour
        const baseCustomersPerDay = REALISTIC_PARAMETERS.DEMAND.BASE_CUSTOMERS_PER_DAY;
        const customersThisHour = baseCustomersPerDay * hourDemandRate * dayMultiplier;
        const customersPerSecond = customersThisHour / 3600; // Spread across hour
        
        // Accumulate customer arrivals
        this.customerSpawnAccumulator += customersPerSecond * deltaTimeSeconds;
        
        // Spawn customers when accumulator reaches 1
        while (this.customerSpawnAccumulator >= 1) {
            this.spawnCustomer();
            this.customerSpawnAccumulator -= 1;
        }
    }
    
    /**
     * Spawn a customer and process their purchase
     */
    spawnCustomer() {
        this.customersToday++;
        
        // Determine how many items they'll buy (1-3)
        const itemsToBuy = Math.floor(Math.random() * 3) + 1;
        
        // Get available products
        const availableProducts = this.getAvailableProducts();
        
        if (availableProducts.length === 0) {
            console.log('Customer left - no products available (STOCKOUT)');
            return;
        }
        
        // Purchase items
        for (let i = 0; i < itemsToBuy; i++) {
            // Select random product weighted by category preference
            const product = this.selectRandomProduct(availableProducts);
            
            if (product) {
                this.processPurchase(product);
            }
        }
    }
    
    /**
     * Get available products from inventory
     */
    getAvailableProducts() {
        const products = [];
        
        for (const [recipeKey, recipe] of Object.entries(REALISTIC_PARAMETERS.RECIPES)) {
            const quantity = this.costing.getProductQuantity(recipeKey);
            if (quantity > 0) {
                products.push({
                    key: recipeKey,
                    name: recipe.name,
                    price: recipe.retailPrice,
                    category: recipe.category,
                    quantity: quantity
                });
            }
        }
        
        return products;
    }
    
    /**
     * Select random product weighted by category preferences
     */
    selectRandomProduct(availableProducts) {
        if (availableProducts.length === 0) return null;
        
        // Simple random selection for now
        const index = Math.floor(Math.random() * availableProducts.length);
        return availableProducts[index];
    }
    
    /**
     * Process a customer purchase
     */
    processPurchase(product) {
        // Get COGS using FIFO
        const cogs = this.costing.sellProduct(product.key, 1);
        
        if (cogs === null) {
            console.log(`Failed to sell ${product.name} - insufficient inventory`);
            return;
        }
        
        // Record sale in ledger
        this.ledger.recordSale(product.name, product.price, cogs);
        
        const profit = product.price - cogs;
        console.log(`Sold ${product.name}: $${product.price} (COGS: $${cogs.toFixed(2)}, Profit: $${profit.toFixed(2)})`);
        
        // Emit event for visual system
        this.emit('customer-purchase', {
            product: product.name,
            price: product.price,
            cogs: cogs,
            profit: profit,
            revenue: product.price
        });
    }
    
    /**
     * Check for expired inventory (shrinkage)
     */
    checkShrinkage() {
        const currentDay = this.gameState.currentDay;
        const expired = this.costing.checkExpired(currentDay);
        
        let totalShrinkage = 0;
        
        // Process expired ingredients
        for (const item of expired.ingredients) {
            this.ledger.writeOffShrinkage(item.cogsValue, item.name);
            totalShrinkage += item.cogsValue;
            console.log(`SHRINKAGE: ${item.name} x${item.quantity} - Lost $${item.cogsValue.toFixed(2)}`);
        }
        
        // Process expired products
        for (const item of expired.products) {
            this.ledger.writeOffShrinkage(item.cogsValue, item.name);
            totalShrinkage += item.cogsValue;
            console.log(`SHRINKAGE: ${item.name} x${item.quantity} - Lost $${item.cogsValue.toFixed(2)}`);
        }
        
        if (totalShrinkage > 0) {
            console.log(`Total shrinkage this hour: $${totalShrinkage.toFixed(2)}`);
        }
    }
    
    /**
     * Process deliveries
     */
    processDeliveries() {
        const deliveries = this.supplyChain.processDeliveries(
            this.gameState.currentDay,
            this.costing
        );
        
        if (deliveries.length > 0) {
            console.log(`${deliveries.length} delivery(ies) received today!`);
            
            // Update inventory value in ledger
            this.ledger.inventoryValue = this.costing.getTotalInventoryValue();
        }
    }
    
    /**
     * Process end of day
     */
    processEndOfDay() {
        console.log(`Day ${this.gameState.currentDay} ended`);
        console.log(`Total customers today: ${this.customersToday}`);
        
        // Set transaction day for all recent transactions
        this.ledger.setTransactionDay(this.gameState.currentDay);
        
        // Check for bankruptcy
        if (this.ledger.isBankrupt()) {
            console.log('BANKRUPTCY - GAME OVER');
            this.gameState.setState(this.gameState.STATES.GAME_OVER);
            this.showGameOver('Bankruptcy - Net worth below $5,000');
            return;
        }
        
        // Check inventory value sync
        this.ledger.inventoryValue = this.costing.getTotalInventoryValue();
    }
    
    /**
     * Process month end
     */
    processMonthEnd() {
        console.log(`Month ${this.gameState.getCurrentMonth()} ended`);
        
        // Deduct monthly expenses
        this.ledger.deductMonthlyExpenses();
        
        // Reset monthly tracking
        this.ledger.resetMonthlyTracking();
        
        // Check for victory
        if (this.gameState.currentDay >= REALISTIC_PARAMETERS.TIME.DAYS_PER_MONTH * REALISTIC_PARAMETERS.TIME.MONTHS_TO_WIN) {
            if (this.ledger.hasWon()) {
                console.log('VICTORY - 12 months survived with target net worth!');
                this.gameState.setState(this.gameState.STATES.VICTORY);
                this.showVictory();
            } else {
                console.log('12 months complete but net worth below target');
            }
        }
        
        // Check for bankruptcy after expenses
        if (this.ledger.isBankrupt()) {
            console.log('BANKRUPTCY after monthly expenses - GAME OVER');
            this.gameState.setState(this.gameState.STATES.GAME_OVER);
            this.showGameOver('Bankruptcy - Unable to pay monthly expenses');
        }
    }
    
    /**
     * Update financial metrics
     */
    updateFinancialMetrics() {
        // Update inventory value in ledger
        const inventoryValue = this.costing.getTotalInventoryValue();
        this.ledger.inventoryValue = inventoryValue;
    }
    
    /**
     * Show game over screen
     */
    showGameOver(reason) {
        const modal = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        
        const snapshot = this.ledger.getFinancialSnapshot();
        
        content.innerHTML = `
            <h2 style="color: #ef4444;">Game Over</h2>
            <p style="font-size: 18px; margin: 20px 0;">${reason}</p>
            <div style="line-height: 1.8;">
                <strong>Final Statistics:</strong><br>
                Days Survived: ${this.gameState.currentDay}<br>
                Final Net Worth: $${snapshot.netWorth.toFixed(2)}<br>
                Total Revenue: $${snapshot.totalRevenue.toFixed(2)}<br>
                Total Shrinkage: $${snapshot.totalShrinkage.toFixed(2)}<br>
                Gross Margin: ${snapshot.grossMargin.toFixed(1)}%
            </div>
            <div class="modal-buttons">
                <button class="btn btn-primary" onclick="location.reload()">New Game</button>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    /**
     * Show victory screen
     */
    showVictory() {
        const modal = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        
        const snapshot = this.ledger.getFinancialSnapshot();
        
        content.innerHTML = `
            <h2 style="color: #10b981;">Victory!</h2>
            <p style="font-size: 18px; margin: 20px 0;">
                Congratulations! You've successfully run your bakery for 12 months!
            </p>
            <div style="line-height: 1.8;">
                <strong>Final Statistics:</strong><br>
                Final Net Worth: $${snapshot.netWorth.toFixed(2)}<br>
                Total Revenue: $${snapshot.totalRevenue.toFixed(2)}<br>
                Total COGS: $${snapshot.totalCOGS.toFixed(2)}<br>
                Total Shrinkage: $${snapshot.totalShrinkage.toFixed(2)}<br>
                Gross Margin: ${snapshot.grossMargin.toFixed(1)}%<br>
                Inventory Turnover: ${snapshot.inventoryTurnover.toFixed(1)}x
            </div>
            <div class="modal-buttons">
                <button class="btn btn-success" onclick="location.reload()">Play Again</button>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    /**
     * Quick test function to populate initial inventory
     */
    addTestInventory() {
        const currentDay = this.gameState.currentDay;
        
        // Add some ingredients
        this.costing.addIngredient('FLOUR_AP', 200, 0.45, currentDay);
        this.costing.addIngredient('BUTTER', 30, 3.50, currentDay);
        this.costing.addIngredient('EGGS', 120, 0.23, currentDay);
        this.costing.addIngredient('SUGAR', 100, 0.50, currentDay);
        this.costing.addIngredient('YEAST', 10, 4.50, currentDay);
        this.costing.addIngredient('BREAD_BAG', 200, 0.08, currentDay);
        this.costing.addIngredient('SMALL_BOX', 100, 0.35, currentDay);
        
        // Pay for these
        const totalCost = (200 * 0.45) + (30 * 3.50) + (120 * 0.23) + (100 * 0.50) + (10 * 4.50) + (200 * 0.08) + (100 * 0.35);
        this.ledger.purchaseSupplies('Initial Inventory', 1, totalCost);
        
        // Produce some products
        this.costing.produceProduct('BASIC_BREAD', 30, currentDay);
        this.costing.produceProduct('CROISSANT', 20, currentDay);
        this.costing.produceProduct('CHOCOLATE_CHIP_COOKIE', 40, currentDay);
        
        // Update ledger inventory value
        this.ledger.inventoryValue = this.costing.getTotalInventoryValue();
        
        console.log('Test inventory added');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomicSimulationCore;
}
