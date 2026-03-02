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

        // Legacy fallback only — primary effects now stored in WorldSimulation.state.activeEffects
        this._legacyScenarioEffects = [];
        this.lastScenarioRollDay = null;

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

        // === WORLD SIMULATION: Initialize living world ===
        this.world = null;
        this.journal = null;
        this.miniGames = null;

        if (window.WorldSimulation) {
            this.world = new WorldSimulation();
            
            // Register weather subsystem
            if (window.WeatherSystem) {
                const weather = new WeatherSystem();
                this.world.registerSubsystem('weather', weather);
            }
            
            // Register competitor subsystem
            if (window.CompetitorSimulation) {
                const competitors = new CompetitorSimulation();
                this.world.registerSubsystem('competitors', competitors);
            }

            // === Step 11: Register expanded subsystems ===
            if (window.HealthSafetySystem) {
                this.world.registerSubsystem('healthSafety', new HealthSafetySystem());
            }
            if (window.CommunityEventSystem) {
                this.world.registerSubsystem('communityEvents', new CommunityEventSystem());
            }
            if (window.AdvertisingSystem) {
                this.world.registerSubsystem('advertising', new AdvertisingSystem());
            }
            if (window.TechnologySystem) {
                this.world.registerSubsystem('technology', new TechnologySystem());
            }
            if (window.EnvironmentalSystem) {
                this.world.registerSubsystem('environmental', new EnvironmentalSystem());
            }
            if (window.GlobalEventSystem) {
                this.world.registerSubsystem('globalEvents', new GlobalEventSystem());
            }
            if (window.LoanDebtSystem) {
                this.world.registerSubsystem('loans', new LoanDebtSystem());
            }
            if (window.ExpansionSystem) {
                this.world.registerSubsystem('expansion', new ExpansionSystem());
            }
        }

        // Initialize business journal (education system)
        if (window.BusinessJournal) {
            this.journal = new BusinessJournal(this);
        }

        // Initialize minigame system
        if (window.MiniGameSystem) {
            this.miniGames = new MiniGameSystem(this);
        }

        this.dashboard = new FinancialDashboard(this); // Pass gameController, not economy
        this.tutorial = new TutorialSystem(this);
        this.isFirstTimePlayer = !localStorage.getItem('bakery_save') && !localStorage.getItem('bakery_played_before');
        this.helpDismissed = {}; // Track which help banners user dismissed
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
                // Phaser's RESIZE mode will automatically handle this
                // But we can add additional logic if needed
                this.phaserGame.scale.resize(window.innerWidth, window.innerHeight - 60);
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
            chattiness: 50
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
                    chattiness: staff.chattiness || 50
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
                        chattiness: staff.chattiness || 50
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

    skipDayDueToCash() {
        // Consequence: Skip day, lose potential revenue, still have fixed costs
        this.notificationSystem.warning('⏭️ Day skipped due to insufficient cash');
        const summary = this.engine.processEndOfDay();
        this.showDaySummary(summary);
    }

    updateMarkup(value) {
        const markup = parseInt(value) || 100;
        this.engine.markupPercentage = markup;
        
        // Update both slider and input
        const slider = document.getElementById('markup-slider');
        const input = document.getElementById('markup-input');
        if (slider) slider.value = markup;
        if (input) input.value = markup;
        
        // Refresh display products to show new prices
        this.renderDisplayProducts();
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

        // Hide floating help on menu
        const helpBtn = document.getElementById('floating-help-btn');
        if (helpBtn) helpBtn.style.display = 'none';

        const hasSave = !!localStorage.getItem('bakery_save');

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
                        Run a Bakery &bull; Buy, Bake, Sell &bull; Make a Profit!
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
                                <div class="text-sm text-amber-300/80">Start fresh — set up your bakery and begin selling!</div>
                            </div>
                        </div>
                    </button>

                    <button class="menu-btn group relative overflow-hidden bg-stone-800 hover:bg-stone-700 text-white p-1 rounded-xl shadow-lg transform transition-all hover:scale-105" 
                            id="btn-continue" role="button" tabindex="0" aria-label="Continue saved game" style="display: none;">
                        <div class="bg-stone-900/80 rounded-lg p-4 flex items-center gap-4 border border-stone-600 group-hover:border-stone-500 transition-colors">
                            <span class="text-3xl group-hover:translate-x-1 transition-transform">▶️</span>
                            <div class="text-left">
                                <div class="text-xl font-bold text-stone-200">Continue</div>
                                <div class="text-sm text-stone-400">Pick up where you left off — Day <span id="save-day-indicator">--</span></div>
                            </div>
                        </div>
                    </button>

                    <button class="menu-btn group relative overflow-hidden bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white p-1 rounded-xl shadow-lg transform transition-all hover:scale-105"
                            id="btn-walkthrough" role="button" tabindex="0" aria-label="Watch AI walkthrough">
                        <div class="bg-stone-900/80 rounded-lg p-4 flex items-center gap-4 border border-blue-500/30 group-hover:border-blue-400/50 transition-colors">
                            <span class="text-3xl group-hover:scale-110 transition-transform">🤖</span>
                            <div class="text-left">
                                <div class="text-xl font-bold text-blue-200">Watch & Learn</div>
                                <div class="text-sm text-blue-300/70">An AI mentor plays the game and explains every step</div>
                            </div>
                        </div>
                    </button>

                    <button class="menu-btn group relative overflow-hidden bg-stone-800 hover:bg-stone-700 text-white p-1 rounded-xl shadow-lg transform transition-all hover:scale-105" 
                            id="btn-tutorial" role="button" tabindex="0" aria-label="Open tutorial">
                        <div class="bg-stone-900/80 rounded-lg p-4 flex items-center gap-4 border border-stone-600 group-hover:border-stone-500 transition-colors">
                            <span class="text-3xl group-hover:scale-110 transition-transform">📖</span>
                            <div class="text-left">
                                <div class="text-xl font-bold text-stone-200">How to Play</div>
                                <div class="text-sm text-stone-400">Step-by-step guided tutorial with Master Baker Pierre</div>
                            </div>
                        </div>
                    </button>
                </div>
                
                <div class="menu-info relative z-10 mt-12 text-center">
                    <div class="flex gap-8 justify-center text-amber-100/50 text-sm flex-wrap">
                        <span class="flex items-center gap-2"><span class="text-lg">📈</span> Real Market Dynamics</span>
                        <span class="flex items-center gap-2"><span class="text-lg">🧠</span> Strategic Decisions</span>
                        <span class="flex items-center gap-2"><span class="text-lg">🥐</span> Artisan Baking</span>
                    </div>
                    <div class="mt-4 text-amber-100/30 text-xs">
                        Tip: If you're new, try "Watch & Learn" first to see how the game works!
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
        const btnWalk = wireButton('btn-walkthrough', () => this.startWalkthroughFromMenu());

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
        // Restore world simulation, journal, staff manager state from save
        if (this.engine.restoreDeferredState) {
            this.engine.restoreDeferredState();
        }
        // Initial world tick so Day 1 has weather, competitors, etc.
        if (this.world && !this.world._hasInitialTick) {
            const day = this.engine.day || 1;
            this.world.simulateDay(day, {
                day,
                cash: this.engine.cash || 500,
                revenue: 0,
                customersServed: 0,
                products: this.engine.products || {},
                staff: this.engine.staff || [],
                equipment: this.engine.equipment || {},
                reputation: 50,
                staffMorale: 70,
                equipmentQuality: 1.0
            });
            this.world._hasInitialTick = true;
        }
        this.updateAutomationAvailability();
        this.startDay();
    }

    showTutorial() {
        if (this.tutorial) {
            this.tutorial.start();
        }
    }

    startWalkthroughFromMenu() {
        if (typeof WalkthroughMode !== 'undefined') {
            this.walkthroughMode = new WalkthroughMode(this);
            this.walkthroughMode.start();
        } else {
            this.showPopup({
                icon: 'ℹ️',
                title: 'Not Available',
                message: 'The walkthrough mode is still loading. Please try again.',
                type: 'info',
                autoClose: 2000
            });
        }
    }

    // Show floating help button during gameplay
    showFloatingHelp() {
        const helpBtn = document.getElementById('floating-help-btn');
        if (helpBtn) helpBtn.style.display = 'flex';
    }

    // Help menu when floating button is clicked
    showHelpMenu() {
        const phaseHelp = {
            'hub': 'You are at the Bakery Hub. Click on one of the glowing pads (BUY, BAKE, SELL, SUMMARY, or RECIPES) to enter that area. The typical flow is: Buy ingredients → Bake products → Sell to customers → Check your Summary.',
            'buying': 'BUYING PHASE: Pick a vendor on the left, then buy ingredients (flour, sugar, eggs, etc.) that you need for your recipes. Check the Recipe Book on the right to see what ingredients each recipe needs.',
            'baking': 'BAKING PHASE: Click on a recipe card to start baking it. Your oven will process it over time. Use the time speed buttons to speed things up. When done, products move to "Ready Products".',
            'selling': 'SELLING PHASE: Customers arrive automatically. They will buy your products from the display case. Set your markup % to control prices. Watch for customers who need manual service (orange border).',
            'summary': 'SUMMARY: Review your day\'s numbers — revenue, costs, and profit. Click "Start Next Day" to continue, or go back to the Main Menu.',
            'menu': 'MAIN MENU: Click "New Game" to start fresh, or "Watch & Learn" to see an AI play the game and explain everything.',
            'setup': 'SETUP: Choose how to set up your bakery. The Interactive Storybook is best for first-timers. Or use "Skip" to jump right in with default settings.'
        };

        const currentHelp = phaseHelp[this.currentPhase] || 'Click around to explore! The game follows a daily cycle: Buy → Bake → Sell → Summary.';

        this.showPopup({
            icon: '💡',
            title: 'How This Works',
            message: currentHelp + '\n\n<strong>Daily Cycle:</strong> Each day you Buy ingredients, Bake products, Sell to customers, then see your Summary. Repeat to grow your bakery!',
            type: 'info',
            buttons: [
                { text: 'Start Tutorial', action: () => this.showTutorial(), style: 'secondary' },
                { text: 'Got It!', action: 'close' }
            ]
        });
    }

    // Generate contextual help banner HTML for a given phase
    getPhaseHelpBanner(phase) {
        if (this.helpDismissed[phase]) return '';

        const banners = {
            buying: {
                title: '💡 How to Buy Ingredients',
                body: 'You need ingredients to bake! Pick a vendor, then click the buy buttons next to each ingredient.',
                steps: [
                    { icon: '1️⃣', text: 'Choose a vendor on the left' },
                    { icon: '2️⃣', text: 'Click + to buy ingredients' },
                    { icon: '3️⃣', text: 'Check Recipe Book for what you need' },
                    { icon: '4️⃣', text: 'Click "Done Shopping" when ready' }
                ]
            },
            baking: {
                title: '💡 How to Bake Products',
                body: 'Turn your ingredients into products to sell! Click a recipe to start baking.',
                steps: [
                    { icon: '1️⃣', text: 'Click a recipe card (e.g. Bread)' },
                    { icon: '2️⃣', text: 'Wait for it to finish baking' },
                    { icon: '3️⃣', text: 'Speed up time with 2x/5x buttons' },
                    { icon: '4️⃣', text: 'Click "Done Production" when ready' }
                ]
            },
            selling: {
                title: '💡 How to Sell Products',
                body: 'Your shop is open! Customers will arrive and buy from your display. Watch for ones needing help.',
                steps: [
                    { icon: '1️⃣', text: 'Set your Markup % (price slider)' },
                    { icon: '2️⃣', text: 'Customers arrive automatically' },
                    { icon: '3️⃣', text: 'Help manual customers (orange glow)' },
                    { icon: '4️⃣', text: 'Close shop when you\'re done' }
                ]
            },
            summary: {
                title: '💡 Your Day is Done!',
                body: 'Review how your bakery performed today. Green numbers = good! Red numbers = losses.',
                steps: [
                    { icon: '📊', text: 'Revenue = what customers paid' },
                    { icon: '💸', text: 'Costs = ingredients + expenses' },
                    { icon: '💰', text: 'Net Profit = what you keep' },
                    { icon: '☀️', text: 'Click "Start Next Day" to continue' }
                ]
            }
        };

        const banner = banners[phase];
        if (!banner) return '';

        return `
            <div class="phase-help-banner" id="help-banner-${phase}">
                <button class="help-dismiss" onclick="window.game.dismissHelpBanner('${phase}')" title="Dismiss">✕</button>
                <div class="help-title">${banner.title}</div>
                <div class="help-body">${banner.body}</div>
                <div class="help-steps">
                    ${banner.steps.map(s => `<div class="help-step-chip">${s.icon} ${s.text}</div>`).join('')}
                </div>
            </div>
        `;
    }

    dismissHelpBanner(phase) {
        this.helpDismissed[phase] = true;
        const el = document.getElementById(`help-banner-${phase}`);
            if (el) {
        if (window.gsap) {
            gsap.to(el, { height: 0, opacity: 0, padding: 0, margin: 0, duration: 0.3, onComplete: () => el.remove() });
        } else {
            el.remove();
        }
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
        // Show choice between StoryBook (educational) and Quick Start
        this.showSetupModeChoice();
    }

    showSetupModeChoice() {
        const container = document.getElementById('game-container');
        if (!container) return;

        container.classList.add('full-screen');
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                background: linear-gradient(135deg, #1a1208 0%, #2d1f14 50%, #1a1208 100%);
                padding: 40px;
            ">
                <h1 style="
                    font-family: 'Fredoka', cursive;
                    font-size: 48px;
                    color: #d4af37;
                    text-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
                    margin-bottom: 20px;
                ">🥐 Set Up Your Bakery</h1>
                
                <p style="
                    font-family: 'Inter', sans-serif;
                    font-size: 18px;
                    color: #c9a66b;
                    text-align: center;
                    max-width: 650px;
                    margin-bottom: 16px;
                    line-height: 1.7;
                ">Before you start selling, you need to set up your bakery!<br>Choose how much detail you want:</p>
                
                <p style="
                    font-size: 14px;
                    color: rgba(255,255,255,0.45);
                    margin-bottom: 35px;
                ">💡 Not sure? Choose "Skip & Start Playing" to jump right in!</p>
                
                <div style="
                    display: flex;
                    gap: 30px;
                    flex-wrap: wrap;
                    justify-content: center;
                ">
                    <!-- Skip & Play (BEGINNER DEFAULT) -->
                    <div id="choice-skip-card" style="
                        background: linear-gradient(145deg, #1a2d15, #2a3d1a);
                        border: 3px solid #4caf50;
                        border-radius: 20px;
                        padding: 30px;
                        width: 280px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                    " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 40px rgba(76, 175, 80, 0.3)';"
                       onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        <div style="font-size: 60px; margin-bottom: 15px;">⚡</div>
                        <h2 style="
                            font-family: 'Fredoka', cursive;
                            font-size: 24px;
                            color: #81c784;
                            margin-bottom: 10px;
                        ">Skip & Start Playing</h2>
                        <p style="
                            font-size: 15px;
                            color: #a5d6a7;
                            line-height: 1.5;
                            margin-bottom: 15px;
                        ">Use ready-made settings and jump straight into buying, baking, and selling!</p>
                        <div style="
                            background: rgba(76, 175, 80, 0.25);
                            border: 1px solid #4caf50;
                            border-radius: 10px;
                            padding: 10px;
                            font-size: 13px;
                            color: #81c784;
                            font-weight: 600;
                        ">⭐ Best for Beginners</div>
                        <div style="
                            margin-top: 15px;
                            font-size: 12px;
                            color: #81c784;
                        ">⏱ Instant — start playing now!</div>
                    </div>
                    
                    <!-- StoryBook Mode -->
                    <div id="choice-storybook" style="
                        background: linear-gradient(145deg, #2a1f15, #3d2a1a);
                        border: 2px solid #d4af37;
                        border-radius: 20px;
                        padding: 30px;
                        width: 280px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                    " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 40px rgba(212, 175, 55, 0.3)';"
                       onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        <div style="font-size: 60px; margin-bottom: 15px;">📚</div>
                        <h2 style="
                            font-family: 'Fredoka', cursive;
                            font-size: 24px;
                            color: #d4af37;
                            margin-bottom: 10px;
                        ">Interactive Storybook</h2>
                        <p style="
                            font-size: 14px;
                            color: #c9a66b;
                            line-height: 1.5;
                            margin-bottom: 15px;
                        ">Read a story and make choices to learn about starting a real business</p>
                        <div style="
                            background: rgba(212, 175, 55, 0.15);
                            border: 1px solid rgba(212, 175, 55, 0.4);
                            border-radius: 10px;
                            padding: 10px;
                            font-size: 12px;
                            color: #d4af37;
                        ">📖 Learn business concepts while playing</div>
                        <div style="
                            margin-top: 15px;
                            font-size: 12px;
                            color: #8b7355;
                        ">⏱ ~15 minutes</div>
                    </div>
                    
                    <!-- Quick Start Mode -->
                    <div id="choice-quickstart" style="
                        background: linear-gradient(145deg, #1a1510, #2a2015);
                        border: 2px solid #8b7355;
                        border-radius: 20px;
                        padding: 30px;
                        width: 280px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                    " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 40px rgba(139, 115, 85, 0.2)';"
                       onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        <div style="font-size: 60px; margin-bottom: 15px;">🏙️</div>
                        <h2 style="
                            font-family: 'Fredoka', cursive;
                            font-size: 24px;
                            color: #c9a66b;
                            margin-bottom: 10px;
                        ">Explore Startup City</h2>
                        <p style="
                            font-size: 14px;
                            color: #a08060;
                            line-height: 1.5;
                            margin-bottom: 15px;
                        ">Walk around a city, visit buildings, and customize every detail of your bakery</p>
                        <div style="
                            background: rgba(139, 115, 85, 0.2);
                            border: 1px solid #8b7355;
                            border-radius: 10px;
                            padding: 10px;
                            font-size: 12px;
                            color: #a08060;
                        ">🎮 Full control — choose everything</div>
                        <div style="
                            margin-top: 15px;
                            font-size: 12px;
                            color: #8b7355;
                        ">⏱ ~5-10 minutes | WASD to move</div>
                    </div>
                </div>
            </div>
        `;

        // Wire up buttons
        document.getElementById('choice-storybook').onclick = () => this.showStoryBookSetup();
        document.getElementById('choice-quickstart').onclick = () => this.showStartupCitySetup();
        document.getElementById('choice-skip-card').onclick = () => this.skipSetupWithDefaults();
    }

    showStoryBookSetup() {
        console.log('Starting StoryBook setup...');
        try {
            this.cleanupPhaser();

            const container = document.getElementById('game-container');
            if (!container) {
                throw new Error('game-container element not found');
            }

            container.classList.add('full-screen');
            container.style.padding = '';
            container.innerHTML = `<div id="phaser-container" style="width: 100%; height: 100%; overflow: hidden;"></div>`;

            if (typeof Phaser === 'undefined') {
                throw new Error('Phaser library not loaded');
            }
            if (typeof StoryBookScene === 'undefined') {
                throw new Error('StoryBookScene class not loaded');
            }

            const config = {
                type: Phaser.AUTO,
                width: window.innerWidth,
                height: window.innerHeight - 60,
                parent: 'phaser-container',
                backgroundColor: '#1a1208',
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                },
                physics: {
                    default: 'arcade',
                    arcade: { gravity: { y: 0 }, debug: false }
                },
                scene: [StoryBookScene]
            };

            this.phaserGame = new Phaser.Game(config);
            console.log('StoryBook setup initialized');
        } catch (err) {
            console.error('Error in showStoryBookSetup:', err);
            alert('Failed to start storybook: ' + err.message);
            this.showMainMenu();
        }
    }

    showStartupCitySetup() {
        console.log('showStartupCitySetup called');
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

    skipSetupWithDefaults() {
        console.log('Skipping setup with defaults...');
        // Apply default setup choices
        const options = GAME_CONFIG.SETUP_OPTIONS;
        
        this.setupChoices = {
            location: options.locations.find(l => l.id === 'suburban') || options.locations[0],
            financing: options.financing.find(f => f.id === 'savings') || options.financing[0],
            equipment: {
                oven: options.equipment.ovens.find(o => o.id === 'standard') || options.equipment.ovens[1],
                mixer: options.equipment.mixers.find(m => m.id === 'standard') || options.equipment.mixers[1],
                display: options.equipment.displays.find(d => d.id === 'standard') || options.equipment.displays[1]
            },
            staff: options.staff.find(s => s.id === 'solo') || options.staff[0],
            paperwork: options.paperwork.filter(p => p.required).map(p => p.id),
            insurance: options.insurance.find(i => i.id === 'basic') || options.insurance[0],
            utilities: {
                power: options.utilities.find(u => u.id === 'power_standard'),
                internet: options.utilities.find(u => u.id === 'internet_basic')
            }
        };

        this.finishSetup();
    }

    finishStoryBookSetup(choices, budget) {
        console.log('Finishing StoryBook setup with choices:', choices);
        
        // Convert storybook choices to engine-compatible format
        const options = GAME_CONFIG.SETUP_OPTIONS;
        
        // Map storybook choices to game config options
        this.setupChoices = {
            location: options.locations.find(l => l.id === (choices.location || 'suburban')) || options.locations[0],
            financing: options.financing.find(f => f.id === (choices.financing || 'savings')) || options.financing[0],
            equipment: {
                oven: options.equipment.ovens.find(o => o.id === (choices.equipment?.oven || 'standard')) || options.equipment.ovens[1],
                mixer: options.equipment.mixers.find(m => m.id === (choices.equipment?.mixer || 'standard')) || options.equipment.mixers[1],
                display: options.equipment.displays.find(d => d.id === (choices.equipment?.display || 'standard')) || options.equipment.displays[1]
            },
            staff: options.staff.find(s => s.id === (choices.staff || 'solo')) || options.staff[0],
            paperwork: choices.permits || options.paperwork.filter(p => p.required).map(p => p.id),
            insurance: options.insurance.find(i => i.id === (choices.insurance || 'basic')) || options.insurance[0],
            utilities: {
                power: options.utilities.find(u => u.id === 'power_standard'),
                internet: options.utilities.find(u => u.id === 'internet_basic')
            }
        };

        // Store business name from storybook
        if (choices.businessName) {
            this.businessName = choices.businessName;
        }

        // Apply budget adjustments if any
        if (budget && budget.spent > 0) {
            this.engine.cash -= budget.spent;
        }

        this.finishSetup();
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

        this.purgeExpiredScenarioEffects();

        // Show dashboard, staff, and equipment buttons
        const dashboardBtn = document.getElementById('btn-dashboard');
        const staffBtn = document.getElementById('btn-staff');
        const equipmentBtn = document.getElementById('btn-equipment');
        const strategyBtn = document.getElementById('btn-strategy');
        const customersBtn = document.getElementById('btn-customers');
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
        if (customersBtn && this.customerDB) {
            customersBtn.style.display = 'inline-block';
            customersBtn.onclick = () => this.showCustomerDatabase();
        }

        // Market Watch (competitor intel) button
        const marketWatchBtn = document.getElementById('btn-market-watch');
        if (marketWatchBtn && this.world && this.world.subsystems && this.world.subsystems.competitors) {
            marketWatchBtn.style.display = 'inline-block';
            marketWatchBtn.onclick = () => this.showMarketWatchPanel();
        }

        // Reviews (reputation dashboard) button
        const reviewsBtn = document.getElementById('btn-reviews');
        if (reviewsBtn && this.world && this.world.state) {
            reviewsBtn.style.display = 'inline-block';
            reviewsBtn.onclick = () => this.showReputationPanel();
        }

        // Advertising / Marketing button
        const adBtn = document.getElementById('btn-advertising');
        if (adBtn && this.world && this.world.subsystems.advertising) {
            adBtn.style.display = 'inline-block';
            adBtn.onclick = () => this.showAdvertisingPanel();
        }

        // Technology button
        const techBtn = document.getElementById('btn-technology');
        if (techBtn && this.world && this.world.subsystems.technology) {
            techBtn.style.display = 'inline-block';
            techBtn.onclick = () => this.showTechnologyPanel();
        }

        // Finance (loans/debt) button
        const finBtn = document.getElementById('btn-finance');
        if (finBtn && this.world && this.world.subsystems.loans) {
            finBtn.style.display = 'inline-block';
            finBtn.onclick = () => this.showFinancePanel();
        }

        // Expansion button
        const expBtn = document.getElementById('btn-expansion');
        if (expBtn && this.world && this.world.subsystems.expansion) {
            expBtn.style.display = 'inline-block';
            expBtn.onclick = () => this.showExpansionPanel();
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

        // Show floating help button
        this.showFloatingHelp();

        // Add Hub Quick-Reference Card for new players
        if (!this.helpDismissed['hub']) {
            const dayPhases = this.engine.day <= 1 ? 
                { buy: 'current', bake: '', sell: '', summary: '' } :
                { buy: '', bake: '', sell: '', summary: '' };
            const quickRef = document.createElement('div');
            quickRef.className = 'hub-quick-ref';
            quickRef.innerHTML = `
                <button class="ref-close" onclick="this.parentElement.remove(); window.game.helpDismissed['hub']=true;">✕</button>
                <h4>📝 Your Daily To-Do List</h4>
                <div class="ref-step ${dayPhases.buy}">
                    <span class="ref-num">1</span> <span>Click <strong>BUY</strong> — Purchase ingredients</span>
                </div>
                <div class="ref-step ${dayPhases.bake}">
                    <span class="ref-num">2</span> <span>Click <strong>BAKE</strong> — Make products</span>
                </div>
                <div class="ref-step ${dayPhases.sell}">
                    <span class="ref-num">3</span> <span>Click <strong>SELL</strong> — Open your shop</span>
                </div>
                <div class="ref-step ${dayPhases.summary}">
                    <span class="ref-num">4</span> <span>Click <strong>SUMMARY</strong> — End the day</span>
                </div>
                <div style="margin-top:12px; font-size:12px; color:rgba(255,255,255,0.5);">Click any glowing pad below to begin!</div>
            `;
            container.appendChild(quickRef);
        }

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
        this.checkForScenarios();
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

        // Reset daily encounter state & buffs
        this._encounterFiredToday = false;
        this._todayEncounters = [];
        this._dayBuffs = {};
        
        // Start customer database day
        if (this.customerDB) {
            this.customerDB.startDay();
        }

        // === WORLD: Build rich morning newspaper-style briefing ===
        const briefing = this._buildMorningBriefing();

        this.showPopup({
            icon: '📰',
            title: `Day ${this.engine.day} — Morning Briefing`,
            message: briefing,
            type: 'info',
            buttons: [{ text: 'Open the Bakery →', action: () => {
                this.showModeHub();
                // Fire a random daily encounter shortly after arriving at the hub
                setTimeout(() => this._maybeFireDailyEncounter(), 1200);
            }}]
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
            ${this.getPhaseHelpBanner('buying')}
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

        // Get current season for seasonal hints
        const season = this._getCurrentSeason();
        const seasonIcons = { SPRING: '🌸', SUMMER: '☀️', FALL: '🍂', WINTER: '❄️' };
        const seasonLabel = season ? `${seasonIcons[season] || ''} ${season.charAt(0) + season.slice(1).toLowerCase()}` : '';

        // Build vendor cards — merge GAME_CONFIG.VENDORS with WORLD vendor data
        const worldVendors = GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.VENDORS ? GAME_CONFIG.WORLD.VENDORS : [];

        list.innerHTML = `
            ${seasonLabel ? `<div style="text-align:center; font-size:12px; color:#a5b4fc; margin-bottom:8px; padding:4px; background: rgba(99,102,241,0.15); border-radius:6px;">
                Season: <strong>${seasonLabel}</strong> — affects prices & availability
            </div>` : ''}
        ` + Object.entries(GAME_CONFIG.VENDORS).map(([key, vendor]) => {
            const priceLabel = vendor.priceMultiplier < 1 ? '💚 Cheaper' : vendor.priceMultiplier > 1 ? '💛 Premium' : '⚪ Standard';
            const qualityLabel = vendor.qualityMultiplier > 1 ? '✨ High Quality' : vendor.qualityMultiplier < 1 ? '📦 Basic Quality' : '👍 Good Quality';

            // Find matching WORLD vendor for extra info
            const worldV = worldVendors.find(wv => wv.id === key.toLowerCase());
            const reliabilityHtml = worldV ? `<div class="vendor-reliability" style="font-size:11px; color:#94a3b8;" title="How often deliveries arrive on time">📦 Reliability: ${(worldV.reliability * 100).toFixed(0)}%</div>` : '';

            // Check if weather is delaying this vendor
            let delayWarning = '';
            if (this.world && this.world.subsystems && this.world.subsystems.weather && this.world.subsystems.weather.isDeliveryDelayed()) {
                if (!worldV || worldV.reliability < 0.9) {
                    delayWarning = `<div style="font-size:11px; color:#fbbf24;">⚠️ Weather delays possible</div>`;
                }
            }

            return `
                <div class="vendor-card" data-vendor="${key}">
                    <div class="vendor-icon">${vendor.icon}</div>
                    <div class="vendor-info">
                        <div class="vendor-name">${vendor.name}</div>
                        <div class="vendor-specialty">${vendor.specialty}</div>
                        <div class="vendor-price">${priceLabel}</div>
                        <div class="vendor-quality">${qualityLabel}</div>
                        ${reliabilityHtml}
                        ${delayWarning}
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
        const season = this._getCurrentSeason();
        const seasonalConfig = (GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.SEASONAL_INGREDIENTS && season)
            ? GAME_CONFIG.WORLD.SEASONAL_INGREDIENTS[season] : null;

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

                // Seasonal availability tag
                let seasonalTag = '';
                if (seasonalConfig) {
                    const seasonKey = key.toUpperCase();
                    const avail = seasonalConfig[seasonKey];
                    if (avail !== undefined && avail !== 1.0) {
                        if (avail >= 1.2) {
                            seasonalTag = `<span style="font-size:10px; background:#065f46; color:#6ee7b7; padding:1px 5px; border-radius:4px; margin-left:4px;" title="In season — abundant & cheaper">🌿 In Season</span>`;
                        } else if (avail >= 0.8) {
                            // Normal-ish, no tag needed
                        } else if (avail >= 0.4) {
                            seasonalTag = `<span style="font-size:10px; background:#78350f; color:#fbbf24; padding:1px 5px; border-radius:4px; margin-left:4px;" title="Limited seasonal availability — may cost more">🍂 Limited</span>`;
                        } else if (avail > 0) {
                            seasonalTag = `<span style="font-size:10px; background:#7f1d1d; color:#fca5a5; padding:1px 5px; border-radius:4px; margin-left:4px;" title="Out of season — scarce & expensive">⛔ Scarce</span>`;
                        }
                    }
                }

                const card = `
                    <div class="ingredient-card" data-ingredient="${key}" data-vendor="${vendorKey}">
                        <div class="ing-icon">${ing.icon}</div>
                        <div class="ing-name">${ing.name}${seasonalTag}</div>
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

        // Handle buy buttons — with optional Haggle Wheel minigame
        grid.querySelectorAll('.btn-buy').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const card = btn.closest('.ingredient-card');
                const ingKey = card.dataset.ingredient;
                const vendorKey = card.dataset.vendor;
                const input = card.querySelector('.qty-input');
                const qty = parseFloat(input.value) || 1;

                // === MINIGAME: Haggle Wheel (random chance on larger purchases) ===
                let haggleDiscount = 1.0;
                if (this.miniGames && qty >= 3) {
                    const haggleChance = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.MINIGAMES)
                        ? GAME_CONFIG.WORLD.MINIGAMES.haggleChance || 0.25
                        : 0.25;
                    if (Math.random() < haggleChance) {
                        try {
                            const ingConfig = GAME_CONFIG.INGREDIENTS[ingKey];
                            const basePrice = ingConfig ? ingConfig.cost : 5;
                            const result = await this.miniGames.showHaggleWheel(
                                ingConfig ? ingConfig.name : ingKey,
                                basePrice * qty,
                                vendorKey
                            );
                            if (result && result.multiplier) {
                                haggleDiscount = result.multiplier;
                            }
                        } catch (err) { /* skip on error */ }
                    }
                }

                const result = this.engine.purchaseIngredient(ingKey, qty, vendorKey);

                if (result.success) {
                    // Apply haggle discount as a cash refund
                    if (haggleDiscount < 1.0) {
                        const refund = result.cost * (1 - haggleDiscount);
                        this.engine.cash += refund;
                        this.showPopup({
                            icon: '🎉',
                            title: 'Haggle Success!',
                            message: `${result.message} (Quality: ${result.quality.toFixed(0)}%)\n💰 Haggle saved you $${refund.toFixed(2)}!`,
                            type: 'success',
                            autoClose: 2000
                        });
                    } else {
                        this.showPopup({
                            icon: '✅',
                            title: 'Purchased!',
                            message: `${result.message} (Quality: ${result.quality.toFixed(0)}%)`,
                            type: 'success',
                            autoClose: 1000
                        });
                    }
                    // Trigger journal for first purchase
                    if (this.journal && this.engine.day <= 3) {
                        this.journal.onSituation('first_purchase');
                    }
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
            ${this.getPhaseHelpBanner('baking')}
            <div class="phase-header">
                <h2>🍞 Bakery Production</h2>
                <p>Click a recipe card to start baking. Use the time speed buttons to speed things up!</p>
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
            btn.onclick = async (e) => {
                e.stopPropagation();
                const card = btn.closest('.recipe-card');
                const recipeKey = card.dataset.recipe;

                const result = this.engine.startBaking(recipeKey, 1);

                if (result.success) {
                    // === MINIGAME: Quality Dice (chance to roll for quality bonus) ===
                    let diceBonus = '';
                    if (this.miniGames) {
                        const diceChance = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.MINIGAMES)
                            ? GAME_CONFIG.WORLD.MINIGAMES.qualityDiceChance || 0.20
                            : 0.20;
                        if (Math.random() < diceChance) {
                            try {
                                const recipe = GAME_CONFIG.RECIPES[recipeKey];
                                const avgSkill = this.staffManager ? this.staffManager.getAverageSkill() : 50;
                                const diceResult = await this.miniGames.showQualityDice(
                                    recipe ? recipe.name : recipeKey,
                                    result.quality || 70,
                                    avgSkill
                                );
                                if (diceResult && diceResult.bonus > 0) {
                                    diceBonus = `\n🎲 Quality Dice: +${diceResult.bonus}% quality!`;
                                    // Apply bonus to the latest production item
                                    if (this.engine.productionQueue && this.engine.productionQueue.length > 0) {
                                        const lastItem = this.engine.productionQueue[this.engine.productionQueue.length - 1];
                                        if (lastItem) lastItem.quality = Math.min(100, (lastItem.quality || 70) + diceResult.bonus);
                                    }
                                }
                            } catch (err) { /* skip on error */ }
                        }
                    }

                    // Trigger journal for baking
                    if (this.journal) {
                        this.journal.onSituation('baking_started');
                    }

                    // Degrade oven on use
                    if (this.engine.degradeEquipmentOnUse) {
                        this.engine.degradeEquipmentOnUse('oven');
                    }

                    this.showPopup({
                        icon: '🔥',
                        title: 'Baking Started!',
                        message: result.message + diceBonus,
                        type: 'success',
                        autoClose: diceBonus ? 2000 : 1000
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

        // === MINIGAME: Forecast Bet before opening ===
        if (this.miniGames && this.world && this.world.subsystems && this.world.subsystems.weather) {
            const freq = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.MINIGAMES) 
                ? GAME_CONFIG.WORLD.MINIGAMES.forecastBetChance || 0.15 
                : 0.15;
            if (Math.random() < freq) {
                const weather = this.world.subsystems.weather;
                const forecasted = weather.currentWeather ? weather.currentWeather.type : 'clear';
                // Estimate demand level based on weather traffic
                const trafficMult = weather.getTrafficMultiplier ? weather.getTrafficMultiplier() : 1.0;
                let actualLevel = 'average';
                if (trafficMult >= 1.4) actualLevel = 'rush';
                else if (trafficMult >= 1.2) actualLevel = 'busy';
                else if (trafficMult <= 0.5) actualLevel = 'dead';
                else if (trafficMult <= 0.7) actualLevel = 'quiet';
                
                this.miniGames.showForecastBet(actualLevel, forecasted).then(result => {
                    if (result && result.bonus) {
                        // Apply demand prediction accuracy bonus
                        this.engine.trafficMultiplier = (this.engine.trafficMultiplier || 1.0) * (1 + result.bonus);
                    }
                    this._continueSellingPhase();
                }).catch(() => this._continueSellingPhase());
                return;
            }
        }
        this._continueSellingPhase();
    }

    _continueSellingPhase() {
        // Build enhanced world conditions HUD for selling phase
        const worldConditions = this._buildSellingWorldHUD ? this._buildSellingWorldHUD() : '';

        const container = document.getElementById('game-container');
        if (container) {
            container.style.padding = '0';
            container.style.overflow = 'auto';
        }

        container.innerHTML = `
            <div style="padding: 20px; min-height: 100%;">
            ${this.getPhaseHelpBanner('selling')}
            <div class="phase-header">
                <h2>💰 Open Shop - Day ${this.engine.day}</h2>
                <p>Customers arrive automatically and buy your products! Set your markup to control prices. Time: <span id="game-time">${this.engine.getTimeString()}</span></p>
                ${worldConditions}
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
                    ${this.journal ? '<button class="btn btn-secondary" onclick="window.game.journal.showJournal()" style="margin-left:8px;">📖 Journal</button>' : ''}
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

    /**
     * Serve customer - always via staff assignment
     */
    async manualServeCustomer(customerId) {
        const customer = this.getCustomerById(customerId);
        if (!customer) return;

        // Customer just orders what they want
        if (customer.wantsItem) {
            const saleResult = this.engine.processSale(customer.wantsItem, 1);
            
            if (saleResult.success) {
                // Record purchase in customer database
                if (this.customerDB && customer.dbId) {
                    const dbCustomer = this.customerDB.customers.get(customer.dbId);
                    if (dbCustomer) {
                        const quality = saleResult.quality || 100;
                        const price = saleResult.revenue || 0;
                        this.customerDB.processPurchase(dbCustomer, customer.wantsItem, price, quality);
                    }
                }
                
                // Show success
                const happyDialogues = GAME_CONFIG.CUSTOMER_DIALOGUES.happy;
                const msg = happyDialogues[Math.floor(Math.random() * happyDialogues.length)];
                
                customer.state = 'success';
                customer.resultMessage = msg;
                customer.resultRevenue = saleResult.revenue;
                customer.resultFace = '😊';
                
                this.releaseAssignedStaff(customer);
                this.renderCustomerArea();
                
                // Notify about revenue
                if (this.notificationSystem) {
                    this.notificationSystem.moneyEarned(saleResult.revenue);
                }
                
                this.logAutomationEvent('sale', `${customer.name} bought ${customer.wantsItem}`, {
                    item: customer.wantsItem,
                    amount: `$${saleResult.revenue.toFixed(2)}`,
                    auto: false
                });
                
                this.renderDisplayProducts();
                this.updateStats();
                
                setTimeout(() => {
                    this.removeCustomer(customer);
                }, 2000);
            } else {
                this.handleOutOfStock(customer);
            }
        } else {
            this.removeCustomer(customer);
        }
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

        // Check if staff has server role
        if (staff.role !== 'server' && staff.role !== 'owner') {
            if (this.notificationSystem) {
                this.notificationSystem.warning(`${staff.name} is a ${staff.role}, not a server. Only servers can serve customers.`);
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

        // Get available staff for assignment dropdown (only servers and owner)
        const availableStaff = this.staffManager ? 
            this.staffManager.getAvailableStaff().filter(s => s.role === 'server' || s.role === 'owner') : 
            [];
        const staffOptions = availableStaff.map(s => 
            `<option value="${s.id}">${s.name}${s.role !== 'owner' ? ` (👔 ${s.role})` : ''}</option>`
        ).join('');

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
                    ${availableStaff.length > 0 ? `
                        <div class="staff-assignment" style="margin: 10px 0;">
                            <select class="staff-select" id="staff-select-${customer.id}" 
                                    style="padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.3); 
                                           background: rgba(0,0,0,0.3); color: white; width: 100%; margin-bottom: 8px;">
                                <option value="">Assign Staff...</option>
                                ${staffOptions}
                            </select>
                            <button class="btn btn-primary" style="width: 100%;" 
                                    onclick="window.game.assignStaffToCustomer('${customer.id}')">
                                👔 Assign Selected Staff
                            </button>
                        </div>
                    ` : ''}
                    <div class="service-actions">
                        <button class="btn btn-secondary" onclick="window.game.manualServeCustomer('${customer.id}')">🙋 Serve Manually</button>
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

        this.purgeExpiredScenarioEffects();
        this.checkForScenarios();

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
                const scenarioDemand = this.getScenarioModifier('demand');
                const scenarioTraffic = this.getScenarioModifier('traffic');
                const loyaltyBoost = 1 + this.getScenarioModifier('loyalty', { defaultValue: 0, operation: 'add' });
                
                // === WORLD SIMULATION: unified demand multiplier (all subsystems) ===
                let worldDemandMult = 1.0;
                if (this.world && this.world.getDemandMultiplier) {
                    worldDemandMult = this.world.getDemandMultiplier();
                }
                
                const spawnChance = (GAME_CONFIG.DEMAND.baseCustomersPerHour * hourMult * appealMult * scenarioDemand * scenarioTraffic * loyaltyBoost * worldDemandMult) / 60 / 10;

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
            .filter(([key, p]) => {
                if (p.quantity <= 0) return false;

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
                        <div class="customer-face" style="font-size: 64px;">${customerData.face || '🙂'}</div>
                        <div class="customer-name">${customerData.name || 'Customer'}</div>
                        <div class="customer-dialogue">"${message}"</div>
                        <div class="customer-mood">😢 Disappointed</div>
                    </div>
                `;
            }

            this.engine.missedCustomer();
            
            // Phase 1: Pricing elasticity consequence
            // Track if customer left due to price vs. stockout
            const hasAnyStock = Object.values(this.engine.products).some(p => p.quantity > 0);
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
                if (customerArea) {
                    customerArea.innerHTML = '<div class="waiting-message">Waiting for customers...</div>';
                }
            }, 2000);

            return;
        }

        const orderDialogues = GAME_CONFIG.CUSTOMER_DIALOGUES.ordering;
        const orderMsg = orderDialogues[Math.floor(Math.random() * orderDialogues.length)]
            .replace('{item}', GAME_CONFIG.RECIPES[wantsItem]?.name || wantsItem);

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

        // Record purchase in customer database
        if (this.customerDB && customer.dbId) {
            const dbCustomer = this.customerDB.customers.get(customer.dbId);
            if (dbCustomer) {
                const quality = result.quality || 100;
                const price = result.revenue || 0;
                this.customerDB.processPurchase(dbCustomer, customer.wantsItem, price, quality);
            }
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
        
        // Only servers and owners can serve customers
        const available = this.engine.staff.filter(staff => 
            !staff.currentCustomer && 
            staff.fatigue < 95 &&
            (staff.role === 'server' || staff.role === 'owner')
        );
        
        if (available.length === 0) return null;
        
        // Sort by skill level and fatigue
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
        
        // End customer database day
        if (this.customerDB) {
            this.customerDB.endDay();
        }

        // === WORLD SIMULATION: tick all subsystems ===
        if (this.world) {
            const engineSnapshot = {
                day: this.engine.day,
                cash: this.engine.cash,
                revenue: this.engine.dailyStats.revenue,
                customersServed: this.engine.dailyStats.customersServed,
                products: this.engine.products,
                staff: this.engine.staff,
                equipment: this.engine.equipment,
                reputation: this.customerDB ? this.customerDB.metrics.averageSatisfaction : 50,
                staffMorale: this.staffManager ? this.staffManager.moraleSystem.teamMorale : 70,
                equipmentQuality: this.engine.getEquipmentQualityModifier ? this.engine.getEquipmentQualityModifier() : 1.0
            };
            this.world.simulateDay(this.engine.day, engineSnapshot);

            // Push world events through notification feed (Step 4)
            if (this.world.getRecentEvents) {
                const recentEvents = this.world.getRecentEvents(5);
                this._notifyWorldEvents({ events: recentEvents });
            }

            // Apply weather delivery delay to economy
            if (this.world.subsystems && this.world.subsystems.weather && this.economy.setWeatherDeliveryDelay) {
                this.economy.setWeatherDeliveryDelay(this.world.subsystems.weather.isDeliveryDelayed());
            }

            // Step 11: Process loan payments (deduct cash)
            const loanSys = this.world.subsystems.loans || null;
            if (loanSys) {
                for (const loan of loanSys.state.loans) {
                    if (loan._pendingPayment && loan._pendingPayment > 0) {
                        this.engine.cash = Math.max(0, this.engine.cash - loan._pendingPayment);
                        loan._pendingPayment = 0;
                    }
                }
            }

            // Step 11: Track waste % for environmental system
            const envSys = this.world.subsystems.environmental || null;
            if (envSys) {
                this.world.state._envWastePct = envSys.state.wastePct;
            }

            // Step 11: Apply global cost modifier to ingredient prices
            if (this.world.state.globalCostMod && this.world.state.globalCostMod !== 1) {
                if (this.economy && this.economy.setGlobalCostMod) {
                    this.economy.setGlobalCostMod(this.world.state.globalCostMod);
                }
            }
        }

        // End staff manager day (morale, skill growth, events)
        if (this.staffManager && this.staffManager.endDay) {
            this.staffManager.endDay(this.engine.day);
            // Push staff events through notification feed (Step 4)
            this._notifyStaffEvents();
        }

        // Trigger journal situations based on day events
        if (this.journal) {
            this._triggerJournalSituations();
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
            ${this.getPhaseHelpBanner('summary')}
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
                
                ${this._buildWorldSummaryHtml()}
                ${this._buildDailyGazetteHtml(summary)}
                
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
                    ${this.journal ? '<button class="btn btn-secondary" id="btn-journal-summary">📖 Journal</button>' : ''}
                    <button class="btn btn-primary" id="btn-next-day">☀️ Start Day ${this.engine.day}</button>
                </div>
            </div>
        `;

        // Save game
        localStorage.setItem('bakery_save', JSON.stringify(this.engine.save()));

        document.getElementById('btn-main-menu').onclick = () => this.showMainMenu();
        document.getElementById('btn-next-day').onclick = () => this.startDay();
        
        // Wire journal button if present
        const journalBtn = document.getElementById('btn-journal-summary');
        if (journalBtn && this.journal) {
            journalBtn.onclick = () => this.journal.showJournal();
        }

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

    // ==================== WORLD: JOURNAL & SUMMARY HELPERS ====================

    /**
     * Trigger journal educational entries based on what happened today.
     */
    _triggerJournalSituations() {
        if (!this.journal) return;
        const stats = this.engine.dailyStats;
        const world = this.world ? this.world.state : null;

        // Price-related situations
        if (stats.revenue > 0 && stats.customersMissed > stats.customersServed * 0.3) {
            this.journal.onSituation('pricing_too_high');
        }
        if (stats.grossProfit < 0) {
            this.journal.onSituation('negative_profit');
        }
        if (stats.revenue > 200) {
            this.journal.onSituation('strong_revenue');
        }

        // Supply chain
        if (world && world.weather && world.weather.deliveryDelayed) {
            this.journal.onSituation('supply_disruption');
        }

        // Competition
        if (world && world.competitors && world.competitors.length > 0) {
            const hasPromo = world.competitors.some(c => c.activePromotion);
            if (hasPromo) {
                this.journal.onSituation('competitor_promotion');
            }
        }

        // Staff situations
        if (this.staffManager) {
            const morale = this.staffManager.moraleSystem.teamMorale;
            if (morale < 40) this.journal.onSituation('low_staff_morale');
            if (morale > 80) this.journal.onSituation('high_staff_morale');

            const pending = this.staffManager.moraleSystem.pendingRequests.filter(r => !r.resolved);
            if (pending.some(r => r.type === 'raise_request')) {
                this.journal.onSituation('raise_request');
            }
        }

        // Equipment
        if (this.engine.getEquipmentQualityModifier && this.engine.getEquipmentQualityModifier() < 0.85) {
            this.journal.onSituation('equipment_degraded');
        }

        // First day
        if (this.engine.day === 1) {
            this.journal.onSituation('first_day');
        }

        // Economic conditions
        if (this.economy && this.economy.getDemandMultiplier && this.economy.getDemandMultiplier() < 0.8) {
            this.journal.onSituation('economic_downturn');
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Random Daily Encounters                                            */
    /* ------------------------------------------------------------------ */

    /**
     * Called during startDay to maybe fire a random encounter event.
     * These are one-off narrative moments that affect the day's gameplay
     * through small bonuses/penalties and player choices.
     */
    _maybeFireDailyEncounter() {
        // Don't fire on day 1 (let the player settle in) or if already fired today
        if (this.engine.day <= 1 || this._encounterFiredToday) return;

        // ~40% chance of an encounter each day
        if (Math.random() > 0.4) return;

        this._encounterFiredToday = true;

        const encounters = this._getDailyEncounterPool();
        if (encounters.length === 0) return;

        const pick = encounters[Math.floor(Math.random() * encounters.length)];
        this._showEncounterPopup(pick);
    }

    /**
     * Build the pool of possible encounters filtered by the current world state.
     */
    _getDailyEncounterPool() {
        const day = this.engine.day;
        const cash = this.engine.cash;
        const ws = this.world && this.world.subsystems ? this.world.subsystems.weather : null;
        const weatherType = ws && ws.currentWeather ? ws.currentWeather.type : 'clear';
        const rep = this.world && this.world.state && this.world.state.reputation ? this.world.state.reputation.score : 50;

        const pool = [];

        // --- FOOD CRITIC VISIT ---
        if (day >= 3 && rep >= 30) {
            pool.push({
                id: 'food_critic',
                icon: '🍽️',
                title: 'Food Critic Spotted!',
                message: 'A well-known food critic just walked in! They\'ll judge your products today. How do you react?',
                choices: [
                    { text: '🎯 Focus on Quality', desc: 'Extra care on every order (+15% quality today)', effect: () => { this._applyDayBuff('quality', 0.15); } },
                    { text: '🎁 Offer a Free Sample', desc: 'Costs $5 but may boost reputation', effect: () => { this.engine.cash -= 5; this._boostReputation(8); } },
                    { text: '😊 Act Natural', desc: 'No change — let your normal work speak', effect: () => {} }
                ]
            });
        }

        // --- INGREDIENT WINDFALL ---
        pool.push({
            id: 'surprise_delivery',
            icon: '📦',
            title: 'Surprise Delivery!',
            message: 'A supplier sent extra flour by mistake! They say you can keep it.',
            choices: [
                { text: '✅ Keep It', desc: '+5 flour', effect: () => { this._addFreeIngredient('flour', 5); } },
                { text: '🤝 Return It', desc: 'Honest move — small reputation boost', effect: () => { this._boostReputation(5); } }
            ]
        });

        // --- RAINY DAY EVENT ---
        if (weatherType === 'rainy' || weatherType === 'stormy') {
            pool.push({
                id: 'rainy_comfort',
                icon: '☔',
                title: 'Comfort Food Weather',
                message: 'It\'s miserable outside. People crave warm, comforting treats. Adjust your approach?',
                choices: [
                    { text: '🔥 Push warm goods', desc: 'Hot items sell at +20% markup today', effect: () => { this._applyDayBuff('markup_hot', 0.20); } },
                    { text: '📱 Social media post', desc: 'Free advertising — small traffic boost', effect: () => { this._applyDayBuff('traffic', 0.12); } },
                    { text: '🤷 Ride it out', desc: 'No changes', effect: () => {} }
                ]
            });
        }

        // --- SUNNY DAY EVENT ---
        if (weatherType === 'sunny' || weatherType === 'clear') {
            pool.push({
                id: 'sunny_opportunity',
                icon: '☀️',
                title: 'Beautiful Day Outside!',
                message: 'The sunshine is bringing people out. A local park event asks if you want to set up a stall.',
                choices: [
                    { text: '🏕️ Set Up Stall ($10)', desc: 'Costs $10, but +25% traffic today', effect: () => { if (cash >= 10) { this.engine.cash -= 10; this._applyDayBuff('traffic', 0.25); } else { this._showQuickNotice('Not enough cash!'); } } },
                    { text: '🏪 Stay in Shop', desc: 'Keep things normal', effect: () => {} }
                ]
            });
        }

        // --- NEIGHBOR BAKER ---
        if (day >= 5) {
            pool.push({
                id: 'neighbor_baker',
                icon: '👩‍🍳',
                title: 'A Fellow Baker Visits',
                message: 'A retired baker from the neighborhood offers to share a tip.',
                choices: [
                    { text: '📚 Listen Carefully', desc: '+3% permanent skill boost for staff', effect: () => { this._boostStaffSkills(0.03); } },
                    { text: '🍰 Trade Recipes', desc: 'Gain some reputation from networking', effect: () => { this._boostReputation(4); } }
                ]
            });
        }

        // --- POWER FLICKER ---
        if (day >= 4 && Math.random() < 0.3) {
            pool.push({
                id: 'power_flicker',
                icon: '⚡',
                title: 'Power Flicker!',
                message: 'The lights flickered! Your oven needs a moment to stabilize. Slight efficiency loss today unless you act.',
                choices: [
                    { text: '🔧 Quick Fix ($8)', desc: 'Pay $8 to avoid any quality impact', effect: () => { if (cash >= 8) { this.engine.cash -= 8; } else { this._applyDayBuff('quality', -0.08); } } },
                    { text: '⏳ Wait It Out', desc: 'Small quality dip for first few batches', effect: () => { this._applyDayBuff('quality', -0.08); } }
                ]
            });
        }

        // --- LOYAL CUSTOMER ---
        if (day >= 7 && rep >= 50) {
            pool.push({
                id: 'loyal_fan',
                icon: '💛',
                title: 'A Loyal Customer Returns',
                message: '"I bring all my friends here!" — A regular customer is raving about your bakery online.',
                choices: [
                    { text: '🎉 Thank Them (free pastry)', desc: 'Costs nothing, +6 reputation', effect: () => { this._boostReputation(6); } },
                    { text: '📸 Ask for a Photo', desc: 'Social proof — +10% traffic today', effect: () => { this._applyDayBuff('traffic', 0.10); } }
                ]
            });
        }

        // --- HEALTH INSPECTOR HINT ---
        if (day >= 10) {
            pool.push({
                id: 'inspector_rumor',
                icon: '🔍',
                title: 'Health Inspector Rumor',
                message: 'Word on the street: an inspector might visit soon. Invest in cleanliness?',
                choices: [
                    { text: '🧹 Deep Clean ($12)', desc: 'Pay $12 — avoid any penalty if inspected', effect: () => { if (cash >= 12) { this.engine.cash -= 12; this._applyDayBuff('inspection_shield', 1); } else { this._showQuickNotice('Not enough cash!'); } } },
                    { text: '🤞 Take the Chance', desc: 'Might be fine — or might cost reputation', effect: () => { if (Math.random() < 0.35) { this._boostReputation(-8); this._showQuickNotice('Inspector found issues! -8 reputation'); } } }
                ]
            });
        }

        return pool;
    }

    /**
     * Display an encounter popup with choice buttons.
     */
    _showEncounterPopup(encounter) {
        const choicesHtml = encounter.choices.map((c, i) => `
            <button class="popup-btn primary" data-choice="${i}" style="display:block; width:100%; margin:4px 0; text-align:left; padding:8px 12px;">
                <strong>${c.text}</strong><br/>
                <span style="font-size:12px; color:#94a3b8;">${c.desc}</span>
            </button>
        `).join('');

        const overlay = document.createElement('div');
        overlay.className = 'game-popup-overlay';
        overlay.innerHTML = `
            <div class="game-popup info" style="max-width:420px;">
                <div class="popup-icon">${encounter.icon}</div>
                <div class="popup-title">${encounter.title}</div>
                <div class="popup-message" style="text-align:left; margin-bottom:12px;">${encounter.message}</div>
                <div class="encounter-choices">${choicesHtml}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        const popup = overlay.querySelector('.game-popup');
        if (window.gsap) {
            gsap.fromTo(popup,
                { scale: 0.5, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.75)' }
            );
        }

        overlay.querySelectorAll('[data-choice]').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.choice);
                const choice = encounter.choices[idx];
                if (choice && choice.effect) {
                    try { choice.effect(); } catch (e) { console.warn('Encounter effect error', e); }
                }
                if (window.gsap) {
                    gsap.to(popup, { scale: 0.8, opacity: 0, duration: 0.2, onComplete: () => overlay.remove() });
                } else {
                    overlay.remove();
                }
                // Log the encounter for the summary screen
                if (!this._todayEncounters) this._todayEncounters = [];
                this._todayEncounters.push({ icon: encounter.icon, title: encounter.title, choice: choice.text });
            };
        });
    }

    /* ---- Encounter helper effects ---- */

    _applyDayBuff(type, amount) {
        if (!this._dayBuffs) this._dayBuffs = {};
        this._dayBuffs[type] = (this._dayBuffs[type] || 0) + amount;
        // Traffic buffs apply immediately to engine
        if (type === 'traffic') {
            this.engine.trafficMultiplier = (this.engine.trafficMultiplier || 1.0) * (1 + amount);
        }
    }

    _getDayBuff(type) {
        return (this._dayBuffs && this._dayBuffs[type]) || 0;
    }

    _boostReputation(amount) {
        if (this.world && this.world.adjustReputation) {
            this.world.adjustReputation(amount, amount > 0 ? 'encounter bonus' : 'encounter penalty');
        }
    }

    _boostStaffSkills(amount) {
        if (this.staffManager && this.engine.staff) {
            this.engine.staff.forEach(s => {
                s.skill = Math.min(100, (s.skill || 50) + amount * 100);
            });
        }
    }

    _addFreeIngredient(key, qty) {
        if (this.engine.inventory && this.engine.inventory[key] !== undefined) {
            this.engine.inventory[key] += qty;
        }
    }

    _showQuickNotice(msg) {
        this.showPopup({ icon: 'ℹ️', title: 'Notice', message: msg, type: 'info', autoClose: 2000 });
    }

    /**
     * Get the current game season from the world simulation.
     * @returns {string|null} 'SPRING', 'SUMMER', 'FALL', or 'WINTER'
     */
    _getCurrentSeason() {
        if (this.world && this.world.state && this.world.state.weather && this.world.state.weather.season) {
            return this.world.state.weather.season;
        }
        // Fallback: compute from day number
        const day = this.engine ? this.engine.day : 1;
        const doy = day % 365;
        if (doy < 90) return 'WINTER';
        if (doy < 180) return 'SPRING';
        if (doy < 270) return 'SUMMER';
        return 'FALL';
    }

    /**
     * Build a rich morning newspaper-style briefing for the start of each day.
     * Returns HTML string rendered inside the morning popup.
     */
    _buildMorningBriefing() {
        const day = this.engine.day;
        const cash = this.engine.cash.toFixed(2);
        const wIcons = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', snowy: '❄️', foggy: '🌫️', heatwave: '🔥', clear: '🌤️' };

        // --- Flavor greeting ---
        const greetings = [
            'The aroma of fresh dough fills the air.',
            'A new day of possibilities awaits your bakery.',
            'The ovens are warming up — time to plan the day.',
            'Your neighbours can already smell something good.',
            'The morning light streams through the shop window.',
            'Another day, another chance to bake something wonderful.',
        ];
        const greeting = greetings[day % greetings.length];

        let sections = [];

        // 1. Cash
        sections.push(`<div style="text-align:center; font-size:15px; margin-bottom:6px;">
            💰 <strong>Cash on Hand:</strong> $${cash}
        </div>`);

        // 2. Weather
        if (this.world && this.world.subsystems && this.world.subsystems.weather) {
            const ws = this.world.subsystems.weather;
            if (ws.currentWeather) {
                const w = ws.currentWeather;
                const icon = wIcons[w.type] || '🌤️';
                const tempStr = w.temperature ? ` ${w.temperature}°` : '';
                const trafficHint = ws.getTrafficMultiplier ? ws.getTrafficMultiplier() : 1;
                let outlook = 'Normal foot traffic expected.';
                if (trafficHint >= 1.3) outlook = 'Expect lots of customers!';
                else if (trafficHint >= 1.1) outlook = 'Slightly busier than average.';
                else if (trafficHint <= 0.6) outlook = 'Very few people will venture out.';
                else if (trafficHint <= 0.8) outlook = 'Foot traffic may be lighter today.';

                let forecastStr = '';
                if (ws.forecast && ws.forecast.length > 0) {
                    const tmrw = ws.forecast[0];
                    forecastStr = ` <span style="color:#888; font-size:12px;">Tomorrow: ${wIcons[tmrw.type] || '🌤️'} ${tmrw.type}</span>`;
                }

                sections.push(`<div style="background:rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px; margin-bottom:6px;">
                    <strong>${icon} Weather:</strong> ${w.type}${tempStr}${forecastStr}<br/>
                    <span style="font-size:12px; color:#a0c4e8;">${outlook}</span>
                </div>`);
            }
        }

        // 3. Reputation snapshot
        if (this.world && this.world.state && this.world.state.reputation) {
            const rep = Math.round(this.world.state.reputation.score);
            const trend = this.world.state.reputation.trend || 0;
            const arrow = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
            const label = rep >= 80 ? 'Excellent' : rep >= 60 ? 'Good' : rep >= 40 ? 'Fair' : rep >= 20 ? 'Poor' : 'Terrible';
            sections.push(`<div style="font-size:13px; margin-bottom:4px;">
                ⭐ <strong>Reputation:</strong> ${rep}/100 (${label}) ${arrow}
            </div>`);
        }

        // 4. Team morale & staff alerts
        if (this.staffManager && this.staffManager.moraleSystem) {
            const ms = this.staffManager.moraleSystem;
            const moraleIcon = ms.teamMorale >= 70 ? '😊' : ms.teamMorale >= 40 ? '😐' : '😟';
            let staffLine = `${moraleIcon} <strong>Team Morale:</strong> ${ms.teamMorale}%`;
            const pending = ms.pendingRequests ? ms.pendingRequests.filter(r => !r.resolved) : [];
            if (pending.length > 0) {
                staffLine += ` &nbsp;| &nbsp;⚠️ <span style="color:#fbbf24;">${pending.length} request${pending.length > 1 ? 's' : ''} pending</span>`;
            }
            sections.push(`<div style="font-size:13px; margin-bottom:4px;">${staffLine}</div>`);
        }

        // 5. Competitor intel
        if (this.world && this.world.subsystems && this.world.subsystems.competitors) {
            const comp = this.world.subsystems.competitors;
            if (comp.competitors && comp.competitors.length > 0) {
                const open = comp.competitors.filter(c => c.isOpen);
                const promos = open.filter(c => c.currentPromotion);
                let compLine = `🏪 <strong>${open.length}</strong> competitor${open.length !== 1 ? 's' : ''} open today`;
                if (promos.length > 0) {
                    compLine += ` — <span style="color:#f87171;">${promos.length} running promotions!</span>`;
                }
                sections.push(`<div style="font-size:13px; margin-bottom:4px;">${compLine}</div>`);
            }
        }

        // 6. Community events
        if (this.world && this.world.state && this.world.state.communityEvents) {
            const dayNum = this.world.state.day || day;
            const active = this.world.state.communityEvents.filter(e => dayNum >= e.startDay && dayNum <= e.endDay);
            if (active.length > 0) {
                const evtNames = active.map(e => `🎉 ${e.name || 'Community Event'}`).join(', ');
                sections.push(`<div style="font-size:13px; color:#34d399; margin-bottom:4px;">
                    <strong>Events today:</strong> ${evtNames}
                </div>`);
            }
        }

        // 7. Active world effects (e.g. food blogger boost)
        if (this.world && this.world.state && this.world.state.activeEffects) {
            const effects = this.world.state.activeEffects.filter(e => day <= (e.expiresOnDay || 0));
            if (effects.length > 0) {
                const labels = effects.map(e => `✨ ${e.name || e.type}`).join(', ');
                sections.push(`<div style="font-size:12px; color:#c4b5fd; margin-bottom:4px;">${labels}</div>`);
            }
        }

        return `<div style="text-align:left; max-width:380px; margin:0 auto;">
            <div style="font-style:italic; color:#94a3b8; font-size:13px; margin-bottom:10px; text-align:center;">${greeting}</div>
            ${sections.join('\n')}
        </div>`;
    }

    /**
     * Build HTML snippet showing world conditions in the day summary.
     */
    _buildWorldSummaryHtml() {
        if (!this.world || !this.world.state) return '';

        const parts = [];
        const state = this.world.state;

        // Weather
        if (this.world.subsystems && this.world.subsystems.weather) {
            const ws = this.world.subsystems.weather;
            if (ws.currentWeather) {
                const icons = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', snowy: '❄️', foggy: '🌫️', heatwave: '🔥', clear: '🌤️' };
                parts.push(`${icons[ws.currentWeather.type] || '🌤️'} Weather: ${ws.currentWeather.type}`);
            }
        }

        // Reputation
        if (state.reputation && state.reputation.score !== undefined) {
            const rep = Math.round(state.reputation.score);
            parts.push(`⭐ Reputation: ${rep}/100`);
        }

        // Competition
        if (this.world.subsystems && this.world.subsystems.competitors) {
            const comp = this.world.subsystems.competitors;
            if (comp.competitors && comp.competitors.length > 0) {
                const activeComps = comp.competitors.filter(c => c.isOpen);
                parts.push(`🏪 ${activeComps.length} competitor${activeComps.length !== 1 ? 's' : ''} nearby`);
            }
        }

        // Staff morale
        if (this.staffManager && this.staffManager.moraleSystem) {
            parts.push(`😊 Team Morale: ${this.staffManager.moraleSystem.teamMorale}%`);
        }

        // Active effects
        if (state.activeEffects && state.activeEffects.length > 0) {
            const effectNames = state.activeEffects.slice(0, 3).map(e => e.name || e.id);
            parts.push(`✨ Effects: ${effectNames.join(', ')}`);
        }

        if (parts.length === 0) return '';

        return `
            <div style="margin: 15px 0; padding: 12px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 8px; border: 1px solid #334155;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #a8d8ea;">🌍 World Conditions</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: #94a3b8;">
                    ${parts.map(p => `<span>${p}</span>`).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Build a "Daily Gazette" section for the end-of-day summary.
     * Includes encounter recaps, reputation narrative, and a random review quote.
     */
    _buildDailyGazetteHtml(summary) {
        const items = [];

        // Encounter recaps
        if (this._todayEncounters && this._todayEncounters.length > 0) {
            this._todayEncounters.forEach(enc => {
                items.push(`<div style="margin-bottom:4px;">${enc.icon} <strong>${enc.title}</strong> — You chose: <em>${enc.choice}</em></div>`);
            });
        }

        // Reputation change narrative
        if (this.world && this.world.state && this.world.state.reputation) {
            const rep = this.world.state.reputation;
            const trend = rep.trend || 0;
            if (trend > 3) items.push('<div>📈 Word is spreading — your bakery\'s reputation is <strong>rising</strong>!</div>');
            else if (trend > 0) items.push('<div>📈 Your reputation improved slightly today.</div>');
            else if (trend < -3) items.push('<div>📉 Some customers seemed unhappy — reputation is <strong>slipping</strong>.</div>');
            else if (trend < 0) items.push('<div>📉 Reputation dipped a little today.</div>');
        }

        // Random customer review quote
        const quotes = this._generateReviewQuotes(summary);
        if (quotes.length > 0) {
            const q = quotes[Math.floor(Math.random() * quotes.length)];
            items.push(`<div style="font-style:italic; color:#94a3b8; margin-top:4px;">"${q}"</div>`);
        }

        // Day buffs that were active
        if (this._dayBuffs && Object.keys(this._dayBuffs).length > 0) {
            const buffLabels = [];
            if (this._dayBuffs.quality) buffLabels.push(`Quality ${this._dayBuffs.quality > 0 ? '+' : ''}${Math.round(this._dayBuffs.quality * 100)}%`);
            if (this._dayBuffs.traffic) buffLabels.push(`Traffic ${this._dayBuffs.traffic > 0 ? '+' : ''}${Math.round(this._dayBuffs.traffic * 100)}%`);
            if (buffLabels.length > 0) {
                items.push(`<div style="font-size:12px; color:#a5b4fc;">✨ Day buffs: ${buffLabels.join(', ')}</div>`);
            }
        }

        if (items.length === 0) return '';

        return `
            <div style="margin: 12px 0; padding: 12px; background: linear-gradient(135deg, #1c1917, #292524); border-radius: 8px; border: 1px solid #44403c;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #fbbf24;">📰 Daily Gazette</h3>
                <div style="font-size: 13px; color: #d6d3d1;">
                    ${items.join('\n')}
                </div>
            </div>
        `;
    }

    /**
     * Generate flavour review quotes based on today's performance.
     */
    _generateReviewQuotes(summary) {
        const quotes = [];
        const served = summary.customersServed || 0;
        const missed = summary.customersMissed || 0;
        const profit = summary.netProfit || 0;

        if (served > 15) quotes.push('This place was buzzing today! Great energy.');
        if (served > 8) quotes.push('Nice selection of fresh goods — I\'ll be back.');
        if (missed > 5) quotes.push('I waited forever and nothing was left… disappointing.');
        if (missed > served && served > 0) quotes.push('Sold out before I even got there!');
        if (profit > 100) quotes.push('Must be doing well — the baker was smiling all day.');
        if (profit < 0) quotes.push('Hmm, half the shelves were empty. Is this place struggling?');
        if (served === 0) quotes.push('Walked by but the shop looked closed…');
        if (served > 0 && missed === 0) quotes.push('Everything I wanted was in stock. Perfect visit!');

        // Weather-based
        if (this.world && this.world.subsystems && this.world.subsystems.weather) {
            const w = this.world.subsystems.weather.currentWeather;
            if (w && w.type === 'rainy') quotes.push('Popped in to escape the rain — glad I did!');
            if (w && w.type === 'sunny') quotes.push('Grabbed a pastry and enjoyed it in the sunshine.');
            if (w && w.type === 'snowy') quotes.push('Hot cocoa and fresh bread on a snowy day — heaven.');
        }

        return quotes;
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
            <div class="modal-content" style="max-width: 950px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>👥 Staff & Operations</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this._renderMoraleOverview()}
                    ${this._renderPendingRequests()}
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

    /**
     * Team morale dashboard at top of staff panel.
     */
    _renderMoraleOverview() {
        if (!this.staffManager || !this.staffManager.moraleSystem) return '';
        const ms = this.staffManager.moraleSystem;
        const morale = ms.teamMorale;
        const moraleColor = morale >= 70 ? '#2ecc71' : morale >= 40 ? '#f39c12' : '#e74c3c';
        const moraleLabel = morale >= 80 ? 'Excellent' : morale >= 60 ? 'Good' : morale >= 40 ? 'Fair' : morale >= 20 ? 'Low' : 'Critical';
        const moraleIcon = morale >= 70 ? '😊' : morale >= 40 ? '😐' : '😟';
        const workDays = ms.consecutiveWorkDays || 0;

        const qualMod = this.staffManager.getMoraleQualityModifier ? this.staffManager.getMoraleQualityModifier() : 1.0;

        return `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #e2e8f0;">${moraleIcon} Team Morale</h3>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 160px; height: 12px; background: #1e293b; border-radius: 6px; overflow: hidden;">
                                <div style="width: ${morale}%; height: 100%; background: ${moraleColor}; border-radius: 6px; transition: width 0.3s;"></div>
                            </div>
                            <span style="font-weight: bold; color: ${moraleColor};">${morale}% — ${moraleLabel}</span>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 13px; color: #94a3b8;">
                        <div>📅 Consecutive work days: <strong>${workDays}</strong></div>
                        <div>🎯 Quality modifier: <strong>${(qualMod * 100).toFixed(0)}%</strong></div>
                        ${ms.recentEvents && ms.recentEvents.length > 0 
                            ? `<div style="margin-top:4px;">📋 Recent events: ${ms.recentEvents.slice(-3).map(e => e.type).join(', ')}</div>` 
                            : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render pending staff requests with approve/deny buttons.
     */
    _renderPendingRequests() {
        if (!this.staffManager || !this.staffManager.moraleSystem) return '';
        const pending = this.staffManager.moraleSystem.pendingRequests.filter(r => !r.resolved);
        if (pending.length === 0) return '';

        const cards = pending.map((req, idx) => {
            const staff = this.staffManager.getStaff(req.staffId);
            const staffName = staff ? staff.name : 'Unknown';
            const staffFace = staff ? (staff.face || '🧑') : '🧑';

            let description = '';
            let approveLabel = '✅ Approve';
            let denyLabel = '❌ Deny';

            if (req.type === 'raise_request') {
                description = `${staffName} is requesting a raise of <strong>$${req.requestedAmount}/mo</strong>. Denying may hurt morale.`;
                approveLabel = '💰 Grant Raise';
                denyLabel = '🚫 Decline';
            } else if (req.type === 'training_opportunity') {
                description = `${staffName} found a training course. Cost: <strong>$${req.cost}</strong>, potential skill gain: <strong>+${req.skillBonus}</strong>.`;
                approveLabel = '📚 Fund Training';
                denyLabel = '⏭️ Skip';
            } else if (req.type === 'quit_threat') {
                description = `${staffName} is threatening to quit! You can offer a retention bonus (~25% of salary) to keep them.`;
                approveLabel = '🤝 Retention Bonus';
                denyLabel = '👋 Let Them Go';
            } else {
                description = `${req.type} from ${staffName}.`;
            }

            return `
                <div style="background: #292524; border-radius: 8px; padding: 12px; border-left: 3px solid ${req.type === 'quit_threat' ? '#ef4444' : req.type === 'raise_request' ? '#f59e0b' : '#3b82f6'};">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="font-size: 22px;">${staffFace}</span>
                        <strong>${staffName}</strong>
                        <span style="font-size: 12px; color: #94a3b8; margin-left: auto;">${req.type.replace(/_/g, ' ')}</span>
                    </div>
                    <div style="font-size: 13px; color: #d6d3d1; margin-bottom: 8px;">${description}</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-small btn-primary" onclick="window.game._resolveRequestFromPanel(${idx}, true)">${approveLabel}</button>
                        <button class="btn-small btn-danger" onclick="window.game._resolveRequestFromPanel(${idx}, false)">${denyLabel}</button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="margin-bottom: 16px;">
                <h3 style="color: #fbbf24;">⚠️ Pending Staff Requests (${pending.length})</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">${cards}</div>
            </div>
        `;
    }

    /**
     * Handle staff request resolution from the panel UI.
     */
    _resolveRequestFromPanel(requestIndex, approved) {
        if (!this.staffManager || !this.staffManager.resolveStaffRequest) return;
        const result = this.staffManager.resolveStaffRequest(requestIndex, approved);
        if (result && result.message) {
            this.showPopup({
                icon: approved ? '✅' : '❌',
                title: approved ? 'Request Approved' : 'Request Denied',
                message: result.message,
                type: approved ? 'success' : 'info',
                autoClose: 2500
            });
        }
        // Refresh panel
        setTimeout(() => {
            const existingPanel = document.querySelector('.modal-overlay');
            if (existingPanel) {
                existingPanel.remove();
                this.showStaffPanel();
            }
        }, 2600);
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
            <div class="modal-content" style="max-width: 950px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>⚙️ Equipment & Maintenance</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this._renderEquipmentOverview()}
                    ${this.renderEquipmentList()}
                    ${this._renderEquipmentShop()}
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        gsap.from(panel.querySelector('.modal-content'), {
            scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out'
        });
    }

    /**
     * Overall equipment health summary with world integration.
     */
    _renderEquipmentOverview() {
        const qualMod = this.engine.getEquipmentQualityModifier ? this.engine.getEquipmentQualityModifier() : 1.0;
        const effMod = this.engine.getEquipmentEfficiency ? this.engine.getEquipmentEfficiency() : 1.0;

        const allEquipment = [
            ...this.engine.equipment.ovens || [],
            ...this.engine.equipment.mixers || [],
            ...this.engine.equipment.displays || []
        ];
        const avgCondition = allEquipment.length > 0
            ? allEquipment.reduce((sum, e) => sum + e.condition, 0) / allEquipment.length
            : 100;
        const condColor = avgCondition > 70 ? '#2ecc71' : avgCondition > 40 ? '#f39c12' : '#e74c3c';
        const atRisk = allEquipment.filter(e => e.condition < 30).length;

        return `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #e2e8f0;">🏭 Equipment Health</h3>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 160px; height: 12px; background: #1e293b; border-radius: 6px; overflow: hidden;">
                                <div style="width: ${avgCondition}%; height: 100%; background: ${condColor}; border-radius: 6px;"></div>
                            </div>
                            <span style="font-weight: bold; color: ${condColor};">${avgCondition.toFixed(0)}% avg</span>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 13px; color: #94a3b8;">
                        <div>🎯 Quality bonus: <strong>${(qualMod * 100).toFixed(0)}%</strong></div>
                        <div>⚡ Efficiency: <strong>${(effMod).toFixed(2)}x</strong></div>
                        ${atRisk > 0 ? `<div style="color: #ef4444;">⚠️ ${atRisk} item${atRisk > 1 ? 's' : ''} at breakdown risk!</div>` : ''}
                    </div>
                </div>
            </div>
        `;
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
                    No equipment tracked yet. Buy equipment below or equipment from your startup phase will appear here.
                </p>
            `;
        }

        return `
            <div class="equipment-section">
                <h3>Current Equipment</h3>
                <div class="equipment-grid">
                    ${allEquipment.map(equip => {
            const conditionClass = equip.condition > 70 ? 'good' : equip.condition > 40 ? 'fair' : 'poor';
            const daysSinceMaint = this.engine.day - equip.lastMaintenance;
            const condColor = equip.condition > 70 ? '#2ecc71' : equip.condition > 40 ? '#f39c12' : '#e74c3c';
            const statusIcon = equip.condition > 80 ? '✅' : equip.condition > 50 ? '🟡' : equip.condition > 20 ? '🟠' : '🔴';
            const repairCost = ((equip.maintenanceCost * (100 - equip.condition)) / 10);

            // Get WORLD config for upgrade info
            const worldEquip = GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.EQUIPMENT && GAME_CONFIG.WORLD.EQUIPMENT.TYPES
                ? GAME_CONFIG.WORLD.EQUIPMENT.TYPES[equip.type] : null;

            return `
                            <div class="equipment-card ${conditionClass}" style="border-left: 3px solid ${condColor};">
                                <div class="equipment-header">
                                    <h4>${statusIcon} ${equip.name}</h4>
                                    <span class="equipment-type" style="text-transform: capitalize;">${equip.type}</span>
                                </div>
                                <div class="equipment-stats">
                                    <div class="stat-row">
                                        <span>Condition:</span>
                                        <div class="condition-bar" style="flex: 1; height: 10px; background: #1e293b; border-radius: 5px; overflow: hidden; margin: 0 8px;">
                                            <div class="condition-fill" style="width: ${equip.condition}%; height: 100%; background: ${condColor}; border-radius: 5px;"></div>
                                        </div>
                                        <strong>${equip.condition.toFixed(0)}%</strong>
                                    </div>
                                    <div class="stat-row">
                                        <span>Breakdown Risk:</span>
                                        <strong style="color: ${equip.breakdownProbability > 0.05 ? '#ef4444' : '#94a3b8'};">${(equip.breakdownProbability * 100).toFixed(1)}%</strong>
                                    </div>
                                    <div class="stat-row">
                                        <span>Last Maintenance:</span>
                                        <span>${daysSinceMaint === 0 ? 'Today' : daysSinceMaint + ' day' + (daysSinceMaint > 1 ? 's' : '') + ' ago'}</span>
                                    </div>
                                    <div class="stat-row">
                                        <span>Lifetime Repairs:</span>
                                        <strong>$${equip.totalRepairCosts.toFixed(2)}</strong>
                                    </div>
                                </div>
                                <div class="equipment-actions" style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
                                    <button class="btn-small btn-primary" onclick="window.game.maintainEquipmentById(${equip.id})">
                                        🔧 Maintain ($${equip.maintenanceCost.toFixed(2)})
                                    </button>
                                    ${equip.condition < 80 ? `
                                        <button class="btn-small btn-warning" onclick="window.game.repairEquipmentById(${equip.id})">
                                            🛠️ Repair ($${repairCost.toFixed(2)})
                                        </button>
                                    ` : ''}
                                    ${worldEquip ? `
                                        <button class="btn-small" style="background:#6366f1; color:white;" onclick="window.game._upgradeEquipment('${equip.type}', ${equip.id})">
                                            ⬆️ Upgrade ($${worldEquip.upgradeCost})
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

    /**
     * Equipment shop for buying new equipment.
     */
    _renderEquipmentShop() {
        const worldConfig = GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.EQUIPMENT ? GAME_CONFIG.WORLD.EQUIPMENT.TYPES : null;
        if (!worldConfig) return '';

        const cards = Object.entries(worldConfig).map(([key, eq]) => {
            const owned = this._countEquipment(key);
            return `
                <div style="background: #292524; border-radius: 8px; padding: 12px; min-width: 180px;">
                    <div style="font-size: 24px; text-align: center;">${eq.icon}</div>
                    <h4 style="text-align: center; margin: 4px 0;">${eq.name}</h4>
                    <div style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 8px;">
                        Owned: ${owned}
                    </div>
                    <div style="font-size: 12px; color: #d6d3d1;">
                        <div>💰 Cost: $${eq.baseCost}</div>
                        <div>🔧 Maint: $${eq.maintenanceCost}/use</div>
                        ${eq.capacityBonus ? `<div>📦 Capacity: +${eq.capacityBonus}</div>` : ''}
                        ${eq.qualityBonus ? `<div>⭐ Quality: +${(eq.qualityBonus * 100).toFixed(0)}%</div>` : ''}
                    </div>
                    <button class="btn-small btn-primary" style="width: 100%; margin-top: 8px;" 
                            onclick="window.game._buyNewEquipment('${key}')">
                        🛒 Buy ($${eq.baseCost})
                    </button>
                </div>
            `;
        }).join('');

        return `
            <div style="margin-top: 16px;">
                <h3>🛒 Equipment Shop</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">${cards}</div>
            </div>
        `;
    }

    _countEquipment(type) {
        const key = type + 's';
        return (this.engine.equipment[key] || []).length;
    }

    _buyNewEquipment(type) {
        const worldConfig = GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.EQUIPMENT ? GAME_CONFIG.WORLD.EQUIPMENT.TYPES : null;
        if (!worldConfig || !worldConfig[type]) return;
        const eq = worldConfig[type];
        if (this.engine.cash < eq.baseCost) {
            this.showPopup({ icon: '💸', title: 'Not Enough Cash', message: `You need $${eq.baseCost} to buy a ${eq.name}.`, type: 'warning', autoClose: 2000 });
            return;
        }
        this.engine.cash -= eq.baseCost;
        this.engine.addEquipment(type, { name: eq.name, capacity: eq.capacityBonus || 1, cost: eq.baseCost });
        this.showPopup({ icon: eq.icon, title: `${eq.name} Purchased!`, message: `New ${eq.name} added to your bakery.`, type: 'success', autoClose: 2000 });
        setTimeout(() => { document.querySelector('.modal-overlay')?.remove(); this.showEquipmentPanel(); }, 2100);
    }

    _upgradeEquipment(type, equipId) {
        const worldConfig = GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.EQUIPMENT ? GAME_CONFIG.WORLD.EQUIPMENT.TYPES : null;
        if (!worldConfig || !worldConfig[type]) return;
        const cost = worldConfig[type].upgradeCost;
        if (this.engine.cash < cost) {
            this.showPopup({ icon: '💸', title: 'Not Enough Cash', message: `Upgrade costs $${cost}.`, type: 'warning', autoClose: 2000 });
            return;
        }
        // Find equipment and boost it
        let found = null;
        ['ovens', 'mixers', 'displays'].forEach(t => {
            if (!found && this.engine.equipment[t]) {
                found = this.engine.equipment[t].find(e => e.id === equipId);
            }
        });
        if (!found) return;
        this.engine.cash -= cost;
        found.condition = 100;
        found.capacity = (found.capacity || 1) + (worldConfig[type].capacityBonus || 0);
        found.maintenanceCost *= 0.75; // upgraded equipment is cheaper to maintain
        found.name = `${found.name} ★`;
        this.showPopup({ icon: '⬆️', title: 'Equipment Upgraded!', message: `${found.name} has been upgraded! Full repair + bonus capacity.`, type: 'success', autoClose: 2000 });
        setTimeout(() => { document.querySelector('.modal-overlay')?.remove(); this.showEquipmentPanel(); }, 2100);
    }

    // ==================== STEP 1: COMPETITOR INTEL & MARKET WATCH ====================

    showMarketWatchPanel() {
        const compSys = this.world && this.world.subsystems ? this.world.subsystems.competitors : null;
        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>🏪 Market Watch — Competitor Intelligence</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this._renderMarketOverview()}
                    ${this._renderCompetitorCards(compSys)}
                    ${this._renderMarketAdvice(compSys)}
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        if (window.gsap) gsap.from(panel.querySelector('.modal-content'), { scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out' });
    }

    _renderMarketOverview() {
        const ms = this.world ? this.world.state.marketShare : 1;
        const playerPct = Math.round((ms || 1) * 100);
        const compCount = this.world && this.world.state.competitors ? this.world.state.competitors.filter(c => !c.isClosing).length : 0;
        const demandMult = this.world ? this.world.getDemandMultiplier() : 1;
        const demandPct = Math.round(demandMult * 100);
        const demandColor = demandPct >= 110 ? '#2ecc71' : demandPct >= 90 ? '#f39c12' : '#e74c3c';

        return `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 16px; text-align: center;">
                    <div>
                        <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${playerPct}%</div>
                        <div style="font-size: 12px; color: #94a3b8;">Your Market Share</div>
                    </div>
                    <div>
                        <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${compCount}</div>
                        <div style="font-size: 12px; color: #94a3b8;">Active Competitors</div>
                    </div>
                    <div>
                        <div style="font-size: 28px; font-weight: bold; color: ${demandColor};">${demandPct}%</div>
                        <div style="font-size: 12px; color: #94a3b8;">Overall Demand</div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderCompetitorCards(compSys) {
        if (!compSys || !compSys.competitors || compSys.competitors.length === 0) {
            return `<div style="text-align: center; padding: 20px; color: #94a3b8;">
                <p style="font-size: 16px;">🎉 No competitors yet!</p>
                <p style="font-size: 13px;">Enjoy the monopoly while it lasts. As your bakery grows, competitors will appear.</p>
            </div>`;
        }

        const cards = compSys.competitors.map(comp => {
            const priceLabel = comp.currentPriceMultiplier < 0.9 ? '💚 Budget' : comp.currentPriceMultiplier > 1.1 ? '💜 Premium' : '⚪ Market Rate';
            const priceStr = `${(comp.currentPriceMultiplier * 100).toFixed(0)}% of your prices`;
            const threatLevel = comp.marketPower > 0.12 ? { label: 'High Threat', color: '#ef4444', icon: '⚠️' }
                : comp.marketPower > 0.08 ? { label: 'Medium Threat', color: '#f59e0b', icon: '⚡' }
                : { label: 'Low Threat', color: '#22c55e', icon: '✅' };
            const promoHtml = comp.promotion
                ? `<div style="background: #7f1d1d; border-radius: 6px; padding: 4px 8px; font-size: 12px; color: #fca5a5; margin-top: 6px;">🔔 Active: ${comp.promotion.type}</div>`
                : '';

            return `
                <div style="background: #292524; border-radius: 8px; padding: 14px; border-left: 3px solid ${threatLevel.color};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 20px;">${comp.icon}</span>
                            <strong style="margin-left: 6px;">${comp.name}</strong>
                        </div>
                        <span style="font-size: 11px; padding: 2px 8px; border-radius: 10px; background: ${threatLevel.color}22; color: ${threatLevel.color};">
                            ${threatLevel.icon} ${threatLevel.label}
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #a8a29e; margin: 6px 0;">${comp.description || comp.archetype.replace(/_/g, ' ')}</div>
                    <div style="display: flex; gap: 16px; font-size: 13px; color: #d6d3d1; flex-wrap: wrap;">
                        <span>${priceLabel} (${priceStr})</span>
                        <span>📈 Market power: ${(comp.marketPower * 100).toFixed(0)}%</span>
                        <span>📅 Open for ${comp.daysActive || '?'} days</span>
                    </div>
                    ${promoHtml}
                </div>
            `;
        }).join('');

        return `<div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            <h3>🏪 Nearby Bakeries</h3>
            ${cards}
        </div>`;
    }

    _renderMarketAdvice(compSys) {
        const tips = [];
        if (!compSys || compSys.competitors.length === 0) {
            tips.push('💡 With no competition, you set the standard. Focus on building reputation for when rivals appear.');
        } else {
            const hasPromo = compSys.competitors.some(c => c.promotion);
            const avgPrice = compSys.getAveragePriceLevel();
            if (hasPromo) tips.push('⚡ A competitor is running promotions. Consider matching with quality or a small discount.');
            if (avgPrice < 0.9) tips.push('💚 Competitors averaging low prices — differentiate on quality and service.');
            if (avgPrice > 1.1) tips.push('💜 Competitors charging premium — you could undercut for market share or match for margins.');
            if (compSys.competitors.length >= 3) tips.push('🌐 Market is getting crowded. Reputation and loyal customers are your best defense.');
        }

        // Add weather/season intel
        const season = this._getCurrentSeason();
        if (season) {
            const seasonTips = {
                SPRING: '🌸 Spring — lighter fare sells well. Experiment with fruit-based recipes.',
                SUMMER: '☀️ Summer — cold drinks pair well with pastries. Expect steady traffic on nice days.',
                FALL: '🍂 Fall — comfort food season. Pumpkin and cinnamon are crowd favourites.',
                WINTER: '❄️ Winter — hot beverages and warm bread. Bad weather may reduce foot traffic.'
            };
            tips.push(seasonTips[season] || '');
        }

        if (tips.length === 0) return '';
        return `
            <div style="background: #1e293b; border-radius: 8px; padding: 12px; border: 1px solid #334155;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #a5b4fc;">🧠 Strategic Insights</h3>
                ${tips.map(t => `<div style="font-size: 13px; color: #cbd5e1; margin-bottom: 4px;">${t}</div>`).join('')}
            </div>
        `;
    }

    // ==================== STEP 2: REPUTATION & REVIEWS DASHBOARD ====================

    showReputationPanel() {
        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>⭐ Reputation & Customer Reviews</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this._renderReputationScore()}
                    ${this._renderReviewsList()}
                    ${this._renderReputationFactors()}
                    ${this._renderReputationTips()}
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        if (window.gsap) gsap.from(panel.querySelector('.modal-content'), { scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out' });
    }

    _renderReputationScore() {
        const rep = this.world && this.world.state ? this.world.state.reputation : null;
        if (!rep) return '<p style="color:#94a3b8;">Reputation system not yet active.</p>';

        const score = Math.round(rep.score);
        const trend = rep.trend || 0;
        const wom = rep.wordOfMouth || 1.0;
        const trendIcon = trend > 2 ? '📈 Rising fast' : trend > 0 ? '📈 Improving' : trend < -2 ? '📉 Dropping fast' : trend < 0 ? '📉 Declining' : '➡️ Stable';
        const scoreColor = score >= 70 ? '#2ecc71' : score >= 40 ? '#f39c12' : '#e74c3c';
        const label = score >= 90 ? 'Legendary' : score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : score >= 20 ? 'Poor' : 'Terrible';

        // Star display
        const fullStars = Math.floor(score / 20);
        const halfStar = (score % 20) >= 10 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        const starsHtml = '⭐'.repeat(fullStars) + (halfStar ? '✨' : '') + '☆'.repeat(emptyStars);

        return `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #334155; text-align: center;">
                <div style="font-size: 48px; font-weight: bold; color: ${scoreColor};">${score}</div>
                <div style="font-size: 20px; margin: 4px 0;">${starsHtml}</div>
                <div style="font-size: 16px; color: ${scoreColor}; font-weight: bold;">${label}</div>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 8px;">${trendIcon}</div>
                <div style="display: flex; justify-content: center; gap: 24px; margin-top: 12px; font-size: 13px; color: #94a3b8;">
                    <div>🗣️ Word of Mouth: <strong>${(wom * 100).toFixed(0)}%</strong></div>
                    <div>📝 Reviews: <strong>${rep.reviews ? rep.reviews.length : 0}</strong></div>
                </div>
            </div>
        `;
    }

    _renderReviewsList() {
        const rep = this.world && this.world.state ? this.world.state.reputation : null;
        if (!rep || !rep.reviews || rep.reviews.length === 0) {
            return `<div style="text-align:center; padding: 16px; color: #94a3b8;">
                <p>📝 No customer reviews yet. Reviews appear as customers rate their experience.</p>
            </div>`;
        }

        const reviews = rep.reviews.slice(0, 8).map(r => {
            const stars = '⭐'.repeat(Math.max(1, Math.min(5, Math.round(r.score))));
            const sentiment = r.score >= 4 ? 'positive' : r.score >= 3 ? 'neutral' : 'negative';
            const borderColor = sentiment === 'positive' ? '#22c55e' : sentiment === 'neutral' ? '#f59e0b' : '#ef4444';
            return `
                <div style="background: #292524; border-radius: 8px; padding: 10px 14px; border-left: 3px solid ${borderColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${stars}</span>
                        <span style="font-size: 11px; color: #78716c;">Day ${r.day || '?'}</span>
                    </div>
                    <div style="font-size: 13px; color: #d6d3d1; font-style: italic; margin-top: 4px;">"${r.text}"</div>
                </div>
            `;
        }).join('');

        return `
            <div style="margin-bottom: 16px;">
                <h3>📝 Recent Reviews</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">${reviews}</div>
            </div>
        `;
    }

    _renderReputationFactors() {
        if (!this.world || !this.world.state) return '';
        const dm = this.world.state.demandModifiers;
        const factors = [
            { label: 'Weather Impact', value: dm.weather, icon: '🌤️' },
            { label: 'Competition Pressure', value: dm.competition, icon: '🏪' },
            { label: 'Reputation Effect', value: dm.reputation, icon: '⭐' },
            { label: 'Community Events', value: dm.community, icon: '🎉' },
            { label: 'Seasonal Trend', value: dm.seasonal, icon: '📅' },
        ];

        const bars = factors.map(f => {
            const pct = Math.round((f.value || 1) * 100);
            const color = pct >= 110 ? '#22c55e' : pct >= 90 ? '#eab308' : '#ef4444';
            const label = pct >= 110 ? 'Boosted' : pct >= 90 ? 'Normal' : 'Reduced';
            return `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                    <span style="width: 20px;">${f.icon}</span>
                    <span style="width: 140px; color: #d6d3d1;">${f.label}</span>
                    <div style="flex: 1; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${Math.min(pct, 150)}%; height: 100%; background: ${color}; border-radius: 4px;"></div>
                    </div>
                    <span style="width: 60px; text-align: right; color: ${color}; font-weight: bold;">${pct}%</span>
                    <span style="width: 60px; font-size: 11px; color: #78716c;">${label}</span>
                </div>
            `;
        }).join('');

        return `
            <div style="margin-bottom: 16px;">
                <h3>📊 Demand Factors</h3>
                <div style="display: flex; flex-direction: column; gap: 6px; background: #1e293b; border-radius: 8px; padding: 12px;">${bars}</div>
            </div>
        `;
    }

    _renderReputationTips() {
        const rep = this.world && this.world.state ? this.world.state.reputation : null;
        if (!rep) return '';
        const score = rep.score;
        const tips = [];

        if (score < 30) tips.push('🔴 Reputation is critical. Focus on never missing customers and keeping quality high.');
        if (score < 50) tips.push('🟡 Serve every customer possible — missed sales hurt your reputation.');
        if (score >= 50 && score < 70) tips.push('🟢 Good progress! Consistent quality and variety will push you higher.');
        if (score >= 70) tips.push('🌟 Strong reputation! Maintain quality — a few bad days can undo weeks of progress.');
        if (score >= 85) tips.push('🏆 Near legendary status! Consider premium pricing to capitalize on your name.');

        tips.push('💡 Reputation affects: customer traffic, willingness to pay, and word-of-mouth referrals.');

        return `
            <div style="background: #1e293b; border-radius: 8px; padding: 12px; border: 1px solid #334155;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #a5b4fc;">💡 Reputation Tips</h3>
                ${tips.map(t => `<div style="font-size: 13px; color: #cbd5e1; margin-bottom: 4px;">${t}</div>`).join('')}
            </div>
        `;
    }

    // ==================== STEP 3: DYNAMIC SELLING PHASE WORLD HUD ====================

    /**
     * Build a dynamic world conditions sidebar for the selling phase.
     * Updates in real-time as the selling loop ticks.
     */
    _buildSellingWorldHUD() {
        if (!this.world || !this.world.state) return '';
        const wIcons = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', snowy: '❄️', foggy: '🌫️', heatwave: '🔥', clear: '🌤️' };
        const ws = this.world.subsystems ? this.world.subsystems.weather : null;

        // Weather
        let weatherHtml = '';
        if (ws && ws.currentWeather) {
            const w = ws.currentWeather;
            const trafficMult = ws.getTrafficMultiplier ? ws.getTrafficMultiplier() : 1;
            const trafficLabel = trafficMult >= 1.3 ? '🟢 High Traffic' : trafficMult >= 1.0 ? '🟡 Normal' : trafficMult >= 0.7 ? '🟠 Low Traffic' : '🔴 Very Low';
            weatherHtml = `
                <div style="margin-bottom: 6px;">
                    <span>${wIcons[w.type] || '🌤️'} ${w.type} ${w.temperature || ''}°</span>
                    <span style="margin-left: 8px; font-size: 11px; color: #94a3b8;">${trafficLabel}</span>
                </div>
            `;
        }

        // Competition pressure today
        let compHtml = '';
        const comps = this.world.state.competitors || [];
        const activeComps = comps.filter(c => !c.isClosing);
        const compsWithPromo = activeComps.filter(c => c.hasPromotion);
        if (activeComps.length > 0) {
            compHtml = `<div style="margin-bottom: 4px; font-size: 12px;">
                🏪 ${activeComps.length} competitor${activeComps.length > 1 ? 's' : ''}
                ${compsWithPromo.length > 0 ? `<span style="color: #fca5a5;"> — ${compsWithPromo.length} running promos!</span>` : ''}
            </div>`;
        }

        // Reputation
        let repHtml = '';
        if (this.world.state.reputation) {
            const rep = Math.round(this.world.state.reputation.score);
            const repColor = rep >= 70 ? '#22c55e' : rep >= 40 ? '#eab308' : '#ef4444';
            repHtml = `<div style="margin-bottom: 4px; font-size: 12px;">⭐ Reputation: <strong style="color:${repColor};">${rep}/100</strong></div>`;
        }

        // Overall demand multiplier
        const demandMult = this.world.getDemandMultiplier ? this.world.getDemandMultiplier() : 1;
        const demandPct = Math.round(demandMult * 100);
        const demandColor = demandPct >= 110 ? '#22c55e' : demandPct >= 90 ? '#eab308' : '#ef4444';
        const demandHtml = `<div style="font-size: 12px;">📊 Demand: <strong style="color:${demandColor};">${demandPct}%</strong></div>`;

        // Active day buffs from encounters
        let buffsHtml = '';
        if (this._dayBuffs && Object.keys(this._dayBuffs).length > 0) {
            const labels = [];
            if (this._dayBuffs.traffic) labels.push(`Traffic +${Math.round(this._dayBuffs.traffic * 100)}%`);
            if (this._dayBuffs.quality) labels.push(`Quality +${Math.round(this._dayBuffs.quality * 100)}%`);
            if (labels.length > 0) {
                buffsHtml = `<div style="font-size: 11px; color: #a5b4fc; margin-top: 4px;">✨ ${labels.join(', ')}</div>`;
            }
        }

        return `
            <div id="selling-world-hud" style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; border: 1px solid #334155; font-size: 13px; color: #e2e8f0;">
                <div style="font-weight: bold; margin-bottom: 6px; color: #7dd3fc;">🌍 World Conditions</div>
                ${weatherHtml}${compHtml}${repHtml}${demandHtml}${buffsHtml}
            </div>
        `;
    }

    // ==================== STEP 4: WORLD EVENT NOTIFICATION FEED ====================

    /**
     * Push world events through the notification system so the player sees them in real time.
     * Called after world.simulateDay() in the summary phase.
     */
    _notifyWorldEvents(worldReport) {
        if (!worldReport || !worldReport.events || !this.notificationSystem) return;

        worldReport.events.forEach(evt => {
            const type = evt.sentiment === 'positive' ? 'success'
                       : evt.sentiment === 'negative' ? 'warning'
                       : 'info';
            this.notificationSystem.notify(evt.description, {
                type,
                title: this._getEventTitle(evt.category),
                duration: 6000
            });
        });
    }

    _getEventTitle(category) {
        const titles = {
            weather: '🌤️ Weather Update',
            competition: '🏪 Competitor News',
            reputation: '⭐ Reputation',
            community: '🎉 Community Event',
            equipment: '⚙️ Equipment',
            staff: '👥 Staff Update',
            economy: '📊 Market Update'
        };
        return titles[category] || '🔔 News';
    }

    /**
     * Push staff events through notifications (called from StaffManager hooks).
     */
    _notifyStaffEvents() {
        if (!this.staffManager || !this.staffManager.moraleSystem || !this.notificationSystem) return;
        const events = this.staffManager.moraleSystem.recentEvents;
        if (!events || events.length === 0) return;

        // Only show the latest event (to avoid notification spam)
        const latest = events[events.length - 1];
        if (latest && latest.day === this.engine.day && !latest._notified) {
            latest._notified = true;
            const typeMap = {
                sick_day: { type: 'warning', title: '🤒 Staff Absent' },
                raise_request: { type: 'info', title: '💰 Raise Request' },
                training_opportunity: { type: 'info', title: '📚 Training Available' },
                quit_threat: { type: 'warning', title: '⚠️ Staff Warning' }
            };
            const config = typeMap[latest.type] || { type: 'info', title: '👥 Staff Update' };
            const staffMember = this.staffManager.getStaff(latest.staffId);
            const name = staffMember ? staffMember.name : 'A staff member';
            const messages = {
                sick_day: `${name} called in sick today.`,
                raise_request: `${name} is requesting a raise. Check the Staff panel.`,
                training_opportunity: `A training course is available for ${name}.`,
                quit_threat: `${name} is unhappy and considering leaving!`
            };
            this.notificationSystem.notify(messages[latest.type] || `${latest.type} — ${name}`, {
                type: config.type,
                title: config.title,
                duration: 8000
            });
        }
    }

    /**
     * Post a reputation change notification.
     */
    _notifyReputationChange(delta, reason) {
        if (!this.notificationSystem || Math.abs(delta) < 2) return;
        const icon = delta > 0 ? '📈' : '📉';
        const type = delta > 0 ? 'success' : 'warning';
        this.notificationSystem.notify(`${reason || 'Reputation changed'} (${delta > 0 ? '+' : ''}${delta.toFixed(1)})`, {
            type,
            title: `${icon} Reputation`,
            duration: 5000
        });
    }

    // ==================== STEP 11: ADVERTISING PANEL ====================

    showAdvertisingPanel() {
        const adSys = this.world && this.world.subsystems.advertising;
        if (!adSys) return;

        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>📢 Advertising & Marketing</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this._renderAdOverview(adSys)}
                    ${this._renderActiveCampaigns(adSys)}
                    ${this._renderCampaignShop(adSys)}
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        if (window.gsap) gsap.from(panel.querySelector('.modal-content'), { scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out' });
    }

    _renderAdOverview(adSys) {
        const awareness = Math.round(adSys.state.brandAwareness);
        const awColor = awareness >= 60 ? '#22c55e' : awareness >= 35 ? '#eab308' : '#ef4444';
        const spent = adSys.state.totalSpent;
        const active = adSys.state.activeCampaigns.length;
        return `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 16px; text-align: center;">
                    <div><div style="font-size: 28px; font-weight: bold; color: ${awColor};">${awareness}%</div><div style="font-size: 12px; color: #94a3b8;">Brand Awareness</div></div>
                    <div><div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${active}</div><div style="font-size: 12px; color: #94a3b8;">Active Campaigns</div></div>
                    <div><div style="font-size: 28px; font-weight: bold; color: #a78bfa;">$${spent}</div><div style="font-size: 12px; color: #94a3b8;">Total Spent</div></div>
                </div>
            </div>`;
    }

    _renderActiveCampaigns(adSys) {
        if (adSys.state.activeCampaigns.length === 0) {
            return '<p style="color: #94a3b8; text-align: center; padding: 12px;">No active campaigns. Launch one below!</p>';
        }
        const cards = adSys.state.activeCampaigns.map(c => {
            const daysLeft = c.endDay - (this.engine ? this.engine.day : 0);
            return `<div style="background: #292524; border-radius: 8px; padding: 10px 14px; border-left: 3px solid #3b82f6;">
                <strong>${c.name}</strong> <span style="float: right; font-size: 11px; color: #94a3b8;">${daysLeft} days left</span>
                <div style="font-size: 12px; color: #a8a29e; margin-top: 4px;">Reach: ${c.dailyReach}/day | Cost: $${c.cost}</div>
            </div>`;
        }).join('');
        return `<div style="margin-bottom: 16px;"><h3>📺 Active Campaigns</h3><div style="display: flex; flex-direction: column; gap: 8px;">${cards}</div></div>`;
    }

    _renderCampaignShop(adSys) {
        const types = adSys.getCampaignTypes();
        const cash = this.engine ? this.engine.cash : 0;
        const maxActive = (GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.ADVERTISING) ? GAME_CONFIG.WORLD.ADVERTISING.maxActiveCampaigns : 3;
        const atMax = adSys.state.activeCampaigns.length >= maxActive;

        const cards = types.map(t => {
            const canAfford = cash >= t.cost && !atMax;
            return `<div style="background: #1e293b; border-radius: 8px; padding: 12px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${t.name}</strong>
                    <button class="btn btn-sm" style="padding: 4px 12px;" ${canAfford ? '' : 'disabled style="opacity:0.5; padding: 4px 12px;"'}
                        onclick="window.game._launchCampaign('${t.type}')">$${t.cost}</button>
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${t.desc}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Duration: ${t.duration} days | Reach: ${t.reach}</div>
            </div>`;
        }).join('');
        return `<div><h3>🛒 Launch a Campaign ${atMax ? '<span style="color:#ef4444; font-size:12px;">(max reached)</span>' : ''}</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">${cards}</div></div>`;
    }

    _launchCampaign(type) {
        const adSys = this.world && this.world.subsystems.advertising;
        if (!adSys) return;
        const campaign = adSys.launchCampaign(type, this.engine.day);
        if (campaign) {
            this.engine.cash -= campaign.cost;
            this.showNotification(`${campaign.name} launched for $${campaign.cost}!`, 'success');
            if (this.journal) this.journal.onSituation('marketing_campaign');
            document.querySelector('.modal-overlay')?.remove();
            this.showAdvertisingPanel();
        }
    }

    // ==================== STEP 11: TECHNOLOGY PANEL ====================

    showTechnologyPanel() {
        const techSys = this.world && this.world.subsystems.technology;
        if (!techSys) return;

        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 850px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>💻 Technology & Upgrades</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this._renderTechOverview(techSys)}
                    ${this._renderTechCatalog(techSys)}
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        if (window.gsap) gsap.from(panel.querySelector('.modal-content'), { scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out' });
    }

    _renderTechOverview(techSys) {
        const level = techSys.state.techLevel;
        const monthly = techSys.state.monthlySubscriptions;
        const owned = techSys.state.purchased.length;
        return `
            <div style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 16px; text-align: center;">
                    <div><div style="font-size: 28px; font-weight: bold; color: #38bdf8;">${level}</div><div style="font-size: 12px; color: #94a3b8;">Tech Level</div></div>
                    <div><div style="font-size: 28px; font-weight: bold; color: #a78bfa;">${owned}</div><div style="font-size: 12px; color: #94a3b8;">Technologies</div></div>
                    <div><div style="font-size: 28px; font-weight: bold; color: #f59e0b;">$${monthly}/mo</div><div style="font-size: 12px; color: #94a3b8;">Subscriptions</div></div>
                </div>
            </div>`;
    }

    _renderTechCatalog(techSys) {
        const catalog = techSys.getTechCatalog();
        const cash = this.engine ? this.engine.cash : 0;
        const cards = catalog.map(t => {
            const owned = techSys.state.purchased.includes(t.id);
            const canAfford = !owned && cash >= t.cost;
            return `<div style="background: ${owned ? '#14532d' : '#1e293b'}; border-radius: 8px; padding: 12px; border: 1px solid ${owned ? '#22c55e' : '#334155'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${t.name}</strong>
                    ${owned ? '<span style="color: #22c55e; font-size: 13px;">✅ Owned</span>'
                        : `<button class="btn btn-sm" style="padding: 4px 12px;" ${canAfford ? '' : 'disabled style="opacity:0.5; padding: 4px 12px;"'}
                            onclick="window.game._purchaseTech('${t.id}')">$${t.cost}</button>`}
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${t.desc}</div>
                ${t.monthly > 0 ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Monthly: $${t.monthly}</div>` : ''}
            </div>`;
        }).join('');
        return `<div><h3>🛒 Technology Shop</h3><div style="display: flex; flex-direction: column; gap: 8px;">${cards}</div></div>`;
    }

    _purchaseTech(techId) {
        const techSys = this.world && this.world.subsystems.technology;
        if (!techSys) return;
        const tech = techSys.purchaseTech(techId);
        if (tech) {
            this.engine.cash -= tech.cost;
            this.showNotification(`${tech.name} installed! Tech level +${tech.techPoints}.`, 'success');
            if (this.journal) this.journal.onSituation('tech_upgrade');
            document.querySelector('.modal-overlay')?.remove();
            this.showTechnologyPanel();
        }
    }

    // ==================== STEP 11: FINANCE / LOANS PANEL ====================

    showFinancePanel() {
        const loanSys = this.world && this.world.subsystems.loans;
        if (!loanSys) return;

        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 850px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>🏦 Finance & Loans</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this._renderFinanceOverview(loanSys)}
                    ${this._renderActiveLoans(loanSys)}
                    ${this._renderLoanShop(loanSys)}
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        if (window.gsap) gsap.from(panel.querySelector('.modal-content'), { scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out' });
    }

    _renderFinanceOverview(loanSys) {
        const credit = Math.round(loanSys.state.creditScore);
        const creditColor = credit >= 700 ? '#22c55e' : credit >= 550 ? '#eab308' : '#ef4444';
        const creditLabel = credit >= 750 ? 'Excellent' : credit >= 700 ? 'Good' : credit >= 650 ? 'Fair' : credit >= 550 ? 'Below Average' : 'Poor';
        const totalDebt = Math.round(loanSys.getTotalDebt());
        const cash = this.engine ? Math.round(this.engine.cash) : 0;
        return `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 16px; text-align: center;">
                    <div><div style="font-size: 28px; font-weight: bold; color: ${creditColor};">${credit}</div><div style="font-size: 12px; color: #94a3b8;">Credit Score (${creditLabel})</div></div>
                    <div><div style="font-size: 28px; font-weight: bold; color: #22c55e;">$${cash.toLocaleString()}</div><div style="font-size: 12px; color: #94a3b8;">Cash on Hand</div></div>
                    <div><div style="font-size: 28px; font-weight: bold; color: ${totalDebt > 0 ? '#ef4444' : '#22c55e'};">$${totalDebt.toLocaleString()}</div><div style="font-size: 12px; color: #94a3b8;">Total Debt</div></div>
                </div>
            </div>`;
    }

    _renderActiveLoans(loanSys) {
        const active = loanSys.state.loans.filter(l => l.remaining > 0);
        if (active.length === 0) return '<p style="color: #94a3b8; text-align: center; padding: 8px;">No active loans. Debt-free!</p>';

        const cards = active.map(l => {
            const remaining = Math.round(l.remaining);
            const pct = Math.round((1 - l.remaining / l.principal) * 100);
            return `<div style="background: #292524; border-radius: 8px; padding: 10px 14px; border-left: 3px solid #ef4444;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${l.name}</strong>
                    <span style="font-size: 13px; color: #fca5a5;">$${remaining.toLocaleString()} remaining</span>
                </div>
                <div style="font-size: 12px; color: #a8a29e; margin-top: 4px;">Monthly: $${l.monthlyPayment} | Rate: ${(l.rate * 100).toFixed(1)}% | ${pct}% repaid</div>
                <div style="height: 4px; background: #1e293b; border-radius: 2px; margin-top: 6px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: #22c55e; border-radius: 2px;"></div>
                </div>
            </div>`;
        }).join('');
        return `<div style="margin-bottom: 16px;"><h3>📋 Active Loans</h3><div style="display: flex; flex-direction: column; gap: 8px;">${cards}</div></div>`;
    }

    _renderLoanShop(loanSys) {
        const catalog = loanSys.getLoanCatalog();
        const maxLoans = (GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.LOANS) ? GAME_CONFIG.WORLD.LOANS.maxActiveLoans : 3;
        const activeCount = loanSys.state.loans.filter(l => l.remaining > 0).length;
        const atMax = activeCount >= maxLoans;
        const minCredit = (GAME_CONFIG.WORLD && GAME_CONFIG.WORLD.LOANS) ? GAME_CONFIG.WORLD.LOANS.minCreditScore : 400;
        const creditOk = loanSys.state.creditScore >= minCredit;

        const cards = catalog.map(t => {
            const canTake = !atMax && creditOk;
            return `<div style="background: #1e293b; border-radius: 8px; padding: 12px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${t.name}</strong>
                    <button class="btn btn-sm" style="padding: 4px 12px;" ${canTake ? '' : 'disabled style="opacity:0.5; padding: 4px 12px;"'}
                        onclick="window.game._takeLoan('${t.type}')">Borrow $${t.amount.toLocaleString()}</button>
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${t.desc}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Base rate: ${(t.baseRate * 100).toFixed(1)}% | Term: ${t.termMonths} months</div>
            </div>`;
        }).join('');
        let lockMsg = '';
        if (!creditOk) lockMsg = `<p style="color:#ef4444; text-align:center; font-size:13px;">⚠️ Credit score too low (need ${minCredit}+).</p>`;
        if (atMax) lockMsg = `<p style="color:#ef4444; text-align:center; font-size:13px;">⚠️ Maximum active loans reached (${maxLoans}).</p>`;
        return `<div><h3>🏦 Available Loans</h3>${lockMsg}<div style="display: flex; flex-direction: column; gap: 8px;">${cards}</div></div>`;
    }

    _takeLoan(type) {
        const loanSys = this.world && this.world.subsystems.loans;
        if (!loanSys) return;
        const loan = loanSys.takeLoan(type, this.engine.day);
        if (loan) {
            this.engine.cash += loan.principal;
            this.showNotification(`Loan of $${loan.principal.toLocaleString()} approved! Monthly payment: $${loan.monthlyPayment}.`, 'info');
            if (this.journal) this.journal.onSituation('loan_taken');
            document.querySelector('.modal-overlay')?.remove();
            this.showFinancePanel();
        }
    }

    // ==================== STEP 11: EXPANSION PANEL ====================

    showExpansionPanel() {
        const expSys = this.world && this.world.subsystems.expansion;
        if (!expSys) return;

        const envSys = this.world.subsystems.environmental;
        const hsSys = this.world.subsystems.healthSafety;
        const globalSys = this.world.subsystems.globalEvents;
        const commSys = this.world.subsystems.communityEvents;

        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>🏗️ Business & Expansion</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this._renderExpansionOverview(expSys)}
                    ${this._renderMilestones(expSys)}
                    ${this._renderLocations(expSys)}
                    ${this._renderHealthSafetyCard(hsSys)}
                    ${this._renderEnvironmentalCard(envSys)}
                    ${this._renderGlobalEventCard(globalSys)}
                    ${this._renderCommunityCard(commSys)}
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        if (window.gsap) gsap.from(panel.querySelector('.modal-content'), { scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out' });
    }

    _renderExpansionOverview(expSys) {
        const pts = expSys.state.expansionPoints;
        const locs = expSys.state.locations.length;
        const rev = Math.round(expSys.state.totalRevenue);
        return `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 16px; text-align: center;">
                    <div><div style="font-size: 28px; font-weight: bold; color: #f59e0b;">⭐ ${pts}</div><div style="font-size: 12px; color: #94a3b8;">Expansion Points</div></div>
                    <div><div style="font-size: 28px; font-weight: bold; color: #38bdf8;">${locs}</div><div style="font-size: 12px; color: #94a3b8;">Locations</div></div>
                    <div><div style="font-size: 28px; font-weight: bold; color: #22c55e;">$${rev.toLocaleString()}</div><div style="font-size: 12px; color: #94a3b8;">Lifetime Revenue</div></div>
                </div>
            </div>`;
    }

    _renderMilestones(expSys) {
        const milestoneNames = {
            first_1k: '💰 $1K Revenue', first_10k: '💰 $10K Revenue', first_50k: '💰 $50K Revenue',
            first_100k: '🏆 $100K Revenue', rep_80: '⭐ Excellent Rep',
            day_30: '📅 30 Days', day_100: '📅 100 Days', day_365: '🎂 One Year',
            staff_5: '👥 Team of 5', zero_waste: '🌿 Zero Waste'
        };
        const items = Object.entries(milestoneNames).map(([id, name]) => {
            const done = expSys.state.milestones[id];
            return `<span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin: 2px;
                background: ${done ? '#14532d' : '#1e293b'}; color: ${done ? '#86efac' : '#64748b'}; border: 1px solid ${done ? '#22c55e' : '#334155'};">
                ${done ? '✅' : '🔒'} ${name}</span>`;
        }).join('');
        return `<div style="margin-bottom: 16px;"><h3>🎯 Milestones</h3><div style="display: flex; flex-wrap: wrap; gap: 4px;">${items}</div></div>`;
    }

    _renderLocations(expSys) {
        const canExpand = expSys.canExpand();
        const cost = expSys.state.locations.length * 25000;
        const cash = this.engine ? this.engine.cash : 0;
        const canAfford = cash >= cost && canExpand;

        let expandBtn = '';
        if (expSys.state.locations.length < 4) {
            expandBtn = `<button class="btn btn-sm" style="margin-top: 8px;" ${canAfford ? '' : 'disabled style="opacity:0.5; margin-top: 8px;"'}
                onclick="window.game._openNewLocation()">🏗️ Open New Location ($${cost.toLocaleString()})</button>`;
            if (!canExpand) expandBtn += `<div style="font-size: 11px; color: #ef4444; margin-top: 4px;">Need ${expSys.state.locations.length * 5} expansion points</div>`;
        }

        const locs = expSys.state.locations.map(l => {
            return `<span style="display: inline-block; padding: 6px 12px; border-radius: 8px; background: #14532d; color: #86efac; font-size: 13px; border: 1px solid #22c55e; margin: 2px;">
                🏪 ${l.name}</span>`;
        }).join('');
        return `<div style="margin-bottom: 16px;"><h3>🏪 Locations</h3>${locs}${expandBtn}</div>`;
    }

    _openNewLocation() {
        const expSys = this.world && this.world.subsystems.expansion;
        if (!expSys) return;
        const cost = expSys.state.locations.length * 25000;
        const loc = expSys.openLocation(null, this.engine.day);
        if (loc) {
            this.engine.cash -= cost;
            this.showNotification(`🏗️ ${loc.name} is now open! Cost: $${cost.toLocaleString()}.`, 'success');
            if (this.journal) this.journal.onSituation('first_expansion');
            document.querySelector('.modal-overlay')?.remove();
            this.showExpansionPanel();
        }
    }

    _renderHealthSafetyCard(hsSys) {
        if (!hsSys) return '';
        const status = hsSys.getComplianceStatus();
        const violations = status.violations;
        return `
            <div style="background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 12px; border-left: 3px solid ${status.color};">
                <h3>🏥 Health & Safety</h3>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>Compliance: <strong style="color: ${status.color};">${Math.round(status.score)}% — ${status.label}</strong></div>
                    <div style="font-size: 12px; color: #94a3b8;">Inspections: ✅${hsSys.state.inspectionsPassed} ❌${hsSys.state.inspectionsFailed}</div>
                </div>
                ${violations.length > 0 ? `<div style="margin-top: 6px; font-size: 12px; color: #fca5a5;">⚠️ ${violations.length} unresolved violation(s)! Fix quickly to avoid fines.</div>` : ''}
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">💡 Keep staff morale high and equipment maintained to improve compliance.</div>
            </div>`;
    }

    _renderEnvironmentalCard(envSys) {
        if (!envSys) return '';
        const s = envSys.state;
        const susColor = s.sustainabilityScore >= 60 ? '#22c55e' : s.sustainabilityScore >= 35 ? '#eab308' : '#ef4444';
        const initiatives = envSys.getInitiativeCatalog();
        const cash = this.engine ? this.engine.cash : 0;

        const initItems = initiatives.map(i => {
            const owned = s.initiatives.includes(i.id);
            const canAfford = !owned && cash >= i.cost;
            return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 12px;">
                <span>${i.name} — <span style="color: #94a3b8;">${i.desc}</span></span>
                ${owned ? '<span style="color: #22c55e;">✅</span>'
                    : `<button class="btn btn-sm" style="padding: 2px 8px; font-size: 11px;" ${canAfford ? '' : 'disabled style="opacity:0.5; padding: 2px 8px; font-size: 11px;"'}
                        onclick="window.game._purchaseInitiative('${i.id}')">$${i.cost}</button>`}
            </div>`;
        }).join('');

        return `
            <div style="background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 12px; border-left: 3px solid ${susColor};">
                <h3>🌿 Sustainability</h3>
                <div>Score: <strong style="color: ${susColor};">${Math.round(s.sustainabilityScore)}%</strong>
                    | Waste: ${s.wastePct.toFixed(1)}% | Energy: ${s.energyEfficiency}%</div>
                <div style="margin-top: 8px;">${initItems}</div>
            </div>`;
    }

    _purchaseInitiative(initId) {
        const envSys = this.world && this.world.subsystems.environmental;
        if (!envSys) return;
        const init = envSys.purchaseInitiative(initId);
        if (init) {
            this.engine.cash -= init.cost;
            this.showNotification(`${init.name} implemented! Sustainability improved.`, 'success');
            document.querySelector('.modal-overlay')?.remove();
            this.showExpansionPanel();
        }
    }

    _renderGlobalEventCard(globalSys) {
        if (!globalSys) return '';
        const s = globalSys.state;
        const econColor = s.economicIndex >= 110 ? '#22c55e' : s.economicIndex >= 90 ? '#eab308' : '#ef4444';
        let eventHtml = '<div style="font-size: 12px; color: #94a3b8;">No major global events currently affecting business.</div>';
        if (s.currentEvent) {
            const e = s.currentEvent;
            const sentiment = e.effects.demandMod < 1 ? '#ef4444' : '#22c55e';
            eventHtml = `<div style="background: ${e.effects.demandMod < 1 ? '#7f1d1d' : '#14532d'}; border-radius: 6px; padding: 8px; margin-top: 6px;">
                <strong style="color: ${sentiment};">${e.name}</strong>
                <div style="font-size: 12px; color: #d6d3d1; margin-top: 2px;">${e.description}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Demand: ${(e.effects.demandMod * 100).toFixed(0)}% | Costs: ${(e.effects.costMod * 100).toFixed(0)}%</div>
            </div>`;
        }
        return `
            <div style="background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 12px; border-left: 3px solid ${econColor};">
                <h3>🌍 Global Economy</h3>
                <div>Economic Index: <strong style="color: ${econColor};">${s.economicIndex.toFixed(0)}</strong>
                    | Inflation: ${(s.inflationRate * 100).toFixed(1)}%</div>
                ${eventHtml}
            </div>`;
    }

    _renderCommunityCard(commSys) {
        if (!commSys) return '';
        const s = commSys.state;
        const gwColor = s.communityGoodwill >= 70 ? '#22c55e' : s.communityGoodwill >= 40 ? '#eab308' : '#ef4444';
        let eventsHtml = '<div style="font-size: 12px; color: #94a3b8;">No community events right now.</div>';
        if (s.activeEvents.length > 0) {
            eventsHtml = s.activeEvents.map(e => {
                const impact = e.demandMod >= 1 ? `📈 +${Math.round((e.demandMod - 1) * 100)}% demand` : `📉 ${Math.round((e.demandMod - 1) * 100)}% demand`;
                return `<div style="font-size: 12px; padding: 4px 0;">
                    <strong>${e.name}</strong> — ${impact}
                    ${!e.participated ? `<button class="btn btn-sm" style="padding: 2px 8px; font-size: 11px; margin-left: 6px;"
                        onclick="window.game._participateInEvent('${e.id}')">🤝 Participate</button>` : ' <span style="color: #22c55e;">✅ Participated</span>'}
                </div>`;
            }).join('');
        }
        return `
            <div style="background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 12px; border-left: 3px solid ${gwColor};">
                <h3>🎉 Community & Events</h3>
                <div>Goodwill: <strong style="color: ${gwColor};">${Math.round(s.communityGoodwill)}%</strong>
                    | Donations: $${s.donationTotal} | Events joined: ${s.participationCount}</div>
                <div style="margin-top: 6px;">${eventsHtml}</div>
            </div>`;
    }

    _participateInEvent(eventId) {
        const commSys = this.world && this.world.subsystems.communityEvents;
        if (!commSys) return;
        commSys.participate(eventId);
        this.showNotification(`🤝 You participated in the community event! Goodwill increased.`, 'success');
        if (this.journal) this.journal.onSituation('community_event');
        document.querySelector('.modal-overlay')?.remove();
        this.showExpansionPanel();
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

    /**
     * Add a scenario effect — routes to WorldSimulation.state.activeEffects (persistent)
     * with legacy fallback if world is not initialised.
     */
    addScenarioEffect({ key, multiplier = 1, value = 0, duration = 2, label = 'Scenario effect', operation, description }) {
        if (!this.engine) return;
        const normalized = this.normalizeScenarioDuration(duration, 2);
        const operationUsed = operation || (key === 'loyalty' ? 'add' : 'multiply');

        // Primary path — persistent in WorldState (saved/loaded automatically)
        if (this.world && this.world.addEffect) {
            this.world.addEffect({
                key,
                multiplier,
                value,
                duration: normalized,
                label,
                operation: operationUsed,
                source: 'scenario'
            });
        } else {
            // Fallback — volatile array (pre-world-init or no world)
            const expiresOnDay = this.engine.day + normalized - 1;
            this._legacyScenarioEffects.push({ key, multiplier, value, duration: normalized, label, operation: operationUsed, description, expiresOnDay });
        }

        const plural = normalized === 1 ? 'day' : 'days';
        const isPositive = (operationUsed === 'add' && value > 0) || (operationUsed !== 'add' && multiplier > 1);
        this.showNotification(`${label} active for ${normalized} ${plural}.`, isPositive ? 'success' : 'warning');
    }

    /**
     * Read a scenario modifier — merges WorldState persistent effects with legacy fallback.
     */
    getScenarioModifier(key, options = {}) {
        const { defaultValue, operation } = options;

        // Gather effects from both stores
        let worldEffects = [];
        if (this.world && this.world.state && this.world.state.activeEffects) {
            worldEffects = this.world.state.activeEffects.filter(e => e.key === key);
        }
        const legacyEffects = (this._legacyScenarioEffects || []).filter(e => e.key === key);
        const allEffects = worldEffects.concat(legacyEffects);

        if (operation === 'add') {
            const base = defaultValue ?? 0;
            return allEffects.reduce((sum, e) => sum + (e.value || 0), base);
        }
        const base = defaultValue ?? 1;
        return allEffects.reduce((acc, e) => acc * (e.multiplier ?? 1), base);
    }

    /**
     * Purge expired effects — WorldSimulation handles its own purge in simulateDay().
     * This only cleans the legacy fallback array.
     */
    purgeExpiredScenarioEffects() {
        if (!this.engine) return;
        const day = this.engine.day;
        this._legacyScenarioEffects = (this._legacyScenarioEffects || []).filter(effect => day <= effect.expiresOnDay);
    }

    /**
     * Backward-compat getter — returns the merged active effects from both stores.
     */
    get activeScenarioEffects() {
        const world = (this.world && this.world.state && this.world.state.activeEffects) ? this.world.state.activeEffects : [];
        return world.concat(this._legacyScenarioEffects || []);
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
