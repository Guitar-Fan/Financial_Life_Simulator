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
        this.ovenCapacity = 8; // 4x original for faster gameplay
        this.bakingSpeedMultiplier = 1.0;
        this.trafficMultiplier = 1.0;
        this.menuAppeal = 1.0;
        this.rentAmount = GAME_CONFIG.DAILY_EXPENSES.rent.amount;

        // Prepared items (par-baked, frozen dough)
        this.preparedItems = [];

        // Economic simulation engine - use the newer comprehensive one
        if (window.game && window.game.economy) {
            this.economy = window.game.economy;
        } else {
            // Fallback to old simulator if not initialized
            this.economy = new EconomySimulator();
        }
        this.lastEconomyDay = 0;  // Track when we last simulated economy
        this.economyReport = null;  // Latest economy report

        // Business Philosophy & Strategy
        if (window.BusinessPhilosophy) {
            this.philosophy = new BusinessPhilosophy();
        } else {
            console.log('BusinessPhilosophy class not found, initializing default strategy');
            this.philosophy = {
                modifiers: { ingredientCostMult: 1, productionSpeedMult: 1, customerVolumeMult: 1, interestRateMult: 1, maxLoanAmountMult: 1 },
                getInitialCash: () => 2000,
                getInitialDebt: () => 0,
                recalculateModifiers: () => { }
            };
        }

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

        // Staff & Operations system
        this.staff = [];
        this.shiftSchedule = {
            openingHour: 6,
            closingHour: 18,
            isOpen: false
        };
        this.equipment = {
            ovens: [],
            mixers: [],
            displays: []
        };

        // Monthly recurring costs
        this.monthlyInsurance = 0;
        this.monthlyUtilities = 0;
        this.monthlyStaffCost = 0;

        // Strategy + automation defaults
        this.strategySettings = {
            philosophy: 'craftsmanship',
            playbook: 'steady_shop',
            pricingStyle: 'balanced',
            inventoryBufferDays: 1.2,
            vendorPriority: 'METRO',
            marketingFocus: 'REGULAR',
            cashFloorPercent: 0.15,
            pricingElasticity: 1
        };
        this.pricingOverrides = {};
        this.applyPricingStrategy();

        // Event callbacks (preserve if already exists to keep listeners)
        if (!this.callbacks) {
            this.callbacks = {};
        }
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

    // ==================== STAFF MANAGEMENT ====================
    hireStaff(staffConfig) {
        // Assign a random face from available options
        const faces = ['👨‍🍳', '👩‍🍳', '🧑‍🍳', '👨', '👩', '🧑', '👨‍🦱', '👩‍🦰', '👨‍🦳', '👩‍🦳'];
        const randomFace = faces[Math.floor(Math.random() * faces.length)];

        const newStaff = {
            id: Date.now() + Math.random(),
            name: staffConfig.name,
            face: randomFace,
            role: staffConfig.id,
            skillLevel: this.getSkillLevelValue(staffConfig.skillLevel),
            efficiency: staffConfig.efficiency,
            baseSalary: staffConfig.monthlyCost,
            benefits: staffConfig.benefits || 0,
            happiness: 75, // Start at 75%
            fatigue: 0, // 0-100, affects efficiency
            hoursWorkedToday: 0,
            hoursWorkedThisWeek: 0,
            daysWorked: 0,
            trainingLevel: 0, // 0-5 levels
            trainingCost: 200, // Cost per training level
            hireDate: this.day
        };

        this.staff.push(newStaff);
        this.updateMonthlyStaffCost();
        this.emit('staff_hired', newStaff);
        return { success: true, staff: newStaff };
    }

    getSkillLevelValue(skillLevel) {
        const levels = { owner: 5, expert: 4, intermediate: 3, entry: 2, mixed: 3 };
        return levels[skillLevel] || 3;
    }

    fireStaff(staffId) {
        const index = this.staff.findIndex(s => s.id === staffId);
        if (index === -1) return { success: false, message: 'Staff not found' };

        const severancePay = this.staff[index].baseSalary / 2;
        this.cash -= severancePay;

        const firedStaff = this.staff.splice(index, 1)[0];
        this.updateMonthlyStaffCost();
        this.emit('staff_fired', { staff: firedStaff, severance: severancePay });
        return { success: true, severance: severancePay };
    }

    trainStaff(staffId) {
        const staff = this.staff.find(s => s.id === staffId);
        if (!staff) return { success: false, message: 'Staff not found' };
        if (staff.trainingLevel >= 5) return { success: false, message: 'Max training reached' };
        if (this.cash < staff.trainingCost) return { success: false, message: 'Not enough cash' };

        this.cash -= staff.trainingCost;
        staff.trainingLevel++;
        staff.efficiency += 0.1; // 10% efficiency boost per level
        staff.skillLevel = Math.min(5, staff.skillLevel + 0.2);
        staff.happiness += 10; // Training increases happiness

        this.emit('staff_trained', staff);
        return { success: true, staff, cost: staff.trainingCost };
    }

    updateMonthlyStaffCost() {
        this.monthlyStaffCost = this.staff.reduce((sum, s) =>
            sum + s.baseSalary + s.benefits, 0);
    }

    getStaffEfficiency() {
        if (this.staff.length === 0) return 1.0; // Solo operation

        let totalEfficiency = 0;
        this.staff.forEach(staff => {
            // Base efficiency
            let eff = staff.efficiency;

            // Happiness modifier (-20% to +20%)
            eff *= (0.8 + (staff.happiness / 100) * 0.4);

            // Fatigue penalty (-50% max)
            eff *= (1 - staff.fatigue / 200);

            // Training bonus
            eff *= (1 + staff.trainingLevel * 0.05);

            totalEfficiency += eff;
        });

        return totalEfficiency;
    }

    // ==================== SHIFT MANAGEMENT ====================
    setShiftSchedule(openingHour, closingHour) {
        this.shiftSchedule.openingHour = openingHour;
        this.shiftSchedule.closingHour = closingHour;
        this.emit('schedule_changed', this.shiftSchedule);
    }

    openBakery() {
        if (this.hour < this.shiftSchedule.openingHour) {
            return { success: false, message: 'Too early to open!' };
        }
        this.shiftSchedule.isOpen = true;
        this.emit('bakery_opened', { time: this.getTimeString() });
        return { success: true };
    }

    closeBakery() {
        this.shiftSchedule.isOpen = false;
        // Add fatigue to staff based on hours worked
        this.staff.forEach(staff => {
            const hoursToday = staff.hoursWorkedToday;
            if (hoursToday > 8) {
                const overtime = hoursToday - 8;
                staff.fatigue += overtime * 5; // 5 fatigue per overtime hour
                staff.happiness -= overtime * 2; // Overtime reduces happiness
            }
            staff.fatigue = Math.min(100, staff.fatigue);
            staff.happiness = Math.max(0, Math.min(100, staff.happiness));
        });
        this.emit('bakery_closed', { time: this.getTimeString() });
        return { success: true };
    }

    processStaffHours(hours) {
        this.staff.forEach(staff => {
            staff.hoursWorkedToday += hours;
            staff.hoursWorkedThisWeek += hours;
        });
    }

    // ==================== EQUIPMENT MANAGEMENT ====================
    addEquipment(type, equipmentConfig) {
        const equipment = {
            id: Date.now() + Math.random(),
            type: type,
            name: equipmentConfig.name,
            capacity: equipmentConfig.capacity || 1,
            condition: 100, // 0-100%
            maintenanceCost: equipmentConfig.cost * 0.01, // 1% of cost per maintenance
            breakdownProbability: 0.01, // 1% base
            lastMaintenance: this.day,
            purchaseDay: this.day,
            totalRepairCosts: 0
        };

        if (!this.equipment[type + 's']) {
            this.equipment[type + 's'] = [];
        }
        this.equipment[type + 's'].push(equipment);
        this.emit('equipment_added', equipment);
        return equipment;
    }

    updateEquipmentCondition() {
        const degradedEquipment = [];
        const brokenEquipment = [];

        ['ovens', 'mixers', 'displays'].forEach(type => {
            if (!this.equipment[type]) return;

            this.equipment[type].forEach(item => {
                // Daily wear (0.5-2% per day based on usage)
                const usageWear = 0.5 + Math.random() * 1.5;
                item.condition = Math.max(0, item.condition - usageWear);

                // Increase breakdown probability as condition worsens
                item.breakdownProbability = 0.01 + ((100 - item.condition) / 100) * 0.15;

                // Check for breakdown
                if (Math.random() < item.breakdownProbability) {
                    item.condition = Math.max(0, item.condition - 20);
                    brokenEquipment.push(item);
                }

                if (item.condition < 50) {
                    degradedEquipment.push(item);
                }
            });
        });

        return { degraded: degradedEquipment, broken: brokenEquipment };
    }

    repairEquipment(equipmentId) {
        let equipment = null;
        let type = null;

        ['ovens', 'mixers', 'displays'].forEach(t => {
            if (!equipment && this.equipment[t]) {
                const found = this.equipment[t].find(e => e.id === equipmentId);
                if (found) {
                    equipment = found;
                    type = t;
                }
            }
        });

        if (!equipment) return { success: false, message: 'Equipment not found' };

        const repairCost = equipment.maintenanceCost * (100 - equipment.condition) / 10;
        if (this.cash < repairCost) return { success: false, message: 'Not enough cash' };

        this.cash -= repairCost;
        equipment.condition = 100;
        equipment.lastMaintenance = this.day;
        equipment.totalRepairCosts += repairCost;

        this.emit('equipment_repaired', { equipment, cost: repairCost });
        return { success: true, cost: repairCost };
    }

    maintainEquipment(equipmentId) {
        let equipment = null;
        ['ovens', 'mixers', 'displays'].forEach(t => {
            if (!equipment && this.equipment[t]) {
                const found = this.equipment[t].find(e => e.id === equipmentId);
                if (found) equipment = found;
            }
        });

        if (!equipment) return { success: false, message: 'Equipment not found' };
        if (this.cash < equipment.maintenanceCost) return { success: false, message: 'Not enough cash' };

        this.cash -= equipment.maintenanceCost;
        equipment.condition = Math.min(100, equipment.condition + 15);
        equipment.lastMaintenance = this.day;
        equipment.breakdownProbability = Math.max(0.01, equipment.breakdownProbability - 0.02);

        this.emit('equipment_maintained', { equipment, cost: equipment.maintenanceCost });
        return { success: true, cost: equipment.maintenanceCost };
    }

    getEquipmentEfficiency() {
        let totalEfficiency = 1.0;
        let count = 0;

        ['ovens', 'mixers', 'displays'].forEach(type => {
            if (this.equipment[type]) {
                this.equipment[type].forEach(item => {
                    totalEfficiency += item.condition / 100;
                    count++;
                });
            }
        });

        return count > 0 ? totalEfficiency / count : 1.0;
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

    setStrategySettings(settings = {}) {
        if (!this.strategySettings) {
            this.strategySettings = {};
        }
        this.strategySettings = {
            ...this.strategySettings,
            ...settings
        };

        if (!this.strategySettings.pricingStyle) {
            this.strategySettings.pricingStyle = 'balanced';
        }

        const buffer = Number(this.strategySettings.inventoryBufferDays);
        this.strategySettings.inventoryBufferDays = Math.max(0.25, Number.isFinite(buffer) ? buffer : 1);

        this.applyPricingStrategy();
    }

    applyPricingStrategy() {
        const styles = GAME_CONFIG.STRATEGY?.PRICING_STYLES || {};
        const pricing = styles[this.strategySettings?.pricingStyle] || { priceMultiplier: 1, elasticityBias: 1 };
        this.strategySettings.pricingElasticity = pricing.elasticityBias || 1;

        this.pricingOverrides = {};
        Object.entries(GAME_CONFIG.RECIPES).forEach(([key, recipe]) => {
            const basePrice = (recipe?.retailPrice || 0) * (pricing.priceMultiplier || 1);
            this.pricingOverrides[key] = Number(basePrice.toFixed(2));
        });
    }

    registerCustomRecipe(recipeConfig = {}) {
        const configKey = recipeConfig.configKey || recipeConfig.id;
        if (!configKey || !recipeConfig.name || !recipeConfig.ingredients) {
            return null;
        }

        const payload = {
            ...GAME_CONFIG.RECIPES[configKey],
            ...recipeConfig,
            id: recipeConfig.slug || recipeConfig.id || configKey.toLowerCase(),
            configKey,
            createdByPlayer: true
        };

        GAME_CONFIG.RECIPES[configKey] = payload;

        if (!this.products[configKey]) {
            this.products[configKey] = { batches: [], soldToday: 0 };
        }

        if (recipeConfig.retailPrice) {
            this.pricingOverrides[configKey] = recipeConfig.retailPrice;
        }

        return GAME_CONFIG.RECIPES[configKey];
    }

    getRecipeBasePrice(recipeKey) {
        if (this.pricingOverrides?.[recipeKey]) {
            return this.pricingOverrides[recipeKey];
        }
        return GAME_CONFIG.RECIPES[recipeKey]?.retailPrice || 0;
    }

    calculateIngredientDemand(targets = {}) {
        const totals = {};
        Object.entries(targets).forEach(([recipeKey, units]) => {
            const recipe = GAME_CONFIG.RECIPES[recipeKey];
            if (!recipe || !units) return;
            Object.entries(recipe.ingredients).forEach(([ingredientKey, amount]) => {
                totals[ingredientKey] = (totals[ingredientKey] || 0) + (amount * units);
            });
        });
        return totals;
    }

    resolveVendorPreference(preference, ingredientKey) {
        if (preference && GAME_CONFIG.VENDORS[preference]) {
            return preference;
        }

        const ingredient = GAME_CONFIG.INGREDIENTS[ingredientKey];
        const category = ingredient?.category;
        const vendors = Object.entries(GAME_CONFIG.VENDORS);

        if (!category || vendors.length === 0) {
            return 'METRO';
        }

        if (preference === 'premium') {
            const match = vendors
                .filter(([, v]) => v.categories?.includes(category))
                .sort((a, b) => (b[1].qualityMultiplier || 1) - (a[1].qualityMultiplier || 1))[0];
            return match ? match[0] : 'METRO';
        }

        if (preference === 'value') {
            const match = vendors
                .filter(([, v]) => v.categories?.includes(category))
                .sort((a, b) => (a[1].priceMultiplier || 1) - (b[1].priceMultiplier || 1))[0];
            return match ? match[0] : 'METRO';
        }

        // balanced/default
        const balanced = vendors.find(([key, v]) => key === 'METRO' && v.categories?.includes(category));
        if (balanced) return balanced[0];

        const fallback = vendors.find(([, v]) => v.categories?.includes(category));
        return fallback ? fallback[0] : 'METRO';
    }

    ensureIngredientInventory({ productionTargets = {}, bufferDays, vendorPreference } = {}) {
        const targets = productionTargets || {};
        if (!targets || Object.keys(targets).length === 0) return;

        const desiredBuffer = bufferDays || this.strategySettings?.inventoryBufferDays || 1;
        const vendorKeyPreference = vendorPreference || this.strategySettings?.vendorPriority || 'METRO';
        const ingredientDemand = this.calculateIngredientDemand(targets);

        Object.entries(ingredientDemand).forEach(([ingredientKey, requiredPerDay]) => {
            const desiredStock = requiredPerDay * desiredBuffer;
            const currentStock = this.getIngredientStock(ingredientKey);
            const deficit = desiredStock - currentStock;
            if (deficit <= 0.05) return;

            const vendorKey = this.resolveVendorPreference(vendorKeyPreference, ingredientKey);
            const purchaseQty = Math.max(0.1, Number(deficit.toFixed(2)));
            const unitPrice = this.getCurrentIngredientPrice(ingredientKey, vendorKey, purchaseQty);
            const projectedCost = unitPrice * purchaseQty;
            const reserveFloor = (this.strategySettings?.cashFloorPercent || 0.1) * this.cash;

            if ((this.cash - projectedCost) <= reserveFloor) {
                return;
            }

            this.purchaseIngredient(ingredientKey, purchaseQty, vendorKey);
        });
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

        const referencePrice = this.getRecipeBasePrice(recipeKey);
        const quality = this.getProductQuality(recipeKey);

        // Quality bonus - higher quality increases willingness to pay
        const qualityBonus = (quality / 100) * (segment.qualityTolerance || 0.8);

        // Maximum price this customer segment will pay
        const maxWillingPrice = referencePrice * (segment.priceMultiplier || 1.0) * (0.8 + qualityBonus * 0.4);

        // Apply event-based willingness modifier
        const willingnessMultiplier = this.economy.getCustomerWillingnessMultiplier();
        const strategyElasticity = this.strategySettings?.pricingElasticity || 1;
        const toleranceBoost = 1 / strategyElasticity;

        return currentPrice <= maxWillingPrice * willingnessMultiplier * toleranceBoost;
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

    getToppingScore(recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe || !recipe.ingredients) return 0;

        return Object.entries(recipe.ingredients).reduce((score, [ingKey, amount]) => {
            const ing = GAME_CONFIG.INGREDIENTS[ingKey];
            if (!ing) return score;
            const role = ing.role || 'base';
            if (role === 'extra') {
                return score + amount;
            }
            return score;
        }, 0);
    }

    applyToppingSatisfaction(recipeKey, quality = 100) {
        const toppingMass = this.getToppingScore(recipeKey);
        const qualityFactor = Math.max(0.5, quality / 100);
        const flavorLift = toppingMass > 0 ? 1 + Math.min(0.6, toppingMass * 0.12 * qualityFactor) : 1;

        this.menuAppeal = (this.menuAppeal * 0.85) + (flavorLift * 0.15);
        this.menuAppeal = Math.max(0.7, Math.min(1.8, this.menuAppeal));

        let moodEmoji = '😊';
        let moodMessage = 'Delicious!';
        if (flavorLift >= 1.4) {
            moodEmoji = '🤩';
            moodMessage = 'Those toppings are unreal!';
        } else if (flavorLift >= 1.15) {
            moodEmoji = '😋';
            moodMessage = 'Love the flavor layers!';
        } else if (flavorLift <= 0.9) {
            moodEmoji = '😐';
            moodMessage = 'Tastes a little plain.';
        }

        return {
            lift: flavorLift,
            moodEmoji,
            moodMessage
        };
    }

    getMenuAppealMultiplier() {
        return Number(this.menuAppeal?.toFixed(2)) || 1;
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

        // Check oven capacity for final baking stage
        const activeBaking = this.productionQueue.filter(p => p.currentStage === 'baking').length;
        if (activeBaking >= this.ovenCapacity) {
            return { success: false, message: 'Oven is full! Wait for items to finish.' };
        }

        // Consume ingredients and get quality info
        const { avgQuality, totalCost } = this.consumeIngredients(recipeKey, quantity);

        // Define preparation stages based on recipe complexity
        const prepStages = this.getPrepStages(recipeKey);

        // Add to queue with multi-stage production
        const productionItem = {
            id: Date.now() + Math.random(),
            recipeKey,
            recipeName: recipe.name,
            recipeIcon: recipe.icon,
            quantity,
            currentStage: prepStages[0].id,
            stageIndex: 0,
            stages: prepStages,
            progress: 0,
            totalTime: prepStages[0].duration,
            startTime: Date.now(),
            unitCost: totalCost / quantity,
            ingredientQuality: avgQuality,
            prepQuality: 100, // Starts at 100%, can degrade with poor prep
            assignedEmployee: null, // Will be auto-assigned
            employeeSkillImpact: 1.0, // Multiplier based on employee skill
            waitingForOven: false,
            hasOvenSlot: false,
            completed: false
        };

        this.productionQueue.push(productionItem);

        // Auto-assign employee if available
        this.autoAssignEmployee(productionItem);

        this.emit('baking_started', productionItem);

        const qualityLabel = this.getQualityLabel(avgQuality);
        return {
            success: true,
            message: `Started preparing ${quantity}x ${recipe.name}! ${qualityLabel.emoji} ${qualityLabel.label} ingredients`,
            item: productionItem,
            ingredientQuality: avgQuality
        };
    }

    getPrepStages(recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        // Convert bake minutes to milliseconds but aggressively speed up for gameplay pacing
        const baseTime = Math.max(2000, (recipe.bakeTime * 60 * 1000) / 12);

        // Different recipes have different preparation stages
        const stageTemplates = {
            croissant: [
                { id: 'mixing', name: '🥄 Mixing Dough', duration: baseTime * 0.2, skillRequired: 2 },
                { id: 'laminating', name: '📐 Laminating', duration: baseTime * 0.3, skillRequired: 4 },
                { id: 'shaping', name: '✂️ Shaping', duration: baseTime * 0.15, skillRequired: 3 },
                { id: 'proofing', name: '⏱️ Proofing', duration: baseTime * 0.2, skillRequired: 1 },
                { id: 'baking', name: '🔥 Baking', duration: baseTime * 0.15, skillRequired: 2 }
            ],
            baguette: [
                { id: 'mixing', name: '🥄 Mixing Dough', duration: baseTime * 0.25, skillRequired: 2 },
                { id: 'folding', name: '🤲 Folding', duration: baseTime * 0.2, skillRequired: 3 },
                { id: 'shaping', name: '✂️ Shaping', duration: baseTime * 0.2, skillRequired: 3 },
                { id: 'scoring', name: '🔪 Scoring', duration: baseTime * 0.1, skillRequired: 4 },
                { id: 'baking', name: '🔥 Baking', duration: baseTime * 0.25, skillRequired: 2 }
            ],
            default: [
                { id: 'prep', name: '🥄 Preparing', duration: baseTime * 0.3, skillRequired: 2 },
                { id: 'mixing', name: '🌀 Mixing', duration: baseTime * 0.2, skillRequired: 2 },
                { id: 'shaping', name: '👐 Shaping', duration: baseTime * 0.2, skillRequired: 2 },
                { id: 'baking', name: '🔥 Baking', duration: baseTime * 0.3, skillRequired: 2 }
            ]
        };

        return stageTemplates[recipeKey] || stageTemplates.default;
    }

    autoAssignEmployee(productionItem) {
        if (this.staff.length === 0) {
            productionItem.assignedEmployee = null;
            productionItem.employeeSkillImpact = 0.7;
            return;
        }

        // Find best available employee based on:
        // 1. Not too fatigued
        // 2. Skill level appropriate for current stage
        // 3. Currently not assigned to too many tasks

        const currentStage = productionItem.stages[productionItem.stageIndex];
        const availableStaff = this.staff.filter(s => s.fatigue < 80);

        if (availableStaff.length === 0) {
            productionItem.assignedEmployee = null;
            return;
        }

        // Count current assignments
        const assignments = {};
        this.staff.forEach(s => assignments[s.id] = 0);
        this.productionQueue.forEach(item => {
            if (item.assignedEmployee) {
                assignments[item.assignedEmployee.id] = (assignments[item.assignedEmployee.id] || 0) + 1;
            }
        });

        // Find employee with best skill match and fewest assignments
        let bestEmployee = availableStaff[0];
        let bestScore = -1000;

        availableStaff.forEach(employee => {
            const skillMatch = employee.skillLevel >= currentStage.skillRequired ? 10 : -5;
            const workload = -(assignments[employee.id] || 0) * 3;
            const happiness = employee.happiness / 10;
            const score = skillMatch + workload + happiness;

            if (score > bestScore) {
                bestScore = score;
                bestEmployee = employee;
            }
        });

        if (productionItem.assignedEmployee && productionItem.assignedEmployee.id !== bestEmployee.id) {
            productionItem.assignedEmployee.currentTaskId = null;
        }

        productionItem.assignedEmployee = bestEmployee;
        bestEmployee.currentTaskId = productionItem.id;

        // Calculate skill impact on speed and quality
        const stage = productionItem.stages[productionItem.stageIndex];
        const skillDiff = bestEmployee.skillLevel - stage.skillRequired;

        // Better skills = faster and better quality
        productionItem.employeeSkillImpact = Math.max(0.5, 1.0 + (skillDiff * 0.1)); // Keep a reasonable floor

        return bestEmployee;
    }

    updateProduction(deltaMs) {
        if (this.productionQueue.length === 0) return [];

        const completedItems = [];
        let bakingSlotsInUse = this.getActiveBakingCount();

        this.productionQueue.forEach(item => {
            if (item.completed) return;

            const stage = item.stages[item.stageIndex];
            if (!stage) return;

            item.totalTime = stage.duration;

            // Ensure oven capacity is respected before progressing baking stages
            if (stage.id === 'baking') {
                if (!item.hasOvenSlot) {
                    if (bakingSlotsInUse < this.ovenCapacity) {
                        item.hasOvenSlot = true;
                        item.waitingForOven = false;
                        bakingSlotsInUse++;
                    } else {
                        item.waitingForOven = true;
                        return; // Wait until an oven slot frees up
                    }
                }
            }

            const speedMultiplier = this.getProductionSpeedMultiplier(item, stage);
            item.progress += deltaMs * speedMultiplier;

            if (item.progress >= item.totalTime) {
                const hadBakingSlot = stage.id === 'baking' && item.hasOvenSlot;
                const result = this.completeProductionStage(item, stage);

                if (hadBakingSlot) {
                    bakingSlotsInUse = Math.max(0, bakingSlotsInUse - 1);
                    item.hasOvenSlot = false;
                }

                if (result?.finished) {
                    item.completed = true;
                    completedItems.push(result.finished);
                }
            }
        });

        // Remove completed items from the queue
        this.productionQueue = this.productionQueue.filter(item => !item.completed);

        return completedItems;
    }

    getActiveBakingCount() {
        return this.productionQueue.reduce((count, item) => {
            const stage = item.stages[item.stageIndex];
            if (!item.completed && stage && stage.id === 'baking' && item.hasOvenSlot) {
                return count + 1;
            }
            return count;
        }, 0);
    }

    getProductionSpeedMultiplier(item, stage) {
        const staffMult = item.assignedEmployee ? item.employeeSkillImpact : 0.7;
        const equipmentMult = this.getEquipmentEfficiency();
        const stagePressure = stage.id === 'baking' ? 1.1 : 1.0;
        const base = this.bakingSpeedMultiplier || 1.0;
        const gameSpeed = this.gameSpeed || 1.0;
        return Math.max(0.25, staffMult * equipmentMult * base * stagePressure * gameSpeed);
    }

    completeProductionStage(item, stage) {
        const qualityImpact = this.calculateStageQualityImpact(item, stage);
        item.prepQuality = Math.max(40, Math.min(110, item.prepQuality * qualityImpact));

        this.applyEmployeeWorkload(item.assignedEmployee, stage);

        if (item.stageIndex >= item.stages.length - 1) {
            return { finished: this.finishProductionItem(item) };
        }

        // Advance to the next stage
        item.stageIndex++;
        const nextStage = item.stages[item.stageIndex];
        item.currentStage = nextStage.id;
        item.progress = 0;
        item.totalTime = nextStage.duration;
        item.waitingForOven = nextStage.id === 'baking';
        item.hasOvenSlot = false;

        this.autoAssignEmployee(item);

        return { finished: null };
    }

    applyEmployeeWorkload(employee, stage) {
        if (!employee) return;

        const minutesWorked = Math.max(1, stage.duration / 60000);
        const hoursWorked = minutesWorked / 60;

        employee.hoursWorkedToday += hoursWorked;
        employee.hoursWorkedThisWeek += hoursWorked;

        const fatigueGain = minutesWorked * 0.5;
        employee.fatigue = Math.min(100, employee.fatigue + fatigueGain);

        if (stage.id === 'baking') {
            employee.happiness = Math.min(100, employee.happiness + 0.2);
        }
    }

    finishProductionItem(item) {
        const recipe = GAME_CONFIG.RECIPES[item.recipeKey];
        if (!recipe) return null;

        const product = this.products[item.recipeKey];
        const finalQuality = Math.max(0, Math.min(100, (item.ingredientQuality * 0.6) + (item.prepQuality * 0.4)));

        product.batches.push({
            quantity: item.quantity,
            quality: finalQuality,
            bakeDay: this.day,
            ingredientQuality: item.ingredientQuality,
            unitCost: item.unitCost
        });

        if (item.assignedEmployee) {
            item.assignedEmployee.currentTaskId = null;
        }

        const summary = {
            recipeKey: item.recipeKey,
            recipeName: item.recipeName,
            recipeIcon: item.recipeIcon,
            quantity: item.quantity,
            quality: finalQuality
        };

        this.emit('baking_complete', summary);
        return summary;
    }


    calculateStageQualityImpact(item, stage) {
        if (!item.assignedEmployee) {
            // No employee = poor quality (80-90%)
            return 0.8 + Math.random() * 0.1;
        }

        const employee = item.assignedEmployee;

        // Base quality from employee skill vs requirement
        let qualityMult = 1.0;
        const skillDiff = employee.skillLevel - stage.skillRequired;

        if (skillDiff >= 2) {
            qualityMult = 1.0 + Math.random() * 0.05; // Expert: 100-105%
        } else if (skillDiff >= 0) {
            qualityMult = 0.98 + Math.random() * 0.04; // Adequate: 98-102%
        } else if (skillDiff >= -1) {
            qualityMult = 0.92 + Math.random() * 0.08; // Struggling: 92-100%
        } else {
            qualityMult = 0.80 + Math.random() * 0.12; // Underqualified: 80-92%
        }

        // Fatigue penalty
        const fatiguePenalty = employee.fatigue / 200; // 0-0.5
        qualityMult -= fatiguePenalty;

        // Happiness bonus
        const happinessBonus = (employee.happiness - 50) / 500; // -0.1 to +0.1
        qualityMult += happinessBonus;

        return Math.max(0.7, Math.min(1.1, qualityMult));
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

            // Quality-adjusted pricing anchored to strategy base price
            const priceMultiplier = this.getQualityPriceMultiplier(batch.quality);
            const unitRevenue = this.getRecipeBasePrice(recipeKey) * priceMultiplier;

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
        const appeal = this.applyToppingSatisfaction(recipeKey, avgQuality);
        this.emit('sale', { recipe, quantity, revenue: totalRevenue, profit, quality: avgQuality, appeal });

        return {
            success: true,
            revenue: totalRevenue,
            profit,
            quality: avgQuality,
            qualityLabel: qualityLabel.label,
            priceMultiplier: this.getQualityPriceMultiplier(avgQuality),
            appeal
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

        // Add prorated monthly costs (insurance, utilities, staff benefits)
        const monthlyExpenses = [
            { name: 'Insurance', amount: this.monthlyInsurance / 30, key: 'insurance' },
            { name: 'Utilities', amount: this.monthlyUtilities / 30, key: 'utilities' },
            { name: 'Staff Salaries', amount: this.monthlyStaffCost / 30, key: 'payroll' }
        ];

        monthlyExpenses.forEach(exp => {
            if (exp.amount > 0) {
                totalExpenses += exp.amount;
                expenses.push(exp);
            }
        });

        this.cash -= totalExpenses;
        this.allTimeStats.totalExpenses += totalExpenses;

        return { total: totalExpenses, expenses };
    }

    processStaffEndOfDay() {
        const report = {
            totalStaff: this.staff.length,
            avgHappiness: 0,
            avgFatigue: 0,
            overtimeHours: 0,
            fatigueRecovery: 0
        };

        if (this.staff.length === 0) return report;

        let totalHappiness = 0;
        let totalFatigue = 0;

        this.staff.forEach(staff => {
            // Fatigue recovery (20% per night)
            const recovery = staff.fatigue * 0.2;
            staff.fatigue = Math.max(0, staff.fatigue - recovery);
            report.fatigueRecovery += recovery;

            // Check for overtime
            if (staff.hoursWorkedToday > 8) {
                report.overtimeHours += (staff.hoursWorkedToday - 8);
            }

            // Small daily happiness decay if overworked
            if (staff.hoursWorkedToday > 10) {
                staff.happiness -= 2;
            } else if (staff.hoursWorkedToday < 4) {
                staff.happiness += 1; // Light day improves morale
            }

            staff.happiness = Math.max(0, Math.min(100, staff.happiness));
            totalHappiness += staff.happiness;
            totalFatigue += staff.fatigue;

            staff.daysWorked++;
        });

        report.avgHappiness = totalHappiness / this.staff.length;
        report.avgFatigue = totalFatigue / this.staff.length;

        return report;
    }

    calculateOvertimeCost() {
        let overtimeCost = 0;

        this.staff.forEach(staff => {
            if (staff.hoursWorkedToday > 8) {
                const overtimeHours = staff.hoursWorkedToday - 8;
                const hourlyRate = (staff.baseSalary / 30) / 8; // Daily rate / 8 hours
                overtimeCost += overtimeHours * hourlyRate * 1.5; // 1.5x pay for overtime
            }
        });

        return overtimeCost;
    }

    // ==================== DAY MANAGEMENT ====================
    endDay() {
        const expenseResult = this.payDailyExpenses();

        // Update quality of ingredients and products (decay overnight)
        const spoiledIngredients = this.updateIngredientQuality();
        const staleProducts = this.updateProductQuality();

        // Process staff: payroll, fatigue recovery, happiness updates
        const staffReport = this.processStaffEndOfDay();

        // Update equipment condition and check for breakdowns
        const equipmentReport = this.updateEquipmentCondition();

        // Calculate overtime costs
        const overtimeCost = this.calculateOvertimeCost();

        const summary = {
            day: this.day,
            revenue: this.dailyStats.revenue,
            cogs: this.dailyStats.cogs,
            grossProfit: this.dailyStats.grossProfit,
            expenses: expenseResult.total + overtimeCost,
            expenseDetails: expenseResult.expenses,
            overtimeCost: overtimeCost,
            netProfit: this.dailyStats.grossProfit - expenseResult.total - overtimeCost,
            customersServed: this.dailyStats.customersServed,
            customersMissed: this.dailyStats.customersMissed,
            itemsSold: this.dailyStats.itemsSold,
            cashEnd: this.cash,
            spoiledIngredients: spoiledIngredients,
            staleProducts: staleProducts,
            staffReport: staffReport,
            equipmentReport: equipmentReport,
            economyReport: this.economy.simulateDay(this.day)
        };

        this.allTimeStats.daysOperated++;

        // Reset daily stats
        this.dailyStats = {
            revenue: 0, cogs: 0, grossProfit: 0,
            customersServed: 0, customersMissed: 0, itemsSold: 0
        };

        // Reset staff daily hours
        this.staff.forEach(s => s.hoursWorkedToday = 0);

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
            economy: this.economy && typeof this.economy.save === 'function'
                ? this.economy.save()
                : null
        };
    }

    load(data) {
        if (data.cash !== undefined) this.cash = data.cash;
        if (data.day !== undefined) this.day = data.day;
        if (data.ingredients) this.ingredients = data.ingredients;
        if (data.products) this.products = data.products;
        if (data.allTimeStats) this.allTimeStats = data.allTimeStats;
        if (data.economy && this.economy && typeof this.economy.load === 'function') {
            this.economy.load(data.economy);
        }
    }
}

window.FinancialEngine = FinancialEngine;
