class TutorialSystem {
    constructor(gameController) {
        this.gameController = gameController;
        this.currentStep = 0;
        this.overlay = null;
        this.character = null;
        this.dialogue = null;
        this.thought = null;
        this.highlight = null;
        
        this.steps = [
            {
                title: "Welcome to the Bakery!",
                dialogue: "Welcome, apprentice! I'm Master Baker Pierre. I'll show you how to run a successful bakery. Ready to make some dough?",
                thought: "He looks serious about his bread...",
                target: null,
                action: () => {}
            },
            {
                title: "The Daily Cycle",
                dialogue: "Every day has four phases: Buying ingredients, Baking, Selling, and reviewing your Summary. But first, we need to set up your shop!",
                thought: "Phase 0: Setup. Got it.",
                target: "#btn-new-game",
                action: () => {}
            },
            {
                title: "Bakery Setup",
                dialogue: "Welcome to Startup City! Use WASD to walk around. Visit the Real Estate Agency first to choose a location, then City Hall for permits, and finally the Supply Store for equipment.",
                thought: "I should probably start in the Suburbs to save on rent.",
                target: "#phaser-container",
                trigger: "phase:setup"
            },
            {
                title: "The Hub",
                dialogue: "This is your bakery hub! Walk to the 'BUY' pad and press E to purchase ingredients.",
                thought: "I can choose what to do next.",
                target: "#phaser-container",
                trigger: "phase:hub"
            },
            {
                title: "Buying Ingredients",
                dialogue: "In the Buying phase, you need to stock up on Flour, Sugar, and Eggs. Watch me buy some Flour to get us started!",
                thought: "Pay attention to the cash balance going down.",
                target: "#buy-phase-container",
                trigger: "phase:buying",
                demonstration: (gc) => {
                    // Simulate buying flour (use config keys)
                    const result = gc.engine.purchaseIngredient('FLOUR', 10, 'SYSCO');
                    if (result.success) {
                        gc.showPopup({
                            icon: '📦',
                            title: 'Demo Purchase',
                            message: 'I just bought 10 units of Flour! See how our cash went down?',
                            type: 'info',
                            autoClose: 2000
                        });
                        gc.updateStats();
                        // Force update of buying UI if visible
                        if (gc.currentPhase === 'buying') gc.showBuyingPhase();
                    }
                },
                requirement: 'purchase'
            },
            {
                title: "Your Turn to Buy",
                dialogue: "Now you try! Buy some Sugar or Eggs. We can't bake without ingredients!",
                thought: "I need to buy something to continue.",
                target: "#buy-phase-container",
                requirement: 'purchase'
            },
            {
                title: "Baking Time",
                dialogue: "Now we bake! You can make Bread, Cookies, or Cakes. Watch me start a batch of Bread.",
                thought: "Bread is the staple of life.",
                target: "#bake-phase-container",
                trigger: "phase:baking",
                demonstration: (gc) => {
                    // Ensure we have ingredients for bread
                    if (gc.engine.getIngredientStock('FLOUR') < 2) {
                        gc.engine.purchaseIngredient('FLOUR', 10, 'SYSCO');
                    }
                    
                    const result = gc.engine.startBaking('bread', 1);
                    if (result.success) {
                         gc.showPopup({
                            icon: '🍞',
                            title: 'Demo Bake',
                            message: 'Baking started! Ingredients were consumed.',
                            type: 'info',
                            autoClose: 2000
                        });
                        gc.renderOven();
                        gc.renderRecipes();
                    }
                },
                requirement: 'bake'
            },
            {
                title: "Selling Your Goods",
                dialogue: "The customers are here! Set your prices carefully. A good player watches the demand indicator—if it's low, lower your prices! Watch me sell a croissant.",
                thought: "I should watch the demand indicator.",
                target: "#sell-phase-container",
                trigger: "phase:selling",
                demonstration: (gc) => {
                    // Simulate a sale
                    // We need to ensure there is stock to sell
                    const products = Object.keys(gc.engine.products);
                    const productToSell = products.find(p => gc.engine.getProductStock(p) > 0);
                    
                    if (productToSell) {
                        const result = gc.engine.processSale(productToSell, 1);
                        if (result.success) {
                            gc.showPopup({
                                icon: '💰',
                                title: 'Demo Sale',
                                message: `Sold 1x ${GAME_CONFIG.RECIPES[productToSell].name} for $${result.revenue.toFixed(2)}!`,
                                type: 'success',
                                autoClose: 2000
                            });
                            gc.updateStats();
                            gc.renderDisplayProducts();
                        }
                    } else {
                         gc.showPopup({
                            icon: '❌',
                            title: 'Demo Failed',
                            message: 'No products to sell! Bake something first.',
                            type: 'error',
                            autoClose: 2000
                        });
                    }
                },
                requirement: 'sell'
            },
            {
                title: "Daily Summary",
                dialogue: "At the end of the day, we look at the numbers. This tells us if we're growing or going stale! Check your 'Net Profit'—that's what you actually keep.",
                thought: "Hopefully we're rising like a good sourdough.",
                target: "#summary-phase-container",
                trigger: "phase:summary"
            }
        ];

        this.init();
    }

    init() {
        // Create overlay elements
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        
        this.highlight = document.createElement('div');
        this.highlight.className = 'tutorial-highlight';
        
        this.character = document.createElement('div');
        this.character.className = 'tutorial-character';
        this.character.innerHTML = '👨‍🍳';
        
        this.dialogue = document.createElement('div');
        this.dialogue.className = 'dialogue-bubble';
        
        this.thought = document.createElement('div');
        this.thought.className = 'thought-bubble';

        const skipBtn = document.createElement('button');
        skipBtn.textContent = 'Skip Tutorial';
        skipBtn.style.position = 'fixed';
        skipBtn.style.top = '20px';
        skipBtn.style.right = '20px';
        skipBtn.style.padding = '10px 20px';
        skipBtn.style.background = 'rgba(255,255,255,0.2)';
        skipBtn.style.color = 'white';
        skipBtn.style.border = '1px solid rgba(255,255,255,0.3)';
        skipBtn.style.borderRadius = '20px';
        skipBtn.style.cursor = 'pointer';
        skipBtn.style.zIndex = '2005';
        skipBtn.onclick = () => this.end();
        
        this.overlay.appendChild(this.highlight);
        this.overlay.appendChild(this.character);
        this.overlay.appendChild(this.dialogue);
        this.overlay.appendChild(this.thought);
        this.overlay.appendChild(skipBtn);
        
        document.body.appendChild(this.overlay);

        // Listen for phase changes from GameController
        window.addEventListener('gamePhaseChanged', (e) => {
            this.handlePhaseChange(e.detail.phase);
        });
    }

    start() {
        this.currentStep = 0;
        this.overlay.classList.add('active');
        this.showStep();
        
        // Animate character in
        gsap.from(this.character, {
            x: 200,
            opacity: 0,
            duration: 0.8,
            ease: "back.out(1.7)"
        });
    }

    showStep() {
        const step = this.steps[this.currentStep];
        
        // Update text
        let buttonsHtml = '';
        
        if (step.demonstration) {
            buttonsHtml += `<button class="tutorial-demo-btn">Show Me</button>`;
        }
        
        buttonsHtml += `<button class="tutorial-next-btn" ${step.requirement ? 'disabled' : ''}>Next Step</button>`;

        this.dialogue.innerHTML = `
            <div style="font-size: 12px; color: var(--primary); margin-bottom: 5px; font-weight: 700; text-transform: uppercase;">${step.title}</div>
            <div class="dialogue-text">${step.dialogue}</div>
            <div class="tutorial-actions">
                ${buttonsHtml}
            </div>
        `;
        
        this.thought.textContent = step.thought;
        
        // Handle highlight
        if (step.target) {
            const el = document.querySelector(step.target);
            if (el) {
                const rect = el.getBoundingClientRect();
                gsap.to(this.highlight, {
                    top: rect.top - 10,
                    left: rect.left - 10,
                    width: rect.width + 20,
                    height: rect.height + 20,
                    opacity: 1,
                    duration: 0.5,
                    overwrite: true
                });
            }
        } else {
            gsap.to(this.highlight, { opacity: 0, duration: 0.3, overwrite: true });
        }

        // Add event listeners
        const nextBtn = this.dialogue.querySelector('.tutorial-next-btn');
        if (nextBtn) nextBtn.onclick = () => this.next();
        
        const demoBtn = this.dialogue.querySelector('.tutorial-demo-btn');
        if (demoBtn) {
            demoBtn.onclick = () => {
                demoBtn.disabled = true;
                demoBtn.textContent = "Watch...";
                step.demonstration(this.gameController);
            };
        }

        // Setup requirement listener
        if (step.requirement) {
            this.setupRequirementListener(step, nextBtn);
        }

        // Animate bubbles
        gsap.killTweensOf([this.dialogue, this.thought, this.character]);
        gsap.set([this.dialogue, this.thought], { opacity: 1, scale: 1, visibility: 'visible' });
        
        gsap.from([this.dialogue, this.thought], {
            scale: 0.8,
            opacity: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: "back.out(1.7)"
        });

        // Character bounce
        gsap.from(this.character, {
            y: 20,
            duration: 0.5,
            ease: "bounce.out"
        });
    }

    setupRequirementListener(step, nextBtn) {
        const reqType = step.requirement;
        
        const handler = (e) => {
            // Check if requirement is met
            let met = false;
            
            if (typeof reqType === 'function') {
                met = reqType(e);
            } else {
                if (reqType === 'purchase' && e.detail && e.detail.quantity > 0) met = true;
                if (reqType === 'bake' && e.detail && e.detail.item) met = true;
                if (reqType === 'sell' && e.detail && e.detail.revenue > 0) met = true;
            }
            
            if (met) {
                nextBtn.disabled = false;
                nextBtn.classList.add('pulse');
                nextBtn.textContent = "Continue";
                // Remove listener
                if (this.currentRequirementCleanup) {
                    this.currentRequirementCleanup();
                    this.currentRequirementCleanup = null;
                }
            }
        };
        
        let eventName = step.requirementEvent;
        
        if (!eventName && typeof reqType === 'string') {
            const eventMap = {
                'purchase': 'engine:purchase',
                'bake': 'engine:baking_started',
                'sell': 'engine:sale'
            };
            eventName = eventMap[reqType] || reqType;
        }
        
        if (eventName) {
            window.addEventListener(eventName, handler);
            this.currentRequirementCleanup = () => window.removeEventListener(eventName, handler);
        }
    }

    next() {
        if (this.currentRequirementCleanup) {
            this.currentRequirementCleanup();
            this.currentRequirementCleanup = null;
        }
        
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            this.showStep();
        } else {
            this.end();
        }
    }

    next() {
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            this.showStep();
        } else {
            this.end();
        }
    }

    handlePhaseChange(phase) {
        // Find step matching this phase trigger
        const stepIndex = this.steps.findIndex(s => s.trigger === `phase:${phase}`);
        if (stepIndex !== -1 && this.overlay.classList.contains('active')) {
            this.currentStep = stepIndex;
            this.showStep();
        }
    }

    end() {
        gsap.to(this.overlay, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                this.overlay.classList.remove('active');
                this.overlay.style.opacity = 1;
            }
        });
    }
}
