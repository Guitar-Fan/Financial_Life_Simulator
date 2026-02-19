<!--
  Phase 5: Renovation & Equipment
  Player selects renovation tiers for each area and purchases equipment.
  BakeryBuilding SVG updates in real-time as choices are made.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import { RENOVATION_OPTIONS, EQUIPMENT_ITEMS } from '@/data/startup-data';
import type { EquipmentItemId, EquipmentTierId } from '@/types/startup-types';
import AdvisorAvatar from './graphics/AdvisorAvatar.vue';
import SpeechBubble from './graphics/SpeechBubble.vue';
import BakeryBuilding from './graphics/BakeryBuilding.vue';

const store = useBakeryStartupStore();
const activeTab = ref<'renovation' | 'equipment'>('renovation');
const selectedArea = ref<string | null>(null);

function getCurrentTier(area: string): number | null {
  return store.renovationChoices[area] || null;
}

function setRenovation(area: string, tierNumber: number) {
  store.setRenovation(area, tierNumber);
}

function hasEquipment(itemId: EquipmentItemId): boolean {
  return store.equipmentPurchases.some(p => p.itemId === itemId);
}

function getEquipmentTier(itemId: EquipmentItemId): string | null {
  const purchase = store.equipmentPurchases.find(p => p.itemId === itemId);
  return purchase?.tierId || null;
}

function buyEquipment(itemId: EquipmentItemId, tierId: EquipmentTierId, price: number, isLease: boolean) {
  if (hasEquipment(itemId)) {
    store.removeEquipment(itemId);
  }
  store.addEquipment(itemId, tierId, price, isLease);
}

function removeEquipment(itemId: EquipmentItemId) {
  store.removeEquipment(itemId);
}

const renovationTotal = computed(() => {
  let total = 0;
  for (const [area, tierNum] of Object.entries(store.renovationChoices)) {
    const opt = RENOVATION_OPTIONS.find(r => r.area === area);
    if (opt && tierNum >= 1 && tierNum <= opt.tiers.length) {
      total += opt.tiers[tierNum - 1].cost;
    }
  }
  return total;
});

const equipmentTotal = computed(() => {
  return store.equipmentPurchases.reduce((sum, p) => sum + p.cost, 0);
});

const hasKitchenReno = computed(() => !!store.renovationChoices.kitchen);
const hasStorefrontReno = computed(() => !!store.renovationChoices.storefront);
const hasExteriorReno = computed(() => !!store.renovationChoices.exterior);

const buildingStyle = computed(() => {
  const kitchenTier = store.renovationChoices.kitchen || 0;
  const storefrontTier = store.renovationChoices.storefront || 0;
  if (kitchenTier >= 3 || storefrontTier >= 3) return 'premium';
  if (kitchenTier >= 2 || storefrontTier >= 2) return 'charming';
  if (kitchenTier >= 1 || storefrontTier >= 1) return 'basic';
  return 'shell';
});

const hasMinimumSetup = computed(() => {
  return hasKitchenReno.value && store.equipmentPurchases.some(p => p.itemId === 'oven');
});

const advisorMessage = computed(() => {
  if (!hasKitchenReno.value) return 'You\'ll need a functioning kitchen at minimum. I\'d recommend at least a basic renovation. Equipment-wise, an oven is non-negotiable.';
  if (!hasEquipment('oven')) return 'Looking good on the renovation! But you still need an oven — can\'t bake without one.';
  return 'Your bakery is shaping up nicely! Remember, better equipment means higher quality and faster production. Watch that budget though.';
});

function qualityLabel(tier: { efficiencyRating?: number; quality?: string }): string {
  if (tier.quality) return tier.quality;
  const r = tier.efficiencyRating || 0;
  if (r >= 1.2) return 'Premium';
  if (r >= 0.9) return 'Standard';
  return 'Budget';
}
</script>

<template>
  <div class="space-y-5 animate-game-fade-in">
    <!-- Advisor -->
    <div class="flex items-start gap-4">
      <AdvisorAvatar character="mentor" :size="64" :mood="hasMinimumSetup ? 'happy' : 'concerned'" />
      <SpeechBubble :type="hasMinimumSetup ? 'tip' : 'warning'" position="left">
        <p><strong class="text-[var(--game-gold)]">Chef Auguste:</strong> {{ advisorMessage }}</p>
      </SpeechBubble>
    </div>

    <!-- Building Preview -->
    <div class="game-panel p-6 flex justify-center" style="background: linear-gradient(180deg, #1a2030 0%, #1e1a14 100%)">
      <BakeryBuilding
        :has-exterior="hasExteriorReno"
        :has-storefront="hasStorefrontReno"
        :has-kitchen="hasKitchenReno"
        :has-sign="!!store.businessName"
        :sign-text="store.businessName || 'Bakery'"
        :light-on="hasStorefrontReno"
        :style-prop="buildingStyle"
      />
    </div>

    <!-- Budget Bar -->
    <div class="game-panel p-4 grid grid-cols-3 gap-4 text-center">
      <div>
        <p class="text-lg font-bold text-[var(--game-info)] font-game-mono">${{ renovationTotal.toLocaleString() }}</p>
        <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Renovation</p>
      </div>
      <div>
        <p class="text-lg font-bold text-[#c084fc] font-game-mono">${{ equipmentTotal.toLocaleString() }}</p>
        <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Equipment</p>
      </div>
      <div>
        <p class="text-lg font-bold font-game-mono" :style="{ color: store.cashRemaining >= 0 ? 'var(--game-success)' : 'var(--game-danger)' }">
          ${{ store.cashRemaining.toLocaleString() }}
        </p>
        <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Cash Left</p>
      </div>
    </div>

    <!-- Tab Toggle -->
    <div class="game-tabs">
      <button
        @click="activeTab = 'renovation'"
        :class="['game-tab', activeTab === 'renovation' ? 'game-tab--active' : '']"
      >
        🔨 Renovation
      </button>
      <button
        @click="activeTab = 'equipment'"
        :class="['game-tab', activeTab === 'equipment' ? 'game-tab--active' : '']"
      >
        ⚙️ Equipment
      </button>
    </div>

    <!-- Renovation Tab -->
    <Transition name="fade" mode="out-in">
      <div v-if="activeTab === 'renovation'" class="space-y-4">
        <div
          v-for="reno in RENOVATION_OPTIONS"
          :key="reno.area"
          class="game-panel overflow-hidden"
        >
          <div
            class="p-4 flex items-center justify-between cursor-pointer transition-colors"
            @click="selectedArea = selectedArea === reno.area ? null : reno.area"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--game-bg-panel-hover)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ reno.icon }}</span>
              <div>
                <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ reno.name }}</h4>
                <p class="text-[10px] text-[var(--game-text-muted)]">
                  {{ getCurrentTier(reno.area)
                    ? `Tier ${getCurrentTier(reno.area)} selected`
                    : 'Not renovated yet' }}
                </p>
              </div>
            </div>
            <span class="text-[var(--game-text-dim)] text-xs">{{ selectedArea === reno.area ? '▲' : '▼' }}</span>
          </div>

          <Transition name="expand">
            <div v-if="selectedArea === reno.area" class="px-4 pb-4 space-y-3 pt-3" style="border-top: 1px solid var(--game-border-dark)">
              <p class="text-sm text-[var(--game-text-secondary)]">{{ reno.description }}</p>

              <div class="space-y-2">
                <button
                  v-for="(tier, idx) in reno.tiers"
                  :key="tier.id"
                  @click="setRenovation(reno.area, idx + 1)"
                  class="w-full text-left p-4 rounded-md transition-all"
                  :style="{
                    background: getCurrentTier(reno.area) === idx + 1 ? 'rgba(245, 158, 11, 0.08)' : 'var(--game-bg-dark)',
                    border: `2px solid ${getCurrentTier(reno.area) === idx + 1 ? 'var(--game-gold)' : 'var(--game-border-dark)'}`,
                    boxShadow: getCurrentTier(reno.area) === idx + 1 ? 'var(--game-shadow-glow-gold)' : 'none',
                  }"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <h5 class="font-bold text-sm text-[var(--game-text-primary)]">{{ tier.name }}</h5>
                      <p class="text-xs text-[var(--game-text-muted)] mt-1">{{ tier.description }}</p>
                    </div>
                    <div class="text-right ml-4">
                      <p class="font-bold text-sm font-game-mono" :style="{ color: (store.cashRemaining >= tier.cost || getCurrentTier(reno.area) === idx + 1) ? 'var(--game-success)' : 'var(--game-danger)' }">
                        ${{ tier.cost.toLocaleString() }}
                      </p>
                      <p class="text-[10px] text-[var(--game-text-dim)]">{{ tier.installationWeeks }}wk install</p>
                    </div>
                  </div>
                  <div class="mt-2 flex gap-2">
                    <span class="game-badge game-badge--info">
                      Quality {{ tier.qualityImpact >= 0 ? '+' : '' }}{{ (tier.qualityImpact * 100).toFixed(0) }}%
                    </span>
                    <span class="game-badge" style="background: rgba(168,85,247,0.15); color: #c084fc; border-color: rgba(168,85,247,0.3)">
                      Efficiency {{ tier.efficiencyImpact >= 0 ? '+' : '' }}{{ (tier.efficiencyImpact * 100).toFixed(0) }}%
                    </span>
                    <span v-if="tier.maintenanceCostMonthly > 0" class="game-badge game-badge--danger">
                      ${{ tier.maintenanceCostMonthly }}/mo maint.
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Equipment Tab -->
      <div v-else class="space-y-4">
        <div
          v-for="item in EQUIPMENT_ITEMS"
          :key="item.id"
          class="game-panel p-4 space-y-3"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ item.icon }}</span>
                <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ item.name }}</h4>
                <span v-if="item.required" class="game-badge game-badge--danger">Required</span>
                <span v-if="hasEquipment(item.id)" class="game-badge game-badge--success">Owned</span>
              </div>
              <p class="text-xs text-[var(--game-text-muted)] mt-1">{{ item.description }}</p>
            </div>
            <button
              v-if="hasEquipment(item.id)"
              @click="removeEquipment(item.id)"
              class="text-xs px-2 py-1 transition-colors"
              style="color: var(--game-danger)"
              @mouseenter="($event.currentTarget as HTMLElement).style.color = '#fca5a5'"
              @mouseleave="($event.currentTarget as HTMLElement).style.color = 'var(--game-danger)'"
            >
              Remove
            </button>
          </div>

          <div class="grid sm:grid-cols-2 gap-2">
            <button
              v-for="tier in item.tiers"
              :key="tier.id"
              @click="buyEquipment(item.id, tier.id, tier.price, false)"
              class="text-left p-3 rounded-md transition-all"
              :style="{
                background: getEquipmentTier(item.id) === tier.id ? 'rgba(245, 158, 11, 0.08)' : 'var(--game-bg-dark)',
                border: `2px solid ${getEquipmentTier(item.id) === tier.id ? 'var(--game-gold)' : 'var(--game-border-dark)'}`,
                boxShadow: getEquipmentTier(item.id) === tier.id ? 'var(--game-shadow-glow-gold)' : 'none',
              }"
            >
              <div class="flex justify-between items-start">
                <span class="font-bold text-xs text-[var(--game-text-primary)]">{{ tier.name }}</span>
                <span class="text-xs font-game-mono" :style="{ color: (store.cashRemaining >= tier.price || getEquipmentTier(item.id) === tier.id) ? 'var(--game-success)' : 'var(--game-danger)' }">
                  ${{ tier.price.toLocaleString() }}
                </span>
              </div>
              <p class="text-[10px] text-[var(--game-text-muted)] mt-1 capitalize">{{ tier.quality }} quality</p>
              <div class="mt-1.5 flex gap-1.5">
                <span class="game-badge game-badge--info" style="font-size: 9px; padding: 1px 6px">Eff:{{ tier.efficiencyRating.toFixed(1) }}</span>
                <span class="game-badge" style="font-size: 9px; padding: 1px 6px; background: rgba(168,85,247,0.15); color: #c084fc; border-color: rgba(168,85,247,0.3)">Cap:{{ tier.capacity }}</span>
                <span v-if="tier.maintenanceCostMonthly > 0" class="game-badge game-badge--danger" style="font-size: 9px; padding: 1px 6px">
                  ${{ tier.maintenanceCostMonthly }}/mo
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-4">
      <button @click="store.goToPhase(4)" class="game-btn game-btn--ghost">← Permits</button>
      <button
        @click="store.completeCurrentPhase()"
        :disabled="!hasMinimumSetup"
        :class="['game-btn py-3 px-6', hasMinimumSetup ? 'game-btn--primary' : '']"
      >
        {{ hasMinimumSetup ? 'Choose Suppliers & Menu →' : 'Need kitchen reno + oven' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
