/**
 * Bakery_Startup_Sequence.js
 * Enhanced Pre-Operational Capital Setup Phase with realistic complexity.
 * Features detailed city with multiple districts, advanced graphics, and complex decision-making.
 */

class StartupScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartupScene' });
        this.player = null;
        this.cursors = null;
        this.buildings = [];
        this.currentZone = null;
        this.interactionText = null;
        this.isInteracting = false;
        this.minimap = null;
        
        // Setup state tracking with detailed progress
        this.setupState = {
            locationSelected: false,
            financingDecided: false,
            equipmentBought: { oven: false, mixer: false, display: false },
            paperworkDone: { required: false, optional: [] },
            insuranceSelected: false,
            staffHired: false,
            utilitiesSetup: false
        };
        
        // Track spending for budget awareness
        this.totalSpent = 0;
        this.startingCash = 0;
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // ENHANCED PLAYER with more detail
        const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
        // Chef hat (taller, more detailed)
        playerGfx.fillStyle(0xffffff);
        playerGfx.fillCircle(16, 8, 9);
        playerGfx.fillRect(10, 8, 12, 6);
        // Face
        playerGfx.fillStyle(0xffd4a3);
        playerGfx.fillCircle(16, 18, 6);
        // Apron/uniform
        playerGfx.fillStyle(0x3498db);
        playerGfx.fillRoundedRect(8, 22, 16, 18, 2);
        // Legs
        playerGfx.fillStyle(0x2c3e50);
        playerGfx.fillRect(10, 40, 5, 10);
        playerGfx.fillRect(17, 40, 5, 10);
        playerGfx.generateTexture('player', 32, 50);

        // ENHANCED BUILDINGS with better architecture
        this.createDetailedBuilding('real_estate', 0xe67e22, 0xd35400, 'Realty Co.');
        this.createDetailedBuilding('gov_office', 0x95a5a6, 0x7f8c8d, 'City Hall');
        this.createDetailedBuilding('supply_store', 0xe74c3c, 0xc0392b, 'Kitchen Pro');
        this.createDetailedBuilding('recruitment', 0x9b59b6, 0x8e44ad, 'Staffing');
        this.createDetailedBuilding('bank', 0x27ae60, 0x229954, 'First Bank');
        this.createDetailedBuilding('insurance', 0x3498db, 0x2980b9, 'Insurance');
        this.createDetailedBuilding('utility', 0xf39c12, 0xe67e22, 'Utilities');
        this.createDetailedBuilding('consultant', 0x1abc9c, 0x16a085, 'Advisor');

        // GROUND TEXTURES - Multiple types
        this.createGroundTexture('grass', 0x27ae60, 0x2ecc71);
        this.createGroundTexture('concrete', 0x95a5a6, 0xbdc3c7);
        this.createGroundTexture('plaza', 0xd5dbdb, 0xecf0f1);
        
        // ROAD TEXTURES - Different types
        this.createRoadTexture('main_road', 0x2c3e50, 0xf1c40f, 6);
        this.createRoadTexture('side_road', 0x34495e, 0xf39c12, 4);
        
        // DECORATIVE ELEMENTS
        this.createTreeTexture();
        this.createBenchTexture();
        this.createStreetlightTexture();
    }

    createDetailedBuilding(key, primaryColor, accentColor, label) {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Building body with gradient effect
        gfx.fillStyle(primaryColor);
        gfx.fillRect(0, 20, 140, 120);
        
        // Accent trim
        gfx.fillStyle(accentColor);
        gfx.fillRect(0, 20, 140, 10);
        gfx.fillRect(0, 130, 140, 10);
        
        // Windows (4x3 grid)
        gfx.fillStyle(0x85c1e9, 0.8);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const x = 15 + col * 30;
                const y = 40 + row * 28;
                gfx.fillRect(x, y, 20, 20);
                // Window frame
                gfx.lineStyle(2, 0x34495e);
                gfx.strokeRect(x, y, 20, 20);
                gfx.strokeRect(x + 9, y, 2, 20); // vertical divider
                gfx.strokeRect(x, y + 9, 20, 2); // horizontal divider
            }
        }
        
        // Entrance door (double door)
        gfx.fillStyle(0x2c3e50);
        gfx.fillRect(45, 100, 50, 40);
        gfx.fillStyle(0x7f8c8d);
        gfx.fillRect(46, 101, 23, 38);
        gfx.fillRect(71, 101, 23, 38);
        
        // Door handles
        gfx.fillStyle(0xf1c40f);
        gfx.fillCircle(63, 120, 3);
        gfx.fillCircle(78, 120, 3);
        
        // Awning
        gfx.fillStyle(accentColor);
        gfx.beginPath();
        gfx.moveTo(30, 100);
        gfx.lineTo(110, 100);
        gfx.lineTo(115, 110);
        gfx.lineTo(25, 110);
        gfx.closePath();
        gfx.fill();
        
        // Roof
        gfx.fillStyle(0x2c3e50);
        gfx.beginPath();
        gfx.moveTo(-10, 20);
        gfx.lineTo(70, -10);
        gfx.lineTo(150, 20);
        gfx.closePath();
        gfx.fill();
        
        // Chimney or antenna
        gfx.fillStyle(0x7f8c8d);
        gfx.fillRect(100, -8, 10, 18);
        
        gfx.generateTexture(key, 140, 140);
    }

    createGroundTexture(key, color1, color2) {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(color1);
        gfx.fillRect(0, 0, 64, 64);
        // Pattern
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if ((i + j) % 2 === 0) {
                    gfx.fillStyle(color2, 0.3);
                    gfx.fillRect(i * 16, j * 16, 16, 16);
                }
            }
        }
        gfx.generateTexture(key, 64, 64);
    }

    createRoadTexture(key, asphalt, lineColor, lineWidth) {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(asphalt);
        gfx.fillRect(0, 0, 64, 64);
        // Center line
        gfx.fillStyle(lineColor);
        gfx.fillRect(32 - lineWidth/2, 0, lineWidth, 64);
        // Texture variation
        for (let i = 0; i < 10; i++) {
            gfx.fillStyle(0x000000, 0.1);
            gfx.fillCircle(Math.random() * 64, Math.random() * 64, Math.random() * 3);
        }
        gfx.generateTexture(key, 64, 64);
    }

    createTreeTexture() {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        // Trunk
        gfx.fillStyle(0x8b4513);
        gfx.fillRect(20, 30, 8, 20);
        // Foliage
        gfx.fillStyle(0x27ae60);
        gfx.fillCircle(24, 25, 15);
        gfx.fillCircle(16, 20, 12);
        gfx.fillCircle(32, 20, 12);
        gfx.fillCircle(24, 15, 10);
        gfx.generateTexture('tree', 48, 50);
    }

    createBenchTexture() {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(0x8b4513);
        gfx.fillRect(2, 12, 36, 4);
        gfx.fillRect(4, 16, 2, 8);
        gfx.fillRect(34, 16, 2, 8);
        gfx.generateTexture('bench', 40, 24);
    }

    createStreetlightTexture() {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(0x7f8c8d);
        gfx.fillRect(18, 10, 4, 40);
        gfx.fillStyle(0xf1c40f);
        gfx.fillCircle(20, 10, 8);
        gfx.generateTexture('streetlight', 40, 50);
    }

    create() {
        this.startingCash = window.game.engine.cash;
        
        // === LARGER WORLD (1600x1200) ===
        this.physics.world.setBounds(0, 0, 1600, 1200);
        this.cameras.main.setBounds(0, 0, 1600, 1200);
        
        // === BACKGROUND ===
        // Multiple ground types for visual interest
        this.add.tileSprite(800, 600, 1600, 1200, 'grass');
        
        // Plaza area in center
        this.add.rectangle(800, 600, 400, 400, 0xecf0f1).setAlpha(0.7);
        
        // === ROADS ===
        // Main boulevard (vertical)
        this.add.tileSprite(800, 600, 128, 1200, 'main_road');
        // Cross streets (horizontal)
        this.add.tileSprite(800, 300, 1600, 96, 'side_road');
        this.add.tileSprite(800, 900, 1600, 96, 'side_road');
        
        // === DECORATIVE ELEMENTS ===
        // Trees
        this.add.image(200, 200, 'tree');
        this.add.image(1400, 200, 'tree');
        this.add.image(200, 1000, 'tree');
        this.add.image(1400, 1000, 'tree');
        this.add.image(600, 450, 'tree');
        this.add.image(1000, 450, 'tree');
        this.add.image(600, 750, 'tree');
        this.add.image(1000, 750, 'tree');
        
        // Benches
        this.add.image(650, 600, 'bench');
        this.add.image(950, 600, 'bench');
        
        // Streetlights
        this.add.image(700, 300, 'streetlight');
        this.add.image(900, 300, 'streetlight');
        this.add.image(700, 900, 'streetlight');
        this.add.image(900, 900, 'streetlight');

        // === PLAYER ===
        this.player = this.physics.add.sprite(800, 600, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(100);
        
        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        
        // === BUILDINGS (organized by district) ===
        this.buildings = this.physics.add.staticGroup();
        
        // DOWNTOWN DISTRICT (top)
        this.addBuilding(300, 150, 'bank', 'First National Bank', () => this.openBank(), 'Get financing for your bakery');
        this.addBuilding(500, 150, 'real_estate', 'Metro Realty', () => this.openRealEstate(), 'Choose your location');
        this.addBuilding(700, 150, 'consultant', 'Business Advisor', () => this.openConsultant(), 'Free advice');
        
        // GOVERNMENT DISTRICT (left)
        this.addBuilding(200, 500, 'gov_office', 'City Hall', () => this.openGovernment(), 'Permits & licenses');
        this.addBuilding(200, 700, 'insurance', 'SafeGuard Insurance', () => this.openInsurance(), 'Protect your business');
        
        // COMMERCIAL DISTRICT (right)
        this.addBuilding(1400, 500, 'supply_store', 'Kitchen Pro Supply', () => this.openSupplies(), 'Buy equipment');
        this.addBuilding(1400, 700, 'utility', 'City Utilities', () => this.openUtilities(), 'Setup power & internet');
        
        // SERVICES DISTRICT (bottom)
        this.addBuilding(1000, 1050, 'recruitment', 'ProStaff Agency', () => this.openRecruitment(), 'Hire employees');

        this.physics.add.collider(this.player, this.buildings);

        // === UI LAYER ===
        // Interaction prompt
        this.interactionText = this.add.text(400, 550, '', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '18px',
            backgroundColor: '#000000dd',
            padding: { x: 12, y: 8 },
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setVisible(false).setDepth(200).setScrollFactor(0);

        // === HUD (fixed to camera) ===
        this.createHUD();
        
        // === CONTROLS ===
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            map: Phaser.Input.Keyboard.KeyCodes.M
        });
        
        // === MINIMAP ===
        this.createMinimap();
        
        // === GUIDANCE ARROW ===
        this.guidanceArrow = null;
        this.updateGuidanceArrow();
        
        // === TUTORIAL ===
        this.showTutorialPrompt('Welcome to Startup City! Visit the Bank first to explore financing options, or bootstrap with savings.');
    }

    createHUD() {
        const hudBg = this.add.rectangle(10, 10, 320, 180, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(150);
        
        this.capitalText = this.add.text(20, 20, '', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '20px',
            color: '#2ecc71'
        }).setScrollFactor(0).setDepth(151);
        
        this.budgetText = this.add.text(20, 50, '', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#ecf0f1'
        }).setScrollFactor(0).setDepth(151);
        
        this.progressText = this.add.text(20, 80, '', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#bdc3c7',
            wordWrap: { width: 300 }
        }).setScrollFactor(0).setDepth(151);
        
        // Instructions
        this.add.text(20, 160, 'WASD: Move | E: Interact | M: Map', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#7f8c8d'
        }).setScrollFactor(0).setDepth(151);
        
        // "Use Default Settings" button
        this.defaultsBtn = this.add.text(700, 50, '⚙️ Use Default Settings', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '20px',
            backgroundColor: '#3498db',
            padding: { x: 16, y: 10 },
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(300)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.applyDefaultSettings();
        })
        .on('pointerover', () => {
            this.defaultsBtn.setBackgroundColor('#2980b9');
        })
        .on('pointerout', () => {
            this.defaultsBtn.setBackgroundColor('#3498db');
        });
        
        this.updateHUD();
    }

    createMinimap() {
        // Simple minimap in corner
        const mapSize = 160;
        const mapX = 800 - mapSize - 10;
        const mapY = 10;
        
        const mapBg = this.add.rectangle(mapX, mapY, mapSize, mapSize * 0.75, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(150);
        
        // Add map title
        this.add.text(mapX + mapSize/2, mapY + 5, 'MAP', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '10px',
            color: '#ecf0f1'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(151);
    }

    updateHUD() {
        const cash = window.game.engine.cash;
        const spent = this.startingCash - cash;
        
        this.capitalText.setText(`Capital: $${cash.toFixed(0)}`);
        this.budgetText.setText(`Spent: $${spent.toFixed(0)} / Budget: $${this.startingCash.toFixed(0)}`);
        
        // Progress checklist
        const checks = [];
        checks.push(this.setupState.financingDecided ? '✓ Financing' : '☐ Financing');
        checks.push(this.setupState.locationSelected ? '✓ Location' : '☐ Location');
        checks.push(this.setupState.paperworkDone.required ? '✓ Permits' : '☐ Permits');
        checks.push((this.setupState.equipmentBought.oven && this.setupState.equipmentBought.mixer) ? '✓ Equipment' : '☐ Equipment');
        checks.push(this.setupState.insuranceSelected ? '✓ Insurance' : '☐ Insurance');
        checks.push(this.setupState.staffHired ? '✓ Staff' : '☐ Staff');
        
        this.progressText.setText('Setup Progress:\n' + checks.join('  '));
    }

    addBuilding(x, y, key, label, callback, hint) {
        const building = this.buildings.create(x, y, key);
        building.refreshBody();
        building.setDepth(50);
        
        // Building label
        this.add.text(x, y - 80, label, {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(51);
        
        // Hint text (smaller)
        if (hint) {
            this.add.text(x, y - 65, hint, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                color: '#ecf0f1',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(51);
        }

        // Interaction Zone
        const zone = this.add.zone(x, y + 40, 160, 120);
        this.physics.add.existing(zone);
        zone.body.setAllowGravity(false);
        
        this.physics.add.overlap(this.player, zone, () => {
            this.currentZone = { label, callback, hint };
        });
    }

    update() {
        if (this.isInteracting) {
            this.player.setVelocity(0);
            return;
        }

        // Movement with diagonal handling
        const speed = 220;
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = speed;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = speed;
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        this.player.setVelocity(velocityX, velocityY);

        // Interaction prompt
        if (this.currentZone) {
            this.interactionText.setText(`Press E: ${this.currentZone.label}`);
            this.interactionText.setVisible(true);
            this.interactionText.setPosition(400, 550);
            
            if (Phaser.Input.Keyboard.JustDown(this.wasd.interact)) {
                this.currentZone.callback();
            }
        } else {
            this.interactionText.setVisible(false);
        }
        
        // Update arrow position to follow player
        if (this.guidanceArrow) {
            this.guidanceArrow.x = this.player.x;
            this.guidanceLabel.x = this.player.x;
        }
        
        this.currentZone = null;
        this.updateHUD();
    }
    
    updateGuidanceArrow() {
        // Determine next building to visit based on progress
        let targetBuilding = null;
        let targetPos = null;
        let message = '';
        
        if (!this.setupState.financingDecided) {
            targetPos = { x: 300, y: 150 };
            message = 'Visit Bank';
        } else if (!this.setupState.locationSelected) {
            targetPos = { x: 500, y: 150 };
            message = 'Choose Location';
        } else if (!this.setupState.paperworkDone.required) {
            targetPos = { x: 200, y: 500 };
            message = 'Get Permits';
        } else if (!this.setupState.equipmentBought.oven || !this.setupState.equipmentBought.mixer || !this.setupState.equipmentBought.display) {
            targetPos = { x: 1400, y: 500 };
            message = 'Buy Equipment';
        } else if (!this.setupState.insuranceSelected) {
            targetPos = { x: 200, y: 700 };
            message = 'Get Insurance';
        } else if (!this.setupState.utilitiesSetup) {
            targetPos = { x: 1400, y: 700 };
            message = 'Setup Utilities';
        } else if (!this.setupState.staffHired) {
            targetPos = { x: 1000, y: 1050 };
            message = 'Hire Staff';
        }
        
        // Remove old arrow
        if (this.guidanceArrow) {
            this.guidanceArrow.destroy();
            this.guidanceArrow = null;
        }
        
        if (this.guidanceLabel) {
            this.guidanceLabel.destroy();
            this.guidanceLabel = null;
        }
        
        // Create new arrow if target exists
        if (targetPos) {
            const angle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                targetPos.x, targetPos.y
            );
            
            // Create arrow sprite above player
            const arrowGfx = this.make.graphics({ x: 0, y: 0, add: false });
            arrowGfx.fillStyle(0xf1c40f, 1);
            arrowGfx.beginPath();
            arrowGfx.moveTo(0, -15);
            arrowGfx.lineTo(10, 5);
            arrowGfx.lineTo(0, 0);
            arrowGfx.lineTo(-10, 5);
            arrowGfx.closePath();
            arrowGfx.fill();
            arrowGfx.generateTexture('arrow_temp', 20, 20);
            
            this.guidanceArrow = this.add.image(this.player.x, this.player.y - 40, 'arrow_temp')
                .setRotation(angle + Math.PI / 2)
                .setDepth(120);
            
            // Pulsing animation
            this.tweens.add({
                targets: this.guidanceArrow,
                y: this.player.y - 50,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
            
            // Label
            this.guidanceLabel = this.add.text(this.player.x, this.player.y - 60, message, {
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '14px',
                color: '#f1c40f',
                backgroundColor: '#000000aa',
                padding: { x: 8, y: 4 },
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(120);
        }
    }

    // === INTERACTION HANDLERS ===

    openBank() {
        const financing = GAME_CONFIG.SETUP_OPTIONS.financing;
        
        this.openModal('First National Bank - Small Business Loans', `
            <div class="advisor-note" style="background: #e8f8f5; padding: 15px; margin-bottom: 15px; border-left: 4px solid #27ae60;">
                <strong>💡 Banker's Advice:</strong> Only borrow what you need. Higher debt means monthly payments that eat into profits. Many successful bakeries start small with personal savings.
            </div>
            
            <div class="setup-grid">
                ${financing.map(f => {
                    const selected = window.game.setupChoices.financing?.id === f.id;
                    const monthlyNote = f.monthlyPayment ? `<div style="color: #e74c3c; font-size: 11px;">Monthly: $${f.monthlyPayment} for ${f.term} months</div>` : '';
                    const totalCost = f.monthlyPayment ? f.monthlyPayment * f.term : 0;
                    const totalInterest = totalCost - f.amount;
                    
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('financing', '${f.id}'); document.getElementById('modal-close').click();"
                             style="cursor: pointer;">
                            <div class="setup-name">${f.name}</div>
                            <div class="setup-desc">${f.description}</div>
                            <div style="margin-top: 10px;">
                                ${f.amount > 0 ? `
                                    <div><strong>Loan Amount: $${f.amount.toLocaleString()}</strong></div>
                                    <div>Interest Rate: ${(f.interestRate * 100).toFixed(1)}%</div>
                                    ${monthlyNote}
                                    <div style="font-size: 10px; color: #7f8c8d;">Total repaid: $${totalCost.toLocaleString()} (interest: $${totalInterest.toLocaleString()})</div>
                                ` : '<div style="color: #27ae60;"><strong>✓ No debt, no stress</strong></div>'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `, () => {
            if (window.game.setupChoices.financing) {
                const choice = window.game.setupChoices.financing;
                if (choice.amount > 0) {
                    window.game.engine.cash += choice.amount;
                    window.game.engine.debt = choice.amount;
                    window.game.engine.monthlyLoanPayment = choice.monthlyPayment;
                    this.showTutorialPrompt(`Loan approved! $${choice.amount} added to capital. Monthly payment: $${choice.monthlyPayment}.`);
                } else {
                    this.showTutorialPrompt('Bootstrapping with savings. Smart choice to avoid debt!');
                }
                this.setupState.financingDecided = true;
                this.updateGuidanceArrow();
                this.updateHUD();
            }
        });
    }

    openRealEstate() {
        if (!this.setupState.financingDecided) {
            this.showTutorialPrompt('Visit the Bank first to decide on financing!');
            return;
        }
        
        const locations = GAME_CONFIG.SETUP_OPTIONS.locations;
        
        this.openModal('Metro Realty - Commercial Properties', `
            <div class="advisor-note" style="background: #fef9e7; padding: 15px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                <strong>🏢 Agent's Tip:</strong> Location is critical! High traffic = more sales but higher rent. Consider your target market and budget carefully.
            </div>
            
            <div style="max-height: 500px; overflow-y: auto;">
                ${locations.map(loc => {
                    const selected = window.game.setupChoices.location?.id === loc.id;
                    return `
                        <div class="location-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('location', '${loc.id}'); document.getElementById('modal-close').click();"
                             style="border: 2px solid ${selected ? '#27ae60' : '#ddd'}; padding: 15px; margin: 10px 0; border-radius: 8px; cursor: pointer; background: ${selected ? '#e8f8f5' : '#fff'};">
                            
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h3 style="margin: 0; color: #2c3e50;">${loc.icon} ${loc.name}</h3>
                                    <p style="margin: 5px 0; color: #7f8c8d; font-size: 14px;">${loc.description}</p>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">$${loc.rent}/day</div>
                                    <div style="font-size: 12px; color: #95a5a6;">${loc.size} sq ft</div>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; font-size: 13px;">
                                <div><strong>Traffic:</strong> ${(loc.traffic * 100).toFixed(0)}%</div>
                                <div><strong>Parking:</strong> ${loc.parking}</div>
                                <div><strong>Demographics:</strong> ${loc.demographics}</div>
                                <div><strong>Competition:</strong> ${loc.competition}</div>
                                <div><strong>Walk Score:</strong> ${loc.walkScore}/100</div>
                                <div><strong>Transit:</strong> ${loc.transitAccess}</div>
                            </div>
                            
                            <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                <div style="background: #d5f4e6; padding: 8px; border-radius: 4px;">
                                    <strong style="color: #27ae60;">Pros:</strong>
                                    <ul style="margin: 5px 0; padding-left: 20px; font-size: 11px;">
                                        ${loc.pros.map(p => `<li>${p}</li>`).join('')}
                                    </ul>
                                </div>
                                <div style="background: #fadbd8; padding: 8px; border-radius: 4px;">
                                    <strong style="color: #e74c3c;">Cons:</strong>
                                    <ul style="margin: 5px 0; padding-left: 20px; font-size: 11px;">
                                        ${loc.cons.map(c => `<li>${c}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                            
                            <div style="margin-top: 8px; font-size: 11px; color: #7f8c8d;">
                                Zoning fees: $${loc.zoningFees} (one-time)
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `, () => {
            if (window.game.setupChoices.location) {
                const loc = window.game.setupChoices.location;
                window.game.engine.cash -= loc.zoningFees;
                this.setupState.locationSelected = true;
                this.updateGuidanceArrow();
                this.showTutorialPrompt(`Location secured! Zoning fees: $${loc.zoningFees}. Daily rent will be $${loc.rent}. Visit City Hall for permits.`);
                this.updateHUD();
            }
        });
    }

    openGovernment() {
        if (!this.setupState.locationSelected) {
            this.showTutorialPrompt('You need a location address before applying for permits! Visit Realty first.');
            return;
        }

        const paperwork = GAME_CONFIG.SETUP_OPTIONS.paperwork;
        const required = paperwork.filter(p => p.required);
        const optional = paperwork.filter(p => !p.required);
        
        this.openModal('City Hall - Business Permits & Licenses', `
            <div class="advisor-note" style="background: #ebf5fb; padding: 15px; margin-bottom: 15px; border-left: 4px solid #3498db;">
                <strong>📋 Clerk's Notice:</strong> Required permits are mandatory. Optional licenses can boost revenue but cost extra. Processing times vary.
            </div>
            
            <h3 style="color: #e74c3c;">Required Permits</h3>
            <div class="setup-grid">
                ${required.map(p => {
                    const selected = window.game.setupChoices.paperwork?.includes(p.id);
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('paperwork', '${p.id}'); this.classList.toggle('selected');"
                             style="cursor: pointer; ${selected ? 'background: #d5f4e6;' : ''}">
                            <div class="setup-icon">${p.icon}</div>
                            <div class="setup-name">${p.name}</div>
                            <div class="setup-desc">${p.description}</div>
                            <div style="margin-top: 8px; font-size: 12px;">
                                <div><strong>Cost: $${p.cost}</strong></div>
                                <div>Annual fee: $${p.annual}</div>
                                <div>Processing: ${p.processingTime} days</div>
                                ${p.inspectionRequired ? '<div style="color: #e67e22;">⚠️ Inspection required</div>' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <h3 style="color: #27ae60; margin-top: 20px;">Optional Licenses (Revenue Boosters)</h3>
            <div class="setup-grid">
                ${optional.map(p => {
                    const selected = window.game.setupChoices.paperwork?.includes(p.id);
                    const benefit = p.revenueBonus ? `+${((p.revenueBonus - 1) * 100).toFixed(0)}% revenue` : 
                                   p.trafficBonus ? `+${((p.trafficBonus - 1) * 100).toFixed(0)}% traffic` :
                                   p.priceMultiplier ? `+${((p.priceMultiplier - 1) * 100).toFixed(0)}% prices` : '';
                    
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('paperwork', '${p.id}'); this.classList.toggle('selected');"
                             style="cursor: pointer; ${selected ? 'background: #d5f4e6;' : ''}">
                            <div class="setup-icon">${p.icon}</div>
                            <div class="setup-name">${p.name}</div>
                            <div class="setup-desc">${p.description}</div>
                            <div style="margin-top: 8px; font-size: 12px;">
                                <div><strong>Cost: $${p.cost}</strong></div>
                                <div>Annual: $${p.annual}</div>
                                <div>Processing: ${p.processingTime} days</div>
                                ${benefit ? `<div style="color: #27ae60; font-weight: bold;">✨ ${benefit}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <button class="action-btn primary" style="margin-top: 20px; width: 100%;" onclick="document.getElementById('modal-close').click()">Submit Applications</button>
        `, () => {
            const selected = window.game.setupChoices.paperwork || [];
            const totalCost = selected.reduce((sum, id) => {
                const permit = paperwork.find(p => p.id === id);
                return sum + permit.cost;
            }, 0);
            
            const hasAllRequired = required.every(p => selected.includes(p.id));
            
            if (hasAllRequired) {
                window.game.engine.cash -= totalCost;
                this.setupState.paperworkDone.required = true;
                this.setupState.paperworkDone.optional = selected.filter(id => !required.find(p => p.id === id));
                this.updateGuidanceArrow();
                this.showTutorialPrompt(`Permits approved! Total cost: $${totalCost}. Visit Kitchen Pro Supply for equipment.`);
                this.updateHUD();
            } else {
                this.showTutorialPrompt('⚠️ You must get all required permits!');
            }
        });
    }

    openSupplies() {
        if (!this.setupState.paperworkDone.required) {
            this.showTutorialPrompt("You can't buy commercial equipment without permits! Visit City Hall first.");
            return;
        }

        const equipment = GAME_CONFIG.SETUP_OPTIONS.equipment;
        
        this.openModal('Kitchen Pro Supply - Commercial Equipment', `
            <div class="advisor-note" style="background: #fef5e7; padding: 15px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                <strong>🔧 Expert's Tip:</strong> Don't skimp on essentials (oven, mixer) but you can start basic on displays. Equipment breaks down—factor in maintenance costs!
            </div>
            
            <h3>🔥 Ovens (Required)</h3>
            <div class="setup-grid">
                ${equipment.ovens.map(e => {
                    const selected = window.game.setupChoices.equipment?.oven?.id === e.id;
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('equipment_oven', '${e.id}'); this.classList.toggle('selected');"
                             style="cursor: pointer;">
                            <div class="setup-icon">${e.icon}</div>
                            <div class="setup-name">${e.name}</div>
                            <div class="setup-desc">${e.description}</div>
                            <div style="margin-top: 8px; font-size: 12px;">
                                <div><strong>Cost: $${e.cost}</strong></div>
                                <div>Capacity: ${e.capacity} batches</div>
                                <div>Speed: ${(e.speed * 100).toFixed(0)}%</div>
                                <div>Reliability: ${(e.reliability * 100).toFixed(0)}%</div>
                                <div>Energy cost: ${(e.energyCost * 100).toFixed(0)}%</div>
                                <div>Warranty: ${e.warranty} years</div>
                                <div style="font-size: 10px; color: #7f8c8d;">Lifespan: ~${e.lifespan} years</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <h3>🔄 Mixers (Required)</h3>
            <div class="setup-grid">
                ${equipment.mixers.map(m => {
                    const selected = window.game.setupChoices.equipment?.mixer?.id === m.id;
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('equipment_mixer', '${m.id}'); this.classList.toggle('selected');"
                             style="cursor: pointer;">
                            <div class="setup-icon">${m.icon}</div>
                            <div class="setup-name">${m.name}</div>
                            <div class="setup-desc">${m.description}</div>
                            <div style="margin-top: 8px; font-size: 12px;">
                                <div><strong>Cost: $${m.cost}</strong></div>
                                <div>Efficiency: ${(m.efficiency * 100).toFixed(0)}%</div>
                                <div>Capacity: ${m.capacity} lbs</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <h3>🧊 Display Cases (Required)</h3>
            <div class="setup-grid">
                ${equipment.displays.map(d => {
                    const selected = window.game.setupChoices.equipment?.display?.id === d.id;
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('equipment_display', '${d.id}'); this.classList.toggle('selected');"
                             style="cursor: pointer;">
                            <div class="setup-icon">${d.icon}</div>
                            <div class="setup-name">${d.name}</div>
                            <div class="setup-desc">${d.description}</div>
                            <div style="margin-top: 8px; font-size: 12px;">
                                <div><strong>Cost: $${d.cost}</strong></div>
                                <div>Customer appeal: ${(d.appeal * 100).toFixed(0)}%</div>
                                <div>Capacity: ${d.capacity} items</div>
                                ${d.shelfLifeBonus ? `<div style="color: #27ae60;">+${d.shelfLifeBonus} days shelf life</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <button class="action-btn primary" style="margin-top: 20px; width: 100%;" onclick="document.getElementById('modal-close').click()">Finalize Equipment Order</button>
        `, () => {
            const equip = window.game.setupChoices.equipment || {};
            if (equip.oven && equip.mixer && equip.display) {
                const totalCost = equip.oven.cost + equip.mixer.cost + equip.display.cost;
                window.game.engine.cash -= totalCost;
                this.setupState.equipmentBought = { oven: true, mixer: true, display: true };
                
                // Apply equipment stats to engine
                window.game.engine.ovenCapacity = equip.oven.capacity;
                window.game.engine.bakingSpeedMultiplier = equip.oven.speed * equip.mixer.efficiency;
                
                this.updateGuidanceArrow();
                this.showTutorialPrompt(`Equipment purchased! Total: $${totalCost}. Visit Insurance next for protection.`);
                this.updateHUD();
            } else {
                this.showTutorialPrompt('⚠️ Select an oven, mixer, AND display case!');
            }
        });
    }

    openInsurance() {
        const insurance = GAME_CONFIG.SETUP_OPTIONS.insurance;
        
        this.openModal('SafeGuard Insurance - Business Protection', `
            <div class="advisor-note" style="background: #ebf5fb; padding: 15px; margin-bottom: 15px; border-left: 4px solid #3498db;">
                <strong>🛡️ Agent's Warning:</strong> One lawsuit or fire can bankrupt you. Insurance is NOT optional. The question is how much coverage you need.
            </div>
            
            <div class="setup-grid">
                ${insurance.map(ins => {
                    const selected = window.game.setupChoices.insurance?.id === ins.id;
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('insurance', '${ins.id}'); document.getElementById('modal-close').click();"
                             style="cursor: pointer;">
                            <div class="setup-icon">${ins.icon}</div>
                            <div class="setup-name">${ins.name}</div>
                            <div class="setup-desc">${ins.description}</div>
                            <div style="margin-top: 10px; font-size: 12px;">
                                <div><strong>$${ins.monthlyCost}/month</strong></div>
                                <div>Coverage: $${(ins.coverage / 1000000).toFixed(1)}M</div>
                                <div style="margin-top: 5px; font-size: 11px;">
                                    <strong>Covers:</strong>
                                    <ul style="margin: 3px 0; padding-left: 20px;">
                                        ${ins.covers.map(c => `<li>${c.replace(/_/g, ' ')}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `, () => {
            if (window.game.setupChoices.insurance) {
                this.setupState.insuranceSelected = true;
                this.updateGuidanceArrow();
                this.showTutorialPrompt('Insurance activated! Visit ProStaff to hire employees, or City Utilities.');
                this.updateHUD();
            }
        });
    }

    openUtilities() {
        const utilities = GAME_CONFIG.SETUP_OPTIONS.utilities;
        const power = utilities.filter(u => u.id.includes('power'));
        const internet = utilities.filter(u => u.id.includes('internet'));
        
        this.openModal('City Utilities - Essential Services', `
            <h3>⚡ Electrical Service</h3>
            <div class="setup-grid">
                ${power.map(p => {
                    const selected = window.game.setupChoices.utilities?.power?.id === p.id;
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('utility_power', '${p.id}'); this.classList.toggle('selected');"
                             style="cursor: pointer;">
                            <div class="setup-name">${p.name}</div>
                            <div class="setup-desc">${p.description}</div>
                            <div style="margin-top: 8px;">
                                <div><strong>$${p.monthlyCost}/month</strong></div>
                                <div>Reliability: ${(p.reliability * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <h3>🌐 Internet Service</h3>
            <div class="setup-grid">
                ${internet.map(i => {
                    const selected = window.game.setupChoices.utilities?.internet?.id === i.id;
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('utility_internet', '${i.id}'); this.classList.toggle('selected');"
                             style="cursor: pointer;">
                            <div class="setup-name">${i.name}</div>
                            <div class="setup-desc">${i.description}</div>
                            <div style="margin-top: 8px;">
                                <div><strong>$${i.monthlyCost}/month</strong></div>
                                <div>Features: ${i.features.join(', ')}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <button class="action-btn primary" style="margin-top: 20px; width: 100%;" onclick="document.getElementById('modal-close').click()">Activate Services</button>
        `, () => {
            const util = window.game.setupChoices.utilities || {};
            if (util.power && util.internet) {
                this.setupState.utilitiesSetup = true;
                this.updateGuidanceArrow();
                this.showTutorialPrompt('Utilities activated! All set. Visit ProStaff if you need employees.');
                this.updateHUD();
            } else {
                this.showTutorialPrompt('⚠️ Select both power AND internet!');
            }
        });
    }

    openRecruitment() {
        const staff = GAME_CONFIG.SETUP_OPTIONS.staff;
        
        this.openModal('ProStaff Agency - Employment Solutions', `
            <div class="advisor-note" style="background: #f4ecf7; padding: 15px; margin-bottom: 15px; border-left: 4px solid #9b59b6;">
                <strong>👥 Recruiter's Advice:</strong> More staff = higher costs but better coverage. Skilled workers cost more but make fewer mistakes. Benefits add ~25% to salary costs.
            </div>
            
            <div style="max-height: 500px; overflow-y: auto;">
                ${staff.map(s => {
                    const selected = window.game.setupChoices.staff?.id === s.id;
                    const annualCost = s.monthlyCost * 12 + s.benefits * 12;
                    return `
                        <div class="setup-card ${selected ? 'selected' : ''}" 
                             onclick="window.game.selectSetup('staff', '${s.id}'); document.getElementById('modal-close').click();"
                             style="cursor: pointer; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <div class="setup-icon" style="font-size: 32px;">${s.icon}</div>
                                    <div class="setup-name">${s.name}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 20px; font-weight: bold; color: #e74c3c;">$${s.monthlyCost}/mo</div>
                                    ${s.benefits > 0 ? `<div style="font-size: 11px; color: #7f8c8d;">+$${s.benefits}/mo benefits</div>` : ''}
                                </div>
                            </div>
                            
                            <div class="setup-desc" style="margin: 10px 0;">${s.description}</div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; font-size: 12px;">
                                <div><strong>Efficiency:</strong> ${(s.efficiency * 100).toFixed(0)}%</div>
                                <div><strong>Skill:</strong> ${s.skillLevel}</div>
                                <div><strong>Hours:</strong> ${s.hours}</div>
                                <div><strong>Annual cost:</strong> $${annualCost.toLocaleString()}</div>
                            </div>
                            
                            <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                <div style="background: #d5f4e6; padding: 5px; border-radius: 4px; font-size: 11px;">
                                    ${s.pros.map(p => `✓ ${p}`).join('<br>')}
                                </div>
                                <div style="background: #fadbd8; padding: 5px; border-radius: 4px; font-size: 11px;">
                                    ${s.cons.map(c => `✗ ${c}`).join('<br>')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `, () => {
            if (window.game.setupChoices.staff) {
                const choice = window.game.setupChoices.staff;
                if (choice.monthlyCost > 0) {
                    window.game.engine.cash -= choice.monthlyCost; // First month
                }
                window.game.engine.bakingSpeedMultiplier = (window.game.engine.bakingSpeedMultiplier || 1.0) * choice.efficiency;
                this.setupState.staffHired = true;
                this.updateGuidanceArrow();
                this.showTutorialPrompt(`${choice.name} hired! First month paid. Check if you can Open Bakery now.`);
                this.updateHUD();
                this.checkCompletion();
            }
        });
    }

    openConsultant() {
        const cash = window.game.engine.cash;
        const spent = this.startingCash - cash;
        const remaining = cash;
        
        const advice = [];
        if (remaining < 3000) {
            advice.push('⚠️ <strong>LOW CAPITAL WARNING:</strong> You have less than $3,000 left. Be very careful with remaining expenses!');
        }
        if (!this.setupState.financingDecided) {
            advice.push('💡 Visit the Bank to decide on financing. Loans give you more capital but add monthly payments.');
        }
        if (!this.setupState.locationSelected) {
            advice.push('🏢 Location is your biggest decision. High traffic costs more but brings customers.');
        }
        if (remaining > 8000 && !this.setupState.equipmentBought.oven) {
            advice.push('✅ You have good capital remaining. Consider investing in quality equipment—it pays off long-term.');
        }
        if (this.setupState.paperworkDone.optional?.includes('organic_cert')) {
            advice.push('🌱 Great choice on Organic certification! You can charge 25% more for organic products.');
        }
        
        this.openModal('Business Consultant - Free Advice', `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <h2 style="margin: 0;">📊 Financial Overview</h2>
                <div style="margin-top: 10px; font-size: 16px;">
                    <div>Starting Capital: <strong>$${this.startingCash.toLocaleString()}</strong></div>
                    <div>Total Spent: <strong style="color: #ffd700;">$${spent.toLocaleString()}</strong></div>
                    <div>Remaining: <strong style="color: ${remaining < 3000 ? '#ff6b6b' : '#51cf66'};">$${remaining.toLocaleString()}</strong></div>
                </div>
            </div>
            
            <h3>💼 Personalized Recommendations</h3>
            ${advice.length > 0 ? advice.map(a => `<div style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-left: 4px solid #667eea; border-radius: 4px;">${a}</div>`).join('') : '<p>You\'re doing great! Keep making smart decisions.</p>'}
            
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 8px;">
                <strong style="color: #2e7d32;">💡 Pro Tips:</strong>
                <ul style="margin: 10px 0; padding-left: 20px; font-size: 13px;">
                    <li>Keep at least $2,000 emergency fund</li>
                    <li>Invest in reliable equipment over cheap alternatives</li>
                    <li>Optional permits (liquor, catering) can boost revenue significantly</li>
                    <li>Don't over-hire staff initially—you can always expand</li>
                    <li>Premium insurance prevents catastrophic losses</li>
                </ul>
            </div>
            
            <button class="action-btn primary" style="margin-top: 20px; width: 100%;" onclick="document.getElementById('modal-close').click()">Thanks for the advice!</button>
        `, null);
    }

    // --- Helpers ---

    openModal(title, content, onClose) {
        this.isInteracting = true;
        
        const overlay = document.createElement('div');
        overlay.className = 'game-popup-overlay';
        overlay.innerHTML = `
            <div class="game-popup" style="max-width: 800px; width: 90%;">
                <div class="popup-title">${title}</div>
                <div class="popup-content" style="max-height: 60vh; overflow-y: auto; margin: 20px 0;">
                    ${content}
                </div>
                <button id="modal-close" class="popup-btn primary">Close</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const closeBtn = overlay.querySelector('#modal-close');
        closeBtn.onclick = () => {
            overlay.remove();
            this.isInteracting = false;
            if (onClose) onClose();
        };
    }

    showTutorialPrompt(text) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            font-family: 'Fredoka', sans-serif;
            z-index: 1000;
            animation: slideUp 0.5s ease-out;
            border: 2px solid var(--accent);
        `;
        toast.textContent = text;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    checkCompletion() {
        if (window.game.canFinishSetup()) {
            // Add a "Open Bakery" button to the right side of the map
            if (!this.finishBtn) {
                this.finishBtn = this.add.text(700, 450, '🏪 OPEN BAKERY', {
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '28px',
                    backgroundColor: '#2ecc71',
                    padding: { x: 20, y: 12 },
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                })
                .setOrigin(0.5)
                .setScrollFactor(0) // Fix to camera
                .setDepth(300)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    window.game.finishSetup();
                });
                
                this.tweens.add({
                    targets: this.finishBtn,
                    scale: 1.1,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    applyDefaultSettings() {
        const options = GAME_CONFIG.SETUP_OPTIONS;
        
        // Default choices based on typical mid-range bakery
        const defaultChoices = {
            // Mid-tier suburban location
            location: options.locations.find(l => l.id === 'suburbs_plaza'),
            // Bootstrap with savings (no debt)
            financing: options.financing.find(f => f.id === 'personal_savings'),
            // Mid-tier equipment
            equipment: {
                oven: options.equipment.ovens.find(e => e.id === 'pro_deck'),
                mixer: options.equipment.mixers.find(m => m.id === 'floor_mixer'),
                display: options.equipment.displays.find(d => d.id === 'refrigerated_case')
            },
            // Required permits only
            paperwork: options.paperwork.filter(p => p.required).map(p => p.id),
            // Standard insurance
            insurance: options.insurance.find(i => i.id === 'standard_package'),
            // Mid-tier utilities (selecting from flat array)
            utilities: [
                options.utilities.find(u => u.id === 'commercial_power'),
                options.utilities.find(u => u.id === 'business_internet')
            ],
            // Solo operation
            staff: options.staff.find(s => s.id === 'solo')
        };
        
        // Apply location
        window.game.setupChoices.location = defaultChoices.location;
        this.setupState.locationSelected = true;
        
        // Apply financing
        window.game.setupChoices.financing = defaultChoices.financing;
        this.setupState.financingDecided = true;
        
        // Apply equipment
        window.game.setupChoices.equipment = defaultChoices.equipment;
        this.setupState.equipmentBought.oven = true;
        this.setupState.equipmentBought.mixer = true;
        this.setupState.equipmentBought.display = true;
        
        // Apply paperwork
        window.game.setupChoices.paperwork = defaultChoices.paperwork;
        this.setupState.paperworkDone.required = true;
        
        // Apply insurance
        window.game.setupChoices.insurance = defaultChoices.insurance;
        this.setupState.insuranceSelected = true;
        
        // Apply utilities
        window.game.setupChoices.utilities = defaultChoices.utilities;
        this.setupState.utilitiesSetup = true;
        
        // Apply staff
        window.game.setupChoices.staff = defaultChoices.staff;
        this.setupState.staffHired = true;
        
        // Show notification
        const notif = this.add.text(400, 100, '✅ Default settings applied to all buildings!', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '24px',
            backgroundColor: '#27ae60',
            padding: { x: 16, y: 10 },
            color: '#ffffff'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(500);
        
        this.tweens.add({
            targets: notif,
            alpha: 0,
            duration: 3000,
            delay: 1500,
            onComplete: () => notif.destroy()
        });
        
        // Check if we can show finish button now
        this.checkCompletion();
    }
}

