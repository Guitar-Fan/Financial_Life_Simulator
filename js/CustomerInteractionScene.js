/**
 * CustomerInteractionScene.js - Immersive customer interaction system
 * Handles face-to-face customer interactions with small talk and service gameplay
 */

class CustomerInteractionScene {
    constructor(gameController, customer, staff) {
        this.game = gameController;
        this.customer = customer;
        this.staff = staff;
        this.isOwner = (staff && (staff.role === 'owner' || staff.isPlayer));

        // Interaction state
        this.phase = 'greeting'; // greeting, smalltalk, ordering, waiting, closing
        this.conversation = [];
        this.smallTalkScore = 0;
        this.smallTalkDuration = 0;
        this.customerMood = customer.currentMood;
        this.initialMood = customer.currentMood;

        // Interaction metrics
        this.startTime = Date.now();
        this.totalTime = 0;
        this.satisfactionModifier = 0;

        // Items ordered
        this.orderedItems = [];
        this.waitingForItems = [];

        // Dialogue history
        this.dialogueLog = [];

        console.log(`👤 Interaction started with ${customer.name} (${this.isOwner ? 'Owner' : 'Staff'})`);
    }

    // ==================== INTERACTION FLOW ====================

    /**
     * Start interaction (different for owner vs staff)
     */
    start() {
        if (this.isOwner) {
            return this.startImmersiveMode();
        } else {
            return this.autoResolveInteraction();
        }
    }

    /**
     * Start immersive mode (owner only)
     */
    startImmersiveMode() {
        console.log('🎮 Starting immersive interaction mode');

        // Show interaction UI
        this.showInteractionUI();

        // Start with greeting
        this.startPhase('greeting');

        // Return promise that resolves when interaction completes
        return new Promise((resolve) => {
            this.resolveInteraction = resolve;
        });
    }

    /**
     * Auto-resolve interaction (staff)
     */
    autoResolveInteraction() {
        console.log('🤖 Auto-resolving staff interaction');

        const staffPerformance = this.calculateStaffPerformance();
        const interactionTime = this.estimateInteractionTime();

        // Simulate the interaction
        const result = {
            success: staffPerformance > 50,
            satisfaction: staffPerformance,
            timeElapsed: interactionTime,
            revenue: 0,
            items: [],
            staffPerformance: staffPerformance,
            autoResolved: true
        };

        // Randomly select an item
        if (this.game.engine && this.game.engine.inventory) {
            const availableItems = Object.keys(this.game.engine.inventory).filter(
                item => this.game.engine.inventory[item] > 0
            );

            if (availableItems.length > 0) {
                const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                result.items.push(selectedItem);

                // Calculate revenue
                const recipe = GAME_CONFIG.RECIPES[selectedItem];
                if (recipe) {
                    result.revenue = recipe.retailPrice;
                }
            }
        }

        return Promise.resolve(result);
    }

    // ==================== IMMERSIVE MODE - PHASES ====================

    /**
     * Start a specific phase
     */
    startPhase(phaseName) {
        this.phase = phaseName;
        console.log(`📍 Phase: ${phaseName}`);

        switch (phaseName) {
            case 'greeting':
                this.showGreetingPhase();
                break;
            case 'smalltalk':
                this.showSmallTalkPhase();
                break;
            case 'ordering':
                this.showOrderingPhase();
                break;
            case 'waiting':
                this.showWaitingPhase();
                break;
            case 'closing':
                this.showClosingPhase();
                break;
        }
    }

    /**
     * Greeting phase
     */
    showGreetingPhase() {
        const greetings = this.generateGreetingOptions();

        this.showDialogue(
            this.getCustomerGreeting(),
            greetings,
            'Choose your greeting:'
        );
    }

    /**
     * Generate greeting options based on customer personality
     */
    generateGreetingOptions() {
        const options = [
            {
                text: "Hello! Welcome to our bakery!",
                type: 'friendly',
                moodEffect: 5,
                time: 3
            },
            {
                text: "Good to see you! How can I help you today?",
                type: 'warm',
                moodEffect: 8,
                time: 5
            },
            {
                text: "Hi there! What can I get for you?",
                type: 'efficient',
                moodEffect: 3,
                time: 2
            }
        ];

        // Add personalized greeting if returning customer
        if (this.customer.visits > 3) {
            options.push({
                text: `Welcome back, ${this.customer.name.split(' ')[0]}! The usual?`,
                type: 'personal',
                moodEffect: 15,
                time: 4,
                requiresVisits: 3
            });
        }

        return options;
    }

    /**
     * Small talk phase
     */
    showSmallTalkPhase() {
        const topics = this.generateSmallTalkOptions();

        this.showDialogue(
            this.getCustomerSmallTalkPrompt(),
            topics,
            'Small talk options (or skip to ordering):'
        );
    }

    /**
     * Generate small talk options
     */
    generateSmallTalkOptions() {
        const weather = this.game.engine && this.game.engine.economy ?
            this.game.engine.economy.weather : 'nice';

        const options = [
            {
                topic: 'weather',
                text: `Beautiful ${weather} weather today, isn't it?`,
                duration: 15,
                moodEffect: this.customer.externalFactors.weatherSensitivity / 10,
                icon: '🌤️'
            },
            {
                topic: 'neighborhood',
                text: "How's everything in the neighborhood?",
                duration: 20,
                moodEffect: 5,
                icon: '🏘️'
            },
            {
                topic: 'compliment',
                text: "You're looking well today!",
                duration: 10,
                moodEffect: 10,
                loyaltyBonus: 2,
                icon: '😊'
            },
            {
                topic: 'product',
                text: "Have you tried our new items?",
                duration: 25,
                moodEffect: 3,
                salesBonus: 5,
                icon: '🥐'
            },
            {
                topic: 'skip',
                text: "Let's see what you'd like to order!",
                duration: 0,
                moodEffect: -this.customer.personality.chattiness / 10,
                icon: '⏭️'
            }
        ];

        // Filter based on customer mood and personality
        if (this.customer.personality.chattiness < 40) {
            // Remove long topics for non-chatty customers
            return options.filter(opt => opt.duration < 20 || opt.topic === 'skip');
        }

        return options;
    }

    /**
     * Ordering phase
     */
    showOrderingPhase() {
        const availableItems = this.getAvailableItems();
        const favoriteItems = this.customer.favoriteItems.slice(0, 3);

        this.showOrderingUI(availableItems, favoriteItems);
    }

    /**
     * Waiting phase (when item needs to be made)
     */
    showWaitingPhase() {
        const waitTime = this.estimateWaitTime();
        const willWait = this.customerWillWait(waitTime);

        if (willWait) {
            this.showDialogue(
                `"I can wait ${Math.ceil(waitTime / 60)} minutes for that!"`,
                [
                    {
                        text: "Great! I'll get that started right away.",
                        action: () => this.startBaking(),
                        icon: '👨‍🍳'
                    },
                    {
                        text: "Actually, may I suggest something else?",
                        action: () => this.suggestAlternative(),
                        icon: '💡'
                    }
                ],
                'Customer is willing to wait:'
            );
        } else {
            this.showDialogue(
                `"Oh, I don't have time to wait for that..."`,
                [
                    {
                        text: "Let me suggest something similar!",
                        action: () => this.suggestAlternative(),
                        icon: '💡'
                    },
                    {
                        text: "I understand. Anything else?",
                        action: () => this.startPhase('ordering'),
                        icon: '🔙'
                    }
                ],
                'Customer cannot wait:'
            );
        }
    }

    /**
     * Closing phase
     */
    showClosingPhase() {
        const closingOptions = this.generateClosingOptions();

        this.showDialogue(
            this.getCustomerClosing(),
            closingOptions,
            'How would you like to close?'
        );
    }

    // ==================== SMALL TALK MECHANICS ====================

    /**
     * Handle small talk selection
     */
    handleSmallTalk(option) {
        this.smallTalkDuration += option.duration;
        this.customerMood += option.moodEffect;
        this.customerMood = Math.max(0, Math.min(100, this.customerMood));

        // Add to conversation log
        this.conversation.push({
            type: 'smalltalk',
            topic: option.topic,
            duration: option.duration,
            effect: option.moodEffect
        });

        // Update small talk score
        this.updateSmallTalkScore();

        // Show customer response
        this.showCustomerResponse(option);

        // After small talk, can continue talking or move to ordering
        if (option.topic === 'skip') {
            this.startPhase('ordering');
        } else {
            // Option to continue or move on
            this.showSmallTalkContinuePrompt();
        }
    }

    /**
     * Calculate small talk score based on timing
     */
    updateSmallTalkScore() {
        const customerChattiness = this.customer.personality.chattiness;
        const idealDuration = (customerChattiness / 100) * 60; // 0-60 seconds ideal
        const actualDuration = this.smallTalkDuration;

        const difference = Math.abs(actualDuration - idealDuration);

        // Perfect match = 100, decreases with difference
        if (difference < 10) {
            this.smallTalkScore = 100;
        } else if (difference < 20) {
            this.smallTalkScore = 80;
        } else if (difference < 40) {
            this.smallTalkScore = 50;
        } else {
            this.smallTalkScore = 20;
        }

        // Bonus for chatty customers who got to chat
        if (customerChattiness > 70 && actualDuration > 30) {
            this.smallTalkScore += 10;
        }

        // Penalty for non-chatty customers forced to chat
        if (customerChattiness < 30 && actualDuration > 20) {
            this.smallTalkScore -= 20;
        }

        this.smallTalkScore = Math.max(0, Math.min(100, this.smallTalkScore));

        console.log(`💬 Small talk score: ${this.smallTalkScore}/100 (Duration: ${actualDuration}s, Ideal: ${idealDuration}s)`);
    }

    // ==================== ORDERING MECHANICS ====================

    /**
     * Handle item selection
     */
    handleOrderItem(itemKey) {
        const available = this.isItemAvailable(itemKey);

        if (available) {
            this.orderedItems.push(itemKey);
            this.showItemAddedConfirmation(itemKey);

            // Ask if they want anything else
            this.showContinueOrderingPrompt();
        } else {
            // Item not available - ask if they want to wait
            this.requestedItem = itemKey;
            this.startPhase('waiting');
        }
    }

    /**
     * Check if item is available
     */
    isItemAvailable(itemKey) {
        if (!this.game.engine || !this.game.engine.inventory) {
            return false;
        }
        return this.game.engine.inventory[itemKey] > 0;
    }

    /**
     * Get available items
     */
    getAvailableItems() {
        if (!this.game.engine || !GAME_CONFIG.RECIPES) {
            return [];
        }

        return Object.keys(GAME_CONFIG.RECIPES).map(key => ({
            key: key,
            ...GAME_CONFIG.RECIPES[key],
            available: this.isItemAvailable(key),
            isFavorite: this.customer.favoriteItems.some(f => f.item === key)
        }));
    }

    // ==================== WAITING MECHANICS ====================

    /**
     * Calculate if customer will wait
     */
    customerWillWait(minutes) {
        const patience = this.customer.personality.patience;
        const currentMood = this.customerMood;
        const maxWait = (patience / 100) * 15; // 0-15 minutes based on patience

        const willingToWait = minutes <= maxWait && currentMood > 30;

        console.log(`⏰ Wait check: ${minutes}m needed, ${maxWait.toFixed(1)}m max patience, mood ${currentMood}`);

        return willingToWait;
    }

    /**
     * Estimate wait time for item
     */
    estimateWaitTime() {
        if (!this.requestedItem || !GAME_CONFIG.RECIPES[this.requestedItem]) {
            return 5 * 60; // 5 minutes default
        }

        const recipe = GAME_CONFIG.RECIPES[this.requestedItem];
        return recipe.bakingTime || 5 * 60;
    }

    /**
     * Suggest alternative item
     */
    suggestAlternative() {
        const alternatives = this.findSimilarItems(this.requestedItem);

        if (alternatives.length > 0) {
            this.showAlternatives(alternatives);
        } else {
            this.startPhase('ordering');
        }
    }

    /**
     * Find similar available items
     */
    findSimilarItems(itemKey) {
        const availableItems = this.getAvailableItems().filter(item => item.available);

        // For now, just return random available items
        // Could be enhanced to actually match by category, price, etc.
        return availableItems.slice(0, 3);
    }

    // ==================== STAFF AUTO-RESOLUTION ====================

    /**
     * Calculate staff performance
     */
    calculateStaffPerformance() {
        const staffSkill = this.staff.skill || 50;
        const customerDifficulty = this.customer.personality.moodiness;
        const customerMood = this.customer.currentMood;
        const randomness = (Math.random() * 20) - 10; // ±10

        let performance = staffSkill;
        performance -= (customerDifficulty / 2); // Moody customers harder
        performance += ((customerMood - 50) / 5); // Mood affects interaction
        performance += randomness;

        // Staff-customer personality match
        if (this.staff.chattiness && this.customer.personality.chattiness) {
            const match = 100 - Math.abs(this.staff.chattiness - this.customer.personality.chattiness);
            performance += (match / 100) * 10; // Up to +10 for good match
        }

        return Math.max(20, Math.min(100, performance));
    }

    /**
     * Estimate interaction time
     */
    estimateInteractionTime() {
        if (!this.game.timeManager) {
            return 60; // Default 60 seconds
        }

        return this.game.timeManager.calculateInteractionTime({
            customer: this.customer,
            staff: this.staff,
            itemCount: 1,
            includesSmallTalk: Math.random() > 0.5,
            complexity: 1.0
        });
    }

    // ==================== UI METHODS ====================

    /**
     * Show interaction UI overlay
     */
    showInteractionUI() {
        const overlay = document.createElement('div');
        overlay.id = 'customer-interaction-overlay';
        overlay.className = 'interaction-overlay';
        overlay.innerHTML = `
            <div class="interaction-container">
                <div class="interaction-header">
                    <div class="customer-info">
                        <div class="customer-avatar">👤</div>
                        <div>
                            <div class="customer-name-large">${this.customer.name}</div>
                            <div class="customer-meta">${this.customer.segment} · ${this.customer.ageGroup}</div>
                        </div>
                    </div>
                    <div class="mood-display">
                        <div class="mood-label">Mood</div>
                        <div class="mood-value">${this.getMoodEmoji(this.customerMood)} ${Math.round(this.customerMood)}</div>
                    </div>
                </div>
                
                <div class="interaction-content" id="interaction-content">
                    <!-- Dynamic content goes here -->
                </div>
                
                <div class="interaction-footer">
                    <div class="small-talk-timer">💬 ${this.smallTalkDuration}s</div>
                    <div class="interaction-phase">Phase: <span id="phase-display">${this.phase}</span></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    /**
     * Show dialogue with options
     */
    showDialogue(customerText, options, prompt) {
        const content = document.getElementById('interaction-content');
        if (!content) return;

        content.innerHTML = `
            <div class="dialogue-section">
                <div class="dialogue-bubble customer-bubble">
                    <div class="bubble-text">${customerText}</div>
                </div>
                
                <div class="dialogue-prompt">${prompt}</div>
                
                <div class="dialogue-options">
                    ${options.map((opt, index) => `
                        <button class="dialogue-option" data-index="${index}">
                            ${opt.icon || '💬'} ${opt.text || opt.topic}
                            ${opt.duration ? `<span class="duration-badge">${opt.duration}s</span>` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        content.querySelectorAll('.dialogue-option').forEach((btn, index) => {
            btn.addEventListener('click', () => this.handleDialogueChoice(options[index]));
        });
    }

    /**
     * Handle dialogue choice
     */
    handleDialogueChoice(option) {
        if (option.action) {
            option.action();
        } else if (option.topic) {
            this.handleSmallTalk(option);
        } else if (this.phase === 'greeting') {
            // After greeting, move to small talk or ordering
            this.customerMood += option.moodEffect || 0;
            this.startPhase('smalltalk');
        } else if (this.phase === 'closing') {
            this.completeInteraction();
        }
    }

    /**
     * Show ordering UI
     */
    showOrderingUI(items, favorites) {
        const content = document.getElementById('interaction-content');
        if (!content) return;

        content.innerHTML = `
            <div class="ordering-section">
                <h3>What would you like?</h3>
                
                ${favorites.length > 0 ? `
                    <div class="favorites-section">
                        <h4>⭐ Favorites</h4>
                        ${favorites.map(fav => this.createItemCard(items.find(i => i.key === fav.item))).join('')}
                    </div>
                ` : ''}
                
                <div class="items-grid">
                    ${items.filter(i => !favorites.some(f => f.item === i.key)).map(item => this.createItemCard(item)).join('')}
                </div>
                
                <button class="btn-done-ordering">Done Ordering</button>
            </div>
        `;

        // Add event listeners
        content.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', () => {
                const itemKey = card.dataset.itemKey;
                this.handleOrderItem(itemKey);
            });
        });

        content.querySelector('.btn-done-ordering')?.addEventListener('click', () => {
            this.startPhase('closing');
        });
    }

    /**
     * Create item card HTML
     */
    createItemCard(item) {
        if (!item) return '';

        return `
            <div class="item-card ${item.available ? '' : 'unavailable'}" data-item-key="${item.key}">
                <div class="item-icon">${item.icon || '🥐'}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">$${item.retailPrice}</div>
                ${!item.available ? '<div class="unavailable-badge">Not Available</div>' : ''}
                ${item.isFavorite ? '<div class="favorite-badge">⭐</div>' : ''}
            </div>
        `;
    }

    /**
     * Complete interaction and return results
     */
    completeInteraction() {
        this.totalTime = (Date.now() - this.startTime) / 1000;

        const result = {
            success: true,
            customer: this.customer,
            orderedItems: this.orderedItems,
            smallTalkScore: this.smallTalkScore,
            smallTalkDuration: this.smallTalkDuration,
            moodChange: this.customerMood - this.initialMood,
            totalTime: this.totalTime,
            conversation: this.conversation,
            revenue: this.calculateRevenue(),
            satisfactionBonus: this.calculateSatisfactionBonus()
        };

        console.log('✅ Interaction complete:', result);

        // Remove UI
        const overlay = document.getElementById('customer-interaction-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Resolve promise
        if (this.resolveInteraction) {
            this.resolveInteraction(result);
        }

        return result;
    }

    // ==================== HELPER METHODS ====================

    getMoodEmoji(mood) {
        if (mood >= 80) return '😄';
        if (mood >= 60) return '😊';
        if (mood >= 40) return '😐';
        if (mood >= 20) return '😕';
        return '😞';
    }

    getCustomerGreeting() {
        const greetings = [
            "Hello!",
            "Good morning!",
            "Hi there!",
            "Hey!"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    getCustomerSmallTalkPrompt() {
        if (this.customer.personality.chattiness > 70) {
            return "So, how have you been?";
        } else if (this.customer.personality.chattiness < 30) {
            return "*looks around quietly*";
        }
        return "*waits patiently*";
    }

    getCustomerClosing() {
        return "Thank you so much!";
    }

    generateClosingOptions() {
        return [
            {
                text: "You're very welcome! Have a great day!",
                moodEffect: 5,
                icon: '😊'
            },
            {
                text: "Come back soon!",
                moodEffect: 3,
                loyaltyBonus: 2,
                icon: '👋'
            }
        ];
    }

    calculateRevenue() {
        return this.orderedItems.reduce((sum, itemKey) => {
            const recipe = GAME_CONFIG.RECIPES[itemKey];
            return sum + (recipe ? recipe.retailPrice : 0);
        }, 0);
    }

    calculateSatisfactionBonus() {
        let bonus = 0;

        // Small talk bonus
        bonus += (this.smallTalkScore / 100) * 5; // Up to +5

        // Mood improvement bonus
        const moodChange = this.customerMood - this.initialMood;
        bonus += moodChange / 10; // +1 per 10 mood points

        return Math.max(-10, Math.min(10, bonus));
    }

    showCustomerResponse(option) {
        // This would show animated customer response in UI
        console.log(`Customer reacts to ${option.topic}: mood ${this.customerMood}`);
    }

    showSmallTalkContinuePrompt() {
        // Show UI to continue talking or move to ordering
        // Simplified for now
        setTimeout(() => this.startPhase('ordering'), 1000);
    }

    showItemAddedConfirmation(itemKey) {
        console.log(`Added ${itemKey} to order`);
    }

    showContinueOrderingPrompt() {
        // Update UI to show current order and ask if want more
        console.log('Current order:', this.orderedItems);
    }

    showAlternatives(alternatives) {
        console.log('Suggesting alternatives:', alternatives);
        this.startPhase('ordering');
    }

    startBaking() {
        console.log('Starting to bake:', this.requestedItem);
        // Would integrate with baking system
        this.startPhase('ordering');
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.CustomerInteractionScene = CustomerInteractionScene;
}
