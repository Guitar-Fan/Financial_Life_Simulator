/**
 * Bakery_Startup_Sequence.js
 * Handles the Pre-Operational Capital Setup Phase using Phaser 3.
 * Features free-roaming city navigation and interactive stations.
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
        
        // Setup state tracking
        this.setupState = {
            locationSelected: false,
            paperworkDone: false,
            equipmentBought: false,
            staffHired: false
        };
    }

    preload() {
        // Generate procedural textures since we don't have assets
        this.createTextures();
    }

    createTextures() {
        // 1. Player Texture
        const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
        playerGfx.fillStyle(0xffffff); // White chef hat
        playerGfx.fillCircle(16, 10, 8);
        playerGfx.fillStyle(0x3498db); // Blue shirt
        playerGfx.fillRect(8, 18, 16, 20);
        playerGfx.generateTexture('player', 32, 40);

        // 2. Building Textures
        const createBuilding = (key, color, label) => {
            const gfx = this.make.graphics({ x: 0, y: 0, add: false });
            gfx.fillStyle(color);
            gfx.fillRect(0, 0, 120, 100);
            // Door
            gfx.fillStyle(0x2c3e50);
            gfx.fillRect(45, 60, 30, 40);
            // Windows
            gfx.fillStyle(0xecf0f1);
            gfx.fillRect(15, 20, 25, 25);
            gfx.fillRect(80, 20, 25, 25);
            // Roof
            gfx.fillStyle(0x2c3e50);
            gfx.beginPath();
            gfx.moveTo(-10, 0);
            gfx.lineTo(60, -40);
            gfx.lineTo(130, 0);
            gfx.fill();
            
            gfx.generateTexture(key, 120, 100);
        };

        createBuilding('gov_office', 0x95a5a6, 'City Hall');
        createBuilding('real_estate', 0xe67e22, 'Realty');
        createBuilding('supply_store', 0xe74c3c, 'Supplies');
        createBuilding('recruitment', 0x9b59b6, 'Jobs');

        // 3. Ground Texture
        const groundGfx = this.make.graphics({ x: 0, y: 0, add: false });
        groundGfx.fillStyle(0x27ae60); // Grass
        groundGfx.fillRect(0, 0, 64, 64);
        groundGfx.fillStyle(0x2ecc71); // Lighter grass pattern
        groundGfx.fillCircle(32, 32, 10);
        groundGfx.generateTexture('grass', 64, 64);
        
        // 4. Road Texture
        const roadGfx = this.make.graphics({ x: 0, y: 0, add: false });
        roadGfx.fillStyle(0x34495e); // Asphalt
        roadGfx.fillRect(0, 0, 64, 64);
        roadGfx.fillStyle(0xf1c40f); // Line
        roadGfx.fillRect(30, 10, 4, 44);
        roadGfx.generateTexture('road', 64, 64);
    }

    create() {
        // --- Environment ---
        // Tiled background
        this.add.tileSprite(400, 300, 800, 600, 'grass');
        
        // Roads
        this.add.tileSprite(400, 300, 800, 64, 'road').setAngle(0); // Horizontal main road
        this.add.tileSprite(400, 300, 64, 600, 'road').setAngle(0); // Vertical main road

        // --- Player ---
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        
        // Collisions
        // --- Buildings ---
        this.buildings = this.physics.add.staticGroup();

        // Real Estate (Top Left)
        this.addBuilding(150, 150, 'real_estate', 'Real Estate', () => this.openRealEstate());
        
        // Government (Top Right)
        this.addBuilding(650, 150, 'gov_office', 'City Hall', () => this.openGovernment());
        
        // Supply Store (Bottom Left)
        this.addBuilding(150, 450, 'supply_store', 'Supplies', () => this.openSupplies());
        
        // Recruitment (Bottom Right)
        this.addBuilding(650, 450, 'recruitment', 'Hiring', () => this.openRecruitment());

        this.physics.add.collider(this.player, this.buildings);

        // --- UI ---
        this.interactionText = this.add.text(400, 550, '', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '20px',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 },
            color: '#ffffff'
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        // Instructions
        this.add.text(10, 10, 'WASD to Move | E to Interact', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // Capital Display
        this.capitalText = this.add.text(790, 10, `Capital: $${window.game.engine.cash.toFixed(0)}`, {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '20px',
            color: '#2ecc71',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0);

        // --- Controls ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E
        });
        
        // --- Tutorial Prompt ---
        this.showTutorialPrompt("Welcome to Startup City! Visit the Real Estate Agency first to choose a location.");
    }

    addBuilding(x, y, key, label, callback) {
        const building = this.buildings.create(x, y, key);
        building.refreshBody(); // Update physics body
        
        // Label
        this.add.text(x, y - 60, label, {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Interaction Zone (Invisible circle around door)
        const zone = this.add.zone(x, y + 30, 100, 100);
        this.physics.add.existing(zone);
        
        this.physics.add.overlap(this.player, zone, () => {
            this.currentZone = { label, callback };
        });
    }

    update() {
        if (this.isInteracting) {
            this.player.setVelocity(0);
            return;
        }

        // Movement
        const speed = 200;
        this.player.setVelocity(0);

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed);
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.setVelocityY(speed);
        }

        // Interaction Check
        if (this.currentZone) {
            this.interactionText.setText(`Press E to enter ${this.currentZone.label}`);
            this.interactionText.setVisible(true);
            
            if (Phaser.Input.Keyboard.JustDown(this.wasd.interact)) {
                this.currentZone.callback();
            }
            
            // Reset if player moves away (handled by overlap not firing next frame)
            // Actually, overlap fires every frame. We need to clear currentZone at start of update
            // But since we set it in overlap callback which happens during physics step...
            // Better approach: Clear it here, and let overlap re-set it.
        } else {
            this.interactionText.setVisible(false);
        }
        
        // Reset zone for next frame
        this.currentZone = null;
        
        // Update Capital UI
        this.capitalText.setText(`Capital: $${window.game.engine.cash.toFixed(0)}`);
    }

    // --- Interaction Handlers ---

    openRealEstate() {
        this.openModal('Real Estate Agency', `
            <div class="setup-grid">
                ${GAME_CONFIG.SETUP_OPTIONS.locations.map(loc => `
                    <div class="setup-card ${window.game.setupChoices.location?.id === loc.id ? 'selected' : ''}" 
                         onclick="window.game.selectSetup('location', '${loc.id}'); document.getElementById('modal-close').click();">
                        <div class="setup-icon">${loc.icon}</div>
                        <div class="setup-name">${loc.name}</div>
                        <div class="setup-desc">${loc.description}</div>
                        <div class="setup-price">Rent: $${loc.rent}/day</div>
                    </div>
                `).join('')}
            </div>
        `, () => {
            this.setupState.locationSelected = !!window.game.setupChoices.location;
            if (this.setupState.locationSelected) {
                this.showTutorialPrompt("Great choice! Now head to City Hall to get your permits.");
            }
        });
    }

    openGovernment() {
        if (!this.setupState.locationSelected) {
            this.showTutorialPrompt("You need a location address before applying for permits! Go to Real Estate first.");
            return;
        }

        this.openModal('City Hall - Permits', `
            <div class="setup-grid">
                ${GAME_CONFIG.SETUP_OPTIONS.paperwork.map(p => `
                    <div class="setup-card ${window.game.setupChoices.paperwork.includes(p.id) ? 'selected' : ''}" 
                         onclick="window.game.selectSetup('paperwork', '${p.id}'); this.classList.toggle('selected');">
                        <div class="setup-icon">${p.icon}</div>
                        <div class="setup-name">${p.name}</div>
                        <div class="setup-price">Cost: $${p.cost}</div>
                    </div>
                `).join('')}
            </div>
            <button class="action-btn primary" style="margin-top: 20px; width: 100%;" onclick="document.getElementById('modal-close').click()">Done</button>
        `, () => {
            const allPermits = window.game.setupChoices.paperwork.length === GAME_CONFIG.SETUP_OPTIONS.paperwork.length;
            this.setupState.paperworkDone = allPermits;
            if (allPermits) {
                this.showTutorialPrompt("Legally compliant! Now go to the Supply Store to buy equipment.");
            }
        });
    }

    openSupplies() {
        if (!this.setupState.paperworkDone) {
            this.showTutorialPrompt("You can't buy industrial equipment without a permit! Go to City Hall.");
            return;
        }

        // Tutorial: Force Basic Oven first
        const isTutorial = true; // Could check game state
        
        this.openModal('Kitchen Supplies', `
            <div class="setup-grid">
                ${GAME_CONFIG.SETUP_OPTIONS.equipment.map(e => `
                    <div class="setup-card ${window.game.setupChoices.equipment?.id === e.id ? 'selected' : ''}" 
                         onclick="window.game.selectSetup('equipment', '${e.id}'); document.getElementById('modal-close').click();">
                        <div class="setup-icon">${e.icon}</div>
                        <div class="setup-name">${e.name}</div>
                        <div class="setup-desc">${e.description}</div>
                        <div class="setup-price">Cost: $${e.cost}</div>
                        ${isTutorial && e.id === 'pro' ? '<div style="color:red; font-size:10px;">Locked (Tutorial)</div>' : ''}
                    </div>
                `).join('')}
            </div>
        `, () => {
            this.setupState.equipmentBought = !!window.game.setupChoices.equipment;
            if (this.setupState.equipmentBought) {
                this.showTutorialPrompt("You're all set! You can hire staff or Open Bakery now.");
                this.checkCompletion();
            }
        });
    }

    openRecruitment() {
        this.openModal('Recruitment Agency', `
            <div class="setup-grid">
                ${GAME_CONFIG.SETUP_OPTIONS.staff.map(s => `
                    <div class="setup-card ${window.game.setupChoices.staff?.id === s.id ? 'selected' : ''}" 
                         onclick="window.game.selectSetup('staff', '${s.id}'); document.getElementById('modal-close').click();">
                        <div class="setup-icon">${s.icon}</div>
                        <div class="setup-name">${s.name}</div>
                        <div class="setup-desc">${s.description}</div>
                        <div class="setup-price">Cost: $${s.cost}</div>
                    </div>
                `).join('')}
            </div>
        `, () => {
            this.setupState.staffHired = !!window.game.setupChoices.staff;
            this.checkCompletion();
        });
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
            // Add a "Open Bakery" button to the UI
            if (!this.finishBtn) {
                this.finishBtn = this.add.text(400, 500, 'OPEN BAKERY', {
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '32px',
                    backgroundColor: '#2ecc71',
                    padding: { x: 20, y: 10 },
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                })
                .setOrigin(0.5)
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
}
