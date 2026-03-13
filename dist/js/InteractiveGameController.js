/**
 * InteractiveGameController.js - Phaser-based interactive game controller
 * Bridges the BakeryGameScene with the FinancialEngine
 * This replaces the HTML-based GameController with an interactive walking experience
 */

class InteractiveGameController {
    constructor() {
        this.engine = null;
        this.phaserGame = null;
        this.scene = null;
        this.currentPhase = 'menu';
        this.isGameRunning = false;

        // Modal state
        this.activeModal = null;

        this.init();
    }

    init() {
        this.engine = new FinancialEngine();
        this.setupEngineEvents();
        this.showMainMenu();
    }

    setupEngineEvents() {
        this.engine.on('baking_complete', (item) => {
            this.showNotification({
                icon: item.recipeIcon,
                title: 'Baking Complete!',
                message: `${item.quantity}x ${item.recipeName} is ready!`,
                type: 'success'
            });
            this.updateHUD();
        });

        this.engine.on('sale', () => this.updateHUD());
        this.engine.on('purchase', () => this.updateHUD());
    }

    // ==================== MAIN MENU ====================
    showMainMenu() {
        this.currentPhase = 'menu';

        // Hide Phaser game if running
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
            this.phaserGame = null;
        }

        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="main-menu">
                <div class="menu-header">
                    <div class="menu-logo">🥐</div>
                    <h1 class="menu-title">Sweet Success Bakery</h1>
                    <p class="menu-subtitle">Interactive Bakery Simulation</p>
                </div>
                
                <div class="menu-buttons">
                    <button class="menu-btn primary" id="btn-new-game">
                        🎮 New Game
                    </button>
                    <button class="menu-btn secondary" id="btn-continue" style="display: none;">
                        ▶️ Continue
                    </button>
                    <button class="menu-btn secondary" id="btn-tutorial">
                        📖 How to Play
                    </button>
                </div>
                
                <div class="menu-info">
                    <p>Walk around your bakery with <strong>WASD</strong> or <strong>Arrow Keys</strong></p>
                    <p>Approach stations and press <strong>E</strong> to interact</p>
                </div>
            </div>
        `;

        // Check for saved game
        if (localStorage.getItem('bakery_save')) {
            document.getElementById('btn-continue').style.display = 'block';
            document.getElementById('btn-continue').onclick = () => this.loadAndStart();
        }

        document.getElementById('btn-new-game').onclick = () => this.startNewGame();
        document.getElementById('btn-tutorial').onclick = () => this.showTutorial();
    }

    showTutorial() {
        this.showModal({
            title: '📖 How to Play',
            content: `
                <div style="text-align: left; line-height: 2;">
                    <h3>🎮 Controls</h3>
                    <p><strong>WASD</strong> or <strong>Arrow Keys</strong> - Walk around</p>
                    <p><strong>E</strong> or <strong>Space</strong> - Interact with stations</p>
                    
                    <h3>🏪 Stations</h3>
                    <p>🔥 <strong>Oven</strong> - Bake products from ingredients</p>
                    <p>🛒 <strong>Display Case</strong> - Serve customers</p>
                    <p>📦 <strong>Storage</strong> - Buy ingredients</p>
                    <p>🗑️ <strong>Waste Bin</strong> - Discard expired items</p>
                    
                    <h3>💰 Goal</h3>
                    <p>Manage your bakery's finances! Buy ingredients, bake goods, serve customers, and make a profit.</p>
                </div>
            `,
            buttons: [{ text: 'Got it!', action: 'close', style: 'primary' }]
        });
    }

    startNewGame() {
        this.engine.reset();
        localStorage.removeItem('bakery_save');
        this.startGame();
    }

    loadAndStart() {
        const save = localStorage.getItem('bakery_save');
        if (save) {
            this.engine.load(JSON.parse(save));
        }
        this.startGame();
    }

    // ==================== PHASER GAME ====================
    startGame() {
        this.currentPhase = 'playing';

        // Setup game container with HUD overlay
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div id="phaser-container"></div>
            <div id="game-hud">
                <div class="hud-stats">
                    <div class="hud-stat">
                        <span class="hud-label">Cash</span>
                        <span class="hud-value" id="hud-cash">$${this.engine.cash.toFixed(2)}</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">Day</span>
                        <span class="hud-value" id="hud-day">${this.engine.day}</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">Time</span>
                        <span class="hud-value" id="hud-time">${this.engine.getTimeString()}</span>
                    </div>
                </div>
                <div class="hud-actions">
                    <button class="hud-btn" id="btn-pause">⏸️ Pause</button>
                    <button class="hud-btn" id="btn-menu">🏠 Menu</button>
                </div>
            </div>
        `;

        // Add HUD styles
        this.addHUDStyles();

        // Create Phaser game
        const config = {
            type: Phaser.AUTO,
            width: 1024,
            height: 768,
            parent: 'phaser-container',
            backgroundColor: '#2C1810',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [BakeryGameScene]
        };

        this.phaserGame = new Phaser.Game(config);

        // Wait for scene to be ready
        this.phaserGame.events.once('ready', () => {
            this.scene = this.phaserGame.scene.getScene('BakeryGameScene');
            this.setupSceneEvents();
        });

        // Fallback: try to get scene after a short delay
        setTimeout(() => {
            if (!this.scene) {
                this.scene = this.phaserGame.scene.getScene('BakeryGameScene');
                if (this.scene) {
                    this.setupSceneEvents();
                }
            }
        }, 1000);

        // Setup HUD buttons
        document.getElementById('btn-pause').onclick = () => this.togglePause();
        document.getElementById('btn-menu').onclick = () => this.confirmReturnToMenu();

        this.isGameRunning = true;
        this.startGameLoop();
    }

    setupSceneEvents() {
        if (!this.scene) return;

        // Listen for zone interactions
        this.scene.events.on('zone-interaction', (data) => {
            this.handleZoneInteraction(data);
        });

        // Listen for customer events
        this.scene.events.on('customer-left', (customer) => {
            this.engine.missedCustomer();
            this.updateHUD();
        });

        // Start customer spawning
        this.scene.startCustomerSpawning(6000);
    }

    addHUDStyles() {
        // Check if styles already added
        if (document.getElementById('hud-styles')) return;

        const style = document.createElement('style');
        style.id = 'hud-styles';
        style.textContent = `
            #phaser-container {
                width: 100%;
                height: calc(100% - 70px);
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            #phaser-container canvas {
                max-width: 100%;
                max-height: 100%;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            
            #game-hud {
                position: fixed;
                top: 60px;
                left: 0;
                right: 0;
                height: 50px;
                background: linear-gradient(180deg, rgba(44, 24, 16, 0.95) 0%, rgba(44, 24, 16, 0.8) 100%);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 20px;
                z-index: 100;
            }
            
            .hud-stats {
                display: flex;
                gap: 30px;
            }
            
            .hud-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .hud-label {
                font-size: 10px;
                color: rgba(255,255,255,0.6);
                text-transform: uppercase;
            }
            
            .hud-value {
                font-family: 'Fredoka', sans-serif;
                font-size: 18px;
                font-weight: 600;
                color: #FFD700;
            }
            
            .hud-actions {
                display: flex;
                gap: 10px;
            }
            
            .hud-btn {
                padding: 8px 16px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .hud-btn:hover {
                background: rgba(255,255,255,0.2);
            }
            
            /* Modal styles */
            .game-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .game-modal {
                background: linear-gradient(135deg, #2C1810 0%, #3d2317 100%);
                border: 3px solid #F4A460;
                border-radius: 20px;
                padding: 30px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            }
            
            .modal-title {
                font-family: 'Fredoka', sans-serif;
                font-size: 24px;
                color: #FFD700;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .modal-content {
                color: #FFF8DC;
                margin-bottom: 20px;
            }
            
            .modal-buttons {
                display: flex;
                justify-content: center;
                gap: 15px;
                flex-wrap: wrap;
            }
            
            .modal-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 25px;
                font-family: 'Fredoka', sans-serif;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .modal-btn.primary {
                background: linear-gradient(135deg, #FFD700 0%, #F39C12 100%);
                color: #2C1810;
            }
            
            .modal-btn.secondary {
                background: rgba(255,255,255,0.1);
                color: white;
                border: 2px solid rgba(255,255,255,0.3);
            }
            
            .modal-btn.danger {
                background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
                color: white;
            }
            
            .modal-btn:hover {
                transform: scale(1.05);
            }
            
            /* Notification toast */
            .notification-toast {
                position: fixed;
                top: 120px;
                right: 20px;
                background: rgba(44, 24, 16, 0.95);
                border: 2px solid #2ECC71;
                border-radius: 12px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 1001;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-toast.error {
                border-color: #E74C3C;
            }
            
            .notification-toast.warning {
                border-color: #F39C12;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            /* Ingredient/Product grid in modals */
            .item-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
                margin: 15px 0;
            }
            
            .item-card {
                background: rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 12px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                border: 2px solid transparent;
            }
            
            .item-card:hover {
                background: rgba(255,255,255,0.15);
                transform: translateY(-2px);
            }
            
            .item-card.selected {
                border-color: #FFD700;
                background: rgba(255,215,0,0.15);
            }
            
            .item-card.unavailable {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .item-icon {
                font-size: 32px;
                margin-bottom: 5px;
            }
            
            .item-name {
                font-size: 12px;
                color: #FFF8DC;
                margin-bottom: 3px;
            }
            
            .item-price {
                font-size: 14px;
                color: #FFD700;
                font-weight: 600;
            }
            
            .item-stock {
                font-size: 10px;
                color: rgba(255,255,255,0.6);
            }
        `;
        document.head.appendChild(style);
    }

    // ==================== GAME LOOP ====================
    startGameLoop() {
        let lastTime = performance.now();

        const loop = () => {
            if (!this.isGameRunning) return;

            const now = performance.now();
            const delta = now - lastTime;
            lastTime = now;

            // Update engine time during playing phase
            if (this.currentPhase === 'playing' && !this.engine.isPaused) {
                this.engine.update(delta);
                this.updateHUD();

                // Check for closing time
                if (this.engine.isClosingTime()) {
                    this.endDay();
                    return;
                }
            }

            // Update baking queue
            const completed = this.engine.updateProduction(delta);
            if (completed.length > 0) {
                this.updateHUD();
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    updateHUD() {
        const cashEl = document.getElementById('hud-cash');
        const dayEl = document.getElementById('hud-day');
        const timeEl = document.getElementById('hud-time');

        if (cashEl) cashEl.textContent = `$${this.engine.cash.toFixed(2)}`;
        if (dayEl) dayEl.textContent = this.engine.day;
        if (timeEl) timeEl.textContent = this.engine.getTimeString();
    }

    togglePause() {
        this.engine.isPaused = !this.engine.isPaused;
        const btn = document.getElementById('btn-pause');
        if (btn) {
            btn.textContent = this.engine.isPaused ? '▶️ Resume' : '⏸️ Pause';
        }

        if (this.scene) {
            if (this.engine.isPaused) {
                this.scene.scene.pause();
            } else {
                this.scene.scene.resume();
            }
        }
    }

    confirmReturnToMenu() {
        this.showModal({
            title: '🏠 Return to Menu?',
            content: '<p>Your progress will be saved.</p>',
            buttons: [
                { text: 'Cancel', action: 'close', style: 'secondary' },
                {
                    text: 'Save & Exit', action: () => {
                        localStorage.setItem('bakery_save', JSON.stringify(this.engine.save()));
                        this.isGameRunning = false;
                        this.showMainMenu();
                    }, style: 'primary'
                }
            ]
        });
    }

    // ==================== ZONE INTERACTIONS ====================
    handleZoneInteraction(data) {
        switch (data.action) {
            case 'baking':
                this.showBakingModal();
                break;
            case 'selling':
                this.showSellingModal();
                break;
            case 'buying':
                this.showBuyingModal();
                break;
            case 'discard':
                this.showDiscardModal();
                break;
        }
    }

    showBuyingModal() {
        const vendors = GAME_CONFIG.VENDORS;
        const ingredients = GAME_CONFIG.INGREDIENTS;

        let ingredientCards = Object.entries(ingredients).map(([key, ing]) => {
            const price = ing.basePrice;
            const stock = this.engine.getIngredientStock(key);
            return `
                <div class="item-card" data-ingredient="${key}">
                    <div class="item-icon">${ing.icon}</div>
                    <div class="item-name">${ing.name}</div>
                    <div class="item-price">$${price.toFixed(2)}/${ing.unit}</div>
                    <div class="item-stock">Have: ${stock.toFixed(1)}</div>
                </div>
            `;
        }).join('');

        this.showModal({
            title: '📦 Buy Ingredients',
            content: `
                <p style="margin-bottom: 15px;">Cash: <strong>$${this.engine.cash.toFixed(2)}</strong></p>
                <div class="item-grid">${ingredientCards}</div>
            `,
            buttons: [
                { text: 'Close', action: 'close', style: 'secondary' }
            ],
            onShow: (modal) => {
                modal.querySelectorAll('.item-card').forEach(card => {
                    card.onclick = () => {
                        const ingKey = card.dataset.ingredient;
                        this.buyIngredient(ingKey, 5); // Buy 5 units at a time
                        this.showBuyingModal(); // Refresh modal
                    };
                });
            }
        });
    }

    buyIngredient(ingredientKey, quantity) {
        const result = this.engine.purchaseIngredient(ingredientKey, quantity, 'METRO');

        if (result.success) {
            this.showNotification({
                icon: '✅',
                title: 'Purchased!',
                message: result.message,
                type: 'success'
            });
        } else {
            this.showNotification({
                icon: '❌',
                title: 'Cannot Purchase',
                message: result.message,
                type: 'error'
            });
        }

        this.updateHUD();
    }

    showBakingModal() {
        const recipes = GAME_CONFIG.RECIPES;

        let recipeCards = Object.entries(recipes).map(([key, recipe]) => {
            const { canBake, missing } = this.engine.canBakeRecipe(key);
            const cost = this.engine.calculateProductCost(key);
            const profit = recipe.retailPrice - cost;

            return `
                <div class="item-card ${canBake ? '' : 'unavailable'}" data-recipe="${key}">
                    <div class="item-icon">${recipe.icon}</div>
                    <div class="item-name">${recipe.name}</div>
                    <div class="item-price">+$${profit.toFixed(2)}</div>
                    <div class="item-stock">${canBake ? `⏱️ ${recipe.bakeTime}min` : '❌ Missing items'}</div>
                </div>
            `;
        }).join('');

        // Show oven status
        const baking = this.engine.productionQueue.filter(p => p.status === 'baking');
        let ovenStatus = baking.length > 0
            ? baking.map(b => `${b.recipeIcon} ${Math.ceil((b.totalTime - b.progress) / 1000)}s`).join(' | ')
            : 'Oven is empty';

        this.showModal({
            title: '🔥 Bake Products',
            content: `
                <p style="margin-bottom: 10px;">Oven: ${ovenStatus}</p>
                <div class="item-grid">${recipeCards}</div>
            `,
            buttons: [
                { text: 'Close', action: 'close', style: 'secondary' }
            ],
            onShow: (modal) => {
                modal.querySelectorAll('.item-card:not(.unavailable)').forEach(card => {
                    card.onclick = () => {
                        const recipeKey = card.dataset.recipe;
                        this.startBaking(recipeKey);
                        this.showBakingModal(); // Refresh modal
                    };
                });
            }
        });
    }

    startBaking(recipeKey) {
        const result = this.engine.startBaking(recipeKey, 1);

        if (result.success) {
            this.showNotification({
                icon: '🔥',
                title: 'Baking Started!',
                message: result.message,
                type: 'success'
            });
        } else {
            this.showNotification({
                icon: '❌',
                title: 'Cannot Bake',
                message: result.message,
                type: 'error'
            });
        }

        this.updateHUD();
    }

    showSellingModal() {
        const products = this.engine.products;
        const recipes = GAME_CONFIG.RECIPES;

        // Get waiting customer
        const customer = this.scene ? this.scene.getWaitingCustomer() : null;

        let productCards = Object.entries(recipes).map(([key, recipe]) => {
            const stock = this.engine.getProductStock(key);
            const quality = this.engine.getProductQuality(key);

            return `
                <div class="item-card ${stock > 0 ? '' : 'unavailable'}" data-product="${key}">
                    <div class="item-icon">${recipe.icon}</div>
                    <div class="item-name">${recipe.name}</div>
                    <div class="item-price">$${recipe.retailPrice.toFixed(2)}</div>
                    <div class="item-stock">${stock}x available</div>
                </div>
            `;
        }).join('');

        let customerInfo = customer
            ? `<p style="margin-bottom: 15px;">👤 Customer waiting! Sell something to serve them.</p>`
            : `<p style="margin-bottom: 15px;">No customers waiting right now.</p>`;

        this.showModal({
            title: '🛒 Display Case',
            content: `
                ${customerInfo}
                <div class="item-grid">${productCards}</div>
                <p style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.6);">
                    Today's Revenue: $${this.engine.dailyStats.revenue.toFixed(2)} | 
                    Customers Served: ${this.engine.dailyStats.customersServed}
                </p>
            `,
            buttons: [
                { text: 'Close', action: 'close', style: 'secondary' }
            ],
            onShow: (modal) => {
                modal.querySelectorAll('.item-card:not(.unavailable)').forEach(card => {
                    card.onclick = () => {
                        const productKey = card.dataset.product;
                        this.processSale(productKey);
                        this.showSellingModal(); // Refresh modal
                    };
                });
            }
        });
    }

    processSale(productKey) {
        const result = this.engine.processSale(productKey, 1);

        if (result.success) {
            // Serve the waiting customer in the scene
            if (this.scene) {
                this.scene.serveCustomer();
            }

            this.showNotification({
                icon: '💰',
                title: 'Sale!',
                message: `+$${result.revenue.toFixed(2)}`,
                type: 'success'
            });
        } else {
            this.showNotification({
                icon: '❌',
                title: 'Cannot Sell',
                message: result.message,
                type: 'error'
            });
        }

        this.updateHUD();
    }

    showDiscardModal() {
        const ingredients = GAME_CONFIG.INGREDIENTS;

        let spoiledItems = [];
        Object.entries(this.engine.ingredients).forEach(([key, inv]) => {
            const quality = this.engine.getIngredientQuality(key);
            const stock = this.engine.getIngredientStock(key);
            if (stock > 0 && quality < 40) {
                spoiledItems.push({
                    key,
                    name: ingredients[key].name,
                    icon: ingredients[key].icon,
                    stock,
                    quality
                });
            }
        });

        let content = spoiledItems.length > 0
            ? `
                <p style="margin-bottom: 15px;">These items are getting stale or spoiled:</p>
                <div class="item-grid">
                    ${spoiledItems.map(item => `
                        <div class="item-card" data-ingredient="${item.key}">
                            <div class="item-icon">${item.icon}</div>
                            <div class="item-name">${item.name}</div>
                            <div class="item-stock">${item.stock.toFixed(1)} units</div>
                            <div style="color: #E74C3C; font-size: 11px;">${item.quality.toFixed(0)}% quality</div>
                        </div>
                    `).join('')}
                </div>
            `
            : `<p>No spoiled items to discard! 🎉</p>`;

        this.showModal({
            title: '🗑️ Waste Bin',
            content: content,
            buttons: [
                { text: 'Close', action: 'close', style: 'secondary' }
            ]
        });
    }

    // ==================== END OF DAY ====================
    endDay() {
        if (this.scene) {
            this.scene.stopCustomerSpawning();
            this.scene.clearCustomers();
        }

        const summary = this.engine.endDay();

        this.showModal({
            title: `📊 Day ${summary.day} Summary`,
            content: `
                <div style="text-align: center;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
                        <div style="padding: 15px; background: rgba(46,204,113,0.2); border-radius: 10px;">
                            <div style="font-size: 12px; opacity: 0.7;">Revenue</div>
                            <div style="font-size: 24px; color: #2ECC71;">$${summary.revenue.toFixed(2)}</div>
                        </div>
                        <div style="padding: 15px; background: rgba(231,76,60,0.2); border-radius: 10px;">
                            <div style="font-size: 12px; opacity: 0.7;">Expenses</div>
                            <div style="font-size: 24px; color: #E74C3C;">-$${summary.expenses.toFixed(2)}</div>
                        </div>
                        <div style="padding: 15px; background: rgba(255,215,0,0.2); border-radius: 10px;">
                            <div style="font-size: 12px; opacity: 0.7;">Net Profit</div>
                            <div style="font-size: 24px; color: ${summary.netProfit >= 0 ? '#2ECC71' : '#E74C3C'};">
                                $${summary.netProfit.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    <p>Customers Served: ${summary.customersServed} | Missed: ${summary.customersMissed}</p>
                    <p style="margin-top: 10px;">Cash Balance: <strong>$${summary.cashEnd.toFixed(2)}</strong></p>
                </div>
            `,
            buttons: [
                {
                    text: '☀️ Start Next Day', action: () => {
                        this.closeModal();
                        this.engine.hour = GAME_CONFIG.TIME.OPENING_HOUR;
                        this.engine.minute = 0;
                        this.engine.isPaused = false;
                        if (this.scene) {
                            this.scene.startCustomerSpawning(6000);
                        }
                    }, style: 'primary'
                }
            ]
        });

        // Save game
        localStorage.setItem('bakery_save', JSON.stringify(this.engine.save()));

        // Check bankruptcy
        if (summary.cashEnd < 0) {
            setTimeout(() => {
                this.showModal({
                    title: '💸 Bankruptcy!',
                    content: '<p>You have run out of money. Game Over!</p>',
                    buttons: [
                        {
                            text: 'Try Again', action: () => {
                                this.closeModal();
                                this.startNewGame();
                            }, style: 'danger'
                        }
                    ]
                });
            }, 500);
        }
    }

    // ==================== UI HELPERS ====================
    showModal(options) {
        this.closeModal();

        const overlay = document.createElement('div');
        overlay.className = 'game-modal-overlay';
        overlay.id = 'active-modal';

        const modal = document.createElement('div');
        modal.className = 'game-modal';

        let buttonsHtml = options.buttons ? `
            <div class="modal-buttons">
                ${options.buttons.map((btn, i) => `
                    <button class="modal-btn ${btn.style || 'primary'}" data-action="${i}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        ` : '';

        modal.innerHTML = `
            <div class="modal-title">${options.title}</div>
            <div class="modal-content">${options.content}</div>
            ${buttonsHtml}
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Animate in
        gsap.fromTo(modal,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out' }
        );

        // Button handlers
        if (options.buttons) {
            modal.querySelectorAll('.modal-btn').forEach((btn, i) => {
                btn.onclick = () => {
                    const action = options.buttons[i].action;
                    if (action === 'close') {
                        this.closeModal();
                    } else if (typeof action === 'function') {
                        action();
                    }
                };
            });
        }

        // Click outside to close
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        };

        // Callback
        if (options.onShow) {
            options.onShow(modal);
        }

        this.activeModal = overlay;

        // Pause game while modal is open
        if (this.scene && !this.engine.isPaused) {
            this.scene.scene.pause();
        }
    }

    closeModal() {
        const modal = document.getElementById('active-modal');
        if (modal) {
            modal.remove();
        }
        this.activeModal = null;

        // Resume game
        if (this.scene && this.isGameRunning) {
            this.scene.scene.resume();
        }
    }

    showNotification(options) {
        // Remove existing notifications
        document.querySelectorAll('.notification-toast').forEach(n => n.remove());

        const toast = document.createElement('div');
        toast.className = `notification-toast ${options.type || 'success'}`;
        toast.innerHTML = `
            <span style="font-size: 24px;">${options.icon}</span>
            <div>
                <div style="font-weight: 600;">${options.title}</div>
                <div style="font-size: 12px; opacity: 0.8;">${options.message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            gsap.to(toast, {
                x: 100,
                opacity: 0,
                duration: 0.3,
                onComplete: () => toast.remove()
            });
        }, 2500);
    }
}

// Export and auto-start
window.InteractiveGameController = InteractiveGameController;
