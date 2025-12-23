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
        
        // Load bakery background image
        this.load.svg('bakery_background', 'assets/images/bakery_interior.svg', { width: 1024, height: 768 });
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
        
        // Create controls help text
        this.createControlsHelp();
        
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
     * Create controls help overlay
     */
    createControlsHelp() {
        const helpText = this.add.text(20, this.scale.height - 80, 
            'Controls: WASD/Arrows=Move | E=Interact | TAB=Stats | F=Fullscreen', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        helpText.setDepth(600);
        helpText.setScrollFactor(0);
        helpText.setAlpha(0.7);
        
        // Fade out after 10 seconds
        this.time.delayedCall(10000, () => {
            this.tweens.add({
                targets: helpText,
                alpha: 0,
                duration: 1000,
                onComplete: () => helpText.destroy()
            });
        });
    }
    
    /**
     * Create player character with movement
     */
    createPlayer() {
        // Create player sprite with physics (centered on screen)
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        this.player = this.physics.add.sprite(centerX, centerY, 'baker_down');
        this.player.setDepth(10);
        this.player.currentDirection = 'down';
        this.player.speed = 250;
        this.player.isMoving = false;
        
        // Configure physics body
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(48, 64);
        this.player.body.setOffset(8, 8);
        
        // Setup camera to follow player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        
        // Add smooth camera effects
        this.cameras.main.setRoundPixels(true);
        
        // Update world bounds for physics
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
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
        
        // Stats menu toggle (Tab key)
        this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        
        // Fullscreen toggle (F key)
        this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        
        // Create in-game stats panel
        this.createStatsPanel();
    }
    
    /**
     * Create in-game stats panel
     */
    createStatsPanel() {
        this.statsPanel = this.add.container(0, 0);
        this.statsPanel.setDepth(500);
        this.statsPanel.setScrollFactor(0);
        
        // Semi-transparent background
        const panelBg = this.add.rectangle(0, 0, 400, 600, 0x000000, 0.9);
        panelBg.setOrigin(0, 0);
        this.statsPanel.add(panelBg);
        
        // Border
        const border = this.add.graphics();
        border.lineStyle(3, 0x7c3aed);
        border.strokeRect(0, 0, 400, 600);
        this.statsPanel.add(border);
        
        // Title
        const title = this.add.text(200, 30, 'BUSINESS STATS', {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#7c3aed',
            align: 'center'
        }).setOrigin(0.5);
        this.statsPanel.add(title);
        
        // Stats text area
        this.statsText = this.add.text(20, 80, '', {
            fontSize: '16px',
            color: '#ffffff',
            lineSpacing: 8
        });
        this.statsPanel.add(this.statsText);
        
        // Close instruction
        const closeText = this.add.text(200, 560, 'Press TAB to close', {
            fontSize: '14px',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);
        this.statsPanel.add(closeText);
        
        // Position panel (right side of screen)
        this.statsPanel.setPosition(this.scale.width - 420, 20);
        this.statsPanel.setVisible(false);
        
        // Handle screen resize
        this.scale.on('resize', (gameSize) => {
            this.statsPanel.setPosition(gameSize.width - 420, 20);
        });
    }
    
    /**
     * Update stats panel content
     */
    updateStatsPanel() {
        if (!this.statsText) return;
        
        const snapshot = this.ledger.getFinancialSnapshot();
        const products = this.costing.getProductInventory();
        const ingredients = this.costing.getIngredientInventory();
        
        let statsContent = `📊 FINANCIAL OVERVIEW\n`;
        statsContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        statsContent += `💰 Cash on Hand: $${snapshot.cashOnHand.toFixed(2)}\n`;
        statsContent += `📦 Inventory Value: $${snapshot.inventoryValue.toFixed(2)}\n`;
        statsContent += `💎 Net Worth: $${snapshot.netWorth.toFixed(2)}\n`;
        statsContent += `\n`;
        statsContent += `📈 PERFORMANCE METRICS\n`;
        statsContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        statsContent += `📊 Gross Margin: ${snapshot.grossMargin.toFixed(1)}%\n`;
        statsContent += `🔄 Inventory Turnover: ${snapshot.inventoryTurnover.toFixed(2)}x\n`;
        statsContent += `💸 Total Revenue: $${snapshot.totalRevenue.toFixed(2)}\n`;
        statsContent += `🧾 Total COGS: $${snapshot.totalCOGS.toFixed(2)}\n`;
        statsContent += `🗑️ Shrinkage: $${snapshot.totalShrinkage.toFixed(2)}\n`;
        statsContent += `\n`;
        statsContent += `📦 INVENTORY STATUS\n`;
        statsContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        statsContent += `🍞 Products: ${products.length} types\n`;
        products.slice(0, 3).forEach(p => {
            statsContent += `  • ${p.type}: ${p.quantity} units\n`;
        });
        if (products.length > 3) {
            statsContent += `  ... and ${products.length - 3} more\n`;
        }
        statsContent += `\n`;
        statsContent += `🌾 Ingredients: ${ingredients.length} types\n`;
        statsContent += `\n`;
        statsContent += `⏰ TIME\n`;
        statsContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        statsContent += `${this.gameState.getTimeString()}\n`;
        
        this.statsText.setText(statsContent);
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
        
        // Toggle stats panel with TAB
        if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
            const isVisible = this.statsPanel.visible;
            this.statsPanel.setVisible(!isVisible);
            if (!isVisible) {
                this.updateStatsPanel();
            }
        }
        
        // Toggle fullscreen with F
        if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            } else {
                this.scale.startFullscreen();
            }
        }
        
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
     * Create bakery floor background with interactive elements
     */
    createBackground() {
        // Create layered background with Phaser graphics
        this.createFloorAndWalls();
        this.createWindows();
        this.createLighting();
        this.createEquipment();
        this.createFurniture();
        this.createAmbientEffects();
    }
    
    /**
     * Create floor and wall graphics
     */
    createFloorAndWalls() {
        const graphics = this.add.graphics();
        const width = this.scale.width;
        const height = this.scale.height;
        const wallHeight = Math.min(height * 0.35, 300);
        
        // Checkered floor tiles
        for (let y = wallHeight; y < height; y += 40) {
            for (let x = 0; x < width; x += 40) {
                const isEven = ((x / 40) + (y / 40)) % 2 === 0;
                graphics.fillStyle(isEven ? 0xe8dcc8 : 0xdfd3bf);
                graphics.fillRect(x, y, 40, 40);
                graphics.lineStyle(1, 0xc9b89a);
                graphics.strokeRect(x, y, 40, 40);
            }
        }
        
        // Brick wall pattern
        for (let y = 0; y < wallHeight; y += 30) {
            for (let x = 0; x < width; x += 60) {
                const offsetX = (y / 30) % 2 === 0 ? 0 : -30;
                graphics.fillStyle(0xb8856d);
                graphics.fillRect(x + offsetX, y, 60, 30);
                graphics.lineStyle(2, 0x8b5a3c);
                graphics.strokeRect(x + offsetX, y, 60, 30);
            }
        }
        
        // Ceiling trim
        graphics.fillStyle(0x4a4a4a);
        graphics.fillRect(0, 0, width, 20);
        graphics.fillStyle(0x6d5637);
        graphics.fillRect(0, 20, width, 10);
        
        // Baseboards
        graphics.fillStyle(0x4a3428);
        graphics.fillRect(0, height - 23, width, 23);
        
        graphics.setDepth(0);
    }
    
    /**
     * Create interactive windows with lighting
     */
    createWindows() {
        // Left window
        this.createWindow(50, 40, 280, 200);
        
        // Right window
        this.createWindow(694, 40, 280, 200);
    }
    
    createWindow(x, y, width, height) {
        const graphics = this.add.graphics();
        
        // Sky/outside
        graphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xb0d4f1, 0xb0d4f1, 0.6);
        graphics.fillRect(x, y, width, height);
        
        // Sun rays effect
        const rays = this.add.graphics();
        rays.fillGradientStyle(0xfffacd, 0xfffacd, 0xfffacd, 0xfffacd, 0, 0.2, 0, 0.1);
        rays.fillRect(x, y, width, height);
        rays.setDepth(1);
        
        // Window frame
        graphics.lineStyle(8, 0x4a4a4a);
        graphics.strokeRect(x, y, width, height);
        
        // Cross dividers
        graphics.lineStyle(6, 0x4a4a4a);
        graphics.lineBetween(x + width / 2, y, x + width / 2, y + height);
        graphics.lineBetween(x, y + height / 2, x + width, y + height / 2);
        
        // Window sill
        graphics.fillStyle(0x6d5637);
        graphics.fillRect(x - 10, y + height, width + 20, 15);
        graphics.fillStyle(0x8b6f47);
        graphics.fillRect(x - 10, y + height + 15, width + 20, 5);
        
        graphics.setDepth(1);
        
        // Animated light particles through window
        this.time.addEvent({
            delay: 3000,
            callback: () => this.createDustParticle(x + Math.random() * width, y + height - 20),
            loop: true
        });
    }
    
    /**
     * Create ceiling lights with glow
     */
    createLighting() {
        this.createCeilingLight(256, 55);
        this.createCeilingLight(768, 55);
        
        // Pendant lamp over display
        this.createPendantLamp(512, 320);
    }
    
    createCeilingLight(x, y) {
        // Light glow
        const glow = this.add.circle(x, y, 50, 0xfffacd, 0.2);
        glow.setDepth(5);
        
        // Pulsing animation
        this.tweens.add({
            targets: glow,
            alpha: 0.3,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Light fixture
        const graphics = this.add.graphics();
        graphics.fillStyle(0x2a2a2a);
        graphics.fillEllipse(x, 15, 30, 8);
        graphics.fillRect(x - 10, 15, 20, 40);
        
        graphics.fillStyle(0xfffacd);
        graphics.fillCircle(x, y, 25);
        
        graphics.lineStyle(2, 0xd4af37);
        graphics.strokeCircle(x, y, 25);
        graphics.setDepth(5);
    }
    
    createPendantLamp(x, y) {
        const graphics = this.add.graphics();
        
        // Cord
        graphics.lineStyle(2, 0x2a2a2a);
        graphics.lineBetween(x, 30, x, y - 30);
        
        // Lampshade
        graphics.fillStyle(0xc41e3a);
        graphics.beginPath();
        graphics.moveTo(x - 30, y - 30);
        graphics.lineTo(x - 40, y);
        graphics.lineTo(x + 40, y);
        graphics.lineTo(x + 30, y - 30);
        graphics.closePath();
        graphics.fillPath();
        
        // Light cone
        const lightCone = this.add.graphics();
        lightCone.fillGradientStyle(0xfffacd, 0xfffacd, 0xfffacd, 0xfffacd, 0.3, 0.3, 0, 0);
        lightCone.fillTriangle(x, y, x - 100, y + 200, x + 100, y + 200);
        lightCone.setDepth(2);
        
        // Subtle swing animation
        this.tweens.add({
            targets: [graphics, lightCone],
            angle: 2,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        graphics.setDepth(5);
    }
    
    /**
     * Create interactive equipment
     */
    createEquipment() {
        // Industrial oven (animated)
        this.createOven(60, 280);
        
        // Stand mixer
        this.createMixer(120, 460);
    }
    
    createOven(x, y) {
        const graphics = this.add.graphics();
        
        // Oven body with metallic gradient
        graphics.fillGradientStyle(0xc0c0c0, 0xe8e8e8, 0xc0c0c0, 0xa8a8a8);
        graphics.fillRect(x, y, 200, 180);
        
        graphics.fillStyle(0xd0d0d0);
        graphics.fillRect(x + 5, y + 5, 190, 170);
        
        // Door window (dark)
        graphics.fillStyle(0x1a1a1a);
        graphics.fillRect(x + 20, y + 20, 80, 100);
        
        // Heat shimmer effect inside oven
        const shimmer = this.add.rectangle(x + 60, y + 70, 80, 100, 0xff4500, 0.1);
        shimmer.setDepth(3);
        this.tweens.add({
            targets: shimmer,
            alpha: 0.2,
            scaleX: 1.02,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Door handle
        graphics.fillStyle(0x4a4a4a);
        graphics.fillRoundedRect(x + 105, y + 60, 30, 8, 4);
        
        // Control panel
        graphics.fillStyle(0x3a3a3a);
        graphics.fillRect(x + 110, y + 20, 75, 140);
        
        // Dials
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const cx = x + 135 + (j * 25);
                const cy = y + 50 + (i * 30);
                graphics.fillStyle(0x4a4a4a);
                graphics.fillCircle(cx, cy, 12);
                graphics.lineStyle(2, 0x2a2a2a);
                graphics.strokeCircle(cx, cy, 12);
            }
        }
        
        // Digital display
        graphics.fillStyle(0x000000);
        graphics.fillRoundedRect(x + 120, y + 105, 55, 25, 2);
        
        const displayText = this.add.text(x + 147, y + 117, '350°F', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#00ff00'
        }).setOrigin(0.5);
        displayText.setDepth(4);
        
        // Blinking display
        this.tweens.add({
            targets: displayText,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        // Indicator lights (animated)
        const redLight = this.add.circle(x + 130, y + 140, 4, 0xff0000, 0.8);
        const greenLight = this.add.circle(x + 147, y + 140, 4, 0x00ff00, 0.8);
        const orangeLight = this.add.circle(x + 164, y + 140, 4, 0xffaa00, 0.6);
        
        [redLight, greenLight, orangeLight].forEach(light => light.setDepth(4));
        
        // Pulsing lights
        this.tweens.add({
            targets: greenLight,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        graphics.setDepth(3);
    }
    
    createMixer(x, y) {
        const graphics = this.add.graphics();
        
        // Base
        graphics.fillStyle(0x2a2a2a);
        graphics.fillEllipse(x, y + 45, 35, 8);
        graphics.fillStyle(0xc41e3a);
        graphics.fillRoundedRect(x - 35, y + 30, 70, 15, 3);
        
        // Body
        graphics.fillStyle(0xc41e3a);
        graphics.fillRect(x - 15, y + 5, 30, 25);
        graphics.fillEllipse(x, y + 5, 15, 5);
        
        // Bowl
        graphics.fillGradientStyle(0xe0e0e0, 0xe0e0e0, 0xc0c0c0, 0xc0c0c0);
        graphics.fillEllipse(x, y + 35, 25, 6);
        graphics.beginPath();
        graphics.arc(x, y + 35, 25, 0, Math.PI, false);
        graphics.lineTo(x, y + 55);
        graphics.arc(x, y + 55, 15, Math.PI, 0, true);
        graphics.closePath();
        graphics.fillPath();
        
        graphics.setDepth(3);
        
        // Rotating animation hint
        const beater = this.add.graphics();
        beater.lineStyle(2, 0x888888);
        beater.lineBetween(x - 5, y + 30, x - 5, y + 45);
        beater.lineBetween(x + 5, y + 30, x + 5, y + 45);
        beater.setDepth(4);
        
        this.tweens.add({
            targets: beater,
            angle: 360,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });
    }
    
    /**
     * Create furniture elements
     */
    createFurniture() {
        // Menu board
        this.createMenuBoard(380, 60);
        
        // Work counter (left)
        this.createCounter(60, 500, 250);
        
        // Work table (right)
        this.createWorkTable(720, 500, 260);
    }
    
    createMenuBoard(x, y) {
        const graphics = this.add.graphics();
        
        // Frame
        graphics.lineStyle(8, 0x6d5637);
        graphics.strokeRect(x, y, 260, 180);
        
        // Chalkboard
        graphics.fillStyle(0x1a1a1a);
        graphics.fillRect(x + 5, y + 5, 250, 170);
        
        graphics.setDepth(2);
        
        // Make it interactive
        const board = this.add.rectangle(x + 130, y + 90, 260, 180, 0x000000, 0);
        board.setInteractive({ useHandCursor: true });
        board.on('pointerover', () => {
            this.add.text(x + 130, y + 90, 'MENU', {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(10).setAlpha(0).setScale(0.8)
            .setData('isTemporary', true);
            
            this.tweens.add({
                targets: board.scene.children.list.filter(c => c.getData('isTemporary')),
                alpha: 1,
                scale: 1,
                duration: 200
            });
        });
        
        board.on('pointerout', () => {
            const temp = board.scene.children.list.filter(c => c.getData('isTemporary'));
            this.tweens.add({
                targets: temp,
                alpha: 0,
                duration: 200,
                onComplete: () => temp.forEach(t => t.destroy())
            });
        });
        
        board.setDepth(2);
    }
    
    createCounter(x, y, width) {
        const graphics = this.add.graphics();
        
        // Counter top (metallic)
        graphics.fillGradientStyle(0xc0c0c0, 0xe8e8e8, 0xa8a8a8, 0xc0c0c0);
        graphics.fillRect(x, y, width, 30);
        graphics.fillStyle(0xa0a0a0);
        graphics.fillRect(x, y + 30, width, 5);
        
        // Wood cabinet
        graphics.fillStyle(0x8b6f47);
        graphics.fillRect(x, y + 35, width, 180);
        
        // Drawer handles
        for (let i = 0; i < 3; i++) {
            const handleY = y + 80 + (i * 50);
            graphics.fillStyle(0x4a4a4a);
            graphics.fillRoundedRect(x + width / 2 - 35, handleY, 70, 4, 2);
        }
        
        // Door lines
        graphics.lineStyle(2, 0x6d5637);
        graphics.lineBetween(x + width / 3, y + 40, x + width / 3, y + 215);
        graphics.lineBetween(x + (2 * width / 3), y + 40, x + (2 * width / 3), y + 215);
        
        graphics.setDepth(3);
    }
    
    createWorkTable(x, y, width) {
        const graphics = this.add.graphics();
        
        // Table top
        graphics.fillGradientStyle(0xc0c0c0, 0xe8e8e8, 0xa8a8a8, 0xc0c0c0);
        graphics.fillRect(x, y, width, 25);
        graphics.fillStyle(0xa0a0a0);
        graphics.fillRect(x, y + 25, width, 5);
        
        // Legs
        graphics.fillStyle(0x6d5637);
        graphics.fillRect(x + 10, y + 30, 20, 185);
        graphics.fillRect(x + width - 30, y + 30, 20, 185);
        
        // Lower shelf
        graphics.fillStyle(0x8b6f47);
        graphics.fillRect(x + 10, y + 180, width - 20, 15);
        
        graphics.setDepth(3);
    }
    
    /**
     * Create ambient effects
     */
    createAmbientEffects() {
        // Dust particles floating in light
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                const x = 100 + Math.random() * 824;
                const y = 50 + Math.random() * 200;
                this.createDustParticle(x, y);
            },
            loop: true
        });
        
        // Steam from oven occasionally
        this.time.addEvent({
            delay: 5000,
            callback: () => this.createSteamPuff(160, 280),
            loop: true
        });
    }
    
    createDustParticle(x, y) {
        const particle = this.add.circle(x, y, 1.5, 0xffffff, 0.3);
        particle.setDepth(6);
        
        this.tweens.add({
            targets: particle,
            y: y + 100 + Math.random() * 100,
            x: x + (Math.random() - 0.5) * 50,
            alpha: 0,
            duration: 3000 + Math.random() * 2000,
            ease: 'Sine.easeInOut',
            onComplete: () => particle.destroy()
        });
    }
    
    createSteamPuff(x, y) {
        for (let i = 0; i < 5; i++) {
            const steam = this.add.circle(x + Math.random() * 40, y, 8, 0xffffff, 0.4);
            steam.setDepth(4);
            
            this.tweens.add({
                targets: steam,
                y: y - 50 - Math.random() * 50,
                x: steam.x + (Math.random() - 0.5) * 30,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 1500 + Math.random() * 1000,
                delay: i * 100,
                ease: 'Cubic.easeOut',
                onComplete: () => steam.destroy()
            });
        }
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
