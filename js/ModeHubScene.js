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
        makePad('pad_recipe', 0xf1c40f);

        this.createPadShadowTexture();
        this.createGlowTexture('hub_glow', 0xfad87a);
        this.createGlowTexture('hub_glow_cool', 0x6ddcff);
    }

    createGlowTexture(key, tint = 0xffffff) {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        const radius = 64;
        for (let i = 0; i < 6; i++) {
            gfx.fillStyle(tint, 0.2 - (i * 0.03));
            gfx.fillCircle(radius, radius, radius - i * 10);
        }
        gfx.generateTexture(key, radius * 2, radius * 2);
    }

    createPadShadowTexture() {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(0x000000, 0.6);
        gfx.fillEllipse(110, 60, 200, 70);
        gfx.generateTexture('pad_shadow', 220, 120);
    }

    createBackgroundLayers() {
        const gradient = this.add.graphics({ x: 0, y: 0 });
        const top = Phaser.Display.Color.HexStringToColor('#04060f');
        const bottom = Phaser.Display.Color.HexStringToColor('#1c0f1b');
        const steps = 180;
        for (let i = 0; i <= steps; i++) {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, steps, i);
            gradient.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
            gradient.fillRect(0, (i / steps) * 720, 1000, 720 / steps);
        }
        gradient.setDepth(-5);

        const skyline = this.add.graphics();
        skyline.setDepth(-4);
        const palette = [0x0a0f1a, 0x0f1322, 0x1a1730];
        for (let i = 0; i < 18; i++) {
            const width = Phaser.Math.Between(30, 90);
            const height = Phaser.Math.Between(80, 180);
            const x = i * 60 + Phaser.Math.Between(-20, 20);
            const y = 260 - height;
            skyline.fillStyle(palette[i % palette.length], 0.95);
            skyline.fillRect(x, y, width, height);
        }

        const grid = this.add.graphics();
        grid.lineStyle(1, 0x1b2a3b, 0.35);
        const horizonY = 220;
        const floorY = 620;
        for (let i = -12; i <= 12; i++) {
            grid.beginPath();
            grid.moveTo(500 + i * 35, horizonY);
            grid.lineTo(500 + i * 90, floorY);
            grid.strokePath();
        }

        for (let i = 0; i <= 14; i++) {
            const t = i / 14;
            const y = horizonY + (floorY - horizonY) * t;
            grid.beginPath();
            grid.moveTo(150 - t * 80, y);
            grid.lineTo(850 + t * 80, y);
            grid.strokePath();
        }
        grid.setDepth(0.05);

        const sun = this.add.image(240, 120, 'hub_glow').setDepth(-3).setBlendMode(Phaser.BlendModes.ADD).setScale(2.3).setAlpha(0.45);
        this.tweens.add({
            targets: sun,
            alpha: { from: 0.35, to: 0.6 },
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }

    createAmbientParticles() {
        this.ambientSprites = [];
        for (let i = 0; i < 30; i++) {
            const sprite = this.add.image(
                Phaser.Math.Between(0, 1000),
                Phaser.Math.Between(0, 720),
                'hub_glow_cool'
            )
                .setBlendMode(Phaser.BlendModes.ADD)
                .setScale(Phaser.Math.FloatBetween(0.25, 0.55))
                .setAlpha(Phaser.Math.FloatBetween(0.15, 0.4))
                .setDepth(-1 + Math.random() * 0.2);

            const driftX = sprite.x + Phaser.Math.Between(-50, 50);
            const driftY = sprite.y + Phaser.Math.Between(-30, 30);

            this.tweens.add({
                targets: sprite,
                x: driftX,
                y: driftY,
                alpha: { from: sprite.alpha, to: sprite.alpha * 0.35 },
                duration: Phaser.Math.Between(4000, 6500),
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
                delay: i * 60
            });

            this.ambientSprites.push(sprite);
        }
    }

    highlightPad(pad, shadow, glow, text, sub) {
        this.tweens.add({ targets: pad, scale: 1.1, duration: 200, ease: 'sine.out' });
        if (shadow) {
            this.tweens.add({ targets: shadow, scaleX: shadow.baseScaleX * 1.15, alpha: 0.9, duration: 200, ease: 'sine.out' });
        }
        if (glow) {
            this.tweens.add({ targets: glow, alpha: 0.75, scaleX: glow.baseScale * 1.1, scaleY: glow.baseScale * 1.1, duration: 200, ease: 'sine.out' });
        }
        if (text) {
            this.tweens.add({ targets: text, y: text.baseY - 6, duration: 200, ease: 'sine.out' });
        }
        if (sub) {
            this.tweens.add({ targets: sub, y: sub.baseY - 4, duration: 200, ease: 'sine.out', alpha: 1 });
        }
    }

    resetPad(pad, shadow, glow, text, sub) {
        this.tweens.add({ targets: pad, scale: 1, duration: 200, ease: 'sine.out' });
        if (shadow) {
            this.tweens.add({ targets: shadow, scaleX: shadow.baseScaleX, alpha: shadow.baseAlpha, duration: 200, ease: 'sine.out' });
        }
        if (glow) {
            this.tweens.add({ targets: glow, alpha: glow.baseAlpha, scaleX: glow.baseScale, scaleY: glow.baseScale, duration: 200, ease: 'sine.out' });
        }
        if (text) {
            this.tweens.add({ targets: text, y: text.baseY, duration: 200, ease: 'sine.out' });
        }
        if (sub) {
            this.tweens.add({ targets: sub, y: sub.baseY, duration: 200, ease: 'sine.out', alpha: 0.8 });
        }
    }

    create() {
        // World bounds
        this.cameras.main.setBackgroundColor('#05060b');
        this.physics.world.setBounds(0, 0, 1000, 720);

        this.createBackgroundLayers();

        // Ground
        const ground = this.add.tileSprite(500, 360, 1000, 720, 'hub_ground');
        ground.setTint(0x0f1824);
        ground.setDepth(0.1);

        this.createAmbientParticles();

        this.add.rectangle(500, 420, 880, 240, 0xffffff, 0.05)
            .setDepth(0.2)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.add.image(500, 430, 'pad_shadow')
            .setScale(3.6, 1.5)
            .setAlpha(0.3)
            .setDepth(0.15);
        this.add.image(500, 420, 'hub_glow_cool')
            .setScale(2.8)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0.25)
            .setDepth(0.25);

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
            { key: 'pad_summary', label: 'SUMMARY', mode: 'summary', x: 750, y: 520, desc: 'Review stats' },
            { key: 'pad_recipe', label: 'RECIPES', mode: 'recipes', x: 500, y: 120, desc: 'Design custom bakes' }
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
        const shadow = this.add.image(x, y + 70, 'pad_shadow')
            .setDepth(0.3)
            .setScale(1, 0.8)
            .setAlpha(0.65);
        shadow.baseScaleX = shadow.scaleX;
        shadow.baseAlpha = shadow.alpha;

        const pad = this.add.image(x, y, key).setInteractive({ useHandCursor: true });
        pad.setDepth(1.2);

        const glow = this.add.image(x, y, 'hub_glow')
            .setScale(0.7)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0.4)
            .setDepth(1);
        glow.baseScale = glow.scaleX;
        glow.baseAlpha = glow.alpha;

        // Floating label
        const text = this.add.text(x, y, label, {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '22px',
            fontStyle: '700',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(2);
        text.baseY = y;

        // Description
        const sub = this.add.text(x, y + 26, desc, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#ecf0f1'
        }).setOrigin(0.5).setAlpha(0.8).setDepth(2);
        sub.baseY = y + 26;

        // Glow tween
        this.tweens.add({
            targets: pad,
            scale: { from: 1, to: 1.05 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        this.tweens.add({
            targets: glow,
            alpha: { from: 0.35, to: 0.6 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        pad.on('pointerover', () => this.highlightPad(pad, shadow, glow, text, sub));
        pad.on('pointerout', () => this.resetPad(pad, shadow, glow, text, sub));

        // Physics zone for proximity detection
        const zone = this.add.zone(x, y, 180, 180);
        this.physics.world.enable(zone);
        zone.body.setAllowGravity(false);
        zone.body.moves = false;
        zone.padData = { mode, label };

        this.physics.add.overlap(this.player, zone, () => {
            this.currentPad = zone.padData;
        });

        this.pads.push({ pad, text, sub, zone, glow, shadow });
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
        const fadeTargets = [
            this.player,
            ...this.pads.flatMap(p => [p.pad, p.text, p.sub, p.glow])
        ].filter(Boolean);
        this.tweens.add({
            targets: fadeTargets,
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
