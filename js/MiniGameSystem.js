/**
 * MiniGameSystem.js — Subtle interactive minigames embedded in bakery gameplay.
 *
 * Instead of just clicking buttons, certain actions trigger small skill-based
 * or luck-based interactions that affect outcomes.  Each mini-game is
 * optional — the player can skip/auto-resolve — but engaging with them
 * yields better results, teaching real business concepts through play.
 *
 * Mini-games:
 *  1. Haggle Wheel       – Spin a wheel when negotiating vendor prices
 *  2. Quality Dice       – Roll dice during baking for quality variance
 *  3. Customer Mood Ring – Read a customer's mood to choose the best response
 *  4. Rush Hour Catch    – Quick-time game during peak selling
 *  5. Inspection Checklist – Timed memory game for health inspections
 *  6. Recipe Experiment  – Ingredient combination guessing game
 *  7. Morning Forecast Bet – Bet on the day's customer traffic
 */

class MiniGameSystem {
    constructor(gameController) {
        this.game = gameController;
        this.results = [];           // history of mini-game outcomes
        this.gamesPlayed = 0;
        this.streakWins = 0;
        this.enabled = true;         // player can toggle off in settings

        console.log('🎮 MiniGameSystem initialised');
    }

    /* ================================================================== */
    /*  1. HAGGLE WHEEL  –  Spin-the-wheel for vendor discounts            */
    /*  Triggered: buying phase, optional per purchase                      */
    /*  Teaches: negotiation, risk vs reward, vendor relationships          */
    /* ================================================================== */

    showHaggleWheel(ingredientName, basePrice, vendorName = 'vendor') {
        return new Promise((resolve) => {
            const overlay = this._createOverlay();

            // Wheel segments (angle, label, multiplier, color)
            const segments = [
                { label: '25% OFF',  mult: 0.75, color: '#4caf50', weight: 8  },
                { label: '15% OFF',  mult: 0.85, color: '#66bb6a', weight: 15 },
                { label: '10% OFF',  mult: 0.90, color: '#81c784', weight: 20 },
                { label: '5% OFF',   mult: 0.95, color: '#a5d6a7', weight: 25 },
                { label: 'NO DEAL',  mult: 1.00, color: '#ffb74d', weight: 18 },
                { label: '5% EXTRA', mult: 1.05, color: '#ef5350', weight: 10 },
                { label: 'JACKPOT!', mult: 0.60, color: '#ffd700', weight: 4  },
            ];

            const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);
            const segCount = segments.length;
            const segAngle = 360 / segCount;

            overlay.innerHTML = `
                <div class="minigame-container" style="
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    border-radius: 20px; padding: 30px; max-width: 420px; width: 90%;
                    text-align: center; color: #f0e6d3;
                    box-shadow: 0 0 50px rgba(255,215,0,0.2);
                    border: 2px solid rgba(255,215,0,0.3);
                ">
                    <h3 style="margin:0 0 6px;">🤝 Haggle with ${vendorName}</h3>
                    <p style="opacity:0.7; margin:0 0 16px; font-size:14px;">
                        Spin the wheel to negotiate a price for <strong>${ingredientName}</strong>!
                    </p>

                    <div style="position:relative; width:260px; height:260px; margin:0 auto 20px;">
                        <!-- Pointer -->
                        <div style="position:absolute; top:-10px; left:50%; transform:translateX(-50%);
                            width:0; height:0; border-left:12px solid transparent; border-right:12px solid transparent;
                            border-top:22px solid #ffd700; z-index:10; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));"></div>

                        <canvas id="haggle-canvas" width="260" height="260"
                            style="border-radius:50%; cursor:pointer;"></canvas>
                    </div>

                    <button id="haggle-spin" style="
                        background: linear-gradient(135deg, #ffd700, #ff8f00); border:none;
                        color: #1a1a2e; font-weight:700; font-size:18px;
                        padding: 12px 36px; border-radius: 30px; cursor:pointer;
                        box-shadow: 0 4px 15px rgba(255,215,0,0.4);
                        transition: transform 0.2s;
                    ">🎰 SPIN!</button>

                    <button id="haggle-skip" style="
                        display:block; margin:12px auto 0; background:none; border:none;
                        color:rgba(255,255,255,0.4); cursor:pointer; font-size:13px;
                    ">Skip (pay full price)</button>

                    <div id="haggle-result" style="display:none; margin-top:16px;"></div>
                </div>
            `;

            const canvas = overlay.querySelector('#haggle-canvas');
            const ctx = canvas.getContext('2d');
            let rotation = 0;
            let spinning = false;

            // Draw wheel
            const drawWheel = (rot) => {
                ctx.clearRect(0, 0, 260, 260);
                const cx = 130, cy = 130, r = 120;

                segments.forEach((seg, i) => {
                    const start = (i * segAngle - 90 + rot) * Math.PI / 180;
                    const end = ((i + 1) * segAngle - 90 + rot) * Math.PI / 180;

                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, r, start, end);
                    ctx.fillStyle = seg.color;
                    ctx.fill();
                    ctx.strokeStyle = '#1a1a2e';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Label
                    const mid = (start + end) / 2;
                    ctx.save();
                    ctx.translate(cx + Math.cos(mid) * (r * 0.65), cy + Math.sin(mid) * (r * 0.65));
                    ctx.rotate(mid + Math.PI / 2);
                    ctx.fillStyle = '#1a1a2e';
                    ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(seg.label, 0, 0);
                    ctx.restore();
                });

                // Center circle
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fillStyle = '#1a1a2e';
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.stroke();
            };

            drawWheel(0);

            // Determine result by weighted random
            const pickResult = () => {
                let roll = Math.random() * totalWeight;
                for (let i = 0; i < segments.length; i++) {
                    roll -= segments[i].weight;
                    if (roll <= 0) return i;
                }
                return 0;
            };

            // Spin animation
            const spinBtn = overlay.querySelector('#haggle-spin');
            const skipBtn = overlay.querySelector('#haggle-skip');
            const resultDiv = overlay.querySelector('#haggle-result');

            const doSpin = () => {
                if (spinning) return;
                spinning = true;
                spinBtn.disabled = true;
                skipBtn.style.display = 'none';

                const winIndex = pickResult();
                // Target angle: put winning segment at top (pointer at 0°/top)
                const targetSegCenter = winIndex * segAngle + segAngle / 2;
                // Spin multiple full rotations + land at target
                const totalSpin = 1440 + (360 - targetSegCenter); // 4 full rotations + offset
                const duration = 3000 + Math.random() * 1000;
                const startTime = performance.now();
                const startRot = rotation;

                const animate = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(1, elapsed / duration);
                    // Ease out cubic
                    const ease = 1 - Math.pow(1 - progress, 3);
                    rotation = startRot + totalSpin * ease;
                    drawWheel(rotation % 360);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        // Show result
                        const seg = segments[winIndex];
                        const finalPrice = basePrice * seg.mult;
                        const saved = basePrice - finalPrice;

                        let sentiment = '😐';
                        if (seg.mult <= 0.80) sentiment = '🎉';
                        else if (seg.mult <= 0.90) sentiment = '😄';
                        else if (seg.mult <= 0.95) sentiment = '🙂';
                        else if (seg.mult > 1) sentiment = '😬';

                        resultDiv.style.display = 'block';
                        resultDiv.innerHTML = `
                            <div style="font-size:28px; margin-bottom:8px;">${sentiment}</div>
                            <div style="font-size:18px; font-weight:700; color:${seg.color};">${seg.label}</div>
                            <div style="margin-top:8px; opacity:0.8;">
                                Price: $${basePrice.toFixed(2)} → <strong>$${finalPrice.toFixed(2)}</strong>
                                ${saved > 0 ? `<span style="color:#4caf50;"> (saved $${saved.toFixed(2)})</span>` : ''}
                            </div>
                            <button id="haggle-accept" style="
                                margin-top:16px; background:#4caf50; border:none; color:white;
                                padding:10px 28px; border-radius:20px; cursor:pointer; font-weight:600;
                            ">Accept Deal</button>
                        `;

                        overlay.querySelector('#haggle-accept').onclick = () => {
                            this._recordResult('haggle', seg.mult <= 1 ? 'win' : 'loss');
                            overlay.remove();
                            resolve({ multiplier: seg.mult, label: seg.label });
                        };
                    }
                };
                requestAnimationFrame(animate);
            };

            spinBtn.onclick = doSpin;
            skipBtn.onclick = () => {
                overlay.remove();
                resolve({ multiplier: 1.0, label: 'Skipped' });
            };
        });
    }

    /* ================================================================== */
    /*  2. QUALITY DICE  –  Roll for baking quality variance               */
    /*  Triggered: when products finish baking                              */
    /*  Teaches: quality control, consistency, skill development            */
    /* ================================================================== */

    showQualityDice(recipeName, baseQuality = 85, staffSkill = 50) {
        return new Promise((resolve) => {
            const overlay = this._createOverlay();

            // Number of dice based on staff skill (more dice = more consistent)
            const diceCount = staffSkill >= 80 ? 3 : staffSkill >= 50 ? 2 : 1;
            const diceValues = [];
            let rolling = false;

            overlay.innerHTML = `
                <div class="minigame-container" style="
                    background: linear-gradient(135deg, #2d1b4e, #1a1a2e);
                    border-radius: 20px; padding: 30px; max-width: 400px; width: 90%;
                    text-align: center; color: #f0e6d3;
                    box-shadow: 0 0 50px rgba(138,43,226,0.3);
                    border: 2px solid rgba(138,43,226,0.3);
                ">
                    <h3 style="margin:0 0 6px;">🎲 Quality Check: ${recipeName}</h3>
                    <p style="opacity:0.7; margin:0 0 8px; font-size:13px;">
                        Roll ${diceCount > 1 ? diceCount + ' dice' : '1 die'} — higher is better!
                        ${diceCount > 1 ? '<br>Skilled staff = more dice = more consistent results.' : ''}
                    </p>
                    <p style="opacity:0.5; font-size:12px; margin:0 0 16px;">
                        Base quality: ${baseQuality}% | Staff skill bonus: ${diceCount > 1 ? 'Best of ' + diceCount : 'Single roll'}
                    </p>

                    <div id="dice-area" style="
                        display: flex; justify-content: center; gap: 16px;
                        margin-bottom: 20px; min-height: 80px; align-items: center;
                    ">
                        ${Array(diceCount).fill(0).map((_, i) => `
                            <div class="die-container" id="die-${i}" style="
                                width:70px; height:70px; background:#fff; border-radius:12px;
                                display:flex; align-items:center; justify-content:center;
                                font-size:36px; color:#1a1a2e; font-weight:bold;
                                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                                transition: transform 0.3s;
                            ">?</div>
                        `).join('')}
                    </div>

                    <button id="dice-roll" style="
                        background: linear-gradient(135deg, #9c27b0, #7b1fa2); border:none;
                        color: white; font-weight:700; font-size:18px;
                        padding: 12px 36px; border-radius: 30px; cursor:pointer;
                        box-shadow: 0 4px 15px rgba(156,39,176,0.4);
                    ">🎲 ROLL!</button>

                    <button id="dice-skip" style="
                        display:block; margin:12px auto 0; background:none; border:none;
                        color:rgba(255,255,255,0.4); cursor:pointer; font-size:13px;
                    ">Skip (average quality)</button>

                    <div id="dice-result" style="display:none; margin-top:16px;"></div>
                </div>
            `;

            const rollBtn = overlay.querySelector('#dice-roll');
            const skipBtn = overlay.querySelector('#dice-skip');
            const resultDiv = overlay.querySelector('#dice-result');

            const doRoll = () => {
                if (rolling) return;
                rolling = true;
                rollBtn.disabled = true;
                skipBtn.style.display = 'none';

                // Animate dice
                const animDuration = 1200;
                const startTime = performance.now();
                const finalValues = Array(diceCount).fill(0).map(() => 1 + Math.floor(Math.random() * 6));

                const animateDice = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(1, elapsed / animDuration);

                    for (let i = 0; i < diceCount; i++) {
                        const die = overlay.querySelector(`#die-${i}`);
                        if (!die) continue;

                        if (progress < 0.8) {
                            // Show random faces during roll
                            const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                            die.textContent = faces[Math.floor(Math.random() * 6)];
                            die.style.transform = `rotate(${Math.random() * 30 - 15}deg) scale(${0.9 + Math.random() * 0.2})`;
                        } else {
                            // Settle on final value
                            const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                            die.textContent = faces[finalValues[i] - 1];
                            die.style.transform = 'rotate(0deg) scale(1)';
                        }
                    }

                    if (progress < 1) {
                        requestAnimationFrame(animateDice);
                    } else {
                        // Calculate quality
                        const bestRoll = Math.max(...finalValues);
                        // Quality bonus: -10 to +15 based on roll (1-6)
                        const qualityBonus = Math.round((bestRoll - 3.5) * 5);
                        const finalQuality = Math.max(30, Math.min(100, baseQuality + qualityBonus));

                        let stars = '';
                        if (bestRoll >= 6) stars = '⭐⭐⭐ Perfect!';
                        else if (bestRoll >= 5) stars = '⭐⭐ Great!';
                        else if (bestRoll >= 4) stars = '⭐ Good';
                        else if (bestRoll >= 3) stars = '😐 Average';
                        else stars = '😬 Below average';

                        resultDiv.style.display = 'block';
                        resultDiv.innerHTML = `
                            <div style="font-size:20px; font-weight:700; margin-bottom:6px;">${stars}</div>
                            <div style="opacity:0.8;">
                                Quality: ${baseQuality}% → <strong style="color:${finalQuality >= baseQuality ? '#4caf50' : '#ef5350'};">${finalQuality}%</strong>
                            </div>
                            <button id="dice-accept" style="
                                margin-top:14px; background:#9c27b0; border:none; color:white;
                                padding:10px 28px; border-radius:20px; cursor:pointer; font-weight:600;
                            ">Continue Baking</button>
                        `;

                        overlay.querySelector('#dice-accept').onclick = () => {
                            this._recordResult('quality_dice', bestRoll >= 4 ? 'win' : 'loss');
                            overlay.remove();
                            resolve({ quality: finalQuality, roll: bestRoll, bonus: qualityBonus });
                        };
                    }
                };
                requestAnimationFrame(animateDice);
            };

            rollBtn.onclick = doRoll;
            skipBtn.onclick = () => {
                overlay.remove();
                resolve({ quality: baseQuality, roll: 3, bonus: 0 });
            };
        });
    }

    /* ================================================================== */
    /*  3. CUSTOMER MOOD RING — Read customer mood for interaction bonus   */
    /*  Triggered: during customer interaction selling phase                */
    /*  Teaches: emotional intelligence, customer service                   */
    /* ================================================================== */

    showMoodRing(customerName, customerMood = 'neutral') {
        return new Promise((resolve) => {
            const overlay = this._createOverlay();

            const moods = [
                { id: 'happy',    emoji: '😊', color: '#4caf50', hint: 'Bright expression' },
                { id: 'neutral',  emoji: '😐', color: '#ffb74d', hint: 'Calm demeanor' },
                { id: 'rushed',   emoji: '😤', color: '#ff7043', hint: 'Tapping foot' },
                { id: 'curious',  emoji: '🤔', color: '#42a5f5', hint: 'Looking around' },
                { id: 'grumpy',   emoji: '😠', color: '#ef5350', hint: 'Arms crossed' },
                { id: 'excited',  emoji: '🤩', color: '#ab47bc', hint: 'Wide eyes' },
            ];

            const correctMood = moods.find(m => m.id === customerMood) || moods[1];

            // Show subtle body-language clues
            const clues = {
                happy: ['smiling warmly', 'making eye contact', 'seems relaxed'],
                neutral: ['waiting patiently', 'browsing the display', 'looking at prices'],
                rushed: ['checking their watch', 'shifting weight', 'brief eye contact'],
                curious: ['studying the menu', 'asking about ingredients', 'looking at other customers\' orders'],
                grumpy: ['avoiding eye contact', 'standing stiffly', 'sighing quietly'],
                excited: ['pointing at products', 'taking photos', 'chatting to a friend']
            };

            const clueList = clues[customerMood] || clues.neutral;

            overlay.innerHTML = `
                <div class="minigame-container" style="
                    background: linear-gradient(135deg, #1a2e1a, #1a1a2e);
                    border-radius: 20px; padding: 30px; max-width: 440px; width: 90%;
                    text-align: center; color: #f0e6d3;
                    box-shadow: 0 0 50px rgba(76,175,80,0.2);
                    border: 2px solid rgba(76,175,80,0.3);
                ">
                    <h3 style="margin:0 0 6px;">👤 Read the Customer</h3>
                    <p style="opacity:0.7; margin:0 0 16px; font-size:14px;">
                        <strong>${customerName}</strong> walks in. Read their body language and pick the right mood
                        to choose the best service approach!
                    </p>

                    <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:14px; margin-bottom:18px;">
                        <div style="font-size:13px; opacity:0.6; margin-bottom:6px;">Body language clues:</div>
                        ${clueList.map(c => `<div style="margin:4px 0;">👁️ ${c}</div>`).join('')}
                    </div>

                    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-bottom:12px;">
                        ${moods.map(m => `
                            <button class="mood-choice" data-mood="${m.id}" style="
                                background: rgba(255,255,255,0.08); border: 2px solid transparent;
                                padding: 10px 14px; border-radius: 12px; cursor: pointer;
                                color: #f0e6d3; font-size: 14px; transition: all 0.2s;
                                display: flex; align-items: center; gap: 6px;
                            " onmouseover="this.style.borderColor='${m.color}'"
                               onmouseout="this.style.borderColor='transparent'">
                                <span style="font-size:22px;">${m.emoji}</span> ${m.hint}
                            </button>
                        `).join('')}
                    </div>

                    <button id="mood-skip" style="
                        background:none; border:none; color:rgba(255,255,255,0.3);
                        cursor:pointer; font-size:13px;
                    ">Skip (standard greeting)</button>

                    <div id="mood-result" style="display:none; margin-top:16px;"></div>
                </div>
            `;

            const resultDiv = overlay.querySelector('#mood-result');

            overlay.querySelectorAll('.mood-choice').forEach(btn => {
                btn.onclick = () => {
                    const chosen = btn.dataset.mood;
                    const isCorrect = chosen === customerMood;

                    // Highlight correct answer
                    overlay.querySelectorAll('.mood-choice').forEach(b => {
                        const m = moods.find(mood => mood.id === b.dataset.mood);
                        if (b.dataset.mood === customerMood) {
                            b.style.borderColor = '#4caf50';
                            b.style.background = 'rgba(76,175,80,0.2)';
                        } else if (b.dataset.mood === chosen && !isCorrect) {
                            b.style.borderColor = '#ef5350';
                            b.style.background = 'rgba(239,83,80,0.2)';
                        }
                        b.disabled = true;
                    });

                    // Bonus: correct = +15% satisfaction, wrong = -5%
                    const bonus = isCorrect ? 0.15 : -0.05;

                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = `
                        <div style="font-size:22px; margin-bottom:6px;">${isCorrect ? '✅ Spot on!' : '❌ Not quite…'}</div>
                        <div style="opacity:0.8; font-size:14px;">
                            ${isCorrect
                                ? 'Your greeting matched their mood perfectly! +15% satisfaction bonus.'
                                : `They were actually <strong>${correctMood.hint}</strong>. Service penalty: -5% satisfaction.`}
                        </div>
                        <button id="mood-continue" style="
                            margin-top:14px; background:#4caf50; border:none; color:white;
                            padding:10px 28px; border-radius:20px; cursor:pointer; font-weight:600;
                        ">Continue</button>
                    `;

                    overlay.querySelector('#mood-continue').onclick = () => {
                        this._recordResult('mood_ring', isCorrect ? 'win' : 'loss');
                        overlay.remove();
                        resolve({ correct: isCorrect, bonus, chosenMood: chosen });
                    };
                };
            });

            overlay.querySelector('#mood-skip').onclick = () => {
                overlay.remove();
                resolve({ correct: false, bonus: 0, chosenMood: 'skipped' });
            };
        });
    }

    /* ================================================================== */
    /*  4. RUSH HOUR CATCH — Quick-time event during peak selling hours    */
    /*  Triggered: when multiple customers queue during peak                */
    /*  Teaches: time management under pressure, prioritisation             */
    /* ================================================================== */

    showRushHourCatch(customerCount = 3) {
        return new Promise((resolve) => {
            const overlay = this._createOverlay();

            const orders = [];
            for (let i = 0; i < customerCount; i++) {
                const items = ['🍞', '🥐', '🍪', '🧁', '🎂'];
                orders.push({
                    id: i,
                    emoji: items[Math.floor(Math.random() * items.length)],
                    name: ['Bread', 'Croissant', 'Cookie', 'Muffin', 'Cake'][Math.floor(Math.random() * 5)],
                    served: false
                });
            }

            let score = 0;
            let timeLeft = 8 + customerCount * 2; // seconds
            let gameActive = true;

            overlay.innerHTML = `
                <div class="minigame-container" style="
                    background: linear-gradient(135deg, #2e1a1a, #1a1a2e);
                    border-radius: 20px; padding: 30px; max-width: 500px; width: 90%;
                    text-align: center; color: #f0e6d3;
                    box-shadow: 0 0 50px rgba(255,87,34,0.2);
                    border: 2px solid rgba(255,87,34,0.3);
                ">
                    <h3 style="margin:0 0 6px;">⚡ Rush Hour!</h3>
                    <p style="opacity:0.7; margin:0 0 12px; font-size:14px;">
                        ${customerCount} customers are waiting! Tap each order to serve them before time runs out!
                    </p>

                    <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
                        <div>Served: <strong id="rush-score">0</strong>/${customerCount}</div>
                        <div>Time: <strong id="rush-timer" style="color:#ff7043;">${timeLeft}s</strong></div>
                    </div>

                    <div id="rush-progress" style="
                        height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;
                        margin-bottom: 20px; overflow: hidden;
                    ">
                        <div id="rush-bar" style="
                            height: 100%; width: 100%; background: linear-gradient(90deg, #ff7043, #ffd700);
                            border-radius: 3px; transition: width 0.3s;
                        "></div>
                    </div>

                    <div id="rush-orders" style="
                        display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
                    ">
                        ${orders.map(o => `
                            <button class="rush-order" data-id="${o.id}" style="
                                width: 90px; height: 90px; background: rgba(255,255,255,0.1);
                                border: 2px solid rgba(255,255,255,0.2); border-radius: 14px;
                                cursor: pointer; display: flex; flex-direction: column;
                                align-items: center; justify-content: center; gap: 4px;
                                transition: all 0.2s; color: #f0e6d3;
                            ">
                                <span style="font-size:32px;">${o.emoji}</span>
                                <span style="font-size:11px; opacity:0.7;">${o.name}</span>
                            </button>
                        `).join('')}
                    </div>

                    <button id="rush-skip" style="
                        display:block; margin:16px auto 0; background:none; border:none;
                        color:rgba(255,255,255,0.3); cursor:pointer; font-size:13px;
                    ">Skip (auto-serve)</button>

                    <div id="rush-result" style="display:none; margin-top:16px;"></div>
                </div>
            `;

            const timerEl = overlay.querySelector('#rush-timer');
            const scoreEl = overlay.querySelector('#rush-score');
            const barEl = overlay.querySelector('#rush-bar');
            const resultDiv = overlay.querySelector('#rush-result');
            const initialTime = timeLeft;

            // Timer
            const timer = setInterval(() => {
                if (!gameActive) { clearInterval(timer); return; }
                timeLeft--;
                timerEl.textContent = `${timeLeft}s`;
                barEl.style.width = `${(timeLeft / initialTime) * 100}%`;

                if (timeLeft <= 3) timerEl.style.color = '#ef5350';

                if (timeLeft <= 0) {
                    gameActive = false;
                    clearInterval(timer);
                    showResult();
                }
            }, 1000);

            // Click handlers
            overlay.querySelectorAll('.rush-order').forEach(btn => {
                btn.onclick = () => {
                    if (!gameActive || btn.disabled) return;
                    btn.disabled = true;
                    btn.style.background = 'rgba(76,175,80,0.3)';
                    btn.style.borderColor = '#4caf50';
                    btn.style.transform = 'scale(0.9)';
                    score++;
                    scoreEl.textContent = score;

                    if (score >= customerCount) {
                        gameActive = false;
                        clearInterval(timer);
                        setTimeout(showResult, 300);
                    }
                };
            });

            const showResult = () => {
                overlay.querySelector('#rush-skip').style.display = 'none';
                const ratio = score / customerCount;
                const speedBonus = ratio >= 1 ? 1.15 : 1 + ratio * 0.1;

                let grade = '🌟 Perfect!';
                if (ratio < 1) grade = ratio >= 0.7 ? '😊 Good!' : ratio >= 0.4 ? '😐 OK' : '😰 Slow…';

                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `
                    <div style="font-size:24px; margin-bottom:6px;">${grade}</div>
                    <div style="opacity:0.8;">
                        Served ${score}/${customerCount} — Speed bonus: <strong>${((speedBonus - 1) * 100).toFixed(0)}%</strong> more revenue
                    </div>
                    <button id="rush-done" style="
                        margin-top:14px; background:#ff7043; border:none; color:white;
                        padding:10px 28px; border-radius:20px; cursor:pointer; font-weight:600;
                    ">Continue</button>
                `;

                overlay.querySelector('#rush-done').onclick = () => {
                    this._recordResult('rush_hour', ratio >= 0.7 ? 'win' : 'loss');
                    overlay.remove();
                    resolve({ served: score, total: customerCount, speedBonus });
                };
            };

            overlay.querySelector('#rush-skip').onclick = () => {
                gameActive = false;
                clearInterval(timer);
                overlay.remove();
                resolve({ served: customerCount, total: customerCount, speedBonus: 1.0 });
            };
        });
    }

    /* ================================================================== */
    /*  5. MORNING FORECAST BET — Predict today's customer volume          */
    /*  Triggered: start of selling phase                                   */
    /*  Teaches: demand forecasting, planning under uncertainty             */
    /* ================================================================== */

    showForecastBet(actualDemandLevel, weatherToday) {
        return new Promise((resolve) => {
            const overlay = this._createOverlay();

            const weatherEmoji = {
                sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️',
                snowy: '❄️', heatwave: '🔥', coldsnap: '🥶'
            };

            const levels = [
                { id: 'very_low', label: 'Very Slow', emoji: '🐌', description: 'Barely any customers' },
                { id: 'low',      label: 'Slow Day',  emoji: '🚶', description: 'Below average traffic' },
                { id: 'normal',   label: 'Normal',     emoji: '👥', description: 'Typical day' },
                { id: 'busy',     label: 'Busy',       emoji: '👫', description: 'Above average — prepare!' },
                { id: 'rush',     label: 'Packed!',    emoji: '🏃', description: 'Maximum capacity likely' },
            ];

            overlay.innerHTML = `
                <div class="minigame-container" style="
                    background: linear-gradient(135deg, #1a2e2e, #1a1a2e);
                    border-radius: 20px; padding: 30px; max-width: 440px; width: 90%;
                    text-align: center; color: #f0e6d3;
                    box-shadow: 0 0 50px rgba(33,150,243,0.2);
                    border: 2px solid rgba(33,150,243,0.3);
                ">
                    <h3 style="margin:0 0 6px;">📊 Morning Forecast</h3>
                    <p style="opacity:0.7; margin:0 0 12px; font-size:14px;">
                        Weather: ${weatherEmoji[weatherToday] || '🌤️'} ${weatherToday}<br>
                        How busy do you think today will be? Correct predictions earn a planning bonus!
                    </p>

                    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
                        ${levels.map(l => `
                            <button class="forecast-choice" data-level="${l.id}" style="
                                display:flex; align-items:center; gap:12px;
                                background: rgba(255,255,255,0.06); border:2px solid transparent;
                                padding: 12px 16px; border-radius:12px; cursor:pointer;
                                color:#f0e6d3; transition:all 0.2s; text-align:left;
                            " onmouseover="this.style.borderColor='#42a5f5'"
                               onmouseout="this.style.borderColor='transparent'">
                                <span style="font-size:26px; width:36px;">${l.emoji}</span>
                                <div>
                                    <div style="font-weight:600;">${l.label}</div>
                                    <div style="font-size:12px; opacity:0.6;">${l.description}</div>
                                </div>
                            </button>
                        `).join('')}
                    </div>

                    <button id="forecast-skip" style="
                        background:none; border:none; color:rgba(255,255,255,0.3);
                        cursor:pointer; font-size:13px;
                    ">Skip (no bonus/penalty)</button>

                    <div id="forecast-result" style="display:none; margin-top:16px;"></div>
                </div>
            `;

            const resultDiv = overlay.querySelector('#forecast-result');

            overlay.querySelectorAll('.forecast-choice').forEach(btn => {
                btn.onclick = () => {
                    const chosen = btn.dataset.level;

                    // How close was the guess?
                    const levelOrder = levels.map(l => l.id);
                    const chosenIdx = levelOrder.indexOf(chosen);
                    const actualIdx = levelOrder.indexOf(actualDemandLevel);
                    const distance = Math.abs(chosenIdx - actualIdx);

                    const isExact = distance === 0;
                    const isClose = distance <= 1;

                    // Bonus: exact = +10% efficiency, close = +5%, wrong = 0
                    const bonus = isExact ? 0.10 : isClose ? 0.05 : 0;

                    // Highlight answers
                    overlay.querySelectorAll('.forecast-choice').forEach(b => {
                        if (b.dataset.level === actualDemandLevel) {
                            b.style.borderColor = '#4caf50';
                            b.style.background = 'rgba(76,175,80,0.2)';
                        }
                        if (b.dataset.level === chosen && chosen !== actualDemandLevel) {
                            b.style.borderColor = distance <= 1 ? '#ffb74d' : '#ef5350';
                        }
                        b.disabled = true;
                    });

                    const actualLevel = levels.find(l => l.id === actualDemandLevel);

                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = `
                        <div style="font-size:20px; margin-bottom:6px;">
                            ${isExact ? '🎯 Perfect forecast!' : isClose ? '👍 Close enough!' : '🤷 Off the mark'}
                        </div>
                        <div style="opacity:0.8; font-size:14px;">
                            Actual: ${actualLevel?.emoji} ${actualLevel?.label}
                            ${bonus > 0 ? `<br>Planning bonus: <strong style="color:#4caf50;">+${(bonus * 100).toFixed(0)}%</strong> efficiency` : ''}
                        </div>
                        <button id="forecast-done" style="
                            margin-top:14px; background:#42a5f5; border:none; color:white;
                            padding:10px 28px; border-radius:20px; cursor:pointer; font-weight:600;
                        ">Open Shop</button>
                    `;

                    overlay.querySelector('#forecast-done').onclick = () => {
                        this._recordResult('forecast', isClose ? 'win' : 'loss');
                        overlay.remove();
                        resolve({ prediction: chosen, actual: actualDemandLevel, bonus, isExact });
                    };
                };
            });

            overlay.querySelector('#forecast-skip').onclick = () => {
                overlay.remove();
                resolve({ prediction: 'skipped', actual: actualDemandLevel, bonus: 0, isExact: false });
            };
        });
    }

    /* ================================================================== */
    /*  6. INSPECTION CHECKLIST — Timed memory / attention game             */
    /*  Triggered: random health inspection event                           */
    /*  Teaches: regulatory compliance, attention to detail                  */
    /* ================================================================== */

    showInspectionGame() {
        return new Promise((resolve) => {
            const overlay = this._createOverlay();

            const items = [
                { id: 'temp', label: 'Fridge temperature log', icon: '🌡️', required: true },
                { id: 'hand', label: 'Handwashing station stocked', icon: '🧼', required: true },
                { id: 'date', label: 'All items date-labelled', icon: '📅', required: true },
                { id: 'floor', label: 'Floors clean, no debris', icon: '🧹', required: true },
                { id: 'pest', label: 'Pest control records', icon: '🐛', required: true },
                { id: 'license', label: 'Business license displayed', icon: '📋', required: true },
                { id: 'hair', label: 'Hair nets on staff', icon: '👒', required: false },
                { id: 'music', label: 'Background music playing', icon: '🎵', required: false },
                { id: 'decor', label: 'Seasonal decorations up', icon: '🎄', required: false },
            ];

            // Shuffle
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            const requiredCount = items.filter(i => i.required).length;
            let timeLeft = 15;
            let gameActive = true;
            const checked = new Set();

            overlay.innerHTML = `
                <div class="minigame-container" style="
                    background: linear-gradient(135deg, #1a2e1a, #1a1a2e);
                    border-radius: 20px; padding: 30px; max-width: 460px; width: 90%;
                    text-align: center; color: #f0e6d3;
                    box-shadow: 0 0 50px rgba(76,175,80,0.2);
                    border: 2px solid rgba(76,175,80,0.3);
                ">
                    <h3 style="margin:0 0 6px;">🔍 Health Inspection!</h3>
                    <p style="opacity:0.7; margin:0 0 12px; font-size:14px;">
                        The inspector is here! Check <strong>only the required compliance items</strong>.
                        Don't check irrelevant ones — they waste the inspector's time!
                    </p>
                    <div style="margin-bottom:14px;">
                        Time: <strong id="inspect-timer" style="color:#4caf50;">${timeLeft}s</strong>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:6px; text-align:left;">
                        ${shuffled.map(item => `
                            <label class="inspect-item" data-id="${item.id}" data-required="${item.required}" style="
                                display:flex; align-items:center; gap:10px;
                                background: rgba(255,255,255,0.06); padding:10px 14px;
                                border-radius:10px; cursor:pointer; transition:all 0.2s;
                                border: 2px solid transparent;
                            ">
                                <input type="checkbox" id="chk-${item.id}" style="width:18px; height:18px; cursor:pointer;">
                                <span style="font-size:20px;">${item.icon}</span>
                                <span style="flex:1;">${item.label}</span>
                            </label>
                        `).join('')}
                    </div>

                    <button id="inspect-submit" style="
                        margin-top:16px; background:#4caf50; border:none; color:white;
                        padding:10px 28px; border-radius:20px; cursor:pointer; font-weight:600;
                    ">Submit Checklist</button>

                    <button id="inspect-skip" style="
                        display:block; margin:10px auto 0; background:none; border:none;
                        color:rgba(255,255,255,0.3); cursor:pointer; font-size:13px;
                    ">Auto-complete (base score)</button>

                    <div id="inspect-result" style="display:none; margin-top:16px;"></div>
                </div>
            `;

            const timerEl = overlay.querySelector('#inspect-timer');
            const resultDiv = overlay.querySelector('#inspect-result');

            const timer = setInterval(() => {
                if (!gameActive) { clearInterval(timer); return; }
                timeLeft--;
                timerEl.textContent = `${timeLeft}s`;
                if (timeLeft <= 5) timerEl.style.color = '#ef5350';
                if (timeLeft <= 0) {
                    gameActive = false;
                    clearInterval(timer);
                    submitResult();
                }
            }, 1000);

            // Track checks
            overlay.querySelectorAll('.inspect-item input').forEach(chk => {
                chk.addEventListener('change', () => {
                    const id = chk.id.replace('chk-', '');
                    if (chk.checked) checked.add(id);
                    else checked.delete(id);
                });
            });

            const submitResult = () => {
                gameActive = false;
                clearInterval(timer);
                overlay.querySelector('#inspect-submit').disabled = true;
                overlay.querySelector('#inspect-skip').style.display = 'none';

                // Score calculation
                let correct = 0;
                let wrong = 0;
                items.forEach(item => {
                    const wasChecked = checked.has(item.id);
                    const label = overlay.querySelector(`[data-id="${item.id}"]`);
                    if (item.required && wasChecked) {
                        correct++;
                        if (label) label.style.borderColor = '#4caf50';
                    } else if (item.required && !wasChecked) {
                        wrong++;
                        if (label) { label.style.borderColor = '#ef5350'; label.style.background = 'rgba(239,83,80,0.15)'; }
                    } else if (!item.required && wasChecked) {
                        wrong++;
                        if (label) { label.style.borderColor = '#ffb74d'; label.style.background = 'rgba(255,183,77,0.1)'; }
                    } else if (label) {
                        label.style.opacity = '0.4';
                    }
                });

                const score = Math.max(0, (correct - wrong * 0.5) / requiredCount);

                let grade = '🏆 A+ Perfect!';
                if (score < 1)   grade = score >= 0.8 ? '✅ A - Great job!' : 
                                         score >= 0.6 ? '😐 B - Some issues' : 
                                         score >= 0.3 ? '⚠️ C - Needs work' : '❌ F - Failed!';

                const fineAmount = score < 0.6 ? Math.round((1 - score) * 200) : 0;

                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `
                    <div style="font-size:22px; margin-bottom:6px;">${grade}</div>
                    <div style="opacity:0.8;">
                        Compliance: ${correct}/${requiredCount} required items ✓
                        ${wrong > 0 ? `<br>${wrong} mistake(s)` : ''}
                        ${fineAmount > 0 ? `<br><span style="color:#ef5350;">Fine: -$${fineAmount}</span>` : ''}
                    </div>
                    <button id="inspect-done" style="
                        margin-top:14px; background:#4caf50; border:none; color:white;
                        padding:10px 28px; border-radius:20px; cursor:pointer; font-weight:600;
                    ">Continue</button>
                `;

                overlay.querySelector('#inspect-done').onclick = () => {
                    this._recordResult('inspection', score >= 0.8 ? 'win' : 'loss');
                    overlay.remove();
                    resolve({ score, correct, wrong, fine: fineAmount, grade });
                };
            };

            overlay.querySelector('#inspect-submit').onclick = submitResult;
            overlay.querySelector('#inspect-skip').onclick = () => {
                gameActive = false;
                clearInterval(timer);
                overlay.remove();
                resolve({ score: 0.7, correct: 4, wrong: 1, fine: 0, grade: 'Auto' });
            };
        });
    }

    /* ================================================================== */
    /*  Utility helpers                                                     */
    /* ================================================================== */

    _createOverlay() {
        // Remove any existing minigame overlay
        const existing = document.querySelector('.minigame-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'minigame-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 10000;
            background: rgba(0, 0, 0, 0.85);
            display: flex; justify-content: center; align-items: center;
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    _recordResult(gameType, outcome) {
        this.gamesPlayed++;
        if (outcome === 'win') this.streakWins++;
        else this.streakWins = 0;

        this.results.push({
            type: gameType,
            outcome,
            day: this.game?.engine?.day || 0,
            timestamp: Date.now()
        });

        // Trim to last 100
        if (this.results.length > 100) this.results = this.results.slice(-100);

        // Trigger journal unlock
        if (this.game?.journal) {
            this.game.journal.onSituation('minigame_played');
        }
    }

    /** Get win rate for a specific game type (or overall) */
    getWinRate(gameType = null) {
        const relevant = gameType
            ? this.results.filter(r => r.type === gameType)
            : this.results;
        if (relevant.length === 0) return 0;
        return relevant.filter(r => r.outcome === 'win').length / relevant.length;
    }

    /* ------------------------------------------------------------------ */
    /*  Save / Load                                                        */
    /* ------------------------------------------------------------------ */

    save() {
        return {
            results: this.results,
            gamesPlayed: this.gamesPlayed,
            streakWins: this.streakWins,
            enabled: this.enabled
        };
    }

    load(data) {
        if (!data) return;
        if (data.results) this.results = data.results;
        if (data.gamesPlayed !== undefined) this.gamesPlayed = data.gamesPlayed;
        if (data.streakWins !== undefined) this.streakWins = data.streakWins;
        if (data.enabled !== undefined) this.enabled = data.enabled;
    }
}

window.MiniGameSystem = MiniGameSystem;
