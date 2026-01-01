/**
 * GameController.js - Main game loop with guided sequential mode flow
 */

class GameController {
    constructor() {
        this.engine = null;
        this.economy = null;
        this.dashboard = null;
        this.tutorial = null;
        this.currentPhase = 'menu'; // menu, buying, baking, selling, summary
        this.phaseOrder = ['buying', 'baking', 'selling', 'summary'];
        this.phaseIndex = 0;
        this.isRunning = false;
        this.lastUpdate = 0;
        this.activeCustomers = [];
        this.crisisActive = false;
        this.productionTargets = {};
        this.philosophySystem = null;
        this.strategySettings = null;
        this.automationLog = [];
        this.maxAutomationLog = 25;
        this.automationEnabled = false;
        this.lastAutomationState = null;
        this.customRecipes = [];
        this.recipeBookState = { page: 0, perSpread: 2 };

        this.init();
    }

    init() {
        this.engine = new FinancialEngine();
        this.economy = new EconomicSimulation();

        // Connect the economy to the engine
        this.engine.economy = this.economy;

        this.dashboard = new FinancialDashboard(this); // Pass gameController, not economy
        this.tutorial = new TutorialSystem(this);
        this.setupEventListeners();
        this.initializeStrategyLayer();
        this.updateAutomationAvailability();
        this.renderAutomationFeed();
        this.showMainMenu();
    }

    setupEventListeners() {
        // Engine events
        this.engine.on('baking_started', (item) => {
            window.dispatchEvent(new CustomEvent('engine:baking_started', { detail: { item } }));
            this.updateStats();
        });

        this.engine.on('baking_complete', (item) => {
            this.showPopup({
                icon: item.recipeIcon,
                title: 'Baking Complete!',
                message: `${item.quantity}x ${item.recipeName} is ready!`,
                type: 'success',
                autoClose: 2000
            });
            this.renderReadyProducts();
            this.renderProductionQueue();
            this.renderDisplayProducts();
            this.maintainProductionTargets();
            this.updateStats();
        });

        this.engine.on('hour_change', (data) => {
            this.showPopup({
                icon: '🕐',
                title: `Time: ${this.engine.getTimeString()}`,
                message: data.hour >= 17 ? 'Shop closing soon!' : 'Another hour passes...',
                type: 'info',
                autoClose: 1500
            });
        });

        this.engine.on('sale', (data) => {
            window.dispatchEvent(new CustomEvent('engine:sale', { detail: data }));
            this.renderDisplayProducts();
            this.renderReadyProducts();
            this.maintainProductionTargets();
            this.updateStats();
        });

        this.engine.on('purchase', (data) => {
            window.dispatchEvent(new CustomEvent('engine:purchase', { detail: data }));
            this.maintainProductionTargets();
            this.updateStats();
        });

        this.engine.on('staff_hired', (staff) => {
            this.logAutomationEvent('staff', `${staff.name} joined the team`, { staff: staff.name });
            this.updateAutomationAvailability();
        });

        this.engine.on('staff_fired', (info) => {
            if (info?.staff?.name) {
                this.logAutomationEvent('staff', `${info.staff.name} left the bakery`, { staff: info.staff.name, severity: 'warning' });
            }
            this.updateAutomationAvailability();
        });

        this.engine.on('staff_trained', (staff) => {
            this.logAutomationEvent('staff', `${staff.name} completed training`, { staff: staff.name });
            this.renderAutomationFeed();
        });
    }

    hasOperationalStaff() {
        return Array.isArray(this.engine?.staff) && this.engine.staff.length > 0;
    }

    updateAutomationAvailability() {
        const wasEnabled = this.automationEnabled;
        this.automationEnabled = this.hasOperationalStaff();
        if (wasEnabled !== this.automationEnabled) {
            if (this.automationEnabled) {
                this.logAutomationEvent('ops', 'Automation activated — staff are now handling routines.');
                this.onAutomationActivated();
            } else {
                this.logAutomationEvent('ops', 'Automation paused — hire staff to resume hands-off mode.', { severity: 'warning' });
            }
        }
        this.renderAutomationFeed();
    }

    logAutomationEvent(type, message, meta = {}) {
        const entry = {
            id: Date.now() + Math.random(),
            type,
            message,
            meta,
            timestamp: new Date().toISOString()
        };
        this.automationLog.unshift(entry);
        if (this.automationLog.length > this.maxAutomationLog) {
            this.automationLog.pop();
        }
        this.renderAutomationFeed();
    }

    getAutomationIcon(type) {
        const map = {
            production: '🏭',
            procurement: '📦',
            ops: '⚙️',
            service: '🧑‍🍳',
            sale: '💰',
            staff: '👥'
        };
        return map[type] || 'ℹ️';
    }

    renderAutomationFeed() {
        if (typeof document === 'undefined') return;
        let panel = document.getElementById('automation-feed-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'automation-feed-panel';
            panel.className = 'automation-feed-panel';
            document.body.appendChild(panel);
        }

        const statusLabel = this.automationEnabled ? 'Active' : 'Paused';
        const statusClass = this.automationEnabled ? 'active' : 'paused';
        const entriesHtml = this.automationLog.length === 0
            ? '<div class="automation-empty">No automation events yet</div>'
            : this.automationLog.slice(0, 6).map(entry => {
                const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const icon = this.getAutomationIcon(entry.type);
                const severity = entry.meta?.severity ? ` severity-${entry.meta.severity}` : '';
                return `
                    <div class="automation-entry ${entry.type}${severity}">
                        <div class="automation-entry-icon">${icon}</div>
                        <div class="automation-entry-body">
                            <div class="automation-entry-message">${entry.message}</div>
                            <div class="automation-entry-meta">${time}</div>
                        </div>
                    </div>
                `;
            }).join('');

        const staffHtml = (this.engine?.staff || []).map(staff => {
            const isServing = staff.currentCustomer ? `Serving ${staff.currentCustomer.name}` : (staff.currentTaskId ? 'On prep task' : 'Idle');
            return `
                <div class="automation-staff-row">
                    <span>${staff.face || '🧑‍🍳'}</span>
                    <div>
                        <div class="staff-name">${staff.name}</div>
                        <div class="staff-task">${isServing}</div>
                    </div>
                </div>
            `;
        }).join('') || '<div class="automation-empty">No staff assigned</div>';

        panel.innerHTML = `
            <div class="automation-feed-header">
                <div>
                    <div class="automation-feed-title">Automation Feed</div>
                    <div class="automation-feed-status ${statusClass}">${statusLabel}</div>
                </div>
                <span class="automation-feed-count">${this.automationLog.length}</span>
            </div>
            <div class="automation-feed-section">
                ${entriesHtml}
            </div>
            <div class="automation-feed-section staff">
                <div class="automation-feed-subtitle">On-duty Staff</div>
                ${staffHtml}
            </div>
        `;
    }

    onAutomationActivated() {
        // Kick off automation tasks the moment staffing allows it
        this.maintainProductionTargets();
        this.enforceInventoryPlan();
        this.resumeWaitingCustomers();
        this.renderCustomerArea();
    }

    manualAutomationTrigger(context) {
        if (!this.hasOperationalStaff()) {
            this.showPopup({
                icon: '👥',
                title: 'No Staff Available',
                message: 'Hire at least one employee before deploying automation.',
                type: 'warning'
            });
            return;
        }

        this.updateAutomationAvailability();

        const labels = {
            buying: 'Buying',
            baking: 'Baking',
            selling: 'Selling'
        };

        let message = '';

        switch (context) {
            case 'buying':
                this.enforceInventoryPlan();
                this.renderInventory();
                this.renderRecipeReference();
                message = 'Procurement plan executed. Inventory updated.';
                break;
            case 'baking':
                this.maintainProductionTargets();
                this.renderProductionQueue();
                this.renderReadyProducts();
                this.renderRecipes();
                const bakingList = document.getElementById('employee-list');
                if (bakingList) bakingList.innerHTML = this.renderEmployeePanel();
                message = 'Production queue synced with automation targets.';
                break;
            case 'selling':
                this.resumeWaitingCustomers();
                this.renderCustomerArea();
                const sellList = document.getElementById('employee-list-selling');
                if (sellList) sellList.innerHTML = this.renderEmployeeSelling();
                message = 'Front-of-house staff reassigned to active customers.';
                break;
            default:
                this.maintainProductionTargets();
                this.enforceInventoryPlan();
                break;
        }

        this.logAutomationEvent('ops', `Manual automation trigger — ${labels[context] || 'General'}`, {
            context,
            manual: true
        });

        if (message) {
            this.showPopup({
                icon: '🤖',
                title: 'Staff Deployed',
                message,
                type: 'success',
                autoClose: 1600
            });
        }
    }

    initializeStrategyLayer() {
        if (!window.BusinessPhilosophy || !GAME_CONFIG.STRATEGY) {
            console.warn('BusinessPhilosophy system unavailable; defaulting to manual controls.');
            return;
        }

        this.philosophySystem = new BusinessPhilosophy(GAME_CONFIG.STRATEGY);
        this.applyStrategySettings({ keepTargets: false, skipAutomation: true });
    }

    applyStrategySettings(options = {}) {
        if (!this.philosophySystem) return;

        if (options.philosophy) {
            this.philosophySystem.selectPhilosophy(options.philosophy);
        }
        if (options.playbook) {
            this.philosophySystem.selectPlaybook(options.playbook);
        }
        if (options.pricingStyle) {
            this.philosophySystem.setPricingStyle(options.pricingStyle);
        }
        if (options.marketingFocus) {
            this.philosophySystem.setMarketingFocus(options.marketingFocus);
        }
        if (options.bufferDays !== undefined) {
            this.philosophySystem.setInventoryBufferDays(options.bufferDays);
        }

        this.strategySettings = this.philosophySystem.getStrategySnapshot();

        if (!options.keepTargets) {
            const refreshedTargets = this.philosophySystem.getProductionTargets();
            if (refreshedTargets && Object.keys(refreshedTargets).length > 0) {
                this.productionTargets = refreshedTargets;
            }
        }

        this.engine.setStrategySettings(this.strategySettings);
        if (!options.skipAutomation) {
            this.maintainProductionTargets();
            this.enforceInventoryPlan();
        }
    }

    // ==================== RECIPE LAB ====================
    showRecipeLab() {
        this.stopBakingLoop();
        this.stopSellingLoop();
        this.currentPhase = 'recipes';

        const container = document.getElementById('game-container');
        if (!container) return;

        container.classList.remove('full-screen');
        container.style.padding = '';

        container.innerHTML = `
            <div class="phase-header flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-3xl font-bold text-amber-500 drop-shadow-md">📚 Recipe Lab</h2>
                    <p class="text-amber-200/80 text-sm mt-1">Craft signature pastries in your personal recipe book.</p>
                </div>
                <button class="btn bg-stone-800 hover:bg-stone-700 border border-stone-600 text-amber-100 px-4 py-2 rounded-lg transition-colors" id="btn-recipe-exit">
                    Return to Hub
                </button>
            </div>

            <div class="recipe-book-container">
                <div class="recipe-book-3d" id="recipe-book-3d">
                    <div class="book-cover-back"></div>
                    <div class="book-spine-center"></div>
                    
                    <!-- Left Page: Recipe Basics -->
                    <div class="book-page-wrapper left">
                        <div class="book-content" id="book-page-left">
                            <!-- Content injected by JS -->
                        </div>
                    </div>

                    <!-- Right Page: Toppings & Finish -->
                    <div class="book-page-wrapper right">
                        <div class="book-content" id="book-page-right">
                            <!-- Content injected by JS -->
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="custom-recipe-library mt-8" id="custom-recipe-library"></div>
        `;

        document.getElementById('btn-recipe-exit').onclick = () => this.showModeHub();

        this.renderRecipeCreationSpread();
        this.setupRecipeBookEvents();
        this.renderCustomRecipeLibrary();

        // Animate book entrance
        if (window.gsap) {
            gsap.from('.recipe-book-container', {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: 'power3.out',
                delay: 0.1
            });

            // Open the book effect
            gsap.from('.book-page-wrapper.left', {
                duration: 1.5,
                rotateY: -180, // Start closed
                ease: 'power2.out',
                delay: 0.3
            });

            // Draggable disabled - it blocks input interactions
            // this.initRecipeBookDraggable();
        }
    }

    initRecipeBookDraggable() {
        if (!window.Draggable) return;

        Draggable.create("#recipe-book-3d", {
            type: "rotation",
            trigger: ".recipe-book-container",
            inertia: true,
            bounds: { minRotation: -10, maxRotation: 10 }, // Subtle tilt
            onDrag: function () {
                gsap.to(".recipe-book-3d", { rotationY: this.x / 5, duration: 0.1 });
            },
            onRelease: function () {
                gsap.to(".recipe-book-3d", { rotationY: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
            }
        });
    }

    renderRecipeCreationSpread() {
        const leftPage = document.getElementById('book-page-left');
        const rightPage = document.getElementById('book-page-right');

        if (!leftPage || !rightPage) return;

        // --- Left Page Content ---
        const pastryOptions = Object.entries(GAME_CONFIG.PASTRY_TYPES || {}).map(([key, type]) =>
            `<option value="${key}">${type.icon || '🧁'} ${type.name}</option>`
        ).join('');

        const baseIngredients = this.getIngredientOptions('base');
        const baseGrid = baseIngredients.map(ing => this.createIngredientPill(ing)).join('');

        leftPage.innerHTML = `
            <div class="flex flex-col h-full" style="pointer-events: auto;">
                <div class="mb-6 border-b-2 border-amber-900/10 pb-4">
                    <h3 class="text-2xl font-hand text-amber-900 mb-4">New Creation</h3>
                    
                    <div class="mb-4" style="position: relative; z-index: 50;">
                        <label class="block text-xs uppercase tracking-wider text-amber-800/60 font-bold mb-1">Name</label>
                        <input type="text" id="recipe-name" class="handwritten-input" placeholder="My Tasty Treat" autocomplete="off" style="position: relative; z-index: 51; pointer-events: auto;">
                    </div>

                    <div class="mb-2" style="position: relative; z-index: 50;">
                        <label class="block text-xs uppercase tracking-wider text-amber-800/60 font-bold mb-1">Pastry Type</label>
                        <select id="pastry-type" class="w-full bg-transparent border-b border-amber-900/20 py-1 text-amber-900 font-medium focus:outline-none focus:border-amber-800" style="position: relative; z-index: 51; pointer-events: auto; cursor: pointer; -webkit-appearance: menulist; appearance: menulist;">
                            ${pastryOptions}
                        </select>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto pr-2">
                    <h4 class="font-hand text-xl text-amber-800 mb-3">Base Mix</h4>
                    <p class="text-xs text-amber-900/60 mb-3 italic">Select at least 2 base ingredients.</p>
                    <div class="grid grid-cols-2 gap-3">
                        ${baseGrid}
                    </div>
                </div>
            </div>
        `;

        // --- Right Page Content ---
        const extraIngredients = this.getIngredientOptions('extra');
        const extraGrid = extraIngredients.map(ing => this.createIngredientPill(ing)).join('');

        rightPage.innerHTML = `
            <div class="flex flex-col h-full" style="pointer-events: auto;">
                <div class="flex-1 overflow-y-auto mb-6 pr-2">
                    <h4 class="font-hand text-xl text-amber-800 mb-3">Toppings & Extras</h4>
                    <p class="text-xs text-amber-900/60 mb-3 italic">Add flavor to boost satisfaction.</p>
                    <div class="grid grid-cols-2 gap-3">
                        ${extraGrid}
                    </div>
                </div>

                <div class="mt-auto bg-white/50 p-4 rounded-lg border border-amber-900/10">
                    <div id="recipe-preview-stats" class="grid grid-cols-2 gap-4 mb-4 text-sm text-amber-900">
                        <!-- Stats injected here -->
                    </div>
                    
                    <button id="btn-save-recipe" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded shadow-md transform transition hover:-translate-y-0.5 active:translate-y-0">
                        Save to Recipe Box
                    </button>
                </div>
            </div>
        `;

        this.updateRecipePreview();
    }

    createIngredientPill(ing) {
        return `
            <div class="ingredient-pill group relative bg-white/60 border border-amber-900/10 rounded-lg p-2 flex items-center gap-2 hover:bg-white transition-colors"
                 data-key="${ing.key}" 
                 data-role="${ing.role || 'base'}"
                 data-default="${ing.defaultAmount}"
                 style="pointer-events: auto; cursor: pointer;"
                 onclick="game.toggleIngredient(this)">
                <div class="text-2xl">${ing.icon}</div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-amber-900 truncate">${ing.name}</div>
                    <div class="text-xs text-amber-700/50">$${ing.basePrice?.toFixed(2) || '0.00'}</div>
                </div>
                <div class="amount-control hidden absolute right-2 bg-amber-100 rounded px-1 flex items-center shadow-sm z-10">
                    <input type="number" 
                           class="w-12 bg-transparent text-right text-sm font-bold text-amber-900 focus:outline-none" 
                           value="${ing.defaultAmount}" 
                           step="0.1" min="0"
                           style="pointer-events: auto; z-index: 100; cursor: text;"
                           onclick="event.stopPropagation()"
                           onmousedown="event.stopPropagation()"
                           oninput="game.updateRecipePreview()">
                </div>
            </div>
        `;
    }

    toggleIngredient(el) {
        const inputContainer = el.querySelector('.amount-control');
        const input = inputContainer.querySelector('input');

        if (el.classList.contains('active')) {
            // Deactivate
            el.classList.remove('active', 'bg-amber-100', 'border-amber-400');
            el.classList.add('bg-white/60');
            inputContainer.classList.add('hidden');
            input.value = 0; // Reset for calculation
        } else {
            // Activate
            el.classList.add('active', 'bg-amber-100', 'border-amber-400');
            el.classList.remove('bg-white/60');
            inputContainer.classList.remove('hidden');
            input.value = el.dataset.default;
        }
        this.updateRecipePreview();
    }

    setupRecipeBookEvents() {
        const nameInput = document.getElementById('recipe-name');
        const typeInput = document.getElementById('pastry-type');
        const saveBtn = document.getElementById('btn-save-recipe');

        if (nameInput) nameInput.addEventListener('input', () => this.updateRecipePreview());
        if (typeInput) typeInput.addEventListener('change', () => this.updateRecipePreview());
        if (saveBtn) saveBtn.addEventListener('click', (e) => this.handleRecipeCreation(e));

        // Expose toggleIngredient to global scope for inline onclick
        // window.game is already set in DOMContentLoaded
    }

    getIngredientOptions(role) {
        return Object.entries(GAME_CONFIG.INGREDIENTS || {})
            .filter(([, ing]) => (ing.role || 'base') === role)
            .map(([key, ing]) => ({
                key,
                ...ing,
                defaultAmount: role === 'base' ? (ing.defaultAmount || 0.5) : 0.2
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    collectRecipeFormData(options = {}) {
        const nameInput = document.getElementById('recipe-name');
        if (!nameInput) return null;

        const name = nameInput.value.trim();
        const pastryType = document.getElementById('pastry-type').value;

        const base = {};
        const extra = {};

        // Scan all active pills
        document.querySelectorAll('.ingredient-pill.active').forEach(pill => {
            const key = pill.dataset.key;
            const role = pill.dataset.role;
            const amount = parseFloat(pill.querySelector('input').value) || 0;

            if (amount > 0) {
                if (role === 'extra') extra[key] = amount;
                else base[key] = amount;
            }
        });

        if (!options.skipValidation) {
            if (!name) {
                this.showPopup({ icon: '✏️', title: 'Name Required', message: 'Give your recipe a name!', type: 'warning', autoClose: 1500 });
                return null;
            }
            if (Object.keys(base).length < 2) {
                this.showPopup({ icon: '🧁', title: 'Add More Base', message: 'Pick at least two base ingredients.', type: 'warning', autoClose: 1600 });
                return null;
            }
        }

        const ingredients = { ...base, ...extra };
        return { name, pastryType, baseIngredients: base, extraIngredients: extra, ingredients };
    }

    calculateCustomRecipeStats(data) {
        const type = GAME_CONFIG.PASTRY_TYPES?.[data.pastryType] || {};
        const cost = Object.entries(data.ingredients).reduce((sum, [key, amount]) => {
            const ing = GAME_CONFIG.INGREDIENTS[key];
            return sum + ((ing?.basePrice || 0) * amount);
        }, 0);
        const extraWeight = Object.values(data.extraIngredients || {}).reduce((sum, amount) => sum + amount, 0);
        const markup = type.priceMultiplier || 2.6;
        const flavorBonus = extraWeight > 0 ? 1 + Math.min(0.4, extraWeight * 0.08) : 1;
        const price = Math.max(type.minPrice || 2.5, Number((cost * markup * flavorBonus).toFixed(2)));

        return { cost, extraWeight, price };
    }

    updateRecipePreview() {
        const statsContainer = document.getElementById('recipe-preview-stats');
        if (!statsContainer) return;

        const data = this.collectRecipeFormData({ skipValidation: true });

        if (!data || Object.keys(data.ingredients).length === 0) {
            statsContainer.innerHTML = `
                <div class="text-center"><span class="block opacity-60 text-xs">Cost</span><span class="font-bold text-lg">-</span></div>
                <div class="text-center"><span class="block opacity-60 text-xs">Price</span><span class="font-bold text-lg">-</span></div>
            `;
            return;
        }

        const stats = this.calculateCustomRecipeStats(data);

        statsContainer.innerHTML = `
            <div class="text-center">
                <span class="block opacity-60 text-xs uppercase tracking-wider">Batch Cost</span>
                <span class="font-bold text-xl text-amber-800">$${stats.cost.toFixed(2)}</span>
            </div>
            <div class="text-center">
                <span class="block opacity-60 text-xs uppercase tracking-wider">Sell Price</span>
                <span class="font-bold text-xl text-green-700">$${stats.price.toFixed(2)}</span>
            </div>
        `;
    }

    handleRecipeCreation(event) {
        if (event) event.preventDefault();
        const data = this.collectRecipeFormData();
        if (!data) return;

        const stats = this.calculateCustomRecipeStats(data);
        const recipe = this.composeCustomRecipe(data, stats);
        const registered = this.engine.registerCustomRecipe(recipe);

        if (!registered) {
            this.showPopup({ icon: '⚠️', title: 'Could not save recipe', message: 'Please try again.', type: 'error' });
            return;
        }

        this.customRecipes = this.customRecipes.filter(entry => entry.key !== recipe.configKey);
        this.customRecipes.unshift({ key: recipe.configKey, name: recipe.name, icon: recipe.icon, pastryType: recipe.pastryType });
        this.showPopup({ icon: '🥨', title: 'Recipe Saved!', message: `${recipe.name} added to your cookbook.`, type: 'success', autoClose: 1600 });

        // Reset form
        this.renderRecipeCreationSpread();
        this.renderCustomRecipeLibrary();

        if (this.currentPhase === 'baking') {
            this.renderRecipes();
        }
    }

    composeCustomRecipe(data, stats) {
        const type = GAME_CONFIG.PASTRY_TYPES?.[data.pastryType] || {};
        const ids = this.generateRecipeId(data.name);

        return {
            configKey: ids.configKey,
            slug: ids.slug,
            name: data.name,
            icon: type.icon || '🧁',
            category: data.pastryType,
            pastryType: data.pastryType,
            bakeTime: type.bakeTime || 0.1,
            retailPrice: stats.price,
            ingredients: data.ingredients,
            shelfLife: type.shelfLife || 3,
            decayRate: type.decayRate || 25
        };
    }

    generateRecipeId(name) {
        const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'custom_recipe';
        let attempt = slugBase;
        let index = 2;
        while (GAME_CONFIG.RECIPES[attempt.toUpperCase()] || GAME_CONFIG.RECIPES[attempt]) {
            attempt = `${slugBase}_${index++}`;
        }

        return { configKey: attempt.toUpperCase(), slug: attempt };
    }

    prefillRecipeBuilder(recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        if (!recipe) return;

        // Reset first
        this.renderRecipeCreationSpread();

        const nameInput = document.getElementById('recipe-name');
        const typeInput = document.getElementById('pastry-type');

        if (nameInput) nameInput.value = `${recipe.name} Remix`;
        if (typeInput) typeInput.value = recipe.pastryType || recipe.category || 'pastry';

        // Activate pills
        Object.entries(recipe.ingredients || {}).forEach(([key, amount]) => {
            const pill = document.querySelector(`.ingredient-pill[data-key="${key}"]`);
            if (pill) {
                // Manually activate
                pill.classList.add('active', 'bg-amber-100', 'border-amber-400');
                pill.classList.remove('bg-white/60');
                const inputContainer = pill.querySelector('.amount-control');
                const input = inputContainer.querySelector('input');
                inputContainer.classList.remove('hidden');
                input.value = amount;
            }
        });

        this.updateRecipePreview();
    }

    renderCustomRecipeLibrary() {
        const library = document.getElementById('custom-recipe-library');
        if (!library) return;

        if (this.customRecipes.length === 0) {
            library.innerHTML = '<div class="custom-recipe-empty">No custom recipes yet. Your creations will appear here.</div>';
            return;
        }

        library.innerHTML = this.customRecipes.map(entry => {
            const typeInfo = GAME_CONFIG.PASTRY_TYPES?.[entry.pastryType];
            return `
                <div class="custom-recipe-card">
                    <div class="custom-recipe-icon">${entry.icon}</div>
                    <div>
                        <div class="custom-recipe-name">${entry.name}</div>
                        <div class="custom-recipe-type">${typeInfo?.icon || ''} ${typeInfo?.name || entry.pastryType}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    enforceInventoryPlan() {
        if (!this.strategySettings || !this.engine?.ensureIngredientInventory || !this.automationEnabled) return;

        const actions = this.engine.ensureIngredientInventory({
            productionTargets: this.productionTargets,
            bufferDays: this.strategySettings.inventoryBufferDays,
            vendorPreference: this.strategySettings.vendorPriority
        });

        if (Array.isArray(actions) && actions.length > 0) {
            actions.forEach(action => {
                if (action.skipped) {
                    this.logAutomationEvent('procurement', `Skipped ${action.ingredient} due to ${action.reason}`, { severity: 'warning' });
                    return;
                }
                this.logAutomationEvent('procurement', `Ordered ${action.quantity}${action.unit || ''} ${action.ingredient} via ${action.vendor}`, {
                    cost: action.cost ? `$${action.cost.toFixed(2)}` : undefined
                });
            });
        }
    }

    setGameSpeed(speed) {
        this.engine.gameSpeed = speed;
        const indicator = document.getElementById('speed-indicator');
        if (indicator) {
            indicator.textContent = speed + 'x';
            indicator.style.color = speed === 1 ? '#27ae60' : speed >= 5 ? '#e74c3c' : '#f39c12';
        }
    }

    // ==================== MAIN MENU ====================
    showMainMenu() {
        console.log('Displaying Main Menu');
        this.cleanupPhaser();
        this.currentPhase = 'menu';
        const container = document.getElementById('game-container');
        if (container) {
            container.classList.remove('full-screen');
            container.style.padding = '';
        }

        container.innerHTML = `
            <div class="main-menu relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                <!-- Animated Background Elements -->
                <div class="absolute inset-0 z-0">
                    <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 opacity-90"></div>
                    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl animate-pulse"></div>
                    <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-bounce" style="animation-duration: 8s;"></div>
                </div>

                <div class="menu-header relative z-10 text-center mb-12 transform transition-all duration-700">
                    <div class="menu-logo text-8xl mb-4 drop-shadow-2xl filter hover:brightness-110 transition-all cursor-default">🥐</div>
                    <h1 class="menu-title text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow-sm font-hand tracking-wide mb-2">
                        Sweet Success Bakery
                    </h1>
                    <p class="menu-subtitle text-xl text-amber-100/80 font-light tracking-widest uppercase border-t border-b border-amber-500/30 py-2 inline-block">
                        Financial Simulation & Strategy
                    </p>
                </div>
                
                <div class="menu-buttons relative z-10 flex flex-col gap-4 w-full max-w-md">
                    <button class="menu-btn group relative overflow-hidden bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white p-1 rounded-xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl" 
                            id="btn-new-game" role="button" tabindex="0" aria-label="Start a new game">
                        <div class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                        <div class="bg-stone-900/90 rounded-lg p-4 flex items-center gap-4 border border-amber-500/30 group-hover:border-amber-400/50 transition-colors">
                            <span class="text-4xl group-hover:rotate-12 transition-transform duration-300">🎮</span>
                            <div class="text-left">
                                <div class="text-2xl font-bold text-amber-100 group-hover:text-white">New Game</div>
                                <div class="text-xs text-amber-400/70 uppercase tracking-wider">Start Your Empire</div>
                            </div>
                        </div>
                    </button>

                    <button class="menu-btn group relative overflow-hidden bg-stone-800 hover:bg-stone-700 text-white p-1 rounded-xl shadow-lg transform transition-all hover:scale-105" 
                            id="btn-continue" role="button" tabindex="0" aria-label="Continue saved game" style="display: none;">
                        <div class="bg-stone-900/80 rounded-lg p-4 flex items-center gap-4 border border-stone-600 group-hover:border-stone-500 transition-colors">
                            <span class="text-3xl group-hover:translate-x-1 transition-transform">▶️</span>
                            <div class="text-left">
                                <div class="text-xl font-bold text-stone-200">Continue</div>
                                <div class="text-xs text-stone-500 uppercase tracking-wider">Resume Day <span id="save-day-indicator">--</span></div>
                            </div>
                        </div>
                    </button>

                    <button class="menu-btn group relative overflow-hidden bg-stone-800 hover:bg-stone-700 text-white p-1 rounded-xl shadow-lg transform transition-all hover:scale-105" 
                            id="btn-tutorial" role="button" tabindex="0" aria-label="Open tutorial">
                        <div class="bg-stone-900/80 rounded-lg p-4 flex items-center gap-4 border border-stone-600 group-hover:border-stone-500 transition-colors">
                            <span class="text-3xl group-hover:scale-110 transition-transform">📖</span>
                            <div class="text-left">
                                <div class="text-xl font-bold text-stone-200">How to Play</div>
                                <div class="text-xs text-stone-500 uppercase tracking-wider">Mechanics & Tips</div>
                            </div>
                        </div>
                    </button>
                </div>
                
                <div class="menu-info relative z-10 mt-12 text-center opacity-60 hover:opacity-100 transition-opacity">
                    <div class="flex gap-8 justify-center text-amber-100/40 text-sm">
                        <span class="flex items-center gap-2"><span class="text-lg">📈</span> Real Market Dynamics</span>
                        <span class="flex items-center gap-2"><span class="text-lg">🧠</span> Strategic Decisions</span>
                        <span class="flex items-center gap-2"><span class="text-lg">🥐</span> Artisan Baking</span>
                    </div>
                </div>
            </div>
        `;

        // GSAP Entrance Animations (pre-set states to avoid flicker)
        if (window.gsap) {
            gsap.set('.menu-logo', { opacity: 0, y: -80 });
            gsap.set('.menu-title', { opacity: 0, y: -40 });
            gsap.set('.menu-subtitle', { opacity: 0, y: -20 });
            gsap.set('.menu-btn', { opacity: 0, y: 40 });
            gsap.set('.menu-info', { opacity: 0, y: 20 });

            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            tl.to('.menu-logo', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'elastic.out(1, 0.8)'
            })
                .to('.menu-title', {
                    y: 0,
                    opacity: 1,
                    duration: 0.6
                }, '-=0.4')
                .to('.menu-subtitle', {
                    y: 0,
                    opacity: 1,
                    duration: 0.6
                }, '-=0.45')
                .to('.menu-btn', {
                    y: 0,
                    opacity: 1,
                    duration: 0.45,
                    stagger: 0.12
                }, '-=0.3')
                .to('.menu-info', {
                    y: 0,
                    opacity: 1,
                    duration: 0.6
                }, '-=0.2');

            // Continuous float for logo
            gsap.to('.menu-logo', {
                y: '+=12',
                duration: 2,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }

        // Reveal continue when a save exists
        // Button press animation + ripple using GSAP
        const animatePress = (btn) => {
            if (!window.gsap) return;
            gsap.fromTo(btn, { scale: 1 }, { scale: 0.95, duration: 0.05, yoyo: true, repeat: 1 });
        };

        // Helper for consistent button wiring
        const wireButton = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return null;

            // Click handler (standard)
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Button clicked: ${id}`);
                animatePress(btn, e);

                // Use a standard delay for the animation
                setTimeout(() => {
                    console.log(`Executing action for: ${id}`);
                    try {
                        action();
                    } catch (err) {
                        console.error('Error executing action for', id, err);

                        // Swallow known benign "is not a function" glitch while still logging it
                        const msg = err && typeof err.message === 'string' ? err.message : '';
                        if (/is not a function/i.test(msg)) {
                            return;
                        }

                        alert('Game Error: ' + msg);
                    }
                }, 150);
            };

            // Keyboard accessibility
            btn.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    btn.onclick(e);
                }
            };

            return btn;
        };

        const btnNew = wireButton('btn-new-game', () => this.startNewGame());
        const btnContinue = wireButton('btn-continue', () => this.loadAndStart());
        const btnTut = wireButton('btn-tutorial', () => this.showTutorial());

        // Reveal continue when a save exists
        const save = localStorage.getItem('bakery_save');
        if (btnContinue && save) {
            btnContinue.style.display = 'block';
            try {
                const data = JSON.parse(save);
                const dayIndicator = document.getElementById('save-day-indicator');
                if (dayIndicator && data.day) dayIndicator.textContent = data.day;
            } catch (e) { console.error('Save parse error', e); }
        }
    }

    startNewGame() {
        console.log('Starting new game...');
        try {
            console.log('Resetting engine...');
            this.engine.reset();

            if (this.strategySettings) {
                console.log('Setting strategy settings...');
                this.engine.setStrategySettings(this.strategySettings);
            }

            console.log('Resetting recipes and automation...');
            this.customRecipes = [];
            this.recipeBookState.page = 0;
            this.updateAutomationAvailability();

            console.log('Clearing save data...');
            localStorage.removeItem('bakery_save');

            console.log('Going to setup phase...');
            this.goToPhase('setup');
            console.log('New game setup complete');
        } catch (err) {
            console.error('CRITICAL ERROR in startNewGame:', err);
            console.error('Error stack:', err.stack);
            alert('Failed to start new game: ' + (err.message || 'Unknown error'));
        }
    }

    loadAndStart() {
        const save = localStorage.getItem('bakery_save');
        if (save) {
            this.engine.load(JSON.parse(save));
        }
        if (this.strategySettings) {
            this.engine.setStrategySettings(this.strategySettings);
            this.enforceInventoryPlan();
        }
        this.updateAutomationAvailability();
        this.startDay();
    }

    showTutorial() {
        if (this.tutorial) {
            this.tutorial.start();
        }
    }

    cleanupPhaser() {
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }
    }

    // ==================== SETUP PHASE ====================
    showSetupPhase() {
        console.log('showSetupPhase called');
        try {
            console.log('Cleaning up previous Phaser instance...');
            this.cleanupPhaser();

            const container = document.getElementById('game-container');
            if (!container) {
                throw new Error('game-container element not found');
            }

            console.log('Setting up container...');
            container.classList.add('full-screen');
            container.style.padding = '';

            this.setupChoices = {
                location: null,
                financing: null,
                equipment: { oven: null, mixer: null, display: null },
                staff: null,
                paperwork: [],
                insurance: null,
                utilities: { power: null, internet: null }
            };

            // Clear container and add Phaser container
            console.log('Creating Phaser container...');
            container.innerHTML = `<div id="phaser-container" style="width: 100%; height: 100%; overflow: hidden;"></div>`;
            container.classList.add('full-screen');

            // Verify dependencies
            if (typeof Phaser === 'undefined') {
                throw new Error('Phaser library not loaded');
            }
            if (typeof StartupScene === 'undefined') {
                throw new Error('StartupScene class not loaded - check js/Bakery_Startup_Sequence.js');
            }

            // Initialize Phaser Game with larger viewport
            console.log('Creating Phaser config...');
            const config = {
                type: Phaser.AUTO,
                width: window.innerWidth,
                height: window.innerHeight - 60, // Subtract top nav height
                parent: 'phaser-container',
                backgroundColor: '#2C1810',
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 0 },
                        debug: false
                    }
                },
                scene: [StartupScene]
            };

            console.log('Initializing Phaser Game...');
            this.phaserGame = new Phaser.Game(config);
            console.log('Phaser Game initialized successfully');
        } catch (err) {
            console.error('CRITICAL ERROR in showSetupPhase:', err);
            console.error('Error stack:', err.stack);
            alert('Failed to initialize setup phase: ' + (err.message || 'Unknown error'));
            // Try to recover by going back to menu
            this.showMainMenu();
        }
    }

    selectSetup(type, id) {
        const options = GAME_CONFIG.SETUP_OPTIONS;

        if (type === 'location') {
            this.setupChoices.location = options.locations.find(l => l.id === id);
        } else if (type === 'financing') {
            this.setupChoices.financing = options.financing.find(f => f.id === id);
        } else if (type === 'equipment_oven') {
            this.setupChoices.equipment.oven = options.equipment.ovens.find(e => e.id === id);
        } else if (type === 'equipment_mixer') {
            this.setupChoices.equipment.mixer = options.equipment.mixers.find(m => m.id === id);
        } else if (type === 'equipment_display') {
            this.setupChoices.equipment.display = options.equipment.displays.find(d => d.id === id);
        } else if (type === 'staff') {
            this.setupChoices.staff = options.staff.find(s => s.id === id);
        } else if (type === 'paperwork') {
            if (this.setupChoices.paperwork.includes(id)) {
                this.setupChoices.paperwork = this.setupChoices.paperwork.filter(p => p !== id);
            } else {
                this.setupChoices.paperwork.push(id);
            }
        } else if (type === 'insurance') {
            this.setupChoices.insurance = options.insurance.find(i => i.id === id);
        } else if (type === 'utility_power') {
            this.setupChoices.utilities.power = options.utilities.find(u => u.id === id);
        } else if (type === 'utility_internet') {
            this.setupChoices.utilities.internet = options.utilities.find(u => u.id === id);
        }
    }

    canFinishSetup() {
        const c = this.setupChoices;
        // Minimum requirements: location, equipment (all 3), permits (all required), insurance, staff
        const paperwork = GAME_CONFIG.SETUP_OPTIONS.paperwork;
        const requiredPermits = paperwork.filter(p => p.required);
        const hasAllRequired = requiredPermits.every(p => c.paperwork.includes(p.id));

        return c.location &&
            c.equipment.oven &&
            c.equipment.mixer &&
            c.equipment.display &&
            hasAllRequired &&
            c.insurance &&
            c.staff;
    }

    finishSetup() {
        // Destroy Phaser game if it exists
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }

        // Apply choices to engine
        const choices = this.setupChoices;

        // Location
        this.engine.rentAmount = choices.location.rent;
        this.engine.trafficMultiplier = choices.location.traffic;

        // Equipment
        this.engine.ovenCapacity = choices.equipment.oven.capacity;
        this.engine.bakingSpeedMultiplier = choices.equipment.oven.speed * choices.equipment.mixer.efficiency;

        // Staff
        if (choices.staff.efficiency) {
            this.engine.bakingSpeedMultiplier *= choices.staff.efficiency;
        }

        // Financing (debt already added in scene)
        // Insurance (monthly costs)
        if (choices.insurance) {
            this.engine.monthlyInsurance = choices.insurance.monthlyCost;
        }

        // Utilities
        if (choices.utilities.power && choices.utilities.internet) {
            this.engine.monthlyUtilities = choices.utilities.power.monthlyCost + choices.utilities.internet.monthlyCost;
        }

        // Initialize day state
        // Move to free-roam mode hub
        this.showModeHub();
    }

    showModeHub() {
        this.cleanupPhaser();
        this.currentPhase = 'hub';
        window.dispatchEvent(new CustomEvent('gamePhaseChanged', { detail: { phase: 'hub' } }));

        // Show dashboard, staff, and equipment buttons
        const dashboardBtn = document.getElementById('btn-dashboard');
        const staffBtn = document.getElementById('btn-staff');
        const equipmentBtn = document.getElementById('btn-equipment');
        const strategyBtn = document.getElementById('btn-strategy');
        if (dashboardBtn) dashboardBtn.style.display = 'inline-block';
        if (staffBtn) {
            staffBtn.style.display = 'inline-block';
            staffBtn.onclick = () => this.showStaffPanel();
        }
        if (equipmentBtn) {
            equipmentBtn.style.display = 'inline-block';
            equipmentBtn.onclick = () => this.showEquipmentPanel();
        }
        if (strategyBtn) {
            strategyBtn.style.display = 'inline-block';
            strategyBtn.onclick = () => this.showStrategyPanel();
        }

        const container = document.getElementById('game-container');
        if (container) {
            container.classList.add('full-screen');
            container.style.padding = '';
            container.innerHTML = `<div id="phaser-container" style="width: 100%; height: 100%; overflow: hidden;"></div>`;
        }

        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight - 60,
            parent: 'phaser-container',
            backgroundColor: '#11161c',
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            },
            scene: [ModeHubScene]
        };

        this.phaserGame = new Phaser.Game(config);

        // Add Economic Dashboard Overlay
        const economyReport = this.engine.economy.getDailyReport(this.engine.day);
        const eventsHtml = economyReport.activeEvents.length > 0
            ? `<div class="econ-events">
                ${economyReport.activeEvents.map(e => `
                    <div class="event-ticker" title="${e.daysRemaining} days left">
                        ${e.icon || '⚠️'} ${e.name}
                    </div>
                `).join('')}
               </div>`
            : '';

        const dashboard = document.createElement('div');
        dashboard.className = 'econ-dashboard';
        dashboard.innerHTML = `
            <h3>📈 Market Report</h3>
            <div class="econ-row">
                <span class="econ-label">Season</span>
                <span class="econ-value">${economyReport.season.icon} ${economyReport.season.name}</span>
            </div>
            <div class="econ-row">
                <span class="econ-label">Inflation</span>
                <span class="econ-value">${economyReport.inflation.rate} ${economyReport.inflation.trend}</span>
            </div>
            <div class="econ-row">
                <span class="econ-label">Supply</span>
                <span class="econ-value" title="Grains/Dairy/Produce">
                    🌾${economyReport.supply.grains} 🥛${economyReport.supply.dairy} 🍎${economyReport.supply.produce}
                </span>
            </div>
            ${eventsHtml}
        `;
        container.appendChild(dashboard);
    }

    enterPhaseFromHub(phase) {
        // Clean up hub
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }
        // Proceed to requested phase
        this.goToPhase(phase);
    }

    // ==================== DAY FLOW ====================
    startDay() {
        this.phaseIndex = 0;
        this.engine.isPaused = true;
        this.engine.hour = GAME_CONFIG.TIME.OPENING_HOUR;
        this.engine.minute = 0;

        this.showPopup({
            icon: '🌅',
            title: `Day ${this.engine.day} Begins!`,
            message: `Good morning, baker! Time to start your day.\n\nCurrent Cash: $${this.engine.cash.toFixed(2)}`,
            type: 'info',
            buttons: [{ text: 'Go to Bakery →', action: () => this.showModeHub() }]
        });

        this.updateAutomationAvailability();
        this.maintainProductionTargets();
        this.enforceInventoryPlan();
    }

    goToPhase(phase) {
        this.currentPhase = phase;
        this.updatePhaseIndicator();

        // Dispatch event for tutorial system
        window.dispatchEvent(new CustomEvent('gamePhaseChanged', { detail: { phase } }));

        switch (phase) {
            case 'setup':
                this.showSetupPhase();
                break;
            case 'buying':
                this.showBuyingPhase();
                break;
            case 'baking':
                this.showBakingPhase();
                break;
            case 'selling':
                this.showSellingPhase();
                break;
            case 'summary':
                this.showSummaryPhase();
                break;
            case 'recipes':
                this.showRecipeLab();
                break;
        }
    }

    confirmNextPhase() {
        const currentIndex = this.phaseOrder.indexOf(this.currentPhase);
        const nextPhase = this.phaseOrder[currentIndex + 1];

        if (!nextPhase) {
            this.showSummaryPhase();
            return;
        }

        const phaseNames = {
            buying: '📦 Buy Inventory',
            baking: '🍞 Bake Products',
            selling: '💰 Open Shop',
            summary: '📊 End of Day'
        };

        this.showPopup({
            icon: '✅',
            title: 'Phase Complete!',
            message: `Ready to move to: <strong>${phaseNames[nextPhase]}</strong>?`,
            type: 'success',
            buttons: [
                { text: 'Stay Here', action: 'close', style: 'secondary' },
                { text: 'Continue →', action: () => this.goToPhase(nextPhase) }
            ]
        });
    }

    // ==================== BUYING PHASE ====================
    showBuyingPhase() {
        const container = document.getElementById('game-container');
        if (container) {
            container.style.padding = '0';
            container.style.overflow = 'auto';
        }

        container.innerHTML = `
            <div style="padding: 20px; min-height: 100%;">
            <div class="phase-header">
                <h2>📦 Buy Inventory</h2>
                <p>Purchase ingredients from vendors. Check the recipe book to see what you need!</p>
                <div class="phase-tools">
                    <button class="btn btn-automation" id="btn-auto-buying">🤖 Deploy Staff Automation</button>
                </div>
            </div>
            
            <div class="buying-layout" id="buy-phase-container">
                <div class="vendors-section">
                    <h3>Select Vendor</h3>
                    <div class="vendor-list" id="vendor-list"></div>
                </div>
                
                <div class="ingredients-section">
                    <h3>Ingredients</h3>
                    <div class="ingredient-grid" id="ingredient-grid"></div>
                </div>
                
                <div class="recipe-reference">
                    <h3>📖 Recipe Book</h3>
                    <div class="recipe-ref-list" id="recipe-ref-list"></div>
                </div>
                
                <div class="cart-section">
                    <h3>Your Inventory</h3>
                    <div class="inventory-list" id="inventory-list"></div>
                    <div class="cart-total">
                        Cash: <span id="current-cash">$${this.engine.cash.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="phase-actions">
                <button class="btn btn-primary" id="btn-done-buying">
                    Done Shopping
                </button>
            </div>
            </div>
        `;

        const autoBuyingBtn = document.getElementById('btn-auto-buying');
        if (autoBuyingBtn) {
            autoBuyingBtn.onclick = () => this.manualAutomationTrigger('buying');
        }

        this.renderVendors();
        this.renderIngredients('METRO');
        this.renderInventory();
        this.renderRecipeReference();

        document.getElementById('btn-done-buying').onclick = () => {
            // Check if they have any ingredients
            let hasIngredients = false;
            Object.values(this.engine.ingredients).forEach(i => {
                const stock = this.engine.getIngredientStock(Object.keys(GAME_CONFIG.INGREDIENTS).find(k =>
                    this.engine.ingredients[k] === i
                ));
                if (stock > 0) hasIngredients = true;
            });

            if (!hasIngredients) {
                this.showPopup({
                    icon: '⚠️',
                    title: 'No Ingredients!',
                    message: 'You need to buy some ingredients before you can bake!',
                    type: 'warning',
                    buttons: [
                        { text: 'Keep Shopping', action: 'close' },
                        { text: 'Return to Hub', action: () => this.showModeHub() }
                    ]
                });
                return;
            }

            this.showModeHub();
        };

        this.updateStats();
    }

    // Render recipe book reference panel during buying
    renderRecipeReference() {
        const list = document.getElementById('recipe-ref-list');
        if (!list) return;

        list.innerHTML = Object.entries(GAME_CONFIG.RECIPES).map(([key, recipe]) => {
            const { canBake } = this.engine.canBakeRecipe(key);

            const groups = { base: [], extra: [] };
            Object.entries(recipe.ingredients).forEach(([ingKey, amount]) => {
                const ing = GAME_CONFIG.INGREDIENTS[ingKey];
                if (!ing) return;
                const have = this.engine.getIngredientStock(ingKey);
                const enough = have >= amount;
                const role = ing.role === 'extra' ? 'extra' : 'base';
                groups[role].push(`
                    <div class="recipe-ing ${role} ${enough ? 'have' : 'need'}">
                        ${ing.icon} ${amount} ${ing.unit} ${ing.name}
                        <span class="have-amount">(have: ${have.toFixed(1)})</span>
                    </div>
                `);
            });

            return `
                <div class="recipe-ref-card ${canBake ? 'can-bake' : ''}">
                    <div class="recipe-ref-header">
                        <span class="recipe-ref-icon">${recipe.icon}</span>
                        <span class="recipe-ref-name">${recipe.name}</span>
                        <span class="recipe-ref-price">$${this.engine.getRecipeBasePrice(key).toFixed(2)}</span>
                    </div>
                    <div class="recipe-ref-ingredients">
                        <div class="recipe-ing-column">
                            <div class="recipe-ing-heading">Base</div>
                            ${groups.base.length ? groups.base.join('') : '<div class="recipe-ing note">None</div>'}
                        </div>
                        <div class="recipe-ing-column">
                            <div class="recipe-ing-heading">Extras</div>
                            ${groups.extra.length ? groups.extra.join('') : '<div class="recipe-ing note">None</div>'}
                        </div>
                    </div>
                    <div class="recipe-ref-status">
                        ${canBake ? '✅ Ready to bake!' : '⚠️ Missing ingredients'}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderVendors() {
        const list = document.getElementById('vendor-list');
        if (!list) return;

        list.innerHTML = Object.entries(GAME_CONFIG.VENDORS).map(([key, vendor]) => {
            const priceLabel = vendor.priceMultiplier < 1 ? '💚 Cheaper' : vendor.priceMultiplier > 1 ? '💛 Premium' : '⚪ Standard';
            const qualityLabel = vendor.qualityMultiplier > 1 ? '✨ High Quality' : vendor.qualityMultiplier < 1 ? '📦 Basic Quality' : '👍 Good Quality';

            return `
                <div class="vendor-card" data-vendor="${key}">
                    <div class="vendor-icon">${vendor.icon}</div>
                    <div class="vendor-info">
                        <div class="vendor-name">${vendor.name}</div>
                        <div class="vendor-specialty">${vendor.specialty}</div>
                        <div class="vendor-price">${priceLabel}</div>
                        <div class="vendor-quality">${qualityLabel}</div>
                    </div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.vendor-card').forEach(card => {
            card.onclick = () => {
                list.querySelectorAll('.vendor-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.renderIngredients(card.dataset.vendor);
            };
        });

        // Select first vendor
        list.querySelector('.vendor-card')?.classList.add('active');
    }

    renderIngredients(vendorKey) {
        const grid = document.getElementById('ingredient-grid');
        if (!grid) return;

        const vendor = GAME_CONFIG.VENDORS[vendorKey];

        const grouped = { base: [], extra: [] };

        Object.entries(GAME_CONFIG.INGREDIENTS)
            .filter(([, ing]) => vendor.categories.includes(ing.category))
            .forEach(([key, ing]) => {
                const price = this.engine.getCurrentIngredientPrice(key, vendorKey);
                const comparison = this.engine.economy.getPriceComparison(key, price);
                const stock = this.engine.getIngredientStock(key);
                const quality = this.engine.getIngredientQuality(key);
                const qualityLabel = stock > 0 ? this.engine.getQualityLabel(quality) : null;
                const startQuality = Math.min(100, ing.baseQuality * vendor.qualityMultiplier);
                const role = ing.role === 'extra' ? 'extra' : 'base';

                let priceClass = '';
                if (comparison.status === 'low') priceClass = 'price-low';
                if (comparison.status === 'high') priceClass = 'price-high';

                const card = `
                    <div class="ingredient-card" data-ingredient="${key}" data-vendor="${vendorKey}">
                        <div class="ing-icon">${ing.icon}</div>
                        <div class="ing-name">${ing.name}</div>
                        <div class="ing-price ${priceClass}">
                            $${price.toFixed(2)}/${ing.unit}
                            ${comparison.status !== 'normal' ? `<span class="price-trend" title="${comparison.percentChange}% vs base">${comparison.arrow}</span>` : ''}
                        </div>
                        <div class="ing-quality-info">
                            <span title="Starting quality from this vendor">Quality: ${startQuality.toFixed(0)}%</span>
                            <span title="Shelf life">📅 ${ing.shelfLife} days</span>
                        </div>
                        <div class="ing-stock">
                            In stock: ${stock.toFixed(1)} ${ing.unit}
                            ${qualityLabel ? `<span class="quality-badge" style="color: ${qualityLabel.color}">${qualityLabel.emoji} ${qualityLabel.label}</span>` : ''}
                        </div>
                        <div class="qty-controls">
                            <button class="qty-btn qty-minus" data-action="minus">−</button>
                            <input type="number" class="qty-input" value="1" min="1" max="100" step="1">
                            <button class="qty-btn qty-plus" data-action="plus">+</button>
                            <button class="btn-buy">Buy</button>
                        </div>
                    </div>
                `;

                grouped[role].push(card);
            });

        grid.innerHTML = ['base', 'extra'].map(role => {
            if (grouped[role].length === 0) return '';
            const title = role === 'base' ? 'Pantry Staples' : 'Extras & Toppings';
            return `
                <div class="ingredient-group ${role}">
                    <div class="ingredient-group-title">${title}</div>
                    <div class="ingredient-group-grid">${grouped[role].join('')}</div>
                </div>
            `;
        }).join('');

        // Handle +/- buttons
        grid.querySelectorAll('.qty-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const input = btn.closest('.qty-controls').querySelector('.qty-input');
                let val = parseFloat(input.value) || 1;

                if (btn.dataset.action === 'plus') {
                    val = Math.min(100, val + 1);
                } else {
                    val = Math.max(1, val - 1);
                }
                input.value = val;
            };
        });

        // Handle buy buttons
        grid.querySelectorAll('.btn-buy').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const card = btn.closest('.ingredient-card');
                const ingKey = card.dataset.ingredient;
                const vendorKey = card.dataset.vendor;
                const input = card.querySelector('.qty-input');
                const qty = parseFloat(input.value) || 1;

                const result = this.engine.purchaseIngredient(ingKey, qty, vendorKey);

                if (result.success) {
                    this.showPopup({
                        icon: '✅',
                        title: 'Purchased!',
                        message: `${result.message} (Quality: ${result.quality.toFixed(0)}%)`,
                        type: 'success',
                        autoClose: 1000
                    });
                    this.renderIngredients(vendorKey);
                    this.renderInventory();
                    this.renderRecipeReference();
                    this.updateStats();
                } else {
                    this.showPopup({
                        icon: '❌',
                        title: 'Cannot Purchase',
                        message: result.message,
                        type: 'error',
                        autoClose: 1500
                    });
                }
            };
        });
    }

    renderInventory() {
        const list = document.getElementById('inventory-list');
        if (!list) return;

        const items = Object.entries(this.engine.ingredients)
            .filter(([key, inv]) => this.engine.getIngredientStock(key) > 0)
            .map(([key, inv]) => {
                const ing = GAME_CONFIG.INGREDIENTS[key];
                const stock = this.engine.getIngredientStock(key);
                const quality = this.engine.getIngredientQuality(key);
                const qualityLabel = this.engine.getQualityLabel(quality);

                return `
                    <div class="inv-item">
                        <span>${ing.icon} ${ing.name}</span>
                        <span>${stock.toFixed(1)} ${ing.unit}</span>
                        <span class="inv-quality" style="color: ${qualityLabel.color}">${qualityLabel.emoji} ${quality.toFixed(0)}%</span>
                    </div>
                `;
            }).join('');

        list.innerHTML = items || '<div class="inv-empty">No ingredients yet</div>';

        const cashEl = document.getElementById('current-cash');
        if (cashEl) cashEl.textContent = `$${this.engine.cash.toFixed(2)}`;
    }

    // ==================== BAKING PHASE ====================
    showBakingPhase() {
        const container = document.getElementById('game-container');
        if (container) {
            container.style.padding = '0';
            container.style.overflow = 'auto';
        }

        container.innerHTML = `
            <div style="padding: 20px; min-height: 100%;">
            <div class="phase-header">
                <h2>🍞 Bakery Production</h2>
                <p>Prepare and bake products. Each recipe goes through multiple stages.</p>
                <div class="phase-tools">
                    <button class="btn btn-automation" id="btn-auto-baking">🤖 Deploy Staff Automation</button>
                </div>
            </div>
            
            <div class="baking-layout-advanced" id="bake-phase-container">
                <!-- Employee Panel -->
                <div class="employee-panel">
                    <h3>👨‍🍳 Staff</h3>
                    <div class="employee-list" id="employee-list">
                        ${this.renderEmployeePanel()}
                    </div>
                </div>
                
                <!-- Production Area -->
                <div class="production-area">
                    <div class="recipes-section">
                        <h3>Recipes</h3>
                        <div class="recipe-grid" id="recipe-grid"></div>
                    </div>
                    
                    <div class="production-queue-section">
                        <h3>🔄 Production Queue</h3>
                        <div class="time-controls" style="margin-bottom: 15px; display: flex; gap: 10px; align-items: center;">
                            <span style="font-size: 14px; color: #7f8c8d;">Time Speed:</span>
                            <button class="btn btn-sm" onclick="window.game.setGameSpeed(1)" style="padding: 5px 10px; font-size: 12px;">1x</button>
                            <button class="btn btn-sm" onclick="window.game.setGameSpeed(2)" style="padding: 5px 10px; font-size: 12px;">2x</button>
                            <button class="btn btn-sm" onclick="window.game.setGameSpeed(5)" style="padding: 5px 10px; font-size: 12px;">5x</button>
                            <button class="btn btn-sm" onclick="window.game.setGameSpeed(10)" style="padding: 5px 10px; font-size: 12px;">10x</button>
                            <span id="speed-indicator" style="font-size: 14px; font-weight: bold; color: #27ae60;">1x</span>
                        </div>
                        <div class="production-slots" id="production-slots"></div>
                    </div>
                    
                    <div class="ready-section">
                        <h3>📦 Ready Products</h3>
                        <div class="ready-products" id="ready-products"></div>
                    </div>
                </div>
            </div>
            
            <div class="phase-actions">
                <button class="btn btn-secondary" id="btn-back-hub">Return to Hub</button>
                <button class="btn btn-success" id="btn-open-shop" style="background: #27ae60;">🏪 Open Shop (Keep Production)</button>
                <button class="btn btn-primary" id="btn-done-baking">Done Production</button>
            </div>
            </div>
        `;

        const autoBakingBtn = document.getElementById('btn-auto-baking');
        if (autoBakingBtn) {
            autoBakingBtn.onclick = () => this.manualAutomationTrigger('baking');
        }

        this.renderRecipes();
        this.renderProductionQueue();
        this.renderReadyProducts();
        this.maintainProductionTargets();

        // Start baking timer
        this.startBakingLoop();

        document.getElementById('btn-back-hub').onclick = () => {
            this.stopBakingLoop();
            this.showModeHub();
        };

        document.getElementById('btn-open-shop').onclick = () => {
            // Don't stop baking loop - let it continue!
            this.showSellingPhase();
        };

        document.getElementById('btn-done-baking').onclick = () => {
            // Check if they have any products
            const totalProducts = this.engine.getTotalProductsAvailable();

            if (totalProducts === 0 && this.engine.productionQueue.length === 0) {
                this.showPopup({
                    icon: '⚠️',
                    title: 'No Products!',
                    message: 'You need to bake something before opening the shop!',
                    type: 'warning',
                    buttons: [
                        { text: 'Keep Baking', action: 'close' },
                        {
                            text: 'Return to Hub', action: () => {
                                this.stopBakingLoop();
                                this.showModeHub();
                            }
                        }
                    ]
                });
                return;
            }

            this.stopBakingLoop();
            this.showModeHub();
        };

        this.updateStats();
    }

    renderEmployeePanel() {
        if (this.engine.staff.length === 0) {
            return '<div class="no-employees">No staff hired. Working solo! Hire staff in the Staff panel.</div>';
        }

        return this.engine.staff.map(employee => {
            const currentTask = this.engine.productionQueue.find(item =>
                item.assignedEmployee && item.assignedEmployee.id === employee.id
            );

            const taskInfo = currentTask
                ? `${currentTask.stages[currentTask.stageIndex].name} ${currentTask.recipeIcon}`
                : 'Idle';

            return `
                <div class="employee-card">
                    <div class="employee-header">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 20px;">${employee.face}</span>
                            <span class="employee-name">${employee.name}</span>
                        </div>
                        <span class="employee-skill">⭐${employee.skillLevel.toFixed(1)}</span>
                    </div>
                    <div class="employee-status">
                        <div class="status-label">Task:</div>
                        <div class="status-value">${taskInfo}</div>
                    </div>
                    <div class="employee-stats-mini">
                        <div class="stat-mini">
                            <span>😊</span>
                            <div class="mini-bar">
                                <div class="mini-fill" style="width: ${employee.happiness}%; background: ${employee.happiness > 70 ? '#2ecc71' : employee.happiness > 40 ? '#f39c12' : '#e74c3c'}"></div>
                            </div>
                        </div>
                        <div class="stat-mini">
                            <span>😴</span>
                            <div class="mini-bar">
                                <div class="mini-fill" style="width: ${employee.fatigue}%; background: ${employee.fatigue > 70 ? '#e74c3c' : employee.fatigue > 40 ? '#f39c12' : '#2ecc71'}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRecipes() {
        const grid = document.getElementById('recipe-grid');
        if (!grid) return;

        grid.innerHTML = Object.entries(GAME_CONFIG.RECIPES).map(([key, recipe]) => {
            const { canBake, missing } = this.engine.canBakeRecipe(key);
            const cost = this.engine.calculateProductCost(key);
            const sellingPrice = this.engine.getRecipeBasePrice(key);
            const profit = sellingPrice - cost;
            const margin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(0) : '0';
            const expectedQuality = this.engine.calculateProductQuality(key);
            const qualityLabel = this.engine.getQualityLabel(expectedQuality);
            const target = this.productionTargets[key] || 0;
            const pipeline = this.getPipelineQuantity(key);
            const availableNow = this.engine.getProductStock(key);
            const buffered = availableNow + pipeline;
            const typeInfo = GAME_CONFIG.PASTRY_TYPES?.[recipe.pastryType || recipe.category];

            return `
                <div class="recipe-card ${canBake ? '' : 'unavailable'}" data-recipe="${key}">
                    <div class="recipe-icon">${recipe.icon}</div>
                    <div class="recipe-name">${recipe.name}</div>
                    ${typeInfo ? `<div class="recipe-type-tag">${typeInfo.icon || ''} ${typeInfo.name}</div>` : ''}
                    <div class="recipe-stats">
                        <div>Cost: $${cost.toFixed(2)}</div>
                        <div>Sells: $${sellingPrice.toFixed(2)}</div>
                        <div class="recipe-profit">+$${profit.toFixed(2)} (${margin}%)</div>
                    </div>
                    <div class="recipe-quality" style="color: ${qualityLabel.color}">
                        ${qualityLabel.emoji} Expected: ${expectedQuality.toFixed(0)}% quality
                    </div>
                    <div class="recipe-time">⏱️ ${recipe.bakeTime} min | 📅 Fresh for ${recipe.shelfLife} days</div>
                    <div class="automation-controls">
                        <div class="automation-label">Auto target</div>
                        <div class="automation-row">
                            <input type="number" class="auto-target-input" data-recipe="${key}" min="0" value="${target}" />
                            <button class="btn-auto-apply" data-recipe="${key}">Update</button>
                        </div>
                        <div class="automation-status">Buffer: ${buffered}/${target || 0} (incl. ${pipeline} in queue)</div>
                    </div>
                    ${canBake
                    ? '<button class="btn-bake">🔥 Bake</button>'
                    : `<div class="missing-label">Missing: ${missing.map(m => m.ingredient).join(', ')}</div>`
                }
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-bake').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const card = btn.closest('.recipe-card');
                const recipeKey = card.dataset.recipe;

                const result = this.engine.startBaking(recipeKey, 1);

                if (result.success) {
                    this.showPopup({
                        icon: '🔥',
                        title: 'Baking Started!',
                        message: result.message,
                        type: 'success',
                        autoClose: 1000
                    });
                    this.renderRecipes();
                    this.renderOven();
                } else {
                    this.showPopup({
                        icon: '❌',
                        title: 'Cannot Bake',
                        message: result.message,
                        type: 'error',
                        autoClose: 1500
                    });
                }
            };
        });

        grid.querySelectorAll('.btn-auto-apply').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const recipe = btn.dataset.recipe;
                const input = grid.querySelector(`.auto-target-input[data-recipe="${recipe}"]`);
                const value = parseInt(input?.value, 10) || 0;
                this.applyProductionTarget(recipe, value);
            };
        });

        grid.querySelectorAll('.auto-target-input').forEach(input => {
            input.onchange = (e) => {
                e.stopPropagation();
                const recipe = input.dataset.recipe;
                const value = parseInt(input.value, 10) || 0;
                this.applyProductionTarget(recipe, value);
            };
        });
    }

    applyProductionTarget(recipeKey, target) {
        if (target < 0 || !Number.isFinite(target)) target = 0;
        this.productionTargets[recipeKey] = target;
        this.maintainProductionTargets();
        this.renderRecipes();
    }

    getPipelineQuantity(recipeKey) {
        return this.engine.productionQueue
            .filter(item => item.recipeKey === recipeKey)
            .reduce((sum, item) => sum + item.quantity, 0);
    }

    maintainProductionTargets() {
        if (!this.productionTargets || !this.automationEnabled) return;

        Object.entries(this.productionTargets).forEach(([recipeKey, target]) => {
            if (!target || target <= 0) return;

            const available = this.engine.getProductStock(recipeKey);
            const pipeline = this.getPipelineQuantity(recipeKey);
            let deficit = target - (available + pipeline);

            while (deficit > 0) {
                const result = this.engine.startBaking(recipeKey, 1);
                if (!result.success) {
                    // Stop attempting if we hit missing ingredients or capacity limits
                    break;
                }
                const recipe = GAME_CONFIG.RECIPES[recipeKey];
                this.logAutomationEvent('production', `Queued ${recipe?.name || recipeKey} (${target} target)`, {
                    staff: result.item?.assignedEmployee?.name,
                    quantity: result.item?.quantity || 1
                });
                deficit--;
            }
        });

        this.renderProductionQueue();
        this.renderReadyProducts();
        this.enforceInventoryPlan();
    }

    renderProductionQueue() {
        const slots = document.getElementById('production-slots');
        if (!slots) return;

        const queue = this.engine.productionQueue;

        if (queue.length === 0) {
            slots.innerHTML = '<div class="no-production">No items in production. Start a recipe!</div>';
            return;
        }

        const html = queue.map(item => {
            const progress = Math.min(100, (item.progress / item.totalTime) * 100);
            const currentStage = item.stages[item.stageIndex];
            const employee = item.assignedEmployee;

            const employeeInfo = employee
                ? `<div class="assigned-employee">👨‍🍳 ${employee.name} (⭐${employee.skillLevel.toFixed(1)})</div>`
                : '<div class="assigned-employee no-employee">⚠️ No employee (slower)</div>';

            const qualityColor = item.prepQuality > 90 ? '#2ecc71' : item.prepQuality > 70 ? '#f39c12' : '#e74c3c';

            return `
                <div class="production-item">
                    <div class="production-header">
                        <span class="production-icon">${item.recipeIcon}</span>
                        <span class="production-name">${item.recipeName} x${item.quantity}</span>
                        <span class="production-quality" style="color: ${qualityColor}">Q: ${item.prepQuality.toFixed(0)}%</span>
                    </div>
                    ${employeeInfo}
                    <div class="stage-info">
                        <div class="stage-name">${currentStage.name}</div>
                        <div class="stage-progress">
                            <div class="stage-progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="stage-time">${Math.ceil((item.totalTime - item.progress) / 1000)}s</div>
                    </div>
                    <div class="stages-indicator">
                        ${item.stages.map((stage, idx) => `
                            <div class="stage-dot ${idx < item.stageIndex ? 'completed' : idx === item.stageIndex ? 'active' : 'pending'}" 
                                 title="${stage.name}"></div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        slots.innerHTML = html;

        // Update employee panel
        const employeeList = document.getElementById('employee-list');
        if (employeeList) {
            employeeList.innerHTML = this.renderEmployeePanel();
        }
    }

    renderOven() {
        // Legacy method - redirect to new production queue
        this.renderProductionQueue();
    }

    renderReadyProducts() {
        const container = document.getElementById('ready-products');
        if (!container) return;

        const products = Object.entries(this.engine.products)
            .filter(([key, p]) => this.engine.getProductStock(key) > 0)
            .map(([key, p]) => {
                const recipe = GAME_CONFIG.RECIPES[key];
                const stock = this.engine.getProductStock(key);
                const quality = this.engine.getProductQuality(key);
                const qualityLabel = this.engine.getQualityLabel(quality);
                const priceMultiplier = this.engine.getQualityPriceMultiplier(quality);
                const effectivePrice = this.engine.getRecipeBasePrice(key) * priceMultiplier;

                return `
                    <div class="ready-item">
                        <span>${recipe.icon} ${recipe.name}</span>
                        <span class="ready-qty">${stock}x</span>
                        <span class="ready-quality" style="color: ${qualityLabel.color}">${qualityLabel.emoji} ${quality.toFixed(0)}%</span>
                        <span class="ready-price">$${effectivePrice.toFixed(2)}</span>
                    </div>
                `;
            }).join('');

        container.innerHTML = products || '<div class="no-products">No products yet. Bake something!</div>';
    }

    bakingLoopId = null;

    startBakingLoop() {
        let lastTime = performance.now();

        const loop = () => {
            const now = performance.now();
            const delta = now - lastTime;
            lastTime = now;

            const completed = this.engine.updateProduction(delta);

            if (completed.length > 0) {
                this.renderProductionQueue();
                this.renderReadyProducts();
                this.renderRecipes();
            } else if (this.engine.productionQueue.length > 0) {
                this.renderProductionQueue();
            }

            this.bakingLoopId = requestAnimationFrame(loop);
        };

        this.bakingLoopId = requestAnimationFrame(loop);
    }

    stopBakingLoop() {
        if (this.bakingLoopId) {
            cancelAnimationFrame(this.bakingLoopId);
            this.bakingLoopId = null;
        }
    }

    // ==================== SELLING PHASE ====================
    showSellingPhase() {
        this.engine.isPaused = false;
        this.activeCustomers = [];

        const container = document.getElementById('game-container');
        if (container) {
            container.style.padding = '0';
            container.style.overflow = 'auto';
        }

        container.innerHTML = `
            <div style="padding: 20px; min-height: 100%;">
            <div class="phase-header">
                <h2>💰 Open Shop - Day ${this.engine.day}</h2>
                <p>Serve customers and make sales! Time: <span id="game-time">${this.engine.getTimeString()}</span></p>
                <div class="time-controls" style="margin-top: 10px; display: flex; gap: 10px; align-items: center; justify-content: center;">
                    <span style="font-size: 14px; color: #7f8c8d;">Time Speed:</span>
                    <button class="btn btn-sm" onclick="window.game.setGameSpeed(1)" style="padding: 5px 10px; font-size: 12px;">1x</button>
                    <button class="btn btn-sm" onclick="window.game.setGameSpeed(2)" style="padding: 5px 10px; font-size: 12px;">2x</button>
                    <button class="btn btn-sm" onclick="window.game.setGameSpeed(5)" style="padding: 5px 10px; font-size: 12px;">5x</button>
                    <button class="btn btn-sm" onclick="window.game.setGameSpeed(10)" style="padding: 5px 10px; font-size: 12px;">10x</button>
                    <span id="speed-indicator" style="font-size: 14px; font-weight: bold; color: #27ae60;">1x</span>
                </div>
                <div class="phase-tools">
                    <button class="btn btn-automation" id="btn-auto-selling">🤖 Deploy Staff Automation</button>
                </div>
            </div>
            
            <div class="selling-layout-advanced" id="sell-phase-container">
                <!-- Employee Panel for Selling -->
                <div class="employee-panel-selling">
                    <h3>👨‍🍳 Staff</h3>
                    <div class="employee-list-selling" id="employee-list-selling">
                        ${this.renderEmployeeSelling()}
                    </div>
                </div>
                
                <!-- Shop Display -->
                <div class="shop-display">
                    <h3>🏪 Your Display Case</h3>
                    <div class="display-products" id="display-products"></div>
                </div>
                
                <!-- Customer Window -->
                <div class="customer-window">
                    <h3>👥 Customer Queue</h3>
                    <div class="customer-area" id="customer-area">
                        <div class="waiting-message">Waiting for customers...</div>
                    </div>
                </div>
                
                <!-- Sales Stats -->
                <div class="sales-stats">
                    <h3>📊 Today's Stats</h3>
                    <div class="stat-row"><span>Revenue:</span><span id="stat-revenue">$0.00</span></div>
                    <div class="stat-row"><span>Customers:</span><span id="stat-customers">0</span></div>
                    <div class="stat-row"><span>Missed:</span><span id="stat-missed">0</span></div>
                </div>
            </div>
            
            <div class="phase-actions">
                <button class="btn btn-danger" id="btn-close-shop">🚪 Close Shop Early</button>
            </div>
            </div>
        `;

        const autoSellingBtn = document.getElementById('btn-auto-selling');
        if (autoSellingBtn) {
            autoSellingBtn.onclick = () => this.manualAutomationTrigger('selling');
        }

        this.renderDisplayProducts();
        this.renderCustomerArea();
        this.startSellingLoop();

        document.getElementById('btn-close-shop').onclick = () => {
            this.showPopup({
                icon: '🚪',
                title: 'Close Shop?',
                message: 'Are you sure you want to close early? Any remaining customers will leave.',
                type: 'warning',
                buttons: [
                    { text: 'Stay Open', action: 'close', style: 'secondary' },
                    {
                        text: 'Close Shop', action: () => {
                            this.stopSellingLoop();
                            this.showModeHub();
                        }
                    }
                ]
            });
        };

        this.updateStats();

        // Maybe trigger a crisis
        if (Math.random() < 0.3) {
            setTimeout(() => this.triggerCrisis(), 5000);
        }
    }

    renderEmployeeSelling() {
        if (this.engine.staff.length === 0) {
            return '<div class="no-employees">Solo operation - you handle all customers!</div>';
        }

        return this.engine.staff.map(employee => {
            const servingCustomer = employee.currentCustomer || null;
            const taskInfo = servingCustomer
                ? `Serving ${servingCustomer.name} ${servingCustomer.face}`
                : 'Ready to serve';

            return `
                <div class="employee-card-selling">
                    <div class="employee-header">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 20px;">${employee.face}</span>
                            <span class="employee-name">${employee.name}</span>
                        </div>
                        <span class="employee-skill">⭐${employee.skillLevel.toFixed(1)}</span>
                    </div>
                    <div class="employee-status">
                        <div class="status-value">${taskInfo}</div>
                    </div>
                    <div class="employee-stats-mini">
                        <div class="stat-mini">
                            <span>😊${employee.happiness.toFixed(0)}</span>
                            <span>😴${employee.fatigue.toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDisplayProducts() {
        const display = document.getElementById('display-products');
        if (!display) return;

        const products = Object.entries(this.engine.products)
            .map(([key, p]) => {
                const recipe = GAME_CONFIG.RECIPES[key];
                const stock = this.engine.getProductStock(key);
                const quality = this.engine.getProductQuality(key);
                const qualityLabel = this.engine.getQualityLabel(quality);
                const priceMultiplier = this.engine.getQualityPriceMultiplier(quality);
                const effectivePrice = this.engine.getRecipeBasePrice(key) * priceMultiplier;

                return `
                    <div class="display-item ${stock === 0 ? 'sold-out' : ''}">
                        <div class="display-icon">${recipe.icon}</div>
                        <div class="display-name">${recipe.name}</div>
                        <div class="display-price" title="Base: $${this.engine.getRecipeBasePrice(key).toFixed(2)}">$${effectivePrice.toFixed(2)}</div>
                        <div class="display-quality" style="color: ${qualityLabel.color}">${qualityLabel.emoji}</div>
                        <div class="display-qty">${stock}x</div>
                    </div>
                `;
            }).join('');

        display.innerHTML = products;
    }

    getCustomerCapacity() {
        const staffCount = Array.isArray(this.engine?.staff) ? this.engine.staff.length : 0;
        const ownerCapacity = 1;
        return Math.min(5, ownerCapacity + staffCount);
    }

    getCustomerById(customerId) {
        return (this.activeCustomers || []).find(c => c.id === customerId);
    }

    manualServeCustomer(customerId) {
        const customer = this.getCustomerById(customerId);
        if (!customer) return;
        this.completeCustomerSale({ customer, manualOverride: true });
    }

    cancelCustomerOrder(customerId) {
        const customer = this.getCustomerById(customerId);
        if (!customer) return;
        this.refuseCustomer(customer);
    }

    removeCustomer(customer) {
        this.releaseAssignedStaff(customer);
        this.activeCustomers = (this.activeCustomers || []).filter(c => c !== customer);
        this.renderCustomerArea();
        this.resumeWaitingCustomers();
    }

    renderCustomerArea() {
        const container = document.getElementById('customer-area');
        if (!container) return;

        if (!this.activeCustomers || this.activeCustomers.length === 0) {
            container.innerHTML = '<div class="waiting-message">Waiting for customers...</div>';
            return;
        }

        container.innerHTML = this.activeCustomers.map(customer => this.renderCustomerCard(customer)).join('');
    }

    renderCustomerCard(customer) {
        const recipe = customer.wantsItem ? GAME_CONFIG.RECIPES[customer.wantsItem] : null;
        const baseFace = customer.face || '🙂';
        const baseName = customer.name || 'Customer';
        const segmentIcon = customer.segment?.icon || '';
        const segmentDesc = customer.segment?.description || '';
        const state = customer.state || 'waiting';
        const orderLine = customer.orderMessage || (recipe ? `I'll take the ${recipe.name}!` : 'Looking around...');

        if (state === 'success') {
            return `
                <div class="customer-popup success" data-customer-id="${customer.id}">
                    <div class="customer-face" style="font-size: 72px;">${customer.resultFace || '😊'}</div>
                    <div class="customer-name">${baseName}</div>
                    <div class="customer-dialogue">"${customer.resultMessage || 'Delicious!'}"</div>
                    <div class="sale-amount">+$${(customer.resultRevenue || 0).toFixed(2)}</div>
                </div>
            `;
        }

        if (state === 'sad') {
            return `
                <div class="customer-popup sad" data-customer-id="${customer.id}">
                    <div class="customer-face" style="font-size: 72px;">${customer.resultFace || '😔'}</div>
                    <div class="customer-name">${baseName}</div>
                    <div class="customer-dialogue">"${customer.resultMessage || 'Maybe next time.'}"</div>
                </div>
            `;
        }

        const requiresManual = customer.requiresManualService;
        const staffLabel = requiresManual
            ? 'Manual service needed — tap Serve Manually'
            : customer.assignedStaff
                ? `${customer.assignedStaff.face || '👨‍🍳'} ${customer.assignedStaff.name} is preparing the order`
                : 'Owner is preparing the order';
        const etaSeconds = Math.max(1, Math.round(((customer.serviceDuration || 2000) / 1000)));
        const showProgress = !requiresManual && !!customer.serviceDuration;

        return `
            <div class="customer-popup ${requiresManual ? 'manual-needed' : ''}" data-customer-id="${customer.id}">
                <div class="customer-face" style="font-size: 64px;">${baseFace}</div>
                <div class="customer-name">
                    ${baseName}
                    ${segmentIcon ? `<span class="customer-segment" title="${segmentDesc}">${segmentIcon}</span>` : ''}
                </div>
                <div class="customer-dialogue">"${customer.greeting || 'Hello!'}"</div>
                <div class="customer-order">"${orderLine}"</div>
                <div class="auto-service">
                    <div class="service-status">${staffLabel}${showProgress ? ` • ~${etaSeconds}s` : ''}</div>
                    ${showProgress ? `
                        <div class="service-progress">
                            <div class="service-progress-fill" style="width: 0%;"></div>
                        </div>
                    ` : ''}
                    <div class="service-actions">
                        <button class="btn btn-secondary" onclick="window.game.manualServeCustomer('${customer.id}')">Serve Manually</button>
                        <button class="btn btn-link" style="color: #c0392b;" onclick="window.game.cancelCustomerOrder('${customer.id}')">Cancel Order</button>
                    </div>
                </div>
            </div>
        `;
    }

    resumeWaitingCustomers() {
        if (!this.automationEnabled || !Array.isArray(this.activeCustomers) || this.activeCustomers.length === 0) return;
        const waiting = this.activeCustomers.filter(customer => customer.requiresManualService);
        if (waiting.length === 0) return;

        waiting.forEach(customer => this.planCustomerService(customer, { silent: true }));
    }

    sellingLoopId = null;
    lastCustomerTime = 0;

    startSellingLoop() {
        let lastTime = performance.now();
        this.lastCustomerTime = lastTime;

        const loop = () => {
            const now = performance.now();
            const delta = now - lastTime;
            lastTime = now;

            // Update time
            this.engine.update(delta);

            // Update time display
            const timeEl = document.getElementById('game-time');
            if (timeEl) timeEl.textContent = this.engine.getTimeString();

            // Check closing time
            if (this.engine.isClosingTime()) {
                this.stopSellingLoop();
                this.showPopup({
                    icon: '🌙',
                    title: 'Closing Time!',
                    message: 'The shop is now closed for the day.',
                    type: 'info',
                    buttons: [{ text: 'Return to Hub', action: () => this.showModeHub() }]
                });
                return;
            }

            // Spawn customers while capacity allows
            if (!this.crisisActive && this.activeCustomers.length < this.getCustomerCapacity()) {
                const timeSinceLastCustomer = now - this.lastCustomerTime;
                const hourMult = GAME_CONFIG.DEMAND.hourlyMultiplier[Math.floor(this.engine.hour)] || 0.5;
                const appealMult = this.engine.getMenuAppealMultiplier ? this.engine.getMenuAppealMultiplier() : 1;
                const spawnChance = (GAME_CONFIG.DEMAND.baseCustomersPerHour * hourMult * appealMult) / 60 / 10;

                if (timeSinceLastCustomer > 2000 && Math.random() < spawnChance) {
                    this.spawnCustomer();
                    this.lastCustomerTime = now;
                }
            }

            this.processAutoCustomers(now);

            // Update stats display
            this.updateSellingStats();

            this.sellingLoopId = requestAnimationFrame(loop);
        };

        this.sellingLoopId = requestAnimationFrame(loop);
    }

    stopSellingLoop() {
        this.engine.isPaused = true;
        if (this.sellingLoopId) {
            cancelAnimationFrame(this.sellingLoopId);
            this.sellingLoopId = null;
        }
        if (this.activeCustomers?.length) {
            this.activeCustomers.forEach(customer => this.releaseAssignedStaff(customer));
            this.activeCustomers = [];
        }
    }

    spawnCustomer() {
        const customer = GAME_CONFIG.CUSTOMERS[Math.floor(Math.random() * GAME_CONFIG.CUSTOMERS.length)];
        const segment = this.engine.selectCustomerSegment();
        const greetings = GAME_CONFIG.CUSTOMER_DIALOGUES.greeting;
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];

        // Find available products that this customer segment is willing to buy
        const available = Object.entries(this.engine.products)
            .filter(([key, p]) => {
                if (p.quantity <= 0) return false;

                // Demand check based on current price
                const recipe = GAME_CONFIG.RECIPES[key];
                const quality = this.engine.getProductQuality(key);
                const priceMultiplier = this.engine.getQualityPriceMultiplier(quality);
                const currentPrice = this.engine.getRecipeBasePrice(key) * priceMultiplier;

                return this.engine.willCustomerBuy(key, segment, currentPrice);
            })
            .map(([key]) => key);

        // If nothing matches price requirements, they might still pick something but refuse later
        // or just leave. For now let's just use available logic or random if none valid (so they can complain)

        let wantsItem = null;
        if (available.length > 0) {
            const toppingFriendly = this.engine.getToppingScore
                ? available.filter(key => this.engine.getToppingScore(key) > 0)
                : [];
            const appeal = this.engine.getMenuAppealMultiplier ? this.engine.getMenuAppealMultiplier() : 1;
            if (toppingFriendly.length > 0 && Math.random() < Math.min(0.8, Math.max(0, appeal - 0.8))) {
                wantsItem = toppingFriendly[Math.floor(Math.random() * toppingFriendly.length)];
            } else {
                wantsItem = available[Math.floor(Math.random() * available.length)];
            }
        } else {
            // Check if we have stock at all?
            const anyStock = Object.keys(this.engine.products).some(k => this.engine.getProductStock(k) > 0);
            if (anyStock) {
                // Have stock but too expensive for this customer
                // Pick random item to complain about price
                const allStock = Object.entries(this.engine.products)
                    .filter(([k, p]) => p.quantity > 0)
                    .map(([k]) => k);
                if (allStock.length > 0) wantsItem = allStock[Math.floor(Math.random() * allStock.length)];
            }
        }

        if (!wantsItem) {
            const sadDialogue = GAME_CONFIG.CUSTOMER_DIALOGUES.sad;
            const message = sadDialogue[Math.floor(Math.random() * sadDialogue.length)];

            const customerArea = document.getElementById('customer-area');
            if (customerArea) {
                customerArea.innerHTML = `
                    <div class="customer-popup">
                        <div class="customer-face" style="font-size: 64px;">${customer.face}</div>
                        <div class="customer-name">${customer.name}</div>
                        <div class="customer-dialogue">"${message}"</div>
                        <div class="customer-mood">😢 Disappointed</div>
                    </div>
                `;
            }

            this.engine.missedCustomer();

            setTimeout(() => {
                if (customerArea) {
                    customerArea.innerHTML = '<div class="waiting-message">Waiting for customers...</div>';
                }
            }, 2000);

            return;
        }

        const orderDialogues = GAME_CONFIG.CUSTOMER_DIALOGUES.ordering;
        const orderMsg = orderDialogues[Math.floor(Math.random() * orderDialogues.length)]
            .replace('{item}', GAME_CONFIG.RECIPES[wantsItem]?.name || wantsItem);

        const newCustomer = {
            id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...customer,
            segment,
            greeting,
            wantsItem,
            orderMessage: orderMsg,
            state: 'waiting',
            assignedStaff: null,
            requiresManualService: false
        };

        this.activeCustomers.push(newCustomer);
        this.planCustomerService(newCustomer);
        this.renderCustomerArea();
    }


    completeCustomerSale(options = {}) {
        let customer = options.customer;
        if (!customer && options.customerId) {
            customer = this.getCustomerById(options.customerId);
        }
        if (!customer) return;

        const recipe = GAME_CONFIG.RECIPES[customer.wantsItem];
        const result = this.engine.processSale(customer.wantsItem, 1);

        if (!result.success) {
            this.handleOutOfStock(customer);
            return;
        }

        const happyDialogues = GAME_CONFIG.CUSTOMER_DIALOGUES.happy;
        const msg = happyDialogues[Math.floor(Math.random() * happyDialogues.length)]
            .replace('{item}', recipe?.name || customer.wantsItem);
        const moodFace = result.appeal?.moodEmoji || '😊';
        const moodLine = result.appeal?.moodMessage || msg;

        customer.state = 'success';
        customer.resultMessage = moodLine;
        customer.resultRevenue = result.revenue;
        customer.resultFace = moodFace;
        this.releaseAssignedStaff(customer);
        this.renderCustomerArea();

        this.logAutomationEvent('sale', `${customer.name} bought ${recipe?.name || customer.wantsItem}`, {
            product: recipe?.name,
            amount: `$${result.revenue.toFixed(2)}`,
            auto: !!options.auto
        });

        this.renderDisplayProducts();

        setTimeout(() => {
            const stillPresent = this.getCustomerById(customer.id);
            if (stillPresent) {
                this.removeCustomer(stillPresent);
            }
        }, 1200);
    }

    refuseCustomer(customerOrId) {
        let customer = customerOrId;
        if (typeof customer === 'string') {
            customer = this.getCustomerById(customer);
        }
        if (!customer) return;

        this.engine.missedCustomer();
        customer.state = 'sad';
        customer.resultFace = '😔';
        customer.resultMessage = 'Maybe next time.';
        this.releaseAssignedStaff(customer);
        this.renderCustomerArea();

        setTimeout(() => {
            const stillPresent = this.getCustomerById(customer.id);
            if (stillPresent) {
                this.removeCustomer(stillPresent);
            }
        }, 1200);
    }

    updateSellingStats() {
        const revenueEl = document.getElementById('stat-revenue');
        const customersEl = document.getElementById('stat-customers');
        const missedEl = document.getElementById('stat-missed');

        if (revenueEl) revenueEl.textContent = `$${this.engine.dailyStats.revenue.toFixed(2)}`;
        if (customersEl) customersEl.textContent = this.engine.dailyStats.customersServed;
        if (missedEl) missedEl.textContent = this.engine.dailyStats.customersMissed;
    }

    assignCustomerToStaff() {
        if (!this.engine.staff || this.engine.staff.length === 0) return null;
        const available = this.engine.staff.filter(staff => !staff.currentCustomer && staff.fatigue < 95);
        if (available.length === 0) return null;
        available.sort((a, b) => {
            const skillDiff = b.skillLevel - a.skillLevel;
            const fatigueDiff = a.fatigue - b.fatigue;
            return skillDiff !== 0 ? skillDiff : fatigueDiff;
        });
        return available[0];
    }

    planCustomerService(customer, options = {}) {
        const silent = options.silent || false;
        if (!this.automationEnabled) {
            customer.requiresManualService = true;
            if (!silent) {
                this.logAutomationEvent('service', `Automation paused — serve ${customer.name} manually`, { severity: 'warning' });
            }
            this.renderCustomerArea();
            return;
        }

        const staff = this.assignCustomerToStaff(customer);
        customer.assignedStaff = staff || null;

        if (!staff) {
            customer.requiresManualService = true;
            if (!silent) {
                this.logAutomationEvent('service', `All staff busy — ${customer.name} needs attention`, { severity: 'warning' });
            }
            this.renderCustomerArea();
            return;
        }

        customer.requiresManualService = false;
        customer.serviceStart = performance.now();

        const baseDuration = 3500;
        const skillMod = Math.max(0.5, 1 - (staff.skillLevel - 3) * 0.12);
        const fatiguePenalty = (1 + staff.fatigue / 220);
        customer.serviceDuration = baseDuration * skillMod * fatiguePenalty;
        customer.serviceEndsAt = customer.serviceStart + customer.serviceDuration;

        staff.currentCustomer = customer;
        const recipe = GAME_CONFIG.RECIPES[customer.wantsItem];
        this.logAutomationEvent('service', `${staff.name} serving ${customer.name} (${recipe?.name || customer.wantsItem})`, {
            staff: staff.name,
            customer: customer.name,
            product: recipe?.name
        });
        this.renderCustomerArea();
    }

    processAutoCustomers(now) {
        if (!this.activeCustomers || this.activeCustomers.length === 0) return;

        const snapshot = [...this.activeCustomers];
        snapshot.forEach(customer => {
            if (!customer || customer.requiresManualService || !customer.serviceEndsAt) return;

            const total = customer.serviceDuration || 1;
            const elapsed = now - customer.serviceStart;
            const progress = Math.min(1, elapsed / total);

            const fill = document.querySelector(`[data-customer-id="${customer.id}"] .service-progress-fill`);
            if (fill) {
                fill.style.width = `${(progress * 100).toFixed(1)}%`;
            }

            if (progress >= 1) {
                this.completeCustomerSale({ customer, auto: true });
            }
        });
    }

    releaseAssignedStaff(customer) {
        if (customer && customer.assignedStaff && customer.assignedStaff.currentCustomer === customer) {
            customer.assignedStaff.currentCustomer = null;
        }
        if (customer) {
            customer.assignedStaff = null;
        }
    }

    handleOutOfStock(customer) {
        const sadDialogue = GAME_CONFIG.CUSTOMER_DIALOGUES.sad;
        const message = sadDialogue[Math.floor(Math.random() * sadDialogue.length)];

        customer.state = 'sad';
        customer.resultMessage = message;
        customer.resultFace = customer?.face || '😢';
        this.releaseAssignedStaff(customer);
        this.renderCustomerArea();

        this.engine.missedCustomer();

        setTimeout(() => {
            const stillPresent = this.getCustomerById(customer.id);
            if (stillPresent) {
                this.removeCustomer(stillPresent);
            }
        }, 1500);
    }

    // ==================== CRISIS EVENTS ====================
    triggerCrisis() {
        if (this.crisisActive) return;

        const events = GAME_CONFIG.CRISIS_EVENTS;
        const event = events[Math.floor(Math.random() * events.length)];

        this.crisisActive = true;
        this.engine.isPaused = true;

        this.showPopup({
            icon: event.urgent ? '🚨' : '⚠️',
            title: event.title,
            message: event.description,
            type: event.urgent ? 'danger' : 'warning',
            buttons: event.choices.map(choice => ({
                text: choice.text,
                style: choice.cost > 0 ? 'danger' : 'primary',
                action: () => this.resolveCrisis(event, choice)
            }))
        });
    }

    resolveCrisis(event, choice) {
        if (choice.cost > 0) {
            this.engine.cash -= choice.cost;
        }
        if (choice.bonus) {
            this.engine.cash += choice.bonus;
        }

        this.showPopup({
            icon: choice.success ? '✅' : '❌',
            title: choice.success ? 'Crisis Resolved!' : 'Outcome',
            message: choice.outcome + (choice.cost > 0 ? ` (-$${choice.cost})` : '') + (choice.bonus ? ` (+$${choice.bonus})` : ''),
            type: choice.success ? 'success' : 'warning',
            autoClose: 2000
        });

        this.crisisActive = false;
        this.engine.isPaused = false;
        this.updateStats();
    }

    // ==================== SUMMARY PHASE ====================
    showSummaryPhase() {
        this.stopBakingLoop();
        this.stopSellingLoop();

        // Simulate economic changes for the new day
        this.economy.simulateDay(this.engine.day);

        const summary = this.engine.endDay();

        // Record business metrics in economic simulation
        this.economy.recordBusinessMetrics({
            revenue: summary.revenue,
            costs: summary.cogs + summary.expenses,
            profit: summary.netProfit,
            cash: summary.cashEnd
        });

        // Build spoilage warning if any items went bad
        let spoilageHtml = '';
        if (summary.spoiledIngredients && summary.spoiledIngredients.length > 0) {
            spoilageHtml = `
                <div class="spoilage-warning">
                    <h3>🦠 Spoiled Overnight</h3>
                    <div class="spoilage-list">
                        ${summary.spoiledIngredients.map(s => `
                            <div class="spoilage-item">❌ ${s.quantity.toFixed(1)} ${s.name} went bad</div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Build stale products warning
        let staleHtml = '';
        if (summary.staleProducts && summary.staleProducts.length > 0) {
            staleHtml = `
                <div class="stale-warning">
                    <h3>📉 Products Losing Freshness</h3>
                    <div class="stale-list">
                        ${summary.staleProducts.map(s => `
                            <div class="stale-item">⚠️ ${s.quantity}x ${s.name} now at ${s.quality.toFixed(0)}% quality</div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const container = document.getElementById('game-container');
        if (container) container.style.padding = '20px';

        container.innerHTML = `
            <div class="summary-screen" id="summary-phase-container">
                <h2>📊 Day ${summary.day} Summary</h2>
                
                <div class="summary-grid">
                    <div class="summary-card revenue">
                        <div class="summary-label">Total Revenue</div>
                        <div class="summary-value">$${summary.revenue.toFixed(2)}</div>
                    </div>
                    
                    <div class="summary-card costs">
                        <div class="summary-label">Cost of Goods</div>
                        <div class="summary-value">-$${summary.cogs.toFixed(2)}</div>
                    </div>
                    
                    <div class="summary-card profit">
                        <div class="summary-label">Gross Profit</div>
                        <div class="summary-value ${summary.grossProfit >= 0 ? 'positive' : 'negative'}">
                            $${summary.grossProfit.toFixed(2)}
                        </div>
                    </div>
                </div>
                
                ${spoilageHtml}
                ${staleHtml}
                
                <div class="expenses-section">
                    <h3>💸 Daily Expenses</h3>
                    <div class="expense-list">
                        ${summary.expenseDetails.map(e => `
                            <div class="expense-row">
                                <span>${e.icon} ${e.name}</span>
                                <span>-$${e.amount.toFixed(2)}</span>
                            </div>
                        `).join('')}
                        <div class="expense-total">
                            <span>Total Expenses</span>
                            <span>-$${summary.expenses.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="net-profit-section ${summary.netProfit >= 0 ? 'positive' : 'negative'}">
                    <div class="net-label">NET PROFIT</div>
                    <div class="net-value">$${summary.netProfit.toFixed(2)}</div>
                </div>
                
                <div class="cash-section">
                    <div>Ending Cash Balance: <strong>$${summary.cashEnd.toFixed(2)}</strong></div>
                    <div style="margin-top: 10px;">
                        Customers Served: ${summary.customersServed} | Missed: ${summary.customersMissed}
                    </div>
                </div>
                
                <div class="phase-actions">
                    <button class="btn btn-secondary" id="btn-main-menu">🏠 Main Menu</button>
                    <button class="btn btn-primary" id="btn-next-day">☀️ Start Day ${this.engine.day}</button>
                </div>
            </div>
        `;

        // Save game
        localStorage.setItem('bakery_save', JSON.stringify(this.engine.save()));

        document.getElementById('btn-main-menu').onclick = () => this.showMainMenu();
        document.getElementById('btn-next-day').onclick = () => this.startDay();

        // Check for bankruptcy
        if (summary.cashEnd < 0) {
            setTimeout(() => {
                this.showPopup({
                    icon: '💸',
                    title: 'Bankruptcy!',
                    message: 'You have run out of money. Game Over!',
                    type: 'danger',
                    buttons: [
                        { text: 'Try Again', action: () => this.startNewGame() }
                    ]
                });
            }, 1000);
        }
    }

    // ==================== UI HELPERS ====================
    updateStats() {
        const cashEl = document.getElementById('nav-cash');
        if (cashEl) {
            const currentCash = this.engine.cash;
            if (this.lastCash !== undefined && Math.abs(currentCash - this.lastCash) > 1) {
                // Trigger animation if significant change
                // We don't have a source element here easily, so we'll default to center or just skip source
                // Or we can pass source to updateStats if we refactor
                // For now, just update text. 
                // If we want the coin animation, we should call animateMoneyChange from the action source (selling, buying)
            }
            cashEl.textContent = `$${currentCash.toFixed(2)}`;
            this.lastCash = currentCash;
        }

        const dayEl = document.getElementById('nav-day');
        if (dayEl) dayEl.textContent = `Day ${this.engine.day}`;
    }

    updatePhaseIndicator() {
        const phases = ['setup', 'buying', 'baking', 'selling', 'summary'];
        const highlight = document.querySelector('.phase-highlight');

        // Skip Flip animation - it's causing issues with "I is not a function" error in GSAP Flip plugin
        // Just use simple transitions instead
        let state = null;

        phases.forEach(phase => {
            const el = document.getElementById(`phase-${phase}`);
            if (el) {
                const isActive = phase === this.currentPhase;
                el.classList.toggle('active', isActive);
                el.classList.toggle('complete', phases.indexOf(phase) < phases.indexOf(this.currentPhase));

                if (isActive && highlight) {
                    highlight.style.display = 'block';
                    // Move highlight to active element
                    const rect = el.getBoundingClientRect();
                    const parentRect = el.parentElement.getBoundingClientRect();

                    // Use GSAP for smooth animation instead of Flip
                    if (window.gsap) {
                        gsap.to(highlight, {
                            duration: 0.5,
                            left: (rect.left - parentRect.left) + 'px',
                            width: rect.width + 'px',
                            height: rect.height + 'px',
                            top: (rect.top - parentRect.top) + 'px',
                            ease: "power2.inOut"
                        });
                    } else {
                        // Fallback without animation
                        highlight.style.left = (rect.left - parentRect.left) + 'px';
                        highlight.style.width = rect.width + 'px';
                        highlight.style.height = rect.height + 'px';
                        highlight.style.top = (rect.top - parentRect.top) + 'px';
                    }
                }
            }
        });
    }

    showFinancialInsight(title, message) {
        this.showPopup({
            icon: '💡',
            title: title,
            message: message,
            type: 'insight', // Custom style
            typingEffect: true,
            buttons: [{ text: 'Got it', style: 'primary', action: () => { } }]
        });
    }

    animateMoneyChange(amount, fromElement) {
        if (!window.gsap || !window.MotionPathPlugin) return;

        const coin = document.createElement('div');
        coin.textContent = '💰';
        coin.style.position = 'fixed';
        coin.style.fontSize = '24px';
        coin.style.zIndex = '9999';
        coin.style.pointerEvents = 'none';

        // Start position
        const startRect = fromElement ? fromElement.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
        coin.style.left = startRect.left + 'px';
        coin.style.top = startRect.top + 'px';

        document.body.appendChild(coin);

        // Target: Nav Cash
        const target = document.getElementById('nav-cash');
        const targetRect = target ? target.getBoundingClientRect() : { left: 50, top: 50 };

        // Animate
        gsap.to(coin, {
            duration: 1.5,
            motionPath: {
                path: [
                    { x: (targetRect.left - startRect.left) * 0.5 + 100, y: (targetRect.top - startRect.top) * 0.5 - 100 }, // Control point
                    { x: targetRect.left - startRect.left, y: targetRect.top - startRect.top }
                ],
                curviness: 1.5,
                autoRotate: false
            },
            scale: 0.5,
            opacity: 0,
            ease: "power1.inOut",
            onComplete: () => coin.remove()
        });
    }

    showPopup(options) {
        // Remove existing popup
        document.querySelectorAll('.game-popup-overlay').forEach(p => p.remove());

        const overlay = document.createElement('div');
        overlay.className = 'game-popup-overlay';

        const popup = document.createElement('div');
        popup.className = `game-popup ${options.type || 'info'}`;

        let buttonsHtml = '';
        if (options.buttons) {
            buttonsHtml = `<div class="popup-buttons">
                ${options.buttons.map(btn => `
                    <button class="popup-btn ${btn.style || 'primary'}" data-action="${btn.text}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>`;
        }

        // If typing effect is requested, start with empty message
        const messageContent = options.typingEffect ? '' : options.message;

        popup.innerHTML = `
            <div class="popup-icon">${options.icon || 'ℹ️'}</div>
            <div class="popup-title">${options.title}</div>
            <div class="popup-message">${messageContent}</div>
            ${buttonsHtml}
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Animate in
        gsap.fromTo(popup,
            { scale: 0.5, opacity: 0, y: 20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.75)' }
        );

        // Typing effect
        if (options.typingEffect && window.gsap && window.TextPlugin) {
            gsap.to(popup.querySelector('.popup-message'), {
                duration: options.message.length * 0.03,
                text: options.message,
                ease: "none",
                delay: 0.2
            });
        }

        // Button handlers
        if (options.buttons) {
            popup.querySelectorAll('.popup-btn').forEach((btn, i) => {
                btn.onclick = () => {
                    const action = options.buttons[i].action;
                    // Animate out
                    gsap.to(popup, {
                        scale: 0.8, opacity: 0, duration: 0.2,
                        onComplete: () => {
                            overlay.remove();
                            if (typeof action === 'function') action();
                        }
                    });
                };
            });
        }

        // Auto close
        if (options.autoClose) {
            setTimeout(() => {
                if (overlay.parentNode) {
                    gsap.to(popup, {
                        scale: 0.5, opacity: 0, duration: 0.2,
                        onComplete: () => overlay.remove()
                    });
                }
            }, options.autoClose);
        }

        return overlay;
    }

    showStrategyPanel() {
        if (!GAME_CONFIG.STRATEGY) {
            this.showPopup({ icon: 'ℹ️', title: 'Strategy Unavailable', message: 'Strategy systems are still loading.', type: 'info', autoClose: 1500 });
            return;
        }

        const strategyConfig = GAME_CONFIG.STRATEGY;
        const currentPhilosophy = this.strategySettings?.philosophy || 'craftsmanship';
        const currentPlaybook = this.strategySettings?.playbook || 'steady_shop';
        const currentPricing = this.strategySettings?.pricingStyle || 'balanced';
        const currentMarketing = this.strategySettings?.marketingFocus || 'REGULAR';
        const bounds = strategyConfig.INVENTORY_BOUNDS || { minDays: 0.5, maxDays: 3 };
        const bufferValue = this.strategySettings?.inventoryBufferDays || 1.5;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content strategy-modal" style="max-width: 1100px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>🎯 Strategy Board</h2>
                    <button class="modal-close" id="close-strategy-panel">×</button>
                </div>
                <div class="modal-body">
                    <section class="strategy-section">
                        <h3>Business Philosophy</h3>
                        <div class="strategy-grid" id="philosophy-grid">
                            ${Object.entries(strategyConfig.PHILOSOPHIES).map(([key, value]) => `
                                <div class="strategy-card ${key === currentPhilosophy ? 'selected' : ''}" data-group="philosophy" data-key="${key}">
                                    <div class="strategy-card-icon">${value.icon || '🎓'}</div>
                                    <div class="strategy-card-title">${value.name}</div>
                                    <p>${value.summary}</p>
                                </div>
                            `).join('')}
                        </div>
                    </section>

                    <section class="strategy-section">
                        <h3>Operating Playbook</h3>
                        <div class="strategy-grid" id="playbook-grid">
                            ${Object.entries(strategyConfig.PLAYBOOKS).map(([key, value]) => `
                                <div class="strategy-card ${key === currentPlaybook ? 'selected' : ''}" data-group="playbook" data-key="${key}">
                                    <div class="strategy-card-icon">${value.icon || '📋'}</div>
                                    <div class="strategy-card-title">${value.name}</div>
                                    <p>${value.summary}</p>
                                    <div class="strategy-card-meta">Target Output: ${value.dailyOutput || 0} / Inventory Days: ${value.inventoryDays}</div>
                                </div>
                            `).join('')}
                        </div>
                    </section>

                    <section class="strategy-section">
                        <h3>Automation Knobs</h3>
                        <div class="strategy-controls">
                            <label for="buffer-range">Inventory Coverage (${bounds.minDays}-${bounds.maxDays} days)</label>
                            <div class="strategy-control-row">
                                <input type="range" id="buffer-range" min="${bounds.minDays}" max="${bounds.maxDays}" step="0.1" value="${bufferValue}">
                                <span id="buffer-display">${bufferValue.toFixed(1)} days</span>
                            </div>

                            <label for="pricing-style-select">Pricing Style</label>
                            <select id="pricing-style-select">
                                ${Object.entries(strategyConfig.PRICING_STYLES).map(([key, style]) => `
                                    <option value="${key}" ${key === currentPricing ? 'selected' : ''}>${style.label}</option>
                                `).join('')}
                            </select>
                            <p class="strategy-hint" id="pricing-hint">${strategyConfig.PRICING_STYLES[currentPricing]?.description || ''}</p>

                            <label for="marketing-focus-select">Marketing Focus</label>
                            <select id="marketing-focus-select">
                                ${Object.entries(GAME_CONFIG.CUSTOMER_SEGMENTS).map(([key, segment]) => `
                                    <option value="${key}" ${key === currentMarketing ? 'selected' : ''}>${segment.icon || '👥'} ${segment.name}</option>
                                `).join('')}
                            </select>
                        </div>
                    </section>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="btn btn-secondary" id="cancel-strategy">Cancel</button>
                    <button class="btn btn-primary" id="save-strategy">Save Strategy</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closePanel = () => overlay.remove();
        overlay.querySelector('#close-strategy-panel').onclick = closePanel;
        overlay.querySelector('#cancel-strategy').onclick = closePanel;

        let selectedPhilosophy = currentPhilosophy;
        let selectedPlaybook = currentPlaybook;
        let selectedPricing = currentPricing;
        let selectedMarketing = currentMarketing;
        let selectedBuffer = bufferValue;

        overlay.querySelectorAll('.strategy-card').forEach(card => {
            card.addEventListener('click', () => {
                const group = card.dataset.group;
                const key = card.dataset.key;
                if (group === 'philosophy') {
                    selectedPhilosophy = key;
                } else if (group === 'playbook') {
                    selectedPlaybook = key;
                }
                overlay.querySelectorAll(`.strategy-card[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });

        const bufferRange = overlay.querySelector('#buffer-range');
        const bufferDisplay = overlay.querySelector('#buffer-display');
        bufferRange.addEventListener('input', (e) => {
            selectedBuffer = Number(e.target.value);
            bufferDisplay.textContent = `${selectedBuffer.toFixed(1)} days`;
        });

        const pricingSelect = overlay.querySelector('#pricing-style-select');
        const pricingHint = overlay.querySelector('#pricing-hint');
        pricingSelect.addEventListener('change', (e) => {
            selectedPricing = e.target.value;
            pricingHint.textContent = strategyConfig.PRICING_STYLES[selectedPricing]?.description || '';
        });

        const marketingSelect = overlay.querySelector('#marketing-focus-select');
        marketingSelect.addEventListener('change', (e) => {
            selectedMarketing = e.target.value;
        });

        overlay.querySelector('#save-strategy').onclick = () => {
            this.applyStrategySettings({
                philosophy: selectedPhilosophy,
                playbook: selectedPlaybook,
                pricingStyle: selectedPricing,
                marketingFocus: selectedMarketing,
                bufferDays: selectedBuffer,
                keepTargets: false
            });
            closePanel();
            this.showPopup({ icon: '✅', title: 'Strategy Updated', message: 'Automation recalibrated to your new focus.', type: 'success', autoClose: 1500 });
        };

        gsap.from(overlay.querySelector('.strategy-modal'), { scale: 0.9, opacity: 0, duration: 0.25, ease: 'back.out(1.4)' });
    }

    // ==================== STAFF MANAGEMENT PANEL ====================
    showStaffPanel() {
        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>👥 Staff & Operations</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this.renderStaffList()}
                    ${this.renderHireOptions()}
                    ${this.renderShiftSchedule()}
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Animate in
        gsap.from(panel.querySelector('.modal-content'), {
            scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out'
        });
    }

    renderStaffList() {
        if (this.engine.staff.length === 0) {
            return `
                <div class="staff-section">
                    <h3>Current Staff</h3>
                    <p style="opacity: 0.6; padding: 20px; text-align: center;">
                        No employees yet. Hire staff below to increase efficiency!
                    </p>
                </div>
            `;
        }

        const staffEfficiency = this.engine.getStaffEfficiency().toFixed(2);

        return `
            <div class="staff-section">
                <h3>Current Staff (Efficiency: ${staffEfficiency}x)</h3>
                <div class="staff-grid">
                    ${this.engine.staff.map(staff => `
                        <div class="staff-card">
                            <div class="staff-header">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 24px;">${staff.face}</span>
                                    <h4>${staff.name}</h4>
                                </div>
                                <span class="staff-role">${staff.role}</span>
                            </div>
                            <div class="staff-stats">
                                <div class="stat-row">
                                    <span>Skill Level:</span>
                                    <div class="skill-bar">
                                        <div class="skill-fill" style="width: ${staff.skillLevel * 20}%"></div>
                                    </div>
                                </div>
                                <div class="stat-row">
                                    <span>Happiness:</span>
                                    <div class="happiness-bar">
                                        <div class="happiness-fill" style="width: ${staff.happiness}%; background: ${staff.happiness > 70 ? '#2ecc71' : staff.happiness > 40 ? '#f39c12' : '#e74c3c'}"></div>
                                    </div>
                                    <span>${staff.happiness}%</span>
                                </div>
                                <div class="stat-row">
                                    <span>Fatigue:</span>
                                    <div class="fatigue-bar">
                                        <div class="fatigue-fill" style="width: ${staff.fatigue}%; background: ${staff.fatigue > 70 ? '#e74c3c' : staff.fatigue > 40 ? '#f39c12' : '#2ecc71'}"></div>
                                    </div>
                                    <span>${staff.fatigue}%</span>
                                </div>
                                <div class="stat-row">
                                    <span>Efficiency:</span>
                                    <strong>${(staff.efficiency * (0.8 + staff.happiness / 250) * (1 - staff.fatigue / 200)).toFixed(2)}x</strong>
                                </div>
                                <div class="stat-row">
                                    <span>Salary:</span>
                                    <strong>$${staff.baseSalary}/month</strong>
                                </div>
                                <div class="stat-row">
                                    <span>Training:</span>
                                    <strong>Level ${staff.trainingLevel}/5</strong>
                                </div>
                            </div>
                            <div class="staff-actions">
                                <button class="btn-small btn-primary" onclick="window.game.trainStaff(${staff.id})">
                                    📚 Train ($${staff.trainingCost})
                                </button>
                                <button class="btn-small btn-danger" onclick="window.game.fireStaff(${staff.id})">
                                    ❌ Fire
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderHireOptions() {
        const options = GAME_CONFIG.SETUP_OPTIONS.staff;

        return `
            <div class="staff-section">
                <h3>Hire New Staff</h3>
                <div class="hire-grid">
                    ${options.map(staffOption => `
                        <div class="hire-card">
                            <div class="hire-icon">${staffOption.icon}</div>
                            <h4>${staffOption.name}</h4>
                            <p class="hire-desc">${staffOption.description}</p>
                            <div class="hire-details">
                                <div><strong>Salary:</strong> $${staffOption.monthlyCost}/month</div>
                                <div><strong>Efficiency:</strong> ${staffOption.efficiency}x</div>
                                <div><strong>Skill:</strong> ${staffOption.skillLevel}</div>
                            </div>
                            <button class="btn-primary" onclick="window.game.hireStaffOption('${staffOption.id}')">
                                Hire
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderShiftSchedule() {
        const schedule = this.engine.shiftSchedule;

        return `
            <div class="staff-section">
                <h3>⏰ Shift Schedule</h3>
                <div class="schedule-controls">
                    <div class="schedule-row">
                        <label>Opening Hour:</label>
                        <input type="number" min="0" max="23" value="${schedule.openingHour}" 
                               onchange="window.game.updateOpeningHour(this.value)">
                        <span>${schedule.openingHour}:00</span>
                    </div>
                    <div class="schedule-row">
                        <label>Closing Hour:</label>
                        <input type="number" min="0" max="23" value="${schedule.closingHour}" 
                               onchange="window.game.updateClosingHour(this.value)">
                        <span>${schedule.closingHour}:00</span>
                    </div>
                    <div class="schedule-row">
                        <label>Status:</label>
                        <span class="status-badge ${schedule.isOpen ? 'open' : 'closed'}">
                            ${schedule.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== EQUIPMENT MANAGEMENT PANEL ====================
    showEquipmentPanel() {
        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>⚙️ Equipment & Maintenance</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this.renderEquipmentList()}
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        gsap.from(panel.querySelector('.modal-content'), {
            scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out'
        });
    }

    renderEquipmentList() {
        const allEquipment = [
            ...this.engine.equipment.ovens || [],
            ...this.engine.equipment.mixers || [],
            ...this.engine.equipment.displays || []
        ];

        if (allEquipment.length === 0) {
            return `
                <p style="opacity: 0.6; padding: 20px; text-align: center;">
                    No equipment tracked yet. Equipment from your startup phase will appear here.
                </p>
            `;
        }

        const equipEfficiency = this.engine.getEquipmentEfficiency().toFixed(2);

        return `
            <div class="equipment-section">
                <h3>All Equipment (Efficiency: ${equipEfficiency}x)</h3>
                <div class="equipment-grid">
                    ${allEquipment.map(equip => {
            const conditionClass = equip.condition > 70 ? 'good' : equip.condition > 40 ? 'fair' : 'poor';
            const daysSinceMaint = this.engine.day - equip.lastMaintenance;

            return `
                            <div class="equipment-card ${conditionClass}">
                                <div class="equipment-header">
                                    <h4>${equip.name}</h4>
                                    <span class="equipment-type">${equip.type}</span>
                                </div>
                                <div class="equipment-stats">
                                    <div class="stat-row">
                                        <span>Condition:</span>
                                        <div class="condition-bar">
                                            <div class="condition-fill" style="width: ${equip.condition}%; background: ${equip.condition > 70 ? '#2ecc71' : equip.condition > 40 ? '#f39c12' : '#e74c3c'}"></div>
                                        </div>
                                        <strong>${equip.condition.toFixed(0)}%</strong>
                                    </div>
                                    <div class="stat-row">
                                        <span>Breakdown Risk:</span>
                                        <strong>${(equip.breakdownProbability * 100).toFixed(1)}%</strong>
                                    </div>
                                    <div class="stat-row">
                                        <span>Last Maintenance:</span>
                                        <span>${daysSinceMaint} days ago</span>
                                    </div>
                                    <div class="stat-row">
                                        <span>Total Repairs:</span>
                                        <strong>$${equip.totalRepairCosts.toFixed(2)}</strong>
                                    </div>
                                </div>
                                <div class="equipment-actions">
                                    <button class="btn-small btn-primary" onclick="window.game.maintainEquipmentById(${equip.id})">
                                        🔧 Maintain ($${equip.maintenanceCost.toFixed(2)})
                                    </button>
                                    ${equip.condition < 80 ? `
                                        <button class="btn-small btn-warning" onclick="window.game.repairEquipmentById(${equip.id})">
                                            🛠️ Repair ($${((equip.maintenanceCost * (100 - equip.condition)) / 10).toFixed(2)})
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    // Helper methods for UI interactions
    hireStaffOption(staffId) {
        const staffConfig = GAME_CONFIG.SETUP_OPTIONS.staff.find(s => s.id === staffId);
        if (!staffConfig) return;

        const result = this.engine.hireStaff(staffConfig);
        if (result.success) {
            this.updateAutomationAvailability();
            this.showPopup({
                icon: '✅',
                title: 'Staff Hired!',
                message: `${result.staff.face} ${staffConfig.name} has joined your team!`,
                type: 'success',
                autoClose: 2000
            });
            // Refresh the staff panel after a delay
            setTimeout(() => {
                const existingPanel = document.querySelector('.modal-overlay');
                if (existingPanel) {
                    existingPanel.remove();
                    this.showStaffPanel();
                }
            }, 2100);
        }
    }

    trainStaff(staffId) {
        const result = this.engine.trainStaff(staffId);
        if (result.success) {
            this.showPopup({
                icon: '📚',
                title: 'Training Complete!',
                message: `Staff training improved! Cost: $${result.cost}`,
                type: 'success'
            });
            document.querySelector('.modal-overlay').remove();
            this.showStaffPanel();
        } else {
            this.showPopup({
                icon: '❌',
                title: 'Cannot Train',
                message: result.message,
                type: 'error'
            });
        }
    }

    fireStaff(staffId) {
        if (!confirm('Are you sure you want to fire this employee? Severance pay will be deducted.')) return;

        const result = this.engine.fireStaff(staffId);
        if (result.success) {
            this.showPopup({
                icon: '👋',
                title: 'Employee Dismissed',
                message: `Severance paid: $${result.severance}`,
                type: 'warning'
            });
            document.querySelector('.modal-overlay').remove();
            this.showStaffPanel();
        }
    }

    updateOpeningHour(hour) {
        this.engine.shiftSchedule.openingHour = parseInt(hour);
    }

    updateClosingHour(hour) {
        this.engine.shiftSchedule.closingHour = parseInt(hour);
    }

    maintainEquipmentById(equipId) {
        const result = this.engine.maintainEquipment(equipId);
        if (result.success) {
            this.showPopup({
                icon: '🔧',
                title: 'Maintenance Complete!',
                message: `Equipment maintained. Cost: $${result.cost.toFixed(2)}`,
                type: 'success'
            });
            document.querySelector('.modal-overlay').remove();
            this.showEquipmentPanel();
        } else {
            this.showPopup({
                icon: '❌',
                title: 'Cannot Maintain',
                message: result.message,
                type: 'error'
            });
        }
    }

    repairEquipmentById(equipId) {
        const result = this.engine.repairEquipment(equipId);
        if (result.success) {
            this.showPopup({
                icon: '🛠️',
                title: 'Repair Complete!',
                message: `Equipment fully repaired. Cost: $${result.cost.toFixed(2)}`,
                type: 'success'
            });
            document.querySelector('.modal-overlay').remove();
            this.showEquipmentPanel();
        } else {
            this.showPopup({
                icon: '❌',
                title: 'Cannot Repair',
                message: result.message,
                type: 'error'
            });
        }
    }

    // ==================== FINANCIAL EDUCATION SYSTEM ====================

    /**
     * Show educational popup for a financial term
     * @param {string} termKey - Key from FINANCIAL_EDUCATION.terms
     */
    showEducationPopup(termKey) {
        if (!window.FINANCIAL_EDUCATION || !FINANCIAL_EDUCATION.terms[termKey]) {
            console.warn('Education term not found:', termKey);
            return;
        }

        const term = FINANCIAL_EDUCATION.terms[termKey];

        // Remove existing popup
        document.querySelectorAll('.edu-popup-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'edu-popup-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="edu-popup">
                <div class="edu-popup-header">
                    <span class="edu-popup-title">${term.term}</span>
                    <span class="edu-popup-badge">📚 Financial Term</span>
                    <button class="edu-popup-close" onclick="this.closest('.edu-popup-overlay').remove()">×</button>
                </div>
                <div class="edu-popup-body">
                    <div class="edu-simple">${term.simple}</div>
                    <div class="edu-detailed">${term.detailed}</div>
                    
                    ${term.realExample ? `
                        <div class="edu-example">
                            <div class="edu-example-label">💡 Real Example</div>
                            <div class="edu-example-text">${term.realExample}</div>
                        </div>
                    ` : ''}
                    
                    ${term.worksWhen || term.failsWhen ? `
                        <div class="edu-strategy">
                            <div class="edu-works">
                                <div class="edu-works-header">✅ Works When</div>
                                <p>${term.worksWhen}</p>
                            </div>
                            <div class="edu-fails">
                                <div class="edu-fails-header">⚠️ Fails When</div>
                                <p>${term.failsWhen}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        if (window.gsap) {
            gsap.from(overlay.querySelector('.edu-popup'), {
                scale: 0.8, opacity: 0, y: 20, duration: 0.3, ease: 'back.out(1.5)'
            });
        }
    }

    /**
     * Show strategy explanation popup
     * @param {string} strategyKey - Key from FINANCIAL_EDUCATION.strategies
     */
    showStrategyExplanation(strategyKey) {
        if (!window.FINANCIAL_EDUCATION || !FINANCIAL_EDUCATION.strategies[strategyKey]) {
            return;
        }

        const strategy = FINANCIAL_EDUCATION.strategies[strategyKey];

        document.querySelectorAll('.edu-popup-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'edu-popup-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="edu-popup">
                <div class="edu-popup-header">
                    <span class="edu-popup-title">${strategy.name}</span>
                    <span class="edu-popup-badge">🎯 Strategy</span>
                    <button class="edu-popup-close" onclick="this.closest('.edu-popup-overlay').remove()">×</button>
                </div>
                <div class="edu-popup-body">
                    <div class="edu-simple">${strategy.description}</div>
                    
                    <div class="edu-strategy">
                        <div class="edu-works">
                            <div class="edu-works-header">✅ Works When</div>
                            <ul>${strategy.worksWhen.map(w => `<li>${w}</li>`).join('')}</ul>
                        </div>
                        <div class="edu-fails">
                            <div class="edu-fails-header">⚠️ Fails When</div>
                            <ul>${strategy.failsWhen.map(f => `<li>${f}</li>`).join('')}</ul>
                        </div>
                    </div>
                    
                    ${strategy.keyMetric ? `
                        <div class="edu-example">
                            <div class="edu-example-label">📊 Key Metric</div>
                            <div class="edu-example-text">${strategy.keyMetric}</div>
                        </div>
                    ` : ''}
                    
                    ${strategy.realExample ? `
                        <div class="edu-example">
                            <div class="edu-example-label">💡 Real Example</div>
                            <div class="edu-example-text">${strategy.realExample}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    /**
     * Show a "Did You Know?" tip card
     */
    showRandomTip() {
        if (!window.FINANCIAL_EDUCATION || !FINANCIAL_EDUCATION.tips) return;

        // Remove existing tip
        document.querySelectorAll('.tip-card').forEach(el => el.remove());

        const tips = FINANCIAL_EDUCATION.tips;
        const tip = tips[Math.floor(Math.random() * tips.length)];

        const card = document.createElement('div');
        card.className = 'tip-card';
        card.innerHTML = `
            <div class="tip-card-header">
                <span class="tip-card-icon">💡</span>
                <span class="tip-card-label">Did You Know?</span>
                <button class="tip-card-close" onclick="this.closest('.tip-card').remove()">×</button>
            </div>
            <div class="tip-card-text">${tip}</div>
        `;

        document.body.appendChild(card);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (card.parentNode) {
                if (window.gsap) {
                    gsap.to(card, { x: 100, opacity: 0, duration: 0.3, onComplete: () => card.remove() });
                } else {
                    card.remove();
                }
            }
        }, 10000);
    }

    /**
     * Create an info button that opens education popup
     * @param {string} termKey - Key from FINANCIAL_EDUCATION.terms
     * @returns {string} - HTML string for the info button
     */
    createInfoButton(termKey) {
        return `<button class="edu-info-btn" onclick="window.game.showEducationPopup('${termKey}')" title="Learn more">ℹ</button>`;
    }

    /**
     * Show a dynamic scenario alert
     * @param {Object} scenario - Scenario from DYNAMIC_SCENARIOS
     */
    showScenarioAlert(scenario) {
        if (!scenario) return;

        const formatted = window.DYNAMIC_SCENARIOS?.formatScenarioAlert(scenario);
        if (!formatted) return;

        // Remove existing alerts
        document.querySelectorAll('.scenario-alert').forEach(el => el.remove());

        const alert = document.createElement('div');
        alert.className = 'scenario-alert';
        alert.innerHTML = `
            <div class="scenario-alert-header">
                <span class="scenario-alert-icon">${formatted.icon}</span>
                <span class="scenario-alert-title">⚠️ ${formatted.title}</span>
            </div>
            <div class="scenario-alert-body">
                <div class="scenario-alert-message">${formatted.message}</div>
                <div class="scenario-options">
                    ${formatted.options.map((opt, i) => `
                        <button class="scenario-option" data-option="${opt.id}" data-index="${i}">
                            ${opt.text}
                        </button>
                    `).join('')}
                </div>
                <div class="scenario-lesson" id="scenario-lesson"></div>
            </div>
        `;

        document.body.appendChild(alert);

        // Handle option selection
        alert.querySelectorAll('.scenario-option').forEach(btn => {
            btn.onclick = () => {
                const optionId = btn.dataset.option;
                const index = parseInt(btn.dataset.index);
                const option = formatted.options[index];

                // Show the lesson
                const lessonEl = document.getElementById('scenario-lesson');
                if (lessonEl && option.lesson) {
                    lessonEl.style.display = 'block';
                    lessonEl.innerHTML = `<strong>📚 Lesson:</strong> ${option.lesson}`;
                }

                // Highlight selected
                alert.querySelectorAll('.scenario-option').forEach(b => b.style.opacity = '0.5');
                btn.style.opacity = '1';
                btn.style.border = '2px solid #fbbf24';

                // Apply scenario effect (to be implemented based on game logic)
                this.applyScenarioChoice(scenario.id, optionId, option.effect);

                // Auto-close after showing lesson
                setTimeout(() => {
                    if (window.gsap) {
                        gsap.to(alert, { y: -50, opacity: 0, duration: 0.3, onComplete: () => alert.remove() });
                    } else {
                        alert.remove();
                    }
                }, 5000);
            };
        });
    }

    /**
     * Apply the effects of a scenario choice
     */
    applyScenarioChoice(scenarioId, choiceId, effect) {
        // Log the decision for learning analytics
        console.log(`Scenario: ${scenarioId}, Choice: ${choiceId}, Effect: ${effect}`);

        // Show a follow-up insight
        setTimeout(() => {
            this.showRandomTip();
        }, 6000);
    }

    /**
     * Check for scenario triggers (call this at day start or phase transitions)
     */
    checkForScenarios() {
        if (!window.DYNAMIC_SCENARIOS) return;

        const gameState = {
            day: this.engine?.day || 1,
            staff: this.engine?.staff || [],
            month: new Date().getMonth() + 1,
            season: this.getSeason()
        };

        const triggered = DYNAMIC_SCENARIOS.checkScenarioTriggers(gameState);
        if (triggered) {
            // Delay slightly so player sees the scenario after phase loads
            setTimeout(() => this.showScenarioAlert(triggered), 1500);
        }
    }

    getSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'fall';
        return 'winter';
    }

    /**
     * Start the walkthrough mode
     */
    startWalkthrough() {
        if (!window.WalkthroughMode) {
            this.showPopup({
                icon: '❌',
                title: 'Walkthrough Unavailable',
                message: 'Walkthrough mode is still loading.',
                type: 'error',
                autoClose: 2000
            });
            return;
        }

        this.walkthrough = new WalkthroughMode(this);
        this.walkthrough.start();
    }

    /**
     * Show notification (simple toast)
     */
    showNotification(message, type = 'info') {
        const colors = {
            info: '#3b82f6',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        if (window.gsap) {
            gsap.from(toast, { y: 20, opacity: 0, duration: 0.3 });
            gsap.to(toast, { y: -20, opacity: 0, duration: 0.3, delay: 3, onComplete: () => toast.remove() });
        } else {
            setTimeout(() => toast.remove(), 3500);
        }
    }
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
