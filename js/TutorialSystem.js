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
                dialogue: "Hello! I'm Master Baker Pierre, and I'll teach you how to run this bakery step by step. Don't worry — it's easy once you get the hang of it!",
                thought: "He looks serious about his bread...",
                actionHint: "Click 'Next Step' below to continue →",
                target: null,
                action: () => { }
            },
            {
                title: "How the Game Works",
                dialogue: "Every day in your bakery has 4 steps: ① BUY ingredients, ② BAKE products, ③ SELL to customers, and ④ check your SUMMARY to see if you made money. That's it!",
                thought: "Buy → Bake → Sell → Summary. Repeat!",
                actionHint: "Click 'Next Step' to continue →",
                target: "#btn-new-game",
                action: () => { }
            },
            {
                title: "Bakery Setup",
                dialogue: "This is Startup City! Use the WASD keys on your keyboard to walk around. Visit the buildings to set up your bakery — start with the Real Estate Agency!",
                thought: "I should probably start in the Suburbs to save on rent.",
                actionHint: "👉 Use W/A/S/D keys to walk, then press E near a building to enter it",
                target: "#phaser-container",
                trigger: "phase:setup"
            },
            {
                title: "The Hub — Your Home Base",
                dialogue: "Welcome to your bakery hub! You'll see colored pads on the floor labeled BUY, BAKE, SELL, and SUMMARY. Walk to the 'BUY' pad and press E to start buying ingredients.",
                thought: "I can choose what to do next.",
                actionHint: "👉 Walk to the green BUY pad and press E",
                target: "#phaser-container",
                trigger: "phase:hub"
            },
            {
                title: "Step 1: Buying Ingredients",
                dialogue: "This is where you buy Flour, Sugar, and Eggs — the things you need to bake! Watch me buy 10 bags of Flour to show you how it works.",
                thought: "Pay attention to the cash balance going down.",
                actionHint: "👉 Click 'Show Me' to watch a demo purchase, then click amounts to buy yourself",
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
                title: "Your Turn to Buy!",
                dialogue: "Great! Now you try. Click on Sugar or Eggs and buy some. You can't bake without ingredients, so stock up!",
                thought: "I need to buy something to continue.",
                actionHint: "👉 Click on an ingredient card, then click a quantity button to buy it",
                target: "#buy-phase-container",
                requirement: 'purchase'
            },
            {
                title: "Step 2: Baking Time!",
                dialogue: "Now the fun part — baking! Click on a recipe card (like Bread) to bake it. Each recipe uses ingredients you bought. Watch me bake some bread!",
                thought: "Bread is the staple of life.",
                actionHint: "👉 Click 'Show Me' to see how baking works, then try it yourself",
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
                title: "Step 3: Selling to Customers",
                dialogue: "Customers are arriving! They'll buy your baked goods automatically. You can set your markup (price increase) — but be careful, if prices are too high, fewer customers will buy!",
                thought: "I should watch the demand indicator.",
                actionHint: "👉 Use the markup slider to set prices. Watch the demand bar — green is good!",
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
                title: "Step 4: Daily Summary",
                dialogue: "This is your daily report card! Look at 'Net Profit' — that's the money you actually earned today. If the number is green, you made money. If it's red, you lost money. Try to stay in the green!",
                thought: "Hopefully we're rising like a good sourdough.",
                actionHint: "👉 Review your numbers, then click 'Next Day' to start a new day!",
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
        skipBtn.textContent = '✕ Exit Tutorial';
        skipBtn.style.position = 'fixed';
        skipBtn.style.top = '20px';
        skipBtn.style.right = '20px';
        skipBtn.style.padding = '12px 24px';
        skipBtn.style.background = 'rgba(200,50,50,0.3)';
        skipBtn.style.color = 'white';
        skipBtn.style.border = '1px solid rgba(200,50,50,0.5)';
        skipBtn.style.borderRadius = '20px';
        skipBtn.style.cursor = 'pointer';
        skipBtn.style.zIndex = '2005';
        skipBtn.style.fontSize = '15px';
        skipBtn.style.fontFamily = "'Inter', sans-serif";
        skipBtn.style.transition = 'all 0.3s ease';
        skipBtn.onmouseover = () => { skipBtn.style.background = 'rgba(200,50,50,0.6)'; };
        skipBtn.onmouseout = () => { skipBtn.style.background = 'rgba(200,50,50,0.3)'; };
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
        const totalSteps = this.steps.length;
        const progressPercent = ((this.currentStep + 1) / totalSteps * 100).toFixed(0);

        // Update text
        let buttonsHtml = '';

        if (step.demonstration) {
            buttonsHtml += `<button class="tutorial-demo-btn" style="font-size: 16px; padding: 10px 20px;">👀 Show Me How</button>`;
        }

        buttonsHtml += `<button class="tutorial-next-btn" ${step.requirement ? 'disabled' : ''} style="font-size: 16px; padding: 10px 20px;">Next Step →</button>`;

        // Action hint HTML
        const actionHintHtml = step.actionHint ? `
            <div class="action-hint" style="
                background: rgba(76, 175, 80, 0.15);
                border: 1px solid rgba(76, 175, 80, 0.4);
                border-radius: 10px;
                padding: 10px 14px;
                margin-top: 10px;
                font-size: 15px;
                color: #81c784;
                line-height: 1.4;
            ">${step.actionHint}</div>
        ` : '';

        this.dialogue.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            ">
                <div style="font-size: 13px; color: var(--primary); font-weight: 700; text-transform: uppercase; white-space: nowrap;">${step.title}</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.5); white-space: nowrap;">Step ${this.currentStep + 1} of ${totalSteps}</div>
            </div>
            <div style="
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
                height: 6px;
                margin-bottom: 12px;
                overflow: hidden;
            ">
                <div style="
                    background: linear-gradient(90deg, #d4af37, #f0c040);
                    height: 100%;
                    width: ${progressPercent}%;
                    border-radius: 10px;
                    transition: width 0.5s ease;
                "></div>
            </div>
            <div class="dialogue-text" style="font-size: 17px; line-height: 1.6; margin-bottom: 8px;">${step.dialogue}</div>
            ${actionHintHtml}
            <div class="tutorial-actions" style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
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
