/**
 * ModeHubScene.js
 * Free-roam hub allowing the player to walk to the mode they want (Buy, Bake, Sell, Summary).
 * Uses Phaser graphics for non-emoji shapes and GSAP-like tweens via Phaser tweens.
 */

class ModeHubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ModeHubScene' });
        this.player = null;
        this.cursors = null;
        this.wasd = null;
        this.currentPad = null;
        this.interactionText = null;
        this.isInteracting = false;
        this.pads = [];
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Player texture (simple chef silhouette)
        const pg = this.make.graphics({ x: 0, y: 0, add: false });
        pg.fillStyle(0xffffff);
        pg.fillCircle(16, 10, 8); // hat
        pg.fillStyle(0x2980b9);
        pg.fillRoundedRect(8, 18, 16, 22, 6); // torso
        pg.generateTexture('hub_player', 32, 40);

        // Ground tile
        const gg = this.make.graphics({ x: 0, y: 0, add: false });
        gg.fillStyle(0x1f2a30);
        gg.fillRect(0, 0, 64, 64);
        gg.lineStyle(1, 0x233540, 0.4);
        gg.strokeRect(4, 4, 56, 56);
        gg.generateTexture('hub_ground', 64, 64);

        // Hex pad texture generator
        const makePad = (key, color) => {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(color, 1);
            const size = 90;
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = Phaser.Math.DegToRad(60 * i - 30);
                points.push(new Phaser.Math.Vector2(100 + size * Math.cos(angle), 100 + size * Math.sin(angle)));
            }
            g.beginPath();
            g.moveTo(points[0].x, points[0].y);
            points.forEach(p => g.lineTo(p.x, p.y));
            g.closePath();
            g.fillPath();
            // Inner ring
            g.lineStyle(8, 0xffffff, 0.18);
            g.beginPath();
            g.moveTo(points[0].x, points[0].y);
            points.forEach(p => g.lineTo(p.x, p.y));
            g.closePath();
            g.strokePath();
            g.generateTexture(key, 200, 200);
        };

        makePad('pad_buy', 0x2ecc71);
        makePad('pad_bake', 0xe67e22);
        makePad('pad_sell', 0x9b59b6);
        makePad('pad_summary', 0x3498db);
    }

    create() {
        // World bounds
        this.cameras.main.setBackgroundColor('#11161c');
        this.physics.world.setBounds(0, 0, 1000, 720);

        // Ground
        this.add.tileSprite(500, 360, 1000, 720, 'hub_ground');

        // Player
        this.player = this.physics.add.sprite(500, 360, 'hub_player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(5);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E
        });

        // Pads data
        const padData = [
            { key: 'pad_buy', label: 'BUY', mode: 'buying', x: 250, y: 260, desc: 'Stock inventory' },
            { key: 'pad_bake', label: 'BAKE', mode: 'baking', x: 750, y: 260, desc: 'Produce goods' },
            { key: 'pad_sell', label: 'SELL', mode: 'selling', x: 250, y: 520, desc: 'Open shop' },
            { key: 'pad_summary', label: 'SUMMARY', mode: 'summary', x: 750, y: 520, desc: 'Review stats' }
        ];

        padData.forEach(data => this.createPad(data));

        // Interaction hint
        this.interactionText = this.add.text(500, 680, '', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setVisible(false).setDepth(10);

        // HUD text
        this.add.text(20, 20, 'Walk to a pad and press E to enter a mode', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            color: '#dfe6e9'
        }).setDepth(10);
    }

    createPad({ key, label, mode, x, y, desc }) {
        const pad = this.add.image(x, y, key).setInteractive({ useHandCursor: true });
        pad.setDepth(1);

        // Floating label
        const text = this.add.text(x, y, label, {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '22px',
            fontStyle: '700',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(2);

        // Description
        const sub = this.add.text(x, y + 26, desc, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#ecf0f1'
        }).setOrigin(0.5).setAlpha(0.8).setDepth(2);

        // Glow tween
        this.tweens.add({
            targets: pad,
            scale: { from: 1, to: 1.05 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Physics zone for proximity detection
        const zone = this.add.zone(x, y, 180, 180);
        this.physics.world.enable(zone);
        zone.body.setAllowGravity(false);
        zone.body.moves = false;
        zone.padData = { mode, label };

        this.physics.add.overlap(this.player, zone, () => {
            this.currentPad = zone.padData;
        });

        this.pads.push({ pad, text, sub, zone });
    }

    update() {
        if (this.isInteracting) {
            this.player.setVelocity(0);
            return;
        }

        // Movement
        const speed = 220;
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

        // Interaction prompt
        if (this.currentPad) {
            this.interactionText.setText(`Press E to enter ${this.currentPad.label}`);
            this.interactionText.setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.wasd.interact)) {
                this.enterMode(this.currentPad.mode);
            }
        } else {
            this.interactionText.setVisible(false);
        }

        // Reset for next frame; overlap will set if still inside
        this.currentPad = null;
    }

    enterMode(mode) {
        if (this.isInteracting) return;
        this.isInteracting = true;

        // Simple fade out
        this.tweens.add({
            targets: [this.player, ...this.pads.map(p => p.pad)],
            alpha: 0,
            duration: 300,
            onComplete: () => {
                if (window.game && typeof window.game.enterPhaseFromHub === 'function') {
                    window.game.enterPhaseFromHub(mode);
                }
            }
        });
    }
}
