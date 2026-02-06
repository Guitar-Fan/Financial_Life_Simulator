/**
 * StoryBookScene.js
 * Interactive storybook for business startup education
 * Each spread (2 pages) covers a key business concept with narrative + interaction
 */

class StoryBookScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoryBookScene' });
        
        // Book state
        this.currentChapter = 0;
        this.currentPage = 0;
        this.isAnimating = false;
        this.setupChoices = {
            niche: null,
            businessName: null,
            businessStructure: null,
            location: null,
            financing: null,
            equipment: { oven: null, mixer: null, display: null },
            permits: [],
            insurance: null,
            staff: null,
            marketing: null
        };
        this.budget = {
            starting: 50000,
            spent: 0,
            allocated: {}
        };
        
        // Chapter definitions
        this.chapters = [
            {
                id: 'intro',
                title: 'Your Bakery Dream',
                icon: '🌟',
                pages: [
                    { type: 'narrative', title: 'The Beginning' },
                    { type: 'interactive', title: 'Choose Your Path' }
                ]
            },
            {
                id: 'planning',
                title: 'Planning & Concept',
                icon: '📋',
                pages: [
                    { type: 'narrative', title: 'Finding Your Niche' },
                    { type: 'interactive', title: 'Business Model Selection' },
                    { type: 'narrative', title: 'The Business Plan' },
                    { type: 'interactive', title: 'Name Your Business' },
                    { type: 'narrative', title: 'Pricing Your Products' },
                    { type: 'interactive', title: 'Pricing Calculator' }
                ]
            },
            {
                id: 'legal',
                title: 'Legal & Regulatory',
                icon: '⚖️',
                pages: [
                    { type: 'narrative', title: 'Getting Official' },
                    { type: 'interactive', title: 'Business Structure' },
                    { type: 'narrative', title: 'Permits & Licenses' },
                    { type: 'interactive', title: 'Permit Checklist' },
                    { type: 'narrative', title: 'Protecting Your Business' },
                    { type: 'interactive', title: 'Insurance Selection' }
                ]
            },
            {
                id: 'operations',
                title: 'Operations & Setup',
                icon: '🏪',
                pages: [
                    { type: 'narrative', title: 'Finding Your Space' },
                    { type: 'interactive', title: 'Location Selection' },
                    { type: 'narrative', title: 'Equipping Your Kitchen' },
                    { type: 'interactive', title: 'Equipment Shopping' },
                    { type: 'narrative', title: 'Financing Options' },
                    { type: 'interactive', title: 'Funding Your Dream' }
                ]
            },
            {
                id: 'launch',
                title: 'Branding & Launch',
                icon: '🚀',
                pages: [
                    { type: 'narrative', title: 'Building Your Brand' },
                    { type: 'interactive', title: 'Brand Identity' },
                    { type: 'narrative', title: 'Marketing Strategy' },
                    { type: 'interactive', title: 'Marketing Budget' },
                    { type: 'narrative', title: 'The Grand Opening' },
                    { type: 'interactive', title: 'Launch Day!' }
                ]
            }
        ];
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Book cover texture
        const coverGfx = this.make.graphics({ x: 0, y: 0, add: false });
        coverGfx.fillStyle(0x8B4513);
        coverGfx.fillRoundedRect(0, 0, 100, 140, 8);
        coverGfx.fillStyle(0xD4A574);
        coverGfx.fillRoundedRect(5, 5, 90, 130, 6);
        coverGfx.generateTexture('book_cover', 100, 140);

        // Page texture
        const pageGfx = this.make.graphics({ x: 0, y: 0, add: false });
        pageGfx.fillStyle(0xFFFEF5);
        pageGfx.fillRect(0, 0, 400, 500);
        // Add subtle lines
        pageGfx.lineStyle(1, 0xE8E4D9, 0.3);
        for (let i = 0; i < 20; i++) {
            pageGfx.lineBetween(20, 60 + i * 22, 380, 60 + i * 22);
        }
        pageGfx.generateTexture('book_page', 400, 500);

        // Chapter tab
        const tabGfx = this.make.graphics({ x: 0, y: 0, add: false });
        tabGfx.fillStyle(0xD4A574);
        tabGfx.fillRoundedRect(0, 0, 50, 80, { tl: 0, tr: 10, bl: 0, br: 10 });
        tabGfx.generateTexture('chapter_tab', 50, 80);

        // Navigation arrow
        const arrowGfx = this.make.graphics({ x: 0, y: 0, add: false });
        arrowGfx.fillStyle(0x8B4513);
        arrowGfx.fillTriangle(0, 20, 30, 0, 30, 40);
        arrowGfx.generateTexture('arrow_left', 30, 40);
        
        const arrowRightGfx = this.make.graphics({ x: 0, y: 0, add: false });
        arrowRightGfx.fillStyle(0x8B4513);
        arrowRightGfx.fillTriangle(30, 20, 0, 0, 0, 40);
        arrowRightGfx.generateTexture('arrow_right', 30, 40);

        // Decorative corner
        const cornerGfx = this.make.graphics({ x: 0, y: 0, add: false });
        cornerGfx.lineStyle(3, 0xC9A66B, 0.6);
        cornerGfx.beginPath();
        cornerGfx.moveTo(0, 40);
        cornerGfx.lineTo(0, 10);
        cornerGfx.arc(10, 10, 10, Math.PI, Math.PI * 1.5);
        cornerGfx.lineTo(40, 0);
        cornerGfx.strokePath();
        cornerGfx.generateTexture('page_corner', 50, 50);
    }

    create() {
        const { width, height } = this.scale;
        this.centerX = width / 2;
        this.centerY = height / 2;

        // Background
        this.createBackground();
        
        // Book structure
        this.createBook();
        
        // Chapter tabs
        this.createChapterTabs();
        
        // Navigation
        this.createNavigation();
        
        // Budget tracker (top right)
        this.createBudgetTracker();
        
        // Mentor area (bottom)
        this.createMentorArea();
        
        // Load first page
        this.loadPage(0, 0);
        
        // Keyboard navigation
        this.input.keyboard.on('keydown-LEFT', () => this.prevPage());
        this.input.keyboard.on('keydown-RIGHT', () => this.nextPage());
        this.input.keyboard.on('keydown-ESCAPE', () => this.showSkipConfirm());
        
        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);
    }
    
    handleResize(gameSize) {
        const { width, height } = gameSize;
        this.centerX = width / 2;
        this.centerY = height / 2;
        
        // Rebuild all UI elements with new dimensions
        this.rebuildUI();
    }
    
    rebuildUI() {
        // Clear existing UI
        if (this.background) this.background.destroy();
        if (this.desk) this.desk.destroy();
        if (this.glow) this.glow.destroy();
        if (this.bookSpine) this.bookSpine.destroy();
        if (this.leftPage) this.leftPage.destroy();
        if (this.rightPage) this.rightPage.destroy();
        if (this.leftContent) this.leftContent.destroy();
        if (this.rightContent) this.rightContent.destroy();
        if (this.shadow) this.shadow.destroy();
        if (this.chapterTabsContainer) this.chapterTabsContainer.destroy();
        if (this.prevBtn) this.prevBtn.destroy();
        if (this.nextBtn) this.nextBtn.destroy();
        if (this.budgetContainer) this.budgetContainer.destroy();
        if (this.mentorContainer) this.mentorContainer.destroy();
        
        // Recreate all UI with new dimensions
        this.createBackground();
        this.createBook();
        this.createChapterTabs();
        this.createNavigation();
        this.createBudgetTracker();
        this.createMentorArea();
        
        // Reload current page
        this.loadPage(this.currentChapter, this.currentPage);
    }

    createBackground() {
        const { width, height } = this.scale;
        
        // Warm gradient background (cozy reading room feel)
        this.background = this.add.graphics();
        for (let i = 0; i <= 100; i++) {
            const t = i / 100;
            const r = Math.floor(30 + t * 15);
            const g = Math.floor(20 + t * 10);
            const b = Math.floor(15 + t * 8);
            this.background.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            this.background.fillRect(0, (i / 100) * height, width, height / 100 + 1);
        }
        this.background.setDepth(-10);

        // Desk surface
        this.desk = this.add.graphics();
        this.desk.fillStyle(0x5D4037, 0.9);
        this.desk.fillRect(0, height * 0.75, width, height * 0.25);
        this.desk.lineStyle(4, 0x3E2723);
        this.desk.lineBetween(0, height * 0.75, width, height * 0.75);
        this.desk.setDepth(-5);

        // Ambient lamp glow
        this.glow = this.add.graphics();
        this.glow.fillStyle(0xFFE4B5, 0.15);
        this.glow.fillCircle(width * 0.15, height * 0.2, 150);
        this.glow.setDepth(-4);
    }

    createBook() {
        const { width, height } = this.scale;
        const bookWidth = Math.min(900, width * 0.85);
        const bookHeight = Math.min(550, height * 0.7);
        
        this.bookX = this.centerX;
        this.bookY = this.centerY - 20;
        this.bookWidth = bookWidth;
        this.bookHeight = bookHeight;

        // Book shadow
        this.shadow = this.add.graphics();
        this.shadow.fillStyle(0x000000, 0.3);
        this.shadow.fillEllipse(this.bookX, this.bookY + bookHeight / 2 + 20, bookWidth * 0.9, 40);
        this.shadow.setDepth(0);

        // Book spine
        this.bookSpine = this.add.graphics();
        this.bookSpine.fillStyle(0x8B4513);
        this.bookSpine.fillRect(this.bookX - 15, this.bookY - bookHeight / 2, 30, bookHeight);
        this.bookSpine.lineStyle(2, 0x5D3A1A);
        this.bookSpine.lineBetween(this.bookX - 15, this.bookY - bookHeight / 2, this.bookX - 15, this.bookY + bookHeight / 2);
        this.bookSpine.lineBetween(this.bookX + 15, this.bookY - bookHeight / 2, this.bookX + 15, this.bookY + bookHeight / 2);
        // Gold decoration on spine
        this.bookSpine.lineStyle(2, 0xD4AF37);
        for (let i = 0; i < 5; i++) {
            const y = this.bookY - bookHeight / 2 + 30 + i * (bookHeight - 60) / 4;
            this.bookSpine.lineBetween(this.bookX - 10, y, this.bookX + 10, y);
        }
        this.bookSpine.setDepth(3);

        // Left page (narrative)
        this.leftPage = this.createPageSurface(this.bookX - bookWidth / 4 - 10, this.bookY, bookWidth / 2 - 20, bookHeight - 20);
        
        // Right page (interactive)
        this.rightPage = this.createPageSurface(this.bookX + bookWidth / 4 + 10, this.bookY, bookWidth / 2 - 20, bookHeight - 20);

        // Page content containers with masks to clip overflow
        const pageContentWidth = bookWidth / 2 - 60; // Content width
        const pageContentHeight = bookHeight - 80; // Leave margins top and bottom
        
        this.leftContent = this.add.container(this.bookX - bookWidth / 4 - 10, this.bookY - bookHeight / 2 + 50);
        this.leftContent.setDepth(5);
        
        // Create mask for left page
        const leftMask = this.make.graphics();
        leftMask.fillStyle(0xffffff);
        leftMask.fillRect(
            this.bookX - bookWidth / 4 - 10 - pageContentWidth / 2,
            this.bookY - bookHeight / 2 + 50,
            pageContentWidth,
            pageContentHeight
        );
        this.leftContent.setMask(leftMask.createGeometryMask());
        
        this.rightContent = this.add.container(this.bookX + bookWidth / 4 + 10, this.bookY - bookHeight / 2 + 50);
        this.rightContent.setDepth(5);
        
        // Create mask for right page
        const rightMask = this.make.graphics();
        rightMask.fillStyle(0xffffff);
        rightMask.fillRect(
            this.bookX + bookWidth / 4 + 10 - pageContentWidth / 2,
            this.bookY - bookHeight / 2 + 50,
            pageContentWidth,
            pageContentHeight
        );
        this.rightContent.setMask(rightMask.createGeometryMask());
    }

    createPageSurface(x, y, w, h) {
        const page = this.add.graphics();
        
        // Page base - lighter cream for better text contrast
        page.fillStyle(0xFFFDF7); // Lighter
        page.fillRoundedRect(x - w / 2, y - h / 2, w, h, 3);
        
        // Subtle page edge shadow
        page.fillStyle(0xE8DCC7, 0.4); // Slightly darker shadow
        page.fillRect(x - w / 2, y - h / 2, 3, h);
        
        // Top decorative border - darker for visibility
        page.lineStyle(2, 0x8B4513, 0.6); // Darker brown border
        page.strokeRoundedRect(x - w / 2 + 15, y - h / 2 + 15, w - 30, h - 30, 2);
        
        page.setDepth(2);
        return page;
    }

    createChapterTabs() {
        this.chapterTabs = [];
        const startY = this.bookY - this.bookHeight / 2 + 40;
        const tabSpacing = 85;
        
        this.chapters.forEach((chapter, index) => {
            const tabX = this.bookX + this.bookWidth / 2 + 5;
            const tabY = startY + index * tabSpacing;
            
            const tab = this.add.container(tabX, tabY);
            
            // Tab background
            const bg = this.add.graphics();
            bg.fillStyle(index === this.currentChapter ? 0xFFD700 : 0xD4A574, 1); // Brighter gold
            bg.fillRoundedRect(0, 0, 55, 75, { tl: 0, tr: 12, bl: 0, br: 12 });
            bg.lineStyle(3, 0x5D3A1A); // Darker border, thicker
            bg.strokeRoundedRect(0, 0, 55, 75, { tl: 0, tr: 12, bl: 0, br: 12 });
            
            // Chapter icon
            const icon = this.add.text(27, 20, chapter.icon, {
                fontSize: '24px'
            }).setOrigin(0.5);
            
            // Chapter number
            const num = this.add.text(27, 50, `${index + 1}`, {
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#1A0F08' // Dark brown for contrast
            }).setOrigin(0.5);
            
            tab.add([bg, icon, num]);
            tab.bg = bg;
            tab.setDepth(4);
            
            // Make interactive
            const hitArea = this.add.rectangle(tabX + 27, tabY + 37, 55, 75, 0x000000, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.goToChapter(index))
                .on('pointerover', () => {
                    if (index !== this.currentChapter) {
                        this.tweens.add({ targets: tab, x: tabX - 5, duration: 150 });
                    }
                })
                .on('pointerout', () => {
                    if (index !== this.currentChapter) {
                        this.tweens.add({ targets: tab, x: tabX, duration: 150 });
                    }
                });
            
            this.chapterTabs.push({ container: tab, bg, hitArea });
        });
    }

    createNavigation() {
        const { width, height } = this.scale;
        const navY = this.bookY + this.bookHeight / 2 + 40;
        
        // Previous button
        this.prevBtn = this.add.container(this.bookX - 100, navY);
        const prevBg = this.add.graphics();
        prevBg.fillStyle(0x8B4513, 0.9);
        prevBg.fillRoundedRect(-50, -20, 100, 40, 20);
        const prevText = this.add.text(0, 0, '◀ Previous', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#FFF8E7'
        }).setOrigin(0.5);
        this.prevBtn.add([prevBg, prevText]);
        this.prevBtn.setDepth(10);
        this.prevBtn.bg = prevBg;
        
        const prevHit = this.add.rectangle(this.bookX - 100, navY, 100, 40, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.prevPage())
            .on('pointerover', () => this.tweens.add({ targets: this.prevBtn, scale: 1.1, duration: 100 }))
            .on('pointerout', () => this.tweens.add({ targets: this.prevBtn, scale: 1, duration: 100 }));

        // Next button
        this.nextBtn = this.add.container(this.bookX + 100, navY);
        const nextBg = this.add.graphics();
        nextBg.fillStyle(0xD4AF37, 0.9);
        nextBg.fillRoundedRect(-50, -20, 100, 40, 20);
        const nextText = this.add.text(0, 0, 'Next ▶', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#3E2723'
        }).setOrigin(0.5);
        this.nextBtn.add([nextBg, nextText]);
        this.nextBtn.setDepth(10);
        this.nextBtn.bg = nextBg;
        
        const nextHit = this.add.rectangle(this.bookX + 100, navY, 100, 40, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.nextPage())
            .on('pointerover', () => this.tweens.add({ targets: this.nextBtn, scale: 1.1, duration: 100 }))
            .on('pointerout', () => this.tweens.add({ targets: this.nextBtn, scale: 1, duration: 100 }));

        // Page indicator
        this.pageIndicator = this.add.text(this.bookX, navY + 40, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#8B4513' // Darker brown for better visibility
        }).setOrigin(0.5).setDepth(10);
        
        // Skip button (top right)
        const skipBtn = this.add.text(width - 20, 20, '⏭ Skip to Game', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#FFFFFF', // White text
            backgroundColor: '#1A0F08', // Dark brown background
            padding: { x: 12, y: 8 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showSkipConfirm())
            .on('pointerover', () => skipBtn.setColor('#FFD700')) // Bright gold on hover
            .on('pointerout', () => skipBtn.setColor('#FFFFFF'));
        skipBtn.setDepth(20);
    }

    createBudgetTracker() {
        const { width } = this.scale;
        
        this.budgetContainer = this.add.container(width - 20, 60);
        
        // Background panel - compact for category breakdown
        const bg = this.add.graphics();
        bg.fillStyle(0x1A0F08, 0.95); // Darker background
        bg.fillRoundedRect(-180, 0, 180, 150, 8);
        bg.lineStyle(2, 0xFFD700, 0.9); // Brighter gold border
        bg.strokeRoundedRect(-180, 0, 180, 150, 8);
        
        // Title
        const title = this.add.text(-90, 10, '💰 Budget', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#FFD700' // Bright gold
        }).setOrigin(0.5);
        
        // Starting capital
        this.budgetStartText = this.add.text(-170, 30, `Start: $${this.budget.starting.toLocaleString()}`, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#E0E0E0' // Light gray
        });
        
        // Category breakdown
        this.budget.allocated = { permits: 0, equipment: 0, marketing: 0, reserve: 0 };
        const categories = [
            { key: 'permits', icon: '📋', label: 'Permits/Legal' },
            { key: 'equipment', icon: '🔧', label: 'Equipment' },
            { key: 'marketing', icon: '📢', label: 'Marketing' },
            { key: 'reserve', icon: '🏦', label: 'Reserve' }
        ];
        
        this.categoryTexts = {};
        categories.forEach((cat, i) => {
            const y = 48 + i * 16;
            this.categoryTexts[cat.key] = this.add.text(-170, y, `${cat.icon} ${cat.label}: $0`, {
                fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#C0C0C0' // Light gray
            });
            this.budgetContainer.add(this.categoryTexts[cat.key]);
        });
        
        // Remaining (highlighted)
        this.budgetRemainingText = this.add.text(-170, 115, `Remaining: $${this.budget.starting.toLocaleString()}`, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#FFFFFF' // Always white
        });
        
        // 6-month runway indicator
        this.runwayText = this.add.text(-170, 132, '📅 ~6 months runway', {
            fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#90EE90' // Light green
        });
        
        // Progress bar
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1A1410);
        barBg.fillRoundedRect(-170, 143, 160, 6, 3);
        
        this.budgetBar = this.add.graphics();
        this.updateBudgetBar();
        
        this.budgetContainer.add([bg, title, this.budgetStartText, this.budgetRemainingText, this.runwayText, barBg, this.budgetBar]);
        this.budgetContainer.setDepth(15);
    }

    updateBudgetBar() {
        const remaining = this.budget.starting - this.budget.spent;
        const pct = Math.max(0, remaining / this.budget.starting);
        
        this.budgetBar.clear();
        const color = pct > 0.5 ? 0x4CAF50 : pct > 0.25 ? 0xFFC107 : 0xF44336;
        this.budgetBar.fillStyle(color);
        this.budgetBar.fillRoundedRect(-170, 143, 160 * pct, 6, 3);
        
        this.budgetRemainingText.setText(`Remaining: $${remaining.toLocaleString()}`);
        this.budgetRemainingText.setColor(pct > 0.5 ? '#4CAF50' : pct > 0.25 ? '#FFC107' : '#F44336');
        
        // Update runway (assuming $8k/month operating costs)
        const monthlyBurn = 8000;
        const runway = Math.floor(remaining / monthlyBurn);
        this.runwayText.setText(`📅 ~${runway} months runway`);
        this.runwayText.setColor(runway >= 6 ? '#81C784' : runway >= 3 ? '#FFB74D' : '#E57373');
    }

    updateBudgetCategory(category, amount) {
        if (this.budget.allocated[category] !== undefined) {
            this.budget.allocated[category] = amount;
            const icons = { permits: '📋', equipment: '🔧', marketing: '📢', reserve: '🏦' };
            const labels = { permits: 'Permits/Legal', equipment: 'Equipment', marketing: 'Marketing', reserve: 'Reserve' };
            if (this.categoryTexts[category]) {
                this.categoryTexts[category].setText(`${icons[category]} ${labels[category]}: $${amount.toLocaleString()}`);
            }
        }
    }

    createMentorArea() {
        const { width, height } = this.scale;
        
        this.mentorContainer = this.add.container(15, height - 15);
        
        // Mentor avatar
        const avatar = this.add.text(25, -60, '👨‍🍳', { fontSize: '36px' });
        
        // Speech bubble background - lighter with better border
        const bubble = this.add.graphics();
        bubble.fillStyle(0xFFFDF7, 1); // Lighter background
        bubble.fillRoundedRect(55, -80, 340, 75, 10);
        bubble.fillTriangle(55, -45, 42, -35, 55, -35);
        bubble.lineStyle(2, 0x8B4513, 0.8); // Darker brown border
        bubble.strokeRoundedRect(55, -80, 340, 75, 10);
        
        // Mentor text - darker for better contrast
        this.mentorText = this.add.text(68, -75, 'Welcome! I\'m Pierre, your business mentor.\nLet\'s build your bakery dream together!', {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: '#1A0F08', // Much darker brown
            lineSpacing: 3,
            wordWrap: { width: 315 }
        });
        
        // Name label
        const nameLabel = this.add.text(225, -90, 'Master Baker Pierre', {
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            fontStyle: 'italic',
            color: '#FFFFFF',
            backgroundColor: '#8B4513', // Dark brown background
            padding: { x: 6, y: 2 }
        }).setOrigin(0.5);
        
        // Glossary term button (shows when term is available)
        this.glossaryBtn = this.add.container(375, -45);
        const glossaryBg = this.add.graphics();
        glossaryBg.fillStyle(0x4A90E2, 1); // Bright blue
        glossaryBg.fillRoundedRect(-15, -12, 30, 24, 12);
        const glossaryIcon = this.add.text(0, 0, '📖', { fontSize: '14px' }).setOrigin(0.5);
        this.glossaryBtn.add([glossaryBg, glossaryIcon]);
        this.glossaryBtn.setVisible(false);
        this.glossaryBtn.setInteractive(new Phaser.Geom.Rectangle(-15, -12, 30, 24), Phaser.Geom.Rectangle.Contains);
        this.glossaryBtn.on('pointerdown', () => this.showGlossaryPopup());
        
        this.mentorContainer.add([avatar, bubble, this.mentorText, nameLabel, this.glossaryBtn]);
        this.mentorContainer.setDepth(15);
        
        this.currentGlossaryTerm = null;
    }

    setMentorText(text, glossaryTerm = null) {
        this.mentorText.setText(text);
        this.currentGlossaryTerm = glossaryTerm;
        this.glossaryBtn.setVisible(glossaryTerm !== null);
    }
    
    showGlossaryPopup() {
        if (!this.currentGlossaryTerm) return;
        
        const term = typeof FINANCIAL_EDUCATION !== 'undefined' && FINANCIAL_EDUCATION.terms[this.currentGlossaryTerm];
        if (!term) return;
        
        const { width, height } = this.scale;
        
        // Overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
            .setInteractive().setDepth(60);
        
        const popup = this.add.container(width / 2, height / 2);
        popup.setDepth(61);
        
        const bg = this.add.graphics();
        bg.fillStyle(0xFFFEF5, 1);
        bg.fillRoundedRect(-220, -150, 440, 300, 15);
        bg.lineStyle(3, 0x3498DB);
        bg.strokeRoundedRect(-220, -150, 440, 300, 15);
        
        const icon = this.add.text(0, -125, '📖', { fontSize: '32px' }).setOrigin(0.5);
        const title = this.add.text(0, -90, term.term, {
            fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold', color: '#2C3E50'
        }).setOrigin(0.5);
        
        const simple = this.add.text(-200, -60, `💡 ${term.simple}`, {
            fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', wordWrap: { width: 380 }, lineSpacing: 3
        });
        
        const detailed = this.add.text(-200, -10, term.detailed, {
            fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#555', wordWrap: { width: 380 }, lineSpacing: 3
        });
        
        const example = this.add.text(-200, 70, `📋 Example: ${term.realExample}`, {
            fontFamily: 'Inter, sans-serif', fontSize: '11px', fontStyle: 'italic', color: '#666', wordWrap: { width: 380 }, lineSpacing: 2
        });
        
        // Close button
        const closeBtn = this.add.container(0, 120);
        const closeBg = this.add.graphics();
        closeBg.fillStyle(0x3498DB, 1);
        closeBg.fillRoundedRect(-50, -15, 100, 30, 15);
        const closeText = this.add.text(0, 0, 'Got it!', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#FFF' }).setOrigin(0.5);
        closeBtn.add([closeBg, closeText]);
        closeBtn.setSize(100, 30).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { overlay.destroy(); popup.destroy(); });
        
        popup.add([bg, icon, title, simple, detailed, example, closeBtn]);
    }

    // Navigation methods
    goToChapter(chapterIndex) {
        if (this.isAnimating || chapterIndex === this.currentChapter) return;
        this.loadPage(chapterIndex, 0);
    }

    nextPage() {
        if (this.isAnimating) return;
        
        const chapter = this.chapters[this.currentChapter];
        if (this.currentPage < chapter.pages.length - 1) {
            this.loadPage(this.currentChapter, this.currentPage + 1);
        } else if (this.currentChapter < this.chapters.length - 1) {
            this.loadPage(this.currentChapter + 1, 0);
        } else {
            // End of book - start game
            this.finishSetup();
        }
    }

    prevPage() {
        if (this.isAnimating) return;
        
        if (this.currentPage > 0) {
            this.loadPage(this.currentChapter, this.currentPage - 1);
        } else if (this.currentChapter > 0) {
            const prevChapter = this.chapters[this.currentChapter - 1];
            this.loadPage(this.currentChapter - 1, prevChapter.pages.length - 1);
        }
    }

    loadPage(chapterIndex, pageIndex) {
        this.isAnimating = true;
        
        const oldChapter = this.currentChapter;
        this.currentChapter = chapterIndex;
        this.currentPage = pageIndex;
        
        // Update chapter tab highlighting
        this.updateChapterTabs(oldChapter);
        
        // Animate page turn
        this.tweens.add({
            targets: [this.leftContent, this.rightContent],
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.clearPageContent();
                this.renderCurrentPages();
                this.tweens.add({
                    targets: [this.leftContent, this.rightContent],
                    alpha: 1,
                    duration: 200,
                    onComplete: () => {
                        this.isAnimating = false;
                    }
                });
            }
        });
        
        // Update page indicator
        const chapter = this.chapters[chapterIndex];
        this.pageIndicator.setText(
            `Chapter ${chapterIndex + 1}: ${chapter.title} — Page ${pageIndex + 1} of ${chapter.pages.length}`
        );
        
        // Update navigation button states
        this.updateNavButtons();
    }

    updateChapterTabs(oldChapter) {
        // Reset old tab
        if (oldChapter !== this.currentChapter && this.chapterTabs[oldChapter]) {
            const oldTab = this.chapterTabs[oldChapter];
            oldTab.bg.clear();
            oldTab.bg.fillStyle(0xC9A66B, 1);
            oldTab.bg.fillRoundedRect(0, 0, 55, 75, { tl: 0, tr: 12, bl: 0, br: 12 });
            oldTab.bg.lineStyle(2, 0x8B4513);
            oldTab.bg.strokeRoundedRect(0, 0, 55, 75, { tl: 0, tr: 12, bl: 0, br: 12 });
        }
        
        // Highlight current tab
        const currentTab = this.chapterTabs[this.currentChapter];
        if (currentTab) {
            currentTab.bg.clear();
            currentTab.bg.fillStyle(0xD4AF37, 1);
            currentTab.bg.fillRoundedRect(0, 0, 55, 75, { tl: 0, tr: 12, bl: 0, br: 12 });
            currentTab.bg.lineStyle(2, 0x8B4513);
            currentTab.bg.strokeRoundedRect(0, 0, 55, 75, { tl: 0, tr: 12, bl: 0, br: 12 });
        }
    }

    updateNavButtons() {
        const isFirstPage = this.currentChapter === 0 && this.currentPage === 0;
        const isLastChapter = this.currentChapter === this.chapters.length - 1;
        const isLastPage = this.currentPage === this.chapters[this.currentChapter].pages.length - 1;
        
        this.prevBtn.setAlpha(isFirstPage ? 0.5 : 1);
        
        // Update next button text for final page
        if (isLastChapter && isLastPage) {
            this.nextBtn.getAt(1).setText('Start Game! 🎮');
            this.nextBtn.getAt(0).clear();
            this.nextBtn.getAt(0).fillStyle(0x4CAF50, 0.9);
            this.nextBtn.getAt(0).fillRoundedRect(-60, -20, 120, 40, 20);
        } else {
            this.nextBtn.getAt(1).setText('Next ▶');
            this.nextBtn.getAt(0).clear();
            this.nextBtn.getAt(0).fillStyle(0xD4AF37, 0.9);
            this.nextBtn.getAt(0).fillRoundedRect(-50, -20, 100, 40, 20);
        }
    }

    clearPageContent() {
        this.leftContent.removeAll(true);
        this.rightContent.removeAll(true);
    }

    renderCurrentPages() {
        const chapter = this.chapters[this.currentChapter];
        const page = chapter.pages[this.currentPage];
        
        // Render based on chapter and page
        switch (chapter.id) {
            case 'intro':
                this.renderIntroPage(page, this.currentPage);
                break;
            case 'planning':
                this.renderPlanningPage(page, this.currentPage);
                break;
            case 'legal':
                this.renderLegalPage(page, this.currentPage);
                break;
            case 'operations':
                this.renderOperationsPage(page, this.currentPage);
                break;
            case 'launch':
                this.renderLaunchPage(page, this.currentPage);
                break;
        }
    }

    // Chapter 0: Introduction
    renderIntroPage(page, pageIndex) {
        const pageWidth = this.bookWidth / 2 - 60;
        
        if (pageIndex === 0) {
            // Narrative: The Beginning
            this.addLeftPageTitle('Your Bakery Dream Begins');
            
            const story = this.add.text(0, 50, 
                `You've always had a passion for baking. The smell of fresh bread, the satisfaction of a perfectly risen croissant, the joy on people's faces when they taste your creations.\n\nNow, you're ready to turn that passion into a business.\n\nBut opening a bakery isn't just about great recipes. It's about understanding the business side too — planning, legal requirements, operations, and marketing.\n\nThis journey will teach you the real steps entrepreneurs take to start a business, while you build YOUR dream bakery.`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '15px',
                    color: '#3E2723',
                    lineSpacing: 6,
                    wordWrap: { width: pageWidth }
                }
            );
            this.leftContent.add(story);
            
            // Right page: Initial scenario
            this.addRightPageTitle('Where It All Starts');
            
            const intro = this.add.text(0, 50,
                `You have $50,000 in savings to start your bakery business.\n\nThis might sound like a lot, but you'll be surprised how quickly startup costs add up!\n\nOver the next few chapters, you'll make real business decisions:\n\n• What type of bakery to open\n• Legal structure & permits\n• Location & equipment\n• Marketing & launch strategy\n\nEach choice affects your budget and your bakery's potential for success.`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '15px',
                    color: '#3E2723',
                    lineSpacing: 6,
                    wordWrap: { width: pageWidth }
                }
            );
            this.rightContent.add(intro);
            
            this.setMentorText('Every successful bakery started with a dream and a plan.\nLet me guide you through the process!');
            
        } else if (pageIndex === 1) {
            // Interactive: Choose Your Path
            this.addLeftPageTitle('Before We Begin...');
            
            const explanation = this.add.text(0, 50,
                `Before diving into the details, let's set your entrepreneurial mindset.\n\nRunning a business requires:\n\n📊 Financial awareness\n   Tracking every dollar\n\n⚖️ Legal compliance\n   Following regulations\n\n🎯 Strategic thinking\n   Planning ahead\n\n💪 Persistence\n   Overcoming challenges\n\nAre you ready to think like a business owner?`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '15px',
                    color: '#3E2723',
                    lineSpacing: 5,
                    wordWrap: { width: pageWidth }
                }
            );
            this.leftContent.add(explanation);
            
            // Right page: Commitment button
            this.addRightPageTitle('Make Your Commitment');
            
            const commitText = this.add.text(0, 50,
                `This isn't just a game — it's a simulation of real business decisions.\n\nThe choices you make here mirror what actual entrepreneurs face.\n\nTake your time with each decision. Read the explanations. Ask questions (that's what I'm here for!).\n\nWhen you're ready, let's begin your journey.`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '15px',
                    color: '#3E2723',
                    lineSpacing: 6,
                    wordWrap: { width: pageWidth }
                }
            );
            this.rightContent.add(commitText);
            
            // Commitment button
            this.createActionButton(
                this.rightContent,
                pageWidth / 2,
                280,
                "I'm Ready to Learn! 📚",
                () => {
                    this.setMentorText('Excellent! Let\'s start with the most important step:\nPlanning your business concept.');
                    this.nextPage();
                }
            );
            
            this.setMentorText('Take a moment to prepare yourself.\nBuilding a business is exciting but challenging!');
        }
    }

    // Chapter 1: Planning
    renderPlanningPage(page, pageIndex) {
        const pageWidth = this.bookWidth / 2 - 60;
        
        if (pageIndex === 0) {
            // Narrative: Finding Your Niche
            this.addLeftPageTitle('Finding Your Niche');
            
            const story = this.add.text(0, 50,
                `The first decision every bakery owner faces: What type of bakery will you run?\n\nThis isn't just about what you want to bake. It's about:\n\n• Who your customers are\n• How much startup capital you need\n• What regulations apply to you\n• Your daily operations\n\nLet's explore the four main bakery models...`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '15px',
                    color: '#3E2723',
                    lineSpacing: 6,
                    wordWrap: { width: pageWidth }
                }
            );
            this.leftContent.add(story);
            
            // Right page: Niche explanations
            this.addRightPageTitle('Bakery Business Models');
            
            const models = [
                { icon: '🏪', name: 'Retail Storefront', desc: 'Traditional shop with walk-in customers' },
                { icon: '🏭', name: 'Wholesale', desc: 'Sell to restaurants, cafes, grocery stores' },
                { icon: '🚚', name: 'Food Truck', desc: 'Mobile bakery at events and locations' },
                { icon: '🏠', name: 'Home-Based', desc: 'Cottage food operation from your kitchen' }
            ];
            
            models.forEach((model, i) => {
                const y = 50 + i * 70;
                const modelText = this.add.text(0, y,
                    `${model.icon} ${model.name}\n     ${model.desc}`,
                    {
                        fontFamily: 'Georgia, serif',
                        fontSize: '14px',
                        color: '#3E2723',
                        lineSpacing: 4
                    }
                );
                this.rightContent.add(modelText);
            });
            
            this.setMentorText('Each model has trade-offs between startup cost,\nrevenue potential, and complexity. Choose wisely!');
            
        } else if (pageIndex === 1) {
            // Interactive: Business Model Selection
            this.addLeftPageTitle('Understanding the Trade-offs');
            
            const comparison = this.add.text(0, 50,
                `💰 Startup Costs:\nHome < Food Truck < Retail < Wholesale\n\n📈 Revenue Potential:\nHome < Food Truck < Retail < Wholesale\n\n📋 Regulatory Complexity:\nHome < Food Truck < Retail ≈ Wholesale\n\n⏰ Work Flexibility:\nFood Truck < Retail < Wholesale < Home\n\nFor this simulation, we'll focus on the Retail Storefront model — it teaches the most complete set of business skills.`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    color: '#3E2723',
                    lineSpacing: 5,
                    wordWrap: { width: pageWidth }
                }
            );
            this.leftContent.add(comparison);
            
            // Right page: Selection
            this.addRightPageTitle('Select Your Business Model');
            
            this.createNicheSelection(pageWidth);
            
            this.setMentorText('For beginners, I recommend Retail Storefront.\nIt\'s the best way to learn all aspects of business!\nTap 📖 for business structure basics.', 'sole_proprietorship');
            
        } else if (pageIndex === 2) {
            // Narrative: Business Plan
            this.addLeftPageTitle('The Business Plan');
            
            const story = this.add.text(0, 50,
                `A business plan is your roadmap to success. Banks require it for loans. Investors want to see it. Most importantly, it forces YOU to think through every aspect of your business.\n\nKey components:\n\n📝 Executive Summary\n   Your business in a nutshell\n\n🎯 Market Analysis\n   Who are your customers?\n\n💵 Financial Projections\n   Revenue, costs, profit estimates\n\n📊 Funding Requirements\n   How much and what for?`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    color: '#3E2723',
                    lineSpacing: 5,
                    wordWrap: { width: pageWidth }
                }
            );
            this.leftContent.add(story);
            
            // Right page: Why it matters
            this.addRightPageTitle('Why Business Plans Matter');
            
            const stats = this.add.text(0, 50,
                `📊 Real Statistics:\n\n• Businesses with plans grow 30% faster\n\n• 70% of businesses that survive 5+ years had a formal plan\n\n• Banks approve loans 2x more often when a business plan is provided\n\n• Writing a plan helps identify problems BEFORE they cost you money\n\n💡 Even if no one else sees it, writing a plan makes you think through details you'd otherwise miss.`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    color: '#3E2723',
                    lineSpacing: 5,
                    wordWrap: { width: pageWidth }
                }
            );
            this.rightContent.add(stats);
            
            this.setMentorText('Don\'t skip the planning phase! Many failed bakeries\ndidn\'t fail because of bad products — they failed\nbecause of bad planning.');
            
        } else if (pageIndex === 3) {
            // Interactive: Name Your Business
            this.addLeftPageTitle('Naming Your Bakery');
            
            const tips = this.add.text(0, 50,
                `Your bakery's name is crucial for branding. Consider:\n\n✓ Easy to remember and spell\n✓ Reflects your style/specialty  \n✓ Available as a domain name\n✓ Not trademarked by others\n✓ Works for signage and logos\n\n⚠️ Common Mistakes:\n✗ Names that are too generic\n✗ Hard to pronounce words\n✗ Names that limit future growth\n✗ Copying competitors`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    color: '#3E2723',
                    lineSpacing: 5,
                    wordWrap: { width: pageWidth }
                }
            );
            this.leftContent.add(tips);
            
            // Right page: Name selection
            this.addRightPageTitle('Choose Your Bakery Name');
            
            this.createNameSelection(pageWidth);
            
            this.setMentorText('Pick a name that tells your story!\nYour name is often the first impression customers get.');
            
        } else if (pageIndex === 4) {
            // Narrative: Pricing
            this.addLeftPageTitle('Pricing Your Products');
            
            const story = this.add.text(0, 50,
                `Pricing is where many new bakeries fail. Price too low and you won't cover costs. Price too high and customers go elsewhere.\n\nThe Pricing Formula:\n\n   Product Price = \n   (Ingredient Cost + Labor + Overhead)\n   × Profit Margin\n\nTypical bakery margins:\n• Bread: 50-60% markup\n• Pastries: 100-150% markup  \n• Custom cakes: 200-300% markup\n\nRemember: Price reflects perceived value, not just cost!`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    color: '#3E2723',
                    lineSpacing: 5,
                    wordWrap: { width: pageWidth }
                }
            );
            this.leftContent.add(story);
            
            // Cost breakdown example
            this.addRightPageTitle('Understanding Your Costs');
            
            const breakdown = this.add.text(0, 50,
                `📊 Example: Chocolate Croissant\n\nDirect Costs (per item):\n  Flour, butter, chocolate: $0.85\n  Labor (5 min @ $15/hr): $1.25\n  Packaging: $0.15\n  ─────────────────────\n  Subtotal: $2.25\n\nOverhead Allocation:\n  Rent, utilities, etc: $0.50\n  ─────────────────────\n  True Cost: $2.75\n\nWith 100% markup:\n  Selling Price: $5.50\n  Profit per item: $2.75`,
                {
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: '#3E2723',
                    lineSpacing: 3,
                    wordWrap: { width: pageWidth }
                }
            );
            this.rightContent.add(breakdown);
            
            this.setMentorText('Most new bakers underestimate their costs.\nAlways include overhead in your pricing!');
            
        } else if (pageIndex === 5) {
            // Interactive: Pricing Calculator with drag mini-game
            this.addLeftPageTitle('Pricing Exercise');
            
            const instructions = this.add.text(0, 50,
                `Let's practice pricing!\n\nDrag ingredients to your cost basket, then set your selling price.\n\n🎯 Goal: Build a profitable croissant!\n\nConsider:\n• Ingredient costs (drag to add)\n• Labor time ($15/hour)\n• Overhead allocation`,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    color: '#3E2723',
                    lineSpacing: 4,
                    wordWrap: { width: pageWidth }
                }
            );
            this.leftContent.add(instructions);
            
            // Right page: Interactive cost builder
            this.addRightPageTitle('Build Your Cost');
            
            this.createCostBuilderGame(pageWidth);
            
            this.setMentorText('Balance between covering costs and staying competitive.\nYour price tells customers about your quality level!');
        }
    }

    // Chapter 2: Legal & Regulatory
    renderLegalPage(page, pageIndex) {
        const pageWidth = this.bookWidth / 2 - 60;
        
        if (pageIndex === 0) {
            this.addLeftPageTitle('Getting Official');
            const story = this.add.text(0, 50,
                `Before you can sell your first croissant, you need to make your business official.\n\nThis isn't just paperwork — it's protection. The right business structure shields your personal assets if something goes wrong.\n\nKey decisions:\n• Business structure (LLC, Sole Prop, etc.)\n• Federal tax ID (EIN)\n• State registration\n• Local business license`,
                { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }
            );
            this.leftContent.add(story);
            
            this.addRightPageTitle('Why Structure Matters');
            const right = this.add.text(0, 50,
                `⚠️ True Story:\n\nA bakery owner operated as a sole proprietor. When a customer sued over a food allergy incident, the owner lost not just the business, but their house and savings.\n\nWith an LLC, only business assets would be at risk.\n\n💡 The $500 to form an LLC can save you everything.`,
                { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }
            );
            this.rightContent.add(right);
            this.setMentorText('Choosing the right structure is one of the most\nimportant decisions you\'ll make! Tap 📖 to learn more.', 'llc');
            
        } else if (pageIndex === 1) {
            this.addLeftPageTitle('Business Structures');
            const structures = `🏠 Sole Proprietorship\n   • Simplest, no paperwork\n   • YOU are personally liable\n   • Best for: Testing ideas\n\n🛡️ LLC (Limited Liability Company)\n   • Separates personal/business\n   • Moderate paperwork\n   • Best for: Most small businesses\n\n🏢 Corporation (S-Corp/C-Corp)\n   • Most protection & complexity\n   • Required for investors\n   • Best for: Growth plans`;
            this.leftContent.add(this.add.text(0, 50, structures, { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Choose Your Structure');
            this.createStructureSelection(pageWidth);
            this.setMentorText('For a bakery, LLC is usually the sweet spot —\ngood protection without too much complexity.');
            
        } else if (pageIndex === 2) {
            this.addLeftPageTitle('Permits & Licenses');
            const permits = `Every food business needs permits. Missing one can mean fines or closure.\n\n📋 Required Permits:\n\n• Business License ($50-400)\n  Your legal right to operate\n\n• Health Department Permit ($100-1000)\n  Kitchen inspection required\n\n• Food Handler's Certificate ($15-30)\n  You + all employees need this\n\n• Sales Tax Permit (Free)\n  Required to collect sales tax`;
            this.leftContent.add(this.add.text(0, 50, permits, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('The Permit Process');
            const process = `📅 Timeline (typically 2-6 weeks):\n\n1. Apply for business license\n2. Schedule health inspection\n3. Pass inspection\n4. Get food handler certs\n5. Register for sales tax\n\n⚠️ Don't skip steps! Health inspectors can shut you down on day one if permits aren't posted.`;
            this.rightContent.add(this.add.text(0, 50, process, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            this.setMentorText('Start the permit process early — inspections\ncan take weeks to schedule! Tap 📖 to learn more.', 'health_inspection');
            
        } else if (pageIndex === 3) {
            this.addLeftPageTitle('Permit Checklist');
            const intro = `Check off the permits you'll need. Required ones are pre-selected.\n\n💰 Budget Impact: Each permit has a cost that comes out of your startup capital.`;
            this.leftContent.add(this.add.text(0, 50, intro, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Select Your Permits');
            this.createPermitChecklist(pageWidth);
            this.setMentorText('Required permits are non-negotiable.\nOptional ones can give you advantages!');
            
        } else if (pageIndex === 4) {
            this.addLeftPageTitle('Protecting Your Business');
            const insurance = `Insurance is your safety net. Without it, one accident could end your dream.\n\n🔒 Types of Coverage:\n\n• General Liability\n  Customer slips, property damage\n\n• Product Liability\n  Food makes someone sick\n\n• Property Insurance\n  Fire, theft, equipment damage\n\n• Workers' Comp\n  Required if you have employees`;
            this.leftContent.add(this.add.text(0, 50, insurance, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Insurance Costs');
            const costs = `📊 Typical Annual Costs:\n\n• Basic Package: $1,200-2,400/yr\n  General + Product liability\n\n• Standard Package: $2,400-4,800/yr\n  + Property coverage\n\n• Premium Package: $4,800-8,000/yr\n  + Business interruption\n\n💡 Insurance is a monthly expense that protects against catastrophic loss.`;
            this.rightContent.add(this.add.text(0, 50, costs, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            this.setMentorText('Never skip insurance. The monthly cost is\nnothing compared to a lawsuit. Tap 📖 to learn more.', 'liability_insurance');
            
        } else if (pageIndex === 5) {
            this.addLeftPageTitle('Insurance Selection');
            const tips = `Consider your risk level:\n\n• High foot traffic = more slip risks\n• Specialty items = allergy concerns\n• Employees = workers' comp required\n\nMost bakeries start with Standard coverage and upgrade as they grow.`;
            this.leftContent.add(this.add.text(0, 50, tips, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Choose Your Coverage');
            this.createInsuranceSelection(pageWidth);
            this.setMentorText('Standard coverage is my recommendation for\nmost new bakeries. It\'s the best value.');
        }
    }

    // Chapter 3: Operations & Setup
    renderOperationsPage(page, pageIndex) {
        const pageWidth = this.bookWidth / 2 - 60;
        
        if (pageIndex === 0) {
            this.addLeftPageTitle('Finding Your Space');
            const story = this.add.text(0, 50,
                `Location is everything in retail. The right spot can make you; the wrong one can break you.\n\nFactors to consider:\n• Foot traffic (customers passing by)\n• Rent costs (your biggest fixed expense)\n• Parking availability\n• Nearby competition\n• Demographics (who lives/works nearby)`,
                { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }
            );
            this.leftContent.add(story);
            
            this.addRightPageTitle('Location Trade-offs');
            const tradeoffs = `📍 Downtown\nHigh rent, high traffic, limited parking\n\n🏘️ Suburban\nModerate rent, moderate traffic, good parking\n\n🛒 Shopping Center\nHigh rent + fees, built-in traffic\n\n🏭 Industrial\nLow rent, must build customer base`;
            this.rightContent.add(this.add.text(0, 50, tradeoffs, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            this.setMentorText('High rent locations aren\'t always better.\nIt depends on your business model!');
            
        } else if (pageIndex === 1) {
            this.addLeftPageTitle('Compare Locations');
            const tip = `💡 The "Rule of Thirds":\n\nYour rent should be less than 10% of expected revenue.\n\nIf you expect $15,000/month in sales, aim for rent under $1,500/month.`;
            this.leftContent.add(this.add.text(0, 50, tip, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Choose Your Location');
            this.createLocationSelection(pageWidth);
            this.setMentorText('For a new bakery, suburban often offers the\nbest balance of cost and opportunity.');
            
        } else if (pageIndex === 2) {
            this.addLeftPageTitle('Equipping Your Kitchen');
            const equip = `Your equipment determines what you can make and how fast.\n\n🔥 Oven - The heart of your bakery\n   Capacity affects daily output\n\n🌀 Mixer - For doughs and batters\n   Speed affects prep time\n\n🗄️ Display Case - Sells your products\n   Size affects what customers see\n\n📦 Other essentials:\n   Refrigeration, prep tables, storage`;
            this.leftContent.add(this.add.text(0, 50, equip, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Buy vs Lease');
            const buyLease = `🛒 Buying Equipment:\n• Higher upfront cost\n• You own it forever\n• Can deduct depreciation\n\n📋 Leasing Equipment:\n• Lower upfront cost\n• Monthly payments\n• Easier to upgrade\n• May cost more long-term\n\n💡 Most new bakeries buy core equipment (oven) and lease specialty items.`;
            this.rightContent.add(this.add.text(0, 50, buyLease, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            this.setMentorText('Your oven is the most important purchase.\nDon\'t skimp on it!');
            
        } else if (pageIndex === 3) {
            this.addLeftPageTitle('Equipment ROI Game');
            const budget = `🎮 Interactive Exercise:\n\nSlide to compare equipment options!\n\nSee how capacity affects your daily output and how quickly you'll recover your investment.\n\n📊 ROI = Return on Investment\nHow fast your equipment pays for itself through increased production.`;
            this.leftContent.add(this.add.text(0, 50, budget, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Compare & Select');
            this.createEquipmentROIGame(pageWidth);
            this.setMentorText('Slide between options to see how\nequipment affects your business!');
            
        } else if (pageIndex === 4) {
            this.addLeftPageTitle('Financing Options');
            const financing = `How will you fund your bakery?\n\n💰 Personal Savings\n• No debt, no interest\n• Full ownership\n• Limited by what you have\n\n🏦 Bank Loan\n• Access more capital\n• Interest payments\n• Need good credit\n\n👥 Investors\n• Share risk and reward\n• Give up some control\n• Pressure to grow fast`;
            this.leftContent.add(this.add.text(0, 50, financing, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Cost of Borrowing');
            const costs = `📊 Loan Example:\nBorrow: $30,000\nTerm: 5 years\nRate: 8%\n\nMonthly Payment: $608\nTotal Interest: $6,480\nTotal Repaid: $36,480\n\n⚠️ Debt means fixed monthly payments regardless of how business is doing.`;
            this.rightContent.add(this.add.text(0, 50, costs, { fontFamily: 'monospace', fontSize: '13px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            this.setMentorText('Only borrow what you need. Debt can sink\na business during slow periods. Tap 📖 to learn more.', 'cash_flow');
            
        } else if (pageIndex === 5) {
            this.addLeftPageTitle('Fund Your Dream');
            const tip = `⚖️ Key Consideration:\n\nKeep 3-6 months of operating expenses in reserve.\n\nIf monthly costs are $8,000, you need $24,000-$48,000 accessible for emergencies.`;
            this.leftContent.add(this.add.text(0, 50, tip, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Choose Financing');
            this.createFinancingSelection(pageWidth);
            this.setMentorText('For a first business, starting with savings\nis often the safest approach.');
        }
    }

    // Chapter 4: Branding & Launch
    renderLaunchPage(page, pageIndex) {
        const pageWidth = this.bookWidth / 2 - 60;
        
        if (pageIndex === 0) {
            this.addLeftPageTitle('Building Your Brand');
            const story = this.add.text(0, 50,
                `Your brand is more than a logo — it's the feeling customers get when they think of your bakery.\n\nBrand elements:\n• Name (chosen earlier!)\n• Logo & colors\n• Voice & personality\n• Customer experience\n• Packaging & presentation\n\nConsistency is key. Every touchpoint should feel like "you."`,
                { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }
            );
            this.leftContent.add(story);
            
            this.addRightPageTitle('Brand Personality');
            const personalities = `What feeling do you want to evoke?\n\n🏠 Homey & Comforting\nWarm colors, handwritten fonts\n\n✨ Modern & Artisan\nClean lines, minimal design\n\n🎉 Fun & Playful\nBright colors, quirky touches\n\n👑 Premium & Luxurious\nGold accents, elegant fonts`;
            this.rightContent.add(this.add.text(0, 50, personalities, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            this.setMentorText('Your brand should match your target customers.\nWho are you trying to attract?');
            
        } else if (pageIndex === 1) {
            this.addLeftPageTitle('Choose Your Style');
            const tips = `💡 Branding Tips:\n\n• Pick 2-3 brand colors\n• Use consistent fonts\n• Create a simple, memorable logo\n• Apply everywhere: signage, menu, packaging, social media`;
            this.leftContent.add(this.add.text(0, 50, tips, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Select Brand Style');
            this.createBrandSelection(pageWidth);
            this.setMentorText('Your brand style affects how customers\nperceive your products and prices.');
            
        } else if (pageIndex === 2) {
            this.addLeftPageTitle('Marketing Strategy');
            const marketing = `How will customers find you?\n\n📱 Digital Marketing\n• Social media (free-ish)\n• Google Business listing (free)\n• Website ($0-200/month)\n• Online ads ($varies)\n\n📰 Traditional Marketing\n• Flyers & posters\n• Local newspaper\n• Community events\n• Word of mouth`;
            this.leftContent.add(this.add.text(0, 50, marketing, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('🎮 Create Your First Post');
            this.createSocialMediaMiniGame(pageWidth);
            this.setMentorText('Try creating your first social media post!\nSee how different elements affect engagement.');
            
        } else if (pageIndex === 3) {
            this.addLeftPageTitle('Marketing Budget');
            const budget = `💰 How much to spend?\n\nRule of thumb:\n5-10% of revenue on marketing\n\nBut at launch, you might need more to build awareness.\n\nFirst 3 months: Consider 15-20% to establish presence.`;
            this.leftContent.add(this.add.text(0, 50, budget, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Choose Strategy');
            this.createMarketingSelection(pageWidth);
            this.setMentorText('Start with organic social media and word of mouth.\nAdd paid ads once you know what works.');
            
        } else if (pageIndex === 4) {
            this.addLeftPageTitle('The Grand Opening');
            const opening = `Your launch day sets expectations. Plan carefully!\n\n📅 Before Opening:\n• Soft opening (friends & family)\n• Train on systems\n• Stock inventory\n• Test recipes at scale\n\n🎉 Opening Day:\n• Special promotions?\n• Press/influencer invites?\n• Extra staff on hand\n• Photographer for content`;
            this.leftContent.add(this.add.text(0, 50, opening, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 4, wordWrap: { width: pageWidth } }));
            
            this.addRightPageTitle('Launch Strategies');
            const strategies = `🎈 Soft Opening\nInvite-only, work out kinks\n1-2 weeks before grand opening\n\n🎊 Grand Opening\nPublic announcement\nSpecial deals to draw crowd\n\n📸 Social Launch\nDocument everything\nCreate shareable moments\n\n🤝 Community Launch\nPartner with local businesses\nCharity tie-in`;
            this.rightContent.add(this.add.text(0, 50, strategies, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 3, wordWrap: { width: pageWidth } }));
            this.setMentorText('A soft opening is ESSENTIAL. You\'ll catch\nproblems before they become public failures.');
            
        } else if (pageIndex === 5) {
            this.addLeftPageTitle('You\'re Ready!');
            const ready = this.add.text(0, 50,
                `Congratulations! You've learned the key steps to starting a bakery business:\n\n✓ Planning your concept\n✓ Legal structure & permits\n✓ Location & equipment\n✓ Financing decisions\n✓ Branding & marketing\n\nNow it's time to put it all into practice!`,
                { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#3E2723', lineSpacing: 5, wordWrap: { width: pageWidth } }
            );
            this.leftContent.add(ready);
            
            this.addRightPageTitle('Your Bakery Summary');
            this.createSummaryPage(pageWidth);
            this.setMentorText('You\'ve done the planning. Now let\'s see\nif you can make it work! Good luck!');
        }
    }

    // Chapter 4 helper methods
    createBrandSelection(pageWidth) {
        const styles = [
            { id: 'homey', name: 'Homey & Comforting', icon: '🏠', colors: ['#8B4513', '#DEB887', '#F5DEB3'] },
            { id: 'modern', name: 'Modern & Artisan', icon: '✨', colors: ['#2C3E50', '#ECF0F1', '#BDC3C7'] },
            { id: 'playful', name: 'Fun & Playful', icon: '🎉', colors: ['#E74C3C', '#F39C12', '#9B59B6'] },
            { id: 'premium', name: 'Premium & Luxurious', icon: '👑', colors: ['#2C2C2C', '#D4AF37', '#FFFFFF'] }
        ];
        
        this.brandButtons = [];
        styles.forEach((item, i) => {
            const y = 55 + i * 65;
            const btn = this.add.container(pageWidth / 2 - 10, y);
            const bg = this.add.graphics();
            const isSelected = this.setupChoices.brandStyle === item.id;
            bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            bg.lineStyle(2, 0xC9A66B);
            bg.fillRoundedRect(-pageWidth / 2 + 20, -28, pageWidth - 40, 56, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -28, pageWidth - 40, 56, 8);
            
            const icon = this.add.text(-pageWidth / 2 + 35, 0, item.icon, { fontSize: '22px' }).setOrigin(0, 0.5);
            const name = this.add.text(-pageWidth / 2 + 65, -8, item.name, { fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'bold', color: '#3E2723' });
            
            // Color swatches
            item.colors.forEach((color, ci) => {
                const swatch = this.add.graphics();
                swatch.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
                swatch.fillRoundedRect(-pageWidth / 2 + 65 + ci * 25, 8, 20, 14, 3);
                swatch.lineStyle(1, 0x888888, 0.5);
                swatch.strokeRoundedRect(-pageWidth / 2 + 65 + ci * 25, 8, 20, 14, 3);
                btn.add(swatch);
            });
            
            btn.add([bg, icon, name]);
            btn.setSize(pageWidth - 40, 56); btn.bg = bg; btn.itemId = item.id;
            btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.selectBrand(item.id));
            this.brandButtons.push(btn);
            this.rightContent.add(btn);
        });
        if (!this.setupChoices.brandStyle) this.selectBrand('homey');
    }

    selectBrand(id) {
        this.setupChoices.brandStyle = id;
        const pageWidth = this.bookWidth / 2 - 60;
        this.brandButtons.forEach(btn => {
            btn.bg.clear();
            const isSelected = btn.itemId === id;
            btn.bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            btn.bg.lineStyle(2, 0xC9A66B);
            btn.bg.fillRoundedRect(-pageWidth / 2 + 20, -28, pageWidth - 40, 56, 8);
            btn.bg.strokeRoundedRect(-pageWidth / 2 + 20, -28, pageWidth - 40, 56, 8);
        });
        const msgs = { homey: 'Warm and inviting! Great for families.', modern: 'Clean and sophisticated. Appeals to professionals.', playful: 'Fun and memorable! Great for kids and events.', premium: 'Luxurious feel. Supports higher pricing.' };
        this.setMentorText(msgs[id] || '');
    }

    // Mini-game: Social Media Post Creator
    createSocialMediaMiniGame(pageWidth) {
        // Post elements to choose from
        const photoOptions = [
            { id: 'product', icon: '🥐', name: 'Product Shot', engagement: 3 },
            { id: 'behind', icon: '👨‍🍳', name: 'Behind Scenes', engagement: 4 },
            { id: 'promo', icon: '💰', name: 'Promo/Sale', engagement: 2 }
        ];
        
        const captionOptions = [
            { id: 'emoji', text: '🔥 Fresh out of the oven! 🥐✨', engagement: 3 },
            { id: 'story', text: 'Grandma\'s recipe, made with love...', engagement: 5 },
            { id: 'cta', text: 'Visit us today! Link in bio.', engagement: 2 }
        ];
        
        const hashtagOptions = [
            { id: 'local', text: '#LocalBakery #YourCity', engagement: 4 },
            { id: 'foodie', text: '#FreshBaked #BakeryLife', engagement: 3 },
            { id: 'generic', text: '#Food #Yum', engagement: 1 }
        ];
        
        // Selected elements
        this.postElements = { photo: null, caption: null, hashtags: null };
        
        // Photo selection
        const photoLabel = this.add.text(0, 40, '📸 Photo:', {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#5D3A1A'
        });
        this.rightContent.add(photoLabel);
        
        this.photoBtns = [];
        photoOptions.forEach((opt, i) => {
            const x = 5 + i * 70;
            const btn = this.createPostOptionBtn(x, 60, opt.icon, opt.name, 'photo', opt);
            this.photoBtns.push(btn);
        });
        
        // Caption selection
        const captionLabel = this.add.text(0, 105, '💬 Caption:', {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#5D3A1A'
        });
        this.rightContent.add(captionLabel);
        
        this.captionBtns = [];
        captionOptions.forEach((opt, i) => {
            const y = 125 + i * 28;
            const btn = this.createCaptionBtn(5, y, opt.text, 'caption', opt);
            this.captionBtns.push(btn);
        });
        
        // Hashtag selection
        const hashLabel = this.add.text(0, 215, '#️⃣ Hashtags:', {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#5D3A1A'
        });
        this.rightContent.add(hashLabel);
        
        this.hashtagBtns = [];
        hashtagOptions.forEach((opt, i) => {
            const x = 5 + i * 70;
            const btn = this.createPostOptionBtn(x, 235, '#', opt.text.split(' ')[0], 'hashtags', opt);
            this.hashtagBtns.push(btn);
        });
        
        // Engagement preview
        const previewY = 280;
        const previewBg = this.add.graphics();
        previewBg.fillStyle(0xF8F8F8, 1);
        previewBg.lineStyle(2, 0xDDDDDD);
        previewBg.fillRoundedRect(5, previewY, pageWidth - 30, 70, 8);
        previewBg.strokeRoundedRect(5, previewY, pageWidth - 30, 70, 8);
        this.rightContent.add(previewBg);
        
        this.engagementLabel = this.add.text(15, previewY + 8, '📊 Engagement Preview', {
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#666'
        });
        this.rightContent.add(this.engagementLabel);
        
        this.engagementResult = this.add.text(15, previewY + 28, 'Select options above...', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#888'
        });
        this.rightContent.add(this.engagementResult);
        
        // Visual engagement meter
        this.engagementMeterBg = this.add.graphics();
        this.engagementMeterBg.fillStyle(0xE0E0E0, 1);
        this.engagementMeterBg.fillRoundedRect(15, previewY + 50, pageWidth - 60, 10, 3);
        this.rightContent.add(this.engagementMeterBg);
        
        this.engagementMeterFill = this.add.graphics();
        this.rightContent.add(this.engagementMeterFill);
    }
    
    createPostOptionBtn(x, y, icon, label, type, data) {
        const btn = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0xFFF8E1, 1);
        bg.lineStyle(2, 0xC9A66B);
        bg.fillRoundedRect(0, 0, 60, 38, 5);
        bg.strokeRoundedRect(0, 0, 60, 38, 5);
        
        const iconText = this.add.text(30, 12, icon, { fontSize: '16px' }).setOrigin(0.5);
        const labelText = this.add.text(30, 28, label.substring(0, 8), {
            fontFamily: 'Inter, sans-serif',
            fontSize: '8px',
            color: '#666'
        }).setOrigin(0.5);
        
        btn.add([bg, iconText, labelText]);
        btn.setSize(60, 38);
        btn.bg = bg;
        btn.data = data;
        btn.optType = type;
        
        btn.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.selectPostElement(type, data, btn));
        
        this.rightContent.add(btn);
        return btn;
    }
    
    createCaptionBtn(x, y, text, type, data) {
        const btn = this.add.container(x, y);
        const pageWidth = this.bookWidth / 2 - 60;
        
        const bg = this.add.graphics();
        bg.fillStyle(0xFFF8E1, 1);
        bg.lineStyle(1, 0xC9A66B);
        bg.fillRoundedRect(0, 0, pageWidth - 30, 24, 4);
        bg.strokeRoundedRect(0, 0, pageWidth - 30, 24, 4);
        
        const captionText = this.add.text(8, 12, text.substring(0, 35) + (text.length > 35 ? '...' : ''), {
            fontFamily: 'Inter, sans-serif',
            fontSize: '9px',
            color: '#555'
        }).setOrigin(0, 0.5);
        
        btn.add([bg, captionText]);
        btn.setSize(pageWidth - 30, 24);
        btn.bg = bg;
        btn.data = data;
        btn.optType = type;
        
        btn.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.selectPostElement(type, data, btn));
        
        this.rightContent.add(btn);
        return btn;
    }
    
    selectPostElement(type, data, btn) {
        const pageWidth = this.bookWidth / 2 - 60;
        this.postElements[type] = data;
        
        // Update button appearances
        const btnGroup = type === 'photo' ? this.photoBtns : type === 'caption' ? this.captionBtns : this.hashtagBtns;
        btnGroup.forEach(b => {
            const isSelected = b === btn;
            b.bg.clear();
            b.bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFF8E1, isSelected ? 0.4 : 1);
            b.bg.lineStyle(isSelected ? 2 : 1, isSelected ? 0x8B6914 : 0xC9A66B);
            if (type === 'caption') {
                b.bg.fillRoundedRect(0, 0, pageWidth - 30, 24, 4);
                b.bg.strokeRoundedRect(0, 0, pageWidth - 30, 24, 4);
            } else {
                b.bg.fillRoundedRect(0, 0, 60, 38, 5);
                b.bg.strokeRoundedRect(0, 0, 60, 38, 5);
            }
        });
        
        // Calculate engagement score
        this.updateEngagementPreview();
    }
    
    updateEngagementPreview() {
        const pageWidth = this.bookWidth / 2 - 60;
        const { photo, caption, hashtags } = this.postElements;
        
        if (!photo && !caption && !hashtags) {
            this.engagementResult.setText('Select options above...');
            return;
        }
        
        let totalScore = 0;
        let maxScore = 12; // 4 + 5 + 3 max per category
        let breakdown = [];
        
        if (photo) {
            totalScore += photo.engagement;
            breakdown.push(`📸 +${photo.engagement}`);
        }
        if (caption) {
            totalScore += caption.engagement;
            breakdown.push(`💬 +${caption.engagement}`);
        }
        if (hashtags) {
            totalScore += hashtags.engagement;
            breakdown.push(`# +${hashtags.engagement}`);
        }
        
        const percent = Math.round((totalScore / maxScore) * 100);
        let rating = '';
        let color = 0xCCCCCC;
        
        if (percent >= 80) {
            rating = '🔥 Viral Potential!';
            color = 0x4CAF50;
        } else if (percent >= 60) {
            rating = '👍 Good Engagement';
            color = 0x8BC34A;
        } else if (percent >= 40) {
            rating = '😐 Average';
            color = 0xFFC107;
        } else {
            rating = '👎 Low Reach';
            color = 0xF44336;
        }
        
        this.engagementResult.setText(`${breakdown.join(' | ')}\n${rating} (${percent}%)`);
        
        // Update meter
        const meterWidth = (totalScore / maxScore) * (pageWidth - 60);
        this.engagementMeterFill.clear();
        this.engagementMeterFill.fillStyle(color, 1);
        this.engagementMeterFill.fillRoundedRect(15, 330, meterWidth, 10, 3);
        
        // Mentor feedback
        if (percent >= 80) {
            this.setMentorText('Perfect combination! Story-driven content\nwith local hashtags wins every time!');
        } else if (percent >= 60) {
            this.setMentorText('Good job! Behind-the-scenes content\nbuilds authentic connections.');
        } else {
            this.setMentorText('Try story-telling captions and local\nhashtags for better engagement!');
        }
    }

    createMarketingSelection(pageWidth) {
        const options = [
            { id: 'organic', name: 'Organic Only', cost: 0, icon: '🌱', desc: 'Social media + word of mouth' },
            { id: 'balanced', name: 'Balanced', cost: 300, icon: '⚖️', desc: 'Organic + some local ads' },
            { id: 'aggressive', name: 'Aggressive', cost: 800, icon: '📢', desc: 'Full marketing push' }
        ];
        
        this.marketingButtons = [];
        options.forEach((item, i) => {
            const y = 55 + i * 80;
            const btn = this.add.container(pageWidth / 2 - 10, y);
            const bg = this.add.graphics();
            const isSelected = this.setupChoices.marketing === item.id;
            bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            bg.lineStyle(2, item.id === 'organic' ? 0x4CAF50 : 0xC9A66B);
            bg.fillRoundedRect(-pageWidth / 2 + 20, -32, pageWidth - 40, 64, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -32, pageWidth - 40, 64, 8);
            
            const icon = this.add.text(-pageWidth / 2 + 35, 0, item.icon, { fontSize: '24px' }).setOrigin(0, 0.5);
            const name = this.add.text(-pageWidth / 2 + 70, -12, item.name, { fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold', color: '#3E2723' });
            const cost = this.add.text(pageWidth / 2 - 40, -12, item.cost > 0 ? `$${item.cost}/mo` : 'Free', { fontFamily: 'Inter, sans-serif', fontSize: '12px', color: item.cost > 0 ? '#E67E22' : '#4CAF50' }).setOrigin(1, 0);
            const desc = this.add.text(-pageWidth / 2 + 70, 8, item.desc, { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#666' });
            
            btn.add([bg, icon, name, cost, desc]);
            btn.setSize(pageWidth - 40, 64); btn.bg = bg; btn.itemId = item.id;
            btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.selectMarketing(item.id));
            this.marketingButtons.push(btn);
            this.rightContent.add(btn);
        });
        if (!this.setupChoices.marketing) this.selectMarketing('organic');
    }

    selectMarketing(id) {
        this.setupChoices.marketing = id;
        const pageWidth = this.bookWidth / 2 - 60;
        this.marketingButtons.forEach(btn => {
            btn.bg.clear();
            const isSelected = btn.itemId === id;
            btn.bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            btn.bg.lineStyle(2, btn.itemId === 'organic' ? 0x4CAF50 : 0xC9A66B);
            btn.bg.fillRoundedRect(-pageWidth / 2 + 20, -32, pageWidth - 40, 64, 8);
            btn.bg.strokeRoundedRect(-pageWidth / 2 + 20, -32, pageWidth - 40, 64, 8);
        });
        const msgs = { organic: 'Smart start! Focus on quality and let word spread.', balanced: 'Good mix of free and paid promotion.', aggressive: 'Fast growth but watch those monthly costs!' };
        this.setMentorText(msgs[id] || '');
    }

    createSummaryPage(pageWidth) {
        const choices = this.setupChoices;
        const summary = `📋 Your Choices:\n\n🏪 Business: ${choices.businessName || 'Golden Crust Bakery'}\n🛡️ Structure: ${(choices.businessStructure || 'llc').toUpperCase()}\n📍 Location: ${(choices.location || 'suburban').charAt(0).toUpperCase() + (choices.location || 'suburban').slice(1)}\n💰 Financing: ${(choices.financing || 'savings').charAt(0).toUpperCase() + (choices.financing || 'savings').slice(1)}\n🛡️ Insurance: ${(choices.insurance || 'standard').charAt(0).toUpperCase() + (choices.insurance || 'standard').slice(1)}\n🎨 Brand: ${(choices.brandStyle || 'homey').charAt(0).toUpperCase() + (choices.brandStyle || 'homey').slice(1)}\n📢 Marketing: ${(choices.marketing || 'organic').charAt(0).toUpperCase() + (choices.marketing || 'organic').slice(1)}`;
        
        this.rightContent.add(this.add.text(0, 50, summary, { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#3E2723', lineSpacing: 6, wordWrap: { width: pageWidth } }));
        
        this.createActionButton(this.rightContent, pageWidth / 2, 300, '🎮 Start Your Bakery!', () => this.finishSetup());
    }

    // Helper methods for page content
    addLeftPageTitle(title) {
        const titleText = this.add.text(0, 0, title, {
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#1A0F08' // Much darker for contrast
        });
        const underline = this.add.graphics();
        underline.lineStyle(2, 0x8B4513, 0.8); // Darker brown
        underline.lineBetween(0, 28, titleText.width, 28);
        this.leftContent.add([titleText, underline]);
    }

    addRightPageTitle(title) {
        const titleText = this.add.text(0, 0, title, {
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#1A0F08' // Much darker for contrast
        });
        const underline = this.add.graphics();
        underline.lineStyle(2, 0x8B4513, 0.8); // Darker brown
        underline.lineBetween(0, 28, titleText.width, 28);
        this.rightContent.add([titleText, underline]);
    }

    createActionButton(container, x, y, text, callback) {
        const btn = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(0xD4AF37, 1);
        bg.fillRoundedRect(-80, -20, 160, 40, 20);
        bg.lineStyle(2, 0x8B4513);
        bg.strokeRoundedRect(-80, -20, 160, 40, 20);
        
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#1A0F08' // Much darker for readability on gold
        }).setOrigin(0.5);
        
        btn.add([bg, label]);
        btn.setSize(160, 40);
        btn.setInteractive({ useHandCursor: true })
            .on('pointerdown', callback)
            .on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.05, duration: 100 }))
            .on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 100 }));
        
        container.add(btn);
        return btn;
    }

    createNicheSelection(pageWidth) {
        const niches = [
            { id: 'retail', icon: '🏪', name: 'Retail Storefront', cost: '$30,000 - $50,000', selected: true },
            { id: 'wholesale', icon: '🏭', name: 'Wholesale', cost: '$50,000 - $100,000', selected: false },
            { id: 'truck', icon: '🚚', name: 'Food Truck', cost: '$20,000 - $40,000', selected: false },
            { id: 'home', icon: '🏠', name: 'Home-Based', cost: '$5,000 - $15,000', selected: false }
        ];
        
        const intro = this.add.text(0, 50,
            'For this simulation, we\'ll use Retail Storefront to teach all business skills:',
            {
                fontFamily: 'Georgia, serif',
                fontSize: '13px',
                fontStyle: 'italic',
                color: '#666'
            }
        );
        this.rightContent.add(intro);
        
        niches.forEach((niche, i) => {
            const y = 90 + i * 55;
            const card = this.add.container(pageWidth / 2 - 10, y);
            
            const bg = this.add.graphics();
            if (niche.selected) {
                bg.fillStyle(0xD4AF37, 0.3);
                bg.lineStyle(2, 0xD4AF37);
            } else {
                bg.fillStyle(0xE8E4D9, 0.5);
                bg.lineStyle(1, 0xC9A66B, 0.5);
            }
            bg.fillRoundedRect(-pageWidth / 2 + 20, -22, pageWidth - 40, 48, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -22, pageWidth - 40, 48, 8);
            
            const icon = this.add.text(-pageWidth / 2 + 35, 0, niche.icon, { fontSize: '24px' }).setOrigin(0, 0.5);
            const name = this.add.text(-pageWidth / 2 + 70, -8, niche.name, {
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                fontStyle: 'bold',
                color: niche.selected ? '#5D3A1A' : '#666'
            });
            const cost = this.add.text(-pageWidth / 2 + 70, 10, niche.cost, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: niche.selected ? '#8B4513' : '#999'
            });
            
            if (niche.selected) {
                const check = this.add.text(pageWidth / 2 - 45, 0, '✓', {
                    fontSize: '20px',
                    color: '#4CAF50'
                }).setOrigin(0.5);
                card.add(check);
            }
            
            card.add([bg, icon, name, cost]);
            this.rightContent.add(card);
        });
        
        this.setupChoices.niche = 'retail';
    }

    createNameSelection(pageWidth) {
        const names = [
            { name: 'Golden Crust Bakery', style: 'Classic & Warm' },
            { name: 'Rise & Shine Bakes', style: 'Friendly & Modern' },
            { name: 'The Flour Studio', style: 'Artisan & Upscale' },
            { name: 'Daily Bread Co.', style: 'Traditional & Trustworthy' }
        ];
        
        const intro = this.add.text(0, 50,
            'Select a name for your bakery:',
            {
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                color: '#3E2723'
            }
        );
        this.rightContent.add(intro);
        
        this.nameButtons = [];
        
        names.forEach((item, i) => {
            const y = 90 + i * 60;
            const btn = this.add.container(pageWidth / 2 - 10, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(0xFFFEF5, 1);
            bg.lineStyle(2, 0xC9A66B);
            bg.fillRoundedRect(-pageWidth / 2 + 20, -25, pageWidth - 40, 50, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -25, pageWidth - 40, 50, 8);
            
            const name = this.add.text(0, -8, item.name, {
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#5D3A1A'
            }).setOrigin(0.5);
            
            const style = this.add.text(0, 12, item.style, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                fontStyle: 'italic',
                color: '#8B4513'
            }).setOrigin(0.5);
            
            btn.add([bg, name, style]);
            btn.setSize(pageWidth - 40, 50);
            btn.bg = bg;
            btn.nameValue = item.name;
            
            btn.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectName(btn, item.name))
                .on('pointerover', () => {
                    if (this.setupChoices.businessName !== item.name) {
                        bg.clear();
                        bg.fillStyle(0xF5EFE0, 1);
                        bg.lineStyle(2, 0xD4AF37);
                        bg.fillRoundedRect(-pageWidth / 2 + 20, -25, pageWidth - 40, 50, 8);
                        bg.strokeRoundedRect(-pageWidth / 2 + 20, -25, pageWidth - 40, 50, 8);
                    }
                })
                .on('pointerout', () => {
                    if (this.setupChoices.businessName !== item.name) {
                        bg.clear();
                        bg.fillStyle(0xFFFEF5, 1);
                        bg.lineStyle(2, 0xC9A66B);
                        bg.fillRoundedRect(-pageWidth / 2 + 20, -25, pageWidth - 40, 50, 8);
                        bg.strokeRoundedRect(-pageWidth / 2 + 20, -25, pageWidth - 40, 50, 8);
                    }
                });
            
            this.nameButtons.push(btn);
            this.rightContent.add(btn);
        });
    }

    selectName(selectedBtn, name) {
        this.setupChoices.businessName = name;
        const pageWidth = this.bookWidth / 2 - 60;
        
        this.nameButtons.forEach(btn => {
            btn.bg.clear();
            if (btn.nameValue === name) {
                btn.bg.fillStyle(0xD4AF37, 0.3);
                btn.bg.lineStyle(3, 0xD4AF37);
            } else {
                btn.bg.fillStyle(0xFFFEF5, 1);
                btn.bg.lineStyle(2, 0xC9A66B);
            }
            btn.bg.fillRoundedRect(-pageWidth / 2 + 20, -25, pageWidth - 40, 50, 8);
            btn.bg.strokeRoundedRect(-pageWidth / 2 + 20, -25, pageWidth - 40, 50, 8);
        });
        
        this.setMentorText(`"${name}" - Great choice!\nA name that customers will remember.`);
    }

    // Mini-game: Interactive Cost Builder
    createCostBuilderGame(pageWidth) {
        // Ingredient items that can be dragged
        const ingredients = [
            { id: 'flour', name: 'Flour', cost: 0.40, icon: '🌾' },
            { id: 'butter', name: 'Butter', cost: 0.80, icon: '🧈' },
            { id: 'eggs', name: 'Eggs', cost: 0.30, icon: '🥚' },
            { id: 'sugar', name: 'Sugar', cost: 0.15, icon: '🍬' },
            { id: 'yeast', name: 'Yeast', cost: 0.10, icon: '🍞' },
            { id: 'premium', name: 'Premium Chocolate', cost: 1.50, icon: '🍫' }
        ];
        
        // Track what's in the basket
        this.costBasket = [];
        this.laborCost = 2.50; // Base labor
        this.overheadCost = 0.50; // Base overhead
        
        // Instructions
        const instrLabel = this.add.text(0, 40, '👆 Click ingredients to add to cost:', {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: '#666'
        });
        this.rightContent.add(instrLabel);
        
        // Create ingredient buttons
        const itemsPerRow = 3;
        ingredients.forEach((item, i) => {
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            const x = col * 75 + 30;
            const y = 70 + row * 55;
            
            const itemBtn = this.add.container(x, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(0xFFF8E1, 1);
            bg.lineStyle(2, 0xC9A66B);
            bg.fillRoundedRect(-30, -22, 60, 50, 6);
            bg.strokeRoundedRect(-30, -22, 60, 50, 6);
            
            const icon = this.add.text(0, -8, item.icon, { fontSize: '20px' }).setOrigin(0.5);
            const cost = this.add.text(0, 14, `$${item.cost.toFixed(2)}`, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                color: '#666'
            }).setOrigin(0.5);
            
            itemBtn.add([bg, icon, cost]);
            itemBtn.setSize(60, 50);
            itemBtn.bg = bg;
            itemBtn.ingredient = item;
            
            itemBtn.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    bg.clear();
                    bg.fillStyle(0xFFE082, 1);
                    bg.lineStyle(2, 0xD4AF37);
                    bg.fillRoundedRect(-30, -22, 60, 50, 6);
                    bg.strokeRoundedRect(-30, -22, 60, 50, 6);
                })
                .on('pointerout', () => {
                    bg.clear();
                    bg.fillStyle(0xFFF8E1, 1);
                    bg.lineStyle(2, 0xC9A66B);
                    bg.fillRoundedRect(-30, -22, 60, 50, 6);
                    bg.strokeRoundedRect(-30, -22, 60, 50, 6);
                })
                .on('pointerdown', () => this.addToBasket(item));
            
            this.rightContent.add(itemBtn);
        });
        
        // Cost basket display
        const basketY = 195;
        const basketBg = this.add.graphics();
        basketBg.fillStyle(0xF5F5DC, 1);
        basketBg.lineStyle(2, 0x8D6E63);
        basketBg.fillRoundedRect(0, basketY, pageWidth - 20, 100, 8);
        basketBg.strokeRoundedRect(0, basketY, pageWidth - 20, 100, 8);
        this.rightContent.add(basketBg);
        
        const basketLabel = this.add.text(10, basketY + 8, '🧺 Cost Basket:', {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#5D4037'
        });
        this.rightContent.add(basketLabel);
        
        // Basket items display (will be updated)
        this.basketItemsText = this.add.text(10, basketY + 28, 'Click ingredients above...', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#888'
        });
        this.rightContent.add(this.basketItemsText);
        
        // Total display
        this.totalCostText = this.add.text(10, basketY + 70, `Total: $0.00 | + Labor $2.50 | + OH $0.50`, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#666'
        });
        this.rightContent.add(this.totalCostText);
        
        // Clear basket button
        const clearBtn = this.add.text(pageWidth - 50, basketY + 8, '🗑️ Clear', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#999'
        }).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.clearBasket());
        this.rightContent.add(clearBtn);
        
        // Price selection area
        const priceY = 305;
        const priceLabel = this.add.text(0, priceY, 'Set your selling price:', {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: '#3E2723'
        });
        this.rightContent.add(priceLabel);
        
        // Price slider area
        this.createPriceSlider(priceY + 25, pageWidth);
        
        this.updateBasketDisplay();
    }
    
    addToBasket(item) {
        this.costBasket.push({ ...item });
        this.updateBasketDisplay();
        
        // Play a subtle feedback
        this.setMentorText(`Added ${item.name}! Keep building your recipe.`);
    }
    
    clearBasket() {
        this.costBasket = [];
        this.updateBasketDisplay();
        this.setMentorText('Basket cleared. Start fresh!');
    }
    
    updateBasketDisplay() {
        // Calculate totals
        const ingredientCost = this.costBasket.reduce((sum, item) => sum + item.cost, 0);
        const totalCost = ingredientCost + this.laborCost + this.overheadCost;
        
        // Update basket items text
        if (this.costBasket.length === 0) {
            this.basketItemsText.setText('Click ingredients above...');
        } else {
            const itemCounts = {};
            this.costBasket.forEach(item => {
                itemCounts[item.icon] = (itemCounts[item.icon] || 0) + 1;
            });
            const itemStr = Object.entries(itemCounts)
                .map(([icon, count]) => `${icon}×${count}`)
                .join(' ');
            this.basketItemsText.setText(itemStr);
        }
        
        // Update total
        this.totalCostText.setText(
            `Ingredients: $${ingredientCost.toFixed(2)} | Labor: $${this.laborCost.toFixed(2)} | OH: $${this.overheadCost.toFixed(2)}\n` +
            `📊 TOTAL COST: $${totalCost.toFixed(2)}`
        );
        
        // Store for pricing calculation
        this.currentProductCost = totalCost;
        
        // Update margin display if price slider exists
        if (this.currentSellingPrice) {
            this.updateMarginDisplay();
        }
    }
    
    createPriceSlider(y, pageWidth) {
        // Price buttons instead of slider for simplicity
        const prices = [3, 4, 5, 6, 7, 8, 9, 10];
        this.priceSliderBtns = [];
        
        prices.forEach((price, i) => {
            const x = 10 + i * 26;
            const btn = this.add.text(x, y, `$${price}`, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#666',
                backgroundColor: '#FFF8E1',
                padding: { x: 4, y: 4 }
            });
            btn.priceValue = price;
            btn.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectSellingPrice(price));
            this.priceSliderBtns.push(btn);
            this.rightContent.add(btn);
        });
        
        // Margin result display
        this.marginResultText = this.add.text(0, y + 35, 'Select a selling price above...', {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: '#666'
        });
        this.rightContent.add(this.marginResultText);
        
        // Default selection
        this.currentSellingPrice = 6;
        this.selectSellingPrice(6);
    }
    
    selectSellingPrice(price) {
        this.currentSellingPrice = price;
        this.setupChoices.pricing = price;
        
        // Highlight selected button
        this.priceSliderBtns.forEach(btn => {
            const isSelected = btn.priceValue === price;
            btn.setStyle({
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: isSelected ? '#fff' : '#666',
                backgroundColor: isSelected ? '#4CAF50' : '#FFF8E1',
                padding: { x: 4, y: 4 }
            });
        });
        
        this.updateMarginDisplay();
    }
    
    updateMarginDisplay() {
        const cost = this.currentProductCost || 3.00;
        const price = this.currentSellingPrice || 6;
        const profit = price - cost;
        const margin = ((profit / price) * 100).toFixed(0);
        
        let analysis = '';
        let color = '#666';
        
        if (margin < 20) {
            analysis = '⚠️ Danger! Margin too thin.';
            color = '#F44336';
        } else if (margin < 35) {
            analysis = '😐 Tight margins. Be careful!';
            color = '#FF9800';
        } else if (margin < 50) {
            analysis = '✓ Good margin for a bakery!';
            color = '#4CAF50';
        } else {
            analysis = '🌟 Excellent! Premium pricing.';
            color = '#2196F3';
        }
        
        this.marginResultText.setText(
            `Profit: $${profit.toFixed(2)} | Margin: ${margin}%\n${analysis}`
        );
        this.marginResultText.setColor(color);
        
        // Update mentor based on result
        if (margin < 20) {
            this.setMentorText('Your price doesn\'t cover costs!\nYou\'ll lose money on every sale.');
        } else if (margin < 35) {
            this.setMentorText('This works, but one slow day\ncould wipe out your profit.');
        } else if (margin < 50) {
            this.setMentorText('Nice! This gives you room for\nslower days and unexpected costs.');
        } else {
            this.setMentorText('Premium pricing! Make sure your\nquality justifies the price.');
        }
    }

    createPricingCalculator(pageWidth) {
        const costBase = 6.25;
        const prices = [
            { price: 7.00, margin: '12%', risk: 'Too low - barely covers costs', color: '#F44336' },
            { price: 8.50, margin: '36%', risk: 'Safe - standard bakery margin', color: '#FFC107' },
            { price: 10.00, margin: '60%', risk: 'Good - healthy profit margin', color: '#4CAF50' },
            { price: 12.00, margin: '92%', risk: 'Premium - need to justify quality', color: '#2196F3' }
        ];
        
        const costLabel = this.add.text(0, 50, `Your cost: $${costBase.toFixed(2)} per loaf`, {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#3E2723'
        });
        this.rightContent.add(costLabel);
        
        this.priceButtons = [];
        
        prices.forEach((item, i) => {
            const y = 100 + i * 55;
            const btn = this.add.container(pageWidth / 2 - 10, y);
            
            const bg = this.add.graphics();
            bg.fillStyle(0xFFFEF5, 1);
            bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(item.color).color);
            bg.fillRoundedRect(-pageWidth / 2 + 20, -22, pageWidth - 40, 48, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -22, pageWidth - 40, 48, 8);
            
            const priceText = this.add.text(-pageWidth / 2 + 40, 0, `$${item.price.toFixed(2)}`, {
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                fontStyle: 'bold',
                color: item.color
            }).setOrigin(0, 0.5);
            
            const marginText = this.add.text(-pageWidth / 2 + 100, -8, `Margin: ${item.margin}`, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#666'
            });
            
            const riskText = this.add.text(-pageWidth / 2 + 100, 8, item.risk, {
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontStyle: 'italic',
                color: '#888'
            });
            
            btn.add([bg, priceText, marginText, riskText]);
            btn.setSize(pageWidth - 40, 48);
            btn.bg = bg;
            btn.priceValue = item.price;
            btn.colorValue = item.color;
            
            btn.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectPrice(btn, item));
            
            this.priceButtons.push(btn);
            this.rightContent.add(btn);
        });
    }

    selectPrice(selectedBtn, item) {
        this.setupChoices.pricing = item.price;
        const pageWidth = this.bookWidth / 2 - 60;
        
        this.priceButtons.forEach(btn => {
            btn.bg.clear();
            const isSelected = btn.priceValue === item.price;
            btn.bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            btn.bg.lineStyle(isSelected ? 3 : 2, Phaser.Display.Color.HexStringToColor(btn.colorValue).color);
            btn.bg.fillRoundedRect(-pageWidth / 2 + 20, -22, pageWidth - 40, 48, 8);
            btn.bg.strokeRoundedRect(-pageWidth / 2 + 20, -22, pageWidth - 40, 48, 8);
        });
        
        const advice = item.margin === '60%' 
            ? 'Perfect! A healthy margin that\'s still competitive.'
            : item.margin === '92%'
            ? 'Bold choice! You\'ll need premium ingredients and branding.'
            : item.margin === '36%'
            ? 'Safe, but you might struggle in tough months.'
            : 'Too risky! One slow day and you\'re losing money.';
        
        this.setMentorText(advice);
    }

    // Chapter 2 helper methods
    createStructureSelection(pageWidth) {
        const structures = [
            { id: 'sole_prop', name: 'Sole Proprietorship', cost: '$0', risk: 'High personal risk', icon: '🏠' },
            { id: 'llc', name: 'LLC', cost: '$500-800', risk: 'Limited liability', icon: '🛡️', recommended: true },
            { id: 'scorp', name: 'S-Corporation', cost: '$1,000+', risk: 'Complex but protected', icon: '🏢' }
        ];
        
        this.structureButtons = [];
        structures.forEach((item, i) => {
            const y = 60 + i * 70;
            const btn = this.add.container(pageWidth / 2 - 10, y);
            const bg = this.add.graphics();
            const isSelected = this.setupChoices.businessStructure === item.id;
            bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            bg.lineStyle(2, item.recommended ? 0x4CAF50 : 0xC9A66B);
            bg.fillRoundedRect(-pageWidth / 2 + 20, -28, pageWidth - 40, 56, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -28, pageWidth - 40, 56, 8);
            
            const icon = this.add.text(-pageWidth / 2 + 35, 0, item.icon, { fontSize: '24px' }).setOrigin(0, 0.5);
            const name = this.add.text(-pageWidth / 2 + 70, -10, item.name, { fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold', color: '#3E2723' });
            const details = this.add.text(-pageWidth / 2 + 70, 8, `${item.cost} • ${item.risk}`, { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#666' });
            
            if (item.recommended) {
                const rec = this.add.text(pageWidth / 2 - 50, 0, '✓ Best', { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4CAF50' }).setOrigin(0.5);
                btn.add(rec);
            }
            
            btn.add([bg, icon, name, details]);
            btn.setSize(pageWidth - 40, 56);
            btn.bg = bg; btn.itemId = item.id; btn.recommended = item.recommended;
            btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.selectStructure(item.id));
            this.structureButtons.push(btn);
            this.rightContent.add(btn);
        });
        if (!this.setupChoices.businessStructure) this.selectStructure('llc');
    }

    selectStructure(id) {
        this.setupChoices.businessStructure = id;
        const pageWidth = this.bookWidth / 2 - 60;
        this.structureButtons.forEach(btn => {
            btn.bg.clear();
            const isSelected = btn.itemId === id;
            btn.bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            btn.bg.lineStyle(2, btn.recommended ? 0x4CAF50 : 0xC9A66B);
            btn.bg.fillRoundedRect(-pageWidth / 2 + 20, -28, pageWidth - 40, 56, 8);
            btn.bg.strokeRoundedRect(-pageWidth / 2 + 20, -28, pageWidth - 40, 56, 8);
        });
        const messages = { sole_prop: 'Simple but risky. Your personal assets are exposed.', llc: 'Great choice! Best balance of protection and simplicity.', scorp: 'Maximum protection but more paperwork and costs.' };
        this.setMentorText(messages[id] || '');
    }

    createPermitChecklist(pageWidth) {
        const permits = [
            { id: 'business_license', name: 'Business License', cost: 200, required: true },
            { id: 'health_permit', name: 'Health Permit', cost: 500, required: true },
            { id: 'food_handler', name: 'Food Handler Cert', cost: 25, required: true },
            { id: 'sales_tax', name: 'Sales Tax Permit', cost: 0, required: true },
            { id: 'signage', name: 'Signage Permit', cost: 150, required: false },
            { id: 'music', name: 'Music License (BMI)', cost: 400, required: false }
        ];
        
        if (!this.setupChoices.permits) this.setupChoices.permits = permits.filter(p => p.required).map(p => p.id);
        this.permitChecks = [];
        let totalCost = 0;
        
        permits.forEach((item, i) => {
            const y = 50 + i * 42;
            const isChecked = this.setupChoices.permits.includes(item.id);
            if (isChecked) totalCost += item.cost;
            
            const row = this.add.container(0, y);
            const checkbox = this.add.graphics();
            checkbox.fillStyle(isChecked ? 0x4CAF50 : 0xFFFEF5, 1);
            checkbox.lineStyle(2, isChecked ? 0x4CAF50 : 0xC9A66B);
            checkbox.fillRoundedRect(0, -12, 24, 24, 4);
            checkbox.strokeRoundedRect(0, -12, 24, 24, 4);
            if (isChecked) {
                const check = this.add.text(12, 0, '✓', { fontSize: '16px', color: '#FFF' }).setOrigin(0.5);
                row.add(check);
            }
            
            const name = this.add.text(35, -2, item.name + (item.required ? ' *' : ''), { fontFamily: 'Georgia, serif', fontSize: '13px', color: item.required ? '#3E2723' : '#666' });
            const cost = this.add.text(pageWidth - 40, -2, item.cost > 0 ? `$${item.cost}` : 'Free', { fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#888' }).setOrigin(1, 0);
            
            row.add([checkbox, name, cost]);
            row.setSize(pageWidth, 30);
            row.permitId = item.id; row.required = item.required; row.cost = item.cost; row.checkbox = checkbox;
            
            if (!item.required) {
                row.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePermit(row, item));
            }
            this.permitChecks.push(row);
            this.rightContent.add(row);
        });
        
        this.permitTotalText = this.add.text(pageWidth / 2, 310, `Total: $${totalCost}`, { fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'bold', color: '#5D3A1A' }).setOrigin(0.5);
        this.rightContent.add(this.permitTotalText);
        this.rightContent.add(this.add.text(pageWidth / 2, 335, '* Required permits', { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#888' }).setOrigin(0.5));
    }

    togglePermit(row, item) {
        const idx = this.setupChoices.permits.indexOf(item.id);
        if (idx >= 0) { this.setupChoices.permits.splice(idx, 1); }
        else { this.setupChoices.permits.push(item.id); this.budget.spent += item.cost; }
        
        const isChecked = this.setupChoices.permits.includes(item.id);
        row.checkbox.clear();
        row.checkbox.fillStyle(isChecked ? 0x4CAF50 : 0xFFFEF5, 1);
        row.checkbox.lineStyle(2, isChecked ? 0x4CAF50 : 0xC9A66B);
        row.checkbox.fillRoundedRect(0, -12, 24, 24, 4);
        row.checkbox.strokeRoundedRect(0, -12, 24, 24, 4);
        
        let total = 0;
        this.permitChecks.forEach(r => { if (this.setupChoices.permits.includes(r.permitId)) total += r.cost; });
        this.permitTotalText.setText(`Total: $${total}`);
        this.updateBudgetBar();
    }

    createInsuranceSelection(pageWidth) {
        const options = [
            { id: 'basic', name: 'Basic', cost: 100, desc: 'General liability only', color: '#FFC107' },
            { id: 'standard', name: 'Standard', cost: 200, desc: '+ Product liability', color: '#4CAF50', recommended: true },
            { id: 'premium', name: 'Premium', cost: 400, desc: '+ Property & interruption', color: '#2196F3' }
        ];
        
        this.insuranceButtons = [];
        options.forEach((item, i) => {
            const y = 60 + i * 75;
            const btn = this.add.container(pageWidth / 2 - 10, y);
            const bg = this.add.graphics();
            const isSelected = this.setupChoices.insurance === item.id;
            bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(item.color).color);
            bg.fillRoundedRect(-pageWidth / 2 + 20, -30, pageWidth - 40, 60, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -30, pageWidth - 40, 60, 8);
            
            const name = this.add.text(-pageWidth / 2 + 35, -10, item.name, { fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'bold', color: '#3E2723' });
            const cost = this.add.text(pageWidth / 2 - 45, -10, `$${item.cost}/mo`, { fontFamily: 'Inter, sans-serif', fontSize: '14px', color: item.color }).setOrigin(1, 0);
            const desc = this.add.text(-pageWidth / 2 + 35, 10, item.desc, { fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#666' });
            
            if (item.recommended) btn.add(this.add.text(pageWidth / 2 - 45, 10, '✓ Recommended', { fontSize: '10px', color: '#4CAF50' }).setOrigin(1, 0));
            
            btn.add([bg, name, cost, desc]);
            btn.setSize(pageWidth - 40, 60); btn.bg = bg; btn.itemId = item.id; btn.color = item.color;
            btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.selectInsurance(item.id));
            this.insuranceButtons.push(btn);
            this.rightContent.add(btn);
        });
        if (!this.setupChoices.insurance) this.selectInsurance('standard');
    }

    selectInsurance(id) {
        this.setupChoices.insurance = id;
        const pageWidth = this.bookWidth / 2 - 60;
        this.insuranceButtons.forEach(btn => {
            btn.bg.clear();
            const isSelected = btn.itemId === id;
            btn.bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            btn.bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(btn.color).color);
            btn.bg.fillRoundedRect(-pageWidth / 2 + 20, -30, pageWidth - 40, 60, 8);
            btn.bg.strokeRoundedRect(-pageWidth / 2 + 20, -30, pageWidth - 40, 60, 8);
        });
        const msgs = { basic: 'Minimum coverage. You\'re taking some risk.', standard: 'Smart choice! Good protection at reasonable cost.', premium: 'Maximum peace of mind, but higher monthly cost.' };
        this.setMentorText(msgs[id] || '');
    }

    // Chapter 3 helper methods
    createLocationSelection(pageWidth) {
        const locations = [
            { id: 'downtown', name: 'Downtown', rent: 3500, traffic: 1.5, icon: '🏙️', desc: 'High traffic, high rent' },
            { id: 'suburban', name: 'Suburban', rent: 1800, traffic: 1.0, icon: '🏘️', desc: 'Balanced option', recommended: true },
            { id: 'mall', name: 'Shopping Center', rent: 2800, traffic: 1.3, icon: '🛒', desc: 'Built-in customers' }
        ];
        
        this.locationButtons = [];
        locations.forEach((item, i) => {
            const y = 55 + i * 85;
            const btn = this.add.container(pageWidth / 2 - 10, y);
            const bg = this.add.graphics();
            const isSelected = this.setupChoices.location === item.id;
            bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            bg.lineStyle(2, item.recommended ? 0x4CAF50 : 0xC9A66B);
            bg.fillRoundedRect(-pageWidth / 2 + 20, -35, pageWidth - 40, 70, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -35, pageWidth - 40, 70, 8);
            
            const icon = this.add.text(-pageWidth / 2 + 35, 0, item.icon, { fontSize: '28px' }).setOrigin(0, 0.5);
            const name = this.add.text(-pageWidth / 2 + 75, -15, item.name, { fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'bold', color: '#3E2723' });
            const desc = this.add.text(-pageWidth / 2 + 75, 5, item.desc, { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#666' });
            const rent = this.add.text(-pageWidth / 2 + 75, 22, `$${item.rent}/mo • Traffic: ${item.traffic}x`, { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#888' });
            
            if (item.recommended) btn.add(this.add.text(pageWidth / 2 - 45, -15, '✓ Best Value', { fontSize: '10px', color: '#4CAF50' }).setOrigin(1, 0));
            
            btn.add([bg, icon, name, desc, rent]);
            btn.setSize(pageWidth - 40, 70); btn.bg = bg; btn.itemId = item.id; btn.recommended = item.recommended;
            btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.selectLocation(item.id));
            this.locationButtons.push(btn);
            this.rightContent.add(btn);
        });
        if (!this.setupChoices.location) this.selectLocation('suburban');
    }

    selectLocation(id) {
        this.setupChoices.location = id;
        const pageWidth = this.bookWidth / 2 - 60;
        this.locationButtons.forEach(btn => {
            btn.bg.clear();
            const isSelected = btn.itemId === id;
            btn.bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            btn.bg.lineStyle(2, btn.recommended ? 0x4CAF50 : 0xC9A66B);
            btn.bg.fillRoundedRect(-pageWidth / 2 + 20, -35, pageWidth - 40, 70, 8);
            btn.bg.strokeRoundedRect(-pageWidth / 2 + 20, -35, pageWidth - 40, 70, 8);
        });
        const msgs = { downtown: 'Prime spot! Make sure your revenue justifies the rent.', suburban: 'Great choice for starting out. Room to grow!', mall: 'Built-in traffic but watch those extra fees.' };
        this.setMentorText(msgs[id] || '');
    }

    createEquipmentSelection(pageWidth) {
        const equipment = [
            { type: 'oven', name: 'Oven', options: [
                { id: 'basic', name: 'Basic', cost: 3000, capacity: 20 },
                { id: 'standard', name: 'Standard', cost: 6000, capacity: 40 },
                { id: 'premium', name: 'Commercial', cost: 12000, capacity: 80 }
            ]},
            { type: 'mixer', name: 'Mixer', options: [
                { id: 'basic', name: 'Basic', cost: 500, capacity: 5 },
                { id: 'standard', name: 'Standard', cost: 1500, capacity: 20 },
                { id: 'premium', name: 'Commercial', cost: 4000, capacity: 60 }
            ]},
            { type: 'display', name: 'Display', options: [
                { id: 'basic', name: 'Counter', cost: 800, capacity: 12 },
                { id: 'standard', name: 'Glass Case', cost: 2000, capacity: 24 },
                { id: 'premium', name: 'Refrigerated', cost: 4500, capacity: 48 }
            ]}
        ];
        
        equipment.forEach((equip, i) => {
            const y = 50 + i * 95;
            const label = this.add.text(0, y, `🔧 ${equip.name}:`, { fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'bold', color: '#5D3A1A' });
            this.rightContent.add(label);
            
            equip.options.forEach((opt, j) => {
                const btnY = y + 25 + j * 22;
                const btn = this.add.container(pageWidth / 2, btnY);
                const isSelected = this.setupChoices.equipment[equip.type] === opt.id;
                
                const radio = this.add.graphics();
                radio.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, 1);
                radio.lineStyle(2, 0xC9A66B);
                radio.fillCircle(-pageWidth / 2 + 30, 0, 8);
                radio.strokeCircle(-pageWidth / 2 + 30, 0, 8);
                if (isSelected) { radio.fillStyle(0x5D3A1A, 1); radio.fillCircle(-pageWidth / 2 + 30, 0, 4); }
                
                const name = this.add.text(-pageWidth / 2 + 50, 0, opt.name, { fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#3E2723' }).setOrigin(0, 0.5);
                const cost = this.add.text(pageWidth / 2 - 30, 0, `$${opt.cost.toLocaleString()}`, { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#888' }).setOrigin(1, 0.5);
                
                btn.add([radio, name, cost]);
                btn.setSize(pageWidth - 20, 20); btn.radio = radio; btn.type = equip.type; btn.optId = opt.id;
                btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.selectEquipment(equip.type, opt.id));
                this.rightContent.add(btn);
            });
        });
        // Set defaults
        if (!this.setupChoices.equipment.oven) this.setupChoices.equipment = { oven: 'standard', mixer: 'standard', display: 'standard' };
    }

    selectEquipment(type, optId) {
        this.setupChoices.equipment[type] = optId;
        this.setMentorText('Equipment selected! Standard options offer best value.');
    }

    // Mini-game: Equipment ROI Comparison
    createEquipmentROIGame(pageWidth) {
        // Oven comparison slider
        const ovenOptions = [
            { id: 'basic', name: 'Basic Oven', cost: 3000, capacity: 20, daily: 40, revenue: 320 },
            { id: 'standard', name: 'Standard Oven', cost: 6000, capacity: 40, daily: 80, revenue: 640 },
            { id: 'premium', name: 'Commercial Oven', cost: 12000, capacity: 80, daily: 160, revenue: 1280 }
        ];
        
        // Equipment type label
        const typeLabel = this.add.text(0, 40, '🔥 Compare Ovens:', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#5D3A1A'
        });
        this.rightContent.add(typeLabel);
        
        // Slider track
        const sliderY = 75;
        const sliderWidth = pageWidth - 40;
        const track = this.add.graphics();
        track.fillStyle(0xE0E0E0, 1);
        track.fillRoundedRect(10, sliderY - 4, sliderWidth, 8, 4);
        this.rightContent.add(track);
        
        // Slider buttons
        this.ovenSliderBtns = [];
        ovenOptions.forEach((opt, i) => {
            const x = 10 + (i * (sliderWidth / 2));
            const btn = this.add.container(x, sliderY);
            
            const knob = this.add.graphics();
            const isSelected = this.setupChoices.equipment?.oven === opt.id || (i === 1 && !this.setupChoices.equipment?.oven);
            knob.fillStyle(isSelected ? 0xD4AF37 : 0xCCCCCC, 1);
            knob.fillCircle(0, 0, 14);
            knob.lineStyle(3, isSelected ? 0x8B6914 : 0x999999);
            knob.strokeCircle(0, 0, 14);
            
            const label = this.add.text(0, 25, opt.name.replace(' Oven', ''), {
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                color: '#666'
            }).setOrigin(0.5);
            
            btn.add([knob, label]);
            btn.setSize(30, 30);
            btn.knob = knob;
            btn.ovenData = opt;
            btn.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectOvenROI(opt, i));
            
            this.ovenSliderBtns.push(btn);
            this.rightContent.add(btn);
        });
        
        // ROI comparison display
        const displayY = 115;
        const displayBg = this.add.graphics();
        displayBg.fillStyle(0xFFF8E1, 1);
        displayBg.lineStyle(2, 0xC9A66B);
        displayBg.fillRoundedRect(5, displayY, pageWidth - 30, 140, 8);
        displayBg.strokeRoundedRect(5, displayY, pageWidth - 30, 140, 8);
        this.rightContent.add(displayBg);
        
        // ROI stats display
        this.roiStatsText = this.add.text(15, displayY + 10, '', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#3E2723',
            lineSpacing: 4
        });
        this.rightContent.add(this.roiStatsText);
        
        // Visual ROI bar
        this.roiBarBg = this.add.graphics();
        this.roiBarBg.fillStyle(0xE0E0E0, 1);
        this.roiBarBg.fillRoundedRect(15, displayY + 110, pageWidth - 60, 16, 4);
        this.rightContent.add(this.roiBarBg);
        
        this.roiBarFill = this.add.graphics();
        this.rightContent.add(this.roiBarFill);
        
        this.roiBarLabel = this.add.text(pageWidth - 50, displayY + 118, '', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: '#666'
        }).setOrigin(0.5);
        this.rightContent.add(this.roiBarLabel);
        
        // Confirm selection button
        const confirmY = displayY + 150;
        const confirmBtn = this.add.container(pageWidth / 2 - 10, confirmY);
        const confirmBg = this.add.graphics();
        confirmBg.fillStyle(0x4CAF50, 1);
        confirmBg.fillRoundedRect(-60, -14, 120, 28, 6);
        const confirmText = this.add.text(0, 0, '✓ Confirm Selection', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#FFF'
        }).setOrigin(0.5);
        confirmBtn.add([confirmBg, confirmText]);
        confirmBtn.setSize(120, 28);
        confirmBtn.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.setMentorText('Great choice! Equipment selected.\nTurn the page to continue.');
            });
        this.rightContent.add(confirmBtn);
        
        // Initialize with standard selection
        this.selectOvenROI(ovenOptions[1], 1);
    }
    
    selectOvenROI(option, index) {
        const pageWidth = this.bookWidth / 2 - 60;
        this.setupChoices.equipment = this.setupChoices.equipment || {};
        this.setupChoices.equipment.oven = option.id;
        this.setupChoices.equipment.mixer = 'standard';
        this.setupChoices.equipment.display = 'standard';
        
        // Update slider appearance
        this.ovenSliderBtns.forEach((btn, i) => {
            const isSelected = i === index;
            btn.knob.clear();
            btn.knob.fillStyle(isSelected ? 0xD4AF37 : 0xCCCCCC, 1);
            btn.knob.fillCircle(0, 0, 14);
            btn.knob.lineStyle(3, isSelected ? 0x8B6914 : 0x999999);
            btn.knob.strokeCircle(0, 0, 14);
        });
        
        // Calculate ROI
        const profitPerItem = 4; // $4 profit per baked item
        const dailyProfit = option.daily * profitPerItem;
        const monthlyProfit = dailyProfit * 26; // 26 working days
        const monthsToROI = Math.ceil(option.cost / monthlyProfit);
        
        // Update stats display
        this.roiStatsText.setText(
            `💰 Cost: $${option.cost.toLocaleString()}\n` +
            `🍞 Daily Capacity: ${option.daily} items\n` +
            `📈 Daily Revenue: ~$${option.revenue}\n` +
            `💵 Monthly Profit: ~$${monthlyProfit.toLocaleString()}\n` +
            `⏱️ ROI Payback: ${monthsToROI} months`
        );
        
        // Update ROI bar (12 months max scale)
        const barWidth = Math.min(monthsToROI / 12, 1) * (pageWidth - 60);
        this.roiBarFill.clear();
        const barColor = monthsToROI <= 3 ? 0x4CAF50 : monthsToROI <= 6 ? 0xFFC107 : 0xF44336;
        this.roiBarFill.fillStyle(barColor, 1);
        this.roiBarFill.fillRoundedRect(15, 225, barWidth, 16, 4);
        
        this.roiBarLabel.setText(`${monthsToROI}mo`);
        
        // Mentor feedback
        if (monthsToROI <= 3) {
            this.setMentorText('Excellent ROI! This pays for itself quickly.');
        } else if (monthsToROI <= 6) {
            this.setMentorText('Good choice! Reasonable payback period.');
        } else {
            this.setMentorText('High investment. Make sure you have\nthe volume to justify this!');
        }
    }

    createFinancingSelection(pageWidth) {
        const options = [
            { id: 'savings', name: 'Personal Savings', icon: '💰', desc: 'Use your own money', pros: 'No debt', cons: 'Limited capital' },
            { id: 'loan', name: 'Bank Loan', icon: '🏦', desc: 'Borrow from a bank', pros: 'More capital', cons: 'Monthly payments' },
            { id: 'mixed', name: 'Mixed', icon: '⚖️', desc: 'Savings + small loan', pros: 'Balanced approach', cons: 'Some debt' }
        ];
        
        this.financeButtons = [];
        options.forEach((item, i) => {
            const y = 55 + i * 85;
            const btn = this.add.container(pageWidth / 2 - 10, y);
            const bg = this.add.graphics();
            const isSelected = this.setupChoices.financing === item.id;
            bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            bg.lineStyle(2, item.id === 'savings' ? 0x4CAF50 : 0xC9A66B);
            bg.fillRoundedRect(-pageWidth / 2 + 20, -35, pageWidth - 40, 70, 8);
            bg.strokeRoundedRect(-pageWidth / 2 + 20, -35, pageWidth - 40, 70, 8);
            
            const icon = this.add.text(-pageWidth / 2 + 35, 0, item.icon, { fontSize: '24px' }).setOrigin(0, 0.5);
            const name = this.add.text(-pageWidth / 2 + 70, -15, item.name, { fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold', color: '#3E2723' });
            const desc = this.add.text(-pageWidth / 2 + 70, 5, item.desc, { fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#666' });
            const proscons = this.add.text(-pageWidth / 2 + 70, 22, `✓ ${item.pros}  ✗ ${item.cons}`, { fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#888' });
            
            btn.add([bg, icon, name, desc, proscons]);
            btn.setSize(pageWidth - 40, 70); btn.bg = bg; btn.itemId = item.id;
            btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.selectFinancing(item.id));
            this.financeButtons.push(btn);
            this.rightContent.add(btn);
        });
        if (!this.setupChoices.financing) this.selectFinancing('savings');
    }

    selectFinancing(id) {
        this.setupChoices.financing = id;
        const pageWidth = this.bookWidth / 2 - 60;
        this.financeButtons.forEach(btn => {
            btn.bg.clear();
            const isSelected = btn.itemId === id;
            btn.bg.fillStyle(isSelected ? 0xD4AF37 : 0xFFFEF5, isSelected ? 0.3 : 1);
            btn.bg.lineStyle(2, btn.itemId === 'savings' ? 0x4CAF50 : 0xC9A66B);
            btn.bg.fillRoundedRect(-pageWidth / 2 + 20, -35, pageWidth - 40, 70, 8);
            btn.bg.strokeRoundedRect(-pageWidth / 2 + 20, -35, pageWidth - 40, 70, 8);
        });
        const msgs = { savings: 'Smart! Starting debt-free gives you flexibility.', loan: 'More capital but remember those monthly payments.', mixed: 'Good balance. Keep the loan amount manageable.' };
        this.setMentorText(msgs[id] || '');
    }

    // Skip confirmation
    showSkipConfirm() {
        const { width, height } = this.scale;
        
        // Overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive()
            .setDepth(50);
        
        // Dialog
        const dialog = this.add.container(width / 2, height / 2);
        dialog.setDepth(51);
        
        const bg = this.add.graphics();
        bg.fillStyle(0xFFFEF5, 1);
        bg.fillRoundedRect(-200, -120, 400, 240, 15);
        bg.lineStyle(3, 0xD4AF37);
        bg.strokeRoundedRect(-200, -120, 400, 240, 15);
        
        const title = this.add.text(0, -90, '⏭ Skip Tutorial?', {
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#5D3A1A'
        }).setOrigin(0.5);
        
        const message = this.add.text(0, -20,
            'You can skip the storybook and start\nplaying with default settings.\n\nYou\'ll miss out on learning the\nbusiness fundamentals, but you can\nalways restart later!',
            {
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                color: '#3E2723',
                align: 'center',
                lineSpacing: 4
            }
        ).setOrigin(0.5);
        
        // Buttons
        const continueBtn = this.add.container(-80, 80);
        const continueBg = this.add.graphics();
        continueBg.fillStyle(0xC9A66B, 1);
        continueBg.fillRoundedRect(-70, -18, 140, 36, 18);
        const continueText = this.add.text(0, 0, 'Keep Reading', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#FFF'
        }).setOrigin(0.5);
        continueBtn.add([continueBg, continueText]);
        continueBtn.setSize(140, 36);
        continueBtn.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                overlay.destroy();
                dialog.destroy();
            });
        
        const skipBtn = this.add.container(80, 80);
        const skipBg = this.add.graphics();
        skipBg.fillStyle(0xD4AF37, 1);
        skipBg.fillRoundedRect(-70, -18, 140, 36, 18);
        const skipText = this.add.text(0, 0, 'Skip & Play', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#3E2723'
        }).setOrigin(0.5);
        skipBtn.add([skipBg, skipText]);
        skipBtn.setSize(140, 36);
        skipBtn.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.finishSetup(true));
        
        dialog.add([bg, title, message, continueBtn, skipBtn]);
    }

    finishSetup(useDefaults = false) {
        if (useDefaults) {
            // Apply default settings
            this.setupChoices = {
                niche: 'retail',
                businessName: 'Golden Crust Bakery',
                businessStructure: 'llc',
                location: 'suburban',
                financing: 'savings',
                equipment: { oven: 'standard', mixer: 'standard', display: 'standard' },
                permits: ['business_license', 'health_permit', 'food_handler'],
                insurance: 'basic',
                staff: 'solo',
                marketing: 'organic'
            };
        }
        
        // Transition to game
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (window.game && typeof window.game.finishStoryBookSetup === 'function') {
                window.game.finishStoryBookSetup(this.setupChoices, this.budget);
            } else {
                // Fallback - just start the mode hub
                this.scene.start('ModeHubScene');
            }
        });
    }
}

// Export for use in GameController
if (typeof window !== 'undefined') {
    window.StoryBookScene = StoryBookScene;
}
