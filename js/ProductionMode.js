/**
 * ProductionMode.js - Baking/Production gameplay mode
 * Players select recipes and bake products, managing oven capacity and ingredients
 */

class ProductionMode {
    constructor(engine, ui) {
        this.engine = engine;
        this.ui = ui;
        this.selectedCategory = 'all';
        this.panel = document.getElementById('production-panel');
        
        // Listen for production events
        this.engine.on('onProduction', (data) => this.onProductionEvent(data));
    }
    
    render() {
        this.panel.innerHTML = `
            <div class="production-floor">
                <div class="section-header">
                    <div class="section-title">🍞 Recipe Menu</div>
                </div>
                <div class="recipe-categories" id="recipe-categories"></div>
                <div class="recipe-grid" id="recipe-grid"></div>
            </div>
            <div class="production-sidebar">
                <div class="queue-header">🔥 Oven Status</div>
                <div class="oven-status" id="oven-status"></div>
                <div class="queue-header">📋 Production Queue</div>
                <div class="queue-items" id="queue-items"></div>
                <div class="inventory-summary" id="inventory-summary"></div>
            </div>
        `;
        
        this.renderCategories();
        this.renderRecipes();
        this.renderOvenStatus();
        this.renderQueue();
        this.renderInventorySummary();
    }
    
    renderCategories() {
        const container = document.getElementById('recipe-categories');
        if (!container) return;
        
        const categories = [
            { id: 'all', name: 'All Recipes', icon: '📖' },
            { id: 'bread', name: 'Breads', icon: '🍞' },
            { id: 'pastry', name: 'Pastries', icon: '🥐' },
            { id: 'cookie', name: 'Cookies', icon: '🍪' },
            { id: 'cake', name: 'Cakes', icon: '🎂' }
        ];
        
        container.innerHTML = categories.map(cat => `
            <button class="recipe-category ${this.selectedCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
                ${cat.icon} ${cat.name}
            </button>
        `).join('');
        
        container.querySelectorAll('.recipe-category').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedCategory = btn.dataset.category;
                this.renderCategories();
                this.renderRecipes();
            });
        });
    }
    
    renderRecipes() {
        const container = document.getElementById('recipe-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const recipes = Object.entries(GAME_CONFIG.RECIPES)
            .filter(([key, recipe]) => 
                this.selectedCategory === 'all' || recipe.category === this.selectedCategory
            );
        
        recipes.forEach(([key, recipe]) => {
            const { canBake, missing } = this.engine.canBakeRecipe(key);
            const productCost = this.engine.calculateProductCost(key);
            const profit = recipe.retailPrice - productCost;
            const margin = ((profit / recipe.retailPrice) * 100).toFixed(0);
            const inStock = this.engine.getProductStock(key);
            
            const isBaking = this.engine.productionQueue.some(
                p => p.recipeKey === key && p.status === 'baking'
            );
            
            const card = document.createElement('div');
            card.className = `recipe-card ${!canBake ? 'unavailable' : ''} ${isBaking ? 'baking' : ''}`;
            
            card.innerHTML = `
                ${!canBake ? '<div class="recipe-badge">Missing Items</div>' : ''}
                <div class="recipe-image">${recipe.icon}</div>
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-stats">
                    <div class="recipe-stat">
                        <div class="recipe-stat-value" style="color: var(--warning)">${this.ui.formatCurrency(productCost)}</div>
                        <div class="recipe-stat-label">Cost</div>
                    </div>
                    <div class="recipe-stat">
                        <div class="recipe-stat-value" style="color: var(--accent)">${this.ui.formatCurrency(recipe.retailPrice)}</div>
                        <div class="recipe-stat-label">Sells For</div>
                    </div>
                </div>
                <div class="recipe-profit">+${this.ui.formatCurrency(profit)} (${margin}%)</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 8px;">
                    ⏱️ ${recipe.bakeTime} min • 📦 ${inStock} in stock
                </div>
            `;
            
            if (canBake && !isBaking) {
                card.addEventListener('click', () => this.showBakeModal(key, recipe));
            } else if (!canBake) {
                card.addEventListener('click', () => this.showMissingIngredientsModal(key, recipe, missing));
            }
            
            // Hover effect
            card.addEventListener('mouseenter', () => {
                if (canBake) gsap.to(card, { scale: 1.02, duration: 0.2 });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { scale: 1, duration: 0.2 });
            });
            
            container.appendChild(card);
        });
        
        // Animate cards
        gsap.fromTo('.recipe-card',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.3, stagger: 0.04 }
        );
    }
    
    showBakeModal(recipeKey, recipe) {
        const productCost = this.engine.calculateProductCost(recipeKey);
        const maxBatch = this.calculateMaxBatch(recipeKey);
        
        this.ui.showQuantityModal({
            icon: recipe.icon,
            title: `Bake ${recipe.name}`,
            subtitle: `${recipe.bakeTime} minutes per batch`,
            unitPrice: productCost,
            defaultQty: 1,
            min: 1,
            max: Math.min(maxBatch, 10),  // Max 10 at a time
            step: 1,
            confirmText: '🔥 Start Baking',
            onConfirm: (qty) => {
                this.startBaking(recipeKey, qty);
            }
        });
    }
    
    calculateMaxBatch(recipeKey) {
        const recipe = GAME_CONFIG.RECIPES[recipeKey];
        let maxBatch = Infinity;
        
        for (const [ingKey, amount] of Object.entries(recipe.ingredients)) {
            const available = this.engine.getIngredientStock(ingKey);
            const possible = Math.floor(available / amount);
            maxBatch = Math.min(maxBatch, possible);
        }
        
        return maxBatch === Infinity ? 0 : maxBatch;
    }
    
    showMissingIngredientsModal(recipeKey, recipe, missing) {
        const modal = document.getElementById('quantity-modal');
        const content = document.getElementById('modal-content');
        
        content.innerHTML = `
            <div class="modal-icon">${recipe.icon}</div>
            <div class="modal-title">Missing Ingredients</div>
            <div class="modal-subtitle">You need these items to bake ${recipe.name}</div>
            <div class="modal-info" style="text-align: left; margin: 20px 0;">
                ${missing.map(m => `
                    <div class="modal-info-row">
                        <span class="modal-info-label">${m.ingredient}</span>
                        <span class="modal-info-value" style="color: var(--danger)">
                            Need ${m.needed.toFixed(2)}, have ${m.have.toFixed(2)}
                        </span>
                    </div>
                `).join('')}
            </div>
            <div class="modal-buttons">
                <button class="btn btn-secondary" id="modal-cancel">Close</button>
                <button class="btn btn-primary" id="modal-go-vendor">📦 Go to Vendor</button>
            </div>
        `;
        
        document.getElementById('modal-cancel').onclick = () => this.ui.closeAllModals();
        document.getElementById('modal-go-vendor').onclick = () => {
            this.ui.closeAllModals();
            this.ui.switchMode('vendor');
        };
        
        modal.classList.add('active');
    }
    
    startBaking(recipeKey, quantity) {
        const result = this.engine.startBaking(recipeKey, quantity);
        
        if (result.success) {
            const recipe = GAME_CONFIG.RECIPES[recipeKey];
            this.ui.showToast(
                `Baking ${quantity}x ${recipe.name}!`,
                'success',
                recipe.icon
            );
            
            this.renderRecipes();
            this.renderOvenStatus();
            this.renderQueue();
            this.renderInventorySummary();
            this.ui.updateStatsBar();
        } else {
            this.ui.showToast(result.error, 'error');
        }
    }
    
    renderOvenStatus() {
        const container = document.getElementById('oven-status');
        if (!container) return;
        
        const baking = this.engine.productionQueue.filter(p => p.status === 'baking');
        const capacity = this.engine.ovenCapacity;
        const usedSlots = baking.length;
        
        if (usedSlots === 0) {
            container.innerHTML = `
                <div class="oven-header">
                    <span class="oven-title">Oven Ready</span>
                    <span class="oven-temp">350°F</span>
                </div>
                <div style="text-align: center; color: rgba(255,255,255,0.5); padding: 15px;">
                    🔥 Oven is empty and ready!<br>
                    <span style="font-size: 11px;">Capacity: ${capacity} items</span>
                </div>
            `;
            return;
        }
        
        const currentItem = baking[0];
        const recipe = GAME_CONFIG.RECIPES[currentItem.recipeKey];
        const progress = (currentItem.progress * 100).toFixed(0);
        
        container.innerHTML = `
            <div class="oven-header">
                <span class="oven-title">Currently Baking</span>
                <span class="oven-temp">425°F</span>
            </div>
            <div class="oven-progress">
                <div class="oven-progress-bar" style="width: ${progress}%"></div>
            </div>
            <div class="oven-item">
                <span>${recipe.icon}</span>
                <span>${currentItem.quantity}x ${recipe.name}</span>
                <span style="margin-left: auto; color: var(--accent);">${progress}%</span>
            </div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 8px;">
                Slots: ${usedSlots}/${capacity} used
            </div>
        `;
    }
    
    renderQueue() {
        const container = document.getElementById('queue-items');
        if (!container) return;
        
        const queue = this.engine.productionQueue;
        
        if (queue.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: rgba(255,255,255,0.4); padding: 30px;">
                    No items in queue<br>
                    <span style="font-size: 12px;">Select a recipe to start baking</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = queue.map(item => {
            const recipe = GAME_CONFIG.RECIPES[item.recipeKey];
            const progress = (item.progress * 100).toFixed(0);
            
            return `
                <div class="queue-item">
                    <div class="queue-item-icon">${recipe.icon}</div>
                    <div class="queue-item-details">
                        <div class="queue-item-name">${item.quantity}x ${recipe.name}</div>
                        <div class="queue-item-status">
                            ${item.status === 'baking' ? `Baking... ${progress}%` : 
                              item.status === 'completed' ? '✓ Ready!' : 'Waiting...'}
                        </div>
                    </div>
                    <div class="queue-item-progress" style="width: ${progress}%"></div>
                </div>
            `;
        }).join('');
    }
    
    renderInventorySummary() {
        const container = document.getElementById('inventory-summary');
        if (!container) return;
        
        // Get low stock ingredients
        const lowStock = Object.entries(this.engine.ingredients)
            .filter(([key, inv]) => {
                const ingredient = GAME_CONFIG.INGREDIENTS[key];
                return inv.quantity < 10 && ingredient;
            })
            .slice(0, 5);
        
        container.innerHTML = `
            <div class="inventory-title">⚠️ Low Stock Alerts</div>
            ${lowStock.length === 0 ? 
                '<div style="font-size: 12px; color: rgba(255,255,255,0.5);">All ingredients stocked!</div>' :
                lowStock.map(([key, inv]) => {
                    const ingredient = GAME_CONFIG.INGREDIENTS[key];
                    return `
                        <div class="inventory-item">
                            <span class="inventory-item-name">${ingredient.icon} ${ingredient.name}</span>
                            <span class="inventory-item-qty" style="color: var(--danger)">${inv.quantity.toFixed(1)}</span>
                        </div>
                    `;
                }).join('')
            }
        `;
    }
    
    onProductionEvent(data) {
        if (data.action === 'complete') {
            const recipe = GAME_CONFIG.RECIPES[data.item.recipeKey];
            this.ui.showToast(
                `${data.item.quantity}x ${recipe.name} ready!`,
                'success',
                '✓'
            );
            
            // Play completion animation
            this.playCompletionAnimation(recipe);
        }
        
        this.renderRecipes();
        this.renderOvenStatus();
        this.renderQueue();
    }
    
    playCompletionAnimation(recipe) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 80px;
            z-index: 9999;
            pointer-events: none;
        `;
        overlay.textContent = recipe.icon;
        document.body.appendChild(overlay);
        
        gsap.fromTo(overlay,
            { scale: 0.5, opacity: 0, y: 0 },
            { scale: 1.5, opacity: 1, y: -50, duration: 0.5, ease: 'back.out' }
        );
        
        gsap.to(overlay, {
            scale: 2,
            opacity: 0,
            y: -100,
            delay: 0.5,
            duration: 0.5,
            onComplete: () => overlay.remove()
        });
    }
    
    refresh() {
        this.renderRecipes();
        this.renderOvenStatus();
        this.renderQueue();
        this.renderInventorySummary();
    }
    
    // Called every frame to update progress bars
    update() {
        // Update oven progress bar smoothly
        const baking = this.engine.productionQueue.filter(p => p.status === 'baking');
        if (baking.length > 0) {
            const progressBar = document.querySelector('.oven-progress-bar');
            if (progressBar) {
                const progress = (baking[0].progress * 100).toFixed(0);
                progressBar.style.width = `${progress}%`;
            }
            
            // Update percentage text
            const percentText = document.querySelector('.oven-item span:last-child');
            if (percentText) {
                percentText.textContent = `${(baking[0].progress * 100).toFixed(0)}%`;
            }
        }
        
        // Update queue progress bars
        this.engine.productionQueue.forEach((item, index) => {
            const queueItem = document.querySelectorAll('.queue-item')[index];
            if (queueItem) {
                const bar = queueItem.querySelector('.queue-item-progress');
                if (bar) {
                    bar.style.width = `${item.progress * 100}%`;
                }
            }
        });
    }
}

// Make globally available
window.ProductionMode = ProductionMode;
