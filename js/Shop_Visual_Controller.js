/**
 * Shop_Visual_Controller.js
 * 
 * Phaser 3 scene managing all visual elements and UI screens.
 * Handles menu, purchasing, production, sales floor, and day summary phases.
 */

class ShopVisualController extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }
    
    preload() {
        // Load all product sprites
        this.load.svg('product_bread_basic', 'assets/images/products/bread_basic.svg', { width: 64, height: 64 });
        this.load.svg('product_bread_sourdough', 'assets/images/products/bread_sourdough.svg', { width: 64, height: 64 });
        this.load.svg('product_baguette', 'assets/images/products/baguette.svg', { width: 64, height: 64 });
        this.load.svg('product_croissant', 'assets/images/products/croissant.svg', { width: 64, height: 64 });
        this.load.svg('product_pain_au_chocolat', 'assets/images/products/pain_au_chocolat.svg', { width: 64, height: 64 });
        this.load.svg('product_muffin', 'assets/images/products/muffin.svg', { width: 64, height: 64 });
        this.load.svg('product_cookie_chocolate', 'assets/images/products/cookie_chocolate.svg', { width: 64, height: 64 });
        this.load.svg('product_cookie_sugar', 'assets/images/products/cookie_sugar.svg', { width: 64, height: 64 });
        this.load.svg('product_cake_layer', 'assets/images/products/cake_layer.svg', { width: 64, height: 64 });
        this.load.svg('product_cupcake', 'assets/images/products/cupcake.svg', { width: 64, height: 64 });
        
        // Load all ingredient sprites
        this.load.svg('ingredient_flour', 'assets/images/ingredients/flour.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_butter', 'assets/images/ingredients/butter.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_eggs', 'assets/images/ingredients/eggs.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_sugar', 'assets/images/ingredients/sugar.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_yeast', 'assets/images/ingredients/yeast.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_chocolate', 'assets/images/ingredients/chocolate.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_milk', 'assets/images/ingredients/milk.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_cream', 'assets/images/ingredients/cream.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_bread_flour', 'assets/images/ingredients/bread_flour.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_brown_sugar', 'assets/images/ingredients/brown_sugar.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_baking_powder', 'assets/images/ingredients/baking_powder.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_salt', 'assets/images/ingredients/salt.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_vanilla', 'assets/images/ingredients/vanilla.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_cocoa', 'assets/images/ingredients/cocoa.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_honey', 'assets/images/ingredients/honey.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_bread_bag', 'assets/images/ingredients/bread_bag.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_box_small', 'assets/images/ingredients/box_small.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_box_medium', 'assets/images/ingredients/box_medium.svg', { width: 48, height: 48 });
        this.load.svg('ingredient_box_large', 'assets/images/ingredients/box_large.svg', { width: 48, height: 48 });
        
        // Load zone backgrounds
        this.load.svg('zone_storage', 'assets/images/zones/storage_zone.svg', { width: 200, height: 150 });
        this.load.svg('zone_waste', 'assets/images/zones/waste_bin.svg', { width: 100, height: 120 });
        this.load.svg('zone_display', 'assets/images/zones/display_case.svg', { width: 300, height: 200 });
        this.load.svg('zone_production', 'assets/images/zones/production_area.svg', { width: 250, height: 200 });
        
        // Load customer characters
        this.load.svg('customer_teen', 'assets/images/characters/customer_teen.svg', { width: 60, height: 80 });
        this.load.svg('customer_woman', 'assets/images/characters/customer_woman.svg', { width: 60, height: 80 });
        this.load.svg('customer_man', 'assets/images/characters/customer_man.svg', { width: 60, height: 80 });
        this.load.svg('customer_elder', 'assets/images/characters/customer_elder.svg', { width: 60, height: 80 });
        this.load.svg('customer_child', 'assets/images/characters/customer_child.svg', { width: 60, height: 80 });
        
        // Load main character (4 directions)
        this.load.svg('baker_down', 'assets/images/characters/baker_down.svg', { width: 64, height: 80 });
        this.load.svg('baker_up', 'assets/images/characters/baker_up.svg', { width: 64, height: 80 });
        this.load.svg('baker_left', 'assets/images/characters/baker_left.svg', { width: 64, height: 80 });
        this.load.svg('baker_right', 'assets/images/characters/baker_right.svg', { width: 64, height: 80 });
        this.load.svg('main_character', 'assets/images/main_character.svg', { width: 128, height: 128 });
    }
    
    init(data) {
        // References to game systems (from Phaser registry)
        this.gameState = this.game.registry.get('gameState');
        this.ledger = this.game.registry.get('ledger');
        this.costing = this.game.registry.get('costing');
        this.supplyChain = this.game.registry.get('supplyChain');
        this.tutorial = this.game.registry.get('tutorial');
        this.simulation = this.game.registry.get('simulation');
    }
    
    create() {
        // Initialize sprite factory
        this.spriteFactory = new GeometricSpriteFactory(this);
        
        // Create background
        this.createBackground();
        
        // Create interactive zones
        this.createInteractiveZones();
        
        // Create player character
        this.createPlayer();
        
        // Setup keyboard controls
        this.setupControls();
        
        // Interaction system
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.interactionPrompt = null;
        this.nearestZone = null;
        
        // Customer management
        this.customers = [];
        this.customerSpawnTimer = 0;
        this.floatingTexts = [];
        
        // Particles setup (for production/sales effects)
        this.particleEmitters = [];
        
        // Initialize UI screens (hidden by default)
        this.createMenuScreen();
        this.createPurchasingScreen();
        this.createProductionScreen();
        this.createSalesFloorScreen();
        this.createDaySummaryScreen();
        
        // Create interaction prompt
        this.createInteractionPrompt();
        
        // Create objectives display
        this.createObjectivesDisplay();
        
        // Set up state change listener
        this.gameState.onStateChange((newState, oldState) => {
            this.handleStateChange(newState, oldState);
        });
        
        // Set up simulation events for visual feedback
        this.setupSimulationEvents();
        
        // Show initial screen
        this.showMenuScreen();
        
        // Check for tutorial - auto-start for new games
        if (this.tutorial && this.tutorial.shouldShowOnLaunch()) {
            this.showTutorialModal();
        }
    }
    
    /**
     * Create player character with movement
     */
    createPlayer() {
        // Create player sprite with physics
        this.player = this.physics.add.sprite(512, 384, 'baker_down');
        this.player.setDepth(10);
        this.player.currentDirection = 'down';
        this.player.speed = 150;
        this.player.isMoving = false;
        
        // Configure physics body
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(48, 64);
        this.player.body.setOffset(8, 8);
        
        // Setup camera to follow player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        this.cameras.main.setBounds(0, 0, 1024, 768);
        
        // Add smooth camera effects
        this.cameras.main.setRoundPixels(true);
    }
    
    /**
     * Setup keyboard controls for movement
     */
    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
    }
    
    /**
     * Update player movement
     */
    update(time, delta) {
        if (!this.player || !this.player.body) return;
        
        let velocityX = 0;
        let velocityY = 0;
        let moving = false;
        let newDirection = this.player.currentDirection;
        
        // Check arrow keys and WASD
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -this.player.speed;
            newDirection = 'left';
            moving = true;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = this.player.speed;
            newDirection = 'right';
            moving = true;
        }
        
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -this.player.speed;
            newDirection = 'up';
            moving = true;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = this.player.speed;
            newDirection = 'down';
            moving = true;
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        // Apply velocity to physics body
        this.player.body.setVelocity(velocityX, velocityY);
        
        // Update sprite direction if changed
        if (newDirection !== this.player.currentDirection) {
            this.player.currentDirection = newDirection;
            this.player.setTexture('baker_' + newDirection);
        }
        
        this.player.isMoving = moving;
        
        // Check for nearby interactive zones
        this.checkProximityInteractions();
        
        // Handle interaction key press
        if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearestZone) {
            this.handleZoneInteraction(this.nearestZone);
        }
        
        // Update customers
        this.updateCustomers(delta);
        
        // Update floating texts
        this.updateFloatingTexts(delta);
    }
    
    /**
     * Create bakery floor background
     */
    createBackground() {
        this.background = this.spriteFactory.createFloorBackground(1024, 768);
        this.background.setDepth(0);
    }
    
    /**
     * Create interactive zones (storage, waste, display, production)
     */
    createInteractiveZones() {
        // Storage Room
        this.storageZone = this.spriteFactory.createStorageZone(50, 50);
        this.storageZone.setDepth(1);
        this.storageZone.on('pointerdown', () => this.openStorageRoom());
        
        // Waste Bin
        this.wasteBin = this.spriteFactory.createWasteBin(900, 100);
        this.wasteBin.setDepth(1);
        this.wasteBin.on('pointerdown', () => this.showWasteDetails());
        this.wasteBinValue = this.add.text(900, 150, '$0', {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ef4444'
        }).setOrigin(0.5).setDepth(2);
        
        // Display Case
        this.displayCase = this.spriteFactory.createDisplayCase(400, 600);
        this.displayCase.setDepth(1);
        this.displayCase.on('pointerdown', () => this.showDisplayCaseContents());
        
        // Production Zone
        this.productionZone = this.spriteFactory.createProductionZone(700, 400);
        this.productionZone.setDepth(1);
        this.productionZone.on('pointerdown', () => this.openProductionMenu());
        
        // Customer spawn area (for sales floor)
        this.customers = [];
    }
    
    /**
     * Create menu screen
     */
    createMenuScreen() {
        this.menuContainer = this.add.container(0, 0);
        
        const panel = this.spriteFactory.createPanel(262, 200, 500, 400);
        this.menuContainer.add(panel);
        
        const title = this.add.text(512, 250, 'BAKERY BUSINESS', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.menuContainer.add(title);
        
        const subtitle = this.add.text(512, 290, 'Financial Literacy Simulation', {
            fontSize: '16px',
            color: '#d1d5db'
        }).setOrigin(0.5);
        this.menuContainer.add(subtitle);
        
        // Buttons
        const newGameBtn = this.spriteFactory.createButton(362, 340, 300, 50, 'New Game', 0x10b981);
        newGameBtn.on('pointerdown', () => this.startNewGame());
        this.menuContainer.add(newGameBtn);
        
        const continueBtn = this.spriteFactory.createButton(362, 400, 300, 50, 'Continue', 0x3b82f6);
        continueBtn.on('pointerdown', () => this.continueGame());
        this.menuContainer.add(continueBtn);
        
        const tutorialBtn = this.spriteFactory.createButton(362, 460, 300, 50, 'Tutorial', 0x7c3aed);
        tutorialBtn.on('pointerdown', () => this.showTutorialModal());
        this.menuContainer.add(tutorialBtn);
        
        this.menuContainer.setVisible(false);
        this.menuContainer.setDepth(100);
    }
    
    /**
     * Create purchasing screen
     */
    createPurchasingScreen() {
        this.purchasingContainer = this.add.container(0, 0);
        
        const panel = this.spriteFactory.createPanel(50, 100, 924, 600);
        this.purchasingContainer.add(panel);
        
        const title = this.add.text(512, 130, 'ORDER SUPPLIES', {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.purchasingContainer.add(title);
        
        // Placeholder for ingredient list (will be populated dynamically)
        this.ingredientListText = this.add.text(80, 180, 'Loading ingredients...', {
            fontSize: '14px',
            color: '#ffffff'
        });
        this.purchasingContainer.add(this.ingredientListText);
        
        const closeBtn = this.spriteFactory.createButton(800, 630, 150, 40, 'Close', 0x6b7280);
        closeBtn.on('pointerdown', () => this.closePurchasingScreen());
        this.purchasingContainer.add(closeBtn);
        
        this.purchasingContainer.setVisible(false);
        this.purchasingContainer.setDepth(100);
    }
    
    /**
     * Create production screen
     */
    createProductionScreen() {
        this.productionContainer = this.add.container(0, 0);
        
        const panel = this.spriteFactory.createPanel(50, 100, 924, 600);
        this.productionContainer.add(panel);
        
        const title = this.add.text(512, 130, 'PRODUCTION', {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.productionContainer.add(title);
        
        // Placeholder for recipe list
        this.recipeListText = this.add.text(80, 180, 'Loading recipes...', {
            fontSize: '14px',
            color: '#ffffff'
        });
        this.productionContainer.add(this.recipeListText);
        
        const closeBtn = this.spriteFactory.createButton(800, 630, 150, 40, 'Close', 0x6b7280);
        closeBtn.on('pointerdown', () => this.closeProductionScreen());
        this.productionContainer.add(closeBtn);
        
        this.productionContainer.setVisible(false);
        this.productionContainer.setDepth(100);
    }
    
    /**
     * Create sales floor screen
     */
    createSalesFloorScreen() {
        // Sales floor uses the main background and interactive zones
        // Just needs an "Open Shop" / "Close Shop" button
        this.shopControlBtn = this.spriteFactory.createButton(412, 700, 200, 50, 'OPEN SHOP', 0x10b981);
        this.shopControlBtn.on('pointerdown', () => this.toggleShop());
        this.shopControlBtn.setDepth(10);
        this.shopControlBtn.setVisible(false);
    }
    
    /**
     * Create day summary screen
     */
    createDaySummaryScreen() {
        this.summaryContainer = this.add.container(0, 0);
        
        const panel = this.spriteFactory.createPanel(200, 150, 624, 500);
        this.summaryContainer.add(panel);
        
        const title = this.add.text(512, 190, 'DAY SUMMARY', {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.summaryContainer.add(title);
        
        this.summaryText = this.add.text(240, 240, 'Loading summary...', {
            fontSize: '16px',
            color: '#ffffff',
            lineSpacing: 10
        });
        this.summaryContainer.add(this.summaryText);
        
        const nextDayBtn = this.spriteFactory.createButton(362, 580, 300, 50, 'Next Day', 0x10b981);
        nextDayBtn.on('pointerdown', () => this.startNextDay());
        this.summaryContainer.add(nextDayBtn);
        
        this.summaryContainer.setVisible(false);
        this.summaryContainer.setDepth(100);
    }
    
    /**
     * Handle state changes
     */
    handleStateChange(newState, oldState) {
        this.hideAllScreens();
        
        switch (newState) {
            case this.gameState.STATES.MENU:
                this.showMenuScreen();
                this.updateObjectives('Welcome! Start a New Game or Continue');
                break;
            case this.gameState.STATES.PURCHASING:
                this.showPurchasingScreen();
                this.updateObjectives('📦 PURCHASING\n• Walk to Storage Zone (blue)\n• Press E to buy ingredients\n• Plan for 3-day delivery times');
                break;
            case this.gameState.STATES.PRODUCTION:
                this.showProductionScreen();
                this.updateObjectives('🍞 PRODUCTION\n• Walk to Production Zone (orange)\n• Press E to make products\n• Check ingredient availability');
                break;
            case this.gameState.STATES.SALES_FLOOR:
                this.showSalesFloorScreen();
                this.updateObjectives('💰 SALES FLOOR\n• Shop is OPEN (6 AM - 8 PM)\n• Customers buying automatically\n• Watch profits roll in!');
                break;
            case this.gameState.STATES.DAY_SUMMARY:
                this.showDaySummaryScreen();
                this.updateObjectives('📊 DAY SUMMARY\n• Review performance\n• Check KPIs\n• Plan tomorrow');
                break;
        }
        
        this.updatePhaseIndicator(newState);
    }
    
    /**
     * Update objectives display
     */
    updateObjectives(text) {
        if (this.objectivesText) {
            this.objectivesText.setText(text);
            this.objectivesText.setVisible(text.length > 0);
        }
    }
    
    /**
     * Hide all screens
     */
    hideAllScreens() {
        if (this.menuContainer) this.menuContainer.setVisible(false);
        if (this.purchasingContainer) this.purchasingContainer.setVisible(false);
        if (this.productionContainer) this.productionContainer.setVisible(false);
        if (this.summaryContainer) this.summaryContainer.setVisible(false);
        if (this.shopControlBtn) this.shopControlBtn.setVisible(false);
    }
    
    /**
     * Show menu screen
     */
    showMenuScreen() {
        this.menuContainer.setVisible(true);
    }
    
    /**
     * Show purchasing screen
     */
    showPurchasingScreen() {
        this.purchasingContainer.setVisible(true);
        this.updateIngredientList();
    }
    
    /**
     * Show production screen
     */
    showProductionScreen() {
        this.productionContainer.setVisible(true);
        this.updateRecipeList();
    }
    
    /**
     * Show sales floor screen
     */
    showSalesFloorScreen() {
        this.shopControlBtn.setVisible(true);
        this.shopControlBtn.list[1].setText('CLOSE SHOP');
    }
    
    /**
     * Show day summary screen
     */
    showDaySummaryScreen() {
        this.summaryContainer.setVisible(true);
        this.updateDaySummary();
    }
    
    /**
     * Update phase indicator in HUD
     */
    updatePhaseIndicator(state) {
        const indicator = document.getElementById('phase-indicator');
        if (indicator) {
            indicator.textContent = state.replace('_', ' ');
        }
    }
    
    /**
     * Update ingredient list in purchasing screen
     */
    updateIngredientList() {
        let text = 'Available Ingredients:\n\n';
        
        const keyIngredients = ['FLOUR_AP', 'BUTTER', 'EGGS', 'SUGAR', 'YEAST'];
        
        for (const key of keyIngredients) {
            const ing = REALISTIC_PARAMETERS.INGREDIENTS[key];
            const moq = REALISTIC_PARAMETERS.SUPPLY_CHAIN.MOQ[key] || 1;
            text += `${ing.name}: $${ing.cost}/${ing.unit} (MOQ: ${moq})\n`;
        }
        
        text += '\n[Simplified purchasing UI - Full implementation in Economic_Simulation_Core]';
        
        this.ingredientListText.setText(text);
    }
    
    /**
     * Update recipe list in production screen
     */
    updateRecipeList() {
        let text = 'Available Recipes:\n\n';
        
        const recipes = Object.keys(REALISTIC_PARAMETERS.RECIPES).slice(0, 5);
        
        for (const key of recipes) {
            const recipe = REALISTIC_PARAMETERS.RECIPES[key];
            text += `${recipe.name}: $${recipe.retailPrice} retail\n`;
        }
        
        text += '\n[Simplified production UI - Full implementation in Economic_Simulation_Core]';
        
        this.recipeListText.setText(text);
    }
    
    /**
     * Update day summary
     */
    updateDaySummary() {
        const summary = this.ledger.getDailySummary(this.gameState.currentDay);
        
        const text = `Day ${this.gameState.currentDay} Complete!\n\n` +
                    `Sales Revenue: $${summary.sales.toFixed(2)}\n` +
                    `COGS: $${summary.cogs.toFixed(2)}\n` +
                    `Gross Profit: $${summary.grossProfit.toFixed(2)}\n` +
                    `Shrinkage: $${summary.shrinkage.toFixed(2)}\n` +
                    `Net Cash Flow: $${summary.netCashFlow.toFixed(2)}\n\n` +
                    `Transactions: ${summary.transactionCount}`;
        
        this.summaryText.setText(text);
    }
    
    /**
     * Show tutorial modal
     */
    showTutorialModal() {
        const modal = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        
        if (this.tutorial && !this.tutorial.isActive) {
            content.innerHTML = this.tutorial.renderWelcomeHTML();
            modal.classList.add('active');
            
            // Attach event listeners
            setTimeout(() => {
                const startBtn = document.getElementById('tutorial-start');
                const skipBtn = document.getElementById('tutorial-skip-welcome');
                
                if (startBtn) {
                    startBtn.onclick = () => {
                        this.tutorial.start();
                        content.innerHTML = this.tutorial.renderTutorialHTML();
                        this.attachTutorialListeners();
                    };
                }
                
                if (skipBtn) {
                    skipBtn.onclick = () => {
                        this.tutorial.skip();
                        modal.classList.remove('active');
                    };
                }
            }, 100);
        } else if (this.tutorial && this.tutorial.isActive) {
            content.innerHTML = this.tutorial.renderTutorialHTML();
            modal.classList.add('active');
            this.attachTutorialListeners();
        }
    }
    
    /**
     * Attach tutorial navigation listeners
     */
    attachTutorialListeners() {
        setTimeout(() => {
            const nextBtn = document.getElementById('tutorial-next');
            const prevBtn = document.getElementById('tutorial-prev');
            const skipBtn = document.getElementById('tutorial-skip');
            const completeBtn = document.getElementById('tutorial-complete');
            
            if (nextBtn) {
                nextBtn.onclick = () => {
                    this.tutorial.nextStep();
                    document.getElementById('modal-content').innerHTML = this.tutorial.renderTutorialHTML();
                    this.attachTutorialListeners();
                };
            }
            
            if (prevBtn) {
                prevBtn.onclick = () => {
                    this.tutorial.previousStep();
                    document.getElementById('modal-content').innerHTML = this.tutorial.renderTutorialHTML();
                    this.attachTutorialListeners();
                };
            }
            
            if (skipBtn) {
                skipBtn.onclick = () => {
                    this.tutorial.skip();
                    document.getElementById('modal-overlay').classList.remove('active');
                };
            }
            
            if (completeBtn) {
                completeBtn.onclick = () => {
                    this.tutorial.complete();
                    document.getElementById('modal-overlay').classList.remove('active');
                    this.startNewGame();
                };
            }
        }, 100);
    }
    
    /**
     * Game actions
     */
    startNewGame() {
        this.gameState.resetGame();
        this.gameState.setState(this.gameState.STATES.PURCHASING);
        // Show objectives immediately
        this.updateObjectives('📦 PURCHASING\n• Walk to Storage Zone (blue)\n• Press E to buy ingredients\n• Plan for 3-day delivery times');
    }
    
    continueGame() {
        this.gameState.setState(this.gameState.STATES.PURCHASING);
    }
    
    closePurchasingScreen() {
        this.gameState.setState(this.gameState.STATES.PRODUCTION);
    }
    
    closeProductionScreen() {
        this.gameState.setState(this.gameState.STATES.SALES_FLOOR);
    }
    
    toggleShop() {
        if (this.gameState.currentState === this.gameState.STATES.SALES_FLOOR) {
            // Shop is open - this shouldn't close it (auto-closes at 8 PM)
            console.log('Shop is open - will close at 8 PM');
        }
    }
    
    startNextDay() {
        this.gameState.advanceDay();
        this.gameState.setState(this.gameState.STATES.PURCHASING);
    }
    
    openStorageRoom() {
        // Open purchasing interface
        this.gameState.setState(this.gameState.STATES.PURCHASING);
        this.spawnParticles(this.storageZone.x, this.storageZone.y, 0x3b82f6);
    }
    
    showWasteDetails() {
        // Show waste summary in floating text
        const snapshot = this.ledger.getFinancialSnapshot();
        this.showFloatingText(
            this.wasteBin.x, 
            this.wasteBin.y - 50,
            `Waste: $${snapshot.totalShrinkage.toFixed(0)}`,
            '#ef4444'
        );
    }
    
    showDisplayCaseContents() {
        // Show available products for sale
        const products = this.costing.getProductInventory();
        let text = 'Products:';
        products.forEach(p => {
            text += `\n${p.type}: ${p.quantity}`;
        });
        this.showFloatingText(
            this.displayCase.x,
            this.displayCase.y - 100,
            text || 'No products',
            '#10b981'
        );
    }
    
    openProductionMenu() {
        this.gameState.setState(this.gameState.STATES.PRODUCTION);
        this.spawnParticles(this.productionZone.x, this.productionZone.y, 0xf59e0b);
    }
    
    /**
     * Update loop
     */
    update(time, delta) {
        // Update game state time
        if (this.gameState) {
            this.gameState.update(delta / 1000);
        }
        
        // Update HUD
        this.updateHUD();
    }
    
    
    /**
     * Create interaction prompt display
     */
    createInteractionPrompt() {
        this.interactionPrompt = this.add.container(0, 0);
        this.interactionPrompt.setDepth(150);
        
        const bg = this.add.rectangle(0, 0, 120, 40, 0x000000, 0.8);
        const text = this.add.text(0, 0, 'Press E', {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.interactionPrompt.add([bg, text]);
        this.interactionPrompt.setVisible(false);
    }
    
    /**
     * Create objectives display
     */
    createObjectivesDisplay() {
        this.objectivesText = this.add.text(20, 100, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 8 }
        });
        this.objectivesText.setDepth(150);
        this.objectivesText.setVisible(false);
    }
    
    /**
     * Check for nearby interactive zones
     */
    checkProximityInteractions() {
        if (!this.player) return;
        
        const interactionDistance = 80;
        const zones = [
            { obj: this.storageZone, name: 'Storage\n(Purchase)' },
            { obj: this.productionZone, name: 'Production\n(Make Items)' },
            { obj: this.displayCase, name: 'Display Case\n(View Stock)' },
            { obj: this.wasteBin, name: 'Waste Bin\n(View Waste)' }
        ];
        
        let nearest = null;
        let minDist = Infinity;
        
        zones.forEach(zone => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                zone.obj.x, zone.obj.y
            );
            
            if (dist < interactionDistance && dist < minDist) {
                minDist = dist;
                nearest = zone;
            }
        });
        
        if (nearest) {
            this.nearestZone = nearest;
            this.interactionPrompt.setPosition(nearest.obj.x, nearest.obj.y - 100);
            this.interactionPrompt.list[1].setText(`Press E\n${nearest.name}`);
            this.interactionPrompt.setVisible(true);
        } else {
            this.nearestZone = null;
            this.interactionPrompt.setVisible(false);
        }
    }
    
    /**
     * Handle zone interaction
     */
    handleZoneInteraction(zone) {
        if (zone.obj === this.storageZone) {
            this.openStorageRoom();
        } else if (zone.obj === this.productionZone) {
            this.openProductionMenu();
        } else if (zone.obj === this.displayCase) {
            this.showDisplayCaseContents();
        } else if (zone.obj === this.wasteBin) {
            this.showWasteDetails();
        }
    }
    
    /**
     * Setup simulation events for visual feedback
     */
    setupSimulationEvents() {
        // Listen for sales to spawn customer visuals
        this.events.on('customer-purchase', (data) => {
            this.spawnCustomerVisual(data);
        });
    }
    
    /**
     * Spawn customer visual for purchase
     */
    spawnCustomerVisual(purchaseData) {
        if (this.gameState.currentState !== this.gameState.STATES.SALES_FLOOR) return;
        
        const customerSprite = this.spriteFactory.createCustomer(50, 300 + Math.random() * 200);
        customerSprite.setDepth(8);
        
        // Animate customer walking to counter
        this.tweens.add({
            targets: customerSprite,
            x: 400,
            duration: 1500,
            ease: 'Linear',
            onComplete: () => {
                // Show purchase
                this.showFloatingText(
                    customerSprite.x,
                    customerSprite.y - 30,
                    `+$${purchaseData.revenue ? purchaseData.revenue.toFixed(2) : '0.00'}`,
                    '#10b981'
                );
                this.spawnParticles(customerSprite.x, customerSprite.y, 0x10b981);
                
                // Customer leaves
                this.tweens.add({
                    targets: customerSprite,
                    x: 1074,
                    duration: 1500,
                    delay: 500,
                    ease: 'Linear',
                    onComplete: () => customerSprite.destroy()
                });
            }
        });
        
        this.customers.push(customerSprite);
    }
    
    /**
     * Update customer animations
     */
    updateCustomers(delta) {
        // Customers are handled by tweens
        this.customers = this.customers.filter(c => c.active);
    }
    
    /**
     * Show floating text
     */
    showFloatingText(x, y, message, color = '#ffffff') {
        const text = this.add.text(x, y, message, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        text.setDepth(200);
        
        this.floatingTexts.push({
            text: text,
            lifetime: 0
        });
        
        // Animate float up
        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Cubic.easeOut'
        });
    }
    
    /**
     * Update floating texts
     */
    updateFloatingTexts(delta) {
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.lifetime += delta;
            if (ft.lifetime > 2000) {
                ft.text.destroy();
                return false;
            }
            return true;
        });
    }
    
    /**
     * Spawn particle effect
     */
    spawnParticles(x, y, color = 0xffffff) {
        // Create simple particle burst
        const particles = [];
        for (let i = 0; i < 10; i++) {
            const p = this.add.circle(x, y, 4, color);
            p.setDepth(100);
            particles.push(p);
            
            const angle = (Math.PI * 2 * i) / 10;
            const speed = 50 + Math.random() * 50;
            
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 500,
                ease: 'Cubic.easeOut',
                onComplete: () => p.destroy()
            });
        }
    }
    
    /**
     * Update HUD elements
     */
    updateHUD() {
        const snapshot = this.ledger.getFinancialSnapshot();
        const timeStr = this.gameState.getTimeString();
        
        document.getElementById('hud-cash').textContent = `$${snapshot.cashOnHand.toFixed(0)}`;
        document.getElementById('hud-inventory').textContent = `$${snapshot.inventoryValue.toFixed(0)}`;
        document.getElementById('hud-margin').textContent = `${snapshot.grossMargin.toFixed(1)}%`;
        document.getElementById('hud-turnover').textContent = `${snapshot.inventoryTurnover.toFixed(1)}x`;
        document.getElementById('hud-time').textContent = timeStr;
        
        // Update waste bin value
        if (this.wasteBinValue) {
            this.wasteBinValue.setText(`$${snapshot.totalShrinkage.toFixed(0)}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShopVisualController;
}
