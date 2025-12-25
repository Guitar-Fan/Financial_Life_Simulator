/**
 * GameController.js - Main game loop with guided sequential mode flow
 */

class GameController {
    constructor() {
        this.engine = null;
        this.tutorial = null;
        this.currentPhase = 'menu'; // menu, buying, baking, selling, summary
        this.phaseOrder = ['buying', 'baking', 'selling', 'summary'];
        this.phaseIndex = 0;
        this.isRunning = false;
        this.lastUpdate = 0;
        this.customerQueue = [];
        this.currentCustomer = null;
        this.crisisActive = false;
        
        this.init();
    }
    
    init() {
        this.engine = new FinancialEngine();
        this.tutorial = new TutorialSystem(this);
        this.setupEventListeners();
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
            this.updateStats();
        });
        
        this.engine.on('purchase', (data) => {
            window.dispatchEvent(new CustomEvent('engine:purchase', { detail: data }));
            this.updateStats();
        });
    }
    
    // ==================== MAIN MENU ====================
    showMainMenu() {
        this.currentPhase = 'menu';
        const container = document.getElementById('game-container');
        
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-header">
                    <div class="menu-logo">🥐</div>
                    <h1 class="menu-title">Sweet Success Bakery</h1>
                    <p class="menu-subtitle">A Financial Simulation Game</p>
                </div>
                
                <div class="menu-buttons">
                    <button class="menu-btn primary" id="btn-new-game" role="button" tabindex="0" aria-label="Start a new game">
                        <span class="btn-content">
                            <span class="btn-icon">🎮</span>
                            <span class="btn-title">New Game</span>
                            <span class="btn-sub">Start fresh with $15,000</span>
                        </span>
                    </button>

                    <button class="menu-btn secondary" id="btn-continue" role="button" tabindex="0" aria-label="Continue saved game" style="display: none;">
                        <span class="btn-content">
                            <span class="btn-icon">▶️</span>
                            <span class="btn-title">Continue</span>
                            <span class="btn-sub">Resume your last save</span>
                        </span>
                    </button>

                    <button class="menu-btn secondary" id="btn-tutorial" role="button" tabindex="0" aria-label="Open tutorial">
                        <span class="btn-content">
                            <span class="btn-icon">📖</span>
                            <span class="btn-title">How to Play</span>
                            <span class="btn-sub">Quick guide to game mechanics</span>
                        </span>
                    </button>
                </div>
                
                <div class="menu-info">
                    <p>Start with $15,000 and build your bakery empire!</p>
                    <p>Learn real business concepts: COGS, Margins, Expenses</p>
                </div>
            </div>
        `;
        
        // Reveal continue when a save exists
        const btnContinue = document.getElementById('btn-continue');
        if (localStorage.getItem('bakery_save')) {
            btnContinue.style.display = 'block';
            btnContinue.addEventListener('click', () => this.loadAndStart());
        }
        
        const btnNew = document.getElementById('btn-new-game');
        const btnTut = document.getElementById('btn-tutorial');
        
        // Common accessible activation (keyboard Enter/Space)
        const makeAccessible = (el, handler) => {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });
            el.addEventListener('click', handler);
        };
        
        // Button press animation + ripple using GSAP
        const animatePress = (btn, event) => {
            // small scale pulse
            gsap.fromTo(btn, { scale: 1 }, { scale: 1.04, duration: 0.08, yoyo: true, repeat: 1 });
            // ripple
            const rect = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            const x = (event && event.clientX) ? event.clientX - rect.left : rect.width / 2;
            const y = (event && event.clientY) ? event.clientY - rect.top : rect.height / 2;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            btn.appendChild(ripple);
            gsap.fromTo(ripple, { scale: 0, opacity: 0.35 }, { scale: 6, opacity: 0, duration: 0.7, onComplete: () => ripple.remove() });
        };
        
        // Wire up New Game
        makeAccessible(btnNew, (e) => {
            animatePress(btnNew, e);
            setTimeout(() => this.startNewGame(), 180);
        });
        
        // Wire up Tutorial
        makeAccessible(btnTut, (e) => {
            animatePress(btnTut, e);
            setTimeout(() => this.showTutorial(), 180);
        });

        // Give focus styles and hover micro-interactions
        [btnNew, btnTut, btnContinue].forEach(b => {
            if (!b) return;
            b.addEventListener('mouseenter', () => gsap.to(b.querySelector('.btn-icon'), { y: -4, duration: 0.18 }));
            b.addEventListener('mouseleave', () => gsap.to(b.querySelector('.btn-icon'), { y: 0, duration: 0.18 }));
            b.addEventListener('mousedown', (ev) => animatePress(b, ev));
        });
    }
    
    startNewGame() {
        this.engine.reset();
        localStorage.removeItem('bakery_save');
        this.goToPhase('setup');
    }
    
    loadAndStart() {
        const save = localStorage.getItem('bakery_save');
        if (save) {
            this.engine.load(JSON.parse(save));
        }
        this.startDay();
    }
    
    showTutorial() {
        if (this.tutorial) {
            this.tutorial.start();
        }
    }
    
    // ==================== SETUP PHASE ====================
    showSetupPhase() {
        const container = document.getElementById('game-container');
        this.setupChoices = {
            location: null,
            equipment: null,
            staff: null,
            paperwork: []
        };

        // Clear container and add Phaser container
        container.innerHTML = `<div id="phaser-container" style="width: 100%; height: 600px; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></div>`;

        // Initialize Phaser Game
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-container',
            backgroundColor: '#2C1810',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [StartupScene]
        };

        this.phaserGame = new Phaser.Game(config);
        
        // We keep the renderSetup method for the modal interactions to use
        this.renderSetup = () => {
            // This is now handled by the Phaser scene's modals updating the game state
            // and potentially refreshing their own UI if needed.
            // The selectSetup method still updates the state.
        };
    }

    selectSetup(type, id) {
        const options = GAME_CONFIG.SETUP_OPTIONS;
        if (type === 'location') {
            this.setupChoices.location = options.locations.find(l => l.id === id);
        } else if (type === 'equipment') {
            this.setupChoices.equipment = options.equipment.find(e => e.id === id);
        } else if (type === 'staff') {
            this.setupChoices.staff = options.staff.find(s => s.id === id);
        } else if (type === 'paperwork') {
            if (this.setupChoices.paperwork.includes(id)) {
                this.setupChoices.paperwork = this.setupChoices.paperwork.filter(p => p !== id);
            } else {
                this.setupChoices.paperwork.push(id);
            }
        }
        this.renderSetup();
    }

    canFinishSetup() {
        return this.setupChoices.location && 
               this.setupChoices.equipment && 
               this.setupChoices.staff && 
               this.setupChoices.paperwork.length === GAME_CONFIG.SETUP_OPTIONS.paperwork.length;
    }

    finishSetup() {
        // Destroy Phaser game if it exists
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }

        // Apply choices to engine
        const choices = this.setupChoices;
        this.engine.rentAmount = choices.location.rent;
        this.engine.trafficMultiplier = choices.location.traffic;
        this.engine.ovenCapacity = choices.equipment.capacity;
        this.engine.bakingSpeedMultiplier = 1.0 + (choices.staff.bonus || 0);
        
        // Deduct costs
        const totalCost = choices.equipment.cost + choices.staff.cost + 
                         choices.paperwork.reduce((sum, id) => sum + GAME_CONFIG.SETUP_OPTIONS.paperwork.find(p => p.id === id).cost, 0);
        
        this.engine.cash -= totalCost;
        
        // Initialize day state without forcing a modal; the hub will route phases
        this.phaseIndex = 0;
        this.engine.isPaused = true;
        this.engine.hour = GAME_CONFIG.TIME.OPENING_HOUR;
        this.engine.minute = 0;

        // Move to free-roam mode hub
        this.showModeHub();
    }

    showModeHub() {
        this.currentPhase = 'hub';
        window.dispatchEvent(new CustomEvent('gamePhaseChanged', { detail: { phase: 'hub' } }));

        const container = document.getElementById('game-container');
        container.innerHTML = `<div id="phaser-container" style="width: 100%; height: 720px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></div>`;

        const config = {
            type: Phaser.AUTO,
            width: 1000,
            height: 720,
            parent: 'phaser-container',
            backgroundColor: '#11161c',
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            },
            scene: [ModeHubScene]
        };

        this.phaserGame = new Phaser.Game(config);
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
        
        container.innerHTML = `
            <div class="phase-header">
                <h2>📦 Buy Inventory</h2>
                <p>Purchase ingredients from vendors. Check the recipe book to see what you need!</p>
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
        `;
        
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
            
            const ingredientsList = Object.entries(recipe.ingredients).map(([ingKey, amount]) => {
                const ing = GAME_CONFIG.INGREDIENTS[ingKey];
                const have = this.engine.getIngredientStock(ingKey);
                const enough = have >= amount;
                return `<div class="recipe-ing ${enough ? 'have' : 'need'}">
                    ${ing.icon} ${amount} ${ing.unit} ${ing.name}
                    <span class="have-amount">(have: ${have.toFixed(1)})</span>
                </div>`;
            }).join('');
            
            return `
                <div class="recipe-ref-card ${canBake ? 'can-bake' : ''}">
                    <div class="recipe-ref-header">
                        <span class="recipe-ref-icon">${recipe.icon}</span>
                        <span class="recipe-ref-name">${recipe.name}</span>
                        <span class="recipe-ref-price">$${recipe.retailPrice.toFixed(2)}</span>
                    </div>
                    <div class="recipe-ref-ingredients">${ingredientsList}</div>
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
        
        grid.innerHTML = Object.entries(GAME_CONFIG.INGREDIENTS)
            .filter(([key, ing]) => vendor.categories.includes(ing.category))
            .map(([key, ing]) => {
                const price = ing.basePrice * vendor.priceMultiplier;
                const stock = this.engine.getIngredientStock(key);
                const quality = this.engine.getIngredientQuality(key);
                const qualityLabel = stock > 0 ? this.engine.getQualityLabel(quality) : null;
                const startQuality = Math.min(100, ing.baseQuality * vendor.qualityMultiplier);
                
                return `
                    <div class="ingredient-card" data-ingredient="${key}" data-vendor="${vendorKey}">
                        <div class="ing-icon">${ing.icon}</div>
                        <div class="ing-name">${ing.name}</div>
                        <div class="ing-price">$${price.toFixed(2)}/${ing.unit}</div>
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
        
        container.innerHTML = `
            <div class="phase-header">
                <h2>🍞 Bake Products</h2>
                <p>Choose recipes to bake. Each recipe uses ingredients and takes time.</p>
            </div>
            
            <div class="baking-layout" id="bake-phase-container">
                <div class="recipes-section">
                    <h3>Recipes</h3>
                    <div class="recipe-grid" id="recipe-grid"></div>
                </div>
                
                <div class="oven-section">
                    <h3>🔥 Oven (${this.engine.ovenCapacity} slots)</h3>
                    <div class="oven-slots" id="oven-slots"></div>
                    
                    <h3>📦 Ready Products</h3>
                    <div class="ready-products" id="ready-products"></div>
                </div>
            </div>
            
            <div class="phase-actions">
                <button class="btn btn-secondary" id="btn-back-hub">Return to Hub</button>
                <button class="btn btn-primary" id="btn-done-baking">Done Baking</button>
            </div>
        `;
        
        this.renderRecipes();
        this.renderOven();
        this.renderReadyProducts();
        
        // Start baking timer
        this.startBakingLoop();
        
        document.getElementById('btn-back-hub').onclick = () => {
            this.stopBakingLoop();
            this.showModeHub();
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
                        { text: 'Return to Hub', action: () => {
                            this.stopBakingLoop();
                            this.showModeHub();
                        }}
                    ]
                });
                return;
            }
            
            this.stopBakingLoop();
            this.showModeHub();
        };
        
        this.updateStats();
    }
    
    renderRecipes() {
        const grid = document.getElementById('recipe-grid');
        if (!grid) return;
        
        grid.innerHTML = Object.entries(GAME_CONFIG.RECIPES).map(([key, recipe]) => {
            const { canBake, missing } = this.engine.canBakeRecipe(key);
            const cost = this.engine.calculateProductCost(key);
            const profit = recipe.retailPrice - cost;
            const margin = ((profit / recipe.retailPrice) * 100).toFixed(0);
            const expectedQuality = this.engine.calculateProductQuality(key);
            const qualityLabel = this.engine.getQualityLabel(expectedQuality);
            
            return `
                <div class="recipe-card ${canBake ? '' : 'unavailable'}" data-recipe="${key}">
                    <div class="recipe-icon">${recipe.icon}</div>
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-stats">
                        <div>Cost: $${cost.toFixed(2)}</div>
                        <div>Sells: $${recipe.retailPrice.toFixed(2)}</div>
                        <div class="recipe-profit">+$${profit.toFixed(2)} (${margin}%)</div>
                    </div>
                    <div class="recipe-quality" style="color: ${qualityLabel.color}">
                        ${qualityLabel.emoji} Expected: ${expectedQuality.toFixed(0)}% quality
                    </div>
                    <div class="recipe-time">⏱️ ${recipe.bakeTime} min | 📅 Fresh for ${recipe.shelfLife} days</div>
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
    }
    
    renderOven() {
        const slots = document.getElementById('oven-slots');
        if (!slots) return;
        
        const baking = this.engine.productionQueue.filter(p => p.status === 'baking');
        
        let html = '';
        for (let i = 0; i < this.engine.ovenCapacity; i++) {
            const item = baking[i];
            if (item) {
                const progress = Math.min(100, (item.progress / item.totalTime) * 100);
                html += `
                    <div class="oven-slot active">
                        <div class="oven-item">${item.recipeIcon} ${item.recipeName}</div>
                        <div class="oven-progress">
                            <div class="oven-progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <div class="oven-time">${Math.ceil((item.totalTime - item.progress) / 1000)}s left</div>
                    </div>
                `;
            } else {
                html += `<div class="oven-slot empty">Empty Slot</div>`;
            }
        }
        
        slots.innerHTML = html;
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
                const effectivePrice = recipe.retailPrice * priceMultiplier;
                
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
                this.renderOven();
                this.renderReadyProducts();
                this.renderRecipes();
            } else if (this.engine.productionQueue.length > 0) {
                this.renderOven();
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
        this.customerQueue = [];
        this.currentCustomer = null;
        
        const container = document.getElementById('game-container');
        
        container.innerHTML = `
            <div class="phase-header">
                <h2>💰 Open Shop - Day ${this.engine.day}</h2>
                <p>Serve customers and make sales! Time: <span id="game-time">${this.engine.getTimeString()}</span></p>
            </div>
            
            <div class="selling-layout" id="sell-phase-container">
                <div class="shop-display">
                    <h3>🏪 Your Display Case</h3>
                    <div class="display-products" id="display-products"></div>
                </div>
                
                <div class="customer-window">
                    <h3>👥 Customer Window</h3>
                    <div class="customer-area" id="customer-area">
                        <div class="waiting-message">Waiting for customers...</div>
                    </div>
                </div>
                
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
        `;
        
        this.renderDisplayProducts();
        this.startSellingLoop();
        
        document.getElementById('btn-close-shop').onclick = () => {
            this.showPopup({
                icon: '🚪',
                title: 'Close Shop?',
                message: 'Are you sure you want to close early? Any remaining customers will leave.',
                type: 'warning',
                buttons: [
                    { text: 'Stay Open', action: 'close', style: 'secondary' },
                    { text: 'Close Shop', action: () => {
                        this.stopSellingLoop();
                        this.showModeHub();
                    }}
                ]
            });
        };
        
        this.updateStats();
        
        // Maybe trigger a crisis
        if (Math.random() < 0.3) {
            setTimeout(() => this.triggerCrisis(), 5000);
        }
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
                const effectivePrice = recipe.retailPrice * priceMultiplier;
                
                return `
                    <div class="display-item ${stock === 0 ? 'sold-out' : ''}">
                        <div class="display-icon">${recipe.icon}</div>
                        <div class="display-name">${recipe.name}</div>
                        <div class="display-price" title="Base: $${recipe.retailPrice.toFixed(2)}">$${effectivePrice.toFixed(2)}</div>
                        <div class="display-quality" style="color: ${qualityLabel.color}">${qualityLabel.emoji}</div>
                        <div class="display-qty">${stock}x</div>
                    </div>
                `;
            }).join('');
        
        display.innerHTML = products;
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
            
            // Spawn customers
            if (!this.currentCustomer && !this.crisisActive) {
                const timeSinceLastCustomer = now - this.lastCustomerTime;
                const hourMult = GAME_CONFIG.DEMAND.hourlyMultiplier[Math.floor(this.engine.hour)] || 0.5;
                const spawnChance = (GAME_CONFIG.DEMAND.baseCustomersPerHour * hourMult) / 60 / 10;
                
                if (timeSinceLastCustomer > 2000 && Math.random() < spawnChance) {
                    this.spawnCustomer();
                    this.lastCustomerTime = now;
                }
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
    }
    
    spawnCustomer() {
        const customer = GAME_CONFIG.CUSTOMERS[Math.floor(Math.random() * GAME_CONFIG.CUSTOMERS.length)];
        const greetings = GAME_CONFIG.CUSTOMER_DIALOGUES.greeting;
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        // Find available products
        const available = Object.entries(this.engine.products)
            .filter(([key, p]) => p.quantity > 0)
            .map(([key]) => key);
        
        this.currentCustomer = {
            ...customer,
            greeting,
            wantsItem: available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null
        };
        
        this.showCustomerPopup();
    }
    
    showCustomerPopup() {
        const customer = this.currentCustomer;
        const customerArea = document.getElementById('customer-area');
        
        if (!customer.wantsItem) {
            // Nothing available
            const sadDialogue = GAME_CONFIG.CUSTOMER_DIALOGUES.sad;
            const message = sadDialogue[Math.floor(Math.random() * sadDialogue.length)];
            
            customerArea.innerHTML = `
                <div class="customer-popup">
                    <div class="customer-face" style="font-size: 64px;">${customer.face}</div>
                    <div class="customer-name">${customer.name}</div>
                    <div class="customer-dialogue">"${message}"</div>
                    <div class="customer-mood">😢 Disappointed</div>
                </div>
            `;
            
            this.engine.missedCustomer();
            
            setTimeout(() => {
                this.currentCustomer = null;
                customerArea.innerHTML = '<div class="waiting-message">Waiting for customers...</div>';
            }, 2000);
            
            return;
        }
        
        const recipe = GAME_CONFIG.RECIPES[customer.wantsItem];
        const orderDialogues = GAME_CONFIG.CUSTOMER_DIALOGUES.ordering;
        const orderMsg = orderDialogues[Math.floor(Math.random() * orderDialogues.length)]
            .replace('{item}', recipe.name);
        
        customerArea.innerHTML = `
            <div class="customer-popup">
                <div class="customer-face" style="font-size: 64px;">${customer.face}</div>
                <div class="customer-name">${customer.name}</div>
                <div class="customer-dialogue">"${customer.greeting}"</div>
                <div class="customer-order">"${orderMsg}"</div>
                <div class="customer-buttons">
                    <button class="btn btn-success" id="btn-sell">Sell ${recipe.icon} ($${recipe.retailPrice.toFixed(2)})</button>
                    <button class="btn btn-secondary" id="btn-refuse">Sorry, can't help</button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-sell').onclick = () => this.completeCustomerSale();
        document.getElementById('btn-refuse').onclick = () => this.refuseCustomer();
    }
    
    completeCustomerSale() {
        const customer = this.currentCustomer;
        const recipe = GAME_CONFIG.RECIPES[customer.wantsItem];
        
        const result = this.engine.processSale(customer.wantsItem, 1);
        
        if (result.success) {
            const happyDialogues = GAME_CONFIG.CUSTOMER_DIALOGUES.happy;
            const msg = happyDialogues[Math.floor(Math.random() * happyDialogues.length)]
                .replace('{item}', recipe.name);
            
            const customerArea = document.getElementById('customer-area');
            customerArea.innerHTML = `
                <div class="customer-popup success">
                    <div class="customer-face" style="font-size: 64px;">😊</div>
                    <div class="customer-name">${customer.name}</div>
                    <div class="customer-dialogue">"${msg}"</div>
                    <div class="sale-amount">+$${result.revenue.toFixed(2)}</div>
                </div>
            `;
            
            this.renderDisplayProducts();
            
            setTimeout(() => {
                this.currentCustomer = null;
                customerArea.innerHTML = '<div class="waiting-message">Waiting for customers...</div>';
            }, 1500);
        }
    }
    
    refuseCustomer() {
        this.engine.missedCustomer();
        this.currentCustomer = null;
        
        const customerArea = document.getElementById('customer-area');
        customerArea.innerHTML = '<div class="waiting-message">Waiting for customers...</div>';
    }
    
    updateSellingStats() {
        const revenueEl = document.getElementById('stat-revenue');
        const customersEl = document.getElementById('stat-customers');
        const missedEl = document.getElementById('stat-missed');
        
        if (revenueEl) revenueEl.textContent = `$${this.engine.dailyStats.revenue.toFixed(2)}`;
        if (customersEl) customersEl.textContent = this.engine.dailyStats.customersServed;
        if (missedEl) missedEl.textContent = this.engine.dailyStats.customersMissed;
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
        
        const summary = this.engine.endDay();
        
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
        if (cashEl) cashEl.textContent = `$${this.engine.cash.toFixed(2)}`;
        
        const dayEl = document.getElementById('nav-day');
        if (dayEl) dayEl.textContent = `Day ${this.engine.day}`;
    }
    
    updatePhaseIndicator() {
        const phases = ['setup', 'buying', 'baking', 'selling', 'summary'];
        phases.forEach(phase => {
            const el = document.getElementById(`phase-${phase}`);
            if (el) {
                el.classList.toggle('active', phase === this.currentPhase);
                el.classList.toggle('complete', phases.indexOf(phase) < phases.indexOf(this.currentPhase));
            }
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
        
        popup.innerHTML = `
            <div class="popup-icon">${options.icon || 'ℹ️'}</div>
            <div class="popup-title">${options.title}</div>
            <div class="popup-message">${options.message}</div>
            ${buttonsHtml}
        `;
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        // Animate in
        gsap.fromTo(popup, 
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out' }
        );
        
        // Button handlers
        if (options.buttons) {
            popup.querySelectorAll('.popup-btn').forEach((btn, i) => {
                btn.onclick = () => {
                    const action = options.buttons[i].action;
                    overlay.remove();
                    if (typeof action === 'function') {
                        action();
                    }
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
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
