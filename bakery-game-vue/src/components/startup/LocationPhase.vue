<!--
  Phase 3: Location Scouting
  Player selects from available locations, negotiates lease, evaluates demographics.
  Hidden variables affect long-term success (traffic variance, competitor threat).
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import { LOCATION_OPTIONS } from '@/data/startup-data';
import type { LocationId } from '@/types/startup-types';
import AdvisorAvatar from './graphics/AdvisorAvatar.vue';
import SpeechBubble from './graphics/SpeechBubble.vue';
import GamePanel from './ui/GamePanel.vue';

const store = useBakeryStartupStore();

const inspectingId = ref<LocationId | null>(store.selectedLocation);
const showLeaseModal = ref(false);
const leaseNegotiating = ref(false);
const leaseResult = ref<string | null>(null);

const selectedLocationDetail = computed(() => {
  if (!inspectingId.value) return null;
  return LOCATION_OPTIONS.find(l => l.id === inspectingId.value) || null;
});

const canAfford = (monthlyRent: number) => {
  return store.totalCapital >= monthlyRent * 6;
};

function selectLocation(id: LocationId) {
  inspectingId.value = id;
}

function confirmLocation() {
  if (!inspectingId.value) return;
  store.selectLocation(inspectingId.value);
  showLeaseModal.value = true;
}

function negotiateLease() {
  leaseNegotiating.value = true;
  const result = store.negotiateLease();
  setTimeout(() => {
    leaseNegotiating.value = false;
    if (result) {
      leaseResult.value = `Success! You negotiated ${(store.leaseDiscount * 100).toFixed(0)}% off your monthly rent.`;
    } else {
      leaseResult.value = 'The landlord wasn\'t willing to budge on price. You\'re locked in at the listed rate.';
    }
  }, 1200);
}

function signLease() {
  showLeaseModal.value = false;
}

function neighborhoodAccent(neighborhood: string): string {
  switch (neighborhood) {
    case 'downtown_core': return 'var(--game-gold)';
    case 'arts_district': return '#c084fc';
    case 'suburban_strip': return 'var(--game-success)';
    case 'college_town': return 'var(--game-info)';
    case 'residential_quiet': return '#2dd4bf';
    case 'industrial_revitalized': return 'var(--game-text-muted)';
    default: return 'var(--game-border-medium)';
  }
}

function getLocationPros(loc: typeof LOCATION_OPTIONS[0]): string[] {
  const pros: string[] = [];
  if (loc.footTraffic >= 70) pros.push('High foot traffic');
  if (loc.parkingSpaces >= 15) pros.push('Ample parking');
  if (loc.nearbyCompetitors <= 1) pros.push('Low competition');
  if (loc.demographics.averageIncome >= 70000) pros.push('Affluent area');
  if (loc.condition === 'turnkey' || loc.condition === 'renovated') pros.push('Move-in ready');
  if (loc.buildoutAllowance > 0) pros.push(`$${loc.buildoutAllowance.toLocaleString()} build-out allowance`);
  if (loc.zoning.outdoorSeatingAllowed) pros.push('Outdoor seating allowed');
  if (pros.length === 0) pros.push('Affordable option');
  return pros;
}

function getLocationCons(loc: typeof LOCATION_OPTIONS[0]): string[] {
  const cons: string[] = [];
  if (loc.footTraffic < 40) cons.push('Low foot traffic');
  if (loc.parkingSpaces < 5) cons.push('Limited parking');
  if (loc.nearbyCompetitors >= 3) cons.push('Heavy competition');
  if (loc.condition === 'shell') cons.push('Needs full build-out');
  if (loc.monthlyRent >= 5000) cons.push('High rent');
  if (loc.zoning.requiresVariance) cons.push('Zoning variance required');
  if (loc.rentEscalation >= 0.04) cons.push(`${(loc.rentEscalation * 100).toFixed(0)}% annual rent increase`);
  return cons;
}

const advisorMessage = computed(() => {
  if (!inspectingId.value) return 'Location is everything in the bakery business. Consider foot traffic, parking, demographics, and competition. I\'ve lined up some options for you.';
  const loc = selectedLocationDetail.value;
  if (!loc) return '';
  return `${loc.name} — ${loc.description}. Monthly rent is $${loc.monthlyRent.toLocaleString()}. ${loc.demographics.dailyPedestrianCount}+ people walk by daily. Let me know if you want to inspect the property.`;
});
</script>

<template>
  <div class="space-y-5 animate-game-fade-in">
    <!-- Advisor -->
    <div class="flex items-start gap-4">
      <AdvisorAvatar character="realtor" :size="64" mood="excited" />
      <SpeechBubble type="tip" position="left">
        <p><strong class="text-[var(--game-gold)]">Marcus Rivera, Real Estate:</strong> {{ advisorMessage }}</p>
      </SpeechBubble>
    </div>

    <!-- Budget Indicator -->
    <div class="game-panel game-panel--success p-3 flex items-center justify-between">
      <span class="text-sm text-[var(--game-text-secondary)]">Available Capital:</span>
      <span class="text-lg font-bold text-[var(--game-success)] font-game-mono">${{ store.cashRemaining.toLocaleString() }}</span>
    </div>

    <!-- Location Cards -->
    <div class="space-y-4">
      <h3 class="text-base font-game-title font-bold text-[var(--game-gold)] uppercase tracking-wider">
        <span class="mr-2">📍</span>Available Locations
      </h3>

      <div class="grid gap-4">
        <div
          v-for="location in LOCATION_OPTIONS"
          :key="location.id"
          @click="selectLocation(location.id)"
          class="game-panel game-panel--interactive"
          :class="{
            'selected': inspectingId === location.id,
            'game-panel--success': store.selectedLocation === location.id,
          }"
        >
          <!-- Location Header -->
          <div class="p-4" :style="{ borderLeft: `3px solid ${neighborhoodAccent(location.neighborhood)}` }">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ location.name }}</h4>
                <p class="text-xs text-[var(--game-text-muted)] mt-0.5">{{ location.address }}</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold font-game-mono" :style="{ color: canAfford(location.monthlyRent) ? 'var(--game-success)' : 'var(--game-danger)' }">
                  ${{ location.monthlyRent.toLocaleString() }}<span class="text-xs font-normal text-[var(--game-text-muted)]">/mo</span>
                </p>
                <p class="text-[10px] text-[var(--game-text-dim)]">{{ location.sqft.toLocaleString() }} sqft</p>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="px-4 pb-4 space-y-3">
            <p class="text-sm text-[var(--game-text-secondary)]">{{ location.description }}</p>

            <div class="grid grid-cols-4 gap-2">
              <div class="text-center p-2 rounded-md" style="background: var(--game-bg-dark)">
                <p class="text-sm font-bold text-[var(--game-info)] font-game-mono">{{ location.demographics.dailyPedestrianCount }}</p>
                <p class="text-[9px] text-[var(--game-text-dim)] uppercase">Traffic</p>
              </div>
              <div class="text-center p-2 rounded-md" style="background: var(--game-bg-dark)">
                <p class="text-sm font-bold text-[#c084fc] font-game-mono">{{ location.demographics.averageIncome > 0 ? `$${(location.demographics.averageIncome / 1000).toFixed(0)}K` : '—' }}</p>
                <p class="text-[9px] text-[var(--game-text-dim)] uppercase">Income</p>
              </div>
              <div class="text-center p-2 rounded-md" style="background: var(--game-bg-dark)">
                <p class="text-sm font-bold text-[var(--game-danger)] font-game-mono">{{ location.nearbyCompetitors }}</p>
                <p class="text-[9px] text-[var(--game-text-dim)] uppercase">Rivals</p>
              </div>
              <div class="text-center p-2 rounded-md" style="background: var(--game-bg-dark)">
                <p class="text-sm font-bold text-[var(--game-success)] font-game-mono">{{ location.parkingSpaces > 0 ? location.parkingSpaces : '—' }}</p>
                <p class="text-[9px] text-[var(--game-text-dim)] uppercase">Parking</p>
              </div>
            </div>

            <!-- Expanded Details -->
            <Transition name="expand">
              <div v-if="inspectingId === location.id" class="space-y-3 pt-3" style="border-top: 1px solid var(--game-border-dark)">
                <!-- Demographics -->
                <div>
                  <h5 class="text-[10px] font-bold text-[var(--game-gold)] mb-2 uppercase tracking-wider">Customer Demographics</h5>
                  <div class="space-y-1.5">
                    <div v-for="(pct, group) in location.demographics.ageDistribution" :key="group" class="flex items-center gap-2">
                      <span class="text-[10px] text-[var(--game-text-muted)] w-16 capitalize">{{ group }}</span>
                      <div class="flex-1 h-2 rounded-full overflow-hidden" style="background: var(--game-bg-darkest)">
                        <div class="h-full rounded-full transition-all" style="background: var(--game-gold)" :style="{ width: `${pct * 100}%` }" />
                      </div>
                      <span class="text-[10px] font-bold w-8 text-right text-[var(--game-text-secondary)] font-game-mono">{{ (pct * 100).toFixed(0) }}%</span>
                    </div>
                  </div>
                </div>

                <!-- Property Details -->
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div class="text-[var(--game-text-muted)]">
                    Neighborhood: <span class="font-bold text-[var(--game-text-secondary)] capitalize ml-1">{{ location.neighborhood.replace(/_/g, ' ') }}</span>
                  </div>
                  <div class="text-[var(--game-text-muted)]">
                    Condition: <span class="font-bold text-[var(--game-text-secondary)] capitalize ml-1">{{ location.condition }}</span>
                  </div>
                  <div class="text-[var(--game-text-muted)]">
                    Deposit: <span class="font-bold text-[var(--game-text-secondary)] ml-1 font-game-mono">${{ (location.monthlyRent * location.securityDeposit).toLocaleString() }}</span>
                  </div>
                  <div class="text-[var(--game-text-muted)]">
                    Lease: <span class="font-bold text-[var(--game-text-secondary)] ml-1">{{ location.leaseTermYears }} years</span>
                  </div>
                </div>

                <!-- Pros/Cons -->
                <div class="grid sm:grid-cols-2 gap-3">
                  <div class="rounded-lg p-3" style="background: rgba(52, 211, 153, 0.08); border: 1px solid var(--game-success-dim)">
                    <h6 class="text-[10px] font-bold text-[var(--game-success)] uppercase mb-1.5 tracking-wider">Advantages</h6>
                    <ul class="space-y-1">
                      <li v-for="pro in getLocationPros(location)" :key="pro" class="text-xs text-[var(--game-success)] flex items-start gap-1">
                        <span>✓</span> {{ pro }}
                      </li>
                    </ul>
                  </div>
                  <div class="rounded-lg p-3" style="background: rgba(248, 113, 113, 0.08); border: 1px solid var(--game-danger-dim)">
                    <h6 class="text-[10px] font-bold text-[var(--game-danger)] uppercase mb-1.5 tracking-wider">Risks</h6>
                    <ul class="space-y-1">
                      <li v-for="con in getLocationCons(location)" :key="con" class="text-xs text-[var(--game-danger)] flex items-start gap-1">
                        <span>✗</span> {{ con }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Select Button -->
                <button
                  @click.stop="confirmLocation"
                  :disabled="!canAfford(location.monthlyRent)"
                  :class="[
                    'game-btn w-full py-3',
                    canAfford(location.monthlyRent)
                      ? (store.selectedLocation === location.id ? 'game-btn--success' : 'game-btn--primary')
                      : '',
                  ]"
                >
                  {{ canAfford(location.monthlyRent) ? (store.selectedLocation === location.id ? '✅ Currently Selected' : 'Select This Location') : 'Cannot Afford (need 6× rent)' }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Lease Negotiation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showLeaseModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.8); backdrop-filter: blur(4px)" @click.self="showLeaseModal = false">
          <div class="game-panel game-panel--gold max-w-md w-full p-6 space-y-4">
            <h3 class="text-lg font-bold font-game-title text-[var(--game-gold)]">🤝 Lease Negotiation</h3>
            <p class="text-sm text-[var(--game-text-secondary)]">
              Before signing, you can try to negotiate a lower rent. Your business experience and credit score
              will influence the outcome.
            </p>

            <div class="rounded-lg p-3 space-y-1" style="background: var(--game-bg-dark); border: 1px solid var(--game-border-dark)">
              <p class="text-sm text-[var(--game-text-secondary)]">Listed Rent: <strong class="font-game-mono text-[var(--game-text-primary)]">${{ selectedLocationDetail?.monthlyRent.toLocaleString() }}/mo</strong></p>
              <p class="text-sm text-[var(--game-text-secondary)]">Business Exp: <strong class="text-[var(--game-text-primary)]">{{ store.ownerBackground.businessExperience }} years</strong></p>
              <p class="text-sm text-[var(--game-text-secondary)]">Credit Score: <strong class="text-[var(--game-text-primary)]">{{ store.ownerBackground.creditScore }}</strong></p>
            </div>

            <div v-if="leaseResult" class="rounded-lg p-3 text-sm" :style="{
              background: leaseResult.includes('Success') ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
              color: leaseResult.includes('Success') ? 'var(--game-success)' : 'var(--game-warning)',
              border: `1px solid ${leaseResult.includes('Success') ? 'var(--game-success-dim)' : 'var(--game-warning-dim)'}`,
            }">
              {{ leaseResult }}
            </div>

            <div class="flex gap-3 pt-2">
              <button @click="signLease" class="game-btn game-btn--success flex-1 py-2.5">
                {{ leaseResult ? 'Sign Lease' : 'Sign At Listed Price' }}
              </button>
              <button
                v-if="!leaseResult"
                @click="negotiateLease"
                :disabled="leaseNegotiating"
                class="game-btn game-btn--secondary flex-1 py-2.5"
              >
                {{ leaseNegotiating ? 'Negotiating...' : 'Try to Negotiate' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-4">
      <button @click="store.goToPhase(2)" class="game-btn game-btn--ghost">
        ← Financing
      </button>
      <button
        @click="store.completeCurrentPhase()"
        :disabled="!store.selectedLocation"
        :class="['game-btn py-3 px-6', store.selectedLocation ? 'game-btn--primary' : '']"
      >
        {{ store.selectedLocation ? 'File Permits →' : 'Select a location first' }}
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
.expand-enter-to, .expand-leave-from {
  max-height: 800px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
