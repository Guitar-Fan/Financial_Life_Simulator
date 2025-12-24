/**
 * VendorMode.js - Buy Inventory gameplay mode
 * Players purchase ingredients from different vendors with varying prices and terms
 */

class VendorMode {
    constructor(engine, ui) {
        this.engine = engine;
        this.ui = ui;
        this.selectedVendor = 'METRO_SUPPLY';
        this.cart = [];
        this.panel = document.getElementById('vendor-panel');
    }
    
    render() {
        this.panel.innerHTML = `
            <div class="vendor-sidebar">
                <div class="sidebar-title">🏪 Select Vendor</div>
                <div id="vendor-list"></div>
            </div>
            <div class="vendor-main">
                <div class="section-header">
                    <div class="section-title" id="vendor-title">Available Ingredients</div>
                </div>
                <div class="ingredient-grid" id="ingredient-grid"></div>
            </div>
            <div class="cart-sidebar">
                <div class="cart-header">🛒 Shopping Cart</div>
                <div class="cart-items" id="cart-items"></div>
                <div class="cart-summary" id="cart-summary"></div>
            </div>
        `;
        
        this.renderVendorList();
        this.renderIngredients();
        this.renderCart();
    }
    
    renderVendorList() {
        const container = document.getElementById('vendor-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(GAME_CONFIG.VENDORS).forEach(([key, vendor]) => {
            const isSelected = key === this.selectedVendor;
            
            const card = document.createElement('div');
            card.className = `vendor-card ${isSelected ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="vendor-header">
                    <div class="vendor-icon">${vendor.icon}</div>
                    <div>
                        <div class="vendor-name">${vendor.name}</div>
                        <div class="vendor-specialty">${vendor.specialty}</div>
                    </div>
                </div>
                <div class="vendor-rating">
                    ${'★'.repeat(vendor.rating)}${'☆'.repeat(5 - vendor.rating)}
                </div>
                <div class="vendor-tags">
                    ${vendor.tags.map(t => `<span class="vendor-tag ${t.includes('Discount') ? 'discount' : ''}">${t}</span>`).join('')}
                    <span class="vendor-tag">${vendor.deliveryDays === 0 ? 'Same Day' : `${vendor.deliveryDays} day delivery`}</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.selectedVendor = key;
                this.renderVendorList();
                this.renderIngredients();
            });
            
            container.appendChild(card);
        });
    }
    
    renderIngredients() {
        const container = document.getElementById('ingredient-grid');
        const titleEl = document.getElementById('vendor-title');
        if (!container) return;
        
        const vendor = GAME_CONFIG.VENDORS[this.selectedVendor];
        titleEl.textContent = `${vendor.name} - Catalog`;
        
        container.innerHTML = '';
        
        // Filter ingredients by vendor category
        const availableIngredients = Object.entries(GAME_CONFIG.INGREDIENTS)
            .filter(([key, ing]) => vendor.categories.includes(ing.category));
        
        availableIngredients.forEach(([key, ingredient]) => {
            const price = ingredient.basePrice * vendor.priceMultiplier;
            const stock = this.engine.getIngredientStock(key);
            const isLowStock = stock < 10;
            
            const card = document.createElement('div');
            card.className = 'ingredient-card';
            card.innerHTML = `
                <div class="ingredient-icon">${ingredient.icon}</div>
                <div class="ingredient-name">${ingredient.name}</div>
                <div class="ingredient-price">${this.ui.formatCurrency(price)}</div>
                <div class="ingredient-unit">per ${ingredient.unit}</div>
                <div class="ingredient-stock ${isLowStock ? 'low' : ''}">
                    ${isLowStock ? '⚠️ ' : ''}In stock: ${stock.toFixed(1)}
                </div>
            `;
            
            card.addEventListener('click', () => this.showPurchaseModal(key, ingredient, price));
            
            // Hover animation
            card.addEventListener('mouseenter', () => {
                gsap.to(card, { scale: 1.03, duration: 0.2 });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { scale: 1, duration: 0.2 });
            });
            
            container.appendChild(card);
        });
        
        // Animate cards in
        gsap.fromTo('.ingredient-card', 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.3, stagger: 0.03 }
        );
    }
    
    showPurchaseModal(ingredientKey, ingredient, unitPrice) {
        const vendor = GAME_CONFIG.VENDORS[this.selectedVendor];
        
        this.ui.showQuantityModal({
            icon: ingredient.icon,
            title: `Buy ${ingredient.name}`,
            subtitle: `From ${vendor.name} • ${vendor.deliveryDays === 0 ? 'Immediate delivery' : `Delivery in ${vendor.deliveryDays} day(s)`}`,
            unitPrice: unitPrice,
            defaultQty: vendor.minimumOrder > 0 ? vendor.minimumOrder : 10,
            min: vendor.minimumOrder || 1,
            max: Math.floor(this.engine.cash / unitPrice),
            step: 5,
            inStock: this.engine.getIngredientStock(ingredientKey).toFixed(1),
            confirmText: 'Add to Cart',
            onConfirm: (qty) => {
                this.addToCart(ingredientKey, ingredient, unitPrice, qty);
            }
        });
    }
    
    addToCart(ingredientKey, ingredient, unitPrice, quantity) {
        // Check if already in cart
        const existing = this.cart.find(item => item.ingredientKey === ingredientKey);
        
        if (existing) {
            existing.quantity += quantity;
            existing.total = existing.quantity * existing.unitPrice;
        } else {
            this.cart.push({
                ingredientKey,
                name: ingredient.name,
                icon: ingredient.icon,
                unit: ingredient.unit,
                unitPrice,
                quantity,
                total: quantity * unitPrice,
                vendor: this.selectedVendor
            });
        }
        
        this.renderCart();
        this.ui.showToast(`Added ${quantity} ${ingredient.unit} of ${ingredient.name}`, 'success', ingredient.icon);
    }
    
    renderCart() {
        const itemsContainer = document.getElementById('cart-items');
        const summaryContainer = document.getElementById('cart-summary');
        if (!itemsContainer || !summaryContainer) return;
        
        if (this.cart.length === 0) {
            itemsContainer.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <div>Your cart is empty</div>
                    <div style="font-size: 12px; margin-top: 8px;">Click ingredients to add them</div>
                </div>
            `;
            summaryContainer.innerHTML = '';
            return;
        }
        
        // Render cart items
        itemsContainer.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-icon">${item.icon}</div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${this.ui.formatCurrency(item.unitPrice)}/${item.unit}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn cart-minus" data-index="${index}">−</button>
                    <div class="qty-value">${item.quantity}</div>
                    <button class="qty-btn cart-plus" data-index="${index}">+</button>
                </div>
            </div>
        `).join('');
        
        // Add quantity button listeners
        itemsContainer.querySelectorAll('.cart-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                this.updateCartQuantity(idx, -5);
            });
        });
        
        itemsContainer.querySelectorAll('.cart-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                this.updateCartQuantity(idx, 5);
            });
        });
        
        // Calculate totals
        const subtotal = this.cart.reduce((sum, item) => sum + item.total, 0);
        const canAfford = subtotal <= this.engine.cash;
        
        summaryContainer.innerHTML = `
            <div class="cart-row">
                <span class="cart-row-label">Items</span>
                <span class="cart-row-value">${this.cart.length}</span>
            </div>
            <div class="cart-row">
                <span class="cart-row-label">Available Cash</span>
                <span class="cart-row-value">${this.ui.formatCurrency(this.engine.cash)}</span>
            </div>
            <div class="cart-total">
                <span class="cart-total-label">Order Total</span>
                <span class="cart-total-value" style="color: ${canAfford ? 'var(--accent)' : 'var(--danger)'}">${this.ui.formatCurrency(subtotal)}</span>
            </div>
            <button class="btn btn-primary" id="checkout-btn" ${!canAfford ? 'disabled' : ''}>
                💳 Place Order
            </button>
            <button class="btn btn-danger" id="clear-cart-btn" style="margin-top: 10px;">
                🗑️ Clear Cart
            </button>
        `;
        
        // Checkout button
        document.getElementById('checkout-btn')?.addEventListener('click', () => this.checkout());
        document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
            this.cart = [];
            this.renderCart();
        });
    }
    
    updateCartQuantity(index, delta) {
        const item = this.cart[index];
        if (!item) return;
        
        item.quantity += delta;
        
        if (item.quantity <= 0) {
            this.cart.splice(index, 1);
        } else {
            item.total = item.quantity * item.unitPrice;
        }
        
        this.renderCart();
    }
    
    checkout() {
        if (this.cart.length === 0) return;
        
        const results = [];
        let totalSpent = 0;
        
        this.cart.forEach(item => {
            const result = this.engine.purchaseIngredients(
                item.ingredientKey, 
                item.quantity, 
                item.vendor
            );
            
            if (result.success) {
                totalSpent += result.cost;
                results.push({
                    ...item,
                    deliveryDay: result.deliveryDay
                });
            }
        });
        
        // Clear cart
        this.cart = [];
        
        // Show success feedback
        if (results.length > 0) {
            this.ui.showToast(
                `Order placed! ${this.ui.formatCurrency(totalSpent)} spent`,
                'success',
                '✓'
            );
            
            // Animate purchase effect
            this.animatePurchase(results);
        }
        
        this.renderIngredients();
        this.renderCart();
        this.ui.updateStatsBar();
    }
    
    animatePurchase(items) {
        // Create floating receipt animation
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(145deg, #2C1810 0%, #1a0f0a 100%);
            border: 2px solid var(--accent);
            border-radius: 20px;
            padding: 30px;
            z-index: 9999;
            text-align: center;
            color: var(--light);
            font-family: 'Fredoka', sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">📦</div>
            <div style="font-size: 24px; margin-bottom: 10px;">Order Confirmed!</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.7);">
                ${items.length} item(s) ordered
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        gsap.fromTo(overlay,
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out' }
        );
        
        gsap.to(overlay, {
            scale: 0.9,
            opacity: 0,
            delay: 1.5,
            duration: 0.3,
            onComplete: () => overlay.remove()
        });
    }
    
    refresh() {
        this.renderIngredients();
        this.renderCart();
    }
}

// Make globally available
window.VendorMode = VendorMode;
