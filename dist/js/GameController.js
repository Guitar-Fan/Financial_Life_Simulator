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

        this.activeScenarioEffects = [];
        this.lastScenarioRollDay = null;
        this.dayComplexityProfile = null;
        this.lastCrisisRollAt = 0;
        this.setupOperationalProfile = null;
        this._setupBriefShown = false;
        this.customerFlowSignals = {
            rollingSatisfaction: 76,
            throughputMultiplier: 1,
            recentCheckouts: 0,
            recentWalkouts: 0
        };
        this.lastCustomerFlowTick = 0;

        // Initialize new systems
        this.timeManager = null;
        this.notificationSystem = null;
        this.staffManager = null;

        this.init();
    }

    init() {
        this.engine = new FinancialEngine();
        this.economy = new EconomicSimulation();

        // Connect the economy to the engine
        this.engine.economy = this.economy;
        
        // Initialize customer database
        if (window.CustomerDatabase) {
            this.customerDB = new CustomerDatabase(this.engine);
            this.engine.customerDB = this.customerDB;
        }

        // Initialize time manager
        if (window.TimeManager) {
            this.timeManager = new TimeManager(this);
        }

        // Initialize notification system
        if (window.NotificationSystem) {
            this.notificationSystem = new NotificationSystem(this);
        }

        // Initialize staff manager
        if (window.StaffManager) {
            this.staffManager = new StaffManager(this);
            
            // Sync staff manager with engine staff
            this.syncStaffManager();
        }

        this.dashboard = new FinancialDashboard(this); // Pass gameController, not economy
        this.tutorial = new TutorialSystem(this);
        this.setupEventListeners();
        this.initializeStrategyLayer();
        this.updateAutomationAvailability();
        this.renderAutomationFeed();
        this.setupWindowResizeHandler();
        this.showMainMenu();
    }
    
    setupWindowResizeHandler() {
        // Handle window resize and fullscreen events
        window.addEventListener('resize', () => {
            if (this.phaserGame && this.phaserGame.scale) {
                const inBakery = document.body.classList.contains('in-bakery-env');
                const h = inBakery ? window.innerHeight : window.innerHeight - 60;
                this.phaserGame.scale.resize(window.innerWidth, h);
            }
        });
        
        // Handle fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            if (this.phaserGame && this.phaserGame.scale) {
                const height = document.fullscreenElement ? window.innerHeight : window.innerHeight - 60;
                this.phaserGame.scale.resize(window.innerWidth, height);
            }
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            if (this.phaserGame && this.phaserGame.scale) {
                const height = document.webkitFullscreenElement ? window.innerHeight : window.innerHeight - 60;
                this.phaserGame.scale.resize(window.innerWidth, height);
            }
        });
    }

    setupEventListeners() {
        // Engine events
        this.engine.on('baking_started', (item) => {
            window.dispatchEvent(new CustomEvent('engine:baking_started', { detail: { item } }));
            this.updateStats();
        });

        this.engine.on('baking_complete', (item) => {
            // Use NotificationSystem for subtle notifications
            if (this.notificationSystem) {
                this.notificationSystem.bakingComplete(item.recipeName, item.quantity);
            }
            this.renderReadyProducts();
            this.renderProductionQueue();
            this.renderDisplayProducts();
            this.maintainProductionTargets();
            this.updateStats();
        });

        this.engine.on('hour_change', (data) => {
            // Only notify on important hours using NotificationSystem
            if (this.notificationSystem && data.hour >= 17) {
                this.notificationSystem.warning('Shop closing soon!', {
                    icon: '🌅',
                    title: `Time: ${this.engine.getTimeString()}`,
                    duration: 3000
                });
            }
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
            this.refreshStaffManager();
            this.updateAutomationAvailability();
        });

        this.engine.on('staff_fired', (info) => {
            if (info?.staff?.name) {
                this.logAutomationEvent('staff', `${info.staff.name} left the bakery`, { staff: info.staff.name, severity: 'warning' });
            }
            this.refreshStaffManager();
            this.updateAutomationAvailability();
        });

        this.engine.on('staff_trained', (staff) => {
            this.logAutomationEvent('staff', `${staff.name} completed training`, { staff: staff.name });
            this.renderAutomationFeed();
        });
        
        // Customer incident events
        this.engine.on('customer_incident', (data) => {
            this.handleCustomerIncident(data);
        });
    }
    
    handleCustomerIncident(data) {
        const { customer, incident, effects } = data;
        
        let icon = '⚠️';
        let type = 'warning';
        
        if (effects.satisfaction > 0) {
            icon = '🌟';
            type = 'success';
        } else if (effects.satisfaction < -20) {
            icon = '🚨';
            type = 'danger';
        }
        
        let message = `${customer.name}: ${incident.name}`;
        
        // Add effect descriptions
        const effectList = [];
        if (effects.satisfaction) {
            effectList.push(`Satisfaction ${effects.satisfaction > 0 ? '+' : ''}${effects.satisfaction}`);
        }
        if (effects.newCustomers) {
            effectList.push(`+${effects.newCustomers} new customers!`);
        }
        if (effects.opportunityRevenue) {
            effectList.push(`Custom order worth $${effects.opportunityRevenue.toFixed(2)}`);
        }
        
        if (effectList.length > 0) {
            message += '\n' + effectList.join(', ');
        }
        
        this.showPopup({
            icon: icon,
            title: incident.name,
            message: message,
            type: type,
            autoClose: effects.opportunityRevenue ? false : 3000,
            buttons: effects.opportunityRevenue ? [
                { 
                    text: 'Accept Order', 
                    action: () => {
                        this.engine.cash += effects.opportunityRevenue;
                        customer.customOrders.push({
                            date: this.engine.day,
                            amount: effects.opportunityRevenue
                        });
                        this.showNotification(`Accepted custom order for $${effects.opportunityRevenue.toFixed(2)}`, 'success');
                    }
                },
                { text: 'Decline', action: () => {}, style: 'secondary' }
            ] : undefined
        });
    }

    hasOperationalStaff() {
        return Array.isArray(this.engine?.staff) && this.engine.staff.length > 0;
    }

    /**
     * Sync the StaffManager with engine staff
     */
    syncStaffManager() {
        if (!this.staffManager) return;

        // Add owner as first staff member (can serve customers and bake)
        this.staffManager.addStaff({
            id: 'owner',
            name: 'You (Owner)',
            role: 'owner',
            isPlayer: true,
            skill: 80,
            speed: 70,
            chattiness: 50,
            adaptability: 1.25,
            checkoutAptitude: 1.25,
            prepAptitude: 1.15,
            procurementAptitude: 1.15,
            perk: { label: 'Founder Drive' }
        });

        // Add any existing engine staff
        if (this.engine && Array.isArray(this.engine.staff)) {
            this.engine.staff.forEach(staff => {
                this.staffManager.addStaff({
                    ...staff,
                    id: staff.id || `staff_${Date.now()}`,
                    role: staff.role || 'server', // Default to server role
                    skill: staff.skill || 50,
                    speed: staff.speed || 50,
                    chattiness: staff.chattiness || 50,
                    adaptability: staff.adaptability || 1,
                    checkoutAptitude: staff.checkoutAptitude || 1,
                    prepAptitude: staff.prepAptitude || 1,
                    procurementAptitude: staff.procurementAptitude || 1,
                    perk: staff.perk || null
                });
            });
        }
    }

    /**
     * Refresh staff in manager when new staff is hired
     */
    refreshStaffManager() {
        if (!this.staffManager) return;

        // Clear non-owner staff and re-add from engine
        this.staffManager.staff = this.staffManager.staff.filter(s => s.id === 'owner');

        if (this.engine && Array.isArray(this.engine.staff)) {
            this.engine.staff.forEach(staff => {
                // Check if already in manager
                if (!this.staffManager.getStaff(staff.id)) {
                    this.staffManager.addStaff({
                        ...staff,
                        id: staff.id || `staff_${Date.now()}`,
                        role: staff.role || 'server', // Default to server role
                        skill: staff.skill || 50,
                        speed: staff.speed || 50,
                        chattiness: staff.chattiness || 50,
                        adaptability: staff.adaptability || 1,
                        checkoutAptitude: staff.checkoutAptitude || 1,
                        prepAptitude: staff.prepAptitude || 1,
                        procurementAptitude: staff.procurementAptitude || 1,
                        perk: staff.perk || null
                    });
                }
            });
        }
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
                this.renderOverlayInventory();
                message = 'Procurement plan executed. Inventory updated.';
                break;
            case 'baking':
                this.maintainProductionTargets();
                this.renderProductionQueue();
                this.renderReadyProducts();
                this.renderRecipes();
                this.renderOverlayProductionQueue();
                this.renderOverlayReadyProducts();
                this.renderOverlayRecipes();
                const bakingList = document.getElementById('employee-list');
                if (bakingList) bakingList.innerHTML = this.renderEmployeePanel();
                const overlayBakingList = document.getElementById('overlay-employee-list-baking');
                if (overlayBakingList) overlayBakingList.innerHTML = this.renderEmployeePanel();
                message = 'Production queue synced with automation targets.';
                break;
            case 'selling':
                this.resumeWaitingCustomers();
                this.renderCustomerArea();
                const sellList = document.getElementById('employee-list-selling');
                if (sellList) sellList.innerHTML = this.renderEmployeeSelling();
                const overlaySellList = document.getElementById('overlay-employee-list-selling');
                if (overlaySellList) overlaySellList.innerHTML = this.renderEmployeeSelling();
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

    startNewRecipeDraft() {
        this.renderRecipeCreationSpread();
        this.setupRecipeBookEvents();

        const nameInput = document.getElementById('recipe-name');
        if (nameInput) {
            nameInput.focus();
            nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    renderCustomRecipeLibrary() {
        const library = document.getElementById('custom-recipe-library');
        if (!library) return;

        const recipeCards = this.customRecipes.map(entry => {
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

        const addTile = `
            <button type="button" class="custom-recipe-card custom-recipe-card-add" id="btn-new-recipe-tile" aria-label="Create a new recipe">
                <div class="custom-recipe-icon">➕</div>
                <div>
                    <div class="custom-recipe-name">Create New Recipe</div>
                    <div class="custom-recipe-type">Open Recipe Builder</div>
                </div>
            </button>
        `;

        if (this.customRecipes.length === 0) {
            library.innerHTML = `<div class="custom-recipe-empty">No custom recipes yet. Your creations will appear here.</div>${addTile}`;
        } else {
            library.innerHTML = `${recipeCards}${addTile}`;
        }

        const addButton = document.getElementById('btn-new-recipe-tile');
        if (addButton) {
            addButton.onclick = () => this.startNewRecipeDraft();
        }
    }

    enforceInventoryPlan() {
        if (!this.strategySettings || !this.engine?.ensureIngredientInventory || !this.automationEnabled) return;

        const procurementStaff = this.staffManager
            ? this.staffManager.getAvailableStaff().sort((a, b) => {
                const aScore = (a.procurementAptitude || 1) * (a.adaptability || 1) * (1 - (a.fatigue || 0) / 200);
                const bScore = (b.procurementAptitude || 1) * (b.adaptability || 1) * (1 - (b.fatigue || 0) / 200);
                return bScore - aScore;
            })[0]
            : null;
        if (procurementStaff) {
            this.emitStaffRoute(procurementStaff, 'computer', { context: 'procurement', holdMs: 2200 });
        }

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

    skipDayDueToCash() {
        // Consequence: Skip day, lose potential revenue, still have fixed costs
        this.notificationSystem.warning('⏭️ Day skipped due to insufficient cash');
        const summary = this.engine.processEndOfDay();
        this.showDaySummary(summary);
    }

    updateMarkup(value) {
        const markup = parseInt(value) || 100;
        this.engine.markupPercentage = markup;
        
        // Update both slider and input (old phase elements)
        const slider = document.getElementById('markup-slider');
        const input = document.getElementById('markup-input');
        if (slider) slider.value = markup;
        if (input) input.value = markup;

        // Update overlay elements
        const oSlider = document.getElementById('overlay-markup-slider');
        const oInput = document.getElementById('overlay-markup-input');
        if (oSlider) oSlider.value = markup;
        if (oInput) oInput.value = markup;

        // Update baking overlay elements
        const bSlider = document.getElementById('overlay-bake-markup-slider');
        const bInput = document.getElementById('overlay-bake-markup-input');
        const bFactor = document.getElementById('overlay-bake-markup-factor');
        if (bSlider) bSlider.value = markup;
        if (bInput) bInput.value = markup;
        if (bFactor) bFactor.textContent = (1 + markup / 100).toFixed(2);
        
        // Refresh display products to show new prices
        this.renderDisplayProducts();
        this.renderOverlayDisplayProducts();
        this.renderOverlayRecipes();
        this.renderRecipes();

        const overlayPanel = document.getElementById('overlay-panel');
        const overlayTitle = document.getElementById('overlay-panel-title');
        if (overlayPanel?.classList.contains('open') && overlayTitle?.textContent?.includes('Recipe Book')) {
            this.showRecipesPanel();
        }
    }

    // ==================== MAIN MENU ====================
    showMainMenu() {
        console.log('Displaying Main Menu');
        this.cleanupPhaser();
        this.stopBakingLoop();
        this.stopSellingLoop();
        this.closeOverlayPanel();
        this.currentPhase = 'menu';

        // Remove bakery environment mode
        document.body.classList.remove('in-bakery-env');
        const hud = document.getElementById('bakery-hud');
        if (hud) hud.style.display = 'none';
        if (this._hudInterval) { clearInterval(this._hudInterval); this._hudInterval = null; }

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
        this.showStartupCitySetup();
    }

    showSetupModeChoice() {
        this.showStartupCitySetup();
    }

    showStoryBookSetup() {
        // Storybook mode deprecated: startup now begins directly with location selection.
        this.showStartupCitySetup();
    }

    showStartupCitySetup() {
        const container = document.getElementById('game-container');
        if (!container) return;

        this.cleanupPhaser();
        container.classList.add('full-screen');
        container.style.padding = '';

        this.setupChoices = {
            location: null,
            financing: null,
            equipment: { oven: null, mixer: null, display: null },
            staff: null,
            paperwork: [],
            insurance: null,
            utilities: { power: null, internet: null },
            procedures: {
                entityType: 'llc',
                banking: 'community_bank',
                bookkeeping: 'software_basic',
                payroll: 'payroll_software',
                leaseTerm: 'standard_term',
                inspectionPrep: 'standard',
                openingInventoryBudget: 1800,
                launchMarketingBudget: 900,
                emergencyReserveTarget: 3000
            }
        };

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:linear-gradient(135deg,#0b1220,#1d2a3f 60%,#0b1220); color:#e8f4ff;">
                <div style="padding:16px 20px; border-bottom:1px solid rgba(159,228,255,0.2); display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <div>
                        <h2 style="margin:0; font-family:'Fredoka',cursive; font-size:28px; color:#9fe4ff;">🗺️ Bakery Site Selection</h2>
                        <p style="margin:4px 0 0 0; font-size:13px; color:#b8c9d8;">Pick an open lot, compare rent/property tax/ingredient pressure, then lock the location.</p>
                    </div>
                    <button id="btn-setup-back" class="btn btn-link" style="padding:8px 12px;">← Back</button>
                </div>
                <div style="flex:1; min-height:0;">
                    <iframe id="setup-map-frame" src="Map.html?mode=setup" style="width:100%; height:100%; border:none;"></iframe>
                </div>
            </div>
        `;

        const backBtn = document.getElementById('btn-setup-back');
        if (backBtn) {
            backBtn.onclick = () => this.showMainMenu();
        }

        if (this._mapSetupMessageHandler) {
            window.removeEventListener('message', this._mapSetupMessageHandler);
        }

        this._mapSetupMessageHandler = (event) => this.handleMapSetupMessage(event);
        window.addEventListener('message', this._mapSetupMessageHandler);
    }

    handleMapSetupMessage(event) {
        const msg = event?.data;
        if (!msg || msg.type !== 'bakery_setup_location_selected' || !msg.payload) return;

        this.applyMapSetupSelection(msg.payload);

        if (this._mapSetupMessageHandler) {
            window.removeEventListener('message', this._mapSetupMessageHandler);
            this._mapSetupMessageHandler = null;
        }

        this.showPopup({
            icon: '✅',
            title: 'Location Locked',
            message: `${msg.payload.name} selected. Complete your business setup decisions to open.`,
            type: 'success',
            autoClose: 1800
        });

        this.showSetupProcedureFlow();
    }

    applyMapSetupSelection(payload) {
        const options = GAME_CONFIG.SETUP_OPTIONS;
        const getById = (arr, ids = []) => arr.find(item => ids.includes(item.id)) || arr[0];

        const requiredPaperwork = options.paperwork.filter(p => p.required).map(p => p.id);
        const standardInsurance = getById(options.insurance, ['standard_package', 'basic_liability']);

        this.setupChoices = {
            location: {
                id: payload.locationId,
                name: payload.name,
                icon: '📍',
                description: `${payload.district} candidate selected from city map`,
                rent: payload.rentDaily,
                traffic: payload.trafficMultiplier,
                zoningFees: payload.permitFees,
                propertyTaxMonthly: payload.monthlyPropertyTax,
                ingredientCostMultiplier: payload.ingredientCostMultiplier,
                exteriorStyle: payload.exteriorStyle,
                parkingSpaces: payload.parkingSpaces
            },
            financing: getById(options.financing, ['personal_savings', 'family_loan']),
            equipment: {
                oven: getById(options.equipment.ovens, ['basic_convection']),
                mixer: getById(options.equipment.mixers, ['countertop_mixer']),
                display: getById(options.equipment.displays, ['basic_case'])
            },
            staff: getById(options.staff, ['solo']),
            paperwork: requiredPaperwork,
            insurance: standardInsurance,
            utilities: {
                power: getById(options.utilities, ['commercial_power', 'basic_power']),
                internet: getById(options.utilities, ['business_internet', 'basic_internet'])
            },
            procedures: {
                entityType: 'llc',
                banking: 'community_bank',
                bookkeeping: 'software_basic',
                payroll: 'payroll_software',
                leaseTerm: 'standard_term',
                inspectionPrep: 'standard',
                openingInventoryBudget: 1800,
                launchMarketingBudget: 900,
                emergencyReserveTarget: 3000
            }
        };

        const upfrontRegulatory = Math.max(0, Number(payload.permitFees) || 0);
        if (upfrontRegulatory > 0) {
            this.engine.cash = Math.max(0, this.engine.cash - upfrontRegulatory);
        }
    }

    showSetupProcedureFlow() {
        const container = document.getElementById('game-container');
        if (!container) return;

        const options = GAME_CONFIG.SETUP_OPTIONS;
        const procedureOptions = GAME_CONFIG.SETUP_PROCEDURES;
        const c = this.setupChoices;

        const financingOptions = options.financing.map(f =>
            `<option value="${f.id}" ${c.financing?.id === f.id ? 'selected' : ''}>${f.name} (${f.interestRate ? `${(f.interestRate * 100).toFixed(1)}% APR` : 'No debt'})</option>`
        ).join('');

        const staffOptions = options.staff.map(s =>
            `<option value="${s.id}" ${c.staff?.id === s.id ? 'selected' : ''}>${s.name} ($${s.monthlyCost}/mo)</option>`
        ).join('');

        const insuranceOptions = options.insurance.map(i =>
            `<option value="${i.id}" ${c.insurance?.id === i.id ? 'selected' : ''}>${i.name} ($${i.monthlyCost}/mo)</option>`
        ).join('');

        const powerOptions = options.utilities.filter(u => u.id.includes('power')).map(u =>
            `<option value="${u.id}" ${c.utilities?.power?.id === u.id ? 'selected' : ''}>${u.name} ($${u.monthlyCost}/mo)</option>`
        ).join('');

        const internetOptions = options.utilities.filter(u => u.id.includes('internet')).map(u =>
            `<option value="${u.id}" ${c.utilities?.internet?.id === u.id ? 'selected' : ''}>${u.name} ($${u.monthlyCost}/mo)</option>`
        ).join('');

        const entityOptions = procedureOptions.entityTypes.map(e =>
            `<option value="${e.id}" ${c.procedures?.entityType === e.id ? 'selected' : ''}>${e.name} ($${e.filingFee} filing)</option>`
        ).join('');

        const bankingOptions = procedureOptions.banking.map(b =>
            `<option value="${b.id}" ${c.procedures?.banking === b.id ? 'selected' : ''}>${b.name} ($${b.monthlyFee}/mo)</option>`
        ).join('');

        const bookkeepingOptions = procedureOptions.bookkeeping.map(b =>
            `<option value="${b.id}" ${c.procedures?.bookkeeping === b.id ? 'selected' : ''}>${b.name} ($${b.monthlyCost}/mo)</option>`
        ).join('');

        const payrollOptions = procedureOptions.payroll.map(p =>
            `<option value="${p.id}" ${c.procedures?.payroll === p.id ? 'selected' : ''}>${p.name} ($${p.monthlyCost}/mo)</option>`
        ).join('');

        const leaseOptions = procedureOptions.leaseTerms.map(l =>
            `<option value="${l.id}" ${c.procedures?.leaseTerm === l.id ? 'selected' : ''}>${l.name} (${l.securityDepositMonths} mo deposit)</option>`
        ).join('');

        const inspectionOptions = procedureOptions.inspectionPrep.map(i =>
            `<option value="${i.id}" ${c.procedures?.inspectionPrep === i.id ? 'selected' : ''}>${i.name} ($${i.upfrontCost})</option>`
        ).join('');

        const permitRows = options.paperwork.map(p => {
            const checked = c.paperwork.includes(p.id) || p.required;
            return `
                <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; opacity:${p.required ? '0.95' : '1'};">
                    <input type="checkbox" class="setup-permit" data-id="${p.id}" ${checked ? 'checked' : ''} ${p.required ? 'disabled' : ''}>
                    <span>${p.name} ${p.required ? '(Required)' : ''} - $${p.cost}</span>
                </label>
            `;
        }).join('');

        container.innerHTML = `
            <div style="height:100%; overflow:auto; padding:20px 22px; background:linear-gradient(140deg,#101826,#1f2b41 60%,#101826); color:#e7f1fb;">
                <h2 style="margin:0 0 8px 0; font-family:'Fredoka',cursive; color:#9fe4ff;">Startup Procedures</h2>
                <p style="margin:0 0 16px 0; font-size:13px; color:#b8c8d8;">Now complete realistic operating decisions before opening day.</p>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                    <div style="background:rgba(6,16,28,0.65); border:1px solid rgba(159,228,255,0.18); border-radius:12px; padding:14px;">
                        <h3 style="margin:0 0 8px 0; font-size:16px; color:#ffd2b8;">Selected Location</h3>
                        <div style="font-size:13px; line-height:1.5;">
                            <div>${c.location?.name || 'N/A'}</div>
                            <div>Rent/day: $${c.location?.rent || 0}</div>
                            <div>Property tax/mo: $${c.location?.propertyTaxMonthly || 0}</div>
                            <div>Traffic multiplier: x${(c.location?.traffic || 1).toFixed(2)}</div>
                            <div>Ingredient pressure: x${(c.location?.ingredientCostMultiplier || 1).toFixed(2)}</div>
                        </div>
                    </div>

                    <div style="background:rgba(6,16,28,0.65); border:1px solid rgba(159,228,255,0.18); border-radius:12px; padding:14px;">
                        <h3 style="margin:0 0 8px 0; font-size:16px; color:#ffd2b8;">Capital Plan</h3>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Financing</label>
                        <select id="setup-financing" style="width:100%; margin-bottom:10px;">${financingOptions}</select>

                        <label style="display:block; font-size:12px; margin-bottom:4px;">Staffing</label>
                        <select id="setup-staff" style="width:100%; margin-bottom:10px;">${staffOptions}</select>

                        <label style="display:block; font-size:12px; margin-bottom:4px;">Insurance</label>
                        <select id="setup-insurance" style="width:100%;">${insuranceOptions}</select>
                    </div>

                    <div style="background:rgba(6,16,28,0.65); border:1px solid rgba(159,228,255,0.18); border-radius:12px; padding:14px;">
                        <h3 style="margin:0 0 8px 0; font-size:16px; color:#ffd2b8;">Equipment Decisions</h3>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Oven</label>
                        <select id="setup-oven" style="width:100%; margin-bottom:10px;">${options.equipment.ovens.map(o => `<option value="${o.id}" ${c.equipment?.oven?.id === o.id ? 'selected' : ''}>${o.name} ($${o.cost})</option>`).join('')}</select>

                        <label style="display:block; font-size:12px; margin-bottom:4px;">Mixer</label>
                        <select id="setup-mixer" style="width:100%; margin-bottom:10px;">${options.equipment.mixers.map(m => `<option value="${m.id}" ${c.equipment?.mixer?.id === m.id ? 'selected' : ''}>${m.name} ($${m.cost})</option>`).join('')}</select>

                        <label style="display:block; font-size:12px; margin-bottom:4px;">Display</label>
                        <select id="setup-display" style="width:100%;">${options.equipment.displays.map(d => `<option value="${d.id}" ${c.equipment?.display?.id === d.id ? 'selected' : ''}>${d.name} ($${d.cost})</option>`).join('')}</select>
                    </div>

                    <div style="background:rgba(6,16,28,0.65); border:1px solid rgba(159,228,255,0.18); border-radius:12px; padding:14px;">
                        <h3 style="margin:0 0 8px 0; font-size:16px; color:#ffd2b8;">Licensing & Utilities</h3>
                        <div style="margin-bottom:10px; font-size:12px; color:#c9d8e5;">Permits and licenses</div>
                        <div style="font-size:12px; margin-bottom:10px;">${permitRows}</div>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Power Service</label>
                        <select id="setup-power" style="width:100%; margin-bottom:10px;">${powerOptions}</select>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Internet Service</label>
                        <select id="setup-internet" style="width:100%;">${internetOptions}</select>
                    </div>

                    <div style="background:rgba(6,16,28,0.65); border:1px solid rgba(159,228,255,0.18); border-radius:12px; padding:14px;">
                        <h3 style="margin:0 0 8px 0; font-size:16px; color:#ffd2b8;">Legal & Finance Ops</h3>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Business Entity</label>
                        <select id="setup-entity" style="width:100%; margin-bottom:10px;">${entityOptions}</select>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Business Banking</label>
                        <select id="setup-banking" style="width:100%; margin-bottom:10px;">${bankingOptions}</select>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Bookkeeping</label>
                        <select id="setup-bookkeeping" style="width:100%; margin-bottom:10px;">${bookkeepingOptions}</select>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Payroll Compliance</label>
                        <select id="setup-payroll" style="width:100%;">${payrollOptions}</select>
                    </div>

                    <div style="background:rgba(6,16,28,0.65); border:1px solid rgba(159,228,255,0.18); border-radius:12px; padding:14px;">
                        <h3 style="margin:0 0 8px 0; font-size:16px; color:#ffd2b8;">Lease & Opening Budget</h3>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Lease Term</label>
                        <select id="setup-lease" style="width:100%; margin-bottom:10px;">${leaseOptions}</select>
                        <label style="display:block; font-size:12px; margin-bottom:4px;">Inspection Readiness</label>
                        <select id="setup-inspection" style="width:100%; margin-bottom:10px;">${inspectionOptions}</select>

                        <label style="display:block; font-size:12px; margin-bottom:4px;">Opening Inventory Budget</label>
                        <input id="setup-inventory-budget" type="number" min="500" step="100" value="${c.procedures?.openingInventoryBudget || 1800}" style="width:100%; margin-bottom:10px;">

                        <label style="display:block; font-size:12px; margin-bottom:4px;">Launch Marketing Budget</label>
                        <input id="setup-marketing-budget" type="number" min="0" step="100" value="${c.procedures?.launchMarketingBudget || 900}" style="width:100%; margin-bottom:10px;">

                        <label style="display:block; font-size:12px; margin-bottom:4px;">Emergency Reserve Target</label>
                        <input id="setup-reserve-target" type="number" min="0" step="100" value="${c.procedures?.emergencyReserveTarget || 3000}" style="width:100%;">
                    </div>
                </div>

                <div style="margin-top:14px; background:rgba(7, 18, 31, 0.78); border:1px solid rgba(255, 214, 170, 0.22); border-radius:12px; padding:14px;">
                    <div style="font-size:12px; color:#cfdceb;">Startup Summary</div>
                    <div id="setup-summary-rollup" style="margin-top:6px; font-size:14px; color:#f2f8ff;"></div>
                    <div style="margin-top:12px; display:flex; gap:10px; justify-content:flex-end;">
                        <button id="btn-back-location" class="btn btn-secondary">Back To Map</button>
                        <button id="btn-complete-startup" class="btn btn-primary">Open Bakery</button>
                    </div>
                </div>
            </div>
        `;

        this.bindSetupProcedureEvents();
        this.refreshSetupSummary();
    }

    bindSetupProcedureEvents() {
        const options = GAME_CONFIG.SETUP_OPTIONS;
        const procedureOptions = GAME_CONFIG.SETUP_PROCEDURES;
        const pick = (list, id) => list.find(item => item.id === id);

        const onChange = () => this.refreshSetupSummary();

        const financing = document.getElementById('setup-financing');
        const staff = document.getElementById('setup-staff');
        const insurance = document.getElementById('setup-insurance');
        const oven = document.getElementById('setup-oven');
        const mixer = document.getElementById('setup-mixer');
        const display = document.getElementById('setup-display');
        const power = document.getElementById('setup-power');
        const internet = document.getElementById('setup-internet');
        const entity = document.getElementById('setup-entity');
        const banking = document.getElementById('setup-banking');
        const bookkeeping = document.getElementById('setup-bookkeeping');
        const payroll = document.getElementById('setup-payroll');
        const lease = document.getElementById('setup-lease');
        const inspection = document.getElementById('setup-inspection');
        const inventoryBudget = document.getElementById('setup-inventory-budget');
        const marketingBudget = document.getElementById('setup-marketing-budget');
        const reserveTarget = document.getElementById('setup-reserve-target');

        if (financing) financing.onchange = () => { this.setupChoices.financing = pick(options.financing, financing.value); onChange(); };
        if (staff) staff.onchange = () => { this.setupChoices.staff = pick(options.staff, staff.value); onChange(); };
        if (insurance) insurance.onchange = () => { this.setupChoices.insurance = pick(options.insurance, insurance.value); onChange(); };
        if (oven) oven.onchange = () => { this.setupChoices.equipment.oven = pick(options.equipment.ovens, oven.value); onChange(); };
        if (mixer) mixer.onchange = () => { this.setupChoices.equipment.mixer = pick(options.equipment.mixers, mixer.value); onChange(); };
        if (display) display.onchange = () => { this.setupChoices.equipment.display = pick(options.equipment.displays, display.value); onChange(); };
        if (power) power.onchange = () => { this.setupChoices.utilities.power = pick(options.utilities, power.value); onChange(); };
        if (internet) internet.onchange = () => { this.setupChoices.utilities.internet = pick(options.utilities, internet.value); onChange(); };
        if (entity) entity.onchange = () => { this.setupChoices.procedures.entityType = entity.value; onChange(); };
        if (banking) banking.onchange = () => { this.setupChoices.procedures.banking = banking.value; onChange(); };
        if (bookkeeping) bookkeeping.onchange = () => { this.setupChoices.procedures.bookkeeping = bookkeeping.value; onChange(); };
        if (payroll) payroll.onchange = () => { this.setupChoices.procedures.payroll = payroll.value; onChange(); };
        if (lease) lease.onchange = () => {
            this.setupChoices.procedures.leaseTerm = lease.value;
            onChange();
        };
        if (inspection) inspection.onchange = () => { this.setupChoices.procedures.inspectionPrep = inspection.value; onChange(); };
        if (inventoryBudget) inventoryBudget.oninput = () => {
            this.setupChoices.procedures.openingInventoryBudget = Math.max(0, Number(inventoryBudget.value) || 0);
            onChange();
        };
        if (marketingBudget) marketingBudget.oninput = () => {
            this.setupChoices.procedures.launchMarketingBudget = Math.max(0, Number(marketingBudget.value) || 0);
            onChange();
        };
        if (reserveTarget) reserveTarget.oninput = () => {
            this.setupChoices.procedures.emergencyReserveTarget = Math.max(0, Number(reserveTarget.value) || 0);
            onChange();
        };

        document.querySelectorAll('.setup-permit').forEach(cb => {
            cb.addEventListener('change', () => {
                const id = cb.dataset.id;
                if (!id) return;
                if (cb.checked && !this.setupChoices.paperwork.includes(id)) this.setupChoices.paperwork.push(id);
                if (!cb.checked) this.setupChoices.paperwork = this.setupChoices.paperwork.filter(p => p !== id);
                onChange();
            });
        });

        const back = document.getElementById('btn-back-location');
        if (back) back.onclick = () => this.showStartupCitySetup();

        const complete = document.getElementById('btn-complete-startup');
        if (complete) complete.onclick = () => this.finishSetup();
    }

    refreshSetupSummary() {
        const summary = document.getElementById('setup-summary-rollup');
        if (!summary) return;

        const procedures = this.setupChoices.procedures || {};
        const procedureOptions = GAME_CONFIG.SETUP_PROCEDURES || {};

        const entity = (procedureOptions.entityTypes || []).find(e => e.id === procedures.entityType);
        const bank = (procedureOptions.banking || []).find(e => e.id === procedures.banking);
        const books = (procedureOptions.bookkeeping || []).find(e => e.id === procedures.bookkeeping);
        const payroll = (procedureOptions.payroll || []).find(e => e.id === procedures.payroll);
        const lease = (procedureOptions.leaseTerms || []).find(e => e.id === procedures.leaseTerm);
        const inspection = (procedureOptions.inspectionPrep || []).find(e => e.id === procedures.inspectionPrep);

        const equipmentCost = (this.setupChoices.equipment?.oven?.cost || 0)
            + (this.setupChoices.equipment?.mixer?.cost || 0)
            + (this.setupChoices.equipment?.display?.cost || 0);

        const permitsCost = (GAME_CONFIG.SETUP_OPTIONS.paperwork || [])
            .filter(p => this.setupChoices.paperwork.includes(p.id))
            .reduce((sum, p) => sum + (p.cost || 0), 0);

        const monthlyOverhead = (this.setupChoices.staff?.monthlyCost || 0)
            + (this.setupChoices.staff?.benefits || 0)
            + (this.setupChoices.insurance?.monthlyCost || 0)
            + (this.setupChoices.utilities?.power?.monthlyCost || 0)
            + (this.setupChoices.utilities?.internet?.monthlyCost || 0)
            + (this.setupChoices.location?.propertyTaxMonthly || 0)
            + ((this.setupChoices.financing?.monthlyPayment) || 0);

        const financingCash = this.setupChoices.financing?.amount || 0;
        const oneTimeOps = (entity?.filingFee || 0)
            + (bank?.openingCost || 0)
            + (inspection?.upfrontCost || 0)
            + (lease?.tiBudget || 0)
            + ((this.setupChoices.location?.rent || 0) * (lease?.securityDepositMonths || 0))
            + (procedures.openingInventoryBudget || 0)
            + (procedures.launchMarketingBudget || 0);

        const monthlyOps = (entity?.monthlyCompliance || 0)
            + (bank?.monthlyFee || 0)
            + (books?.monthlyCost || 0)
            + (payroll?.monthlyCost || 0);

        const projectedCash = this.engine.cash + financingCash - equipmentCost - permitsCost - oneTimeOps;
        const totalMonthlyBurn = monthlyOverhead + monthlyOps;
        const runwayDays = totalMonthlyBurn > 0 ? Math.floor((projectedCash / totalMonthlyBurn) * 30) : 365;

        const requiredPermits = (GAME_CONFIG.SETUP_OPTIONS.paperwork || []).filter(p => p.required);
        const hasAllRequiredPermits = requiredPermits.every(p => this.setupChoices.paperwork.includes(p.id));
        const reserveTarget = procedures.emergencyReserveTarget || 0;
        const hitsReserveTarget = projectedCash >= reserveTarget;

        let readinessScore = 100;
        if (!hasAllRequiredPermits) readinessScore -= 30;
        if (runwayDays < 21) readinessScore -= 35;
        else if (runwayDays < 45) readinessScore -= 18;
        if (!hitsReserveTarget) readinessScore -= 15;
        readinessScore = Math.max(0, readinessScore);

        const runwayClass = runwayDays < 21 ? '#ff9b9b' : runwayDays < 45 ? '#ffd89f' : '#b9ffcb';
        const readinessClass = readinessScore < 55 ? '#ff9b9b' : readinessScore < 75 ? '#ffd89f' : '#b9ffcb';

        const warnings = [];
        if (!hasAllRequiredPermits) warnings.push('Missing required permits');
        if (!hitsReserveTarget) warnings.push(`Reserve target shortfall ($${Math.max(0, reserveTarget - projectedCash).toLocaleString()})`);
        if (runwayDays < 21) warnings.push('Less than 3 weeks runway');

        const completeBtn = document.getElementById('btn-complete-startup');
        if (completeBtn) {
            completeBtn.disabled = !hasAllRequiredPermits || runwayDays < 10;
            completeBtn.title = completeBtn.disabled ? 'Complete required permits and improve runway before opening.' : '';
        }

        summary.innerHTML = `
            Upfront purchases: <strong>$${equipmentCost.toLocaleString()}</strong><br>
            Permits selected: <strong>$${permitsCost.toLocaleString()}</strong><br>
            One-time setup procedures: <strong>$${oneTimeOps.toLocaleString()}</strong><br>
            Financing injected: <strong>$${financingCash.toLocaleString()}</strong><br>
            Estimated monthly fixed burn: <strong>$${(monthlyOverhead + monthlyOps).toLocaleString()}</strong><br>
            Projected post-setup cash: <strong>$${projectedCash.toLocaleString()}</strong><br>
            Cash runway: <strong style="color:${runwayClass}">${runwayDays} days</strong><br>
            Launch readiness: <strong style="color:${readinessClass}">${readinessScore}/100</strong>
            ${warnings.length ? `<br><span style="color:#ffd3b0; font-size:12px;">⚠ ${warnings.join(' | ')}</span>` : ''}
        `;
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

    skipSetupWithDefaults() {
        console.log('Skipping setup with defaults...');
        // Apply default setup choices
        const options = GAME_CONFIG.SETUP_OPTIONS;
        
        this.setupChoices = {
            location: options.locations.find(l => l.id === 'suburbs_plaza') || options.locations[0],
            financing: options.financing.find(f => f.id === 'personal_savings') || options.financing[0],
            equipment: {
                oven: options.equipment.ovens.find(o => o.id === 'basic_convection') || options.equipment.ovens[1],
                mixer: options.equipment.mixers.find(m => m.id === 'countertop_mixer') || options.equipment.mixers[1],
                display: options.equipment.displays.find(d => d.id === 'basic_case') || options.equipment.displays[1]
            },
            staff: options.staff.find(s => s.id === 'solo') || options.staff[0],
            paperwork: options.paperwork.filter(p => p.required).map(p => p.id),
            insurance: options.insurance.find(i => i.id === 'basic_liability') || options.insurance[0],
            utilities: {
                power: options.utilities.find(u => u.id === 'basic_power'),
                internet: options.utilities.find(u => u.id === 'basic_internet')
            },
            procedures: {
                entityType: 'llc',
                banking: 'community_bank',
                bookkeeping: 'software_basic',
                payroll: 'payroll_software',
                leaseTerm: 'standard_term',
                inspectionPrep: 'standard',
                openingInventoryBudget: 1800,
                launchMarketingBudget: 900,
                emergencyReserveTarget: 3000
            }
        };

        this.finishSetup();
    }

    finishStoryBookSetup(choices, budget) {
        // Storybook mode removed.
        this.showStartupCitySetup();
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
            c.staff &&
            c.procedures?.entityType &&
            c.procedures?.banking &&
            c.procedures?.bookkeeping &&
            c.procedures?.payroll &&
            c.procedures?.leaseTerm &&
            c.procedures?.inspectionPrep;
    }

    finishSetup() {
        // Destroy Phaser game if it exists
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }
        if (this._mapSetupMessageHandler) {
            window.removeEventListener('message', this._mapSetupMessageHandler);
            this._mapSetupMessageHandler = null;
        }

        // Apply choices to engine
        const choices = this.setupChoices;

        if (!choices?.location) {
            this.showPopup({
                icon: '⚠️',
                title: 'Location Required',
                message: 'Select and confirm a location first.',
                type: 'warning',
                autoClose: 1800
            });
            this.showStartupCitySetup();
            return;
        }

        if (!this.canFinishSetup()) {
            this.showPopup({
                icon: '📋',
                title: 'Complete Setup Procedures',
                message: 'Finish all required legal, staffing, utility, and permit decisions before opening.',
                type: 'warning',
                autoClose: 2200
            });
            this.showSetupProcedureFlow();
            return;
        }

        const procedures = choices.procedures || {};
        const procedureOptions = GAME_CONFIG.SETUP_PROCEDURES || {};
        const entity = (procedureOptions.entityTypes || []).find(e => e.id === procedures.entityType);
        const bank = (procedureOptions.banking || []).find(e => e.id === procedures.banking);
        const books = (procedureOptions.bookkeeping || []).find(e => e.id === procedures.bookkeeping);
        const payroll = (procedureOptions.payroll || []).find(e => e.id === procedures.payroll);
        const lease = (procedureOptions.leaseTerms || []).find(e => e.id === procedures.leaseTerm);
        const inspection = (procedureOptions.inspectionPrep || []).find(e => e.id === procedures.inspectionPrep);

        // Location
        this.engine.rentAmount = Math.round((choices.location.rent || 0) * (lease?.rentMultiplier || 1));
        this.engine.trafficMultiplier = choices.location.traffic;
        this.engine.monthlyPropertyTax = choices.location.propertyTaxMonthly || this.engine.monthlyPropertyTax || 0;
        this.engine.ingredientCostMultiplier = choices.location.ingredientCostMultiplier || this.engine.ingredientCostMultiplier || 1;
        this.engine.exteriorStyle = choices.location.exteriorStyle || this.engine.exteriorStyle;

        // Financing
        if (choices.financing?.amount) {
            this.engine.cash += choices.financing.amount;
        }
        this.engine.monthlyDebtService = choices.financing?.monthlyPayment || 0;

        // Equipment
        this.engine.ovenCapacity = choices.equipment.oven.capacity;
        this.engine.bakingSpeedMultiplier = choices.equipment.oven.speed * choices.equipment.mixer.efficiency;
        this.engine.menuAppeal = choices.equipment.display?.appeal || this.engine.menuAppeal;

        const equipmentCapex = (choices.equipment.oven?.cost || 0)
            + (choices.equipment.mixer?.cost || 0)
            + (choices.equipment.display?.cost || 0);
        if (equipmentCapex > 0) {
            this.engine.cash = Math.max(0, this.engine.cash - equipmentCapex);
        }

        // Staff
        if (choices.staff.efficiency) {
            this.engine.bakingSpeedMultiplier *= choices.staff.efficiency;
        }
        this.engine.monthlyStaffCost = (choices.staff?.monthlyCost || 0) + (choices.staff?.benefits || 0);

        // Financing (debt already added in scene)
        // Insurance (monthly costs)
        if (choices.insurance) {
            this.engine.monthlyInsurance = choices.insurance.monthlyCost;
        }

        // Utilities
        if (choices.utilities.power && choices.utilities.internet) {
            this.engine.monthlyUtilities = choices.utilities.power.monthlyCost + choices.utilities.internet.monthlyCost;
        }

        // Admin/compliance monthly burden from legal + finance operations.
        this.engine.monthlyAdminCosts = (entity?.monthlyCompliance || 0)
            + (bank?.monthlyFee || 0)
            + (books?.monthlyCost || 0)
            + (payroll?.monthlyCost || 0);

        // One-time setup operations costs.
        const oneTimeProcedureCosts = (entity?.filingFee || 0)
            + (bank?.openingCost || 0)
            + (inspection?.upfrontCost || 0)
            + (lease?.tiBudget || 0)
            + ((choices.location?.rent || 0) * (lease?.securityDepositMonths || 0))
            + (procedures.openingInventoryBudget || 0)
            + (procedures.launchMarketingBudget || 0);
        if (oneTimeProcedureCosts > 0) {
            this.engine.cash = Math.max(0, this.engine.cash - oneTimeProcedureCosts);
        }

        // Paperwork: required fees are included in location filing budget, optional permits are extra.
        const optionalPermitCost = (GAME_CONFIG.SETUP_OPTIONS.paperwork || [])
            .filter(p => !p.required && choices.paperwork.includes(p.id))
            .reduce((sum, p) => sum + (p.cost || 0), 0);
        if (optionalPermitCost > 0) {
            this.engine.cash = Math.max(0, this.engine.cash - optionalPermitCost);
        }

        // Optional permit gameplay effects.
        const selectedOptionalPermits = (GAME_CONFIG.SETUP_OPTIONS.paperwork || [])
            .filter(p => !p.required && choices.paperwork.includes(p.id));

        selectedOptionalPermits.forEach(permit => {
            if (permit.trafficBonus) {
                this.engine.trafficMultiplier *= permit.trafficBonus;
            }
            if (permit.revenueBonus) {
                this.engine.menuAppeal *= permit.revenueBonus;
            }
            if (permit.priceMultiplier) {
                this.engine.markupPercentage = Math.round(this.engine.markupPercentage * permit.priceMultiplier);
            }
        });

        // Location parking + inspection readiness influence opening demand/quality.
        const parkingBoost = Math.min(0.14, (choices.location?.parkingSpaces || 0) * 0.005);
        this.engine.trafficMultiplier *= 1 + parkingBoost;
        this.engine.trafficMultiplier *= inspection?.firstMonthTrafficMult || 1;
        this.engine.menuAppeal *= inspection?.qualitySafetyMult || 1;

        // Penalize aggressive starts without adequate emergency reserve.
        const reserveTarget = Math.max(0, procedures.emergencyReserveTarget || 0);
        if (reserveTarget > 0 && this.engine.cash < reserveTarget) {
            this.engine.trafficMultiplier *= 0.95;
            this.engine.menuAppeal *= 0.97;
        }

        const projectedCash = this.engine.cash;
        const monthlyBurn = (this.engine.monthlyStaffCost || 0)
            + (this.engine.monthlyInsurance || 0)
            + (this.engine.monthlyUtilities || 0)
            + (this.engine.monthlyPropertyTax || 0)
            + (this.engine.monthlyDebtService || 0)
            + (this.engine.monthlyAdminCosts || 0)
            + (this.engine.rentAmount || 0) * 30;
        const runwayDays = monthlyBurn > 0 ? Math.floor((projectedCash / monthlyBurn) * 30) : 365;

        this.setupOperationalProfile = this.buildOperationalSetupProfile(choices, {
            inspection,
            bookkeeping: books,
            payroll,
            optionalPermitsCount: selectedOptionalPermits.length,
            runwayDays,
            projectedCash
        });
        this._setupBaseTraffic = this.engine.trafficMultiplier || 1;
        this._setupBriefShown = false;

        // Initialize day state
        // Move to free-roam mode hub
        this.showModeHub();
    }

    showModeHub() {
        // If the Phaser bakery environment is already running, just close any overlay and return
        if (this.phaserGame && this.currentPhase === 'hub') {
            this.closeOverlayPanel();
            this.updateBakeryHUD();
            return;
        }

        this.cleanupPhaser();
        this.currentPhase = 'hub';
        window.dispatchEvent(new CustomEvent('gamePhaseChanged', { detail: { phase: 'hub' } }));
        this.purgeExpiredScenarioEffects();

        // Enter 2D bakery mode — hide old UI, show HUD
        document.body.classList.add('in-bakery-env');
        const hud = document.getElementById('bakery-hud');
        if (hud) hud.style.display = '';

        const container = document.getElementById('game-container');
        if (container) {
            container.classList.add('full-screen');
            container.style.padding = '0';
            container.innerHTML = `<div id="phaser-container" style="width:100%;height:100%;overflow:hidden;"></div>`;
        }

        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: 'phaser-container',
            backgroundColor: '#0a0604',
            pixelArt: false,
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false },
            },
            scene: [BakeryEnvironmentScene],
        };

        this.phaserGame = new Phaser.Game(config);

        // Bind the interaction event
        if (!this._bakeryInteractBound) {
            this._bakeryInteractBound = true;
            window.addEventListener('bakery:interact', (e) => this.handleBakeryInteraction(e.detail));
        }

        // Bind ESC to close overlay
        if (!this._escBound) {
            this._escBound = true;
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeOverlayPanel();
            });
        }

        // Close-button handler
        const closeBtn = document.getElementById('overlay-panel-close');
        if (closeBtn) closeBtn.onclick = () => this.closeOverlayPanel();

        this.applyDailyComplexityProfile(this.engine.day);

        if (this.setupOperationalProfile && !this._setupBriefShown) {
            this._setupBriefShown = true;
            const profile = this.setupOperationalProfile;
            this.showPopup({
                icon: '📈',
                title: 'Operations Forecast Loaded',
                message: `Launch Mode: ${profile.maturityBand}\nDemand range is now setup-driven (${(profile.demandFloor * 100).toFixed(0)}%-${(profile.demandCeiling * 100).toFixed(0)}%).\nVolatility and crisis pressure will evolve based on your startup choices.`,
                type: 'insight',
                autoClose: 4200
            });
        }

        // Start HUD update loop
        this.startHUDLoop();
        this.checkForScenarios();
        this.updateBakeryHUD();
    }

    // -- HUD sync loop --
    startHUDLoop() {
        if (this._hudInterval) clearInterval(this._hudInterval);
        this._hudInterval = setInterval(() => this.updateBakeryHUD(), 500);
    }

    updateBakeryHUD() {
        const hCash = document.getElementById('hud-cash');
        const hDay  = document.getElementById('hud-day');
        const hTime = document.getElementById('hud-time');
        if (hCash && this.engine) hCash.textContent = '$' + this.engine.cash.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        if (hDay && this.engine)  hDay.textContent = this.engine.day;
        if (hTime && this.engine) hTime.textContent = this.engine.getTimeString ? this.engine.getTimeString() : `${this.engine.hour}:${String(this.engine.minute).padStart(2,'0')}`;
        // Also keep the old nav-stats in sync (for popups that reference them)
        const navCash = document.getElementById('nav-cash');
        const navDay  = document.getElementById('nav-day');
        if (navCash && this.engine) navCash.textContent = `$${this.engine.cash.toFixed(2)}`;
        if (navDay && this.engine) navDay.textContent = `Day ${this.engine.day}`;
    }

    getComplexityProfile(day = this.engine?.day || 1) {
        const cappedDay = Math.min(30, Math.max(1, day));
        const ramp = (cappedDay - 1) / 29;
        const tier = cappedDay <= 10 ? 'Early Growth' : cappedDay <= 20 ? 'Rising Pressure' : 'Peak Complexity';
        return {
            day,
            cappedDay,
            ramp,
            tier,
            customerDemandMultiplier: 0.9 + (0.85 * ramp),
            costPressureMultiplier: 1 + (0.55 * ramp),
            scenarioRolls: 1 + Math.floor(ramp * 2),
            worldVolatility: 0.8 + (0.9 * ramp),
            crisisChancePerMinute: 0.01 + (0.045 * ramp),
            fatiguePressure: 1 + (0.4 * ramp)
        };
    }

    buildOperationalSetupProfile(choices, context = {}) {
        const procedures = choices?.procedures || {};
        const locationTraffic = choices?.location?.traffic || 1;
        const ingredientPressure = choices?.location?.ingredientCostMultiplier || 1;
        const staffEfficiency = choices?.staff?.efficiency || 1;
        const inspection = context.inspection || {};
        const bookkeeping = context.bookkeeping || {};
        const payroll = context.payroll || {};
        const financing = choices?.financing || {};
        const reserveTarget = Math.max(0, procedures.emergencyReserveTarget || 0);
        const projectedCash = Math.max(0, context.projectedCash || this.engine?.cash || 0);
        const reserveCoverage = reserveTarget > 0 ? Math.min(1.25, projectedCash / reserveTarget) : 1;
        const reservePressure = reserveCoverage < 1 ? (1 - reserveCoverage) : 0;

        const demandFloor = Math.max(0.72, Math.min(1.45,
            (0.8 + (locationTraffic * 0.42)) * (inspection.firstMonthTrafficMult || 1) * (reserveCoverage >= 1 ? 1.04 : 0.96)
        ));
        const demandCeiling = Math.max(demandFloor + 0.12, Math.min(2.15,
            demandFloor + 0.42 + ((context.optionalPermitsCount || 0) * 0.03)
        ));

        const costFloor = Math.max(0.86, Math.min(1.2,
            0.94 + ((ingredientPressure - 1) * 0.85) + ((financing.interestRate || 0) * 0.28)
        ));
        const costCeiling = Math.max(costFloor + 0.06, Math.min(1.72,
            costFloor + 0.24 + (reservePressure * 0.18)
        ));

        const volatilityFloor = Math.max(0.72, Math.min(1.32,
            0.9 + (reservePressure * 0.24) + (((payroll.complianceRisk || 1) - 1) * 0.35)
        ));
        const volatilityCeiling = Math.max(volatilityFloor + 0.1, Math.min(1.9,
            volatilityFloor + 0.34 + (((bookkeeping.taxPenaltyRisk || 1) - 1) * 0.45)
        ));

        const crisisFloor = Math.max(0.72, Math.min(1.45,
            0.9 + (reservePressure * 0.4) + ((inspection.id === 'minimal') ? 0.12 : 0) + ((payroll.id === 'manual_payroll') ? 0.09 : 0)
        ));
        const crisisCeiling = Math.max(crisisFloor + 0.05, Math.min(1.85, crisisFloor + 0.24));

        const fatigueFloor = Math.max(0.82, Math.min(1.28,
            1.02 - ((staffEfficiency - 1) * 0.2) + ((context.runwayDays || 0) < 30 ? 0.08 : 0)
        ));
        const fatigueCeiling = Math.max(fatigueFloor + 0.04, Math.min(1.62, fatigueFloor + 0.2 + (reservePressure * 0.1)));

        const maturityBand = reserveCoverage >= 1 && (context.runwayDays || 0) >= 45
            ? 'Disciplined Launch'
            : reserveCoverage >= 0.7
                ? 'Balanced Launch'
                : 'Fragile Launch';

        return {
            maturityBand,
            demandFloor,
            demandCeiling,
            costFloor,
            costCeiling,
            volatilityFloor,
            volatilityCeiling,
            crisisFloor,
            crisisCeiling,
            fatigueFloor,
            fatigueCeiling
        };
    }

    applyOperationalSetupModifiers(baseProfile, day = this.engine?.day || 1) {
        if (!this.setupOperationalProfile) return baseProfile;

        const cappedDay = Math.min(30, Math.max(1, day));
        const ramp = (cappedDay - 1) / 29;
        const p = this.setupOperationalProfile;

        const lerp = (a, b, t) => a + ((b - a) * t);

        return {
            ...baseProfile,
            setupBand: p.maturityBand,
            customerDemandMultiplier: baseProfile.customerDemandMultiplier * lerp(p.demandFloor, p.demandCeiling, ramp),
            costPressureMultiplier: baseProfile.costPressureMultiplier * lerp(p.costFloor, p.costCeiling, ramp),
            worldVolatility: baseProfile.worldVolatility * lerp(p.volatilityFloor, p.volatilityCeiling, ramp),
            crisisChancePerMinute: baseProfile.crisisChancePerMinute * lerp(p.crisisFloor, p.crisisCeiling, ramp),
            fatiguePressure: baseProfile.fatiguePressure * lerp(p.fatigueFloor, p.fatigueCeiling, ramp)
        };
    }

    applyDailyComplexityProfile(day = this.engine?.day || 1) {
        if (!this.engine) return;
        const profile = this.applyOperationalSetupModifiers(this.getComplexityProfile(day), day);
        this.dayComplexityProfile = profile;

        if (!this._baseRentAmount) {
            this._baseRentAmount = this.engine.rentAmount || GAME_CONFIG.DAILY_EXPENSES.rent.amount;
        }
        this.engine.rentAmount = Math.round(this._baseRentAmount * profile.costPressureMultiplier);

        const demandMultiplier = this.engine.economy?.getDemandMultiplier ? this.engine.economy.getDemandMultiplier() : 1;
        if (!this._setupBaseTraffic) {
            this._setupBaseTraffic = this.engine.trafficMultiplier || 1;
        }
        const setupTrafficBaseline = Math.max(0.55, this._setupBaseTraffic || 1);
        this.engine.trafficMultiplier = Math.max(0.6, setupTrafficBaseline * demandMultiplier * profile.customerDemandMultiplier);
    }

    // -- Overlay panel helpers --
    openOverlayPanel(title, bodyHtml) {
        const panel = document.getElementById('overlay-panel');
        const titleEl = document.getElementById('overlay-panel-title');
        const bodyEl  = document.getElementById('overlay-panel-body');
        if (!panel || !titleEl || !bodyEl) return;
        titleEl.textContent = title;
        bodyEl.innerHTML = bodyHtml;
        panel.classList.add('open');
        window.dispatchEvent(new Event('bakery:overlay-opened'));
    }

    closeOverlayPanel() {
        const panel = document.getElementById('overlay-panel');
        if (!panel || !panel.classList.contains('open')) return;
        panel.classList.remove('open');
        this.stopBakingLoop();
        // Only stop selling if explicitly requested (Close Shop button)
        // Don't stop when player just closes the overlay to walk around
        if (this._stopSellingOnClose) {
            this.stopSellingLoop();
            this._stopSellingOnClose = false;
        }
        window.dispatchEvent(new Event('bakery:overlay-closed'));
        this.updateBakeryHUD();
    }

    // -- Interaction router --
    handleBakeryInteraction(detail) {
        const { actionId } = detail;
        switch (actionId) {
            case 'computer':   this.showComputerPanel(); break;
            case 'oven':
            case 'prep':       this.showOvenPanel(); break;
            case 'register':   this.triggerAutonomousRegisterCheckout(); break;
            case 'display':
            case 'display2':
            case 'bread_shelf':
            case 'product_shelf': this.showDisplayPanel(); break;
            case 'storage':
            case 'fridge':     this.showStoragePanel(); break;
            case 'records':    this.showRecordsPanel(); break;
            case 'recipes':    this.showRecipesPanel(); break;
            default:
                console.log('[Bakery] Unknown interaction:', actionId);
        }
    }

    triggerAutonomousRegisterCheckout() {
        this.markLoopCoachProgress('registerVisited', true);
        this.engine.isPaused = false;

        if (!Array.isArray(this.activeCustomers)) {
            this.activeCustomers = [];
        }

        if (!this.sellingLoopId) {
            this.startSellingLoop();
        }

        const waiting = this.activeCustomers.filter(c => c && c.state === 'waiting' && !c.assignedStaff);
        waiting.forEach(customer => this.planCustomerService(customer, { silent: true }));

        const nextCustomer = waiting[0] || null;
        window.dispatchEvent(new CustomEvent('bakery:customer-expression', {
            detail: {
                target: 'player',
                emoji: '🧑‍🍳',
                message: nextCustomer?.name
                    ? `I got you, ${nextCustomer.name}. Checkout is running.`
                    : 'Register is live. I am ready for the next customer.',
                tone: nextCustomer ? 'happy' : 'neutral'
            }
        }));

        if (this.notificationSystem) {
            this.notificationSystem.info('Autonomous checkout started', {
                icon: '🤖',
                title: 'Cash Register'
            });
        }
    }

    enterPhaseFromHub(phase) {
        // Legacy — in the new 2D world we don't destroy Phaser, just open the overlay
        switch (phase) {
            case 'buying': this.showComputerPanel(); break;
            case 'baking': this.showOvenPanel(); break;
            case 'selling': this.showRegisterPanel(); break;
            case 'summary': this.showSummaryOverlay(); break;
            default: this.goToPhase(phase);
        }
    }

    // ==================== OVERLAY PANELS (2D ENVIRONMENT) ====================

    // ---- COMPUTER PANEL (Buying / Finances / Upgrades / Market / Staff / Strategy) ----
    showComputerPanel() {
        const tabs = [
            { id: 'buy',       label: '📦 Buy Supplies' },
            { id: 'finance',   label: '📊 Finances' },
            { id: 'market',    label: '📈 Market' },
            { id: 'staff',     label: '🧑‍🍳 Staff' },
            { id: 'equipment', label: '⚙️ Equipment' },
            { id: 'strategy',  label: '🎯 Strategy' },
            { id: 'endday',    label: '🌙 End Day' },
        ];
        const tabsHtml = `<div class="overlay-tabs">${tabs.map((t, i) =>
            `<button class="overlay-tab${i === 0 ? ' active' : ''}" data-tab="${t.id}">${t.label}</button>`
        ).join('')}</div>`;

        const bodyHtml = tabsHtml + tabs.map(t => `<div class="overlay-tab-content${t.id === 'buy' ? ' active' : ''}" id="computer-tab-${t.id}"></div>`).join('');
        this.openOverlayPanel('💻 Office Computer', bodyHtml);

        // Wire tabs
        document.querySelectorAll('#overlay-panel .overlay-tab').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#overlay-panel .overlay-tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('#overlay-panel .overlay-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const target = document.getElementById(`computer-tab-${btn.dataset.tab}`);
                if (target) target.classList.add('active');
                this.renderComputerTab(btn.dataset.tab);
            };
        });

        // Render first tab
        this.renderComputerTab('buy');
    }

    renderComputerTab(tab) {
        const el = document.getElementById(`computer-tab-${tab}`);
        if (!el) return;

        switch (tab) {
            case 'buy': this.renderBuyingTab(el); break;
            case 'finance': this.renderFinanceTab(el); break;
            case 'market': this.renderMarketTab(el); break;
            case 'staff': this.renderStaffTab(el); break;
            case 'equipment': this.renderEquipmentTab(el); break;
            case 'strategy': this.renderStrategyTab(el); break;
            case 'endday': this.renderEndDayTab(el); break;
        }
    }

    renderBuyingTab(el) {
        // Reuse the buying phase content but render inside the overlay panel
        const vendors = GAME_CONFIG.VENDORS || {};
        const vendorKeys = Object.keys(vendors);
        const currentVendor = vendorKeys[0] || 'METRO';

        el.innerHTML = `
            <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
                <button id="btn-overlay-auto-buying" class="overlay-auto-btn" style="padding:8px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.25); cursor:pointer; font-size:12px;">🤖 Deploy Procurement Automation</button>
            </div>
            <div style="display:grid; grid-template-columns:220px 1fr 300px; gap:16px; max-height:60vh;">
                <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:12px; overflow-y:auto;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">🏪 Vendors</h4>
                    <div id="overlay-vendor-list">
                        ${vendorKeys.map(vk => {
                            const v = vendors[vk];
                            return `<button class="overlay-vendor-btn" data-vendor="${vk}" style="
                                display:block; width:100%; text-align:left; padding:8px 10px; margin-bottom:6px;
                                background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1);
                                border-radius:8px; color:white; cursor:pointer; font-size:13px;
                            ">${v.icon || '🏬'} ${v.name}<br><span style='font-size:11px;color:rgba(255,255,255,0.5);'>${v.specialty || ''}</span></button>`;
                        }).join('')}
                    </div>
                </div>
                <div style="overflow-y:auto;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">🧈 Ingredients</h4>
                    <div id="overlay-ingredient-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px;"></div>
                </div>
                <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:12px; overflow-y:auto;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">📦 Inventory</h4>
                    <div style="margin-bottom:10px; font-size:14px; color:#2ecc71;">Cash: <strong>$<span id="overlay-buy-cash">${this.engine.cash.toFixed(2)}</span></strong></div>
                    <div id="overlay-inventory-list"></div>
                </div>
            </div>
        `;

        // Render ingredients for first vendor
        this.renderOverlayIngredients(currentVendor);
        this.renderOverlayInventory();

        // Vendor button handlers
        el.querySelectorAll('.overlay-vendor-btn').forEach(btn => {
            btn.onclick = () => {
                el.querySelectorAll('.overlay-vendor-btn').forEach(b => b.style.borderColor = 'rgba(255,255,255,0.1)');
                btn.style.borderColor = '#ffd700';
                this.renderOverlayIngredients(btn.dataset.vendor);
            };
        });

        const autoBuyingBtn = document.getElementById('btn-overlay-auto-buying');
        if (autoBuyingBtn) autoBuyingBtn.onclick = () => this.manualAutomationTrigger('buying');

        // Highlight first vendor
        const firstBtn = el.querySelector('.overlay-vendor-btn');
        if (firstBtn) firstBtn.style.borderColor = '#ffd700';
    }

    renderOverlayIngredients(vendorKey) {
        const grid = document.getElementById('overlay-ingredient-grid');
        if (!grid) return;
        const ingredients = GAME_CONFIG.INGREDIENTS || {};
        const vendor = (GAME_CONFIG.VENDORS || {})[vendorKey] || {};
        const vendorIngredients = vendor.ingredients || Object.keys(ingredients);

        grid.innerHTML = vendorIngredients.map(ingKey => {
            const ing = ingredients[ingKey];
            if (!ing) return '';
            const price = this.engine.economy ? this.engine.economy.getIngredientPrice(ingKey, vendorKey) : (ing.cost || ing.price || 1);
            const unit = ing.unit || 'unit';
            return `
                <div style="background:rgba(255,255,255,0.07); border-radius:8px; padding:10px; font-size:13px;">
                    <div style="font-weight:600; margin-bottom:4px;">${ing.icon || '🧂'} ${ing.name || ingKey}</div>
                    <div style="color:#f39c12; font-size:12px;">$${(typeof price === 'number' ? price : 1).toFixed(2)} / ${unit}</div>
                    <div style="display:flex; gap:6px; margin-top:8px; align-items:center;">
                        <input type="number" min="1" value="1" style="width:50px; padding:4px; border-radius:4px; border:1px solid #555; background:#222; color:white; font-size:12px;" class="overlay-ing-qty" data-ing="${ingKey}">
                        <button style="padding:4px 10px; background:#2ecc71; border:none; border-radius:6px; color:white; font-size:12px; cursor:pointer;" class="overlay-buy-btn" data-ing="${ingKey}" data-vendor="${vendorKey}">Buy</button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.overlay-buy-btn').forEach(btn => {
            btn.onclick = () => {
                const ingKey = btn.dataset.ing;
                const vendor = btn.dataset.vendor;
                const qtyInput = grid.querySelector(`.overlay-ing-qty[data-ing="${ingKey}"]`);
                const qty = parseInt(qtyInput?.value, 10) || 1;
                const result = this.engine.purchaseIngredient(ingKey, qty, vendor);
                if (result && result.success !== false) {
                    btn.textContent = '✓';
                    setTimeout(() => { btn.textContent = 'Buy'; }, 600);
                } else {
                    btn.textContent = '✗';
                    btn.style.background = '#e74c3c';
                    setTimeout(() => { btn.textContent = 'Buy'; btn.style.background = '#2ecc71'; }, 800);
                }
                this.renderOverlayInventory();
                this.updateBakeryHUD();
                const cashEl = document.getElementById('overlay-buy-cash');
                if (cashEl) cashEl.textContent = this.engine.cash.toFixed(2);
            };
        });
    }

    renderOverlayInventory() {
        const el = document.getElementById('overlay-inventory-list');
        if (!el) return;
        const ingredients = this.engine.ingredients || {};
        const entries = Object.entries(ingredients).filter(([k, v]) => {
            const total = v.batches ? v.batches.reduce((s, b) => s + b.quantity, 0) : (v.quantity || 0);
            return total > 0;
        });
        if (entries.length === 0) {
            el.innerHTML = '<div style="color:rgba(255,255,255,0.4); font-size:12px;">No ingredients in stock</div>';
            return;
        }
        el.innerHTML = entries.map(([key, v]) => {
            const total = v.batches ? v.batches.reduce((s, b) => s + b.quantity, 0) : (v.quantity || 0);
            const ing = (GAME_CONFIG.INGREDIENTS || {})[key] || {};
            return `<div style="display:flex; justify-content:space-between; padding:4px 0; font-size:12px; border-bottom:1px solid rgba(255,255,255,0.06);">
                <span>${ing.icon || ''} ${ing.name || key}</span>
                <span style="color:#f39c12;">${total.toFixed(1)}</span>
            </div>`;
        }).join('');
    }

    renderFinanceTab(el) {
        const s = this.engine.dailyStats || {};
        const a = this.engine.allTimeStats || {};
        el.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:16px;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:12px;">📊 Today (Day ${this.engine.day})</h4>
                    <div style="font-size:13px; line-height:2;">
                        <div>Revenue: <strong style="color:#2ecc71;">$${(s.revenue||0).toFixed(2)}</strong></div>
                        <div>Cost of Goods: <strong style="color:#e74c3c;">-$${(s.cogs||0).toFixed(2)}</strong></div>
                        <div>Gross Profit: <strong>$${((s.revenue||0) - (s.cogs||0)).toFixed(2)}</strong></div>
                        <div>Customers Served: <strong>${s.customersServed||0}</strong></div>
                        <div>Customers Missed: <strong style="color:#e74c3c;">${s.customersMissed||0}</strong></div>
                        <div>Items Sold: <strong>${s.itemsSold||0}</strong></div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:16px;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:12px;">📈 All Time</h4>
                    <div style="font-size:13px; line-height:2;">
                        <div>Total Revenue: <strong style="color:#2ecc71;">$${(a.totalRevenue||0).toFixed(2)}</strong></div>
                        <div>Total COGS: <strong style="color:#e74c3c;">-$${(a.totalCogs||0).toFixed(2)}</strong></div>
                        <div>Total Expenses: <strong style="color:#e74c3c;">-$${(a.totalExpenses||0).toFixed(2)}</strong></div>
                        <div>Total Customers: <strong>${a.totalCustomers||0}</strong></div>
                        <div>Days Operated: <strong>${a.daysOperated||0}</strong></div>
                        <div style="margin-top:8px; font-size:16px; color:#ffd700;">Cash: <strong>$${this.engine.cash.toFixed(2)}</strong></div>
                    </div>
                </div>
            </div>
            <div style="margin-top:16px; text-align:center;">
                <button style="padding:8px 20px; background:rgba(255,215,0,0.2); border:1px solid rgba(255,215,0,0.4); border-radius:8px; color:#ffd700; cursor:pointer; font-size:13px;" onclick="if(window.game && window.game.dashboard) window.game.dashboard.show();">📊 Open Full Dashboard</button>
            </div>
        `;
    }

    renderMarketTab(el) {
        try {
            const report = this.engine.economy ? this.engine.economy.getDailyReport(this.engine.day) : null;
            if (!report) { el.innerHTML = '<div style="color:rgba(255,255,255,0.5);">Market data unavailable</div>'; return; }
            const complexity = this.dayComplexityProfile || this.getComplexityProfile(this.engine.day);
            const eventsHtml = (report.activeEvents || []).length > 0
                ? report.activeEvents.map(e => `<div style="background:rgba(231,76,60,0.15); border-left:3px solid #e74c3c; padding:8px; margin-bottom:6px; border-radius:4px; font-size:13px;">${e.icon||'⚠️'} ${e.name} (${e.daysRemaining} days left)</div>`).join('')
                : '<div style="color:rgba(255,255,255,0.4); font-size:13px;">No active events</div>';
            el.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:14px;">
                        <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">🌤️ Conditions</h4>
                        <div style="font-size:13px; line-height:2;">
                            <div>Season: ${report.season?.icon||''} ${report.season?.name||'Unknown'}</div>
                            <div>Inflation: ${report.inflation?.rate||'N/A'} ${report.inflation?.trend||''}</div>
                            <div>Supply — 🌾${report.supply?.grains||'N/A'} 🥛${report.supply?.dairy||'N/A'} 🍎${report.supply?.produce||'N/A'}</div>
                        </div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:14px;">
                        <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">🎚️ World Complexity</h4>
                        <div style="font-size:13px; line-height:1.9;">
                            <div>Tier: <strong style="color:#ffd700;">${complexity.tier}</strong> (Day ${Math.min(30, this.engine.day)}/30)</div>
                            <div>Launch Band: <strong>${complexity.setupBand || 'Standard'}</strong></div>
                            <div>Demand Pressure: <strong>${(complexity.customerDemandMultiplier * 100).toFixed(0)}%</strong></div>
                            <div>Cost Pressure: <strong>${(complexity.costPressureMultiplier * 100).toFixed(0)}%</strong></div>
                            <div>Volatility: <strong>${(complexity.worldVolatility * 100).toFixed(0)}%</strong></div>
                            <div>Scenario Rolls/day: <strong>${complexity.scenarioRolls}</strong></div>
                        </div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:14px; margin-top:12px;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">⚡ Active Events</h4>
                    ${eventsHtml}
                </div>
            `;
        } catch(e) { el.innerHTML = '<div style="color:#e74c3c;">Error loading market data</div>'; }
    }

    renderStaffTab(el) {
        const staff = this.engine.staff || [];
        el.innerHTML = `
            <div style="margin-bottom:12px;">
                <button style="padding:8px 16px; background:#2ecc71; border:none; border-radius:8px; color:white; cursor:pointer; font-size:13px;" onclick="window.game.showStaffPanel();">🧑‍🍳 Open Full Staff Panel</button>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px;">
                ${staff.length === 0 ? '<div style="color:rgba(255,255,255,0.4);">No staff hired yet. Use the Staff Panel to hire.</div>' :
                staff.map(s => `
                    <div style="background:rgba(255,255,255,0.06); border-radius:8px; padding:12px;">
                        <div style="font-size:18px;">${s.face||'👤'} <strong>${s.name}</strong></div>
                        <div style="font-size:12px; color:rgba(255,255,255,0.6); margin-top:4px;">⭐ Skill: ${(s.skillLevel||1).toFixed(1)} | 😊 ${(s.happiness||100).toFixed(0)}% | 😴 ${(s.fatigue||0).toFixed(0)}%</div>
                        <div style="font-size:12px; color:#f39c12; margin-top:2px;">$${(s.salary||0).toFixed(0)}/day</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderEquipmentTab(el) {
        el.innerHTML = `
            <div style="margin-bottom:12px;">
                <button style="padding:8px 16px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); border-radius:8px; color:white; cursor:pointer; font-size:13px;" onclick="window.game.showEquipmentPanel();">⚙️ Open Full Equipment Panel</button>
            </div>
            <div style="font-size:13px; line-height:2; color:rgba(255,255,255,0.7);">
                <div>Ovens: <strong>${this.engine.equipment?.ovens || 1}</strong> (Capacity: ${this.engine.ovenCapacity || 8})</div>
                <div>Mixers: <strong>${this.engine.equipment?.mixers || 1}</strong></div>
                <div>Display Cases: <strong>${this.engine.equipment?.displays || 1}</strong></div>
            </div>
        `;
    }

    renderStrategyTab(el) {
        el.innerHTML = `
            <div style="margin-bottom:12px;">
                <button style="padding:8px 16px; background:rgba(255,215,0,0.2); border:1px solid rgba(255,215,0,0.4); border-radius:8px; color:#ffd700; cursor:pointer; font-size:13px;" onclick="window.game.showStrategyPanel();">🎯 Open Full Strategy Panel</button>
            </div>
            <div style="font-size:13px; color:rgba(255,255,255,0.6);">
                <div>Markup: <strong style="color:#f39c12;">${this.engine.markupPercentage || 100}%</strong></div>
                <div>Automation: <strong>${this.automationEnabled ? '✅ Active' : '❌ Off'}</strong></div>
            </div>
        `;
    }

    renderEndDayTab(el) {
        el.innerHTML = `
            <div style="text-align:center; padding:30px 20px;">
                <div style="font-size:48px; margin-bottom:16px;">🌙</div>
                <h3 style="font-family:'Fredoka',cursive; color:#ffd700; margin-bottom:12px;">End Day ${this.engine.day}?</h3>
                <p style="color:rgba(255,255,255,0.6); margin-bottom:20px; font-size:14px;">
                    This will close the shop, calculate profits, expenses, and spoilage, then start a new day.
                </p>
                <div style="display:flex; gap:12px; justify-content:center;">
                    <button style="padding:10px 24px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:8px; color:white; cursor:pointer; font-size:14px;" onclick="window.game.closeOverlayPanel();">Cancel</button>
                    <button style="padding:10px 24px; background:#e67e22; border:none; border-radius:8px; color:white; cursor:pointer; font-size:14px; font-weight:600;" onclick="window.game.showSummaryOverlay();">🌙 End Day</button>
                </div>
            </div>
        `;
    }

    // ---- OVEN / BAKING PANEL ----
    showOvenPanel() {
        const bodyHtml = `
            <div style="margin-bottom:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <span style="color:rgba(255,255,255,0.6); font-size:13px;">Time Speed:</span>
                <button class="overlay-speed-btn" data-speed="1" style="padding:4px 10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:white; cursor:pointer; font-size:12px;">1x</button>
                <button class="overlay-speed-btn" data-speed="2" style="padding:4px 10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:white; cursor:pointer; font-size:12px;">2x</button>
                <button class="overlay-speed-btn" data-speed="5" style="padding:4px 10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:white; cursor:pointer; font-size:12px;">5x</button>
                <button class="overlay-speed-btn" data-speed="10" style="padding:4px 10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:white; cursor:pointer; font-size:12px;">10x</button>
                <span id="overlay-speed-val" style="font-size:13px; font-weight:bold; color:#2ecc71;">1x</span>
                <button id="btn-overlay-auto-baking" class="overlay-auto-btn" style="margin-left:auto; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:12px;">🤖 Deploy Baking Automation</button>
            </div>
            <div style="margin-bottom:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <label style="font-size:13px; color:rgba(255,255,255,0.7);">Markup %:</label>
                <input type="range" id="overlay-bake-markup-slider" min="0" max="600" value="${this.engine.markupPercentage || 100}" style="flex:1; max-width:220px;" oninput="window.game.updateMarkup(this.value)">
                <input type="number" id="overlay-bake-markup-input" min="0" max="600" value="${this.engine.markupPercentage || 100}" style="width:70px; padding:4px; border-radius:4px; border:1px solid #555; background:#222; color:white; font-size:12px;" oninput="window.game.updateMarkup(this.value)">
                <span style="font-size:12px; color:rgba(255,255,255,0.5);">(Sell price = Cost × <strong id="overlay-bake-markup-factor">${(1 + (this.engine.markupPercentage || 100) / 100).toFixed(2)}</strong>)</span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 300px; gap:16px; max-height:58vh;">
                <div style="overflow-y:auto;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">📋 Recipes</h4>
                    <div id="overlay-recipe-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px;"></div>
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin:16px 0 10px;">🔄 Production Queue</h4>
                    <div id="overlay-production-slots"></div>
                </div>
                <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:12px; overflow-y:auto;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">📦 Ready Products</h4>
                    <div id="overlay-ready-products"></div>
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin:16px 0 10px;">👨‍🍳 Staff</h4>
                    <div id="overlay-employee-list-baking">${this.renderEmployeePanel()}</div>
                </div>
            </div>
        `;
        this.openOverlayPanel('🍞 Oven & Bakery Production', bodyHtml);

        // Speed buttons
        document.querySelectorAll('.overlay-speed-btn').forEach(btn => {
            btn.onclick = () => {
                this.setGameSpeed(parseInt(btn.dataset.speed, 10));
                const val = document.getElementById('overlay-speed-val');
                if (val) val.textContent = btn.dataset.speed + 'x';
            };
        });

        const autoBakingBtn = document.getElementById('btn-overlay-auto-baking');
        if (autoBakingBtn) autoBakingBtn.onclick = () => this.manualAutomationTrigger('baking');

        this.renderOverlayRecipes();
        this.renderOverlayProductionQueue();
        this.renderOverlayReadyProducts();
        this.startBakingLoop();
    }

    renderOverlayRecipes() {
        const grid = document.getElementById('overlay-recipe-grid');
        if (!grid) return;
        const recipes = GAME_CONFIG.RECIPES || {};

        grid.innerHTML = Object.entries(recipes).map(([key, recipe]) => {
            const { canBake, missing } = this.engine.canBakeRecipe(key);
            const cost = this.engine.calculateProductCost(key);
            const price = this.engine.getRecipeBasePrice(key);
            const profit = price - cost;

            return `
                <div style="background:rgba(255,255,255,${canBake ? '0.07' : '0.03'}); border-radius:8px; padding:10px; font-size:12px; ${!canBake ? 'opacity:0.5;' : ''}" data-recipe="${key}">
                    <div style="font-size:18px; float:left; margin-right:8px;">${recipe.icon}</div>
                    <div style="font-weight:600;">${recipe.name}</div>
                    <div style="color:rgba(255,255,255,0.5); font-size:11px;">Cost: $${cost.toFixed(2)} → Sell: $${price.toFixed(2)} <span style="color:#2ecc71;">(+$${profit.toFixed(2)})</span></div>
                    <div style="color:rgba(255,255,255,0.4); font-size:11px;">⏱️ ${recipe.bakeTime}min | Fresh ${recipe.shelfLife}d</div>
                    ${canBake
                        ? `<button style="margin-top:6px; padding:4px 12px; background:#e67e22; border:none; border-radius:6px; color:white; font-size:12px; cursor:pointer;" class="overlay-bake-btn" data-recipe="${key}">🔥 Bake</button>`
                        : `<div style="margin-top:4px; color:#e74c3c; font-size:11px;">Missing: ${missing.map(m => m.ingredient).join(', ')}</div>`
                    }
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.overlay-bake-btn').forEach(btn => {
            btn.onclick = () => {
                const result = this.engine.startBaking(btn.dataset.recipe, 1);
                if (result.success) {
                    btn.textContent = '✓ Started';
                    setTimeout(() => { btn.textContent = '🔥 Bake'; }, 600);
                    this.renderOverlayRecipes();
                    this.renderOverlayProductionQueue();
                } else {
                    btn.textContent = '✗ ' + (result.message || 'Failed');
                    setTimeout(() => { btn.textContent = '🔥 Bake'; }, 1000);
                }
            };
        });
    }

    renderOverlayProductionQueue() {
        const el = document.getElementById('overlay-production-slots');
        if (!el) return;
        const queue = this.engine.productionQueue || [];
        if (queue.length === 0) {
            el.innerHTML = '<div style="color:rgba(255,255,255,0.4); font-size:13px;">No items in production. Select a recipe above!</div>';
            return;
        }
        el.innerHTML = queue.map(item => {
            const progress = Math.min(100, (item.progress / item.totalTime) * 100);
            const stage = item.stages[item.stageIndex];
            const employee = item.assignedEmployee;
            return `
                <div style="background:rgba(255,255,255,0.06); border-radius:8px; padding:10px; margin-bottom:8px; font-size:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>${item.recipeIcon} ${item.recipeName} x${item.quantity}</span>
                        <span style="color:${item.prepQuality > 90 ? '#2ecc71' : item.prepQuality > 70 ? '#f39c12' : '#e74c3c'};">Q:${item.prepQuality.toFixed(0)}%</span>
                    </div>
                    ${employee ? `<div style="color:rgba(255,255,255,0.5); font-size:11px;">👨‍🍳 ${employee.name}</div>` : ''}
                    <div style="margin-top:6px; font-size:11px; color:rgba(255,255,255,0.6);">${stage.name}</div>
                    <div style="background:rgba(255,255,255,0.1); border-radius:4px; height:6px; margin-top:4px; overflow:hidden;">
                        <div style="width:${progress}%; height:100%; background:#e67e22; border-radius:4px; transition:width 0.3s;"></div>
                    </div>
                    <div style="text-align:right; font-size:10px; color:rgba(255,255,255,0.4); margin-top:2px;">${Math.ceil((item.totalTime - item.progress) / 1000)}s left</div>
                </div>
            `;
        }).join('');
    }

    renderOverlayReadyProducts() {
        const el = document.getElementById('overlay-ready-products');
        if (!el) return;
        const products = Object.entries(this.engine.products || {})
            .filter(([key]) => this.engine.getProductStock(key) > 0);

        if (products.length === 0) {
            el.innerHTML = '<div style="color:rgba(255,255,255,0.4); font-size:12px;">No products ready yet</div>';
            return;
        }
        el.innerHTML = products.map(([key]) => {
            const recipe = (GAME_CONFIG.RECIPES || {})[key] || {};
            const stock = this.engine.getProductStock(key);
            const quality = this.engine.getProductQuality(key);
            const ql = this.engine.getQualityLabel(quality);
            const pm = this.engine.getQualityPriceMultiplier(quality);
            const ep = this.engine.getRecipeBasePrice(key) * pm;
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; font-size:12px; border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span>${recipe.icon} ${recipe.name}</span>
                    <span>${stock}x</span>
                    <span style="color:${ql.color};">${ql.emoji} ${quality.toFixed(0)}%</span>
                    <span style="color:#2ecc71;">$${ep.toFixed(2)}</span>
                </div>
            `;
        }).join('');
    }

    // ---- REGISTER / SELLING PANEL ----
    showRegisterPanel() {
        this.engine.isPaused = false;
        this.activeCustomers = [];

        const bodyHtml = `
            <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px; flex-wrap:wrap;">
                <label style="font-size:13px; color:rgba(255,255,255,0.7);">Markup %:</label>
                <input type="range" id="overlay-markup-slider" min="0" max="500" value="${this.engine.markupPercentage || 100}" style="flex:1; max-width:200px;" oninput="window.game.updateMarkup(this.value)">
                <input type="number" id="overlay-markup-input" min="0" max="500" value="${this.engine.markupPercentage || 100}" style="width:60px; padding:4px; border-radius:4px; border:1px solid #555; background:#222; color:white; font-size:12px;" oninput="window.game.updateMarkup(this.value)">
                <span style="font-size:12px; color:rgba(255,255,255,0.5);">(×${(1 + (this.engine.markupPercentage || 100) / 100).toFixed(2)})</span>
                <span style="margin-left:auto; font-size:13px;">Time: <strong id="overlay-sell-time">${this.engine.getTimeString ? this.engine.getTimeString() : ''}</strong></span>
                <button id="btn-overlay-auto-selling" class="overlay-auto-btn" style="padding:6px 12px; border-radius:8px; cursor:pointer; font-size:12px;">🤖 Deploy Service Automation</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 280px; gap:16px; max-height:56vh;">
                <div style="overflow-y:auto;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">🏪 Display Case</h4>
                    <div id="overlay-display-products"></div>
                </div>
                <div style="overflow-y:auto;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">👥 Customer Queue</h4>
                    <div id="overlay-customer-area"><div style="color:rgba(255,255,255,0.4); font-size:13px;">Waiting for customers...</div></div>
                </div>
                <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:12px; overflow-y:auto;">
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">📊 Sales Stats</h4>
                    <div style="font-size:13px; line-height:2;">
                        <div>Revenue: <strong style="color:#2ecc71;" id="overlay-stat-revenue">$${(this.engine.dailyStats?.revenue||0).toFixed(2)}</strong></div>
                        <div>Customers: <strong id="overlay-stat-customers">${this.engine.dailyStats?.customersServed||0}</strong></div>
                        <div>Missed: <strong style="color:#e74c3c;" id="overlay-stat-missed">${this.engine.dailyStats?.customersMissed||0}</strong></div>
                    </div>
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin:14px 0 8px;">👨‍🍳 Staff</h4>
                    <div id="overlay-employee-list-selling" style="font-size:12px;">${this.renderEmployeeSelling()}</div>
                    <div style="margin-top:16px;">
                        <button style="padding:8px 16px; background:#e74c3c; border:none; border-radius:8px; color:white; cursor:pointer; font-size:13px; width:100%;" onclick="window.game._stopSellingOnClose=true; window.game.closeOverlayPanel();">🚪 Close Shop</button>
                    </div>
                </div>
            </div>
        `;
        this.openOverlayPanel('💰 Cash Register — Open Shop', bodyHtml);

        const autoSellingBtn = document.getElementById('btn-overlay-auto-selling');
        if (autoSellingBtn) autoSellingBtn.onclick = () => this.manualAutomationTrigger('selling');

        this.renderOverlayDisplayProducts();
        this.startSellingLoop();
    }

    renderOverlayDisplayProducts() {
        const el = document.getElementById('overlay-display-products');
        if (!el) return;
        const products = Object.entries(this.engine.products || {}).map(([key]) => {
            const recipe = (GAME_CONFIG.RECIPES || {})[key] || {};
            const stock = this.engine.getProductStock(key);
            const quality = this.engine.getProductQuality(key);
            const ql = this.engine.getQualityLabel(quality);
            const pm = this.engine.getQualityPriceMultiplier(quality);
            const bp = this.engine.getRecipeBasePrice(key);
            const ep = bp * pm;
            const cost = this.engine.calculateRecipeCost ? this.engine.calculateRecipeCost(key) : 0;
            return `
                <div style="display:flex; align-items:center; gap:8px; padding:8px; margin-bottom:6px; background:rgba(255,255,255,${stock > 0 ? '0.06' : '0.02'}); border-radius:8px; font-size:12px; ${stock === 0 ? 'opacity:0.4;' : ''}">
                    <span style="font-size:18px;">${recipe.icon}</span>
                    <div style="flex:1;">
                        <div>${recipe.name}</div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.5);">cost $${cost.toFixed(2)}</div>
                    </div>
                    <span style="color:#2ecc71; font-weight:600;">$${ep.toFixed(2)}</span>
                    <span style="color:${ql.color};">${ql.emoji}</span>
                    <span style="color:#f39c12;">${stock}x</span>
                </div>
            `;
        });
        el.innerHTML = products.join('') || '<div style="color:rgba(255,255,255,0.4); font-size:12px;">No products to display</div>';
    }

    // ---- DISPLAY MANAGEMENT PANEL ----
    showDisplayPanel() {
        this.openOverlayPanel('🍰 Display Management', `
            <p style="color:rgba(255,255,255,0.6); font-size:13px; margin-bottom:12px;">Your products currently on display:</p>
            <div id="overlay-display-mgmt"></div>
        `);
        const el = document.getElementById('overlay-display-mgmt');
        if (!el) return;
        const products = Object.entries(this.engine.products || {}).filter(([k]) => this.engine.getProductStock(k) > 0);
        if (products.length === 0) {
            el.innerHTML = '<div style="color:rgba(255,255,255,0.4);">No products available. Bake something first!</div>';
            return;
        }
        el.innerHTML = products.map(([key]) => {
            const recipe = (GAME_CONFIG.RECIPES || {})[key] || {};
            const stock = this.engine.getProductStock(key);
            const quality = this.engine.getProductQuality(key);
            const ql = this.engine.getQualityLabel(quality);
            return `<div style="display:flex; align-items:center; gap:10px; padding:8px; background:rgba(255,255,255,0.06); border-radius:8px; margin-bottom:6px; font-size:13px;">
                <span style="font-size:20px;">${recipe.icon}</span>
                <span style="flex:1;">${recipe.name}</span>
                <span style="color:${ql.color};">${ql.emoji} ${quality.toFixed(0)}%</span>
                <span style="color:#f39c12; font-weight:600;">${stock}x</span>
            </div>`;
        }).join('');
    }

    // ---- STORAGE PANEL ----
    showStoragePanel() {
        this.openOverlayPanel('📦 Storage & Inventory', `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div>
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">🧈 Ingredients</h4>
                    <div id="overlay-storage-ingredients"></div>
                </div>
                <div>
                    <h4 style="color:#ffd700; font-family:'Fredoka',cursive; margin-bottom:10px;">🍞 Products</h4>
                    <div id="overlay-storage-products"></div>
                </div>
            </div>
        `);

        // Ingredients
        const ingEl = document.getElementById('overlay-storage-ingredients');
        if (ingEl) {
            const entries = Object.entries(this.engine.ingredients || {}).filter(([k, v]) => {
                const total = v.batches ? v.batches.reduce((s, b) => s + b.quantity, 0) : (v.quantity || 0);
                return total > 0;
            });
            ingEl.innerHTML = entries.length === 0 ? '<div style="color:rgba(255,255,255,0.4); font-size:12px;">Empty</div>' :
                entries.map(([key, v]) => {
                    const total = v.batches ? v.batches.reduce((s, b) => s + b.quantity, 0) : (v.quantity || 0);
                    const ing = (GAME_CONFIG.INGREDIENTS || {})[key] || {};
                    return `<div style="display:flex; justify-content:space-between; padding:6px 0; font-size:12px; border-bottom:1px solid rgba(255,255,255,0.06);">
                        <span>${ing.icon||'🧂'} ${ing.name||key}</span><span style="color:#f39c12;">${total.toFixed(1)} ${ing.unit||''}</span>
                    </div>`;
                }).join('');
        }

        // Products
        const prodEl = document.getElementById('overlay-storage-products');
        if (prodEl) {
            const products = Object.entries(this.engine.products || {}).filter(([k]) => this.engine.getProductStock(k) > 0);
            prodEl.innerHTML = products.length === 0 ? '<div style="color:rgba(255,255,255,0.4); font-size:12px;">No products</div>' :
                products.map(([key]) => {
                    const recipe = (GAME_CONFIG.RECIPES || {})[key] || {};
                    const stock = this.engine.getProductStock(key);
                    return `<div style="display:flex; justify-content:space-between; padding:6px 0; font-size:12px; border-bottom:1px solid rgba(255,255,255,0.06);">
                        <span>${recipe.icon} ${recipe.name}</span><span style="color:#2ecc71;">${stock}x</span>
                    </div>`;
                }).join('');
        }
    }

    // ---- RECORDS PANEL ----
    showRecordsPanel() {
        if (this.customerDB) {
            this.showCustomerDatabase();
        } else {
            this.openOverlayPanel('📋 Customer Records', '<div style="color:rgba(255,255,255,0.5);">Customer database not available.</div>');
        }
    }

    // ---- RECIPES PANEL ----
    showRecipesPanel() {
        const recipes = GAME_CONFIG.RECIPES || {};
        let html = '<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px;">';
        html += Object.entries(recipes).map(([key, r]) => {
            const cost = this.engine.calculateProductCost(key);
            const price = this.engine.getRecipeBasePrice(key);
            const ings = r.ingredients ? Object.entries(r.ingredients).map(([ik, amt]) => {
                const ing = (GAME_CONFIG.INGREDIENTS || {})[ik] || {};
                return `${ing.icon||''} ${ing.name||ik}: ${amt}`;
            }).join(', ') : '';
            return `
                <div style="background:rgba(255,255,255,0.06); border-radius:10px; padding:12px;">
                    <div style="font-size:24px; float:left; margin-right:10px;">${r.icon}</div>
                    <div style="font-weight:600; font-size:14px;">${r.name}</div>
                    <div style="font-size:11px; color:rgba(255,255,255,0.5); margin-top:4px;">${ings}</div>
                    <div style="font-size:12px; margin-top:6px;">
                        Cost: <strong style="color:#f39c12;">$${cost.toFixed(2)}</strong>
                        → Sells: <strong style="color:#2ecc71;">$${price.toFixed(2)}</strong>
                    </div>
                    <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-top:2px;">
                        ⏱️ ${r.bakeTime}min | 📅 Fresh ${r.shelfLife}d | Cap: ${r.batchSize||1}/batch
                    </div>
                </div>
            `;
        }).join('');

        if (this.customRecipes.length > 0) {
            html += this.customRecipes.map(entry => {
                const recipe = GAME_CONFIG.RECIPES?.[entry.key] || {};
                const cost = this.engine.calculateProductCost(entry.key);
                const price = this.engine.getRecipeBasePrice(entry.key);
                const ings = recipe.ingredients ? Object.entries(recipe.ingredients).map(([ik, amt]) => {
                    const ing = (GAME_CONFIG.INGREDIENTS || {})[ik] || {};
                    return `${ing.icon || ''} ${ing.name || ik}: ${amt}`;
                }).join(', ') : '';

                return `
                    <div style="background:rgba(255,215,102,0.08); border:1px solid rgba(255,215,102,0.28); border-radius:10px; padding:12px;">
                        <div style="font-size:24px; float:left; margin-right:10px;">${entry.icon || '🧁'}</div>
                        <div style="font-weight:600; font-size:14px;">${entry.name}</div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.55); margin-top:4px;">${ings || 'Custom signature blend'}</div>
                        <div style="font-size:12px; margin-top:6px;">
                            Cost: <strong style="color:#f39c12;">$${cost.toFixed(2)}</strong>
                            → Sells: <strong style="color:#2ecc71;">$${price.toFixed(2)}</strong>
                        </div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.45); margin-top:2px;">
                            ⭐ Custom recipe
                        </div>
                    </div>
                `;
            }).join('');
        }

        html += `
            <button id="overlay-create-recipe-tile" type="button" style="
                background:linear-gradient(135deg, rgba(255,214,102,0.14), rgba(255,255,255,0.06));
                border:1px dashed rgba(255,214,102,0.5);
                border-radius:10px;
                padding:12px;
                color:#fff;
                text-align:left;
                cursor:pointer;
                min-height:120px;
                transition:transform 0.15s ease, border-color 0.15s ease;
            ">
                <div style="font-size:26px; margin-bottom:4px;">➕</div>
                <div style="font-weight:700; font-size:14px;">Create New Recipe</div>
                <div style="font-size:11px; color:rgba(255,255,255,0.65); margin-top:4px;">Open Recipe Lab and start a new draft</div>
            </button>
        `;

        html += '</div>';
        this.openOverlayPanel('📖 Recipe Book', html);

        const createTile = document.getElementById('overlay-create-recipe-tile');
        if (createTile) {
            createTile.onclick = () => {
                this.closeOverlayPanel();
                this.goToPhase('recipes');
            };
        }
    }

    // ---- SUMMARY OVERLAY (End of Day) ----
    showSummaryOverlay() {
        this.stopBakingLoop();
        this.stopSellingLoop();

        this.economy.simulateDay(this.engine.day);
        if (this.customerDB) this.customerDB.endDay();
        const summary = this.engine.endDay();
        this.purgeExpiredScenarioEffects();

        this.economy.recordBusinessMetrics({
            revenue: summary.revenue,
            costs: summary.cogs + summary.expenses,
            profit: summary.netProfit,
            cash: summary.cashEnd
        });

        // Spoilage
        let spoilageHtml = '';
        if (summary.spoiledIngredients && summary.spoiledIngredients.length > 0) {
            spoilageHtml = `<div style="background:rgba(231,76,60,0.1); border-radius:8px; padding:10px; margin-bottom:12px;">
                <strong style="color:#e74c3c;">🦠 Spoiled Overnight</strong><br>
                ${summary.spoiledIngredients.map(s => `<span style="font-size:12px;">❌ ${s.quantity.toFixed(1)} ${s.name}</span>`).join('<br>')}
            </div>`;
        }
        let staleHtml = '';
        if (summary.staleProducts && summary.staleProducts.length > 0) {
            staleHtml = `<div style="background:rgba(243,156,18,0.1); border-radius:8px; padding:10px; margin-bottom:12px;">
                <strong style="color:#f39c12;">📉 Products Losing Freshness</strong><br>
                ${summary.staleProducts.map(s => `<span style="font-size:12px;">⚠️ ${s.quantity}x ${s.name} → ${s.quality.toFixed(0)}% quality</span>`).join('<br>')}
            </div>`;
        }

        const bodyHtml = `
            <div style="text-align:center; margin-bottom:16px;">
                <div style="font-size:36px;">📊</div>
                <h3 style="font-family:'Fredoka',cursive; color:#ffd700;">Day ${summary.day} Summary</h3>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:16px;">
                <div style="background:rgba(46,204,113,0.12); border-radius:10px; padding:14px; text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.5);">Revenue</div>
                    <div style="font-size:20px; font-weight:700; color:#2ecc71;">$${summary.revenue.toFixed(2)}</div>
                </div>
                <div style="background:rgba(231,76,60,0.12); border-radius:10px; padding:14px; text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.5);">Cost of Goods</div>
                    <div style="font-size:20px; font-weight:700; color:#e74c3c;">-$${summary.cogs.toFixed(2)}</div>
                </div>
                <div style="background:rgba(255,215,0,0.12); border-radius:10px; padding:14px; text-align:center;">
                    <div style="font-size:11px; color:rgba(255,255,255,0.5);">Gross Profit</div>
                    <div style="font-size:20px; font-weight:700; color:${summary.grossProfit >= 0 ? '#2ecc71' : '#e74c3c'};">$${summary.grossProfit.toFixed(2)}</div>
                </div>
            </div>
            ${spoilageHtml}${staleHtml}
            <div style="background:rgba(255,255,255,0.05); border-radius:10px; padding:12px; margin-bottom:12px;">
                <h4 style="color:#ffd700; margin-bottom:8px;">💸 Expenses</h4>
                ${summary.expenseDetails.map(e => `<div style="display:flex; justify-content:space-between; font-size:12px; padding:3px 0;">${e.icon} ${e.name}<span>-$${e.amount.toFixed(2)}</span></div>`).join('')}
                <div style="display:flex; justify-content:space-between; font-weight:700; margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.1);">Total<span>-$${summary.expenses.toFixed(2)}</span></div>
            </div>
            <div style="text-align:center; padding:14px; border-radius:10px; background:${summary.netProfit >= 0 ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)'}; margin-bottom:12px;">
                <div style="font-size:12px; color:rgba(255,255,255,0.5);">NET PROFIT</div>
                <div style="font-size:28px; font-weight:700; color:${summary.netProfit >= 0 ? '#2ecc71' : '#e74c3c'};">$${summary.netProfit.toFixed(2)}</div>
            </div>
            <div style="text-align:center; font-size:13px; color:rgba(255,255,255,0.6); margin-bottom:16px;">
                Cash: <strong>$${summary.cashEnd.toFixed(2)}</strong> | Customers: ${summary.customersServed} served, ${summary.customersMissed} missed
            </div>
            <div style="display:flex; gap:12px; justify-content:center;">
                <button style="padding:10px 20px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:8px; color:white; cursor:pointer; font-size:14px;" onclick="window.game.closeOverlayPanel(); window.game.showMainMenu();">🏠 Main Menu</button>
                <button style="padding:10px 24px; background:#e67e22; border:none; border-radius:8px; color:white; cursor:pointer; font-size:14px; font-weight:600;" onclick="window.game.closeOverlayPanel(); window.game.startDay();">☀️ Start Day ${this.engine.day}</button>
            </div>
        `;
        this.openOverlayPanel('📊 End of Day', bodyHtml);

        // Save
        localStorage.setItem('bakery_save', JSON.stringify(this.engine.save()));

        // Bankruptcy check
        if (summary.cashEnd < 0) {
            setTimeout(() => {
                this.showPopup({
                    icon: '💸', title: 'Bankruptcy!',
                    message: 'You have run out of money. Game Over!',
                    type: 'danger',
                    buttons: [{ text: 'Try Again', action: () => { this.closeOverlayPanel(); this.startNewGame(); } }]
                });
            }, 1000);
        }
    }

    // ==================== DAY FLOW ====================
    startDay() {
        this.phaseIndex = 0;
        this.engine.isPaused = true;
        this.engine.hour = GAME_CONFIG.TIME.OPENING_HOUR;
        this.engine.minute = 0;
        this.applyDailyComplexityProfile(this.engine.day);

        // Start customer database day
        if (this.customerDB) {
            this.customerDB.startDay();
        }

        const complexity = this.dayComplexityProfile || this.getComplexityProfile(this.engine.day);

        this.showPopup({
            icon: '🌅',
            title: `Day ${this.engine.day} Begins!`,
            message: `Good morning, baker! Time to start your day.\n\nCurrent Cash: $${this.engine.cash.toFixed(2)}\nComplexity: ${complexity.tier} (${Math.min(30, this.engine.day)}/30)\nDemand Pressure: ${(complexity.customerDemandMultiplier * 100).toFixed(0)}%`,
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

        // Clean up bakery environment if leaving it
        if (phase !== 'hub') {
            document.body.classList.remove('in-bakery-env');
            const hud = document.getElementById('bakery-hud');
            if (hud) hud.style.display = 'none';
            if (this._hudInterval) { clearInterval(this._hudInterval); this._hudInterval = null; }
            this.cleanupPhaser();
        }

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
        // Phase 1: Cash flow consequence - check if player has enough cash
        const minCashRequired = 50; // Minimum cash to operate
        if (this.engine.cash < minCashRequired) {
            this.showPopup({
                icon: '💰',
                title: 'Insufficient Funds',
                message: `You need at least $${minCashRequired} to buy ingredients. Current cash: $${this.engine.cash.toFixed(2)}. You cannot open today.`,
                type: 'error',
                buttons: [
                    { 
                        text: 'Skip to Next Day', 
                        action: () => {
                            this.skipDayDueToCash();
                        }
                    }
                ]
            });
            return;
        }

        // Warn if cash is low
        const cashRunway = this.engine.getCashRunwayDays();
        if (cashRunway <= 3 && cashRunway > 0) {
            this.notificationSystem.warning(`⚠️ Low cash warning: Only ${cashRunway} days of runway remaining!`);
        }

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
                if (result.item?.assignedEmployee) {
                    this.emitStaffRoute(result.item.assignedEmployee, 'prep', {
                        context: 'production',
                        recipe: recipe?.name || recipeKey,
                        holdMs: 2600
                    });
                }
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
        if (this.bakingLoopId) return; // prevent double loops
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
                // Also update overlay-specific elements if present
                this.renderOverlayProductionQueue();
                this.renderOverlayReadyProducts();
                this.renderOverlayRecipes();
                const overlayBakingList = document.getElementById('overlay-employee-list-baking');
                if (overlayBakingList) overlayBakingList.innerHTML = this.renderEmployeePanel();
            } else if (this.engine.productionQueue.length > 0) {
                this.renderProductionQueue();
                this.renderOverlayProductionQueue();
                const overlayBakingList = document.getElementById('overlay-employee-list-baking');
                if (overlayBakingList) overlayBakingList.innerHTML = this.renderEmployeePanel();
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
                    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <label style="display: flex; align-items: center; gap: 10px; font-size: 14px;">
                            <span style="font-weight: bold;">Markup %:</span>
                            <input type="range" id="markup-slider" min="0" max="500" value="${this.engine.markupPercentage || 100}" 
                                   style="flex: 1;" oninput="window.game.updateMarkup(this.value)">
                            <input type="number" id="markup-input" min="0" max="500" value="${this.engine.markupPercentage || 100}" 
                                   style="width: 70px; padding: 4px;" oninput="window.game.updateMarkup(this.value)">
                            <span style="color: #7f8c8d; font-size: 12px;">(Sell price = Cost × ${1 + (this.engine.markupPercentage || 100) / 100})</span>
                        </label>
                    </div>
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
        const roster = this.staffManager
            ? this.staffManager.getAllStaff()
            : (this.engine.staff || []);

        if (roster.length === 0) {
            return '<div class="no-employees">Solo operation - you handle all customers!</div>';
        }

        return roster.map(employee => {
            const servingCustomer = employee.currentCustomer || null;
            const taskInfo = servingCustomer
                ? `Serving ${servingCustomer.name} ${servingCustomer.face}`
                : employee.currentTask
                    ? `${employee.currentTask.type} task`
                    : 'Ready to serve';
            const skillDisplay = Number.isFinite(employee.skillLevel)
                ? employee.skillLevel
                : Number.isFinite(employee.skill)
                    ? employee.skill / 20
                    : 3;
            const happiness = Number.isFinite(employee.happiness) ? employee.happiness : 100;
            const fatigue = Number.isFinite(employee.fatigue) ? employee.fatigue : 0;

            return `
                <div class="employee-card-selling">
                    <div class="employee-header">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 20px;">${employee.face}</span>
                            <span class="employee-name">${employee.name}</span>
                        </div>
                        <span class="employee-skill">⭐${skillDisplay.toFixed(1)}</span>
                    </div>
                    <div class="employee-status">
                        <div class="status-value">${taskInfo}</div>
                    </div>
                    <div class="employee-stats-mini">
                        <div class="stat-mini">
                            <span>😊${happiness.toFixed(0)}</span>
                            <span>😴${fatigue.toFixed(0)}</span>
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
                const basePrice = this.engine.getRecipeBasePrice(key);
                const effectivePrice = basePrice * priceMultiplier;
                const cost = this.engine.calculateRecipeCost(key);

                return `
                    <div class="display-item ${stock === 0 ? 'sold-out' : ''}">
                        <div class="display-icon">${recipe.icon}</div>
                        <div class="display-name">${recipe.name}</div>
                        <div class="display-price" title="Cost: $${cost.toFixed(2)} | Base: $${basePrice.toFixed(2)}">
                            $${effectivePrice.toFixed(2)}
                            <span style="font-size: 10px; color: #7f8c8d; display: block;">cost: $${cost.toFixed(2)}</span>
                        </div>
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

    emitStaffRoute(staff, station, detail = {}) {
        if (!staff) return;
        window.dispatchEvent(new CustomEvent('bakery:staff-route', {
            detail: {
                staffId: staff.id,
                staffName: staff.name,
                face: staff.face || '🧑‍🍳',
                role: staff.role || 'server',
                station,
                ...detail
            }
        }));
    }

    updateFlowSatisfaction(score) {
        const clamped = Math.max(0, Math.min(100, Number(score) || 0));
        const smooth = this.customerFlowSignals.rollingSatisfaction * 0.9 + clamped * 0.1;
        this.customerFlowSignals.rollingSatisfaction = smooth;
        this.customerFlowSignals.throughputMultiplier = Math.max(0.5, Math.min(1.35, 0.75 + (smooth / 100) * 0.65));
    }

    getCustomerMoodLabel(mood) {
        if (mood >= 75) return 'Excited';
        if (mood >= 55) return 'Neutral';
        if (mood >= 35) return 'Impatient';
        return 'Frustrated';
    }

    createCustomerCart(availableItems, customerMood, segment, customerPreferences = null, budgetCap = null, primaryItem = null) {
        if (!Array.isArray(availableItems) || availableItems.length === 0) return [];

        const aestheticBoost = Math.max(0.75, Math.min(1.35, this.engine.getMenuAppealMultiplier ? this.engine.getMenuAppealMultiplier() : 1));
        const segmentBoost = segment?.icon === '⭐' ? 1 : 0;
        const preferredCount = Math.max(1, Math.min(4, Math.round(1 + (aestheticBoost - 0.75) * 2 + segmentBoost + Math.random() * 1.4)));

        const pool = [...availableItems].sort(() => Math.random() - 0.5);
        const selectedSet = new Set(pool.slice(0, Math.min(preferredCount, pool.length)));
        if (primaryItem && availableItems.includes(primaryItem)) {
            selectedSet.add(primaryItem);
        }

        const draftedCart = Array.from(selectedSet).map(itemKey => {
            const stock = this.engine.getProductStock(itemKey);
            const quality = this.engine.getProductQuality(itemKey);
            const qualityMult = this.engine.getQualityPriceMultiplier(quality);
            const unitPrice = this.engine.getRecipeBasePrice(itemKey) * qualityMult;

            const baseQty = 1 + Math.floor(Math.random() * 2);
            const quantitySegmentBoost = segment?.icon === '⭐' ? 1 : 0;
            const quantity = Math.max(1, Math.min(stock, baseQty + quantitySegmentBoost));

            return {
                recipeKey: itemKey,
                quantity,
                unitPrice,
                quality
            };
        }).filter(line => line.quantity > 0);

        if (!Number.isFinite(budgetCap) || budgetCap <= 0) {
            return draftedCart;
        }

        let remainingBudget = budgetCap;
        const affordableCart = [];
        const prioritized = [...draftedCart].sort((a, b) => {
            if (a.recipeKey === primaryItem) return -1;
            if (b.recipeKey === primaryItem) return 1;
            return a.unitPrice - b.unitPrice;
        });

        prioritized.forEach(line => {
            if (remainingBudget < line.unitPrice) return;
            const maxQtyByBudget = Math.floor(remainingBudget / line.unitPrice);
            const finalQty = Math.max(0, Math.min(line.quantity, maxQtyByBudget));
            if (finalQty <= 0) return;

            affordableCart.push({
                ...line,
                quantity: finalQty
            });
            remainingBudget -= finalQty * line.unitPrice;
        });

        return affordableCart;
    }

    summarizeCart(cart) {
        return cart.map(line => {
            const recipe = GAME_CONFIG.RECIPES[line.recipeKey];
            return `${recipe?.icon || '🥐'} ${line.quantity}x ${recipe?.name || line.recipeKey}`;
        }).join(', ');
    }

    /**
     * Serve customer - always via staff assignment
     */
    async manualServeCustomer(customerId) {
        const customer = this.getCustomerById(customerId);
        if (!customer) return;

        customer.requiresManualService = false;
        this.planCustomerService(customer);
    }

    /**
     * Assign a staff member to serve a customer
     */
    assignStaffToCustomer(customerId) {
        const customer = this.getCustomerById(customerId);
        if (!customer) return;

        const selectElement = document.getElementById(`staff-select-${customerId}`);
        if (!selectElement || !selectElement.value) {
            if (this.notificationSystem) {
                this.notificationSystem.warning('Please select a staff member first');
            }
            return;
        }

        const staffId = selectElement.value;
        const staff = this.staffManager ? this.staffManager.getStaff(staffId) : null;

        if (!staff) {
            if (this.notificationSystem) {
                this.notificationSystem.error('Staff member not found');
            }
            return;
        }

        // Check if staff is available
        if (!this.staffManager.isStaffAvailable(staff)) {
            if (this.notificationSystem) {
                this.notificationSystem.warning(`${staff.name} is currently busy`);
            }
            return;
        }

        // Create a task for this customer interaction
        const task = this.staffManager.createTask('customer', {
            customerId: customer.id,
            customerName: customer.name,
            wantsItem: customer.wantsItem,
            priority: 'normal'
        });

        // Assign the task
        const result = this.staffManager.assignTask(staff, task);

        if (result.success) {
            customer.assignedStaff = staff;
            customer.requiresManualService = false;
            customer.serviceDuration = task.estimatedTime * 1000;

            if (this.notificationSystem) {
                this.notificationSystem.success(`${staff.name} is now serving ${customer.name}`, {
                    icon: '👔',
                    title: 'Staff Assigned'
                });
            }

            // Start auto-service for this customer
            this.startStaffAutoService(customer, staff, task);
            this.renderCustomerArea();
        } else {
            if (this.notificationSystem) {
                this.notificationSystem.error(result.reason || 'Could not assign staff');
            }
        }
    }

    /**
     * Handle staff auto-service of customer
     */
    startStaffAutoService(customer, staff, task) {
        const duration = task.estimatedTime * 1000;
        const startTime = Date.now();

        // Update progress periodically
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(100, (elapsed / duration) * 100);

            const progressFill = document.querySelector(`[data-customer-id="${customer.id}"] .service-progress-fill`);
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }

            if (progress >= 100) {
                clearInterval(progressInterval);
            }
        }, 100);

        // Complete after duration
        setTimeout(() => {
            clearInterval(progressInterval);

            // Complete the task
            if (this.staffManager) {
                this.staffManager.completeTask(task.id, { success: true });
            }

            // Apply fatigue pressure from current complexity profile
            const complexity = this.dayComplexityProfile || this.getComplexityProfile(this.engine?.day || 1);
            const fatigueGain = Math.max(0.6, 1.1 * (complexity.fatiguePressure || 1));
            staff.fatigue = Math.min(100, (staff.fatigue || 0) + fatigueGain);
            staff.happiness = Math.max(0, (staff.happiness || 100) - (fatigueGain * 0.2));

            // Process the sale
            this.completeCustomerSale({ customer, auto: true });

            // Notify
            if (this.notificationSystem) {
                this.notificationSystem.success(`${staff.name} completed serving ${customer.name}`, {
                    icon: '✅',
                    title: 'Service Complete'
                });
            }
        }, duration);
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
        const overlayContainer = document.getElementById('overlay-customer-area');
        const overlayEmployeeList = document.getElementById('overlay-employee-list-selling');

        const html = (!this.activeCustomers || this.activeCustomers.length === 0)
            ? '<div class="waiting-message">Waiting for customers...</div>'
            : this.activeCustomers.map(customer => this.renderCustomerCard(customer)).join('');

        if (container) container.innerHTML = html;
        if (overlayContainer) overlayContainer.innerHTML = html;
        if (overlayEmployeeList) overlayEmployeeList.innerHTML = this.renderEmployeeSelling();
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

        const waitPct = Math.max(0, Math.min(100, ((customer.satisfactionNow || 0) / 100) * 100));
        const staffLabel = customer.assignedStaff
            ? `${customer.assignedStaff.face || '👨‍🍳'} ${customer.assignedStaff.name} is checking out`
            : 'Waiting for available checkout staff';
        const etaSeconds = Math.max(1, Math.round(((customer.serviceDuration || 2000) / 1000)));
        const showProgress = !!customer.serviceDuration;
        const cartLines = (customer.shoppingCart || []).map(line => {
            const item = GAME_CONFIG.RECIPES[line.recipeKey];
            return `<div style="display:flex; justify-content:space-between; gap:8px;"><span>${item?.icon || '🥐'} ${line.quantity}x ${item?.name || line.recipeKey}</span><strong>$${(line.unitPrice * line.quantity).toFixed(2)}</strong></div>`;
        }).join('');
        const moodLabel = this.getCustomerMoodLabel(customer.satisfactionNow || customer.currentMood || 50);

        return `
            <div class="customer-popup" data-customer-id="${customer.id}">
                <div class="customer-face" style="font-size: 64px;">${baseFace}</div>
                <div class="customer-name">
                    ${baseName}
                    ${segmentIcon ? `<span class="customer-segment" title="${segmentDesc}">${segmentIcon}</span>` : ''}
                </div>
                <div class="customer-dialogue">"${customer.greeting || 'Hello!'}"</div>
                <div class="customer-order">"${orderLine}"</div>
                <div style="background:rgba(255,255,255,0.12); border-radius:16px; padding:10px 12px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.25);">
                    <div style="font-size:11px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.8; margin-bottom:6px;">💬 Cart Bubble</div>
                    <div style="font-size:12px; display:flex; flex-direction:column; gap:4px;">${cartLines}</div>
                    <div style="margin-top:7px; font-size:12px; text-align:right; color:#ffd700; font-weight:700;">Total: $${(customer.cartTotal || 0).toFixed(2)}</div>
                </div>
                <div class="auto-service">
                    <div class="service-status">${staffLabel}${showProgress ? ` • ~${etaSeconds}s` : ''}</div>
                    ${showProgress ? `
                        <div class="service-progress">
                            <div class="service-progress-fill" style="width: 0%;"></div>
                        </div>
                    ` : ''}
                    <div style="margin-top:8px; font-size:11px; color:rgba(255,255,255,0.8); display:flex; justify-content:space-between;">
                        <span>Mood: ${moodLabel}</span>
                        <span>Satisfaction ${Math.round(waitPct)}%</span>
                    </div>
                    <div class="service-progress" style="height:6px; margin-top:6px;">
                        <div class="service-progress-fill" style="width:${waitPct}%; background:${waitPct > 65 ? '#2ecc71' : waitPct > 40 ? '#f39c12' : '#e74c3c'};"></div>
                    </div>
                </div>
            </div>
        `;
    }

    resumeWaitingCustomers() {
        if (!this.automationEnabled || !Array.isArray(this.activeCustomers) || this.activeCustomers.length === 0) return;
        const waiting = this.activeCustomers.filter(customer => customer.state === 'waiting' && !customer.assignedStaff);
        if (waiting.length === 0) return;

        waiting.forEach(customer => this.planCustomerService(customer, { silent: true }));
    }

    startSellingLoop() {
        if (this.sellingLoopId) return; // prevent double loops
        let lastTime = performance.now();
        this.lastCustomerTime = lastTime;

        this.purgeExpiredScenarioEffects();
        this.checkForScenarios();

        const loop = () => {
            const now = performance.now();
            const delta = now - lastTime;
            lastTime = now;

            // Update time
            this.engine.update(delta);

            // Update time display (both old and overlay)
            const timeEl = document.getElementById('game-time');
            if (timeEl) timeEl.textContent = this.engine.getTimeString();
            const oTimeEl = document.getElementById('overlay-sell-time');
            if (oTimeEl) oTimeEl.textContent = this.engine.getTimeString();

            // Also update HUD time
            const hudTime = document.getElementById('hud-time');
            if (hudTime) hudTime.textContent = this.engine.getTimeString();

            // Check closing time
            if (this.engine.isClosingTime()) {
                this.stopSellingLoop();
                // If overlay panel is open, close it first
                this.closeOverlayPanel();
                // In bakery-env mode, show summary overlay instead of popup
                if (document.body.classList.contains('in-bakery-env')) {
                    this.showSummaryOverlay();
                } else {
                    this.showPopup({
                        icon: '🌙',
                        title: 'Closing Time!',
                        message: 'The shop is now closed for the day.',
                        type: 'info',
                        buttons: [{ text: 'Return to Hub', action: () => this.showModeHub() }]
                    });
                }
                return;
            }

            // Spawn customers while capacity allows
            if (!this.crisisActive && this.activeCustomers.length < this.getCustomerCapacity()) {
                const timeSinceLastCustomer = now - this.lastCustomerTime;
                const hourMult = GAME_CONFIG.DEMAND.hourlyMultiplier[Math.floor(this.engine.hour)] || 0.5;
                const appealMult = this.engine.getMenuAppealMultiplier ? this.engine.getMenuAppealMultiplier() : 1;
                const scenarioDemand = this.getScenarioModifier('demand');
                const scenarioTraffic = this.getScenarioModifier('traffic');
                const loyaltyBoost = 1 + this.getScenarioModifier('loyalty', { defaultValue: 0, operation: 'add' });
                const complexity = this.dayComplexityProfile || this.getComplexityProfile(this.engine.day);
                const volatilityNoise = 1 + ((Math.random() - 0.5) * 0.08 * complexity.worldVolatility);
                const trafficEffect = Math.max(0.45, Math.min(2.2, this.engine.trafficMultiplier || 1));
                const satisfactionDemand = Math.max(0.55, Math.min(1.35, this.customerFlowSignals.throughputMultiplier || 1));
                const spawnChance = (GAME_CONFIG.DEMAND.baseCustomersPerHour * hourMult * appealMult * scenarioDemand * scenarioTraffic * trafficEffect * satisfactionDemand * loyaltyBoost * complexity.customerDemandMultiplier * volatilityNoise) / 60 / 10;

                if (timeSinceLastCustomer > 2000 && Math.random() < spawnChance) {
                    this.spawnCustomer();
                    this.lastCustomerTime = now;
                }
            }

            const complexity = this.dayComplexityProfile || this.getComplexityProfile(this.engine.day);
            if (!this.crisisActive && now - this.lastCrisisRollAt > 30000) {
                this.lastCrisisRollAt = now;
                const rollPerWindow = complexity.crisisChancePerMinute * 0.5;
                if (Math.random() < rollPerWindow) this.triggerCrisis();
            }

            this.processAutoCustomers(now);

            if (now - this.lastCustomerFlowTick > 300) {
                this.lastCustomerFlowTick = now;
                const queued = (this.activeCustomers || []).filter(c => c && c.state === 'waiting' && !c.assignedStaff);
                queued.forEach(customer => {
                    const waited = Math.max(0, now - (customer.queueStartedAt || now));
                    const maxWait = Math.max(4000, customer.maxWaitMs || 20000);
                    const pressure = Math.max(0, Math.min(1, waited / maxWait));
                    customer.waitPressure = pressure;
                    customer.satisfactionNow = Math.max(0, (customer.satisfactionNow || 75) - (0.55 + pressure * 0.85));

                    if (customer.satisfactionNow <= 6) {
                        customer.resultFace = '😠';
                        customer.resultMessage = 'Queue is too long. I am leaving.';
                        customer.state = 'sad';
                        this.engine.missedCustomer();
                        this.customerFlowSignals.recentWalkouts++;
                        this.updateFlowSatisfaction(24);
                        this.removeCustomer(customer);
                        return;
                    }

                    if (waited > 1200 && !customer.assignedStaff) {
                        this.planCustomerService(customer, { silent: true });
                    }
                });
                this.renderCustomerArea();
            }

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
        // Use customer database if available
        let customerData = null;
        if (this.customerDB) {
            const dailyCustomers = this.customerDB.generateDailyCustomers(1);
            if (dailyCustomers && dailyCustomers.length > 0) {
                customerData = dailyCustomers[0];
            }
        }
        
        // Fallback to old system
        if (!customerData) {
            const customer = GAME_CONFIG.CUSTOMERS[Math.floor(Math.random() * GAME_CONFIG.CUSTOMERS.length)];
            const segment = this.engine.selectCustomerSegment();
            customerData = { ...customer, segment };
        }
        
        const segment = customerData.segment ? 
            (typeof customerData.segment === 'string' ? GAME_CONFIG.CUSTOMER_SEGMENTS[customerData.segment] : customerData.segment) :
            this.engine.selectCustomerSegment();
            
        const greetings = GAME_CONFIG.CUSTOMER_DIALOGUES.greeting;
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];

        // Get customer mood for preference filtering
        const customerMood = customerData.currentMood || 50;
        const customerPreferences = customerData.preferences || null;

        // Find available products that this customer segment is willing to buy
        const available = Object.entries(this.engine.products)
            .filter(([key]) => {
                if (this.engine.getProductStock(key) <= 0) return false;

                // Demand check based on current price and customer mood
                const recipe = GAME_CONFIG.RECIPES[key];
                const quality = this.engine.getProductQuality(key);
                const priceMultiplier = this.engine.getQualityPriceMultiplier(quality);
                const currentPrice = this.engine.getRecipeBasePrice(key) * priceMultiplier;

                return this.engine.willCustomerBuy(key, segment, currentPrice, customerMood, customerPreferences);
            })
            .map(([key]) => key);

        // Check customer's favorite items if from database
        let wantsItem = null;
        if (customerData.favoriteItems && customerData.favoriteItems.length > 0) {
            const favoritesAvailable = customerData.favoriteItems
                .filter(fav => available.includes(fav.item))
                .sort((a, b) => b.count - a.count);
            if (favoritesAvailable.length > 0 && Math.random() < 0.7) {
                wantsItem = favoritesAvailable[0].item;
            }
        }
        
        if (!wantsItem && available.length > 0) {
            const toppingFriendly = this.engine.getToppingScore
                ? available.filter(key => this.engine.getToppingScore(key) > 0)
                : [];
            const appeal = this.engine.getMenuAppealMultiplier ? this.engine.getMenuAppealMultiplier() : 1;
            if (toppingFriendly.length > 0 && Math.random() < Math.min(0.8, Math.max(0, appeal - 0.8))) {
                wantsItem = toppingFriendly[Math.floor(Math.random() * toppingFriendly.length)];
            } else {
                wantsItem = available[Math.floor(Math.random() * available.length)];
            }
        } else if (!wantsItem) {
            // Check if we have stock at all
            const anyStock = Object.keys(this.engine.products).some(k => this.engine.getProductStock(k) > 0);
            if (anyStock) {
                const allStock = Object.entries(this.engine.products)
                    .filter(([k]) => this.engine.getProductStock(k) > 0)
                    .map(([k]) => k);
                if (allStock.length > 0) wantsItem = allStock[Math.floor(Math.random() * allStock.length)];
            }
        }

        if (!wantsItem) {
            const sadDialogue = GAME_CONFIG.CUSTOMER_DIALOGUES.sad;
            const message = sadDialogue[Math.floor(Math.random() * sadDialogue.length)];

            const sadHtml = `
                <div class="customer-popup">
                    <div class="customer-face" style="font-size: 64px;">${customerData.face || '🙂'}</div>
                    <div class="customer-name">${customerData.name || 'Customer'}</div>
                    <div class="customer-dialogue">"${message}"</div>
                    <div class="customer-mood">😢 Disappointed</div>
                </div>
            `;

            const customerArea = document.getElementById('customer-area');
            if (customerArea) customerArea.innerHTML = sadHtml;
            const overlayCustomerArea = document.getElementById('overlay-customer-area');
            if (overlayCustomerArea) overlayCustomerArea.innerHTML = sadHtml;

            window.dispatchEvent(new CustomEvent('bakery:customer-expression', {
                detail: { emoji: '😢', message, tone: 'sad' }
            }));

            this.engine.missedCustomer();
            
            // Phase 1: Pricing elasticity consequence
            // Track if customer left due to price vs. stockout
            const hasAnyStock = Object.keys(this.engine.products).some(k => this.engine.getProductStock(k) > 0);
            if (hasAnyStock && available.length === 0) {
                // Customer left because prices are too high!
                this.priceRelatedMisses = (this.priceRelatedMisses || 0) + 1;
                
                // After 3 price-related misses, warn the player
                if (this.priceRelatedMisses >= 3) {
                    this.notificationSystem.warning('💸 Customers are leaving because prices are too high!');
                    this.priceRelatedMisses = 0; // Reset counter
                }
            }

            setTimeout(() => {
                const waitHtml = '<div class="waiting-message">Waiting for customers...</div>';
                if (customerArea) customerArea.innerHTML = waitHtml;
                if (overlayCustomerArea) overlayCustomerArea.innerHTML = waitHtml;
            }, 2000);

            return;
        }

        const orderDialogues = GAME_CONFIG.CUSTOMER_DIALOGUES.ordering;
        const orderMsg = orderDialogues[Math.floor(Math.random() * orderDialogues.length)]
            .replace('{item}', GAME_CONFIG.RECIPES[wantsItem]?.name || wantsItem);

        const budgetCap = Number(customerData?.willingnessToPay?.base) || Number(customerData?.willingnessToPay?.priceRange?.[1]) || null;
        const cart = this.createCustomerCart(available, customerMood, segment, customerPreferences, budgetCap, wantsItem);
        if (!cart.length) {
            this.engine.missedCustomer();
            this.customerFlowSignals.recentWalkouts++;
            this.updateFlowSatisfaction(Math.max(20, this.customerFlowSignals.rollingSatisfaction - 12));
            return;
        }

        const cartTotal = cart.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0);
        const interiorAppeal = this.engine.getMenuAppealMultiplier ? this.engine.getMenuAppealMultiplier() : 1;
        const queuePatienceSeconds = Math.max(12, Math.round(26 + (customerMood / 8) + interiorAppeal * 4));

        // Create enhanced customer object with all database properties
        const newCustomer = {
            id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            face: customerData.face || '🙂',
            name: customerData.name || 'Customer',
            dbId: customerData.id, // Link to database
            segment,
            greeting,
            wantsItem,
            orderMessage: orderMsg,
            state: 'waiting',
            assignedStaff: null,
            requiresManualService: false,
            checkoutState: 'queued',
            shoppingCart: cart,
            cartTotal,
            cartSummary: this.summarizeCart(cart),
            queueStartedAt: performance.now(),
            maxWaitMs: queuePatienceSeconds * 1000,
            satisfactionNow: Math.max(35, Math.min(100, customerData.satisfaction || 74)),
            waitPressure: 0,
            checkoutBubble: true,
            
            // Add full customer database properties for CustomerInteractionScene
            ageGroup: customerData.ageGroup || '26-35',
            personality: customerData.personality || {
                patience: 50,
                chattiness: 50,
                impulsiveness: 50,
                flexibility: 50,
                moodiness: 50
            },
            currentMood: customerData.currentMood || 50,
            favoriteItems: customerData.favoriteItems || [],
            externalFactors: customerData.externalFactors || {
                weatherSensitivity: 50,
                timeOfDaySensitivity: 50,
                economicSensitivity: 50
            },
            visits: customerData.visits || 0,
            satisfaction: customerData.satisfaction || 75
        };

        this.activeCustomers.push(newCustomer);
        window.dispatchEvent(new CustomEvent('bakery:customer-expression', {
            detail: {
                emoji: customerData.face || '🙂',
                message: orderMsg,
                tone: 'neutral'
            }
        }));
        this.planCustomerService(newCustomer);
        this.renderCustomerArea();
    }

    completeCustomerSale(options = {}) {
        let customer = options.customer;
        if (!customer && options.customerId) {
            customer = this.getCustomerById(options.customerId);
        }
        if (!customer) return;

        const cart = Array.isArray(customer.shoppingCart) && customer.shoppingCart.length > 0
            ? customer.shoppingCart
            : [{ recipeKey: customer.wantsItem, quantity: 1 }];
        const soldLines = [];
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalQty = 0;
        let weightedQuality = 0;
        let topAppeal = null;

        cart.forEach(line => {
            const recipeKey = line.recipeKey;
            const desiredQty = Math.max(1, Number(line.quantity) || 1);
            const availableQty = this.engine.getProductStock(recipeKey);
            const saleQty = Math.min(desiredQty, availableQty);
            if (saleQty <= 0) return;

            const result = this.engine.processSale(recipeKey, saleQty);
            if (!result.success) return;

            soldLines.push({ recipeKey, quantity: saleQty, result });
            totalRevenue += result.revenue || 0;
            totalProfit += result.profit || 0;
            totalQty += saleQty;
            weightedQuality += (result.quality || 100) * saleQty;
            if (!topAppeal || (result.appeal?.lift || 1) > (topAppeal?.lift || 1)) {
                topAppeal = result.appeal;
            }
        });

        if (soldLines.length === 0) {
            this.handleOutOfStock(customer);
            return;
        }

        // processSale increments customer counters per line; normalize to one customer checkout.
        const extraCustomerHits = Math.max(0, soldLines.length - 1);
        if (extraCustomerHits > 0) {
            this.engine.dailyStats.customersServed = Math.max(0, this.engine.dailyStats.customersServed - extraCustomerHits);
            this.engine.allTimeStats.totalCustomers = Math.max(0, this.engine.allTimeStats.totalCustomers - extraCustomerHits);
        }

        // Record purchase in customer database
        if (this.customerDB && customer.dbId) {
            const dbCustomer = this.customerDB.customers.get(customer.dbId);
            if (dbCustomer) {
                soldLines.forEach(line => {
                    const quality = line.result.quality || 100;
                    const price = line.result.revenue || 0;
                    this.customerDB.processPurchase(dbCustomer, line.recipeKey, price, quality);
                });
            }
        }

        const happyDialogues = GAME_CONFIG.CUSTOMER_DIALOGUES.happy;
        const primaryRecipe = GAME_CONFIG.RECIPES[soldLines[0].recipeKey];
        const msg = happyDialogues[Math.floor(Math.random() * happyDialogues.length)]
            .replace('{item}', primaryRecipe?.name || soldLines[0].recipeKey);
        const moodFace = topAppeal?.moodEmoji || '😊';
        const moodLine = topAppeal?.moodMessage || msg;
        const avgQuality = totalQty > 0 ? (weightedQuality / totalQty) : 100;

        customer.state = 'success';
        customer.resultMessage = moodLine;
        customer.resultRevenue = totalRevenue;
        customer.resultFace = moodFace;
        window.dispatchEvent(new CustomEvent('bakery:customer-expression', {
            detail: {
                emoji: moodFace || '😊',
                message: moodLine,
                tone: 'happy'
            }
        }));
        window.dispatchEvent(new CustomEvent('bakery:money-float', {
            detail: {
                amount: totalRevenue,
                customerId: customer.id,
                staffId: customer.assignedStaff?.id || 'owner',
                label: `+$${totalRevenue.toFixed(2)}`
            }
        }));
        window.dispatchEvent(new CustomEvent('bakery:customer-expression', {
            detail: {
                target: 'player',
                emoji: '✅',
                message: `${customer?.name || 'Customer'} checked out. Thank you!`,
                tone: 'happy'
            }
        }));

        this.updateFlowSatisfaction(Math.min(100, (customer.satisfactionNow || 70) + 10));

        if (this.notificationSystem) {
            this.notificationSystem.moneyEarned(totalRevenue);
        }

        this.releaseAssignedStaff(customer);
        this.renderCustomerArea();

        this.logAutomationEvent('sale', `${customer.name} checked out ${soldLines.length} item type(s)`, {
            product: primaryRecipe?.name,
            amount: `$${totalRevenue.toFixed(2)}`,
            quality: `${avgQuality.toFixed(0)}%`,
            auto: !!options.auto
        });

        this.renderDisplayProducts();
        this.updateSellingStats();
        this.updateStats();

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
        window.dispatchEvent(new CustomEvent('bakery:customer-expression', {
            detail: {
                emoji: '😔',
                message: 'Maybe next time.',
                tone: 'sad'
            }
        }));
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

        // Also update overlay stat elements
        const oRevenue = document.getElementById('overlay-stat-revenue');
        const oCustomers = document.getElementById('overlay-stat-customers');
        const oMissed = document.getElementById('overlay-stat-missed');
        if (oRevenue) oRevenue.textContent = `$${this.engine.dailyStats.revenue.toFixed(2)}`;
        if (oCustomers) oCustomers.textContent = this.engine.dailyStats.customersServed;
        if (oMissed) oMissed.textContent = this.engine.dailyStats.customersMissed;

        // Update overlay time display
        const oTime = document.getElementById('overlay-sell-time');
        if (oTime) oTime.textContent = this.engine.getTimeString();

        this.updateStats();
    }

    assignCustomerToStaff() {
        const pool = this.staffManager
            ? this.staffManager.getAllStaff()
            : (this.engine.staff || []);
        if (!pool || pool.length === 0) return null;

        // All staff are adaptable; role/trait only shifts efficiency.
        const available = pool.filter(staff => {
            const fatigue = Number.isFinite(staff.fatigue) ? staff.fatigue : 0;
            const busy = !!staff.currentCustomer || !!staff.currentTask;
            return !busy && fatigue < 95;
        });
        
        if (available.length === 0) return null;
        
        // Sort by checkout fitness so any staff can help at checkout.
        available.sort((a, b) => {
            const aScore = this.getStaffCheckoutScore(a);
            const bScore = this.getStaffCheckoutScore(b);
            return bScore - aScore;
        });
        
        return available[0];
    }

    getStaffCheckoutScore(staff) {
        const skill = Number.isFinite(staff.skillLevel)
            ? staff.skillLevel
            : (Number.isFinite(staff.skill) ? staff.skill / 20 : 3);
        const adaptability = Number.isFinite(staff.adaptability) ? staff.adaptability : 1;
        const checkoutAptitude = Number.isFinite(staff.checkoutAptitude) ? staff.checkoutAptitude : 1;
        const fatiguePenalty = 1 - ((staff.fatigue || 0) / 170);
        const happinessBoost = 0.85 + ((staff.happiness || 100) / 250);
        return skill * adaptability * checkoutAptitude * Math.max(0.35, fatiguePenalty) * happinessBoost;
    }

    planCustomerService(customer, options = {}) {
        const silent = options.silent || false;
        if (!this.automationEnabled) {
            customer.requiresManualService = false;
        }

        const staff = this.assignCustomerToStaff(customer);
        customer.assignedStaff = staff || null;

        if (!staff) {
            customer.requiresManualService = false;
            customer.checkoutState = 'queued';
            if (!silent) {
                this.logAutomationEvent('service', `Checkout queue building — ${customer.name} is waiting`, { severity: 'warning' });
            }
            this.renderCustomerArea();
            return;
        }

        customer.requiresManualService = false;
        customer.checkoutState = 'processing';
        customer.serviceStart = performance.now();

        const cartItems = (customer.shoppingCart || []).reduce((sum, line) => sum + (line.quantity || 0), 0);
        const baseDuration = 1400 + cartItems * 550;
        const checkoutScore = this.getStaffCheckoutScore(staff);
        const skillMod = Math.max(0.45, 1 - (checkoutScore - 3) * 0.09);
        const fatiguePenalty = (1 + staff.fatigue / 220);
        customer.serviceDuration = baseDuration * skillMod * fatiguePenalty;
        customer.serviceEndsAt = customer.serviceStart + customer.serviceDuration;

        staff.currentCustomer = customer;
        this.emitStaffRoute(staff, 'counter', {
            context: 'checkout',
            customerId: customer.id,
            taskSummary: customer.cartSummary
        });
        if (staff.id === 'owner') {
            customer.checkoutLockIssued = true;
            window.dispatchEvent(new CustomEvent('bakery:checkout-state', {
                detail: {
                    locked: true,
                    staffId: 'owner',
                    message: `Checking out ${customer.name}`,
                    etaMs: Math.round(customer.serviceDuration)
                }
            }));
            window.dispatchEvent(new CustomEvent('bakery:customer-expression', {
                detail: {
                    target: 'player',
                    emoji: '🧾',
                    message: `${customer?.name || 'Customer'}, I will ring this up now.`,
                    tone: 'neutral'
                }
            }));
        }
        this.logAutomationEvent('service', `${staff.name} handling checkout for ${customer.name}`, {
            staff: staff.name,
            customer: customer.name,
            cartTotal: `$${(customer.cartTotal || 0).toFixed(2)}`
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
        const assignedStaff = customer?.assignedStaff || null;
        if (assignedStaff) {
            this.emitStaffRoute(assignedStaff, 'floor', {
                context: 'idle',
                customerId: customer.id
            });
            if (assignedStaff.id === 'owner' || customer?.checkoutLockIssued) {
                window.dispatchEvent(new CustomEvent('bakery:checkout-state', {
                    detail: {
                        locked: false,
                        staffId: 'owner'
                    }
                }));
            }
            if (assignedStaff.currentCustomer === customer) {
                assignedStaff.currentCustomer = null;
            }
        }
        if (customer) {
            customer.checkoutLockIssued = false;
            customer.assignedStaff = null;
            customer.checkoutState = 'done';
        }
    }

    handleOutOfStock(customer) {
        const sadDialogue = GAME_CONFIG.CUSTOMER_DIALOGUES.sad;
        const message = sadDialogue[Math.floor(Math.random() * sadDialogue.length)];

        customer.state = 'sad';
        customer.resultMessage = message;
        customer.resultFace = customer?.face || '😢';
        window.dispatchEvent(new CustomEvent('bakery:customer-expression', {
            detail: {
                emoji: customer?.face || '😢',
                message,
                tone: 'sad'
            }
        }));
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
        
        // End customer database day
        if (this.customerDB) {
            this.customerDB.endDay();
        }

        const summary = this.engine.endDay();

        this.purgeExpiredScenarioEffects();

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
                                <div class="stat-row">
                                    <span>Perk:</span>
                                    <strong>${staff.perk?.label || 'Adaptive Worker'}</strong>
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
            
            // Phase 1: Labor cost consequence - warn if labor costs are getting high
            const laborCostPercent = this.engine.getLaborCostPercent();
            if (laborCostPercent > 45) {
                this.notificationSystem.warning(`⚠️ Labor costs now ${laborCostPercent.toFixed(0)}% of revenue (target: <35%)`);
            }
            
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

    applyScenarioEffect(effect, scenarioId) {
        if (!effect) return;
        if (typeof effect === 'string') {
            this.applyScenarioEffectByName(effect, scenarioId);
        } else if (typeof effect === 'object') {
            this.applyScenarioEffectObject(effect);
        }
    }

    applyScenarioEffectByName(effectName) {
        const revenue = this.engine?.dailyStats?.revenue || 500;
        const cogs = this.engine?.dailyStats?.cogs || 300;
        const handlers = {
            profitPenalty: () => this.adjustCash(-Math.max(200, revenue * 0.12), 'Profit penalty', 'warning'),
            customerLoss: () => this.addScenarioEffect({ key: 'demand', multiplier: 0.7, duration: 3, label: 'Customer loss' }),
            qualityRisk: () => this.damageIngredients(6),
            cashFlowPressure: () => this.adjustCash(-Math.min(450, (this.engine?.cash || 1000) * 0.08), 'Cash flow squeeze', 'warning'),
            brandStrength: () => this.addScenarioEffect({ key: 'loyalty', value: 0.2, duration: 4, label: 'Brand strength', operation: 'add' }),
            marginCrunch: () => {
                this.addScenarioEffect({ key: 'demand', multiplier: 0.85, duration: 3, label: 'Margin squeeze' });
                this.engine.menuAppeal = Math.max(0.7, (this.engine.menuAppeal || 1) - 0.05);
            },
            loyaltyBoost: () => this.addScenarioEffect({ key: 'loyalty', value: 0.15, duration: 4, label: 'Loyalty boost', operation: 'add' }),
            neutral: () => this.showNotification('Nothing additional happened this time.', 'info'),
            partialRecovery: () => {
                this.engine.menuAppeal = Math.min(1.8, (this.engine.menuAppeal || 1) + 0.1);
                this.addScenarioEffect({ key: 'demand', multiplier: 1.05, duration: 2, label: 'Recovery focus' });
            },
            costSavings: () => this.adjustCash(Math.max(120, cogs * 0.05), 'Cost savings', 'success'),
            newCustomers: () => this.addScenarioEffect({ key: 'demand', multiplier: 1.25, duration: 3, label: 'New customers' }),
            readiness: () => {
                this.engine.menuAppeal = Math.min(1.8, (this.engine.menuAppeal || 1) + 0.05);
                this.addScenarioEffect({ key: 'loyalty', value: 0.05, duration: 3, label: 'Readiness', operation: 'add' });
            },
            laborCostIncrease: () => this.adjustCash(-Math.max(150, (this.engine?.monthlyStaffCost || 300) / 30 * 1.5), 'Labor cost increase', 'warning'),
            shortTermChaos: () => {
                this.addScenarioEffect({ key: 'demand', multiplier: 0.8, duration: 2, label: 'Short-term chaos' });
                this.damageIngredients(4);
            },
            ownerBurnout: () => {
                this.addScenarioEffect({ key: 'loyalty', value: -0.12, duration: 3, label: 'Owner burnout', operation: 'add' });
                this.engine.menuAppeal = Math.max(0.7, (this.engine.menuAppeal || 1) - 0.06);
            },
            capitalDrain: () => this.adjustCash(-Math.max(280, cogs * 0.08), 'Capital drain', 'warning'),
            brandProtection: () => this.addScenarioEffect({ key: 'loyalty', value: 0.12, duration: 4, label: 'Brand protection', operation: 'add' }),
            profitBoost: () => this.adjustCash(Math.max(180, revenue * 0.08), 'Profit boost', 'success'),
            listBuilding: () => this.addScenarioEffect({ key: 'loyalty', value: 0.08, duration: 3, label: 'List building', operation: 'add' }),
            cheapFix: () => this.damageIngredients(7),
            capitalExpense: () => this.adjustCash(-Math.max(250, (this.engine?.monthlyUtilities || 320) / 2), 'Capital expense', 'warning'),
            quickFix: () => {
                this.engine.menuAppeal = Math.min(1.8, (this.engine.menuAppeal || 1) + 0.08);
                this.showNotification('Quick fix gave temporary lift.', 'success');
            },
            survival: () => this.addScenarioEffect({ key: 'demand', multiplier: 1.1, duration: 3, label: 'Survival focus' }),
            compliance: () => this.addScenarioEffect({ key: 'demand', multiplier: 1.05, duration: 2, label: 'Compliance win' }),
            riskDelay: () => this.addScenarioEffect({ key: 'demand', multiplier: 0.9, duration: 3, label: 'Risk delay' }),
            adaptation: () => this.addScenarioEffect({ key: 'demand', multiplier: 1.1, duration: 3, label: 'Adaptation' }),
            volumeFocus: () => this.addScenarioEffect({ key: 'demand', multiplier: 1.15, duration: 3, label: 'Volume focus' }),
            revenueStreams: () => {
                this.adjustCash(Math.max(200, revenue * 0.06), 'Revenue streams', 'success');
                this.addScenarioEffect({ key: 'loyalty', value: 0.05, duration: 3, label: 'Revenue streams', operation: 'add' });
            }
        };

        if (handlers[effectName]) {
            handlers[effectName]();
            return;
        }

        this.showNotification('Scenario effect noted.', 'info');
    }

    applyScenarioEffectObject(effect) {
        const duration = this.normalizeScenarioDuration(effect.duration, 3);
        if (effect.customerLoss) {
            this.addScenarioEffect({ key: 'demand', multiplier: Math.max(0.4, 1 - effect.customerLoss), duration, label: 'Customer slump' });
        }
        if (effect.loyaltyDrop) {
            this.addScenarioEffect({ key: 'loyalty', value: -effect.loyaltyDrop, duration, label: 'Loyalty drop', operation: 'add' });
        }
        if (effect.demandMultiplier) {
            this.addScenarioEffect({ key: 'demand', multiplier: effect.demandMultiplier, duration, label: 'Demand surge' });
        }
        if (effect.morningCustomerLoss) {
            const morningDuration = Math.max(1, Math.floor(duration / 2));
            this.addScenarioEffect({ key: 'demand', multiplier: Math.max(0.5, 1 - effect.morningCustomerLoss), duration: morningDuration, label: 'Morning rush lost' });
        }
    }

    addScenarioEffect({ key, multiplier = 1, value = 0, duration = 2, label = 'Scenario effect', operation, description }) {
        if (!this.engine) return;
        const normalized = this.normalizeScenarioDuration(duration, 2);
        const expiresOnDay = this.engine.day + normalized - 1;
        const operationUsed = operation || (key === 'loyalty' ? 'add' : 'multiply');
        this.activeScenarioEffects.push({ key, multiplier, value, duration: normalized, label, operation: operationUsed, description, expiresOnDay });
        const plural = normalized === 1 ? 'day' : 'days';
        const isPositive = (operationUsed === 'add' && value > 0) || (operationUsed !== 'add' && multiplier > 1);
        this.showNotification(`${label} active for ${normalized} ${plural}.`, isPositive ? 'success' : 'warning');
    }

    getScenarioModifier(key, options = {}) {
        const { defaultValue, operation } = options;
        const filtered = this.activeScenarioEffects.filter(effect => effect.key === key);
        if (operation === 'add') {
            const base = defaultValue ?? 0;
            return filtered.reduce((sum, effect) => sum + (effect.value || 0), base);
        }
        const base = defaultValue ?? 1;
        return filtered.reduce((acc, effect) => acc * (effect.multiplier ?? 1), base);
    }

    purgeExpiredScenarioEffects() {
        if (!this.engine) return;
        const day = this.engine.day;
        this.activeScenarioEffects = this.activeScenarioEffects.filter(effect => day <= effect.expiresOnDay);
    }

    normalizeScenarioDuration(duration, fallback = 2) {
        if (duration === 'permanent') return 365;
        const asNumber = Number(duration);
        if (Number.isFinite(asNumber) && asNumber > 0) {
            return Math.max(1, Math.floor(asNumber));
        }
        return fallback;
    }

    adjustCash(amount, label, type = 'warning') {
        if (!this.engine) return;
        this.engine.cash = Math.max(0, this.engine.cash + amount);
        if (label) {
            const formatted = `${label}: ${amount >= 0 ? '+' : '-'}$${Math.abs(Math.round(amount))}`;
            this.showNotification(formatted, type);
        }
    }

    damageIngredients(amount = 5) {
        if (!this.engine || !this.engine.ingredients) return;
        Object.values(this.engine.ingredients).forEach(ingredient => {
            ingredient.batches.forEach(batch => {
                batch.quality = Math.max(0, batch.quality - amount);
            });
        });
        this.engine.menuAppeal = Math.max(0.7, (this.engine.menuAppeal || 1) - amount * 0.003);
        this.showNotification(`Ingredient quality dropped ${amount}%`, 'warning');
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
        if (!window.DYNAMIC_SCENARIOS || !this.engine) return;
        if (typeof document === 'undefined') return;
        const today = this.engine.day;
        if (!today || this.lastScenarioRollDay === today) return;
        if (document.querySelector('.scenario-alert')) return;

        this.lastScenarioRollDay = today;
        this.purgeExpiredScenarioEffects();

        const gameState = {
            day: today,
            staff: this.engine?.staff || [],
            month: new Date().getMonth() + 1,
            season: this.getSeason()
        };

        const complexity = this.dayComplexityProfile || this.getComplexityProfile(today);
        const rolls = Math.max(1, complexity.scenarioRolls || 1);
        let triggered = null;
        for (let i = 0; i < rolls; i++) {
            triggered = DYNAMIC_SCENARIOS.checkScenarioTriggers(gameState);
            if (triggered) break;
        }

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
    
    // ==================== CUSTOMER DATABASE UI ====================
    
    showCustomerDatabase() {
        if (!this.customerDB) {
            this.showPopup({
                icon: '❌',
                title: 'Customer Database Unavailable',
                message: 'Customer database system is not initialized.',
                type: 'error',
                autoClose: 2000
            });
            return;
        }
        
        const analytics = this.customerDB.getAnalytics();
        const topCustomers = this.customerDB.getTopCustomers(10);
        const atRisk = this.customerDB.getAtRiskCustomers();
        
        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>👥 Customer Database & Analytics</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <!-- Customer Analytics Dashboard -->
                    <div class="customer-analytics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                        <div class="analytics-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white;">
                            <div style="font-size: 12px; opacity: 0.9;">Total Customers</div>
                            <div style="font-size: 32px; font-weight: bold;">${analytics.totalCustomers}</div>
                            <div style="font-size: 11px; opacity: 0.8;">+${analytics.newToday} today</div>
                        </div>
                        <div class="analytics-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 12px; color: white;">
                            <div style="font-size: 12px; opacity: 0.9;">Returning Rate</div>
                            <div style="font-size: 32px; font-weight: bold;">${analytics.returningRate}</div>
                            <div style="font-size: 11px; opacity: 0.8;">Active: ${analytics.activeCustomers}</div>
                        </div>
                        <div class="analytics-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white;">
                            <div style="font-size: 12px; opacity: 0.9;">Avg Satisfaction</div>
                            <div style="font-size: 32px; font-weight: bold;">${analytics.avgSatisfaction}%</div>
                            <div style="font-size: 11px; opacity: 0.8;">NPS: ${analytics.npsScore}</div>
                        </div>
                        <div class="analytics-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 12px; color: white;">
                            <div style="font-size: 12px; opacity: 0.9;">Avg Spend</div>
                            <div style="font-size: 32px; font-weight: bold;">$${analytics.avgSpend}</div>
                            <div style="font-size: 11px; opacity: 0.8;">LTV: $${analytics.lifetimeValue}</div>
                        </div>
                        <div class="analytics-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 12px; color: white;">
                            <div style="font-size: 12px; opacity: 0.9;">Churn Risk</div>
                            <div style="font-size: 32px; font-weight: bold;">${analytics.churnRate}</div>
                            <div style="font-size: 11px; opacity: 0.8;">At risk: ${atRisk.length}</div>
                        </div>
                        <div class="analytics-card" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 20px; border-radius: 12px; color: #333;">
                            <div style="font-size: 12px; opacity: 0.9;">Loyalty Members</div>
                            <div style="font-size: 24px; font-weight: bold;">
                                🥇${analytics.loyaltyDistribution.gold || 0} 
                                🥈${analytics.loyaltyDistribution.silver || 0} 
                                🥉${analytics.loyaltyDistribution.bronze || 0}
                            </div>
                            <div style="font-size: 11px; opacity: 0.8;">Platinum: ${analytics.loyaltyDistribution.platinum || 0}</div>
                        </div>
                    </div>
                    
                    <!-- Marketing & Loyalty Tools -->
                    <div class="marketing-section" style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 15px;">📢 Marketing & Loyalty</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                            ${!this.customerDB.loyaltyProgram.enabled ? `
                                <button class="btn btn-primary" onclick="window.game.enableLoyalty()">
                                    🎁 Enable Loyalty Program
                                </button>
                            ` : `
                                <div style="padding: 15px; background: white; border-radius: 8px;">
                                    ✅ Loyalty Program Active
                                </div>
                            `}
                            ${Object.entries(this.customerDB.marketingChannels).map(([key, channel]) => `
                                <div style="padding: 15px; background: white; border-radius: 8px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600;">${key.replace(/_/g, ' ')}</div>
                                            <div style="font-size: 12px; color: #666;">$${channel.cost}/month</div>
                                        </div>
                                        ${!channel.enabled ? `
                                            <button class="btn btn-sm" onclick="window.game.enableMarketingChannel('${key}')">
                                                Enable
                                            </button>
                                        ` : `
                                            <span style="color: #2ecc71;">✓ Active</span>
                                        `}
                                    </div>
                                </div>
                            `).join('')}
                            <button class="btn btn-secondary" onclick="window.game.sendEmailCampaign()">
                                📧 Send Email Campaign
                            </button>
                        </div>
                    </div>
                    
                    <!-- Top Customers -->
                    <div class="top-customers-section" style="margin-bottom: 20px;">
                        <h3 style="margin-bottom: 15px;">⭐ Top Customers</h3>
                        <div style="background: white; border-radius: 12px; overflow: hidden;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="background: #f8f9fa;">
                                    <tr>
                                        <th style="padding: 12px; text-align: left;">Name</th>
                                        <th style="padding: 12px; text-align: left;">Age</th>
                                        <th style="padding: 12px; text-align: center;">Visits</th>
                                        <th style="padding: 12px; text-align: center;">Total Spent</th>
                                        <th style="padding: 12px; text-align: center;">Satisfaction</th>
                                        <th style="padding: 12px; text-align: center;">Loyalty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${topCustomers.map((cust, idx) => `
                                        <tr style="border-top: 1px solid #e9ecef; cursor: pointer;" onclick="window.game.showCustomerDetail(${cust.id})">
                                            <td style="padding: 12px;">
                                                ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                                                ${cust.name}
                                            </td>
                                            <td style="padding: 12px;">${cust.ageGroup}</td>
                                            <td style="padding: 12px; text-align: center;">${cust.visits}</td>
                                            <td style="padding: 12px; text-align: center; font-weight: 600;">$${cust.totalSpent.toFixed(2)}</td>
                                            <td style="padding: 12px; text-align: center;">
                                                <div style="display: inline-block; padding: 4px 8px; border-radius: 12px; background: ${cust.satisfaction >= 80 ? '#d4edda' : cust.satisfaction >= 60 ? '#fff3cd' : '#f8d7da'}; color: ${cust.satisfaction >= 80 ? '#155724' : cust.satisfaction >= 60 ? '#856404' : '#721c24'};">
                                                    ${cust.satisfaction.toFixed(0)}%
                                                </div>
                                            </td>
                                            <td style="padding: 12px; text-align: center;">
                                                ${cust.loyaltyTier === 'platinum' ? '💎' : cust.loyaltyTier === 'gold' ? '🥇' : cust.loyaltyTier === 'silver' ? '🥈' : cust.loyaltyTier === 'bronze' ? '🥉' : '—'}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- At-Risk Customers -->
                    ${atRisk.length > 0 ? `
                        <div class="at-risk-section">
                            <h3 style="margin-bottom: 15px; color: #e74c3c;">⚠️ Customers At Risk (${atRisk.length})</h3>
                            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                                ${atRisk.slice(0, 5).map(cust => `
                                    <div style="padding: 8px 0; border-bottom: 1px solid #ffe69c;">
                                        <strong>${cust.name}</strong> - 
                                        Last visit: Day ${cust.lastVisit} | 
                                        Satisfaction: ${cust.satisfaction.toFixed(0)}% | 
                                        Churn risk: ${(cust.churnRisk * 100).toFixed(0)}%
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        if (window.gsap) {
            gsap.from(panel.querySelector('.modal-content'), {
                scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out'
            });
        }
    }
    
    showCustomerDetail(customerId) {
        if (!this.customerDB) return;
        
        const customer = this.customerDB.customers.get(customerId);
        if (!customer) return;
        
        const detailPanel = document.createElement('div');
        detailPanel.className = 'modal-overlay';
        detailPanel.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>👤 ${customer.name}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div>
                            <h4>📧 Contact</h4>
                            <p><strong>Email:</strong> ${customer.email}</p>
                            <p><strong>Phone:</strong> ${customer.phone}</p>
                        </div>
                        <div>
                            <h4>📊 Demographics</h4>
                            <p><strong>Age:</strong> ${customer.ageGroup}</p>
                            <p><strong>Gender:</strong> ${customer.gender}</p>
                            <p><strong>Segment:</strong> ${customer.segment}</p>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>💳 Purchase Summary</h4>
                        <p><strong>Total Visits:</strong> ${customer.visits}</p>
                        <p><strong>Total Spent:</strong> $${customer.totalSpent.toFixed(2)}</p>
                        <p><strong>Avg per Visit:</strong> $${(customer.totalSpent / (customer.visits || 1)).toFixed(2)}</p>
                        <p><strong>Loyalty Tier:</strong> ${customer.loyaltyTier.toUpperCase()}</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>😊 Satisfaction Metrics</h4>
                        <p><strong>Current Satisfaction:</strong> ${customer.satisfaction.toFixed(0)}%</p>
                        <p><strong>Return Probability:</strong> ${(customer.returnProbability * 100).toFixed(0)}%</p>
                        <p><strong>Churn Risk:</strong> ${(customer.churnRisk * 100).toFixed(0)}%</p>
                    </div>
                    
                    ${customer.favoriteItems.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <h4>❤️ Favorite Items</h4>
                            ${customer.favoriteItems.map(fav => {
                                const recipe = GAME_CONFIG.RECIPES[fav.item];
                                return `<p>${recipe?.icon || '🍰'} ${recipe?.name || fav.item} (${fav.count} orders)</p>`;
                            }).join('')}
                        </div>
                    ` : ''}
                    
                    ${customer.allergies.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <h4>⚠️ Allergies</h4>
                            <p style="color: #e74c3c;">${customer.allergies.join(', ')}</p>
                        </div>
                    ` : ''}
                    
                    ${customer.purchaseHistory.length > 0 ? `
                        <div>
                            <h4>📜 Recent Purchase History</h4>
                            <div style="max-height: 200px; overflow-y: auto;">
                                ${customer.purchaseHistory.slice(-10).reverse().map(purchase => `
                                    <div style="padding: 8px; border-bottom: 1px solid #e9ecef;">
                                        Day ${purchase.date}: ${purchase.itemName} - $${purchase.price.toFixed(2)} 
                                        (Quality: ${purchase.quality.toFixed(0)}%, Satisfaction: ${purchase.satisfaction.toFixed(0)}%)
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(detailPanel);
    }
    
    enableLoyalty() {
        if (!this.customerDB) return;
        this.customerDB.enableLoyaltyProgram();
        this.showNotification('Loyalty program enabled! Customers will earn rewards.', 'success');
        document.querySelector('.modal-overlay')?.remove();
        this.showCustomerDatabase();
    }
    
    enableMarketingChannel(channelKey) {
        if (!this.customerDB) return;
        const result = this.customerDB.enableMarketingChannel(channelKey);
        if (result.success) {
            this.engine.cash -= result.cost;
            this.showNotification(`${channelKey.replace(/_/g, ' ')} enabled! Monthly cost: $${result.cost}`, 'success');
            document.querySelector('.modal-overlay')?.remove();
            this.showCustomerDatabase();
        }
    }
    
    sendEmailCampaign() {
        if (!this.customerDB) return;
        
        const result = this.customerDB.sendEmailCampaign('Special Offer from Sweet Success Bakery!');
        if (result.success) {
            this.showPopup({
                icon: '📧',
                title: 'Email Campaign Sent',
                message: `Sent to ${result.sent} customers. ${result.opened} opened (${result.openRate}). Cost: $${result.cost.toFixed(2)}`,
                type: 'success',
                autoClose: 3000
            });
        } else {
            this.showPopup({
                icon: '❌',
                title: 'Campaign Failed',
                message: result.message,
                type: 'error',
                autoClose: 2000
            });
        }
    }
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
