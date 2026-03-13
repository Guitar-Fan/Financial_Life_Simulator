/**
 * TimeManager.js - Hybrid time system (realtime + calculated blocks)
 * Handles both flowing time and discrete interaction time blocks
 */

class TimeManager {
    constructor(gameController) {
        this.game = gameController;
        this.mode = 'realtime'; // 'realtime' | 'calculated' | 'paused'

        // Time tracking
        this.currentTime = 0; // Seconds elapsed in current day
        this.dayStartTime = 8 * 3600; // 8 AM in seconds
        this.dayEndTime = 18 * 3600; // 6 PM in seconds
        this.gameSpeed = 1.0; // Speed multiplier (1x, 2x, 4x)
        this.isPaused = false;

        // Interaction tracking
        this.activeInteraction = null;
        this.interactionStartTime = 0;
        this.interactionEstimatedDuration = 0;

        // Callbacks for time events
        this.timeCallbacks = [];
        this.hourCallbacks = new Map(); // Hour -> [callbacks]

        // Time display
        this.lastUpdateTime = Date.now();
        this.deltaAccumulator = 0;

        console.log('⏰ TimeManager initialized');
    }

    // ==================== CORE TIME MANAGEMENT ====================

    /**
     * Update time in realtime mode
     */
    update(deltaMs) {
        if (this.isPaused || this.mode !== 'realtime') {
            return;
        }

        // Convert to game time with speed multiplier
        const gameTimeDelta = (deltaMs / 1000) * this.gameSpeed;
        this.currentTime += gameTimeDelta;

        // Check for hour changes
        this.checkHourCallbacks();

        // Check time callbacks
        this.checkTimeCallbacks();

        // Update UI
        this.updateTimeDisplay();

        // Check if day ended
        if (this.currentTime >= this.dayEndTime) {
            this.onDayEnd();
        }
    }

    /**
     * Start a calculated time block (for interactions)
     */
    startCalculatedBlock(interaction) {
        console.log('🕐 Starting calculated time block:', interaction);

        this.mode = 'calculated';
        this.activeInteraction = interaction;
        this.interactionStartTime = this.currentTime;

        // Calculate how long this interaction will take
        const estimatedTime = this.calculateInteractionTime(interaction);
        this.interactionEstimatedDuration = estimatedTime;

        // Emit event
        if (this.game.engine && this.game.engine.emit) {
            this.game.engine.emit('interaction_started', {
                interaction: interaction,
                duration: estimatedTime,
                startTime: this.currentTime
            });
        }

        return estimatedTime;
    }

    /**
     * End calculated time block
     */
    endCalculatedBlock(actualDuration = null) {
        if (this.mode !== 'calculated') {
            console.warn('Not in calculated mode');
            return;
        }

        const duration = actualDuration || this.interactionEstimatedDuration;
        this.currentTime += duration;

        console.log(`✅ Interaction complete. Time advanced ${duration.toFixed(1)}s`);

        // Emit event
        if (this.game.engine && this.game.engine.emit) {
            this.game.engine.emit('interaction_ended', {
                interaction: this.activeInteraction,
                duration: duration,
                endTime: this.currentTime
            });
        }

        this.activeInteraction = null;
        this.interactionStartTime = 0;
        this.interactionEstimatedDuration = 0;
        this.mode = 'realtime';

        this.updateTimeDisplay();
    }

    /**
     * Calculate estimated interaction time based on various factors
     */
    calculateInteractionTime(interaction) {
        let baseTime = 60; // 60 seconds base

        // Customer personality affects time
        if (interaction.customer && interaction.customer.personality) {
            const chattiness = interaction.customer.personality.chattiness;
            const patience = interaction.customer.personality.patience;

            // Chatty customers take longer
            baseTime += (chattiness / 100) * 30; // Up to +30 seconds

            // Impatient customers want it faster (if we could accommodate)
            baseTime -= Math.max(0, (100 - patience) / 100) * 10; // Up to -10 seconds
        }

        // Staff skill affects time
        if (interaction.staff) {
            const staffSpeed = interaction.staff.speed || 50;
            const speedModifier = (100 - staffSpeed) / 100; // Higher speed = less time
            baseTime *= (1 - speedModifier * 0.3); // Up to 30% faster
        }

        // Number of items
        if (interaction.itemCount) {
            baseTime += (interaction.itemCount - 1) * 15; // +15s per additional item
        }

        // Small talk time (if included)
        if (interaction.includesSmallTalk) {
            const smallTalkTime = this.calculateSmallTalkTime(interaction);
            baseTime += smallTalkTime;
        }

        // Wait time for items to be made
        if (interaction.waitTime) {
            baseTime += interaction.waitTime;
        }

        // Complexity adjustment
        if (interaction.complexity) {
            baseTime *= interaction.complexity; // 0.5 = simple, 1.5 = complex
        }

        // Never less than 20 seconds, never more than 10 minutes
        return Math.max(20, Math.min(600, baseTime));
    }

    /**
     * Calculate optimal small talk time based on customer personality
     */
    calculateSmallTalkTime(interaction) {
        const customer = interaction.customer;
        if (!customer || !customer.personality) {
            return 15; // Default 15 seconds
        }

        const customerChattiness = customer.personality.chattiness;
        const ownerEngagement = interaction.ownerEngagement || 50;

        // Match between customer and owner
        const match = 100 - Math.abs(customerChattiness - ownerEngagement);

        // Optimal time based on customer's chattiness
        const optimalTime = (customerChattiness / 100) * 60; // 0-60 seconds

        // If mismatch, either too short or too long feels awkward
        const timeAdjustment = (match / 100) * 0.5;

        return optimalTime * (0.5 + timeAdjustment);
    }

    // ==================== TIME CONTROL ====================

    /**
     * Set game speed multiplier
     */
    setSpeed(speed) {
        const validSpeeds = [1, 2, 4];
        if (!validSpeeds.includes(speed)) {
            console.warn('Invalid speed. Use 1, 2, or 4');
            return;
        }

        this.gameSpeed = speed;
        console.log(`⏰ Game speed set to ${speed}x`);

        // Update UI
        this.updateSpeedDisplay();
    }

    /**
     * Pause time
     */
    pause() {
        this.isPaused = true;
        console.log('⏸️ Time paused');
    }

    /**
     * Resume time
     */
    resume() {
        this.isPaused = false;
        this.lastUpdateTime = Date.now();
        console.log('▶️ Time resumed');
    }

    /**
     * Toggle pause
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * Skip time forward (for testing or fast-forward)
     */
    skipTime(seconds) {
        if (this.mode === 'calculated') {
            console.warn('Cannot skip time during interaction');
            return;
        }

        this.currentTime += seconds;
        console.log(`⏩ Skipped ${seconds} seconds`);
        this.updateTimeDisplay();
    }

    // ==================== TIME CALLBACKS ====================

    /**
     * Register callback for specific time
     */
    registerTimeCallback(targetTime, callback, once = true) {
        this.timeCallbacks.push({
            targetTime: targetTime,
            callback: callback,
            once: once,
            triggered: false
        });
    }

    /**
     * Register callback for hour change
     */
    registerHourCallback(hour, callback) {
        if (!this.hourCallbacks.has(hour)) {
            this.hourCallbacks.set(hour, []);
        }
        this.hourCallbacks.get(hour).push(callback);
    }

    /**
     * Check and trigger time callbacks
     */
    checkTimeCallbacks() {
        this.timeCallbacks.forEach(tcb => {
            if (!tcb.triggered && this.currentTime >= tcb.targetTime) {
                tcb.callback(this.currentTime);
                tcb.triggered = true;
            }
        });

        // Remove one-time callbacks that have been triggered
        this.timeCallbacks = this.timeCallbacks.filter(tcb => !tcb.once || !tcb.triggered);
    }

    /**
     * Check for hour changes and trigger callbacks
     */
    checkHourCallbacks() {
        const currentHour = Math.floor(this.currentTime / 3600);
        const lastHour = Math.floor((this.currentTime - 1) / 3600);

        if (currentHour !== lastHour && this.hourCallbacks.has(currentHour)) {
            const callbacks = this.hourCallbacks.get(currentHour);
            callbacks.forEach(cb => cb(currentHour));
        }
    }

    // ==================== TIME UTILITIES ====================

    /**
     * Get current time as clock string (e.g., "2:30 PM")
     */
    getClockTime() {
        const totalSeconds = Math.floor(this.currentTime);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        let displayHour = hours % 12;
        if (displayHour === 0) displayHour = 12;
        const period = hours < 12 ? 'AM' : 'PM';

        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    /**
     * Get current time in 24-hour format
     */
    get24HourTime() {
        const totalSeconds = Math.floor(this.currentTime);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Get time remaining in day (seconds)
     */
    getTimeRemainingInDay() {
        return Math.max(0, this.dayEndTime - this.currentTime);
    }

    /**
     * Get time remaining in day as formatted string
     */
    getTimeRemainingFormatted() {
        const remaining = this.getTimeRemainingInDay();
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    /**
     * Get percentage of day completed
     */
    getDayProgress() {
        const dayLength = this.dayEndTime - this.dayStartTime;
        const elapsed = this.currentTime - this.dayStartTime;
        return Math.max(0, Math.min(100, (elapsed / dayLength) * 100));
    }

    /**
     * Format duration in seconds to readable string
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    }

    // ==================== DAY MANAGEMENT ====================

    /**
     * Start a new day
     */
    startDay() {
        this.currentTime = this.dayStartTime;
        this.mode = 'realtime';
        this.isPaused = false;
        this.gameSpeed = 1.0;
        this.activeInteraction = null;
        this.timeCallbacks = [];

        console.log(`🌅 Day started at ${this.getClockTime()}`);
        this.updateTimeDisplay();
    }

    /**
     * End day event
     */
    onDayEnd() {
        console.log(`🌙 Day ended at ${this.getClockTime()}`);
        this.pause();

        // Emit day end event
        if (this.game.engine && this.game.engine.emit) {
            this.game.engine.emit('day_ended', {
                endTime: this.currentTime,
                totalTime: this.currentTime - this.dayStartTime
            });
        }
    }

    // ==================== UI UPDATES ====================

    /**
     * Update time display in UI
     */
    updateTimeDisplay() {
        const clockElement = document.getElementById('game-clock');
        if (clockElement) {
            clockElement.textContent = this.getClockTime();
        }

        const progressElement = document.getElementById('day-progress-bar');
        if (progressElement) {
            progressElement.style.width = `${this.getDayProgress()}%`;
        }

        const modeIndicator = document.getElementById('time-mode-indicator');
        if (modeIndicator) {
            if (this.mode === 'calculated') {
                modeIndicator.textContent = '🤝 In Interaction';
                modeIndicator.style.display = 'block';
            } else {
                modeIndicator.style.display = 'none';
            }
        }

        // Update interaction timer if active
        if (this.activeInteraction) {
            const timerElement = document.getElementById('interaction-timer');
            if (timerElement) {
                const elapsed = this.currentTime - this.interactionStartTime;
                const remaining = Math.max(0, this.interactionEstimatedDuration - elapsed);
                timerElement.textContent = `⏱️ ${this.formatDuration(remaining)} remaining`;
            }
        }
    }

    /**
     * Update speed display
     */
    updateSpeedDisplay() {
        const speedElement = document.getElementById('game-speed');
        if (speedElement) {
            speedElement.textContent = `${this.gameSpeed}x`;
        }

        // Update speed buttons
        [1, 2, 4].forEach(speed => {
            const btn = document.getElementById(`speed-${speed}x`);
            if (btn) {
                if (speed === this.gameSpeed) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    // ==================== STATE MANAGEMENT ====================

    /**
     * Get current state for saving
     */
    getState() {
        return {
            currentTime: this.currentTime,
            mode: this.mode,
            gameSpeed: this.gameSpeed,
            isPaused: this.isPaused,
            activeInteraction: this.activeInteraction
        };
    }

    /**
     * Restore state from save
     */
    setState(state) {
        if (!state) return;

        this.currentTime = state.currentTime || this.dayStartTime;
        this.mode = state.mode || 'realtime';
        this.gameSpeed = state.gameSpeed || 1.0;
        this.isPaused = state.isPaused || false;
        this.activeInteraction = state.activeInteraction || null;

        this.updateTimeDisplay();
        this.updateSpeedDisplay();
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.TimeManager = TimeManager;
}
