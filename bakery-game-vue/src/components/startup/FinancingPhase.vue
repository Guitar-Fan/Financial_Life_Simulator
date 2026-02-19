<!--
  Phase 2: Financing — GAME THEMED
  Dark panels, animated capital overview, game-styled funding cards.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import { FUNDING_SOURCES } from '@/data/startup-data';
import type { FundingSourceId } from '@/types/startup-types';
import AdvisorAvatar from './graphics/AdvisorAvatar.vue';
import SpeechBubble from './graphics/SpeechBubble.vue';
import GamePanel from './ui/GamePanel.vue';
import ResourceCounter from './ui/ResourceCounter.vue';

const store = useBakeryStartupStore();

const selectedFundingId = ref<FundingSourceId | null>(null);
const showApplicationModal = ref(false);
const savingsCommitment = ref(store.personalSavingsCommitted);
const recentResult = ref<{ source: string; approved: boolean; message: string } | null>(null);

const maxSavingsCommit = computed(() => store.ownerBackground.personalSavings);
const selectedSource = computed(() => selectedFundingId.value ? FUNDING_SOURCES.find(s => s.id === selectedFundingId.value) || null : null);

function getFundingStatus(sourceId: string): 'approved' | 'pending' | 'denied' | null {
  const app = store.fundingApplications.find(a => a.sourceId === sourceId);
  if (!app) return null;
  if (app.approved === true) return 'approved';
  if (app.approved === false) return 'denied';
  return 'pending';
}

function getFundingApprovedAmount(sourceId: string): number {
  return store.fundingApplications.find(a => a.sourceId === sourceId)?.approvedAmount || 0;
}

const meetsRequirements = computed(() => {
  if (!selectedSource.value) return { credit: false };
  return { credit: store.ownerBackground.creditScore >= selectedSource.value.requiresCreditScore };
});

function commitSavings() { store.commitPersonalSavings(savingsCommitment.value); }

function openApplication(id: FundingSourceId) {
  selectedFundingId.value = id;
  showApplicationModal.value = true;
}

function submitApplication() {
  if (!selectedFundingId.value) return;
  const result = store.applyForFunding(selectedFundingId.value);
  recentResult.value = {
    source: selectedSource.value?.name || '',
    approved: result === 'approved',
    message: result === 'approved'
      ? `Approved! Your ${selectedSource.value?.name} has been secured.`
      : result === 'pending'
        ? `Application under review. Process next week.`
        : `Denied. Requirements not met.`,
  };
  showApplicationModal.value = false;
}

const advisorMessage = computed(() => {
  const capital = store.totalCapital;
  if (capital < 20000) return "You'll need $40K-$80K minimum. Let's explore your options.";
  if (capital < 50000) return "Some capital secured, but most bakeries need $60K-$120K. Diversify sources.";
  if (capital < 100000) return "Good base. You can secure a decent location. Don't over-leverage.";
  return "Excellent funding! Keep reserves for 3-6 months of operations.";
});
</script>

<template>
  <div class="space-y-5 animate-game-fade-in">
    <!-- Advisor -->
    <div class="flex items-start gap-4">
      <AdvisorAvatar character="banker" :size="64" mood="neutral" />
      <SpeechBubble type="tip" position="left">
        <p><strong style="color: var(--game-gold-bright)">Sandra Chen:</strong> {{ advisorMessage }}</p>
      </SpeechBubble>
    </div>

    <!-- Capital Overview -->
    <GamePanel variant="gold">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-game-title text-sm font-bold uppercase tracking-wider" style="color: var(--game-gold-bright)">💰 Capital Overview</h3>
        <span class="game-badge game-badge--neutral">Week {{ store.weekNumber }}</span>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <ResourceCounter label="Total Capital" :value="store.totalCapital" prefix="$" color="success" size="lg" :show-trend="true" />
        <ResourceCounter label="Total Debt" :value="store.totalDebt" prefix="$" color="danger" size="lg" />
        <ResourceCounter label="Debt Service" :value="store.monthlyDebtService" prefix="$" suffix="/mo" color="gold" size="md" />
      </div>
    </GamePanel>

    <!-- Personal Savings -->
    <GamePanel header="Personal Savings Investment" icon="🏦">
      <p class="text-xs mb-3" style="color: var(--game-text-muted)">
        You have <strong style="color: var(--game-success)">${{ maxSavingsCommit.toLocaleString() }}</strong> available. How much will you risk?
      </p>
      <div class="mb-3">
        <div class="flex justify-between text-xs mb-2">
          <span style="color: var(--game-text-secondary)">Invest: <strong style="color: var(--game-success)">${{ savingsCommitment.toLocaleString() }}</strong></span>
          <span class="font-game-mono" style="color: var(--game-text-dim)">{{ maxSavingsCommit > 0 ? ((savingsCommitment / maxSavingsCommit) * 100).toFixed(0) : 0 }}%</span>
        </div>
        <input type="range" v-model.number="savingsCommitment" :min="0" :max="maxSavingsCommit" :step="1000" class="game-slider" />
        <div class="flex justify-between text-[9px] mt-1" style="color: var(--game-text-dim)">
          <span>$0 (safe)</span>
          <span>${{ (maxSavingsCommit / 2 / 1000).toFixed(0) }}K</span>
          <span>${{ (maxSavingsCommit / 1000).toFixed(0) }}K (all in)</span>
        </div>
      </div>

      <div v-if="savingsCommitment > maxSavingsCommit * 0.8" class="text-[11px] p-2 rounded-lg mb-3" style="background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.2); color: var(--game-danger)">
        ⚠️ Investing over 80% is extremely risky. Little personal safety net remaining.
      </div>

      <button @click="commitSavings" class="game-btn game-btn--success w-full">
        {{ store.personalSavingsCommitted > 0 ? 'Update Commitment' : 'Commit Savings' }}
      </button>
    </GamePanel>

    <!-- Funding Sources -->
    <GamePanel header="Funding Sources" icon="📑">
      <div class="flex items-center justify-between mb-4">
        <p class="text-xs" style="color: var(--game-text-muted)">Apply for loans and investment to grow your capital.</p>
        <button @click="store.advanceWeek()" class="game-btn game-btn--secondary text-[10px] py-1.5 px-3">
          ⏩ Advance Week
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="source in FUNDING_SOURCES"
          :key="source.id"
          class="game-panel p-4"
          :class="{
            'game-panel--success': getFundingStatus(source.id) === 'approved',
            'game-panel--danger': getFundingStatus(source.id) === 'denied',
          }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-semibold text-sm" style="color: var(--game-text-primary)">{{ source.name }}</h4>
                <span
                  class="game-badge"
                  :class="source.approvalChance >= 0.7 ? 'game-badge--success' : source.approvalChance >= 0.4 ? 'game-badge--gold' : 'game-badge--danger'"
                >
                  {{ (source.approvalChance * 100).toFixed(0) }}% chance
                </span>
              </div>
              <p class="text-[11px] mb-2" style="color: var(--game-text-muted)">{{ source.description }}</p>
              <div class="flex flex-wrap gap-3 text-[10px]" style="color: var(--game-text-dim)">
                <span>Amount: <strong style="color: var(--game-text-secondary)">${{ (source.minAmount/1000).toFixed(0) }}K–${{ (source.maxAmount/1000).toFixed(0) }}K</strong></span>
                <span>Rate: <strong style="color: var(--game-text-secondary)">{{ (source.interestRate * 100).toFixed(1) }}%</strong></span>
                <span>Term: <strong style="color: var(--game-text-secondary)">{{ source.termMonths }}mo</strong></span>
                <span>Credit: <strong style="color: var(--game-text-secondary)">{{ source.requiresCreditScore }}+</strong></span>
                <span>Wait: <strong style="color: var(--game-text-secondary)">{{ Math.ceil(source.processingDays / 7) }}wk</strong></span>
              </div>
            </div>
            <div class="flex-shrink-0">
              <template v-if="getFundingStatus(source.id)">
                <span
                  class="game-badge text-[10px]"
                  :class="{
                    'game-badge--success': getFundingStatus(source.id) === 'approved',
                    'game-badge--gold': getFundingStatus(source.id) === 'pending',
                    'game-badge--danger': getFundingStatus(source.id) === 'denied',
                  }"
                >
                  {{ getFundingStatus(source.id)?.toUpperCase() }}
                  <template v-if="getFundingStatus(source.id) === 'approved'"> (${{ (getFundingApprovedAmount(source.id)/1000).toFixed(0) }}K)</template>
                </span>
              </template>
              <button
                v-else
                @click="openApplication(source.id)"
                class="game-btn game-btn--primary text-[10px] py-1.5 px-3"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </GamePanel>

    <!-- Result Banner -->
    <Transition name="fade">
      <div v-if="recentResult" class="game-panel p-4" :class="recentResult.approved ? 'game-panel--success' : 'game-panel--gold'">
        <div class="flex items-center justify-between">
          <p class="text-sm" :style="{ color: recentResult.approved ? 'var(--game-success)' : 'var(--game-warning)' }">{{ recentResult.message }}</p>
          <button @click="recentResult = null" class="text-[10px] underline" style="color: var(--game-text-dim)">Dismiss</button>
        </div>
      </div>
    </Transition>

    <!-- Application Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showApplicationModal && selectedSource" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(4px)" @click.self="showApplicationModal = false">
          <div class="game-panel game-panel--gold max-w-md w-full p-6 space-y-4">
            <h3 class="font-game-title text-lg font-bold" style="color: var(--game-gold-bright)">{{ selectedSource.name }}</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-xs p-2 rounded-lg" :style="{ background: meetsRequirements.credit ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', border: `1px solid ${meetsRequirements.credit ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}` }">
                <span :style="{ color: meetsRequirements.credit ? 'var(--game-success)' : 'var(--game-danger)' }">
                  Credit {{ store.ownerBackground.creditScore }} {{ meetsRequirements.credit ? '✓' : '✗' }} (need {{ selectedSource.requiresCreditScore }})
                </span>
              </div>
              <div class="text-xs space-y-1" style="color: var(--game-text-muted)">
                <p>Amount: <strong style="color: var(--game-text-secondary)">${{ (selectedSource.minAmount/1000).toFixed(0) }}K–${{ (selectedSource.maxAmount/1000).toFixed(0) }}K</strong></p>
                <p>Rate: <strong style="color: var(--game-text-secondary)">{{ (selectedSource.interestRate * 100).toFixed(1) }}%</strong></p>
                <p>Est. Payment: <strong style="color: var(--game-text-secondary)">${{ Math.ceil((selectedSource.maxAmount * (1 + selectedSource.interestRate)) / selectedSource.termMonths).toLocaleString() }}/mo</strong></p>
              </div>
            </div>
            <div class="flex gap-3">
              <button @click="showApplicationModal = false" class="game-btn game-btn--secondary flex-1">Cancel</button>
              <button @click="submitApplication" :disabled="!meetsRequirements.credit" class="game-btn game-btn--primary flex-1">Submit</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-4">
      <button @click="store.goToPhase(1)" class="game-btn game-btn--ghost">← Business Plan</button>
      <button @click="store.completeCurrentPhase()" :disabled="store.totalCapital < 10000" class="game-btn game-btn--primary">
        {{ store.totalCapital >= 10000 ? 'Scout Locations →' : 'Need $10K+ capital' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
