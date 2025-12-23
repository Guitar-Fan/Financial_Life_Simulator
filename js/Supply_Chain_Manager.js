/**
 * Supply_Chain_Manager.js
 * 
 * Manages procurement, orders, deliveries, and Just-In-Time (JIT) inventory.
 * Implements realistic lead times, delivery schedules, MOQs, and bulk discounts.
 * Players must wait through delivery times without skipping.
 */

class SupplyChainManager {
    constructor() {
        // Active orders (pending delivery)
        this.activeOrders = [];
        
        // Order ID counter
        this.nextOrderId = 1;
        
        // Delivery tracking
        this.deliveryHistory = [];
        
        // Load saved data
        this.loadFromLocalStorage();
    }
    
    /**
     * Place an order for supplies
     */
    placeOrder(items, currentDay, currentDayOfWeek, ledgerSystem) {
        // items format: [{ ingredientKey, quantity }, ...]
        
        if (!items || items.length === 0) {
            console.error('No items in order');
            return null;
        }
        
        // Calculate order details
        let totalCost = 0;
        const orderItems = [];
        
        for (const item of items) {
            const ingredientData = REALISTIC_PARAMETERS.INGREDIENTS[item.ingredientKey];
            if (!ingredientData) {
                console.error(`Unknown ingredient: ${item.ingredientKey}`);
                return null;
            }
            
            // Check MOQ
            const moq = REALISTIC_PARAMETERS.SUPPLY_CHAIN.MOQ[item.ingredientKey];
            if (moq && item.quantity < moq) {
                console.error(`${ingredientData.name} requires minimum order of ${moq} ${ingredientData.unit}`);
                return null;
            }
            
            // Calculate cost with bulk discount
            let unitCost = ingredientData.cost;
            const discount = this.getBulkDiscount(item.ingredientKey, item.quantity);
            if (discount > 0) {
                unitCost *= (1 - discount);
            }
            
            const itemTotal = item.quantity * unitCost;
            totalCost += itemTotal;
            
            orderItems.push({
                ingredientKey: item.ingredientKey,
                name: ingredientData.name,
                quantity: item.quantity,
                unitCost: unitCost,
                originalCost: ingredientData.cost,
                discount: discount,
                total: itemTotal,
                category: ingredientData.category
            });
        }
        
        // Apply payment terms discount (2% for cash on delivery)
        const paymentDiscount = REALISTIC_PARAMETERS.SUPPLY_CHAIN.PAYMENT_TERMS.CASH_ON_DELIVERY;
        totalCost *= (1 - paymentDiscount);
        
        // Check if player has enough cash
        if (!ledgerSystem || ledgerSystem.cashOnHand < totalCost) {
            console.error('Insufficient cash for order');
            return null;
        }
        
        // Determine lead time and delivery day
        const leadTime = this.calculateLeadTime(orderItems);
        const estimatedDeliveryDay = currentDay + leadTime;
        
        // Create order
        const order = {
            orderId: this.nextOrderId++,
            orderDay: currentDay,
            estimatedDeliveryDay: estimatedDeliveryDay,
            actualDeliveryDay: null,
            items: orderItems,
            totalCost: totalCost,
            paymentDiscount: paymentDiscount,
            status: 'PENDING'
        };
        
        // Pay for order immediately (cash on delivery means payment secured now)
        if (!ledgerSystem.purchaseSupplies('Order #' + order.orderId, 1, totalCost)) {
            console.error('Failed to process payment');
            return null;
        }
        
        this.activeOrders.push(order);
        this.saveToLocalStorage();
        
        console.log(`Order #${order.orderId} placed - Delivery expected Day ${estimatedDeliveryDay}`);
        
        return order;
    }
    
    /**
     * Calculate lead time based on ingredient categories
     */
    calculateLeadTime(orderItems) {
        let maxLeadTime = 0;
        
        for (const item of orderItems) {
            const category = item.category;
            const leadTime = REALISTIC_PARAMETERS.SUPPLY_CHAIN.LEAD_TIMES[category] || 3;
            maxLeadTime = Math.max(maxLeadTime, leadTime);
        }
        
        return maxLeadTime;
    }
    
    /**
     * Get bulk discount for an ingredient
     */
    getBulkDiscount(ingredientKey, quantity) {
        const discountTiers = REALISTIC_PARAMETERS.SUPPLY_CHAIN.BULK_DISCOUNTS[ingredientKey];
        if (!discountTiers) return 0;
        
        for (const tier of discountTiers) {
            if (quantity >= tier.min && quantity <= tier.max) {
                return tier.discount;
            }
        }
        
        return 0;
    }
    
    /**
     * Process deliveries for the current day
     */
    processDeliveries(currentDay, costingEngine) {
        const deliveredOrders = [];
        
        for (let i = this.activeOrders.length - 1; i >= 0; i--) {
            const order = this.activeOrders[i];
            
            // Check if delivery day has arrived
            if (currentDay >= order.estimatedDeliveryDay && order.status === 'PENDING') {
                // Deliver order
                order.actualDeliveryDay = currentDay;
                order.status = 'DELIVERED';
                
                // Add items to inventory
                for (const item of order.items) {
                    costingEngine.addIngredient(
                        item.ingredientKey,
                        item.quantity,
                        item.unitCost,
                        currentDay
                    );
                }
                
                deliveredOrders.push(order);
                
                // Move to history
                this.deliveryHistory.push(order);
                this.activeOrders.splice(i, 1);
                
                console.log(`Order #${order.orderId} delivered on Day ${currentDay}`);
            }
        }
        
        if (deliveredOrders.length > 0) {
            this.saveToLocalStorage();
        }
        
        return deliveredOrders;
    }
    
    /**
     * Check if there are any stockouts (ingredient quantity below threshold)
     */
    checkStockout(ingredientKey, costingEngine, daysOfSupplyNeeded = 3) {
        const currentQuantity = costingEngine.getIngredientQuantity(ingredientKey);
        
        // Get daily consumption rate from recipe usage (simplified estimation)
        const estimatedDailyUsage = this.estimateDailyUsage(ingredientKey);
        const daysOfSupply = estimatedDailyUsage > 0 ? currentQuantity / estimatedDailyUsage : Infinity;
        
        return {
            isStockout: currentQuantity === 0,
            isLow: daysOfSupply < daysOfSupplyNeeded,
            currentQuantity: currentQuantity,
            daysOfSupply: daysOfSupply,
            recommendedOrder: Math.max(
                estimatedDailyUsage * 7, // 1 week supply
                REALISTIC_PARAMETERS.SUPPLY_CHAIN.MOQ[ingredientKey] || 0
            )
        };
    }
    
    /**
     * Estimate daily usage of an ingredient (simplified)
     */
    estimateDailyUsage(ingredientKey) {
        // Based on average daily customers and product mix
        const avgCustomers = REALISTIC_PARAMETERS.DEMAND.BASE_CUSTOMERS_PER_DAY;
        
        // Simplified: assume each customer buys 1.5 items on average
        // and ingredients are distributed across recipes
        // This is a rough estimate for demonstration
        
        let totalUsage = 0;
        
        // Check all recipes that use this ingredient
        for (const recipe of Object.values(REALISTIC_PARAMETERS.RECIPES)) {
            if (recipe.ingredients[ingredientKey]) {
                // Assume 10-30 units of each product sold per day (rough estimate)
                const estimatedDailySales = 20;
                totalUsage += recipe.ingredients[ingredientKey] * estimatedDailySales;
            }
        }
        
        return totalUsage;
    }
    
    /**
     * Get all pending orders
     */
    getPendingOrders() {
        return this.activeOrders.filter(order => order.status === 'PENDING');
    }
    
    /**
     * Get delivery schedule (next 7 days)
     */
    getDeliverySchedule(currentDay) {
        return this.activeOrders
            .filter(order => order.status === 'PENDING')
            .map(order => ({
                orderId: order.orderId,
                deliveryDay: order.estimatedDeliveryDay,
                daysRemaining: order.estimatedDeliveryDay - currentDay,
                itemCount: order.items.length,
                totalCost: order.totalCost
            }))
            .sort((a, b) => a.deliveryDay - b.deliveryDay);
    }
    
    /**
     * Get recommended orders based on current inventory
     */
    getRecommendedOrders(costingEngine) {
        const recommendations = [];
        
        // Check key ingredients
        const keyIngredients = ['FLOUR_AP', 'FLOUR_BREAD', 'BUTTER', 'EGGS', 'SUGAR', 'YEAST'];
        
        for (const ingredientKey of keyIngredients) {
            const stockStatus = this.checkStockout(ingredientKey, costingEngine, 5);
            
            if (stockStatus.isLow || stockStatus.isStockout) {
                const ingredientData = REALISTIC_PARAMETERS.INGREDIENTS[ingredientKey];
                recommendations.push({
                    ingredientKey: ingredientKey,
                    name: ingredientData.name,
                    currentQuantity: stockStatus.currentQuantity,
                    daysOfSupply: stockStatus.daysOfSupply,
                    recommendedQuantity: stockStatus.recommendedOrder,
                    urgency: stockStatus.isStockout ? 'CRITICAL' : stockStatus.daysOfSupply < 2 ? 'HIGH' : 'MEDIUM'
                });
            }
        }
        
        return recommendations;
    }
    
    /**
     * Calculate order summary (for UI display before placing)
     */
    calculateOrderSummary(items) {
        let subtotal = 0;
        let totalDiscount = 0;
        const itemDetails = [];
        
        for (const item of items) {
            const ingredientData = REALISTIC_PARAMETERS.INGREDIENTS[item.ingredientKey];
            if (!ingredientData) continue;
            
            const originalCost = item.quantity * ingredientData.cost;
            const bulkDiscount = this.getBulkDiscount(item.ingredientKey, item.quantity);
            const discountedCost = originalCost * (1 - bulkDiscount);
            
            subtotal += discountedCost;
            totalDiscount += (originalCost - discountedCost);
            
            itemDetails.push({
                name: ingredientData.name,
                quantity: item.quantity,
                unit: ingredientData.unit,
                unitCost: ingredientData.cost,
                bulkDiscount: bulkDiscount * 100,
                lineTotal: discountedCost
            });
        }
        
        const paymentDiscount = subtotal * REALISTIC_PARAMETERS.SUPPLY_CHAIN.PAYMENT_TERMS.CASH_ON_DELIVERY;
        const total = subtotal - paymentDiscount;
        
        return {
            items: itemDetails,
            subtotal: subtotal,
            bulkDiscountTotal: totalDiscount,
            paymentDiscount: paymentDiscount,
            total: total
        };
    }
    
    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        const saveData = {
            activeOrders: this.activeOrders,
            nextOrderId: this.nextOrderId,
            deliveryHistory: this.deliveryHistory.slice(-50) // Keep last 50 deliveries
        };
        
        try {
            localStorage.setItem('bakery_orders_data', JSON.stringify(saveData));
        } catch (e) {
            console.error('Failed to save orders data:', e);
        }
    }
    
    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saveData = localStorage.getItem('bakery_orders_data');
            if (saveData) {
                const data = JSON.parse(saveData);
                this.activeOrders = data.activeOrders || [];
                this.nextOrderId = data.nextOrderId || 1;
                this.deliveryHistory = data.deliveryHistory || [];
                
                console.log('Orders data loaded from localStorage');
            }
        } catch (e) {
            console.error('Failed to load orders data:', e);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupplyChainManager;
}
