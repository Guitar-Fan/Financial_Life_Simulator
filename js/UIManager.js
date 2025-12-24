/**
 * UIManager.js - Handles all UI updates, toasts, and modals
 */

class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.currentMode = 'vendor';
        this.toastQueue = [];
        
        this.setupModeTabListeners();
        this.setupKeyboardShortcuts();
    }
    
    setupModeTabListeners() {
        const tabs = document.querySelectorAll('.mode-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.switchMode(mode);
            });
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Number keys for mode switching
            if (e.key === '1') this.switchMode('vendor');
            if (e.key === '2') this.switchMode('production');
            if (e.key === '3') this.switchMode('sales');
            if (e.key === '4') this.switchMode('summary');
            
            // Escape to close modals
            if (e.key === 'Escape') this.closeAllModals();
        });
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update tab styles
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        
        // Update panel visibility
        document.querySelectorAll('.mode-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const activePanel = document.getElementById(`${mode}-panel`);
        if (activePanel) {
            activePanel.classList.add('active');
            
            // Trigger mode-specific refresh
            if (window.game) {
                window.game.onModeChange(mode);
            }
        }
        
        // Animate transition
        gsap.fromTo(activePanel, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
    }
    
    // ==================== STATS BAR ====================
    updateStatsBar() {
        const time = this.engine.getTimeData();
        
        document.getElementById('stat-cash').textContent = this.formatCurrency(this.engine.cash);
        document.getElementById('stat-day').textContent = `Day ${this.engine.day}`;
        document.getElementById('stat-time').textContent = time.timeString;
        
        const profit = this.engine.dailyStats.grossProfit;
        const profitEl = document.getElementById('stat-profit');
        profitEl.textContent = this.formatCurrency(profit);
        profitEl.style.color = profit >= 0 ? '#4ADE80' : '#F87171';
    }
    
    // ==================== TOAST NOTIFICATIONS ====================
    showToast(message, type = 'info', icon = null) {
        const container = document.getElementById('toast-container');
        
        const iconMap = {
            success: '✓',
            warning: '⚠',
            error: '✕',
            info: 'ℹ'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icon || iconMap[type]}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }
    
    // ==================== MODALS ====================
    showQuantityModal(config) {
        const modal = document.getElementById('quantity-modal');
        const content = document.getElementById('modal-content');
        
        let quantity = config.defaultQty || 1;
        const min = config.min || 1;
        const max = config.max || 999;
        
        const updateDisplay = () => {
            const total = quantity * config.unitPrice;
            content.innerHTML = `
                <div class="modal-icon">${config.icon}</div>
                <div class="modal-title">${config.title}</div>
                <div class="modal-subtitle">${config.subtitle || ''}</div>
                <div class="modal-quantity">
                    <button class="modal-qty-btn" id="modal-minus">−</button>
                    <div class="modal-qty-value">${quantity}</div>
                    <button class="modal-qty-btn" id="modal-plus">+</button>
                </div>
                <div class="modal-info">
                    <div class="modal-info-row">
                        <span class="modal-info-label">Unit Price</span>
                        <span class="modal-info-value">${this.formatCurrency(config.unitPrice)}</span>
                    </div>
                    ${config.inStock !== undefined ? `
                    <div class="modal-info-row">
                        <span class="modal-info-label">In Stock</span>
                        <span class="modal-info-value">${config.inStock}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-total">
                    Total: <span class="modal-total-value">${this.formatCurrency(total)}</span>
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
                    <button class="btn btn-primary" id="modal-confirm">${config.confirmText || 'Confirm'}</button>
                </div>
            `;
            
            // Attach event listeners
            document.getElementById('modal-minus').onclick = () => {
                if (quantity > min) {
                    quantity -= config.step || 1;
                    updateDisplay();
                }
            };
            
            document.getElementById('modal-plus').onclick = () => {
                if (quantity < max) {
                    quantity += config.step || 1;
                    updateDisplay();
                }
            };
            
            document.getElementById('modal-cancel').onclick = () => {
                this.closeAllModals();
            };
            
            document.getElementById('modal-confirm').onclick = () => {
                config.onConfirm(quantity);
                this.closeAllModals();
            };
        };
        
        updateDisplay();
        modal.classList.add('active');
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }
    
    // ==================== FORMATTING ====================
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }
    
    formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }
    
    formatPercent(value) {
        return `${value.toFixed(1)}%`;
    }
    
    // ==================== ANIMATION HELPERS ====================
    animateValue(element, start, end, duration = 500) {
        const startTime = performance.now();
        const isCurrency = element.textContent.includes('$');
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const eased = 1 - Math.pow(1 - progress, 3);  // Ease out cubic
            const current = start + (end - start) * eased;
            
            element.textContent = isCurrency 
                ? this.formatCurrency(current)
                : this.formatNumber(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    flashElement(element, color = '#FFD700') {
        gsap.to(element, {
            backgroundColor: color,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });
    }
    
    pulseElement(element) {
        gsap.to(element, {
            scale: 1.1,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });
    }
    
    shakeElement(element) {
        gsap.to(element, {
            x: [-5, 5, -5, 5, 0],
            duration: 0.4,
            ease: 'power2.inOut'
        });
    }
    
    floatText(x, y, text, color = '#4ADE80') {
        const el = document.createElement('div');
        el.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-family: 'Fredoka', sans-serif;
            font-size: 20px;
            font-weight: 700;
            pointer-events: none;
            z-index: 9000;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        `;
        el.textContent = text;
        document.body.appendChild(el);
        
        gsap.to(el, {
            y: -50,
            opacity: 0,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => el.remove()
        });
    }
    
    // ==================== RENDER HELPERS ====================
    createCard(config) {
        const card = document.createElement('div');
        card.className = config.className || '';
        card.innerHTML = config.html;
        
        if (config.onClick) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', config.onClick);
        }
        
        return card;
    }
    
    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

// Make globally available
window.UIManager = UIManager;
