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
        
        // Initialize UI screens (hidden by default)
        this.createMenuScreen();
        this.createPurchasingScreen();
        this.createProductionScreen();
        this.createSalesFloorScreen();
        this.createDaySummaryScreen();
        
        // Set up state change listener
        this.gameState.onStateChange((newState, oldState) => {
            this.handleStateChange(newState, oldState);
        });
        
        // Show initial screen
        this.showMenuScreen();
        
        // Check for tutorial
        if (this.tutorial && this.tutorial.shouldShowOnLaunch()) {
            this.showTutorialModal();
        }
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
                break;
            case this.gameState.STATES.PURCHASING:
                this.showPurchasingScreen();
                break;
            case this.gameState.STATES.PRODUCTION:
                this.showProductionScreen();
                break;
            case this.gameState.STATES.SALES_FLOOR:
                this.showSalesFloorScreen();
                break;
            case this.gameState.STATES.DAY_SUMMARY:
                this.showDaySummaryScreen();
                break;
        }
        
        this.updatePhaseIndicator(newState);
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
        console.log('Storage room clicked');
    }
    
    showWasteDetails() {
        console.log('Waste bin clicked');
    }
    
    showDisplayCaseContents() {
        console.log('Display case clicked');
    }
    
    openProductionMenu() {
        this.gameState.setState(this.gameState.STATES.PRODUCTION);
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
