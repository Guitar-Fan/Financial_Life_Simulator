/**
 * SalesMode.js - Sales Floor gameplay mode
 * Run the shop, serve customers, watch sales happen in real-time
 */

class SalesMode {
    constructor(engine, ui) {
        this.engine = engine;
        this.ui = ui;
        this.panel = document.getElementById('sales-panel');
        this.customers = [];
        this.activityLog = [];
        this.customerSpawnTimer = 0;
        this.maxVisibleCustomers = 6;
        
        // Listen for events
        this.engine.on('onSale', (data) => this.onSale(data));
    }
    
    render() {
        this.panel.innerHTML = `
            <div class="sales-floor">
                <div class="section-header">
                    <div class="section-title">🏪 Shop Floor</div>
                </div>
                <div class="time-controls" id="time-controls"></div>
                <div class="display-cases" id="display-cases"></div>
            </div>
            <div class="sales-sidebar">
                <div class="sales-header">📊 Today's Performance</div>
                <div class="sales-stats" id="sales-stats"></div>
                <div class="customer-section">
                    <div class="customer-queue-header">
                        👥 Recent Customers
                        <span class="customer-count" id="customer-count">0</span>
                    </div>
                    <div id="customer-queue"></div>
                </div>
                <div class="activity-log" id="activity-log"></div>
            </div>
        `;
        
        this.renderTimeControls();
        this.renderDisplayCases();
        this.renderSalesStats();
        this.renderCustomerQueue();
    }
    
    renderTimeControls() {
        const container = document.getElementById('time-controls');
        if (!container) return;
        
        const time = this.engine.getTimeData();
        const isOpen = time.hour >= 6 && time.hour < 18;
        
        container.innerHTML = `
            <button class="time-btn ${this.engine.gameSpeed === 1 ? 'active' : ''}" data-speed="1">
                ▶️ 1x
            </button>
            <button class="time-btn ${this.engine.gameSpeed === 2 ? 'active' : ''}" data-speed="2">
                ⏩ 2x
            </button>
            <button class="time-btn ${this.engine.gameSpeed === 5 ? 'active' : ''}" data-speed="5">
                ⏭️ 5x
            </button>
            <button class="time-btn ${this.engine.isPaused ? 'active' : ''}" id="pause-btn">
                ⏸️ Pause
            </button>
            <div style="margin-left: 20px; display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 14px; color: ${isOpen ? 'var(--success)' : 'var(--danger)'}">
                    ${isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                </div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6)">
                    ${time.timeString}
                </div>
            </div>
        `;
        
        container.querySelectorAll('[data-speed]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.engine.gameSpeed = parseInt(btn.dataset.speed);
                this.engine.isPaused = false;
                this.renderTimeControls();
            });
        });
        
        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.engine.isPaused = !this.engine.isPaused;
            this.renderTimeControls();
        });
    }
    
    renderDisplayCases() {
        const container = document.getElementById('display-cases');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Create display cases for all recipes
        Object.entries(GAME_CONFIG.RECIPES).forEach(([key, recipe]) => {
            const stock = this.engine.getProductStock(key);
            const isEmpty = stock === 0;
            
            const display = document.createElement('div');
            display.className = `display-case ${isEmpty ? 'empty' : ''}`;
            display.innerHTML = `
                <div class="display-case-glass"></div>
                <div class="display-product">
                    <div class="display-product-icon">${isEmpty ? '❓' : recipe.icon}</div>
                    <div class="display-product-name">${recipe.name}</div>
                    <div class="display-product-price">${this.ui.formatCurrency(recipe.retailPrice)}</div>
                    <div class="display-product-stock ${stock < 3 ? 'low' : ''}">
                        ${isEmpty ? 'Out of stock!' : `${stock} available`}
                    </div>
                </div>
            `;
            
            container.appendChild(display);
        });
        
        // Animate displays
        gsap.fromTo('.display-case',
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.3, stagger: 0.04 }
        );
    }
    
    renderSalesStats() {
        const container = document.getElementById('sales-stats');
        if (!container) return;
        
        const stats = this.engine.getDailySummary();
        
        container.innerHTML = `
            <div class="sales-stat">
                <span class="sales-stat-label term-tooltip" data-tooltip="Total money received from sales">Revenue</span>
                <span class="sales-stat-value" style="color: var(--success)">${this.ui.formatCurrency(stats.revenue)}</span>
            </div>
            <div class="sales-stat">
                <span class="sales-stat-label term-tooltip" data-tooltip="Cost of ingredients used in sold products">COGS</span>
                <span class="sales-stat-value" style="color: var(--warning)">${this.ui.formatCurrency(stats.cogs)}</span>
            </div>
            <div class="sales-stat">
                <span class="sales-stat-label term-tooltip" data-tooltip="Revenue minus Cost of Goods Sold">Gross Profit</span>
                <span class="sales-stat-value" style="color: ${stats.grossProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">${this.ui.formatCurrency(stats.grossProfit)}</span>
            </div>
            <div class="sales-stat">
                <span class="sales-stat-label term-tooltip" data-tooltip="Percentage of revenue that is profit">Gross Margin</span>
                <span class="sales-stat-value" style="color: var(--accent)">${stats.grossMargin}%</span>
            </div>
            <div class="sales-stat">
                <span class="sales-stat-label">Transactions</span>
                <span class="sales-stat-value" style="color: var(--light)">${stats.transactions}</span>
            </div>
            <div class="sales-stat">
                <span class="sales-stat-label">Items Sold</span>
                <span class="sales-stat-value" style="color: var(--light)">${stats.itemsSold}</span>
            </div>
            <div class="sales-stat">
                <span class="sales-stat-label term-tooltip" data-tooltip="Average revenue per transaction">Avg Ticket</span>
                <span class="sales-stat-value" style="color: var(--accent)">${this.ui.formatCurrency(stats.avgTicket)}</span>
            </div>
            <div class="sales-stat">
                <span class="sales-stat-label term-tooltip" data-tooltip="Customers who left without buying due to no stock">Stockouts</span>
                <span class="sales-stat-value" style="color: ${stats.stockouts > 0 ? 'var(--danger)' : 'var(--light)'}">${stats.stockouts}</span>
            </div>
        `;
    }
    
    renderCustomerQueue() {
        const container = document.getElementById('customer-queue');
        const countEl = document.getElementById('customer-count');
        if (!container) return;
        
        if (countEl) {
            countEl.textContent = this.engine.dailyStats.customersServed;
        }
        
        if (this.customers.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: rgba(255,255,255,0.4); padding: 20px;">
                    Waiting for customers...<br>
                    <span style="font-size: 11px;">Sales happen automatically when shop is open</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.customers.slice(-this.maxVisibleCustomers).reverse().map(customer => `
            <div class="customer-card">
                <div class="customer-avatar">${customer.type.icon}</div>
                <div class="customer-info">
                    <div class="customer-type">${customer.type.name}</div>
                    <div class="customer-order">
                        ${customer.purchased.map(p => p.icon).join(' ')}
                        ${customer.purchased.length} item(s)
                    </div>
                </div>
                <div class="customer-total">+${this.ui.formatCurrency(customer.total)}</div>
            </div>
        `).join('');
    }
    
    renderActivityLog() {
        const container = document.getElementById('activity-log');
        if (!container) return;
        
        container.innerHTML = this.activityLog.slice(-8).reverse().map(log => `
            <div class="activity-item">
                <span class="activity-time">${log.time}</span>
                ${log.message}
            </div>
        `).join('');
    }
    
    onSale(data) {
        // Add to customer list
        const total = data.items.reduce((sum, item) => sum + item.price, 0);
        this.customers.push({
            type: data.customerType,
            purchased: data.items,
            total: total,
            timestamp: Date.now()
        });
        
        // Keep only recent customers
        if (this.customers.length > 20) {
            this.customers.shift();
        }
        
        // Add to activity log
        const time = this.engine.getTimeData();
        this.activityLog.push({
            time: time.timeString,
            message: `${data.customerType.icon} bought ${data.items.length} item(s) for ${this.ui.formatCurrency(total)}`
        });
        
        // Update displays
        this.renderDisplayCases();
        this.renderSalesStats();
        this.renderCustomerQueue();
        this.renderActivityLog();
        
        // Show floating profit text
        this.showSaleAnimation(data);
    }
    
    showSaleAnimation(data) {
        const profit = data.revenue - data.cogs;
        
        // Create floating text
        const rect = this.panel.getBoundingClientRect();
        const x = rect.left + rect.width * 0.3 + Math.random() * 100;
        const y = rect.top + rect.height * 0.5;
        
        this.ui.floatText(x, y, `+${this.ui.formatCurrency(data.revenue)}`, '#4ADE80');
        
        // Pulse the cash display
        const cashEl = document.getElementById('stat-cash');
        if (cashEl) {
            this.ui.pulseElement(cashEl);
        }
    }
    
    simulateCustomerArrival() {
        if (this.engine.isPaused) return;
        
        const time = this.engine.getTimeData();
        
        // Only simulate during business hours
        if (time.hour < 6 || time.hour >= 18) return;
        
        // Get demand rate
        const hourlyRate = GAME_CONFIG.DEMAND.HOURLY[time.hour] || 0;
        const dayMultiplier = GAME_CONFIG.DEMAND.DAILY[time.dayOfWeek] || 1;
        const baseCustomers = GAME_CONFIG.DEMAND.BASE_CUSTOMERS;
        
        // Calculate customers per minute
        const customersThisHour = baseCustomers * hourlyRate * dayMultiplier;
        const customersPerMinute = customersThisHour / 60;
        
        // Probability of customer this update
        const probability = customersPerMinute * this.engine.gameSpeed / 60;  // Adjusted for 60fps
        
        if (Math.random() < probability) {
            const result = this.engine.simulateCustomer();
            
            if (result && result.leftEmpty) {
                // Customer left due to stockout
                this.activityLog.push({
                    time: time.timeString,
                    message: `${result.type.icon} left - nothing in stock! 😞`
                });
                this.renderActivityLog();
            }
        }
    }
    
    update(deltaMs) {
        // Simulate customer arrivals
        this.simulateCustomerArrival();
        
        // Update time display
        this.renderTimeControls();
    }
    
    refresh() {
        this.renderDisplayCases();
        this.renderSalesStats();
        this.renderCustomerQueue();
        this.renderActivityLog();
    }
}

// Make globally available
window.SalesMode = SalesMode;
