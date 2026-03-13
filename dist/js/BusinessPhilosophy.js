class BusinessPhilosophy {
    constructor(strategyConfig = GAME_CONFIG.STRATEGY) {
        this.config = strategyConfig || {};
        this.philosophyKey = Object.keys(this.config?.PHILOSOPHIES || {})[0] || 'craftsmanship';
        this.playbookKey = Object.keys(this.config?.PLAYBOOKS || {})[0] || 'steady_shop';
        this.pricingStyleKey = this.getPhilosophy(this.philosophyKey)?.defaults?.pricingStyle || 'balanced';
        this.marketingFocus = this.getPhilosophy(this.philosophyKey)?.defaults?.marketingFocus || 'REGULAR';
        this.inventoryBufferDays = this.getInitialBufferDays();
    }

    getInitialBufferDays() {
        const fallback = this.config?.INVENTORY_BOUNDS?.minDays || 1;
        const philosophyDefault = this.getPhilosophy(this.philosophyKey)?.defaults?.bufferDays;
        const playbookDefault = this.getPlaybook(this.playbookKey)?.inventoryDays;
        return philosophyDefault || playbookDefault || fallback;
    }

    getPhilosophy(key) {
        return this.config?.PHILOSOPHIES?.[key];
    }

    getPlaybook(key) {
        return this.config?.PLAYBOOKS?.[key];
    }

    getPricingStyle(key) {
        return this.config?.PRICING_STYLES?.[key];
    }

    selectPhilosophy(key) {
        if (!this.getPhilosophy(key)) return;
        this.philosophyKey = key;
        const defaults = this.getPhilosophy(key)?.defaults || {};
        if (defaults.pricingStyle) {
            this.pricingStyleKey = defaults.pricingStyle;
        }
        if (defaults.marketingFocus) {
            this.marketingFocus = defaults.marketingFocus;
        }
        if (defaults.bufferDays) {
            this.inventoryBufferDays = defaults.bufferDays;
        }
    }

    selectPlaybook(key) {
        if (!this.getPlaybook(key)) return;
        this.playbookKey = key;
        const playbook = this.getPlaybook(key);
        if (playbook?.inventoryDays) {
            this.inventoryBufferDays = playbook.inventoryDays;
        }
        if (playbook?.automationBias?.pricing && !this.getPricingStyle(this.pricingStyleKey)) {
            this.pricingStyleKey = playbook.automationBias.pricing;
        }
    }

    setPricingStyle(key) {
        if (!this.getPricingStyle(key)) return;
        this.pricingStyleKey = key;
    }

    setMarketingFocus(segmentKey) {
        this.marketingFocus = segmentKey;
    }

    setInventoryBufferDays(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return;
        const bounds = this.config?.INVENTORY_BOUNDS || { minDays: 0.5, maxDays: 3 };
        const clamped = Math.max(bounds.minDays, Math.min(bounds.maxDays, numeric));
        this.inventoryBufferDays = Number(clamped.toFixed(2));
    }

    getProductionTargets() {
        const playbook = this.getPlaybook(this.playbookKey);
        if (!playbook?.productionFocus?.length) {
            return {};
        }

        const totalUnits = playbook.dailyOutput || 12;
        const targets = {};

        playbook.productionFocus.forEach(entry => {
            if (!entry.recipe) return;
            const baseUnits = Math.max(1, Math.round(totalUnits * entry.weight));
            targets[entry.recipe] = baseUnits;
        });

        return targets;
    }

    getStrategySnapshot() {
        const philosophy = this.getPhilosophy(this.philosophyKey);
        const playbook = this.getPlaybook(this.playbookKey);
        const pricing = this.getPricingStyle(this.pricingStyleKey);

        return {
            philosophy: this.philosophyKey,
            playbook: this.playbookKey,
            pricingStyle: this.pricingStyleKey,
            vendorPriority: philosophy?.defaults?.vendor || 'METRO',
            marketingFocus: this.marketingFocus,
            inventoryBufferDays: this.inventoryBufferDays,
            cashFloorPercent: playbook?.cashFloor || 0.15,
            automationBias: playbook?.automationBias || {},
            pricingProfile: pricing,
            productionTemplate: playbook?.productionFocus || []
        };
    }
}

window.BusinessPhilosophy = BusinessPhilosophy;
