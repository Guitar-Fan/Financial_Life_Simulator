/**
 * GameController.js - Main game initialization and loop
 * Connects all systems and manages the game lifecycle
 */

class GameController {
    constructor() {
        this.engine = null;
        this.ui = null;
        this.modes = {};
        this.tutorial = null;
        this.isRunning = false;
        this.lastUpdate = 0;
        this.autoSaveInterval = null;
        
        this.init();
    }
    
    async init() {
        console.log('🥐 Sweet Success Bakery - Initializing...');
        
        // Wait for DOM
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }
        
        // Initialize core systems
        this.engine = new FinancialEngine();
        this.ui = new UIManager(this.engine);
        
        // Initialize game modes
        this.modes = {
            vendor: new VendorMode(this.engine, this.ui),
            production: new ProductionMode(this.engine, this.ui),
            sales: new SalesMode(this.engine, this.ui),
            summary: new SummaryMode(this.engine, this.ui)
        };
        
        // Connect UI to modes
        this.ui.modes = this.modes;
        
        // Initialize tutorial
        this.tutorial = new TutorialSystem(this.engine, this.ui);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load saved game or start fresh
        this.loadGame();
        
        // Initial render
        this.renderCurrentMode();
        this.updateStatsBar();
        
        // Start game loop
        this.start();
        
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => this.saveGame(), 30000);
        
        console.log('✅ Game initialized successfully!');
    }
    
    setupEventListeners() {
        // Mode switching via tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.ui.switchMode(mode);
                this.renderCurrentMode();
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Mode shortcuts
            if (e.key === '1') {
                this.ui.switchMode('vendor');
                this.renderCurrentMode();
            } else if (e.key === '2') {
                this.ui.switchMode('production');
                this.renderCurrentMode();
            } else if (e.key === '3') {
                this.ui.switchMode('sales');
                this.renderCurrentMode();
            } else if (e.key === '4') {
                this.ui.switchMode('summary');
                this.renderCurrentMode();
            }
            
            // Pause/Resume with Space
            if (e.key === ' ' && !this.tutorial.isActive) {
                e.preventDefault();
                this.engine.togglePause();
                this.ui.showToast(this.engine.isPaused ? '⏸️ Paused' : '▶️ Resumed', 'info');
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                document.querySelector('.modal.active')?.classList.remove('active');
            }
            
            // Save game with Ctrl+S
            if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.saveGame();
                this.ui.showToast('💾 Game saved!', 'success');
            }
        });
        
        // Game menu button
        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.showGameMenu();
        });
        
        // Fullscreen button
        document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Engine events
        this.engine.on('sale', (data) => {
            if (this.modes.sales) {
                this.modes.sales.onSale(data);
            }
            this.updateStatsBar();
        });
        
        this.engine.on('production_complete', (data) => {
            this.ui.showToast(`✅ ${data.quantity}x ${data.recipe.name} ready!`, 'success');
            if (this.modes.production) {
                this.modes.production.render();
            }
            if (this.modes.sales) {
                this.modes.sales.renderDisplayCases();
            }
        });
        
        this.engine.on('delivery', (data) => {
            this.ui.showToast(`📦 Delivery arrived: ${data.order.items.length} items from ${data.order.vendor}`, 'info');
            if (this.modes.vendor) {
                this.modes.vendor.render();
            }
            if (this.modes.production) {
                this.modes.production.render();
            }
        });
        
        this.engine.on('day_end', (data) => {
            this.showDaySummary(data);
        });
        
        this.engine.on('spoilage', (data) => {
            this.ui.showToast(`⚠️ ${data.quantity}x ${data.item} spoiled!`, 'warning');
        });
        
        // Start tutorial button
        document.getElementById('start-tutorial')?.addEventListener('click', () => {
            this.tutorial.start();
        });
        
        // Window close - save game
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });
        
        // Visibility change - pause when tab hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.wasRunning = !this.engine.isPaused;
                this.engine.isPaused = true;
            } else if (this.wasRunning) {
                this.engine.isPaused = false;
            }
        });
    }
    
    start() {
        this.isRunning = true;
        this.lastUpdate = performance.now();
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const deltaMs = now - this.lastUpdate;
        this.lastUpdate = now;
        
        // Update engine
        this.engine.update(deltaMs);
        
        // Update UI elements
        this.updateStatsBar();
        this.updateClock();
        
        // Mode-specific updates
        const currentMode = this.ui.currentMode;
        if (currentMode === 'production' && this.modes.production) {
            this.modes.production.update();
        } else if (currentMode === 'sales' && this.modes.sales) {
            this.modes.sales.update(deltaMs);
        } else if (currentMode === 'summary' && this.modes.summary) {
            // Refresh summary every few seconds
            if (Math.floor(now / 3000) !== Math.floor((now - deltaMs) / 3000)) {
                this.modes.summary.refresh();
            }
        }
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateStatsBar() {
        const metrics = this.engine.getFinancialMetrics();
        const daily = this.engine.getDailySummary();
        
        // Cash
        const cashEl = document.getElementById('stat-cash');
        if (cashEl) {
            const newValue = this.ui.formatCurrency(metrics.cash);
            if (cashEl.textContent !== newValue) {
                this.ui.animateValue(cashEl, parseFloat(cashEl.textContent.replace(/[^0-9.-]/g, '')) || 0, metrics.cash, 300, '$');
            }
        }
        
        // Revenue
        const revenueEl = document.getElementById('stat-revenue');
        if (revenueEl) {
            revenueEl.textContent = this.ui.formatCurrency(daily.revenue);
        }
        
        // Profit
        const profitEl = document.getElementById('stat-profit');
        if (profitEl) {
            profitEl.textContent = this.ui.formatCurrency(daily.grossProfit);
            profitEl.style.color = daily.grossProfit >= 0 ? 'var(--success)' : 'var(--danger)';
        }
        
        // Margin
        const marginEl = document.getElementById('stat-margin');
        if (marginEl) {
            marginEl.textContent = daily.grossMargin + '%';
            const marginValue = parseFloat(daily.grossMargin);
            marginEl.style.color = marginValue >= 50 ? 'var(--success)' : marginValue >= 30 ? 'var(--warning)' : 'var(--danger)';
        }
    }
    
    updateClock() {
        const clockEl = document.getElementById('game-clock');
        if (clockEl) {
            const hours = Math.floor(this.engine.hour);
            const minutes = Math.floor((this.engine.hour % 1) * 60);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[this.engine.dayOfWeek];
            
            clockEl.textContent = `Day ${this.engine.day} | ${dayName} ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        }
    }
    
    renderCurrentMode() {
        const mode = this.ui.currentMode;
        if (this.modes[mode]) {
            this.modes[mode].render();
        }
    }
    
    showDaySummary(data) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h2 style="font-family: 'Fredoka', sans-serif; margin-bottom: 20px; text-align: center;">
                    📅 Day ${data.day} Complete!
                </h2>
                
                <div style="display: grid; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <span>Revenue</span>
                        <span style="color: var(--success)">${this.ui.formatCurrency(data.revenue)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <span>Cost of Goods Sold</span>
                        <span style="color: var(--danger)">${this.ui.formatCurrency(data.cogs)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 15px; background: ${data.grossProfit >= 0 ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)'}; border-radius: 8px; font-weight: bold;">
                        <span>Gross Profit</span>
                        <span style="color: ${data.grossProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">${this.ui.formatCurrency(data.grossProfit)}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                        <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <div style="font-size: 24px; color: var(--accent);">${data.customersServed}</div>
                            <div style="font-size: 12px; opacity: 0.7;">Customers</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <div style="font-size: 24px; color: var(--accent);">${data.itemsSold}</div>
                            <div style="font-size: 12px; opacity: 0.7;">Items Sold</div>
                        </div>
                    </div>
                </div>
                
                <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="this.closest('.modal').remove()">
                    Continue to Day ${data.day + 1} →
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        gsap.fromTo(modal.querySelector('.modal-content'),
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out' }
        );
    }
    
    showGameMenu() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'game-menu-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h2 style="font-family: 'Fredoka', sans-serif; margin-bottom: 25px; text-align: center;">
                    🎮 Game Menu
                </h2>
                
                <div style="display: grid; gap: 15px;">
                    <button class="btn btn-secondary" id="menu-resume">
                        ▶️ Resume Game
                    </button>
                    <button class="btn btn-secondary" id="menu-save">
                        💾 Save Game
                    </button>
                    <button class="btn btn-secondary" id="menu-tutorial">
                        📖 Replay Tutorial
                    </button>
                    <button class="btn btn-secondary" id="menu-fullscreen">
                        🖥️ Toggle Fullscreen
                    </button>
                    <hr style="border-color: rgba(255,255,255,0.1);">
                    <button class="btn" id="menu-new-game" style="background: var(--danger);">
                        🔄 New Game
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Button handlers
        modal.querySelector('#menu-resume').onclick = () => modal.remove();
        modal.querySelector('#menu-save').onclick = () => {
            this.saveGame();
            this.ui.showToast('💾 Game saved!', 'success');
            modal.remove();
        };
        modal.querySelector('#menu-tutorial').onclick = () => {
            modal.remove();
            this.tutorial.reset();
        };
        modal.querySelector('#menu-fullscreen').onclick = () => {
            this.toggleFullscreen();
            modal.remove();
        };
        modal.querySelector('#menu-new-game').onclick = () => {
            if (confirm('Are you sure? This will delete your current progress!')) {
                localStorage.removeItem('bakery_save');
                localStorage.removeItem('bakery_tutorial_complete');
                location.reload();
            }
        };
        
        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                this.ui.showToast('Could not enter fullscreen', 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    saveGame() {
        const saveData = this.engine.save();
        localStorage.setItem('bakery_save', JSON.stringify(saveData));
        console.log('💾 Game saved');
    }
    
    loadGame() {
        const saveStr = localStorage.getItem('bakery_save');
        if (saveStr) {
            try {
                const saveData = JSON.parse(saveStr);
                this.engine.load(saveData);
                console.log('📂 Game loaded');
            } catch (e) {
                console.error('Failed to load save:', e);
            }
        }
    }
    
    stop() {
        this.isRunning = false;
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Start the game when script loads
window.game = new GameController();
