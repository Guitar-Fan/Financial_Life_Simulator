/**
 * main.js
 * 
 * Entry point for the Bakery Business Simulator.
 * Initializes all game systems and starts Phaser 3.
 */

// Initialize game systems
const gameState = new GameStateManager();
const ledger = new LedgerSystem();
const costing = new CostingEngine();
const supplyChain = new SupplyChainManager();
const tutorial = new TutorialManager();

// Initialize economic simulation core
let simulation = null;

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    backgroundColor: '#1f2937',
    scene: ShopVisualController,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    render: {
        pixelArt: false,
        antialias: true,
        antialiasGL: true,
        roundPixels: false
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
        parent: 'game-container',
        fullscreenTarget: 'game-container'
    },
    callbacks: {
        preBoot: function(game) {
            // Pass game systems to scene
            game.registry.set('gameState', gameState);
            game.registry.set('ledger', ledger);
            game.registry.set('costing', costing);
            game.registry.set('supplyChain', supplyChain);
            game.registry.set('tutorial', tutorial);
        }
    }
};

// Create Phaser game instance
const game = new Phaser.Game(config);

// Initialize simulation core after game is created
game.events.once('ready', () => {
    const scene = game.scene.scenes[0];
    
    simulation = new EconomicSimulationCore(gameState, ledger, costing, supplyChain);
    
    // Pass simulation to scene
    scene.simulation = simulation;
    
    // Connect simulation events to scene events
    simulation.on('customer-purchase', (data) => {
        scene.events.emit('customer-purchase', data);
    });
    
    simulation.on('production-complete', (data) => {
        scene.events.emit('production-complete', data);
    });
    
    simulation.on('shrinkage-detected', (data) => {
        scene.events.emit('shrinkage-detected', data);
    });
    
    // Set up update loop
    scene.events.on('update', (time, delta) => {
        simulation.update(delta / 1000);
    });
    
    console.log('Bakery Business Simulator initialized');
    console.log('Starting Capital: $' + REALISTIC_PARAMETERS.STARTING_CASH);
    
    // Add test inventory for demonstration (remove for production)
    // Uncomment to start with some inventory:
    // simulation.addTestInventory();
});

// Set up help button
document.getElementById('help-btn').addEventListener('click', () => {
    const scene = game.scene.scenes[0];
    if (scene && scene.showTutorialModal) {
        tutorial.start();
        scene.showTutorialModal();
    }
});

// Set up modal close on outside click
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        document.getElementById('modal-overlay').classList.remove('active');
    }
});

// Expose to window for debugging
window.GAME = {
    gameState,
    ledger,
    costing,
    supplyChain,
    tutorial,
    simulation,
    phaser: game,
    
    // Debug helpers
    addTestInventory() {
        if (simulation) {
            simulation.addTestInventory();
            console.log('Test inventory added');
        }
    },
    
    addCash(amount) {
        ledger.cashOnHand += amount;
        ledger.saveToLocalStorage();
        console.log(`Added $${amount} cash`);
    },
    
    skipToDay(day) {
        gameState.currentDay = day;
        gameState.saveToLocalStorage();
        console.log(`Skipped to day ${day}`);
    },
    
    openShop() {
        gameState.setState(gameState.STATES.SALES_FLOOR);
    },
    
    getStatus() {
        return {
            day: gameState.currentDay,
            time: gameState.getTimeString(),
            cash: ledger.cashOnHand,
            inventory: ledger.inventoryValue,
            netWorth: ledger.getNetWorth(),
            grossMargin: ledger.getGrossMargin(),
            state: gameState.currentState
        };
    },
    
    orderFlour(quantity = 100) {
        const items = [{ ingredientKey: 'FLOUR_AP', quantity }];
        const order = supplyChain.placeOrder(
            items,
            gameState.currentDay,
            gameState.currentDayOfWeek,
            ledger
        );
        if (order) {
            console.log(`Ordered ${quantity} lbs of flour - Delivery on Day ${order.estimatedDeliveryDay}`);
        }
        return order;
    },
    
    produceBread(quantity = 10) {
        const result = costing.produceProduct('BASIC_BREAD', quantity, gameState.currentDay);
        if (result) {
            ledger.inventoryValue = costing.getTotalInventoryValue();
            console.log(`Produced ${quantity} loaves of bread (COGS: $${result.unitCOGS.toFixed(2)} each)`);
        }
        return result;
    },
    
    reset() {
        gameState.resetGame();
        location.reload();
    }
};

console.log('%c🍞 Bakery Business Simulator Loaded', 'font-size: 20px; font-weight: bold; color: #7c3aed;');
console.log('%cType GAME.getStatus() to see current game state', 'color: #3b82f6;');
console.log('%cType GAME.addTestInventory() to add starter inventory', 'color: #10b981;');
console.log('%cDebug commands: addCash(amount), orderFlour(), produceBread(), openShop()', 'color: #6b7280;');
