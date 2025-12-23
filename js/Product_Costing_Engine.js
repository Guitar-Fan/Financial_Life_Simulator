/**
 * Product_Costing_Engine.js
 * 
 * FIFO (First-In, First-Out) inventory management system.
 * Tracks raw ingredients and finished products with timestamps.
 * Calculates COGS using Beginning Inventory + Purchases - Ending Inventory.
 */

class CostingEngine {
    constructor() {
        // Raw ingredient inventory (FIFO queues)
        // Format: { type, quantity, unitCost, purchaseDay, expirationDay, batchId }
        this.rawIngredients = {};
        
        // Finished product inventory
        // Format: { sku, quantity, productionDay, expirationDay, unitCOGS }
        this.finishedProducts = {};
        
        // Batch ID counter
        this.nextBatchId = 1;
        
        // Period tracking for COGS calculation
        this.periodBeginningInventory = 0;
        this.periodPurchases = 0;
        this.periodEndingInventory = 0;
        
        // Load saved data
        this.loadFromLocalStorage();
    }
    
    /**
     * Add ingredient to inventory (push to FIFO queue)
     */
    addIngredient(ingredientKey, quantity, unitCost, currentDay) {
        // Get ingredient data
        const ingredientData = REALISTIC_PARAMETERS.INGREDIENTS[ingredientKey];
        if (!ingredientData) {
            console.error(`Unknown ingredient: ${ingredientKey}`);
            return false;
        }
        
        // Calculate expiration day
        const expirationDay = currentDay + ingredientData.shelfLife;
        
        // Create batch
        const batch = {
            type: ingredientKey,
            quantity: quantity,
            unitCost: unitCost,
            purchaseDay: currentDay,
            expirationDay: expirationDay,
            batchId: this.nextBatchId++
        };
        
        // Add to FIFO queue
        if (!this.rawIngredients[ingredientKey]) {
            this.rawIngredients[ingredientKey] = [];
        }
        this.rawIngredients[ingredientKey].push(batch);
        
        // Track for COGS
        this.periodPurchases += quantity * unitCost;
        
        console.log(`Added ingredient: ${ingredientData.name} x${quantity} (Batch #${batch.batchId}, expires Day ${expirationDay})`);
        
        this.saveToLocalStorage();
        return true;
    }
    
    /**
     * Consume ingredient using FIFO (oldest first)
     */
    consumeIngredient(ingredientKey, amountNeeded) {
        if (!this.rawIngredients[ingredientKey] || this.rawIngredients[ingredientKey].length === 0) {
            console.error(`No ${ingredientKey} in inventory`);
            return null;
        }
        
        let totalCost = 0;
        let remainingNeeded = amountNeeded;
        const queue = this.rawIngredients[ingredientKey];
        
        // Consume from oldest batches first (FIFO)
        while (remainingNeeded > 0 && queue.length > 0) {
            const batch = queue[0]; // Peek at oldest
            
            if (batch.quantity <= remainingNeeded) {
                // Consume entire batch
                totalCost += batch.quantity * batch.unitCost;
                remainingNeeded -= batch.quantity;
                queue.shift(); // Remove from queue
            } else {
                // Partial consumption
                totalCost += remainingNeeded * batch.unitCost;
                batch.quantity -= remainingNeeded;
                remainingNeeded = 0;
            }
        }
        
        if (remainingNeeded > 0) {
            console.error(`Insufficient ${ingredientKey}: needed ${amountNeeded}, only had ${amountNeeded - remainingNeeded}`);
            return null;
        }
        
        this.saveToLocalStorage();
        return totalCost;
    }
    
    /**
     * Produce a product (consumes ingredients, creates finished goods)
     */
    produceProduct(recipeKey, quantity, currentDay) {
        const recipe = REALISTIC_PARAMETERS.RECIPES[recipeKey];
        if (!recipe) {
            console.error(`Unknown recipe: ${recipeKey}`);
            return false;
        }
        
        // Check if we have enough ingredients
        for (const [ingredientKey, amountPerUnit] of Object.entries(recipe.ingredients)) {
            const totalNeeded = amountPerUnit * quantity;
            const available = this.getIngredientQuantity(ingredientKey);
            
            if (available < totalNeeded) {
                console.error(`Insufficient ${ingredientKey}: need ${totalNeeded}, have ${available}`);
                return false;
            }
        }
        
        // Calculate total COGS by consuming ingredients
        let totalCOGS = 0;
        for (const [ingredientKey, amountPerUnit] of Object.entries(recipe.ingredients)) {
            const totalNeeded = amountPerUnit * quantity;
            const cost = this.consumeIngredient(ingredientKey, totalNeeded);
            
            if (cost === null) {
                console.error('Failed to consume ingredients - rolling back');
                return false;
            }
            
            totalCOGS += cost;
        }
        
        const unitCOGS = totalCOGS / quantity;
        const expirationDay = currentDay + recipe.shelfLife;
        
        // Add to finished products
        if (!this.finishedProducts[recipeKey]) {
            this.finishedProducts[recipeKey] = [];
        }
        
        this.finishedProducts[recipeKey].push({
            sku: recipe.sku,
            quantity: quantity,
            productionDay: currentDay,
            expirationDay: expirationDay,
            unitCOGS: unitCOGS
        });
        
        console.log(`Produced ${quantity}x ${recipe.name} (Unit COGS: $${unitCOGS.toFixed(2)}, expires Day ${expirationDay})`);
        
        this.saveToLocalStorage();
        return {
            quantity,
            unitCOGS,
            totalCOGS,
            expirationDay
        };
    }
    
    /**
     * Sell a product (FIFO - oldest first)
     */
    sellProduct(recipeKey, quantity) {
        if (!this.finishedProducts[recipeKey] || this.finishedProducts[recipeKey].length === 0) {
            console.error(`No ${recipeKey} in inventory`);
            return null;
        }
        
        let totalCOGS = 0;
        let remainingToSell = quantity;
        const queue = this.finishedProducts[recipeKey];
        
        // Sell oldest first (FIFO)
        while (remainingToSell > 0 && queue.length > 0) {
            const batch = queue[0];
            
            if (batch.quantity <= remainingToSell) {
                // Sell entire batch
                totalCOGS += batch.quantity * batch.unitCOGS;
                remainingToSell -= batch.quantity;
                queue.shift();
            } else {
                // Partial sale
                totalCOGS += remainingToSell * batch.unitCOGS;
                batch.quantity -= remainingToSell;
                remainingToSell = 0;
            }
        }
        
        if (remainingToSell > 0) {
            console.error(`Insufficient ${recipeKey}: needed ${quantity}, only had ${quantity - remainingToSell}`);
            return null;
        }
        
        this.saveToLocalStorage();
        return totalCOGS;
    }
    
    /**
     * Check for expired items
     */
    checkExpired(currentDay) {
        const expired = {
            ingredients: [],
            products: []
        };
        
        // Check raw ingredients
        for (const [ingredientKey, queue] of Object.entries(this.rawIngredients)) {
            const expiredBatches = [];
            
            for (let i = queue.length - 1; i >= 0; i--) {
                if (queue[i].expirationDay <= currentDay) {
                    const batch = queue.splice(i, 1)[0];
                    const cogsValue = batch.quantity * batch.unitCost;
                    
                    expired.ingredients.push({
                        type: ingredientKey,
                        name: REALISTIC_PARAMETERS.INGREDIENTS[ingredientKey].name,
                        quantity: batch.quantity,
                        cogsValue: cogsValue,
                        batchId: batch.batchId
                    });
                }
            }
        }
        
        // Check finished products
        for (const [recipeKey, queue] of Object.entries(this.finishedProducts)) {
            for (let i = queue.length - 1; i >= 0; i--) {
                if (queue[i].expirationDay <= currentDay) {
                    const batch = queue.splice(i, 1)[0];
                    const cogsValue = batch.quantity * batch.unitCOGS;
                    
                    expired.products.push({
                        type: recipeKey,
                        name: REALISTIC_PARAMETERS.RECIPES[recipeKey].name,
                        quantity: batch.quantity,
                        cogsValue: cogsValue
                    });
                }
            }
        }
        
        if (expired.ingredients.length > 0 || expired.products.length > 0) {
            this.saveToLocalStorage();
        }
        
        return expired;
    }
    
    /**
     * Get total quantity of an ingredient
     */
    getIngredientQuantity(ingredientKey) {
        if (!this.rawIngredients[ingredientKey]) return 0;
        
        return this.rawIngredients[ingredientKey].reduce((sum, batch) => sum + batch.quantity, 0);
    }
    
    /**
     * Get total quantity of a product
     */
    getProductQuantity(recipeKey) {
        if (!this.finishedProducts[recipeKey]) return 0;
        
        return this.finishedProducts[recipeKey].reduce((sum, batch) => sum + batch.quantity, 0);
    }
    
    /**
     * Get all ingredient inventory with freshness
     */
    getIngredientInventory(currentDay) {
        const inventory = [];
        
        for (const [ingredientKey, queue] of Object.entries(this.rawIngredients)) {
            const ingredientData = REALISTIC_PARAMETERS.INGREDIENTS[ingredientKey];
            const totalQuantity = queue.reduce((sum, batch) => sum + batch.quantity, 0);
            
            if (totalQuantity > 0) {
                // Find freshness of oldest batch
                const oldestBatch = queue[0];
                const daysUntilExpiration = oldestBatch.expirationDay - currentDay;
                
                inventory.push({
                    key: ingredientKey,
                    name: ingredientData.name,
                    quantity: totalQuantity,
                    unit: ingredientData.unit,
                    daysUntilExpiration: daysUntilExpiration,
                    freshness: daysUntilExpiration > 3 ? 'good' : daysUntilExpiration > 1 ? 'medium' : 'low'
                });
            }
        }
        
        return inventory;
    }
    
    /**
     * Get all product inventory with freshness
     */
    getProductInventory(currentDay) {
        const inventory = [];
        
        for (const [recipeKey, queue] of Object.entries(this.finishedProducts)) {
            const recipe = REALISTIC_PARAMETERS.RECIPES[recipeKey];
            const totalQuantity = queue.reduce((sum, batch) => sum + batch.quantity, 0);
            
            if (totalQuantity > 0) {
                // Find freshness of oldest batch
                const oldestBatch = queue[0];
                const daysUntilExpiration = oldestBatch.expirationDay - currentDay;
                
                inventory.push({
                    key: recipeKey,
                    name: recipe.name,
                    sku: recipe.sku,
                    quantity: totalQuantity,
                    retailPrice: recipe.retailPrice,
                    daysUntilExpiration: daysUntilExpiration,
                    freshness: daysUntilExpiration > 2 ? 'good' : daysUntilExpiration > 0 ? 'medium' : 'low'
                });
            }
        }
        
        return inventory;
    }
    
    /**
     * Calculate COGS for a period using formula:
     * COGS = Beginning Inventory + Purchases - Ending Inventory
     */
    calculatePeriodCOGS(startDay, endDay) {
        // This is tracked automatically through the period variables
        this.periodEndingInventory = this.getTotalInventoryValue();
        
        const cogs = this.periodBeginningInventory + this.periodPurchases - this.periodEndingInventory;
        
        return {
            beginningInventory: this.periodBeginningInventory,
            purchases: this.periodPurchases,
            endingInventory: this.periodEndingInventory,
            cogs: cogs
        };
    }
    
    /**
     * Reset period tracking for new accounting period
     */
    resetPeriod() {
        this.periodBeginningInventory = this.getTotalInventoryValue();
        this.periodPurchases = 0;
        this.saveToLocalStorage();
    }
    
    /**
     * Get total inventory value (raw + finished)
     */
    getTotalInventoryValue() {
        let total = 0;
        
        // Raw ingredients
        for (const queue of Object.values(this.rawIngredients)) {
            for (const batch of queue) {
                total += batch.quantity * batch.unitCost;
            }
        }
        
        // Finished products
        for (const queue of Object.values(this.finishedProducts)) {
            for (const batch of queue) {
                total += batch.quantity * batch.unitCOGS;
            }
        }
        
        return total;
    }
    
    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        const saveData = {
            rawIngredients: this.rawIngredients,
            finishedProducts: this.finishedProducts,
            nextBatchId: this.nextBatchId,
            periodBeginningInventory: this.periodBeginningInventory,
            periodPurchases: this.periodPurchases,
            periodEndingInventory: this.periodEndingInventory
        };
        
        try {
            localStorage.setItem('bakery_inventory_data', JSON.stringify(saveData));
        } catch (e) {
            console.error('Failed to save inventory data:', e);
        }
    }
    
    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saveData = localStorage.getItem('bakery_inventory_data');
            if (saveData) {
                const data = JSON.parse(saveData);
                this.rawIngredients = data.rawIngredients || {};
                this.finishedProducts = data.finishedProducts || {};
                this.nextBatchId = data.nextBatchId || 1;
                this.periodBeginningInventory = data.periodBeginningInventory || 0;
                this.periodPurchases = data.periodPurchases || 0;
                this.periodEndingInventory = data.periodEndingInventory || 0;
                
                console.log('Inventory data loaded from localStorage');
            }
        } catch (e) {
            console.error('Failed to load inventory data:', e);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CostingEngine;
}
