/**
 * Geometric_Sprite_Factory.js
 * 
 * Creates placeholder geometric sprites using Phaser's Graphics API.
 * Provides consistent colored shapes for MVP visualization.
 */

class GeometricSpriteFactory {
    constructor(scene) {
        this.scene = scene;
        
        // Color palette
        this.colors = {
            // Interactive zones
            storage: 0x3b82f6,      // Blue
            waste: 0xef4444,        // Red
            display: 0x10b981,      // Green
            production: 0xf59e0b,   // Orange
            
            // Ingredients
            flour: 0xfef3c7,        // Light yellow
            butter: 0xfde047,       // Yellow
            sugar: 0xffffff,        // White
            eggs: 0xfcd34d,         // Golden
            yeast: 0xd4d4d4,        // Gray
            chocolate: 0x78350f,    // Dark brown
            
            // Products
            bread: 0xd97706,        // Brown
            pastry: 0xfbbf24,       // Light brown
            cookie: 0xfbbf24,       // Tan
            cake: 0xfecaca,         // Pink
            
            // UI
            button: 0x7c3aed,       // Purple
            panel: 0x1f2937,        // Dark gray
            text: 0xffffff,         // White
            highlight: 0xfde68a     // Yellow highlight
        };
    }
    
    /**
     * Create storage room sprite (blue rectangle)
     */
    createStorageZone(x, y, width = 120, height = 100) {
        const container = this.scene.add.container(x, y);
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(this.colors.storage, 1);
        graphics.fillRoundedRect(0, 0, width, height, 10);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeRoundedRect(0, 0, width, height, 10);
        
        container.add(graphics);
        
        const label = this.scene.add.text(width / 2, height / 2, 'STORAGE\nROOM', {
            fontFamily: 'Arial',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add(label);
        
        container.setSize(width, height);
        container.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, width, height),
            Phaser.Geom.Rectangle.Contains
        );
        
        return container;
    }
    
    /**
     * Create waste bin sprite (red circle)
     */
    createWasteBin(x, y, radius = 40) {
        const container = this.scene.add.container(x, y);
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(this.colors.waste, 1);
        graphics.fillCircle(0, 0, radius);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeCircle(0, 0, radius);
        
        container.add(graphics);
        
        const label = this.scene.add.text(0, 0, 'WASTE', {
            fontFamily: 'Arial',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add(label);
        
        container.setSize(radius * 2, radius * 2);
        container.setInteractive(
            new Phaser.Geom.Circle(0, 0, radius),
            Phaser.Geom.Circle.Contains
        );
        
        return container;
    }
    
    /**
     * Create display case sprite (green rectangle)
     */
    createDisplayCase(x, y, width = 200, height = 80) {
        const container = this.scene.add.container(x, y);
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(this.colors.display, 1);
        graphics.fillRoundedRect(0, 0, width, height, 10);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeRoundedRect(0, 0, width, height, 10);
        
        container.add(graphics);
        
        const label = this.scene.add.text(width / 2, height / 2, 'DISPLAY CASE', {
            fontFamily: 'Arial',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add(label);
        
        container.setSize(width, height);
        container.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, width, height),
            Phaser.Geom.Rectangle.Contains
        );
        
        return container;
    }
    
    /**
     * Create production area sprite (orange rectangle)
     */
    createProductionZone(x, y, width = 150, height = 100) {
        const container = this.scene.add.container(x, y);
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(this.colors.production, 1);
        graphics.fillRoundedRect(0, 0, width, height, 10);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeRoundedRect(0, 0, width, height, 10);
        
        container.add(graphics);
        
        const label = this.scene.add.text(width / 2, height / 2, 'PRODUCTION\nAREA', {
            fontFamily: 'Arial',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add(label);
        
        container.setSize(width, height);
        container.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, width, height),
            Phaser.Geom.Rectangle.Contains
        );
        
        return container;
    }
    
    /**
     * Create interactive button
     */
    createButton(x, y, text, width = 120, height = 40) {
        const container = this.scene.add.container(x, y);
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(this.colors.button, 1);
        graphics.fillRoundedRect(0, 0, width, height, 8);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeRoundedRect(0, 0, width, height, 8);
        
        container.add(graphics);
        
        const label = this.scene.add.text(width / 2, height / 2, text, {
            fontFamily: 'Arial',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add(label);
        
        container.setSize(width, height);
        container.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, width, height),
            Phaser.Geom.Rectangle.Contains
        );
        
        // Hover effect
        container.on('pointerover', () => {
            graphics.clear();
            graphics.fillStyle(this.colors.highlight, 1);
            graphics.fillRoundedRect(0, 0, width, height, 8);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.strokeRoundedRect(0, 0, width, height, 8);
        });
        
        container.on('pointerout', () => {
            graphics.clear();
            graphics.fillStyle(this.colors.button, 1);
            graphics.fillRoundedRect(0, 0, width, height, 8);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.strokeRoundedRect(0, 0, width, height, 8);
        });
        
        return container;
    }
    
    /**
     * Create info panel background
     */
    createPanel(x, y, width = 300, height = 200) {
        const container = this.scene.add.container(x, y);
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(this.colors.panel, 0.9);
        graphics.fillRoundedRect(0, 0, width, height, 10);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeRoundedRect(0, 0, width, height, 10);
        
        container.add(graphics);
        
        return container;
    }
    
    /**
     * Create ingredient icon (small colored square)
     */
    createIngredientIcon(ingredientType, size = 30) {
        const container = this.scene.add.container(0, 0);
        
        const color = this.colors[ingredientType] || 0xcccccc;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, size, size);
        graphics.lineStyle(1, 0x000000, 1);
        graphics.strokeRect(0, 0, size, size);
        
        container.add(graphics);
        
        const label = this.scene.add.text(size / 2, size / 2, ingredientType.substring(0, 3).toUpperCase(), {
            fontFamily: 'Arial',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add(label);
        
        return container;
    }
    
    /**
     * Create product icon (small colored circle)
     */
    createProductIcon(productType, size = 35) {
        const container = this.scene.add.container(0, 0);
        
        const color = this.colors[productType] || 0xcccccc;
        const radius = size / 2;
        
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(radius, radius, radius);
        graphics.lineStyle(1, 0x000000, 1);
        graphics.strokeCircle(radius, radius, radius);
        
        container.add(graphics);
        
        const label = this.scene.add.text(radius, radius, productType.substring(0, 3).toUpperCase(), {
            fontFamily: 'Arial',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add(label);
        
        return container;
    }
    
    /**
     * Create freshness indicator bar
     */
    createFreshnessBar(x, y, width = 100, height = 12, percentage = 100) {
        const container = this.scene.add.container(x, y);
        
        // Background
        const bgGraphics = this.scene.add.graphics();
        bgGraphics.fillStyle(0x444444, 1);
        bgGraphics.fillRect(0, 0, width, height);
        
        container.add(bgGraphics);
        
        // Foreground bar (color based on percentage)
        const fgGraphics = this.scene.add.graphics();
        let barColor;
        if (percentage > 60) {
            barColor = 0x10b981; // Green
        } else if (percentage > 30) {
            barColor = 0xf59e0b; // Orange
        } else {
            barColor = 0xef4444; // Red
        }
        
        fgGraphics.fillStyle(barColor, 1);
        fgGraphics.fillRect(0, 0, width * (percentage / 100), height);
        
        container.add(fgGraphics);
        
        // Store graphics for updates
        container.bgGraphics = bgGraphics;
        container.fgGraphics = fgGraphics;
        container.maxWidth = width;
        container.barHeight = height;
        
        return container;
    }
    
    /**
     * Update freshness bar percentage
     */
    updateFreshnessBar(container, percentage) {
        percentage = Math.max(0, Math.min(100, percentage));
        
        let barColor;
        if (percentage > 60) {
            barColor = 0x10b981;
        } else if (percentage > 30) {
            barColor = 0xf59e0b;
        } else {
            barColor = 0xef4444;
        }
        
        container.fgGraphics.clear();
        container.fgGraphics.fillStyle(barColor, 1);
        container.fgGraphics.fillRect(0, 0, container.maxWidth * (percentage / 100), container.barHeight);
    }
    
    /**
     * Create customer sprite (simple geometric person)
     */
    createCustomer(x, y) {
        const container = this.scene.add.container(x, y);
        
        const graphics = this.scene.add.graphics();
        
        // Head (circle)
        graphics.fillStyle(0xfbbf24, 1);
        graphics.fillCircle(0, -15, 10);
        
        // Body (rectangle)
        graphics.fillStyle(0x3b82f6, 1);
        graphics.fillRect(-8, -5, 16, 20);
        
        // Legs (two rectangles)
        graphics.fillStyle(0x1e3a8a, 1);
        graphics.fillRect(-7, 15, 6, 15);
        graphics.fillRect(1, 15, 6, 15);
        
        container.add(graphics);
        
        return container;
    }
    
    /**
     * Create floor tile background
     */
    createFloorBackground(x, y, width, height) {
        const container = this.scene.add.container(x, y);
        
        const graphics = this.scene.add.graphics();
        
        // Checkerboard pattern
        const tileSize = 40;
        for (let row = 0; row < Math.ceil(height / tileSize); row++) {
            for (let col = 0; col < Math.ceil(width / tileSize); col++) {
                const color = (row + col) % 2 === 0 ? 0xe5e7eb : 0xd1d5db;
                graphics.fillStyle(color, 1);
                graphics.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
            }
        }
        
        container.add(graphics);
        
        return container;
    }
}

// Export for use in other files
window.GeometricSpriteFactory = GeometricSpriteFactory;
