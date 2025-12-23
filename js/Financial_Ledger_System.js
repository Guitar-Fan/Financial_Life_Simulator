/**
 * Financial_Ledger_System.js
 * 
 * Double-entry accounting system tracking cash and inventory.
 * Implements asset valuation where purchases convert cash to inventory assets.
 * Tracks revenue, COGS, and calculates financial KPIs.
 */

class LedgerSystem {
    constructor() {
        // Balance sheet items
        this.cashOnHand = REALISTIC_PARAMETERS.STARTING_CASH;
        this.inventoryValue = 0;
        
        // Income statement tracking (monthly)
        this.monthlyRevenue = 0;
        this.monthlyCOGS = 0;
        this.monthlyExpenses = 0;
        
        // Historical tracking for KPI calculations
        this.totalRevenue = 0;
        this.totalCOGS = 0;
        this.totalShrinkage = 0;
        this.inventoryValueHistory = [0]; // For calculating average inventory
        
        // Transaction log
        this.transactions = [];
        
        // Month tracking
        this.currentMonth = 1;
        this.lastExpenseDeductionDay = 0;
        
        // Load saved data if exists
        this.loadFromLocalStorage();
    }
    
    /**
     * Purchase supplies - converts cash to inventory asset
     */
    purchaseSupplies(itemName, quantity, unitCost) {
        const totalCost = quantity * unitCost;
        
        if (this.cashOnHand < totalCost) {
            console.error('Insufficient cash for purchase');
            return false;
        }
        
        // Double-entry: Debit Inventory, Credit Cash
        this.cashOnHand -= totalCost;
        this.inventoryValue += totalCost;
        
        // Log transaction
        this.logTransaction('PURCHASE', {
            item: itemName,
            quantity,
            unitCost,
            totalCost,
            cashAfter: this.cashOnHand,
            inventoryAfter: this.inventoryValue
        });
        
        this.saveToLocalStorage();
        return true;
    }
    
    /**
     * Record a sale - reduces inventory, increases cash, tracks revenue and COGS
     */
    recordSale(productName, retailPrice, cogs) {
        const grossProfit = retailPrice - cogs;
        
        // Double-entry: Debit Cash, Credit Inventory, Credit Revenue
        this.cashOnHand += retailPrice;
        this.inventoryValue -= cogs;
        
        // Track revenue and COGS
        this.monthlyRevenue += retailPrice;
        this.monthlyCOGS += cogs;
        this.totalRevenue += retailPrice;
        this.totalCOGS += cogs;
        
        // Log transaction
        this.logTransaction('SALE', {
            product: productName,
            retailPrice,
            cogs,
            grossProfit,
            cashAfter: this.cashOnHand,
            inventoryAfter: this.inventoryValue
        });
        
        this.saveToLocalStorage();
        return true;
    }
    
    /**
     * Write off shrinkage - reduces inventory value without cash recovery
     */
    writeOffShrinkage(cogsValue, itemName = 'Unknown') {
        // Debit Loss (expense), Credit Inventory
        this.inventoryValue -= cogsValue;
        this.totalShrinkage += cogsValue;
        
        // Log transaction
        this.logTransaction('SHRINKAGE', {
            item: itemName,
            cogsValue,
            inventoryAfter: this.inventoryValue
        });
        
        this.saveToLocalStorage();
    }
    
    /**
     * Deduct monthly fixed expenses
     */
    deductMonthlyExpenses() {
        const expenses = REALISTIC_PARAMETERS.FIXED_COSTS.TOTAL;
        
        if (this.cashOnHand < expenses) {
            console.warn('Insufficient cash for monthly expenses - partial deduction');
            const deduction = this.cashOnHand;
            this.cashOnHand = 0;
            this.monthlyExpenses += deduction;
            
            this.logTransaction('MONTHLY_EXPENSES', {
                planned: expenses,
                deducted: deduction,
                shortfall: expenses - deduction,
                cashAfter: 0
            });
        } else {
            this.cashOnHand -= expenses;
            this.monthlyExpenses += expenses;
            
            this.logTransaction('MONTHLY_EXPENSES', {
                amount: expenses,
                cashAfter: this.cashOnHand
            });
        }
        
        this.saveToLocalStorage();
    }
    
    /**
     * Reset monthly tracking (called at start of new month)
     */
    resetMonthlyTracking() {
        this.currentMonth++;
        this.monthlyRevenue = 0;
        this.monthlyCOGS = 0;
        this.monthlyExpenses = 0;
        
        this.saveToLocalStorage();
    }
    
    /**
     * Update inventory value history for averaging
     */
    updateInventoryHistory() {
        this.inventoryValueHistory.push(this.inventoryValue);
        
        // Keep only last 30 entries
        if (this.inventoryValueHistory.length > 30) {
            this.inventoryValueHistory.shift();
        }
    }
    
    /**
     * Calculate gross margin percentage
     */
    getGrossMargin() {
        if (this.totalRevenue === 0) return 0;
        return ((this.totalRevenue - this.totalCOGS) / this.totalRevenue) * 100;
    }
    
    /**
     * Calculate inventory turnover rate
     */
    getInventoryTurnover() {
        const avgInventory = this.getAverageInventoryValue();
        if (avgInventory === 0) return 0;
        return this.totalCOGS / avgInventory;
    }
    
    /**
     * Get average inventory value
     */
    getAverageInventoryValue() {
        if (this.inventoryValueHistory.length === 0) return 0;
        const sum = this.inventoryValueHistory.reduce((a, b) => a + b, 0);
        return sum / this.inventoryValueHistory.length;
    }
    
    /**
     * Get net worth (cash + inventory)
     */
    getNetWorth() {
        return this.cashOnHand + this.inventoryValue;
    }
    
    /**
     * Calculate monthly burn rate
     */
    getMonthlyBurnRate() {
        return REALISTIC_PARAMETERS.FIXED_COSTS.TOTAL;
    }
    
    /**
     * Check for bankruptcy condition
     */
    isBankrupt() {
        return this.getNetWorth() < REALISTIC_PARAMETERS.TARGETS.BANKRUPTCY_NET_WORTH;
    }
    
    /**
     * Check for victory condition
     */
    hasWon() {
        return this.getNetWorth() >= REALISTIC_PARAMETERS.TARGETS.WIN_NET_WORTH;
    }
    
    /**
     * Get comprehensive financial snapshot
     */
    getFinancialSnapshot() {
        return {
            // Balance Sheet
            cashOnHand: this.cashOnHand,
            inventoryValue: this.inventoryValue,
            netWorth: this.getNetWorth(),
            
            // Income Statement (Monthly)
            monthlyRevenue: this.monthlyRevenue,
            monthlyCOGS: this.monthlyCOGS,
            monthlyGrossProfit: this.monthlyRevenue - this.monthlyCOGS,
            monthlyExpenses: this.monthlyExpenses,
            monthlyNetProfit: this.monthlyRevenue - this.monthlyCOGS - this.monthlyExpenses,
            
            // Cumulative Totals
            totalRevenue: this.totalRevenue,
            totalCOGS: this.totalCOGS,
            totalShrinkage: this.totalShrinkage,
            
            // KPIs
            grossMargin: this.getGrossMargin(),
            inventoryTurnover: this.getInventoryTurnover(),
            burnRate: this.getMonthlyBurnRate(),
            
            // Status
            isBankrupt: this.isBankrupt(),
            hasWon: this.hasWon(),
            currentMonth: this.currentMonth
        };
    }
    
    /**
     * Get daily summary for end-of-day report
     */
    getDailySummary(dayNumber) {
        // Calculate just today's transactions
        const todayTransactions = this.transactions.filter(t => t.day === dayNumber);
        
        const dailySales = todayTransactions
            .filter(t => t.type === 'SALE')
            .reduce((sum, t) => sum + t.data.retailPrice, 0);
        
        const dailyCOGS = todayTransactions
            .filter(t => t.type === 'SALE')
            .reduce((sum, t) => sum + t.data.cogs, 0);
        
        const dailyShrinkage = todayTransactions
            .filter(t => t.type === 'SHRINKAGE')
            .reduce((sum, t) => sum + t.data.cogsValue, 0);
        
        const dailyPurchases = todayTransactions
            .filter(t => t.type === 'PURCHASE')
            .reduce((sum, t) => sum + t.data.totalCost, 0);
        
        return {
            sales: dailySales,
            cogs: dailyCOGS,
            grossProfit: dailySales - dailyCOGS,
            shrinkage: dailyShrinkage,
            purchases: dailyPurchases,
            netCashFlow: dailySales - dailyPurchases,
            transactionCount: todayTransactions.filter(t => t.type === 'SALE').length
        };
    }
    
    /**
     * Log a transaction
     */
    logTransaction(type, data) {
        this.transactions.push({
            type,
            data,
            timestamp: Date.now(),
            day: null // Will be set by Economic_Simulation_Core
        });
        
        // Keep only last 1000 transactions
        if (this.transactions.length > 1000) {
            this.transactions.shift();
        }
    }
    
    /**
     * Set day number for recent transactions
     */
    setTransactionDay(dayNumber) {
        // Set day for recent transactions without a day number
        this.transactions.forEach(t => {
            if (t.day === null) {
                t.day = dayNumber;
            }
        });
    }
    
    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        const saveData = {
            cashOnHand: this.cashOnHand,
            inventoryValue: this.inventoryValue,
            monthlyRevenue: this.monthlyRevenue,
            monthlyCOGS: this.monthlyCOGS,
            monthlyExpenses: this.monthlyExpenses,
            totalRevenue: this.totalRevenue,
            totalCOGS: this.totalCOGS,
            totalShrinkage: this.totalShrinkage,
            inventoryValueHistory: this.inventoryValueHistory,
            currentMonth: this.currentMonth,
            lastExpenseDeductionDay: this.lastExpenseDeductionDay,
            transactions: this.transactions.slice(-100) // Save last 100 transactions
        };
        
        try {
            localStorage.setItem('bakery_financial_data', JSON.stringify(saveData));
        } catch (e) {
            console.error('Failed to save financial data:', e);
        }
    }
    
    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saveData = localStorage.getItem('bakery_financial_data');
            if (saveData) {
                const data = JSON.parse(saveData);
                this.cashOnHand = data.cashOnHand || REALISTIC_PARAMETERS.STARTING_CASH;
                this.inventoryValue = data.inventoryValue || 0;
                this.monthlyRevenue = data.monthlyRevenue || 0;
                this.monthlyCOGS = data.monthlyCOGS || 0;
                this.monthlyExpenses = data.monthlyExpenses || 0;
                this.totalRevenue = data.totalRevenue || 0;
                this.totalCOGS = data.totalCOGS || 0;
                this.totalShrinkage = data.totalShrinkage || 0;
                this.inventoryValueHistory = data.inventoryValueHistory || [0];
                this.currentMonth = data.currentMonth || 1;
                this.lastExpenseDeductionDay = data.lastExpenseDeductionDay || 0;
                this.transactions = data.transactions || [];
                
                console.log('Financial data loaded from localStorage');
            }
        } catch (e) {
            console.error('Failed to load financial data:', e);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LedgerSystem;
}
