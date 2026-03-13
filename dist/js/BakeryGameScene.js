/**
 * BakeryGameScene.js - Main Phaser game scene for the interactive bakery
 * Handles environment rendering, player movement, NPCs, and zone interactions
 */

class BakeryGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BakeryGameScene' });

        // Player reference
        this.player = null;
        this.playerController = null;

        // Interactive zones
        this.zones = {
            oven: null,
            displayCase: null,
            storage: null,
            wasteBin: null
        };

        // NPCs
        this.customers = [];
        this.maxCustomers = 5;

        // Zone proximity state
        this.currentZone = null;
        this.interactionPrompt = null;

        // Game dimensions
        this.gameWidth = 1024;
        this.gameHeight = 768;
    }

    preload() {
        // Handle loading errors gracefully
        this.load.on('loaderror', (file) => {
            console.warn('Failed to load:', file.key, '- will use fallback');
        });

        // Load bakery background
        this.load.svg('bakery_bg', 'assets/images/bakery_interior.svg', { width: 1024, height: 768 });

        // Load baker direction sprites
        this.load.svg('baker_down', 'assets/images/characters/baker_down.svg', { width: 60, height: 80 });
        this.load.svg('baker_up', 'assets/images/characters/baker_up.svg', { width: 60, height: 80 });
        this.load.svg('baker_left', 'assets/images/characters/baker_left.svg', { width: 60, height: 80 });
        this.load.svg('baker_right', 'assets/images/characters/baker_right.svg', { width: 60, height: 80 });

        // Load zone indicators
        this.load.svg('zone_oven', 'assets/images/zones/production_area.svg', { width: 80, height: 80 });
        this.load.svg('zone_display', 'assets/images/zones/display_case.svg', { width: 80, height: 80 });
        this.load.svg('zone_storage', 'assets/images/zones/storage_zone.svg', { width: 80, height: 80 });
        this.load.svg('zone_waste', 'assets/images/zones/waste_bin.svg', { width: 80, height: 80 });
    }

    // Create fallback graphics for missing assets
    createFallbackGraphics() {
        // Create simple customer placeholder graphics
        const customerColors = {
            'customer_man': 0x3498DB,
            'customer_woman': 0xE74C3C,
            'customer_child': 0x2ECC71,
            'customer_elderly': 0x9B59B6
        };

        Object.entries(customerColors).forEach(([key, color]) => {
            if (!this.textures.exists(key)) {
                const graphics = this.make.graphics({ x: 0, y: 0, add: false });

                // Create a simple 4x3 spritesheet (128x128 per frame)
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 3; col++) {
                        const x = col * 128 + 64;
                        const y = row * 128 + 64;

                        // Body
                        graphics.fillStyle(color, 1);
                        graphics.fillCircle(x, y - 20, 20);
                        graphics.fillRoundedRect(x - 15, y, 30, 40, 5);

                        // Eyes
                        graphics.fillStyle(0xFFFFFF, 1);
                        graphics.fillCircle(x - 6, y - 25, 4);
                        graphics.fillCircle(x + 6, y - 25, 4);
                        graphics.fillStyle(0x000000, 1);
                        graphics.fillCircle(x - 6, y - 25, 2);
                        graphics.fillCircle(x + 6, y - 25, 2);
                    }
                }

                graphics.generateTexture(key, 384, 512);
                graphics.destroy();
            }
        });
    }

    create() {
        // Create fallback graphics for any missing assets
        this.createFallbackGraphics();

        // Add background (with fallback if missing)
        if (this.textures.exists('bakery_bg')) {
            this.add.image(512, 384, 'bakery_bg').setDepth(0);
        } else {
            // Create a simple bakery floor pattern as fallback
            this.createFallbackBackground();
        }

        // Create collision boundaries (walls, counters, etc.)
        this.createCollisionBounds();

        // Create interactive zones
        this.createInteractiveZones();

        // Create player
        this.createPlayer();

        // Setup keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Create interaction prompt UI
        this.createInteractionPrompt();

        // Setup camera
        this.cameras.main.setBounds(0, 0, this.gameWidth, this.gameHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Create customer animations
        this.createCustomerAnimations();

        // Start customer spawning (in selling phase)
        this.customerSpawnTimer = null;

        // Emit ready event
        this.events.emit('scene-ready');
    }

    createFallbackBackground() {
        const graphics = this.add.graphics();

        // Floor tiles
        for (let x = 0; x < 1024; x += 64) {
            for (let y = 0; y < 768; y += 64) {
                const isEven = ((x / 64) + (y / 64)) % 2 === 0;
                graphics.fillStyle(isEven ? 0xD4A574 : 0xC49464, 1);
                graphics.fillRect(x, y, 64, 64);
            }
        }

        // Back wall
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(0, 0, 1024, 300);

        // Counter areas
        graphics.fillStyle(0x5D4037, 1);
        graphics.fillRect(50, 350, 200, 150); // Left counter (oven)
        graphics.fillRect(350, 480, 320, 120); // Center display case
        graphics.fillRect(750, 350, 220, 150); // Right storage

        // Labels
        const style = { fontFamily: 'Fredoka', fontSize: '14px', color: '#FFF8DC' };
        this.add.text(150, 420, '🔥 OVEN', style).setOrigin(0.5);
        this.add.text(510, 540, '🛒 DISPLAY', style).setOrigin(0.5);
        this.add.text(860, 420, '📦 STORAGE', style).setOrigin(0.5);
        this.add.text(950, 720, '🗑️ WASTE', style).setOrigin(0.5);

        graphics.setDepth(0);
    }

    createCollisionBounds() {
        // Create static physics group for collisions
        this.colliders = this.physics.add.staticGroup();

        // Back wall (top of screen)
        this.colliders.add(this.add.rectangle(512, 150, 1024, 300, 0x000000, 0));

        // Left work counter
        this.colliders.add(this.add.rectangle(185, 580, 250, 180, 0x000000, 0));

        // Industrial oven area
        this.colliders.add(this.add.rectangle(160, 370, 200, 180, 0x000000, 0));

        // Display case (center)
        this.colliders.add(this.add.rectangle(510, 540, 340, 160, 0x000000, 0));

        // Right work table
        this.colliders.add(this.add.rectangle(850, 580, 260, 180, 0x000000, 0));

        // Storage shelves (right back)
        this.colliders.add(this.add.rectangle(855, 380, 230, 200, 0x000000, 0));

        // Refresh physics bodies
        this.colliders.refresh();
    }

    createInteractiveZones() {
        // Define zone rectangles (areas player can interact with)
        // Oven zone - left side
        this.zones.oven = this.add.zone(260, 470, 120, 80);
        this.physics.add.existing(this.zones.oven, true);
        this.zones.oven.setData('type', 'oven');
        this.zones.oven.setData('label', 'Oven - Press E to Bake');
        this.zones.oven.setData('action', 'baking');

        // Display case zone - center front
        this.zones.displayCase = this.add.zone(510, 460, 200, 60);
        this.physics.add.existing(this.zones.displayCase, true);
        this.zones.displayCase.setData('type', 'display');
        this.zones.displayCase.setData('label', 'Display Case - Press E to Serve');
        this.zones.displayCase.setData('action', 'selling');

        // Storage zone - right back
        this.zones.storage = this.add.zone(720, 480, 100, 80);
        this.physics.add.existing(this.zones.storage, true);
        this.zones.storage.setData('type', 'storage');
        this.zones.storage.setData('label', 'Storage - Press E for Inventory');
        this.zones.storage.setData('action', 'buying');

        // Waste bin zone - right side
        this.zones.wasteBin = this.add.zone(950, 680, 80, 80);
        this.physics.add.existing(this.zones.wasteBin, true);
        this.zones.wasteBin.setData('type', 'waste');
        this.zones.wasteBin.setData('label', 'Waste Bin - Press E to Discard');
        this.zones.wasteBin.setData('action', 'discard');

        // Add visual indicators for zones (subtle glow)
        this.zoneIndicators = {};
        Object.entries(this.zones).forEach(([key, zone]) => {
            const indicator = this.add.circle(zone.x, zone.y, 40, 0xFFD700, 0.15);
            indicator.setDepth(1);
            this.zoneIndicators[key] = indicator;
        });
    }

    createPlayer() {
        // Create fallback baker sprites if needed
        if (!this.textures.exists('baker_down')) {
            this.createFallbackBakerSprites();
        }

        // Start player in center of walkable area
        this.player = this.physics.add.sprite(512, 650, 'baker_down');
        this.player.setScale(1.2);
        this.player.setDepth(10);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(40, 60);
        this.player.body.setOffset(10, 20);

        // Player properties
        this.player.speed = 200;
        this.player.direction = 'down';
        this.player.isMoving = false;

        // Setup collisions
        this.physics.add.collider(this.player, this.colliders);

        // Setup zone overlaps
        Object.values(this.zones).forEach(zone => {
            this.physics.add.overlap(this.player, zone, this.onZoneEnter, null, this);
        });
    }

    createFallbackBakerSprites() {
        const directions = ['down', 'up', 'left', 'right'];

        directions.forEach(dir => {
            const key = `baker_${dir}`;
            if (!this.textures.exists(key)) {
                const graphics = this.make.graphics({ x: 0, y: 0, add: false });

                // Chef body
                graphics.fillStyle(0xFFFFFF, 1); // White chef coat
                graphics.fillRoundedRect(15, 30, 30, 35, 5);

                // Chef hat
                graphics.fillStyle(0xFFFFFF, 1);
                graphics.fillRoundedRect(15, 5, 30, 20, 3);
                graphics.fillRect(20, 0, 20, 10);

                // Face
                graphics.fillStyle(0xFFDBB4, 1); // Skin tone
                graphics.fillCircle(30, 25, 12);

                // Eyes
                graphics.fillStyle(0x000000, 1);
                if (dir === 'up') {
                    // Facing away - no eyes
                } else {
                    graphics.fillCircle(26, 23, 2);
                    graphics.fillCircle(34, 23, 2);
                }

                // Legs
                graphics.fillStyle(0x4A4A4A, 1);
                graphics.fillRect(20, 65, 8, 15);
                graphics.fillRect(32, 65, 8, 15);

                // Direction indicator
                graphics.fillStyle(0xFFD700, 1);
                if (dir === 'down') graphics.fillTriangle(30, 75, 25, 65, 35, 65);
                if (dir === 'up') graphics.fillTriangle(30, 5, 25, 15, 35, 15);
                if (dir === 'left') graphics.fillTriangle(10, 40, 20, 35, 20, 45);
                if (dir === 'right') graphics.fillTriangle(50, 40, 40, 35, 40, 45);

                graphics.generateTexture(key, 60, 80);
                graphics.destroy();
            }
        });
    }

    createInteractionPrompt() {
        // Create interaction prompt container
        this.interactionPrompt = this.add.container(512, 580);
        this.interactionPrompt.setDepth(100);
        this.interactionPrompt.setVisible(false);

        // Background
        const bg = this.add.rectangle(0, 0, 280, 40, 0x2C1810, 0.9);
        bg.setStrokeStyle(2, 0xFFD700);

        // Text
        this.promptText = this.add.text(0, 0, '', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            color: '#FFF8DC',
            align: 'center'
        }).setOrigin(0.5);

        this.interactionPrompt.add([bg, this.promptText]);
    }

    createCustomerAnimations() {
        // Create walk animations for each customer type
        const customerTypes = ['customer_man', 'customer_woman', 'customer_child', 'customer_elderly'];

        customerTypes.forEach(type => {
            // Check if texture exists and has frames
            if (!this.textures.exists(type)) {
                console.warn(`Customer texture ${type} not found, skipping animations`);
                return;
            }

            // Check if already created to avoid duplicates
            if (this.anims.exists(`${type}_walk_down`)) {
                return;
            }

            try {
                // For fallback single-frame textures, create simple static animations
                const texture = this.textures.get(type);
                const frameCount = texture.frameTotal;

                if (frameCount <= 1) {
                    // Single frame fallback - just create static "animations"
                    ['walk_down', 'walk_up', 'walk_left', 'walk_right', 'idle'].forEach(anim => {
                        this.anims.create({
                            key: `${type}_${anim}`,
                            frames: [{ key: type, frame: 0 }],
                            frameRate: 1
                        });
                    });
                } else {
                    // Multi-frame spritesheet - create proper walk animations
                    // Walk down (frames 0-2)
                    this.anims.create({
                        key: `${type}_walk_down`,
                        frames: this.anims.generateFrameNumbers(type, { start: 0, end: Math.min(2, frameCount - 1) }),
                        frameRate: 8,
                        repeat: -1
                    });

                    // Walk up (frames 3-5)
                    if (frameCount > 3) {
                        this.anims.create({
                            key: `${type}_walk_up`,
                            frames: this.anims.generateFrameNumbers(type, { start: 3, end: Math.min(5, frameCount - 1) }),
                            frameRate: 8,
                            repeat: -1
                        });
                    }

                    // Walk left (frames 6-8)
                    if (frameCount > 6) {
                        this.anims.create({
                            key: `${type}_walk_left`,
                            frames: this.anims.generateFrameNumbers(type, { start: 6, end: Math.min(8, frameCount - 1) }),
                            frameRate: 8,
                            repeat: -1
                        });
                    }

                    // Walk right (frames 9-11)
                    if (frameCount > 9) {
                        this.anims.create({
                            key: `${type}_walk_right`,
                            frames: this.anims.generateFrameNumbers(type, { start: 9, end: Math.min(11, frameCount - 1) }),
                            frameRate: 8,
                            repeat: -1
                        });
                    }

                    // Idle (first frame)
                    this.anims.create({
                        key: `${type}_idle`,
                        frames: [{ key: type, frame: 0 }],
                        frameRate: 1
                    });
                }
            } catch (e) {
                console.warn(`Failed to create animations for ${type}:`, e);
            }
        });
    }

    onZoneEnter(player, zone) {
        this.currentZone = zone;
    }

    update(time, delta) {
        if (!this.player) return;

        // Handle player movement
        this.handlePlayerMovement();

        // Check zone proximity
        this.checkZoneProximity();

        // Handle interaction input
        if (Phaser.Input.Keyboard.JustDown(this.wasd.interact) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.space)) {
            this.handleInteraction();
        }

        // Update customers
        this.updateCustomers(delta);

        // Update interaction prompt position
        if (this.interactionPrompt.visible) {
            this.interactionPrompt.setPosition(this.player.x, this.player.y - 60);
        }
    }

    handlePlayerMovement() {
        const speed = this.player.speed;
        let velocityX = 0;
        let velocityY = 0;
        let direction = this.player.direction;
        let isMoving = false;

        // Check horizontal movement
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -speed;
            direction = 'left';
            isMoving = true;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = speed;
            direction = 'right';
            isMoving = true;
        }

        // Check vertical movement
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -speed;
            direction = 'up';
            isMoving = true;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = speed;
            direction = 'down';
            isMoving = true;
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }

        // Apply velocity
        this.player.setVelocity(velocityX, velocityY);

        // Update sprite based on direction
        if (direction !== this.player.direction || isMoving !== this.player.isMoving) {
            this.player.direction = direction;
            this.player.isMoving = isMoving;

            // Change texture based on direction
            this.player.setTexture(`baker_${direction}`);

            // Add subtle bobbing animation when moving
            if (isMoving) {
                if (!this.playerBobTween || !this.playerBobTween.isPlaying()) {
                    this.playerBobTween = this.tweens.add({
                        targets: this.player,
                        scaleY: { from: 1.2, to: 1.15 },
                        duration: 150,
                        yoyo: true,
                        repeat: -1
                    });
                }
            } else {
                if (this.playerBobTween) {
                    this.playerBobTween.stop();
                    this.player.setScale(1.2);
                }
            }
        }

        // Depth sorting based on Y position
        this.player.setDepth(Math.floor(this.player.y));
    }

    checkZoneProximity() {
        let nearestZone = null;
        let nearestDistance = 80; // Interaction range

        Object.values(this.zones).forEach(zone => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                zone.x, zone.y
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestZone = zone;
            }
        });

        if (nearestZone) {
            this.currentZone = nearestZone;
            this.promptText.setText(nearestZone.getData('label'));
            this.interactionPrompt.setVisible(true);

            // Highlight zone indicator
            const zoneType = nearestZone.getData('type');
            Object.entries(this.zoneIndicators).forEach(([key, indicator]) => {
                indicator.setFillStyle(key === zoneType ? 0xFFD700 : 0xFFD700, key === zoneType ? 0.4 : 0.15);
            });
        } else {
            this.currentZone = null;
            this.interactionPrompt.setVisible(false);

            // Reset all zone indicators
            Object.values(this.zoneIndicators).forEach(indicator => {
                indicator.setFillStyle(0xFFD700, 0.15);
            });
        }
    }

    handleInteraction() {
        if (!this.currentZone) return;

        const action = this.currentZone.getData('action');
        const zoneType = this.currentZone.getData('type');

        // Emit event for GameController to handle
        this.events.emit('zone-interaction', {
            action: action,
            zoneType: zoneType
        });

        // Visual feedback
        const indicator = this.zoneIndicators[zoneType];
        if (indicator) {
            this.tweens.add({
                targets: indicator,
                scale: { from: 1, to: 1.5 },
                alpha: { from: 1, to: 0 },
                duration: 300,
                onComplete: () => {
                    indicator.setScale(1);
                    indicator.setAlpha(1);
                }
            });
        }
    }

    // Customer spawning and management
    spawnCustomer() {
        if (this.customers.length >= this.maxCustomers) return null;

        const types = ['customer_man', 'customer_woman', 'customer_child', 'customer_elderly'];

        // Filter to only types that have textures
        const availableTypes = types.filter(t => this.textures.exists(t));
        if (availableTypes.length === 0) {
            console.warn('No customer textures available');
            return null;
        }

        const type = Phaser.Utils.Array.GetRandom(availableTypes);

        // Spawn at entrance (bottom center)
        const customer = this.physics.add.sprite(510, 750, type);
        customer.setScale(0.6);
        customer.setDepth(5);

        // Try to play animation, fall back to static if not available
        const walkAnim = `${type}_walk_up`;
        if (this.anims.exists(walkAnim)) {
            customer.play(walkAnim);
        }

        // Customer properties
        customer.customerType = type;
        customer.state = 'entering'; // entering, waiting, leaving
        customer.targetX = 510 + Phaser.Math.Between(-100, 100);
        customer.targetY = 500; // Near display case
        customer.waitTime = 0;
        customer.maxWaitTime = 10000; // 10 seconds patience

        this.customers.push(customer);

        return customer;
    }

    updateCustomers(delta) {
        this.customers.forEach((customer, index) => {
            if (!customer.active) return;

            const speed = 80;

            // Helper function to safely play animation
            const safePlay = (animKey) => {
                if (this.anims.exists(animKey)) {
                    customer.play(animKey, true);
                }
            };

            switch (customer.state) {
                case 'entering':
                    // Move towards target position
                    const distToTarget = Phaser.Math.Distance.Between(
                        customer.x, customer.y,
                        customer.targetX, customer.targetY
                    );

                    if (distToTarget > 10) {
                        const angle = Phaser.Math.Angle.Between(
                            customer.x, customer.y,
                            customer.targetX, customer.targetY
                        );
                        customer.setVelocity(
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed
                        );

                        // Update animation based on movement direction
                        if (Math.abs(customer.body.velocity.y) > Math.abs(customer.body.velocity.x)) {
                            safePlay(`${customer.customerType}_walk_${customer.body.velocity.y < 0 ? 'up' : 'down'}`);
                        } else {
                            safePlay(`${customer.customerType}_walk_${customer.body.velocity.x < 0 ? 'left' : 'right'}`);
                        }
                    } else {
                        customer.setVelocity(0, 0);
                        customer.state = 'waiting';
                        safePlay(`${customer.customerType}_idle`);
                    }
                    break;

                case 'waiting':
                    customer.waitTime += delta;
                    if (customer.waitTime > customer.maxWaitTime) {
                        customer.state = 'leaving';
                        // Emit missed customer event
                        this.events.emit('customer-left', customer);
                    }
                    break;

                case 'leaving':
                    // Move towards exit
                    if (customer.y < 780) {
                        customer.setVelocity(0, speed);
                        safePlay(`${customer.customerType}_walk_down`);
                    } else {
                        customer.destroy();
                        this.customers.splice(index, 1);
                    }
                    break;

                case 'served':
                    // Happy exit animation
                    if (customer.y < 780) {
                        customer.setVelocity(0, speed * 1.2);
                        safePlay(`${customer.customerType}_walk_down`);
                    } else {
                        customer.destroy();
                        this.customers.splice(index, 1);
                    }
                    break;
            }

            // Depth sorting
            customer.setDepth(Math.floor(customer.y));
        });
    }

    serveCustomer(customer) {
        if (!customer) {
            // Find first waiting customer
            customer = this.customers.find(c => c.state === 'waiting');
        }

        if (customer) {
            customer.state = 'served';
            // Show happy reaction
            const heart = this.add.text(customer.x, customer.y - 50, '❤️', { fontSize: '32px' });
            this.tweens.add({
                targets: heart,
                y: customer.y - 100,
                alpha: 0,
                duration: 1000,
                onComplete: () => heart.destroy()
            });
        }

        return customer;
    }

    getWaitingCustomer() {
        return this.customers.find(c => c.state === 'waiting');
    }

    startCustomerSpawning(interval = 5000) {
        if (this.customerSpawnTimer) {
            this.customerSpawnTimer.remove();
        }

        this.customerSpawnTimer = this.time.addEvent({
            delay: interval,
            callback: () => this.spawnCustomer(),
            loop: true
        });

        // Spawn first customer immediately
        this.spawnCustomer();
    }

    stopCustomerSpawning() {
        if (this.customerSpawnTimer) {
            this.customerSpawnTimer.remove();
            this.customerSpawnTimer = null;
        }
    }

    clearCustomers() {
        this.customers.forEach(c => c.destroy());
        this.customers = [];
    }
}

// Export for use
window.BakeryGameScene = BakeryGameScene;
