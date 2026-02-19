<!--
  Phase 8: Marketing & Grand Opening
  Final phase: player plans marketing strategy, grand opening event,
  sets business hours, sales channels, and does final readiness review.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import { MARKETING_OPTIONS, GRAND_OPENING_ACTIVITIES, SPECIAL_OFFERS, CONCEPT_STYLE_INFO } from '@/data/startup-data';
import type { MarketingOptionId, GrandOpeningActivityId, SpecialOfferId } from '@/types/startup-types';
import AdvisorAvatar from './graphics/AdvisorAvatar.vue';
import SpeechBubble from './graphics/SpeechBubble.vue';
import BakeryBuilding from './graphics/BakeryBuilding.vue';

const store = useBakeryStartupStore();

const activeTab = ref<'marketing' | 'opening' | 'hours' | 'review'>('marketing');

const localHours = ref({
  weekdayOpen: store.businessHours?.weekdayOpen || '06:00',
  weekdayClose: store.businessHours?.weekdayClose || '18:00',
  weekendOpen: store.businessHours?.weekendOpen || '07:00',
  weekendClose: store.businessHours?.weekendClose || '16:00',
  closedDays: store.businessHours?.closedDays || ['sunday'] as string[],
});

const localChannels = ref({
  walkIn: store.salesChannels?.walkIn ?? true,
  delivery: store.salesChannels?.delivery ?? false,
  online: store.salesChannels?.online ?? false,
  catering: store.salesChannels?.catering ?? false,
});

function isMarketingSelected(id: MarketingOptionId): boolean {
  return store.selectedMarketing.includes(id);
}

function toggleMarketing(id: MarketingOptionId) {
  store.toggleMarketing(id);
}

function isActivitySelected(id: GrandOpeningActivityId): boolean {
  return store.grandOpening?.activities.includes(id) || false;
}

function toggleActivity(id: GrandOpeningActivityId) {
  const current = store.grandOpening?.activities || [];
  const updated = current.includes(id)
    ? current.filter(a => a !== id)
    : [...current, id];
  store.setGrandOpening({
    activities: updated,
    specialOffers: store.grandOpening?.specialOffers || [],
    budget: store.grandOpening?.budget || 0,
  });
}

function isOfferSelected(id: SpecialOfferId): boolean {
  return store.grandOpening?.specialOffers.includes(id) || false;
}

function toggleOffer(id: SpecialOfferId) {
  const current = store.grandOpening?.specialOffers || [];
  const updated = current.includes(id)
    ? current.filter(o => o !== id)
    : [...current, id];
  store.setGrandOpening({
    activities: store.grandOpening?.activities || [],
    specialOffers: updated,
    budget: store.grandOpening?.budget || 0,
  });
}

function toggleClosedDay(day: string) {
  const idx = localHours.value.closedDays.indexOf(day);
  if (idx >= 0) localHours.value.closedDays.splice(idx, 1);
  else localHours.value.closedDays.push(day);
}

function saveHoursAndChannels() {
  store.setBusinessHours(localHours.value);
  store.setSalesChannels(localChannels.value);
}

const marketingMonthly = computed(() => {
  return store.selectedMarketing.reduce((sum, id) => {
    const opt = MARKETING_OPTIONS.find(o => o.id === id);
    if (!opt) return sum;
    if (opt.duration === 'monthly') return sum + opt.cost;
    if (opt.duration === 'weekly') return sum + opt.cost * 4.33;
    return sum;
  }, 0);
});

const openingBudget = computed(() => {
  const activities = store.grandOpening?.activities || [];
  const offers = store.grandOpening?.specialOffers || [];
  let total = 0;
  activities.forEach(id => {
    const a = GRAND_OPENING_ACTIVITIES.find(x => x.id === id);
    total += a?.cost || 0;
  });
  offers.forEach(id => {
    const o = SPECIAL_OFFERS.find(x => x.id === id);
    total += o ? Math.round(o.discountPercent * 50) : 0;
  });
  return total;
});

const readiness = computed(() => store.startupReadiness);
const canLaunch = computed(() => readiness.value.percentage >= 60);

const advisorMessage = computed(() => {
  if (activeTab.value === 'marketing') return 'Marketing doesn\'t have to break the bank. Start focused — social media and local presence are cheap and effective for new bakeries.';
  if (activeTab.value === 'opening') return 'Your grand opening sets the tone. Even a modest event creates buzz. Free samples are your best salesperson.';
  if (activeTab.value === 'hours') return 'Early morning hours are critical for bakeries — that\'s when fresh bread draws people in. Don\'t burn yourself out though.';
  return readiness.value.percentage >= 80
    ? `${readiness.value.percentage}% ready — you're in excellent shape! Time to open those doors.`
    : `${readiness.value.percentage}% ready — you can still open, but address the gaps for a stronger start.`;
});

function launchBakery() {
  saveHoursAndChannels();
  store.completeCurrentPhase();
}
</script>

<template>
  <div class="space-y-5 animate-game-fade-in">
    <!-- Advisor -->
    <div class="flex items-start gap-4">
      <AdvisorAvatar character="mentor" :size="64" :mood="canLaunch ? 'excited' : 'neutral'" />
      <SpeechBubble :type="canLaunch ? 'congratulation' : 'tip'" position="left">
        <p><strong class="text-[var(--game-gold)]">Chef Auguste:</strong> {{ advisorMessage }}</p>
      </SpeechBubble>
    </div>

    <!-- Tab Toggle -->
    <div class="game-tabs">
      <button
        v-for="tab in [
          { id: 'marketing', label: '📢 Marketing', count: store.selectedMarketing.length },
          { id: 'opening', label: '🎉 Opening', count: (store.grandOpening?.activities.length || 0) },
          { id: 'hours', label: '🕐 Hours' },
          { id: 'review', label: '✅ Review' },
        ]"
        :key="tab.id"
        @click="activeTab = tab.id as any"
        :class="['game-tab', activeTab === tab.id ? 'game-tab--active' : '']"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full" style="background: var(--game-gold-dim); color: var(--game-gold-bright)">{{ tab.count }}</span>
      </button>
    </div>

    <Transition name="fade" mode="out-in">
      <!-- Marketing Tab -->
      <div v-if="activeTab === 'marketing'" class="space-y-4">
        <div class="game-panel p-4 flex items-center justify-between">
          <span class="text-sm text-[var(--game-text-secondary)]">Monthly Marketing Budget:</span>
          <span class="text-lg font-bold text-[var(--game-info)] font-game-mono">${{ marketingMonthly.toLocaleString() }}/mo</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="option in MARKETING_OPTIONS"
            :key="option.id"
            @click="toggleMarketing(option.id)"
            class="game-panel game-panel--interactive p-4"
            :class="{ 'selected': isMarketingSelected(option.id) }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ option.icon }}</span>
                  <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ option.name }}</h4>
                </div>
                <p class="text-xs text-[var(--game-text-muted)] mt-1">{{ option.description }}</p>
                <div class="flex gap-3 mt-2 text-[11px] text-[var(--game-text-dim)]">
                  <span>Cost: <strong class="text-[var(--game-text-secondary)] font-game-mono">${{ option.cost.toLocaleString() }}</strong></span>
                  <span>Billing: <strong class="text-[var(--game-text-secondary)] capitalize">{{ option.duration.replace('_', ' ') }}</strong></span>
                  <span>Reach: <strong class="text-[var(--game-text-secondary)]">{{ option.reachEstimate }}</strong></span>
                </div>
              </div>
              <div class="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                :style="{
                  background: isMarketingSelected(option.id) ? 'var(--game-info)' : 'var(--game-bg-dark)',
                  color: isMarketingSelected(option.id) ? '#1a1610' : 'var(--game-text-dim)',
                  border: `1px solid ${isMarketingSelected(option.id) ? 'var(--game-info)' : 'var(--game-border-dark)'}`,
                }"
              >
                {{ isMarketingSelected(option.id) ? '✓' : '+' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grand Opening Tab -->
      <div v-else-if="activeTab === 'opening'" class="space-y-4">
        <div class="game-panel p-4 flex items-center justify-between">
          <span class="text-sm text-[var(--game-text-secondary)]">Grand Opening Budget:</span>
          <span class="text-lg font-bold text-[#c084fc] font-game-mono">${{ openingBudget.toLocaleString() }}</span>
        </div>

        <h4 class="text-sm font-bold text-[var(--game-gold)] uppercase tracking-wider">🎊 Activities</h4>
        <div class="grid sm:grid-cols-2 gap-3">
          <div
            v-for="activity in GRAND_OPENING_ACTIVITIES"
            :key="activity.id"
            @click="toggleActivity(activity.id)"
            class="game-panel game-panel--interactive p-4"
            :class="{ 'selected': isActivitySelected(activity.id) }"
          >
            <div class="flex items-center gap-2 mb-1">
              <span>{{ activity.icon }}</span>
              <h5 class="font-bold text-sm text-[var(--game-text-primary)]">{{ activity.name }}</h5>
            </div>
            <p class="text-xs text-[var(--game-text-muted)]">{{ activity.description }}</p>
            <p class="text-[11px] mt-1.5 text-[var(--game-text-dim)]">Cost: <strong class="text-[var(--game-text-secondary)] font-game-mono">${{ activity.cost.toLocaleString() }}</strong></p>
          </div>
        </div>

        <h4 class="text-sm font-bold text-[var(--game-gold)] uppercase tracking-wider mt-4">🎁 Special Offers</h4>
        <div class="grid sm:grid-cols-2 gap-3">
          <div
            v-for="offer in SPECIAL_OFFERS"
            :key="offer.id"
            @click="toggleOffer(offer.id)"
            class="game-panel game-panel--interactive p-3"
            :class="{ 'selected': isOfferSelected(offer.id) }"
          >
            <h5 class="font-bold text-xs text-[var(--game-text-primary)]">{{ offer.name }}</h5>
            <p class="text-[10px] text-[var(--game-text-muted)] mt-0.5">{{ offer.description }}</p>
            <p class="text-[10px] mt-1 text-[var(--game-text-dim)]">
              Discount: <strong class="text-[var(--game-gold)]">{{ offer.discountPercent }}%</strong> ·
              Boost: <strong class="text-[var(--game-success)]">+{{ offer.customerAcquisitionBoost }}%</strong>
            </p>
          </div>
        </div>
      </div>

      <!-- Business Hours Tab -->
      <div v-else-if="activeTab === 'hours'" class="space-y-4">
        <div class="game-panel p-6 space-y-5">
          <h3 class="text-base font-game-title font-bold text-[var(--game-gold)] uppercase tracking-wider">🕐 Business Hours</h3>

          <div class="grid sm:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-medium text-[var(--game-text-secondary)]">Weekday Hours</label>
              <div class="flex items-center gap-2">
                <input v-model="localHours.weekdayOpen" type="time" class="game-input flex-1" />
                <span class="text-[var(--game-text-dim)]">to</span>
                <input v-model="localHours.weekdayClose" type="time" class="game-input flex-1" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-[var(--game-text-secondary)]">Weekend Hours</label>
              <div class="flex items-center gap-2">
                <input v-model="localHours.weekendOpen" type="time" class="game-input flex-1" />
                <span class="text-[var(--game-text-dim)]">to</span>
                <input v-model="localHours.weekendClose" type="time" class="game-input flex-1" />
              </div>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-[var(--game-text-secondary)] mb-2 block">Closed Days</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']"
                :key="day"
                @click="toggleClosedDay(day)"
                class="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
                :style="{
                  background: localHours.closedDays.includes(day) ? 'var(--game-danger-dim)' : 'var(--game-bg-dark)',
                  color: localHours.closedDays.includes(day) ? 'var(--game-danger)' : 'var(--game-text-muted)',
                  border: `1px solid ${localHours.closedDays.includes(day) ? 'rgba(248,113,113,0.3)' : 'var(--game-border-dark)'}`,
                }"
              >
                {{ day.substring(0, 3) }}
              </button>
            </div>
          </div>
        </div>

        <div class="game-panel p-6 space-y-4">
          <h3 class="text-base font-game-title font-bold text-[var(--game-gold)] uppercase tracking-wider">🛒 Sales Channels</h3>

          <div class="space-y-3">
            <label v-for="(enabled, channel) in localChannels" :key="channel"
              class="flex items-center justify-between p-3 rounded-md cursor-pointer transition-all"
              style="background: var(--game-bg-dark); border: 1px solid var(--game-border-dark)"
              @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--game-border-medium)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--game-border-dark)'"
            >
              <div>
                <span class="font-medium text-sm capitalize text-[var(--game-text-primary)]">{{ channel === 'walkIn' ? 'Walk-In / Storefront' : channel }}</span>
                <p class="text-[10px] text-[var(--game-text-dim)]">
                  {{ channel === 'walkIn' ? 'Traditional in-store sales' :
                     channel === 'delivery' ? 'Partner with delivery apps ($500/mo)' :
                     channel === 'online' ? 'Online ordering & pickup ($300/mo setup)' :
                     'Special event catering services' }}
                </p>
              </div>
              <input
                type="checkbox"
                :checked="enabled"
                @change="localChannels[channel] = !localChannels[channel]"
                class="game-checkbox"
              />
            </label>
          </div>

          <button @click="saveHoursAndChannels" class="game-btn game-btn--secondary w-full py-2.5">
            Save Hours & Channels
          </button>
        </div>
      </div>

      <!-- Final Review Tab -->
      <div v-else class="space-y-5">
        <!-- Building Preview -->
        <div class="game-panel p-6 flex justify-center" style="background: linear-gradient(180deg, #1a2030 0%, #2a1e14 100%)">
          <BakeryBuilding
            :has-exterior="!!store.renovationChoices.exterior"
            :has-storefront="!!store.renovationChoices.storefront"
            :has-kitchen="!!store.renovationChoices.kitchen"
            :has-sign="true"
            :sign-text="store.businessName || 'Bakery'"
            :light-on="true"
            style-prop="charming"
          />
        </div>

        <!-- Readiness -->
        <div class="game-panel game-panel--gold p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-game-title font-bold text-[var(--game-gold)] uppercase tracking-wider">🚀 Opening Readiness</h3>
            <span class="text-2xl font-bold font-game-mono" :style="{
              color: readiness.percentage >= 80 ? 'var(--game-success)' : readiness.percentage >= 60 ? 'var(--game-gold)' : 'var(--game-danger)',
            }">
              {{ readiness.percentage }}%
            </span>
          </div>

          <div class="game-resource-bar" style="height: 12px">
            <div
              class="game-resource-bar__fill"
              :class="readiness.percentage >= 80 ? 'game-resource-bar__fill--success' : readiness.percentage >= 60 ? 'game-resource-bar__fill--gold' : 'game-resource-bar__fill--danger'"
              :style="{ width: `${readiness.percentage}%` }"
            />
          </div>

          <div class="space-y-2">
            <div
              v-for="check in readiness.checks"
              :key="check.label"
              class="flex items-center gap-3 p-2 rounded-md"
              :style="{
                background: check.met ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                border: `1px solid ${check.met ? 'var(--game-success-dim)' : 'var(--game-danger-dim)'}`,
              }"
            >
              <span class="text-lg">{{ check.met ? '✅' : '❌' }}</span>
              <span class="text-sm" :style="{ color: check.met ? 'var(--game-success)' : 'var(--game-danger)' }">{{ check.label }}</span>
            </div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="game-panel p-6 space-y-4">
          <h3 class="text-base font-game-title font-bold text-[var(--game-gold)] uppercase tracking-wider">📊 Financial Summary</h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 rounded-md text-center" style="background: var(--game-bg-dark)">
              <p class="text-xl font-bold text-[var(--game-success)] font-game-mono">${{ store.totalCapital.toLocaleString() }}</p>
              <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Total Capital</p>
            </div>
            <div class="p-3 rounded-md text-center" style="background: var(--game-bg-dark)">
              <p class="text-xl font-bold text-[var(--game-danger)] font-game-mono">${{ store.totalSpent.toLocaleString() }}</p>
              <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Total Spent</p>
            </div>
            <div class="p-3 rounded-md text-center" style="background: var(--game-bg-dark)">
              <p class="text-xl font-bold font-game-mono" :style="{ color: store.cashRemaining >= 0 ? 'var(--game-info)' : 'var(--game-danger)' }">
                ${{ store.cashRemaining.toLocaleString() }}
              </p>
              <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Cash on Hand</p>
            </div>
            <div class="p-3 rounded-md text-center" style="background: var(--game-bg-dark)">
              <p class="text-xl font-bold text-[var(--game-gold)] font-game-mono">${{ store.monthlyFixedCosts.toLocaleString() }}<span class="text-xs">/mo</span></p>
              <p class="text-[10px] text-[var(--game-text-dim)] uppercase tracking-wider">Monthly Fixed</p>
            </div>
          </div>

          <div v-if="store.financialProjection" class="rounded-md p-4 space-y-2 text-xs" style="background: rgba(96,165,250,0.06); border: 1px solid var(--game-info-dim)">
            <h4 class="font-bold text-[var(--game-info)] uppercase tracking-wider">Projections</h4>
            <div class="grid grid-cols-2 gap-3 text-[var(--game-text-secondary)]">
              <div>Break-Even: <strong class="text-[var(--game-text-primary)] font-game-mono">{{ store.financialProjection.breakEvenMonths }} months</strong></div>
              <div>Debt/Equity: <strong class="text-[var(--game-text-primary)] font-game-mono">{{ (store.financialProjection.debtToEquityRatio * 100).toFixed(0) }}%</strong></div>
              <div>Monthly Burn: <strong class="text-[var(--game-text-primary)] font-game-mono">${{ store.financialProjection.burnRate.toLocaleString() }}</strong></div>
              <div>Runway: <strong class="text-[var(--game-text-primary)] font-game-mono">{{ store.financialProjection.runwayMonths }} months</strong></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-4">
      <button @click="store.goToPhase(7)" class="game-btn game-btn--ghost">← Staffing</button>
      <button
        @click="launchBakery"
        :disabled="!canLaunch"
        class="game-btn py-3.5 px-8 text-sm"
        :class="canLaunch ? 'game-btn--primary' : ''"
        :style="canLaunch ? { boxShadow: '0 0 30px rgba(245, 158, 11, 0.3), 0 0 60px rgba(245, 158, 11, 0.1)', fontSize: '0.875rem' } : {}"
      >
        {{ canLaunch ? '🎉 Open Your Bakery!' : `Need ${60 - readiness.percentage}% more readiness` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
