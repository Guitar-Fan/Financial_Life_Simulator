/**
 * Tutorial_Manager.js
 * 
 * Manages the optional 5-minute tutorial walkthrough.
 * Shows demo at beginning and accessible via menu.
 * Guides players through: purchasing, production, sales, and shrinkage.
 */

class TutorialManager {
    constructor() {
        this.isActive = false;
        this.currentStep = 0;
        this.steps = [];
        this.completedSteps = [];
        
        // Check if tutorial has been completed before
        this.tutorialCompleted = this.checkTutorialCompleted();
        
        this.initializeTutorialSteps();
    }
    
    /**
     * Initialize tutorial steps
     */
    initializeTutorialSteps() {
        this.steps = [
            {
                title: 'Welcome to Bakery Business Simulator!',
                content: `You're starting with $50,000 capital. Your goal is to run a profitable bakery for 12 months and build your net worth to at least $20,000.
                
You'll learn about:
• COGS (Cost of Goods Sold)
• FIFO (First-In, First-Out) inventory
• Just-In-Time (JIT) ordering
• Shrinkage and waste management
• Financial KPIs

Let's get started!`,
                action: 'SHOW_MENU',
                highlight: null
            },
            {
                title: 'Step 1: Purchasing Supplies',
                content: `First, you need to order ingredients. Click on the PURCHASING menu.

You'll see ingredient prices, Minimum Order Quantities (MOQ), and delivery times.

Let's order 100 lbs of All-Purpose Flour. Notice the 2% cash discount for immediate payment and the 3-day delivery lead time.`,
                action: 'ORDER_FLOUR',
                highlight: 'PURCHASING',
                expectedAction: {
                    type: 'PURCHASE',
                    ingredient: 'FLOUR_AP',
                    minQuantity: 100
                }
            },
            {
                title: 'Step 2: Understanding Delivery Times',
                content: `Great! Your order has been placed. 

Notice it won't arrive immediately - there's a 3-day lead time for dry goods. This is realistic Just-In-Time (JIT) inventory management.

You CANNOT skip ahead - you must play through the delivery wait. This teaches planning ahead!

For now, we'll fast-forward to delivery day for the tutorial.`,
                action: 'WAIT_DELIVERY',
                highlight: 'DELIVERY_SCHEDULE'
            },
            {
                title: 'Step 3: Production - Making Products',
                content: `Your flour has arrived! Now let's bake some bread.

Click on the PRODUCTION menu and select "Basic White Bread".

Notice the recipe shows:
• Ingredients needed per loaf
• Calculated COGS (Cost of Goods Sold)
• Instant production (no waiting!)

Produce 10 loaves of bread.`,
                action: 'PRODUCE_BREAD',
                highlight: 'PRODUCTION',
                expectedAction: {
                    type: 'PRODUCE',
                    product: 'BASIC_BREAD',
                    minQuantity: 10
                }
            },
            {
                title: 'Step 4: FIFO and Cost Calculation',
                content: `Excellent! You've produced 10 loaves.

Notice the system used FIFO (First-In, First-Out):
• It consumed flour from the OLDEST batch first
• The exact COGS was calculated: ~$0.93 per loaf
• This includes ingredients + packaging

The bread has a 1-day shelf life. If not sold by tomorrow, it becomes shrinkage (waste)!`,
                action: 'EXPLAIN_FIFO',
                highlight: 'INVENTORY'
            },
            {
                title: 'Step 5: Opening for Sales',
                content: `Now let's sell your bread! Click "OPEN SHOP" to start the sales floor.

⚠️ TIME ONLY FLOWS DURING SALES MODE ⚠️

While shopping is open:
• Customers arrive based on time-of-day patterns
• Peak hours: 6-8 AM and 4-6 PM
• Each customer buys 1-3 items
• Shop closes automatically at 8 PM

Watch as customers purchase your bread!`,
                action: 'OPEN_SHOP',
                highlight: 'SALES_FLOOR',
                expectedAction: {
                    type: 'OPEN_SHOP'
                }
            },
            {
                title: 'Step 6: Watching Sales Happen',
                content: `Perfect! Your shop is open and time is flowing.

Watch the Financial Dashboard (top of screen):
• Cash increases with each sale
• Inventory Value decreases (converting to cash)
• Gross Margin shows profitability
• Game clock advances (1 game day = 90 real seconds)

Customers are buying your bread! Notice the automatic FIFO - oldest products sell first.`,
                action: 'WATCH_SALES',
                highlight: 'DASHBOARD'
            },
            {
                title: 'Step 7: Understanding Shrinkage',
                content: `Time is accelerating... Let's skip ahead 24 hours.

⚠️ Any bread not sold by tomorrow expires!

Expired items automatically move to the WASTE BIN. This is shrinkage - a real business cost.

Shrinkage reduces your Inventory Value WITHOUT giving you cash. It's a pure loss!

Managing waste is critical to profitability.`,
                action: 'SHOW_SHRINKAGE',
                highlight: 'WASTE_BIN'
            },
            {
                title: 'Step 8: The Day Summary',
                content: `It's 8 PM - shop closing time!

The game automatically transitions to the DAY SUMMARY screen showing:
• Total Sales Revenue
• Total COGS (what the sold goods cost you)
• Gross Profit (Revenue - COGS)
• Shrinkage losses
• Net Cash Flow

This happens every day. Review your performance and plan for tomorrow!`,
                action: 'SHOW_DAY_SUMMARY',
                highlight: 'SUMMARY'
            },
            {
                title: 'Step 9: Financial Dashboard KPIs',
                content: `Let's review the key metrics you'll track:

• **Cash On Hand**: Your liquid funds
• **Inventory Value**: Value of raw materials + finished goods
• **Gross Margin %**: (Revenue - COGS) / Revenue × 100
  Target: 78% or higher
• **Inventory Turnover**: How fast stock moves
  Target: 12x per year (1x per month)

These metrics determine success or bankruptcy!`,
                action: 'EXPLAIN_KPIS',
                highlight: 'DASHBOARD'
            },
            {
                title: 'Step 10: Monthly Expenses',
                content: `Every 30 game days, fixed costs are deducted:

• Rent: $3,800
• Utilities: $1,575
• Insurance: $350
• Maintenance: $400
• Other: $520
• **Total: $6,645/month**

You need consistent profit to cover these! If your net worth drops below $5,000, it's GAME OVER (bankruptcy).`,
                action: 'EXPLAIN_EXPENSES',
                highlight: null
            },
            {
                title: 'Tutorial Complete!',
                content: `Congratulations! You now understand:

✅ Purchasing with MOQs and delivery times
✅ FIFO inventory management
✅ COGS calculation
✅ Production and sales
✅ Shrinkage and waste
✅ Financial KPIs
✅ Monthly expenses

**Your Goal**: Survive 12 months with net worth ≥ $20,000

**Tips**:
• Order ingredients before running out (plan 3+ days ahead)
• Produce based on demand to minimize waste
• Monitor gross margin - aim for 75%+
• Keep cash reserves for monthly expenses

Ready to start your bakery journey?`,
                action: 'COMPLETE',
                highlight: null
            }
        ];
    }
    
    /**
     * Check if tutorial has been completed before
     */
    checkTutorialCompleted() {
        try {
            return localStorage.getItem('bakery_tutorial_completed') === 'true';
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Mark tutorial as completed
     */
    markCompleted() {
        this.tutorialCompleted = true;
        try {
            localStorage.setItem('bakery_tutorial_completed', 'true');
        } catch (e) {
            console.error('Failed to save tutorial completion status:', e);
        }
    }
    
    /**
     * Start tutorial
     */
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.completedSteps = [];
        console.log('Tutorial started');
    }
    
    /**
     * Get current step
     */
    getCurrentStep() {
        if (!this.isActive || this.currentStep >= this.steps.length) {
            return null;
        }
        return this.steps[this.currentStep];
    }
    
    /**
     * Advance to next step
     */
    nextStep() {
        if (!this.isActive) return false;
        
        this.completedSteps.push(this.currentStep);
        this.currentStep++;
        
        if (this.currentStep >= this.steps.length) {
            this.complete();
            return false;
        }
        
        return true;
    }
    
    /**
     * Go to previous step
     */
    previousStep() {
        if (!this.isActive || this.currentStep === 0) return false;
        
        this.currentStep--;
        this.completedSteps.pop();
        return true;
    }
    
    /**
     * Skip tutorial
     */
    skip() {
        this.isActive = false;
        this.markCompleted();
        console.log('Tutorial skipped');
    }
    
    /**
     * Complete tutorial
     */
    complete() {
        this.isActive = false;
        this.markCompleted();
        console.log('Tutorial completed!');
    }
    
    /**
     * Validate if expected action was performed
     */
    validateAction(actionType, actionData) {
        const currentStep = this.getCurrentStep();
        if (!currentStep || !currentStep.expectedAction) {
            return true; // No validation needed
        }
        
        const expected = currentStep.expectedAction;
        
        if (expected.type !== actionType) {
            return false;
        }
        
        // Validate specific requirements
        if (expected.ingredient && actionData.ingredient !== expected.ingredient) {
            return false;
        }
        
        if (expected.product && actionData.product !== expected.product) {
            return false;
        }
        
        if (expected.minQuantity && actionData.quantity < expected.minQuantity) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Show tutorial on first launch
     */
    shouldShowOnLaunch() {
        return !this.tutorialCompleted && REALISTIC_PARAMETERS.TUTORIAL.SHOW_ON_FIRST_LAUNCH;
    }
    
    /**
     * Get tutorial progress percentage
     */
    getProgress() {
        if (this.steps.length === 0) return 0;
        return (this.currentStep / this.steps.length) * 100;
    }
    
    /**
     * Get step count
     */
    getTotalSteps() {
        return this.steps.length;
    }
    
    /**
     * Render tutorial modal content as HTML
     */
    renderTutorialHTML() {
        const step = this.getCurrentStep();
        if (!step) return '';
        
        const progress = this.getProgress();
        
        return `
            <h2>${step.title}</h2>
            <div style="white-space: pre-line; line-height: 1.6; margin: 20px 0;">
                ${step.content}
            </div>
            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin: 20px 0;">
                <div style="background: #7c3aed; height: 100%; width: ${progress}%; border-radius: 4px; transition: width 0.3s;"></div>
            </div>
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 10px;">
                Step ${this.currentStep + 1} of ${this.steps.length}
            </div>
            <div class="modal-buttons">
                ${this.currentStep > 0 ? '<button class="btn btn-secondary" id="tutorial-prev">← Previous</button>' : ''}
                <button class="btn btn-secondary" id="tutorial-skip">Skip Tutorial</button>
                ${this.currentStep < this.steps.length - 1 ? 
                    '<button class="btn btn-primary" id="tutorial-next">Next →</button>' :
                    '<button class="btn btn-success" id="tutorial-complete">Start Game!</button>'}
            </div>
        `;
    }
    
    /**
     * Render initial tutorial prompt
     */
    renderWelcomeHTML() {
        return `
            <h2>Welcome to Bakery Business Simulator!</h2>
            <p style="line-height: 1.6; margin: 20px 0;">
                Learn how to run a profitable bakery business while mastering concepts like COGS, 
                FIFO inventory, JIT ordering, and financial KPIs.
            </p>
            <p style="line-height: 1.6; margin: 20px 0;">
                The tutorial takes about 5 minutes and is recommended for first-time players.
            </p>
            <div class="modal-buttons">
                <button class="btn btn-secondary" id="tutorial-skip-welcome">Skip to Game</button>
                <button class="btn btn-primary" id="tutorial-start">Start Tutorial</button>
            </div>
        `;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialManager;
}
