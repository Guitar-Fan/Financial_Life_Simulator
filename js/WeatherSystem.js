/**
 * WeatherSystem.js — Daily weather generation with cascading game effects.
 *
 * Registered as a WorldSimulation subsystem.
 * Weather is the FIRST subsystem to tick because other systems depend on it.
 *
 * Features:
 *  - Season-aware probability tables for weather types
 *  - 3-day forecast (accuracy degrades with distance)
 *  - Weather streaks (multiple rainy days make storms more likely)
 *  - Temperature simulation
 *  - Effects surfaced through WorldState.weather
 */

class WeatherSystem {
    constructor() {
        this.currentWeather = { type: 'sunny', temperature: 72, severity: 0, wind: 5 };
        this.forecast = [];
        this.history = [];
        this.streak = { type: 'sunny', days: 1 };

        // Season-specific weather probability tables
        // Each value is a relative weight; they are normalised at runtime
        this.seasonTable = {
            SPRING: { sunny: 30, cloudy: 25, rainy: 25, stormy: 10, snowy: 2, heatwave: 3, coldsnap: 5 },
            SUMMER: { sunny: 40, cloudy: 20, rainy: 12, stormy: 8, snowy: 0, heatwave: 15, coldsnap: 0 },
            FALL:   { sunny: 25, cloudy: 30, rainy: 22, stormy: 10, snowy: 5, heatwave: 2, coldsnap: 6 },
            WINTER: { sunny: 15, cloudy: 25, rainy: 15, stormy: 8, snowy: 25, heatwave: 0, coldsnap: 12 }
        };

        // Temperature ranges by season (Fahrenheit)
        this.tempRanges = {
            SPRING: { min: 45, max: 75 },
            SUMMER: { min: 65, max: 100 },
            FALL:   { min: 35, max: 70 },
            WINTER: { min: 10, max: 45 }
        };

        // Weather descriptions for notifications
        this.descriptions = {
            sunny:    ['☀️ Beautiful sunny day', '🌤️ Clear skies today', '☀️ Sunshine brings people out'],
            cloudy:   ['☁️ Overcast skies', '🌥️ Clouds rolling in', '☁️ Grey but dry'],
            rainy:    ['🌧️ Rain showers today', '☔ Bring an umbrella!', '🌧️ Wet roads, fewer walkers'],
            stormy:   ['⛈️ Storms expected!', '🌩️ Severe weather warning', '⛈️ Stay safe – bad storms coming'],
            snowy:    ['❄️ Snow is falling!', '🌨️ Winter wonderland', '❄️ Roads may be slippery'],
            heatwave: ['🔥 Extreme heat advisory', '🥵 Scorching temperatures', '☀️🔥 Stay hydrated!'],
            coldsnap: ['🥶 Bitter cold today', '❄️🌬️ Freezing temperatures', '🧣 Bundle up – cold snap!']
        };

        console.log('🌤️ WeatherSystem initialised');
    }

    /* ------------------------------------------------------------------ */
    /*  Subsystem interface                                                */
    /* ------------------------------------------------------------------ */

    tick(dayNumber, worldState, _snapshot) {
        const season = worldState.weather?.season || this._getSeason(dayNumber);
        const events = [];

        // Generate today's weather
        this.currentWeather = this._generateWeather(season, dayNumber);
        this._updateStreak(this.currentWeather.type);

        // Generate 3-day forecast (decreasing accuracy)
        this.forecast = [1, 2, 3].map(offset => {
            const futureSeason = this._getSeason(dayNumber + offset);
            const raw = this._generateWeather(futureSeason, dayNumber + offset);
            // Add noise proportional to distance
            if (Math.random() < 0.15 * offset) {
                raw.type = this._randomWeatherType(futureSeason);
            }
            raw.accuracy = Math.max(30, 90 - offset * 20); // 70%, 50%, 30%
            return raw;
        });

        // Store history (last 14 days)
        this.history.push({ day: dayNumber, ...this.currentWeather });
        if (this.history.length > 14) this.history.shift();

        // Write into world state
        worldState.weather = {
            today: { ...this.currentWeather },
            forecast: this.forecast.map(f => ({ ...f })),
            streak: this.streak.days,
            season
        };

        // Log notable weather
        if (['stormy', 'heatwave', 'coldsnap', 'snowy'].includes(this.currentWeather.type)) {
            const desc = this._pickDescription(this.currentWeather.type);
            events.push({
                day: dayNumber,
                category: 'weather',
                description: desc,
                sentiment: 'negative'
            });
        }

        return { events };
    }

    save() {
        return {
            currentWeather: this.currentWeather,
            forecast: this.forecast,
            history: this.history,
            streak: this.streak
        };
    }

    load(data) {
        if (!data) return;
        if (data.currentWeather) this.currentWeather = data.currentWeather;
        if (data.forecast) this.forecast = data.forecast;
        if (data.history) this.history = data.history;
        if (data.streak) this.streak = data.streak;
    }

    /* ------------------------------------------------------------------ */
    /*  Weather generation                                                 */
    /* ------------------------------------------------------------------ */

    _generateWeather(season, dayNumber) {
        const type = this._randomWeatherType(season);
        const tempRange = this.tempRanges[season] || this.tempRanges.SPRING;

        // Base temperature from range, nudged by weather type
        let temp = tempRange.min + Math.random() * (tempRange.max - tempRange.min);
        const typeNudge = { sunny: 4, cloudy: 0, rainy: -3, stormy: -5, snowy: -8, heatwave: 12, coldsnap: -15 };
        temp += typeNudge[type] || 0;
        temp += (Math.random() - 0.5) * 6; // daily jitter
        temp = Math.round(Math.max(0, Math.min(115, temp)));

        // Severity 0-1 (storms/extremes have higher severity)
        const baseSeverity = { sunny: 0, cloudy: 0.1, rainy: 0.3, stormy: 0.7, snowy: 0.4, heatwave: 0.6, coldsnap: 0.5 };
        const severity = Math.min(1, (baseSeverity[type] || 0) + Math.random() * 0.2);

        // Streak makes same weather more likely (persistence)
        // Already handled via weighted selection

        const wind = type === 'stormy' ? 25 + Math.random() * 30 : 3 + Math.random() * 15;

        return { type, temperature: temp, severity, wind: Math.round(wind) };
    }

    _randomWeatherType(season) {
        const weights = this.seasonTable[season] || this.seasonTable.SPRING;

        // Streak bonus: current type gets +15 weight for persistence
        const adjusted = { ...weights };
        if (this.streak.days >= 1 && adjusted[this.streak.type] !== undefined) {
            adjusted[this.streak.type] += 15;
        }
        // Storms become more likely if rainy for 2+ days
        if (this.streak.type === 'rainy' && this.streak.days >= 2) {
            adjusted.stormy = (adjusted.stormy || 0) + 12;
        }

        const entries = Object.entries(adjusted).filter(([, w]) => w > 0);
        const total = entries.reduce((s, [, w]) => s + w, 0);
        let roll = Math.random() * total;
        for (const [type, w] of entries) {
            roll -= w;
            if (roll <= 0) return type;
        }
        return entries[0][0];
    }

    _updateStreak(type) {
        if (type === this.streak.type) {
            this.streak.days++;
        } else {
            this.streak = { type, days: 1 };
        }
    }

    _getSeason(dayNumber) {
        const doy = dayNumber % 365;
        if (doy < 90) return 'WINTER';
        if (doy < 180) return 'SPRING';
        if (doy < 270) return 'SUMMER';
        return 'FALL';
    }

    _pickDescription(type) {
        const arr = this.descriptions[type] || ['Weather update'];
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /* ------------------------------------------------------------------ */
    /*  Public helpers for other systems                                    */
    /* ------------------------------------------------------------------ */

    /** Does today's weather delay deliveries? */
    isDeliveryDelayed() {
        return this.currentWeather.type === 'stormy' ||
               (this.currentWeather.type === 'snowy' && this.currentWeather.severity > 0.5);
    }

    /** Foot traffic multiplier from weather alone */
    getTrafficMultiplier() {
        const map = { sunny: 1.1, cloudy: 1.0, rainy: 0.75, stormy: 0.55, snowy: 0.6, heatwave: 0.85, coldsnap: 0.9 };
        return map[this.currentWeather.type] || 1.0;
    }

    /** Product demand shifts (hot weather = cold items, cold = warm items) */
    getProductDemandModifiers() {
        const t = this.currentWeather.temperature;
        if (t >= 90) return { bread: 0.8, pastry: 0.7, cookie: 1.0, cake: 0.9, dessert: 1.3 };
        if (t >= 75) return { bread: 0.9, pastry: 0.9, cookie: 1.1, cake: 1.0, dessert: 1.2 };
        if (t <= 32) return { bread: 1.3, pastry: 1.2, cookie: 1.1, cake: 1.0, dessert: 0.7 };
        if (t <= 50) return { bread: 1.15, pastry: 1.1, cookie: 1.0, cake: 1.0, dessert: 0.85 };
        return { bread: 1.0, pastry: 1.0, cookie: 1.0, cake: 1.0, dessert: 1.0 };
    }
}

window.WeatherSystem = WeatherSystem;
