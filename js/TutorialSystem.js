/**
 * TutorialSystem.js - Immersive onboarding experience
 * Guides players through all game mechanics with interactive steps
 */

class TutorialSystem {
    constructor(engine, ui) {
        this.engine = engine;
        this.ui = ui;
        this.overlay = document.getElementById('tutorial-overlay');
        this.contentEl = document.getElementById('tutorial-content');
        this.dotsEl = document.getElementById('tutorial-dots');
        this.currentStep = 0;
        this.isActive = false;
        
        this.steps = [
            {
                title: "Welcome to Sweet Success Bakery! 🥐",
                content: `
                    <p>You've just inherited a small bakery with <strong>$15,000</strong> in starting capital.</p>
                    <p>Your goal: Build a profitable bakery by mastering the art of <em>buying smart</em>, <em>baking efficiently</em>, and <em>selling strategically</em>.</p>
                    <p>This tutorial will teach you real-world business concepts used by actual bakery owners!</p>
                `,
                highlight: null,
                mode: null
            },
            {
                title: "📊 Your Dashboard",
                content: `
                    <p>The <strong>top bar</strong> shows your key stats:</p>
                    <ul>
                        <li><strong>Cash</strong> - Your available money for purchases</li>
                        <li><strong>Revenue</strong> - Today's total sales</li>
                        <li><strong>Profit</strong> - Revenue minus costs (COGS)</li>
                        <li><strong>Margin</strong> - Profit as a % of revenue (aim for 60%+)</li>
                    </ul>
                    <p>The clock shows the current time. Customers come during business hours!</p>
                `,
                highlight: '.stats-bar',
                mode: null
            },
            {
                title: "🛒 Mode 1: Buying Inventory",
                content: `
                    <p>Every bakery needs ingredients! Press <strong>1</strong> or click "Buy Inventory" to enter Vendor Mode.</p>
                    <p><strong>Key concept:</strong> You'll work with real vendors like Sysco and local farmers.</p>
                    <ul>
                        <li><span style="color: var(--success)">✓</span> <strong>Sysco Wholesale</strong> - Bulk pricing, reliable delivery</li>
                        <li><span style="color: var(--success)">✓</span> <strong>Farmer's Direct</strong> - Premium quality, higher cost</li>
                        <li><span style="color: var(--success)">✓</span> <strong>Metro Supply</strong> - Fast delivery, limited selection</li>
                    </ul>
                    <p>Watch ingredient <strong>shelf life</strong> - spoiled goods mean lost money!</p>
                `,
                highlight: '.mode-tab[data-mode="vendor"]',
                mode: 'vendor'
            },
            {
                title: "💡 Smart Purchasing Tips",
                content: `
                    <p>Real bakeries track their <strong>Food Cost Ratio</strong>:</p>
                    <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <code>Food Cost = (Ingredient Costs ÷ Sales) × 100</code>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">Target: Keep this under 35%!</p>
                    </div>
                    <p><strong>Pro tips:</strong></p>
                    <ul>
                        <li>Buy in bulk for better per-unit pricing</li>
                        <li>Compare vendor prices before ordering</li>
                        <li>Don't over-order perishables</li>
                    </ul>
                `,
                highlight: null,
                mode: 'vendor'
            },
            {
                title: "👨‍🍳 Mode 2: Production/Baking",
                content: `
                    <p>Time to bake! Press <strong>2</strong> or click "Production" to start making products.</p>
                    <p>Each recipe shows:</p>
                    <ul>
                        <li><strong>Cost</strong> - What you spend on ingredients</li>
                        <li><strong>Price</strong> - What you sell it for</li>
                        <li><strong>Margin</strong> - Your profit percentage</li>
                    </ul>
                    <p>Your oven can bake <strong>3 items at once</strong>. Plan your production to meet demand!</p>
                `,
                highlight: '.mode-tab[data-mode="production"]',
                mode: 'production'
            },
            {
                title: "📈 Understanding Margins",
                content: `
                    <p><strong>Gross Margin</strong> is the percentage of each sale that's profit:</p>
                    <div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <code>Margin = (Price - Cost) ÷ Price × 100</code>
                    </div>
                    <p>Different products have different margins:</p>
                    <ul>
                        <li>🍞 <strong>Bread</strong> - Lower margin, high volume</li>
                        <li>🥐 <strong>Pastries</strong> - Higher margin, moderate volume</li>
                        <li>🎂 <strong>Cakes</strong> - Highest margin, lower volume</li>
                    </ul>
                    <p>A balanced menu means consistent profits!</p>
                `,
                highlight: null,
                mode: 'production'
            },
            {
                title: "💵 Mode 3: Selling",
                content: `
                    <p>Open for business! Press <strong>3</strong> or click "Sales" to start selling.</p>
                    <p>Customers arrive based on <strong>time of day</strong>:</p>
                    <ul>
                        <li>☕ <strong>Morning Rush (7-9 AM)</strong> - Coffee & pastries</li>
                        <li>🌞 <strong>Lunch (11 AM - 1 PM)</strong> - Sandwiches & bread</li>
                        <li>🌆 <strong>After Work (3-6 PM)</strong> - Take-home items</li>
                    </ul>
                    <p>Use <strong>time controls</strong> to speed up or pause simulation!</p>
                `,
                highlight: '.mode-tab[data-mode="sales"]',
                mode: 'sales'
            },
            {
                title: "🎯 Customer Types",
                content: `
                    <p>Different customers want different things:</p>
                    <ul>
                        <li>☕ <strong>Morning Commuter</strong> - Quick pastries, muffins</li>
                        <li>🥪 <strong>Lunch Crowd</strong> - Bread, sandwiches</li>
                        <li>🎉 <strong>Celebrators</strong> - Cakes, special items (higher spending!)</li>
                        <li>🏠 <strong>Regular Joe</strong> - Various everyday items</li>
                    </ul>
                    <p><strong>Stockouts</strong> mean lost sales! Keep popular items in stock.</p>
                `,
                highlight: null,
                mode: 'sales'
            },
            {
                title: "📊 Mode 4: Summary & Analytics",
                content: `
                    <p>Track your success! Press <strong>4</strong> or click "Summary" for detailed financials.</p>
                    <p>Key metrics to monitor:</p>
                    <ul>
                        <li><strong>Gross Profit</strong> - Revenue minus COGS</li>
                        <li><strong>Gross Margin</strong> - Target 60-70%</li>
                        <li><strong>Service Rate</strong> - % of customers you could serve</li>
                        <li><strong>Shrinkage</strong> - Products lost to spoilage</li>
                    </ul>
                    <p>The charts help you visualize trends over time!</p>
                `,
                highlight: '.mode-tab[data-mode="summary"]',
                mode: 'summary'
            },
            {
                title: "🏆 Success Metrics",
                content: `
                    <p>How do you know if your bakery is doing well?</p>
                    <table style="width: 100%; margin: 15px 0; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <td style="padding: 8px 0;"><strong>Gross Margin</strong></td>
                            <td style="color: var(--success)">60-70%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <td style="padding: 8px 0;"><strong>Food Cost Ratio</strong></td>
                            <td style="color: var(--success)">25-35%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <td style="padding: 8px 0;"><strong>Service Rate</strong></td>
                            <td style="color: var(--success)">90%+</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;"><strong>Shrinkage</strong></td>
                            <td style="color: var(--success)">&lt;3%</td>
                        </tr>
                    </table>
                `,
                highlight: null,
                mode: 'summary'
            },
            {
                title: "⌨️ Keyboard Shortcuts",
                content: `
                    <p>For efficient management, use these shortcuts:</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                            <kbd style="background: var(--accent); color: var(--background); padding: 4px 8px; border-radius: 4px;">1</kbd>
                            <span style="margin-left: 10px;">Buy Inventory</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                            <kbd style="background: var(--accent); color: var(--background); padding: 4px 8px; border-radius: 4px;">2</kbd>
                            <span style="margin-left: 10px;">Production</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                            <kbd style="background: var(--accent); color: var(--background); padding: 4px 8px; border-radius: 4px;">3</kbd>
                            <span style="margin-left: 10px;">Sales</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                            <kbd style="background: var(--accent); color: var(--background); padding: 4px 8px; border-radius: 4px;">4</kbd>
                            <span style="margin-left: 10px;">Summary</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                            <kbd style="background: var(--accent); color: var(--background); padding: 4px 8px; border-radius: 4px;">Space</kbd>
                            <span style="margin-left: 10px;">Pause/Resume</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                            <kbd style="background: var(--accent); color: var(--background); padding: 4px 8px; border-radius: 4px;">Esc</kbd>
                            <span style="margin-left: 10px;">Close modals</span>
                        </div>
                    </div>
                `,
                highlight: null,
                mode: null
            },
            {
                title: "🚀 You're Ready!",
                content: `
                    <p>You now know everything you need to run a successful bakery!</p>
                    <p><strong>Quick Start Strategy:</strong></p>
                    <ol>
                        <li>Buy basic ingredients (flour, eggs, butter, sugar)</li>
                        <li>Bake a variety of products</li>
                        <li>Open for sales and watch customers arrive</li>
                        <li>Check Summary to track your progress</li>
                        <li>Reinvest profits to grow your business!</li>
                    </ol>
                    <p style="text-align: center; font-size: 18px; margin-top: 20px;">
                        <strong>Good luck, baker! 🥖🥐🍰</strong>
                    </p>
                `,
                highlight: null,
                mode: 'vendor'
            }
        ];
        
        this.init();
    }
    
    init() {
        // Start tutorial button
        const startBtn = document.getElementById('start-tutorial');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        
        // Tutorial navigation
        document.getElementById('tutorial-prev')?.addEventListener('click', () => this.prev());
        document.getElementById('tutorial-next')?.addEventListener('click', () => this.next());
        document.getElementById('tutorial-skip')?.addEventListener('click', () => this.skip());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                this.next();
            } else if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'Escape') {
                this.skip();
            }
        });
        
        // Check if first time
        if (!localStorage.getItem('bakery_tutorial_complete')) {
            setTimeout(() => this.start(), 500);
        }
    }
    
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.overlay.classList.add('active');
        
        // Animate in
        gsap.fromTo(this.overlay, 
            { opacity: 0 },
            { opacity: 1, duration: 0.4 }
        );
        
        this.renderStep();
    }
    
    renderStep() {
        const step = this.steps[this.currentStep];
        
        // Update content with animation
        gsap.to(this.contentEl, {
            opacity: 0,
            y: 20,
            duration: 0.2,
            onComplete: () => {
                this.contentEl.innerHTML = `
                    <h2>${step.title}</h2>
                    <div class="tutorial-body">${step.content}</div>
                `;
                
                gsap.to(this.contentEl, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3
                });
            }
        });
        
        // Update dots
        this.dotsEl.innerHTML = this.steps.map((_, i) => `
            <div class="tutorial-dot ${i === this.currentStep ? 'active' : ''}" 
                 data-step="${i}"></div>
        `).join('');
        
        // Add dot click handlers
        this.dotsEl.querySelectorAll('.tutorial-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                this.currentStep = parseInt(dot.dataset.step);
                this.renderStep();
            });
        });
        
        // Update buttons
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        
        prevBtn.style.visibility = this.currentStep === 0 ? 'hidden' : 'visible';
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Start Playing!' : 'Next →';
        
        // Switch mode if specified
        if (step.mode && this.ui) {
            this.ui.switchMode(step.mode);
        }
        
        // Highlight element if specified
        this.updateHighlight(step.highlight);
    }
    
    updateHighlight(selector) {
        // Remove existing highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        if (selector) {
            const el = document.querySelector(selector);
            if (el) {
                el.classList.add('tutorial-highlight');
                
                // Pulse animation
                gsap.fromTo(el, 
                    { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.7)' },
                    { 
                        boxShadow: '0 0 0 10px rgba(255, 215, 0, 0)',
                        duration: 1,
                        repeat: 2,
                        ease: 'power2.out'
                    }
                );
            }
        }
    }
    
    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        } else {
            this.complete();
        }
    }
    
    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep();
        }
    }
    
    skip() {
        this.complete();
    }
    
    complete() {
        this.isActive = false;
        localStorage.setItem('bakery_tutorial_complete', 'true');
        
        // Remove highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Animate out
        gsap.to(this.overlay, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                this.overlay.classList.remove('active');
            }
        });
        
        // Show welcome toast
        if (this.ui) {
            this.ui.showToast('Welcome to Sweet Success Bakery! Good luck! 🥐', 'success');
        }
    }
    
    // Reset tutorial (for testing or re-learning)
    reset() {
        localStorage.removeItem('bakery_tutorial_complete');
        this.start();
    }
}

// Make globally available
window.TutorialSystem = TutorialSystem;
